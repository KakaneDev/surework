package com.surework.reporting.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.opencsv.CSVWriter;
import com.surework.reporting.domain.Report;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Implementation of ReportGeneratorService.
 * Generates reports in PDF, Excel, CSV, JSON, and HTML formats.
 */
@Service
public class ReportGeneratorServiceImpl implements ReportGeneratorService {

    private final TemplateEngine templateEngine;
    private final ObjectMapper objectMapper;

    @Value("${surework.reporting.generation.temp-directory:./report-temp}")
    private String tempDirectory;

    public ReportGeneratorServiceImpl(TemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
        this.objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    }

    @Override
    public void generateReport(Report report) {
        try {
            // Ensure temp directory exists
            Path tempPath = Paths.get(tempDirectory);
            Files.createDirectories(tempPath);

            // Generate report content
            byte[] content = switch (report.getOutputFormat()) {
                case PDF -> generatePdf(report);
                case EXCEL -> generateExcel(report);
                case CSV -> generateCsv(report);
                case JSON -> generateJson(report);
                case HTML -> generateHtml(report);
            };

            // Save to file
            String fileName = generateFileName(report);
            Path filePath = tempPath.resolve(fileName);
            Files.write(filePath, content);

            // Update report with file info
            report.completeGeneration(
                    filePath.toString(),
                    (long) content.length,
                    getRowCount(report),
                    getPageCount(report, content.length)
            );

            report.setContentType(getContentType(report.getOutputFormat()));

        } catch (Exception e) {
            report.fail("Report generation failed: " + e.getMessage());
            throw new RuntimeException("Report generation failed", e);
        }
    }

