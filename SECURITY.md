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
