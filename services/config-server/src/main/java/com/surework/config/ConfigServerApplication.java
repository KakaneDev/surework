package com.surework.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.config.server.EnableConfigServer;

/**
 * Spring Cloud Config Server for centralized configuration.
 * Implements Constitution Principle XIV: Observability (Centralized Config).
 *
 * Serves configuration for all SureWork microservices from:
 * - File-based configuration (native profile)
 * - Environment-specific overrides
 *
 * All services fetch their configuration from this server at startup.
 */
@SpringBootApplication
@EnableConfigServer
public class ConfigServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ConfigServerApplication.class, args);
    }
}
