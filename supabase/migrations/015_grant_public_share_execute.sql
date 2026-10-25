-- Share links (/g/[code]) are opened by signed-out friends (anon).
-- Production lost EXECUTE for anon, so get_public_list returned 401 and
-- every share link showed "no Givy here".

grant execute on function public.get_public_list(text) to anon, authenticated;
grant execute on function public.get_item_buy_url(uuid) to anon, authenticated;
grant execute on function public.pledge_contribution(uuid, integer, text, text, boolean, text) to anon, authenticated;
