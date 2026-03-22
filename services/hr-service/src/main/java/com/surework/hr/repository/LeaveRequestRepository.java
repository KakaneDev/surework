package com.surework.hr.repository;

import com.surework.hr.domain.LeaveRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for LeaveRequest entity.
 * Includes tenant-filtered methods for defense-in-depth multitenancy isolation.
 */
@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, UUID> {

    // ========== Tenant-Filtered Methods (Defense-in-Depth) ==========

    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.id = :id AND lr.tenantId = :tenantId AND lr.deleted = false")
    Optional<LeaveRequest> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    @Query("""
        SELECT lr FROM LeaveRequest lr
        WHERE lr.tenantId = :tenantId
        AND lr.deleted = false
        AND (:employeeId IS NULL OR lr.employee.id = :employeeId)
        AND (:status IS NULL OR lr.status = :status)
        AND (:leaveType IS NULL OR lr.leaveType = :leaveType)
        AND (:fromDate IS NULL OR lr.startDate >= :fromDate)
        AND (:toDate IS NULL OR lr.endDate <= :toDate)
        ORDER BY lr.startDate DESC
        """)
    Page<LeaveRequest> searchByTenantId(
            @Param("tenantId") UUID tenantId,
            @Param("employeeId") UUID employeeId,
            @Param("status") LeaveRequest.LeaveStatus status,
            @Param("leaveType") LeaveRequest.LeaveType leaveType,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable
    );

    @Query("""
        SELECT lr FROM LeaveRequest lr
        WHERE lr.tenantId = :tenantId
        AND lr.deleted = false
        AND lr.status = 'PENDING'
        ORDER BY lr.createdAt ASC
        """)
    Page<LeaveRequest> findAllPendingRequestsByTenantId(@Param("tenantId") UUID tenantId, Pageable pageable);

    // ========== Standard Methods (Schema-Isolated) ==========

    List<LeaveRequest> findByEmployeeIdOrderByStartDateDesc(UUID employeeId);

    List<LeaveRequest> findByEmployeeIdAndStatus(UUID employeeId, LeaveRequest.LeaveStatus status);

    @Query("""
        SELECT lr FROM LeaveRequest lr
        WHERE lr.deleted = false
        AND (:employeeId IS NULL OR lr.employee.id = :employeeId)
        AND (:status IS NULL OR lr.status = :status)
        AND (:leaveType IS NULL OR lr.leaveType = :leaveType)
        AND (:fromDate IS NULL OR lr.startDate >= :fromDate)
        AND (:toDate IS NULL OR lr.endDate <= :toDate)
        ORDER BY lr.startDate DESC
        """)
    Page<LeaveRequest> search(
            @Param("employeeId") UUID employeeId,
            @Param("status") LeaveRequest.LeaveStatus status,
            @Param("leaveType") LeaveRequest.LeaveType leaveType,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable
    );

    @Query("""
        SELECT lr FROM LeaveRequest lr
        WHERE lr.deleted = false
        AND lr.employee.manager.id = :managerId
        AND lr.status = 'PENDING'
        ORDER BY lr.createdAt ASC
        """)
    List<LeaveRequest> findPendingForManager(@Param("managerId") UUID managerId);

    /**
     * Find all pending leave requests across the organization.
     * Used by HR/Admin for Phase 1 single-level approval workflow.
     */
    @Query("""
        SELECT lr FROM LeaveRequest lr
        WHERE lr.deleted = false
        AND lr.status = 'PENDING'
        ORDER BY lr.createdAt ASC
        """)
    Page<LeaveRequest> findAllPendingRequests(Pageable pageable);

    @Query("""
        SELECT lr FROM LeaveRequest lr
        WHERE lr.deleted = false
        AND lr.employee.id = :employeeId
        AND lr.status = 'APPROVED'
        AND ((lr.startDate BETWEEN :startDate AND :endDate)
             OR (lr.endDate BETWEEN :startDate AND :endDate)
             OR (lr.startDate <= :startDate AND lr.endDate >= :endDate))
        """)
    List<LeaveRequest> findOverlappingApproved(
            @Param("employeeId") UUID employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("""
        SELECT SUM(lr.days) FROM LeaveRequest lr
        WHERE lr.deleted = false
        AND lr.employee.id = :employeeId
        AND lr.leaveType = :leaveType
        AND lr.status = 'APPROVED'
        AND YEAR(lr.startDate) = :year
        """)
    Integer sumApprovedDaysByTypeAndYear(
            @Param("employeeId") UUID employeeId,
            @Param("leaveType") LeaveRequest.LeaveType leaveType,
            @Param("year") int year
    );
}
