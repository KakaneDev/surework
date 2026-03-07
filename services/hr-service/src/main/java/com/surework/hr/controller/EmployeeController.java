package com.surework.hr.controller;

import com.surework.common.web.PageResponse;
import com.surework.common.web.exception.ResourceNotFoundException;
import com.surework.hr.domain.Employee;
import com.surework.hr.dto.EmployeeDto;
import com.surework.hr.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for Employee operations.
 * Implements User Story 1: Employee Management.
 * Implements Constitution Principle I: RESTful API Design.
 */
@RestController
@RequestMapping("/api/v1/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    /**
     * Create a new employee.
     */
    @PostMapping
    public ResponseEntity<EmployeeDto.Response> createEmployee(
            @Valid @RequestBody EmployeeDto.CreateRequest request) {
        EmployeeDto.Response response = employeeService.createEmployee(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get employee by ID.
     */
    @GetMapping("/{employeeId}")
    public ResponseEntity<EmployeeDto.Response> getEmployee(@PathVariable UUID employeeId) {
        return employeeService.getEmployee(employeeId)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeId));
    }

    /**
     * Get employee by employee number.
     */
    @GetMapping("/number/{employeeNumber}")
    public ResponseEntity<EmployeeDto.Response> getEmployeeByNumber(@PathVariable String employeeNumber) {
        return employeeService.getEmployeeByNumber(employeeNumber)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", employeeNumber));
    }

    /**
     * Search employees with pagination.
     */
    @GetMapping
    public ResponseEntity<PageResponse<EmployeeDto.ListItem>> searchEmployees(
            @RequestParam(required = false) Employee.EmploymentStatus status,
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<EmployeeDto.ListItem> page = employeeService.searchEmployees(status, departmentId, search, pageable);
        return ResponseEntity.ok(PageResponse.from(page));
    }

    /**
     * Get all active employees (list view).
     */
    @GetMapping("/active")
    public ResponseEntity<List<EmployeeDto.ListItem>> getActiveEmployees() {
        List<EmployeeDto.ListItem> employees = employeeService.getActiveEmployees();
        return ResponseEntity.ok(employees);
    }

    /**
     * Get all employees for reporting (includes full details).
     * This endpoint is optimized for internal service-to-service calls.
     */
    @GetMapping("/all")
    public ResponseEntity<List<EmployeeDto.ReportItem>> getAllEmployeesForReporting() {
        List<EmployeeDto.ReportItem> employees = employeeService.getAllEmployeesForReporting();
        return ResponseEntity.ok(employees);
    }

    /**
     * Get employees by manager.
     */
    @GetMapping("/manager/{managerId}")
    public ResponseEntity<List<EmployeeDto.ListItem>> getEmployeesByManager(@PathVariable UUID managerId) {
        List<EmployeeDto.ListItem> employees = employeeService.getEmployeesByManager(managerId);
        return ResponseEntity.ok(employees);
    }

    /**
     * Get employees by department.
     */
    @GetMapping("/department/{departmentId}")
    public ResponseEntity<List<EmployeeDto.ListItem>> getEmployeesByDepartment(@PathVariable UUID departmentId) {
        List<EmployeeDto.ListItem> employees = employeeService.getEmployeesByDepartment(departmentId);
        return ResponseEntity.ok(employees);
    }

    /**
     * Update employee details.
     */
    @PatchMapping("/{employeeId}")
    public ResponseEntity<EmployeeDto.Response> updateEmployee(
            @PathVariable UUID employeeId,
            @Valid @RequestBody EmployeeDto.UpdateRequest request) {
        EmployeeDto.Response response = employeeService.updateEmployee(employeeId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Terminate employee.
     */
    @PostMapping("/{employeeId}/terminate")
    public ResponseEntity<EmployeeDto.Response> terminateEmployee(
            @PathVariable UUID employeeId,
            @RequestParam LocalDate terminationDate,
            @RequestParam String reason) {
        EmployeeDto.Response response = employeeService.terminateEmployee(employeeId, terminationDate, reason);
        return ResponseEntity.ok(response);
    }

    /**
     * Reactivate employee.
     */
    @PostMapping("/{employeeId}/reactivate")
    public ResponseEntity<EmployeeDto.Response> reactivateEmployee(@PathVariable UUID employeeId) {
        EmployeeDto.Response response = employeeService.reactivateEmployee(employeeId);
        return ResponseEntity.ok(response);
    }

    /**
     * Link employee to user account.
     */
    @PostMapping("/{employeeId}/link-user")
    public ResponseEntity<EmployeeDto.Response> linkUserAccount(
            @PathVariable UUID employeeId,
            @RequestParam UUID userId) {
        EmployeeDto.Response response = employeeService.linkUserAccount(employeeId, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get employee count.
     */
    @GetMapping("/count")
    public ResponseEntity<CountResponse> getEmployeeCount() {
        long count = employeeService.getActiveEmployeeCount();
        return ResponseEntity.ok(new CountResponse(count));
    }

    /**
     * Get hierarchy data for organizational chart.
     */
    @GetMapping("/hierarchy")
    public ResponseEntity<List<EmployeeDto.HierarchyItem>> getHierarchyData() {
        List<EmployeeDto.HierarchyItem> hierarchy = employeeService.getHierarchyData();
        return ResponseEntity.ok(hierarchy);
    }

    /**
     * Get the user ID linked to an employee.
     * Used by notification service to route notifications.
     */
    @GetMapping("/{employeeId}/user-id")
    public ResponseEntity<UserIdResponse> getEmployeeUserId(@PathVariable UUID employeeId) {
        return employeeService.getEmployeeUserId(employeeId)
                .map(userId -> ResponseEntity.ok(new UserIdResponse(userId)))
                .orElseThrow(() -> new ResourceNotFoundException("Employee or linked user", employeeId));
    }

    /**
     * Get the user ID of the employee's manager.
     * Used by notification service to route approval notifications.
     */
    @GetMapping("/{employeeId}/manager-user-id")
    public ResponseEntity<UserIdResponse> getManagerUserId(@PathVariable UUID employeeId) {
        return employeeService.getManagerUserId(employeeId)
                .map(userId -> ResponseEntity.ok(new UserIdResponse(userId)))
                .orElseThrow(() -> new ResourceNotFoundException("Manager for employee", employeeId));
    }

    record CountResponse(long count) {}
    record UserIdResponse(UUID userId) {}
}
