package com.surework.accounting.repository;

import com.surework.accounting.domain.FiscalPeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for FiscalPeriod entities.
 */
@Repository
public interface FiscalPeriodRepository extends JpaRepository<FiscalPeriod, UUID> {

    /**
     * Find by fiscal year.
     */
    @Query("SELECT fp FROM FiscalPeriod fp WHERE fp.fiscalYear = :year AND fp.deleted = false " +
            "ORDER BY fp.periodNumber")
    List<FiscalPeriod> findByFiscalYear(@Param("year") int year);

    /**
     * Find by year and period number.
     */
    @Query("SELECT fp FROM FiscalPeriod fp WHERE fp.fiscalYear = :year AND fp.periodNumber = :period " +
            "AND fp.deleted = false")
    Optional<FiscalPeriod> findByYearAndPeriod(@Param("year") int year, @Param("period") int period);

    /**
     * Find the period containing a specific date.
     */
    @Query("SELECT fp FROM FiscalPeriod fp WHERE :date BETWEEN fp.startDate AND fp.endDate " +
            "AND fp.deleted = false")
    Optional<FiscalPeriod> findByDate(@Param("date") LocalDate date);

    /**
     * Find open periods.
     */
    @Query("SELECT fp FROM FiscalPeriod fp WHERE fp.status = 'OPEN' AND fp.deleted = false " +
            "ORDER BY fp.fiscalYear, fp.periodNumber")
    List<FiscalPeriod> findOpenPeriods();

    /**
     * Find the current open period.
     */
    @Query("SELECT fp FROM FiscalPeriod fp WHERE fp.status = 'OPEN' " +
            "AND CURRENT_DATE BETWEEN fp.startDate AND fp.endDate AND fp.deleted = false")
    Optional<FiscalPeriod> findCurrentOpenPeriod();

    /**
     * Find by status.
     */
    @Query("SELECT fp FROM FiscalPeriod fp WHERE fp.status = :status AND fp.deleted = false " +
            "ORDER BY fp.fiscalYear, fp.periodNumber")
    List<FiscalPeriod> findByStatus(@Param("status") FiscalPeriod.PeriodStatus status);

    /**
     * Find year-end periods.
     */
    @Query("SELECT fp FROM FiscalPeriod fp WHERE fp.yearEnd = true AND fp.deleted = false " +
            "ORDER BY fp.fiscalYear DESC")
    List<FiscalPeriod> findYearEndPeriods();

    /**
     * Check if periods exist for a fiscal year.
     */
    @Query("SELECT COUNT(fp) > 0 FROM FiscalPeriod fp WHERE fp.fiscalYear = :year AND fp.deleted = false")
    boolean existsByFiscalYear(@Param("year") int year);
}
