package com.surework.reporting.client;

import com.surework.reporting.client.dto.ApplicationDto;
import com.surework.reporting.client.dto.CandidateDto;
import com.surework.reporting.client.dto.InterviewDto;
import com.surework.reporting.client.dto.JobPostingDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Feign client for Recruitment Service.
 * Fetches recruitment data for pipeline and analytics reports.
 */
@FeignClient(name = "recruitment-service", url = "${surework.services.recruitment-service.url:http://localhost:8086}")
public interface RecruitmentServiceClient {

    @GetMapping("/api/recruitment/jobs")
    List<JobPostingDto> getAllJobPostings();

    @GetMapping("/api/recruitment/jobs")
    List<JobPostingDto> getJobPostingsByStatus(@RequestParam("status") String status);

    @GetMapping("/api/recruitment/jobs/{id}")
    JobPostingDto getJobPosting(@PathVariable("id") UUID id);

    @GetMapping("/api/recruitment/candidates")
    List<CandidateDto> getAllCandidates();

    @GetMapping("/api/recruitment/candidates/{id}")
    CandidateDto getCandidate(@PathVariable("id") UUID id);

    @GetMapping("/api/recruitment/applications")
    List<ApplicationDto> getAllApplications();

    @GetMapping("/api/recruitment/applications")
    List<ApplicationDto> getApplicationsByStatus(@RequestParam("status") String status);

    @GetMapping("/api/recruitment/applications/job/{jobId}")
    List<ApplicationDto> getApplicationsByJob(@PathVariable("jobId") UUID jobId);

    @GetMapping("/api/recruitment/interviews")
    List<InterviewDto> getAllInterviews();

    @GetMapping("/api/recruitment/interviews/application/{applicationId}")
    List<InterviewDto> getInterviewsByApplication(@PathVariable("applicationId") UUID applicationId);

    // === Analytics Endpoints ===

    @GetMapping("/api/recruitment/analytics/portal-performance")
    Map<String, Object> getPortalPerformanceStats();

    @GetMapping("/api/recruitment/analytics/advert-performance")
    Map<String, Object> getAdvertPerformanceStats();

    @GetMapping("/api/recruitment/analytics/source-effectiveness")
    Map<String, Object> getSourceEffectivenessStats();

    @GetMapping("/api/recruitment/analytics/offer-acceptance")
    Map<String, Object> getOfferAcceptanceStats();
}
