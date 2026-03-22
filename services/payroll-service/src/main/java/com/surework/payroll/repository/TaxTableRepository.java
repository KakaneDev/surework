package com.surework.payroll.repository;

import com.surework.payroll.domain.TaxTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for TaxTable entities.
 */
@Repository
public interface TaxTableRepository extends JpaRepository<TaxTable, UUID> {

    /**
     * Find by tax year string.
     */
    Optional<TaxTable> findByTaxYear(String taxYear);

    /**
     * Find the active tax table for a specific date.
     */
    @Query("SELECT t FROM TaxTable t WHERE t.active = true " +
            "AND t.effectiveFrom <= :date " +
            "AND (t.effectiveTo IS NULL OR t.effectiveTo >= :date)")
    Optional<TaxTable> findActiveForDate(@Param("date") LocalDate date);

    /**
     * Find all active tax tables.
     */
    @Query("SELECT t FROM TaxTable t WHERE t.active = true ORDER BY t.startYear DESC")
    List<TaxTable> findAllActive();

    /**
     * Find by start year.
     */
    @Query("SELECT t FROM TaxTable t WHERE t.startYear = :year")
    Optional<TaxTable> findByStartYear(@Param("year") int year);

    /**
     * Find the current active tax table.
     */
    @Query("SELECT t FROM TaxTable t WHERE t.active = true " +
            "AND t.effectiveFrom <= CURRENT_DATE " +
            "AND (t.effectiveTo IS NULL OR t.effectiveTo >= CURRENT_DATE)")
    Optional<TaxTable> findCurrentActive();
}
