package com.smartpass.app.ui.screens.staff_parking

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartpass.app.data.model.ParkingCheckInRequest
import com.smartpass.app.data.model.ParkingCheckOutRequest
import com.smartpass.app.data.model.ParkingSession
import com.smartpass.app.data.repository.ParkingRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class StaffParkingUiState(
    val selectedTab: Int = 0, // 0: Xe vào, 1: Xe ra, 2: Xe trong bãi
    val isSubmitting: Boolean = false,
    val activeSessions: List<ParkingSession> = emptyList(),
    val checkOutResult: ParkingSession? = null,
    val successMessage: String? = null,
    val error: String? = null
)

class StaffParkingViewModel(private val repository: ParkingRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(StaffParkingUiState())
    val uiState: StateFlow<StaffParkingUiState> = _uiState

    init {
        loadActiveSessions()
    }

    fun selectTab(tab: Int) {
        _uiState.value = _uiState.value.copy(selectedTab = tab, error = null, successMessage = null, checkOutResult = null)
        if (tab == 2) loadActiveSessions()
    }

    fun loadActiveSessions() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, error = null)
            val result = repository.getActiveSessions()
            result.fold(
                onSuccess = { _uiState.value = _uiState.value.copy(isSubmitting = false, activeSessions = it) },
                onFailure = { _uiState.value = _uiState.value.copy(isSubmitting = false, error = it.message) }
            )
        }
    }

    fun checkIn(cardOrToken: String, plate: String?) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, error = null, successMessage = null)
            val request = ParkingCheckInRequest(
                cardCode = if (cardOrToken.length <= 16) cardOrToken else null,
                qrToken = if (cardOrToken.length > 16) cardOrToken else null,
                vehiclePlate = plate?.ifBlank { null }
            )
            val result = repository.checkIn(request)
            result.fold(
                onSuccess = { session ->
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        successMessage = "Check-in thành công cho xe: ${session.vehiclePlate ?: "Không biển"}!"
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(isSubmitting = false, error = it.message ?: "Check-in thất bại")
                }
            )
        }
    }

    fun checkOut(cardOrToken: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, error = null, successMessage = null, checkOutResult = null)
            val request = ParkingCheckOutRequest(
                cardCode = if (cardOrToken.length <= 16) cardOrToken else null,
                qrToken = if (cardOrToken.length > 16) cardOrToken else null
            )
            val result = repository.checkOut(request)
            result.fold(
                onSuccess = { session ->
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        checkOutResult = session,
                        successMessage = "Check-out xe thành công! Phí gửi xe: ${session.fee} ₫"
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(isSubmitting = false, error = it.message ?: "Check-out thất bại")
                }
            )
        }
    }

    fun clearFeedback() {
        _uiState.value = _uiState.value.copy(error = null, successMessage = null)
    }
}

