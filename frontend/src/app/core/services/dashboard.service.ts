import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, catchError, map } from 'rxjs';

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
}

/**
 * Dashboard service for fetching aggregated dashboard data.
 */
@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);

  // Direct service URLs (bypassing gateway for now)
  private readonly adminUrl = 'http://localhost:8081/api/admin';
  private readonly recruitmentUrl = 'http://localhost:8084/api/recruitment';

  /**
   * Get aggregated dashboard statistics.
   */
  getDashboardStats(): Observable<DashboardStats> {
    return forkJoin({
      admin: this.getAdminDashboard(),
      recruitment: this.getRecruitmentDashboard()
    }).pipe(
      map(({ admin, recruitment }) => ({
        employeeCount: admin?.userStats?.activeUsers ?? 0,
        pendingLeaveRequests: 0, // Leave service not implemented yet
        openJobPostings: recruitment?.openJobs ?? 0,
        nextPayrollDate: this.getNextPayrollDate()
      }))
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
