package com.calcura.app.ui.history

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.calcura.app.domain.model.HistoryEntry
import com.calcura.app.domain.repository.HistoryRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class HistoryUiState(val entries: List<HistoryEntry> = emptyList())

class HistoryViewModel(private val historyRepository: HistoryRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(HistoryUiState())
    val uiState: StateFlow<HistoryUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            historyRepository.observeHistory().collect { entries ->
                _uiState.value = HistoryUiState(entries)
            }
        }
    }

    fun delete(id: Long) = viewModelScope.launch { historyRepository.delete(id) }

    fun clearAll() = viewModelScope.launch { historyRepository.clearAll() }
}
