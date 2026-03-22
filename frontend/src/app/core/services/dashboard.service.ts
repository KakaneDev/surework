import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

export interface DashboardStats {
  employeeCount: number;
  pendingLeaveRequests: number;
  openJobPostings: number;
  nextPayrollDate: string | null;
}

export interface AdminDashboard {
  tenantStats: TenantStats;
  userStats: UserStats;
}

export interface TenantStats {
  totalTenants: number;
  activeTenants: number;
  pendingTenants: number;
  suspendedTenants: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  lockedUsers: number;
}

export interface RecruitmentDashboard {
  openJobs: number;
  totalApplications: number;
  interviewsThisWeek: number;
  offersPending: number;
  pipeline?: PipelineStage[];
  upcomingInterviews?: UpcomingInterview[];
  recentCandidates?: RecentCandidate[];
}

export interface PipelineStage {
  stage: string;
  stageName: string;
  count: number;
}

export interface UpcomingInterview {
  id: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  interviewType: string;
  scheduledAt: string;
  interviewerName?: string;
  status: string;
}

export interface RecentCandidate {
  id: string;
  fullName: string;
  email: string;
  currentJobTitle?: string;
  createdAt: string;
}

export interface LeaveRequestSummary {
  id: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
}

export interface EmployeeOnLeave {
  id: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
}

/**
 * Dashboard service for fetching aggregated dashboard data.
 */
@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);

  // Use proxy URLs (proxy.conf.js adds auth headers)
  private readonly adminUrl = '/api/admin';
  private readonly recruitmentUrl = '/api/recruitment';
  private readonly hrUrl = '/api/v1';

  /**
   * Get aggregated dashboard statistics.
   * Returns default values immediately if API calls fail.
   */
  getDashboardStats(): Observable<DashboardStats> {
    // Return defaults immediately, then update from APIs
    const defaults: DashboardStats = {
      employeeCount: 0,
      pendingLeaveRequests: 0,
      openJobPostings: 0,
      nextPayrollDate: this.getNextPayrollDate()
    };

    // Use forkJoin with proper error handling - returns when ALL complete
    return forkJoin({
      admin: this.getAdminDashboard(),
      recruitment: this.getRecruitmentDashboard()
    }).pipe(
      map(({ admin, recruitment }) => ({
        employeeCount: admin?.userStats?.activeUsers ?? 0,
        pendingLeaveRequests: 0,
        openJobPostings: recruitment?.openJobs ?? 0,
        nextPayrollDate: this.getNextPayrollDate()
      })),
      catchError(() => of(defaults))
    );
  }

  /**
   * Get admin dashboard data.
   */
  getAdminDashboard(): Observable<AdminDashboard | null> {
    return this.http.get<AdminDashboard>(`${this.adminUrl}/dashboard`).pipe(
      catchError(() => of(null))
    );
  }

  /**
   * Get recruitment dashboard data.
   */
  getRecruitmentDashboard(): Observable<RecruitmentDashboard | null> {
    return this.http.get<RecruitmentDashboard>(`${this.recruitmentUrl}/dashboard`).pipe(
      catchError(() => of(null))
    );
  }

  /**
   * Get upcoming interviews for the main dashboard.
   */
  getUpcomingInterviews(): Observable<UpcomingInterview[]> {
    return this.http.get<UpcomingInterview[]>(`${this.recruitmentUrl}/interviews/upcoming`).pipe(
      catchError(() => of([]))
    );
  }

  /**
   * Get recent candidates.
   */
  getRecentCandidates(): Observable<RecentCandidate[]> {
    const params = new HttpParams().set('page', '0').set('size', '5');
    return this.http.get<{ content: RecentCandidate[] }>(`${this.recruitmentUrl}/candidates`, { params }).pipe(
      map(response => response.content || []),
      catchError(() => of([]))
    );
  }

  /**
   * Get pending leave requests.
   */
  getPendingLeaveRequests(): Observable<LeaveRequestSummary[]> {
    const params = new HttpParams().set('page', '0').set('size', '5');
    return this.http.get<{ content: LeaveRequestSummary[] }>(`${this.hrUrl}/leave/pending`, { params }).pipe(
      map(response => response.content || []),
      catchError(() => of([]))
    );
  }

  /**
   * Get employees on leave today.
   */
  getEmployeesOnLeaveToday(): Observable<EmployeeOnLeave[]> {
    return this.http.get<EmployeeOnLeave[]>(`${this.hrUrl}/leave/on-leave-today`).pipe(
      catchError(() => of([]))
    );
  }

  /**
   * Get pipeline summary.
   */
  getPipelineSummary(): Observable<PipelineStage[]> {
    return this.http.get<PipelineStage[]>(`${this.recruitmentUrl}/pipeline`).pipe(
      catchError(() => of([]))
    );
  }

  /**
   * Calculate next payroll date (last day of current month).
   */
  private getNextPayrollDate(): string {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}
