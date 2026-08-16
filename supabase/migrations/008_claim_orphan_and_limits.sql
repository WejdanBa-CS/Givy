-- Claim orphan cleanup, profile field freeze, length/https limits,
-- and has_recipient_address on public share payload.

-- ─── 1) Clear is_claimed when the last claim row is deleted ─────────────────
create or replace function public.clear_item_claimed_on_claim_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.claims where item_id = old.item_id) then
    perform set_config('givy.allow_claim_flag', '1', true);
    update public.items
    set is_claimed = false
    where id = old.item_id
      and is_claimed = true;
  end if;
  return old;
end;
$$;

drop trigger if exists trg_clear_item_claimed_on_claim_delete on public.claims;
create trigger trg_clear_item_claimed_on_claim_delete
  after delete on public.claims
  for each row execute function public.clear_item_claimed_on_claim_delete();

-- ─── 2) Profiles: only display_name + avatar_hue may change via client ──────
create or replace function public.freeze_profile_columns()
returns trigger
language plpgsql
as $$
begin
  new.id := old.id;
  new.email := old.email;
  new.created_at := old.created_at;
  -- beta_unlocked still gated by freeze_beta_unlocked + GUC
  if new.display_name is null or length(trim(new.display_name)) < 1 then
    raise exception 'display_name is required';
  end if;
  new.display_name := left(trim(new.display_name), 80);
  if new.avatar_hue is null then
    new.avatar_hue := old.avatar_hue;
  end if;
  new.avatar_hue := greatest(0, least(359, new.avatar_hue));
  return new;
end;
$$;

drop trigger if exists trg_freeze_profile_columns on public.profiles;
create trigger trg_freeze_profile_columns
  before update on public.profiles
  for each row execute function public.freeze_profile_columns();

-- ─── 3) Length limits ───────────────────────────────────────────────────────
alter table public.profiles
  drop constraint if exists profiles_display_name_len;
alter table public.profiles
  add constraint profiles_display_name_len
  check (char_length(display_name) <= 80);

alter table public.lists
  drop constraint if exists lists_title_len;
alter table public.lists
  add constraint lists_title_len
  check (char_length(title) <= 120);

alter table public.lists
  drop constraint if exists lists_description_len;
alter table public.lists
  add constraint lists_description_len
  check (description is null or char_length(description) <= 2000);

alter table public.lists
  drop constraint if exists lists_recipient_address_len;
alter table public.lists
  add constraint lists_recipient_address_len
  check (recipient_address is null or char_length(recipient_address) <= 500);

alter table public.items
  drop constraint if exists items_title_len;
alter table public.items
  add constraint items_title_len
  check (char_length(title) <= 120);

alter table public.items
  drop constraint if exists items_notes_len;
alter table public.items
  add constraint items_notes_len
  check (notes is null or char_length(notes) <= 2000);

alter table public.items
  drop constraint if exists items_url_len;
alter table public.items
  add constraint items_url_len
  check (url is null or char_length(url) <= 2048);

alter table public.items
  drop constraint if exists items_image_url_len;
alter table public.items
  add constraint items_image_url_len
  check (image_url is null or char_length(image_url) <= 2048);

-- ─── 4) Gift / image URLs: https only ───────────────────────────────────────
create or replace function public.is_safe_https_url(raw text)
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
  if not public.is_safe_http_url(u) then
    return false;
  end if;
  return u ~* '^https://';
end;
$$;

create or replace function public.validate_item_urls()
returns trigger
language plpgsql
as $$
begin
  if new.url is not null and not public.is_safe_https_url(new.url) then
    raise exception 'Gift URL must be https';
  end if;
  if new.image_url is not null and not public.is_safe_https_url(new.image_url) then
    raise exception 'Image URL must be https';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_item_urls on public.items;
create trigger trg_validate_item_urls
  before insert or update on public.items
  for each row execute function public.validate_item_urls();

-- ─── 5) Public list: expose address presence, never the address ─────────────
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
    'support_url', lst.support_url,
    'support_label', lst.support_label,
    'has_recipient_address', (
      lst.recipient_address is not null
      and length(trim(lst.recipient_address)) > 0
    ),
    'items', items_json
  );
end;
$$;

revoke all on function public.get_public_list(text) from public;
grant execute on function public.get_public_list(text) to anon, authenticated;
