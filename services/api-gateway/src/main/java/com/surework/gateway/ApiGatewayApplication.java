package com.surework.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * API Gateway Application for SureWork ERP.
 *
 * Provides:
 * - Request routing to microservices
 * - JWT Authentication
 * - Rate limiting
 * - Circuit breaker patterns
 * - Request/Response logging
 * - CORS configuration
 */
@SpringBootApplication
@EnableDiscoveryClient
public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
