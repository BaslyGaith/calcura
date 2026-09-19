package com.calcura.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.calcura.app.ui.CalcuraViewModelFactory
import com.calcura.app.ui.navigation.CalcuraNavHost
import com.calcura.app.ui.theme.CalcuraTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)

        val app = application as CalcuraApp
        val factory = CalcuraViewModelFactory(app.historyRepository, app.settingsRepository)

        setContent {
            val settings by app.settingsRepository.observeSettings().collectAsState(initial = com.calcura.app.domain.model.AppSettings())
            CalcuraTheme(themeMode = settings.themeMode) {
                CalcuraNavHost(factory = factory)
            }
        }
    }
}
