package com.smartpass.app.ui.screens.staff_home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartpass.app.data.local.TokenManager
import com.smartpass.app.data.model.User
import com.smartpass.app.data.remote.ApiClient
import com.smartpass.app.data.repository.AuthRepository
import com.smartpass.app.data.repository.EmergencyRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class StaffHomeUiState(
    val isLoading: Boolean = false,
    val user: User? = null,
    val qrToken: String = "",
    val error: String? = null
)

class StaffHomeViewModel(
    private val authRepo: AuthRepository,
    private val emergencyRepo: EmergencyRepository,
    private val tokenManager: TokenManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(StaffHomeUiState(isLoading = true))
    val uiState: StateFlow<StaffHomeUiState> = _uiState

    init {
        loadData()
    }

    fun updateServerUrl(newUrl: String) {
        viewModelScope.launch {
            tokenManager.saveCustomBaseUrl(newUrl)
            ApiClient.updateBaseUrl(newUrl)
            loadData()
        }
    }

    fun loadData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val result = authRepo.getMe()
            result.fold(
                onSuccess = { user ->
                    val emergency = emergencyRepo.getMyProfile().getOrNull()
                    _uiState.value = StaffHomeUiState(
                        isLoading = false,
                        user = user,
                        qrToken = emergency?._id ?: user._id
                    )
                },
                onFailure = {
                    _uiState.value = StaffHomeUiState(
                        isLoading = false,
                        error = it.message ?: "Không thể tải thông tin nhân viên"
                    )
                }
            )
        }
    }
}

