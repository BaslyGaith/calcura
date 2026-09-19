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
