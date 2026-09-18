-- Triggers run as the inserting user (authenticated). Helper functions need
-- EXECUTE or list/item creates fail with "permission denied for function …".
-- Grant to authenticated only (not anon).

-- Beta write gate (006)
grant execute on function public.require_beta_unlocked() to authenticated;
grant execute on function public.enforce_beta_on_lists() to authenticated;
grant execute on function public.enforce_beta_on_items() to authenticated;
grant execute on function public.freeze_share_code() to authenticated;

-- URL validators used on list/item insert (003 / 008)
grant execute on function public.is_safe_http_url(text) to authenticated;
grant execute on function public.is_safe_https_url(text) to authenticated;
grant execute on function public.is_safe_support_url(text) to authenticated;
grant execute on function public.validate_item_urls() to authenticated;
grant execute on function public.validate_list_support_url() to authenticated;

-- Other write-path trigger helpers
grant execute on function public.freeze_item_claimed() to authenticated;
grant execute on function public.set_item_goal_minor() to authenticated;
grant execute on function public.ensure_funding_campaign() to authenticated;
