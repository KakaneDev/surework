package com.surework.employee.controller;

import com.surework.employee.domain.Employee.EmploymentStatus;
import com.surework.employee.dto.EmployeeDto.*;
import com.surework.employee.service.EmployeeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping("/employees")
    public ResponseEntity<PageResponse<EmployeeListItem>> searchEmployees(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) EmploymentStatus status,
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) String search) {
        PageResponse<EmployeeListItem> response = employeeService.searchEmployees(page, size, status, departmentId, search);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/employees/active")
    public ResponseEntity<List<EmployeeListItem>> getActiveEmployees() {
        return ResponseEntity.ok(employeeService.getActiveEmployees());
    }

    @GetMapping("/employees/{id}")
    public ResponseEntity<EmployeeResponse> getEmployee(@PathVariable UUID id) {
        return employeeService.getEmployee(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/employees/number/{employeeNumber}")
    public ResponseEntity<EmployeeResponse> getEmployeeByNumber(@PathVariable String employeeNumber) {
        return employeeService.getEmployeeByNumber(employeeNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/employees/count")
    public ResponseEntity<Map<String, Long>> getEmployeeCount() {
        return ResponseEntity.ok(Map.of("count", employeeService.countActiveEmployees()));
    }

    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentResponse>> getDepartments() {
        return ResponseEntity.ok(employeeService.getDepartments());
    }
}
