package com.surework.recruitment.domain;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for Application offer acceptance flow.
 * Verifies that acceptOffer() correctly updates both status and stage.
 */
@DisplayName("Application Offer Tests")
class ApplicationOfferTest {

    private Application application;

    @BeforeEach
    void setUp() {
        application = new Application();
        application.setStatus(Application.ApplicationStatus.NEW);
        application.setStage(Application.RecruitmentStage.NEW);
    }

    @Nested
    @DisplayName("acceptOffer()")
    class AcceptOffer {

        @BeforeEach
        void makeOffer() {
            // Simulate making an offer first
            application.makeOffer(
                    new BigDecimal("35000.00"),
                    LocalDate.now().plusDays(7),
                    LocalDate.now().plusMonths(1)
            );
            assertThat(application.getStatus()).isEqualTo(Application.ApplicationStatus.OFFER_MADE);
            assertThat(application.getStage()).isEqualTo(Application.RecruitmentStage.OFFER);
        }

        @Test
        @DisplayName("should set status to OFFER_ACCEPTED")
        void shouldSetStatusToOfferAccepted() {
            application.acceptOffer();
            assertThat(application.getStatus()).isEqualTo(Application.ApplicationStatus.OFFER_ACCEPTED);
        }

        @Test
        @DisplayName("should set stage to ONBOARDING")
        void shouldSetStageToOnboarding() {
            application.acceptOffer();
            assertThat(application.getStage()).isEqualTo(Application.RecruitmentStage.ONBOARDING);
        }

        @Test
        @DisplayName("should set offerAcceptedDate to today")
        void shouldSetOfferAcceptedDate() {
            application.acceptOffer();
            assertThat(application.getOfferAcceptedDate()).isEqualTo(LocalDate.now());
        }

        @Test
        @DisplayName("should throw if no offer has been made")
        void shouldThrowIfNoOfferMade() {
            Application noOfferApp = new Application();
            noOfferApp.setStatus(Application.ApplicationStatus.NEW);

            assertThatThrownBy(noOfferApp::acceptOffer)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("No offer to accept");
        }

        @Test
        @DisplayName("should throw if offer was already accepted")
        void shouldThrowIfAlreadyAccepted() {
            application.acceptOffer();

            assertThatThrownBy(application::acceptOffer)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("No offer to accept");
        }
    }

    @Nested
    @DisplayName("declineOffer()")
    class DeclineOffer {

        @BeforeEach
        void makeOffer() {
            application.makeOffer(
                    new BigDecimal("35000.00"),
                    LocalDate.now().plusDays(7),
                    LocalDate.now().plusMonths(1)
            );
        }

        @Test
        @DisplayName("should set status to OFFER_DECLINED")
        void shouldSetStatusToOfferDeclined() {
            application.declineOffer("Found another opportunity");
            assertThat(application.getStatus()).isEqualTo(Application.ApplicationStatus.OFFER_DECLINED);
        }

        @Test
        @DisplayName("should not change stage (remains at OFFER)")
        void shouldNotChangeStage() {
            application.declineOffer("Not interested");
            assertThat(application.getStage()).isEqualTo(Application.RecruitmentStage.OFFER);
        }
    }

    @Nested
    @DisplayName("makeOffer()")
    class MakeOffer {

        @Test
        @DisplayName("should set status to OFFER_MADE and stage to OFFER")
        void shouldSetStatusAndStage() {
            application.makeOffer(
                    new BigDecimal("25000.00"),
                    LocalDate.now().plusDays(14),
                    LocalDate.now().plusMonths(1)
            );
            assertThat(application.getStatus()).isEqualTo(Application.ApplicationStatus.OFFER_MADE);
            assertThat(application.getStage()).isEqualTo(Application.RecruitmentStage.OFFER);
        }

        @Test
        @DisplayName("should generate an offer token")
        void shouldGenerateOfferToken() {
            application.makeOffer(
                    new BigDecimal("25000.00"),
                    LocalDate.now().plusDays(14),
                    LocalDate.now().plusMonths(1)
            );
            assertThat(application.getOfferToken()).isNotNull().isNotBlank().hasSize(32);
        }

        @Test
        @DisplayName("should set salary, dates, and offer date")
        void shouldSetOfferDetails() {
            LocalDate expiry = LocalDate.now().plusDays(14);
            LocalDate start = LocalDate.now().plusMonths(1);
            application.makeOffer(new BigDecimal("30000.00"), expiry, start);

            assertThat(application.getOfferSalary()).isEqualByComparingTo("30000.00");
            assertThat(application.getOfferExpiryDate()).isEqualTo(expiry);
            assertThat(application.getExpectedStartDate()).isEqualTo(start);
            assertThat(application.getOfferDate()).isEqualTo(LocalDate.now());
        }
    }
}
