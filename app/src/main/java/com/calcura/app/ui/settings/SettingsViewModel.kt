package com.calcura.app.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.calcura.app.core.calculator.AngleMode
import com.calcura.app.domain.model.AppSettings
import com.calcura.app.domain.repository.HistoryRepository
import com.calcura.app.domain.repository.SettingsRepository
import com.calcura.app.ui.theme.ThemeMode
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class SettingsViewModel(
    private val settingsRepository: SettingsRepository,
    private val historyRepository: HistoryRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AppSettings())
    val uiState: StateFlow<AppSettings> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            settingsRepository.observeSettings().collect { _uiState.value = it }
        }
    }

    fun setThemeMode(mode: ThemeMode) = update { it.copy(themeMode = mode) }
    fun setAngleMode(mode: AngleMode) = update { it.copy(angleMode = mode) }
    fun setVibrationEnabled(enabled: Boolean) = update { it.copy(vibrationEnabled = enabled) }
    fun setSoundEnabled(enabled: Boolean) = update { it.copy(soundEnabled = enabled) }
    fun setScientificNotation(enabled: Boolean) = update { it.copy(useScientificNotationForLargeNumbers = enabled) }

    fun clearHistory() = viewModelScope.launch { historyRepository.clearAll() }

    private fun update(transform: (AppSettings) -> AppSettings) {
        val newSettings = transform(_uiState.value)
        _uiState.value = newSettings
        viewModelScope.launch { settingsRepository.update(newSettings) }
    }
}
