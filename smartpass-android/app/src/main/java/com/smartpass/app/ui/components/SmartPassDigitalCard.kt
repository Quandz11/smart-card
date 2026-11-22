package com.smartpass.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Nfc
import androidx.compose.material.icons.filled.QrCode
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.smartpass.app.core.format.Format
import com.smartpass.app.ui.labels.Labels
import com.smartpass.app.ui.theme.*

@Composable
fun SmartPassDigitalCard(
    fullName: String,
    codeOrRole: String,
    subText: String?, // Class name or email
    status: String,
    cardCode: String?,
    expiresAt: String?,
    isStaff: Boolean = false,
    onShowQr: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val gradientColors = if (isStaff) {
        listOf(CardGradientStaffStart, CardGradientStaffEnd)
    } else {
        listOf(CardGradientStart, CardGradientEnd)
    }

    val isInactive = status.lowercase() in listOf("locked", "lost", "expired")

    Box(
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(1.62f)
            .clip(RoundedCornerShape(20.dp))
            .background(Brush.linearGradient(gradientColors))
    ) {
        // Main Card Layout
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(20.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Header Row: SmartPass logo & NFC wave
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "SMARTPASS",
                        style = MaterialTheme.typography.labelSmall.copy(
                            letterSpacing = 2.sp,
                            fontWeight = FontWeight.Black,
                            fontSize = 11.sp
                        ),
                        color = Color.White.copy(alpha = 0.85f)
                    )
                    Text(
                        text = if (isStaff) "STAFF ACCESS PASS" else "DIGITAL STUDENT CARD",
                        style = MaterialTheme.typography.labelSmall.copy(
                            letterSpacing = 1.sp,
                            fontWeight = FontWeight.Medium,
                            fontSize = 9.sp
                        ),
                        color = Color.White.copy(alpha = 0.65f)
                    )
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    val (textColor, bgColor) = Labels.getCardStatusColor(status)
                    StatusChip(
                        text = Labels.getCardStatusLabel(status),
                        textColor = textColor,
                        containerColor = bgColor
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Icon(
                        imageVector = Icons.Default.Nfc,
                        contentDescription = "NFC Enabled",
                        tint = Color.White.copy(alpha = 0.9f),
                        modifier = Modifier.size(26.dp)
                    )
                }
            }

            // Middle: User Info
            Column {
                Text(
                    text = fullName.uppercase(),
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.5.sp
                    ),
                    color = Color.White,
                    maxLines = 1
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = codeOrRole,
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontWeight = FontWeight.SemiBold,
                            fontFamily = FontFamily.Monospace
                        ),
                        color = Color.White.copy(alpha = 0.9f)
                    )
                    if (!subText.isNullOrBlank()) {
                        Text(
                            text = " • $subText",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color.White.copy(alpha = 0.75f)
                        )
                    }
                }
            }

            // Footer Row: Card Code, Expiration, and QR toggle button
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ) {
                Column {
                    Text(
                        text = Format.maskToken(cardCode),
                        style = MaterialTheme.typography.labelMedium.copy(
                            fontFamily = FontFamily.Monospace,
                            letterSpacing = 1.sp
                        ),
                        color = Color.White.copy(alpha = 0.85f)
                    )
                    if (!expiresAt.isNullOrBlank()) {
                        Text(
                            text = "HSD: ${Format.formatDate(expiresAt)}",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color.White.copy(alpha = 0.65f)
                        )
                    }
                }

                if (onShowQr != null) {
                    IconButton(
                        onClick = onShowQr,
                        modifier = Modifier
                            .background(Color.White.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                            .size(38.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.QrCode,
                            contentDescription = "Show QR",
                            tint = Color.White,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                }
            }
        }

        // Overlay if card is locked, lost, or expired
        if (isInactive) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.65f)),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Lock,
                        contentDescription = "Card Inactive",
                        tint = ErrorRedDark,
                        modifier = Modifier.size(36.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "THẺ ${Labels.getCardStatusLabel(status).uppercase()}",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color.White
                    )
                    Text(
                        text = "Vui lòng liên hệ quản trị viên để hỗ trợ",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.White.copy(alpha = 0.8f)
                    )
                }
            }
        }
    }
}

