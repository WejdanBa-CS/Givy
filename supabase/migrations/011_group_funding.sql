-- Group funding: cash-fund mode on items, campaigns, contributions, buy redirect.
-- Public pages stay on get_public_list / get_item_buy_url (security definer).
-- Contributor PII is never included in public payloads.

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS funding_mode text NOT NULL DEFAULT 'direct_purchase',
  ADD COLUMN IF NOT EXISTS goal_minor integer,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';

ALTER TABLE items DROP CONSTRAINT IF EXISTS items_funding_mode_check;
ALTER TABLE items
  ADD CONSTRAINT items_funding_mode_check
  CHECK (funding_mode IN ('direct_purchase', 'cash_fund', 'locker_affiliate'));

ALTER TABLE items DROP CONSTRAINT IF EXISTS items_goal_minor_check;
ALTER TABLE items
  ADD CONSTRAINT items_goal_minor_check
  CHECK (goal_minor IS NULL OR goal_minor >= 0);

CREATE TABLE IF NOT EXISTS public.funding_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL UNIQUE REFERENCES public.items(id) ON DELETE CASCADE,
  list_id uuid NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  target_minor integer NOT NULL CHECK (target_minor > 0),
  funded_minor integer NOT NULL DEFAULT 0 CHECK (funded_minor >= 0),
  reserve_minor integer NOT NULL DEFAULT 0 CHECK (reserve_minor >= 0),
  state text NOT NULL DEFAULT 'open'
    CHECK (state IN ('open', 'funded', 'closed', 'paid_out')),
  deadline_at timestamptz,
  allow_overfund boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.funding_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.funding_campaigns(id) ON DELETE CASCADE,
  guest_token text,
  giver_name text,
  amount_minor integer NOT NULL CHECK (amount_minor > 0 AND amount_minor <= 100000000),
  status text NOT NULL DEFAULT 'pledged'
    CHECK (status IN ('pledged', 'pending', 'settled', 'failed', 'refunded')),
  message text,
  is_anonymous boolean NOT NULL DEFAULT true,
  idempotency_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contribution_id uuid REFERENCES public.funding_contributions(id) ON DELETE SET NULL,
  provider text NOT NULL DEFAULT 'manual',
  provider_ref text,
  amount_minor integer NOT NULL CHECK (amount_minor > 0),
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'pending', 'paid', 'failed', 'refunded')),
  expires_at timestamptz,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_funding_campaigns_list ON public.funding_campaigns(list_id);
CREATE INDEX IF NOT EXISTS idx_funding_contributions_campaign ON public.funding_contributions(campaign_id);

ALTER TABLE public.funding_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS funding_campaigns_owner_select ON public.funding_campaigns;
CREATE POLICY funding_campaigns_owner_select ON public.funding_campaigns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lists l
      WHERE l.id = list_id AND l.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS funding_contributions_owner_select ON public.funding_contributions;
CREATE POLICY funding_contributions_owner_select ON public.funding_contributions
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.funding_campaigns c
      JOIN public.lists l ON l.id = c.list_id
      WHERE c.id = campaign_id AND l.owner_id = auth.uid()
    )
  );

REVOKE ALL ON public.funding_campaigns FROM PUBLIC, anon;
REVOKE ALL ON public.funding_contributions FROM PUBLIC, anon;
REVOKE ALL ON public.payment_intents FROM PUBLIC, anon;
GRANT SELECT ON public.funding_campaigns TO authenticated;
GRANT SELECT ON public.funding_contributions TO authenticated;

CREATE OR REPLACE FUNCTION public.set_item_goal_minor()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.funding_mode IS DISTINCT FROM 'cash_fund' THEN
    RETURN NEW;
  END IF;
  NEW.goal_minor := COALESCE(
    NEW.goal_minor,
    CASE WHEN NEW.price IS NOT NULL THEN round(NEW.price * 100)::integer ELSE NULL END
  );
  IF NEW.goal_minor IS NULL OR NEW.goal_minor <= 0 THEN
    RAISE EXCEPTION 'Group-fund gifts need a price or goal';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_item_goal_minor ON public.items;
CREATE TRIGGER trg_set_item_goal_minor
  BEFORE INSERT OR UPDATE OF funding_mode, goal_minor, price
  ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_item_goal_minor();

CREATE OR REPLACE FUNCTION public.ensure_funding_campaign()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.funding_mode IS DISTINCT FROM 'cash_fund' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.funding_campaigns (item_id, list_id, target_minor, state)
  VALUES (NEW.id, NEW.list_id, NEW.goal_minor, 'open')
  ON CONFLICT (item_id) DO UPDATE
    SET target_minor = EXCLUDED.target_minor,
        updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_funding_campaign ON public.items;
CREATE TRIGGER trg_ensure_funding_campaign
  AFTER INSERT OR UPDATE OF funding_mode, goal_minor, price
  ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_funding_campaign();

