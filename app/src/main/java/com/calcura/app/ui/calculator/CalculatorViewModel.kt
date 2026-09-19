package com.calcura.app.ui.calculator

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.calcura.app.core.calculator.AngleMode
import com.calcura.app.core.calculator.CalculatorError
import com.calcura.app.core.calculator.CalculatorResult
import com.calcura.app.core.calculator.Evaluator
import com.calcura.app.domain.model.HistoryEntry
import com.calcura.app.domain.model.MemoryState
import com.calcura.app.domain.repository.HistoryRepository
import com.calcura.app.domain.repository.SettingsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class CalculatorUiState(
    val expression: String = "",
    val display: String = "0",
    val angleMode: AngleMode = AngleMode.DEG,
    val memory: MemoryState = MemoryState(),
    val errorMessage: String? = null,
    val isScientificPad: Boolean = false
)

/** Human-readable messages for [CalculatorError], kept out of the pure engine layer. */
fun CalculatorError.toMessage(): String = when (this) {
    CalculatorError.DivisionByZero -> "Cannot divide by zero"
    CalculatorError.DomainError -> "Invalid input for function"
    CalculatorError.SyntaxError -> "Invalid expression"
    CalculatorError.Overflow -> "Number too large"
    CalculatorError.UnknownError -> "Something went wrong"
}

class CalculatorViewModel(
    private val historyRepository: HistoryRepository,
    private val settingsRepository: SettingsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(CalculatorUiState())
    val uiState: StateFlow<CalculatorUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            settingsRepository.observeSettings().collect { settings ->
                _uiState.value = _uiState.value.copy(angleMode = settings.angleMode)
            }
        }
        viewModelScope.launch {
            settingsRepository.observeMemory().collect { memory ->
                _uiState.value = _uiState.value.copy(memory = memory)
            }
        }
    }

    fun onInput(symbol: String) {
        val newExpr = _uiState.value.expression + symbol
        _uiState.value = _uiState.value.copy(expression = newExpr, errorMessage = null)
        evaluatePreview(newExpr)
    }

    fun onDelete() {
        val newExpr = _uiState.value.expression.dropLast(1)
        _uiState.value = _uiState.value.copy(expression = newExpr, errorMessage = null)
        evaluatePreview(newExpr)
    }

    fun onClear() {
        _uiState.value = _uiState.value.copy(expression = "", display = "0", errorMessage = null)
    }

    fun toggleScientificPad() {
        _uiState.value = _uiState.value.copy(isScientificPad = !_uiState.value.isScientificPad)
    }

    fun onEquals() {
        val expr = _uiState.value.expression
        if (expr.isBlank()) return
        when (val result = Evaluator.evaluate(expr, _uiState.value.angleMode)) {
            is CalculatorResult.Success -> {
                _uiState.value = _uiState.value.copy(display = result.display, errorMessage = null)
                viewModelScope.launch {
                    historyRepository.insert(
                        HistoryEntry(expression = expr, result = result.display, timestampMillis = System.currentTimeMillis())
                    )
                }
            }
            is CalculatorResult.Error -> {
                _uiState.value = _uiState.value.copy(errorMessage = result.error.toMessage())
            }
        }
    }

    fun onMemoryClear() = updateMemory(MemoryState())

    fun onMemoryRecall() {
        val memory = _uiState.value.memory
        if (memory.hasValue) onInput(memory.value.toString())
    }

    fun onMemoryAdd() = applyToMemory { current -> current + currentDisplayValue() }

    fun onMemorySubtract() = applyToMemory { current -> current - currentDisplayValue() }

    private fun currentDisplayValue(): Double = _uiState.value.display.toDoubleOrNull() ?: 0.0

    private fun applyToMemory(op: (Double) -> Double) {
        val current = _uiState.value.memory.value
        updateMemory(MemoryState(value = op(current), hasValue = true))
    }

    private fun updateMemory(memory: MemoryState) {
        _uiState.value = _uiState.value.copy(memory = memory)
        viewModelScope.launch { settingsRepository.updateMemory(memory) }
    }

    private fun evaluatePreview(expr: String) {
        if (expr.isBlank()) {
            _uiState.value = _uiState.value.copy(display = "0")
            return
        }
        when (val result = Evaluator.evaluate(expr, _uiState.value.angleMode)) {
            is CalculatorResult.Success -> _uiState.value = _uiState.value.copy(display = result.display)
            is CalculatorResult.Error -> Unit // keep last valid display while typing
        }
    }
}
