package com.surework.accounting.repository;

import com.surework.accounting.domain.PayrollAccountMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for PayrollAccountMapping entities.
 */
@Repository
public interface PayrollAccountMappingRepository extends JpaRepository<PayrollAccountMapping, UUID> {

    /**
     * Find mapping by type for a specific department (tenant-scoped).
     */
    @Query("SELECT m FROM PayrollAccountMapping m " +
            "WHERE m.mappingType = :type " +
            "AND m.departmentId = :departmentId " +
            "AND m.tenantId = :tenantId " +
            "AND m.active = true " +
            "AND m.deleted = false")
    Optional<PayrollAccountMapping> findByTypeAndDepartmentAndTenant(
            @Param("type") PayrollAccountMapping.MappingType type,
            @Param("departmentId") UUID departmentId,
            @Param("tenantId") UUID tenantId);

    /**
     * Find default mapping by type (tenant-scoped).
     */
    @Query("SELECT m FROM PayrollAccountMapping m " +
            "WHERE m.mappingType = :type " +
            "AND m.tenantId = :tenantId " +
            "AND m.isDefault = true " +
            "AND m.active = true " +
            "AND m.deleted = false")
    Optional<PayrollAccountMapping> findDefaultByTypeAndTenant(
            @Param("type") PayrollAccountMapping.MappingType type,
            @Param("tenantId") UUID tenantId);

    /**
     * Find mapping by type, preferring department-specific over default (tenant-scoped).
     */
    default Optional<PayrollAccountMapping> findMapping(
            PayrollAccountMapping.MappingType type, UUID departmentId, UUID tenantId) {
        if (departmentId != null) {
            Optional<PayrollAccountMapping> deptMapping = findByTypeAndDepartmentAndTenant(type, departmentId, tenantId);
            if (deptMapping.isPresent()) {
                return deptMapping;
            }
        }
        return findDefaultByTypeAndTenant(type, tenantId);
    }

    /**
     * Find all active mappings (tenant-scoped).
     */
    @Query("SELECT m FROM PayrollAccountMapping m " +
            "WHERE m.tenantId = :tenantId " +
            "AND m.active = true " +
            "AND m.deleted = false " +
            "ORDER BY m.mappingType, m.isDefault DESC")
    List<PayrollAccountMapping> findAllActiveByTenant(@Param("tenantId") UUID tenantId);

    /**
     * Find all mappings by type (tenant-scoped).
     */
    @Query("SELECT m FROM PayrollAccountMapping m " +
            "WHERE m.mappingType = :type " +
            "AND m.tenantId = :tenantId " +
            "AND m.deleted = false " +
            "ORDER BY m.isDefault DESC")
    List<PayrollAccountMapping> findByTypeAndTenant(
            @Param("type") PayrollAccountMapping.MappingType type,
            @Param("tenantId") UUID tenantId);

    /**
     * Find all default mappings (tenant-scoped).
     */
    @Query("SELECT m FROM PayrollAccountMapping m " +
            "WHERE m.tenantId = :tenantId " +
            "AND m.isDefault = true " +
            "AND m.active = true " +
            "AND m.deleted = false")
    List<PayrollAccountMapping> findAllDefaultsByTenant(@Param("tenantId") UUID tenantId);

    /**
     * Find all mappings for a department (tenant-scoped).
     */
    @Query("SELECT m FROM PayrollAccountMapping m " +
            "WHERE m.departmentId = :departmentId " +
            "AND m.tenantId = :tenantId " +
            "AND m.active = true " +
            "AND m.deleted = false")
    List<PayrollAccountMapping> findByDepartmentAndTenant(
            @Param("departmentId") UUID departmentId,
            @Param("tenantId") UUID tenantId);

    /**
     * Check if a mapping exists for a type (tenant-scoped).
     */
    @Query("SELECT COUNT(m) > 0 FROM PayrollAccountMapping m " +
            "WHERE m.mappingType = :type " +
            "AND m.tenantId = :tenantId " +
            "AND m.active = true " +
            "AND m.deleted = false")
    boolean existsByTypeAndTenant(
            @Param("type") PayrollAccountMapping.MappingType type,
            @Param("tenantId") UUID tenantId);
}
