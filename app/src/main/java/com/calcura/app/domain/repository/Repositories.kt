package com.calcura.app.domain.repository

import com.calcura.app.domain.model.AppSettings
import com.calcura.app.domain.model.HistoryEntry
import com.calcura.app.domain.model.MemoryState
import kotlinx.coroutines.flow.Flow

interface HistoryRepository {
    fun observeHistory(): Flow<List<HistoryEntry>>
    suspend fun insert(entry: HistoryEntry)
    suspend fun delete(id: Long)
    suspend fun clearAll()
}

interface SettingsRepository {
    fun observeSettings(): Flow<AppSettings>
    suspend fun update(settings: AppSettings)
    fun observeMemory(): Flow<MemoryState>
    suspend fun updateMemory(memory: MemoryState)
}
