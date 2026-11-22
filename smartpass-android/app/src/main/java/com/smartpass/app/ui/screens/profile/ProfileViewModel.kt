package com.smartpass.app.ui.screens.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartpass.app.data.local.TokenManager
import com.smartpass.app.data.model.User
import com.smartpass.app.data.remote.ApiClient
import com.smartpass.app.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class ProfileUiState(
    val isLoading: Boolean = false,
    val isChangingPassword: Boolean = false,
    val user: User? = null,
    val currentBaseUrl: String = ApiClient.getDefaultBaseUrl(),
    val actionSuccessMessage: String? = null,
    val error: String? = null
)

class ProfileViewModel(
    private val authRepo: AuthRepository,
    private val tokenManager: TokenManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState(isLoading = true))
    val uiState: StateFlow<ProfileUiState> = _uiState

    init {
        loadProfile()
    }

    fun loadProfile() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val customUrl = tokenManager.getCustomBaseUrl() ?: ApiClient.getDefaultBaseUrl()
            val userResult = authRepo.getMe()
            userResult.fold(
                onSuccess = {
                    _uiState.value = ProfileUiState(
                        isLoading = false,
                        user = it,
                        currentBaseUrl = customUrl
                    )
                },
                onFailure = {
                    _uiState.value = ProfileUiState(
                        isLoading = false,
                        error = it.message ?: "Không thể tải thông tin tài khoản",
                        currentBaseUrl = customUrl
                    )
                }
            )
        }
    }

    fun changePassword(oldPass: String, newPass: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isChangingPassword = true, error = null, actionSuccessMessage = null)
            val result = authRepo.changePassword(oldPass, newPass)
            result.fold(
                onSuccess = { msg ->
                    _uiState.value = _uiState.value.copy(
                        isChangingPassword = false,
                        actionSuccessMessage = msg
                    )
                },
                onFailure = { err ->
                    _uiState.value = _uiState.value.copy(
                        isChangingPassword = false,
                        error = err.message ?: "Đổi mật khẩu thất bại"
                    )
                }
            )
        }
    }

    fun saveBaseUrl(newUrl: String) {
        viewModelScope.launch {
            tokenManager.saveCustomBaseUrl(newUrl)
            ApiClient.updateBaseUrl(newUrl)
            _uiState.value = _uiState.value.copy(
                currentBaseUrl = newUrl,
                actionSuccessMessage = "Đã cập nhật máy chủ backend: $newUrl"
            )
        }
    }

    fun logout(onLoggedOut: () -> Unit) {
        viewModelScope.launch {
            authRepo.logout()
            onLoggedOut()
        }
    }

    fun clearFeedback() {
        _uiState.value = _uiState.value.copy(error = null, actionSuccessMessage = null)
    }
}
