package com.smartpass.app.data.remote

import com.google.gson.Gson
import com.google.gson.JsonObject
import retrofit2.Response

object ApiErrorParser {
    private val gson = Gson()

    fun parseError(response: Response<*>, defaultMessage: String = "Yêu cầu thất bại"): String {
        return try {
            val errorBody = response.errorBody()?.string()
            if (!errorBody.isNullOrBlank()) {
                val json = gson.fromJson(errorBody, JsonObject::class.java)
                when {
                    json.has("message") && !json.get("message").isJsonNull -> json.get("message").asString
                    json.has("error") && !json.get("error").isJsonNull -> json.get("error").asString
                    else -> defaultMessage
                }
            } else {
                response.message().ifBlank { defaultMessage }
            }
        } catch (_: Exception) {
            defaultMessage
        }
    }
}

