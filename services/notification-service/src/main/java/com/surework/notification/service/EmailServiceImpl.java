package com.surework.notification.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Map;

/**
 * Implementation of EmailService using JavaMailSender and Thymeleaf templates.
 */
@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.mail.from:noreply@surework.co.za}")
    private String fromAddress;

    public EmailServiceImpl(JavaMailSender mailSender, TemplateEngine templateEngine) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
    }

    @Override
    public void sendOfferEmail(String to, Map<String, Object> variables) {
        sendTemplatedEmail(to, "Job Offer from SureWork", "email/offer-letter", variables);
    }

    @Override
    public void sendOfferAcceptedEmail(String to, Map<String, Object> variables) {
        sendTemplatedEmail(to, "Offer Acceptance Confirmed", "email/offer-accepted", variables);
    }

    @Override
    public void sendOfferDeclinedEmail(String to, Map<String, Object> variables) {
        sendTemplatedEmail(to, "Offer Response Received", "email/offer-accepted", variables);
    }

    @Override
    public void sendEmailWithAttachment(String to, String subject, String template,
                                         Map<String, Object> variables, byte[] attachment,
                                         String attachmentFilename) {
        try {
            Context context = new Context();
            context.setVariables(variables);
            String htmlContent = templateEngine.process(template, context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            helper.addAttachment(attachmentFilename, new ByteArrayResource(attachment), "application/pdf");

            mailSender.send(message);
            log.info("Email with attachment '{}' sent to {} with subject '{}'", attachmentFilename, to, subject);
        } catch (MessagingException e) {
            log.error("Failed to send email with attachment to {}: {}", to, e.getMessage(), e);
        }
    }

    private void sendTemplatedEmail(String to, String subject, String template, Map<String, Object> variables) {
        try {
            Context context = new Context();
            context.setVariables(variables);
            String htmlContent = templateEngine.process(template, context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Email sent to {} with subject '{}'", to, subject);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage(), e);
        }
    }
}
