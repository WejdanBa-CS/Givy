# Givito

Gift registry web app: create a list, share one link, friends mark gifts purchased anonymously.

## Design
Warm Editorial: cream `#FEF6EE`, coral `#E8391E`, leaf green, gold accents · Fraunces + DM Sans · gift-box logo.

## Stack
- **Next.js 15** (App Router) + Tailwind CSS 4
- **Local demo** (default): browser storage + demo social sign-in
- **Cloud** (optional): Supabase Auth + Postgres + RLS (see `BETA.md`)

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000 → Sign in → create a list → Finalize & share → open `/g/[code]`.

## MVP features
1. Social sign-in UI (Google / Apple / Facebook): demo locally; Google OAuth in cloud
2. Create & manage gift lists (title, occasion, date, items, links, prices)
3. Unique share links
4. Public visitor view with anonymous “Mark purchased”
5. Owner-only edits; shipping address revealed only after claim (cloud RPC)

## Priority
**Next.js website first.** The Flutter app in `mobile/` is paused until the web product succeeds.
