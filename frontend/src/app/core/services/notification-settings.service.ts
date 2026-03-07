import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ===== Notification Types =====

export type NotificationType =
  | 'LEAVE_SUBMITTED'
  | 'LEAVE_APPROVED'
  | 'LEAVE_REJECTED'
  | 'LEAVE_CANCELLED'
  | 'PAYSLIP_READY'
  | 'PAYROLL_PROCESSED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_EXPIRING'
  | 'DOCUMENT_SHARED'
  | 'TICKET_CREATED'
  | 'TICKET_UPDATED'
  | 'TICKET_RESOLVED'
  | 'TICKET_ASSIGNED'
  | 'APPLICATION_RECEIVED'
  | 'INTERVIEW_SCHEDULED'
  | 'OFFER_EXTENDED'
  | 'SYSTEM_ANNOUNCEMENT'
  | 'ACCOUNT_UPDATED'
  | 'PASSWORD_CHANGED';

// ===== Tenant Settings DTOs =====

export interface TenantSettingResponse {
  id: string;
  type: NotificationType;
  displayName: string;
  description: string;
  category: string;
  categoryIcon: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  mandatory: boolean;
}

export interface CategoryGroup {
  name: string;
  icon: string;
  settings: TenantSettingResponse[];
}

export interface GroupedSettingsResponse {
  categories: CategoryGroup[];
}

export interface UpdateTenantSettingRequest {
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
}

export interface TypeChannelUpdate {
  type: NotificationType;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
}

export interface BulkUpdateRequest {
  settings: TypeChannelUpdate[];
}

// ===== User Preferences DTOs =====

export interface UserPreferenceResponse {
  type: NotificationType;
  displayName: string;
  description: string;
  category: string;
  categoryIcon: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  emailDisabled: boolean;
  smsDisabled: boolean;
  inAppDisabled: boolean;
  mandatory: boolean;
}

export interface UserCategoryGroup {
  name: string;
  icon: string;
  preferences: UserPreferenceResponse[];
}

export interface GroupedUserPreferencesResponse {
  categories: UserCategoryGroup[];
}

export interface UpdateUserPreferenceRequest {
  emailDisabled: boolean;
  smsDisabled: boolean;
  inAppDisabled: boolean;
}

/**
 * Service for managing notification channel settings.
 * Provides endpoints for both tenant admin settings and user preferences.
 */
@Injectable({ providedIn: 'root' })
export class NotificationSettingsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/notifications/settings';

  // ===== Tenant Settings (Admin) =====

  /**
   * Get all tenant notification settings grouped by category.
   */
  getTenantSettings(): Observable<GroupedSettingsResponse> {
    return this.http.get<GroupedSettingsResponse>(`${this.baseUrl}/tenant`);
  }

  /**
   * Update a single tenant notification setting.
   */
  updateTenantSetting(type: NotificationType, request: UpdateTenantSettingRequest): Observable<TenantSettingResponse> {
    return this.http.put<TenantSettingResponse>(`${this.baseUrl}/tenant/${type}`, request);
  }

  /**
   * Bulk update tenant settings.
   */
  bulkUpdateTenantSettings(request: BulkUpdateRequest): Observable<GroupedSettingsResponse> {
    return this.http.put<GroupedSettingsResponse>(`${this.baseUrl}/tenant`, request);
  }

  // ===== User Preferences =====

  /**
   * Get user's effective notification preferences.
   */
  getUserPreferences(): Observable<GroupedUserPreferencesResponse> {
    return this.http.get<GroupedUserPreferencesResponse>(`${this.baseUrl}/preferences`);
  }

  /**
   * Update user preference for a notification type.
   */
  updateUserPreference(type: NotificationType, request: UpdateUserPreferenceRequest): Observable<UserPreferenceResponse> {
    return this.http.put<UserPreferenceResponse>(`${this.baseUrl}/preferences/${type}`, request);
  }
}
