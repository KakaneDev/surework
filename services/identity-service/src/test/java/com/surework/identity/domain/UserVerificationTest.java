package com.surework.identity.domain;

import org.junit.jupiter.api.Test;
import java.time.Instant;
import static org.assertj.core.api.Assertions.assertThat;

class UserVerificationTest {

    @Test
    void generateVerificationCode_shouldSetCodeAndExpiry() {
        var user = new User();
        user.generateVerificationCode();

        assertThat(user.getVerificationCode()).isNotNull();
        assertThat(user.getVerificationCode()).hasSize(6);
        assertThat(user.getVerificationCode()).matches("\\d{6}");
        assertThat(user.getVerificationCodeExpiry()).isAfter(Instant.now());
    }

    @Test
    void isVerificationCodeValid_shouldReturnTrueForMatchingNonExpiredCode() {
        var user = new User();
        user.generateVerificationCode();
        String code = user.getVerificationCode();

        assertThat(user.isVerificationCodeValid(code)).isTrue();
    }

    @Test
    void isVerificationCodeValid_shouldReturnFalseForWrongCode() {
        var user = new User();
        user.generateVerificationCode();

        assertThat(user.isVerificationCodeValid("000000")).isFalse();
    }

    @Test
    void isVerificationCodeValid_shouldReturnFalseForExpiredCode() {
        var user = new User();
        user.setVerificationCode("123456");
        user.setVerificationCodeExpiry(Instant.now().minusSeconds(60));

        assertThat(user.isVerificationCodeValid("123456")).isFalse();
    }

    @Test
    void clearVerificationCode_shouldNullOutFields() {
        var user = new User();
        user.generateVerificationCode();
        user.clearVerificationCode();

        assertThat(user.getVerificationCode()).isNull();
        assertThat(user.getVerificationCodeExpiry()).isNull();
    }
}
