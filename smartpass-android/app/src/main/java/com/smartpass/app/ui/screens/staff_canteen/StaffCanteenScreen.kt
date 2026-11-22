package com.smartpass.app.ui.screens.staff_canteen

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.smartpass.app.core.format.Format
import com.smartpass.app.data.model.DynamicQrResponse
import com.smartpass.app.ui.components.*
import com.smartpass.app.ui.labels.Labels
import com.smartpass.app.ui.theme.*
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StaffCanteenScreen(
    viewModel: StaffCanteenViewModel,
    onNavigateBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val tabs = listOf("Thanh toán", "Nạp tiền", "Lịch sử")

    var cardOrToken by remember { mutableStateOf("") }
    var amountText by remember { mutableStateOf("") }
    var pinText by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }
    var activeDynamicQr by remember { mutableStateOf<DynamicQrResponse?>(null) }
    var showQrDialog by remember { mutableStateOf(false) }

    val quickAmounts = listOf(10000.0, 20000.0, 30000.0, 50000.0, 100000.0, 200000.0)

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Thu Ngân Căng Tin",
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
        ) {
            PrimaryTabRow(
                selectedTabIndex = state.selectedTab,
                containerColor = MaterialTheme.colorScheme.background
            ) {
                tabs.forEachIndexed { index, title ->
                    Tab(
                        selected = state.selectedTab == index,
                        onClick = { viewModel.selectTab(index) },
                        text = { Text(title, style = MaterialTheme.typography.titleSmall) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Feedback banners
            state.successMessage?.let { msg ->
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 4.dp),
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
                        .padding(horizontal = 20.dp, vertical = 4.dp),
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

            when (state.selectedTab) {
                0, 1 -> { // 0: Thanh toán, 1: Nạp tiền
                    val isPay = state.selectedTab == 0
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 20.dp)
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = MaterialTheme.colorScheme.surface,
                            shadowElevation = 0.5.dp,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(18.dp)) {
                                Text(
                                    text = if (isPay) "Thanh toán suất ăn / đồ uống" else "Nạp tiền vào tài khoản sinh viên",
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                                )
                                Spacer(modifier = Modifier.height(12.dp))

                                OutlinedTextField(
                                    value = cardOrToken,
                                    onValueChange = { cardOrToken = it },
                                    label = { Text("Mã sinh viên / QR Token / Card Code") },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp)
                                )
                                Spacer(modifier = Modifier.height(10.dp))

                                OutlinedTextField(
                                    value = amountText,
                                    onValueChange = { amountText = it },
                                    label = { Text("Số tiền (VNĐ)") },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp)
                                )
                                Spacer(modifier = Modifier.height(8.dp))

                                // Quick amount chips
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    quickAmounts.take(3).forEach { amt ->
                                        OutlinedButton(
                                            onClick = { amountText = amt.toLong().toString() },
                                            modifier = Modifier.weight(1f),
                                            contentPadding = PaddingValues(horizontal = 4.dp, vertical = 2.dp)
                                        ) {
                                            Text(Format.formatVND(amt), fontSize = 11.sp)
                                        }
                                    }
                                }
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    quickAmounts.drop(3).forEach { amt ->
                                        OutlinedButton(
                                            onClick = { amountText = amt.toLong().toString() },
                                            modifier = Modifier.weight(1f),
                                            contentPadding = PaddingValues(horizontal = 4.dp, vertical = 2.dp)
                                        ) {
                                            Text(Format.formatVND(amt), fontSize = 11.sp)
                                        }
                                    }
                                }

                                if (isPay) {
                                    Spacer(modifier = Modifier.height(10.dp))
                                    OutlinedTextField(
                                        value = note,
                                        onValueChange = { note = it },
                                        label = { Text("Ghi chú (ví dụ: Suất trưa, Cơm tấm)") },
                                        singleLine = true,
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(12.dp)
                                    )
                                }

                                Spacer(modifier = Modifier.height(10.dp))

                                OutlinedTextField(
                                    value = pinText,
                                    onValueChange = { if (it.length <= 6 && it.all { c -> c.isDigit() }) pinText = it },
                                    label = { Text(if (isPay) "Mã PIN học sinh (6 số)" else "PIN của nhân viên (6 số)") },
                                    visualTransformation = androidx.compose.ui.text.input.PasswordVisualTransformation(),
                                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = androidx.compose.ui.text.input.KeyboardType.NumberPassword),
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp)
                                )

                                Spacer(modifier = Modifier.height(16.dp))

                                Button(
                                    onClick = {
                                        val amt = amountText.toLongOrNull() ?: 0L
                                        if (isPay) {
                                            viewModel.pay(cardOrToken.trim(), amt, pinText.trim(), note.trim())
                                        } else {
                                            viewModel.topUp(cardOrToken.trim(), amt, pinText.trim())
                                        }
                                    },
                                    enabled = cardOrToken.isNotBlank() && (amountText.toLongOrNull() ?: 0L) > 0L && pinText.length == 6,
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = if (isPay) MaterialTheme.colorScheme.primary else SuccessGreen
                                    )
                                ) {
                                    Text(if (isPay) "Thực hiện thanh toán" else "Thực hiện nạp tiền")
                                }

                                if (isPay) {
                                    Spacer(modifier = Modifier.height(10.dp))
                                    OutlinedButton(
                                        onClick = {
                                            val amt = amountText.toLongOrNull() ?: 25000L
                                            viewModel.generatePaymentRequest(amt, "Quầy 1") { dynamic ->
                                                activeDynamicQr = dynamic
                                                showQrDialog = true
                                            }
                                        },
                                        enabled = (amountText.toLongOrNull() ?: 0L) > 0L,
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(12.dp)
                                    ) {
                                        Icon(Icons.Outlined.QrCode, contentDescription = null, modifier = Modifier.size(18.dp), tint = BrandTeal)
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text("Tạo mã QR thanh toán (Mã động 2 phút)", color = BrandTeal)
                                    }
                                }
                            }
                        }

                        // Scanner Integration
                        ScannerOverlay(
                            title = "Quét thẻ sinh viên",
                            instruction = "Đưa mã QR trên ứng dụng SmartPass hoặc chạm thẻ NFC vào máy",
                            onScannedOrEntered = { code ->
                                cardOrToken = code
                            },
                            isScanningEnabled = cardOrToken.isBlank() && !state.isSubmitting
                        )

                        Spacer(modifier = Modifier.height(24.dp))
                    }
                }

                2 -> { // Lịch sử giao dịch toàn hệ thống
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 20.dp)
                    ) {
                        when {
                            state.isSubmitting -> LoadingView(message = "Đang tải lịch sử giao dịch...")
                            state.allTransactions.isEmpty() -> EmptyView(
                                message = Labels.Empty.WALLET,
                                actionLabel = "Tải lại",
                                onAction = { viewModel.loadAllTransactions() }
                            )
                            else -> {
                                LazyColumn(
                                    modifier = Modifier.fillMaxSize(),
                                    verticalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    items(state.allTransactions, key = { it._id }) { tx ->
                                        TransactionItem(tx = tx)
                                    }
                                    item { Spacer(modifier = Modifier.height(24.dp)) }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Dynamic Payment Request Dialog
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
                        text = "Yêu Cầu Thanh Toán",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "${qr.counter ?: "Quầy 1"} • ${Format.formatVND(qr.amount ?: (amountText.toLongOrNull() ?: 0L))}",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold, color = BrandTeal)
                    )

                    Spacer(modifier = Modifier.height(16.dp))

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

                    if (timeLeftSeconds > 0) {
                        val minutes = timeLeftSeconds / 60
                        val seconds = timeLeftSeconds % 60
                        Text(
                            text = "Hết hạn sau: %02d:%02d".format(minutes, seconds),
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold, color = BrandTeal)
                        )
                    } else {
                        Text(
                            text = "Mã QR đã hết hạn! Vui lòng tạo lại.",
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
                                val amt = amountText.toLongOrNull() ?: 25000L
                                viewModel.generatePaymentRequest(amt, "Quầy 1") { newDynamic ->
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

