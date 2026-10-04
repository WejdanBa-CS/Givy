# Givy v2 compatibility review

Reviewed locally. **No production apply / deploy performed.**

## Compatible (OK)

| Area | Notes |
|------|--------|
| Existing lists / claims / beta gate | Untouched; middleware still only needs `beta_unlocked` |
| Guest / demo mode | Friends & calendar show a clear “live account” message; no crash |
| Auth profile fetch | Falls back if v2 columns missing (migration not applied yet) |
| App routes `/app/friends`, `/app/calendar`, `/app/settings/privacy` | Covered by `/app/*` auth middleware |
| Bottom nav Lists matcher | Excludes friends/calendar so list deep-links still work |
| Reminder planner | Pure function + timezone tests (US / EU / SA / midnight skew) |
| Cron route | Bearer `CRON_SECRET`; service role only |
| Flutter shell | Still loads website URL; push token bridge is optional |
| Migration order | Must run `015` → `016` → `017` |

## Fixed in this review

1. **Friendship accept RLS** — requester could previously self-accept. Now only addressee can update; trigger locks participants + status transitions.
2. **API barrel** — `friends` / `events` / `event-notifications` / `friend-lists` exported from `src/lib/api/index.ts`.

## Gaps closed (local)

| Item | Change |
|------|--------|
| `wishlist_visibility` | Migration `017_friend_wishlist_visibility.sql` + RPC `get_friend_lists` (no address leak). Friends UI “Wishlists” peek. Privacy settings page. |
| Flutter FCM | `mobile/lib/push_notifications.dart` injects token into WebView; web `PushTokenRegistrar` calls `/api/push/register`. Real `firebase_messaging` still optional (use `--dart-define=GIVY_MOCK_FCM_TOKEN=...` to test). |
| Privacy UI | `/app/settings/privacy` — username, calendar/wishlist visibility, timezone. Linked from Profile. |

## Launch prep (local, done)

| Item | Notes |
|------|--------|
| GitHub Actions cron | `docs/event-reminders-cron.workflow.yml (copy into .github/workflows/ after merge)` — no-ops until secrets `CRON_SECRET` + `GIVY_APP_URL` are set |
| Render env slots | `render.yaml` lists `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `FCM_SERVER_KEY` (sync: false) |
| Local cron ping | `npm run ping:reminders` |
| Bottom nav | Friends / calendar / settings keep the app shell nav |

## Remaining before launch

| Gap | Severity | Action |
|-----|----------|--------|
| Cron secrets | Medium | After deploy: set GitHub secrets (or uncomment Render cron) |
| Real Firebase on Android | Medium | Add `google-services.json` + `firebase_messaging` (bridge already ready) |
| FCM legacy HTTP | Low | Prefer FCM HTTP v1 later |
| Production DB | Critical | Do **not** apply 015/016/017 until checklist is green |

## Apply order (when you approve)

1. `supabase/migrations/015_social_calendar.sql`
2. `supabase/migrations/016_event_reminders.sql`
3. `supabase/migrations/017_friend_wishlist_visibility.sql`
4. Set `CRON_SECRET` + `SUPABASE_SERVICE_ROLE_KEY` (+ optional `FCM_SERVER_KEY`)
5. Deploy web
6. Set GitHub secrets `CRON_SECRET` + `GIVY_APP_URL` (or enable Render cron)
7. Beta cohort → full rollout (`LAUNCH_CHECKLIST.md` on Desktop)

## Quick local commands

```bash
npm run dry-run:reminders
npm run test:reminders
```
