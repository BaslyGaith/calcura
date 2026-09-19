package com.calcura.app.ui.settings

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.calcura.app.BuildConfig
import com.calcura.app.core.calculator.AngleMode
import com.calcura.app.domain.model.AppSettings
import com.calcura.app.ui.theme.ThemeMode

@Composable
fun SettingsScreen(
    settings: AppSettings,
    onBack: () -> Unit,
    onThemeModeChange: (ThemeMode) -> Unit,
    onAngleModeChange: (AngleMode) -> Unit,
    onVibrationChange: (Boolean) -> Unit,
    onSoundChange: (Boolean) -> Unit,
    onScientificNotationChange: (Boolean) -> Unit,
    onClearHistory: () -> Unit,
    onShowPrivacyPolicy: () -> Unit,
    onShowLicense: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings") },
                navigationIcon = { IconButton(onClick = onBack) { Text("<", modifier = Modifier.padding(start = 8.dp)) } }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            SectionLabel("Appearance")
            DropdownSetting(
                label = "Theme",
                options = ThemeMode.entries,
                selected = settings.themeMode,
                onSelected = onThemeModeChange
            )

            SectionLabel("Calculation")
            DropdownSetting(
                label = "Default angle mode",
                options = AngleMode.entries,
                selected = settings.angleMode,
                onSelected = onAngleModeChange
            )
            ToggleRow("Scientific notation for large numbers", settings.useScientificNotationForLargeNumbers, onScientificNotationChange)

            SectionLabel("Feedback")
            ToggleRow("Vibration on key press", settings.vibrationEnabled, onVibrationChange)
            ToggleRow("Sound on key press (stub — no audio wired yet)", settings.soundEnabled, onSoundChange)

            SectionLabel("Data")
            Button(onClick = onClearHistory, modifier = Modifier.fillMaxWidth()) { Text("Clear calculation history") }

            SectionLabel("About")
            Text("Calcura v${BuildConfig.VERSION_NAME} (${BuildConfig.VERSION_CODE})")
            Button(onClick = onShowPrivacyPolicy, modifier = Modifier.fillMaxWidth()) { Text("Privacy Policy") }
            Button(onClick = onShowLicense, modifier = Modifier.fillMaxWidth()) { Text("License") }
        }
    }
}

@Composable
private fun SectionLabel(text: String) {
    Text(text, modifier = Modifier.padding(top = 16.dp, bottom = 4.dp))
}

@Composable
private fun ToggleRow(label: String, checked: Boolean, onCheckedChange: (Boolean) -> Unit) {
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Text(label, modifier = Modifier.weight(1f))
        Switch(checked = checked, onCheckedChange = onCheckedChange)
    }
}

@Composable
private fun <T> DropdownSetting(label: String, options: List<T>, selected: T, onSelected: (T) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Text(label, modifier = Modifier.weight(1f))
        Button(onClick = { expanded = true }) { Text(selected.toString()) }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            options.forEach { option ->
                DropdownMenuItem(text = { Text(option.toString()) }, onClick = {
                    onSelected(option)
                    expanded = false
                })
            }
        }
    }
}
