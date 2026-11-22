package com.smartpass.app.ui.screens.public_emergency

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartpass.app.data.repository.EmergencyRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class PublicEmergencyUiState {
    object Loading : PublicEmergencyUiState()
    data class Success(val fields: Map<String, Any?>) : PublicEmergencyUiState()
    data class Error(val message: String) : PublicEmergencyUiState()
}

class PublicEmergencyViewModel(
    private val repository: EmergencyRepository,
    private val qrToken: String
) : ViewModel() {

    private val _uiState = MutableStateFlow<PublicEmergencyUiState>(PublicEmergencyUiState.Loading)
    val uiState: StateFlow<PublicEmergencyUiState> = _uiState

    init {
        loadInfo()
    }

    private fun loadInfo() {
        viewModelScope.launch {
            _uiState.value = PublicEmergencyUiState.Loading
            repository.getPublicEmergencyInfo(qrToken).fold(
                onSuccess = { _uiState.value = PublicEmergencyUiState.Success(it) },
                onFailure = { _uiState.value = PublicEmergencyUiState.Error(it.message ?: "Emergency information not found") }
            )
        }
    }
}

