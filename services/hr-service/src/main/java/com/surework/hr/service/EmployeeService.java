package com.surework.hr.service;

import com.surework.hr.domain.Employee;
import com.surework.hr.dto.EmployeeDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service interface for Employee operations.
 * Implements User Story 1: Employee Management.
 */
public interface EmployeeService {

    /**
     * Create a new employee.
     */
    EmployeeDto.Response createEmployee(EmployeeDto.CreateRequest request);

    /**
     * Update employee details.
     */
    EmployeeDto.Response updateEmployee(UUID employeeId, EmployeeDto.UpdateRequest request);

    /**
     * Get employee by ID.
     */
    Optional<EmployeeDto.Response> getEmployee(UUID employeeId);

    /**
     * Get employee by employee number.
     */
    Optional<EmployeeDto.Response> getEmployeeByNumber(String employeeNumber);

    /**
     * Search employees with filters.
     */
    Page<EmployeeDto.ListItem> searchEmployees(
            Employee.EmploymentStatus status,
            UUID departmentId,
            String search,
            Pageable pageable
    );

    /**
     * Get all active employees.
     */
    List<EmployeeDto.ListItem> getActiveEmployees();

    /**
     * Get employees by manager.
     */
    List<EmployeeDto.ListItem> getEmployeesByManager(UUID managerId);

    /**
     * Get employees by department.
     */
    List<EmployeeDto.ListItem> getEmployeesByDepartment(UUID departmentId);

    /**
     * Terminate employee.
     */
    EmployeeDto.Response terminateEmployee(UUID employeeId, LocalDate terminationDate, String reason);

    /**
     * Reactivate terminated employee.
     */
    EmployeeDto.Response reactivateEmployee(UUID employeeId);

    /**
     * Link employee to user account.
     */
    EmployeeDto.Response linkUserAccount(UUID employeeId, UUID userId);

    /**
     * Get employee count.
     */
    long getActiveEmployeeCount();
}
