package com.surework.payroll.messaging;

import com.surework.common.messaging.event.HrEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Kafka consumer for HR events relevant to payroll.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class HrEventConsumer {

    /**
     * Handle employee created events - may need to set up payroll records.
     */
    @KafkaListener(
            topics = "surework.hr.events",
            groupId = "payroll-service-hr",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleHrEvent(HrEvent event) {
        switch (event) {
            case HrEvent.EmployeeCreated created -> handleEmployeeCreated(created);
            case HrEvent.EmployeeTerminated terminated -> handleEmployeeTerminated(terminated);
            case HrEvent.SalaryUpdated salaryUpdated -> handleSalaryUpdated(salaryUpdated);
            default -> log.debug("Ignoring HR event: {}", event.getClass().getSimpleName());
        }
    }

    private void handleEmployeeCreated(HrEvent.EmployeeCreated event) {
        log.info("Employee created: {} - ready for payroll inclusion", event.employeeId());
        // Could initialize payroll-specific records here
    }

    private void handleEmployeeTerminated(HrEvent.EmployeeTerminated event) {
        log.info("Employee terminated: {} - removing from future payroll runs", event.employeeId());
        // Handle final payroll, payout calculations, etc.
    }

    private void handleSalaryUpdated(HrEvent.SalaryUpdated event) {
        log.info("Salary updated for employee {}: {} -> {}",
                event.employeeId(), event.previousSalary(), event.newSalary());
        // Could trigger recalculation of pending payslips
    }
}
