package com.surework.notification.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Map;

/**
 * Implementation of EmailService using JavaMail and Thymeleaf templates.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${surework.notification.email.from}")
    private String fromAddress;

    @Value("${surework.notification.email.from-name}")
    private String fromName;

    @Override
    @Async
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 5000))
    public void sendEmail(String to, String subject, String body) {
        log.info("Sending simple email to {} with subject: {}", to, subject);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromName + " <" + fromAddress + ">");
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);
            log.info("Simple email sent successfully to {}", to);

        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    @Override
    @Async
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 5000))
    public void sendTemplatedEmail(String to, String subject, String templateId, Map<String, String> variables) {
        log.info("Sending templated email to {} with template: {}", to, templateId);

        try {
            // Process template
            Context context = new Context();
            variables.forEach(context::setVariable);
            String htmlContent = templateEngine.process(templateId, context);

            // Create MIME message
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromName + " <" + fromAddress + ">");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            log.info("Templated email sent successfully to {} using template {}", to, templateId);

        } catch (MessagingException e) {
            log.error("Failed to send templated email to {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Failed to send templated email", e);
        }
    }

    @Override
    @Async
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 5000))
    public void sendEmailWithAttachment(String to, String subject, String body, byte[] attachment, String attachmentName) {
        log.info("Sending email with attachment to {} with subject: {}", to, subject);

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromName + " <" + fromAddress + ">");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);
            helper.addAttachment(attachmentName, new ByteArrayResource(attachment));

            mailSender.send(mimeMessage);
            log.info("Email with attachment sent successfully to {}", to);

        } catch (MessagingException e) {
            log.error("Failed to send email with attachment to {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Failed to send email with attachment", e);
        }
    }
}
