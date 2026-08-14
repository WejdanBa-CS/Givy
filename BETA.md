# Givy closed beta

## What is live
- Google sign-in via Supabase Auth
- Invite-code gate (`/invite`) — enforced in Next **and** Postgres (list/item writes require `beta_unlocked`)
- Lists + items stored in Postgres with RLS
- Public share page (`/g/[code]`) never returns shipping address
- Address is revealed only to the claimer after a successful `claim_item` RPC
- List owners see claimed/open status only, never who claimed

## One-time setup

### 1. Supabase project
1. Create a project at https://supabase.com
2. SQL Editor → run migrations in order:
   - `supabase/migrations/001_closed_beta.sql`
   - `supabase/migrations/002_support_me.sql`
   - `supabase/migrations/003_security_hardening.sql`
   - `supabase/migrations/004_beta_invites_intentional_rls.sql`
   - `supabase/migrations/006_beta_write_gate.sql` (DB invite enforcement)
   - Optional: `005_enable_index_advisor.sql`
3. Copy Project URL + anon key into `.env.local` (never commit real keys)

### 2. Google OAuth
Create an OAuth client in Google Cloud Console. Use placeholders in docs — paste the real Client ID only into Supabase / `.env.local`:

- Authorized JavaScript origins: `http://localhost:3000`, your prod domain
- Authorized redirect URIs: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

In **Supabase** → Authentication → Providers → Google:
- Enable Google
- Paste Client ID
- Paste **Client secret** (never commit this)

### 2b. Facebook OAuth (optional)
1. Create an app at [Meta for Developers](https://developers.facebook.com/apps/)
2. Add product **Facebook Login** → **Web**
3. Valid OAuth Redirect URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
4. Paste App ID + App Secret into Supabase → Providers → Facebook
5. Request email permission; set Live (or add testers in Development)

In **Supabase** → Authentication → URL configuration:
- Site URL: `http://localhost:3000` (and prod later)
- Redirect URLs: `http://localhost:3000/auth/callback`, prod callback

### 3. Invites
Do **not** use committed starter codes. Create invites only in the SQL editor:

```sql
insert into public.beta_invites (code, note, max_uses)
values ('YOUR-UNIQUE-CODE', 'friend invite', 1);
```

The old `GIVY-BETA-2026` seed is retired by migration 003.

### 4. Env
```bash
NEXT_PUBLIC_BETA_REQUIRE_INVITE=true
```

### 5. Run web
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
- [ ] User without invite cannot create lists (even via API)

## Privacy / terms
Stub pages: `/privacy`, `/terms`

## Flutter
Phase 2: point the mobile app at the same Supabase project (same schema + Google provider). Web is the closed-beta surface first.
