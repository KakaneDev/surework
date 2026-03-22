import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  getJobStatusConfig,
  getCandidateStatusConfig,
  getApplicationStageConfig,
  getInterviewStatusConfig,
  getRecommendationConfig,
  getStatusHexColors,
  getVariantClasses,
  HexColorPair
} from '@shared/ui/status-config';

// === Enums ===

export type JobStatus = 'DRAFT' | 'OPEN' | 'ON_HOLD' | 'CLOSED' | 'FILLED' | 'CANCELLED';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'TEMPORARY' | 'INTERNSHIP' | 'FREELANCE';
export type CandidateStatus = 'ACTIVE' | 'INACTIVE' | 'HIRED' | 'BLACKLISTED' | 'ARCHIVED';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
export type ApplicationStatus = 'NEW' | 'IN_REVIEW' | 'SCREENED' | 'SHORTLISTED' | 'INTERVIEWING' | 'OFFER_MADE' | 'OFFER_ACCEPTED' | 'OFFER_DECLINED' | 'HIRED' | 'REJECTED' | 'WITHDRAWN' | 'ON_HOLD';
export type RecruitmentStage = 'NEW' | 'SCREENING' | 'PHONE_SCREEN' | 'ASSESSMENT' | 'FIRST_INTERVIEW' | 'SECOND_INTERVIEW' | 'FINAL_INTERVIEW' | 'REFERENCE_CHECK' | 'BACKGROUND_CHECK' | 'OFFER' | 'ONBOARDING' | 'COMPLETED';
export type InterviewType = 'PHONE_SCREEN' | 'VIDEO_CALL' | 'IN_PERSON' | 'TECHNICAL' | 'BEHAVIORAL' | 'PANEL' | 'GROUP' | 'CASE_STUDY' | 'FINAL';
export type LocationType = 'ONSITE' | 'REMOTE' | 'HYBRID';
export type InterviewStatus = 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'FEEDBACK_PENDING' | 'FEEDBACK_SUBMITTED' | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULED';
export type Recommendation = 'STRONG_HIRE' | 'HIRE' | 'LEAN_HIRE' | 'NEUTRAL' | 'LEAN_NO_HIRE' | 'NO_HIRE' | 'STRONG_NO_HIRE';

// External Portal Publishing Types
export type Province = 'GAUTENG' | 'WESTERN_CAPE' | 'KWAZULU_NATAL' | 'EASTERN_CAPE' | 'FREE_STATE' | 'LIMPOPO' | 'MPUMALANGA' | 'NORTH_WEST' | 'NORTHERN_CAPE';
export type Industry = 'IT_SOFTWARE' | 'FINANCE_BANKING' | 'HEALTHCARE' | 'RETAIL' | 'MANUFACTURING' | 'CONSTRUCTION' | 'EDUCATION' | 'HOSPITALITY_TOURISM' | 'LOGISTICS_TRANSPORT' | 'LEGAL' | 'MARKETING_ADVERTISING' | 'HUMAN_RESOURCES' | 'ENGINEERING' | 'MINING' | 'AGRICULTURE' | 'TELECOMMUNICATIONS' | 'REAL_ESTATE' | 'MEDIA_ENTERTAINMENT' | 'GOVERNMENT_PUBLIC_SECTOR' | 'NON_PROFIT' | 'OTHER';
export type EducationLevel = 'NO_REQUIREMENT' | 'MATRIC' | 'CERTIFICATE' | 'DIPLOMA' | 'DEGREE' | 'HONOURS' | 'MASTERS' | 'DOCTORATE';
export type CompanyMentionPreference = 'ANONYMOUS' | 'NAMED_BY_SUREWORK' | 'DIRECT_MENTION';
export type JobPortal = 'PNET' | 'LINKEDIN' | 'INDEED' | 'CAREERS24';
export type ExternalPostingStatus = 'PENDING' | 'QUEUED' | 'POSTING' | 'POSTED' | 'FAILED' | 'REQUIRES_MANUAL' | 'EXPIRED' | 'REMOVED';

// Client & Compensation Types
export type CompensationType = 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ANNUAL';
export type ClientVisibility = 'SHOW_NAME' | 'CONFIDENTIAL' | 'HIDDEN';

// === Client DTOs ===

export interface CreateClientRequest {
  name: string;
  industry?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  notes?: string;
}

export interface UpdateClientRequest {
  name?: string;
  industry?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  notes?: string;
  active?: boolean;
}

export interface Client {
  id: string;
  name: string;
  industry?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
}

export interface ClientSummary {
  id: string;
  name: string;
  industry?: string;
  active: boolean;
}

// === Page Response ===

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// === Job Posting DTOs ===

export interface CreateJobRequest {
  title: string;
  departmentId?: string;
  departmentName?: string;
  location?: string;
  employmentType: EmploymentType;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  qualifications?: string;
  skills?: string;
  experienceYearsMin?: number;
  experienceYearsMax?: number;
  salaryMin?: number;
  salaryMax?: number;
  showSalary: boolean;
  benefits?: string;
  positionsAvailable: number;
  hiringManagerId?: string;
  hiringManagerName?: string;
  recruiterId?: string;
  recruiterName?: string;
  internalOnly: boolean;
  remote: boolean;
  // Client & Compensation fields
  clientId?: string;
  clientVisibility?: ClientVisibility;
  compensationType?: CompensationType;
  salaryCurrency?: string;
  projectName?: string;
  // External portal publishing fields
  city?: string;
  province?: Province;
  postalCode?: string;
  countryCode?: string;
  industry?: Industry;
  educationLevel?: EducationLevel;
  keywords?: string;
  contractDuration?: string;
  publishToExternal?: boolean;
  externalPortals?: JobPortal[];
  companyMentionPreference?: CompanyMentionPreference;
}

