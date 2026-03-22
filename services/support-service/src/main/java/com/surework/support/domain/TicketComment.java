package com.surework.support.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * Represents a comment on a support ticket.
 */
@Entity
@Table(name = "ticket_comments", indexes = {
        @Index(name = "idx_ticket_comments_ticket", columnList = "ticket_id"),
        @Index(name = "idx_ticket_comments_author", columnList = "author_user_id")
})
@Getter
@Setter
@NoArgsConstructor
public class TicketComment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "author_user_id", nullable = false)
    private UUID authorUserId;

    @Column(name = "author_name", nullable = false)
    private String authorName;

    @Column(name = "is_agent")
    private boolean agent;

    @Column(name = "is_internal")
    private boolean internal;

    public static TicketComment create(Ticket ticket, String content, UUID authorId,
                                        String authorName, boolean isAgent) {
        TicketComment comment = new TicketComment();
        comment.setTicket(ticket);
        comment.setContent(content);
        comment.setAuthorUserId(authorId);
        comment.setAuthorName(authorName);
        comment.setAgent(isAgent);
        comment.setInternal(false);
        // Set createdAt manually since @CreationTimestamp only works on persist
        comment.setCreatedAt(java.time.Instant.now());
        return comment;
    }

    /**
     * Get author role label.
     */
    public String getAuthorRole() {
        return agent ? "agent" : "requester";
    }
}
