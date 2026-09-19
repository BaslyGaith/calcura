package com.calcura.app.data.history

import androidx.room.Dao
import androidx.room.Database
import androidx.room.Delete
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.RoomDatabase
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "history_entry")
data class HistoryEntryDbo(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val expression: String,
    val result: String,
    val timestampMillis: Long
)

@Dao
interface HistoryDao {
    @Query("SELECT * FROM history_entry ORDER BY timestampMillis DESC")
    fun observeAll(): Flow<List<HistoryEntryDbo>>

    @Insert
    suspend fun insert(entry: HistoryEntryDbo)

    @Query("DELETE FROM history_entry WHERE id = :id")
    suspend fun deleteById(id: Long)

    @Query("DELETE FROM history_entry")
    suspend fun clearAll()
}

@Database(entities = [HistoryEntryDbo::class], version = 1, exportSchema = false)
abstract class HistoryDatabase : RoomDatabase() {
    abstract fun historyDao(): HistoryDao
}
