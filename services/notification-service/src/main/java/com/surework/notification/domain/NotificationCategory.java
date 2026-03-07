package com.surework.notification.domain;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Categories for organizing notification types in the UI.
 * Maps each NotificationType to a category with display metadata.
 */
public enum NotificationCategory {
    LEAVE("Leave Management", "event_available", List.of(
            Notification.NotificationType.LEAVE_SUBMITTED,
            Notification.NotificationType.LEAVE_APPROVED,
            Notification.NotificationType.LEAVE_REJECTED,
            Notification.NotificationType.LEAVE_CANCELLED
    )),
    PAYROLL("Payroll", "payments", List.of(
            Notification.NotificationType.PAYSLIP_READY,
            Notification.NotificationType.PAYROLL_PROCESSED
    )),
    DOCUMENTS("Documents", "folder_shared", List.of(
            Notification.NotificationType.DOCUMENT_UPLOADED,
            Notification.NotificationType.DOCUMENT_EXPIRING,
            Notification.NotificationType.DOCUMENT_SHARED
    )),
    SUPPORT("Support", "support_agent", List.of(
            Notification.NotificationType.TICKET_CREATED,
            Notification.NotificationType.TICKET_UPDATED,
            Notification.NotificationType.TICKET_RESOLVED,
            Notification.NotificationType.TICKET_ASSIGNED
    )),
    RECRUITMENT("Recruitment", "work", List.of(
            Notification.NotificationType.APPLICATION_RECEIVED,
            Notification.NotificationType.INTERVIEW_SCHEDULED,
            Notification.NotificationType.OFFER_EXTENDED,
            Notification.NotificationType.OFFER_ACCEPTED,
            Notification.NotificationType.OFFER_DECLINED,
            Notification.NotificationType.EXTERNAL_POSTING_FAILED,
            Notification.NotificationType.EXTERNAL_POSTING_REQUIRES_MANUAL,
            Notification.NotificationType.PORTAL_CREDENTIAL_ALERT
    )),
    SYSTEM("System", "settings", List.of(
            Notification.NotificationType.SYSTEM_ANNOUNCEMENT,
            Notification.NotificationType.ACCOUNT_UPDATED,
            Notification.NotificationType.PASSWORD_CHANGED
    ));

    private final String displayName;
    private final String icon;
    private final List<Notification.NotificationType> notificationTypes;

    NotificationCategory(String displayName, String icon, List<Notification.NotificationType> notificationTypes) {
        this.displayName = displayName;
        this.icon = icon;
        this.notificationTypes = notificationTypes;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getIcon() {
        return icon;
    }

    public List<Notification.NotificationType> getNotificationTypes() {
        return notificationTypes;
    }

    /**
     * Get the category for a notification type.
     */
    public static NotificationCategory forType(Notification.NotificationType type) {
        return Arrays.stream(values())
                .filter(cat -> cat.notificationTypes.contains(type))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No category for type: " + type));
    }

    /**
     * Get all notification types grouped by category.
     */
    public static Map<NotificationCategory, List<Notification.NotificationType>> groupedByCategory() {
        return Arrays.stream(values())
                .collect(Collectors.toMap(
                        cat -> cat,
                        NotificationCategory::getNotificationTypes
                ));
    }

    /**
     * Check if a notification type is mandatory (cannot be disabled by users).
     * Mandatory types: PASSWORD_CHANGED, ACCOUNT_UPDATED, SYSTEM_ANNOUNCEMENT
     */
    public static boolean isMandatory(Notification.NotificationType type) {
        return type == Notification.NotificationType.PASSWORD_CHANGED ||
               type == Notification.NotificationType.ACCOUNT_UPDATED ||
               type == Notification.NotificationType.SYSTEM_ANNOUNCEMENT;
    }

    /**
     * Get human-readable display name for a notification type.
     */
    public static String getDisplayName(Notification.NotificationType type) {
        return switch (type) {
            case LEAVE_SUBMITTED -> "Leave Request Submitted";
            case LEAVE_APPROVED -> "Leave Approved";
            case LEAVE_REJECTED -> "Leave Rejected";
            case LEAVE_CANCELLED -> "Leave Cancelled";
            case PAYSLIP_READY -> "Payslip Available";
            case PAYROLL_PROCESSED -> "Payroll Processed";
            case DOCUMENT_UPLOADED -> "Document Uploaded";
            case DOCUMENT_EXPIRING -> "Document Expiring";
            case DOCUMENT_SHARED -> "Document Shared";
            case TICKET_CREATED -> "Support Ticket Created";
            case TICKET_UPDATED -> "Support Ticket Updated";
            case TICKET_RESOLVED -> "Support Ticket Resolved";
            case TICKET_ASSIGNED -> "Support Ticket Assigned";
            case APPLICATION_RECEIVED -> "Job Application Received";
            case INTERVIEW_SCHEDULED -> "Interview Scheduled";
            case OFFER_EXTENDED -> "Offer Extended";
            case OFFER_ACCEPTED -> "Offer Accepted";
            case OFFER_DECLINED -> "Offer Declined";
            case EXTERNAL_POSTING_FAILED -> "External Posting Failed";
            case EXTERNAL_POSTING_REQUIRES_MANUAL -> "Manual Posting Required";
            case PORTAL_CREDENTIAL_ALERT -> "Portal Credential Alert";
            case SYSTEM_ANNOUNCEMENT -> "System Announcement";
            case ACCOUNT_UPDATED -> "Account Updated";
            case PASSWORD_CHANGED -> "Password Changed";
        };
    }

    /**
     * Get description for a notification type.
     */
    public static String getDescription(Notification.NotificationType type) {
        return switch (type) {
            case LEAVE_SUBMITTED -> "When a leave request is submitted for approval";
            case LEAVE_APPROVED -> "When your leave request is approved";
            case LEAVE_REJECTED -> "When your leave request is rejected";
            case LEAVE_CANCELLED -> "When a leave request is cancelled";
            case PAYSLIP_READY -> "When your monthly payslip is available";
            case PAYROLL_PROCESSED -> "When payroll has been processed";
            case DOCUMENT_UPLOADED -> "When a new document is uploaded";
            case DOCUMENT_EXPIRING -> "When a document is about to expire";
            case DOCUMENT_SHARED -> "When a document is shared with you";
            case TICKET_CREATED -> "When a new support ticket is created";
            case TICKET_UPDATED -> "When a support ticket is updated";
            case TICKET_RESOLVED -> "When a support ticket is resolved";
            case TICKET_ASSIGNED -> "When a support ticket is assigned to you";
            case APPLICATION_RECEIVED -> "When a job application is received";
            case INTERVIEW_SCHEDULED -> "When an interview is scheduled";
            case OFFER_EXTENDED -> "When a job offer is extended";
            case OFFER_ACCEPTED -> "When a candidate accepts a job offer";
            case OFFER_DECLINED -> "When a candidate declines a job offer";
            case EXTERNAL_POSTING_FAILED -> "When posting to an external portal fails";
            case EXTERNAL_POSTING_REQUIRES_MANUAL -> "When a posting requires manual intervention";
            case PORTAL_CREDENTIAL_ALERT -> "When portal credentials need attention";
            case SYSTEM_ANNOUNCEMENT -> "Important system-wide announcements";
            case ACCOUNT_UPDATED -> "When your account settings are changed";
            case PASSWORD_CHANGED -> "When your password is changed";
        };
    }
}
