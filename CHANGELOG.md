# Changelog

## 0.1.0 — Initial release

- Scientific calculator engine (Tokenizer/Parser/Evaluator) supporting arithmetic,
  trigonometric/hyperbolic/log functions, factorial, power, roots, constants, and DEG/RAD/GRAD
  angle modes, with clear non-crashing error handling for domain/syntax/overflow/division cases.
- Calculator, History, and Settings screens built with Jetpack Compose and Material 3.
- Calculation history persisted with Room; settings and memory persisted with DataStore.
- Original Material 3 light/dark theme and adaptive launcher icon.
- Unit test suite for the calculator engine; instrumented Compose UI tests written (require a
  device/emulator to execute).
- 100% offline — no network permission, no analytics/ads SDKs.
