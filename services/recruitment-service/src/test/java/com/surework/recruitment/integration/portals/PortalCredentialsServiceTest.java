package com.surework.recruitment.integration.portals;

import com.surework.recruitment.domain.JobPosting;
import com.surework.recruitment.domain.PlatformPortalCredentials;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for PortalCredentialsService.
 * These tests focus on encryption/decryption logic and domain model behavior
 * which can be tested without complex mocking.
 *
 * Integration tests requiring database and browser automation should use @SpringBootTest.
 */
@DisplayName("PortalCredentialsService Tests")
class PortalCredentialsServiceTest {

    @Nested
    @DisplayName("Encryption/Decryption Tests")
    class EncryptionDecryptionTests {

        @Test
        @DisplayName("Should encrypt and decrypt text successfully")
        void test_encryptDecrypt_success() {
            PortalCredentialsService service = createServiceForEncryptionTests();
            String plaintext = "test-password-123";

            String encrypted = service.encrypt(plaintext);
            String decrypted = service.decrypt(encrypted);

            assertThat(encrypted).isNotNull();
            assertThat(encrypted).isNotEqualTo(plaintext);
            assertThat(decrypted).isEqualTo(plaintext);
        }

        @Test
        @DisplayName("Should return null when encrypting null input")
        void test_encryptNull_returnsNull() {
            PortalCredentialsService service = createServiceForEncryptionTests();

            String result = service.encrypt(null);

            assertThat(result).isNull();
        }

        @Test
        @DisplayName("Should return null when encrypting empty input")
        void test_encryptEmpty_returnsNull() {
            PortalCredentialsService service = createServiceForEncryptionTests();

            String result = service.encrypt("");

            assertThat(result).isNull();
        }

        @Test
        @DisplayName("Should return null when decrypting null input")
        void test_decryptNull_returnsNull() {
            PortalCredentialsService service = createServiceForEncryptionTests();

            String result = service.decrypt(null);

            assertThat(result).isNull();
        }

        @Test
        @DisplayName("Should return null when decrypting empty input")
        void test_decryptEmpty_returnsNull() {
            PortalCredentialsService service = createServiceForEncryptionTests();

            String result = service.decrypt("");

            assertThat(result).isNull();
        }

        @Test
        @DisplayName("Should handle special characters in encryption")
        void test_encryptSpecialCharacters_success() {
            PortalCredentialsService service = createServiceForEncryptionTests();
            String plaintext = "p@$$w0rd!#$%^&*()_+-=[]{}|;':\",./<>?";

            String encrypted = service.encrypt(plaintext);
            String decrypted = service.decrypt(encrypted);

            assertThat(decrypted).isEqualTo(plaintext);
        }

        @Test
        @DisplayName("Should handle unicode characters in encryption")
        void test_encryptUnicode_success() {
            PortalCredentialsService service = createServiceForEncryptionTests();
            String plaintext = "密码测试 пароль τεστ パスワード";

            String encrypted = service.encrypt(plaintext);
            String decrypted = service.decrypt(encrypted);

            assertThat(decrypted).isEqualTo(plaintext);
        }

        @Test
        @DisplayName("Should produce different ciphertext for same plaintext (IV randomness)")
        void test_encryptSameText_producesDifferentCiphertext() {
            PortalCredentialsService service = createServiceForEncryptionTests();
            String plaintext = "same-password";

            String encrypted1 = service.encrypt(plaintext);
            String encrypted2 = service.encrypt(plaintext);

            // Due to random IV, same plaintext should produce different ciphertext
            assertThat(encrypted1).isNotEqualTo(encrypted2);
            // But both should decrypt to the same value
            assertThat(service.decrypt(encrypted1)).isEqualTo(plaintext);
            assertThat(service.decrypt(encrypted2)).isEqualTo(plaintext);
        }
    }

    @Nested
    @DisplayName("PortalCredentials Record Tests")
    class PortalCredentialsRecordTests {

        @Test
        @DisplayName("Should create PortalCredentials with all fields")
        void test_createPortalCredentials_withAllFields() {
            PortalCredentialsService.PortalCredentials creds =
                    new PortalCredentialsService.PortalCredentials(
                            "user@test.com",
                            "password123",
                            "{\"companyId\": 123}"
                    );

            assertThat(creds.username()).isEqualTo("user@test.com");
            assertThat(creds.password()).isEqualTo("password123");
            assertThat(creds.additionalConfig()).isEqualTo("{\"companyId\": 123}");
        }

