package com.smartpass.app.ui.screens.staff_canteen

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartpass.app.data.model.CanteenTransaction
import com.smartpass.app.data.model.DynamicQrResponse
import com.smartpass.app.data.model.WalletPayRequest
import com.smartpass.app.data.model.WalletTopUpRequest
import com.smartpass.app.data.repository.QrRepository
import com.smartpass.app.data.repository.WalletRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class StaffCanteenUiState(
    val selectedTab: Int = 0, // 0: Thanh toán, 1: Nạp tiền, 2: Lịch sử giao dịch
    val isSubmitting: Boolean = false,
    val allTransactions: List<CanteenTransaction> = emptyList(),
    val successMessage: String? = null,
    val error: String? = null
)

class StaffCanteenViewModel(
    private val walletRepo: WalletRepository,
    private val qrRepo: QrRepository? = null
) : ViewModel() {

    private val _uiState = MutableStateFlow(StaffCanteenUiState())
    val uiState: StateFlow<StaffCanteenUiState> = _uiState

    init {
        loadAllTransactions()
    }

    fun selectTab(tab: Int) {
        _uiState.value = _uiState.value.copy(selectedTab = tab, error = null, successMessage = null)
        if (tab == 2) loadAllTransactions()
    }

    fun generatePaymentRequest(amount: Long, counter: String = "Quầy 1", onResult: (DynamicQrResponse) -> Unit) {
        viewModelScope.launch {
            val res = qrRepo?.generatePaymentRequest(amount, counter)
            res?.fold(
                onSuccess = { onResult(it) },
                onFailure = { _uiState.value = _uiState.value.copy(error = it.message ?: "Tạo mã thanh toán thất bại") }
            )
        }
    }

    fun loadAllTransactions() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, error = null)
            val result = walletRepo.getAllTransactions()
            result.fold(
                onSuccess = { _uiState.value = _uiState.value.copy(isSubmitting = false, allTransactions = it) },
                onFailure = { _uiState.value = _uiState.value.copy(isSubmitting = false, error = it.message) }
            )
        }
    }

    fun pay(cardOrToken: String, amount: Long, studentPin: String, note: String?) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, error = null, successMessage = null)
            val request = WalletPayRequest(
                cardCode = if (cardOrToken.length <= 16) cardOrToken else null,
                qrToken = if (cardOrToken.length > 16) cardOrToken else null,
                amount = amount,
                pin = studentPin,
                note = note?.ifBlank { null }
            )
            val result = walletRepo.pay(request)
            result.fold(
                onSuccess = { tx ->
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        successMessage = "Thanh toán thành công ${com.smartpass.app.core.format.Format.formatVND(tx.amount)}. Số dư còn lại: ${com.smartpass.app.core.format.Format.formatVND(tx.balanceAfter)}"
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(isSubmitting = false, error = it.message ?: "Thanh toán thất bại")
                }
            )
        }
    }

    fun topUp(cardOrToken: String, amount: Long, staffPin: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, error = null, successMessage = null)
            val request = WalletTopUpRequest(
                cardCode = if (cardOrToken.length <= 16) cardOrToken else null,
                qrToken = if (cardOrToken.length > 16) cardOrToken else null,
                amount = amount,
                pin = staffPin
            )
            val result = walletRepo.topUp(request)
            result.fold(
                onSuccess = { tx ->
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        successMessage = "Nạp tiền thành công ${com.smartpass.app.core.format.Format.formatVND(tx.amount)}. Số dư mới: ${com.smartpass.app.core.format.Format.formatVND(tx.balanceAfter)}"
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(isSubmitting = false, error = it.message ?: "Nạp tiền thất bại")
                }
            )
        }
    }

    fun clearFeedback() {
        _uiState.value = _uiState.value.copy(error = null, successMessage = null)
    }
}

