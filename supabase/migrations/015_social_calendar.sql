-- Givy v2.0 Phase 1: friends, calendar events, profile privacy
-- Local migration only — do not apply to production until the project is ready.

-- ─── Privacy enums ───────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'privacy_visibility') then
    create type public.privacy_visibility as enum ('private', 'friends', 'public');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'friendship_status') then
    create type public.friendship_status as enum ('pending', 'accepted');
  end if;
end $$;

-- ─── Profiles: username + privacy ────────────────────────────────────────────
alter table public.profiles
  add column if not exists username text;

alter table public.profiles
  add column if not exists calendar_visibility public.privacy_visibility
    not null default 'friends';

alter table public.profiles
  add column if not exists wishlist_visibility public.privacy_visibility
    not null default 'friends';

-- Unique username when set (case-insensitive)
create unique index if not exists profiles_username_lower_uidx
  on public.profiles (lower(username))
  where username is not null;

alter table public.profiles
  drop constraint if exists profiles_username_format;
alter table public.profiles
  add constraint profiles_username_format
  check (
    username is null
    or (
      char_length(username) between 3 and 32
      and username ~ '^[a-zA-Z0-9_]+$'
    )
  );

-- Allow client updates for username + privacy (still freeze id/email/created_at)
create or replace function public.freeze_profile_columns()
returns trigger
language plpgsql
as $$
begin
  new.id := old.id;
  new.email := old.email;
  new.created_at := old.created_at;

  if new.display_name is null or length(trim(new.display_name)) < 1 then
    raise exception 'display_name is required';
  end if;
  new.display_name := left(trim(new.display_name), 80);

  if new.avatar_hue is null then
    new.avatar_hue := old.avatar_hue;
  end if;
  new.avatar_hue := greatest(0, least(359, new.avatar_hue));

  if new.username is not null then
    new.username := lower(trim(new.username));
    if new.username = '' then
      new.username := null;
    end if;
  end if;

  if new.calendar_visibility is null then
    new.calendar_visibility := old.calendar_visibility;
  end if;
  if new.wishlist_visibility is null then
    new.wishlist_visibility := old.wishlist_visibility;
  end if;

  return new;
end;
$$;

-- ─── Friendships ─────────────────────────────────────────────────────────────
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status public.friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_not_self check (requester_id <> addressee_id)
);

-- One directed edge requester→addressee
create unique index if not exists friendships_pair_uidx
  on public.friendships (requester_id, addressee_id);

-- Prevent A→B and B→A both pending/accepted as separate rows via ordered pair
create unique index if not exists friendships_unordered_pair_uidx
  on public.friendships (
    least(requester_id, addressee_id),
    greatest(requester_id, addressee_id)
  );

create index if not exists friendships_requester_idx
  on public.friendships (requester_id, status);
create index if not exists friendships_addressee_idx
  on public.friendships (addressee_id, status);

alter table public.friendships enable row level security;

drop policy if exists "friendships_select_participants" on public.friendships;
create policy "friendships_select_participants"
  on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "friendships_insert_requester" on public.friendships;
create policy "friendships_insert_requester"
  on public.friendships for insert
  with check (
    auth.uid() = requester_id
    and status = 'pending'
  );

-- Only the addressee may accept; requester cannot self-accept.
drop policy if exists "friendships_update_addressee" on public.friendships;
create policy "friendships_update_addressee"
  on public.friendships for update
  using (auth.uid() = addressee_id)
  with check (
    auth.uid() = addressee_id
    and status = 'accepted'
  );

create or replace function public.guard_friendship_update()
returns trigger
language plpgsql
as $$
begin
  if new.requester_id is distinct from old.requester_id
     or new.addressee_id is distinct from old.addressee_id then
    raise exception 'Cannot change friendship participants';
  end if;
  if old.status = 'accepted' and new.status is distinct from 'accepted' then
    raise exception 'Cannot reopen an accepted friendship; delete instead';
  end if;
  if old.status = 'pending' and new.status is distinct from 'accepted' then
    raise exception 'Pending requests may only be accepted or deleted';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_friendship_update on public.friendships;
create trigger trg_guard_friendship_update
  before update on public.friendships
  for each row execute function public.guard_friendship_update();

drop policy if exists "friendships_delete_participants" on public.friendships;
create policy "friendships_delete_participants"
  on public.friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create or replace function public.touch_friendship_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_friendships_updated_at on public.friendships;
create trigger trg_friendships_updated_at
  before update on public.friendships
  for each row execute function public.touch_friendship_updated_at();

