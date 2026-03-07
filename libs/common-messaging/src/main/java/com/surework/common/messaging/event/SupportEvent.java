package com.surework.common.messaging.event;

import java.time.Instant;
import java.util.UUID;

/**
 * Sealed interface for Support/Helpdesk domain events.
 * Implements Constitution Principle III: Java 21 Features (Sealed Interfaces).
 */
public sealed interface SupportEvent extends DomainEvent permits
        SupportEvent.TicketCreated,
        SupportEvent.TicketAssigned,
        SupportEvent.TicketCommentAdded,
        SupportEvent.TicketResolved,
        SupportEvent.TicketReopened,
        SupportEvent.TicketClosed {

    /**
     * Event raised when a new support ticket is created.
     */
    record TicketCreated(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID ticketId,
            String ticketReference,
            UUID requesterUserId,
            String subject,
            String assignedTeam
    ) implements SupportEvent {}

    /**
     * Event raised when a ticket is assigned to a support agent.
     */
    record TicketAssigned(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID ticketId,
            String ticketReference,
            UUID assignedToUserId,
            String assignedToUserName,
            UUID requesterUserId
    ) implements SupportEvent {}

    /**
     * Event raised when a comment is added to a ticket.
     */
    record TicketCommentAdded(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID ticketId,
            String ticketReference,
            UUID authorUserId,
            boolean isAgentComment,
            UUID requesterUserId,
            UUID assignedUserId
    ) implements SupportEvent {}

    /**
     * Event raised when a ticket is resolved.
     */
    record TicketResolved(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID ticketId,
            String ticketReference,
            UUID requesterUserId
    ) implements SupportEvent {}

    /**
     * Event raised when a resolved/closed ticket is reopened.
     */
    record TicketReopened(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID ticketId,
            String ticketReference,
            UUID requesterUserId,
            UUID assignedUserId
    ) implements SupportEvent {}

    /**
     * Event raised when a ticket is closed.
     */
    record TicketClosed(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID ticketId,
            String ticketReference,
            UUID requesterUserId
    ) implements SupportEvent {}
}
