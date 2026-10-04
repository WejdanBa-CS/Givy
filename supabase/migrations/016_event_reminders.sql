-- Givy v2.0 Phase 3: push tokens + event reminder delivery log + in-app notices
-- Local migration only — do not apply to production until ready.

-- Optional IANA timezone for accurate "today" / "in 7 days" checks
alter table public.profiles
  add column if not exists timezone text not null default 'UTC';

alter table public.profiles
  drop constraint if exists profiles_timezone_len;
alter table public.profiles
  add constraint profiles_timezone_len
  check (char_length(timezone) between 1 and 64);

-- Allow clients to update timezone (freeze_profile_columns must pass it through)
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

  if new.timezone is null or length(trim(new.timezone)) < 1 then
    new.timezone := coalesce(old.timezone, 'UTC');
  else
    new.timezone := left(trim(new.timezone), 64);
  end if;

  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'event_reminder_kind') then
    create type public.event_reminder_kind as enum ('week_before', 'day_of');
  end if;
end $$;

-- Device push tokens (FCM / APNs via FCM)
create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null,
  platform text not null default 'android'
    check (platform in ('android', 'ios', 'web')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_tokens_token_len check (char_length(token) between 10 and 512)
);

create unique index if not exists push_tokens_token_uidx on public.push_tokens (token);
create index if not exists push_tokens_user_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

drop policy if exists "push_tokens_own_all" on public.push_tokens;
create policy "push_tokens_own_all"
  on public.push_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.touch_push_token_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_push_tokens_updated_at on public.push_tokens;
create trigger trg_push_tokens_updated_at
  before update on public.push_tokens
  for each row execute function public.touch_push_token_updated_at();

-- Dedup log so cron never double-sends the same reminder
create table if not exists public.event_reminder_log (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.calendar_events (id) on delete cascade,
  kind public.event_reminder_kind not null,
  target_date date not null,
  created_at timestamptz not null default now(),
  unique (recipient_id, event_id, kind, target_date)
);

create index if not exists event_reminder_log_recipient_idx
  on public.event_reminder_log (recipient_id, created_at desc);

alter table public.event_reminder_log enable row level security;
-- No client access — service role / cron only
revoke all on table public.event_reminder_log from anon, authenticated;

-- In-app event reminders (shown in Activity later)
create table if not exists public.event_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid references public.calendar_events (id) on delete set null,
  kind public.event_reminder_kind not null,
  title text not null,
  body text not null,
  event_date date,
  list_id uuid references public.lists (id) on delete set null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint event_notifications_title_len check (char_length(title) <= 160),
  constraint event_notifications_body_len check (char_length(body) <= 500)
);

create index if not exists event_notifications_user_created_idx
  on public.event_notifications (user_id, created_at desc);

alter table public.event_notifications enable row level security;

drop policy if exists "event_notifications_select_own" on public.event_notifications;
create policy "event_notifications_select_own"
  on public.event_notifications for select
  using (auth.uid() = user_id);

drop policy if exists "event_notifications_update_own" on public.event_notifications;
create policy "event_notifications_update_own"
  on public.event_notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on table public.event_notifications from anon, authenticated;
grant select, update on table public.event_notifications to authenticated;
