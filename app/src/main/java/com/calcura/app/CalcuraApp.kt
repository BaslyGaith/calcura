package com.calcura.app

import android.app.Application
import androidx.datastore.preferences.preferencesDataStore
import androidx.room.Room
import com.calcura.app.data.history.HistoryDatabase
import com.calcura.app.data.history.HistoryRepositoryImpl
import com.calcura.app.data.settings.SettingsRepositoryImpl
import com.calcura.app.domain.repository.HistoryRepository
import com.calcura.app.domain.repository.SettingsRepository

private val android.content.Context.dataStore by preferencesDataStore(name = "calcura_settings")

class CalcuraApp : Application() {

    lateinit var historyRepository: HistoryRepository
        private set
    lateinit var settingsRepository: SettingsRepository
        private set

    override fun onCreate() {
        super.onCreate()
        val db = Room.databaseBuilder(this, HistoryDatabase::class.java, "calcura_history.db").build()
        historyRepository = HistoryRepositoryImpl(db.historyDao())
        settingsRepository = SettingsRepositoryImpl(dataStore)
    }
}
