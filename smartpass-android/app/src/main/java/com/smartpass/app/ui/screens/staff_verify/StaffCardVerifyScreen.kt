package com.smartpass.app.ui.screens.staff_verify

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.ErrorOutline
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.smartpass.app.core.format.Format
import com.smartpass.app.ui.components.*
import com.smartpass.app.ui.labels.Labels
import com.smartpass.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StaffCardVerifyScreen(
    viewModel: StaffCardVerifyViewModel,
    onNavigateBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Kiểm Tra Thẻ SmartPass",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 20.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Scanner & Manual Entry
            ScannerOverlay(
                title = "Xác thực danh tính thẻ",
                instruction = "Quét mã QR hoặc nhập Card Code để kiểm tra tình trạng hiệu lực và thông tin chủ sở hữu",
                manualInputLabel = "Nhập Card Code hoặc QR Token",
                onScannedOrEntered = { code ->
                    viewModel.verify(code)
                },
                isScanningEnabled = !state.isVerifying
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Loading indicator
            if (state.isVerifying) {
                CircularProgressIndicator(modifier = Modifier.size(32.dp), strokeWidth = 2.5.dp)
                Spacer(modifier = Modifier.height(12.dp))
            }

            // Error banner if verification failed
            state.error?.let { err ->
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    color = ErrorContainerLight
                ) {
                    Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.ErrorOutline, contentDescription = null, tint = ErrorRed)
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(text = err, style = MaterialTheme.typography.bodySmall, color = ErrorRed)
                    }
                }
            }

            // Successful Verification Result Card
            state.result?.let { result ->
                val card = result.card
                val owner = result.owner
                val (statusColor, containerColor) = Labels.getCardStatusColor(card.status)

                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = MaterialTheme.colorScheme.surface,
                    shadowElevation = 0.5.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "KẾT QUẢ XÁC THỰC",
                                style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 1.sp, fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            StatusChip(
                                text = Labels.getCardStatusLabel(card.status),
                                textColor = statusColor,
                                containerColor = containerColor
                            )
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        if (owner != null) {
                            Text(
                                text = owner.fullName ?: "Không có tên",
                                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Mã SV: ${owner.studentCode ?: "N/A"} • Lớp: ${owner.className ?: "N/A"}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))
                        }

                        DetailRow(label = "Mã thẻ", value = card.cardCode)
                        Spacer(modifier = Modifier.height(6.dp))
                        DetailRow(label = "Hạn sử dụng", value = Format.formatDate(card.expiresAt))
                    }
                }
            }

            Spacer(modifier = Modifier.height(28.dp))
        }
    }
}

@Composable
private fun DetailRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = label, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(text = value, style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold), color = MaterialTheme.colorScheme.onSurface)
    }
}

