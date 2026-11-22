package com.smartpass.app.ui.screens.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.smartpass.app.core.format.Format
import com.smartpass.app.ui.components.*
import com.smartpass.app.ui.labels.Labels
import com.smartpass.app.ui.navigation.Screen
import com.smartpass.app.ui.theme.*

@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    onNavigate: (String) -> Unit
) {
    val state by viewModel.uiState.collectAsState()

    when {
        state.isLoading -> LoadingView(message = "Đang tải dữ liệu trang chủ...")
        state.error != null -> ErrorView(
            message = state.error ?: "Đã xảy ra lỗi",
            onRetry = { viewModel.loadData() },
            onConfigureServer = { viewModel.updateServerUrl(it) }
        )
        state.user != null -> {
            val user = state.user ?: return

            Scaffold(
                topBar = {
                    Surface(
                        color = MaterialTheme.colorScheme.background,
                        tonalElevation = 0.dp
                    ) {
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
                                SmartAvatar(
                                    name = user.fullName,
                                    avatarUrl = user.avatarUrl,
                                    size = 46.dp
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(
                                        text = "Xin chào,",
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
                                // Notification Bell with badge
                                IconButton(
                                    onClick = { onNavigate(Screen.Notifications.route) }
                                ) {
                                    BadgedBox(
                                        badge = {
                                            if (state.unreadNotifsCount > 0) {
                                                Badge { Text(state.unreadNotifsCount.toString()) }
                                            }
                                        }
                                    ) {
                                        Icon(
                                            imageVector = Icons.Outlined.Notifications,
                                            contentDescription = "Thông báo",
                                            tint = MaterialTheme.colorScheme.onSurface
                                        )
                                    }
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
                    // Digital Card Preview
                    item {
                        SmartPassDigitalCard(
                            fullName = user.fullName,
                            codeOrRole = user.studentCode ?: user.role,
                            subText = user.className,
                            status = state.cardStatus,
                            cardCode = user.studentCode ?: user._id,
                            expiresAt = null,
                            isStaff = user.role != "student",
                            onShowQr = { onNavigate(Screen.MyCard.route) },
                            modifier = Modifier.clickable { onNavigate(Screen.MyCard.route) }
                        )
                    }

                    // Wallet Quick Bar
                    item {
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .clickable { onNavigate(Screen.Wallet.route) },
                            shape = RoundedCornerShape(16.dp),
                            color = MaterialTheme.colorScheme.surface,
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
                                            .size(40.dp)
                                            .background(BrandTealContainerLight, CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.AccountBalanceWallet,
                                            contentDescription = null,
                                            tint = BrandTealPrimary,
                                            modifier = Modifier.size(22.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column {
                                        Text(
                                            text = "Số dư ví Căng tin",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                        MoneyText(
                                            amount = state.wallet?.balance ?: 0L,
                                            fontSize = 16.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                    }
                                }
                                Icon(
                                    imageVector = Icons.Default.ChevronRight,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.outline
                                )
                            }
                        }
                    }

                    // Quick Actions Section Title
                    item {
                        Text(
                            text = "Tiện ích sinh viên",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }

                    // 4x2 Quick Action Tiles Grid (Each flow <= 3 steps)
                    item {
                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                FeatureTile(
                                    title = "Điểm danh",
                                    icon = Icons.Outlined.CheckCircle,
                                    iconTint = SuccessGreen,
                                    iconBackground = SuccessContainerLight,
                                    onClick = { onNavigate(Screen.Attendance.route) },
                                    modifier = Modifier.weight(1f)
                                )
                                FeatureTile(
                                    title = "Thư viện",
                                    icon = Icons.Outlined.Book,
                                    iconTint = BrandSkySecondary,
                                    iconBackground = BrandSkyContainerLight,
                                    onClick = { onNavigate(Screen.Library.route) },
                                    modifier = Modifier.weight(1f)
                                )
                            }
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                FeatureTile(
                                    title = "Bãi gửi xe",
                                    icon = Icons.Outlined.DirectionsCar,
                                    iconTint = BrandTealPrimary,
                                    iconBackground = BrandTealContainerLight,
                                    onClick = { onNavigate(Screen.Parking.route) },
                                    modifier = Modifier.weight(1f)
                                )
                                FeatureTile(
                                    title = "Đặt phòng",
                                    icon = Icons.Outlined.MeetingRoom,
                                    iconTint = WarningAmber,
                                    iconBackground = WarningContainerLight,
                                    onClick = { onNavigate(Screen.RoomBookings.route) },
                                    modifier = Modifier.weight(1f)
                                )
                            }
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                FeatureTile(
                                    title = "Sự kiện",
                                    icon = Icons.Outlined.Event,
                                    iconTint = Color(0xFF7C3AED),
                                    iconBackground = Color(0xFFEDE9FE),
                                    onClick = { onNavigate(Screen.Events.route) },
                                    modifier = Modifier.weight(1f)
                                )
                                FeatureTile(
                                    title = "Lịch học",
                                    icon = Icons.Outlined.CalendarMonth,
                                    iconTint = Color(0xFFD97706),
                                    iconBackground = Color(0xFFFEF3C7),
                                    onClick = { onNavigate(Screen.Schedule.route) },
                                    modifier = Modifier.weight(1f)
                                )
                            }
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                FeatureTile(
                                    title = "Thẻ khẩn cấp",
                                    icon = Icons.Outlined.Emergency,
                                    iconTint = ErrorRed,
                                    iconBackground = ErrorContainerLight,
                                    onClick = { onNavigate(Screen.EmergencyProfile.route) },
                                    modifier = Modifier.weight(1f)
                                )
                                FeatureTile(
                                    title = "Quét mã QR",
                                    icon = Icons.Outlined.QrCodeScanner,
                                    iconTint = BrandTealPrimary,
                                    iconBackground = BrandTealContainerLight,
                                    onClick = { onNavigate(Screen.Scan.route) },
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }

                    // Today's Schedule Card Section
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Lịch học hôm nay",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            TextButton(onClick = { onNavigate(Screen.Schedule.route) }) {
                                Text("Xem tất cả", fontSize = 13.sp)
                            }
                        }
                    }

                    if (state.todaySchedules.isEmpty()) {
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
                                        .padding(24.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = Labels.Empty.SCHEDULE,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    } else {
                        items(state.todaySchedules, key = { it._id }) { schedule ->
                            ScheduleItem(schedule = schedule)
                        }
                    }

                    item { Spacer(modifier = Modifier.height(24.dp)) }
                }
            }
        }
    }
}

