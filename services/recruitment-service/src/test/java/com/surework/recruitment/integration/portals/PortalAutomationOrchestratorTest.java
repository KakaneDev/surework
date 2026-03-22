package com.surework.recruitment.integration.portals;

import com.surework.recruitment.domain.ExternalJobPosting;
import com.surework.recruitment.domain.JobPosting;
import com.surework.recruitment.integration.portals.playwright.PortalPage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for PortalAutomationOrchestrator related domain models.
 * Tests focus on ExternalJobPosting domain logic and PostingResult behavior.
 *
 * Integration tests requiring database and mocked adapters should use @SpringBootTest.
 */
@DisplayName("PortalAutomationOrchestrator Domain Tests")
class PortalAutomationOrchestratorTest {

    @Nested
    @DisplayName("ExternalJobPosting Domain Tests")
    class ExternalJobPostingDomainTests {

        @Test
        @DisplayName("Should create pending external posting")
        void test_create_pendingPosting() {
            JobPosting job = createJobPosting();
            UUID tenantId = UUID.randomUUID();

            ExternalJobPosting posting = ExternalJobPosting.create(job, JobPosting.JobPortal.PNET, tenantId);

            assertThat(posting.getJobPosting()).isEqualTo(job);
            assertThat(posting.getPortal()).isEqualTo(JobPosting.JobPortal.PNET);
            assertThat(posting.getTenantId()).isEqualTo(tenantId);
            assertThat(posting.getStatus()).isEqualTo(ExternalJobPosting.ExternalPostingStatus.PENDING);
        }

        @Test
        @DisplayName("Should queue posting")
        void test_queue_setsQueuedStatus() {
            ExternalJobPosting posting = createPosting(JobPosting.JobPortal.LINKEDIN);

            posting.queue();

            assertThat(posting.getStatus()).isEqualTo(ExternalJobPosting.ExternalPostingStatus.QUEUED);
        }

        @Test
        @DisplayName("Should start posting")
        void test_startPosting_setsPostingStatus() {
            ExternalJobPosting posting = createPosting(JobPosting.JobPortal.PNET);

            posting.startPosting();

            assertThat(posting.getStatus()).isEqualTo(ExternalJobPosting.ExternalPostingStatus.POSTING);
        }

        @Test
        @DisplayName("Should mark as posted successfully")
        void test_markAsPosted_success() {
            ExternalJobPosting posting = createPosting(JobPosting.JobPortal.INDEED);
            LocalDateTime expiresAt = LocalDateTime.now().plusDays(30);

            posting.markAsPosted("EXT-123", "https://indeed.com/job/123", expiresAt);

            assertThat(posting.getStatus()).isEqualTo(ExternalJobPosting.ExternalPostingStatus.POSTED);
            assertThat(posting.getExternalJobId()).isEqualTo("EXT-123");
            assertThat(posting.getExternalUrl()).isEqualTo("https://indeed.com/job/123");
            assertThat(posting.getExpiresAt()).isEqualTo(expiresAt);
            assertThat(posting.getPostedAt()).isNotNull();
            assertThat(posting.getErrorMessage()).isNull();
        }

        @Test
        @DisplayName("Should mark as failed with error message")
        void test_markAsFailed_setsErrorAndIncrements() {
            ExternalJobPosting posting = createPosting(JobPosting.JobPortal.CAREERS24);
            int initialRetryCount = posting.getRetryCount();

            posting.markAsFailed("Connection timeout");

            assertThat(posting.getStatus()).isEqualTo(ExternalJobPosting.ExternalPostingStatus.FAILED);
            assertThat(posting.getErrorMessage()).isEqualTo("Connection timeout");
            assertThat(posting.getRetryCount()).isEqualTo(initialRetryCount + 1);
        }

        @Test
        @DisplayName("Should mark as requires manual intervention")
        void test_markAsRequiresManual_setsStatus() {
            ExternalJobPosting posting = createPosting(JobPosting.JobPortal.PNET);

            posting.markAsRequiresManual("CAPTCHA detected");

            assertThat(posting.getStatus()).isEqualTo(ExternalJobPosting.ExternalPostingStatus.REQUIRES_MANUAL);
            assertThat(posting.getErrorMessage()).isEqualTo("CAPTCHA detected");
        }

        @Test
        @DisplayName("Should mark as expired")
        void test_markAsExpired_setsStatus() {
            ExternalJobPosting posting = createPosting(JobPosting.JobPortal.LINKEDIN);
            posting.markAsPosted("EXT-123", "https://linkedin.com/job/123", LocalDateTime.now().minusDays(1));

            posting.markAsExpired();

            assertThat(posting.getStatus()).isEqualTo(ExternalJobPosting.ExternalPostingStatus.EXPIRED);
        }

