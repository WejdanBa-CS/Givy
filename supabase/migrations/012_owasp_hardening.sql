-- OWASP hardening: pledge abuse limits, https-only buy URLs, contributor attribution.

ALTER TABLE public.funding_contributions
  ADD COLUMN IF NOT EXISTS contributor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_funding_contributions_contributor_recent
  ON public.funding_contributions (contributor_id, created_at DESC)
  WHERE contributor_id IS NOT NULL;

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
  uid uuid := auth.uid();
  recent_user int;
  recent_campaign int;
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

  IF uid IS NOT NULL THEN
    SELECT count(*)::int INTO recent_user
    FROM public.funding_contributions
    WHERE contributor_id = uid
      AND created_at > now() - interval '1 hour';

    IF recent_user >= 30 THEN
      RAISE EXCEPTION 'Too many pledges right now. Try again later.';
    END IF;
  END IF;

  SELECT count(*)::int INTO recent_campaign
  FROM public.funding_contributions
  WHERE campaign_id = camp.id
    AND created_at > now() - interval '1 hour';

  IF recent_campaign >= 80 THEN
    RAISE EXCEPTION 'Too many pledges on this gift right now. Try again later.';
  END IF;

  INSERT INTO public.funding_contributions (
    campaign_id,
    contributor_id,
    giver_name,
    amount_minor,
    status,
    message,
    is_anonymous,
    idempotency_key
  )
  VALUES (
    camp.id,
    uid,
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
    AND public.is_safe_https_url(i.url);

  RETURN buy_url;
END;
$$;

REVOKE ALL ON FUNCTION public.get_item_buy_url(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_item_buy_url(uuid) TO anon, authenticated;
