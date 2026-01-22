package com.surework.payroll.service;

import com.surework.payroll.dto.PayrollDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.UUID;

/**
 * Service for fetching employee data from HR Service for payroll processing.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class EmployeePayrollDataService {

    private final WebClient.Builder webClientBuilder;

    @Value("${surework.hr-service.url:http://localhost:8082}")
    private String hrServiceUrl;

    /**
     * Get all active employees for payroll processing.
     */
    public List<PayrollDto.EmployeePayrollData> getActiveEmployeesForPayroll() {
        log.debug("Fetching active employees from HR service");

        try {
            return webClientBuilder.build()
                    .get()
                    .uri(hrServiceUrl + "/api/v1/employees/payroll-data")
                    .retrieve()
                    .bodyToFlux(PayrollDto.EmployeePayrollData.class)
                    .collectList()
                    .block();
        } catch (Exception e) {
            log.error("Failed to fetch employees from HR service: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch employee data for payroll", e);
        }
    }

    /**
     * Get payroll data for a specific employee.
     */
    public PayrollDto.EmployeePayrollData getEmployeePayrollData(UUID employeeId) {
        log.debug("Fetching payroll data for employee {}", employeeId);

        try {
            return webClientBuilder.build()
                    .get()
                    .uri(hrServiceUrl + "/api/v1/employees/{id}/payroll-data", employeeId)
                    .retrieve()
                    .bodyToMono(PayrollDto.EmployeePayrollData.class)
                    .block();
        } catch (Exception e) {
            log.error("Failed to fetch employee {} from HR service: {}", employeeId, e.getMessage());
            throw new RuntimeException("Failed to fetch employee data", e);
        }
    }
}
