package com.surework.employee.repository;

import com.surework.employee.domain.Employee;
import com.surework.employee.domain.Employee.EmploymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID> {

    Optional<Employee> findByEmployeeNumber(String employeeNumber);

    Optional<Employee> findByEmail(String email);

    List<Employee> findByStatus(EmploymentStatus status);

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.department WHERE e.status = 'ACTIVE'")
    List<Employee> findAllActive();

    @Query("SELECT COUNT(e) FROM Employee e WHERE e.status = 'ACTIVE'")
    long countActive();

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.department LEFT JOIN FETCH e.manager " +
           "WHERE (:status IS NULL OR e.status = :status) " +
           "AND (:departmentId IS NULL OR e.department.id = :departmentId)")
    Page<Employee> searchEmployees(
            @Param("status") EmploymentStatus status,
            @Param("departmentId") UUID departmentId,
            Pageable pageable);
}
