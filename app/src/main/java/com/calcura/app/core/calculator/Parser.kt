package com.calcura.app.core.calculator

class ParseException(message: String) : Exception(message)

/**
 * Recursive-descent parser.
 *
 * Grammar (highest to lowest precedence):
 *   primary    := NUMBER | CONSTANT | FUNCTION '(' expression ')' | '(' expression ')'
 *   postfix    := primary ('!')*
 *   power      := postfix ('^' unary)?            // right-associative
 *   implicit   := power (implicit-primary)*        // implicit multiplication, e.g. 2π, 2(3+4)
 *   unary      := '-' unary | '+' unary | implicit
 *   term       := unary (('*' | '/' | '%') unary)*
 *   expression := term (('+' | '-') term)*
 */
class Parser(private val tokens: List<Token>) {
    private var pos = 0

    companion object {
        fun parse(tokens: List<Token>): Expr {
            if (tokens.isEmpty()) throw ParseException("Empty expression")
            val parser = Parser(tokens)
            val expr = parser.parseExpression()
            if (!parser.isAtEnd()) throw ParseException("Unexpected token near position ${parser.pos}")
            return expr
        }
    }

    private fun peek(): Token? = tokens.getOrNull(pos)
    private fun isAtEnd(): Boolean = pos >= tokens.size
    private fun advance(): Token {
        if (isAtEnd()) throw ParseException("Unexpected end of expression")
        return tokens[pos++]
    }

    private fun parseExpression(): Expr {
        var left = parseTerm()
        while (true) {
            val t = peek()
            if (t is Token.Op && (t.symbol == '+' || t.symbol == '-')) {
                advance()
                val right = parseTerm()
                left = Expr.BinaryOp(t.symbol, left, right)
            } else break
        }
        return left
    }

    private fun parseTerm(): Expr {
        var left = parseUnary()
        while (true) {
            val t = peek()
            if (t is Token.Op && (t.symbol == '*' || t.symbol == '/' || t.symbol == '%')) {
                advance()
                val right = parseUnary()
                left = Expr.BinaryOp(t.symbol, left, right)
            } else break
        }
        return left
    }

    private fun parseUnary(): Expr {
        val t = peek()
        if (t is Token.Op && t.symbol == '-') {
            advance()
            return Expr.UnaryMinus(parseUnary())
        }
        if (t is Token.Op && t.symbol == '+') {
            advance()
            return parseUnary()
        }
        return parseImplicitMul()
    }

    private fun startsPrimary(t: Token?): Boolean = when (t) {
        is Token.Number, is Token.Ident, Token.LParen -> true
        else -> false
    }

    private fun parseImplicitMul(): Expr {
        var left = parsePower()
        while (startsPrimary(peek())) {
            val right = parsePower()
            left = Expr.BinaryOp('*', left, right)
        }
        return left
    }

    private fun parsePower(): Expr {
        val base = parsePostfix()
        val t = peek()
        return if (t is Token.Op && t.symbol == '^') {
            advance()
            val exponent = parseUnary()
            Expr.BinaryOp('^', base, exponent)
        } else base
    }

    private fun parsePostfix(): Expr {
        var expr = parsePrimary()
        while (true) {
            val t = peek()
            if (t is Token.Op && t.symbol == '!') {
                advance()
                expr = Expr.Factorial(expr)
            } else break
        }
        return expr
    }

    private fun parsePrimary(): Expr {
        val t = peek() ?: throw ParseException("Unexpected end of expression")
        return when (t) {
            is Token.Number -> {
                advance()
                val value = t.value.toDoubleOrNull() ?: throw ParseException("Invalid number '${t.value}'")
                Expr.NumberLit(value)
            }
            is Token.Ident -> {
                advance()
                if (Tokenizer.isFunction(t.name)) {
                    expect(Token.LParen, "'(' after function '${t.name}'")
                    val arg = parseExpression()
                    expect(Token.RParen, "')'")
                    Expr.FunctionCall(t.name, arg)
                } else {
                    Expr.ConstantRef(t.name)
                }
            }
            Token.LParen -> {
                advance()
                val inner = parseExpression()
                expect(Token.RParen, "')'")
                inner
            }
            else -> throw ParseException("Unexpected token")
        }
    }

    private fun expect(expected: Token, description: String) {
        val t = peek()
        if (t != expected) throw ParseException("Expected $description")
        advance()
    }
}
