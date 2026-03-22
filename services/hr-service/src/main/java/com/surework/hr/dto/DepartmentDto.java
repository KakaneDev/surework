package com.surework.hr.dto;

import com.surework.hr.domain.Department;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

/**
 * DTOs for Department operations.
 */
public sealed interface DepartmentDto {

    record CreateRequest(
            @NotBlank(message = "Code is required")
            @Size(max = 20, message = "Code must not exceed 20 characters")
            String code,

            @NotBlank(message = "Name is required")
            @Size(max = 100, message = "Name must not exceed 100 characters")
            String name,

            @Size(max = 500, message = "Description must not exceed 500 characters")
            String description,

            UUID parentDepartmentId,
            UUID managerId
    ) implements DepartmentDto {}

    record UpdateRequest(
            @Size(max = 100, message = "Name must not exceed 100 characters")
            String name,

            @Size(max = 500, message = "Description must not exceed 500 characters")
            String description,

            UUID parentDepartmentId,
            UUID managerId,
            Boolean active
    ) implements DepartmentDto {}

    record Response(
            UUID id,
            String code,
            String name,
            String description,
            DepartmentSummary parentDepartment,
            EmployeeDto.EmployeeSummary manager,
            boolean active,
            int employeeCount,
            Instant createdAt,
            Instant updatedAt
    ) implements DepartmentDto {

        public static Response fromEntity(Department department) {
            return new Response(
                    department.getId(),
                    department.getCode(),
                    department.getName(),
                    department.getDescription(),
                    department.getParentDepartment() != null
                            ? new DepartmentSummary(
                            department.getParentDepartment().getId(),
                            department.getParentDepartment().getCode(),
                            department.getParentDepartment().getName())
                            : null,
                    department.getManager() != null
                            ? new EmployeeDto.EmployeeSummary(
                            department.getManager().getId(),
                            department.getManager().getEmployeeNumber(),
                            department.getManager().getFullName())
                            : null,
                    department.isActive(),
                    department.getEmployees() != null ? department.getEmployees().size() : 0,
                    department.getCreatedAt(),
                    department.getUpdatedAt()
            );
        }
    }

    record DepartmentSummary(
            UUID id,
            String code,
            String name
    ) {}
}
