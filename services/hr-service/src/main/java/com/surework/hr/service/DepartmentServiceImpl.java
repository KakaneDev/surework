package com.surework.hr.service;

import com.surework.common.web.exception.BusinessRuleException;
import com.surework.common.web.exception.ConflictException;
import com.surework.common.web.exception.ResourceNotFoundException;
import com.surework.hr.domain.Department;
import com.surework.hr.domain.Employee;
import com.surework.hr.dto.DepartmentDto;
import com.surework.hr.repository.DepartmentRepository;
import com.surework.hr.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementation of DepartmentService.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;

    @Override
    @Transactional
    public DepartmentDto.Response createDepartment(DepartmentDto.CreateRequest request) {
        if (departmentRepository.existsByCode(request.code())) {
            throw new ConflictException("Department", "code", request.code());
        }

        Department department = new Department();
        department.setCode(request.code());
        department.setName(request.name());
        department.setDescription(request.description());
        department.setActive(true);

        if (request.parentDepartmentId() != null) {
            Department parent = departmentRepository.findById(request.parentDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", request.parentDepartmentId()));
            department.setParentDepartment(parent);
        }

        if (request.managerId() != null) {
            Employee manager = employeeRepository.findById(request.managerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", request.managerId()));
            department.setManager(manager);
        }

        department = departmentRepository.save(department);
        log.info("Created department {} with code {}", department.getId(), department.getCode());

        return DepartmentDto.Response.fromEntity(department);
    }

    @Override
    @Transactional
    public DepartmentDto.Response updateDepartment(UUID departmentId, DepartmentDto.UpdateRequest request) {
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department", departmentId));

        if (request.name() != null) {
            department.setName(request.name());
        }
        if (request.description() != null) {
            department.setDescription(request.description());
        }
        if (request.active() != null) {
            department.setActive(request.active());
        }

        if (request.parentDepartmentId() != null) {
            if (request.parentDepartmentId().equals(departmentId)) {
                throw new BusinessRuleException("Department cannot be its own parent");
            }
            Department parent = departmentRepository.findById(request.parentDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", request.parentDepartmentId()));
            department.setParentDepartment(parent);
        }

        if (request.managerId() != null) {
            Employee manager = employeeRepository.findById(request.managerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee", request.managerId()));
            department.setManager(manager);
        }

        department = departmentRepository.save(department);
        log.info("Updated department {}", departmentId);

        return DepartmentDto.Response.fromEntity(department);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DepartmentDto.Response> getDepartment(UUID departmentId) {
        return departmentRepository.findById(departmentId)
                .filter(d -> !d.isDeleted())
                .map(DepartmentDto.Response::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentDto.Response> getAllDepartments() {
        return departmentRepository.findAllActive().stream()
                .map(DepartmentDto.Response::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentDto.Response> getRootDepartments() {
        return departmentRepository.findRootDepartments().stream()
                .map(DepartmentDto.Response::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public void deleteDepartment(UUID departmentId) {
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department", departmentId));

        if (!department.getEmployees().isEmpty()) {
            throw new BusinessRuleException("Cannot delete department with employees");
        }

        department.softDelete();
        departmentRepository.save(department);
        log.info("Deleted department {}", departmentId);
    }
}
