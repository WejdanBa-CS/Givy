# Givy — Google Play release

## What this app is

Native Android shell (`com.givy.givy`) that loads the live site:

**https://givy.onrender.com**

Same product as the website (lists, invites, email/password, Google, Facebook, guest). Google Sign-In may open the system browser briefly (Google blocks OAuth inside embedded WebViews).

## Version

See `pubspec.yaml` (`versionName+versionCode`), currently **`1.3.3+6`**.

- `versionName` (1.3.2) — shown to users  
- `versionCode` (5) — must increase on every Play upload  

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

Release builds always load **https://givy.onrender.com** (no local dart-define).

## Before upload — production checklist

1. **Render** has redeployed latest `master` (confirm https://givy.onrender.com/login shows email Sign in / Create account).
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
4. Privacy: `https://givy.onrender.com/privacy`
5. Terms: `https://givy.onrender.com/terms`
6. **App content → App access**: **Yes** (restricted)
   - Provide review email, password, and invite steps (open app → Sign in with email → if asked, open `/invite` and enter code)
7. Add tester emails or share the opt-in URL
8. **Send for review** / start rollout to Closed testing

## After first upload

Play App Signing SHA-1 is not required for the web OAuth client (auth runs on the website), but keep your **upload** keystore safe for every update.
