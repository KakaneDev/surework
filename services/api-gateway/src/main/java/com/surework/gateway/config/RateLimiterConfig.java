package com.surework.gateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Mono;

/**
 * Rate limiter configuration for API Gateway.
 * Uses Redis-based rate limiting with configurable key resolution.
 */
@Configuration
public class RateLimiterConfig {

    /**
     * Key resolver based on user ID from JWT token.
     * Falls back to IP address for unauthenticated requests.
     */
    @Bean
    public KeyResolver userKeyResolver() {
        return exchange -> {
            // Try to get user ID from JWT-forwarded header
            String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");
            if (userId != null && !userId.isEmpty()) {
                return Mono.just("user:" + userId);
            }

            // Fall back to IP address
            String ip = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
            if (ip == null || ip.isEmpty()) {
                ip = exchange.getRequest().getHeaders().getFirst("X-Real-IP");
            }
            if (ip == null || ip.isEmpty() && exchange.getRequest().getRemoteAddress() != null) {
                ip = exchange.getRequest().getRemoteAddress().getAddress().getHostAddress();
            }
            if (ip == null) {
                ip = "unknown";
            }

            return Mono.just("ip:" + ip.split(",")[0].trim());
        };
    }
}
