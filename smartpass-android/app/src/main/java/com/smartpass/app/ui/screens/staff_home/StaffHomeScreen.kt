package com.smartpass.app.ui.screens.staff_home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.smartpass.app.ui.components.*
import com.smartpass.app.ui.labels.Labels
import com.smartpass.app.ui.navigation.Screen
import com.smartpass.app.ui.theme.*

@Composable
fun StaffHomeScreen(
    viewModel: StaffHomeViewModel,
    onNavigate: (String) -> Unit
) {
    val state by viewModel.uiState.collectAsState()

    when {
        state.isLoading -> LoadingView(message = "Đang tải dữ liệu ban quản lý...")
        state.error != null -> ErrorView(
            message = state.error ?: "Đã xảy ra lỗi",
            onRetry = { viewModel.loadData() },
            onConfigureServer = { viewModel.updateServerUrl(it) }
        )
        state.user != null -> {
            val user = state.user ?: return
            val role = user.role.lowercase()
            val isAdmin = role == "admin"
            val isLibrarian = isAdmin || role == "librarian"
            val isCanteen = isAdmin || role == "canteen_staff"
            val isParking = isAdmin || role == "parking_staff"

            Scaffold(
                topBar = {
                    Surface(color = MaterialTheme.colorScheme.background) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 20.dp, vertical = 14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.clickable { onNavigate(Screen.Profile.route) }
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(46.dp)
                                        .background(Color(0xFF334155), CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = user.fullName.take(1).uppercase(),
                                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                        color = Color.White
                                    )
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(
                                        text = "Cán bộ nhân viên,",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Text(
                                        text = user.fullName,
                                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                StatusChip(
                                    text = Labels.getRoleLabel(user.role),
                                    textColor = BrandTealPrimary,
                                    containerColor = BrandTealContainerLight
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                IconButton(onClick = { onNavigate(Screen.Profile.route) }) {
                                    Icon(Icons.Outlined.Settings, contentDescription = "Cài đặt")
                                }
                            }
                        }
                    }
                }
            ) { paddingValues ->
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                        .padding(horizontal = 20.dp),
                    verticalArrangement = Arrangement.spacedBy(18.dp)
                ) {
                    // Staff Access Pass Digital Card
                    item {
                        SmartPassDigitalCard(
                            fullName = user.fullName,
                            codeOrRole = Labels.getRoleLabel(user.role),
                            subText = user.email,
                            status = "active",
                            cardCode = user._id,
                            expiresAt = null,
                            isStaff = true,
                            modifier = Modifier.clickable { onNavigate(Screen.Profile.route) }
                        )
                    }

                    // Card Verify Tool Banner (Quick Access for All Staff)
                    item {
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onNavigate(Screen.StaffCardVerify.route) },
                            shape = RoundedCornerShape(16.dp),
                            color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f),
                            shadowElevation = 0.5.dp
                        ) {
                            Row(
                                modifier = Modifier
                                    .padding(16.dp)
                                    .fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(42.dp)
                                            .background(BrandTealPrimary, CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Outlined.Badge,
                                            contentDescription = null,
                                            tint = Color.White,
                                            modifier = Modifier.size(24.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column {
                                        Text(
                                            text = "Công cụ kiểm tra & xác thực thẻ",
                                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                        Text(
                                            text = "Quét QR / NFC để kiểm tra tính hợp lệ của thẻ",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                                Icon(Icons.Default.ChevronRight, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            }
                        }
                    }

                    // Operations Section Title
                    item {
                        Text(
                            text = "Nghiệp vụ vận hành",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }

                    // Operations Grid
                    item {
                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            // Row 1: Attendance Check & Library Ops
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                FeatureTile(
                                    title = "Điểm danh ca học",
                                    icon = Icons.Outlined.CheckCircle,
                                    iconTint = SuccessGreen,
                                    iconBackground = SuccessContainerLight,
                                    onClick = { onNavigate(Screen.StaffAttendance.route) },
                                    modifier = Modifier.weight(1f)
                                )
                                if (isLibrarian) {
                                    FeatureTile(
                                        title = "Nghiệp vụ Thư viện",
                                        icon = Icons.Outlined.Book,
                                        iconTint = BrandSkySecondary,
                                        iconBackground = BrandSkyContainerLight,
                                        onClick = { onNavigate(Screen.StaffLibrary.route) },
                                        modifier = Modifier.weight(1f)
                                    )
                                } else {
                                    Spacer(modifier = Modifier.weight(1f))
                                }
                            }

                            // Row 2: Canteen Ops & Parking Ops
                            if (isCanteen || isParking) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    if (isCanteen) {
                                        FeatureTile(
                                            title = "Nghiệp vụ Căng tin",
                                            icon = Icons.Outlined.AccountBalanceWallet,
                                            iconTint = BrandTealPrimary,
                                            iconBackground = BrandTealContainerLight,
                                            onClick = { onNavigate(Screen.StaffCanteen.route) },
                                            modifier = Modifier.weight(1f)
                                        )
                                    } else {
                                        Spacer(modifier = Modifier.weight(1f))
                                    }

                                    if (isParking) {
                                        FeatureTile(
                                            title = "Nghiệp vụ Bãi xe",
                                            icon = Icons.Outlined.DirectionsCar,
                                            iconTint = WarningAmber,
                                            iconBackground = WarningContainerLight,
                                            onClick = { onNavigate(Screen.StaffParking.route) },
                                            modifier = Modifier.weight(1f)
                                        )
                                    } else {
                                        Spacer(modifier = Modifier.weight(1f))
                                    }
                                }
                            }

                            // Row 3: Admin only - Room Approvals
                            if (isAdmin) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    FeatureTile(
                                        title = "Duyệt đặt phòng",
                                        icon = Icons.Outlined.MeetingRoom,
                                        iconTint = Color(0xFF7C3AED),
                                        iconBackground = Color(0xFFEDE9FE),
                                        onClick = { onNavigate(Screen.StaffRoomApproval.route) },
                                        modifier = Modifier.weight(1f)
                                    )
                                    FeatureTile(
                                        title = "Thông báo hệ thống",
                                        icon = Icons.Outlined.Notifications,
                                        iconTint = BrandSkySecondary,
                                        iconBackground = BrandSkyContainerLight,
                                        onClick = { onNavigate(Screen.Notifications.route) },
                                        modifier = Modifier.weight(1f)
                                    )
                                }
                            }
                        }
                    }

                    item { Spacer(modifier = Modifier.height(28.dp)) }
                }
            }
        }
    }
}

