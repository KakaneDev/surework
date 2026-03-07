package com.surework.accounting.consumer;

import com.surework.accounting.dto.PayrollAccountingDto;
import com.surework.accounting.service.PayrollAccountingService;
import com.surework.common.messaging.KafkaTopics;
import com.surework.common.messaging.event.PayrollEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

/**
 * Kafka consumer for payroll domain events.
 * Listens to payroll events and triggers accounting journal entry creation.
 *
 * <p>Uses Java 21 pattern matching on sealed interfaces for type-safe event handling.
 * Idempotent processing is handled by the service layer to ensure
 * redelivered messages are processed safely.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class PayrollEventConsumer {

    private final PayrollAccountingService payrollAccountingService;

    /**
     * Handle payroll domain events.
     * Primary interest is in PayrollRunApproved events for auto-journaling.
     *
     * <p>Idempotency is handled in the service layer - duplicate events
     * will return the existing journal entry without creating duplicates.
     */
    @KafkaListener(
            topics = KafkaTopics.PAYROLL_EVENTS,
            groupId = "accounting-service-payroll",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handlePayrollEvent(PayrollEvent event, Acknowledgment ack) {
        try {
            log.debug("Received payroll event: type={}, eventId={}",
                    event.eventType(), event.eventId());

            switch (event) {
                case PayrollEvent.PayrollRunApproved e -> handlePayrollRunApproved(e);
                case PayrollEvent.PayslipGenerated e -> log.debug("PayslipGenerated event - no accounting action");
                case PayrollEvent.PayrollRunStarted e -> log.debug("PayrollRunStarted event - no accounting action");
                case PayrollEvent.PayrollRunCompleted e -> log.debug("PayrollRunCompleted event - no accounting action");
                case PayrollEvent.PayrollRunFailed e -> log.debug("PayrollRunFailed event - no accounting action");
                case PayrollEvent.SalaryUpdated e -> log.debug("SalaryUpdated event - no accounting action");
            }

            ack.acknowledge();
        } catch (Exception e) {
            log.error("Error processing payroll event {}: {}", event.eventType(), e.getMessage(), e);
            // Re-throw to trigger retry or DLT
            throw e;
        }
    }

    /**
     * Handle PayrollRunApproved event.
     * Creates journal entries for payroll expenses and liabilities.
     *
     * <p>Idempotency is handled by the service - if the payroll run has
     * already been journaled, it returns the existing entry without
     * creating a duplicate.
     */
    private void handlePayrollRunApproved(PayrollEvent.PayrollRunApproved event) {
        // Log at INFO level without sensitive financial data
        log.info("Processing PayrollRunApproved: runId={}, runNumber={}, period={}/{}, employees={}",
                event.payrollRunId(),
                event.runNumber(),
                event.periodYear(),
                event.periodMonth(),
                event.employeeCount());

        try {
            // Service handles idempotency check internally
            PayrollAccountingDto.PayrollJournalResponse result =
                    payrollAccountingService.processPayrollRunApproved(event);

            if (result != null) {
                log.info("Payroll journal processed: journalId={}, entryNumber={}",
                        result.journalEntryId(), result.journalEntryNumber());
            } else {
                // Auto-journaling is disabled or already processed
                log.info("No journal created for payroll run {} (auto-journaling may be disabled)",
                        event.payrollRunId());
            }

        } catch (Exception e) {
            log.error("Failed to create payroll journal for run {}: {}",
                    event.payrollRunId(), e.getMessage(), e);
            // Let the exception propagate for retry handling
            throw e;
        }
    }
}
