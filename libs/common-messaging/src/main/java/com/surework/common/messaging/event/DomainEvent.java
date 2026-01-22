package com.surework.common.messaging.event;

import java.time.Instant;
import java.util.UUID;

/**
 * Base sealed interface for all domain events.
 * Implements Constitution Principle III: Java 21 Features (Sealed Interfaces).
 * Implements Constitution Principle XII: Communication (Domain Events via Kafka).
 *
 * All domain events must:
 * - Have a unique event ID
 * - Include the tenant ID for routing
 * - Include a timestamp
 * - Be serializable to JSON
 */
public sealed interface DomainEvent permits
        HrEvent,
        PayrollEvent,
        AccountingEvent,
        RecruitmentEvent,
        IdentityEvent,
        NotificationCommand {

    /**
     * Unique identifier for this event instance.
     */
    UUID eventId();

    /**
     * Tenant ID for event routing and isolation.
     */
    UUID tenantId();

    /**
     * Timestamp when the event occurred.
     */
    Instant timestamp();

    /**
     * The event type name for deserialization.
     */
    default String eventType() {
        return this.getClass().getSimpleName();
    }
}
