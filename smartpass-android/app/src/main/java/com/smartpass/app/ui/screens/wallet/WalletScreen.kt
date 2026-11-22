package com.smartpass.app.ui.screens.wallet

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.AddCard
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.smartpass.app.core.format.Format
import com.smartpass.app.ui.components.*
import com.smartpass.app.ui.labels.Labels
import com.smartpass.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WalletScreen(
    viewModel: WalletViewModel,
    onNavigateBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    var showTopupDialog by remember { mutableStateOf(false) }
    var selectedAmount by remember { mutableStateOf(50000L) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Ví & Căn Tin",
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
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when {
                state.isLoading -> LoadingView(message = "Đang tải dữ liệu ví căng tin...")
                state.error != null -> ErrorView(
                    message = state.error ?: "Đã xảy ra lỗi",
                    onRetry = { viewModel.loadWalletData() }
                )
                else -> {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 20.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Big Balance Card
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(20.dp))
                                    .background(
                                        Brush.horizontalGradient(
                                            listOf(BrandTealPrimary, Color(0xFF0D9488))
                                        )
                                    )
                                    .padding(24.dp)
                            ) {
                                Column {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = "SỐ DƯ KHẢ DỤNG",
                                            style = MaterialTheme.typography.labelSmall.copy(
                                                letterSpacing = 1.sp,
                                                fontWeight = FontWeight.Bold
                                            ),
                                            color = Color.White.copy(alpha = 0.8f)
                                        )
                                        Icon(
                                            imageVector = Icons.Default.AccountBalanceWallet,
                                            contentDescription = null,
                                            tint = Color.White.copy(alpha = 0.85f),
                                            modifier = Modifier.size(24.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(10.dp))
                                    MoneyText(
                                        amount = state.wallet?.balance ?: 0L,
                                        fontSize = 32.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Text(
                                        text = "Sử dụng mã QR hoặc NFC để thanh toán tại căng tin",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = Color.White.copy(alpha = 0.75f)
                                    )
                                }
                            }
                        }

                        // Online VNPay Topup Button
                        item {
                            Button(
                                onClick = { showTopupDialog = true },
                                colors = ButtonDefaults.buttonColors(containerColor = BrandTeal),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(48.dp)
                            ) {
                                Icon(Icons.Default.AddCard, contentDescription = null, modifier = Modifier.size(20.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Nạp tiền trực tuyến (VNPay Sandbox)", fontWeight = FontWeight.SemiBold)
                            }
                        }

                        // Honest Topup Notice Card
                        item {
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
                                        text = "Bạn có thể tự nạp tiền online bằng tài khoản demo VNPay, hoặc nạp trực tiếp bằng tiền mặt tại quầy căn tin.",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }

                        // Transactions List Header
                        item {
                            Text(
                                text = "Lịch sử giao dịch (${state.transactions.size})",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }

                        if (state.transactions.isEmpty()) {
                            item {
                                Surface(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(14.dp),
                                    color = MaterialTheme.colorScheme.surface,
                                    shadowElevation = 0.5.dp
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(32.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = Labels.Empty.WALLET,
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                        } else {
                            items(state.transactions, key = { it._id }) { tx ->
                                TransactionItem(tx = tx)
                            }
                        }

                        item { Spacer(modifier = Modifier.height(20.dp)) }
                    }
                }
            }
        }

        if (showTopupDialog) {
            val quickAmounts = listOf(20000L, 50000L, 100000L, 200000L)
            AlertDialog(
                onDismissRequest = { if (!state.isCreatingVnpay) showTopupDialog = false },
                title = { Text("Nạp tiền ví SmartPass qua VNPay", fontWeight = FontWeight.Bold) },
                text = {
                    Column {
                        Text(
                            text = "Chọn mệnh giá nạp (Cổng Sandbox test):",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(16.dp))

                        quickAmounts.chunked(2).forEach { row ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                row.forEach { amt ->
                                    val isSelected = selectedAmount == amt
                                    OutlinedButton(
                                        onClick = { selectedAmount = amt },
                                        colors = ButtonDefaults.outlinedButtonColors(
                                            containerColor = if (isSelected) BrandTeal.copy(alpha = 0.15f) else Color.Transparent
                                        ),
                                        border = androidx.compose.foundation.BorderStroke(
                                            width = if (isSelected) 2.dp else 1.dp,
                                            color = if (isSelected) BrandTeal else MaterialTheme.colorScheme.outline
                                        ),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Text(
                                            text = Format.formatVND(amt),
                                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                            color = if (isSelected) BrandTeal else MaterialTheme.colorScheme.onSurface
                                        )
                                    }
                                }
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                        }
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            viewModel.createVnpayOrder(selectedAmount) { paymentUrl ->
                                showTopupDialog = false
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(paymentUrl))
                                context.startActivity(intent)
                            }
                        },
                        enabled = !state.isCreatingVnpay,
                        colors = ButtonDefaults.buttonColors(containerColor = BrandTeal)
                    ) {
                        if (state.isCreatingVnpay) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(18.dp))
                        } else {
                            Text("Mở cổng VNPay (${Format.formatVND(selectedAmount)})")
                        }
                    }
                },
                dismissButton = {
                    TextButton(
                        onClick = { showTopupDialog = false },
                        enabled = !state.isCreatingVnpay
                    ) {
                        Text("Hủy")
                    }
                }
            )
        }
    }
}
