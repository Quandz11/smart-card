package com.smartpass.app.ui.screens.events

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartpass.app.data.model.Event
import com.smartpass.app.data.repository.EventRepository
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class EventsUiState(
    val isLoading: Boolean = false,
    val isRegistering: Boolean = false,
    val upcomingEvents: List<Event> = emptyList(),
    val myEvents: List<Event> = emptyList(),
    val selectedTab: Int = 0, // 0: Sắp diễn ra, 1: Đã đăng ký
    val actionSuccessMessage: String? = null,
    val error: String? = null
)

class EventsViewModel(private val repository: EventRepository) : ViewModel() {
    private val _uiState = MutableStateFlow(EventsUiState(isLoading = true))
    val uiState: StateFlow<EventsUiState> = _uiState

    init {
        loadEvents()
    }

    fun selectTab(index: Int) {
        _uiState.value = _uiState.value.copy(selectedTab = index)
    }

    fun loadEvents() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val upcomingDeferred = async { repository.getUpcomingEvents() }
            val myDeferred = async { repository.getMyEvents() }

            val upcomingRes = upcomingDeferred.await()
            val myRes = myDeferred.await()

            upcomingRes.fold(
                onSuccess = { upcoming ->
                    val my = myRes.getOrNull() ?: emptyList()
                    _uiState.value = EventsUiState(
                        isLoading = false,
                        upcomingEvents = upcoming,
                        myEvents = my,
                        selectedTab = _uiState.value.selectedTab
                    )
                },
                onFailure = {
                    _uiState.value = EventsUiState(
                        isLoading = false,
                        error = it.message ?: "Không thể tải danh sách sự kiện"
                    )
                }
            )
        }
    }

    fun registerForEvent(eventId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isRegistering = true, error = null, actionSuccessMessage = null)
            val result = repository.registerForEvent(eventId)
            result.fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(
                        isRegistering = false,
                        actionSuccessMessage = "Đăng ký tham gia sự kiện thành công!"
                    )
                    loadEvents()
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(
                        isRegistering = false,
                        error = it.message ?: "Đăng ký sự kiện thất bại"
                    )
                }
            )
        }
    }

    fun clearFeedback() {
        _uiState.value = _uiState.value.copy(error = null, actionSuccessMessage = null)
    }
}
