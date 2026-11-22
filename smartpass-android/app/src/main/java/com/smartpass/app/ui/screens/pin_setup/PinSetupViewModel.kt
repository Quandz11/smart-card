package com.smartpass.app.ui.screens.pin_setup

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartpass.app.data.repository.WalletRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class PinSetupUiState {
    object Idle : PinSetupUiState()
    object Loading : PinSetupUiState()
    object Success : PinSetupUiState()
    data class Error(val message: String) : PinSetupUiState()
}

class PinSetupViewModel(
    private val walletRepository: WalletRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<PinSetupUiState>(PinSetupUiState.Idle)
    val uiState: StateFlow<PinSetupUiState> = _uiState

    fun setupPin(pin: String, confirmPin: String) {
        if (pin.length != 6 || !pin.all { it.isDigit() }) {
            _uiState.value = PinSetupUiState.Error("Mã PIN phải bao gồm chính xác 6 chữ số")
            return
        }
        if (pin != confirmPin) {
            _uiState.value = PinSetupUiState.Error("Mã PIN xác nhận không khớp")
            return
        }

        viewModelScope.launch {
            _uiState.value = PinSetupUiState.Loading
            val result = walletRepository.setupPin(pin, confirmPin)
            result.fold(
                onSuccess = {
                    _uiState.value = PinSetupUiState.Success
                },
                onFailure = {
                    _uiState.value = PinSetupUiState.Error(it.message ?: "Thiết lập mã PIN thất bại")
                }
            )
        }
    }
}

