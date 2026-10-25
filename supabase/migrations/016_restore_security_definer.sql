-- Production had these flipped to SECURITY INVOKER. Anon can't read lists or
-- items directly, so share links came back empty and claims/invites failed.
-- Each function already pins search_path=public.

alter function public.get_public_list(text) security definer;
alter function public.get_item_buy_url(uuid) security definer;
alter function public.claim_item(uuid, text) security definer;
alter function public.redeem_invite(text) security definer;
alter function public.ensure_funding_campaign() security definer;

-- Signed-in EXECUTE was also missing, so friends couldn't claim and invites failed.
grant execute on function public.claim_item(uuid, text) to authenticated;
grant execute on function public.redeem_invite(text) to authenticated;
grant execute on function public.ensure_funding_campaign() to authenticated;
