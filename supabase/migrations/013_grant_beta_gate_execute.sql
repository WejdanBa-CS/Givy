-- Triggers call require_beta_unlocked() as the inserting user (authenticated).
-- Without EXECUTE, list/item creates fail with:
--   permission denied for function require_beta_unlocked
-- Grant execute to authenticated only (not anon).

grant execute on function public.require_beta_unlocked() to authenticated;
grant execute on function public.enforce_beta_on_lists() to authenticated;
grant execute on function public.enforce_beta_on_items() to authenticated;
