package com.smartpass.app.ui.screens.staff_verify

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartpass.app.data.model.CardVerifyResponse
import com.smartpass.app.data.model.VerifyCardRequest
import com.smartpass.app.data.repository.CardRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class StaffCardVerifyUiState(
    val isVerifying: Boolean = false,
    val result: CardVerifyResponse? = null,
    val error: String? = null
)

class StaffCardVerifyViewModel(private val repository: CardRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(StaffCardVerifyUiState())
    val uiState: StateFlow<StaffCardVerifyUiState> = _uiState

    fun verify(codeOrToken: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isVerifying = true, error = null, result = null)
            val request = VerifyCardRequest(
                cardCode = if (codeOrToken.length <= 16) codeOrToken else null,
                qrToken = if (codeOrToken.length > 16) codeOrToken else null
            )
            val result = repository.verifyCard(request)
            result.fold(
                onSuccess = { res ->
                    _uiState.value = StaffCardVerifyUiState(isVerifying = false, result = res)
                },
                onFailure = { err ->
                    _uiState.value = StaffCardVerifyUiState(isVerifying = false, error = err.message ?: "Xác thực thẻ thất bại")
                }
            )
        }
    }

    fun clearFeedback() {
        _uiState.value = _uiState.value.copy(error = null, result = null)
    }
}

