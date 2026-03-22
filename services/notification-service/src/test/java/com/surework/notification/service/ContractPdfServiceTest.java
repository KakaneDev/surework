package com.surework.notification.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.thymeleaf.ITemplateEngine;
import org.thymeleaf.context.Context;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for ContractPdfService.
 * Tests template selection logic for different employment types.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ContractPdfService Tests")
class ContractPdfServiceTest {

    @Mock
    private ITemplateEngine templateEngine;

    private ContractPdfService contractPdfService;

    @BeforeEach
    void setUp() {
        contractPdfService = new ContractPdfService(templateEngine);
    }

    @Nested
    @DisplayName("resolveTemplateName()")
    class ResolveTemplateName {

        @Test
        @DisplayName("FULL_TIME should resolve to contract/permanent")
        void fullTimeShouldResolvePermanent() {
            assertThat(contractPdfService.resolveTemplateName("FULL_TIME"))
                    .isEqualTo("contract/permanent");
        }

        @Test
        @DisplayName("PART_TIME should resolve to contract/permanent")
        void partTimeShouldResolvePermanent() {
            assertThat(contractPdfService.resolveTemplateName("PART_TIME"))
                    .isEqualTo("contract/permanent");
        }

        @Test
        @DisplayName("CONTRACT should resolve to contract/fixed-term")
        void contractShouldResolveFixedTerm() {
            assertThat(contractPdfService.resolveTemplateName("CONTRACT"))
                    .isEqualTo("contract/fixed-term");
        }

        @Test
        @DisplayName("FREELANCE should resolve to contract/fixed-term")
        void freelanceShouldResolveFixedTerm() {
            assertThat(contractPdfService.resolveTemplateName("FREELANCE"))
                    .isEqualTo("contract/fixed-term");
        }

        @Test
        @DisplayName("TEMPORARY should resolve to contract/temporary")
        void temporaryShouldResolveTemporary() {
            assertThat(contractPdfService.resolveTemplateName("TEMPORARY"))
                    .isEqualTo("contract/temporary");
        }

        @Test
        @DisplayName("INTERNSHIP should resolve to contract/internship")
        void internshipShouldResolveInternship() {
            assertThat(contractPdfService.resolveTemplateName("INTERNSHIP"))
                    .isEqualTo("contract/internship");
        }

        @Test
        @DisplayName("unknown type should default to contract/permanent")
        void unknownShouldDefaultPermanent() {
            assertThat(contractPdfService.resolveTemplateName("UNKNOWN_TYPE"))
                    .isEqualTo("contract/permanent");
        }
    }

    @Nested
    @DisplayName("generateEmploymentContract()")
    class GenerateContract {

        @Test
        @DisplayName("should use correct template for FULL_TIME")
        void shouldUseCorrectTemplateForFullTime() {
            Map<String, Object> data = new HashMap<>();
            data.put("employmentType", "FULL_TIME");
            data.put("candidateName", "Test Candidate");

            when(templateEngine.process(eq("contract/permanent"), any(Context.class)))
                    .thenReturn("<html><body>Test</body></html>");

            try {
                contractPdfService.generateEmploymentContract(data);
            } catch (Exception e) {
                // PDF rendering may fail in test context
            }

            verify(templateEngine).process(eq("contract/permanent"), any(Context.class));
        }

        @Test
        @DisplayName("should use correct template for INTERNSHIP")
        void shouldUseCorrectTemplateForInternship() {
            Map<String, Object> data = new HashMap<>();
            data.put("employmentType", "INTERNSHIP");
            data.put("candidateName", "Test Intern");

            when(templateEngine.process(eq("contract/internship"), any(Context.class)))
                    .thenReturn("<html><body>Test</body></html>");

            try {
                contractPdfService.generateEmploymentContract(data);
            } catch (Exception e) {
                // PDF rendering may fail in test context
            }

            verify(templateEngine).process(eq("contract/internship"), any(Context.class));
        }

        @Test
        @DisplayName("should default to FULL_TIME when employmentType is missing")
        void shouldDefaultToFullTimeWhenMissing() {
            Map<String, Object> data = new HashMap<>();
            data.put("candidateName", "Test Candidate");

            when(templateEngine.process(eq("contract/permanent"), any(Context.class)))
                    .thenReturn("<html><body>Test</body></html>");

            try {
                contractPdfService.generateEmploymentContract(data);
            } catch (Exception e) {
                // PDF rendering may fail in test context
            }

            verify(templateEngine).process(eq("contract/permanent"), any(Context.class));
        }

        @Test
        @DisplayName("should pass all contract data variables to template context")
        void shouldPassAllVariables() {
            Map<String, Object> data = new HashMap<>();
            data.put("employmentType", "FULL_TIME");
            data.put("candidateName", "John Doe");
            data.put("jobTitle", "Software Engineer");
            data.put("department", "Engineering");
            data.put("location", "Johannesburg");
            data.put("formattedSalary", "R 45,000.00");
            data.put("salaryCurrency", "ZAR");
            data.put("startDate", "1 March 2026");
            data.put("workingHours", "08:00 - 17:00, Monday to Friday");
            data.put("issueDate", "12 February 2026");

            ArgumentCaptor<Context> contextCaptor = ArgumentCaptor.forClass(Context.class);
            when(templateEngine.process(eq("contract/permanent"), contextCaptor.capture()))
                    .thenReturn("<html><body>Test</body></html>");

            try {
                contractPdfService.generateEmploymentContract(data);
            } catch (Exception e) {
                // PDF rendering may fail in test context
            }

            Context capturedContext = contextCaptor.getValue();
            assertThat(capturedContext.getVariable("candidateName")).isEqualTo("John Doe");
            assertThat(capturedContext.getVariable("jobTitle")).isEqualTo("Software Engineer");
            assertThat(capturedContext.getVariable("department")).isEqualTo("Engineering");
            assertThat(capturedContext.getVariable("location")).isEqualTo("Johannesburg");
            assertThat(capturedContext.getVariable("formattedSalary")).isEqualTo("R 45,000.00");
            assertThat(capturedContext.getVariable("startDate")).isEqualTo("1 March 2026");
            assertThat(capturedContext.getVariable("issueDate")).isEqualTo("12 February 2026");
        }
    }
}
