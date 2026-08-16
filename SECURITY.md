# Security

We take security seriously for Givy, especially around auth, share links, and shipping addresses.

## Reporting a vulnerability

**Please do not** open public GitHub issues for security bugs.

Email **hello@givy.app** with:

- Description of the issue
- Steps to reproduce
- Impact (what an attacker could access or do)
- Your GitHub username (optional, for credit)

We aim to respond within a few business days.

## Scope

In scope:

- Authentication, session, and invite-gate bypass
- RLS / data leaks (lists, items, addresses, claims)
- Open redirects, XSS, unsafe URL handling
- API abuse (`/api/gift-suggestions`, Supabase RPCs)

Out of scope:

- Social engineering, physical attacks
- Denial of service without a practical exploit path
- Issues in third-party services (Supabase, Render, PayPal)

## Safe harbor

Good-faith research that avoids privacy violations and service disruption is appreciated.

## Secrets & production checklist

**Never commit** to this repo:

- `.env.local`, `.env`, or any file with real API keys
- Supabase **service role** key (not used by this app — keep it out entirely)
- Google OAuth **client secret** (Supabase Auth dashboard only)
- `OPENAI_API_KEY` (Render env var only)
- Real beta invite codes (create in Supabase SQL editor only)

**After cloning or going public:**

1. Run migration `007_purge_demo_invites.sql` in Supabase if the project existed before Aug 2026
2. Run migration `008_claim_orphan_and_limits.sql` (orphaned claims, https gift URLs, length limits, public `has_recipient_address`)
3. Create new private invite codes in SQL — see [`BETA.md`](BETA.md)
4. Set production env vars in Render (not in git): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_BETA_REQUIRE_INVITE=true`
5. Do **not** set `NEXT_PUBLIC_ALLOW_GUEST=true` on production closed beta (guest cookie must not bypass invite)
6. Rotate any key that was ever pasted into chat, screenshots, or an old commit

**Rate limits (process-local unless noted):** gift suggestions ≈ 8/min/user; claims 20/hour/user (Postgres); invite redeem 10 / 15 min / user (Postgres).

CI runs a basic secret pattern scan on every push.
