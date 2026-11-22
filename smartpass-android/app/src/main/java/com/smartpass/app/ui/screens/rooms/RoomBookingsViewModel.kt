package com.smartpass.app.ui.screens.rooms

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartpass.app.data.model.RoomBooking
import com.smartpass.app.data.model.RoomBookingCreateRequest
import com.smartpass.app.data.repository.RoomBookingRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class RoomBookingsUiState(
    val isLoading: Boolean = false,
    val isSubmitting: Boolean = false,
    val bookings: List<RoomBooking> = emptyList(),
    val actionSuccessMessage: String? = null,
    val error: String? = null
)

class RoomBookingsViewModel(private val repository: RoomBookingRepository) : ViewModel() {
    private val _uiState = MutableStateFlow(RoomBookingsUiState(isLoading = true))
    val uiState: StateFlow<RoomBookingsUiState> = _uiState

    init {
        loadBookings()
    }

    fun loadBookings() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val result = repository.getMyBookings()
            result.fold(
                onSuccess = { _uiState.value = _uiState.value.copy(isLoading = false, bookings = it) },
                onFailure = { _uiState.value = _uiState.value.copy(isLoading = false, error = it.message) }
            )
        }
    }

    fun createBooking(room: String, date: String, startTime: String, endTime: String, purpose: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, error = null, actionSuccessMessage = null)
            val request = RoomBookingCreateRequest(
                room = room,
                date = date,
                startTime = startTime,
                endTime = endTime,
                purpose = purpose.ifBlank { null }
            )
            val result = repository.createBooking(request)
            result.fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        actionSuccessMessage = "Gửi yêu cầu đặt phòng thành công. Vui lòng chờ phê duyệt."
                    )
                    loadBookings()
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        error = it.message ?: "Đặt phòng thất bại"
                    )
                }
            )
        }
    }

    fun cancelBooking(id: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, error = null, actionSuccessMessage = null)
            val result = repository.cancelBooking(id)
            result.fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        actionSuccessMessage = "Hủy yêu cầu đặt phòng thành công."
                    )
                    loadBookings()
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        error = it.message ?: "Không thể hủy đặt phòng"
                    )
                }
            )
        }
    }

    fun clearFeedback() {
        _uiState.value = _uiState.value.copy(error = null, actionSuccessMessage = null)
    }
}
