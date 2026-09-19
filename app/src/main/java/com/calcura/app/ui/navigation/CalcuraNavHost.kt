package com.calcura.app.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.calcura.app.ui.CalcuraViewModelFactory
import com.calcura.app.ui.calculator.CalculatorScreen
import com.calcura.app.ui.calculator.CalculatorViewModel
import com.calcura.app.ui.history.HistoryScreen
import com.calcura.app.ui.history.HistoryViewModel
import com.calcura.app.ui.settings.SettingsScreen
import com.calcura.app.ui.settings.SettingsViewModel

object Routes {
    const val CALCULATOR = "calculator"
    const val HISTORY = "history"
    const val SETTINGS = "settings"
    const val PRIVACY = "privacy"
    const val LICENSE = "license"
}

const val PRIVACY_POLICY_TEXT = """Calcura Privacy Policy

Calcura works entirely offline. It does not collect, transmit, or share any personal data.
There is no analytics SDK, no advertising SDK, and no network permission in this app.

All calculation history and settings are stored only on this device, using local
storage (Room database and DataStore). You can erase this data at any time from
Settings > Clear calculation history, or by clearing the app's storage from
Android system settings."""

const val LICENSE_TEXT = """Calcura is distributed under the MIT License.
See the LICENSE file included with the source distribution for full terms."""

@Composable
fun CalcuraNavHost(factory: CalcuraViewModelFactory, navController: NavHostController = rememberNavController()) {
    NavHost(navController = navController, startDestination = Routes.CALCULATOR) {
        composable(Routes.CALCULATOR) {
            val vm: CalculatorViewModel = viewModel(factory = factory)
            val state by vm.uiState.collectAsState()
            CalculatorScreen(
                uiState = state,
                onInput = vm::onInput,
                onDelete = vm::onDelete,
                onClear = vm::onClear,
                onEquals = vm::onEquals,
                onToggleScientific = vm::toggleScientificPad,
                onMemoryClear = vm::onMemoryClear,
                onMemoryRecall = vm::onMemoryRecall,
                onMemoryAdd = vm::onMemoryAdd,
                onMemorySubtract = vm::onMemorySubtract,
                onOpenHistory = { navController.navigate(Routes.HISTORY) },
                onOpenSettings = { navController.navigate(Routes.SETTINGS) }
            )
        }
        composable(Routes.HISTORY) {
            val vm: HistoryViewModel = viewModel(factory = factory)
            val state by vm.uiState.collectAsState()
            HistoryScreen(
                entries = state.entries,
                onBack = { navController.popBackStack() },
                onDelete = vm::delete,
                onClearAll = vm::clearAll,
                onReuse = { navController.popBackStack() }
            )
        }
        composable(Routes.SETTINGS) {
            val vm: SettingsViewModel = viewModel(factory = factory)
            val state by vm.uiState.collectAsState()
            SettingsScreen(
                settings = state,
                onBack = { navController.popBackStack() },
                onThemeModeChange = vm::setThemeMode,
                onAngleModeChange = vm::setAngleMode,
                onVibrationChange = vm::setVibrationEnabled,
                onSoundChange = vm::setSoundEnabled,
                onScientificNotationChange = vm::setScientificNotation,
                onClearHistory = vm::clearHistory,
                onShowPrivacyPolicy = { navController.navigate(Routes.PRIVACY) },
                onShowLicense = { navController.navigate(Routes.LICENSE) }
            )
        }
        composable(Routes.PRIVACY) { InfoScreen("Privacy Policy", PRIVACY_POLICY_TEXT) { navController.popBackStack() } }
        composable(Routes.LICENSE) { InfoScreen("License", LICENSE_TEXT) { navController.popBackStack() } }
    }
}

@Composable
private fun InfoScreen(title: String, text: String, onBack: () -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(title) },
                navigationIcon = { IconButton(onClick = onBack) { Text("<", modifier = Modifier.padding(start = 8.dp)) } }
            )
        }
    ) { padding ->
        Text(
            text = text,
            modifier = Modifier
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        )
    }
}