        @Test
        @DisplayName("Should create PortalCredentials with null config")
        void test_createPortalCredentials_withNullConfig() {
            PortalCredentialsService.PortalCredentials creds =
                    new PortalCredentialsService.PortalCredentials(
                            "user@test.com",
                            "password123",
                            null
                    );

            assertThat(creds.username()).isEqualTo("user@test.com");
            assertThat(creds.password()).isEqualTo("password123");
            assertThat(creds.additionalConfig()).isNull();
        }
    }

    @Nested
    @DisplayName("CredentialValidationResult Tests")
    class CredentialValidationResultTests {

        @Test
        @DisplayName("Should create successful result")
        void test_successful_result() {
            PortalCredentialsService.CredentialValidationResult result =
                    PortalCredentialsService.CredentialValidationResult.successful();

            assertThat(result.isSuccess()).isTrue();
            assertThat(result.requiresAttention()).isFalse();
            assertThat(result.status()).isEqualTo(
                    PortalCredentialsService.CredentialValidationResult.ValidationStatus.SUCCESS);
        }

        @Test
        @DisplayName("Should create invalid credentials result")
        void test_invalidCredentials_result() {
            PortalCredentialsService.CredentialValidationResult result =
                    PortalCredentialsService.CredentialValidationResult.invalidCredentials("Wrong password");

            assertThat(result.isSuccess()).isFalse();
            assertThat(result.requiresAttention()).isTrue();
            assertThat(result.message()).isEqualTo("Wrong password");
            assertThat(result.status()).isEqualTo(
                    PortalCredentialsService.CredentialValidationResult.ValidationStatus.INVALID_CREDENTIALS);
        }

        @Test
        @DisplayName("Should create captcha required result")
        void test_captchaRequired_result() {
            PortalCredentialsService.CredentialValidationResult result =
                    PortalCredentialsService.CredentialValidationResult.captchaRequired("CAPTCHA detected");

            assertThat(result.isSuccess()).isFalse();
            assertThat(result.requiresAttention()).isTrue();
            assertThat(result.status()).isEqualTo(
                    PortalCredentialsService.CredentialValidationResult.ValidationStatus.CAPTCHA_REQUIRED);
        }

        @Test
        @DisplayName("Should create two factor required result")
        void test_twoFactorRequired_result() {
            PortalCredentialsService.CredentialValidationResult result =
                    PortalCredentialsService.CredentialValidationResult.twoFactorRequired("2FA required");

            assertThat(result.isSuccess()).isFalse();
            assertThat(result.requiresAttention()).isTrue();
            assertThat(result.status()).isEqualTo(
                    PortalCredentialsService.CredentialValidationResult.ValidationStatus.TWO_FACTOR_REQUIRED);
        }

        @Test
        @DisplayName("Should create timeout result")
        void test_timeout_result() {
            PortalCredentialsService.CredentialValidationResult result =
                    PortalCredentialsService.CredentialValidationResult.timeout("Connection timeout");

            assertThat(result.isSuccess()).isFalse();
            assertThat(result.requiresAttention()).isFalse(); // Timeout doesn't require attention
            assertThat(result.status()).isEqualTo(
                    PortalCredentialsService.CredentialValidationResult.ValidationStatus.TIMEOUT);
        }

        @Test
        @DisplayName("Should create error result")
        void test_error_result() {
            PortalCredentialsService.CredentialValidationResult result =
                    PortalCredentialsService.CredentialValidationResult.error("Unknown error");

            assertThat(result.isSuccess()).isFalse();
            assertThat(result.requiresAttention()).isFalse(); // Generic error doesn't require immediate attention
            assertThat(result.status()).isEqualTo(
                    PortalCredentialsService.CredentialValidationResult.ValidationStatus.ERROR);
        }
    }

    @Nested
    @DisplayName("PlatformPortalCredentials Domain Tests")
    class PlatformPortalCredentialsDomainTests {

