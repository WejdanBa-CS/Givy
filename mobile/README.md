# Givy (Flutter)

Mobile/desktop Flutter app for the Givy gift registry.

## Website (Flutter web)

```bash
cd mobile
flutter run -d edge
```

Or build a static site:

```bash
cd mobile
flutter build web
```

Output lands in `mobile/build/web`.

## Features

- Demo sign-in (Google / Apple / Facebook)
- Home, lists, create, giveaways, profile
- Share/claim gifts anonymously
- Local persistence via `shared_preferences`
