-- Open Givy to the public: unlock beta gate for all accounts.
-- Run once in Supabase → SQL Editor (production).
-- Safe to re-run.

-- Allow the freeze trigger to accept this one-time unlock.
select set_config('givy.allow_beta_unlock', 'on', true);

update public.profiles
set beta_unlocked = true
where beta_unlocked = false;

-- New signups should not need an invite code.
alter table public.profiles
  alter column beta_unlocked set default true;

select set_config('givy.allow_beta_unlock', 'off', true);
