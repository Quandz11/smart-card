package com.smartpass.app.ui.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartpass.app.data.local.TokenManager
import com.smartpass.app.data.model.ClassSchedule
import com.smartpass.app.data.model.User
import com.smartpass.app.data.model.Wallet
import com.smartpass.app.data.remote.ApiClient
import com.smartpass.app.data.remote.SocketManager
import com.smartpass.app.data.repository.*
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.util.Calendar

data class HomeUiState(
    val isLoading: Boolean = true,
    val user: User? = null,
    val wallet: Wallet? = null,
    val cardQrToken: String = "",
    val cardStatus: String = "active",
    val todaySchedules: List<ClassSchedule> = emptyList(),
    val unreadNotifsCount: Int = 0,
    val error: String? = null
)

class HomeViewModel(
    private val authRepo: AuthRepository,
    private val walletRepo: WalletRepository,
    private val scheduleRepo: ScheduleRepository,
    private val notifRepo: NotificationRepository,
    private val emergencyRepo: EmergencyRepository,
    private val tokenManager: TokenManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState

    init {
        loadData()
        observeSocket()
    }

    private fun observeSocket() {
        viewModelScope.launch {
            tokenManager.getToken()?.let { token ->
                if (token.isNotBlank()) {
                    SocketManager.connect(ApiClient.getBaseUrl(), token)
                }
            }
            SocketManager.unreadCount.collect { count ->
                _uiState.value = _uiState.value.copy(unreadNotifsCount = count)
            }
        }
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

            val userDeferred = async { authRepo.getMe() }
            val walletDeferred = async { walletRepo.getMyWallet() }
            val scheduleDeferred = async { scheduleRepo.getMySchedule() }
            val notifDeferred = async { notifRepo.getMyNotifications() }
            val emergencyDeferred = async { emergencyRepo.getMyProfile() }

            val userResult = userDeferred.await()
            val walletResult = walletDeferred.await()
            val scheduleResult = scheduleDeferred.await()
            val notifResult = notifDeferred.await()
            val emergencyResult = emergencyDeferred.await()

            userResult.fold(
                onSuccess = { user ->
                    val wallet = walletResult.getOrNull()
                    val unreadCount = notifResult.getOrNull()?.count { !it.isRead } ?: 0

                    // Filter schedule for today (Calendar day: 1=Sun, 2=Mon... 7=Sat)
                    val calendar = Calendar.getInstance()
                    val dayOfWeek = calendar.get(Calendar.DAY_OF_WEEK)
                    val todaySchedules = scheduleResult.getOrNull()?.filter { it.dayOfWeek == dayOfWeek } ?: emptyList()

                    val qrToken = emergencyResult.getOrNull()?._id ?: user._id

                    _uiState.value = HomeUiState(
                        isLoading = false,
                        user = user,
                        wallet = wallet,
                        cardQrToken = qrToken,
                        cardStatus = if (user.isActive) "active" else "locked",
                        todaySchedules = todaySchedules,
                        unreadNotifsCount = unreadCount
                    )
                },
                onFailure = { error ->
                    _uiState.value = HomeUiState(
                        isLoading = false,
                        error = error.message ?: "Không thể tải thông tin trang chủ"
                    )
                }
            )
        }
    }
}

