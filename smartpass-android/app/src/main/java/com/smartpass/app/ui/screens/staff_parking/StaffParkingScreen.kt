package com.smartpass.app.ui.screens.staff_parking

import androidx.compose.foundation.background
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
fun StaffParkingScreen(
    viewModel: StaffParkingViewModel,
    onNavigateBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val tabs = listOf("Xe vào", "Xe ra", "Trong bãi")

    var inCardOrToken by remember { mutableStateOf("") }
    var inPlate by remember { mutableStateOf("") }

    var outCardOrToken by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Kiểm Soát Bãi Xe",
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
                0 -> { // Xe vào (Check-in)
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
                                    text = "Ghi nhận xe vào bãi",
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                OutlinedTextField(
                                    value = inCardOrToken,
                                    onValueChange = { inCardOrToken = it },
                                    label = { Text("Mã sinh viên / QR Token / Card Code") },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp)
                                )
                                Spacer(modifier = Modifier.height(10.dp))
                                OutlinedTextField(
                                    value = inPlate,
                                    onValueChange = { inPlate = it },
                                    label = { Text("Biển số xe (ví dụ: 29A-123.45)") },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp)
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                                Button(
                                    onClick = {
                                        viewModel.checkIn(inCardOrToken.trim(), inPlate.trim())
                                        inCardOrToken = ""
                                        inPlate = ""
                                    },
                                    enabled = inCardOrToken.isNotBlank(),
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                                ) {
                                    Text("Check-in xe vào bãi")
                                }
                            }
                        }

                        ScannerOverlay(
                            title = "Quét thẻ xe vào",
                            instruction = "Quét mã QR hoặc chạm thẻ SmartPass của chủ phương tiện",
                            onScannedOrEntered = { code ->
                                inCardOrToken = code
                            },
                            isScanningEnabled = inCardOrToken.isBlank() && !state.isSubmitting
                        )

                        Spacer(modifier = Modifier.height(24.dp))
                    }
                }

                1 -> { // Xe ra (Check-out)
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
                                    text = "Ghi nhận xe ra khỏi bãi",
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                OutlinedTextField(
                                    value = outCardOrToken,
                                    onValueChange = { outCardOrToken = it },
                                    label = { Text("Mã sinh viên / QR Token / Card Code") },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp)
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                                Button(
                                    onClick = {
                                        viewModel.checkOut(outCardOrToken.trim())
                                        outCardOrToken = ""
                                    },
                                    enabled = outCardOrToken.isNotBlank(),
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                                ) {
                                    Text("Check-out xe ra bãi")
                                }
                            }
                        }

                        // Check-out fee result card
                        state.checkOutResult?.let { res ->
                            Surface(
                                shape = RoundedCornerShape(16.dp),
                                color = MaterialTheme.colorScheme.surface,
                                shadowElevation = 0.5.dp,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(18.dp)) {
                                    Text(
                                        text = "Kết quả Check-out",
                                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(text = "Biển số xe: ${res.vehiclePlate ?: "Không biển"}", style = MaterialTheme.typography.bodyMedium)
                                    Text(text = "Giờ vào: ${Format.formatDateTime(res.checkInAt)}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    Text(text = "Giờ ra: ${Format.formatDateTime(res.checkOutAt)}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(text = "Phí gửi xe:", style = MaterialTheme.typography.titleSmall)
                                        MoneyText(amount = res.fee, fontSize = 18.sp, color = MaterialTheme.colorScheme.primary)
                                    }
                                }
                            }
                        }

                        ScannerOverlay(
                            title = "Quét thẻ xe ra",
                            instruction = "Quét mã QR hoặc chạm thẻ SmartPass để hoàn tất lấy xe",
                            onScannedOrEntered = { code ->
                                outCardOrToken = code
                            },
                            isScanningEnabled = outCardOrToken.isBlank() && !state.isSubmitting
                        )

                        Spacer(modifier = Modifier.height(24.dp))
                    }
                }

                2 -> { // Xe đang trong bãi
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 20.dp)
                    ) {
                        when {
                            state.isSubmitting -> LoadingView(message = "Đang tải danh sách xe trong bãi...")
                            state.activeSessions.isEmpty() -> EmptyView(
                                message = Labels.Empty.STAFF_ACTIVE_PARKING,
                                actionLabel = "Tải lại",
                                onAction = { viewModel.loadActiveSessions() }
                            )
                            else -> {
                                LazyColumn(
                                    modifier = Modifier.fillMaxSize(),
                                    verticalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    items(state.activeSessions, key = { it._id }) { session ->
                                        ParkingSessionItem(session = session)
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
}

