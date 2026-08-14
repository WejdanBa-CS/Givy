-- beta_invites: RLS with NO policies is intentional.
-- Clients must never SELECT/INSERT/UPDATE invites (codes would leak).
-- Redemption goes only through public.redeem_invite() (SECURITY DEFINER).

comment on table public.beta_invites is
  'RLS enabled, zero client policies by design. Mutate only via redeem_invite() or SQL editor as postgres.';

-- Defense in depth: even if someone adds a policy later by mistake,
-- API roles start with no table privileges.
revoke all on table public.beta_invites from anon, authenticated;
revoke all on table public.beta_invites from public;

-- Keep table usable by owners / migrations / security definer functions
grant all on table public.beta_invites to postgres;
grant all on table public.beta_invites to service_role;
