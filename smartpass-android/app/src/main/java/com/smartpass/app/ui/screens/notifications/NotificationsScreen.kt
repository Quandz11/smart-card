package com.smartpass.app.ui.screens.notifications

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.DoneAll
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.smartpass.app.data.model.NotificationPreferences
import com.smartpass.app.data.model.QuietHours
import com.smartpass.app.ui.components.*
import com.smartpass.app.ui.labels.Labels

data class CategoryFilter(
    val key: String?,
    val label: String
)

val CATEGORY_FILTERS = listOf(
    CategoryFilter(null, "Tất cả"),
    CategoryFilter("WALLET", "Ví & Căn tin"),
    CategoryFilter("CARD", "Thẻ số"),
    CategoryFilter("LIBRARY", "Thư viện"),
    CategoryFilter("PARKING", "Gửi xe"),
    CategoryFilter("ROOM", "Phòng học"),
    CategoryFilter("EVENT", "Sự kiện"),
    CategoryFilter("SCHEDULE", "Điểm danh"),
    CategoryFilter("SECURITY", "Bảo mật"),
    CategoryFilter("SYSTEM", "Hệ thống")
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationsScreen(
    viewModel: NotificationsViewModel,
    onNavigateBack: () -> Unit,
    onNavigate: (String) -> Unit = {}
) {
    val state by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Thông Báo Nhà Trường",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.markAllAsRead() }) {
                        Icon(Icons.Default.DoneAll, contentDescription = "Đánh dấu tất cả đã đọc")
                    }
                    IconButton(onClick = { viewModel.openPreferences() }) {
                        Icon(Icons.Default.Settings, contentDescription = "Cài đặt thông báo")
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
            // Category Filter Row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                CATEGORY_FILTERS.forEach { filter ->
                    val isSelected = state.selectedCategory == filter.key
                    FilterChip(
                        selected = isSelected,
                        onClick = { viewModel.selectCategory(filter.key) },
                        label = { Text(filter.label) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = MaterialTheme.colorScheme.primary,
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }

            Box(modifier = Modifier.fillMaxSize()) {
                when {
                    state.isLoading -> LoadingView(message = "Đang tải thông báo...")
                    state.error != null -> ErrorView(
                        message = state.error ?: "Đã xảy ra lỗi",
                        onRetry = { viewModel.loadNotifications() }
                    )
                    state.notifications.isEmpty() -> EmptyView(
                        message = Labels.Empty.NOTIFICATIONS,
                        actionLabel = "Tải lại",
                        onAction = { viewModel.loadNotifications() }
                    )
                    else -> {
                        LazyColumn(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(horizontal = 16.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            items(state.notifications, key = { it._id.ifBlank { it.id } }) { notif ->
                                NotificationItem(
                                    notif = notif,
                                    onRead = {
                                        val id = notif._id.ifBlank { notif.id }
                                        if (!notif.isRead && id.isNotBlank()) {
                                            viewModel.markAsRead(id)
                                        }
                                        if (!notif.actionRoute.isNullOrBlank()) {
                                            onNavigate(notif.actionRoute)
                                        }
                                    },
                                    onArchive = {
                                        val id = notif._id.ifBlank { notif.id }
                                        if (id.isNotBlank()) {
                                            viewModel.archiveNotification(id)
                                        }
                                    }
                                )
                            }
                            item { Spacer(modifier = Modifier.height(24.dp)) }
                        }
                    }
                }
            }
        }
    }

    // Preferences Dialog
    if (state.showPreferencesDialog && state.preferences != null) {
        NotificationPreferencesDialog(
            initialPreferences = state.preferences!!,
            onDismiss = { viewModel.closePreferences() },
            onSave = { updated -> viewModel.updatePreferences(updated) }
        )
    }
}

@Composable
fun NotificationPreferencesDialog(
    initialPreferences: NotificationPreferences,
    onDismiss: () -> Unit,
    onSave: (NotificationPreferences) -> Unit
) {
    var categories by remember { mutableStateOf(initialPreferences.categories.toMutableMap()) }
    var quietHoursEnabled by remember { mutableStateOf(initialPreferences.quietHours.enabled) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text("Cài đặt thông báo", fontWeight = FontWeight.Bold)
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Bật/Tắt theo danh mục:",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.primary
                )

                val displayCategories = listOf(
                    "WALLET" to "Ví & Căn tin",
                    "CARD" to "Thẻ số",
                    "LIBRARY" to "Thư viện",
                    "PARKING" to "Gửi xe",
                    "ROOM" to "Phòng học",
                    "EVENT" to "Sự kiện",
                    "SCHEDULE" to "Điểm danh & Lịch học",
                    "SYSTEM" to "Thông báo chung"
                )

                displayCategories.forEach { (catKey, catName) ->
                    val isChecked = categories[catKey] ?: true
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(catName, style = MaterialTheme.typography.bodyMedium)
                        Switch(
                            checked = isChecked,
                            onCheckedChange = { checked ->
                                val next = categories.toMutableMap()
                                next[catKey] = checked
                                categories = next
                            }
                        )
                    }
                }

                HorizontalDivider()

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text("Giờ yên tĩnh", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                        Text("22:00 - 07:00 (không thông báo âm thanh)", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.outline)
                    }
                    Switch(
                        checked = quietHoursEnabled,
                        onCheckedChange = { quietHoursEnabled = it }
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onSave(
                        NotificationPreferences(
                            categories = categories,
                            quietHours = QuietHours(
                                enabled = quietHoursEnabled,
                                from = "22:00",
                                to = "07:00"
                            )
                        )
                    )
                }
            ) {
                Text("Lưu")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Hủy")
            }
        }
    )
}
