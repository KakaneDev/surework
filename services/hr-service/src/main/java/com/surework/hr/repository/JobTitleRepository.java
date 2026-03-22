package com.surework.hr.repository;

import com.surework.hr.domain.JobTitle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for JobTitle entity.
 * Includes tenant-filtered methods for defense-in-depth multitenancy isolation.
 */
@Repository
public interface JobTitleRepository extends JpaRepository<JobTitle, UUID> {

    // ========== Tenant-Filtered Methods (Defense-in-Depth) ==========

    @Query("SELECT j FROM JobTitle j WHERE j.id = :id AND j.tenantId = :tenantId AND j.deleted = false")
    Optional<JobTitle> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    @Query("""
        SELECT j FROM JobTitle j
        WHERE j.tenantId = :tenantId AND j.deleted = false AND j.active = true
        ORDER BY j.title
        """)
    List<JobTitle> findAllActiveByTenantId(@Param("tenantId") UUID tenantId);

    @Query("""
        SELECT j FROM JobTitle j
        WHERE j.tenantId = :tenantId AND j.deleted = false
        AND j.department.id = :departmentId AND j.active = true
        ORDER BY j.title
        """)
    List<JobTitle> findByDepartmentIdAndTenantId(
            @Param("departmentId") UUID departmentId,
            @Param("tenantId") UUID tenantId
    );

    // ========== Standard Methods (Schema-Isolated) ==========

    Optional<JobTitle> findByCode(String code);

    Optional<JobTitle> findByTitle(String title);

    boolean existsByCode(String code);

    @Query("""
        SELECT j FROM JobTitle j
        WHERE j.deleted = false
        AND j.active = true
        ORDER BY j.title
        """)
    List<JobTitle> findAllActive();

    @Query("""
        SELECT j FROM JobTitle j
        WHERE j.deleted = false
        AND j.department.id = :departmentId
        AND j.active = true
        ORDER BY j.title
        """)
    List<JobTitle> findByDepartmentId(@Param("departmentId") UUID departmentId);
}
