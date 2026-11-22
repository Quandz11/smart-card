package com.smartpass.app.ui.screens.staff_library

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
fun StaffLibraryScreen(
    viewModel: StaffLibraryViewModel,
    onNavigateBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val tabs = listOf("Cho mượn", "Nhận trả", "Đang mượn")

    // Form inputs for Borrow
    var studentCodeOrToken by remember { mutableStateOf("") }
    var bookCode by remember { mutableStateOf("") }
    var bookTitle by remember { mutableStateOf("") }
    var dueDaysText by remember { mutableStateOf("14") }

    // Form input for Return
    var returnBookCode by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Quản Lý Thư Viện",
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
                0 -> { // Cho mượn sách
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
                                    text = "Thông tin mượn sách",
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                OutlinedTextField(
                                    value = studentCodeOrToken,
                                    onValueChange = { studentCodeOrToken = it },
                                    label = { Text("Mã sinh viên / QR Token / Card Code") },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp)
                                )
                                Spacer(modifier = Modifier.height(10.dp))
                                OutlinedTextField(
                                    value = bookCode,
                                    onValueChange = { bookCode = it },
                                    label = { Text("Mã sách (Book Code)") },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp)
                                )
                                Spacer(modifier = Modifier.height(10.dp))
                                OutlinedTextField(
                                    value = bookTitle,
                                    onValueChange = { bookTitle = it },
                                    label = { Text("Tên sách") },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp)
                                )
                                Spacer(modifier = Modifier.height(10.dp))
                                OutlinedTextField(
                                    value = dueDaysText,
                                    onValueChange = { dueDaysText = it },
                                    label = { Text("Số ngày mượn (mặc định: 14)") },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp)
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                                Button(
                                    onClick = {
                                        val days = dueDaysText.toIntOrNull()
                                        viewModel.borrowBook(studentCodeOrToken.trim(), bookCode.trim(), bookTitle.trim(), days)
                                    },
                                    enabled = studentCodeOrToken.isNotBlank() && bookCode.isNotBlank() && bookTitle.isNotBlank(),
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                                ) {
                                    Text("Xác nhận cho mượn sách")
                                }
                            }
                        }

                        // Quick Scanner integration
                        ScannerOverlay(
                            title = "Quét thẻ bạn đọc",
                            instruction = "Đưa mã QR trên thẻ SmartPass của sinh viên vào khung để tự động điền mã",
                            onScannedOrEntered = { code ->
                                studentCodeOrToken = code
                            },
                            isScanningEnabled = studentCodeOrToken.isBlank() && !state.isSubmitting
                        )

                        Spacer(modifier = Modifier.height(24.dp))
                    }
                }

                1 -> { // Nhận trả sách
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
                                    text = "Quét hoặc nhập mã sách trả",
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                OutlinedTextField(
                                    value = returnBookCode,
                                    onValueChange = { returnBookCode = it },
                                    label = { Text("Mã sách trả (Book Code)") },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp)
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                                Button(
                                    onClick = {
                                        viewModel.returnBook(returnBookCode.trim())
                                        returnBookCode = ""
                                    },
                                    enabled = returnBookCode.isNotBlank(),
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                                ) {
                                    Text("Xác nhận nhận trả sách")
                                }
                            }
                        }

                        // Overdue return fine result card
                        state.returnResult?.let { res ->
                            Surface(
                                shape = RoundedCornerShape(16.dp),
                                color = MaterialTheme.colorScheme.surface,
                                shadowElevation = 0.5.dp,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(18.dp)) {
                                    Text(
                                        text = "Chi tiết trả sách",
                                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(text = "Tên sách: ${res.loan.bookTitle}", style = MaterialTheme.typography.bodyMedium)
                                    Text(text = "Mã sách: ${res.loan.bookCode}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    if (res.overdueDays != null && res.overdueDays > 0) {
                                        Spacer(modifier = Modifier.height(6.dp))
                                        Text(text = "Quá hạn: ${res.overdueDays} ngày", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.error)
                                        Text(text = "Tiền phạt: ${Format.formatVND(res.fine ?: 0L)}", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.error)
                                    } else {
                                        Spacer(modifier = Modifier.height(6.dp))
                                        StatusChip(text = "Đúng hạn", textColor = SuccessGreen, containerColor = SuccessContainerLight)
                                    }
                                }
                            }
                        }

                        ScannerOverlay(
                            title = "Quét mã vạch sách",
                            instruction = "Đưa mã vạch của sách cần trả vào khung để tự động điền mã",
                            onScannedOrEntered = { code ->
                                returnBookCode = code
                            },
                            isScanningEnabled = returnBookCode.isBlank() && !state.isSubmitting
                        )

                        Spacer(modifier = Modifier.height(24.dp))
                    }
                }

                2 -> { // Danh sách sách đang mượn hệ thống
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 20.dp)
                    ) {
                        when {
                            state.isSubmitting -> LoadingView(message = "Đang tải danh sách mượn sách...")
                            state.activeLoans.isEmpty() -> EmptyView(
                                message = Labels.Empty.STAFF_LIBRARY_LOANS,
                                actionLabel = "Tải lại",
                                onAction = { viewModel.loadActiveLoans() }
                            )
                            else -> {
                                LazyColumn(
                                    modifier = Modifier.fillMaxSize(),
                                    verticalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    items(state.activeLoans, key = { it._id }) { loan ->
                                        LibraryLoanItem(loan = loan)
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

