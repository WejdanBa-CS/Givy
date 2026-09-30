# Givy — Google Play release

## What this app is

Native Android shell (`com.givy.givy`) that loads the live site:

**https://www.givy.gifts**

Same product as the website (lists, invites, email/password, Google, Facebook, guest). Google Sign-In may open the system browser briefly (Google blocks OAuth inside embedded WebViews).

## Version

See `pubspec.yaml` (`versionName+versionCode`), currently **`1.1.5+20`**.

- `versionName` (1.1.5) — loads **www.givy.gifts**; UA tag `GivyPlayApp/1.1.5`
- `versionCode` (20) — must increase on every Play upload  

### Force update (block old installs)

1. Website file: `public/play-min-version.json` (`minVersionName` / `minVersionCode`)
2. Outdated Play WebViews (including legacy `GivyPlayApp/1.0.0`) are redirected to `/update-required`
3. Native shell also checks the JSON on launch (from **1.1.5+** builds)

To raise the floor later: bump `minVersionCode` in that JSON (and `PLAY_MIN_VERSION` env if set) — no AAB required for the threshold change once users are on 1.1.5+.

### Resubmit after Broken Functionality rejection (do in order)

1. **Supabase SQL Editor** — run `supabase/ops/apply_play_write_grants.sql` (fixes `permission denied for function …` on create).
2. **Confirm www.givy.gifts** is on latest `master` (Render auto-deploys).
3. **Smoke test** (browser or phone): sign in (beta unlocked) → Create → enable sample gifts → **Create Givy** succeeds.
4. **Build AAB** on your machine (signing keys are local only):
   ```powershell
   cd mobile
   .\tool\build_release.ps1
   ```
5. **Play Console** → Closed testing (or Production) → upload `1.1.5 (20)` → **Send for review**.

### Play “Broken Functionality” notes

1. **Create Givy / sample gifts:** `imageHint` values like `"hat"` are glyph seeds, not URLs. Sanitizing them as https links broke list creation when “Start with sample gift ideas” was checked (`sanitizeImageHint` now ignores non-URL hints). Sample-gift seed failures no longer abort list create.
2. **DB grants:** Triggers need `EXECUTE` on helpers (`require_beta_unlocked`, `is_safe_support_url`, …). Apply `supabase/ops/apply_play_write_grants.sql` in production.
3. **WebView shell:** Do **not** treat failed third-party subresources as a fatal app load failure. Only main-frame document errors show the retry pane.

Always bump `versionCode` before resubmitting the AAB.

## Google Sign-In (Play WebView)

Google blocks OAuth inside embedded WebViews. The shell:

1. Tags its user-agent with `GivyPlayApp`
2. Starts OAuth through a JS bridge → `flutter_web_auth_2` (Chrome Custom Tab)
3. Returns via **`com.givy.givy://auth/callback`** into the WebView to finish PKCE  
   (does **not** leave you stuck on the website in Chrome)

**Required in Supabase** → Authentication → URL configuration → Redirect URLs, add:

```
com.givy.givy://auth/callback
```

(Keep `https://www.givy.gifts/auth/callback` and the legacy `https://givy.onrender.com/auth/callback`.)

## Facebook Sign-In (Play)

Same Custom Tab bridge as Google. Facebook often hands off to the Facebook app and never returns — **1.1.4+19** keeps the flow in Chrome Custom Tabs (`preferEphemeral` + Chrome-first) and the website forces `display=popup` for Play.

**Meta checklist:** Facebook Login → Settings → **Embedded Browser OAuth Login = Yes**, Valid OAuth Redirect URI = Supabase callback, App Domains include `givy.gifts` and `YOUR_REF.supabase.co`.

## App Links (Digital Asset Links)

Share / invite / auth-callback URLs on `https://www.givy.gifts` can open in the Play app when App Links are verified.

1. Locally: `cd mobile` → `.\tool\print_assetlinks_sha.ps1`
2. Paste the SHA-256 into `public/.well-known/assetlinks.json` (replace `REPLACE_WITH_UPLOAD_CERT_SHA256`)
3. Deploy the web app to Render
4. Verify: https://developers.google.com/digital-asset-links/tools/generator  
   (package `com.givy.givy`, host `www.givy.gifts`)

5. **Play App Signing:** For installs from Play, also add the **App signing key**
   SHA-256 from Play Console → Setup → App integrity (not only the upload keystore)
   into `assetlinks.json`. Without it, https App Links may not open the app after OAuth.

Until fingerprints match, links may still open in Chrome — OAuth still returns via the `com.givy.givy://` scheme above.

## One-time signing setup

```powershell
cd mobile
.\tool\create_keystore.ps1
```

Back up `android/upload-keystore.jks` and `android/key.properties` offline. Never commit them.

## Build the App Bundle

```powershell
cd mobile
.\tool\build_release.ps1
```

Output: `build/app/outputs/bundle/release/app-release.aab`

Release builds always load **https://www.givy.gifts** (no local dart-define).

## Before upload — production checklist

1. **Render** has redeployed latest `master` (confirm https://www.givy.gifts/login shows email Sign in / Create account).
2. **Supabase → Authentication → Providers → Email** is enabled.
3. For Play review convenience, optionally disable **Confirm email** during closed beta.
4. Use your existing invite code for reviewers (do not publish it on GitHub or the store listing). Example for your own records only: create or reuse a high `max_uses` row in `beta_invites` via the Supabase SQL Editor.

5. Create a dedicated review account (email + password) and redeem the invite once so `betaUnlocked` is true.

## Play Console — Closed testing

1. App **Givy**, package `com.givy.givy`
2. **Testing → Closed testing** → create release → upload the AAB
3. Store listing:
   - App icon (512×512)
   - Feature graphic (1024×500)
   - At least 2 phone screenshots
   - Short + full description
4. Privacy: `https://www.givy.gifts/privacy`
5. Terms: `https://www.givy.gifts/terms`
6. Account deletion: `https://www.givy.gifts/delete-account`
7. **App content → App access**: **Yes** (restricted)
   - Provide review email, password, and invite steps (open app → Sign in with email → if asked, open `/invite` and enter code)
7. Add tester emails or share the opt-in URL
8. **Send for review** / start rollout to Closed testing

## After first upload

Play App Signing SHA-1 is not required for the web OAuth client (auth runs on the website), but keep your **upload** keystore safe for every update.
