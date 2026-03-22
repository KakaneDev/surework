package com.surework.common.security.cache;

import com.surework.common.security.TenantContext;
import com.surework.common.security.TenantNotSetException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for TenantAwareCacheKeyGenerator.
 *
 * These tests verify that:
 * 1. Cache keys are properly prefixed with tenant ID
 * 2. Keys are unique per tenant
 * 3. Keys without tenant context throw exception (fail-closed)
 */
public class TenantAwareCacheKeyGeneratorTest {

    private TenantAwareCacheKeyGenerator keyGenerator;

    private static final UUID TENANT_A = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID TENANT_B = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @BeforeEach
    void setUp() {
        keyGenerator = new TenantAwareCacheKeyGenerator();
        TenantContext.clear();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Generated key should include tenant ID prefix")
    void generatedKey_ShouldIncludeTenantIdPrefix() throws Exception {
        TenantContext.setTenantId(TENANT_A);

        Method method = TestService.class.getMethod("findById", UUID.class);
        Object key = keyGenerator.generate(new TestService(), method, UUID.randomUUID());

        assertThat(key.toString()).startsWith(TENANT_A.toString() + ":");
    }

    @Test
    @DisplayName("Same parameters with different tenants should generate different keys")
    void sameParams_DifferentTenants_ShouldGenerateDifferentKeys() throws Exception {
        UUID entityId = UUID.randomUUID();
        Method method = TestService.class.getMethod("findById", UUID.class);
        TestService target = new TestService();

        // Key for Tenant A
        TenantContext.setTenantId(TENANT_A);
        Object keyA = keyGenerator.generate(target, method, entityId);

        // Key for Tenant B
        TenantContext.setTenantId(TENANT_B);
        Object keyB = keyGenerator.generate(target, method, entityId);

        assertThat(keyA).isNotEqualTo(keyB);
        assertThat(keyA.toString()).startsWith(TENANT_A.toString());
        assertThat(keyB.toString()).startsWith(TENANT_B.toString());
    }

    @Test
    @DisplayName("Key generation should throw TenantNotSetException when context is not set (fail-closed)")
    void keyGeneration_ShouldThrow_WhenContextNotSet() throws Exception {
        // No tenant context set

        Method method = TestService.class.getMethod("findById", UUID.class);

        assertThatThrownBy(() -> keyGenerator.generate(new TestService(), method, UUID.randomUUID()))
                .isInstanceOf(TenantNotSetException.class);
    }

    @Test
    @DisplayName("Generated key should include method name")
    void generatedKey_ShouldIncludeMethodName() throws Exception {
        TenantContext.setTenantId(TENANT_A);

        Method method = TestService.class.getMethod("findById", UUID.class);
        Object key = keyGenerator.generate(new TestService(), method, UUID.randomUUID());

        assertThat(key.toString()).contains("findById");
    }

    @Test
    @DisplayName("Generated key should include class name")
    void generatedKey_ShouldIncludeClassName() throws Exception {
        TenantContext.setTenantId(TENANT_A);

        Method method = TestService.class.getMethod("findById", UUID.class);
        Object key = keyGenerator.generate(new TestService(), method, UUID.randomUUID());

        assertThat(key.toString()).contains("TestService");
    }

    @Test
    @DisplayName("Static tenantPrefixedKey should include tenant ID")
    void staticTenantPrefixedKey_ShouldIncludeTenantId() {
        TenantContext.setTenantId(TENANT_A);

        String key = TenantAwareCacheKeyGenerator.tenantPrefixedKey("employee:123");

        assertThat(key).isEqualTo(TENANT_A + ":employee:123");
    }

    @Test
    @DisplayName("Static tenantPrefixedKey should throw when context is not set (fail-closed)")
    void staticTenantPrefixedKey_ShouldThrow_WhenContextNotSet() {
        // No tenant context set

        assertThatThrownBy(() -> TenantAwareCacheKeyGenerator.tenantPrefixedKey("employee:123"))
                .isInstanceOf(TenantNotSetException.class);
    }

    @Test
    @DisplayName("Static tenantPrefixedKey with explicit tenant should use provided tenant")
    void staticTenantPrefixedKey_WithExplicitTenant_ShouldUseProvidedTenant() {
        String key = TenantAwareCacheKeyGenerator.tenantPrefixedKey(TENANT_B, "employee:456");

        assertThat(key).isEqualTo(TENANT_B + ":employee:456");
    }

    @Test
    @DisplayName("Static tenantPrefixedKey with explicit tenant should throw when tenant is null")
    void staticTenantPrefixedKey_WithNullTenant_ShouldThrow() {
        assertThatThrownBy(() -> TenantAwareCacheKeyGenerator.tenantPrefixedKey(null, "employee:456"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cannot be null");
    }

    @Test
    @DisplayName("Generated key should handle enum parameters")
    void generatedKey_ShouldHandleEnumParams() throws Exception {
        TenantContext.setTenantId(TENANT_A);

        Method method = TestService.class.getMethod("findByStatus", TestStatus.class);
        Object key = keyGenerator.generate(new TestService(), method, TestStatus.ACTIVE);

        assertThat(key.toString()).contains("ACTIVE");
    }

    /**
     * Test service class for generating method references.
     */
    static class TestService {
        public Object findById(UUID id) {
            return null;
        }

        public Object findAll() {
            return null;
        }

        public Object findByStatus(TestStatus status) {
            return null;
        }
    }

    enum TestStatus {
        ACTIVE, INACTIVE
    }
}
