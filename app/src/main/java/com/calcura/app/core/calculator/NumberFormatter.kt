package com.calcura.app.core.calculator

import java.math.BigDecimal
import java.math.MathContext
import java.math.RoundingMode

/** Formats a raw Double result into a clean display string, hiding binary float noise. */
object NumberFormatter {

    private const val SIGNIFICANT_DIGITS = 12

    fun format(value: Double): String {
        if (value == 0.0) return "0"

        val rounded = try {
            BigDecimal(value).round(MathContext(SIGNIFICANT_DIGITS, RoundingMode.HALF_UP))
        } catch (e: NumberFormatException) {
            return value.toString()
        }

        val absValue = kotlin.math.abs(value)
        val useScientific = absValue != 0.0 && (absValue < 1e-9 || absValue >= 1e15)

        return if (useScientific) {
            formatScientific(rounded)
        } else {
            formatPlain(rounded)
        }
    }

    private fun formatPlain(value: BigDecimal): String {
        var plain = value.stripTrailingZeros().toPlainString()
        if (plain == "-0") plain = "0"
        return plain
    }

    private fun formatScientific(value: BigDecimal): String {
        val stripped = value.stripTrailingZeros()
        return stripped.toString().replace("E", "e")
    }
}
