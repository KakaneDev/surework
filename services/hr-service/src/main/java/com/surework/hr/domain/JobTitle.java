package com.surework.hr.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * JobTitle entity representing job positions.
 * The tenantId field provides defense-in-depth for tenant isolation.
 */
@Entity
@Table(name = "job_titles")
@Getter
@Setter
@NoArgsConstructor
public class JobTitle extends BaseEntity {

    /**
     * Tenant ID for defense-in-depth isolation.
     * Primary isolation is via schema-per-tenant; this is a secondary safeguard.
     */
    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String title;

    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(precision = 12, scale = 2)
    private BigDecimal minSalary;

    @Column(precision = 12, scale = 2)
    private BigDecimal maxSalary;

    @Enumerated(EnumType.STRING)
    private JobLevel level = JobLevel.INDIVIDUAL_CONTRIBUTOR;

    @Column(nullable = false)
    private boolean active = true;

    public enum JobLevel {
        INTERN,
        JUNIOR,
        INDIVIDUAL_CONTRIBUTOR,
        SENIOR,
        LEAD,
        MANAGER,
        DIRECTOR,
        EXECUTIVE
    }
}