        @Test
        @DisplayName("Should mark as removed")
        void test_markAsRemoved_setsStatus() {
            ExternalJobPosting posting = createPosting(JobPosting.JobPortal.INDEED);
            posting.markAsPosted("EXT-123", "https://indeed.com/job/123", LocalDateTime.now().plusDays(30));

            posting.markAsRemoved();

            assertThat(posting.getStatus()).isEqualTo(ExternalJobPosting.ExternalPostingStatus.REMOVED);
        }

        @Test
        @DisplayName("Should reset for retry")
        void test_resetForRetry_resetsStatus() {
            ExternalJobPosting posting = createPosting(JobPosting.JobPortal.CAREERS24);
            posting.markAsFailed("Error");

            posting.resetForRetry();

            assertThat(posting.getStatus()).isEqualTo(ExternalJobPosting.ExternalPostingStatus.PENDING);
            assertThat(posting.getErrorMessage()).isNull();
        }

        @Test
        @DisplayName("Should allow retry when under max retries and failed")
        void test_canRetry_underMaxRetries() {
            ExternalJobPosting posting = createPosting(JobPosting.JobPortal.PNET);
            posting.markAsFailed("Error 1");

            assertThat(posting.canRetry()).isTrue();
        }

        @Test
        @DisplayName("Should not allow retry when max retries exceeded")
        void test_canRetry_maxRetriesExceeded() {
            ExternalJobPosting posting = createPosting(JobPosting.JobPortal.PNET);
            posting.markAsFailed("Error 1");
            posting.markAsFailed("Error 2");
            posting.markAsFailed("Error 3");

            assertThat(posting.canRetry()).isFalse();
        }

        @Test
        @DisplayName("Should be active when posted and not expired")
        void test_isActive_postedAndNotExpired() {
            ExternalJobPosting posting = createPosting(JobPosting.JobPortal.LINKEDIN);
            posting.markAsPosted("EXT-123", "https://linkedin.com/job/123", LocalDateTime.now().plusDays(30));

            assertThat(posting.isActive()).isTrue();
        }

        @Test
        @DisplayName("Should not be active when posted but expired")
        void test_isActive_postedButExpired() {
            ExternalJobPosting posting = createPosting(JobPosting.JobPortal.INDEED);
            posting.markAsPosted("EXT-123", "https://indeed.com/job/123", LocalDateTime.now().minusDays(1));

            assertThat(posting.isActive()).isFalse();
        }

        @Test
        @DisplayName("Should not be active when not posted")
        void test_isActive_notPosted() {
            ExternalJobPosting posting = createPosting(JobPosting.JobPortal.CAREERS24);

            assertThat(posting.isActive()).isFalse();
        }

        @Test
        @DisplayName("Should update last checked timestamp")
        void test_updateLastChecked_setsTimestamp() {
            ExternalJobPosting posting = createPosting(JobPosting.JobPortal.PNET);
            assertThat(posting.getLastCheckedAt()).isNull();

            posting.updateLastChecked();

            assertThat(posting.getLastCheckedAt()).isNotNull();
        }
    }

    @Nested
    @DisplayName("PostingResult Tests")
    class PostingResultTests {

        @Test
        @DisplayName("Should create success result")
        void test_success_hasCorrectValues() {
            LocalDateTime expiresAt = LocalDateTime.now().plusDays(30);

            PortalPage.PostingResult result = PortalPage.PostingResult.success(
                    "EXT-123",
                    "https://portal.com/job/123",
                    expiresAt
            );

            assertThat(result.success()).isTrue();
            assertThat(result.externalJobId()).isEqualTo("EXT-123");
            assertThat(result.externalUrl()).isEqualTo("https://portal.com/job/123");
            assertThat(result.expiresAt()).isEqualTo(expiresAt);
            assertThat(result.errorMessage()).isNull();
            assertThat(result.requiresManualIntervention()).isFalse();
        }

        @Test
        @DisplayName("Should create failure result")
        void test_failure_hasCorrectValues() {
            PortalPage.PostingResult result = PortalPage.PostingResult.failure("Network error");

            assertThat(result.success()).isFalse();
            assertThat(result.externalJobId()).isNull();
            assertThat(result.externalUrl()).isNull();
            assertThat(result.expiresAt()).isNull();
            assertThat(result.errorMessage()).isEqualTo("Network error");
            assertThat(result.requiresManualIntervention()).isFalse();
        }

        @Test
        @DisplayName("Should create requires manual result")
        void test_requiresManual_hasCorrectValues() {
            PortalPage.PostingResult result = PortalPage.PostingResult.requiresManual("CAPTCHA detected");

            assertThat(result.success()).isFalse();
            assertThat(result.externalJobId()).isNull();
            assertThat(result.externalUrl()).isNull();
            assertThat(result.errorMessage()).isEqualTo("CAPTCHA detected");
            assertThat(result.requiresManualIntervention()).isTrue();
        }
    }

