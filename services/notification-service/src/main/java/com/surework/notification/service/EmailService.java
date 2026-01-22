package com.surework.notification.service;

import java.util.Map;

/**
 * Service interface for email operations.
 */
public interface EmailService {

    /**
     * Send a simple email.
     */
    void sendEmail(String to, String subject, String body);

    /**
     * Send a templated email.
     */
    void sendTemplatedEmail(String to, String subject, String templateId, Map<String, String> variables);

    /**
     * Send email with attachment.
     */
    void sendEmailWithAttachment(String to, String subject, String body, byte[] attachment, String attachmentName);
}
