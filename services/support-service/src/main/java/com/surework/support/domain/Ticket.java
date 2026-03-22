package com.surework.support.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Represents a support ticket.
 */
@Entity
@Table(name = "tickets", indexes = {
        @Index(name = "idx_tickets_status", columnList = "status"),
        @Index(name = "idx_tickets_requester", columnList = "requester_user_id"),
        @Index(name = "idx_tickets_assigned_team", columnList = "assigned_team"),
        @Index(name = "idx_tickets_category", columnList = "category_id"),
        @Index(name = "idx_tickets_created_at", columnList = "created_at DESC")
})
@Getter
@Setter
@NoArgsConstructor
public class Ticket extends BaseEntity {

    @Column(name = "ticket_reference", nullable = false, unique = true)
    private String ticketReference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private TicketCategory category;

    @Column(name = "subcategory")
    private String subcategory;

    @Column(name = "subject", nullable = false)
    private String subject;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TicketStatus status = TicketStatus.NEW;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false)
    private TicketPriority priority = TicketPriority.MEDIUM;

    @Column(name = "requester_user_id", nullable = false)
    private UUID requesterUserId;

    @Column(name = "requester_name")
    private String requesterName;

    @Column(name = "requester_email")
    private String requesterEmail;

    @Column(name = "assigned_team", nullable = false)
    private String assignedTeam;

    @Column(name = "assigned_user_id")
    private UUID assignedUserId;

    @Column(name = "assigned_user_name")
    private String assignedUserName;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    @Column(name = "sla_deadline")
    private Instant slaDeadline;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<TicketComment> comments = new ArrayList<>();

    @Column(name = "merged_into_ticket_id")
    private UUID mergedIntoTicketId;

    // Counter for generating ticket reference
    private static final String TICKET_PREFIX = "TKT";

    public static Ticket create(TicketCategory category, String subject, String description,
                                 TicketPriority priority, UUID requesterUserId, String requesterName) {
        Ticket ticket = new Ticket();
        ticket.setCategory(category);
        ticket.setSubject(subject);
        ticket.setDescription(description);
        ticket.setPriority(priority);
        ticket.setRequesterUserId(requesterUserId);
        ticket.setRequesterName(requesterName);
        ticket.setAssignedTeam(category.getAssignedTeam());
        ticket.setStatus(TicketStatus.NEW);
        ticket.setTicketReference(generateTicketReference());
        return ticket;
    }

    private static String generateTicketReference() {
        long timestamp = System.currentTimeMillis() % 1000000;
        String random = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return TICKET_PREFIX + "-" + timestamp + "-" + random;
    }

    /**
     * Assign ticket to a support agent.
     */
    public void assignTo(UUID userId, String userName) {
        this.assignedUserId = userId;
        this.assignedUserName = userName;
        if (this.status == TicketStatus.NEW) {
            this.status = TicketStatus.IN_PROGRESS;
        }
    }

    /**
     * Mark ticket as in progress.
     */
    public void startWorking() {
        if (this.status == TicketStatus.NEW) {
            this.status = TicketStatus.IN_PROGRESS;
        }
    }

    /**
     * Mark ticket as pending (awaiting requester response).
     */
    public void markPending() {
        this.status = TicketStatus.PENDING;
    }

    /**
     * Resolve the ticket.
     */
    public void resolve(String resolutionNotes) {
        this.status = TicketStatus.RESOLVED;
        this.resolvedAt = Instant.now();
        this.resolutionNotes = resolutionNotes;
    }

    /**
     * Close the ticket.
     */
    public void close() {
        this.status = TicketStatus.CLOSED;
        this.closedAt = Instant.now();
        if (this.resolvedAt == null) {
            this.resolvedAt = Instant.now();
        }
    }

    /**
     * Reopen a resolved or closed ticket.
     */
    public void reopen() {
        if (this.status != TicketStatus.RESOLVED && this.status != TicketStatus.CLOSED) {
            throw new IllegalStateException("Can only reopen resolved or closed tickets");
        }
        this.status = TicketStatus.NEW;
        this.resolvedAt = null;
        this.closedAt = null;
        this.resolutionNotes = null;
    }

    /**
     * Add a comment to the ticket.
     */
    public TicketComment addComment(String content, UUID authorId, String authorName, boolean isAgent) {
        TicketComment comment = TicketComment.create(this, content, authorId, authorName, isAgent);
        this.comments.add(comment);

        // Update status based on who commented
        if (isAgent && this.status == TicketStatus.NEW) {
            this.status = TicketStatus.IN_PROGRESS;
        } else if (!isAgent && this.status == TicketStatus.PENDING) {
            this.status = TicketStatus.IN_PROGRESS;
        }

        return comment;
    }

    /**
     * Check if ticket is open (not resolved or closed).
     */
    public boolean isOpen() {
        return this.status != TicketStatus.RESOLVED && this.status != TicketStatus.CLOSED;
    }
}
