# Givy closed beta

## What is live
- Google sign-in via Supabase Auth
- Invite-code gate (`/invite`)
- Lists + items stored in Postgres with RLS
- Public share page (`/g/[code]`) never returns shipping address
- Address is revealed only to the claimer after a successful `claim_item` RPC
- List owners see claimed/open status only — never who claimed

## One-time setup

### 1. Supabase project
1. Create a project at https://supabase.com
2. SQL Editor → paste and run `supabase/migrations/001_closed_beta.sql`
3. Copy Project URL + anon key into `.env.local`

### 2. Google OAuth
Client ID (already recorded for this beta):

`552935596182-1n0j8f9fnk7sdorn177r1m0jlrkfla0p.apps.googleusercontent.com`

In **Google Cloud Console** → Credentials → your OAuth client:
- Authorized JavaScript origins: `http://localhost:3000`, your prod domain
- Authorized redirect URIs: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`

In **Supabase** → Authentication → Providers → Google:
- Enable Google
- Paste Client ID
- Paste **Client secret** (never commit this)

In **Supabase** → Authentication → URL configuration:
- Site URL: `http://localhost:3000` (and prod later)
- Redirect URLs: `http://localhost:3000/auth/callback`, prod callback

### 3. Invites
Starter code seeded by migration: `GIVY-BETA-2026` (50 uses).

Add more rows in `beta_invites` as needed.

### 4. Run web
```bash
npm install
npm run dev
```

Open `/login` → Google → enter invite → `/app`.

## Tester checklist
- [ ] Sign in with Google
- [ ] Redeem invite
- [ ] Create a list with a shipping address
- [ ] Finalize & copy share link
- [ ] Open link in another browser / account
- [ ] Confirm address is **not** visible before claim
- [ ] Claim with “Ship to recipient” → address appears only after claim
- [ ] As list owner, confirm you see “Claimed” but not the claimer’s name
- [ ] Second claimer cannot claim the same gift

## Privacy / terms
Stub pages: `/privacy`, `/terms`

## Flutter
Phase 2: point the mobile app at the same Supabase project (same schema + Google provider). Web is the closed-beta surface first.
