package com.calcura.app.data.settings

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.doublePreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.calcura.app.core.calculator.AngleMode
import com.calcura.app.domain.model.AppSettings
import com.calcura.app.domain.model.MemoryState
import com.calcura.app.domain.repository.SettingsRepository
import com.calcura.app.ui.theme.ThemeMode
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private object Keys {
    val THEME_MODE = stringPreferencesKey("theme_mode")
    val ANGLE_MODE = stringPreferencesKey("angle_mode")
    val VIBRATION = booleanPreferencesKey("vibration_enabled")
    val SOUND = booleanPreferencesKey("sound_enabled")
    val SCIENTIFIC_NOTATION = booleanPreferencesKey("scientific_notation")
    val MEMORY_VALUE = doublePreferencesKey("memory_value")
    val MEMORY_HAS_VALUE = booleanPreferencesKey("memory_has_value")
}

class SettingsRepositoryImpl(private val dataStore: DataStore<Preferences>) : SettingsRepository {

    override fun observeSettings(): Flow<AppSettings> = dataStore.data.map { prefs ->
        AppSettings(
            themeMode = prefs[Keys.THEME_MODE]?.let { runCatching { ThemeMode.valueOf(it) }.getOrNull() } ?: ThemeMode.SYSTEM,
            angleMode = prefs[Keys.ANGLE_MODE]?.let { runCatching { AngleMode.valueOf(it) }.getOrNull() } ?: AngleMode.DEG,
            vibrationEnabled = prefs[Keys.VIBRATION] ?: true,
            soundEnabled = prefs[Keys.SOUND] ?: false,
            useScientificNotationForLargeNumbers = prefs[Keys.SCIENTIFIC_NOTATION] ?: true
        )
    }

    override suspend fun update(settings: AppSettings) {
        dataStore.edit { prefs ->
            prefs[Keys.THEME_MODE] = settings.themeMode.name
            prefs[Keys.ANGLE_MODE] = settings.angleMode.name
            prefs[Keys.VIBRATION] = settings.vibrationEnabled
            prefs[Keys.SOUND] = settings.soundEnabled
            prefs[Keys.SCIENTIFIC_NOTATION] = settings.useScientificNotationForLargeNumbers
        }
    }

    override fun observeMemory(): Flow<MemoryState> = dataStore.data.map { prefs ->
        MemoryState(
            value = prefs[Keys.MEMORY_VALUE] ?: 0.0,
            hasValue = prefs[Keys.MEMORY_HAS_VALUE] ?: false
        )
    }

    override suspend fun updateMemory(memory: MemoryState) {
        dataStore.edit { prefs ->
            prefs[Keys.MEMORY_VALUE] = memory.value
            prefs[Keys.MEMORY_HAS_VALUE] = memory.hasValue
        }
    }
}
