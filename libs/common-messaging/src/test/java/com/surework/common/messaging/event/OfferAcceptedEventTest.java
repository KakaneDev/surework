package com.surework.common.messaging.event;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for the enriched OfferAccepted event.
 * Verifies that contract-relevant fields are properly carried.
 */
@DisplayName("OfferAccepted Event Tests")
class OfferAcceptedEventTest {

    @Test
    @DisplayName("should carry all contract data fields")
    void shouldCarryAllContractDataFields() {
        UUID eventId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();
        UUID appId = UUID.randomUUID();
        UUID jobId = UUID.randomUUID();
        UUID managerId = UUID.randomUUID();
        Instant now = Instant.now();
        Instant startDate = Instant.parse("2026-03-01T00:00:00Z");
        BigDecimal salary = new BigDecimal("45000.00");

        var event = new RecruitmentEvent.OfferAccepted(
                eventId, tenantId, now, appId, jobId,
                "Jane Smith", "jane@example.com", managerId,
                "Senior Developer", "Engineering", "Cape Town",
                "FULL_TIME", salary, "ZAR", startDate,
                "08:00 - 17:00, Monday to Friday"
        );

        assertThat(event.eventId()).isEqualTo(eventId);
        assertThat(event.tenantId()).isEqualTo(tenantId);
        assertThat(event.candidateName()).isEqualTo("Jane Smith");
        assertThat(event.candidateEmail()).isEqualTo("jane@example.com");
        assertThat(event.hiringManagerId()).isEqualTo(managerId);
        assertThat(event.jobTitle()).isEqualTo("Senior Developer");
        assertThat(event.department()).isEqualTo("Engineering");
        assertThat(event.location()).isEqualTo("Cape Town");
        assertThat(event.employmentType()).isEqualTo("FULL_TIME");
        assertThat(event.salary()).isEqualByComparingTo("45000.00");
        assertThat(event.salaryCurrency()).isEqualTo("ZAR");
        assertThat(event.startDate()).isEqualTo(startDate);
        assertThat(event.workingHours()).isEqualTo("08:00 - 17:00, Monday to Friday");
    }

    @Test
    @DisplayName("should allow null optional fields")
    void shouldAllowNullOptionalFields() {
        var event = new RecruitmentEvent.OfferAccepted(
                UUID.randomUUID(), UUID.randomUUID(), Instant.now(),
                UUID.randomUUID(), UUID.randomUUID(),
                "John Doe", "john@example.com", null,
                null, null, null, null, null, null, null, null
        );

        assertThat(event.candidateName()).isEqualTo("John Doe");
        assertThat(event.hiringManagerId()).isNull();
        assertThat(event.jobTitle()).isNull();
        assertThat(event.department()).isNull();
        assertThat(event.salary()).isNull();
        assertThat(event.startDate()).isNull();
        assertThat(event.workingHours()).isNull();
    }

    @Test
    @DisplayName("should implement RecruitmentEvent and DomainEvent")
    void shouldImplementCorrectInterfaces() {
        var event = new RecruitmentEvent.OfferAccepted(
                UUID.randomUUID(), UUID.randomUUID(), Instant.now(),
                UUID.randomUUID(), UUID.randomUUID(),
                "Test", "test@test.com", null,
                "Dev", "IT", "JHB", "CONTRACT",
                new BigDecimal("20000"), "ZAR", Instant.now(), null
        );

        assertThat(event).isInstanceOf(RecruitmentEvent.class);
        assertThat(event).isInstanceOf(DomainEvent.class);
        assertThat(event.eventType()).isEqualTo("OfferAccepted");
    }
}
