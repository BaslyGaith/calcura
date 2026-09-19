package com.calcura.app.core.calculator

/** All error conditions the calculator engine can report. Never an exception across the API boundary. */
sealed class CalculatorError {
    data object DivisionByZero : CalculatorError()
    data object DomainError : CalculatorError()
    data object SyntaxError : CalculatorError()
    data object Overflow : CalculatorError()
    data object UnknownError : CalculatorError()
}
