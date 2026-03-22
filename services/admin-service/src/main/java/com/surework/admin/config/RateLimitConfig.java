package com.surework.admin.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiting configuration using Bucket4j.
 * Provides token bucket rate limiters for various endpoints.
 */
@Configuration
public class RateLimitConfig {

    /**
     * Cache of rate limit buckets per IP address for password reset.
     * Limits: 3 requests per hour per IP.
     */
    private final Map<String, Bucket> passwordResetBuckets = new ConcurrentHashMap<>();

    /**
     * Cache of rate limit buckets per IP address for login attempts.
     * Limits: 10 requests per minute per IP.
     */
    private final Map<String, Bucket> loginBuckets = new ConcurrentHashMap<>();

    /**
     * Get or create a rate limit bucket for password reset endpoint.
     * Limit: 3 requests per hour per IP address.
     */
    public Bucket getPasswordResetBucket(String ipAddress) {
        return passwordResetBuckets.computeIfAbsent(ipAddress, this::createPasswordResetBucket);
    }

    /**
     * Get or create a rate limit bucket for login endpoint.
     * Limit: 10 requests per minute per IP address.
     */
    public Bucket getLoginBucket(String ipAddress) {
        return loginBuckets.computeIfAbsent(ipAddress, this::createLoginBucket);
    }

    private Bucket createPasswordResetBucket(String key) {
        // 3 requests per hour - uses Bucket4j 8.x builder API
        Bandwidth limit = Bandwidth.builder()
                .capacity(3)
                .refillIntervally(3, Duration.ofHours(1))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    private Bucket createLoginBucket(String key) {
        // 10 requests per minute (for brute force protection)
        Bandwidth limit = Bandwidth.builder()
                .capacity(10)
                .refillIntervally(10, Duration.ofMinutes(1))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    /**
     * Clean up old buckets periodically to prevent memory leaks.
     * Call this method from a scheduled task.
     */
    public void cleanupOldBuckets() {
        // Simple cleanup - in production, use time-based eviction
        if (passwordResetBuckets.size() > 10000) {
            passwordResetBuckets.clear();
        }
        if (loginBuckets.size() > 10000) {
            loginBuckets.clear();
        }
    }
}
