package com.surework.tenant.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiting configuration using Bucket4j.
 * Implements token bucket algorithm for API protection.
 *
 * <p>Rate limits are applied per IP address to prevent:
 * - Brute force attacks on signup
 * - Email enumeration attacks
 * - Denial of service attacks
 */
@Configuration
@Component
public class RateLimitConfig {

    /**
     * Cache of rate limit buckets per IP address.
     * Uses ConcurrentHashMap for thread-safety.
     */
    private final Map<String, Bucket> signupBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> availabilityBuckets = new ConcurrentHashMap<>();

    @Value("${surework.rate-limit.signup.requests-per-minute:5}")
    private int signupRequestsPerMinute;

    @Value("${surework.rate-limit.signup.requests-per-hour:20}")
    private int signupRequestsPerHour;

    @Value("${surework.rate-limit.availability.requests-per-minute:30}")
    private int availabilityRequestsPerMinute;

    /**
     * Gets or creates a rate limit bucket for signup requests.
     * Allows 5 requests per minute and 20 per hour per IP.
     *
     * @param ipAddress the client IP address
     * @return the rate limit bucket
     */
    public Bucket getSignupBucket(String ipAddress) {
        return signupBuckets.computeIfAbsent(ipAddress, this::createSignupBucket);
    }

    /**
     * Gets or creates a rate limit bucket for availability checks.
     * More permissive than signup to allow real-time validation.
     *
     * @param ipAddress the client IP address
     * @return the rate limit bucket
     */
    public Bucket getAvailabilityBucket(String ipAddress) {
        return availabilityBuckets.computeIfAbsent(ipAddress, this::createAvailabilityBucket);
    }

    /**
     * Creates a bucket for signup requests with dual rate limits:
     * - Short-term: 5 requests per minute (prevents rapid-fire attacks)
     * - Long-term: 20 requests per hour (prevents sustained attacks)
     */
    private Bucket createSignupBucket(String key) {
        return Bucket.builder()
                .addLimit(Bandwidth.classic(signupRequestsPerMinute,
                        Refill.intervally(signupRequestsPerMinute, Duration.ofMinutes(1))))
                .addLimit(Bandwidth.classic(signupRequestsPerHour,
                        Refill.intervally(signupRequestsPerHour, Duration.ofHours(1))))
                .build();
    }

    /**
     * Creates a bucket for availability check requests.
     * More permissive to allow form validation UX.
     */
    private Bucket createAvailabilityBucket(String key) {
        return Bucket.builder()
                .addLimit(Bandwidth.classic(availabilityRequestsPerMinute,
                        Refill.intervally(availabilityRequestsPerMinute, Duration.ofMinutes(1))))
                .build();
    }

    /**
     * Clears expired buckets to prevent memory leaks.
     * Should be called periodically via scheduled task.
     */
    public void clearExpiredBuckets() {
        // In production, implement bucket expiration based on last access time
        // For now, buckets persist until JVM restart
    }
}
