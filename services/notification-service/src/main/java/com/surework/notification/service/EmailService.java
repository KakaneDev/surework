package com.surework.notification.service;

import java.util.Map;

/**
 * Service for sending templated emails.
 */
public interface EmailService {

    /**
     * Send an offer letter email to a candidate.
     */
    void sendOfferEmail(String to, Map<String, Object> variables);

    /**
     * Send an offer acceptance confirmation email to a candidate.
     */
    void sendOfferAcceptedEmail(String to, Map<String, Object> variables);

    /**
     * Send an offer decline confirmation email to a candidate.
     */
    void sendOfferDeclinedEmail(String to, Map<String, Object> variables);

    /**
     * Send an email with a PDF attachment.
     */
    void sendEmailWithAttachment(String to, String subject, String template,
                                  Map<String, Object> variables, byte[] attachment,
                                  String attachmentFilename);
}
