package com.calcura.app.core.calculator

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class EvaluatorTest {

    private fun evalSuccess(expr: String, mode: AngleMode = AngleMode.RAD): Double {
        val result = Evaluator.evaluate(expr, mode)
        assertTrue("Expected Success for '$expr' but was $result", result is CalculatorResult.Success)
        return (result as CalculatorResult.Success).value
    }

    private fun evalError(expr: String, mode: AngleMode = AngleMode.RAD): CalculatorError {
        val result = Evaluator.evaluate(expr, mode)
        assertTrue("Expected Error for '$expr' but was $result", result is CalculatorResult.Error)
        return (result as CalculatorResult.Error).error
    }

    @Test fun basicAddition() = assertEquals(2.0, evalSuccess("1+1"), 1e-9)

    @Test fun operatorPrecedence() = assertEquals(14.0, evalSuccess("2+3*4"), 1e-9)

    @Test fun parenthesesOverridePrecedence() = assertEquals(20.0, evalSuccess("(2+3)*4"), 1e-9)

    @Test fun division() = assertEquals(5.0, evalSuccess("10/2"), 1e-9)

    @Test fun divisionByZero() = assertEquals(CalculatorError.DivisionByZero, evalError("10/0"))

    @Test fun moduloByZero() = assertEquals(CalculatorError.DivisionByZero, evalError("10%0"))

    @Test fun sqrtOfSixteen() = assertEquals(4.0, evalSuccess("sqrt(16)"), 1e-9)

    @Test fun powerOfTwo() = assertEquals(256.0, evalSuccess("2^8"), 1e-9)

    @Test fun logBase10() = assertEquals(2.0, evalSuccess("log(100)"), 1e-9)

    @Test fun lnOfE() = assertEquals(1.0, evalSuccess("ln(e)"), 1e-9)

    @Test fun sinThirtyDegrees() = assertEquals(0.5, evalSuccess("sin(30)", AngleMode.DEG), 1e-9)

    @Test fun sinPiOverTwoRadians() = assertEquals(1.0, evalSuccess("sin(pi/2)", AngleMode.RAD), 1e-9)

    @Test fun factorialOfFive() = assertEquals(120.0, evalSuccess("5!"), 1e-9)

    @Test fun negativeNumbers() = assertEquals(-5.0, evalSuccess("-5"), 1e-9)

    @Test fun negativeNumberArithmetic() = assertEquals(-2.0, evalSuccess("-5+3"), 1e-9)

    @Test fun nestedParentheses() = assertEquals(32.0, evalSuccess("2*((3+4)+(5+4))"), 1e-9)

    @Test fun unmatchedParenErrors() = assertEquals(CalculatorError.SyntaxError, evalError("(1+2"))

    @Test fun trailingOperatorErrors() = assertEquals(CalculatorError.SyntaxError, evalError("1+"))

    @Test fun emptyExpressionErrors() = assertEquals(CalculatorError.SyntaxError, evalError(""))

    @Test fun largeValue() = assertEquals(1e100, evalSuccess("10^100"), 1e90)

    @Test fun verySmallValue() {
        val v = evalSuccess("1/10^12")
        assertTrue(v > 0 && v < 1e-9)
    }

    @Test fun overflowIsError() = assertEquals(CalculatorError.Overflow, evalError("10^400"))

    @Test fun zeroTimesLargeNumber() = assertEquals(0.0, evalSuccess("0*999999"), 1e-9)

    @Test fun negativeTimesNegative() = assertEquals(25.0, evalSuccess("-5*-5"), 1e-9)

    @Test fun oneThirdFormatting() {
        val result = Evaluator.evaluate("1/3", AngleMode.RAD) as CalculatorResult.Success
        assertTrue(result.display.startsWith("0.333333333"))
    }

    @Test fun sqrtOfNegativeIsDomainError() = assertEquals(CalculatorError.DomainError, evalError("sqrt(-1)"))

    @Test fun logOfZeroIsDomainError() = assertEquals(CalculatorError.DomainError, evalError("log(0)"))

    @Test fun logOfNegativeIsDomainError() = assertEquals(CalculatorError.DomainError, evalError("log(-1)"))

    @Test fun factorialOfZero() = assertEquals(1.0, evalSuccess("0!"), 1e-9)

    @Test fun factorialOfOne() = assertEquals(1.0, evalSuccess("1!"), 1e-9)

    @Test fun factorialOfNegativeIsDomainError() = assertEquals(CalculatorError.DomainError, evalError("(-3)!"))

    @Test fun factorialOfNonIntegerIsDomainError() = assertEquals(CalculatorError.DomainError, evalError("2.5!"))

    @Test fun largeExponent() {
        val v = evalSuccess("2^60")
        assertEquals(Math.pow(2.0, 60.0), v, 1.0)
    }

    @Test fun deeplyNestedParentheses() {
        assertEquals(1.0, evalSuccess("((((((((((1))))))))))"), 1e-9)
    }

    @Test fun implicitMultiplicationWithConstant() {
        assertEquals(2 * Math.PI, evalSuccess("2pi"), 1e-9)
    }

    @Test fun implicitMultiplicationWithParens() {
        assertEquals(20.0, evalSuccess("2(10)"), 1e-9)
    }

    @Test fun cosZero() = assertEquals(1.0, evalSuccess("cos(0)"), 1e-9)

    @Test fun tanZero() = assertEquals(0.0, evalSuccess("tan(0)"), 1e-9)

    @Test fun absOfNegative() = assertEquals(5.0, evalSuccess("abs(-5)"), 1e-9)

    @Test fun expOfZero() = assertEquals(1.0, evalSuccess("exp(0)"), 1e-9)

    @Test fun gradMode() = assertEquals(1.0, evalSuccess("sin(100)", AngleMode.GRAD), 1e-6)
}
