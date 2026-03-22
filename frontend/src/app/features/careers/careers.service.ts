import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

// ==================== Types ====================

export interface PublicJobPosting {
  id: string;
  jobReference: string;
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  location: string;
  city: string;
  province: string;
  employmentType: EmploymentType;
  remote: boolean;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  salaryFrequency: string;
  hideSalary: boolean;
  industry: string;
  experienceYearsMin?: number;
  experienceYearsMax?: number;
  educationLevel?: string;
  skills: string[];
  benefits: string[];
  publishedAt: string;
  closingDate?: string;
  companyDescription?: string;
  clientName?: string;
  projectName?: string;
}

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'TEMPORARY' | 'INTERNSHIP';

export interface JobSearchFilters {
  keyword?: string;
  location?: string;
  province?: string;
  employmentType?: EmploymentType;
  industry?: string;
  remote?: boolean;
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ApplicationSubmission {
  jobPostingId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  coverLetter?: string;
  resumeBase64?: string;
  resumeFileName?: string;
  noticePeriod?: string;
  expectedSalary?: number;
  source?: string;
  referredBy?: string;
  additionalInfo?: string;
}

export interface ApplicationResponse {
  id: string;
  applicationReference: string;
  status: string;
  submittedAt: string;
  message: string;
}

export interface OfferDetails {
  candidateName: string;
  jobTitle: string;
  department: string;
  location: string;
  offerSalary: number;
  salaryCurrency: string;
  startDate: string;
  expiryDate: string;
  status: string;
}

// ==================== Service ====================

@Injectable({ providedIn: 'root' })
export class CareersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/public/careers`;

  /**
   * Search published job postings.
   */
  searchJobs(filters: JobSearchFilters): Observable<PagedResponse<PublicJobPosting>> {
    let params = new HttpParams()
      .set('page', filters.page.toString())
      .set('size', filters.size.toString());

    if (filters.keyword) params = params.set('keyword', filters.keyword);
    if (filters.location) params = params.set('location', filters.location);
    if (filters.province) params = params.set('province', filters.province);
    if (filters.employmentType) params = params.set('employmentType', filters.employmentType);
    if (filters.industry) params = params.set('industry', filters.industry);
    if (filters.remote !== undefined) params = params.set('remote', filters.remote.toString());
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortDirection) params = params.set('sortDirection', filters.sortDirection);

    return this.http.get<PagedResponse<PublicJobPosting>>(`${this.apiUrl}/jobs`, { params });
  }

  /**
   * Get a single job posting by reference.
   */
  getJobByReference(jobReference: string): Observable<PublicJobPosting> {
    return this.http.get<PublicJobPosting>(`${this.apiUrl}/jobs/${jobReference}`);
  }

  /**
   * Submit a job application.
   */
  submitApplication(application: ApplicationSubmission): Observable<ApplicationResponse> {
    return this.http.post<ApplicationResponse>(`${this.apiUrl}/apply`, application);
  }

  /**
   * Get featured jobs (for homepage).
   */
  getFeaturedJobs(limit = 6): Observable<PublicJobPosting[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<PublicJobPosting[]>(`${this.apiUrl}/jobs/featured`, { params });
  }

  /**
   * Get job count summary.
   */
  getJobCounts(): Observable<{ total: number; byLocation: Record<string, number>; byType: Record<string, number> }> {
    return this.http.get<any>(`${this.apiUrl}/jobs/counts`);
  }

  // ==================== Offer Methods ====================

  getOfferDetails(token: string): Observable<OfferDetails> {
    return this.http.get<OfferDetails>(`${this.apiUrl}/offer/${token}`);
  }

  acceptOffer(token: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/offer/${token}/accept`, {});
  }

  declineOffer(token: string, reason: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/offer/${token}/decline`, { reason });
  }

  // ==================== Utilities ====================

  getEmploymentTypeLabel(type: EmploymentType): string {
    const labels: Record<EmploymentType, string> = {
      FULL_TIME: 'Full-time',
      PART_TIME: 'Part-time',
      CONTRACT: 'Contract',
      TEMPORARY: 'Temporary',
      INTERNSHIP: 'Internship'
    };
    return labels[type] || type;
  }

  getProvinceLabel(province: string): string {
    const labels: Record<string, string> = {
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

  formatSalary(min?: number, max?: number, currency = 'ZAR', frequency?: string): string {
    if (!min && !max) return 'Negotiable';
    const prefix = currency === 'ZAR' ? 'R' : currency + ' ';
    const suffix = this.getFrequencySuffix(frequency);
    if (min && max) {
      return `${prefix}${min.toLocaleString()} - ${prefix}${max.toLocaleString()}${suffix}`;
    }
    if (min) return `From ${prefix}${min.toLocaleString()}${suffix}`;
    if (max) return `Up to ${prefix}${max.toLocaleString()}${suffix}`;
    return 'Negotiable';
  }

  private getFrequencySuffix(frequency?: string): string {
    if (!frequency) return '/mo';
    const suffixes: Record<string, string> = {
      HOURLY: '/hr', DAILY: '/day', WEEKLY: '/wk', MONTHLY: '/mo', ANNUAL: '/yr'
    };
    return suffixes[frequency] || '/mo';
  }

  getRelativeTime(date: string): string {
    const now = new Date();
    const postDate = new Date(date);
    const diffInDays = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  }
}
