package com.smartpass.app.ui.screens.staff_attendance

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.ErrorOutline
import androidx.compose.material.icons.outlined.QrCode
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.smartpass.app.data.model.DynamicQrResponse
import com.smartpass.app.ui.components.*
import com.smartpass.app.ui.labels.Labels
import com.smartpass.app.ui.theme.*
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StaffAttendanceScreen(
    viewModel: StaffAttendanceViewModel,
    onNavigateBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()

    var sessionInput by remember(state.classSession) { mutableStateOf(state.classSession) }
    var subjectInput by remember(state.subject) { mutableStateOf(state.subject) }

    var activeDynamicQr by remember { mutableStateOf<DynamicQrResponse?>(null) }
    var showQrDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Điểm Danh Lớp Học",
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
            // Feedback Banners
            state.successMessage?.let { msg ->
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 14.dp),
                    shape = RoundedCornerShape(12.dp),
                    color = SuccessContainerLight
                ) {
                    Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.CheckCircle, contentDescription = null, tint = SuccessGreen)
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(text = msg, style = MaterialTheme.typography.bodySmall, color = SuccessGreen)
                    }
                }
            }

            state.error?.let { err ->
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 14.dp),
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

            // Session Configuration Card
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                color = MaterialTheme.colorScheme.surface,
                shadowElevation = 0.5.dp
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text(
                        text = "Cấu hình ca học",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = sessionInput,
                        onValueChange = {
                            sessionInput = it
                            viewModel.updateSession(it)
                        },
                        label = { Text("Ca học (ví dụ: Ca 1, Ca sáng)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    OutlinedTextField(
                        value = subjectInput,
                        onValueChange = {
                            subjectInput = it
                            viewModel.updateSubject(it)
                        },
                        label = { Text("Môn học (tùy chọn)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Spacer(modifier = Modifier.height(14.dp))
                    Button(
                        onClick = {
                            viewModel.generateAttendanceQr { dynamic ->
                                activeDynamicQr = dynamic
                                showQrDialog = true
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = BrandTeal),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Outlined.QrCode, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Hiện mã điểm danh (Mã động 15 phút)", fontWeight = FontWeight.SemiBold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            // Scanner & Manual Input Component
            ScannerOverlay(
                title = "Quét thẻ sinh viên",
                instruction = "Đưa mã QR của sinh viên vào khung ngắm hoặc chạm thẻ NFC để điểm danh",
                manualInputLabel = "Nhập Card Code hoặc QR Token",
                onScannedOrEntered = { code ->
                    viewModel.checkAttendance(code)
                },
                isScanningEnabled = !state.isChecking
            )

            // Result preview if any
            state.lastResult?.let { res ->
                Spacer(modifier = Modifier.height(16.dp))
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    color = MaterialTheme.colorScheme.surface,
                    shadowElevation = 0.5.dp
                ) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Text(
                            text = "Kết quả ghi nhận",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        if (res.owner != null) {
                            Text(
                                text = "Sinh viên: ${res.owner.fullName ?: "N/A"}",
                                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold)
                            )
                            Text(
                                text = "Mã SV: ${res.owner.studentCode ?: "N/A"} • Lớp: ${res.owner.className ?: "N/A"}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        if (res.attendance != null) {
                            Spacer(modifier = Modifier.height(8.dp))
                            StatusChip(
                                text = Labels.getAttendanceStatusLabel(res.attendance.status),
                                textColor = SuccessGreen,
                                containerColor = SuccessContainerLight
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
    }

    // Dynamic Attendance QR Display Dialog
    if (showQrDialog && activeDynamicQr != null) {
        val qr = activeDynamicQr!!
        var timeLeftSeconds by remember(qr.publicId) {
            mutableStateOf(maxOf(0L, qr.expiresAt - (System.currentTimeMillis() / 1000L)))
        }

        LaunchedEffect(qr.publicId) {
            while (timeLeftSeconds > 0) {
                delay(1000)
                timeLeftSeconds = maxOf(0L, qr.expiresAt - (System.currentTimeMillis() / 1000L))
            }
        }

        Dialog(onDismissRequest = { showQrDialog = false }) {
            Surface(
                shape = RoundedCornerShape(24.dp),
                color = MaterialTheme.colorScheme.surface,
                tonalElevation = 8.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "Mã Điểm Danh Buổi Học",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "${subjectInput.ifBlank { "Môn học" }} • $sessionInput",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // QR Card (Dark on White for max readability)
                    Box(
                        modifier = Modifier
                            .background(Color.White, RoundedCornerShape(16.dp))
                            .padding(16.dp)
                    ) {
                        QRCodeImage(
                            content = qr.canonicalPayload,
                            size = 230.dp,
                            enableDialogOnTap = false
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Expiry countdown
                    if (timeLeftSeconds > 0) {
                        val minutes = timeLeftSeconds / 60
                        val seconds = timeLeftSeconds % 60
                        Text(
                            text = "Hết hạn sau: %02d:%02d".format(minutes, seconds),
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold, color = BrandTeal)
                        )
                    } else {
                        Text(
                            text = "Mã QR đã hết hạn! Vui lòng làm mới.",
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold, color = ErrorRed)
                        )
                    }

                    Spacer(modifier = Modifier.height(18.dp))

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedButton(
                            onClick = { showQrDialog = false },
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Đóng")
                        }
                        Button(
                            onClick = {
                                viewModel.generateAttendanceQr { newDynamic ->
                                    activeDynamicQr = newDynamic
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = BrandTeal),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Outlined.Refresh, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Làm mới")
                        }
                    }
                }
            }
        }
    }
}
