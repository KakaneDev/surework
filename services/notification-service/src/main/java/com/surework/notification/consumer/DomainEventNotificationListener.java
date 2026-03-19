package com.surework.notification.consumer;

import com.surework.common.messaging.KafkaTopics;
import com.surework.common.messaging.event.*;
import com.surework.notification.domain.Notification;
import com.surework.notification.domain.Notification.NotificationType;
import com.surework.notification.service.NotificationService;
import com.surework.notification.service.RecipientResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Kafka listener that converts domain events into user notifications.
 * Uses Java 21 pattern matching on sealed interfaces for type-safe event handling.
 * Implements Constitution Principle XII: Communication (Async Notifications via Kafka).
 */
@Component
@Slf4j
public class DomainEventNotificationListener {

    private final NotificationService notificationService;
    private final RecipientResolver recipientResolver;
    private final com.surework.notification.service.EmailService emailService;
    private final com.surework.notification.service.ContractPdfService contractPdfService;
    private final TemplateEngine templateEngine;

    @org.springframework.beans.factory.annotation.Value("${app.careers-url:http://localhost:4200/careers}")
    private String careersUrl;

    public DomainEventNotificationListener(
            NotificationService notificationService,
            RecipientResolver recipientResolver,
            com.surework.notification.service.EmailService emailService,
            com.surework.notification.service.ContractPdfService contractPdfService,
            TemplateEngine templateEngine) {
        this.notificationService = notificationService;
        this.recipientResolver = recipientResolver;
        this.emailService = emailService;
        this.contractPdfService = contractPdfService;
        this.templateEngine = templateEngine;
    }

