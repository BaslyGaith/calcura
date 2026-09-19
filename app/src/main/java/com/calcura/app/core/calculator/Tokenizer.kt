package com.calcura.app.core.calculator

sealed class Token {
    data class Number(val value: String) : Token()
    data class Ident(val name: String) : Token() // function name or constant
    data class Op(val symbol: Char) : Token() // + - * / % ^ !
    data object LParen : Token()
    data object RParen : Token()
    data object Comma : Token()
}

class TokenizerException(message: String) : Exception(message)

object Tokenizer {

    private val functionNames = setOf(
        "sin", "cos", "tan", "asin", "acos", "atan",
        "sinh", "cosh", "tanh", "log", "ln", "exp", "sqrt", "abs"
    )
    private val constantNames = setOf("pi", "e", "π")

    fun tokenize(input: String): List<Token> {
        val tokens = mutableListOf<Token>()
        var i = 0
        val s = input.trim()
        while (i < s.length) {
            val c = s[i]
            when {
                c.isWhitespace() -> i++
                c.isDigit() || c == '.' -> {
                    val start = i
                    var sawDot = c == '.'
                    i++
                    while (i < s.length && (s[i].isDigit() || (s[i] == '.' && !sawDot))) {
                        if (s[i] == '.') sawDot = true
                        i++
                    }
                    tokens.add(Token.Number(s.substring(start, i)))
                }
                c == 'π' -> {
                    tokens.add(Token.Ident("pi"))
                    i++
                }
                c.isLetter() -> {
                    val start = i
                    while (i < s.length && s[i].isLetter()) i++
                    tokens.add(Token.Ident(s.substring(start, i)))
                }
                c == '+' || c == '-' || c == '*' || c == '/' || c == '%' || c == '^' || c == '!' -> {
                    tokens.add(Token.Op(c))
                    i++
                }
                c == '(' -> { tokens.add(Token.LParen); i++ }
                c == ')' -> { tokens.add(Token.RParen); i++ }
                c == ',' -> { tokens.add(Token.Comma); i++ }
                else -> throw TokenizerException("Unexpected character '$c'")
            }
        }
        return tokens
    }

    fun isFunction(name: String): Boolean = name in functionNames
    fun isConstant(name: String): Boolean = name in constantNames
}
