package com.surework.common.security.cache;

import com.surework.common.security.TenantContext;
import com.surework.common.security.TenantNotSetException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for TenantAwareRedisOps.
 *
 * These tests verify that:
 * 1. Redis keys are properly prefixed with tenant ID
 * 2. Global keys use 'global' prefix
 * 3. keyOrGlobal falls back to global when tenant context is not set
 * 4. key() throws TenantNotSetException when context is not set (fail-closed)
 */
public class TenantAwareRedisOpsTest {

    private static final UUID TENANT_A = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @BeforeEach
    void setUp() {
        TenantContext.clear();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("key() should generate tenant-prefixed key")
    void key_ShouldGenerateTenantPrefixedKey() {
        TenantContext.setTenantId(TENANT_A);

        String key = TenantAwareRedisOps.key("mfa", "challenge", "token123");

        assertThat(key).isEqualTo("tenant:" + TENANT_A + ":mfa:challenge:token123");
    }

    @Test
    @DisplayName("key() should throw TenantNotSetException when tenant context is not set (fail-closed)")
    void key_ShouldThrow_WhenTenantContextNotSet() {
        assertThatThrownBy(() -> TenantAwareRedisOps.key("mfa", "challenge"))
                .isInstanceOf(TenantNotSetException.class);
    }

    @Test
    @DisplayName("key() with explicit tenant ID should use provided tenant")
    void key_WithExplicitTenantId_ShouldUseProvidedTenant() {
        String key = TenantAwareRedisOps.key(TENANT_A, "token", "blacklist", "abc123");

        assertThat(key).isEqualTo("tenant:" + TENANT_A + ":token:blacklist:abc123");
    }

    @Test
    @DisplayName("key() with null explicit tenant ID should throw IllegalArgumentException")
    void key_WithNullTenantId_ShouldThrow() {
        assertThatThrownBy(() -> TenantAwareRedisOps.key((UUID) null, "token", "blacklist"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cannot be null");
    }

    @Test
    @DisplayName("keyOrGlobal() should use tenant when context is set")
    void keyOrGlobal_ShouldUseTenant_WhenContextIsSet() {
        TenantContext.setTenantId(TENANT_A);

        String key = TenantAwareRedisOps.keyOrGlobal("cache", "user", "123");

        assertThat(key).isEqualTo("tenant:" + TENANT_A + ":cache:user:123");
    }

    @Test
    @DisplayName("keyOrGlobal() should use global when context is not set")
    void keyOrGlobal_ShouldUseGlobal_WhenContextNotSet() {
        String key = TenantAwareRedisOps.keyOrGlobal("password", "reset", "token456");

        assertThat(key).isEqualTo("global:password:reset:token456");
    }

    @Test
    @DisplayName("globalKey() should always use global prefix")
    void globalKey_ShouldAlwaysUseGlobalPrefix() {
        // Even with tenant context set
        TenantContext.setTenantId(TENANT_A);

        String key = TenantAwareRedisOps.globalKey("system", "config");

        assertThat(key).isEqualTo("global:system:config");
    }

    @Test
    @DisplayName("extractTenantId() should extract tenant from key")
    void extractTenantId_ShouldExtractTenantFromKey() {
        String key = "tenant:" + TENANT_A + ":mfa:challenge:abc";

        UUID extractedTenant = TenantAwareRedisOps.extractTenantId(key);

        assertThat(extractedTenant).isEqualTo(TENANT_A);
    }

    @Test
    @DisplayName("extractTenantId() should return null for global keys")
    void extractTenantId_ShouldReturnNull_ForGlobalKeys() {
        String key = "global:password:reset:token";

        UUID extractedTenant = TenantAwareRedisOps.extractTenantId(key);

        assertThat(extractedTenant).isNull();
    }

    @Test
    @DisplayName("extractTenantId() should return null for invalid keys")
    void extractTenantId_ShouldReturnNull_ForInvalidKeys() {
        assertThat(TenantAwareRedisOps.extractTenantId(null)).isNull();
        assertThat(TenantAwareRedisOps.extractTenantId("")).isNull();
        assertThat(TenantAwareRedisOps.extractTenantId("invalid:key")).isNull();
        assertThat(TenantAwareRedisOps.extractTenantId("tenant:not-a-uuid:data")).isNull();
    }

    @Test
    @DisplayName("Keys for same data but different tenants should be different")
    void keys_ForSameData_DifferentTenants_ShouldBeDifferent() {
        UUID tenantB = UUID.fromString("22222222-2222-2222-2222-222222222222");

        String keyA = TenantAwareRedisOps.key(TENANT_A, "employee", "123");
        String keyB = TenantAwareRedisOps.key(tenantB, "employee", "123");

        assertThat(keyA).isNotEqualTo(keyB);
    }

    @Test
    @DisplayName("isTenantKey() should return true for tenant-prefixed keys")
    void isTenantKey_ShouldReturnTrue_ForTenantKeys() {
        String key = "tenant:" + TENANT_A + ":data:key";

        assertThat(TenantAwareRedisOps.isTenantKey(key)).isTrue();
    }

    @Test
    @DisplayName("isTenantKey() should return false for global keys")
    void isTenantKey_ShouldReturnFalse_ForGlobalKeys() {
        String key = "global:system:config";

        assertThat(TenantAwareRedisOps.isTenantKey(key)).isFalse();
    }

    @Test
    @DisplayName("isGlobalKey() should return true for global-prefixed keys")
    void isGlobalKey_ShouldReturnTrue_ForGlobalKeys() {
        String key = "global:password:reset:token";

        assertThat(TenantAwareRedisOps.isGlobalKey(key)).isTrue();
    }

    @Test
    @DisplayName("isGlobalKey() should return false for tenant keys")
    void isGlobalKey_ShouldReturnFalse_ForTenantKeys() {
        String key = "tenant:" + TENANT_A + ":data:key";

        assertThat(TenantAwareRedisOps.isGlobalKey(key)).isFalse();
    }

    @Test
    @DisplayName("key() should handle null parts gracefully")
    void key_ShouldHandleNullParts() {
        TenantContext.setTenantId(TENANT_A);

        String key = TenantAwareRedisOps.key("mfa", null, "challenge");

        assertThat(key).isEqualTo("tenant:" + TENANT_A + ":mfa:challenge");
    }
}
