package com.surework.notification.scheduler;

import com.surework.notification.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.thymeleaf.TemplateEngine;

import java.time.LocalDate;
import java.util.Map;

/**
 * Daily scheduler that sends setup reminder emails to trial tenants who have not
 * completed their company or compliance details.
 *
 * Reminders are sent at day 2, 7, and 12 of a 14-day trial period, escalating
 * in urgency. The scheduler structure is in place and will be wired to the
 * tenant-service query endpoint when it becomes available.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SetupReminderScheduler {

    private final EmailService emailService;
    private final TemplateEngine templateEngine;
    private final RestClient.Builder restClientBuilder;

    @Value("${surework.services.tenant-service.url:http://localhost:8081}")
    private String tenantServiceUrl;

    private static final Map<Integer, String> DAY_TO_TEMPLATE = Map.of(
            2, "email/setup-reminder-day2",
            7, "email/setup-reminder-day7",
            12, "email/setup-reminder-day12");

    @Scheduled(cron = "0 0 9 * * *") // Daily at 9 AM
    public void sendSetupReminders() {
        log.info("Running setup reminder scheduler");
        var today = LocalDate.now();

        DAY_TO_TEMPLATE.forEach((day, template) -> {
            var targetTrialStart = today.minusDays(day);
            sendRemindersForDate(targetTrialStart, template, 14 - day);
        });
    }

    private void sendRemindersForDate(LocalDate trialStartDate, String template, int daysRemaining) {
        log.info("Checking for tenants started on {} for reminder", trialStartDate);
        // In a full implementation, this would query tenant-service for incomplete tenants
        // For now, the scheduler structure is in place and will be wired when the
        // tenant-service query endpoint is available
    }
}
