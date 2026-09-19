package com.calcura.app.domain.model

import com.calcura.app.core.calculator.AngleMode
import com.calcura.app.ui.theme.ThemeMode

data class HistoryEntry(
    val id: Long = 0,
    val expression: String,
    val result: String,
    val timestampMillis: Long
)

data class MemoryState(val value: Double = 0.0, val hasValue: Boolean = false)

data class AppSettings(
    val themeMode: ThemeMode = ThemeMode.SYSTEM,
    val angleMode: AngleMode = AngleMode.DEG,
    val vibrationEnabled: Boolean = true,
    val soundEnabled: Boolean = false,
    val useScientificNotationForLargeNumbers: Boolean = true
)
