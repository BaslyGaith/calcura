package com.calcura.app.data.history

import com.calcura.app.domain.model.HistoryEntry
import com.calcura.app.domain.repository.HistoryRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class HistoryRepositoryImpl(private val dao: HistoryDao) : HistoryRepository {

    override fun observeHistory(): Flow<List<HistoryEntry>> =
        dao.observeAll().map { list -> list.map { it.toDomain() } }

    override suspend fun insert(entry: HistoryEntry) {
        dao.insert(HistoryEntryDbo(expression = entry.expression, result = entry.result, timestampMillis = entry.timestampMillis))
    }

    override suspend fun delete(id: Long) = dao.deleteById(id)

    override suspend fun clearAll() = dao.clearAll()

    private fun HistoryEntryDbo.toDomain() = HistoryEntry(id, expression, result, timestampMillis)
}
