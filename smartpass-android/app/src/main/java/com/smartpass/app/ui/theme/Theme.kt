package com.smartpass.app.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = BrandTealPrimary,
    onPrimary = SurfaceLight,
    primaryContainer = BrandTealContainerLight,
    onPrimaryContainer = BrandTealOnContainerLight,
    secondary = BrandSkySecondary,
    onSecondary = SurfaceLight,
    secondaryContainer = BrandSkyContainerLight,
    onSecondaryContainer = BrandSkySecondary,
    tertiary = SuccessGreen,
    onTertiary = SurfaceLight,
    tertiaryContainer = SuccessContainerLight,
    onTertiaryContainer = SuccessGreen,
    error = ErrorRed,
    onError = SurfaceLight,
    errorContainer = ErrorContainerLight,
    onErrorContainer = ErrorRed,
    background = BackgroundLight,
    onBackground = TextPrimaryLight,
    surface = SurfaceLight,
    onSurface = TextPrimaryLight,
    surfaceVariant = SurfaceVariantLight,
    onSurfaceVariant = TextSecondaryLight,
    outline = OutlineLight,
    outlineVariant = OutlineVariantLight
)

private val DarkColorScheme = darkColorScheme(
    primary = BrandTealPrimaryDark,
    onPrimary = BackgroundDark,
    primaryContainer = BrandTealContainerDark,
    onPrimaryContainer = BrandTealOnContainerDark,
    secondary = BrandSkySecondaryDark,
    onSecondary = BackgroundDark,
    secondaryContainer = BrandSkyContainerDark,
    onSecondaryContainer = BrandSkySecondaryDark,
    tertiary = SuccessGreenDark,
    onTertiary = BackgroundDark,
    tertiaryContainer = SuccessContainerDark,
    onTertiaryContainer = SuccessGreenDark,
    error = ErrorRedDark,
    onError = BackgroundDark,
    errorContainer = ErrorContainerDark,
    onErrorContainer = ErrorRedDark,
    background = BackgroundDark,
    onBackground = TextPrimaryDark,
    surface = SurfaceDark,
    onSurface = TextPrimaryDark,
    surfaceVariant = SurfaceVariantDark,
    onSurfaceVariant = TextSecondaryDark,
    outline = OutlineDark,
    outlineVariant = OutlineVariantDark
)

@Composable
fun SmartPassTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val view = LocalView.current

    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? Activity)?.window
            if (window != null) {
                window.statusBarColor = colorScheme.background.toArgb()
                window.navigationBarColor = colorScheme.surface.toArgb()
                val insetsController = WindowCompat.getInsetsController(window, view)
                insetsController.isAppearanceLightStatusBars = !darkTheme
                insetsController.isAppearanceLightNavigationBars = !darkTheme
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        shapes = Shapes,
        content = content
    )
}

