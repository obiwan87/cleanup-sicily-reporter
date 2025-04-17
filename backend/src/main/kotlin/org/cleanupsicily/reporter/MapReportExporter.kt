package org.cleanupsicily.reporter

import org.springframework.stereotype.Component
import java.io.ByteArrayOutputStream

/**
 * Esporta i report in un file HTML con mappa Leaflet,
 * marker colorati per categoria e balloon-tip con summary,
 * indirizzo, data e severità.
 */
@Component
class MapReportExporter {

    fun export(reports: List<Map<String, Any>>): ByteArray {
        // Mappa categoria -> colore marker
        val colorMap = mapOf(
            "rifiuti" to "green",
            "erosione" to "blue",
            "inquinamento" to "red"
            // aggiungi altre categorie se serve
        )

        // Genera gli script di marker per ogni report
        val markerScripts = reports.mapNotNull { report ->
            val coords = report["coordinates"] as? Map<*, *>
            val lat = coords?.get("lat")?.toString() ?: return@mapNotNull null
            val lon = coords["lon"]?.toString() ?: return@mapNotNull null
            val summary = (report["summary"]?.toString() ?: "").replace("\"", "\\\"")
            val address = (report["address"]?.toString() ?: "").replace("\"", "\\\"")
            val createdAt = report["created_at"]?.toString() ?: ""
            val severity = report["severity"]?.toString() ?: ""
            val category = report["category"]?.toString() ?: ""
            val color = colorMap[category] ?: "gray"

            // CircleMarker con popup HTML
            """
            L.circleMarker([$lat, $lon], { color: '$color', radius: 8 })
              .bindPopup("<b>$summary</b><br/>$address<br/>Data: $createdAt<br/>Severità: $severity")
              .addTo(map);
            """.trimIndent()
        }.joinToString("\n")

        // HTML completo con Leaflet
        val html = """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Cleanup Sicily Report Map</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
  <style>#map { height: 100vh; width: 100%; }</style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
  <script>
    // Inizializza mappa centrata sulla Sicilia
    var map = L.map('map').setView([37.5, 15.1], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Marker dei report
    $markerScripts
  </script>
</body>
</html>"""

        return html.toByteArray(Charsets.UTF_8)
    }
}
