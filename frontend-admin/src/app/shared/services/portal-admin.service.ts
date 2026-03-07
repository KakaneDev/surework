import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

// ==================== Types ====================

export type JobPortal = 'PNET' | 'LINKEDIN' | 'INDEED' | 'CAREERS24';

export type ConnectionStatus =
  | 'NOT_CONFIGURED'
  | 'CONNECTED'
  | 'SESSION_EXPIRED'
  | 'INVALID_CREDENTIALS'
  | 'RATE_LIMITED'
  | 'CAPTCHA_REQUIRED'
  | 'ERROR';

export type ExternalPostingStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'POSTING'
  | 'POSTED'
  | 'FAILED'
  | 'REQUIRES_MANUAL'
  | 'EXPIRED'
  | 'REMOVED';

export interface PortalCredentials {
  id: string;
  portal: JobPortal;
  username: string | null;
  hasPassword: boolean;
  active: boolean;
  connectionStatus: ConnectionStatus;
  dailyRateLimit: number;
  postsToday: number;
  remainingPosts: number;
  lastVerifiedAt: string | null;
  lastError: string | null;
  rateLimitResetAt: string | null;
}

export interface UpdateCredentialsRequest {
  username: string;
  password: string;
  additionalConfig?: string;
  active: boolean;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  connectionStatus: ConnectionStatus;
}

export interface PortalHealthSummary {
  totalPortals: number;
  activePortals: number;
  portalsNeedingAttention: number;
  totalPostsToday: number;
  portals: PortalStatusSummary[];
}

export interface PortalStatusSummary {
  portal: JobPortal;
  status: ConnectionStatus;
  active: boolean;
  postsToday: number;
  dailyLimit: number;
}

export interface FailedPosting {
  id: string;
  jobPostingId: string;
  jobReference: string;
  jobTitle: string;
  tenantId: string;
  tenantName?: string;
  portal: JobPortal;
  status: ExternalPostingStatus;
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
  lastAttemptAt: string;
  screenshotUrl?: string;
}

