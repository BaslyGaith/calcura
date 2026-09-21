# Google Play Data Safety Declaration — Calcura

This declaration is derived directly from inspecting the app's actual implementation, not
assumed. Sources checked:

- `app/src/main/AndroidManifest.xml` — no `<uses-permission>` entries at all; specifically no
  `android.permission.INTERNET` and no `ACCESS_NETWORK_STATE`.
- `app/build.gradle.kts` — dependency list contains only AndroidX core/lifecycle/activity/
  Compose/Navigation/Room/DataStore/coroutines libraries. No analytics SDK (Firebase Analytics,
  Google Analytics, Mixpanel, etc.), no crash-reporting SDK (Crashlytics, Sentry, etc.), no
  advertising SDK (AdMob, Meta Audience Network, etc.), no third-party network/HTTP client
  (Retrofit, OkHttp, Ktor, etc.).
- `app/src/main/java/com/calcura/app/data/` — `HistoryDatabase.kt` (Room, local SQLite) and
  `SettingsRepositoryImpl.kt` (DataStore Preferences) — both purely on-device, no network calls
  anywhere in the codebase.

## Does the app collect or share user data?

**No.**

## Data types collected

None. The form's "Does your app collect or share any of the required user data types?" should be
answered **No**.

## Data stored on-device (not "collected" in Play's sense — never leaves the device)

- Calculation history (expression, result, timestamp) — Room database, local only
- User preferences (theme, default angle mode, vibration/sound toggles, decimal formatting) —
  DataStore Preferences, local only
- Calculator memory value (M+/M−/MR/MC) — DataStore Preferences, local only

All of the above:
- Is not transmitted anywhere (app has no network permission and makes no network calls)
- Is deletable by the user at any time via Settings → "Clear calculation history"
- Is removed entirely on app uninstall (standard Android app-private storage)

## Security practices section

- Data encrypted in transit: **N/A — no data transmitted**
- Users can request data deletion: **Yes**, in-app (Settings → Clear calculation history), and
  fully via uninstall
- Independent security review: Not applicable / not performed (small offline utility app)

## Permissions declared

**None.** The manifest requests zero permissions.

## Summary answer for the Play Console form

> Calcura does not collect, transmit, or share any user data. All app data (calculation history
> and settings) is stored locally on the device using Android's standard local storage (Room
> database and DataStore Preferences) and is never sent over a network, because the app requests
> no network permission and contains no networking code. Users can delete their local history at
> any time from Settings, and all data is removed automatically when the app is uninstalled.

This matches `PRIVACY_POLICY.md` at the repository root, which makes the same claims for the
public-facing privacy policy page.