    @Nested
    @DisplayName("JobPosting External Portal Tests")
    class JobPostingExternalPortalTests {

        @Test
        @DisplayName("Should get external portal set when configured")
        void test_getExternalPortalSet_configured() {
            JobPosting job = createJobPosting();
            job.setExternalPortalSet(Set.of(JobPosting.JobPortal.PNET, JobPosting.JobPortal.LINKEDIN));

            Set<JobPosting.JobPortal> portals = job.getExternalPortalSet();

            assertThat(portals).containsExactlyInAnyOrder(JobPosting.JobPortal.PNET, JobPosting.JobPortal.LINKEDIN);
        }

        @Test
        @DisplayName("Should return empty set when no portals configured")
        void test_getExternalPortalSet_empty() {
            JobPosting job = createJobPosting();

            Set<JobPosting.JobPortal> portals = job.getExternalPortalSet();

            assertThat(portals).isEmpty();
        }

        @Test
        @DisplayName("Should check if should post to specific portal")
        void test_shouldPostToPortal_true() {
            JobPosting job = createJobPosting();
            job.setPublishToExternal(true);
            job.setExternalPortalSet(Set.of(JobPosting.JobPortal.PNET));

            assertThat(job.shouldPostToPortal(JobPosting.JobPortal.PNET)).isTrue();
            assertThat(job.shouldPostToPortal(JobPosting.JobPortal.LINKEDIN)).isFalse();
        }

        @Test
        @DisplayName("Should not post to portal when publishToExternal is false")
        void test_shouldPostToPortal_publishExternalFalse() {
            JobPosting job = createJobPosting();
            job.setPublishToExternal(false);
            job.setExternalPortalSet(Set.of(JobPosting.JobPortal.PNET));

            assertThat(job.shouldPostToPortal(JobPosting.JobPortal.PNET)).isFalse();
        }

        @Test
        @DisplayName("Should get full location string")
        void test_getFullLocation() {
            JobPosting job = createJobPosting();
            job.setCity("Johannesburg");
            job.setProvince(JobPosting.Province.GAUTENG);
            job.setCountryCode("ZA");

            String location = job.getFullLocation();

            assertThat(location).contains("Johannesburg");
            assertThat(location).contains("GAUTENG");
            assertThat(location).contains("ZA");
        }

        @Test
        @DisplayName("Should get keyword list")
        void test_getKeywordList() {
            JobPosting job = createJobPosting();
            job.setKeywords("Java, Spring Boot, Microservices");

            assertThat(job.getKeywordList()).containsExactly("Java", "Spring Boot", "Microservices");
        }

        @Test
        @DisplayName("Should return empty keyword list when no keywords")
        void test_getKeywordList_empty() {
            JobPosting job = createJobPosting();

            assertThat(job.getKeywordList()).isEmpty();
        }
    }

    @Nested
    @DisplayName("ExternalPostingStatus Enum Tests")
    class ExternalPostingStatusTests {

        @Test
        @DisplayName("Should have all expected status values")
        void test_allStatusValues() {
            ExternalJobPosting.ExternalPostingStatus[] statuses = ExternalJobPosting.ExternalPostingStatus.values();

            assertThat(statuses).contains(
                    ExternalJobPosting.ExternalPostingStatus.PENDING,
                    ExternalJobPosting.ExternalPostingStatus.QUEUED,
                    ExternalJobPosting.ExternalPostingStatus.POSTING,
                    ExternalJobPosting.ExternalPostingStatus.POSTED,
                    ExternalJobPosting.ExternalPostingStatus.FAILED,
                    ExternalJobPosting.ExternalPostingStatus.REQUIRES_MANUAL,
                    ExternalJobPosting.ExternalPostingStatus.EXPIRED,
                    ExternalJobPosting.ExternalPostingStatus.REMOVED
            );
        }
    }

    private JobPosting createJobPosting() {
        JobPosting job = JobPosting.create("Software Developer", JobPosting.EmploymentType.FULL_TIME);
        job.setId(UUID.randomUUID());
        job.setTenantId(UUID.randomUUID());
        job.setDescription("Test job description");
        job.setLocation("Johannesburg");
        job.setCity("Johannesburg");
        job.setProvince(JobPosting.Province.GAUTENG);
        return job;
    }

    private ExternalJobPosting createPosting(JobPosting.JobPortal portal) {
        JobPosting job = createJobPosting();
        return ExternalJobPosting.create(job, portal, UUID.randomUUID());
    }
}
