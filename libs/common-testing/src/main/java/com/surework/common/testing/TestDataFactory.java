package com.surework.common.testing;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Factory for creating test data with unique values.
 * Provides builders for common test entities and values.
 */
public final class TestDataFactory {

    private static final AtomicInteger counter = new AtomicInteger(0);

    private TestDataFactory() {
        // Prevent instantiation
    }

    /**
     * Generate a unique integer for test data.
     */
    public static int uniqueInt() {
        return counter.incrementAndGet();
    }

    /**
     * Generate a unique email address.
     */
    public static String uniqueEmail() {
        return "test" + uniqueInt() + "@example.com";
    }

    /**
     * Generate a unique employee number.
     */
    public static String uniqueEmployeeNumber() {
        return "EMP" + String.format("%06d", uniqueInt());
    }

    /**
     * Generate a unique South African ID number (for testing only).
     * Format: YYMMDDGSSSCAZ
     */
    public static String uniqueSaIdNumber() {
        int num = uniqueInt();
        // Generate a valid-looking ID: 9001015009087
        return String.format("90010%02d5%03d087", (num % 31) + 1, num % 1000);
    }

    /**
     * Generate a unique phone number.
     */
    public static String uniquePhoneNumber() {
        return "+2782" + String.format("%07d", uniqueInt() % 10000000);
    }

    /**
     * Generate a random UUID.
     */
    public static UUID randomUuid() {
        return UUID.randomUUID();
    }

    /**
     * Generate a tenant ID for testing.
     */
    public static UUID testTenantId() {
        return UUID.fromString("00000000-0000-0000-0000-000000000001");
    }

    /**
     * Generate a user ID for testing.
     */
    public static UUID testUserId() {
        return UUID.fromString("00000000-0000-0000-0000-000000000002");
    }

    /**
     * Generate a random salary within typical South African ranges.
     */
    public static BigDecimal randomSalary() {
        // Range: R10,000 - R100,000
        return BigDecimal.valueOf(10000 + (Math.random() * 90000))
                .setScale(2, java.math.RoundingMode.HALF_UP);
    }

    /**
     * Generate a date of birth for an adult.
     */
    public static LocalDate adultDateOfBirth() {
        return LocalDate.now().minusYears(25 + (uniqueInt() % 30));
    }

    /**
     * Get current timestamp.
     */
    public static Instant now() {
        return Instant.now();
    }

    /**
     * Generate a unique company name.
     */
    public static String uniqueCompanyName() {
        return "Test Company " + uniqueInt() + " (Pty) Ltd";
    }

    /**
     * Generate a unique department name.
     */
    public static String uniqueDepartmentName() {
        String[] prefixes = {"Engineering", "Sales", "Marketing", "Operations", "Finance"};
        return prefixes[uniqueInt() % prefixes.length] + " " + uniqueInt();
    }
}