        @Test
        @DisplayName("Should create credentials for portal")
        void test_createCredentials_forPortal() {
            PlatformPortalCredentials creds = PlatformPortalCredentials.create(JobPosting.JobPortal.PNET);

            assertThat(creds.getPortal()).isEqualTo(JobPosting.JobPortal.PNET);
            assertThat(creds.isActive()).isFalse();
            assertThat(creds.getConnectionStatus()).isEqualTo(PlatformPortalCredentials.ConnectionStatus.NOT_CONFIGURED);
            assertThat(creds.getDailyRateLimit()).isEqualTo(50); // PNET default
        }

        @Test
        @DisplayName("Should have correct default rate limits per portal")
        void test_defaultRateLimits_perPortal() {
            PlatformPortalCredentials pnet = PlatformPortalCredentials.create(JobPosting.JobPortal.PNET);
            PlatformPortalCredentials linkedin = PlatformPortalCredentials.create(JobPosting.JobPortal.LINKEDIN);
            PlatformPortalCredentials indeed = PlatformPortalCredentials.create(JobPosting.JobPortal.INDEED);
            PlatformPortalCredentials careers24 = PlatformPortalCredentials.create(JobPosting.JobPortal.CAREERS24);

            assertThat(pnet.getDailyRateLimit()).isEqualTo(50);
            assertThat(linkedin.getDailyRateLimit()).isEqualTo(25); // LinkedIn is more restrictive
            assertThat(indeed.getDailyRateLimit()).isEqualTo(40);
            assertThat(careers24.getDailyRateLimit()).isEqualTo(50);
        }

        @Test
        @DisplayName("Should report not configured when credentials missing")
        void test_isConfigured_returnsFalse_whenMissing() {
            PlatformPortalCredentials creds = PlatformPortalCredentials.create(JobPosting.JobPortal.PNET);

            assertThat(creds.isConfigured()).isFalse();
        }

        @Test
        @DisplayName("Should report configured when credentials present")
        void test_isConfigured_returnsTrue_whenPresent() {
            PlatformPortalCredentials creds = PlatformPortalCredentials.create(JobPosting.JobPortal.PNET);
            creds.setUsernameEncrypted("encrypted-user");
            creds.setPasswordEncrypted("encrypted-pass");

            assertThat(creds.isConfigured()).isTrue();
        }

        @Test
        @DisplayName("Should not allow posting when inactive")
        void test_canPost_returnsFalse_whenInactive() {
            PlatformPortalCredentials creds = createConfiguredCredentials(JobPosting.JobPortal.PNET);
            creds.setActive(false);

            assertThat(creds.canPost()).isFalse();
        }

        @Test
        @DisplayName("Should not allow posting when invalid credentials")
        void test_canPost_returnsFalse_whenInvalidCredentials() {
            PlatformPortalCredentials creds = createConfiguredCredentials(JobPosting.JobPortal.PNET);
            creds.setConnectionStatus(PlatformPortalCredentials.ConnectionStatus.INVALID_CREDENTIALS);

            assertThat(creds.canPost()).isFalse();
        }

        @Test
        @DisplayName("Should not allow posting when rate limited")
        void test_canPost_returnsFalse_whenRateLimited() {
            PlatformPortalCredentials creds = createConfiguredCredentials(JobPosting.JobPortal.PNET);
            creds.setConnectionStatus(PlatformPortalCredentials.ConnectionStatus.RATE_LIMITED);

            assertThat(creds.canPost()).isFalse();
        }

        @Test
        @DisplayName("Should not allow posting when CAPTCHA required")
        void test_canPost_returnsFalse_whenCaptchaRequired() {
            PlatformPortalCredentials creds = createConfiguredCredentials(JobPosting.JobPortal.LINKEDIN);
            creds.setConnectionStatus(PlatformPortalCredentials.ConnectionStatus.CAPTCHA_REQUIRED);

            assertThat(creds.canPost()).isFalse();
        }

        @Test
        @DisplayName("Should allow posting when connected and under rate limit")
        void test_canPost_returnsTrue_whenConnectedAndUnderLimit() {
            PlatformPortalCredentials creds = createConfiguredCredentials(JobPosting.JobPortal.PNET);
            creds.setPostsToday(10);
            creds.setRateLimitResetAt(LocalDateTime.now().plusHours(1));

            assertThat(creds.canPost()).isTrue();
        }

