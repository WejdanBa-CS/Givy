-- Open Givy to the public: unlock beta gate for all accounts.
-- Run once in Supabase → SQL Editor (production).
-- Safe to re-run.
--
-- The freeze trigger only allows changes when givy.allow_beta_unlock = '1'
-- (same session/transaction). Use '1', not 'on'.

do $$
begin
  perform set_config('givy.allow_beta_unlock', '1', true);

  update public.profiles
  set beta_unlocked = true
  where beta_unlocked = false;
end $$;

-- New signups should not need an invite code.
alter table public.profiles
  alter column beta_unlocked set default true;
