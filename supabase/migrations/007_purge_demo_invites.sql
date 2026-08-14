-- Purge demo/starter invite rows that must never be used in production.
-- Safe to re-run (idempotent). New installs should create invites only in the SQL editor — see BETA.md.

delete from public.beta_invites
where note = 'Closed beta starter';

comment on table public.beta_invites is
  'RLS enabled, zero client policies by design. Mutate only via redeem_invite() or SQL editor as postgres. Never commit real codes in git.';