-- Participants in a friendship (pending or accepted) can see each other's profile
drop policy if exists "profiles_select_friends" on public.profiles;
create policy "profiles_select_friends"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.friendships f
      where (
          (f.requester_id = auth.uid() and f.addressee_id = profiles.id)
          or (f.addressee_id = auth.uid() and f.requester_id = profiles.id)
        )
    )
  );

-- ─── Calendar events ─────────────────────────────────────────────────────────
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  event_date date not null,
  list_id uuid references public.lists (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_events_name_len check (char_length(name) between 1 and 120)
);

create index if not exists calendar_events_user_date_idx
  on public.calendar_events (user_id, event_date);
create index if not exists calendar_events_list_idx
  on public.calendar_events (list_id)
  where list_id is not null;

alter table public.calendar_events enable row level security;

-- Owner full access
drop policy if exists "calendar_events_owner_all" on public.calendar_events;
create policy "calendar_events_owner_all"
  on public.calendar_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Friends can read events when owner's calendar_visibility allows friends/public
drop policy if exists "calendar_events_friends_select" on public.calendar_events;
create policy "calendar_events_friends_select"
  on public.calendar_events for select
  using (
    auth.uid() <> user_id
    and exists (
      select 1 from public.profiles p
      where p.id = calendar_events.user_id
        and p.calendar_visibility in ('friends', 'public')
    )
    and (
      exists (
        select 1 from public.profiles p
        where p.id = calendar_events.user_id
          and p.calendar_visibility = 'public'
      )
      or exists (
        select 1
        from public.friendships f
        where f.status = 'accepted'
          and (
            (f.requester_id = auth.uid() and f.addressee_id = calendar_events.user_id)
            or (f.addressee_id = auth.uid() and f.requester_id = calendar_events.user_id)
          )
      )
    )
  );

create or replace function public.touch_calendar_event_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_calendar_events_updated_at on public.calendar_events;
create trigger trg_calendar_events_updated_at
  before update on public.calendar_events
  for each row execute function public.touch_calendar_event_updated_at();

-- Ensure list_id belongs to the same user when set
create or replace function public.validate_calendar_event_list()
returns trigger
language plpgsql
as $$
declare
  list_owner uuid;
begin
  if new.list_id is null then
    return new;
  end if;
  select owner_id into list_owner from public.lists where id = new.list_id;
  if list_owner is null then
    raise exception 'Wishlist not found';
  end if;
  if list_owner <> new.user_id then
    raise exception 'Wishlist must belong to the event owner';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_calendar_events_list on public.calendar_events;
create trigger trg_calendar_events_list
  before insert or update on public.calendar_events
  for each row execute function public.validate_calendar_event_list();

-- ─── Search helpers (username / email / display name) ────────────────────────
create or replace function public.search_people(query text, result_limit int default 20)
returns table (
  id uuid,
  display_name text,
  username text,
  avatar_hue int,
  friendship_status public.friendship_status,
  friendship_id uuid,
  is_outgoing boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  q text := lower(trim(coalesce(query, '')));
  lim int := greatest(1, least(coalesce(result_limit, 20), 50));
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;
  if char_length(q) < 2 then
    return;
  end if;

  return query
  select
    p.id,
    p.display_name,
    p.username,
    p.avatar_hue,
    f.status,
    f.id,
    (f.requester_id = uid) as is_outgoing
  from public.profiles p
  left join public.friendships f
    on f.status in ('pending', 'accepted')
   and (
     (f.requester_id = uid and f.addressee_id = p.id)
     or (f.addressee_id = uid and f.requester_id = p.id)
   )
  where p.id <> uid
    and (
      lower(p.display_name) like '%' || q || '%'
      or (p.username is not null and lower(p.username) like '%' || q || '%')
      or (p.email is not null and lower(p.email) like q || '%')
    )
  order by
    case when p.username = q then 0
         when p.username like q || '%' then 1
         else 2 end,
    p.display_name
  limit lim;
end;
$$;

revoke all on function public.search_people(text, int) from public;
grant execute on function public.search_people(text, int) to authenticated;

-- Are two users accepted friends?
create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.friendships f
    where f.status = 'accepted'
      and (
        (f.requester_id = a and f.addressee_id = b)
        or (f.requester_id = b and f.addressee_id = a)
      )
  );
$$;

revoke all on function public.are_friends(uuid, uuid) from public;
grant execute on function public.are_friends(uuid, uuid) to authenticated;
