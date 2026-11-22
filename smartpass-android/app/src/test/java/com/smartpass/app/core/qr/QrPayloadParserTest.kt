package com.smartpass.app.core.qr

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class QrPayloadParserTest {

    @Test
    fun testVector1_valid64CharRawHexToken() {
        val input = "cdc040ad37ddfdfc53acffd172d14062f2cfdc403f5a121e340eba2c628ad51c"
        val parsed = QrPayloadParser.parse(input)
        assertTrue("Expected Token payload but got $parsed", parsed is QrPayload.Token)
        assertEquals(input.lowercase(), (parsed as QrPayload.Token).value)
    }

    @Test
    fun testVector2_validEmergencyUrl() {
        val token = "f1160416bc613040c9fa2fae3a1bd720bea498148c16e5b8e4ebf62f33022bc9"
        val input = "https://smartpass.edu/emergency/public/$token"
        val parsed = QrPayloadParser.parse(input)
        assertTrue("Expected Token payload from URL but got $parsed", parsed is QrPayload.Token)
        assertEquals(token, (parsed as QrPayload.Token).value)
    }

    @Test
    fun testVector3_validCardCode() {
        val input = "CARD-STU001"
        val parsed = QrPayloadParser.parse(input)
        assertTrue("Expected CardCode payload but got $parsed", parsed is QrPayload.CardCode)
        assertEquals("CARD-STU001", (parsed as QrPayload.CardCode).value)
    }

    @Test
    fun testVector4_validSeedCardCode() {
        val input = "SP-SEED-10001"
        val parsed = QrPayloadParser.parse(input)
        assertTrue("Expected CardCode payload but got $parsed", parsed is QrPayload.CardCode)
        assertEquals("SP-SEED-10001", (parsed as QrPayload.CardCode).value)
    }

    @Test
    fun testVector5_canonicalV1_staticBook() {
        val input = "SP1://BOOK/9c7a01d674b88931b99a?s=D4Xo2t7i9_1a3b8c9d0e1f"
        val parsed = QrPayloadParser.parse(input)
        assertTrue("Expected ServiceV1 payload but got $parsed", parsed is QrPayload.ServiceV1)
        val v1 = parsed as QrPayload.ServiceV1
        assertEquals("BOOK", v1.type)
        assertEquals("9c7a01d674b88931b99a", v1.publicId)
        assertNull(v1.expiryEpoch)
        assertEquals("D4Xo2t7i9_1a3b8c9d0e1f", v1.signature)
    }

    @Test
    fun testVector6_bareV1_staticCanteen() {
        val input = "SP1.CANTEEN_POINT.canteen_pos_01_hex1234.0.K8Lm9NoPqRsTuVwXyZ0123"
        val parsed = QrPayloadParser.parse(input)
        assertTrue("Expected ServiceV1 payload from bare format but got $parsed", parsed is QrPayload.ServiceV1)
        val v1 = parsed as QrPayload.ServiceV1
        assertEquals("CANTEEN_POINT", v1.type)
        assertEquals("canteen_pos_01_hex1234", v1.publicId)
        assertNull(v1.expiryEpoch)
        assertEquals("K8Lm9NoPqRsTuVwXyZ0123", v1.signature)
    }

    @Test
    fun testVector7_canonicalV1_dynamicAttendanceWithExpiry() {
        val expiry = 1794500000L
        val input = "SP1://ATTENDANCE_SESSION/sess_class_se101_abc?e=$expiry&s=Sig22CharactersLong12"
        val parsed = QrPayloadParser.parse(input)
        assertTrue("Expected ServiceV1 payload with expiry but got $parsed", parsed is QrPayload.ServiceV1)
        val v1 = parsed as QrPayload.ServiceV1
        assertEquals("ATTENDANCE_SESSION", v1.type)
        assertEquals("sess_class_se101_abc", v1.publicId)
        assertEquals(expiry, v1.expiryEpoch)
        assertEquals("Sig22CharactersLong12", v1.signature)
    }

    @Test
    fun testVector8_humanCodeManualEntry() {
        val input = "BOOK-X7K2P9"
        val parsed = QrPayloadParser.parse(input)
        assertTrue("Expected HumanCode payload but got $parsed", parsed is QrPayload.HumanCode)
        val human = parsed as QrPayload.HumanCode
        assertEquals("BOOK", human.type)
        assertEquals("X7K2P9", human.suffix)
    }

    @Test
    fun testVector9_unknownFutureType_gracefulMessage() {
        val input = "SP1://FUTURE_MODULE/abcdef1234567890?s=1234567890123456789012"
        val parsed = QrPayloadParser.parse(input)
        assertTrue("Expected UnsupportedType payload but got $parsed", parsed is QrPayload.UnsupportedType)
        assertEquals("FUTURE_MODULE", (parsed as QrPayload.UnsupportedType).type)
    }

    @Test
    fun testVector10_invalidArbitraryUrl() {
        val input = "https://google.com/search?q=test"
        val parsed = QrPayloadParser.parse(input)
        assertTrue("Expected Invalid payload for external URL but got $parsed", parsed is QrPayload.Invalid)
        assertEquals("Mã QR không phải của SmartPass", (parsed as QrPayload.Invalid).reason)
    }

    @Test
    fun testVector11_emptyOrWhitespaceString() {
        val parsed = QrPayloadParser.parse("   ")
        assertTrue("Expected Invalid payload for empty string but got $parsed", parsed is QrPayload.Invalid)
    }
}
