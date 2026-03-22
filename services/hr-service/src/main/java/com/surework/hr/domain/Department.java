package com.surework.hr.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Department entity representing organizational departments.
 * The tenantId field provides defense-in-depth for tenant isolation.
 */
@Entity
@Table(name = "departments")
@Getter
@Setter
@NoArgsConstructor
public class Department extends BaseEntity {

    /**
     * Tenant ID for defense-in-depth isolation.
     * Primary isolation is via schema-per-tenant; this is a secondary safeguard.
     */
    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_department_id")
    private Department parentDepartment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Employee manager;

    @Column(nullable = false)
    private boolean active = true;

    @OneToMany(mappedBy = "department")
    private List<Employee> employees = new ArrayList<>();

    @OneToMany(mappedBy = "parentDepartment")
    private List<Department> childDepartments = new ArrayList<>();
}
