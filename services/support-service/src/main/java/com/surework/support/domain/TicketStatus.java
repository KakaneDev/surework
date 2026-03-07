package com.surework.support.domain;

/**
 * Status values for support tickets.
 */
public enum TicketStatus {
    NEW,           // Just created, not yet picked up
    IN_PROGRESS,   // Being worked on by support agent
    PENDING,       // Waiting for requester response
    RESOLVED,      // Issue resolved, awaiting confirmation
    CLOSED         // Ticket closed
}
