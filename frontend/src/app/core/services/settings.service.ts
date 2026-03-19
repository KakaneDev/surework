import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface MfaSetupResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface NotificationPreferences {
  leaveApproved: boolean;
  leaveRejected: boolean;
  leaveReminders: boolean;
  payslipAvailable: boolean;
  documentShared: boolean;
  systemAnnouncements: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  dateFormat: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  logo?: string;
  address?: {
    streetAddress: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  phone?: string;
  email?: string;
  website?: string;
  taxNumber?: string;
  registrationNumber?: string;
}

export interface TenantUser {
  id: string;
  username?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  roles?: Array<{ code: string; name: string }>; // For future rich role data
  roleNames?: string[]; // Backend returns roleNames as strings
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'LOCKED';
  lastLoginAt?: string;
  createdAt?: string;
  mfaEnabled?: boolean;
}

export interface InviteUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  roleIds: string[];
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description?: string;
  permissions: Array<{ code: string; name: string }>;
}

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  defaultDays: number;
  carryForwardDays: number;
  requiresApproval: boolean;
  allowNegativeBalance: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  description?: string;
}

export interface CreateLeaveTypeRequest {
  name: string;
  code: string;
  defaultDays: number;
  carryForwardDays: number;
  requiresApproval: boolean;
  allowNegativeBalance: boolean;
  description?: string;
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

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly adminUrl = '/api/admin';
  private readonly hrUrl = '/api/hr';

  // ===== Account Security =====

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.adminUrl}/auth/password/change`, request);
  }

  setupMfa(userId: string): Observable<MfaSetupResponse> {
    return this.http.post<MfaSetupResponse>(`${this.adminUrl}/users/${userId}/mfa/setup`, {});
  }

  verifyMfaSetup(userId: string, code: string): Observable<void> {
    return this.http.post<void>(`${this.adminUrl}/users/${userId}/mfa/verify`, { code });
  }

  disableMfa(userId: string, code: string): Observable<void> {
    return this.http.post<void>(`${this.adminUrl}/users/${userId}/mfa/disable`, { code });
  }

  // ===== Notification Preferences =====

  getNotificationPreferences(): Observable<NotificationPreferences> {
    return this.http.get<NotificationPreferences>(`${this.adminUrl}/notifications/preferences`);
  }

  updateNotificationPreferences(preferences: NotificationPreferences): Observable<NotificationPreferences> {
    return this.http.put<NotificationPreferences>(`${this.adminUrl}/notifications/preferences`, preferences);
  }

  // ===== Company Profile =====

  getCompanyProfile(tenantId: string): Observable<CompanyProfile> {
    return this.http.get<CompanyProfile>(`${this.adminUrl}/tenants/${tenantId}`);
  }

  updateCompanyProfile(tenantId: string, profile: Partial<CompanyProfile>): Observable<CompanyProfile> {
    return this.http.put<CompanyProfile>(`${this.adminUrl}/tenants/${tenantId}`, profile);
  }

  uploadCompanyLogo(tenantId: string, file: File): Observable<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ logoUrl: string }>(`${this.adminUrl}/tenants/${tenantId}/logo`, formData);
  }

  // ===== User Management =====

  getTenantUsers(tenantId: string, params: {
    page?: number;
    size?: number;
    search?: string;
    status?: string;
  } = {}): Observable<PageResponse<TenantUser>> {
    let httpParams = new HttpParams();
    if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    if (params.search) httpParams = httpParams.set('searchTerm', params.search); // Backend expects 'searchTerm'
    if (params.status && params.status !== 'all') httpParams = httpParams.set('status', params.status);

    return this.http.get<PageResponse<TenantUser>>(`${this.adminUrl}/tenants/${tenantId}/users`, { params: httpParams });
  }

  inviteUser(tenantId: string, request: InviteUserRequest): Observable<TenantUser> {
    return this.http.post<TenantUser>(`${this.adminUrl}/tenants/${tenantId}/users`, request);
  }

  updateUserRoles(tenantId: string, userId: string, roleIds: string[]): Observable<TenantUser> {
    return this.http.put<TenantUser>(`${this.adminUrl}/tenants/${tenantId}/users/${userId}/roles`, { roleIds });
  }

  activateUser(tenantId: string, userId: string): Observable<TenantUser> {
    return this.http.post<TenantUser>(`${this.adminUrl}/tenants/${tenantId}/users/${userId}/activate`, {});
  }

  deactivateUser(tenantId: string, userId: string): Observable<TenantUser> {
    return this.http.post<TenantUser>(`${this.adminUrl}/tenants/${tenantId}/users/${userId}/deactivate`, {});
  }

  resendInvitation(tenantId: string, userId: string): Observable<void> {
    return this.http.post<void>(`${this.adminUrl}/tenants/${tenantId}/users/${userId}/resend-invitation`, {});
  }

  // ===== Roles =====

  getRoles(tenantId: string): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.adminUrl}/tenants/${tenantId}/roles`);
  }

  // ===== Leave Types =====

  getLeaveTypes(): Observable<LeaveType[]> {
    return this.http.get<LeaveType[]>(`${this.hrUrl}/leave-types`);
  }

  createLeaveType(request: CreateLeaveTypeRequest): Observable<LeaveType> {
    return this.http.post<LeaveType>(`${this.hrUrl}/leave-types`, request);
  }

  updateLeaveType(id: string, request: Partial<CreateLeaveTypeRequest>): Observable<LeaveType> {
    return this.http.put<LeaveType>(`${this.hrUrl}/leave-types/${id}`, request);
  }

  deleteLeaveType(id: string): Observable<void> {
    return this.http.delete<void>(`${this.hrUrl}/leave-types/${id}`);
  }

  activateLeaveType(id: string): Observable<LeaveType> {
    return this.http.post<LeaveType>(`${this.hrUrl}/leave-types/${id}/activate`, {});
  }

  deactivateLeaveType(id: string): Observable<LeaveType> {
    return this.http.post<LeaveType>(`${this.hrUrl}/leave-types/${id}/deactivate`, {});
  }

  // ===== Setup / Onboarding Completion =====

  getComplianceDetails(): Observable<any> {
    return this.http.get('/api/v1/tenant/setup/compliance-details');
  }

  saveComplianceDetails(data: any): Observable<any> {
    return this.http.put('/api/v1/tenant/setup/compliance-details', data);
  }

  saveCompanySetupDetails(data: any): Observable<any> {
    return this.http.put('/api/v1/tenant/setup/company-details', data);
  }
}
