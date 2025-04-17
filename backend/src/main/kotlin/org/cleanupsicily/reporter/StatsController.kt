package org.cleanupsicily.reporter

import com.google.cloud.Timestamp
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.time.OffsetDateTime
import java.time.YearMonth
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter

/**
 * Data class per inviare statistiche aggregate sui report
 */
data class ReportsStats(
    val totalReports: Int,
    val countByCategory: Map<String, Int>,
    val averageSeverity: Double,
    val reportsPerMonth: Map<String, Int>
)

/**
 * Controller per l'endpoint /api/reports/stats
 */
@RestController
@RequestMapping("/api/reports")
class StatsController(
    private val firestoreService: FirestoreService
) {

    @GetMapping("/stats")
    suspend fun getStats(): ReportsStats {
        // Recupera tutti i report
        val reports = firestoreService.getReports()

        // Totale report
        val total = reports.size

        // Conteggio per categoria (esclude stringhe vuote)
        val countByCategory: Map<String, Int> = reports
            .map { it["category"]?.toString()?.takeIf { it.isNotBlank() } ?: "unknown" }
            .groupingBy { it }
            .eachCount()

        // Severità media
        val averageSeverity: Double = reports
            .mapNotNull { it["severity"]?.toString()?.toDoubleOrNull() }
            .average()
            .takeIf { !it.isNaN() } ?: 0.0

        // Report per mese (supporta String, Firestore Timestamp, java.util.Date)
        val isoFormatter = DateTimeFormatter.ISO_OFFSET_DATE_TIME
        val monthFormatter = DateTimeFormatter.ofPattern("yyyy-MM")
        val reportsPerMonth: Map<String, Int> = reports
            .mapNotNull { report ->
                val created = report["created_at"]
                // parsing flessibile
                val odt: OffsetDateTime? = when (created) {
                    is String -> runCatching { OffsetDateTime.parse(created, isoFormatter) }.getOrNull()
                    is Timestamp -> Instant.ofEpochSecond(created.seconds, created.nanos.toLong())
                        .atOffset(ZoneOffset.UTC)
                    is java.util.Date -> created.toInstant().atOffset(ZoneOffset.UTC)
                    else -> null
                }
                odt?.let { YearMonth.from(it).format(monthFormatter) }
            }
            .groupingBy { it }
            .eachCount()

        return ReportsStats(
            totalReports = total,
            countByCategory = countByCategory,
            averageSeverity = String.format("%.2f", averageSeverity).toDouble(),
            reportsPerMonth = reportsPerMonth
        )
    }
}