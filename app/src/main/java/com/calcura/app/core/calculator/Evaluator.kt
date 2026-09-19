package com.calcura.app.core.calculator

import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.exp
import kotlin.math.ln
import kotlin.math.log10
import kotlin.math.sqrt

/** Thrown internally during evaluation and converted to a [CalculatorError] at the boundary. */
private class EvalException(val error: CalculatorError) : Exception()

/**
 * Pure-Kotlin scientific calculator engine. No Android/Compose dependencies.
 * Entry point: [evaluate].
 */
object Evaluator {

    /** Parses and evaluates [expression] under [angleMode]. Never throws. */
    fun evaluate(expression: String, angleMode: AngleMode): CalculatorResult {
        return try {
            if (expression.isBlank()) return CalculatorResult.Error(CalculatorError.SyntaxError)
            val tokens = Tokenizer.tokenize(expression)
            val ast = Parser.parse(tokens)
            val value = eval(ast, angleMode)
            if (value.isNaN()) return CalculatorResult.Error(CalculatorError.DomainError)
            if (value.isInfinite()) return CalculatorResult.Error(CalculatorError.Overflow)
            if (abs(value) > 1e300) return CalculatorResult.Error(CalculatorError.Overflow)
            CalculatorResult.Success(value, NumberFormatter.format(value))
        } catch (e: EvalException) {
            CalculatorResult.Error(e.error)
        } catch (e: TokenizerException) {
            CalculatorResult.Error(CalculatorError.SyntaxError)
        } catch (e: ParseException) {
            CalculatorResult.Error(CalculatorError.SyntaxError)
        } catch (e: Exception) {
            CalculatorResult.Error(CalculatorError.UnknownError)
        }
    }

    private fun eval(expr: Expr, mode: AngleMode): Double = when (expr) {
        is Expr.NumberLit -> expr.value
        is Expr.ConstantRef -> when (expr.name) {
            "pi", "π" -> PI
            "e" -> Math.E
            else -> throw EvalException(CalculatorError.SyntaxError)
        }
        is Expr.UnaryMinus -> -eval(expr.operand, mode)
        is Expr.Factorial -> factorial(eval(expr.operand, mode))
        is Expr.BinaryOp -> evalBinary(expr.op, eval(expr.left, mode), eval(expr.right, mode))
        is Expr.FunctionCall -> evalFunction(expr.name, eval(expr.arg, mode), mode)
    }

    private fun evalBinary(op: Char, l: Double, r: Double): Double = when (op) {
        '+' -> l + r
        '-' -> l - r
        '*' -> l * r
        '/' -> {
            if (r == 0.0) throw EvalException(CalculatorError.DivisionByZero)
            l / r
        }
        '%' -> {
            if (r == 0.0) throw EvalException(CalculatorError.DivisionByZero)
            l % r
        }
        '^' -> Math.pow(l, r)
        else -> throw EvalException(CalculatorError.SyntaxError)
    }

    private fun evalFunction(name: String, arg: Double, mode: AngleMode): Double = when (name) {
        "sin" -> Math.sin(mode.toRadians(arg))
        "cos" -> Math.cos(mode.toRadians(arg))
        "tan" -> Math.tan(mode.toRadians(arg))
        "asin" -> {
            if (arg < -1.0 || arg > 1.0) throw EvalException(CalculatorError.DomainError)
            mode.fromRadians(Math.asin(arg))
        }
        "acos" -> {
            if (arg < -1.0 || arg > 1.0) throw EvalException(CalculatorError.DomainError)
            mode.fromRadians(Math.acos(arg))
        }
        "atan" -> mode.fromRadians(Math.atan(arg))
        "sinh" -> Math.sinh(arg)
        "cosh" -> Math.cosh(arg)
        "tanh" -> Math.tanh(arg)
        "log" -> {
            if (arg <= 0.0) throw EvalException(CalculatorError.DomainError)
            log10(arg)
        }
        "ln" -> {
            if (arg <= 0.0) throw EvalException(CalculatorError.DomainError)
            ln(arg)
        }
        "exp" -> exp(arg)
        "sqrt" -> {
            if (arg < 0.0) throw EvalException(CalculatorError.DomainError)
            sqrt(arg)
        }
        "abs" -> abs(arg)
        else -> throw EvalException(CalculatorError.SyntaxError)
    }

    private fun factorial(value: Double): Double {
        if (value < 0.0 || value != Math.floor(value) || value > 170.0) {
            throw EvalException(CalculatorError.DomainError)
        }
        var result = 1.0
        var n = value.toLong()
        while (n > 1) {
            result *= n
            n--
        }
        return result
    }
}
