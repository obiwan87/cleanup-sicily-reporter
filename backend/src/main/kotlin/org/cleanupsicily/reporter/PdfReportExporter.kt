package org.cleanupsicily.reporter

import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.pdmodel.PDPage
import org.apache.pdfbox.pdmodel.PDPageContentStream
import org.apache.pdfbox.pdmodel.PDPageContentStream.AppendMode
import org.apache.pdfbox.pdmodel.font.PDType1Font
import org.springframework.stereotype.Component
import java.io.ByteArrayOutputStream
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@Component
class PdfReportExporter {

    fun export(reports: List<Map<String, Any>>): ByteArray {
        // Ordina i report per data decrescente
        val sortedReports = reports.sortedByDescending { it["created_at"]?.toString() }

        val doc = PDDocument()
        var page = PDPage()
        doc.addPage(page)

        val font = PDType1Font.HELVETICA
        val fontSize = 10f
        val maxWidth = 500f

        var contentStream = PDPageContentStream(doc, page)
        contentStream.beginText()
        contentStream.setFont(font, fontSize)
        contentStream.newLineAtOffset(40f, 750f)

        var linesOnPage = 0

        // Itera sui report già ordinati
        for ((index, report) in sortedReports.withIndex()) {
            // Sanifica input
            val summary = report["summary"]?.toString()?.replace("\n", " ") ?: "Nessun sommario"
            val description = report["description"]?.toString()?.replace("\n", " ") ?: "Nessuna descrizione"
            val category = report["category"]?.toString()?.replace("\n", " ") ?: "?"
            val createdAt = report["created_at"]?.toString()?.replace("\n", " ") ?: "?"
            val severity = report["severity"]?.toString()?.replace("\n", " ") ?: "?"

            // Modalità di localizzazione
            val locationMode = report["location_mode"]?.toString()
            val rawAddress = report["address"]?.toString()?.replace("\n", " ") ?: "?"
            val houseNumber = report["house_number"]?.toString()?.replace("\n", " ")
            val city = report["city"]?.toString()?.replace("\n", " ")
            val zip = report["zip_code"]?.toString()?.replace("\n", " ")
            val coords = report["coordinates"] as? Map<*, *>
            val lat = coords?.get("lat")?.toString()?.replace("\n", " ")
            val lon = coords?.get("lon")?.toString()?.replace("\n", " ")

            // Costruisci le righe di testo
            val summaryLine = "${index + 1}) $summary"
            val addressLine = when (locationMode) {
                "address" -> {
                    val fullAddr = listOfNotNull(houseNumber, rawAddress).joinToString(", ")
                    val cityZip = listOfNotNull(city, zip).joinToString(", ")
                    "   Indirizzo: $fullAddr" + if (cityZip.isNotEmpty()) ", $cityZip" else ""
                }
                else -> "   Indirizzo: $rawAddress"
            } + " | Categoria: $category"
            val dateLine = "   Data: $createdAt | Severità: $severity"

            val lines = mutableListOf<String>()
            lines.addAll(wrapText(summaryLine, fontSize, font, maxWidth))
            lines.addAll(wrapText(addressLine, fontSize, font, maxWidth))
            lines.addAll(wrapText(dateLine, fontSize, font, maxWidth))
            if (locationMode != "address" && lat != null && lon != null) {
                val coordLine = "   Coordinate GPS: $lat, $lon"
                lines.addAll(wrapText(coordLine, fontSize, font, maxWidth))
            }
            lines.addAll(wrapText("   Descrizione: $description", fontSize, font, maxWidth))

            // Stampa ogni riga e gestisci il cambio pagina
            for (line in lines) {
                contentStream.showText(line)
                contentStream.newLineAtOffset(0f, -15f)
                linesOnPage++
                if (linesOnPage > 40) {
                    contentStream.endText()
                    contentStream.close()
                    page = PDPage()
                    doc.addPage(page)
                    contentStream = PDPageContentStream(doc, page)
                    contentStream.beginText()
                    contentStream.setFont(font, fontSize)
                    contentStream.newLineAtOffset(40f, 750f)
                    linesOnPage = 0
                }
            }

            // Riga vuota tra i report
            contentStream.newLineAtOffset(0f, -15f)
            linesOnPage++
            if (linesOnPage > 40) {
                contentStream.endText()
                contentStream.close()
                page = PDPage()
                doc.addPage(page)
                contentStream = PDPageContentStream(doc, page)
                contentStream.beginText()
                contentStream.setFont(font, fontSize)
                contentStream.newLineAtOffset(40f, 750f)
                linesOnPage = 0
            }
        }

        // Fine del contenuto principale
        contentStream.endText()
        contentStream.close()

        // Aggiungi footer a tutte le pagine: data/ora a sinistra, titolo al centro, paginazione a destra
        val totalPages = doc.numberOfPages
        val formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")
        val timestamp = LocalDateTime.now().format(formatter)

        for (i in 0 until totalPages) {
            val p = doc.getPage(i)
            PDPageContentStream(doc, p, AppendMode.APPEND, true, true).use { fs ->
                fs.setFont(font, fontSize)
                val pageWidth = p.mediaBox.width
                val footerY = 20f

                // Data/ora a sinistra
                fs.beginText()
                fs.newLineAtOffset(40f, footerY)
                fs.showText(timestamp)
                fs.endText()

                // Titolo centrato
                val titleText = "Cleanup Sicily Report"
                val titleWidth = font.getStringWidth(titleText) / 1000 * fontSize
                val titleX = (pageWidth - titleWidth) / 2
                fs.beginText()
                fs.newLineAtOffset(titleX, footerY)
                fs.showText(titleText)
                fs.endText()

                // Numero pagina a destra
                val pageNumText = "Pagina ${i + 1} di $totalPages"
                val pageNumWidth = font.getStringWidth(pageNumText) / 1000 * fontSize
                val rightX = pageWidth - 40f - pageNumWidth
                fs.beginText()
                fs.newLineAtOffset(rightX, footerY)
                fs.showText(pageNumText)
                fs.endText()
            }
        }

        // Salva e chiudi il documento
        val out = ByteArrayOutputStream()
        doc.save(out)
        doc.close()
        return out.toByteArray()
    }

    // Spezza il testo troppo lungo in più righe
    private fun wrapText(text: String, fontSize: Float, font: PDType1Font, maxWidth: Float): List<String> {
        val lines = mutableListOf<String>()
        var currentLine = ""
        for (word in text.split(" ")) {
            val testLine = if (currentLine.isEmpty()) word else "$currentLine $word"
            val width = font.getStringWidth(testLine) / 1000 * fontSize
            if (width > maxWidth) {
                lines.add(currentLine)
                currentLine = word
            } else {
                currentLine = testLine
            }
        }
        if (currentLine.isNotEmpty()) lines.add(currentLine)
        return lines
    }
}
