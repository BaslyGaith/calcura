# Release

## Versioning

- `versionName`: semantic (`MAJOR.MINOR.PATCH`), starts at `0.1.0`.
- `versionCode`: incrementing integer, bumped on every release build submitted to any
  distribution channel.

## Signing keys (high level — no keystore generated yet)

- **Upload key**: a keystore you generate locally and keep private, used to sign the AAB/APK
  you upload to Google Play. Never commit it (`.gitignore` excludes `*.keystore`/`*.jks`).
- **App signing key**: the key Google Play actually uses to sign the APK delivered to users,
  held by Google under Play App Signing.
- **Google Play App Signing**: recommended setup — you upload artifacts signed with your
  upload key, Play verifies and re-signs them with the app signing key it manages. This lets
  you rotate a lost/compromised upload key without losing your app's identity, since the app
  signing key never leaves Google's infrastructure.

Generating an actual keystore is deliberately deferred until a real release is being cut.

## Release build

```
./gradlew assembleRelease
```

Produces a minified, resource-shrunk, debug-signed (until an upload keystore is configured)
release APK, with ProGuard/R8 rules for Room and DataStore in `app/proguard-rules.pro`.

Google Play requires an `.aab` (Android App Bundle), not an APK, for new submissions:

```
./gradlew bundleRelease
```

This produces `app/build/outputs/bundle/release/app-release.aab`, using the same minify/shrink
and ProGuard rules as `assembleRelease`.

## Google Play preparation status

Store listing copy, screenshots, content-rating answers, and the data safety declaration are
prepared in `docs/GOOGLE_PLAY.md` and `docs/GOOGLE_PLAY_DATA_SAFETY.md`.

**Not yet done, and requiring the developer's own action (never automated here):**

1. Generate a real upload keystore (not yet created — see "Signing keys" above) and sign a
   release `.aab` with it, instead of the debug-signed artifact `assembleRelease` currently
   produces.
2. Sign in to Google Play Console at `play.google.com/console` with the developer's own Google
   account (given as `mgabasly@gmail.com`) — this needs the developer's password/2FA directly,
   never shared with an assistant.
3. Create the app listing, upload the signed `.aab`, and fill in the listing using
   `docs/GOOGLE_PLAY.md`.
4. Complete the Data Safety form using `docs/GOOGLE_PLAY_DATA_SAFETY.md`.
5. Complete the content rating questionnaire.
6. Review everything in the Play Console preview, and only submit for review after explicit,
   separate confirmation — submission is a one-way action that starts Google's review process
   and should never happen without the developer directly saying "yes, submit."
