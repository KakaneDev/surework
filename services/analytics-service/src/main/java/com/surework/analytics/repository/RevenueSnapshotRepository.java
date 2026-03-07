package com.surework.analytics.repository;

import com.surework.analytics.entity.RevenueSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RevenueSnapshotRepository extends JpaRepository<RevenueSnapshot, UUID> {

    Optional<RevenueSnapshot> findBySnapshotDate(LocalDate snapshotDate);

    @Query("""
        SELECT r FROM RevenueSnapshot r
        WHERE r.snapshotDate >= :startDate
        ORDER BY r.snapshotDate ASC
        """)
    List<RevenueSnapshot> findSnapshotsSince(@Param("startDate") LocalDate startDate);

    @Query("""
        SELECT r FROM RevenueSnapshot r
        ORDER BY r.snapshotDate DESC
        LIMIT 1
        """)
    Optional<RevenueSnapshot> findLatest();

    @Query("""
        SELECT r FROM RevenueSnapshot r
        WHERE r.snapshotDate BETWEEN :startDate AND :endDate
        ORDER BY r.snapshotDate ASC
        """)
    List<RevenueSnapshot> findBetweenDates(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
