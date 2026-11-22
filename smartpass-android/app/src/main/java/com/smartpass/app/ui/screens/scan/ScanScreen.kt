package com.smartpass.app.ui.screens.scan

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.smartpass.app.core.format.Format
import com.smartpass.app.ui.components.*
import com.smartpass.app.ui.labels.Labels
import com.smartpass.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScanScreen(
    viewModel: ScanViewModel,
    onNavigateBack: () -> Unit,
    onNavigateToEmergency: (String) -> Unit,
    onNavigateToRoomBooking: ((String) -> Unit)? = null
) {
    val state by viewModel.scanState.collectAsState()
    val isConfirming by viewModel.isConfirming.collectAsState()

    var torchEnabled by remember { mutableStateOf(false) }
    var showManualInputSheet by remember { mutableStateOf(false) }
    var manualCodeInput by remember { mutableStateOf("") }
    var showConfirmSheet by remember { mutableStateOf(false) }

    LaunchedEffect(state) {
        if (state is ScanResultState.EmergencyQrDetected) {
            val token = (state as ScanResultState.EmergencyQrDetected).qrToken
            viewModel.reset()
            onNavigateToEmergency(token)
        } else if (state is ScanResultState.ServiceResolved) {
            showConfirmSheet = true
        } else if (state is ScanResultState.ActionSuccess || state is ScanResultState.Error) {
            showConfirmSheet = false
        }
    }

    val isScanningEnabled = state is ScanResultState.Idle && !showConfirmSheet && !showManualInputSheet

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        // 1. Full-screen Camera Viewfinder
        CameraViewfinder(
            onBarcodeScanned = { rawCode ->
                viewModel.onQrScanned(rawCode)
            },
            torchEnabled = torchEnabled,
            isScanningEnabled = isScanningEnabled,
            modifier = Modifier.fillMaxSize()
        )

        // 2. High-Tech Banking Reticle & Animated Laser
        ScannerReticle(
            boxSize = 260.dp,
            laserColor = BrandTealPrimaryDark,
            cornerColor = BrandTealPrimaryDark,
            scrimColor = Color(0x88000000),
            modifier = Modifier.fillMaxSize()
        )

        // 3. Top Floating Glassy Action Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Circular Glass Back Button
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(Color.Black.copy(alpha = 0.5f))
                    .border(1.dp, Color.White.copy(alpha = 0.15f), CircleShape)
                    .clickable { onNavigateBack() },
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Quay lại",
                    tint = Color.White,
                    modifier = Modifier.size(22.dp)
                )
            }

            // Title Pill
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = Color.Black.copy(alpha = 0.45f),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.15f))
            ) {
                Text(
                    text = "Quét mã SmartPass",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = Color.White,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                )
            }

            // Circular Glass Flashlight Button
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(if (torchEnabled) BrandTealPrimary else Color.Black.copy(alpha = 0.5f))
                    .border(
                        1.dp,
                        if (torchEnabled) BrandTealPrimaryDark else Color.White.copy(alpha = 0.15f),
                        CircleShape
                    )
                    .clickable { torchEnabled = !torchEnabled },
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = if (torchEnabled) Icons.Default.FlashOn else Icons.Default.FlashOff,
                    contentDescription = "Bật/Tắt đèn flash",
                    tint = if (torchEnabled) Color.White else Color.White.copy(alpha = 0.8f),
                    modifier = Modifier.size(22.dp)
                )
            }
        }

        // 4. Instructional Frosted Box Under Reticle
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .navigationBarsPadding()
                .padding(bottom = 36.dp, start = 20.dp, end = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Instruction Glass Pill
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = Color.Black.copy(alpha = 0.6f),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.12f))
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 18.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.QrCodeScanner,
                        contentDescription = null,
                        tint = BrandTealPrimaryDark,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Căn chỉnh mã QR vào giữa khung ngắm",
                        style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Medium),
                        color = Color.White
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Service Quick Badges
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                val tags = listOf("Căn tin", "Điểm danh", "Thư viện", "Gửi xe", "Cổng")
                tags.forEach { tag ->
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = Color.White.copy(alpha = 0.12f)
                    ) {
                        Text(
                            text = tag,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color.White.copy(alpha = 0.85f),
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Manual Code Input Trigger Button
            Button(
                onClick = { showManualInputSheet = true },
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.White.copy(alpha = 0.2f),
                    contentColor = Color.White
                ),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .border(1.dp, Color.White.copy(alpha = 0.25f), RoundedCornerShape(16.dp))
            ) {
                Icon(Icons.Default.Keyboard, contentDescription = null, modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Nhập mã thẻ / QR thủ công", fontWeight = FontWeight.SemiBold)
            }
        }

        // Loading Overlay
        if (state is ScanResultState.Loading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.6f)),
                contentAlignment = Alignment.Center
            ) {
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = MaterialTheme.colorScheme.surface,
                    modifier = Modifier.padding(32.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(28.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        CircularProgressIndicator(color = BrandTealPrimary, strokeWidth = 3.dp)
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Đang phân giải mã QR...",
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold)
                        )
                    }
                }
            }
        }

        // Action Success Modal / Dialog
        if (state is ScanResultState.ActionSuccess) {
            val s = state as ScanResultState.ActionSuccess
            AlertDialog(
                onDismissRequest = { viewModel.reset() },
                confirmButton = {
                    Button(
                        onClick = { viewModel.reset() },
                        colors = ButtonDefaults.buttonColors(containerColor = BrandTealPrimary),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Xác nhận & Quét tiếp", fontWeight = FontWeight.Bold)
                    }
                },
                icon = {
                    Box(
                        modifier = Modifier
                            .size(60.dp)
                            .clip(CircleShape)
                            .background((if (s.duplicate) WarningAmber else SuccessGreen).copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = if (s.duplicate) Icons.Outlined.Info else Icons.Filled.CheckCircle,
                            contentDescription = null,
                            tint = if (s.duplicate) WarningAmber else SuccessGreen,
                            modifier = Modifier.size(36.dp)
                        )
                    }
                },
                title = {
                    Text(
                        text = if (s.duplicate) "Đã ghi nhận trước đó" else "Giao dịch thành công!",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        textAlign = TextAlign.Center
                    )
                },
                text = {
                    Text(
                        text = s.message,
                        style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                },
                shape = RoundedCornerShape(20.dp)
            )
        }

        // Error Dialog
        if (state is ScanResultState.Error) {
            val s = state as ScanResultState.Error
            AlertDialog(
                onDismissRequest = { viewModel.reset() },
                confirmButton = {
                    Button(
                        onClick = { viewModel.reset() },
                        colors = ButtonDefaults.buttonColors(containerColor = BrandTealPrimary),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Thử lại", fontWeight = FontWeight.Bold)
                    }
                },
                icon = {
                    Box(
                        modifier = Modifier
                            .size(60.dp)
                            .clip(CircleShape)
                            .background(ErrorRed.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.ErrorOutline,
                            contentDescription = null,
                            tint = ErrorRed,
                            modifier = Modifier.size(36.dp)
                        )
                    }
                },
                title = {
                    Text(
                        text = "Không thể thực hiện",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        textAlign = TextAlign.Center
                    )
                },
                text = {
                    Text(
                        text = s.message,
                        style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                },
                shape = RoundedCornerShape(20.dp)
            )
        }

        // Card Verified Result Sheet
        if (state is ScanResultState.CardVerified) {
            val s = state as ScanResultState.CardVerified
            val card = s.data.card
            val owner = s.data.owner
            val (statusColor, containerColor) = Labels.getCardStatusColor(card.status)

            ModalBottomSheet(
                onDismissRequest = { viewModel.reset() },
                containerColor = MaterialTheme.colorScheme.surface,
                shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp)
                        .padding(bottom = 32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .clip(CircleShape)
                            .background(BrandTealPrimary.copy(alpha = 0.12f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.CreditCard,
                            contentDescription = null,
                            tint = BrandTealPrimary,
                            modifier = Modifier.size(30.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = "Xác Thực Thẻ Sinh Viên",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(18.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = owner?.fullName ?: "Chưa cập nhật",
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                                )
                                StatusChip(
                                    text = Labels.getCardStatusLabel(card.status),
                                    textColor = statusColor,
                                    containerColor = containerColor
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "Mã SV: ${owner?.studentCode ?: "N/A"} • Lớp: ${owner?.className ?: "N/A"}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Mã thẻ số", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text(card.cardCode, style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold))
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Hạn sử dụng", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text(Format.formatDate(card.expiresAt), style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold))
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    Button(
                        onClick = { viewModel.reset() },
                        colors = ButtonDefaults.buttonColors(containerColor = BrandTealPrimary),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Hoàn tất", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    // Manual Input Bottom Sheet
    if (showManualInputSheet) {
        ModalBottomSheet(
            onDismissRequest = { showManualInputSheet = false },
            containerColor = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp)
                    .padding(bottom = 32.dp)
            ) {
                Text(
                    text = "Nhập mã dịch vụ thủ công",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Nhập mã định danh in trên mã QR (thẻ, sách, cổng, phòng...)",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(20.dp))

                OutlinedTextField(
                    value = manualCodeInput,
                    onValueChange = { manualCodeInput = it },
                    label = { Text("Mã QR / Card Code / Public ID") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp)
                )

                Spacer(modifier = Modifier.height(24.dp))

                Button(
                    onClick = {
                        if (manualCodeInput.isNotBlank()) {
                            val code = manualCodeInput.trim()
                            manualCodeInput = ""
                            showManualInputSheet = false
                            viewModel.onQrScanned(code)
                        }
                    },
                    enabled = manualCodeInput.isNotBlank(),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = BrandTealPrimary),
                    modifier = Modifier.fillMaxWidth().height(50.dp)
                ) {
                    Text("Kiểm tra mã", fontWeight = FontWeight.Bold)
                }
            }
        }
    }

    // Banking Transaction Confirmation BottomSheet
    if (showConfirmSheet && state is ScanResultState.ServiceResolved) {
        val resolved = (state as ScanResultState.ServiceResolved).result
        val summary = resolved.summary

        ModalBottomSheet(
            onDismissRequest = {
                showConfirmSheet = false
                viewModel.reset()
            },
            sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
            containerColor = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp)
                    .padding(bottom = 32.dp)
                    .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Header Badge
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = BrandTealPrimary.copy(alpha = 0.1f)
                ) {
                    Text(
                        text = resolved.type,
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                        color = BrandTealPrimary,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = resolved.label,
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurface,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Specific Action Flow
                when (resolved.nextAction) {
                    "wallet_pay" -> {
                        val counter = summary["counter"] as? String ?: summary["counterLabel"] as? String ?: "Quầy Căn tin"
                        val dynamicAmount = (summary["amount"] as? Number)?.toLong()
                        var inputAmount by remember { mutableStateOf(dynamicAmount?.toString() ?: "25000") }
                        var pinInput by remember { mutableStateOf("") }

                        val finalAmount = dynamicAmount ?: inputAmount.toLongOrNull() ?: 0L

                        // Large Banking Amount
                        Text(
                            text = Format.formatVND(finalAmount),
                            fontSize = 34.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = BrandTealPrimary
                        )
                        Text(
                            text = "Thanh toán Căn tin SmartPass",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Spacer(modifier = Modifier.height(20.dp))

                        // Receipt Details Card
                        Surface(
                            shape = RoundedCornerShape(18.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(18.dp)) {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("Địa điểm", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    Text(counter, style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold))
                                }
                                if (dynamicAmount == null) {
                                    Spacer(modifier = Modifier.height(12.dp))
                                    OutlinedTextField(
                                        value = inputAmount,
                                        onValueChange = { inputAmount = it.filter { c -> c.isDigit() } },
                                        label = { Text("Nhập số tiền (VNĐ)") },
                                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(12.dp)
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        // Banking PIN Dots Input
                        Text(
                            text = "Nhập mã PIN ví (6 chữ số) để xác nhận",
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        BankingPinDots(pin = pinInput, maxDigits = 6)

                        Spacer(modifier = Modifier.height(20.dp))

                        // Banking Keypad
                        BankingKeypad(
                            onDigitClick = { if (pinInput.length < 6) pinInput += it },
                            onDeleteClick = { if (pinInput.isNotEmpty()) pinInput = pinInput.dropLast(1) }
                        )

                        Spacer(modifier = Modifier.height(24.dp))

                        // Action Buttons
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            OutlinedButton(
                                onClick = {
                                    showConfirmSheet = false
                                    viewModel.reset()
                                },
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.weight(1f).height(50.dp)
                            ) {
                                Text("Hủy bỏ")
                            }
                            Button(
                                onClick = {
                                    val nonce = summary["nonce"] as? String
                                    viewModel.confirmWalletPay(finalAmount, nonce, pinInput)
                                },
                                enabled = !isConfirming && pinInput.length == 6 && finalAmount > 0,
                                colors = ButtonDefaults.buttonColors(containerColor = BrandTealPrimary),
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.weight(1.5f).height(50.dp)
                            ) {
                                if (isConfirming) CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White)
                                else Text("Xác nhận thanh toán", fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    "library_borrow" -> {
                        val bookCode = summary["bookCode"] as? String ?: ""
                        val bookTitle = summary["bookTitle"] as? String ?: resolved.label
                        val copiesAvailable = (summary["copiesAvailable"] as? Number)?.toInt() ?: 0
                        val hasActiveLoan = summary["hasActiveLoan"] as? Boolean ?: false

                        Surface(
                            shape = RoundedCornerShape(18.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(18.dp)) {
                                Text(bookTitle, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                                Spacer(modifier = Modifier.height(6.dp))
                                Text("Mã sách: $bookCode", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text("Số bản còn trong kho: $copiesAvailable", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text("Thời hạn mượn: 14 ngày", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }

                        if (hasActiveLoan) {
                            Spacer(modifier = Modifier.height(10.dp))
                            Text("Bạn đang có một lượt mượn cuốn sách này.", color = BrandTealPrimary, style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold))
                        }

                        Spacer(modifier = Modifier.height(28.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            OutlinedButton(
                                onClick = { showConfirmSheet = false; viewModel.reset() },
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.weight(1f).height(50.dp)
                            ) { Text("Đóng") }

                            Button(
                                onClick = { viewModel.confirmLibraryBorrow(bookCode, bookTitle) },
                                enabled = !isConfirming && copiesAvailable > 0 && !hasActiveLoan,
                                colors = ButtonDefaults.buttonColors(containerColor = BrandTealPrimary),
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.weight(1.5f).height(50.dp)
                            ) {
                                if (isConfirming) CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White)
                                else Text("Xác nhận mượn sách", fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    "parking_toggle" -> {
                        val direction = summary["direction"] as? String ?: "in"
                        val hasOpenSession = summary["hasOpenSession"] as? Boolean ?: false
                        val fee = (summary["fee"] as? Number)?.toLong() ?: 0L
                        val parkedMinutes = (summary["parkedMinutes"] as? Number)?.toInt() ?: 0

                        if (direction == "out" || hasOpenSession) {
                            Text(
                                text = Format.formatVND(fee),
                                fontSize = 34.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = BrandTealPrimary
                            )
                            Text("Phí gửi xe lượt ra (2.000 ₫/giờ)", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Surface(
                            shape = RoundedCornerShape(18.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(18.dp)) {
                                if (direction == "out" || hasOpenSession) {
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text("Thời gian đỗ", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        Text("$parkedMinutes phút", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold))
                                    }
                                } else {
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text("Cổng check-in", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        Text(summary["gateLabel"]?.toString() ?: resolved.label, style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold))
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(28.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            OutlinedButton(
                                onClick = { showConfirmSheet = false; viewModel.reset() },
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.weight(1f).height(50.dp)
                            ) { Text("Hủy") }

                            Button(
                                onClick = {
                                    if (direction == "out" || hasOpenSession) viewModel.confirmParkingOut(fee)
                                    else viewModel.confirmParkingIn()
                                },
                                enabled = !isConfirming,
                                colors = ButtonDefaults.buttonColors(containerColor = BrandTealPrimary),
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.weight(1.5f).height(50.dp)
                            ) {
                                if (isConfirming) CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White)
                                else Text(if (direction == "out" || hasOpenSession) "Xác nhận ra bãi" else "Xác nhận gửi xe", fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    "attendance_check" -> {
                        val subject = summary["subject"] as? String ?: ""
                        val teacher = summary["teacher"] as? String ?: ""
                        val className = summary["className"] as? String ?: ""
                        val classSession = summary["classSession"] as? String ?: ""

                        Surface(
                            shape = RoundedCornerShape(18.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(18.dp)) {
                                Text(subject, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                                Spacer(modifier = Modifier.height(6.dp))
                                Text("Lớp học: $className", style = MaterialTheme.typography.bodyMedium)
                                Text("Giảng viên: $teacher", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text("Mã ca: $classSession", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }

                        Spacer(modifier = Modifier.height(28.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            OutlinedButton(
                                onClick = { showConfirmSheet = false; viewModel.reset() },
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.weight(1f).height(50.dp)
                            ) { Text("Hủy") }

                            Button(
                                onClick = { viewModel.confirmAttendance(classSession, subject) },
                                enabled = !isConfirming,
                                colors = ButtonDefaults.buttonColors(containerColor = BrandTealPrimary),
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.weight(1.5f).height(50.dp)
                            ) {
                                if (isConfirming) CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White)
                                else Text("Xác nhận có mặt", fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    "room_detail" -> {
                        val roomName = summary["room"] as? String ?: resolved.label
                        val location = summary["location"] as? String ?: ""

                        Surface(
                            shape = RoundedCornerShape(18.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(18.dp)) {
                                Text(roomName, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold))
                                if (location.isNotBlank()) {
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(location, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(28.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            OutlinedButton(
                                onClick = { showConfirmSheet = false; viewModel.reset() },
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.weight(1f).height(50.dp)
                            ) { Text("Đóng") }

                            Button(
                                onClick = {
                                    showConfirmSheet = false
                                    viewModel.reset()
                                    onNavigateToRoomBooking?.invoke(roomName)
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = BrandTealPrimary),
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.weight(1.5f).height(50.dp)
                            ) {
                                Icon(Icons.Default.MeetingRoom, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Đặt phòng này", fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    "event_detail" -> {
                        val eventId = summary["eventId"] as? String ?: ""
                        val title = summary["title"] as? String ?: resolved.label
                        val seatsLeft = (summary["seatsLeft"] as? Number)?.toInt() ?: 0
                        val isRegistered = summary["isRegistered"] as? Boolean ?: false
                        val isDynamic = summary["isDynamicCheckIn"] as? Boolean ?: false

                        Surface(
                            shape = RoundedCornerShape(18.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(18.dp)) {
                                Text(title, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                                Spacer(modifier = Modifier.height(6.dp))
                                Text("Số chỗ còn lại: $seatsLeft", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }

                        Spacer(modifier = Modifier.height(28.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            OutlinedButton(
                                onClick = { showConfirmSheet = false; viewModel.reset() },
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.weight(1f).height(50.dp)
                            ) { Text("Hủy") }

                            Button(
                                onClick = {
                                    if (isDynamic) viewModel.confirmEventCheckin(eventId)
                                    else viewModel.confirmEventRegister(eventId)
                                },
                                enabled = !isConfirming,
                                colors = ButtonDefaults.buttonColors(containerColor = BrandTealPrimary),
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.weight(1.5f).height(50.dp)
                            ) {
                                if (isConfirming) CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White)
                                else Text(if (isDynamic) "Xác nhận điểm danh" else if (isRegistered) "Đã đăng ký" else "Đăng ký tham gia", fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    "gate_toggle" -> {
                        val gateId = summary["gateId"] as? String
                        val direction = summary["direction"] as? String ?: "in"
                        val dirText = if (direction == "in") "VÀO TRƯỜNG" else "RA TRƯỜNG"

                        Surface(
                            shape = RoundedCornerShape(18.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(18.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("Xác nhận thông tin ra vào cổng", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(dirText, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold, color = BrandTealPrimary))
                                Text(resolved.label, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }

                        Spacer(modifier = Modifier.height(28.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            OutlinedButton(
                                onClick = { showConfirmSheet = false; viewModel.reset() },
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.weight(1f).height(50.dp)
                            ) { Text("Hủy") }

                            Button(
                                onClick = { viewModel.confirmGatePass(gateId, direction) },
                                enabled = !isConfirming,
                                colors = ButtonDefaults.buttonColors(containerColor = BrandTealPrimary),
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.weight(1.5f).height(50.dp)
                            ) {
                                if (isConfirming) CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White)
                                else Text("Xác nhận qua cổng", fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    else -> {
                        Text("Chi tiết: ${resolved.label}")
                        Spacer(modifier = Modifier.height(20.dp))
                        Button(
                            onClick = { showConfirmSheet = false; viewModel.reset() },
                            colors = ButtonDefaults.buttonColors(containerColor = BrandTealPrimary),
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.fillMaxWidth().height(50.dp)
                        ) {
                            Text("Đóng")
                        }
                    }
                }
            }
        }
    }
}
