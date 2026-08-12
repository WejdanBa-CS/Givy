-- Givy closed beta schema
-- Run in Supabase SQL editor (or via supabase db push)

create extension if not exists "pgcrypto";

-- ─── Profiles ─────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  email text,
  avatar_hue int not null default 180,
  beta_unlocked boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email, avatar_hue)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'Givy user'),
    new.email,
    floor(random() * 360)::int
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Beta invites ─────────────────────────────────────────────────────────────
create table if not exists public.beta_invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  note text,
  max_uses int not null default 1,
  use_count int not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.beta_invites enable row level security;
-- No direct client policies: redeem only via RPC

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

  update public.profiles
  set beta_unlocked = true
  where id = uid;

  return true;
end;
$$;

revoke all on function public.redeem_invite(text) from public;
grant execute on function public.redeem_invite(text) to authenticated;

-- Seed a starter invite (change/delete after sharing)
insert into public.beta_invites (code, note, max_uses)
values ('GIVY-BETA-2026', 'Closed beta starter', 50)
on conflict (code) do nothing;

-- ─── Lists ────────────────────────────────────────────────────────────────────
create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  occasion text not null default 'birthday',
  description text,
  event_date date not null,
  recipient_address text,
  share_code text not null unique,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lists_owner_idx on public.lists (owner_id);
create index if not exists lists_share_code_idx on public.lists (share_code);

alter table public.lists enable row level security;

create policy "lists_owner_all"
  on public.lists for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- No public SELECT on lists: share pages use get_public_list() so
-- recipient_address is never returned to browsers except via claim_item().

-- ─── Items ────────────────────────────────────────────────────────────────────
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  title text not null,
  notes text,
  url text,
  price numeric(12, 2),
  image_url text,
  emoji text,
  is_claimed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists items_list_idx on public.items (list_id);

alter table public.items enable row level security;

create policy "items_owner_all"
  on public.items for all
  using (
    exists (
      select 1 from public.lists l
      where l.id = items.list_id and l.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.lists l
      where l.id = items.list_id and l.owner_id = auth.uid()
    )
  );

create policy "items_public_select_published"
  on public.items for select
  using (
    exists (
      select 1 from public.lists l
      where l.id = items.list_id and l.published = true
    )
  );

-- ─── Claims (claimer identity never readable by list owner) ───────────────────
create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null unique references public.items (id) on delete cascade,
  list_id uuid not null references public.lists (id) on delete cascade,
  claimer_id uuid not null references public.profiles (id) on delete cascade,
  ship_preference text not null check (ship_preference in ('to_giver', 'to_recipient')),
  created_at timestamptz not null default now()
);

create index if not exists claims_claimer_idx on public.claims (claimer_id);
create index if not exists claims_list_idx on public.claims (list_id);

alter table public.claims enable row level security;

-- Claimer can see their own claims only
create policy "claims_select_own"
  on public.claims for select
  using (auth.uid() = claimer_id);

-- No insert/update/delete policies for clients — use RPC only

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
begin
  if uid is null then
    raise exception 'Sign in to claim a gift';
  end if;

  if p_ship_preference not in ('to_giver', 'to_recipient') then
    raise exception 'Invalid ship preference';
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

-- Public list payload without shipping address
create or replace function public.get_public_list(p_share_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  lst public.lists%rowtype;
  owner_name text;
  items_json jsonb;
begin
  select * into lst
  from public.lists
  where share_code = p_share_code and published = true;

  if not found then
    return null;
  end if;

  select display_name into owner_name from public.profiles where id = lst.owner_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', i.id,
      'title', i.title,
      'notes', i.notes,
      'url', i.url,
      'price', i.price,
      'image_url', i.image_url,
      'emoji', i.emoji,
      'is_claimed', i.is_claimed,
      'claimed_by_me', exists (
        select 1 from public.claims c
        where c.item_id = i.id and c.claimer_id = auth.uid()
      )
    ) order by i.created_at
  ), '[]'::jsonb)
  into items_json
  from public.items i
  where i.list_id = lst.id;

  return jsonb_build_object(
    'id', lst.id,
    'title', lst.title,
    'occasion', lst.occasion,
    'description', lst.description,
    'event_date', lst.event_date,
    'share_code', lst.share_code,
    'owner_name', owner_name,
    'items', items_json
    -- intentionally NO recipient_address
  );
end;
$$;

revoke all on function public.get_public_list(text) from public;
grant execute on function public.get_public_list(text) to anon, authenticated;
