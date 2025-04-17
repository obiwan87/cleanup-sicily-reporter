package org.cleanupsicily.reporter

import org.apache.poi.ss.usermodel.FillPatternType
import org.apache.poi.ss.usermodel.HorizontalAlignment
import org.apache.poi.ss.usermodel.IndexedColors
import org.apache.poi.ss.usermodel.VerticalAlignment
import org.apache.poi.ss.util.CellRangeAddress
import org.apache.poi.xddf.usermodel.chart.AxisCrosses
import org.apache.poi.xddf.usermodel.chart.AxisPosition
import org.apache.poi.xddf.usermodel.chart.ChartTypes
import org.apache.poi.xddf.usermodel.chart.XDDFCategoryAxis
import org.apache.poi.xddf.usermodel.chart.XDDFLineChartData
import org.apache.poi.xddf.usermodel.chart.XDDFDataSourcesFactory
import org.apache.poi.xddf.usermodel.chart.XDDFValueAxis
import org.apache.poi.xssf.usermodel.XSSFCellStyle
import org.apache.poi.xssf.usermodel.XSSFChart
import org.apache.poi.xssf.usermodel.XSSFWorkbook
import org.springframework.stereotype.Component
import java.io.ByteArrayOutputStream
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter

@Component
class ExcelReportExporter {

    fun export(reports: List<Map<String, Any>>): ByteArray {
        // Ordina i report per created_at decrescente (ISO string sort)
        val sortedReports = reports.sortedByDescending { it["created_at"]?.toString() }

        val wb = XSSFWorkbook()
        val dataSheet = wb.createSheet("Reports")
        val summarySheet = wb.createSheet("Summary")

        // Stili: header
        val headerStyle: XSSFCellStyle = wb.createCellStyle() as XSSFCellStyle
        headerStyle.apply {
            alignment = HorizontalAlignment.CENTER
            verticalAlignment = VerticalAlignment.CENTER
            fillForegroundColor = IndexedColors.GREY_25_PERCENT.index
            fillPattern = FillPatternType.SOLID_FOREGROUND
        }
        // Stile date
        val dateStyle: XSSFCellStyle = wb.createCellStyle() as XSSFCellStyle
        dateStyle.apply {
            dataFormat = wb.creationHelper.createDataFormat().getFormat("dd/MM/yyyy HH:mm:ss")
        }
        // Stili severità
        fun severityStyle(color: IndexedColors): XSSFCellStyle = (wb.createCellStyle() as XSSFCellStyle).apply {
            fillForegroundColor = color.index
            fillPattern = FillPatternType.SOLID_FOREGROUND
        }
        val severityStyles: Map<Int, XSSFCellStyle> = mapOf(
            1 to severityStyle(IndexedColors.LIGHT_GREEN),
            2 to severityStyle(IndexedColors.LIGHT_YELLOW),
            3 to severityStyle(IndexedColors.LIGHT_ORANGE),
            4 to severityStyle(IndexedColors.LIGHT_BLUE),
            5 to severityStyle(IndexedColors.RED)
        )

        // Header dataSheet
        val headers = listOf("Summary","Address","Category","CreatedAt","Severity","Latitude","Longitude","Description")
        val headerRow = dataSheet.createRow(0)
        headers.forEachIndexed { i, title ->
            headerRow.createCell(i).apply {
                setCellValue(title)
                cellStyle = headerStyle
            }
        }

        // Popola dataSheet con report ordinati
        val isoFormatter = DateTimeFormatter.ISO_OFFSET_DATE_TIME
        sortedReports.forEachIndexed { idx, report ->
            val row = dataSheet.createRow(idx + 1)
            row.createCell(0).setCellValue(report["summary"].toString())
            row.createCell(1).setCellValue(report["address"].toString())
            row.createCell(2).setCellValue(report["category"].toString())

            val odt = OffsetDateTime.parse(report["created_at"].toString(), isoFormatter)
            row.createCell(3).apply {
                setCellValue(odt.toLocalDateTime().toString())
                cellStyle = dateStyle
            }

            val sev = report["severity"].toString().toIntOrNull() ?: 1
            row.createCell(4).apply {
                setCellValue(sev.toDouble())
                cellStyle = severityStyles.getValue(sev)
            }

            val coords = report["coordinates"] as? Map<*, *>
            row.createCell(5).setCellValue(coords?.get("lat")?.toString()?.toDoubleOrNull() ?: 0.0)
            row.createCell(6).setCellValue(coords?.get("lon")?.toString()?.toDoubleOrNull() ?: 0.0)
            row.createCell(7).setCellValue(report["description"].toString())
        }
        (0 until headers.size).forEach { dataSheet.autoSizeColumn(it) }

        // Summary sheet
        val catCount = sortedReports.groupingBy { it["category"]?.toString() ?: "unknown" }.eachCount()
        val sumHeader = summarySheet.createRow(0)
        sumHeader.createCell(0).setCellValue("Category")
        sumHeader.createCell(1).setCellValue("Count")
        catCount.entries.forEachIndexed { i, (cat, cnt) ->
            summarySheet.createRow(i+1).apply {
                createCell(0).setCellValue(cat)
                createCell(1).setCellValue(cnt.toDouble())
            }
        }
        summarySheet.autoSizeColumn(0)
        summarySheet.autoSizeColumn(1)

        // Grafico a linee nel summarySheet
        val drawing = summarySheet.createDrawingPatriarch()
        val anchor = drawing.createAnchor(0, 0, 0, 0, 3, 1, 10, 15)
        val chart = drawing.createChart(anchor) as XSSFChart

        // Crea assi
        val bottomAxis: XDDFCategoryAxis = chart.createCategoryAxis(AxisPosition.BOTTOM)
        val leftAxis: XDDFValueAxis = chart.createValueAxis(AxisPosition.LEFT)
        leftAxis.crosses = AxisCrosses.AUTO_ZERO

        // Prepara i dati del grafico
        val categories = XDDFDataSourcesFactory.fromStringCellRange(
            summarySheet, CellRangeAddress(1, catCount.size, 0, 0)
        )
        val values = XDDFDataSourcesFactory.fromNumericCellRange(
            summarySheet, CellRangeAddress(1, catCount.size, 1, 1)
        )
        val chartData: XDDFLineChartData = chart.createData(ChartTypes.LINE, bottomAxis, leftAxis) as XDDFLineChartData
        val series = chartData.addSeries(categories, values)
        series.setTitle("Reports per Category", null)

        chart.plot(chartData)

        // Esporta
        ByteArrayOutputStream().use { out ->
            wb.write(out)
            return out.toByteArray()
        }
    }
}