        @Test
        @DisplayName("Should not allow posting when at rate limit")
        void test_canPost_returnsFalse_whenAtRateLimit() {
            PlatformPortalCredentials creds = createConfiguredCredentials(JobPosting.JobPortal.PNET);
            creds.setPostsToday(50);
            creds.setDailyRateLimit(50);
            creds.setRateLimitResetAt(LocalDateTime.now().plusHours(1));

            assertThat(creds.canPost()).isFalse();
        }

        @Test
        @DisplayName("Should increment post count")
        void test_incrementPostCount() {
            PlatformPortalCredentials creds = createConfiguredCredentials(JobPosting.JobPortal.PNET);
            int initialCount = creds.getPostsToday();

            creds.incrementPostCount();

            assertThat(creds.getPostsToday()).isEqualTo(initialCount + 1);
        }

        @Test
        @DisplayName("Should mark as verified")
        void test_markAsVerified() {
            PlatformPortalCredentials creds = createConfiguredCredentials(JobPosting.JobPortal.PNET);
            creds.setConnectionStatus(PlatformPortalCredentials.ConnectionStatus.ERROR);
            creds.setLastError("Previous error");

            creds.markAsVerified();

            assertThat(creds.getConnectionStatus()).isEqualTo(PlatformPortalCredentials.ConnectionStatus.CONNECTED);
            assertThat(creds.getLastVerifiedAt()).isNotNull();
            assertThat(creds.getLastError()).isNull();
        }

        @Test
        @DisplayName("Should mark verification failed")
        void test_markVerificationFailed() {
            PlatformPortalCredentials creds = createConfiguredCredentials(JobPosting.JobPortal.LINKEDIN);

            creds.markVerificationFailed("Login failed", PlatformPortalCredentials.ConnectionStatus.INVALID_CREDENTIALS);

            assertThat(creds.getConnectionStatus()).isEqualTo(PlatformPortalCredentials.ConnectionStatus.INVALID_CREDENTIALS);
            assertThat(creds.getLastError()).isEqualTo("Login failed");
        }

        @Test
        @DisplayName("Should reset rate limit")
        void test_resetRateLimit() {
            PlatformPortalCredentials creds = createConfiguredCredentials(JobPosting.JobPortal.PNET);
            creds.setPostsToday(45);
            creds.setConnectionStatus(PlatformPortalCredentials.ConnectionStatus.RATE_LIMITED);

            creds.resetRateLimit();

            assertThat(creds.getPostsToday()).isEqualTo(0);
            assertThat(creds.getRateLimitResetAt()).isNotNull();
            assertThat(creds.getConnectionStatus()).isEqualTo(PlatformPortalCredentials.ConnectionStatus.CONNECTED);
        }

        @Test
        @DisplayName("Should calculate remaining posts correctly")
        void test_getRemainingPosts() {
            PlatformPortalCredentials creds = createConfiguredCredentials(JobPosting.JobPortal.PNET);
            creds.setDailyRateLimit(50);
            creds.setPostsToday(15);

            assertThat(creds.getRemainingPosts()).isEqualTo(35);
        }

        @Test
        @DisplayName("Should return zero remaining posts when inactive")
        void test_getRemainingPosts_zeroWhenInactive() {
            PlatformPortalCredentials creds = createConfiguredCredentials(JobPosting.JobPortal.PNET);
            creds.setActive(false);
            creds.setDailyRateLimit(50);
            creds.setPostsToday(0);

            assertThat(creds.getRemainingPosts()).isEqualTo(0);
        }
    }

    /**
     * Creates a PortalCredentialsService for testing encryption only.
     * The service uses a development encryption key.
     */
    private PortalCredentialsService createServiceForEncryptionTests() {
        // Pass nulls for dependencies we won't use in encryption tests
        return new PortalCredentialsService(null, null, null);
    }

    private PlatformPortalCredentials createConfiguredCredentials(JobPosting.JobPortal portal) {
        PlatformPortalCredentials creds = PlatformPortalCredentials.create(portal);
        creds.setId(UUID.randomUUID());
        creds.setActive(true);
        creds.setConnectionStatus(PlatformPortalCredentials.ConnectionStatus.CONNECTED);
        creds.setUsernameEncrypted("encrypted-user");
        creds.setPasswordEncrypted("encrypted-pass");
        return creds;
    }
}
