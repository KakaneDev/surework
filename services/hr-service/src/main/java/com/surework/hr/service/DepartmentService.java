package com.surework.hr.service;

import com.surework.hr.dto.DepartmentDto;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service interface for Department operations.
 */
public interface DepartmentService {

    DepartmentDto.Response createDepartment(DepartmentDto.CreateRequest request);

    DepartmentDto.Response updateDepartment(UUID departmentId, DepartmentDto.UpdateRequest request);

    Optional<DepartmentDto.Response> getDepartment(UUID departmentId);

    List<DepartmentDto.Response> getAllDepartments();

    List<DepartmentDto.Response> getRootDepartments();

    void deleteDepartment(UUID departmentId);
}
