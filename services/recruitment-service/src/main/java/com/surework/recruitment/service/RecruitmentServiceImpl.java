package com.surework.recruitment.service;

import com.surework.recruitment.domain.*;
import com.surework.recruitment.dto.RecruitmentDto;
import com.surework.recruitment.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementation of RecruitmentService.
 */
@Service
@Transactional
public class RecruitmentServiceImpl implements RecruitmentService {

    private final JobPostingRepository jobPostingRepository;
    private final CandidateRepository candidateRepository;
    private final ApplicationRepository applicationRepository;
    private final InterviewRepository interviewRepository;

    public RecruitmentServiceImpl(
            JobPostingRepository jobPostingRepository,
            CandidateRepository candidateRepository,
            ApplicationRepository applicationRepository,
            InterviewRepository interviewRepository) {
        this.jobPostingRepository = jobPostingRepository;
        this.candidateRepository = candidateRepository;
        this.applicationRepository = applicationRepository;
        this.interviewRepository = interviewRepository;
    }

    // === Job Posting Operations ===

    @Override
    public RecruitmentDto.JobPostingResponse createJob(RecruitmentDto.CreateJobRequest request) {
        JobPosting job = new JobPosting();
        job.setTitle(request.title());
        job.setDepartmentId(request.departmentId());
        job.setDepartmentName(request.departmentName());
        job.setLocation(request.location());
        job.setEmploymentType(request.employmentType());
        job.setDescription(request.description());
        job.setRequirements(request.requirements());
        job.setResponsibilities(request.responsibilities());
        job.setQualifications(request.qualifications());
        job.setSkills(request.skills());
        job.setExperienceYearsMin(request.experienceYearsMin());
        job.setExperienceYearsMax(request.experienceYearsMax());
        job.setSalaryMin(request.salaryMin());
        job.setSalaryMax(request.salaryMax());
        job.setShowSalary(request.showSalary());
        job.setBenefits(request.benefits());
        job.setPositionsAvailable(request.positionsAvailable());
        job.setHiringManagerId(request.hiringManagerId());
        job.setHiringManagerName(request.hiringManagerName());
        job.setRecruiterId(request.recruiterId());
        job.setRecruiterName(request.recruiterName());
        job.setInternalOnly(request.internalOnly());
        job.setRemote(request.remote());
        job.setStatus(JobPosting.JobStatus.DRAFT);

        job = jobPostingRepository.save(job);
        return RecruitmentDto.JobPostingResponse.fromEntity(job);
    }

