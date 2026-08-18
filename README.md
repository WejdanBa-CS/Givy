# Givy

**Gift lists without awkward duplicates.** Create a wishlist, share one link, and let friends claim gifts anonymously.

**Live demo:** [givy.onrender.com](https://www.givy.gifts)  
**Latest release:** [v1.3.0](https://github.com/WejdanBa-CS/Givy/releases/tag/v1.3.0)

![Givy hero](public/givy-hero.jpg)

## Features

- Create & manage gift lists (occasion, date, items, links, prices)
- Share a unique `/g/[code]` link — shipping address hidden until claim
- Anonymous “mark purchased” with optional unwrap celebration
- **Support me** — PayPal.me / allowlisted tip links (cards never touch Givy)
- **Suggest gifts** — AI ideas (OpenAI) with curated offline fallback
- Google sign-in via Supabase (optional closed-beta invite gate)
- Security helpers, Vitest unit tests, Playwright smoke suite
- Responsive landing + app shell (mobile → desktop)

## Design

Warm Editorial — cream `#FEF6EE`, coral `#E8391E`, leaf green, gold · Fraunces + DM Sans · custom gift-box mark.

## Stack

| Layer | Tech |
|-------|------|
| Web | Next.js 15 (App Router), React 19, Tailwind CSS 4 |
| Motion / UI | Framer Motion, Radix Dialog, CVA, Lucide |
| Cloud (optional) | Supabase Auth, Postgres, RLS |
| Local demo | Browser storage + demo sign-in (no backend) |
| Deploy | [Render](render.yaml) (Vercel-compatible Next.js) |

**Priority:** Next.js website first. Flutter Play app in `mobile/` wraps the live site for Google Play.

## Quick start

```bash
git clone https://github.com/WejdanBa-CS/Givy.git
cd Givy
npm install
cp .env.example .env.local   # optional — blank = local demo mode
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → sign in → create a list → finalize & share.

## Environment

Copy `.env.example` → `.env.local`. Minimum for **cloud mode**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Optional: `OPENAI_API_KEY` (gift suggestions), `NEXT_PUBLIC_BETA_REQUIRE_INVITE=true` (closed beta).

**Never commit** `.env.local` or secrets. Supabase **service role** keys must stay server-side only (not used in this app).

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations **in order** in the SQL editor:
   - `supabase/migrations/001_closed_beta.sql`
   - `supabase/migrations/002_support_me.sql`
   - `supabase/migrations/003_security_hardening.sql`
   - `supabase/migrations/004_beta_invites_intentional_rls.sql`
   - `supabase/migrations/006_beta_write_gate.sql`
   - `supabase/migrations/007_purge_demo_invites.sql`
   - `005_enable_index_advisor.sql` (optional)
3. Enable Google (and optional Facebook) under Authentication → Providers
4. Set Site URL + redirect URLs to your domain and `/auth/callback`
5. Create invite codes in SQL (see `BETA.md`) — do **not** reuse demo seeds from migrations in production

Full checklist: [`BETA.md`](BETA.md)

## Deploy (Render)

1. Connect this repo → **Blueprint** or Web Service
2. Set env vars from `.env.example` (Supabase URL + anon key required at **build** time)
3. Deploy from `master`

Or use `render.yaml` as a starting blueprint.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm test` | Vitest (security + gift-suggest helpers) |
| `npm run test:e2e:security` | Playwright security smoke |

## Project layout

```
src/app/          Next.js routes (landing, /app, /g/[code], API)
src/components/   UI, motion, panels
src/lib/          API, security, store, Supabase client
supabase/         SQL migrations
e2e/              Playwright tests
mobile/           Flutter Google Play shell (loads givy.onrender.com)
```

## License & copyright

Copyright © 2026 Wejdan Al Amri. All rights reserved.

Source is published for transparency and portfolio use. See [`LICENSE`](LICENSE) — you may not copy, redistribute, or run a competing commercial service from this code without permission.

## Security

Report issues responsibly — see [`SECURITY.md`](SECURITY.md).

## Contact

Questions: [hello@givy.app](mailto:hello@givy.app)
