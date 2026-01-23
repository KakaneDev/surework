import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

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
  applicationCount: number;
  viewCount: number;
  createdAt: string;
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
    searchTerm?: string
  ): Observable<PageResponse<JobPostingSummary>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) params = params.set('status', status);
    if (departmentId) params = params.set('departmentId', departmentId);
    if (employmentType) params = params.set('employmentType', employmentType);
    if (location) params = params.set('location', location);
    if (searchTerm) params = params.set('searchTerm', searchTerm);

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
   * Get color styles for job status.
   */
  static getJobStatusColor(status: JobStatus): { background: string; color: string } {
    const colors: Record<JobStatus, { background: string; color: string }> = {
      DRAFT: { background: '#fff3e0', color: '#f57c00' },
      OPEN: { background: '#e8f5e9', color: '#2e7d32' },
      ON_HOLD: { background: '#e3f2fd', color: '#1565c0' },
      CLOSED: { background: '#eceff1', color: '#546e7a' },
      FILLED: { background: '#c8e6c9', color: '#1b5e20' },
      CANCELLED: { background: '#ffcdd2', color: '#b71c1c' }
    };
    return colors[status] || { background: '#eceff1', color: '#546e7a' };
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
   * Get color styles for candidate status.
   */
  static getCandidateStatusColor(status: CandidateStatus): { background: string; color: string } {
    const colors: Record<CandidateStatus, { background: string; color: string }> = {
      ACTIVE: { background: '#e8f5e9', color: '#2e7d32' },
      INACTIVE: { background: '#eceff1', color: '#546e7a' },
      HIRED: { background: '#c8e6c9', color: '#1b5e20' },
      BLACKLISTED: { background: '#ffcdd2', color: '#b71c1c' },
      ARCHIVED: { background: '#f5f5f5', color: '#9e9e9e' }
    };
    return colors[status] || { background: '#eceff1', color: '#546e7a' };
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
   */
  static getStageColor(stage: RecruitmentStage): { background: string; color: string } {
    const colors: Record<RecruitmentStage, { background: string; color: string }> = {
      NEW: { background: '#e3f2fd', color: '#1565c0' },
      SCREENING: { background: '#fff3e0', color: '#f57c00' },
      PHONE_SCREEN: { background: '#fce4ec', color: '#c2185b' },
      ASSESSMENT: { background: '#f3e5f5', color: '#6a1b9a' },
      FIRST_INTERVIEW: { background: '#e1bee7', color: '#4a148c' },
      SECOND_INTERVIEW: { background: '#d1c4e9', color: '#311b92' },
      FINAL_INTERVIEW: { background: '#c5cae9', color: '#1a237e' },
      REFERENCE_CHECK: { background: '#bbdefb', color: '#0d47a1' },
      BACKGROUND_CHECK: { background: '#b3e5fc', color: '#01579b' },
      OFFER: { background: '#c5cae9', color: '#283593' },
      ONBOARDING: { background: '#dcedc8', color: '#33691e' },
      COMPLETED: { background: '#c8e6c9', color: '#1b5e20' }
    };
    return colors[stage] || { background: '#eceff1', color: '#546e7a' };
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
   * Get color styles for interview status.
   */
  static getInterviewStatusColor(status: InterviewStatus): { background: string; color: string } {
    const colors: Record<InterviewStatus, { background: string; color: string }> = {
      SCHEDULED: { background: '#e3f2fd', color: '#1565c0' },
      CONFIRMED: { background: '#e8f5e9', color: '#2e7d32' },
      IN_PROGRESS: { background: '#fff3e0', color: '#f57c00' },
      COMPLETED: { background: '#c8e6c9', color: '#1b5e20' },
      FEEDBACK_PENDING: { background: '#fff8e1', color: '#f9a825' },
      FEEDBACK_SUBMITTED: { background: '#e0f7fa', color: '#00838f' },
      CANCELLED: { background: '#ffcdd2', color: '#b71c1c' },
      NO_SHOW: { background: '#fce4ec', color: '#c2185b' },
      RESCHEDULED: { background: '#f3e5f5', color: '#6a1b9a' }
    };
    return colors[status] || { background: '#eceff1', color: '#546e7a' };
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
   */
  static getRecommendationColor(rec: Recommendation): { background: string; color: string } {
    const colors: Record<Recommendation, { background: string; color: string }> = {
      STRONG_HIRE: { background: '#c8e6c9', color: '#1b5e20' },
      HIRE: { background: '#dcedc8', color: '#33691e' },
      LEAN_HIRE: { background: '#f0f4c3', color: '#827717' },
      NEUTRAL: { background: '#fff9c4', color: '#f9a825' },
      LEAN_NO_HIRE: { background: '#ffe0b2', color: '#ef6c00' },
      NO_HIRE: { background: '#ffccbc', color: '#d84315' },
      STRONG_NO_HIRE: { background: '#ffcdd2', color: '#b71c1c' }
    };
    return colors[rec] || { background: '#eceff1', color: '#546e7a' };
  }
}
