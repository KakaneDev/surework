package com.surework.common.messaging;

/**
 * Constants for Kafka topic names.
 * Implements Constitution Principle XII: Communication (Domain Events via Kafka).
 */
public final class KafkaTopics {

    private KafkaTopics() {
        // Prevent instantiation
    }

    // Domain event topics
    public static final String HR_EVENTS = "surework.hr.events";
    public static final String PAYROLL_EVENTS = "surework.payroll.events";
    public static final String ACCOUNTING_EVENTS = "surework.accounting.events";
    public static final String RECRUITMENT_EVENTS = "surework.recruitment.events";
    public static final String IDENTITY_EVENTS = "surework.identity.events";

    // Command topics
    public static final String NOTIFICATION_COMMANDS = "surework.notifications.commands";

    // Dead letter topics
    public static final String HR_EVENTS_DLT = "surework.hr.events.dlt";
    public static final String PAYROLL_EVENTS_DLT = "surework.payroll.events.dlt";
    public static final String ACCOUNTING_EVENTS_DLT = "surework.accounting.events.dlt";
    public static final String RECRUITMENT_EVENTS_DLT = "surework.recruitment.events.dlt";
    public static final String IDENTITY_EVENTS_DLT = "surework.identity.events.dlt";
    public static final String NOTIFICATION_COMMANDS_DLT = "surework.notifications.commands.dlt";
}
