# Testing

## Unit tests (`app/src/test/`)

Pure JVM tests, no Android dependency, run with:

```
./gradlew testDebugUnitTest
```

`EvaluatorTest.kt` covers the Tokenizer/Parser/Evaluator/NumberFormatter pipeline end to end
(41 cases): arithmetic precedence, parentheses, division/modulo by zero, all scientific
functions, all three angle modes, factorial edge cases, negative numbers, nested parentheses,
malformed input (unmatched parens, trailing operator, empty expression), large/small values,
overflow, domain errors (`sqrt(-1)`, `log(0)`, `log(-1)`), and decimal formatting (`1/3`).

Status: **green** — verified in this environment.

## Instrumented UI tests (`app/src/androidTest/`)

`CalculatorFlowTest.kt` uses Compose UI testing APIs to cover: app launch, digit entry,
basic arithmetic, scientific function tap, clear, delete, history navigation, settings
navigation, theme switch, and angle mode switch.

Run with:

```
./gradlew connectedDebugAndroidTest
```

Status: **green** — all 10 tests passing on a `Calcura_Test` (Pixel 6, API 34) emulator,
verified on 2026-09-21. The display and expression `Text` composables in `CalculatorScreen.kt`
carry `testTag("display")` / `testTag("expression")`, and the settings dropdowns carry
`testTag("themeDropdown")` / `testTag("angleModeDropdown")`, specifically so these tests can
target them unambiguously (a plain `onNodeWithText("0")` would otherwise match both a keypad
button and the display showing the same digit).

## Static analysis

```
./gradlew lint
```

Status: **green** — verified in this environment.

## Build validation

```
./gradlew assembleDebug     # green
./gradlew assembleRelease   # green, R8 minify + shrink enabled
```
