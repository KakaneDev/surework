package com.surework.timeattendance.repository;

import com.surework.timeattendance.domain.PublicHoliday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for PublicHoliday entities.
 */
@Repository
public interface PublicHolidayRepository extends JpaRepository<PublicHoliday, UUID> {

    /**
     * Find by date.
     */
    Optional<PublicHoliday> findByHolidayDate(LocalDate date);

    /**
     * Check if date is a public holiday.
     */
    @Query("SELECT COUNT(h) > 0 FROM PublicHoliday h WHERE h.holidayDate = :date AND h.active = true")
    boolean isPublicHoliday(@Param("date") LocalDate date);

    /**
     * Find holidays for year.
     */
    @Query("SELECT h FROM PublicHoliday h WHERE h.year = :year AND h.active = true " +
            "ORDER BY h.holidayDate")
    List<PublicHoliday> findByYear(@Param("year") int year);

    /**
     * Find holidays in date range.
     */
    @Query("SELECT h FROM PublicHoliday h WHERE h.holidayDate BETWEEN :startDate AND :endDate " +
            "AND h.active = true ORDER BY h.holidayDate")
    List<PublicHoliday> findByDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Find upcoming holidays.
     */
    @Query("SELECT h FROM PublicHoliday h WHERE h.holidayDate >= :fromDate " +
            "AND h.active = true ORDER BY h.holidayDate")
    List<PublicHoliday> findUpcoming(@Param("fromDate") LocalDate fromDate);

    /**
     * Count holidays in date range.
     */
    @Query("SELECT COUNT(h) FROM PublicHoliday h WHERE h.holidayDate BETWEEN :startDate AND :endDate " +
            "AND h.active = true")
    long countInDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Find by name and year.
     */
    @Query("SELECT h FROM PublicHoliday h WHERE h.name = :name AND h.year = :year")
    Optional<PublicHoliday> findByNameAndYear(@Param("name") String name, @Param("year") int year);
}
