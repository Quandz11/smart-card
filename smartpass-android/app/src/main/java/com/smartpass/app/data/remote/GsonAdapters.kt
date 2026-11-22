package com.smartpass.app.data.remote

import com.google.gson.*
import com.google.gson.reflect.TypeToken
import com.smartpass.app.data.model.Attendance
import com.smartpass.app.data.model.AttendanceHistoryResponse
import com.smartpass.app.data.model.AttendanceStats
import com.smartpass.app.data.model.ClassSchedule
import com.smartpass.app.data.model.ScheduleResponse
import java.lang.reflect.Type

object GsonAdapters {

    class AttendanceHistoryDeserializer : JsonDeserializer<AttendanceHistoryResponse> {
        override fun deserialize(
            json: JsonElement,
            typeOfT: Type,
            context: JsonDeserializationContext
        ): AttendanceHistoryResponse {
            return if (json.isJsonArray) {
                val listType = object : TypeToken<List<Attendance>>() {}.type
                val records: List<Attendance> = context.deserialize(json, listType)
                AttendanceHistoryResponse(records = records)
            } else if (json.isJsonObject) {
                val obj = json.asJsonObject
                val recordsElem = obj.get("records")
                val records: List<Attendance> = if (recordsElem != null && recordsElem.isJsonArray) {
                    val listType = object : TypeToken<List<Attendance>>() {}.type
                    context.deserialize(recordsElem, listType)
                } else {
                    emptyList()
                }
                val statsElem = obj.get("stats")
                val stats: AttendanceStats? = if (statsElem != null && statsElem.isJsonObject) {
                    context.deserialize(statsElem, AttendanceStats::class.java)
                } else null
                AttendanceHistoryResponse(records = records, stats = stats)
            } else {
                AttendanceHistoryResponse()
            }
        }
    }

    class AttendanceDeserializer : JsonDeserializer<Attendance> {
        override fun deserialize(
            json: JsonElement,
            typeOfT: Type,
            context: JsonDeserializationContext
        ): Attendance {
            if (!json.isJsonObject) return Attendance(_id = "")
            val obj = json.asJsonObject
            val id = obj.get("_id")?.asString ?: ""

            var classSessionStr = obj.get("classSession")?.asString
            var subjectStr = obj.get("subject")?.asString

            val sessionElem = obj.get("session")
            if (sessionElem != null && sessionElem.isJsonObject) {
                val sessObj = sessionElem.asJsonObject
                if (classSessionStr.isNullOrBlank()) {
                    classSessionStr = sessObj.get("sessionCode")?.asString
                }
                val slotElem = sessObj.get("scheduleSlot")
                if (slotElem != null && slotElem.isJsonObject) {
                    val slotObj = slotElem.asJsonObject
                    if (classSessionStr.isNullOrBlank()) {
                        classSessionStr = slotObj.get("room")?.asString
                    }
                    val subjElem = slotObj.get("subject")
                    if (subjElem != null && subjElem.isJsonObject && subjectStr.isNullOrBlank()) {
                        val code = subjElem.asJsonObject.get("code")?.asString
                        val name = subjElem.asJsonObject.get("name")?.asString
                        subjectStr = if (!code.isNullOrBlank() && !name.isNullOrBlank()) {
                            "$code - $name"
                        } else name ?: code
                    }
                }
            }

            val checkedAtStr = obj.get("checkedAt")?.asString
                ?: obj.get("checkedInAt")?.asString
                ?: ""
            val statusStr = obj.get("status")?.asString ?: "PRESENT"
            val methodStr = obj.get("method")?.asString
            val noteStr = obj.get("note")?.asString

            return Attendance(
                _id = id,
                classSession = classSessionStr ?: "Buổi học",
                subject = subjectStr,
                checkedAt = checkedAtStr,
                checkedInAt = checkedAtStr,
                status = statusStr,
                session = null,
                method = methodStr,
                note = noteStr
            )
        }
    }

