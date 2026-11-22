package com.smartpass.app.core.qr

sealed class QrPayload {
    data class Token(val value: String) : QrPayload()
    data class CardCode(val value: String) : QrPayload()
    data class ServiceV1(
        val rawValue: String,
        val type: String,
        val publicId: String,
        val expiryEpoch: Long? = null,
        val signature: String
    ) : QrPayload()
    data class HumanCode(
        val rawValue: String,
        val type: String,
        val suffix: String
    ) : QrPayload()
    data class UnsupportedType(val type: String) : QrPayload()
    data class Invalid(val reason: String = "Mã QR không phải của SmartPass") : QrPayload()
}

object QrPayloadParser {
    val SUPPORTED_TYPES = setOf(
        "CANTEEN_POINT",
        "PAYMENT_REQUEST",
        "BOOK",
        "PARKING_IN",
        "PARKING_OUT",
        "ATTENDANCE_SESSION",
        "ROOM",
        "EVENT",
        "EVENT_CHECKIN",
        "GATE_IN",
        "GATE_OUT"
    )

    private val HEX_TOKEN_REGEX = Regex("^[0-9a-fA-F]{64}$")
    private val URL_TOKEN_REGEX = Regex("(?:emergency/public|public_emergency)/([0-9a-fA-F]{64})", RegexOption.IGNORE_CASE)
    private val CANONICAL_V1_REGEX = Regex("^SP1://([A-Z_]+)/([A-Za-z0-9\\-_]{16,})(?:\\?([^#]*))?$")
    private val BARE_V1_REGEX = Regex("^SP1\\.([A-Z_]+)\\.([A-Za-z0-9\\-_]{16,})\\.([0-9]+)\\.([A-Za-z0-9\\-_]{22})$")
    private val HUMAN_CODE_REGEX = Regex("^([A-Z_]+)-([A-Za-z0-9]{6,12})$")
    private val CARD_CODE_REGEX = Regex("^[A-Za-z0-9\\-]{4,32}$")

    fun parse(raw: String?): QrPayload {
        if (raw.isNullOrBlank()) {
            return QrPayload.Invalid("Mã QR không hợp lệ")
        }
        val trimmed = raw.trim()

        // 1. Legacy Emergency URL
        val urlMatch = URL_TOKEN_REGEX.find(trimmed)
        if (urlMatch != null) {
            return QrPayload.Token(urlMatch.groupValues[1].lowercase())
        }

        // 2. Legacy 64-char Hex Token
        if (HEX_TOKEN_REGEX.matches(trimmed)) {
            return QrPayload.Token(trimmed.lowercase())
        }

        // 3. V1 Canonical: SP1://<TYPE>/<publicId>?...
        val canonicalMatch = CANONICAL_V1_REGEX.find(trimmed)
        if (canonicalMatch != null) {
            val type = canonicalMatch.groupValues[1]
            val publicId = canonicalMatch.groupValues[2]
            val queryStr = canonicalMatch.groupValues[3]

            val params = queryStr.split("&").associate { param ->
                val parts = param.split("=")
                if (parts.size >= 2) parts[0] to parts[1] else parts[0] to ""
            }
            val sig = params["s"] ?: ""
            val expiryStr = params["e"]
            val expiry = expiryStr?.toLongOrNull()

            if (sig.isBlank()) {
                return QrPayload.Invalid("Mã QR không hợp lệ")
            }

            if (!SUPPORTED_TYPES.contains(type)) {
                return QrPayload.UnsupportedType(type)
            }

            return QrPayload.ServiceV1(
                rawValue = trimmed,
                type = type,
                publicId = publicId,
                expiryEpoch = expiry,
                signature = sig
            )
        }

        // 4. V1 Bare: SP1.<TYPE>.<publicId>.<expiryOr0>.<sig>
        val bareMatch = BARE_V1_REGEX.find(trimmed)
        if (bareMatch != null) {
            val type = bareMatch.groupValues[1]
            val publicId = bareMatch.groupValues[2]
            val expiryVal = bareMatch.groupValues[3].toLongOrNull() ?: 0L
            val expiry = if (expiryVal > 0) expiryVal else null
            val sig = bareMatch.groupValues[4]

            if (sig.isBlank()) {
                return QrPayload.Invalid("Mã QR không hợp lệ")
            }

            if (!SUPPORTED_TYPES.contains(type)) {
                return QrPayload.UnsupportedType(type)
            }

            return QrPayload.ServiceV1(
                rawValue = trimmed,
                type = type,
                publicId = publicId,
                expiryEpoch = expiry,
                signature = sig
            )
        }

        // 5. Human Code (Manual Entry): <TYPE>-<SUFFIX>
        val humanMatch = HUMAN_CODE_REGEX.find(trimmed)
        if (humanMatch != null) {
            val type = humanMatch.groupValues[1]
            val suffix = humanMatch.groupValues[2]

            if (SUPPORTED_TYPES.contains(type)) {
                return QrPayload.HumanCode(
                    rawValue = trimmed,
                    type = type,
                    suffix = suffix
                )
            }
            // If type not recognized as SmartPass service type, might be card code or unsupported
            if (trimmed.startsWith("CARD-") || trimmed.startsWith("SP-")) {
                return QrPayload.CardCode(trimmed)
            }
            return QrPayload.UnsupportedType(type)
        }

        // 6. Legacy Card Code (4..32 chars)
        if (CARD_CODE_REGEX.matches(trimmed)) {
            return QrPayload.CardCode(trimmed)
        }

        return QrPayload.Invalid("Mã QR không phải của SmartPass")
    }
}
