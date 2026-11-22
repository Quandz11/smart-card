package com.smartpass.app.ui.screens.notifications

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartpass.app.data.model.Notification
import com.smartpass.app.data.model.NotificationPreferences
import com.smartpass.app.data.remote.SocketManager
import com.smartpass.app.data.repository.NotificationRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class NotificationsUiState(
    val isLoading: Boolean = false,
    val notifications: List<Notification> = emptyList(),
    val selectedCategory: String? = null,
    val preferences: NotificationPreferences? = null,
    val showPreferencesDialog: Boolean = false,
    val error: String? = null
)

class NotificationsViewModel(private val repository: NotificationRepository) : ViewModel() {
    private val _uiState = MutableStateFlow(NotificationsUiState(isLoading = true))
    val uiState: StateFlow<NotificationsUiState> = _uiState

    init {
        loadNotifications()
        observeRealtime()
    }

    private fun observeRealtime() {
        viewModelScope.launch {
            SocketManager.newNotifications.collect { incoming ->
                val current = _uiState.value.notifications
                val exists = current.any { it._id == incoming._id || (it.id.isNotBlank() && it.id == incoming.id) }
                if (!exists) {
                    val cat = _uiState.value.selectedCategory
                    if (cat == null || incoming.category.equals(cat, ignoreCase = true)) {
                        _uiState.value = _uiState.value.copy(
                            notifications = listOf(incoming) + current
                        )
                    }
                }
            }
        }
    }

    fun selectCategory(category: String?) {
        _uiState.value = _uiState.value.copy(selectedCategory = category)
        loadNotifications()
    }

    fun loadNotifications() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val result = repository.getMyNotifications(
                category = _uiState.value.selectedCategory
            )
            result.fold(
                onSuccess = { list ->
                    _uiState.value = _uiState.value.copy(isLoading = false, notifications = list)
                },
                onFailure = { err ->
                    _uiState.value = _uiState.value.copy(isLoading = false, error = err.message)
                }
            )
        }
    }

    fun markAsRead(id: String) {
        viewModelScope.launch {
            val result = repository.markAsRead(id)
            if (result.isSuccess) {
                _uiState.value = _uiState.value.copy(
                    notifications = _uiState.value.notifications.map {
                        if (it._id == id || it.id == id) it.copy(isRead = true) else it
                    }
                )
            }
        }
    }

    fun markAllAsRead() {
        viewModelScope.launch {
            val result = repository.markAllAsRead()
            if (result.isSuccess) {
                _uiState.value = _uiState.value.copy(
                    notifications = _uiState.value.notifications.map { it.copy(isRead = true) }
                )
                SocketManager.setUnreadCount(0)
            }
        }
    }

    fun archiveNotification(id: String) {
        viewModelScope.launch {
            val result = repository.archiveNotification(id)
            if (result.isSuccess) {
                _uiState.value = _uiState.value.copy(
                    notifications = _uiState.value.notifications.filterNot { it._id == id || it.id == id }
                )
            }
        }
    }

    fun openPreferences() {
        viewModelScope.launch {
            val res = repository.getPreferences()
            val prefs = res.getOrDefault(NotificationPreferences())
            _uiState.value = _uiState.value.copy(
                preferences = prefs,
                showPreferencesDialog = true
            )
        }
    }

    fun closePreferences() {
        _uiState.value = _uiState.value.copy(showPreferencesDialog = false)
    }

    fun updatePreferences(updated: NotificationPreferences) {
        viewModelScope.launch {
            val res = repository.updatePreferences(updated)
            res.onSuccess {
                _uiState.value = _uiState.value.copy(
                    preferences = it,
                    showPreferencesDialog = false
                )
            }
        }
    }
}
