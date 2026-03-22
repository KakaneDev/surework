package com.surework.hr.controller;

import com.surework.common.web.exception.ResourceNotFoundException;
import com.surework.hr.dto.DepartmentDto;
import com.surework.hr.service.DepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for Department operations.
 */
@RestController
@RequestMapping("/api/v1/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @PostMapping
    public ResponseEntity<DepartmentDto.Response> createDepartment(
            @Valid @RequestBody DepartmentDto.CreateRequest request) {
        DepartmentDto.Response response = departmentService.createDepartment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{departmentId}")
    public ResponseEntity<DepartmentDto.Response> getDepartment(@PathVariable UUID departmentId) {
        return departmentService.getDepartment(departmentId)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Department", departmentId));
    }

    @GetMapping
    public ResponseEntity<List<DepartmentDto.Response>> getAllDepartments() {
        List<DepartmentDto.Response> departments = departmentService.getAllDepartments();
        return ResponseEntity.ok(departments);
    }

    @GetMapping("/root")
    public ResponseEntity<List<DepartmentDto.Response>> getRootDepartments() {
        List<DepartmentDto.Response> departments = departmentService.getRootDepartments();
        return ResponseEntity.ok(departments);
    }

    @PatchMapping("/{departmentId}")
    public ResponseEntity<DepartmentDto.Response> updateDepartment(
            @PathVariable UUID departmentId,
            @Valid @RequestBody DepartmentDto.UpdateRequest request) {
        DepartmentDto.Response response = departmentService.updateDepartment(departmentId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{departmentId}")
    public ResponseEntity<Void> deleteDepartment(@PathVariable UUID departmentId) {
        departmentService.deleteDepartment(departmentId);
        return ResponseEntity.noContent().build();
    }
}
