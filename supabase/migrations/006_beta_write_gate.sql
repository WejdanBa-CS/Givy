-- Enforce closed-beta at the database (not only Next middleware).
-- Owner writes to lists/items require profiles.beta_unlocked.
-- Claimers can still claim without unlock (claim_item is security definer + GUC).

-- ─── Helper ───────────────────────────────────────────────────────────────────
create or replace function public.require_beta_unlocked()
returns void
language plpgsql
stable
as $$
declare
  uid uuid := auth.uid();
  ok boolean;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;
  select beta_unlocked into ok from public.profiles where id = uid;
  if coalesce(ok, false) is not true then
    raise exception 'Invite required before creating or editing lists';
  end if;
end;
$$;

create or replace function public.enforce_beta_on_lists()
returns trigger
language plpgsql
as $$
begin
  perform public.require_beta_unlocked();
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.enforce_beta_on_items()
returns trigger
language plpgsql
as $$
begin
  -- claim_item flips is_claimed with this GUC; claimers need not be beta-unlocked
  if tg_op = 'UPDATE'
     and current_setting('givy.allow_claim_flag', true) = '1' then
    return new;
  end if;
  perform public.require_beta_unlocked();
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_beta_lists on public.lists;
create trigger trg_enforce_beta_lists
  before insert or update or delete on public.lists
  for each row execute function public.enforce_beta_on_lists();

drop trigger if exists trg_enforce_beta_items on public.items;
create trigger trg_enforce_beta_items
  before insert or update or delete on public.items
  for each row execute function public.enforce_beta_on_items();

-- Existing accounts were using the app with invite flag off — unlock them once
-- so this migration does not lock out current users. New signups stay locked
-- until redeem_invite (default beta_unlocked = false).
select set_config('givy.allow_beta_unlock', '1', true);
update public.profiles set beta_unlocked = true where beta_unlocked = false;

-- ─── Immutable share_code ─────────────────────────────────────────────────────
create or replace function public.freeze_share_code()
returns trigger
language plpgsql
as $$
begin
  if new.share_code is distinct from old.share_code then
    raise exception 'share_code cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_freeze_share_code on public.lists;
create trigger trg_freeze_share_code
  before update on public.lists
  for each row execute function public.freeze_share_code();

-- ─── redeem_invite rate limit ─────────────────────────────────────────────────
create table if not exists public.invite_attempt_log (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists invite_attempt_log_user_created_idx
  on public.invite_attempt_log (user_id, created_at desc);

alter table public.invite_attempt_log enable row level security;
revoke all on table public.invite_attempt_log from anon, authenticated, public;
grant all on table public.invite_attempt_log to postgres, service_role;
grant usage, select on sequence public.invite_attempt_log_id_seq to postgres, service_role;

comment on table public.invite_attempt_log is
  'RLS on, no client policies. Written only by redeem_invite().';

create or replace function public.redeem_invite(invite_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.beta_invites%rowtype;
  uid uuid := auth.uid();
  recent int;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.invite_attempt_log (user_id) values (uid);

  select count(*)::int into recent
  from public.invite_attempt_log
  where user_id = uid
    and created_at > now() - interval '15 minutes';

  if recent > 10 then
    raise exception 'Too many invite attempts. Try again later.';
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

revoke all on function public.redeem_invite(text) from public;
grant execute on function public.redeem_invite(text) to authenticated;
