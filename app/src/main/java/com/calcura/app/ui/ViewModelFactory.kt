package com.calcura.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.calcura.app.domain.repository.HistoryRepository
import com.calcura.app.domain.repository.SettingsRepository
import com.calcura.app.ui.calculator.CalculatorViewModel
import com.calcura.app.ui.history.HistoryViewModel
import com.calcura.app.ui.settings.SettingsViewModel

/** Simple manual DI factory — no framework needed at this scope. */
class CalcuraViewModelFactory(
    private val historyRepository: HistoryRepository,
    private val settingsRepository: SettingsRepository
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T = when (modelClass) {
        CalculatorViewModel::class.java -> CalculatorViewModel(historyRepository, settingsRepository) as T
        HistoryViewModel::class.java -> HistoryViewModel(historyRepository) as T
        SettingsViewModel::class.java -> SettingsViewModel(settingsRepository, historyRepository) as T
        else -> throw IllegalArgumentException("Unknown ViewModel class $modelClass")
    }
}
