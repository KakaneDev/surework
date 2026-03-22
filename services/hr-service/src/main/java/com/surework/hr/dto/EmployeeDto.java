package com.surework.hr.dto;

import com.surework.hr.domain.Employee;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTOs for Employee operations.
 */
public sealed interface EmployeeDto {

    /**
     * Request to create a new employee.
     */
    record CreateRequest(
            @NotBlank(message = "First name is required")
            @Size(max = 100, message = "First name must not exceed 100 characters")
            String firstName,

            @NotBlank(message = "Last name is required")
            @Size(max = 100, message = "Last name must not exceed 100 characters")
            String lastName,

            @Size(max = 100, message = "Middle name must not exceed 100 characters")
            String middleName,

            @NotBlank(message = "Email is required")
            @Email(message = "Invalid email format")
            String email,

            @NotBlank(message = "Phone is required")
            @Pattern(regexp = "^\\+27[0-9]{9}$", message = "Phone must be South African format (+27xxxxxxxxx)")
            String phone,

            @NotBlank(message = "ID number is required")
            @Pattern(regexp = "^[0-9]{13}$", message = "SA ID number must be 13 digits")
            String idNumber,

            String passportNumber,

            @NotNull(message = "Date of birth is required")
            @Past(message = "Date of birth must be in the past")
            LocalDate dateOfBirth,

            @NotNull(message = "Gender is required")
            Employee.Gender gender,

            Employee.MaritalStatus maritalStatus,

            // Address
            String streetAddress,
            String suburb,
            String city,
            String province,
            String postalCode,

            // Employment
            @NotNull(message = "Hire date is required")
            LocalDate hireDate,

            @NotNull(message = "Employment type is required")
            Employee.EmploymentType employmentType,

            UUID departmentId,
            UUID jobTitleId,
            UUID managerId,

            // Compensation
            @NotNull(message = "Basic salary is required")
            @DecimalMin(value = "0.01", message = "Salary must be positive")
            BigDecimal basicSalary,

            Employee.PayFrequency payFrequency,

            // Tax
            String taxNumber,
            Employee.TaxStatus taxStatus,

            // Banking
            String bankName,
            String bankAccountNumber,
            String bankBranchCode,
            Employee.BankAccountType bankAccountType,

            // Emergency Contact
            String emergencyContactName,
            String emergencyContactPhone,
            String emergencyContactRelationship
    ) implements EmployeeDto {}

    /**
     * Request to update employee details.
     */
    record UpdateRequest(
            @Size(max = 100, message = "First name must not exceed 100 characters")
            String firstName,

            @Size(max = 100, message = "Last name must not exceed 100 characters")
            String lastName,

            @Size(max = 100, message = "Middle name must not exceed 100 characters")
            String middleName,

            @Email(message = "Invalid email format")
            String email,

            @Pattern(regexp = "^\\+27[0-9]{9}$", message = "Phone must be South African format (+27xxxxxxxxx)")
            String phone,

            Employee.MaritalStatus maritalStatus,

            // Address
            String streetAddress,
            String suburb,
            String city,
            String province,
            String postalCode,

            // Employment
            UUID departmentId,
            UUID jobTitleId,
            UUID managerId,

            // Compensation
            @DecimalMin(value = "0.01", message = "Salary must be positive")
            BigDecimal basicSalary,

            Employee.PayFrequency payFrequency,

            // Tax
            String taxNumber,
            Employee.TaxStatus taxStatus,

            // Banking
            String bankName,
            String bankAccountNumber,
            String bankBranchCode,
            Employee.BankAccountType bankAccountType,

            // Emergency Contact
            String emergencyContactName,
            String emergencyContactPhone,
            String emergencyContactRelationship
    ) implements EmployeeDto {}