    private String generateFileName(Report report) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String extension = getFileExtension(report.getOutputFormat());
        String safeName = report.getName().replaceAll("[^a-zA-Z0-9]", "_");
        return safeName + "_" + timestamp + extension;
    }

    private String getFileExtension(Report.OutputFormat format) {
        return switch (format) {
            case PDF -> ".pdf";
            case EXCEL -> ".xlsx";
            case CSV -> ".csv";
            case JSON -> ".json";
            case HTML -> ".html";
        };
    }

    private String getContentType(Report.OutputFormat format) {
        return switch (format) {
            case PDF -> "application/pdf";
            case EXCEL -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case CSV -> "text/csv";
            case JSON -> "application/json";
            case HTML -> "text/html";
        };
    }

    private int getRowCount(Report report) {
        // This would be calculated based on actual data
        return 100;
    }

    private int getPageCount(Report report, long contentSize) {
        if (report.getOutputFormat() == Report.OutputFormat.PDF) {
            // Estimate pages based on content size (rough estimate)
            return Math.max(1, (int) (contentSize / 50000));
        }
        return 1;
    }

    @Override
    public byte[] generatePdf(Report report) {
        try {
            // Generate HTML first
            String html = generateHtmlContent(report);

            // Use OpenHTMLToPDF to convert HTML to PDF
            ByteArrayOutputStream os = new ByteArrayOutputStream();

            com.openhtmltopdf.pdfboxout.PdfRendererBuilder builder = new com.openhtmltopdf.pdfboxout.PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);
            builder.toStream(os);
            builder.run();

            return os.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }

    @Override
    public byte[] generateExcel(Report report) {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream os = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet(report.getName());

            // Create header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Get report data
            List<Map<String, Object>> data = getReportData(report);

            if (!data.isEmpty()) {
                // Create header row
                Row headerRow = sheet.createRow(0);
                List<String> headers = new ArrayList<>(data.get(0).keySet());

                for (int i = 0; i < headers.size(); i++) {
                    Cell cell = headerRow.createCell(i);
                    cell.setCellValue(formatHeader(headers.get(i)));
                    cell.setCellStyle(headerStyle);
                }

                // Create data rows
                int rowNum = 1;
                for (Map<String, Object> rowData : data) {
                    Row row = sheet.createRow(rowNum++);
                    for (int i = 0; i < headers.size(); i++) {
                        Cell cell = row.createCell(i);
                        Object value = rowData.get(headers.get(i));
                        setCellValue(cell, value);
                    }
                }

                // Auto-size columns
                for (int i = 0; i < headers.size(); i++) {
                    sheet.autoSizeColumn(i);
                }
            }

            // Add summary sheet if applicable
            if (report.getReportType().name().contains("SUMMARY")) {
                addSummarySheet(workbook, report);
            }

            workbook.write(os);
            return os.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate Excel", e);
        }
    }

    private void setCellValue(Cell cell, Object value) {
        if (value == null) {
            cell.setCellValue("");
        } else if (value instanceof Number) {
            cell.setCellValue(((Number) value).doubleValue());
        } else if (value instanceof Boolean) {
            cell.setCellValue((Boolean) value);
        } else if (value instanceof LocalDateTime) {
            cell.setCellValue(((LocalDateTime) value).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        } else {
            cell.setCellValue(value.toString());
        }
    }

    private void addSummarySheet(Workbook workbook, Report report) {
        Sheet summarySheet = workbook.createSheet("Summary");
        int rowNum = 0;

        // Report title
        Row titleRow = summarySheet.createRow(rowNum++);
        titleRow.createCell(0).setCellValue("Report: " + report.getName());

        // Report type
        Row typeRow = summarySheet.createRow(rowNum++);
        typeRow.createCell(0).setCellValue("Type:");
        typeRow.createCell(1).setCellValue(report.getReportType().name());

        // Date range
        if (report.getDateFrom() != null && report.getDateTo() != null) {
            Row dateRow = summarySheet.createRow(rowNum++);
            dateRow.createCell(0).setCellValue("Period:");
            dateRow.createCell(1).setCellValue(
                    report.getDateFrom().format(DateTimeFormatter.ISO_LOCAL_DATE) + " to " +
                    report.getDateTo().format(DateTimeFormatter.ISO_LOCAL_DATE)
            );
        }

        // Generated at
        Row generatedRow = summarySheet.createRow(rowNum++);
        generatedRow.createCell(0).setCellValue("Generated:");
        generatedRow.createCell(1).setCellValue(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

        summarySheet.autoSizeColumn(0);
        summarySheet.autoSizeColumn(1);
    }

    @Override
    public byte[] generateCsv(Report report) {
        try (ByteArrayOutputStream os = new ByteArrayOutputStream();
             OutputStreamWriter writer = new OutputStreamWriter(os);
             CSVWriter csvWriter = new CSVWriter(writer)) {

            List<Map<String, Object>> data = getReportData(report);

            if (!data.isEmpty()) {
                // Write header
                List<String> headers = new ArrayList<>(data.get(0).keySet());
                csvWriter.writeNext(headers.toArray(new String[0]));

                // Write data rows
                for (Map<String, Object> rowData : data) {
                    String[] row = headers.stream()
                            .map(h -> rowData.get(h) != null ? rowData.get(h).toString() : "")
                            .toArray(String[]::new);
                    csvWriter.writeNext(row);
                }
            }

            csvWriter.flush();
            return os.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate CSV", e);
        }
    }

    @Override
    public byte[] generateJson(Report report) {
        try {
            Map<String, Object> jsonReport = new LinkedHashMap<>();
            jsonReport.put("reportName", report.getName());
            jsonReport.put("reportType", report.getReportType());
            jsonReport.put("generatedAt", LocalDateTime.now());
            jsonReport.put("dateFrom", report.getDateFrom());
            jsonReport.put("dateTo", report.getDateTo());
            jsonReport.put("data", getReportData(report));

            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(jsonReport);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate JSON", e);
        }
    }

    @Override
    public byte[] generateHtml(Report report) {
        return generateHtmlContent(report).getBytes();
    }

    private String generateHtmlContent(Report report) {
        Context context = new Context();
        context.setVariable("report", report);
        context.setVariable("data", getReportData(report));
        context.setVariable("generatedAt", LocalDateTime.now());
        context.setVariable("companyName", "SureWork ERP");

        String templateName = getTemplateName(report.getReportType());
        return templateEngine.process(templateName, context);
    }

    private String getTemplateName(Report.ReportType type) {
        return switch (type) {
            case HEADCOUNT -> "reports/headcount";
            case PAYROLL_REGISTER, PAYROLL_SUMMARY -> "reports/payroll";
            case LEAVE_BALANCE, LEAVE_UTILIZATION -> "reports/leave";
            case ATTENDANCE_SUMMARY -> "reports/attendance";
            case EMP201, EMP501 -> "reports/statutory";
            default -> "reports/generic";
        };
    }

    private String formatHeader(String header) {
        // Convert camelCase or snake_case to Title Case
        return header.replaceAll("([a-z])([A-Z])", "$1 $2")
                     .replaceAll("_", " ")
                     .substring(0, 1).toUpperCase() +
               header.replaceAll("([a-z])([A-Z])", "$1 $2")
                     .replaceAll("_", " ")
                     .substring(1);
    }

    private List<Map<String, Object>> getReportData(Report report) {
        // This would fetch actual data based on report type
        // For now, return sample data
        List<Map<String, Object>> data = new ArrayList<>();

        switch (report.getReportType()) {
            case HEADCOUNT -> {
                for (int i = 1; i <= 10; i++) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("employeeNumber", "EMP" + String.format("%05d", i));
                    row.put("firstName", "Employee");
                    row.put("lastName", "Name " + i);
                    row.put("department", "Department " + (i % 5 + 1));
                    row.put("position", "Position " + i);
                    row.put("startDate", LocalDateTime.now().minusMonths(i * 3));
                    row.put("status", "Active");
                    data.add(row);
                }
            }
            case PAYROLL_REGISTER -> {
                for (int i = 1; i <= 10; i++) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("employeeNumber", "EMP" + String.format("%05d", i));
                    row.put("name", "Employee Name " + i);
                    row.put("basicSalary", 25000 + (i * 1000));
                    row.put("allowances", 2000 + (i * 100));
                    row.put("grossPay", 27000 + (i * 1100));
                    row.put("paye", 5000 + (i * 200));
                    row.put("uif", 270 + (i * 11));
                    row.put("netPay", 21730 + (i * 889));
                    data.add(row);
                }
            }
            default -> {
                // Generic sample data
                for (int i = 1; i <= 10; i++) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", i);
                    row.put("description", "Item " + i);
                    row.put("value", i * 100);
                    row.put("date", LocalDateTime.now().minusDays(i));
                    data.add(row);
                }
            }
        }

        return data;
    }
}
