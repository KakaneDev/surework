package com.surework.reporting.config;

import feign.Logger;
import feign.codec.ErrorDecoder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Feign client configuration for service-to-service communication.
 */
@Configuration
public class FeignConfig {

    /**
     * Enable detailed Feign logging in development.
     */
    @Bean
    public Logger.Level feignLoggerLevel() {
        return Logger.Level.BASIC;
    }

    /**
     * Custom error decoder for better error handling.
     */
    @Bean
    public ErrorDecoder errorDecoder() {
        return new FeignErrorDecoder();
    }

    /**
     * Custom error decoder that provides meaningful error messages.
     */
    public static class FeignErrorDecoder implements ErrorDecoder {
        private final ErrorDecoder defaultDecoder = new Default();

        @Override
        public Exception decode(String methodKey, feign.Response response) {
            String message = String.format("Service call failed: %s - Status: %d",
                    methodKey, response.status());

            return switch (response.status()) {
                case 404 -> new ServiceNotFoundException(message);
                case 503 -> new ServiceUnavailableException(message);
                default -> defaultDecoder.decode(methodKey, response);
            };
        }
    }

    /**
     * Exception for when a requested resource is not found in a downstream service.
     */
    public static class ServiceNotFoundException extends RuntimeException {
        public ServiceNotFoundException(String message) {
            super(message);
        }
    }

    /**
     * Exception for when a downstream service is unavailable.
     */
    public static class ServiceUnavailableException extends RuntimeException {
        public ServiceUnavailableException(String message) {
            super(message);
        }
    }
}
