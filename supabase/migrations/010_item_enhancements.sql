-- Add quantity and priority fields to items table
ALTER TABLE items
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS quantity_needed INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('high', 'medium', 'low'));

-- Add tags field to lists table
ALTER TABLE lists
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_priority ON items(priority);
CREATE INDEX IF NOT EXISTS idx_lists_tags ON lists USING GIN(tags);

COMMENT ON COLUMN items.quantity IS 'Quantity of this item requested (default 1)';
COMMENT ON COLUMN items.quantity_needed IS 'Total quantity needed for this item';
COMMENT ON COLUMN items.priority IS 'Priority level: high, medium, or low';
COMMENT ON COLUMN lists.tags IS 'Array of tags for organizing and filtering lists';

-- Expose new item fields on the public share payload
create or replace function public.get_public_list(p_share_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  lst public.lists%rowtype;
  owner_name text;
begin
  select * into lst
  from public.lists
  where share_code = p_share_code
    and published = true;

  if not found then
    return null;
  end if;

  select display_name into owner_name
  from public.profiles
  where id = lst.owner_id;

  return jsonb_build_object(
    'id', lst.id,
    'title', lst.title,
    'occasion', lst.occasion,
    'description', lst.description,
    'event_date', lst.event_date,
    'share_code', lst.share_code,
    'owner_name', coalesce(owner_name, 'Someone'),
    'support_url', lst.support_url,
    'support_label', lst.support_label,
    'has_recipient_address',
      lst.recipient_address is not null
      and length(trim(lst.recipient_address)) > 0,
    'items', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', i.id,
          'title', i.title,
          'notes', i.notes,
          'url', i.url,
          'price', i.price,
          'image_url', i.image_url,
          'emoji', i.emoji,
          'is_claimed', i.is_claimed,
          'quantity', i.quantity,
          'quantity_needed', i.quantity_needed,
          'priority', i.priority,
          'claimed_by_me', exists (
            select 1 from public.claims c
            where c.item_id = i.id and c.claimer_id = auth.uid()
          )
        )
        order by i.created_at
      )
      from public.items i
      where i.list_id = lst.id
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_public_list(text) from public;
grant execute on function public.get_public_list(text) to anon, authenticated;
