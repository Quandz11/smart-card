package com.smartpass.app.data.remote

import com.smartpass.app.data.local.TokenManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor(
    private val tokenManager: TokenManager
) : Interceptor {

    companion object {
        private val _unauthorizedEvent = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
        val unauthorizedEvent: SharedFlow<Unit> = _unauthorizedEvent
    }

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()

        // Skip Bearer token for public emergency endpoints and login/register
        val path = originalRequest.url.encodedPath
        val isPublic = path.contains("/api/emergency/public") ||
                path.contains("/api/auth/login") ||
                path.contains("/api/auth/register")

        val newRequest = if (!isPublic) {
            val token = tokenManager.getTokenSync() ?: runBlocking(Dispatchers.IO) { tokenManager.getToken() }
            if (!token.isNullOrEmpty()) {
                originalRequest.newBuilder()
                    .header("Authorization", "Bearer $token")
                    .build()
            } else {
                originalRequest
            }
        } else {
            originalRequest
        }

        val response = chain.proceed(newRequest)

        if (response.code == 401 && !isPublic) {
            CoroutineScope(Dispatchers.IO).launch {
                tokenManager.clearAuthData()
            }
            _unauthorizedEvent.tryEmit(Unit)
        }

        return response
    }
}
