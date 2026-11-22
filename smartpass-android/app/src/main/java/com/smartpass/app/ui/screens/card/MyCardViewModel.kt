package com.smartpass.app.ui.screens.card

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartpass.app.data.model.Card
import com.smartpass.app.data.model.User
import com.smartpass.app.data.repository.AuthRepository
import com.smartpass.app.data.repository.CardRepository
import com.smartpass.app.data.repository.EmergencyRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class MyCardUiState(
    val isLoading: Boolean = false,
    val user: User? = null,
    val card: Card? = null,
    val qrToken: String = "",
    val isRotating: Boolean = false,
    val isMarkingLost: Boolean = false,
    val actionSuccessMessage: String? = null,
    val error: String? = null
)

class MyCardViewModel(
    private val authRepository: AuthRepository,
    private val cardRepository: CardRepository,
    private val emergencyRepository: EmergencyRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(MyCardUiState(isLoading = true))
    val uiState: StateFlow<MyCardUiState> = _uiState

    init {
        loadCardData()
    }

    fun loadCardData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val userResult = authRepository.getMe()

            userResult.fold(
                onSuccess = { user ->
                    val emergencyResult = emergencyRepository.getMyProfile()
                    val emergencyProfile = emergencyResult.getOrNull()
                    val token = emergencyProfile?._id ?: user._id

                    _uiState.value = MyCardUiState(
                        isLoading = false,
                        user = user,
                        qrToken = token
                    )
                },
                onFailure = {
                    _uiState.value = MyCardUiState(isLoading = false, error = it.message)
                }
            )
        }
    }

    fun rotateQr() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isRotating = true, error = null, actionSuccessMessage = null)
            val result = emergencyRepository.rotateQr()
            result.fold(
                onSuccess = { newQrToken ->
                    _uiState.value = _uiState.value.copy(
                        isRotating = false,
                        qrToken = newQrToken,
                        actionSuccessMessage = "Đã làm mới mã QR thành công. Mã cũ không còn hiệu lực."
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(
                        isRotating = false,
                        error = it.message ?: "Không thể đổi mã QR"
                    )
                }
            )
        }
    }

    fun markCardLost() {
        val user = _uiState.value.user ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isMarkingLost = true, error = null, actionSuccessMessage = null)
            val cardId = _uiState.value.card?._id ?: user._id
            val result = cardRepository.markCardLost(cardId)
            result.fold(
                onSuccess = { card ->
                    _uiState.value = _uiState.value.copy(
                        isMarkingLost = false,
                        card = card,
                        actionSuccessMessage = "Thẻ đã được báo mất thành công và tạm thời vô hiệu hóa."
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(
                        isMarkingLost = false,
                        error = it.message ?: "Không thể báo mất thẻ"
                    )
                }
            )
        }
    }

    fun clearFeedback() {
        _uiState.value = _uiState.value.copy(error = null, actionSuccessMessage = null)
    }
}
