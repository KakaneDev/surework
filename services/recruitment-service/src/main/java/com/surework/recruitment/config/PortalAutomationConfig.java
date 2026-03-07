package com.surework.recruitment.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Configuration for portal automation features.
 * Enables async processing and scheduled tasks for job distribution.
 */
@Configuration
@EnableAsync
@EnableScheduling
public class PortalAutomationConfig {

    // Configuration is handled via application.yml:
    // portal.automation.headless: true/false
    // portal.automation.slow-mo: 100 (ms between actions)
    // portal.automation.screenshots-dir: ./screenshots
    // portal.automation.user-data-dir: ./browser-data

    /**
     * RestTemplate for inter-service communication.
     * Used by ResumeStorageService for document service calls.
     */
    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .connectTimeout(Duration.ofSeconds(5))
                .readTimeout(Duration.ofSeconds(30))
                .build();
    }
}
