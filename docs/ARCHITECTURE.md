# Architecture

## Stack
- Kotlin
- Jetpack Compose + Material 3
- Gradle Wrapper (Kotlin DSL), single-module `app` (no need for multi-module at this scope)
- Min SDK 24 (Android 7.0), Target/Compile SDK 34
- 100% offline, no network permissions, no analytics/ads SDKs

## Package structure

```
com.<org>.calculator
├── core/
│   └── calculator/         # pure Kotlin math engine — no Android/Compose deps
│       ├── Tokenizer.kt
│       ├── Parser.kt        # recursive-descent → AST
│       ├── Evaluator.kt     # AST → BigDecimal/Double result
│       ├── AngleMode.kt     # DEG / RAD / GRAD
│       ├── CalculatorError.kt
│       └── NumberFormatter.kt
├── domain/
│   ├── model/               # HistoryEntry, MemoryState, Settings
│   └── repository/          # interfaces (HistoryRepository, SettingsRepository)
├── data/
│   ├── history/             # Room DB (or DataStore) implementation
│   └── settings/            # DataStore Preferences implementation
├── ui/
│   ├── calculator/          # CalculatorScreen, CalculatorViewModel, Keypad
│   ├── history/             # HistoryScreen, HistoryViewModel
│   ├── settings/            # SettingsScreen, SettingsViewModel
│   ├── theme/                # Color.kt, Type.kt, Theme.kt (Material 3)
│   └── navigation/           # NavHost + routes
└── MainActivity.kt / CalculatorApp.kt
```

## Layers (unidirectional data flow)

```
UI (Compose)
   ↓ user events
ViewModel (StateFlow<UiState>)
   ↓ calls
Domain (repositories, use cases)
   ↓ calls
Calculator Engine (pure Kotlin, stateless, testable in isolation)
   ↓ reads/writes
Persistence (Room for history, DataStore for settings/memory)
```

The calculator engine never imports `android.*` or Compose — this keeps it 100% unit-testable on the JVM without instrumentation, and prevents UI code from containing math logic.

## Calculator engine design

- **Tokenizer**: raw input string → list of tokens (numbers, operators, functions, parens, constants).
- **Parser**: recursive-descent parser building an AST, correctly handling operator precedence, unary minus, implicit multiplication (e.g. `2π`), and function calls with domain checks deferred to evaluation.
- **Evaluator**: walks the AST, computing with `Double` internally but formatting output through `NumberFormatter` to avoid float noise (e.g. `0.1 + 0.2` → `0.3`), using rounding to ~10-12 significant digits before display.
- Angle mode (DEG/RAD/GRAD) is passed into the evaluator context and applied only to trig functions.
- Errors are represented as a sealed `CalculatorError` (DivisionByZero, DomainError, SyntaxError, Overflow) rather than exceptions crossing into the UI layer — `Evaluator.evaluate()` returns a `Result<CalculatorValue, CalculatorError>`-style sealed result.
- No `eval()`-style dynamic code execution — this is a hand-written parser for auditability and security.

## State management

- Each screen has a `ViewModel` exposing a single `StateFlow<XyzUiState>` (immutable data class), following standard unidirectional-data-flow Compose conventions.
- `CalculatorViewModel` holds the current expression, display value, angle mode, memory value, and delegates evaluation to the engine.

## Persistence

- **History**: Room database, single table `history_entry(id, expression, result, timestampMillis)`. Chosen over a flat file for simple querying/deletion.
- **Settings & memory**: Jetpack DataStore (Preferences) for theme, angle mode, vibration/sound toggles, decimal formatting, and the calculator memory (M+/M-/MR/MC) value across process death.

## Navigation

Single-activity app with a Compose `NavHost`: routes for `calculator` (start destination), `history`, `settings`. History and Settings are reached via top-bar icons from the calculator screen.

## Testing strategy

- **Unit tests** (`test/`): exhaustive tests of Tokenizer/Parser/Evaluator — precedence, parentheses, unary minus, all scientific functions, all three angle modes, memory ops, formatting/precision, error cases (div-by-zero, domain errors, malformed input, overflow, NaN/Infinity). Pure JVM, no Android dependency, fast.
- **Instrumented UI tests** (`androidTest/`): Compose UI tests for launch, digit entry, arithmetic, scientific function tap, clear/delete, history interactions, settings changes, theme switching, angle mode switching. These require a connected device/emulator — not runnable in the current headless environment (documented in `docs/ENVIRONMENT.md`); written and ready to run when a device is available.

## Release strategy

- Debug builds for local iteration.
- Release build: minify + shrink resources enabled, ProGuard/R8 rules for Room/DataStore reflection needs.
- Signing: upload keystore generated locally, never committed (`.gitignore`'d); Google Play App Signing used for the final app signing key (see `docs/RELEASE.md`, produced later).
- Versioning: semantic `versionName`, incrementing integer `versionCode`.
