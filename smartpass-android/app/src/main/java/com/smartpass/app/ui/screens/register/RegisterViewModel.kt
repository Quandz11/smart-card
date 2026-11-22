package com.smartpass.app.ui.screens.register

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartpass.app.data.model.RegisterRequest
import com.smartpass.app.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class RegisterUiState {
    object Idle : RegisterUiState()
    object Loading : RegisterUiState()
    object Success : RegisterUiState()
    data class Error(val message: String) : RegisterUiState()
}

class RegisterViewModel(private val authRepository: AuthRepository) : ViewModel() {

    private val _uiState = MutableStateFlow<RegisterUiState>(RegisterUiState.Idle)
    val uiState: StateFlow<RegisterUiState> = _uiState

    fun register(
        fullName: String,
        email: String,
        pass: String,
        studentCode: String?,
        className: String?,
        phone: String?
    ) {
        viewModelScope.launch {
            _uiState.value = RegisterUiState.Loading
            val request = RegisterRequest(
                fullName = fullName,
                email = email,
                password = pass,
                studentCode = studentCode?.ifBlank { null },
                className = className?.ifBlank { null },
                phone = phone?.ifBlank { null }
            )
            val result = authRepository.register(request)
            result.fold(
                onSuccess = {
                    _uiState.value = RegisterUiState.Success
                },
                onFailure = {
                    _uiState.value = RegisterUiState.Error(it.message ?: "Đăng ký thất bại")
                }
            )
        }
    }

    fun resetState() {
        _uiState.value = RegisterUiState.Idle
    }
}

