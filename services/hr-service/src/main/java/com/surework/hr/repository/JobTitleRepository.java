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
 */
@Repository
public interface JobTitleRepository extends JpaRepository<JobTitle, UUID> {

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
