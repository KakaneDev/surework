package com.surework.reporting.client.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Employee data transfer object from Employee Service.
 */
public record EmployeeDto(
        UUID id,
        String employeeNumber,
        String firstName,
        String lastName,
        String middleName,
        String fullName,
        String email,
        String phone,
        String idNumber,
        LocalDate dateOfBirth,
        String gender,
        String maritalStatus,
        String streetAddress,
        String suburb,
        String city,
        String province,
        String postalCode,
        LocalDate hireDate,
        LocalDate terminationDate,
        String status,
        String employmentType,
        UUID departmentId,
        String departmentName,
        String jobTitle,
        UUID managerId,
        String managerName,
        BigDecimal basicSalary,
        String payFrequency,
        String taxNumber,
        String taxStatus,
        String bankName,
        String bankAccountNumber,
        String bankBranchCode
) {
    /**
     * Get full name (returns the fullName field, or constructs from parts).
     */
    public String fullName() {
        if (fullName != null && !fullName.isBlank()) {
            return fullName;
        }
        if (middleName != null && !middleName.isBlank()) {
            return firstName + " " + middleName + " " + lastName;
        }
        return firstName + " " + lastName;
    }

    /**
     * Check if employee is active.
     */
    public boolean isActive() {
        return "ACTIVE".equals(status);
    }

    /**
     * Check if employee is terminated.
     */
    public boolean isTerminated() {
        return "TERMINATED".equals(status);
    }
}
