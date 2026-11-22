package com.smartpass.app.ui.screens.wallet

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartpass.app.data.model.CanteenTransaction
import com.smartpass.app.data.model.Wallet
import com.smartpass.app.data.repository.WalletRepository
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class WalletUiState(
    val isLoading: Boolean = false,
    val wallet: Wallet? = null,
    val transactions: List<CanteenTransaction> = emptyList(),
    val isCreatingVnpay: Boolean = false,
    val error: String? = null
)

class WalletViewModel(private val repository: WalletRepository) : ViewModel() {
    private val _uiState = MutableStateFlow(WalletUiState(isLoading = true))
    val uiState: StateFlow<WalletUiState> = _uiState

    init {
        loadWalletData()
    }

    fun createVnpayOrder(amount: Long, onUrlReady: (String) -> Unit) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isCreatingVnpay = true, error = null)
            val result = repository.createVnpayOrder(amount)
            _uiState.value = _uiState.value.copy(isCreatingVnpay = false)
            result.fold(
                onSuccess = { res ->
                    res.paymentUrl?.let { onUrlReady(it) }
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(error = it.message ?: "Tạo đơn nạp VNPay thất bại")
                }
            )
        }
    }

    fun loadWalletData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val walletDeferred = async { repository.getMyWallet() }
            val txDeferred = async { repository.getMyTransactions() }

            val walletRes = walletDeferred.await()
            val txRes = txDeferred.await()

            walletRes.fold(
                onSuccess = { wallet ->
                    val txList = txRes.getOrNull() ?: emptyList()
                    _uiState.value = WalletUiState(
                        isLoading = false,
                        wallet = wallet,
                        transactions = txList
                    )
                },
                onFailure = {
                    _uiState.value = WalletUiState(
                        isLoading = false,
                        error = it.message ?: "Không thể tải số dư ví"
                    )
                }
            )
        }
    }
}
