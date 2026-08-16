-- Claim notifications for list owners (anonymous — never store claimer identity).

create table if not exists public.claim_notifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  list_id uuid not null references public.lists (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  list_title text not null,
  item_title text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists claim_notifications_owner_created_idx
  on public.claim_notifications (owner_id, created_at desc);

alter table public.claim_notifications enable row level security;

drop policy if exists "claim_notifications_select_own" on public.claim_notifications;
create policy "claim_notifications_select_own"
  on public.claim_notifications for select
  using (auth.uid() = owner_id);

drop policy if exists "claim_notifications_update_own" on public.claim_notifications;
create policy "claim_notifications_update_own"
  on public.claim_notifications for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- No direct client inserts — only claim_item (security definer).
revoke all on table public.claim_notifications from anon, authenticated;
grant select, update on table public.claim_notifications to authenticated;

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
  owner_name text;
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

  select display_name into owner_name
  from public.profiles
  where id = lst.owner_id;

  insert into public.claim_notifications (
    owner_id, list_id, item_id, list_title, item_title
  ) values (
    lst.owner_id, lst.id, it.id, lst.title, it.title
  );

  addr := null;
  if p_ship_preference = 'to_recipient' then
    addr := lst.recipient_address;
  end if;

  return jsonb_build_object(
    'ok', true,
    'item_id', p_item_id,
    'list_id', lst.id,
    'ship_preference', p_ship_preference,
    'recipient_address', addr,
    'owner_name', owner_name
  );
end;
$$;

revoke all on function public.claim_item(uuid, text) from public;
grant execute on function public.claim_item(uuid, text) to authenticated;
