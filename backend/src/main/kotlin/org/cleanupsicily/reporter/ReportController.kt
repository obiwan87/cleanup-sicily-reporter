package org.cleanupsicily.reporter

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody

@RestController
@RequestMapping("/api/reports")
class ReportController(
    private val firestoreService: FirestoreService
) {

    @GetMapping
    suspend fun getReports(): List<Map<String, Any>> {
        return firestoreService.getReports()
    }

    @PostMapping
    suspend fun saveReport(@RequestBody report: Map<String, Any>): String {
        return firestoreService.saveReport(report)
    }
}
