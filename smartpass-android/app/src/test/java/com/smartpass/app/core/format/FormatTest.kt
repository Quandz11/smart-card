package com.smartpass.app.core.format

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class FormatTest {

    @Test
    fun `formatVND formats numbers with dot separator and currency symbol`() {
        val result1 = Format.formatVND(150000L)
        assertTrue(result1.contains("150.000") && result1.contains("₫"))

        val result2 = Format.formatVND(0L)
        assertTrue(result2.contains("0") && result2.contains("₫"))

        val result3 = Format.formatVND(10000000L)
        assertTrue(result3.contains("10.000.000") && result3.contains("₫"))
    }

    @Test
    fun `formatDate parses ISO strings to DD-MM-YYYY`() {
        val dateStr = "2026-11-11T10:30:00.000Z"
        val formatted = Format.formatDate(dateStr)
        assertTrue(formatted.contains("11/11/2026"))

        assertEquals("--/--/----", Format.formatDate(null))
        assertEquals("--/--/----", Format.formatDate(""))
    }

    @Test
    fun `formatDateTime returns fallback for null or blank`() {
        assertEquals("--/--/---- --:--", Format.formatDateTime(null))
        assertEquals("--/--/---- --:--", Format.formatDateTime("   "))
    }
}