    @Override
    public RecruitmentDto.JobPostingResponse updateJob(UUID jobId, RecruitmentDto.UpdateJobRequest request) {
        JobPosting job = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        if (request.title() != null) job.setTitle(request.title());
        if (request.location() != null) job.setLocation(request.location());
        if (request.description() != null) job.setDescription(request.description());
        if (request.requirements() != null) job.setRequirements(request.requirements());
        if (request.responsibilities() != null) job.setResponsibilities(request.responsibilities());
        if (request.qualifications() != null) job.setQualifications(request.qualifications());
        if (request.skills() != null) job.setSkills(request.skills());
        if (request.experienceYearsMin() != null) job.setExperienceYearsMin(request.experienceYearsMin());
        if (request.experienceYearsMax() != null) job.setExperienceYearsMax(request.experienceYearsMax());
        if (request.salaryMin() != null) job.setSalaryMin(request.salaryMin());
        if (request.salaryMax() != null) job.setSalaryMax(request.salaryMax());
        job.setShowSalary(request.showSalary());
        if (request.benefits() != null) job.setBenefits(request.benefits());
        job.setPositionsAvailable(request.positionsAvailable());
        job.setInternalOnly(request.internalOnly());
        job.setRemote(request.remote());

        job = jobPostingRepository.save(job);
        return RecruitmentDto.JobPostingResponse.fromEntity(job);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<RecruitmentDto.JobPostingResponse> getJob(UUID jobId) {
        return jobPostingRepository.findById(jobId)
                .filter(j -> !j.isDeleted())
                .map(RecruitmentDto.JobPostingResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<RecruitmentDto.JobPostingResponse> getJobByReference(String jobReference) {
        return jobPostingRepository.findByJobReference(jobReference)
                .map(RecruitmentDto.JobPostingResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RecruitmentDto.JobPostingSummary> searchJobs(
            JobPosting.JobStatus status,
            UUID departmentId,
            JobPosting.EmploymentType employmentType,
            String location,
            String searchTerm,
            Pageable pageable) {
        return jobPostingRepository.search(status, departmentId, employmentType, location, searchTerm, pageable)
                .map(RecruitmentDto.JobPostingSummary::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RecruitmentDto.JobPostingSummary> getPublicJobs(Pageable pageable) {
        return jobPostingRepository.findPublicJobs(pageable)
                .map(RecruitmentDto.JobPostingSummary::fromEntity);
    }

    @Override
    public RecruitmentDto.JobPostingResponse publishJob(UUID jobId, LocalDate closingDate) {
        JobPosting job = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        job.publish(closingDate);
        job = jobPostingRepository.save(job);
        return RecruitmentDto.JobPostingResponse.fromEntity(job);
    }

    @Override
    public RecruitmentDto.JobPostingResponse putJobOnHold(UUID jobId) {
        JobPosting job = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        job.putOnHold();
        job = jobPostingRepository.save(job);
        return RecruitmentDto.JobPostingResponse.fromEntity(job);
    }

    @Override
    public RecruitmentDto.JobPostingResponse reopenJob(UUID jobId) {
        JobPosting job = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        job.reopen();
        job = jobPostingRepository.save(job);
        return RecruitmentDto.JobPostingResponse.fromEntity(job);
    }

    @Override
    public RecruitmentDto.JobPostingResponse closeJob(UUID jobId) {
        JobPosting job = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        job.close();
        job = jobPostingRepository.save(job);
        return RecruitmentDto.JobPostingResponse.fromEntity(job);
    }

    @Override
    public RecruitmentDto.JobPostingResponse markJobAsFilled(UUID jobId) {
        JobPosting job = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        job.markAsFilled();
        job = jobPostingRepository.save(job);
        return RecruitmentDto.JobPostingResponse.fromEntity(job);
    }

    @Override
    public void cancelJob(UUID jobId) {
        JobPosting job = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        job.cancel();
        jobPostingRepository.save(job);
    }

    @Override
    public void incrementJobViews(UUID jobId) {
        jobPostingRepository.findById(jobId).ifPresent(job -> {
            job.incrementViews();
            jobPostingRepository.save(job);
        });
    }

    // === Candidate Operations ===

    @Override
    public RecruitmentDto.CandidateResponse createCandidate(RecruitmentDto.CreateCandidateRequest request) {
        // Check for duplicate email
        if (candidateRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Candidate with email already exists: " + request.email());
        }

        Candidate candidate = new Candidate();
        candidate.setFirstName(request.firstName());
        candidate.setLastName(request.lastName());
        candidate.setEmail(request.email());
        candidate.setPhone(request.phone());
        candidate.setIdNumber(request.idNumber());
        candidate.setDateOfBirth(request.dateOfBirth());
        candidate.setGender(request.gender());
        candidate.setNationality(request.nationality());
        candidate.setAddressLine1(request.addressLine1());
        candidate.setAddressLine2(request.addressLine2());
        candidate.setCity(request.city());
        candidate.setProvince(request.province());
        candidate.setPostalCode(request.postalCode());
        candidate.setCurrentJobTitle(request.currentJobTitle());
        candidate.setCurrentEmployer(request.currentEmployer());
        candidate.setYearsExperience(request.yearsExperience());
        candidate.setHighestQualification(request.highestQualification());
        candidate.setFieldOfStudy(request.fieldOfStudy());
        candidate.setSkills(request.skills());
        candidate.setLanguages(request.languages());
        candidate.setExpectedSalary(request.expectedSalary());
        candidate.setNoticePeriodDays(request.noticePeriodDays());
        candidate.setAvailableFrom(request.availableFrom());
        candidate.setWillingToRelocate(request.willingToRelocate());
        candidate.setPreferredLocations(request.preferredLocations());
        candidate.setLinkedinUrl(request.linkedinUrl());
        candidate.setPortfolioUrl(request.portfolioUrl());
        candidate.setSource(request.source());
        candidate.setReferredBy(request.referredBy());
        candidate.setStatus(Candidate.CandidateStatus.ACTIVE);

        candidate = candidateRepository.save(candidate);
        return RecruitmentDto.CandidateResponse.fromEntity(candidate);
    }

    @Override
    public RecruitmentDto.CandidateResponse updateCandidate(UUID candidateId, RecruitmentDto.UpdateCandidateRequest request) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new IllegalArgumentException("Candidate not found: " + candidateId));

        if (request.firstName() != null) candidate.setFirstName(request.firstName());
        if (request.lastName() != null) candidate.setLastName(request.lastName());
        if (request.phone() != null) candidate.setPhone(request.phone());
        if (request.currentJobTitle() != null) candidate.setCurrentJobTitle(request.currentJobTitle());
        if (request.currentEmployer() != null) candidate.setCurrentEmployer(request.currentEmployer());
        if (request.yearsExperience() != null) candidate.setYearsExperience(request.yearsExperience());
        if (request.skills() != null) candidate.setSkills(request.skills());
        if (request.expectedSalary() != null) candidate.setExpectedSalary(request.expectedSalary());
        if (request.noticePeriodDays() != null) candidate.setNoticePeriodDays(request.noticePeriodDays());
        candidate.setWillingToRelocate(request.willingToRelocate());
        if (request.notes() != null) candidate.setNotes(request.notes());

        candidate = candidateRepository.save(candidate);
        return RecruitmentDto.CandidateResponse.fromEntity(candidate);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<RecruitmentDto.CandidateResponse> getCandidate(UUID candidateId) {
        return candidateRepository.findById(candidateId)
                .filter(c -> !c.isDeleted())
                .map(RecruitmentDto.CandidateResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<RecruitmentDto.CandidateResponse> getCandidateByEmail(String email) {
        return candidateRepository.findByEmail(email)
                .map(RecruitmentDto.CandidateResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RecruitmentDto.CandidateResponse> searchCandidates(
            Candidate.CandidateStatus status,
            String searchTerm,
            Pageable pageable) {
        return candidateRepository.search(status, searchTerm, pageable)
                .map(RecruitmentDto.CandidateResponse::fromEntity);
    }

    @Override
    public void blacklistCandidate(UUID candidateId, String reason) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new IllegalArgumentException("Candidate not found: " + candidateId));

        candidate.blacklist(reason);
        candidateRepository.save(candidate);
    }

    @Override
    public void removeFromBlacklist(UUID candidateId) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new IllegalArgumentException("Candidate not found: " + candidateId));

        candidate.removeFromBlacklist();
        candidateRepository.save(candidate);
    }

    @Override
    public void archiveCandidate(UUID candidateId) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new IllegalArgumentException("Candidate not found: " + candidateId));

        candidate.archive();
        candidateRepository.save(candidate);
    }

    // === Application Operations ===

    @Override
    public RecruitmentDto.ApplicationResponse createApplication(RecruitmentDto.CreateApplicationRequest request) {
        Candidate candidate = candidateRepository.findById(request.candidateId())
                .orElseThrow(() -> new IllegalArgumentException("Candidate not found: " + request.candidateId()));

        JobPosting job = jobPostingRepository.findById(request.jobId())
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + request.jobId()));

        // Check if candidate already applied
        if (applicationRepository.existsByCandidateAndJob(request.candidateId(), request.jobId())) {
            throw new IllegalArgumentException("Candidate has already applied to this job");
        }

        // Check if job is open for applications
        if (!job.isAcceptingApplications()) {
            throw new IllegalArgumentException("Job is not accepting applications");
        }

        // Check if candidate is blacklisted
        if (candidate.isBlacklisted()) {
            throw new IllegalArgumentException("Candidate is blacklisted");
        }

        Application application = new Application();
        application.setCandidate(candidate);
        application.setJobPosting(job);
        application.setCoverLetter(request.coverLetter());
        application.setSource(request.source());
        application.setStatus(Application.ApplicationStatus.NEW);
        application.setStage(Application.RecruitmentStage.NEW);
        application.setApplicationDate(LocalDate.now());

        application = applicationRepository.save(application);

        // Increment application count on job
        job.incrementApplications();
        jobPostingRepository.save(job);

        return RecruitmentDto.ApplicationResponse.fromEntity(application);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<RecruitmentDto.ApplicationResponse> getApplication(UUID applicationId) {
        return applicationRepository.findById(applicationId)
                .filter(a -> !a.isDeleted())
                .map(RecruitmentDto.ApplicationResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<RecruitmentDto.ApplicationResponse> getApplicationByReference(String reference) {
        return applicationRepository.findByApplicationReference(reference)
                .map(RecruitmentDto.ApplicationResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RecruitmentDto.ApplicationResponse> getApplicationsForJob(UUID jobId) {
        return applicationRepository.findByJobPostingId(jobId).stream()
                .map(RecruitmentDto.ApplicationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RecruitmentDto.ApplicationResponse> getApplicationsForCandidate(UUID candidateId) {
        return applicationRepository.findByCandidateId(candidateId).stream()
                .map(RecruitmentDto.ApplicationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RecruitmentDto.ApplicationResponse> searchApplications(
            UUID jobId,
            UUID candidateId,
            Application.ApplicationStatus status,
            Application.RecruitmentStage stage,
            Pageable pageable) {
        return applicationRepository.search(jobId, candidateId, status, stage, pageable)
                .map(RecruitmentDto.ApplicationResponse::fromEntity);
    }

    @Override
    public RecruitmentDto.ApplicationResponse moveToScreening(UUID applicationId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + applicationId));

        application.moveToScreening();
        application = applicationRepository.save(application);
        return RecruitmentDto.ApplicationResponse.fromEntity(application);
    }

    @Override
    public RecruitmentDto.ApplicationResponse completeScreening(
            UUID applicationId, int score, String notes, UUID screenedBy) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + applicationId));

        application.completeScreening(score, notes, screenedBy);
        application = applicationRepository.save(application);
        return RecruitmentDto.ApplicationResponse.fromEntity(application);
    }

    @Override
    public RecruitmentDto.ApplicationResponse shortlistApplication(UUID applicationId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + applicationId));

        application.shortlist();
        application = applicationRepository.save(application);
        return RecruitmentDto.ApplicationResponse.fromEntity(application);
    }

    @Override
    public RecruitmentDto.ApplicationResponse moveToInterview(UUID applicationId, Application.RecruitmentStage stage) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + applicationId));

        application.moveToInterview(stage);
        application = applicationRepository.save(application);
        return RecruitmentDto.ApplicationResponse.fromEntity(application);
    }

    @Override
    public RecruitmentDto.ApplicationResponse makeOffer(
            UUID applicationId, BigDecimal salary, LocalDate expiryDate, LocalDate startDate) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + applicationId));

        application.makeOffer(salary, expiryDate, startDate);
        application = applicationRepository.save(application);
        return RecruitmentDto.ApplicationResponse.fromEntity(application);
    }

    @Override
    public RecruitmentDto.ApplicationResponse acceptOffer(UUID applicationId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + applicationId));

        application.acceptOffer();
        application = applicationRepository.save(application);
        return RecruitmentDto.ApplicationResponse.fromEntity(application);
    }

    @Override
    public RecruitmentDto.ApplicationResponse declineOffer(UUID applicationId, String reason) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + applicationId));

        application.declineOffer(reason);
        application = applicationRepository.save(application);
        return RecruitmentDto.ApplicationResponse.fromEntity(application);
    }

    @Override
    public RecruitmentDto.ApplicationResponse markAsHired(UUID applicationId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + applicationId));

        application.hire();
        application = applicationRepository.save(application);

        // Update job positions filled
        JobPosting job = application.getJobPosting();
        job.fillPosition();
        jobPostingRepository.save(job);

        return RecruitmentDto.ApplicationResponse.fromEntity(application);
    }

    @Override
    public RecruitmentDto.ApplicationResponse rejectApplication(
            UUID applicationId, String reason, String notes, UUID rejectedBy) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + applicationId));

        application.reject(reason, notes, rejectedBy);
        application = applicationRepository.save(application);
        return RecruitmentDto.ApplicationResponse.fromEntity(application);
    }

    @Override
    public RecruitmentDto.ApplicationResponse withdrawApplication(UUID applicationId, String reason) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + applicationId));

        application.withdraw(reason);
        application = applicationRepository.save(application);
        return RecruitmentDto.ApplicationResponse.fromEntity(application);
    }

    @Override
    public void toggleStarred(UUID applicationId) {
        applicationRepository.findById(applicationId).ifPresent(application -> {
            application.toggleStarred();
            applicationRepository.save(application);
        });
    }

    @Override
    public void updateApplicationRating(UUID applicationId, int rating) {
        applicationRepository.findById(applicationId).ifPresent(application -> {
            application.setOverallRating(rating);
            applicationRepository.save(application);
        });
    }

    // === Interview Operations ===

    @Override
    public RecruitmentDto.InterviewResponse scheduleInterview(RecruitmentDto.ScheduleInterviewRequest request) {
        Application application = applicationRepository.findById(request.applicationId())
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + request.applicationId()));

        // Check for conflicting interviews
        LocalDateTime endTime = request.scheduledAt().plusMinutes(request.durationMinutes());
        List<Interview> conflicts = interviewRepository.findConflictingInterviews(
                request.interviewerId(), request.scheduledAt(), endTime);

        if (!conflicts.isEmpty()) {
            throw new IllegalArgumentException("Interviewer has a conflicting interview at this time");
        }

        // Determine round number
        List<Interview> existingInterviews = interviewRepository.findByApplicationId(request.applicationId());
        int roundNumber = existingInterviews.size() + 1;

        Interview interview = new Interview();
        interview.setApplication(application);
        interview.setInterviewType(request.interviewType());
        interview.setRoundNumber(roundNumber);
        interview.setScheduledAt(request.scheduledAt());
        interview.setDurationMinutes(request.durationMinutes());
        interview.setLocationType(request.locationType());
        interview.setLocationDetails(request.locationDetails());
        interview.setMeetingLink(request.meetingLink());
        interview.setInterviewerId(request.interviewerId());
        interview.setInterviewerName(request.interviewerName());
        interview.setInterviewerEmail(request.interviewerEmail());
        interview.setPanelInterviewerIds(request.panelInterviewerIds());
        interview.setPanelInterviewerNames(request.panelInterviewerNames());
        interview.setAgenda(request.agenda());
        interview.setTopicsToCover(request.topicsToCover());
        interview.setStatus(Interview.InterviewStatus.SCHEDULED);

        interview = interviewRepository.save(interview);

        // Update application interview count
        application.incrementInterviews();
        applicationRepository.save(application);

        return RecruitmentDto.InterviewResponse.fromEntity(interview);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<RecruitmentDto.InterviewResponse> getInterview(UUID interviewId) {
        return interviewRepository.findById(interviewId)
                .filter(i -> !i.isDeleted())
                .map(RecruitmentDto.InterviewResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RecruitmentDto.InterviewResponse> getInterviewsForApplication(UUID applicationId) {
        return interviewRepository.findByApplicationId(applicationId).stream()
                .map(RecruitmentDto.InterviewResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RecruitmentDto.InterviewResponse> getUpcomingInterviewsForInterviewer(UUID interviewerId) {
        return interviewRepository.findUpcomingByInterviewerId(interviewerId, LocalDateTime.now()).stream()
                .map(RecruitmentDto.InterviewResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RecruitmentDto.InterviewResponse> searchInterviews(
            UUID interviewerId,
            Interview.InterviewStatus status,
            Interview.InterviewType type,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable) {
        return interviewRepository.search(interviewerId, status, type, startDate, endDate, pageable)
                .map(RecruitmentDto.InterviewResponse::fromEntity);
    }

    @Override
    public RecruitmentDto.InterviewResponse confirmInterview(UUID interviewId) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new IllegalArgumentException("Interview not found: " + interviewId));

        interview.confirm();
        interview = interviewRepository.save(interview);
        return RecruitmentDto.InterviewResponse.fromEntity(interview);
    }

    @Override
    public RecruitmentDto.InterviewResponse startInterview(UUID interviewId) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new IllegalArgumentException("Interview not found: " + interviewId));

        interview.start();
        interview = interviewRepository.save(interview);
        return RecruitmentDto.InterviewResponse.fromEntity(interview);
    }

    @Override
    public RecruitmentDto.InterviewResponse completeInterview(UUID interviewId) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new IllegalArgumentException("Interview not found: " + interviewId));

        interview.complete();
        interview = interviewRepository.save(interview);
        return RecruitmentDto.InterviewResponse.fromEntity(interview);
    }

    @Override
    public RecruitmentDto.InterviewResponse submitFeedback(
            UUID interviewId, RecruitmentDto.InterviewFeedbackRequest feedback) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new IllegalArgumentException("Interview not found: " + interviewId));

        interview.submitFeedback(
                feedback.technicalRating(),
                feedback.communicationRating(),
                feedback.culturalFitRating(),
                feedback.overallRating(),
                feedback.recommendation(),
                feedback.feedback(),
                feedback.strengths(),
                feedback.concerns()
        );
        interview = interviewRepository.save(interview);

        // Update application overall interview rating
        Application application = interview.getApplication();
        Double avgRating = interviewRepository.getAverageRatingForCandidate(application.getCandidate().getId());
        if (avgRating != null) {
            application.setOverallInterviewRating(avgRating.intValue());
            applicationRepository.save(application);
        }

        return RecruitmentDto.InterviewResponse.fromEntity(interview);
    }

    @Override
    public RecruitmentDto.InterviewResponse cancelInterview(UUID interviewId, String reason) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new IllegalArgumentException("Interview not found: " + interviewId));

        interview.cancel(reason);
        interview = interviewRepository.save(interview);
        return RecruitmentDto.InterviewResponse.fromEntity(interview);
    }

    @Override
    public RecruitmentDto.InterviewResponse markAsNoShow(UUID interviewId) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new IllegalArgumentException("Interview not found: " + interviewId));

        interview.markAsNoShow();
        interview = interviewRepository.save(interview);
        return RecruitmentDto.InterviewResponse.fromEntity(interview);
    }

    @Override
    public RecruitmentDto.InterviewResponse rescheduleInterview(
            UUID interviewId, LocalDateTime newDateTime, String reason) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new IllegalArgumentException("Interview not found: " + interviewId));

        // Check for conflicts at new time
        LocalDateTime newEndTime = newDateTime.plusMinutes(interview.getDurationMinutes());
        List<Interview> conflicts = interviewRepository.findConflictingInterviews(
                interview.getInterviewerId(), newDateTime, newEndTime);

        // Exclude the current interview from conflicts
        conflicts = conflicts.stream()
                .filter(i -> !i.getId().equals(interviewId))
                .collect(Collectors.toList());

        if (!conflicts.isEmpty()) {
            throw new IllegalArgumentException("Interviewer has a conflicting interview at the new time");
        }

        interview.reschedule(newDateTime, reason);
        interview = interviewRepository.save(interview);
        return RecruitmentDto.InterviewResponse.fromEntity(interview);
    }

    // === Dashboard & Reporting ===

    @Override
    @Transactional(readOnly = true)
    public RecruitmentDto.RecruitmentDashboard getDashboard() {
        int openJobs = (int) jobPostingRepository.countByStatus(JobPosting.JobStatus.OPEN);
        int totalApplications = (int) applicationRepository.count();

        LocalDateTime weekStart = LocalDate.now().atStartOfDay();
        LocalDateTime weekEnd = weekStart.plusDays(7);
        List<Interview> weekInterviews = interviewRepository.findByDateRange(weekStart, weekEnd);
        int interviewsThisWeek = weekInterviews.size();

        List<Application> pendingOffers = applicationRepository.findPendingOffers(LocalDate.now());
        int offersPending = pendingOffers.size();

        List<RecruitmentDto.PipelineStage> pipeline = getPipelineSummary();

        Page<JobPosting> recentJobsPage = jobPostingRepository.findRecentJobs(PageRequest.of(0, 5));
        List<RecruitmentDto.JobPostingSummary> recentJobs = recentJobsPage.getContent().stream()
                .map(RecruitmentDto.JobPostingSummary::fromEntity)
                .collect(Collectors.toList());

        List<RecruitmentDto.InterviewResponse> upcomingInterviews = getTodaysInterviews();

        return new RecruitmentDto.RecruitmentDashboard(
                openJobs,
                totalApplications,
                interviewsThisWeek,
                offersPending,
                pipeline,
                recentJobs,
                upcomingInterviews
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<RecruitmentDto.PipelineStage> getPipelineSummary() {
        List<Object[]> results = applicationRepository.getPipelineSummary();
        return results.stream()
                .map(row -> new RecruitmentDto.PipelineStage(
                        (Application.RecruitmentStage) row[0],
                        ((Application.RecruitmentStage) row[0]).name().replace("_", " "),
                        ((Long) row[1]).intValue()
                ))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RecruitmentDto.InterviewResponse> getTodaysInterviews() {
        LocalDateTime dayStart = LocalDate.now().atStartOfDay();
        LocalDateTime dayEnd = dayStart.plusDays(1);
        return interviewRepository.findTodaysInterviews(dayStart, dayEnd).stream()
                .map(RecruitmentDto.InterviewResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RecruitmentDto.ApplicationResponse> getStaleApplications(int daysOld) {
        LocalDate cutoffDate = LocalDate.now().minusDays(daysOld);
        return applicationRepository.findStaleApplications(cutoffDate).stream()
                .map(RecruitmentDto.ApplicationResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
