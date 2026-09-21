# Google Play Store Listing — Calcura

This document contains the prepared, honest store listing copy and asset requirements for
Calcura. Nothing here has been submitted to Google Play — this is preparation material only.
Publishing requires a separate, explicit approval step (see `docs/RELEASE.md`).

## App identity

- **App name:** Calcura
- **Package name (applicationId):** com.calcura.app
- **Category:** Tools
- **Content rating:** Everyone (no user-generated content, no ads, no in-app purchases, no
  objectionable content — a calculator)
- **Pricing:** Free
- **Contact email for Play Console:** mgabasly@gmail.com (as provided by the developer; Play
  Console account creation and sign-in must be done by the developer directly — see
  "Human steps required" below)

## Short description (max 80 characters)

> A fast, offline scientific calculator with history, memory, and dark mode.

(79 characters)

## Full description

> Calcura is a clean, fast scientific calculator built for everyday math and more advanced
> calculations alike.
>
> FEATURES
> • Full scientific function set: sin, cos, tan and their inverses and hyperbolic forms, log,
>   ln, exp, square root and nth root, powers, factorial, and the constants π and e
> • DEG, RAD, and GRAD angle modes, always visible on screen
> • Calculation history — review, reuse, or delete past calculations, or clear everything at once
> • Memory functions (MC, MR, M+, M−)
> • Light, dark, and system theme support
> • Careful number formatting that avoids floating-point display glitches
> • Clear, friendly error messages instead of crashes for invalid input, division by zero, or
>   out-of-domain functions (like the square root of a negative number)
>
> PRIVACY
> Calcura works entirely offline. It has no internet permission, collects no personal data, and
> contains no analytics or advertising software of any kind. Your calculation history and
> settings are stored only on your device, and you can clear them at any time from Settings.
>
> Calcura is free, with no ads and no in-app purchases.

## Category & tags

- Category: Tools
- Tags: calculator, scientific calculator, math, offline

## Icon requirements

- 512×512 PNG, 32-bit with alpha channel, max 1MB — export from the adaptive icon vector
  drawables already in `app/src/main/res/mipmap-anydpi-v26/` and `drawable/` (a design tool or
  `./gradlew` icon export step is needed to rasterize at 512×512; not yet generated as of this
  writing).

## Feature graphic

- 1024×500 PNG or JPEG, no alpha channel.
- Not yet created. Should reuse the app's indigo/amber palette and the launcher mark, with the
  app name "Calcura" and the short description as text overlay. This needs a design pass beyond
  what's practical to hand-code here — flag for the developer to produce via a design tool, or
  ask to have it generated as a follow-up task.

## Screenshots

Captured live from the running app on the `Calcura_Test` emulator (Pixel 6, API 34) on
2026-09-21, stored in `docs/screenshots/`:

1. `01_main_calculator.png` — main calculator, basic keypad, light theme
2. `02_scientific_functions.png` — scientific keypad expanded (sin/cos/tan, log/ln/sqrt, parens,
   factorial, π, e)
3. `03_calculation_result.png` — a computed result (2+3 = 5) showing expression + result display
4. `04_history.png` — calculation history screen with reuse/delete/clear-all controls
5. `05_settings.png` — settings screen (theme, angle mode, feedback toggles, about)
6. `06_dark_mode.png` — calculator in dark theme

Google Play requires a minimum of 2 phone screenshots (up to 8); all 6 above qualify and cover
the "Screenshots required" checklist item (main calculator, scientific functions, history, dark
mode, settings) from the original project brief.

Note: these are raw device screenshots (1080×2400, includes system status bar). For final
submission, Play accepts screenshots between 320px and 3840px on the long edge with a max 2:1
aspect ratio — these qualify as-is, but cropping the status bar and adding device framing would
improve the listing (optional polish, not required for submission).

## Data safety

See `docs/GOOGLE_PLAY_DATA_SAFETY.md` for the full declaration, derived from inspecting the
actual manifest and dependencies (not guessed).

## Content rating questionnaire

Answers, based on actual app behavior:

- Violence: None
- Sexual content: None
- Profanity: None
- Controlled substances: None
- User-generated content / social features: None
- Shares location: No (no location permission requested)
- Personal information collected: None
- In-app purchases: None
- Ads: None

Expected rating: **Everyone** (or equivalent lowest tier) in all regional rating systems (ESRB,
PEGI, etc.) — a straightforward calculator utility.

## Human steps required (cannot be automated here)

1. Sign in to [Google Play Console](https://play.google.com/console) with the Google account
   `mgabasly@gmail.com` — this requires the developer's own authentication (and possibly a
   one-time $25 registration fee for a new developer account). Do not share the password or any
   2FA code with an assistant; sign in directly in your own browser.
2. Create a new app entry, choosing "Calcura" as the name and `com.calcura.app` as the intended
   package (Play Console will use the package from the uploaded AAB).
3. Upload the release `.aab` (see `docs/RELEASE.md` for how it's built and signed).
4. Paste in the short/full description, upload the icon, feature graphic, and screenshots listed
   above.
5. Fill in the Data Safety form using `docs/GOOGLE_PLAY_DATA_SAFETY.md` as the source of truth.
6. Complete the content rating questionnaire using the answers above.
7. Submit for review only after explicit confirmation — see the final checklist prompt in
   `docs/RELEASE.md`.
