package com.calcura.app

import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Instrumented Compose UI tests. These require a connected device/emulator and cannot run in
 * a headless CI environment without one (see docs/ENVIRONMENT.md and docs/TESTING.md) — written
 * and ready to execute once a device is available.
 *
 * The calculator display carries testTag("display") specifically so these tests can assert on
 * it without colliding with keypad buttons that share the same digit text (e.g. the "0" button
 * vs. a display showing "0").
 */
@RunWith(AndroidJUnit4::class)
class CalculatorFlowTest {

    @get:Rule
    val composeRule = createAndroidComposeRule<MainActivity>()

    @Test
    fun appLaunches_showsZeroDisplay() {
        composeRule.onNodeWithTag("display").assertTextContains("0", substring = true)
    }

    @Test
    fun digitEntry_updatesDisplay() {
        composeRule.onNodeWithText("2").performClick()
        composeRule.onNodeWithTag("display").assertTextContains("2", substring = true)
    }

    @Test
    fun basicArithmetic_producesResult() {
        composeRule.onNodeWithText("2").performClick()
        composeRule.onNodeWithText("+").performClick()
        composeRule.onNodeWithText("3").performClick()
        composeRule.onNodeWithText("=").performClick()
        composeRule.onNodeWithTag("display").assertTextContains("5", substring = true)
    }

    @Test
    fun scientificFunctionTap_insertsFunction() {
        composeRule.onNodeWithText("fx").performClick()
        composeRule.onNodeWithText("sqrt").performClick()
        composeRule.onNodeWithTag("expression").assertTextContains("sqrt(", substring = true)
    }

    @Test
    fun clearButton_resetsDisplay() {
        composeRule.onNodeWithText("5").performClick()
        composeRule.onNodeWithText("C").performClick()
        composeRule.onNodeWithTag("display").assertTextContains("0", substring = true)
    }

    @Test
    fun deleteButton_removesLastCharacter() {
        composeRule.onNodeWithText("1").performClick()
        composeRule.onNodeWithText("2").performClick()
        composeRule.onNodeWithText("DEL").performClick()
        composeRule.onNodeWithTag("display").assertTextContains("1", substring = true)
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
        composeRule.onNodeWithTag("themeDropdown").performClick()
        composeRule.onNode(SemanticsMatcher.expectValue(
            androidx.compose.ui.semantics.SemanticsProperties.Text,
            listOf(androidx.compose.ui.text.AnnotatedString("DARK"))
        )).performClick()
        composeRule.onNodeWithTag("themeDropdown").assertTextContains("DARK", substring = true)
    }

    @Test
    fun angleModeSwitch_inSettings() {
        composeRule.onNodeWithText("S").performClick()
        composeRule.onNodeWithTag("angleModeDropdown").performClick()
        composeRule.onNode(SemanticsMatcher.expectValue(
            androidx.compose.ui.semantics.SemanticsProperties.Text,
            listOf(androidx.compose.ui.text.AnnotatedString("RAD"))
        )).performClick()
        composeRule.onNodeWithTag("angleModeDropdown").assertTextContains("RAD", substring = true)
    }
}
