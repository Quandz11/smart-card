package com.smartpass.app.ui.screens.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartpass.app.data.local.TokenManager
import com.smartpass.app.data.model.LoginRequest
import com.smartpass.app.data.remote.ApiClient
import com.smartpass.app.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class LoginUiState {
    object Idle : LoginUiState()
    object Loading : LoginUiState()
    data class Success(val mustSetPin: Boolean = false, val role: String = "student") : LoginUiState()
    data class Error(val message: String) : LoginUiState()
}

class LoginViewModel(
    private val authRepository: AuthRepository,
    private val tokenManager: TokenManager
) : ViewModel() {
    private val _uiState = MutableStateFlow<LoginUiState>(LoginUiState.Idle)
    val uiState: StateFlow<LoginUiState> = _uiState

    private val _serverUrl = MutableStateFlow(ApiClient.getBaseUrl())
    val serverUrl: StateFlow<String> = _serverUrl

    init {
        checkAutoLogin()
        loadServerUrl()
    }

    private fun loadServerUrl() {
        viewModelScope.launch {
            tokenManager.getCustomBaseUrl()?.let { saved ->
                if (saved.isNotBlank()) {
                    ApiClient.updateBaseUrl(saved)
                    _serverUrl.value = ApiClient.getBaseUrl()
                }
            }
        }
    }

    fun updateServerUrl(newUrl: String) {
        ApiClient.updateBaseUrl(newUrl)
        _serverUrl.value = ApiClient.getBaseUrl()
        viewModelScope.launch {
            tokenManager.saveCustomBaseUrl(ApiClient.getBaseUrl())
        }
    }

    private fun checkAutoLogin() {
        viewModelScope.launch {
            if (authRepository.isLoggedIn()) {
                val role = tokenManager.getRole() ?: "student"
                _uiState.value = LoginUiState.Success(mustSetPin = false, role = role)
            }
        }
    }

    fun login(email: String, pass: String) {
        if (email.isBlank() || pass.isBlank()) {
            _uiState.value = LoginUiState.Error("Please enter email and password")
            return
        }

        viewModelScope.launch {
            _uiState.value = LoginUiState.Loading
            val result = authRepository.login(LoginRequest(email.trim(), pass))
            result.fold(
                onSuccess = { authResp ->
                    _uiState.value = LoginUiState.Success(
                        mustSetPin = authResp.mustSetPin == true,
                        role = authResp.user.role
                    )
                },
                onFailure = { _uiState.value = LoginUiState.Error(it.message ?: "Login failed") }
            )
        }
    }
}