    /**
     * Employee response DTO.
     */
    record Response(
            UUID id,
            String employeeNumber,
            String firstName,
            String lastName,
            String middleName,
            String fullName,
            String email,
            String phone,
            String idNumber,
            String passportNumber,
            LocalDate dateOfBirth,
            Employee.Gender gender,
            Employee.MaritalStatus maritalStatus,
            AddressDto address,
            LocalDate hireDate,
            LocalDate terminationDate,
            Employee.EmploymentStatus status,
            Employee.EmploymentType employmentType,
            DepartmentSummary department,
            JobTitleSummary jobTitle,
            EmployeeSummary manager,
            BigDecimal basicSalary,
            Employee.PayFrequency payFrequency,
            String taxNumber,
            Employee.TaxStatus taxStatus,
            BankingDto banking,
            EmergencyContactDto emergencyContact,
            UUID userId,
            Instant createdAt,
            Instant updatedAt
    ) implements EmployeeDto {

        public static Response fromEntity(Employee employee) {
            return new Response(
                    employee.getId(),
                    employee.getEmployeeNumber(),
                    employee.getFirstName(),
                    employee.getLastName(),
                    employee.getMiddleName(),
                    employee.getFullName(),
                    employee.getEmail(),
                    employee.getPhone(),
                    maskIdNumber(employee.getIdNumber()),
                    employee.getPassportNumber(),
                    employee.getDateOfBirth(),
                    employee.getGender(),
                    employee.getMaritalStatus(),
                    new AddressDto(
                            employee.getStreetAddress(),
                            employee.getSuburb(),
                            employee.getCity(),
                            employee.getProvince(),
                            employee.getPostalCode()
                    ),
                    employee.getHireDate(),
                    employee.getTerminationDate(),
                    employee.getStatus(),
                    employee.getEmploymentType(),
                    employee.getDepartment() != null
                            ? new DepartmentSummary(employee.getDepartment().getId(),
                            employee.getDepartment().getCode(),
                            employee.getDepartment().getName())
                            : null,
                    employee.getJobTitle() != null
                            ? new JobTitleSummary(employee.getJobTitle().getId(),
                            employee.getJobTitle().getCode(),
                            employee.getJobTitle().getTitle())
                            : null,
                    employee.getManager() != null
                            ? new EmployeeSummary(employee.getManager().getId(),
                            employee.getManager().getEmployeeNumber(),
                            employee.getManager().getFullName())
                            : null,
                    employee.getBasicSalary(),
                    employee.getPayFrequency(),
                    employee.getTaxNumber(),
                    employee.getTaxStatus(),
                    new BankingDto(
                            employee.getBankName(),
                            maskAccountNumber(employee.getBankAccountNumber()),
                            employee.getBankBranchCode(),
                            employee.getBankAccountType()
                    ),
                    new EmergencyContactDto(
                            employee.getEmergencyContactName(),
                            employee.getEmergencyContactPhone(),
                            employee.getEmergencyContactRelationship()
                    ),
                    employee.getUserId(),
                    employee.getCreatedAt(),
                    employee.getUpdatedAt()
            );
        }

        private static String maskIdNumber(String idNumber) {
            if (idNumber == null || idNumber.length() < 6) return idNumber;
            return idNumber.substring(0, 6) + "*******";
        }

        private static String maskAccountNumber(String accountNumber) {
            if (accountNumber == null || accountNumber.length() < 4) return accountNumber;
            return "****" + accountNumber.substring(accountNumber.length() - 4);
        }
    }

    /**
     * Employee list item (lightweight).
     */
    record ListItem(
            UUID id,
            String employeeNumber,
            String fullName,
            String email,
            String phone,
            String departmentName,
            String jobTitle,
            Employee.EmploymentStatus status,
            LocalDate hireDate
    ) implements EmployeeDto {

        public static ListItem fromEntity(Employee employee) {
            return new ListItem(
                    employee.getId(),
                    employee.getEmployeeNumber(),
                    employee.getFullName(),
                    employee.getEmail(),
                    employee.getPhone(),
                    employee.getDepartment() != null ? employee.getDepartment().getName() : null,
                    employee.getJobTitle() != null ? employee.getJobTitle().getTitle() : null,
                    employee.getStatus(),
                    employee.getHireDate()
            );
        }
    }

    /**
     * Employee hierarchy item for org chart (includes manager reference).
     */
    record HierarchyItem(
            UUID id,
            String employeeNumber,
            String fullName,
            String jobTitle,
            String department,
            Employee.EmploymentStatus status,
            UUID managerId
    ) implements EmployeeDto {

        public static HierarchyItem fromEntity(Employee employee) {
            return new HierarchyItem(
                    employee.getId(),
                    employee.getEmployeeNumber(),
                    employee.getFullName(),
                    employee.getJobTitle() != null ? employee.getJobTitle().getTitle() : null,
                    employee.getDepartment() != null ? employee.getDepartment().getName() : null,
                    employee.getStatus(),
                    employee.getManager() != null ? employee.getManager().getId() : null
            );
        }
    }

    /**
     * Employee report item (full details for reporting service).
     */
    record ReportItem(
            UUID id,
            String employeeNumber,
            String firstName,
            String lastName,
            String middleName,
            String fullName,
            String email,
            String phone,
            LocalDate dateOfBirth,
            Employee.Gender gender,
            LocalDate hireDate,
            LocalDate terminationDate,
            Employee.EmploymentStatus status,
            Employee.EmploymentType employmentType,
            UUID departmentId,
            String departmentName,
            String jobTitle,
            UUID managerId,
            String managerName,
            BigDecimal basicSalary
    ) implements EmployeeDto {

        public static ReportItem fromEntity(Employee employee) {
            return new ReportItem(
                    employee.getId(),
                    employee.getEmployeeNumber(),
                    employee.getFirstName(),
                    employee.getLastName(),
                    employee.getMiddleName(),
                    employee.getFullName(),
                    employee.getEmail(),
                    employee.getPhone(),
                    employee.getDateOfBirth(),
                    employee.getGender(),
                    employee.getHireDate(),
                    employee.getTerminationDate(),
                    employee.getStatus(),
                    employee.getEmploymentType(),
                    employee.getDepartment() != null ? employee.getDepartment().getId() : null,
                    employee.getDepartment() != null ? employee.getDepartment().getName() : null,
                    employee.getJobTitle() != null ? employee.getJobTitle().getTitle() : null,
                    employee.getManager() != null ? employee.getManager().getId() : null,
                    employee.getManager() != null ? employee.getManager().getFullName() : null,
                    employee.getBasicSalary()
            );
        }
    }

    // Nested DTOs
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
            Employee.BankAccountType accountType
    ) {}

    record EmergencyContactDto(
            String name,
            String phone,
            String relationship
    ) {}

    record DepartmentSummary(
            UUID id,
            String code,
            String name
    ) {}

    record JobTitleSummary(
            UUID id,
            String code,
            String title
    ) {}

    record EmployeeSummary(
            UUID id,
            String employeeNumber,
            String fullName
    ) {}
}
