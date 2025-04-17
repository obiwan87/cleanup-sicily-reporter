package org.cleanupsicily.reporter

import org.springframework.stereotype.Component
import java.io.ByteArrayOutputStream
import java.nio.charset.StandardCharsets
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

/**
 * Esporta i report in formato CSV.
 * Ordinamento per data di creazione decrescente e
 * inserisce, in testa, un commento con timestamp.
 */
@Component
class CsvReportExporter {

    fun export(reports: List<Map<String, Any>>): ByteArray {
        // Ordina i report per created_at in ordine decrescente
        val sorted = reports.sortedByDescending { it["created_at"]?.toString() }

        // Costruzione CSV
        val sb = StringBuilder()
        val formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")
        val timestamp = LocalDateTime.now().format(formatter)

        // Riga commento iniziale con timestamp
        sb.append("# Cleanup Sicily Report generated at $timestamp").append("\n")

        // Header
        sb.append(listOf(
            "Summary", "Address", "Category", "CreatedAt", "Severity", "Latitude", "Longitude", "Description"
        ).joinToString(",")).append("\n")

        for (report in sorted) {
            val summary     = sanitize(report["summary"])
            val address     = sanitize(report["address"])
            val category    = sanitize(report["category"])
            val createdAt   = sanitize(report["created_at"])
            val severity    = sanitize(report["severity"])
            // Coordinate nido in mappa "coordinates"
            val coords      = report["coordinates"] as? Map<*, *>
            val latitude    = sanitize(coords?.get("lat"))
            val longitude   = sanitize(coords?.get("lon"))
            val description = sanitize(report["description"])

            sb.append(listOf(
                summary, address, category, createdAt,
                severity, latitude, longitude, description
            ).joinToString(",")).append("\n")
        }

        return sb.toString().toByteArray(StandardCharsets.UTF_8)
    }

    /**
     * Sanifica un valore, rimuovendo newline e gestendo le virgolette
     */
    private fun sanitize(value: Any?): String {
        val s = value?.toString()?.replace("\n", " ") ?: ""
        // Escape delle virgolette interne secondo RFC
        val escaped = s.replace("\"", "\"\"")
        return "\"$escaped\""
    }
}
