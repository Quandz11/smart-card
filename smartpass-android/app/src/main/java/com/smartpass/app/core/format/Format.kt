package com.smartpass.app.core.format

import java.text.DecimalFormat
import java.text.DecimalFormatSymbols
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

object Format {

    fun formatVND(amount: Long): String {
        val symbols = DecimalFormatSymbols(Locale("vi", "VN")).apply {
            groupingSeparator = '.'
            decimalSeparator = ','
        }
        val formatter = DecimalFormat("#,###", symbols)
        return "${formatter.format(amount)} ₫"
    }

    fun formatVND(amount: Double): String = formatVND(amount.toLong())

    fun formatDate(isoDate: String?): String {
        if (isoDate.isNullOrBlank()) return "--/--/----"
        return try {
            val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }
            val date = inputFormat.parse(isoDate) ?: return isoDate
            val outputFormat = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
            outputFormat.format(date)
        } catch (_: Exception) {
            try {
                val inputFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
                val date = inputFormat.parse(isoDate) ?: return isoDate
                val outputFormat = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
                outputFormat.format(date)
            } catch (_: Exception) {
                isoDate
            }
        }
    }

    fun formatDateTime(isoDate: String?): String {
        if (isoDate.isNullOrBlank()) return "--/--/---- --:--"
        return try {
            val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }
            val date = inputFormat.parse(isoDate) ?: return isoDate
            val outputFormat = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault())
            outputFormat.format(date)
        } catch (_: Exception) {
            try {
                val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                }
                val date = inputFormat.parse(isoDate) ?: return isoDate
                val outputFormat = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault())
                outputFormat.format(date)
            } catch (_: Exception) {
                isoDate
            }
        }
    }

    fun maskToken(token: String?): String {
        if (token.isNullOrBlank()) return "•••• •••• •••• ••••"
        return if (token.length > 4) {
            "•••• •••• •••• " + token.takeLast(4)
        } else {
            token
        }
    }
}