    /**
     * Handle HR domain events (leave requests, approvals, etc.).
     */
    @KafkaListener(topics = KafkaTopics.HR_EVENTS, groupId = "notification-service-hr")
    public void handleHrEvent(HrEvent event, Acknowledgment ack) {
        try {
            log.debug("Received HR event: {}", event.eventType());

            switch (event) {
                case HrEvent.LeaveRequested e -> handleLeaveRequested(e);
                case HrEvent.LeaveApproved e -> handleLeaveApproved(e);
                case HrEvent.LeaveRejected e -> handleLeaveRejected(e);
                case HrEvent.LeaveCancelled e -> handleLeaveCancelled(e);
                case HrEvent.EmployeeCreated e -> log.debug("EmployeeCreated event - no notification needed");
                case HrEvent.EmployeeUpdated e -> log.debug("EmployeeUpdated event - no notification needed");
                case HrEvent.EmployeeTerminated e -> log.debug("EmployeeTerminated event - no notification needed");
                case HrEvent.SalaryUpdated e -> log.debug("SalaryUpdated event - no notification needed");
            }

            ack.acknowledge();
        } catch (Exception e) {
            log.error("Error processing HR event {}: {}", event.eventType(), e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Handle Payroll domain events (payslips, payroll runs, etc.).
     */
    @KafkaListener(topics = KafkaTopics.PAYROLL_EVENTS, groupId = "notification-service-payroll")
    public void handlePayrollEvent(PayrollEvent event, Acknowledgment ack) {
        try {
            log.debug("Received Payroll event: {}", event.eventType());

            switch (event) {
                case PayrollEvent.PayslipGenerated e -> handlePayslipGenerated(e);
                case PayrollEvent.PayrollRunStarted e -> log.debug("PayrollRunStarted event - no notification needed");
                case PayrollEvent.PayrollRunCompleted e -> log.debug("PayrollRunCompleted event - no notification needed");
                case PayrollEvent.PayrollRunApproved e -> log.debug("PayrollRunApproved event - no notification needed");
                case PayrollEvent.PayrollRunFailed e -> log.debug("PayrollRunFailed event - no notification needed");
                case PayrollEvent.SalaryUpdated e -> log.debug("SalaryUpdated event - no notification needed");
            }

            ack.acknowledge();
        } catch (Exception e) {
            log.error("Error processing Payroll event {}: {}", event.eventType(), e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Handle Support domain events (tickets, comments, resolutions).
     */
    @KafkaListener(topics = KafkaTopics.SUPPORT_EVENTS, groupId = "notification-service-support")
    public void handleSupportEvent(SupportEvent event, Acknowledgment ack) {
        try {
            log.debug("Received Support event: {}", event.eventType());

            switch (event) {
                case SupportEvent.TicketCreated e -> handleTicketCreated(e);
                case SupportEvent.TicketAssigned e -> handleTicketAssigned(e);
                case SupportEvent.TicketCommentAdded e -> handleTicketCommentAdded(e);
                case SupportEvent.TicketResolved e -> handleTicketResolved(e);
                case SupportEvent.TicketReopened e -> handleTicketReopened(e);
                case SupportEvent.TicketClosed e -> handleTicketClosed(e);
            }

            ack.acknowledge();
        } catch (Exception e) {
            log.error("Error processing Support event {}: {}", event.eventType(), e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Handle Recruitment domain events (applications, interviews, offers, portal alerts).
     */
    @KafkaListener(topics = KafkaTopics.RECRUITMENT_EVENTS, groupId = "notification-service-recruitment")
    public void handleRecruitmentEvent(RecruitmentEvent event, Acknowledgment ack) {
        try {
            log.debug("Received Recruitment event: {}", event.eventType());

            switch (event) {
                case RecruitmentEvent.InterviewScheduled e -> handleInterviewScheduled(e);
                case RecruitmentEvent.OfferExtended e -> handleOfferExtended(e);
                case RecruitmentEvent.OfferAccepted e -> handleOfferAccepted(e);
                case RecruitmentEvent.OfferDeclined e -> handleOfferDeclined(e);
                case RecruitmentEvent.ApplicationReceived e -> handleApplicationReceived(e);
                case RecruitmentEvent.ExternalPostingFailed e -> handleExternalPostingFailed(e);
                case RecruitmentEvent.PortalCredentialAlert e -> handlePortalCredentialAlert(e);
                case RecruitmentEvent.ExternalPostingRequiresManual e -> handleExternalPostingRequiresManual(e);
                case RecruitmentEvent.JobPostingCreated e -> log.debug("JobPostingCreated event - no notification needed");
                case RecruitmentEvent.JobPostingPublished e -> log.debug("JobPostingPublished event - no notification needed");
                case RecruitmentEvent.JobPostingClosed e -> log.debug("JobPostingClosed event - no notification needed");
                case RecruitmentEvent.ApplicationStatusChanged e -> log.debug("ApplicationStatusChanged event - no notification needed");
                case RecruitmentEvent.CandidateHired e -> log.debug("CandidateHired event - no notification needed");
                case RecruitmentEvent.ExternalPostingRequested e -> log.debug("ExternalPostingRequested event - no notification needed");
                case RecruitmentEvent.ExternalPostingCompleted e -> log.debug("ExternalPostingCompleted event - no notification needed");
            }

            ack.acknowledge();
        } catch (Exception e) {
            log.error("Error processing Recruitment event {}: {}", event.eventType(), e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Handle Identity domain events (password changes, account updates).
     */
    @KafkaListener(topics = KafkaTopics.IDENTITY_EVENTS, groupId = "notification-service-identity")
    public void handleIdentityEvent(IdentityEvent event, Acknowledgment ack) {
        try {
            log.debug("Received Identity event: {}", event.eventType());

            switch (event) {
                case IdentityEvent.UserPasswordChanged e -> handlePasswordChanged(e);
                case IdentityEvent.VerificationCodeGenerated e -> handleVerificationCode(e);
                case IdentityEvent.UserCreated e -> log.debug("UserCreated event - no notification needed");
                case IdentityEvent.UserActivated e -> log.debug("UserActivated event - no notification needed");
                case IdentityEvent.UserDeactivated e -> log.debug("UserDeactivated event - no notification needed");
                case IdentityEvent.UserMfaEnabled e -> log.debug("UserMfaEnabled event - no notification needed");
                case IdentityEvent.UserMfaDisabled e -> log.debug("UserMfaDisabled event - no notification needed");
                case IdentityEvent.UserRolesChanged e -> log.debug("UserRolesChanged event - no notification needed");
                case IdentityEvent.UserLoginSucceeded e -> log.debug("UserLoginSucceeded event - no notification needed");
                case IdentityEvent.UserLoginFailed e -> log.debug("UserLoginFailed event - no notification needed");
                case IdentityEvent.UserLockedOut e -> log.debug("UserLockedOut event - no notification needed");
            }

            ack.acknowledge();
        } catch (Exception e) {
            log.error("Error processing Identity event {}: {}", event.eventType(), e.getMessage(), e);
            throw e;
        }
    }

    // === HR Event Handlers ===

    private void handleLeaveRequested(HrEvent.LeaveRequested event) {
        // Notify the manager
        Optional<UUID> managerUserId = recipientResolver.getManagerUserId(event.employeeId());
        if (managerUserId.isPresent()) {
            notificationService.createNotification(
                    managerUserId.get(),
                    NotificationType.LEAVE_SUBMITTED,
                    "New Leave Request",
                    String.format("A new %s leave request for %d days requires your approval.",
                            event.leaveType(), event.days()),
                    "LEAVE_REQUEST",
                    event.leaveRequestId()
            );
            log.info("Created leave request notification for manager user {}", managerUserId.get());
        } else {
            log.warn("Could not resolve manager for employee {} - leave request notification not sent",
                    event.employeeId());
        }
    }

    private void handleLeaveApproved(HrEvent.LeaveApproved event) {
        // Notify the employee
        Optional<UUID> employeeUserId = recipientResolver.getEmployeeUserId(event.employeeId());
        if (employeeUserId.isPresent()) {
            notificationService.createNotification(
                    employeeUserId.get(),
                    NotificationType.LEAVE_APPROVED,
                    "Leave Request Approved",
                    "Your leave request has been approved.",
                    "LEAVE_REQUEST",
                    event.leaveRequestId()
            );
            log.info("Created leave approved notification for user {}", employeeUserId.get());
        } else {
            log.warn("Could not resolve user for employee {} - leave approved notification not sent",
                    event.employeeId());
        }
    }

    private void handleLeaveRejected(HrEvent.LeaveRejected event) {
        // Notify the employee
        Optional<UUID> employeeUserId = recipientResolver.getEmployeeUserId(event.employeeId());
        if (employeeUserId.isPresent()) {
            String message = event.reason() != null
                    ? String.format("Your leave request has been rejected. Reason: %s", event.reason())
                    : "Your leave request has been rejected.";
            notificationService.createNotification(
                    employeeUserId.get(),
                    NotificationType.LEAVE_REJECTED,
                    "Leave Request Rejected",
                    message,
                    "LEAVE_REQUEST",
                    event.leaveRequestId()
            );
            log.info("Created leave rejected notification for user {}", employeeUserId.get());
        } else {
            log.warn("Could not resolve user for employee {} - leave rejected notification not sent",
                    event.employeeId());
        }
    }

    private void handleLeaveCancelled(HrEvent.LeaveCancelled event) {
        // Notify the manager
        Optional<UUID> managerUserId = recipientResolver.getManagerUserId(event.employeeId());
        if (managerUserId.isPresent()) {
            notificationService.createNotification(
                    managerUserId.get(),
                    NotificationType.LEAVE_CANCELLED,
                    "Leave Request Cancelled",
                    "A leave request has been cancelled by the employee.",
                    "LEAVE_REQUEST",
                    event.leaveRequestId()
            );
            log.info("Created leave cancelled notification for manager user {}", managerUserId.get());
        } else {
            log.warn("Could not resolve manager for employee {} - leave cancelled notification not sent",
                    event.employeeId());
        }
    }

    // === Payroll Event Handlers ===

    private void handlePayslipGenerated(PayrollEvent.PayslipGenerated event) {
        // Notify the employee
        Optional<UUID> employeeUserId = recipientResolver.getEmployeeUserId(event.employeeId());
        if (employeeUserId.isPresent()) {
            notificationService.createNotification(
                    employeeUserId.get(),
                    NotificationType.PAYSLIP_READY,
                    "Payslip Available",
                    String.format("Your payslip for %d/%02d is now available.",
                            event.periodYear(), event.periodMonth()),
                    "PAYSLIP",
                    event.payslipId()
            );
            log.info("Created payslip notification for user {}", employeeUserId.get());
        } else {
            log.warn("Could not resolve user for employee {} - payslip notification not sent",
                    event.employeeId());
        }
    }

    // === Support Event Handlers ===

    private void handleTicketCreated(SupportEvent.TicketCreated event) {
        // Notify the requester that their ticket was created
        notificationService.createNotification(
                event.requesterUserId(),
                NotificationType.TICKET_CREATED,
                "Ticket Created",
                String.format("Your support ticket %s has been created and assigned to %s.",
                        event.ticketReference(), event.assignedTeam()),
                "TICKET",
                event.ticketId()
        );
        log.info("Created ticket created notification for user {}", event.requesterUserId());
    }

    private void handleTicketAssigned(SupportEvent.TicketAssigned event) {
        // Notify the assigned agent
        notificationService.createNotification(
                event.assignedToUserId(),
                NotificationType.TICKET_ASSIGNED,
                "Ticket Assigned",
                String.format("Ticket %s has been assigned to you.", event.ticketReference()),
                "TICKET",
                event.ticketId()
        );
        log.info("Created ticket assigned notification for agent {}", event.assignedToUserId());
    }

    private void handleTicketCommentAdded(SupportEvent.TicketCommentAdded event) {
        if (event.isAgentComment()) {
            // Agent commented - notify the requester
            notificationService.createNotification(
                    event.requesterUserId(),
                    NotificationType.TICKET_UPDATED,
                    "Ticket Updated",
                    String.format("A support agent has responded to your ticket %s.", event.ticketReference()),
                    "TICKET",
                    event.ticketId()
            );
            log.info("Created ticket comment notification for requester {}", event.requesterUserId());
        } else if (event.assignedUserId() != null) {
            // Requester commented - notify the assigned agent
            notificationService.createNotification(
                    event.assignedUserId(),
                    NotificationType.TICKET_UPDATED,
                    "Ticket Updated",
                    String.format("The requester has responded to ticket %s.", event.ticketReference()),
                    "TICKET",
                    event.ticketId()
            );
            log.info("Created ticket comment notification for agent {}", event.assignedUserId());
        }
    }

    private void handleTicketResolved(SupportEvent.TicketResolved event) {
        // Notify the requester
        notificationService.createNotification(
                event.requesterUserId(),
                NotificationType.TICKET_RESOLVED,
                "Ticket Resolved",
                String.format("Your support ticket %s has been resolved.", event.ticketReference()),
                "TICKET",
                event.ticketId()
        );
        log.info("Created ticket resolved notification for user {}", event.requesterUserId());
    }

    private void handleTicketReopened(SupportEvent.TicketReopened event) {
        // Notify the assigned agent if there is one
        if (event.assignedUserId() != null) {
            notificationService.createNotification(
                    event.assignedUserId(),
                    NotificationType.TICKET_UPDATED,
                    "Ticket Reopened",
                    String.format("Ticket %s has been reopened by the requester.", event.ticketReference()),
                    "TICKET",
                    event.ticketId()
            );
            log.info("Created ticket reopened notification for agent {}", event.assignedUserId());
        }
    }

    private void handleTicketClosed(SupportEvent.TicketClosed event) {
        // No notification needed - requester closed their own ticket
        log.debug("Ticket {} closed - no notification needed", event.ticketReference());
    }

    // === Recruitment Event Handlers ===

    private void handleApplicationReceived(RecruitmentEvent.ApplicationReceived event) {
        // Notify the hiring manager via the job posting
        Optional<UUID> hiringManagerUserId = recipientResolver.getHiringManagerUserId(event.jobPostingId());
        if (hiringManagerUserId.isPresent()) {
            notificationService.createNotification(
                    hiringManagerUserId.get(),
                    NotificationType.APPLICATION_RECEIVED,
                    "New Application Received",
                    String.format("A new application has been received from %s.", event.candidateName()),
                    "APPLICATION",
                    event.applicationId()
            );
            log.info("Created application received notification for hiring manager {}", hiringManagerUserId.get());
        } else {
            log.warn("Could not resolve hiring manager for job posting {} - application notification not sent",
                    event.jobPostingId());
        }
    }

    private void handleInterviewScheduled(RecruitmentEvent.InterviewScheduled event) {
        // Notify the interviewer
        notificationService.createNotification(
                event.interviewerId(),
                NotificationType.INTERVIEW_SCHEDULED,
                "Interview Scheduled",
                String.format("An interview has been scheduled with %s for %s.",
                        event.candidateName(), event.interviewType().replace("_", " ")),
                "INTERVIEW",
                event.interviewId()
        );
        log.info("Created interview scheduled notification for interviewer {}", event.interviewerId());
    }

    private void handleOfferExtended(RecruitmentEvent.OfferExtended event) {
        // Notify the hiring manager (in-app)
        if (event.hiringManagerId() != null) {
            notificationService.createNotification(
                    event.hiringManagerId(),
                    NotificationType.OFFER_EXTENDED,
                    "Offer Extended",
                    String.format("An offer has been extended to %s.", event.candidateName()),
                    "APPLICATION",
                    event.applicationId()
            );
            log.info("Created offer extended notification for hiring manager {}", event.hiringManagerId());
        }

        // Send offer email to candidate with contract PDF attached
        if (event.candidateEmail() != null && event.offerToken() != null) {
            String offerLink = careersUrl + "/offer/" + event.offerToken();
            String formattedSalary = formatZarSalary(event.offerSalary());
            String formattedExpiry = formatDate(event.offerExpiryDate());
            String formattedStart = formatDate(event.proposedStartDate());
            String jobTitle = event.jobTitle() != null ? event.jobTitle() : "Position";
            String issueDate = LocalDate.now().format(DateTimeFormatter.ofPattern("d MMMM yyyy"));

            // Try to generate unsigned contract PDF and send with offer
            byte[] contractPdf = null;
            try {
                Map<String, Object> contractData = new HashMap<>();
                contractData.put("candidateName", event.candidateName());
                contractData.put("jobTitle", jobTitle);
                contractData.put("department", event.department());
                contractData.put("location", event.location());
                contractData.put("employmentType", event.employmentType() != null ? event.employmentType() : "FULL_TIME");
                contractData.put("formattedSalary", formattedSalary);
                contractData.put("salaryCurrency", event.salaryCurrency() != null ? event.salaryCurrency() : "ZAR");
                contractData.put("startDate", formattedStart);
                contractData.put("workingHours", event.workingHours() != null ? event.workingHours() : "08:00 - 17:00, Monday to Friday");
                contractData.put("issueDate", issueDate);
                contractData.put("signed", false);

                contractPdf = contractPdfService.generateEmploymentContract(contractData);
                log.info("Generated unsigned contract PDF for offer to {}", event.candidateEmail());
            } catch (Exception e) {
                log.warn("Failed to generate contract PDF for offer to {}: {}", event.candidateEmail(), e.getMessage());
            }

            try {
                Map<String, Object> emailVars = new HashMap<>();
                emailVars.put("candidateName", event.candidateName());
                emailVars.put("jobTitle", jobTitle);
                emailVars.put("salary", formattedSalary);
                emailVars.put("startDate", formattedStart);
                emailVars.put("expiryDate", formattedExpiry);
                emailVars.put("offerLink", offerLink);
                emailVars.put("hasContract", contractPdf != null);

                if (contractPdf != null) {
                    String safeName = event.candidateName().replaceAll("[^a-zA-Z0-9]", "_");
                    String attachmentFilename = "Employment_Contract_" + safeName + ".pdf";

                    emailService.sendEmailWithAttachment(
                            event.candidateEmail(),
                            "Job Offer - " + jobTitle,
                            "email/offer-letter",
                            emailVars,
                            contractPdf,
                            attachmentFilename
                    );
                    log.info("Sent offer email with contract PDF to {} with token {}", event.candidateEmail(), event.offerToken());
                } else {
                    emailService.sendOfferEmail(event.candidateEmail(), emailVars);
                    log.info("Sent offer email (without contract) to {} with token {}", event.candidateEmail(), event.offerToken());
                }
            } catch (Exception e) {
                log.error("Failed to send offer email to {}: {}", event.candidateEmail(), e.getMessage(), e);
            }
        }
    }

    private void handleOfferAccepted(RecruitmentEvent.OfferAccepted event) {
        // Notify hiring manager (in-app)
        if (event.hiringManagerId() != null) {
            notificationService.createNotification(
                    event.hiringManagerId(),
                    NotificationType.OFFER_ACCEPTED,
                    "Offer Accepted",
                    String.format("%s has accepted the job offer!", event.candidateName()),
                    "APPLICATION",
                    event.applicationId()
            );
            log.info("Created offer accepted notification for hiring manager {}", event.hiringManagerId());
        }

        // Generate employment contract PDF and send via email
        if (event.candidateEmail() != null) {
            try {
                String formattedSalary = formatZarSalary(event.salary());
                String formattedStartDate = formatDate(event.startDate());
                String issueDate = LocalDate.now().format(DateTimeFormatter.ofPattern("d MMMM yyyy"));
                String jobTitle = event.jobTitle() != null ? event.jobTitle() : "the position";

                // Build contract data for PDF generation
                Map<String, Object> contractData = new HashMap<>();
                contractData.put("candidateName", event.candidateName());
                contractData.put("jobTitle", jobTitle);
                contractData.put("department", event.department());
                contractData.put("location", event.location());
                contractData.put("employmentType", event.employmentType() != null ? event.employmentType() : "FULL_TIME");
                contractData.put("formattedSalary", formattedSalary);
                contractData.put("salaryCurrency", event.salaryCurrency() != null ? event.salaryCurrency() : "ZAR");
                contractData.put("startDate", formattedStartDate);
                contractData.put("workingHours", event.workingHours() != null ? event.workingHours() : "08:00 - 17:00, Monday to Friday");
                contractData.put("issueDate", issueDate);
                contractData.put("signed", true);
                contractData.put("signatureDate", issueDate);
                contractData.put("acceptanceDate", issueDate);

                // Generate PDF
                byte[] contractPdf = contractPdfService.generateEmploymentContract(contractData);

                // Build email variables
                Map<String, Object> emailVars = new HashMap<>();
                emailVars.put("candidateName", event.candidateName());
                emailVars.put("jobTitle", jobTitle);
                emailVars.put("department", event.department());
                emailVars.put("startDate", formattedStartDate);
                emailVars.put("formattedSalary", formattedSalary);

                // Build attachment filename
                String safeName = event.candidateName().replaceAll("[^a-zA-Z0-9]", "_");
                String attachmentFilename = "Employment_Contract_" + safeName + ".pdf";

                // Send email with signed contract PDF attached
                emailService.sendEmailWithAttachment(
                        event.candidateEmail(),
                        "Your Signed Employment Contract",
                        "email/employment-contract",
                        emailVars,
                        contractPdf,
                        attachmentFilename
                );
                log.info("Sent employment contract email with PDF to {}", event.candidateEmail());
            } catch (Exception e) {
                log.error("Failed to generate/send employment contract to {}: {}",
                        event.candidateEmail(), e.getMessage(), e);
                // Fall back to simple confirmation email
                try {
                    emailService.sendOfferAcceptedEmail(event.candidateEmail(), Map.of(
                            "candidateName", event.candidateName(),
                            "jobTitle", event.jobTitle() != null ? event.jobTitle() : "the position",
                            "accepted", true
                    ));
                    log.info("Sent fallback offer acceptance email to {}", event.candidateEmail());
                } catch (Exception fallbackEx) {
                    log.error("Failed to send fallback email to {}: {}", event.candidateEmail(), fallbackEx.getMessage());
                }
            }
        }
    }

    private void handleOfferDeclined(RecruitmentEvent.OfferDeclined event) {
        // Notify hiring manager (in-app)
        if (event.hiringManagerId() != null) {
            String message = event.reason() != null
                    ? String.format("%s has declined the job offer. Reason: %s", event.candidateName(), event.reason())
                    : String.format("%s has declined the job offer.", event.candidateName());
            notificationService.createNotification(
                    event.hiringManagerId(),
                    NotificationType.OFFER_DECLINED,
                    "Offer Declined",
                    message,
                    "APPLICATION",
                    event.applicationId()
            );
            log.info("Created offer declined notification for hiring manager {}", event.hiringManagerId());
        }

        // Send confirmation email to candidate
        if (event.candidateEmail() != null) {
            try {
                emailService.sendOfferDeclinedEmail(event.candidateEmail(), Map.of(
                        "candidateName", event.candidateName(),
                        "jobTitle", "the position",
                        "accepted", false
                ));
                log.info("Sent offer decline confirmation email to {}", event.candidateEmail());
            } catch (Exception e) {
                log.error("Failed to send offer decline email to {}: {}", event.candidateEmail(), e.getMessage(), e);
            }
        }
    }

    private String formatZarSalary(BigDecimal amount) {
        if (amount == null) return "To be discussed";
        NumberFormat formatter = NumberFormat.getCurrencyInstance(new Locale("en", "ZA"));
        return formatter.format(amount) + "/mo";
    }

    private String formatDate(Instant instant) {
        if (instant == null) return "TBD";
        LocalDate date = instant.atZone(ZoneId.of("Africa/Johannesburg")).toLocalDate();
        return date.format(DateTimeFormatter.ofPattern("d MMMM yyyy"));
    }

    private void handleExternalPostingFailed(RecruitmentEvent.ExternalPostingFailed event) {
        if (event.requiresManualIntervention()) {
            // Notify portal admins about the failure requiring manual intervention
            for (UUID adminUserId : recipientResolver.getPortalAdminUserIds()) {
                notificationService.createNotification(
                        adminUserId,
                        NotificationType.EXTERNAL_POSTING_FAILED,
                        "Job Posting Failed - Manual Action Required",
                        String.format("Posting to %s failed and requires manual intervention: %s",
                                event.portal(), event.errorMessage()),
                        "EXTERNAL_POSTING",
                        event.externalPostingId()
                );
                log.info("Created external posting failed notification for admin {}", adminUserId);
            }
        }
    }

    private void handlePortalCredentialAlert(RecruitmentEvent.PortalCredentialAlert event) {
        // Notify portal admins about credential issues
        for (UUID adminUserId : recipientResolver.getPortalAdminUserIds()) {
            String title = switch (event.alertType()) {
                case "INVALID_CREDENTIALS" -> "Portal Credentials Invalid";
                case "CAPTCHA_REQUIRED" -> "Portal Requires CAPTCHA";
                case "TWO_FACTOR_REQUIRED" -> "Portal Requires 2FA";
                case "SESSION_EXPIRED" -> "Portal Session Expired";
                default -> "Portal Credential Alert";
            };

            notificationService.createNotification(
                    adminUserId,
                    NotificationType.PORTAL_CREDENTIAL_ALERT,
                    title,
                    String.format("%s portal: %s", event.portal(), event.message()),
                    "PORTAL_CREDENTIAL",
                    null
            );
            log.info("Created portal credential alert notification for admin {} - {} portal",
                    adminUserId, event.portal());
        }
    }

    private void handleExternalPostingRequiresManual(RecruitmentEvent.ExternalPostingRequiresManual event) {
        // Notify portal admins about posting requiring manual intervention
        for (UUID adminUserId : recipientResolver.getPortalAdminUserIds()) {
            notificationService.createNotification(
                    adminUserId,
                    NotificationType.EXTERNAL_POSTING_REQUIRES_MANUAL,
                    "Manual Posting Required",
                    String.format("Job '%s' (%s) could not be posted to %s automatically: %s",
                            event.jobTitle(), event.jobReference(), event.portal(), event.reason()),
                    "EXTERNAL_POSTING",
                    event.externalPostingId()
            );
            log.info("Created external posting requires manual notification for admin {}", adminUserId);
        }
    }

    // === Identity Event Handlers ===

    private void handleVerificationCode(IdentityEvent.VerificationCodeGenerated event) {
        var context = new Context();
        context.setVariable("firstName", event.firstName());
        context.setVariable("code", event.code());

        String body = templateEngine.process("email/verification-code", context);
        emailService.sendHtmlEmail(event.email(), "Your SureWork verification code", body);
        log.info("Sent verification code email to {}", event.email());
    }

    private void handlePasswordChanged(IdentityEvent.UserPasswordChanged event) {
        // Notify the user
        notificationService.createNotification(
                event.userId(),
                NotificationType.PASSWORD_CHANGED,
                "Password Changed",
                event.selfInitiated()
                        ? "Your password has been successfully changed."
                        : "Your password was changed. If you did not make this change, please contact support immediately.",
                "USER",
                event.userId()
        );
        log.info("Created password changed notification for user {}", event.userId());
    }
}
