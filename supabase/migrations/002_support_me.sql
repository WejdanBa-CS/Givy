-- Creator "Support me" tip link on public lists

alter table public.lists
  add column if not exists support_url text,
  add column if not exists support_label text;

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
    'items', items_json
  );
end;
$$;