export interface UpdateJobRequest {
  title?: string;
  location?: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  qualifications?: string;
  skills?: string;
  experienceYearsMin?: number;
  experienceYearsMax?: number;
  salaryMin?: number;
  salaryMax?: number;
  showSalary?: boolean;
  benefits?: string;
  positionsAvailable?: number;
  internalOnly?: boolean;
  remote?: boolean;
  // Client & Compensation fields
  clientId?: string;
  clientVisibility?: ClientVisibility;
  compensationType?: CompensationType;
  salaryCurrency?: string;
  projectName?: string;
  // External portal publishing fields
  city?: string;
  province?: Province;
  postalCode?: string;
  countryCode?: string;
  industry?: Industry;
  educationLevel?: EducationLevel;
  keywords?: string;
  contractDuration?: string;
  publishToExternal?: boolean;
  externalPortals?: JobPortal[];
  companyMentionPreference?: CompanyMentionPreference;
}

export interface JobPosting {
  id: string;
  jobReference: string;
  title: string;
  departmentId?: string;
  departmentName?: string;
  location?: string;
  employmentType: EmploymentType;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  qualifications?: string;
  skills?: string;
  experienceYearsMin?: number;
  experienceYearsMax?: number;
  salaryRange?: string;
  salaryMin?: number;
  salaryMax?: number;
  showSalary: boolean;
  benefits?: string;
  status: JobStatus;
  postingDate?: string;
  closingDate?: string;
  positionsAvailable: number;
  positionsFilled: number;
  hiringManagerId?: string;
  hiringManagerName?: string;
  recruiterId?: string;
  recruiterName?: string;
  internalOnly: boolean;
  remote: boolean;
  // Client & Compensation fields
  clientId?: string;
  clientName?: string;
  clientVisibility?: ClientVisibility;
  compensationType?: CompensationType;
  salaryCurrency?: string;
  projectName?: string;
  applicationCount: number;
  viewCount: number;
  createdAt: string;
  // External portal publishing fields
  city?: string;
  province?: Province;
  postalCode?: string;
  countryCode?: string;
  industry?: Industry;
  educationLevel?: EducationLevel;
  keywords?: string;
  contractDuration?: string;
  publishToExternal?: boolean;
  externalPortals?: JobPortal[];
  companyMentionPreference?: CompanyMentionPreference;
}

export interface JobPostingSummary {
  id: string;
  jobReference: string;
  title: string;
  departmentName?: string;
  location?: string;
  employmentType: EmploymentType;
  status: JobStatus;
  closingDate?: string;
  applicationCount: number;
  remote: boolean;
  // Client & Compensation fields
  clientName?: string;
  compensationType?: CompensationType;
  projectName?: string;
}

// === Candidate DTOs ===

export interface CreateCandidateRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  idNumber?: string;
  dateOfBirth?: string;
  gender?: Gender;
  nationality?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  currentJobTitle?: string;
  currentEmployer?: string;
  yearsExperience?: number;
  highestQualification?: string;
  fieldOfStudy?: string;
  skills?: string;
  languages?: string;
  expectedSalary?: number;
  noticePeriodDays?: number;
  availableFrom?: string;
  willingToRelocate: boolean;
  preferredLocations?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  source?: string;
  referredBy?: string;
}

export interface UpdateCandidateRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  currentJobTitle?: string;
  currentEmployer?: string;
  yearsExperience?: number;
  skills?: string;
  expectedSalary?: number;
  noticePeriodDays?: number;
  willingToRelocate?: boolean;
  notes?: string;
}

export interface Candidate {
  id: string;
  candidateReference: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  idNumber?: string;
  dateOfBirth?: string;
  gender?: Gender;
  nationality?: string;
  city?: string;
  province?: string;
  currentJobTitle?: string;
  currentEmployer?: string;
  yearsExperience?: number;
  experienceLevel?: string;
  highestQualification?: string;
  fieldOfStudy?: string;
  skills?: string;
  languages?: string;
  expectedSalary?: number;
  noticePeriodDays?: number;
  availableFrom?: string;
  willingToRelocate: boolean;
  preferredLocations?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  status: CandidateStatus;
  source?: string;
  internalCandidate: boolean;
  blacklisted: boolean;
  createdAt: string;
}

export interface CandidateSummary {
  id: string;
  candidateReference: string;
  fullName: string;
  email: string;
  currentJobTitle?: string;
  yearsExperience?: number;
}

// === Application DTOs ===

export interface CreateApplicationRequest {
  candidateId: string;
  jobId: string;
  coverLetter?: string;
  source?: string;
}

export interface Application {
  id: string;
  applicationReference: string;
  candidate: CandidateSummary;
  job: JobPostingSummary;
  applicationDate: string;
  status: ApplicationStatus;
  stage: RecruitmentStage;
  coverLetter?: string;
  screeningScore?: number;
  assessmentScore?: number;
  interviewCount: number;
  overallInterviewRating?: number;
  offerSalary?: number;
  offerDate?: string;
  offerExpiryDate?: string;
  expectedStartDate?: string;
  rejectionReason?: string;
  overallRating?: number;
  starred: boolean;
  source?: string;
  daysSinceApplication: number;
  createdAt: string;
}

// === Interview DTOs ===

export interface ScheduleInterviewRequest {
  applicationId: string;
  interviewType: InterviewType;
  scheduledAt: string;
  durationMinutes: number;
  locationType: LocationType;
  locationDetails?: string;
  meetingLink?: string;
  interviewerId: string;
  interviewerName?: string;
  interviewerEmail?: string;
  panelInterviewerIds?: string;
  panelInterviewerNames?: string;
  agenda?: string;
  topicsToCover?: string;
}

export interface InterviewFeedback {
  technicalRating?: number;
  communicationRating?: number;
  culturalFitRating?: number;
  overallRating?: number;
  recommendation?: Recommendation;
  feedback?: string;
  strengths?: string;
  concerns?: string;
}

export interface Interview {
  id: string;
  applicationId: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  interviewType: InterviewType;
  roundNumber: number;
  scheduledAt: string;
  durationMinutes: number;
  endTime: string;
  locationType: LocationType;
  locationDetails?: string;
  meetingLink?: string;
  interviewerId: string;
  interviewerName?: string;
  status: InterviewStatus;
  technicalRating?: number;
  communicationRating?: number;
  culturalFitRating?: number;
  overallRating?: number;
  averageRating?: number;
  recommendation?: Recommendation;
  feedback?: string;
  isUpcoming: boolean;
  needsFeedback: boolean;
  createdAt: string;
}

