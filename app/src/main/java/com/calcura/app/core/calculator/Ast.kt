package com.calcura.app.core.calculator

sealed class Expr {
    data class NumberLit(val value: Double) : Expr()
    data class ConstantRef(val name: String) : Expr()
    data class BinaryOp(val op: Char, val left: Expr, val right: Expr) : Expr()
    data class UnaryMinus(val operand: Expr) : Expr()
    data class Factorial(val operand: Expr) : Expr()
    data class FunctionCall(val name: String, val arg: Expr) : Expr()
}
