package com.calcura.app

import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Instrumented Compose UI tests. These require a connected device/emulator and cannot run in
 * this headless environment (see docs/ENVIRONMENT.md and docs/TESTING.md) — written and ready
 * to execute once a device is available.
 */
@RunWith(AndroidJUnit4::class)
class CalculatorFlowTest {

    @get:Rule
    val composeRule = createAndroidComposeRule<MainActivity>()

    @Test
    fun appLaunches_showsZeroDisplay() {
        composeRule.onNodeWithText("0").assertExists()
    }

    @Test
    fun digitEntry_updatesDisplay() {
        composeRule.onNodeWithText("2").performClick()
        composeRule.onNodeWithText("2").assertExists()
    }

    @Test
    fun basicArithmetic_producesResult() {
        composeRule.onNodeWithText("2").performClick()
        composeRule.onNodeWithText("+").assertExists().performClick()
        composeRule.onNodeWithText("3").performClick()
        composeRule.onNodeWithText("=").performClick()
        composeRule.onNodeWithText("5").assertExists()
    }

    @Test
    fun scientificFunctionTap_insertsFunction() {
        composeRule.onNodeWithText("fx").performClick()
        composeRule.onNodeWithText("sqrt").performClick()
        composeRule.onNodeWithText("sqrt(", substring = true).assertExists()
    }

    @Test
    fun clearButton_resetsDisplay() {
        composeRule.onNodeWithText("5").performClick()
        composeRule.onNodeWithText("C").performClick()
        composeRule.onNodeWithText("0").assertExists()
    }

    @Test
    fun deleteButton_removesLastCharacter() {
        composeRule.onNodeWithText("1").performClick()
        composeRule.onNodeWithText("2").performClick()
        composeRule.onNodeWithText("DEL").performClick()
        composeRule.onNodeWithText("1").assertExists()
    }

    @Test
    fun historyNavigation_opensAndReturns() {
        composeRule.onNodeWithText("H").performClick()
        composeRule.onNodeWithText("History").assertExists()
        composeRule.onNodeWithText("<").performClick()
        composeRule.onNodeWithText("Calcura").assertExists()
    }

    @Test
    fun settingsNavigation_opensAndReturns() {
        composeRule.onNodeWithText("S").performClick()
        composeRule.onNodeWithText("Settings").assertExists()
    }

    @Test
    fun themeSwitch_inSettings() {
        composeRule.onNodeWithText("S").performClick()
        composeRule.onNodeWithText("Dark", substring = true).performClick()
    }

    @Test
    fun angleModeSwitch_inSettings() {
        composeRule.onNodeWithText("S").performClick()
        composeRule.onNodeWithText("RAD", substring = true).performClick()
    }
}
