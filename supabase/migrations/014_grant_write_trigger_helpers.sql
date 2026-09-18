-- Follow-up to 013: list create still failed with
--   permission denied for function is_safe_support_url
-- Triggers also call URL validators and funding helpers as authenticated.

grant execute on function public.is_safe_http_url(text) to authenticated;
grant execute on function public.is_safe_https_url(text) to authenticated;
grant execute on function public.is_safe_support_url(text) to authenticated;
grant execute on function public.validate_item_urls() to authenticated;
grant execute on function public.validate_list_support_url() to authenticated;

grant execute on function public.freeze_share_code() to authenticated;
grant execute on function public.freeze_item_claimed() to authenticated;
grant execute on function public.set_item_goal_minor() to authenticated;
grant execute on function public.ensure_funding_campaign() to authenticated;