export interface FailedPostingsFilter {
  portal?: JobPortal;
  status?: ExternalPostingStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PostingStats {
  dailyData: DailyPostingStats[];
  successRateTrend: SuccessRateTrendPoint[];
}

export interface DailyPostingStats {
  date: string;
  portal: JobPortal;
  count: number;
  successCount: number;
  failedCount: number;
}

export interface SuccessRateTrendPoint {
  date: string;
  successRate: number;
  failureRate: number;
}

export interface ResolvePostingRequest {
  success: boolean;
  externalJobId?: string;
  externalUrl?: string;
  expiresAt?: string;
  errorMessage?: string;
}

export interface ExternalPostingStats {
  totalRequests: number;
  successfulPostings: number;
  failedPostings: number;
  pendingPostings: number;
  requiresManualCount: number;
  successRate: number;
  byPortal: Record<JobPortal, number>;
  byStatus: Record<string, number>;
}

export interface FailedPostingsCount {
  requiresManual: number;
  failed: number;
  total: number;
}

export interface ExternalPosting {
  id: string;
  jobPostingId: string;
  jobReference: string;
  jobTitle: string;
  tenantId: string;
  portal: JobPortal;
  externalJobId: string | null;
  externalUrl: string | null;
  status: ExternalPostingStatus;
  errorMessage: string | null;
  retryCount: number;
  postedAt: string | null;
  expiresAt: string | null;
  lastCheckedAt: string | null;
  createdAt: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ==================== Service ====================

@Injectable({ providedIn: 'root' })
export class PortalAdminService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/portals`;

  // ==================== Portal Credentials ====================

  getCredentials(): Observable<PortalCredentials[]> {
    return this.http.get<PortalCredentials[]>(`${this.apiUrl}/credentials`);
  }

  getCredentialsByPortal(portal: JobPortal): Observable<PortalCredentials> {
    return this.http.get<PortalCredentials>(`${this.apiUrl}/credentials/${portal}`);
  }

  updateCredentials(portal: JobPortal, request: UpdateCredentialsRequest): Observable<PortalCredentials> {
    return this.http.put<PortalCredentials>(`${this.apiUrl}/credentials/${portal}`, request);
  }

  testConnection(portal: JobPortal): Observable<TestConnectionResponse> {
    return this.http.post<TestConnectionResponse>(`${this.apiUrl}/credentials/${portal}/test`, {});
  }

  activatePortal(portal: JobPortal): Observable<PortalCredentials> {
    return this.http.post<PortalCredentials>(`${this.apiUrl}/credentials/${portal}/activate`, {});
  }

  deactivatePortal(portal: JobPortal): Observable<PortalCredentials> {
    return this.http.post<PortalCredentials>(`${this.apiUrl}/credentials/${portal}/deactivate`, {});
  }

  // ==================== Portal Health ====================

  getHealthSummary(): Observable<PortalHealthSummary> {
    return this.http.get<PortalHealthSummary>(`${this.apiUrl}/health`);
  }

  getPortalsNeedingAttention(): Observable<PortalCredentials[]> {
    return this.http.get<PortalCredentials[]>(`${this.apiUrl}/needing-attention`);
  }

  // ==================== Failed Postings ====================

  getFailedPostings(page = 0, size = 20): Observable<PagedResponse<FailedPosting>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PagedResponse<FailedPosting>>(`${this.apiUrl}/failed-postings`, { params });
  }

  getFailedPostingsCount(): Observable<FailedPostingsCount> {
    return this.http.get<FailedPostingsCount>(`${this.apiUrl}/failed-postings/count`);
  }

  resolveFailedPosting(id: string, request: ResolvePostingRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/failed-postings/${id}/resolve`, request);
  }

  retryFailedPosting(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/failed-postings/${id}/retry`, {});
  }

  // ==================== Statistics ====================

  getStats(): Observable<ExternalPostingStats> {
    return this.http.get<ExternalPostingStats>(`${this.apiUrl}/stats`);
  }

  getStatsByTenant(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/stats/by-tenant`);
  }

  /**
   * Get posting statistics for a date range
   * @param startDate Start date in ISO format
   * @param endDate End date in ISO format
   */
  getPostingStats(startDate: string, endDate: string): Observable<PostingStats> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<PostingStats>(`${this.apiUrl}/stats/range`, { params });
  }

  // ==================== Portal Health ====================

  /**
   * Get comprehensive portal health data
   */
  getPortalHealth(): Observable<PortalHealthSummary> {
    return this.http.get<PortalHealthSummary>(`${this.apiUrl}/health`);
  }

  // ==================== Enhanced Failed Postings ====================

  /**
   * Get failed postings with filters
   */
  getFailedPostingsFiltered(
    page = 0,
    size = 20,
    filters?: FailedPostingsFilter
  ): Observable<PagedResponse<FailedPosting>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filters?.portal) {
      params = params.set('portal', filters.portal);
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    if (filters?.dateFrom) {
      params = params.set('dateFrom', filters.dateFrom);
    }
    if (filters?.dateTo) {
      params = params.set('dateTo', filters.dateTo);
    }

    return this.http.get<PagedResponse<FailedPosting>>(`${this.apiUrl}/failed-postings`, { params });
  }

  /**
   * Bulk retry multiple failed postings
   */
  bulkRetryFailedPostings(ids: string[]): Observable<{ success: number; failed: number }> {
    return this.http.post<{ success: number; failed: number }>(
      `${this.apiUrl}/failed-postings/bulk-retry`,
      { ids }
    );
  }

  // ==================== All Postings ====================

  getAllPostings(
    page = 0,
    size = 20,
    filters?: { status?: string; portal?: string; search?: string }
  ): Observable<PagedResponse<ExternalPosting>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.portal) {
      params = params.set('portal', filters.portal);
    }
    if (filters?.search) {
      params = params.set('search', filters.search);
    }

    return this.http.get<PagedResponse<ExternalPosting>>(`${this.apiUrl}/postings`, { params });
  }

  // ==================== Utilities ====================

  getPortalLabel(portal: JobPortal): string {
    const labels: Record<JobPortal, string> = {
      PNET: 'Pnet',
      LINKEDIN: 'LinkedIn',
      INDEED: 'Indeed',
      CAREERS24: 'Careers24'
    };
    return labels[portal] || portal;
  }

  getStatusColor(status: ConnectionStatus): 'success' | 'warning' | 'error' | 'gray' {
    const colors: Record<ConnectionStatus, 'success' | 'warning' | 'error' | 'gray'> = {
      NOT_CONFIGURED: 'gray',
      CONNECTED: 'success',
      SESSION_EXPIRED: 'warning',
      INVALID_CREDENTIALS: 'error',
      RATE_LIMITED: 'warning',
      CAPTCHA_REQUIRED: 'warning',
      ERROR: 'error'
    };
    return colors[status] || 'gray';
  }

  getPostingStatusColor(status: ExternalPostingStatus): 'success' | 'warning' | 'error' | 'gray' | 'info' {
    const colors: Record<ExternalPostingStatus, 'success' | 'warning' | 'error' | 'gray' | 'info'> = {
      PENDING: 'gray',
      QUEUED: 'info',
      POSTING: 'info',
      POSTED: 'success',
      FAILED: 'error',
      REQUIRES_MANUAL: 'warning',
      EXPIRED: 'gray',
      REMOVED: 'gray'
    };
    return colors[status] || 'gray';
  }
}
