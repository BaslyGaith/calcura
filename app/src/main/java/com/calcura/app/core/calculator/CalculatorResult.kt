package com.calcura.app.core.calculator

/** Outcome of [evaluate]. */
sealed class CalculatorResult {
    data class Success(val value: Double, val display: String) : CalculatorResult()
    data class Error(val error: CalculatorError) : CalculatorResult()
}
