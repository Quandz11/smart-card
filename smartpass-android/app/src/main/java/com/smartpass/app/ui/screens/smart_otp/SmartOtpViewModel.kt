package com.smartpass.app.ui.screens.smart_otp

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartpass.app.data.model.OtpChallengeDto
import com.smartpass.app.data.repository.OtpRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class SmartOtpUiState(
    val isLoading: Boolean = false,
    val activeChallenge: OtpChallengeDto? = null,
    val countdown: Int = 0,
    val error: String? = null,
    val successMessage: String? = null
)

class SmartOtpViewModel(
    private val otpRepository: OtpRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SmartOtpUiState())
    val uiState: StateFlow<SmartOtpUiState> = _uiState

    private var timerJob: Job? = null

    init {
        loadActiveChallenge()
    }

    fun loadActiveChallenge() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val result = otpRepository.getActiveOtp()
            result.fold(
                onSuccess = { challenge ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        activeChallenge = challenge,
                        countdown = challenge?.remainingSeconds ?: 0
                    )
                    startCountdown()
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(isLoading = false, activeChallenge = null)
                }
            )
        }
    }

    fun requestOtp(purpose: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null, successMessage = null)
            val result = otpRepository.requestOtp(purpose)
            result.fold(
                onSuccess = { res ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        successMessage = "Yêu cầu mã Smart OTP thành công",
                        countdown = res.remainingSeconds ?: 300
                    )
                    loadActiveChallenge()
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = it.message ?: "Yêu cầu mã OTP thất bại"
                    )
                }
            )
        }
    }

    private fun startCountdown() {
        timerJob?.cancel()
        timerJob = viewModelScope.launch {
            while (_uiState.value.countdown > 0) {
                delay(1000)
                val current = _uiState.value.countdown - 1
                _uiState.value = _uiState.value.copy(countdown = current)
                if (current <= 0) {
                    _uiState.value = _uiState.value.copy(activeChallenge = null)
                }
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        timerJob?.cancel()
    }
}

