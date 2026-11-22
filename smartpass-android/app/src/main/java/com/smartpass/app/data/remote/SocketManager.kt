package com.smartpass.app.data.remote

import android.util.Log
import com.google.gson.Gson
import com.smartpass.app.data.model.Notification
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import org.json.JSONObject

/**
 * SocketManager is the official Socket.IO singleton for SmartPass Android.
 * Transport-only: MongoDB database remains the sole source of truth.
 * Token is sent strictly via handshake auth object, never in URL or query.
 */
object SocketManager {
    private const val TAG = "SocketManager"
    private var socket: Socket? = null
    private val gson = Gson()

    private val _unreadCount = MutableStateFlow(0)
    val unreadCount: StateFlow<Int> = _unreadCount

    private val _newNotifications = MutableSharedFlow<Notification>(extraBufferCapacity = 10)
    val newNotifications: SharedFlow<Notification> = _newNotifications

    fun connect(baseUrl: String, token: String) {
        if (token.isBlank()) return
        disconnect()

        try {
            val serverUri = if (baseUrl.endsWith("/")) baseUrl.dropLast(1) else baseUrl
            val options = IO.Options().apply {
                auth = mapOf("token" to token)
                reconnection = true
                reconnectionAttempts = Int.MAX_VALUE
                reconnectionDelay = 1000
                reconnectionDelayMax = 5000
                timeout = 10000
            }

            socket = IO.socket(serverUri, options).apply {
                on(Socket.EVENT_CONNECT) {
                    Log.d(TAG, "Socket.IO connected to $serverUri")
                }
                on(Socket.EVENT_CONNECT_ERROR) { args ->
                    Log.w(TAG, "Socket.IO connect error: ${args.getOrNull(0)}")
                }
                on(Socket.EVENT_DISCONNECT) {
                    Log.d(TAG, "Socket.IO disconnected")
                }

                on("notification:new") { args ->
                    val data = args.getOrNull(0)
                    if (data is JSONObject) {
                        try {
                            val notif = gson.fromJson(data.toString(), Notification::class.java)
                            val notifId = notif.id.ifBlank { notif._id }
                            if (notifId.isNotBlank()) {
                                emit("notification:ack", JSONObject().put("notificationId", notifId))
                            }
                            _unreadCount.value = _unreadCount.value + 1
                            _newNotifications.tryEmit(notif)
                        } catch (e: Exception) {
                            Log.e(TAG, "Failed to parse incoming notification", e)
                        }
                    }
                }

                on("notification:unread") { args ->
                    val data = args.getOrNull(0)
                    if (data is JSONObject) {
                        val count = data.optInt("count", 0)
                        _unreadCount.value = count
                    }
                }

                on("notification:read") {
                    if (_unreadCount.value > 0) {
                        _unreadCount.value = _unreadCount.value - 1
                    }
                }

                on("notification:read_all") {
                    _unreadCount.value = 0
                }

                connect()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize Socket.IO", e)
        }
    }

    fun setUnreadCount(count: Int) {
        _unreadCount.value = count
    }

    fun disconnect() {
        try {
            socket?.disconnect()
            socket?.off()
            socket = null
        } catch (e: Exception) {
            Log.e(TAG, "Error disconnecting socket", e)
        }
    }
}

