# Givy — Google Play release

## What this app is

Native Android shell (`com.givy.givy`) that loads the live site:

**https://givy.onrender.com**

Same product as the website (lists, invites, Google sign-in). Google Sign-In may open the system browser briefly (Google blocks OAuth inside embedded WebViews).

## Version

See `pubspec.yaml` (`versionName+versionCode`), e.g. `1.3.1+4`.

## One-time signing setup

```powershell
cd mobile
.\tool\create_keystore.ps1
```

Back up `android/upload-keystore.jks` and `android/key.properties` offline.

## Build the App Bundle

```powershell
cd mobile
.\tool\build_release.ps1
```

Output: `build/app/outputs/bundle/release/app-release.aab`

## Play Console

1. Create app **Givy**, package `com.givy.givy`
2. Closed testing → upload the AAB
3. Store listing screenshots + icon
4. Privacy: `https://givy.onrender.com/privacy`
5. Terms: `https://givy.onrender.com/terms`

## After first upload

Play App Signing SHA-1 is not required for the web OAuth client (auth runs on the website), but keep your **upload** keystore safe for every update.
