package com.smartpass.app.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.smartpass.app.ui.theme.BrandTealPrimary
import com.smartpass.app.ui.theme.ErrorRed

@Composable
fun BankingPinDots(
    pin: String,
    modifier: Modifier = Modifier,
    maxDigits: Int = 6,
    isError: Boolean = false,
    activeColor: Color = BrandTealPrimary,
    inactiveBorderColor: Color = MaterialTheme.colorScheme.outlineVariant
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterHorizontally),
        verticalAlignment = Alignment.CenterVertically
    ) {
        for (i in 0 until maxDigits) {
            val isFilled = i < pin.length
            val isCurrent = i == pin.length

            val scale by animateFloatAsState(
                targetValue = if (isFilled) 1.15f else if (isCurrent) 1.05f else 1f,
                animationSpec = spring(),
                label = "pinDotScale"
            )

            val dotColor by animateColorAsState(
                targetValue = when {
                    isError -> ErrorRed
                    isFilled -> activeColor
                    else -> Color.Transparent
                },
                label = "pinDotColor"
            )

            val borderColor by animateColorAsState(
                targetValue = when {
                    isError -> ErrorRed
                    isFilled -> activeColor
                    isCurrent -> activeColor
                    else -> inactiveBorderColor
                },
                label = "pinDotBorderColor"
            )

            Box(
                modifier = Modifier
                    .size(20.dp)
                    .scale(scale)
                    .clip(CircleShape)
                    .background(dotColor)
                    .border(
                        width = if (isCurrent) 2.dp else 1.5.dp,
                        color = borderColor,
                        shape = CircleShape
                    )
            )
        }
    }
}

