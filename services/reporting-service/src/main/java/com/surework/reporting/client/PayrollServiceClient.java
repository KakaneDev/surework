package com.surework.reporting.client;

import com.surework.reporting.client.dto.PayrollRunDto;
import com.surework.reporting.client.dto.PayslipDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.UUID;

/**
 * Feign client for Payroll Service.
 * Fetches payroll data for reports and statutory submissions.
 */
@FeignClient(name = "payroll-service", url = "${surework.services.payroll-service.url:http://localhost:8082}")
public interface PayrollServiceClient {

    @GetMapping("/api/payroll/runs")
    List<PayrollRunDto> getAllPayrollRuns();

    @GetMapping("/api/payroll/runs")
    List<PayrollRunDto> getPayrollRunsByPeriod(
            @RequestParam("year") int year,
            @RequestParam("month") int month);

    @GetMapping("/api/payroll/runs/{id}")
    PayrollRunDto getPayrollRun(@PathVariable("id") UUID id);

    @GetMapping("/api/payroll/runs/{runId}/payslips")
    List<PayslipDto> getPayslipsByRun(@PathVariable("runId") UUID runId);

    @GetMapping("/api/payroll/payslips")
    List<PayslipDto> getPayslipsByPeriod(
            @RequestParam("year") int year,
            @RequestParam("month") int month);

    @GetMapping("/api/payroll/payslips/employee/{employeeId}")
    List<PayslipDto> getPayslipsByEmployee(@PathVariable("employeeId") UUID employeeId);

    @GetMapping("/api/payroll/payslips/ytd/{employeeId}")
    PayslipDto getYtdSummary(
            @PathVariable("employeeId") UUID employeeId,
            @RequestParam("year") int year);
}
