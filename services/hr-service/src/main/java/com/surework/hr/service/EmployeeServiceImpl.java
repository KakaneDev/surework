package com.surework.hr.service;

import com.surework.common.messaging.DomainEventPublisher;
import com.surework.common.messaging.event.HrEvent;
import com.surework.common.security.TenantContext;
import com.surework.common.web.exception.BusinessRuleException;
import com.surework.common.web.exception.ConflictException;
import com.surework.common.web.exception.ResourceNotFoundException;
import com.surework.hr.domain.Department;
import com.surework.hr.domain.Employee;
import com.surework.hr.domain.JobTitle;
import com.surework.hr.dto.EmployeeDto;
import com.surework.hr.repository.DepartmentRepository;
import com.surework.hr.repository.EmployeeRepository;
import com.surework.hr.repository.JobTitleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementation of EmployeeService.
 * Implements User Story 1: Employee Management.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final JobTitleRepository jobTitleRepository;
    private final DomainEventPublisher eventPublisher;

    @Value("${surework.hr.employee.number-prefix:EMP}")
    private String employeeNumberPrefix;

    @Value("${surework.hr.employee.number-padding:6}")
    private int employeeNumberPadding;

    @Override
    @Transactional
    public EmployeeDto.Response createEmployee(EmployeeDto.CreateRequest request) {
        // Validate uniqueness
        if (employeeRepository.existsByEmail(request.email())) {
            throw new ConflictException("Employee", "email", request.email());
        }
        if (employeeRepository.existsByIdNumber(request.idNumber())) {
            throw new ConflictException("Employee", "idNumber", "ID number already registered");
        }

        // Create employee
        Employee employee = new Employee();
        employee.setEmployeeNumber(generateEmployeeNumber());
        employee.setFirstName(request.firstName());
        employee.setLastName(request.lastName());
        employee.setMiddleName(request.middleName());
        employee.setEmail(request.email());
        employee.setPhone(request.phone());
        employee.setIdNumber(request.idNumber());
        employee.setPassportNumber(request.passportNumber());
        employee.setDateOfBirth(request.dateOfBirth());
        employee.setGender(request.gender());
        employee.setMaritalStatus(request.maritalStatus() != null ? request.maritalStatus() : Employee.MaritalStatus.SINGLE);

        // Address
        employee.setStreetAddress(request.streetAddress());
        employee.setSuburb(request.suburb());
        employee.setCity(request.city());
        employee.setProvince(request.province());
        employee.setPostalCode(request.postalCode());

        // Employment
        employee.setHireDate(request.hireDate());
        employee.setStatus(Employee.EmploymentStatus.ACTIVE);
        employee.setEmploymentType(request.employmentType());

        // Set relationships
        if (request.departmentId() != null) {
            Department department = departmentRepository.findById(request.departmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", request.departmentId()));
            employee.setDepartment(department);
        }

        if (request.jobTitleId() != null) {
            JobTitle jobTitle = jobTitleRepository.findById(request.jobTitleId())
                    .orElseThrow(() -> new ResourceNotFoundException("JobTitle", request.jobTitleId()));
            employee.setJobTitle(jobTitle);
        }

        if (request.managerId() != null) {
            Employee manager = employeeRepository.findById(request.managerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee (Manager)", request.managerId()));
            employee.setManager(manager);
        }

        // Compensation
        employee.setBasicSalary(request.basicSalary());
        employee.setPayFrequency(request.payFrequency() != null ? request.payFrequency() : Employee.PayFrequency.MONTHLY);

        // Tax
        employee.setTaxNumber(request.taxNumber());
        employee.setTaxStatus(request.taxStatus() != null ? request.taxStatus() : Employee.TaxStatus.NORMAL);

        // Banking
        employee.setBankName(request.bankName());
        employee.setBankAccountNumber(request.bankAccountNumber());
        employee.setBankBranchCode(request.bankBranchCode());
        employee.setBankAccountType(request.bankAccountType() != null ? request.bankAccountType() : Employee.BankAccountType.SAVINGS);

        // Emergency Contact
        employee.setEmergencyContactName(request.emergencyContactName());
        employee.setEmergencyContactPhone(request.emergencyContactPhone());
        employee.setEmergencyContactRelationship(request.emergencyContactRelationship());

        employee = employeeRepository.save(employee);

        // Publish event
        UUID tenantId = TenantContext.getTenantId().orElse(null);
        if (tenantId != null) {
            eventPublisher.publish(new HrEvent.EmployeeCreated(
                    UUID.randomUUID(),
                    tenantId,
                    Instant.now(),
                    employee.getId(),
                    employee.getEmployeeNumber(),
                    employee.getFirstName(),
                    employee.getLastName(),
                    employee.getEmail()
            ));
        }

        log.info("Created employee {} with number {}", employee.getId(), employee.getEmployeeNumber());

        return EmployeeDto.Response.fromEntity(employee);
    }

    @Override
    @Transactional
    public EmployeeDto.Response updateEmployee(UUID employeeId, EmployeeDto.UpdateRequest request) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

        // Update fields if provided
        if (request.firstName() != null) {
            employee.setFirstName(request.firstName());
        }
        if (request.lastName() != null) {
            employee.setLastName(request.lastName());
        }
        if (request.middleName() != null) {
            employee.setMiddleName(request.middleName());
        }
        if (request.email() != null && !request.email().equals(employee.getEmail())) {
            if (employeeRepository.existsByEmail(request.email())) {
                throw new ConflictException("Employee", "email", request.email());
            }
            employee.setEmail(request.email());
        }
        if (request.phone() != null) {
            employee.setPhone(request.phone());
        }
        if (request.maritalStatus() != null) {
            employee.setMaritalStatus(request.maritalStatus());
        }

        // Address
        if (request.streetAddress() != null) {
            employee.setStreetAddress(request.streetAddress());
        }
        if (request.suburb() != null) {
            employee.setSuburb(request.suburb());
        }
        if (request.city() != null) {
            employee.setCity(request.city());
        }
        if (request.province() != null) {
            employee.setProvince(request.province());
        }
        if (request.postalCode() != null) {
            employee.setPostalCode(request.postalCode());
        }

        // Employment relationships
        if (request.departmentId() != null) {
            Department department = departmentRepository.findById(request.departmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", request.departmentId()));
            employee.setDepartment(department);
        }
        if (request.jobTitleId() != null) {
            JobTitle jobTitle = jobTitleRepository.findById(request.jobTitleId())
                    .orElseThrow(() -> new ResourceNotFoundException("JobTitle", request.jobTitleId()));
            employee.setJobTitle(jobTitle);
        }
        if (request.managerId() != null) {
            if (request.managerId().equals(employeeId)) {
                throw new BusinessRuleException("Employee cannot be their own manager");
            }
            Employee manager = employeeRepository.findById(request.managerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee (Manager)", request.managerId()));
            employee.setManager(manager);
        }

        // Compensation
        if (request.basicSalary() != null) {
            employee.setBasicSalary(request.basicSalary());
        }
        if (request.payFrequency() != null) {
            employee.setPayFrequency(request.payFrequency());
        }

        // Tax
        if (request.taxNumber() != null) {
            employee.setTaxNumber(request.taxNumber());
        }
        if (request.taxStatus() != null) {
            employee.setTaxStatus(request.taxStatus());
        }

        // Banking
        if (request.bankName() != null) {
            employee.setBankName(request.bankName());
        }
        if (request.bankAccountNumber() != null) {
            employee.setBankAccountNumber(request.bankAccountNumber());
        }
        if (request.bankBranchCode() != null) {
            employee.setBankBranchCode(request.bankBranchCode());
        }
        if (request.bankAccountType() != null) {
            employee.setBankAccountType(request.bankAccountType());
        }

        // Emergency Contact
        if (request.emergencyContactName() != null) {
            employee.setEmergencyContactName(request.emergencyContactName());
        }
        if (request.emergencyContactPhone() != null) {
            employee.setEmergencyContactPhone(request.emergencyContactPhone());
        }
        if (request.emergencyContactRelationship() != null) {
            employee.setEmergencyContactRelationship(request.emergencyContactRelationship());
        }

        employee = employeeRepository.save(employee);

        log.info("Updated employee {}", employeeId);

        return EmployeeDto.Response.fromEntity(employee);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<EmployeeDto.Response> getEmployee(UUID employeeId) {
        return employeeRepository.findById(employeeId)
                .filter(e -> !e.isDeleted())
                .map(EmployeeDto.Response::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<EmployeeDto.Response> getEmployeeByNumber(String employeeNumber) {
        return employeeRepository.findByEmployeeNumber(employeeNumber)
                .filter(e -> !e.isDeleted())
                .map(EmployeeDto.Response::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EmployeeDto.ListItem> searchEmployees(
            Employee.EmploymentStatus status,
            UUID departmentId,
            String search,
            Pageable pageable) {
        return employeeRepository.search(status, departmentId, search, pageable)
                .map(EmployeeDto.ListItem::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmployeeDto.ListItem> getActiveEmployees() {
        return employeeRepository.findAllActive().stream()
                .map(EmployeeDto.ListItem::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmployeeDto.ListItem> getEmployeesByManager(UUID managerId) {
        return employeeRepository.findByManagerId(managerId).stream()
                .map(EmployeeDto.ListItem::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmployeeDto.ListItem> getEmployeesByDepartment(UUID departmentId) {
        return employeeRepository.findByDepartmentId(departmentId).stream()
                .map(EmployeeDto.ListItem::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public EmployeeDto.Response terminateEmployee(UUID employeeId, LocalDate terminationDate, String reason) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

        if (employee.getStatus() == Employee.EmploymentStatus.TERMINATED) {
            throw new BusinessRuleException("Employee is already terminated");
        }

        employee.terminate(terminationDate);
        employee = employeeRepository.save(employee);

        // Publish event
        UUID tenantId = TenantContext.getTenantId().orElse(null);
        if (tenantId != null) {
            eventPublisher.publish(new HrEvent.EmployeeTerminated(
                    UUID.randomUUID(),
                    tenantId,
                    Instant.now(),
                    employee.getId(),
                    terminationDate.atStartOfDay().toInstant(java.time.ZoneOffset.UTC),
                    reason
            ));
        }

        log.info("Terminated employee {} effective {}", employeeId, terminationDate);

        return EmployeeDto.Response.fromEntity(employee);
    }

    @Override
    @Transactional
    public EmployeeDto.Response reactivateEmployee(UUID employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

        if (employee.getStatus() != Employee.EmploymentStatus.TERMINATED) {
            throw new BusinessRuleException("Only terminated employees can be reactivated");
        }

        employee.setStatus(Employee.EmploymentStatus.ACTIVE);
        employee.setTerminationDate(null);
        employee = employeeRepository.save(employee);

        log.info("Reactivated employee {}", employeeId);

        return EmployeeDto.Response.fromEntity(employee);
    }

    @Override
    @Transactional
    public EmployeeDto.Response linkUserAccount(UUID employeeId, UUID userId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));

        employee.setUserId(userId);
        employee = employeeRepository.save(employee);

        log.info("Linked employee {} to user {}", employeeId, userId);

        return EmployeeDto.Response.fromEntity(employee);
    }

    @Override
    @Transactional(readOnly = true)
    public long getActiveEmployeeCount() {
        return employeeRepository.countActiveEmployees();
    }

    /**
     * Generate next employee number.
     */
    private String generateEmployeeNumber() {
        Integer maxNumber = employeeRepository.findMaxEmployeeNumber();
        int nextNumber = (maxNumber != null ? maxNumber : 0) + 1;
        return employeeNumberPrefix + String.format("%0" + employeeNumberPadding + "d", nextNumber);
    }
}
