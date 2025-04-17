package org.cleanupsicily.reporter

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody

@RestController
@RequestMapping("/api/reports")
class ReportController(
    private val firestoreService: FirestoreService,
    private val pdfReportExporter: PdfReportExporter,
    private val csvReportExporter: CsvReportExporter,
    private val mapReportExporter: MapReportExporter,
    private val excelReportExporter: ExcelReportExporter,
    private val reportSubmissionService: ReportSubmissionService
) {

    @GetMapping
    suspend fun getReports(): List<Map<String, Any>> =
        firestoreService.getReports()

    @PostMapping
    suspend fun submitReport(@RequestBody data: Map<String, Any?>): ResponseEntity<String> {
        val id = reportSubmissionService.submitReport(data)
        return ResponseEntity.ok("Report creato con ID: $id")
    }

    @GetMapping("/export/pdf", produces = [MediaType.APPLICATION_PDF_VALUE])
    suspend fun exportReportsAsPdf(): ResponseEntity<ByteArray> {
        val reports = firestoreService.getReports()
        val pdfBytes = pdfReportExporter.export(reports)
        return ResponseEntity.ok()
            .header("Content-Disposition", "attachment; filename=reports.pdf")
            .body(pdfBytes)
    }

    @GetMapping("/export/csv", produces = ["text/csv"])
    suspend fun exportReportsAsCsv(): ResponseEntity<ByteArray> {
        val reports = firestoreService.getReports()
        val csvBytes = csvReportExporter.export(reports)
        return ResponseEntity.ok()
            .header("Content-Disposition", "attachment; filename=reports.csv")
            .body(csvBytes)
    }

    @GetMapping("/export/map", produces = ["text/html"])
    suspend fun exportReportsAsMap(): ResponseEntity<ByteArray> {
        val reports = firestoreService.getReports()
        val htmlBytes = mapReportExporter.export(reports)

        return ResponseEntity.ok()
            .header("Content-Disposition", "attachment; filename=reports-map.html")
            .body(htmlBytes)
    }

    @GetMapping("/export/excel", produces = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"])
    suspend fun exportReportsAsExcel(): ResponseEntity<ByteArray> {
        val reports = firestoreService.getReports()
        val excelBytes = excelReportExporter.export(reports)
        return ResponseEntity.ok()
            .header("Content-Disposition", "attachment; filename=reports.xlsx")
            .body(excelBytes)
    }
}
