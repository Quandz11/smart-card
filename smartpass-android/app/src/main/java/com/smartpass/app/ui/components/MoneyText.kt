package com.smartpass.app.ui.components

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.sp
import com.smartpass.app.core.format.Format

@Composable
fun MoneyText(
    amount: Long,
    modifier: Modifier = Modifier,
    color: Color = Color.Unspecified,
    fontSize: TextUnit = 16.sp,
    fontWeight: FontWeight = FontWeight.Bold,
    prefix: String = ""
) {
    val formatted = Format.formatVND(amount)
    Text(
        text = if (prefix.isNotEmpty()) "$prefix$formatted" else formatted,
        modifier = modifier,
        color = color,
        style = MaterialTheme.typography.bodyLarge.copy(
            fontSize = fontSize,
            fontWeight = fontWeight
        )
    )
}

@Composable
fun MoneyText(
    amount: Double,
    modifier: Modifier = Modifier,
    color: Color = Color.Unspecified,
    fontSize: TextUnit = 16.sp,
    fontWeight: FontWeight = FontWeight.Bold,
    prefix: String = ""
) {
    MoneyText(
        amount = amount.toLong(),
        modifier = modifier,
        color = color,
        fontSize = fontSize,
        fontWeight = fontWeight,
        prefix = prefix
    )
}

