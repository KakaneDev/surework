package com.surework.support.repository;

import com.surework.support.domain.Ticket;
import com.surework.support.domain.TicketPriority;
import com.surework.support.domain.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for tickets.
 */
@Repository
public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    Optional<Ticket> findByTicketReference(String ticketReference);

    // User's own tickets
    Page<Ticket> findByRequesterUserIdOrderByCreatedAtDesc(UUID requesterUserId, Pageable pageable);

    Page<Ticket> findByRequesterUserIdAndStatusOrderByCreatedAtDesc(
            UUID requesterUserId, TicketStatus status, Pageable pageable);

    Page<Ticket> findByRequesterUserIdAndStatusInOrderByCreatedAtDesc(
            UUID requesterUserId, List<TicketStatus> statuses, Pageable pageable);

    long countByRequesterUserIdAndStatusIn(UUID requesterUserId, List<TicketStatus> statuses);

    long countByRequesterUserIdAndStatus(UUID requesterUserId, TicketStatus status);

    // Admin queries - all tickets
    @Query("""
            SELECT t FROM Ticket t
            WHERE (:status IS NULL OR t.status = :status)
            AND (:priority IS NULL OR t.priority = :priority)
            AND (:assignedTeam IS NULL OR t.assignedTeam = :assignedTeam)
            AND (:categoryCode IS NULL OR t.category.code = :categoryCode)
            AND (:searchTerm IS NULL OR :searchTerm = ''
                 OR LOWER(CAST(t.subject AS string)) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%'))
                 OR LOWER(CAST(t.ticketReference AS string)) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%'))
                 OR LOWER(COALESCE(CAST(t.requesterName AS string), '')) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%')))
            ORDER BY t.createdAt DESC
            """)
    Page<Ticket> searchTickets(
            @Param("status") TicketStatus status,
            @Param("priority") TicketPriority priority,
            @Param("assignedTeam") String assignedTeam,
            @Param("categoryCode") String categoryCode,
            @Param("searchTerm") String searchTerm,
            Pageable pageable);

    // Tickets assigned to a specific user
    Page<Ticket> findByAssignedUserIdOrderByCreatedAtDesc(UUID assignedUserId, Pageable pageable);

    // Tickets by team
    Page<Ticket> findByAssignedTeamOrderByCreatedAtDesc(String assignedTeam, Pageable pageable);

    // Stats queries
    long countByStatus(TicketStatus status);

    long countByStatusIn(List<TicketStatus> statuses);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.status = :status AND t.resolvedAt >= :since")
    long countResolvedSince(@Param("status") TicketStatus status, @Param("since") Instant since);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.slaDeadline < :now AND t.status IN :openStatuses")
    long countOverdueTickets(@Param("now") Instant now, @Param("openStatuses") List<TicketStatus> openStatuses);

    @Query(value = """
            SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600)
            FROM tickets
            WHERE resolved_at IS NOT NULL
            AND resolved_at >= :since
            """, nativeQuery = true)
    Double calculateAvgResolutionTimeHours(@Param("since") Instant since);
}
