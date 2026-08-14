-- Security hardening: beta lock, public items policy, claim limits,
-- is_claimed protection, outbound URL checks on write.

-- ─── 1) Drop world-readable published items SELECT ───────────────────────────
-- Public share pages must use get_public_list() (security definer) only.
drop policy if exists "items_public_select_published" on public.items;

-- ─── 2) Freeze beta_unlocked except via redeem_invite ───────────────────────
create or replace function public.freeze_beta_unlocked()
returns trigger
language plpgsql
as $$
begin
  if new.beta_unlocked is distinct from old.beta_unlocked then
    if current_setting('givy.allow_beta_unlock', true) is distinct from '1' then
      raise exception 'beta_unlocked cannot be changed directly';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_freeze_beta_unlocked on public.profiles;
create trigger trg_freeze_beta_unlocked
  before update on public.profiles
  for each row execute function public.freeze_beta_unlocked();

create or replace function public.redeem_invite(invite_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.beta_invites%rowtype;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into inv
  from public.beta_invites
  where lower(code) = lower(trim(invite_code))
  for update;

  if not found then
    raise exception 'Invalid invite code';
  end if;

  if inv.expires_at is not null and inv.expires_at < now() then
    raise exception 'Invite expired';
  end if;

  if inv.use_count >= inv.max_uses then
    raise exception 'Invite already used';
  end if;

  update public.beta_invites
  set use_count = use_count + 1
  where id = inv.id;

  perform set_config('givy.allow_beta_unlock', '1', true);

  update public.profiles
  set beta_unlocked = true
  where id = uid;

  return true;
end;
$$;

-- Remove any legacy demo starter invite (never use migration seeds in production)
delete from public.beta_invites
where note = 'Closed beta starter';

-- ─── 3) Protect is_claimed; only claim_item may flip it ─────────────────────
create or replace function public.freeze_item_claimed()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.is_claimed is distinct from old.is_claimed then
    if current_setting('givy.allow_claim_flag', true) is distinct from '1' then
      raise exception 'is_claimed can only change via claim_item';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_freeze_item_claimed on public.items;
create trigger trg_freeze_item_claimed
  before update on public.items
  for each row execute function public.freeze_item_claimed();

-- ─── 4) Outbound URL validation on items / lists ────────────────────────────
create or replace function public.is_safe_http_url(raw text)
returns boolean
language plpgsql
immutable
as $$
declare
  u text := trim(raw);
begin
  if u is null or u = '' then
    return true;
  end if;
  if u ~* '^(javascript|data|vbscript|file):' then
    return false;
  end if;
  if u !~* '^https?://' then
    return false;
  end if;
  if u ~ '@' and u ~* '^https?://[^/]*@' then
    return false;
  end if;
  return true;
end;
$$;

create or replace function public.is_safe_support_url(raw text)
returns boolean
language plpgsql
immutable
as $$
declare
  u text := trim(raw);
  host text;
begin
  if u is null or u = '' then
    return true;
  end if;
  if not public.is_safe_http_url(u) then
    return false;
  end if;
  if u !~* '^https://' then
    return false;
  end if;
  host := lower(substring(u from '^https://([^/?#]+)'));
  if host is null then
    return false;
  end if;
  return host in (
    'paypal.com',
    'www.paypal.com',
    'paypal.me',
    'www.paypal.me',
    'www.paypalobjects.com',
    'ko-fi.com',
    'www.ko-fi.com',
    'buymeacoffee.com',
    'www.buymeacoffee.com'
  )
  or host like '%.paypal.com'
  or host like '%.paypal.me'
  or host like '%.ko-fi.com'
  or host like '%.buymeacoffee.com';
end;
$$;

create or replace function public.validate_item_urls()
returns trigger
language plpgsql
as $$
begin
  if new.url is not null and not public.is_safe_http_url(new.url) then
    raise exception 'Invalid gift URL';
  end if;
  if new.image_url is not null and not public.is_safe_http_url(new.image_url) then
    raise exception 'Invalid image URL';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_item_urls on public.items;
create trigger trg_validate_item_urls
  before insert or update on public.items
  for each row execute function public.validate_item_urls();

create or replace function public.validate_list_support_url()
returns trigger
language plpgsql
as $$
begin
  if new.support_url is not null and not public.is_safe_support_url(new.support_url) then
    raise exception 'Invalid support URL (use PayPal.me, PayPal, Ko-fi, or Buy Me a Coffee)';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_list_support_url on public.lists;
create trigger trg_validate_list_support_url
  before insert or update on public.lists
  for each row execute function public.validate_list_support_url();

-- ─── 5) Claim rate limit + set claim flag GUC ───────────────────────────────
create or replace function public.claim_item(
  p_item_id uuid,
  p_ship_preference text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  it public.items%rowtype;
  lst public.lists%rowtype;
  uid uuid := auth.uid();
  addr text;
  recent_claims int;
begin
  if uid is null then
    raise exception 'Sign in to claim a gift';
  end if;

  if p_ship_preference not in ('to_giver', 'to_recipient') then
    raise exception 'Invalid ship preference';
  end if;

  select count(*)::int into recent_claims
  from public.claims
  where claimer_id = uid
    and created_at > now() - interval '1 hour';

  if recent_claims >= 20 then
    raise exception 'Too many claims right now. Try again later.';
  end if;

  select * into it from public.items where id = p_item_id for update;
  if not found then
    raise exception 'Gift not found';
  end if;

  select * into lst from public.lists where id = it.list_id;
  if not lst.published then
    raise exception 'List is not shared yet';
  end if;

  if lst.owner_id = uid then
    raise exception 'You cannot claim from your own list';
  end if;

  if it.is_claimed then
    raise exception 'Already claimed';
  end if;

  insert into public.claims (item_id, list_id, claimer_id, ship_preference)
  values (p_item_id, it.list_id, uid, p_ship_preference);

  perform set_config('givy.allow_claim_flag', '1', true);
  update public.items set is_claimed = true where id = p_item_id;

  addr := null;
  if p_ship_preference = 'to_recipient' then
    addr := lst.recipient_address;
  end if;

  return jsonb_build_object(
    'ok', true,
    'item_id', p_item_id,
    'ship_preference', p_ship_preference,
    'recipient_address', addr,
    'owner_name', (select display_name from public.profiles where id = lst.owner_id)
  );
end;
$$;

revoke all on function public.claim_item(uuid, text) from public;
grant execute on function public.claim_item(uuid, text) to authenticated;
