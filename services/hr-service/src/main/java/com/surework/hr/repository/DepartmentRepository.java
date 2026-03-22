package com.surework.hr.repository;

import com.surework.hr.domain.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Department entity.
 * Includes tenant-filtered methods for defense-in-depth multitenancy isolation.
 */
@Repository
public interface DepartmentRepository extends JpaRepository<Department, UUID> {

    // ========== Tenant-Filtered Methods (Defense-in-Depth) ==========

    @Query("SELECT d FROM Department d WHERE d.id = :id AND d.tenantId = :tenantId AND d.deleted = false")
    Optional<Department> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    @Query("""
        SELECT d FROM Department d
        WHERE d.tenantId = :tenantId AND d.deleted = false AND d.active = true
        ORDER BY d.name
        """)
    List<Department> findAllActiveByTenantId(@Param("tenantId") UUID tenantId);

    @Query("""
        SELECT d FROM Department d
        WHERE d.tenantId = :tenantId AND d.deleted = false
        AND d.parentDepartment IS NULL AND d.active = true
        ORDER BY d.name
        """)
    List<Department> findRootDepartmentsByTenantId(@Param("tenantId") UUID tenantId);

    // ========== Standard Methods (Schema-Isolated) ==========

    Optional<Department> findByCode(String code);

    Optional<Department> findByName(String name);

    boolean existsByCode(String code);

    @Query("""
        SELECT d FROM Department d
        WHERE d.deleted = false
        AND d.active = true
        ORDER BY d.name
        """)
    List<Department> findAllActive();

    @Query("""
        SELECT d FROM Department d
        WHERE d.deleted = false
        AND d.parentDepartment IS NULL
        AND d.active = true
        ORDER BY d.name
        """)
    List<Department> findRootDepartments();
}
