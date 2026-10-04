-- Givy v2: enforce wishlist_visibility for friends without exposing recipient_address.
-- Local only — apply after 015 + 016 when ready.

-- Safe friend wishlist peek (no recipient_address, no unpublished drafts)
create or replace function public.get_friend_lists(p_owner_id uuid)
returns table (
  id uuid,
  title text,
  occasion text,
  description text,
  event_date date,
  share_code text,
  published boolean,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  vis public.privacy_visibility;
  ok boolean := false;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_owner_id is null then
    return;
  end if;

  -- Own lists: use normal client queries; this RPC is for peers only.
  if p_owner_id = uid then
    raise exception 'Use owner list queries for your own wishlists';
  end if;

  select wishlist_visibility into vis
  from public.profiles
  where id = p_owner_id;

  if not found then
    return;
  end if;

  if vis = 'private' then
    return;
  end if;

  if vis = 'public' then
    ok := true;
  elsif vis = 'friends' then
    ok := public.are_friends(uid, p_owner_id);
  end if;

  if not ok then
    return;
  end if;

  return query
  select
    l.id,
    l.title,
    l.occasion,
    l.description,
    l.event_date,
    l.share_code,
    l.published,
    l.updated_at
  from public.lists l
  where l.owner_id = p_owner_id
    and l.published = true
  order by l.event_date asc, l.updated_at desc;
end;
$$;

revoke all on function public.get_friend_lists(uuid) from public;
grant execute on function public.get_friend_lists(uuid) to authenticated;
