package com.surework.gateway.filter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Global filter for rate limiting.
 * Implements token bucket algorithm per tenant/IP.
 * Implements Constitution Principle V: Security (Rate Limiting).
 */
@Component
@Slf4j
public class RateLimitingFilter implements GlobalFilter, Ordered {

    @Value("${surework.gateway.rate-limit.requests-per-second:100}")
    private int requestsPerSecond;

    @Value("${surework.gateway.rate-limit.burst-capacity:200}")
    private int burstCapacity;

    @Value("${surework.gateway.rate-limit.enabled:true}")
    private boolean enabled;

    // In production, use Redis for distributed rate limiting
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        if (!enabled) {
            return chain.filter(exchange);
        }

        String key = resolveKey(exchange);
        Bucket bucket = buckets.computeIfAbsent(key, this::createBucket);

        if (bucket.tryConsume(1)) {
            return chain.filter(exchange);
        }

        log.warn("Rate limit exceeded for key: {}", key);
        exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
        exchange.getResponse().getHeaders().add("X-RateLimit-Retry-After", "1");
        return exchange.getResponse().setComplete();
    }

    @Override
    public int getOrder() {
        // Run after authentication filter
        return -90;
    }

    private String resolveKey(ServerWebExchange exchange) {
        // Use tenant ID if available, otherwise use IP
        String tenantId = exchange.getRequest().getHeaders().getFirst("X-Tenant-Id");
        if (tenantId != null) {
            return "tenant:" + tenantId;
        }

        // Fall back to IP-based rate limiting
        if (exchange.getRequest().getRemoteAddress() != null) {
            return "ip:" + exchange.getRequest().getRemoteAddress().getAddress().getHostAddress();
        }

        return "unknown";
    }

    private Bucket createBucket(String key) {
        Bandwidth limit = Bandwidth.classic(
                burstCapacity,
                Refill.greedy(requestsPerSecond, Duration.ofSeconds(1))
        );
        return Bucket.builder().addLimit(limit).build();
    }
}
