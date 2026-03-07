package com.surework.tenant.util;

/**
 * Utility class for masking Personally Identifiable Information (PII) in logs.
 *
 * <p>Implements POPIA (Protection of Personal Information Act) and GDPR
 * compliance requirements for data protection in application logs.
 *
 * <p>All sensitive data must be masked before logging to prevent:
 * - Data breaches through log file exposure
 * - Compliance violations
 * - Privacy concerns
 */
public final class PiiMasker {

    private PiiMasker() {
        // Utility class - prevent instantiation
    }

    /**
     * Masks an email address for logging.
     * Example: john.doe@example.com -> j***@e***.com
     *
     * @param email the email address to mask
     * @return masked email address
     */
    public static String maskEmail(String email) {
        if (email == null || email.isEmpty()) {
            return "****";
        }

        int atIndex = email.indexOf('@');
        if (atIndex <= 0) {
            return "****";
        }

        String localPart = email.substring(0, atIndex);
        String domainPart = email.substring(atIndex + 1);

        String maskedLocal = localPart.charAt(0) + "***";
        String maskedDomain = maskDomain(domainPart);

        return maskedLocal + "@" + maskedDomain;
    }

    /**
     * Masks a phone number for logging.
     * Example: +27821234567 -> +27***4567
     *
     * @param phone the phone number to mask
     * @return masked phone number
     */
    public static String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) {
            return "****";
        }

        // Keep first 3 chars (usually country code) and last 4 digits
        int length = phone.length();
        String prefix = phone.substring(0, Math.min(3, length));
        String suffix = phone.substring(Math.max(0, length - 4));

        int middleLength = Math.max(0, length - 7);
        String masked = "*".repeat(middleLength);

        return prefix + masked + suffix;
    }

    /**
     * Masks a company registration number for logging.
     * Example: "2024/123456/07" becomes "2024/[masked]/07"
     *
     * @param regNumber the registration number to mask
     * @return masked registration number
     */
    public static String maskRegistrationNumber(String regNumber) {
        if (regNumber == null || regNumber.isEmpty()) {
            return "****";
        }

        // CIPC format: YYYY/NNNNNN/NN
        String[] parts = regNumber.split("/");
        if (parts.length == 3) {
            return parts[0] + "/******/" + parts[2];
        }

        // Generic masking for other formats
        if (regNumber.length() > 6) {
            return regNumber.substring(0, 3) + "***" + regNumber.substring(regNumber.length() - 3);
        }

        return "****";
    }

    /**
     * Masks a tax number for logging.
     * Example: 1234567890 -> ***7890
     *
     * @param taxNumber the tax number to mask
     * @return masked tax number
     */
    public static String maskTaxNumber(String taxNumber) {
        if (taxNumber == null || taxNumber.length() < 4) {
            return "****";
        }

        return "***" + taxNumber.substring(taxNumber.length() - 4);
    }

    /**
     * Masks a company name for logging.
     * Shows first word only for identification.
     * Example: "Acme Corporation Ltd" -> "Acme ***"
     *
     * @param companyName the company name to mask
     * @return masked company name
     */
    public static String maskCompanyName(String companyName) {
        if (companyName == null || companyName.isEmpty()) {
            return "****";
        }

        String[] words = companyName.split("\\s+");
        if (words.length > 1) {
            return words[0] + " ***";
        }

        if (companyName.length() > 3) {
            return companyName.substring(0, 3) + "***";
        }

        return "****";
    }

    /**
     * Masks any sensitive ID for logging.
     * Shows only first and last 2 characters.
     *
     * @param id the ID to mask
     * @return masked ID
     */
    public static String maskId(String id) {
        if (id == null || id.length() < 8) {
            return "****";
        }

        return id.substring(0, 2) + "***" + id.substring(id.length() - 2);
    }

    private static String maskDomain(String domain) {
        int dotIndex = domain.lastIndexOf('.');
        if (dotIndex <= 0) {
            return "***";
        }

        String name = domain.substring(0, dotIndex);
        String tld = domain.substring(dotIndex);

        if (name.length() > 1) {
            return name.charAt(0) + "***" + tld;
        }

        return "***" + tld;
    }
}