CREATE OR REPLACE FUNCTION public.recalc_campaign_funded(p_campaign_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total integer;
  target integer;
BEGIN
  SELECT coalesce(sum(amount_minor), 0) INTO total
  FROM public.funding_contributions
  WHERE campaign_id = p_campaign_id
    AND status IN ('pledged', 'pending', 'settled');

  UPDATE public.funding_campaigns
  SET funded_minor = total,
      state = CASE
        WHEN total >= target_minor THEN 'funded'
        WHEN state = 'funded' AND total < target_minor THEN 'open'
        ELSE state
      END,
      updated_at = now()
  WHERE id = p_campaign_id
  RETURNING target_minor INTO target;
END;
$$;

CREATE OR REPLACE FUNCTION public.pledge_contribution(
  p_item_id uuid,
  p_amount_minor integer,
  p_giver_name text DEFAULT NULL,
  p_message text DEFAULT NULL,
  p_anonymous boolean DEFAULT true,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  itm public.items%rowtype;
  lst public.lists%rowtype;
  camp public.funding_campaigns%rowtype;
  contrib public.funding_contributions%rowtype;
BEGIN
  IF p_amount_minor IS NULL OR p_amount_minor < 100 OR p_amount_minor > 5000000 THEN
    RAISE EXCEPTION 'Pledge must be between $1 and $50,000';
  END IF;

  SELECT * INTO itm FROM public.items WHERE id = p_item_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gift not found';
  END IF;
  IF itm.funding_mode IS DISTINCT FROM 'cash_fund' THEN
    RAISE EXCEPTION 'This gift is not a group fund';
  END IF;

  SELECT * INTO lst FROM public.lists WHERE id = itm.list_id AND published = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'List is not public';
  END IF;

  INSERT INTO public.funding_campaigns (item_id, list_id, target_minor, state)
  VALUES (
    itm.id,
    itm.list_id,
    coalesce(itm.goal_minor, round(coalesce(itm.price, 0) * 100)::integer, 100),
    'open'
  )
  ON CONFLICT (item_id) DO NOTHING;

  SELECT * INTO camp FROM public.funding_campaigns WHERE item_id = itm.id;

  INSERT INTO public.funding_contributions (
    campaign_id,
    giver_name,
    amount_minor,
    status,
    message,
    is_anonymous,
    idempotency_key
  )
  VALUES (
    camp.id,
    CASE WHEN p_anonymous THEN NULL ELSE nullif(left(trim(coalesce(p_giver_name, '')), 80), '') END,
    p_amount_minor,
    'pledged',
    nullif(left(trim(coalesce(p_message, '')), 280), ''),
    coalesce(p_anonymous, true),
    nullif(trim(coalesce(p_idempotency_key, '')), '')
  )
  ON CONFLICT (idempotency_key) DO UPDATE
    SET amount_minor = public.funding_contributions.amount_minor
  RETURNING * INTO contrib;

  PERFORM public.recalc_campaign_funded(camp.id);
  SELECT * INTO camp FROM public.funding_campaigns WHERE id = camp.id;

  RETURN jsonb_build_object(
    'ok', true,
    'funded_minor', camp.funded_minor,
    'target_minor', camp.target_minor,
    'state', camp.state,
    'contributor_count', (
      SELECT count(*) FROM public.funding_contributions
      WHERE campaign_id = camp.id AND status IN ('pledged', 'pending', 'settled')
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.pledge_contribution(uuid, integer, text, text, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pledge_contribution(uuid, integer, text, text, boolean, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_item_buy_url(p_item_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  buy_url text;
BEGIN
  SELECT i.url INTO buy_url
  FROM public.items i
  JOIN public.lists l ON l.id = i.list_id
  WHERE i.id = p_item_id
    AND l.published = true
    AND i.url IS NOT NULL
    AND public.is_safe_http_url(i.url);

  RETURN buy_url;
END;
$$;

REVOKE ALL ON FUNCTION public.get_item_buy_url(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_item_buy_url(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_list(p_share_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lst public.lists%rowtype;
  owner_name text;
BEGIN
  SELECT * INTO lst
  FROM public.lists
  WHERE share_code = p_share_code
    AND published = true;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT display_name INTO owner_name
  FROM public.profiles
  WHERE id = lst.owner_id;

  RETURN jsonb_build_object(
    'id', lst.id,
    'title', lst.title,
    'occasion', lst.occasion,
    'description', lst.description,
    'event_date', lst.event_date,
    'share_code', lst.share_code,
    'owner_name', coalesce(owner_name, 'Someone'),
    'support_url', lst.support_url,
    'support_label', lst.support_label,
    'has_recipient_address',
      lst.recipient_address IS NOT NULL
      AND length(trim(lst.recipient_address)) > 0,
    'items', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', i.id,
          'title', i.title,
          'notes', i.notes,
          'url', i.url,
          'price', i.price,
          'image_url', i.image_url,
          'emoji', i.emoji,
          'is_claimed', i.is_claimed,
          'quantity', i.quantity,
          'quantity_needed', i.quantity_needed,
          'priority', i.priority,
          'funding_mode', i.funding_mode,
          'goal_minor', coalesce(c.target_minor, i.goal_minor),
          'funded_minor', coalesce(c.funded_minor, 0),
          'campaign_state', c.state,
          'contributor_count', (
            SELECT count(*) FROM public.funding_contributions fc
            WHERE fc.campaign_id = c.id
              AND fc.status IN ('pledged', 'pending', 'settled')
          ),
          'claimed_by_me', exists (
            SELECT 1 FROM public.claims cl
            WHERE cl.item_id = i.id AND cl.claimer_id = auth.uid()
          )
        )
        ORDER BY i.created_at
      )
      FROM public.items i
      LEFT JOIN public.funding_campaigns c ON c.item_id = i.id
      WHERE i.list_id = lst.id
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_list(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_list(text) TO anon, authenticated;
