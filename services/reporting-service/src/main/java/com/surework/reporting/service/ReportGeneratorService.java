package com.surework.reporting.service;

import com.surework.reporting.domain.Report;

/**
 * Service for generating report files in various formats.
 */
public interface ReportGeneratorService {

    /**
     * Generate the report file based on the report configuration.
     * Updates the report entity with file path, size, and status.
     */
    void generateReport(Report report);

    /**
     * Generate PDF report.
     */
    byte[] generatePdf(Report report);

    /**
     * Generate Excel report.
     */
    byte[] generateExcel(Report report);

    /**
     * Generate CSV report.
     */
    byte[] generateCsv(Report report);

    /**
     * Generate JSON report.
     */
    byte[] generateJson(Report report);

    /**
     * Generate HTML report.
     */
    byte[] generateHtml(Report report);
}
