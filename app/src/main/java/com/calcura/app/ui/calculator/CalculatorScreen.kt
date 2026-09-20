package com.calcura.app.ui.calculator

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp

private val basicKeys = listOf(
    "7", "8", "9", "/",
    "4", "5", "6", "*",
    "1", "2", "3", "-",
    "0", ".", "=", "+"
)

private val scientificKeys = listOf(
    "sin(", "cos(", "tan(", "^",
    "log(", "ln(", "sqrt(", "(",
    ")", "!", "pi", "e"
)

@Composable
fun CalculatorScreen(
    uiState: CalculatorUiState,
    onInput: (String) -> Unit,
    onDelete: () -> Unit,
    onClear: () -> Unit,
    onEquals: () -> Unit,
    onToggleScientific: () -> Unit,
    onMemoryClear: () -> Unit,
    onMemoryRecall: () -> Unit,
    onMemoryAdd: () -> Unit,
    onMemorySubtract: () -> Unit,
    onOpenHistory: () -> Unit,
    onOpenSettings: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Calcura") },
                actions = {
                    IconButton(onClick = onOpenHistory) {
                        Text("H")
                    }
                    IconButton(onClick = onOpenSettings) {
                        Text("S")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column(horizontalAlignment = Alignment.End, modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "${uiState.angleMode}" + if (uiState.memory.hasValue) "  M" else "",
                    style = MaterialTheme.typography.labelLarge
                )
                Text(
                    text = uiState.expression.ifBlank { " " },
                    style = MaterialTheme.typography.bodyLarge,
                    textAlign = TextAlign.End,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("expression")
                )
                Text(
                    text = uiState.errorMessage ?: uiState.display,
                    style = MaterialTheme.typography.displayLarge,
                    textAlign = TextAlign.End,
                    color = if (uiState.errorMessage != null) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("display")
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                MemoryButton("MC", onMemoryClear)
                MemoryButton("MR", onMemoryRecall)
                MemoryButton("M+", onMemoryAdd)
                MemoryButton("M-", onMemorySubtract)
                MemoryButton(if (uiState.isScientificPad) "123" else "fx", onToggleScientific)
            }

            if (uiState.isScientificPad) {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(4),
                    modifier = Modifier.height(160.dp)
                ) {
                    items(scientificKeys) { key ->
                        CalcKey(label = key.trimEnd('('), onClick = { onInput(key) })
                    }
                }
            }

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                CalcKey(label = "C", onClick = onClear, modifier = Modifier.weight(1f))
                CalcKey(label = "DEL", onClick = onDelete, modifier = Modifier.weight(1f))
                CalcKey(label = "%", onClick = { onInput("%") }, modifier = Modifier.weight(1f))
                CalcKey(label = "÷", onClick = { onInput("/") }, modifier = Modifier.weight(1f))
            }

            LazyVerticalGrid(
                columns = GridCells.Fixed(4),
                modifier = Modifier.height(280.dp)
            ) {
                items(basicKeys) { key ->
                    CalcKey(label = key, onClick = {
                        if (key == "=") onEquals() else onInput(key)
                    })
                }
            }
        }
    }
}

@Composable
private fun MemoryButton(label: String, onClick: () -> Unit) {
    Button(onClick = onClick, contentPadding = PaddingValues(4.dp)) {
        Text(label, style = MaterialTheme.typography.labelLarge)
    }
}

@Composable
private fun CalcKey(label: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    val isOperator = label in listOf("/", "*", "-", "+", "=", "÷")
    Button(
        onClick = onClick,
        modifier = modifier
            .padding(4.dp)
            .height(56.dp),
        colors = if (isOperator) {
            ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
        } else {
            ButtonDefaults.buttonColors()
        }
    ) {
        Text(label)
    }
}
