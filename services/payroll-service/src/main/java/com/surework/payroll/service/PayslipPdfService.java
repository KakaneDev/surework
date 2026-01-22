package com.surework.payroll.service;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.surework.payroll.domain.Payslip;
import com.surework.payroll.domain.PayslipLine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

/**
 * Service for generating payslip PDF documents.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PayslipPdfService {

    private final TemplateEngine templateEngine;

    private static final Locale SA_LOCALE = new Locale("en", "ZA");
    private static final NumberFormat CURRENCY_FORMAT = NumberFormat.getCurrencyInstance(SA_LOCALE);
    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("MMMM yyyy");

    /**
     * Generate a PDF payslip.
     */
    public byte[] generatePdf(Payslip payslip) {
        log.debug("Generating PDF for payslip {}", payslip.getPayslipNumber());

        try {
            // Render HTML template
            String html = renderPayslipHtml(payslip);

            // Convert to PDF
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);
            builder.toStream(outputStream);
            builder.run();

            return outputStream.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate payslip PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate payslip PDF", e);
        }
    }

    private String renderPayslipHtml(Payslip payslip) {
        Context context = new Context();

        // Employee details
        context.setVariable("employeeName", payslip.getEmployeeName());
        context.setVariable("employeeNumber", payslip.getEmployeeNumber());
        context.setVariable("idNumber", maskIdNumber(payslip.getIdNumber()));
        context.setVariable("taxNumber", payslip.getTaxNumber());
        context.setVariable("department", payslip.getDepartment());
        context.setVariable("jobTitle", payslip.getJobTitle());

        // Period
        YearMonth period = YearMonth.of(payslip.getPeriodYear(), payslip.getPeriodMonth());
        context.setVariable("periodDisplay", period.format(MONTH_FORMATTER));
        context.setVariable("paymentDate", payslip.getPaymentDate().format(DateTimeFormatter.ofPattern("dd MMMM yyyy")));
        context.setVariable("payslipNumber", payslip.getPayslipNumber());

        // Earnings
        List<PayslipLine> earnings = payslip.getLines().stream()
                .filter(l -> l.getLineType() == PayslipLine.LineType.EARNING ||
                        l.getLineType() == PayslipLine.LineType.ALLOWANCE ||
                        l.getLineType() == PayslipLine.LineType.BONUS ||
                        l.getLineType() == PayslipLine.LineType.OVERTIME)
                .toList();
        context.setVariable("earnings", earnings);

        // Deductions
        List<PayslipLine> deductions = payslip.getLines().stream()
                .filter(l -> l.getLineType() == PayslipLine.LineType.STATUTORY_DEDUCTION ||
                        l.getLineType() == PayslipLine.LineType.VOLUNTARY_DEDUCTION ||
                        l.getLineType() == PayslipLine.LineType.LOAN_DEDUCTION ||
                        l.getLineType() == PayslipLine.LineType.OTHER_DEDUCTION)
                .toList();
        context.setVariable("deductions", deductions);

        // Employer contributions
        List<PayslipLine> employerContributions = payslip.getLines().stream()
                .filter(l -> l.getLineType() == PayslipLine.LineType.EMPLOYER_CONTRIBUTION)
                .toList();
        context.setVariable("employerContributions", employerContributions);

        // Totals
        context.setVariable("grossEarnings", formatCurrency(payslip.getGrossEarnings()));
        context.setVariable("totalDeductions", formatCurrency(payslip.getTotalDeductions()));
        context.setVariable("netPay", formatCurrency(payslip.getNetPay()));
        context.setVariable("totalEmployerCost", formatCurrency(payslip.getTotalEmployerCost()));

        // YTD
        context.setVariable("ytdGross", formatCurrency(payslip.getYtdGross()));
        context.setVariable("ytdPaye", formatCurrency(payslip.getYtdPaye()));
        context.setVariable("ytdUif", formatCurrency(payslip.getYtdUif()));
        context.setVariable("ytdNet", formatCurrency(payslip.getYtdNet()));

        // Banking details
        context.setVariable("bankName", payslip.getBankName());
        context.setVariable("bankAccount", maskBankAccount(payslip.getBankAccount()));
        context.setVariable("branchCode", payslip.getBranchCode());

        // Helper for formatting
        context.setVariable("formatCurrency", new CurrencyFormatter());

        return templateEngine.process("payslip", context);
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) {
            return "R 0.00";
        }
        return CURRENCY_FORMAT.format(amount);
    }

    private String maskIdNumber(String idNumber) {
        if (idNumber == null || idNumber.length() < 6) {
            return idNumber;
        }
        return idNumber.substring(0, 6) + "******";
    }

    private String maskBankAccount(String accountNumber) {
        if (accountNumber == null || accountNumber.length() < 4) {
            return accountNumber;
        }
        return "****" + accountNumber.substring(accountNumber.length() - 4);
    }

    /**
     * Helper class for currency formatting in templates.
     */
    public static class CurrencyFormatter {
        public String format(BigDecimal amount) {
            if (amount == null) {
                return "R 0.00";
            }
            return CURRENCY_FORMAT.format(amount);
        }
    }
}
