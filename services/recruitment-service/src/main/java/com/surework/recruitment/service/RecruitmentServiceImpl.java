package com.surework.recruitment.service;

import com.surework.common.messaging.DomainEventPublisher;
import com.surework.common.messaging.event.RecruitmentEvent;
import com.surework.common.security.TenantContext;
import com.surework.recruitment.domain.*;
import com.surework.recruitment.domain.Client;
import com.surework.recruitment.dto.RecruitmentDto;
import com.surework.recruitment.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;
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
    private final ExternalJobPostingRepository externalJobPostingRepository;
    private final ClientRepository clientRepository;
    private final DomainEventPublisher eventPublisher;

    public RecruitmentServiceImpl(
            JobPostingRepository jobPostingRepository,
            CandidateRepository candidateRepository,
            ApplicationRepository applicationRepository,
            InterviewRepository interviewRepository,
            ExternalJobPostingRepository externalJobPostingRepository,
            ClientRepository clientRepository,
            DomainEventPublisher eventPublisher) {
        this.jobPostingRepository = jobPostingRepository;
        this.candidateRepository = candidateRepository;
        this.applicationRepository = applicationRepository;
        this.interviewRepository = interviewRepository;
        this.externalJobPostingRepository = externalJobPostingRepository;
        this.clientRepository = clientRepository;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Get the current tenant ID from context.
     * @throws com.surework.common.security.TenantNotSetException if tenant context is not available
     */
    private UUID getTenantId() {
        return TenantContext.requireTenantId();
    }

    /**
     * Resolve client name from client ID. Returns null if clientId is null or client not found.
     */
    private String resolveClientName(UUID clientId) {
        if (clientId == null) return null;
        return clientRepository.findById(clientId)
                .filter(c -> !c.isDeleted())
                .map(Client::getName)
                .orElse(null);
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

        // Client & compensation fields
        job.setClientId(request.clientId());
        if (request.clientVisibility() != null) {
            job.setClientVisibility(request.clientVisibility());
        }
        if (request.compensationType() != null) {
            job.setCompensationType(request.compensationType());
        }
        job.setSalaryCurrency(request.salaryCurrency() != null ? request.salaryCurrency() : "ZAR");
        job.setProjectName(request.projectName());

        // External portal publishing fields
        job.setCity(request.city());
        job.setProvince(request.province());
        job.setPostalCode(request.postalCode());
        job.setCountryCode(request.countryCode() != null ? request.countryCode() : "ZA");
        job.setIndustry(request.industry());
        job.setEducationLevel(request.educationLevel());
        job.setKeywords(request.keywords());
        job.setContractDuration(request.contractDuration());
        job.setPublishToExternal(request.publishToExternal());
        if (request.externalPortals() != null) {
            job.setExternalPortalSet(new java.util.HashSet<>(request.externalPortals()));
        }
        job.setCompanyMentionPreference(request.companyMentionPreference() != null
                ? request.companyMentionPreference()
                : JobPosting.CompanyMentionPreference.ANONYMOUS);

        // Tenant isolation: always set tenantId from context before saving
        job.setTenantId(getTenantId());

        job = jobPostingRepository.save(job);
        return RecruitmentDto.JobPostingResponse.fromEntity(job, resolveClientName(job.getClientId()));
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

        // Client & compensation fields
        job.setClientId(request.clientId());
        if (request.clientVisibility() != null) job.setClientVisibility(request.clientVisibility());
        if (request.compensationType() != null) job.setCompensationType(request.compensationType());
        if (request.salaryCurrency() != null) job.setSalaryCurrency(request.salaryCurrency());
        job.setProjectName(request.projectName());

        // External portal publishing fields
        if (request.city() != null) job.setCity(request.city());
        if (request.province() != null) job.setProvince(request.province());
        if (request.postalCode() != null) job.setPostalCode(request.postalCode());
        if (request.countryCode() != null) job.setCountryCode(request.countryCode());
        if (request.industry() != null) job.setIndustry(request.industry());
        if (request.educationLevel() != null) job.setEducationLevel(request.educationLevel());
        if (request.keywords() != null) job.setKeywords(request.keywords());
        if (request.contractDuration() != null) job.setContractDuration(request.contractDuration());
        job.setPublishToExternal(request.publishToExternal());
        if (request.externalPortals() != null) {
            job.setExternalPortalSet(new java.util.HashSet<>(request.externalPortals()));
        }
        if (request.companyMentionPreference() != null) {
            job.setCompanyMentionPreference(request.companyMentionPreference());
        }

        job = jobPostingRepository.save(job);
        return RecruitmentDto.JobPostingResponse.fromEntity(job, resolveClientName(job.getClientId()));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<RecruitmentDto.JobPostingResponse> getJob(UUID jobId) {
        return jobPostingRepository.findById(jobId)
                .filter(j -> !j.isDeleted())
                .map(j -> RecruitmentDto.JobPostingResponse.fromEntity(j, resolveClientName(j.getClientId())));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<JobPosting> getJobEntity(UUID jobId) {
        return jobPostingRepository.findById(jobId)
                .filter(j -> !j.isDeleted());
    }

    @Override
    @Transactional
    public JobPosting saveJobPosting(JobPosting job) {
        return jobPostingRepository.save(job);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<RecruitmentDto.JobPostingResponse> getJobByReference(String jobReference) {
        return jobPostingRepository.findByJobReference(jobReference)
                .map(j -> RecruitmentDto.JobPostingResponse.fromEntity(j, resolveClientName(j.getClientId())));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RecruitmentDto.JobPostingSummary> searchJobs(
            JobPosting.JobStatus status,
            UUID departmentId,
            JobPosting.EmploymentType employmentType,
            String location,
            String searchTerm,
            UUID clientId,
            Pageable pageable) {
        // Pass enum types directly to JPQL query (safe from SQL injection)
        return jobPostingRepository.search(status, departmentId, employmentType, location, searchTerm, clientId, pageable)
                .map(j -> RecruitmentDto.JobPostingSummary.fromEntity(j, resolveClientName(j.getClientId())));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RecruitmentDto.JobPostingSummary> getPublicJobs(Pageable pageable) {
        return jobPostingRepository.findPublicJobs(pageable)
                .map(j -> RecruitmentDto.JobPostingSummary.fromEntity(j, resolveClientName(j.getClientId())));
    }

    @Override
    public RecruitmentDto.JobPostingResponse publishJob(UUID jobId, LocalDate closingDate) {
        JobPosting job = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        job.publish(closingDate);
        job = jobPostingRepository.save(job);

        // Publish JobPostingPublished event
        eventPublisher.publish(new RecruitmentEvent.JobPostingPublished(
                UUID.randomUUID(),
                getTenantId(),
                Instant.now(),
                job.getId(),
                job.getTitle(),
                Instant.now()
        ));

        // If configured for external posting, also publish ExternalPostingRequested
        if (job.isPublishToExternal() && !job.getExternalPortalSet().isEmpty()) {
            List<String> portals = job.getExternalPortalSet().stream()
                    .map(Enum::name)
                    .toList();
            eventPublisher.publish(new RecruitmentEvent.ExternalPostingRequested(
                    UUID.randomUUID(),
                    getTenantId(),
                    Instant.now(),
                    job.getId(),
                    job.getJobReference(),
                    job.getTitle(),
                    portals
            ));
        }

        return RecruitmentDto.JobPostingResponse.fromEntity(job, resolveClientName(job.getClientId()));
    }

    @Override
    public RecruitmentDto.JobPostingResponse putJobOnHold(UUID jobId) {
        JobPosting job = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        job.putOnHold();
        job = jobPostingRepository.save(job);
        return RecruitmentDto.JobPostingResponse.fromEntity(job, resolveClientName(job.getClientId()));
    }

    @Override
    public RecruitmentDto.JobPostingResponse reopenJob(UUID jobId) {
        JobPosting job = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        job.reopen();
        job = jobPostingRepository.save(job);
        return RecruitmentDto.JobPostingResponse.fromEntity(job, resolveClientName(job.getClientId()));
    }

    @Override
    public RecruitmentDto.JobPostingResponse closeJob(UUID jobId) {
        JobPosting job = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        job.close();
        job = jobPostingRepository.save(job);
        return RecruitmentDto.JobPostingResponse.fromEntity(job, resolveClientName(job.getClientId()));
    }

    @Override
    public RecruitmentDto.JobPostingResponse markJobAsFilled(UUID jobId) {
        JobPosting job = jobPostingRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        job.markAsFilled();
        job = jobPostingRepository.save(job);
        return RecruitmentDto.JobPostingResponse.fromEntity(job, resolveClientName(job.getClientId()));
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

    @Override
    @Transactional(readOnly = true)
    public Optional<UUID> getHiringManagerUserId(UUID jobPostingId) {
        return jobPostingRepository.findById(jobPostingId)
                .filter(j -> !j.isDeleted())
                .map(JobPosting::getHiringManagerId)
                .filter(java.util.Objects::nonNull);
    }

    // === Client Operations ===

    @Override
    public RecruitmentDto.ClientResponse createClient(RecruitmentDto.CreateClientRequest request) {
        Client client = new Client();
        client.setTenantId(getTenantId());
        client.setName(request.name());
        client.setIndustry(request.industry());
        client.setContactPerson(request.contactPerson());
        client.setContactEmail(request.contactEmail());
        client.setContactPhone(request.contactPhone());
        client.setWebsite(request.website());
        client.setNotes(request.notes());
        client.setActive(true);

        client = clientRepository.save(client);
        return RecruitmentDto.ClientResponse.fromEntity(client);
    }

    @Override
    public RecruitmentDto.ClientResponse updateClient(UUID clientId, RecruitmentDto.UpdateClientRequest request) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new IllegalArgumentException("Client not found: " + clientId));

        if (request.name() != null) client.setName(request.name());
        if (request.industry() != null) client.setIndustry(request.industry());
        if (request.contactPerson() != null) client.setContactPerson(request.contactPerson());
        if (request.contactEmail() != null) client.setContactEmail(request.contactEmail());
        if (request.contactPhone() != null) client.setContactPhone(request.contactPhone());
        if (request.website() != null) client.setWebsite(request.website());
        if (request.notes() != null) client.setNotes(request.notes());
        if (request.active() != null) client.setActive(request.active());

        client = clientRepository.save(client);
        return RecruitmentDto.ClientResponse.fromEntity(client);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<RecruitmentDto.ClientResponse> getClient(UUID clientId) {
        return clientRepository.findById(clientId)
                .filter(c -> !c.isDeleted())
                .map(RecruitmentDto.ClientResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RecruitmentDto.ClientResponse> searchClients(Boolean active, String searchTerm, Pageable pageable) {
        return clientRepository.search(active, searchTerm, pageable)
                .map(RecruitmentDto.ClientResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RecruitmentDto.ClientSummary> getActiveClients() {
        return clientRepository.findAllActive().stream()
                .map(RecruitmentDto.ClientSummary::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public void deactivateClient(UUID clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new IllegalArgumentException("Client not found: " + clientId));
        client.setActive(false);
        clientRepository.save(client);
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

        // Tenant isolation: always set tenantId from context before saving
        candidate.setTenantId(getTenantId());

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
        // Pass enum type directly to JPQL query (safe from SQL injection)
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

        // Tenant isolation: always set tenantId from context before saving
        application.setTenantId(getTenantId());

        application = applicationRepository.save(application);

        // Increment application count on job
        job.incrementApplications();
        jobPostingRepository.save(job);

        // Publish ApplicationReceived event
        eventPublisher.publish(new RecruitmentEvent.ApplicationReceived(
                UUID.randomUUID(),
                getTenantId(),
                Instant.now(),
                application.getId(),
                job.getId(),
                candidate.getFullName(),
                candidate.getEmail()
        ));

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

        // Publish OfferExtended event with candidate email and offer token for email delivery
        JobPosting job = application.getJobPosting();
        String candidateEmail = application.getApplicantEmail();
        String candidateName = application.getApplicantFullName();

        eventPublisher.publish(new RecruitmentEvent.OfferExtended(
                UUID.randomUUID(),
                getTenantId(),
                Instant.now(),
                application.getId(),
                job.getId(),
                candidateName,
                job.getHiringManagerId(),
                salary,
                expiryDate.atStartOfDay().toInstant(ZoneOffset.UTC),
                startDate.atStartOfDay().toInstant(ZoneOffset.UTC),
                candidateEmail,
                application.getOfferToken(),
                job.getTitle(),
                job.getDepartmentName(),
                job.getLocation(),
                job.getEmploymentType().name(),
                job.getSalaryCurrency(),
                "08:00 - 17:00, Monday to Friday"
        ));

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

        // Publish InterviewScheduled event
        eventPublisher.publish(new RecruitmentEvent.InterviewScheduled(
                UUID.randomUUID(),
                getTenantId(),
                Instant.now(),
                interview.getId(),
                application.getId(),
                application.getJobPosting().getId(),
                application.getCandidate().getFullName(),
                interview.getInterviewerId(),
                interview.getInterviewerName(),
                interview.getScheduledAt().toInstant(ZoneOffset.UTC),
                interview.getInterviewType().name(),
                interview.getLocationType().name()
        ));

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
                .map(j -> RecruitmentDto.JobPostingSummary.fromEntity(j, resolveClientName(j.getClientId())))
                .collect(Collectors.toList());

        List<RecruitmentDto.InterviewResponse> upcomingInterviews = getUpcomingInterviews();

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

    @Transactional(readOnly = true)
    public List<RecruitmentDto.InterviewResponse> getUpcomingInterviews() {
        LocalDateTime now = LocalDate.now().atStartOfDay();
        return interviewRepository.findAllUpcoming(now).stream()
                .map(RecruitmentDto.InterviewResponse::fromEntity)
                .limit(10) // Limit for dashboard display
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

    // === Analytics ===

    @Override
    @Transactional(readOnly = true)
    public RecruitmentDto.PortalPerformanceStats getPortalPerformanceStats() {
        List<Object[]> rows = externalJobPostingRepository.getPortalPerformanceSummary();
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        long totalPosted = 0, totalActive = 0, totalFailed = 0, totalExpired = 0;
        List<RecruitmentDto.PortalDetail> portals = new ArrayList<>();

        for (Object[] row : rows) {
            JobPosting.JobPortal portal = (JobPosting.JobPortal) row[0];
            long total = ((Number) row[1]).longValue();
            long active = ((Number) row[2]).longValue();
            long failed = ((Number) row[3]).longValue();
            long expired = ((Number) row[4]).longValue();
            long postedToday = externalJobPostingRepository.countPostedTodayByPortal(portal, startOfDay);

            // Estimate avg days live from active postings
            double avgDaysLive = 0.0;
            List<ExternalJobPosting> activePostings = externalJobPostingRepository
                    .findActiveByJobPostingId(null, LocalDateTime.now());
            // Calculate from all active postings for this portal
            List<ExternalJobPosting> portalPostings = externalJobPostingRepository.findByStatus(
                    ExternalJobPosting.ExternalPostingStatus.POSTED);
            long daysSum = 0;
            long count = 0;
            for (ExternalJobPosting ep : portalPostings) {
                if (ep.getPortal() == portal && ep.getPostedAt() != null) {
                    daysSum += ChronoUnit.DAYS.between(ep.getPostedAt(), LocalDateTime.now());
                    count++;
                }
            }
            if (count > 0) avgDaysLive = (double) daysSum / count;

            portals.add(new RecruitmentDto.PortalDetail(
                    portal.name(), total, active, failed, expired, avgDaysLive, postedToday
            ));

            totalPosted += total;
            totalActive += active;
            totalFailed += failed;
            totalExpired += expired;
        }

        return new RecruitmentDto.PortalPerformanceStats(portals, totalPosted, totalActive, totalFailed, totalExpired);
    }

    @Override
    @Transactional(readOnly = true)
    public RecruitmentDto.AdvertPerformanceStats getAdvertPerformanceStats() {
        Page<JobPosting> page = jobPostingRepository.findAdvertPerformanceData(
                org.springframework.data.domain.PageRequest.of(0, 100));
        List<JobPosting> jobs = page.getContent();

        int totalViews = 0, totalApplications = 0;
        double totalConversion = 0, totalDaysLive = 0;
        int conversionCount = 0;

        List<RecruitmentDto.AdvertDetail> adverts = new ArrayList<>();
        for (JobPosting job : jobs) {
            int views = job.getViewCount();
            int apps = job.getApplicationCount();
            double conversionRate = views > 0 ? (apps * 100.0 / views) : 0;
            long daysLive = 0;
            if (job.getPostingDate() != null) {
                LocalDate end = job.getClosingDate() != null && job.getClosingDate().isBefore(LocalDate.now())
                        ? job.getClosingDate() : LocalDate.now();
                daysLive = ChronoUnit.DAYS.between(job.getPostingDate(), end);
            }

            adverts.add(new RecruitmentDto.AdvertDetail(
                    job.getId(),
                    job.getTitle(),
                    job.getStatus().name(),
                    job.getDepartmentName(),
                    views, apps, Math.round(conversionRate * 10) / 10.0,
                    job.getPostingDate() != null ? job.getPostingDate().toString() : null,
                    job.getClosingDate() != null ? job.getClosingDate().toString() : null,
                    daysLive
            ));

            totalViews += views;
            totalApplications += apps;
            if (views > 0) {
                totalConversion += conversionRate;
                conversionCount++;
            }
            totalDaysLive += daysLive;
        }

        double avgConversion = conversionCount > 0 ? totalConversion / conversionCount : 0;
        double avgDays = !jobs.isEmpty() ? totalDaysLive / jobs.size() : 0;

        return new RecruitmentDto.AdvertPerformanceStats(
                adverts,
                Math.round(avgConversion * 10) / 10.0,
                Math.round(avgDays * 10) / 10.0,
                totalViews,
                totalApplications
        );
    }

    @Override
    @Transactional(readOnly = true)
    public RecruitmentDto.SourceEffectivenessStats getSourceEffectivenessStats() {
        List<Object[]> appsBySource = applicationRepository.countBySourceGrouped();
        List<Object[]> hiredBySource = applicationRepository.countHiredBySource();
        List<Application> hiredApps = applicationRepository.findHiredApplicationsWithDates();

        Map<String, Long> applicationsBySource = new LinkedHashMap<>();
        long totalApplications = 0;
        for (Object[] row : appsBySource) {
            String source = (String) row[0];
            long count = ((Number) row[1]).longValue();
            applicationsBySource.put(source, count);
            totalApplications += count;
        }

        Map<String, Long> hiredBySourceMap = new LinkedHashMap<>();
        long totalHires = 0;
        for (Object[] row : hiredBySource) {
            String source = (String) row[0];
            long count = ((Number) row[1]).longValue();
            hiredBySourceMap.put(source, count);
            totalHires += count;
        }

        // Conversion rates
        Map<String, Double> conversionRateBySource = new LinkedHashMap<>();
        for (Map.Entry<String, Long> entry : applicationsBySource.entrySet()) {
            long hired = hiredBySourceMap.getOrDefault(entry.getKey(), 0L);
            double rate = entry.getValue() > 0 ? (hired * 100.0 / entry.getValue()) : 0;
            conversionRateBySource.put(entry.getKey(), Math.round(rate * 10) / 10.0);
        }

        // Avg days to hire by source
        Map<String, List<Long>> daysBySource = new HashMap<>();
        for (Application app : hiredApps) {
            if (app.getSource() != null && app.getApplicationDate() != null && app.getOfferDate() != null) {
                long days = ChronoUnit.DAYS.between(app.getApplicationDate(), app.getOfferDate());
                daysBySource.computeIfAbsent(app.getSource(), k -> new ArrayList<>()).add(days);
            }
        }
        Map<String, Double> avgDaysToHireBySource = new LinkedHashMap<>();
        for (Map.Entry<String, List<Long>> entry : daysBySource.entrySet()) {
            double avg = entry.getValue().stream().mapToLong(Long::longValue).average().orElse(0);
            avgDaysToHireBySource.put(entry.getKey(), Math.round(avg * 10) / 10.0);
        }

        return new RecruitmentDto.SourceEffectivenessStats(
                applicationsBySource, hiredBySourceMap, conversionRateBySource,
                avgDaysToHireBySource, totalApplications, totalHires
        );
    }

    @Override
    @Transactional(readOnly = true)
    public RecruitmentDto.OfferAcceptanceStats getOfferAcceptanceStats() {
        List<Object[]> offerStats = applicationRepository.getOfferStats();
        List<Object[]> monthlyTrend = applicationRepository.getOfferTrendByMonth();

        long totalOffersMade = 0, totalAccepted = 0, totalDeclined = 0;
        for (Object[] row : offerStats) {
            Application.ApplicationStatus status = (Application.ApplicationStatus) row[0];
            long count = ((Number) row[1]).longValue();
            switch (status) {
                case OFFER_MADE -> totalOffersMade += count;
                case OFFER_ACCEPTED -> totalAccepted += count;
                case OFFER_DECLINED -> totalDeclined += count;
                case HIRED -> totalAccepted += count;
                default -> {}
            }
        }

        long allOffers = totalOffersMade + totalAccepted + totalDeclined;
        double acceptanceRate = allOffers > 0 ? (totalAccepted * 100.0 / allOffers) : 0;

        // Avg days to accept from hired applications
        List<Application> hiredApps = applicationRepository.findHiredApplicationsWithDates();
        double avgDaysToAccept = 0;
        long daysCount = 0;
        for (Application app : hiredApps) {
            if (app.getOfferDate() != null && app.getApplicationDate() != null) {
                // Use offer date to expected start or now as proxy for acceptance
                long days = ChronoUnit.DAYS.between(app.getOfferDate(),
                        app.getExpectedStartDate() != null ? app.getExpectedStartDate() : LocalDate.now());
                if (days >= 0) {
                    avgDaysToAccept += days;
                    daysCount++;
                }
            }
        }
        if (daysCount > 0) avgDaysToAccept = avgDaysToAccept / daysCount;

        // Monthly trend
        List<RecruitmentDto.OfferTrend> trends = new ArrayList<>();
        for (Object[] row : monthlyTrend) {
            String month = (String) row[0];
            long offers = ((Number) row[1]).longValue();
            long accepted = ((Number) row[2]).longValue();
            long declined = ((Number) row[3]).longValue();
            double rate = offers > 0 ? (accepted * 100.0 / offers) : 0;
            trends.add(new RecruitmentDto.OfferTrend(
                    month, offers, accepted, declined, Math.round(rate * 10) / 10.0
            ));
        }

        return new RecruitmentDto.OfferAcceptanceStats(
                allOffers, totalAccepted, totalDeclined,
                Math.round(acceptanceRate * 10) / 10.0,
                Math.round(avgDaysToAccept * 10) / 10.0,
                Collections.emptyMap(), // acceptanceRateByDepartment - would need join query
                trends
        );
    }
}
