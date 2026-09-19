package com.calcura.app.core.calculator

/** Angle unit applied only to trigonometric functions. */
enum class AngleMode {
    DEG,
    RAD,
    GRAD;

    /** Converts [value], expressed in this mode's unit, to radians. */
    fun toRadians(value: Double): Double = when (this) {
        DEG -> Math.toRadians(value)
        RAD -> value
        GRAD -> value * (Math.PI / 200.0)
    }

    /** Converts [valueRadians] to this mode's unit. */
    fun fromRadians(valueRadians: Double): Double = when (this) {
        DEG -> Math.toDegrees(valueRadians)
        RAD -> valueRadians
        GRAD -> valueRadians * (200.0 / Math.PI)
    }
}
