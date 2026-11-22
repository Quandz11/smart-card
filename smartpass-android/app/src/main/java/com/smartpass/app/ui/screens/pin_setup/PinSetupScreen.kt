package com.smartpass.app.ui.screens.pin_setup

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.smartpass.app.ui.components.BankingKeypad
import com.smartpass.app.ui.components.BankingPinDots
import com.smartpass.app.ui.theme.BrandTealPrimary
import com.smartpass.app.ui.theme.ErrorRed

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PinSetupScreen(
    viewModel: PinSetupViewModel,
    onPinSetSuccess: () -> Unit,
    onNavigateBack: (() -> Unit)? = null
) {
    val state by viewModel.uiState.collectAsState()

    var step by remember { mutableIntStateOf(1) } // 1: Enter PIN, 2: Confirm PIN
    var pinFirst by remember { mutableStateOf("") }
    var pinConfirm by remember { mutableStateOf("") }
    var localError by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(state) {
        if (state is PinSetupUiState.Success) {
            onPinSetSuccess()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Bảo Mật Mã PIN Ví", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    if (onNavigateBack != null) {
                        IconButton(onClick = onNavigateBack) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 24.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Spacer(modifier = Modifier.height(16.dp))

                // Security Shield Icon with Glowing Aura
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .clip(CircleShape)
                        .background(BrandTealPrimary.copy(alpha = 0.12f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Shield,
                        contentDescription = null,
                        tint = BrandTealPrimary,
                        modifier = Modifier.size(38.dp)
                    )
                }

                Spacer(modifier = Modifier.height(18.dp))

                // Step Indicator Pills
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .width(36.dp)
                            .height(6.dp)
                            .clip(RoundedCornerShape(3.dp))
                            .background(BrandTealPrimary)
                    )
                    Box(
                        modifier = Modifier
                            .width(36.dp)
                            .height(6.dp)
                            .clip(RoundedCornerShape(3.dp))
                            .background(if (step >= 2) BrandTealPrimary else MaterialTheme.colorScheme.outlineVariant)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                AnimatedContent(
                    targetState = step,
                    label = "stepTitleAnimation"
                ) { currentStep ->
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = if (currentStep == 1) "Thiết lập mã PIN mới (6 số)" else "Xác nhận lại mã PIN",
                            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = if (currentStep == 1)
                                "Mã PIN được yêu cầu mỗi khi thanh toán tại Căn tin và bảo vệ số dư tài khoản của bạn."
                            else
                                "Vui lòng nhập lại chính xác 6 số vừa tạo để hoàn tất xác thực.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center
                        )
                    }
                }

                Spacer(modifier = Modifier.height(28.dp))

                // 6 Banking PIN Dots
                val currentPin = if (step == 1) pinFirst else pinConfirm
                val hasError = localError != null || state is PinSetupUiState.Error

                BankingPinDots(
                    pin = currentPin,
                    maxDigits = 6,
                    isError = hasError
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Error Message Display
                if (localError != null) {
                    Text(
                        text = localError.orEmpty(),
                        color = ErrorRed,
                        style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Medium),
                        textAlign = TextAlign.Center
                    )
                } else if (state is PinSetupUiState.Error) {
                    Text(
                        text = (state as PinSetupUiState.Error).message,
                        color = ErrorRed,
                        style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Medium),
                        textAlign = TextAlign.Center
                    )
                } else if (state is PinSetupUiState.Loading) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp), color = BrandTealPrimary, strokeWidth = 2.dp)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Đang mã hóa & kích hoạt mã PIN...", style = MaterialTheme.typography.bodySmall, color = BrandTealPrimary)
                    }
                } else {
                    Spacer(modifier = Modifier.height(20.dp))
                }
            }

            // Bottom Banking Keypad
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                if (step == 2) {
                    TextButton(
                        onClick = {
                            step = 1
                            pinFirst = ""
                            pinConfirm = ""
                            localError = null
                        }
                    ) {
                        Text("Đặt lại từ bước 1", color = BrandTealPrimary, fontWeight = FontWeight.SemiBold)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                }

                BankingKeypad(
                    onDigitClick = { digit ->
                        localError = null
                        if (state !is PinSetupUiState.Loading) {
                            if (step == 1) {
                                if (pinFirst.length < 6) {
                                    val nextPin = pinFirst + digit
                                    pinFirst = nextPin
                                    if (nextPin.length == 6) {
                                        // Simple Denylist validation early check
                                        if (nextPin in listOf("000000", "123456", "111111", "654321")) {
                                            localError = "Vui lòng không sử dụng mã PIN quá đơn giản (như 123456, 000000)"
                                            pinFirst = ""
                                        } else {
                                            // Proceed to Step 2
                                            step = 2
                                        }
                                    }
                                }
                            } else {
                                if (pinConfirm.length < 6) {
                                    val nextConfirm = pinConfirm + digit
                                    pinConfirm = nextConfirm
                                    if (nextConfirm.length == 6) {
                                        if (nextConfirm == pinFirst) {
                                            viewModel.setupPin(pinFirst, nextConfirm)
                                        } else {
                                            localError = "Mã PIN xác nhận không khớp. Vui lòng nhập lại từ đầu!"
                                            pinFirst = ""
                                            pinConfirm = ""
                                            step = 1
                                        }
                                    }
                                }
                            }
                        }
                    },
                    onDeleteClick = {
                        localError = null
                        if (state !is PinSetupUiState.Loading) {
                            if (step == 1) {
                                if (pinFirst.isNotEmpty()) pinFirst = pinFirst.dropLast(1)
                            } else {
                                if (pinConfirm.isNotEmpty()) {
                                    pinConfirm = pinConfirm.dropLast(1)
                                } else {
                                    // Back to step 1
                                    step = 1
                                    pinFirst = pinFirst.dropLast(1)
                                }
                            }
                        }
                    }
                )
            }
        }
    }
}
