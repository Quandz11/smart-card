package com.smartpass.app.ui.screens.staff_rooms

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartpass.app.data.model.RoomBooking
import com.smartpass.app.data.repository.RoomBookingRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class StaffRoomApprovalUiState(
    val isLoading: Boolean = false,
    val isProcessing: Boolean = false,
    val bookings: List<RoomBooking> = emptyList(),
    val checkDate: String = "",
    val checkRoom: String = "",
    val availabilityBookings: List<RoomBooking> = emptyList(),
    val successMessage: String? = null,
    val error: String? = null
)

class StaffRoomApprovalViewModel(private val repository: RoomBookingRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(StaffRoomApprovalUiState())
    val uiState: StateFlow<StaffRoomApprovalUiState> = _uiState

    fun checkAvailability(date: String, room: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null, checkDate = date, checkRoom = room)
            val result = repository.getRoomAvailability(date, room)
            result.fold(
                onSuccess = { _uiState.value = _uiState.value.copy(isLoading = false, availabilityBookings = it) },
                onFailure = { _uiState.value = _uiState.value.copy(isLoading = false, error = it.message) }
            )
        }
    }

    fun approveBooking(id: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isProcessing = true, error = null, successMessage = null)
            val result = repository.approveBooking(id)
            result.fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(
                        isProcessing = false,
                        successMessage = "Đã phê duyệt yêu cầu đặt phòng $id thành công!"
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(isProcessing = false, error = it.message ?: "Phê duyệt thất bại")
                }
            )
        }
    }

    fun rejectBooking(id: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isProcessing = true, error = null, successMessage = null)
            val result = repository.rejectBooking(id)
            result.fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(
                        isProcessing = false,
                        successMessage = "Đã từ chối yêu cầu đặt phòng $id."
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(isProcessing = false, error = it.message ?: "Từ chối thất bại")
                }
            )
        }
    }

    fun clearFeedback() {
        _uiState.value = _uiState.value.copy(error = null, successMessage = null)
    }
}

