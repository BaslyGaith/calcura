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

These require a connected device or emulator and **cannot execute in this headless
environment** (see `docs/ENVIRONMENT.md` — no emulator/device available). They are written
and ready to run with:

```
./gradlew connectedDebugAndroidTest
```

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