    class ScheduleResponseDeserializer : JsonDeserializer<ScheduleResponse> {
        override fun deserialize(
            json: JsonElement,
            typeOfT: Type,
            context: JsonDeserializationContext
        ): ScheduleResponse {
            return if (json.isJsonArray) {
                val listType = object : TypeToken<List<ClassSchedule>>() {}.type
                val slots: List<ClassSchedule> = context.deserialize(json, listType)
                ScheduleResponse(slots = slots)
            } else if (json.isJsonObject) {
                val obj = json.asJsonObject
                val slotsElem = obj.get("slots")
                val slots: List<ClassSchedule> = if (slotsElem != null && slotsElem.isJsonArray) {
                    val listType = object : TypeToken<List<ClassSchedule>>() {}.type
                    context.deserialize(slotsElem, listType)
                } else {
                    emptyList()
                }
                val weekNum = obj.get("weekNumber")?.asInt
                val msg = obj.get("message")?.asString
                ScheduleResponse(slots = slots, weekNumber = weekNum, message = msg)
            } else {
                ScheduleResponse()
            }
        }
    }

    class ClassScheduleDeserializer : JsonDeserializer<ClassSchedule> {
        override fun deserialize(
            json: JsonElement,
            typeOfT: Type,
            context: JsonDeserializationContext
        ): ClassSchedule {
            if (!json.isJsonObject) return ClassSchedule(_id = "")
            val obj = json.asJsonObject
            val id = obj.get("_id")?.asString ?: ""

            var subjectStr = ""
            val subjElem = obj.get("subject")
            if (subjElem != null) {
                if (subjElem.isJsonObject) {
                    val sObj = subjElem.asJsonObject
                    val code = sObj.get("code")?.asString
                    val name = sObj.get("name")?.asString
                    subjectStr = if (!code.isNullOrBlank() && !name.isNullOrBlank()) {
                        "$code - $name"
                    } else name ?: code ?: ""
                } else if (subjElem.isJsonPrimitive) {
                    subjectStr = subjElem.asString
                }
            }

            var teacherStr: String? = null
            val teacherElem = obj.get("teacher")
            if (teacherElem != null) {
                if (teacherElem.isJsonObject) {
                    teacherStr = teacherElem.asJsonObject.get("fullName")?.asString
                } else if (teacherElem.isJsonPrimitive) {
                    teacherStr = teacherElem.asString
                }
            }

            var classNameStr = obj.get("className")?.asString ?: ""
            val schoolClassElem = obj.get("schoolClass")
            if (classNameStr.isBlank() && schoolClassElem != null && schoolClassElem.isJsonObject) {
                classNameStr = schoolClassElem.asJsonObject.get("name")?.asString ?: ""
            }

            val room = obj.get("room")?.asString
            val rawDay = obj.get("dayOfWeek")?.asInt ?: 2
            val dayOfWeek = if (rawDay == 8) 1 else rawDay // 8 (Chủ nhật) maps to Calendar.SUNDAY (1)
            val startTime = obj.get("startTime")?.asString ?: ""
            val endTime = obj.get("endTime")?.asString ?: ""
            val semester = obj.get("semester")?.asString

            return ClassSchedule(
                _id = id,
                className = classNameStr,
                subject = subjectStr,
                teacher = teacherStr,
                room = room,
                dayOfWeek = dayOfWeek,
                startTime = startTime,
                endTime = endTime,
                semester = semester
            )
        }
    }

    fun buildGson(): Gson {
        return GsonBuilder()
            .registerTypeAdapter(AttendanceHistoryResponse::class.java, AttendanceHistoryDeserializer())
            .registerTypeAdapter(Attendance::class.java, AttendanceDeserializer())
            .registerTypeAdapter(ScheduleResponse::class.java, ScheduleResponseDeserializer())
            .registerTypeAdapter(ClassSchedule::class.java, ClassScheduleDeserializer())
            .create()
    }
}

