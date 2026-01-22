package com.surework.common.messaging;

import com.surework.common.messaging.event.DomainEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

/**
 * Publisher for domain events to Kafka.
 * Implements Constitution Principle XII: Communication (Domain Events via Kafka).
 *
 * Topic naming convention: surework.{domain}.events
 * - surework.hr.events
 * - surework.payroll.events
 * - surework.accounting.events
 * - surework.recruitment.events
 * - surework.identity.events
 * - surework.notifications.commands
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class DomainEventPublisher {

    private final KafkaTemplate<String, DomainEvent> kafkaTemplate;

    private static final String TOPIC_PREFIX = "surework.";
    private static final String TOPIC_SUFFIX_EVENTS = ".events";
    private static final String TOPIC_SUFFIX_COMMANDS = ".commands";

    /**
     * Publish a domain event to the appropriate topic.
     * Uses tenantId as the partition key for ordering guarantees within a tenant.
     */
    public CompletableFuture<SendResult<String, DomainEvent>> publish(DomainEvent event) {
        String topic = resolveTopic(event);
        String key = event.tenantId().toString();

        log.debug("Publishing {} to topic {} with key {}",
                event.eventType(), topic, key);

        return kafkaTemplate.send(topic, key, event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish event {} to topic {}: {}",
                                event.eventType(), topic, ex.getMessage(), ex);
                    } else {
                        log.debug("Successfully published {} to topic {} partition {} offset {}",
                                event.eventType(), topic,
                                result.getRecordMetadata().partition(),
                                result.getRecordMetadata().offset());
                    }
                });
    }

    /**
     * Publish a domain event and block until acknowledged.
     */
    public SendResult<String, DomainEvent> publishSync(DomainEvent event) {
        return publish(event).join();
    }

    /**
     * Resolve the Kafka topic for a domain event based on its type.
     */
    private String resolveTopic(DomainEvent event) {
        String className = event.getClass().getEnclosingClass() != null
                ? event.getClass().getEnclosingClass().getSimpleName()
                : event.getClass().getSimpleName();

        return switch (className) {
            case "HrEvent" -> TOPIC_PREFIX + "hr" + TOPIC_SUFFIX_EVENTS;
            case "PayrollEvent" -> TOPIC_PREFIX + "payroll" + TOPIC_SUFFIX_EVENTS;
            case "AccountingEvent" -> TOPIC_PREFIX + "accounting" + TOPIC_SUFFIX_EVENTS;
            case "RecruitmentEvent" -> TOPIC_PREFIX + "recruitment" + TOPIC_SUFFIX_EVENTS;
            case "IdentityEvent" -> TOPIC_PREFIX + "identity" + TOPIC_SUFFIX_EVENTS;
            case "NotificationCommand" -> TOPIC_PREFIX + "notifications" + TOPIC_SUFFIX_COMMANDS;
            default -> TOPIC_PREFIX + "unknown" + TOPIC_SUFFIX_EVENTS;
        };
    }
}
