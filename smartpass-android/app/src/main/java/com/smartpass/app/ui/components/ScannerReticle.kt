package com.smartpass.app.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.RoundRect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.smartpass.app.ui.theme.BrandTealPrimary
import com.smartpass.app.ui.theme.BrandTealPrimaryDark

@Composable
fun ScannerReticle(
    boxSize: Dp = 260.dp,
    modifier: Modifier = Modifier,
    laserColor: Color = BrandTealPrimaryDark,
    cornerColor: Color = BrandTealPrimaryDark,
    scrimColor: Color = Color(0x99000000)
) {
    val infiniteTransition = rememberInfiniteTransition(label = "scannerLaser")
    val laserProgress by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "laserPosition"
    )

    Canvas(modifier = modifier.fillMaxSize()) {
        val canvasWidth = size.width
        val canvasHeight = size.height

        val boxWidthPx = boxSize.toPx()
        val boxHeightPx = boxSize.toPx()

        val left = (canvasWidth - boxWidthPx) / 2f
        val top = (canvasHeight - boxHeightPx) / 2.4f // Slightly above vertical center for natural holding
        val right = left + boxWidthPx
        val bottom = top + boxHeightPx

        // 1. Draw outer scrim with transparent rounded cutout
        val path = Path().apply {
            fillType = PathFillType.EvenOdd
            addRect(Rect(0f, 0f, canvasWidth, canvasHeight))
            addRoundRect(
                RoundRect(
                    left = left,
                    top = top,
                    right = right,
                    bottom = bottom,
                    cornerRadius = CornerRadius(24.dp.toPx(), 24.dp.toPx())
                )
            )
        }
        drawPath(path = path, color = scrimColor)

        // 2. Draw 4 illuminated L-shaped corner brackets
        val cornerLength = 36.dp.toPx()
        val cornerStroke = 4.5.dp.toPx()
        val cornerRadius = 24.dp.toPx()

        val cornerPath = Path().apply {
            // Top-Left
            moveTo(left, top + cornerLength)
            lineTo(left, top + cornerRadius)
            quadraticBezierTo(left, top, left + cornerRadius, top)
            lineTo(left + cornerLength, top)

            // Top-Right
            moveTo(right - cornerLength, top)
            lineTo(right - cornerRadius, top)
            quadraticBezierTo(right, top, right, top + cornerRadius)
            lineTo(right, top + cornerLength)

            // Bottom-Right
            moveTo(right, bottom - cornerLength)
            lineTo(right, bottom - cornerRadius)
            quadraticBezierTo(right, bottom, right - cornerRadius, bottom)
            lineTo(right - cornerLength, bottom)

            // Bottom-Left
            moveTo(left + cornerLength, bottom)
            lineTo(left + cornerRadius, bottom)
            quadraticBezierTo(left, bottom, left, bottom - cornerRadius)
            lineTo(left, bottom - cornerLength)
        }

        drawPath(
            path = cornerPath,
            color = cornerColor,
            style = Stroke(
                width = cornerStroke,
                cap = StrokeCap.Round,
                join = StrokeJoin.Round
            )
        )

        // 3. Draw animated sweeping laser beam
        val laserY = top + (boxHeightPx * laserProgress)
        val beamHeight = 40.dp.toPx()

        // Gradient glow behind the laser
        val glowBrush = Brush.verticalGradient(
            colors = listOf(
                laserColor.copy(alpha = 0f),
                laserColor.copy(alpha = 0.25f),
                laserColor.copy(alpha = 0f)
            ),
            startY = laserY - beamHeight,
            endY = laserY + beamHeight
        )
        drawRect(
            brush = glowBrush,
            topLeft = Offset(left + 8.dp.toPx(), laserY - beamHeight),
            size = Size(boxWidthPx - 16.dp.toPx(), beamHeight * 2)
        )

        // Bright laser center line
        val lineBrush = Brush.horizontalGradient(
            colors = listOf(
                laserColor.copy(alpha = 0f),
                laserColor.copy(alpha = 0.9f),
                Color.White,
                laserColor.copy(alpha = 0.9f),
                laserColor.copy(alpha = 0f)
            ),
            startX = left,
            endX = right
        )
        drawLine(
            brush = lineBrush,
            start = Offset(left + 12.dp.toPx(), laserY),
            end = Offset(right - 12.dp.toPx(), laserY),
            strokeWidth = 2.5.dp.toPx(),
            cap = StrokeCap.Round
        )
    }
}

