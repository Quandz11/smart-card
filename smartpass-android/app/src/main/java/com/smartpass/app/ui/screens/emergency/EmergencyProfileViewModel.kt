package com.smartpass.app.ui.screens.emergency

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartpass.app.data.model.EmergencyProfile
import com.smartpass.app.data.model.EmergencyProfileUpdateRequest
import com.smartpass.app.data.repository.EmergencyRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class EmergencyProfileUiState(
    val isLoading: Boolean = false,
    val profile: EmergencyProfile = EmergencyProfile(),
    val isSaving: Boolean = false,
    val newQrToken: String? = null,
    val error: String? = null,
    val successMessage: String? = null
)

class EmergencyProfileViewModel(private val repository: EmergencyRepository) : ViewModel() {
    private val _uiState = MutableStateFlow(EmergencyProfileUiState(isLoading = true))
    val uiState: StateFlow<EmergencyProfileUiState> = _uiState

    init {
        loadProfile()
    }

    fun loadProfile() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val result = repository.getMyProfile()
            result.fold(
                onSuccess = { _uiState.value = EmergencyProfileUiState(isLoading = false, profile = it) },
                onFailure = { _uiState.value = EmergencyProfileUiState(isLoading = false, error = it.message) }
            )
        }
    }

    fun saveProfile(
        name: String,
        contactName: String,
        contactPhone: String,
        allergies: String,
        bloodType: String?,
        insurance: String,
        visibleFields: List<String>,
        isEnabled: Boolean
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSaving = true, error = null, successMessage = null)
            val req = EmergencyProfileUpdateRequest(
                fullName = name,
                emergencyContactName = contactName,
                emergencyContactPhone = contactPhone,
                allergies = allergies,
                bloodType = bloodType,
                insuranceInfo = insurance,
                visibleFields = visibleFields,
                isEnabled = isEnabled
            )
            repository.updateMyProfile(req).fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(
                        isSaving = false,
                        profile = it,
                        successMessage = "Emergency profile updated"
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(isSaving = false, error = it.message)
                }
            )
        }
    }

    fun rotateQr() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSaving = true, error = null)
            repository.rotateQr().fold(
                onSuccess = { token ->
                    _uiState.value = _uiState.value.copy(
                        isSaving = false,
                        newQrToken = token,
                        successMessage = "New QR token generated! Previous QR is now invalid."
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(isSaving = false, error = it.message)
                }
            )
        }
    }
}

