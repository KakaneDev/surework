package com.surework.hr.repository;

import com.surework.hr.domain.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Employee entity.
 * Includes tenant-filtered methods for defense-in-depth multitenancy isolation.
 */
@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID> {

    // ========== Tenant-Filtered Methods (Defense-in-Depth) ==========

    @Query("SELECT e FROM Employee e WHERE e.id = :id AND e.tenantId = :tenantId AND e.deleted = false")
    Optional<Employee> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    @Query("""
        SELECT e FROM Employee e
        WHERE e.tenantId = :tenantId AND e.deleted = false
        ORDER BY e.lastName, e.firstName
        """)
    List<Employee> findAllByTenantId(@Param("tenantId") UUID tenantId);

    @Query("""
        SELECT e FROM Employee e
        WHERE e.tenantId = :tenantId AND e.deleted = false AND e.status = 'ACTIVE'
        ORDER BY e.lastName, e.firstName
        """)
    List<Employee> findAllActiveByTenantId(@Param("tenantId") UUID tenantId);

    @Query("""
        SELECT e FROM Employee e
        WHERE e.tenantId = :tenantId
        AND e.deleted = false
        AND (:status IS NULL OR e.status = :status)
        AND (:departmentId IS NULL OR e.department.id = :departmentId)
        AND (:search IS NULL OR :search = ''
             OR LOWER(CAST(e.firstName AS string)) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
             OR LOWER(CAST(e.lastName AS string)) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
             OR LOWER(CAST(e.email AS string)) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
             OR LOWER(CAST(e.employeeNumber AS string)) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
        ORDER BY e.lastName, e.firstName
        """)
    Page<Employee> searchByTenantId(
            @Param("tenantId") UUID tenantId,
            @Param("status") Employee.EmploymentStatus status,
            @Param("departmentId") UUID departmentId,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("""
        SELECT COUNT(e) FROM Employee e
        WHERE e.tenantId = :tenantId AND e.deleted = false AND e.status = 'ACTIVE'
        """)
    long countActiveEmployeesByTenantId(@Param("tenantId") UUID tenantId);

    // ========== Standard Methods (Schema-Isolated) ==========

    Optional<Employee> findByEmployeeNumber(String employeeNumber);

    Optional<Employee> findByEmail(String email);

    Optional<Employee> findByIdNumber(String idNumber);

    Optional<Employee> findByUserId(UUID userId);

    boolean existsByEmployeeNumber(String employeeNumber);

    boolean existsByEmail(String email);

    boolean existsByIdNumber(String idNumber);

    @Query("""
        SELECT e FROM Employee e
        WHERE e.deleted = false
        AND (:status IS NULL OR e.status = :status)
        AND (:departmentId IS NULL OR e.department.id = :departmentId)
        AND (:search IS NULL OR :search = ''
             OR LOWER(CAST(e.firstName AS string)) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
             OR LOWER(CAST(e.lastName AS string)) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
             OR LOWER(CAST(e.email AS string)) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
             OR LOWER(CAST(e.employeeNumber AS string)) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
        ORDER BY e.lastName, e.firstName
        """)
    Page<Employee> search(
            @Param("status") Employee.EmploymentStatus status,
            @Param("departmentId") UUID departmentId,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("""
        SELECT e FROM Employee e
        WHERE e.deleted = false
        AND e.status = 'ACTIVE'
        ORDER BY e.lastName, e.firstName
        """)
    List<Employee> findAllActive();

    @Query("""
        SELECT e FROM Employee e
        WHERE e.deleted = false
        AND e.manager.id = :managerId
        AND e.status = 'ACTIVE'
        ORDER BY e.lastName, e.firstName
        """)
    List<Employee> findByManagerId(@Param("managerId") UUID managerId);

    @Query("""
        SELECT e FROM Employee e
        WHERE e.deleted = false
        AND e.department.id = :departmentId
        AND e.status = 'ACTIVE'
        ORDER BY e.lastName, e.firstName
        """)
    List<Employee> findByDepartmentId(@Param("departmentId") UUID departmentId);

    @Query("""
        SELECT COUNT(e) FROM Employee e
        WHERE e.deleted = false
        AND e.status = 'ACTIVE'
        """)
    long countActiveEmployees();

    @Query("""
        SELECT MAX(CAST(SUBSTRING(e.employeeNumber, 4) AS integer))
        FROM Employee e
        WHERE e.employeeNumber LIKE 'EMP%'
        """)
    Integer findMaxEmployeeNumber();
}
