package com.smartpass.app.ui.screens.card

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.smartpass.app.ui.components.*
import com.smartpass.app.ui.labels.Labels
import com.smartpass.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyCardScreen(
    viewModel: MyCardViewModel,
    onNavigateBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    var showConfirmLostDialog by remember { mutableStateOf(false) }

    when {
        state.isLoading -> LoadingView(message = "Đang tải thông tin thẻ...")
        state.error != null && state.user == null -> ErrorView(
            message = state.error ?: "Đã xảy ra lỗi",
            onRetry = { viewModel.loadCardData() }
        )
        state.user != null -> {
            val user = state.user ?: return
            val cardStatus = state.card?.status ?: if (user.isActive) "active" else "locked"

            Scaffold(
                topBar = {
                    TopAppBar(
                        title = {
                            Text(
                                text = "Thẻ Sinh Viên Số",
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
                    // Success or error feedback banner
                    state.actionSuccessMessage?.let { msg ->
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 16.dp),
                            shape = RoundedCornerShape(12.dp),
                            color = SuccessContainerLight
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Outlined.CheckCircle,
                                    contentDescription = null,
                                    tint = SuccessGreen
                                )
                                Spacer(modifier = Modifier.width(10.dp))
                                Text(
                                    text = msg,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = SuccessGreen
                                )
                            }
                        }
                    }

                    state.error?.let { err ->
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 16.dp),
                            shape = RoundedCornerShape(12.dp),
                            color = ErrorContainerLight
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Outlined.ErrorOutline,
                                    contentDescription = null,
                                    tint = ErrorRed
                                )
                                Spacer(modifier = Modifier.width(10.dp))
                                Text(
                                    text = err,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = ErrorRed
                                )
                            }
                        }
                    }

                    // Digital Card Presentation
                    SmartPassDigitalCard(
                        fullName = user.fullName,
                        codeOrRole = user.studentCode ?: user.role,
                        subText = user.className,
                        status = cardStatus,
                        cardCode = state.card?.cardCode ?: user.studentCode ?: user._id,
                        expiresAt = state.card?.expiresAt,
                        isStaff = user.role != "student"
                    )

                    Spacer(modifier = Modifier.height(24.dp))

                    // Dynamic QR Code Section
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        color = MaterialTheme.colorScheme.surface,
                        shadowElevation = 0.5.dp
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(20.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "MÃ QR ĐỊNH DANH",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    letterSpacing = 1.sp,
                                    fontWeight = FontWeight.Bold
                                ),
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(14.dp))

                            QRCodeImage(
                                content = state.qrToken,
                                size = 180.dp,
                                showMaskedToken = true
                            )

                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = "Chạm vào mã QR để phóng to khi qua cổng kiểm soát",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Card Actions
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        OutlinedButton(
                            onClick = { viewModel.rotateQr() },
                            enabled = !state.isRotating && cardStatus == "active",
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            if (state.isRotating) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                            } else {
                                Icon(Icons.Outlined.Refresh, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Đổi mã QR", fontSize = 13.sp)
                            }
                        }

                        Button(
                            onClick = { showConfirmLostDialog = true },
                            enabled = !state.isMarkingLost && cardStatus == "active",
                            colors = ButtonDefaults.buttonColors(containerColor = ErrorRed),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            if (state.isMarkingLost) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(16.dp),
                                    strokeWidth = 2.dp,
                                    color = Color.White
                                )
                            } else {
                                Icon(Icons.Outlined.ReportProblem, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Báo mất thẻ", fontSize = 13.sp)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Notice card about locking/unlocking policy
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.Top
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.Info,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = "Lưu ý: Sau khi báo mất hoặc thẻ bị khóa, mọi giao dịch và quyền vào cổng sẽ tạm dừng. Vui lòng liên hệ phòng Công tác sinh viên hoặc Quản trị viên để được mở khóa hoặc cấp thẻ mới.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(28.dp))
                }
            }

            // Confirm Dialog for Mark Card Lost
            if (showConfirmLostDialog) {
                ConfirmSheet(
                    title = "Xác nhận báo mất thẻ?",
                    message = "Sau khi xác nhận, thẻ số SmartPass của bạn sẽ bị khóa ngay lập tức để bảo vệ số dư và danh tính. Bạn cần liên hệ Quản trị viên để mở khóa lại.",
                    confirmLabel = "Xác nhận báo mất",
                    confirmColor = ErrorRed,
                    onConfirm = {
                        showConfirmLostDialog = false
                        viewModel.markCardLost()
                    },
                    onDismiss = { showConfirmLostDialog = false }
                )
            }
        }
    }
}
