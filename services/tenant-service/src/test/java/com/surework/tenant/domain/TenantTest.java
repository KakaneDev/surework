package com.surework.tenant.domain;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class TenantTest {

    @Test
    void newTenant_shouldHaveCompletionFlagsFalse() {
        var tenant = new Tenant();
        assertThat(tenant.isCompanyDetailsComplete()).isFalse();
        assertThat(tenant.isComplianceDetailsComplete()).isFalse();
    }

    @Test
    void isSetupComplete_shouldReturnTrueOnlyWhenBothFlagsTrue() {
        var tenant = new Tenant();
        assertThat(tenant.isSetupComplete()).isFalse();

        tenant.setCompanyDetailsComplete(true);
        assertThat(tenant.isSetupComplete()).isFalse();

        tenant.setComplianceDetailsComplete(true);
        assertThat(tenant.isSetupComplete()).isTrue();
    }
}
