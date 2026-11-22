package com.smartpass.app.ui.screens.parking

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartpass.app.data.model.ParkingSession
import com.smartpass.app.data.repository.ParkingRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class ParkingUiState(
    val isLoading: Boolean = false,
    val sessions: List<ParkingSession> = emptyList(),
    val error: String? = null
)

class ParkingViewModel(private val repository: ParkingRepository) : ViewModel() {
    private val _uiState = MutableStateFlow(ParkingUiState(isLoading = true))
    val uiState: StateFlow<ParkingUiState> = _uiState

    init {
        loadParkingData()
    }

    fun loadParkingData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val result = repository.getMySessions()
            result.fold(
                onSuccess = { _uiState.value = ParkingUiState(isLoading = false, sessions = it) },
                onFailure = { _uiState.value = ParkingUiState(isLoading = false, error = it.message) }
            )
        }
    }
}
