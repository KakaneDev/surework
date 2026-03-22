package com.surework.support.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

/**
 * REST client for creating notifications directly via the notification-service.
 * Used as a synchronous fallback when Kafka event publishing is unavailable.
 *
 * <p>This provides guaranteed notification delivery for critical user actions
 * when the event-driven approach fails (e.g., Kafka unavailable in dev).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationClient {

    private final RestTemplate restTemplate;

    @Value("${surework.services.notification-service.url:http://localhost:8090}")
    private String notificationServiceUrl;

    /**
     * Notification types matching the notification-service domain.
     */
    public enum NotificationType {
        TICKET_CREATED,
        TICKET_UPDATED,
        TICKET_RESOLVED,
        TICKET_ASSIGNED
    }

    /**
     * Request DTO matching notification-service's CreateRequest.
     */
    public record CreateNotificationRequest(
            UUID userId,
            String type,
            String title,
            String message,
            String referenceType,
            UUID referenceId
    ) {}

    /**
     * Creates a notification via direct REST call to notification-service.
     *
     * @param userId        the user to notify
     * @param type          notification type
     * @param title         short notification title
     * @param message       detailed message
     * @param referenceType entity type for navigation (e.g., "TICKET")
     * @param referenceId   entity ID for navigation
     * @return true if notification was created successfully
     */
    public boolean createNotification(
            UUID userId,
            NotificationType type,
            String title,
            String message,
            String referenceType,
            UUID referenceId
    ) {
        if (userId == null) {
            log.warn("Cannot create notification: userId is null");
            return false;
        }

        try {
            CreateNotificationRequest request = new CreateNotificationRequest(
                    userId,
                    type.name(),
                    title,
                    message,
                    referenceType,
                    referenceId
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            // Pass through user context for the notification service
            headers.set("X-User-Id", userId.toString());

            HttpEntity<CreateNotificationRequest> entity = new HttpEntity<>(request, headers);

            String url = notificationServiceUrl + "/api/notifications/test";
            restTemplate.postForEntity(url, entity, Void.class);

            log.info("Created notification for user {}: type={}, title={}",
                    userId, type, title);
            return true;

        } catch (RestClientException e) {
            log.error("Failed to create notification for user {}: {}",
                    userId, e.getMessage());
            return false;
        }
    }

    /**
     * Sends a ticket created notification to the requester.
     */
    public void notifyTicketCreated(UUID requesterUserId, String ticketReference, String subject, String assignedTeam) {
        createNotification(
                requesterUserId,
                NotificationType.TICKET_CREATED,
                "Ticket Created",
                String.format("Your support ticket %s has been created and assigned to %s.", ticketReference, assignedTeam),
                "TICKET",
                null
        );
    }

    /**
     * Sends a ticket assigned notification to the support agent.
     */
    public void notifyTicketAssigned(UUID agentUserId, String ticketReference, UUID ticketId) {
        createNotification(
                agentUserId,
                NotificationType.TICKET_ASSIGNED,
                "Ticket Assigned",
                String.format("Ticket %s has been assigned to you.", ticketReference),
                "TICKET",
                ticketId
        );
    }

    /**
     * Sends a ticket comment notification.
     * Notifies the requester when an agent comments, or the agent when requester comments.
     */
    public void notifyTicketComment(
            UUID recipientUserId,
            String ticketReference,
            UUID ticketId,
            boolean isAgentComment
    ) {
        String message = isAgentComment
                ? String.format("A support agent has responded to your ticket %s.", ticketReference)
                : String.format("The requester has responded to ticket %s.", ticketReference);

        createNotification(
                recipientUserId,
                NotificationType.TICKET_UPDATED,
                "Ticket Updated",
                message,
                "TICKET",
                ticketId
        );
    }

    /**
     * Sends a ticket resolved notification to the requester.
     */
    public void notifyTicketResolved(UUID requesterUserId, String ticketReference, UUID ticketId) {
        createNotification(
                requesterUserId,
                NotificationType.TICKET_RESOLVED,
                "Ticket Resolved",
                String.format("Your support ticket %s has been resolved.", ticketReference),
                "TICKET",
                ticketId
        );
    }

    /**
     * Sends a ticket reopened notification to the assigned agent.
     */
    public void notifyTicketReopened(UUID agentUserId, String ticketReference, UUID ticketId) {
        if (agentUserId != null) {
            createNotification(
                    agentUserId,
                    NotificationType.TICKET_UPDATED,
                    "Ticket Reopened",
                    String.format("Ticket %s has been reopened by the requester.", ticketReference),
                    "TICKET",
                    ticketId
            );
        }
    }
}