// === Dashboard DTOs ===

export interface PipelineStage {
  stage: RecruitmentStage;
  stageName: string;
  count: number;
}

export interface RecruitmentDashboard {
  openJobs: number;
  totalApplications: number;
  interviewsThisWeek: number;
  offersPending: number;
  pipeline: PipelineStage[];
  recentJobs: JobPostingSummary[];
  upcomingInterviews: Interview[];
}

// === External Job Posting DTOs ===

export interface ExternalJobPosting {
  id: string;
  jobPostingId: string;
  jobTitle: string;
  jobReference: string;
  portal: JobPortal;
  externalJobId?: string;
  externalUrl?: string;
  status: ExternalPostingStatus;
  errorMessage?: string;
  retryCount: number;
  postedAt?: string;
  expiresAt?: string;
  lastCheckedAt?: string;
  createdAt: string;
}

export interface ExternalPostingSummary {
  id: string;
  portal: JobPortal;
  status: ExternalPostingStatus;
  externalUrl?: string;
  postedAt?: string;
}

export interface ExternalPostingStats {
  totalPending: number;
  totalPosted: number;
  totalFailed: number;
  totalRequiresManual: number;
  byPortal: PortalStats[];
}

export interface PortalStats {
  portal: JobPortal;
  pending: number;
  posted: number;
  failed: number;
  postedToday: number;
}

export interface PortalStatus {
  portal: JobPortal;
  connectionStatus: 'NOT_CONFIGURED' | 'CONNECTED' | 'SESSION_EXPIRED' | 'INVALID_CREDENTIALS' | 'RATE_LIMITED' | 'CAPTCHA_REQUIRED' | 'ERROR';
  isActive: boolean;
  dailyRateLimit: number;
  postsToday: number;
  lastVerifiedAt?: string;
  lastError?: string;
}

export interface PostToPortalsRequest {
  companyMentionPreference?: CompanyMentionPreference;
}

export interface ExternalPostingAudit {
  id: string;
  externalJobPostingId: string;
  action: string;
  details?: string;
  performedBy?: string;
  createdAt: string;
}

// === Analytics DTOs ===

export interface PortalPerformanceStats {
  portals: PortalDetail[];
  totalPosted: number;
  totalActive: number;
  totalFailed: number;
  totalExpired: number;
}

export interface PortalDetail {
  portal: string;
  totalPostings: number;
  activePostings: number;
  failedPostings: number;
  expiredPostings: number;
  avgDaysLive: number;
  postsToday: number;
}

export interface AdvertPerformanceStats {
  adverts: AdvertDetail[];
  avgConversionRate: number;
  avgDaysLive: number;
  totalViews: number;
  totalApplications: number;
}

export interface AdvertDetail {
  jobId: string;
  title: string;
  status: string;
  departmentName: string;
  views: number;
  applications: number;
  conversionRate: number;
  postingDate?: string;
  closingDate?: string;
  daysLive: number;
}

export interface SourceEffectivenessStats {
  applicationsBySource: Record<string, number>;
  hiredBySource: Record<string, number>;
  conversionRateBySource: Record<string, number>;
  avgDaysToHireBySource: Record<string, number>;
  totalApplications: number;
  totalHires: number;
}

export interface OfferAcceptanceStats {
  totalOffersMade: number;
  totalAccepted: number;
  totalDeclined: number;
  acceptanceRatePercent: number;
  avgDaysToAccept: number;
  acceptanceRateByDepartment: Record<string, number>;
  monthlyTrend: OfferTrend[];
}

export interface OfferTrend {
  month: string;
  offers: number;
  accepted: number;
  declined: number;
  acceptanceRate: number;
}

/**
 * Service for recruitment API operations.
 */
