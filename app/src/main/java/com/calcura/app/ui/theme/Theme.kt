package com.calcura.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColors = lightColorScheme(
    primary = IndigoPrimaryLight,
    primaryContainer = VioletContainerLight,
    secondary = AmberSecondaryLight,
    secondaryContainer = AmberContainerLight,
    surface = SurfaceLight,
    onSurface = OnSurfaceLight,
    error = ErrorLight
)

private val DarkColors = darkColorScheme(
    primary = IndigoPrimaryDark,
    primaryContainer = VioletContainerDark,
    secondary = AmberSecondaryDark,
    secondaryContainer = AmberContainerDark,
    surface = SurfaceDark,
    onSurface = OnSurfaceDark,
    error = ErrorDark
)

enum class ThemeMode { LIGHT, DARK, SYSTEM }

@Composable
fun CalcuraTheme(
    themeMode: ThemeMode = ThemeMode.SYSTEM,
    content: @Composable () -> Unit
) {
    val useDark = when (themeMode) {
        ThemeMode.LIGHT -> false
        ThemeMode.DARK -> true
        ThemeMode.SYSTEM -> isSystemInDarkTheme()
    }
    MaterialTheme(
        colorScheme = if (useDark) DarkColors else LightColors,
        typography = CalcuraTypography,
        content = content
    )
}
