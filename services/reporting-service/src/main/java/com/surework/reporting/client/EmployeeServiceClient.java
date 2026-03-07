package com.surework.reporting.client;

import com.surework.reporting.client.dto.EmployeeDto;
import com.surework.reporting.client.dto.DepartmentDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.UUID;

/**
 * Feign client for Employee Service.
 * Fetches employee and department data for reports.
 */
@FeignClient(name = "employee-service", url = "${surework.services.employee-service.url:http://localhost:8086}")
public interface EmployeeServiceClient {

    @GetMapping("/api/v1/employees/all")
    List<EmployeeDto> getAllEmployees();

    @GetMapping("/api/v1/employees/all")
    List<EmployeeDto> getEmployeesByStatus(@RequestParam("status") String status);

    @GetMapping("/api/v1/employees/{id}")
    EmployeeDto getEmployee(@PathVariable("id") UUID id);

    @GetMapping("/api/v1/employees/department/{departmentId}")
    List<EmployeeDto> getEmployeesByDepartment(@PathVariable("departmentId") UUID departmentId);

    @GetMapping("/api/v1/departments")
    List<DepartmentDto> getAllDepartments();

    @GetMapping("/api/v1/departments/{id}")
    DepartmentDto getDepartment(@PathVariable("id") UUID id);
}
