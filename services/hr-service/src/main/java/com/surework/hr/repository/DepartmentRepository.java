package com.surework.hr.repository;

import com.surework.hr.domain.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Department entity.
 */
@Repository
public interface DepartmentRepository extends JpaRepository<Department, UUID> {

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