@Injectable({
  providedIn: 'root'
})
export class RecruitmentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/recruitment`;

  // === Job Posting Methods ===

  /**
   * Create a new job posting.
   */
  createJob(request: CreateJobRequest): Observable<JobPosting> {
    return this.http.post<JobPosting>(`${this.apiUrl}/jobs`, request);
  }

  /**
   * Update a job posting.
   */
  updateJob(jobId: string, request: UpdateJobRequest): Observable<JobPosting> {
    return this.http.put<JobPosting>(`${this.apiUrl}/jobs/${jobId}`, request);
  }

  /**
   * Get a job posting by ID.
   */
  getJob(jobId: string): Observable<JobPosting> {
    return this.http.get<JobPosting>(`${this.apiUrl}/jobs/${jobId}`);
  }

  /**
   * Get a job posting by reference.
   */
  getJobByReference(jobReference: string): Observable<JobPosting> {
    return this.http.get<JobPosting>(`${this.apiUrl}/jobs/reference/${jobReference}`);
  }

  /**
   * Search job postings.
   */
  searchJobs(
    page: number = 0,
    size: number = 10,
    status?: JobStatus,
    departmentId?: string,
    employmentType?: EmploymentType,
    location?: string,
    searchTerm?: string,
    clientId?: string
  ): Observable<PageResponse<JobPostingSummary>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) params = params.set('status', status);
    if (departmentId) params = params.set('departmentId', departmentId);
    if (employmentType) params = params.set('employmentType', employmentType);
    if (location) params = params.set('location', location);
    if (searchTerm) params = params.set('searchTerm', searchTerm);
    if (clientId) params = params.set('clientId', clientId);

    return this.http.get<PageResponse<JobPostingSummary>>(`${this.apiUrl}/jobs`, { params });
  }

  /**
   * Get public job postings.
   */
  getPublicJobs(page: number = 0, size: number = 10): Observable<PageResponse<JobPostingSummary>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<JobPostingSummary>>(`${this.apiUrl}/jobs/public`, { params });
  }

  /**
   * Publish a job posting.
   */
  publishJob(jobId: string, closingDate: string): Observable<JobPosting> {
    const params = new HttpParams().set('closingDate', closingDate);
    return this.http.post<JobPosting>(`${this.apiUrl}/jobs/${jobId}/publish`, null, { params });
  }

  /**
   * Put a job on hold.
   */
  putJobOnHold(jobId: string): Observable<JobPosting> {
    return this.http.post<JobPosting>(`${this.apiUrl}/jobs/${jobId}/hold`, null);
  }

  /**
   * Reopen a job posting.
   */
  reopenJob(jobId: string): Observable<JobPosting> {
    return this.http.post<JobPosting>(`${this.apiUrl}/jobs/${jobId}/reopen`, null);
  }

  /**
   * Close a job posting.
   */
  closeJob(jobId: string): Observable<JobPosting> {
    return this.http.post<JobPosting>(`${this.apiUrl}/jobs/${jobId}/close`, null);
  }

  /**
   * Mark a job as filled.
   */
  markJobAsFilled(jobId: string): Observable<JobPosting> {
    return this.http.post<JobPosting>(`${this.apiUrl}/jobs/${jobId}/fill`, null);
  }

  /**
   * Cancel a job posting.
   */
  cancelJob(jobId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/jobs/${jobId}`);
  }

  /**
   * Increment job views.
   */
  incrementJobViews(jobId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/jobs/${jobId}/view`, null);
  }

  // === Candidate Methods ===

  /**
   * Create a new candidate.
   */
  createCandidate(request: CreateCandidateRequest): Observable<Candidate> {
    return this.http.post<Candidate>(`${this.apiUrl}/candidates`, request);
  }

  /**
   * Update a candidate.
   */
  updateCandidate(candidateId: string, request: UpdateCandidateRequest): Observable<Candidate> {
    return this.http.put<Candidate>(`${this.apiUrl}/candidates/${candidateId}`, request);
  }

  /**
   * Get a candidate by ID.
   */
  getCandidate(candidateId: string): Observable<Candidate> {
    return this.http.get<Candidate>(`${this.apiUrl}/candidates/${candidateId}`);
  }

  /**
   * Get a candidate by email.
   */
  getCandidateByEmail(email: string): Observable<Candidate> {
    return this.http.get<Candidate>(`${this.apiUrl}/candidates/email/${email}`);
  }

  /**
   * Search candidates.
   */
  searchCandidates(
    page: number = 0,
    size: number = 10,
    status?: CandidateStatus,
    searchTerm?: string
  ): Observable<PageResponse<Candidate>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) params = params.set('status', status);
    if (searchTerm) params = params.set('searchTerm', searchTerm);

    return this.http.get<PageResponse<Candidate>>(`${this.apiUrl}/candidates`, { params });
  }

  /**
   * Blacklist a candidate.
   */
  blacklistCandidate(candidateId: string, reason: string): Observable<void> {
    const params = new HttpParams().set('reason', reason);
    return this.http.post<void>(`${this.apiUrl}/candidates/${candidateId}/blacklist`, null, { params });
  }

  /**
   * Remove a candidate from blacklist.
   */
  removeFromBlacklist(candidateId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/candidates/${candidateId}/blacklist`);
  }

  /**
   * Archive a candidate.
   */
  archiveCandidate(candidateId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/candidates/${candidateId}/archive`, null);
  }

  // === Application Methods ===

  /**
   * Create an application.
   */
  createApplication(request: CreateApplicationRequest): Observable<Application> {
    return this.http.post<Application>(`${this.apiUrl}/applications`, request);
  }

  /**
   * Get an application by ID.
   */
  getApplication(applicationId: string): Observable<Application> {
    return this.http.get<Application>(`${this.apiUrl}/applications/${applicationId}`);
  }

  /**
   * Get an application by reference.
   */
  getApplicationByReference(reference: string): Observable<Application> {
    return this.http.get<Application>(`${this.apiUrl}/applications/reference/${reference}`);
  }

  /**
   * Get applications for a job.
   */
  getApplicationsForJob(jobId: string): Observable<Application[]> {
    return this.http.get<Application[]>(`${this.apiUrl}/jobs/${jobId}/applications`);
  }

  /**
   * Get applications for a candidate.
   */
  getApplicationsForCandidate(candidateId: string): Observable<Application[]> {
    return this.http.get<Application[]>(`${this.apiUrl}/candidates/${candidateId}/applications`);
  }

  /**
   * Search applications.
   */
  searchApplications(
    page: number = 0,
    size: number = 10,
    jobId?: string,
    candidateId?: string,
    status?: ApplicationStatus,
    stage?: RecruitmentStage
  ): Observable<PageResponse<Application>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (jobId) params = params.set('jobId', jobId);
    if (candidateId) params = params.set('candidateId', candidateId);
    if (status) params = params.set('status', status);
    if (stage) params = params.set('stage', stage);

    return this.http.get<PageResponse<Application>>(`${this.apiUrl}/applications`, { params });
  }

  /**
   * Move application to screening.
   */
  moveToScreening(applicationId: string): Observable<Application> {
    return this.http.post<Application>(`${this.apiUrl}/applications/${applicationId}/screen`, null);
  }

  /**
   * Complete screening for an application.
   */
  completeScreening(applicationId: string, score: number, screenedBy: string, notes?: string): Observable<Application> {
    let params = new HttpParams()
      .set('score', score.toString())
      .set('screenedBy', screenedBy);
    if (notes) params = params.set('notes', notes);
    return this.http.post<Application>(`${this.apiUrl}/applications/${applicationId}/screen/complete`, null, { params });
  }

  /**
   * Shortlist an application.
   */
  shortlistApplication(applicationId: string): Observable<Application> {
    return this.http.post<Application>(`${this.apiUrl}/applications/${applicationId}/shortlist`, null);
  }

  /**
   * Move application to interview stage.
   */
  moveToInterview(applicationId: string, stage: RecruitmentStage): Observable<Application> {
    const params = new HttpParams().set('stage', stage);
    return this.http.post<Application>(`${this.apiUrl}/applications/${applicationId}/interview`, null, { params });
  }

  /**
   * Make an offer to an applicant.
   */
  makeOffer(applicationId: string, salary: number, expiryDate: string, startDate: string): Observable<Application> {
    const params = new HttpParams()
      .set('salary', salary.toString())
      .set('expiryDate', expiryDate)
      .set('startDate', startDate);
    return this.http.post<Application>(`${this.apiUrl}/applications/${applicationId}/offer`, null, { params });
  }

  /**
   * Accept an offer.
   */
  acceptOffer(applicationId: string): Observable<Application> {
    return this.http.post<Application>(`${this.apiUrl}/applications/${applicationId}/offer/accept`, null);
  }

  /**
   * Decline an offer.
   */
  declineOffer(applicationId: string, reason: string): Observable<Application> {
    const params = new HttpParams().set('reason', reason);
    return this.http.post<Application>(`${this.apiUrl}/applications/${applicationId}/offer/decline`, null, { params });
  }

  /**
   * Mark application as hired.
   */
  markAsHired(applicationId: string): Observable<Application> {
    return this.http.post<Application>(`${this.apiUrl}/applications/${applicationId}/hire`, null);
  }

  /**
   * Reject an application.
   */
  rejectApplication(applicationId: string, reason: string, rejectedBy: string, notes?: string): Observable<Application> {
    let params = new HttpParams()
      .set('reason', reason)
      .set('rejectedBy', rejectedBy);
    if (notes) params = params.set('notes', notes);
    return this.http.post<Application>(`${this.apiUrl}/applications/${applicationId}/reject`, null, { params });
  }

  /**
   * Withdraw an application.
   */
  withdrawApplication(applicationId: string, reason: string): Observable<Application> {
    const params = new HttpParams().set('reason', reason);
    return this.http.post<Application>(`${this.apiUrl}/applications/${applicationId}/withdraw`, null, { params });
  }

  /**
   * Toggle starred status.
   */
  toggleStarred(applicationId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/applications/${applicationId}/star`, null);
  }

  /**
   * Update application rating.
   */
  updateApplicationRating(applicationId: string, rating: number): Observable<void> {
    const params = new HttpParams().set('rating', rating.toString());
    return this.http.put<void>(`${this.apiUrl}/applications/${applicationId}/rating`, null, { params });
  }

  // === Interview Methods ===

  /**
   * Schedule an interview.
   */
  scheduleInterview(request: ScheduleInterviewRequest): Observable<Interview> {
    return this.http.post<Interview>(`${this.apiUrl}/interviews`, request);
  }

  /**
   * Get an interview by ID.
   */
  getInterview(interviewId: string): Observable<Interview> {
    return this.http.get<Interview>(`${this.apiUrl}/interviews/${interviewId}`);
  }

  /**
   * Get interviews for an application.
   */
  getInterviewsForApplication(applicationId: string): Observable<Interview[]> {
    return this.http.get<Interview[]>(`${this.apiUrl}/applications/${applicationId}/interviews`);
  }

  /**
   * Get upcoming interviews for an interviewer.
   */
  getUpcomingInterviewsForInterviewer(interviewerId: string): Observable<Interview[]> {
    return this.http.get<Interview[]>(`${this.apiUrl}/interviewers/${interviewerId}/upcoming`);
  }

  /**
   * Search interviews.
   */
  searchInterviews(
    page: number = 0,
    size: number = 10,
    interviewerId?: string,
    status?: InterviewStatus,
    type?: InterviewType,
    startDate?: string,
    endDate?: string
  ): Observable<PageResponse<Interview>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (interviewerId) params = params.set('interviewerId', interviewerId);
    if (status) params = params.set('status', status);
    if (type) params = params.set('type', type);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<PageResponse<Interview>>(`${this.apiUrl}/interviews`, { params });
  }

  /**
   * Confirm an interview.
   */
  confirmInterview(interviewId: string): Observable<Interview> {
    return this.http.post<Interview>(`${this.apiUrl}/interviews/${interviewId}/confirm`, null);
  }

  /**
   * Start an interview.
   */
  startInterview(interviewId: string): Observable<Interview> {
    return this.http.post<Interview>(`${this.apiUrl}/interviews/${interviewId}/start`, null);
  }

  /**
   * Complete an interview.
   */
  completeInterview(interviewId: string): Observable<Interview> {
    return this.http.post<Interview>(`${this.apiUrl}/interviews/${interviewId}/complete`, null);
  }

  /**
   * Submit interview feedback.
   */
  submitFeedback(interviewId: string, feedback: InterviewFeedback): Observable<Interview> {
    return this.http.post<Interview>(`${this.apiUrl}/interviews/${interviewId}/feedback`, feedback);
  }

  /**
   * Cancel an interview.
   */
  cancelInterview(interviewId: string, reason: string): Observable<Interview> {
    const params = new HttpParams().set('reason', reason);
    return this.http.post<Interview>(`${this.apiUrl}/interviews/${interviewId}/cancel`, null, { params });
  }

  /**
   * Mark interview as no-show.
   */
  markAsNoShow(interviewId: string): Observable<Interview> {
    return this.http.post<Interview>(`${this.apiUrl}/interviews/${interviewId}/no-show`, null);
  }

  /**
   * Reschedule an interview.
   */
  rescheduleInterview(interviewId: string, newDateTime: string, reason: string): Observable<Interview> {
    const params = new HttpParams()
      .set('newDateTime', newDateTime)
      .set('reason', reason);
    return this.http.post<Interview>(`${this.apiUrl}/interviews/${interviewId}/reschedule`, null, { params });
  }

  // === Dashboard Methods ===

  /**
   * Get recruitment dashboard data.
   */
  getDashboard(): Observable<RecruitmentDashboard> {
    return this.http.get<RecruitmentDashboard>(`${this.apiUrl}/dashboard`);
  }

  /**
   * Get pipeline summary.
   */
  getPipelineSummary(): Observable<PipelineStage[]> {
    return this.http.get<PipelineStage[]>(`${this.apiUrl}/pipeline`);
  }

  /**
   * Get today's interviews.
   */
  getTodaysInterviews(): Observable<Interview[]> {
    return this.http.get<Interview[]>(`${this.apiUrl}/interviews/today`);
  }

  /**
   * Get stale applications.
   */
  getStaleApplications(daysOld: number = 14): Observable<Application[]> {
    const params = new HttpParams().set('daysOld', daysOld.toString());
    return this.http.get<Application[]>(`${this.apiUrl}/applications/stale`, { params });
  }

  // === External Job Posting Methods ===

  /**
   * Get external postings for a job.
   */
  getExternalPostingsForJob(jobId: string): Observable<ExternalJobPosting[]> {
    return this.http.get<ExternalJobPosting[]>(`${this.apiUrl}/jobs/${jobId}/external-postings`);
  }

  /**
   * Get all external postings (for admin).
   */
  searchExternalPostings(
    page: number = 0,
    size: number = 10,
    status?: ExternalPostingStatus,
    portal?: JobPortal
  ): Observable<PageResponse<ExternalJobPosting>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) params = params.set('status', status);
    if (portal) params = params.set('portal', portal);

    return this.http.get<PageResponse<ExternalJobPosting>>(`${this.apiUrl}/external-postings`, { params });
  }

  /**
   * Retry a failed external posting.
   */
  retryExternalPosting(externalPostingId: string): Observable<ExternalJobPosting> {
    return this.http.post<ExternalJobPosting>(`${this.apiUrl}/external-postings/${externalPostingId}/retry`, null);
  }

  /**
   * Get external posting statistics.
   */
  getExternalPostingStats(): Observable<ExternalPostingStats> {
    return this.http.get<ExternalPostingStats>(`${this.apiUrl}/external-postings/stats`);
  }

  /**
   * Post a job to external portals.
   */
  postToPortals(jobId: string, portals: JobPortal[], options: PostToPortalsRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/jobs/${jobId}/post-to-portals`, {
      portals,
      ...options
    });
  }

  /**
   * Get a single external posting by ID.
   */
  getExternalPosting(id: string): Observable<ExternalJobPosting> {
    return this.http.get<ExternalJobPosting>(`${this.apiUrl}/external-postings/${id}`);
  }

  /**
   * Resolve manual intervention for an external posting.
   */
  resolveManualIntervention(id: string, externalJobId: string, externalUrl: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/external-postings/${id}/resolve`, {
      externalJobId,
      externalUrl
    });
  }

  /**
   * Get portal statuses (connection status for each portal).
   */
  getPortalStatuses(): Observable<PortalStatus[]> {
    return this.http.get<PortalStatus[]>(`${this.apiUrl}/portals/status`);
  }

  /**
   * Get audit trail for an external posting.
   */
  getExternalPostingAudit(id: string): Observable<ExternalPostingAudit[]> {
    return this.http.get<ExternalPostingAudit[]>(`${this.apiUrl}/external-postings/${id}/audit`);
  }

  /**
   * Remove an external posting from a portal.
   */
  removeExternalPosting(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/external-postings/${id}`);
  }

  // === Analytics Methods ===

  getPortalPerformance(): Observable<PortalPerformanceStats> {
    return this.http.get<PortalPerformanceStats>(`${this.apiUrl}/analytics/portal-performance`);
  }

  getPortalJobs(portal: string, page: number = 0, size: number = 10): Observable<PageResponse<ExternalJobPosting>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<ExternalJobPosting>>(`${this.apiUrl}/analytics/portal-performance/${portal}/jobs`, { params });
  }

  getAdvertPerformance(): Observable<AdvertPerformanceStats> {
    return this.http.get<AdvertPerformanceStats>(`${this.apiUrl}/analytics/advert-performance`);
  }

  getSourceEffectiveness(): Observable<SourceEffectivenessStats> {
    return this.http.get<SourceEffectivenessStats>(`${this.apiUrl}/analytics/source-effectiveness`);
  }

  getOfferAcceptance(): Observable<OfferAcceptanceStats> {
    return this.http.get<OfferAcceptanceStats>(`${this.apiUrl}/analytics/offer-acceptance`);
  }

  // === Client Methods ===

  createClient(request: CreateClientRequest): Observable<Client> {
    return this.http.post<Client>(`${this.apiUrl}/clients`, request);
  }

  updateClient(clientId: string, request: UpdateClientRequest): Observable<Client> {
    return this.http.put<Client>(`${this.apiUrl}/clients/${clientId}`, request);
  }

  getClient(clientId: string): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/clients/${clientId}`);
  }

  searchClients(
    page: number = 0,
    size: number = 10,
    active?: boolean,
    searchTerm?: string
  ): Observable<PageResponse<Client>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (active !== undefined) params = params.set('active', active.toString());
    if (searchTerm) params = params.set('searchTerm', searchTerm);

    return this.http.get<PageResponse<Client>>(`${this.apiUrl}/clients`, { params });
  }

  getActiveClients(): Observable<ClientSummary[]> {
    return this.http.get<ClientSummary[]>(`${this.apiUrl}/clients/active`);
  }

  deactivateClient(clientId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/clients/${clientId}/deactivate`, null);
  }

  // === Static Utility Methods ===

  /**
   * Get label for job status.
   */
  static getJobStatusLabel(status: JobStatus): string {
    const labels: Record<JobStatus, string> = {
      DRAFT: 'Draft',
      OPEN: 'Open',
      ON_HOLD: 'On Hold',
      CLOSED: 'Closed',
      FILLED: 'Filled',
      CANCELLED: 'Cancelled'
    };
    return labels[status] || status;
  }

  /**
   * Get hex color styles for job status (for inline styles).
   * Uses centralized status config for consistency.
   */
  static getJobStatusColor(status: JobStatus): HexColorPair {
    const config = getJobStatusConfig(status);
    // Use dark variant for "filled" status to differentiate from "open"
    return getStatusHexColors(config, status === 'FILLED');
  }

  /**
   * Get Tailwind classes for job status (recommended for dark mode support).
   */
  static getJobStatusClasses(status: JobStatus): string {
    const config = getJobStatusConfig(status);
    return getVariantClasses(config.variant);
  }

  /**
   * Get label for employment type.
   */
  static getEmploymentTypeLabel(type: EmploymentType): string {
    const labels: Record<EmploymentType, string> = {
      FULL_TIME: 'Full Time',
      PART_TIME: 'Part Time',
      CONTRACT: 'Contract',
      TEMPORARY: 'Temporary',
      INTERNSHIP: 'Internship',
      FREELANCE: 'Freelance'
    };
    return labels[type] || type;
  }

  /**
   * Get label for candidate status.
   */
  static getCandidateStatusLabel(status: CandidateStatus): string {
    const labels: Record<CandidateStatus, string> = {
      ACTIVE: 'Active',
      INACTIVE: 'Inactive',
      HIRED: 'Hired',
      BLACKLISTED: 'Blacklisted',
      ARCHIVED: 'Archived'
    };
    return labels[status] || status;
  }

  /**
   * Get hex color styles for candidate status (for inline styles).
   * Uses centralized status config for consistency.
   */
  static getCandidateStatusColor(status: CandidateStatus): HexColorPair {
    const config = getCandidateStatusConfig(status);
    // Use dark variant for "hired" status to differentiate from "active"
    return getStatusHexColors(config, status === 'HIRED');
  }

  /**
   * Get Tailwind classes for candidate status (recommended for dark mode support).
   */
  static getCandidateStatusClasses(status: CandidateStatus): string {
    const config = getCandidateStatusConfig(status);
    return getVariantClasses(config.variant);
  }

  /**
   * Get label for application status.
   */
  static getApplicationStatusLabel(status: ApplicationStatus): string {
    const labels: Record<ApplicationStatus, string> = {
      NEW: 'New',
      IN_REVIEW: 'In Review',
      SCREENED: 'Screened',
      SHORTLISTED: 'Shortlisted',
      INTERVIEWING: 'Interviewing',
      OFFER_MADE: 'Offer Made',
      OFFER_ACCEPTED: 'Offer Accepted',
      OFFER_DECLINED: 'Offer Declined',
      HIRED: 'Hired',
      REJECTED: 'Rejected',
      WITHDRAWN: 'Withdrawn',
      ON_HOLD: 'On Hold'
    };
    return labels[status] || status;
  }

  /**
   * Get label for recruitment stage.
   */
  static getRecruitmentStageLabel(stage: RecruitmentStage): string {
    const labels: Record<RecruitmentStage, string> = {
      NEW: 'New',
      SCREENING: 'Screening',
      PHONE_SCREEN: 'Phone Screen',
      ASSESSMENT: 'Assessment',
      FIRST_INTERVIEW: '1st Interview',
      SECOND_INTERVIEW: '2nd Interview',
      FINAL_INTERVIEW: 'Final Interview',
      REFERENCE_CHECK: 'Reference Check',
      BACKGROUND_CHECK: 'Background Check',
      OFFER: 'Offer',
      ONBOARDING: 'Onboarding',
      COMPLETED: 'Completed'
    };
    return labels[stage] || stage;
  }

  /**
   * Get color styles for recruitment stage.
   * Uses centralized status config for consistency.
   */
  static getStageColor(stage: RecruitmentStage): HexColorPair {
    const config = getApplicationStageConfig(stage);
    // Use dark variant for terminal stages
    const useDark = stage === 'COMPLETED' || stage === 'ONBOARDING';
    return getStatusHexColors(config, useDark);
  }

  /**
   * Get label for interview type.
   */
  static getInterviewTypeLabel(type: InterviewType): string {
    const labels: Record<InterviewType, string> = {
      PHONE_SCREEN: 'Phone Screen',
      VIDEO_CALL: 'Video Call',
      IN_PERSON: 'In Person',
      TECHNICAL: 'Technical',
      BEHAVIORAL: 'Behavioral',
      PANEL: 'Panel',
      GROUP: 'Group',
      CASE_STUDY: 'Case Study',
      FINAL: 'Final'
    };
    return labels[type] || type;
  }

  /**
   * Get label for interview status.
   */
  static getInterviewStatusLabel(status: InterviewStatus): string {
    const labels: Record<InterviewStatus, string> = {
      SCHEDULED: 'Scheduled',
      CONFIRMED: 'Confirmed',
      IN_PROGRESS: 'In Progress',
      COMPLETED: 'Completed',
      FEEDBACK_PENDING: 'Feedback Pending',
      FEEDBACK_SUBMITTED: 'Feedback Submitted',
      CANCELLED: 'Cancelled',
      NO_SHOW: 'No Show',
      RESCHEDULED: 'Rescheduled'
    };
    return labels[status] || status;
  }

  /**
   * Get hex color styles for interview status (for inline styles).
   * Uses centralized status config for consistency.
   */
  static getInterviewStatusColor(status: InterviewStatus): HexColorPair {
    const config = getInterviewStatusConfig(status);
    // Use dark variant for completed status
    return getStatusHexColors(config, status === 'COMPLETED');
  }

  /**
   * Get Tailwind classes for interview status (recommended for dark mode support).
   */
  static getInterviewStatusClasses(status: InterviewStatus): string {
    const config = getInterviewStatusConfig(status);
    return getVariantClasses(config.variant);
  }

  /**
   * Get label for recommendation.
   */
  static getRecommendationLabel(rec: Recommendation): string {
    const labels: Record<Recommendation, string> = {
      STRONG_HIRE: 'Strong Hire',
      HIRE: 'Hire',
      LEAN_HIRE: 'Lean Hire',
      NEUTRAL: 'Neutral',
      LEAN_NO_HIRE: 'Lean No Hire',
      NO_HIRE: 'No Hire',
      STRONG_NO_HIRE: 'Strong No Hire'
    };
    return labels[rec] || rec;
  }

  /**
   * Get color styles for recommendation.
   * Uses centralized status config for consistency.
   */
  static getRecommendationColor(rec: Recommendation): HexColorPair {
    const config = getRecommendationConfig(rec);
    // Use dark variant for strong hire recommendations
    return getStatusHexColors(config, rec === 'STRONG_HIRE');
  }

  // === External Portal Publishing Utility Methods ===

  /**
   * Get label for province.
   */
  static getProvinceLabel(province: Province): string {
    const labels: Record<Province, string> = {
      GAUTENG: 'Gauteng',
      WESTERN_CAPE: 'Western Cape',
      KWAZULU_NATAL: 'KwaZulu-Natal',
      EASTERN_CAPE: 'Eastern Cape',
      FREE_STATE: 'Free State',
      LIMPOPO: 'Limpopo',
      MPUMALANGA: 'Mpumalanga',
      NORTH_WEST: 'North West',
      NORTHERN_CAPE: 'Northern Cape'
    };
    return labels[province] || province;
  }

  /**
   * Get label for industry.
   */
  static getIndustryLabel(industry: Industry): string {
    const labels: Record<Industry, string> = {
      IT_SOFTWARE: 'IT & Software',
      FINANCE_BANKING: 'Finance & Banking',
      HEALTHCARE: 'Healthcare',
      RETAIL: 'Retail',
      MANUFACTURING: 'Manufacturing',
      CONSTRUCTION: 'Construction',
      EDUCATION: 'Education',
      HOSPITALITY_TOURISM: 'Hospitality & Tourism',
      LOGISTICS_TRANSPORT: 'Logistics & Transport',
      LEGAL: 'Legal',
      MARKETING_ADVERTISING: 'Marketing & Advertising',
      HUMAN_RESOURCES: 'Human Resources',
      ENGINEERING: 'Engineering',
      MINING: 'Mining',
      AGRICULTURE: 'Agriculture',
      TELECOMMUNICATIONS: 'Telecommunications',
      REAL_ESTATE: 'Real Estate',
      MEDIA_ENTERTAINMENT: 'Media & Entertainment',
      GOVERNMENT_PUBLIC_SECTOR: 'Government & Public Sector',
      NON_PROFIT: 'Non-Profit',
      OTHER: 'Other'
    };
    return labels[industry] || industry;
  }

  /**
   * Get label for education level.
   */
  static getEducationLevelLabel(level: EducationLevel): string {
    const labels: Record<EducationLevel, string> = {
      NO_REQUIREMENT: 'No Requirement',
      MATRIC: 'Matric / Grade 12',
      CERTIFICATE: 'Certificate',
      DIPLOMA: 'Diploma',
      DEGREE: 'Bachelor\'s Degree',
      HONOURS: 'Honours Degree',
      MASTERS: 'Master\'s Degree',
      DOCTORATE: 'Doctorate / PhD'
    };
    return labels[level] || level;
  }

  /**
   * Get label for job portal.
   */
  static getJobPortalLabel(portal: JobPortal): string {
    const labels: Record<JobPortal, string> = {
      PNET: 'Pnet',
      LINKEDIN: 'LinkedIn',
      INDEED: 'Indeed',
      CAREERS24: 'Careers24'
    };
    return labels[portal] || portal;
  }

  /**
   * Get label for external posting status.
   */
  static getExternalPostingStatusLabel(status: ExternalPostingStatus): string {
    const labels: Record<ExternalPostingStatus, string> = {
      PENDING: 'Pending',
      QUEUED: 'Queued',
      POSTING: 'Posting...',
      POSTED: 'Posted',
      FAILED: 'Failed',
      REQUIRES_MANUAL: 'Requires Manual',
      EXPIRED: 'Expired',
      REMOVED: 'Removed'
    };
    return labels[status] || status;
  }

  /**
   * Get color for external posting status.
   */
  static getExternalPostingStatusColor(status: ExternalPostingStatus): HexColorPair {
    const colors: Record<ExternalPostingStatus, HexColorPair> = {
      PENDING: { background: '#fef3c7', color: '#92400e' },
      QUEUED: { background: '#e0e7ff', color: '#3730a3' },
      POSTING: { background: '#dbeafe', color: '#1e40af' },
      POSTED: { background: '#d1fae5', color: '#065f46' },
      FAILED: { background: '#fee2e2', color: '#991b1b' },
      REQUIRES_MANUAL: { background: '#fecaca', color: '#7f1d1d' },
      EXPIRED: { background: '#e5e7eb', color: '#374151' },
      REMOVED: { background: '#f3f4f6', color: '#6b7280' }
    };
    return colors[status] || { background: '#f3f4f6', color: '#374151' };
  }

  /**
   * Get label for company mention preference.
   */
  static getCompanyMentionPreferenceLabel(pref: CompanyMentionPreference): string {
    const labels: Record<CompanyMentionPreference, string> = {
      ANONYMOUS: 'Anonymous',
      NAMED_BY_SUREWORK: 'SureWork on behalf of...',
      DIRECT_MENTION: 'Direct company mention'
    };
    return labels[pref] || pref;
  }

  // === Client & Compensation Utility Methods ===

  static getCompensationTypeLabel(type: CompensationType): string {
    const labels: Record<CompensationType, string> = {
      HOURLY: 'Hourly',
      DAILY: 'Daily',
      WEEKLY: 'Weekly',
      MONTHLY: 'Monthly',
      ANNUAL: 'Annual'
    };
    return labels[type] || type;
  }

  static getClientVisibilityLabel(visibility: ClientVisibility): string {
    const labels: Record<ClientVisibility, string> = {
      SHOW_NAME: 'Show Client Name',
      CONFIDENTIAL: 'Confidential',
      HIDDEN: 'Hidden'
    };
    return labels[visibility] || visibility;
  }

  static getCurrencySymbol(currency: string): string {
    const symbols: Record<string, string> = {
      ZAR: 'R',
      USD: '$',
      EUR: '€',
      GBP: '£'
    };
    return symbols[currency] || currency + ' ';
  }

  static getSalaryLabel(
    salaryMin?: number,
    salaryMax?: number,
    currency: string = 'ZAR',
    compensationType: CompensationType = 'MONTHLY',
    showSalary: boolean = true
  ): string {
    if (!showSalary || (salaryMin == null && salaryMax == null)) return 'Negotiable';
    const prefix = RecruitmentService.getCurrencySymbol(currency);
    const suffix: Record<CompensationType, string> = {
      HOURLY: '/hr', DAILY: '/day', WEEKLY: '/wk', MONTHLY: '/mo', ANNUAL: '/yr'
    };
    const fmt = (n: number) => n.toLocaleString('en-ZA');
    if (salaryMin != null && salaryMax != null) {
      return `${prefix}${fmt(salaryMin)} - ${prefix}${fmt(salaryMax)}${suffix[compensationType]}`;
    }
    if (salaryMin != null) return `From ${prefix}${fmt(salaryMin)}${suffix[compensationType]}`;
    return `Up to ${prefix}${fmt(salaryMax!)}${suffix[compensationType]}`;
  }
}
