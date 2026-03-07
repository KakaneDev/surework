package com.surework.common.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for TenantAssertions.
 */
public class TenantAssertionsTest {

    private static final UUID TENANT_A = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID TENANT_B = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @BeforeEach
    void setUp() {
        TenantContext.clear();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Nested
    @DisplayName("requireTenantId tests")
    class RequireTenantIdTests {

        @Test
        @DisplayName("Should return tenant ID when context is set")
        void shouldReturnTenantId_WhenContextIsSet() {
            TenantContext.setTenantId(TENANT_A);

            UUID result = TenantAssertions.requireTenantId();

            assertThat(result).isEqualTo(TENANT_A);
        }

        @Test
        @DisplayName("Should throw when context is not set")
        void shouldThrow_WhenContextNotSet() {
            assertThatThrownBy(TenantAssertions::requireTenantId)
                    .isInstanceOf(TenantNotSetException.class);
        }
    }

    @Nested
    @DisplayName("assertTenantMatches tests")
    class AssertTenantMatchesTests {

        @Test
        @DisplayName("Should pass when tenant IDs match")
        void shouldPass_WhenTenantIdsMatch() {
            TenantContext.setTenantId(TENANT_A);

            // Should not throw
            TenantAssertions.assertTenantMatches(TENANT_A);
        }

        @Test
        @DisplayName("Should throw when tenant IDs don't match")
        void shouldThrow_WhenTenantIdsDontMatch() {
            TenantContext.setTenantId(TENANT_A);

            assertThatThrownBy(() -> TenantAssertions.assertTenantMatches(TENANT_B))
                    .isInstanceOf(TenantAssertions.CrossTenantAccessException.class)
                    .hasMessageContaining("mismatch");
        }

        @Test
        @DisplayName("Should throw when context is not set")
        void shouldThrow_WhenContextNotSet() {
            assertThatThrownBy(() -> TenantAssertions.assertTenantMatches(TENANT_A))
                    .isInstanceOf(TenantNotSetException.class);
        }
    }

    @Nested
    @DisplayName("assertBelongsToTenant tests")
    class AssertBelongsToTenantTests {

        @Test
        @DisplayName("Should pass when entity belongs to expected tenant")
        void shouldPass_WhenEntityBelongsToTenant() {
            // Should not throw
            TenantAssertions.assertBelongsToTenant(TENANT_A, TENANT_A);
        }

        @Test
        @DisplayName("Should throw when entity belongs to different tenant")
        void shouldThrow_WhenEntityBelongsToDifferentTenant() {
            assertThatThrownBy(() -> TenantAssertions.assertBelongsToTenant(TENANT_B, TENANT_A))
                    .isInstanceOf(TenantAssertions.CrossTenantAccessException.class)
                    .hasMessageContaining("Cross-tenant access");
        }

        @Test
        @DisplayName("Should throw when entity has null tenant ID")
        void shouldThrow_WhenEntityHasNullTenantId() {
            assertThatThrownBy(() -> TenantAssertions.assertBelongsToTenant(null, TENANT_A))
                    .isInstanceOf(TenantAssertions.CrossTenantAccessException.class)
                    .hasMessageContaining("no tenant ID");
        }
    }

    @Nested
    @DisplayName("assertBelongsToCurrentTenant tests")
    class AssertBelongsToCurrentTenantTests {

        @Test
        @DisplayName("Should pass when entity belongs to current tenant")
        void shouldPass_WhenEntityBelongsToCurrentTenant() {
            TenantContext.setTenantId(TENANT_A);

            // Should not throw
            TenantAssertions.assertBelongsToCurrentTenant(TENANT_A);
        }

        @Test
        @DisplayName("Should throw when entity belongs to different tenant")
        void shouldThrow_WhenEntityBelongsToDifferentTenant() {
            TenantContext.setTenantId(TENANT_A);

            assertThatThrownBy(() -> TenantAssertions.assertBelongsToCurrentTenant(TENANT_B))
                    .isInstanceOf(TenantAssertions.CrossTenantAccessException.class);
        }

        @Test
        @DisplayName("Should throw when context is not set")
        void shouldThrow_WhenContextNotSet() {
            assertThatThrownBy(() -> TenantAssertions.assertBelongsToCurrentTenant(TENANT_A))
                    .isInstanceOf(TenantNotSetException.class);
        }
    }

    @Nested
    @DisplayName("requireAndValidateTenant tests")
    class RequireAndValidateTenantTests {

        @Test
        @DisplayName("Should return context tenant when provided is null")
        void shouldReturnContextTenant_WhenProvidedIsNull() {
            TenantContext.setTenantId(TENANT_A);

            UUID result = TenantAssertions.requireAndValidateTenant(null);

            assertThat(result).isEqualTo(TENANT_A);
        }

        @Test
        @DisplayName("Should return tenant when provided matches context")
        void shouldReturnTenant_WhenProvidedMatchesContext() {
            TenantContext.setTenantId(TENANT_A);

            UUID result = TenantAssertions.requireAndValidateTenant(TENANT_A);

            assertThat(result).isEqualTo(TENANT_A);
        }

        @Test
        @DisplayName("Should throw when provided doesn't match context")
        void shouldThrow_WhenProvidedDoesntMatchContext() {
            TenantContext.setTenantId(TENANT_A);

            assertThatThrownBy(() -> TenantAssertions.requireAndValidateTenant(TENANT_B))
                    .isInstanceOf(TenantAssertions.CrossTenantAccessException.class);
        }

        @Test
        @DisplayName("Should throw when context is not set")
        void shouldThrow_WhenContextNotSet() {
            assertThatThrownBy(() -> TenantAssertions.requireAndValidateTenant(null))
                    .isInstanceOf(TenantNotSetException.class);
        }
    }

    @Test
    @DisplayName("CrossTenantAccessException should have correct error code")
    void crossTenantException_ShouldHaveCorrectErrorCode() {
        TenantAssertions.CrossTenantAccessException ex =
                new TenantAssertions.CrossTenantAccessException("test");

        assertThat(ex.getErrorCode()).isEqualTo(TenantSecurityConstants.ERROR_CROSS_TENANT_ACCESS);
    }
}
