package com.surework.employee.dto;

import com.surework.employee.domain.Employee.EmploymentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public sealed interface EmployeeDto permits
        EmployeeDto.EmployeeResponse,
        EmployeeDto.EmployeeListItem,
        EmployeeDto.EmployeeHierarchyItem,
        EmployeeDto.CreateEmployeeRequest,
        EmployeeDto.DepartmentResponse {

    record EmployeeResponse(
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
            AddressDto address,
            LocalDate hireDate,
            LocalDate terminationDate,
            EmploymentStatus status,
            String employmentType,
            DepartmentInfo department,
            JobTitleInfo jobTitle,
            ManagerInfo manager,
            BigDecimal basicSalary,
            String payFrequency,
            String taxNumber,
            String taxStatus,
            BankingDto banking,
            EmergencyContactDto emergencyContact,
            String createdAt,
            String updatedAt
    ) implements EmployeeDto {}

    record EmployeeListItem(
            UUID id,
            String employeeNumber,
            String fullName,
            String email,
            String phone,
            String departmentName,
            String jobTitle,
            EmploymentStatus status,
            LocalDate hireDate
    ) implements EmployeeDto {}

    record EmployeeHierarchyItem(
            UUID id,
            String employeeNumber,
            String fullName,
            String jobTitle,
            String department,
            EmploymentStatus status,
            UUID managerId
    ) implements EmployeeDto {}

    record CreateEmployeeRequest(
            String firstName,
            String lastName,
            String middleName,
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
            String employmentType,
            UUID departmentId,
            String jobTitle,
            UUID managerId,
            BigDecimal basicSalary,
            String payFrequency,
            String taxNumber,
            String taxStatus,
            String bankName,
            String bankAccountNumber,
            String bankBranchCode,
            String bankAccountType,
            String emergencyContactName,
            String emergencyContactPhone,
            String emergencyContactRelationship
    ) implements EmployeeDto {}

    record DepartmentResponse(
            UUID id,
            String code,
            String name,
            String description,
            boolean active
    ) implements EmployeeDto {}

    record AddressDto(
            String streetAddress,
            String suburb,
            String city,
            String province,
            String postalCode
    ) {}

    record BankingDto(
            String bankName,
            String accountNumber,
            String branchCode,
            String accountType
    ) {}

    record EmergencyContactDto(
            String name,
            String phone,
            String relationship
    ) {}

    record DepartmentInfo(
            UUID id,
            String code,
            String name
    ) {}

    record JobTitleInfo(
            UUID id,
            String code,
            String title
    ) {}

    record ManagerInfo(
            UUID id,
            String employeeNumber,
            String fullName
    ) {}

    record PageResponse<T>(
            java.util.List<T> content,
            int page,
            int size,
            long totalElements,
            int totalPages,
            boolean first,
            boolean last
    ) {}
}
