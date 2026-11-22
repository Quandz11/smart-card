package com.smartpass.app.ui.screens.events

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.ErrorOutline
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.smartpass.app.ui.components.*
import com.smartpass.app.ui.labels.Labels
import com.smartpass.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EventsScreen(
    viewModel: EventsViewModel,
    onNavigateBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val tabs = listOf("Sắp diễn ra", "Đã đăng ký")
    val currentEvents = if (state.selectedTab == 0) state.upcomingEvents else state.myEvents
    val myEventIds = state.myEvents.map { it._id }.toSet()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Sự Kiện Trường Học",
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
                    val count = if (index == 0) state.upcomingEvents.size else state.myEvents.size
                    Tab(
                        selected = state.selectedTab == index,
                        onClick = { viewModel.selectTab(index) },
                        text = {
                            Text(
                                text = if (count > 0) "$title ($count)" else title,
                                style = MaterialTheme.typography.titleSmall
                            )
                        }
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 20.dp)
            ) {
                when {
                    state.isLoading -> LoadingView(message = "Đang tải danh sách sự kiện...")
                    state.error != null && currentEvents.isEmpty() -> ErrorView(
                        message = state.error ?: "Đã xảy ra lỗi",
                        onRetry = { viewModel.loadEvents() }
                    )
                    else -> {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            verticalArrangement = Arrangement.spacedBy(14.dp)
                        ) {
                            state.actionSuccessMessage?.let { msg ->
                                item {
                                    Surface(
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(12.dp),
                                        color = SuccessContainerLight
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(14.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Icon(Icons.Outlined.CheckCircle, contentDescription = null, tint = SuccessGreen)
                                            Spacer(modifier = Modifier.width(10.dp))
                                            Text(
                                                text = msg,
                                                style = MaterialTheme.typography.bodySmall,
                                                color = SuccessGreen
                                            )
                                        }
                                    }
                                }
                            }

                            state.error?.let { err ->
                                item {
                                    Surface(
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(12.dp),
                                        color = ErrorContainerLight
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(14.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Icon(Icons.Outlined.ErrorOutline, contentDescription = null, tint = ErrorRed)
                                            Spacer(modifier = Modifier.width(10.dp))
                                            Text(
                                                text = err,
                                                style = MaterialTheme.typography.bodySmall,
                                                color = ErrorRed
                                            )
                                        }
                                    }
                                }
                            }

                            if (currentEvents.isEmpty()) {
                                item {
                                    EmptyView(
                                        message = Labels.Empty.EVENTS,
                                        actionLabel = "Tải lại",
                                        onAction = { viewModel.loadEvents() }
                                    )
                                }
                            } else {
                                items(currentEvents, key = { it._id }) { event ->
                                    val isRegistered = myEventIds.contains(event._id)
                                    EventItem(
                                        event = event,
                                        isRegistered = isRegistered,
                                        onRegister = { viewModel.registerForEvent(event._id) }
                                    )
                                }
                            }

                            item { Spacer(modifier = Modifier.height(24.dp)) }
                        }
                    }
                }
            }
        }
    }
}
