import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  getLeaveStatusConfig,
  getVariantClasses,
  getStatusHexColors,
  HexColorPair
} from '@shared/ui/status-config';

export type LeaveType = 'ANNUAL' | 'SICK' | 'FAMILY_RESPONSIBILITY' | 'MATERNITY' | 'PARENTAL' | 'UNPAID' | 'STUDY';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveBalance {
  id: string;
  leaveType: LeaveType;
  year: number;
  cycleStartDate?: string;
  entitlement: number;
  used: number;
  pending: number;
  carriedOver: number;
  available: number;
}

export interface EmployeeSummary {
  id: string;
  employeeNumber: string;
  fullName: string;
}

export interface LeaveRequest {
  id: string;
  employee: EmployeeSummary;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  status: LeaveStatus;
  reason?: string;
  approver?: EmployeeSummary;
  approvalDate?: string;
  approverComment?: string;
  cancellationDate?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaveRequest {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface LeaveSummary {
  employeeId: string;
  employeeName: string;
  balances: LeaveBalance[];
}

export interface AdjustmentRequest {
  leaveType: LeaveType;
  adjustment: number;
  reason: string;
}

export interface AdjustmentResponse {
  balanceId: string;
  leaveType: LeaveType;
  previousEntitlement: number;
  newEntitlement: number;
  adjustment: number;
  reason: string;
  adjustedBy: string;
  adjustedAt: string;
}

export interface SickLeaveCycleInfo {
  cycleStart: string;
  cycleEnd: string;
  entitlement: number;
  used: number;
  pending: number;
  available: number;
}

/**
 * Service for leave management API operations.
 */
@Injectable({
  providedIn: 'root'
})
export class LeaveService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/v1/leave`;

  /**
   * Get leave balances for an employee.
   */
  getEmployeeBalances(employeeId: string, year?: number): Observable<LeaveBalance[]> {
    let params = new HttpParams();
    if (year) {
      params = params.set('year', year.toString());
    }
    return this.http.get<LeaveBalance[]>(`${this.apiUrl}/employees/${employeeId}/balances`, { params });
  }

  /**
   * Get leave requests for an employee.
   */
  getEmployeeRequests(
    employeeId: string,
    page: number = 0,
    size: number = 10,
    status?: LeaveStatus
  ): Observable<PageResponse<LeaveRequest>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<PageResponse<LeaveRequest>>(
      `${this.apiUrl}/employees/${employeeId}/requests`,
      { params }
    );
  }

  /**
   * Create a leave request for an employee.
   */
  createLeaveRequest(employeeId: string, request: CreateLeaveRequest): Observable<LeaveRequest> {
    return this.http.post<LeaveRequest>(
      `${this.apiUrl}/employees/${employeeId}/requests`,
      request
    );
  }

  /**
   * Cancel a leave request.
   */
  cancelLeaveRequest(requestId: string, reason: string): Observable<LeaveRequest> {
    return this.http.post<LeaveRequest>(
      `${this.apiUrl}/requests/${requestId}/cancel`,
      null,
      { params: { reason } }
    );
  }

  /**
   * Get a single leave request.
   */
  getLeaveRequest(requestId: string): Observable<LeaveRequest> {
    return this.http.get<LeaveRequest>(`${this.apiUrl}/requests/${requestId}`);
  }

  /**
   * Get pending leave requests for HR approval.
   * Phase 1: Returns all pending requests for HR/Admin users.
   */
  getPendingApprovals(page: number = 0, size: number = 10): Observable<PageResponse<LeaveRequest>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PageResponse<LeaveRequest>>(`${this.apiUrl}/pending`, { params });
  }

  /**
   * Approve a leave request (HR/Admin action).
   */
  approveLeaveRequest(requestId: string, comment?: string): Observable<LeaveRequest> {
    const body = comment ? { approved: true, comment } : { approved: true };
    return this.http.post<LeaveRequest>(
      `${this.apiUrl}/requests/${requestId}/approve`,
      body
    );
  }

  /**
   * Reject a leave request (HR/Admin action).
   */
  rejectLeaveRequest(requestId: string, reason: string): Observable<LeaveRequest> {
    return this.http.post<LeaveRequest>(
      `${this.apiUrl}/requests/${requestId}/reject`,
      { approved: false, comment: reason }
    );
  }

  /**
   * Get human-readable label for leave type.
   */
  static getLeaveTypeLabel(type: LeaveType): string {
    const labels: Record<LeaveType, string> = {
      ANNUAL: 'Annual Leave',
      SICK: 'Sick Leave',
      FAMILY_RESPONSIBILITY: 'Family Responsibility',
      MATERNITY: 'Maternity Leave',
      PARENTAL: 'Parental Leave',
      UNPAID: 'Unpaid Leave',
      STUDY: 'Study Leave'
    };
    return labels[type] || type;
  }

  /**
   * Get Tailwind classes for leave status (recommended for dark mode support).
   * Uses centralized status config for consistency.
   */
  static getStatusColor(status: LeaveStatus): string {
    const config = getLeaveStatusConfig(status);
    return getVariantClasses(config.variant);
  }

  /**
   * Get hex color styles for leave status (for inline styles).
   */
  static getStatusHexColor(status: LeaveStatus): HexColorPair {
    const config = getLeaveStatusConfig(status);
    return getStatusHexColors(config);
  }

  /**
   * Get all employees' leave balances (HR view).
   */
  getAllEmployeeLeaveBalances(year: number, page: number = 0, size: number = 20): Observable<PageResponse<LeaveSummary>> {
    const params = new HttpParams()
      .set('year', year.toString())
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PageResponse<LeaveSummary>>(`${this.apiUrl}/employees/balances`, { params });
  }

  /**
   * Adjust an employee's leave balance (HR only).
   */
  adjustLeaveBalance(employeeId: string, request: AdjustmentRequest): Observable<AdjustmentResponse> {
    return this.http.post<AdjustmentResponse>(
      `${this.apiUrl}/employees/${employeeId}/balances/adjust`,
      request
    );
  }

  /**
   * Get sick leave cycle information for an employee.
   */
  getSickLeaveCycleInfo(employeeId: string): Observable<SickLeaveCycleInfo> {
    return this.http.get<SickLeaveCycleInfo>(`${this.apiUrl}/employees/${employeeId}/sick-cycle`);
  }

  // ==========================================
  // Self-Service Methods (Any Authenticated User)
  // ==========================================

  /**
   * Get MY leave balances (self-service - any authenticated user).
   * Backend uses JWT token to identify the employee.
   */
  getMyBalances(year?: number): Observable<LeaveBalance[]> {
    let params = new HttpParams();
    if (year) {
      params = params.set('year', year.toString());
    }
    return this.http.get<LeaveBalance[]>(`${this.apiUrl}/balances`, { params });
  }

  /**
   * Get MY leave requests (self-service - any authenticated user).
   * Backend uses JWT token to identify the employee.
   */
  getMyRequests(
    page: number = 0,
    size: number = 10,
    status?: LeaveStatus
  ): Observable<PageResponse<LeaveRequest>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<PageResponse<LeaveRequest>>(
      `${this.apiUrl}/my-requests`,
      { params }
    );
  }

  /**
   * Create a leave request for myself (self-service).
   * Backend uses JWT token to identify the employee.
   */
  createMyLeaveRequest(request: CreateLeaveRequest): Observable<LeaveRequest> {
    return this.http.post<LeaveRequest>(`${this.apiUrl}/requests`, request);
  }

  /**
   * Get MY sick leave cycle info (self-service).
   * Backend uses JWT token to identify the employee.
   */
  getMySickLeaveCycleInfo(): Observable<SickLeaveCycleInfo> {
    return this.http.get<SickLeaveCycleInfo>(`${this.apiUrl}/sick-cycle`);
  }
}
