import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import { AdminUser } from '../models/user.model';
import { AuthService } from './auth.service';

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phoneNumber?: string;
  mobileNumber?: string;
  timezone?: string;
  language?: string;
}

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
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
}

export interface UserPreferences {
  timezone: string;
  language: string;
  dateFormat: string;
  notifications: NotificationPreferences;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  private get userId(): string {
    return this.authService.currentUser()?.id ?? '';
  }

  /**
   * Get current user profile
   */
  getCurrentProfile(): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.apiUrl}/auth/me`);
  }

  /**
   * Update user profile
   */
  updateProfile(data: UpdateProfileRequest): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.apiUrl}/users/${this.userId}`, data).pipe(
      tap(updatedUser => {
        // Update the current user in AuthService
        this.updateCurrentUser(updatedUser);
      })
    );
  }

  /**
   * Upload avatar image
   */
  uploadAvatar(file: File): Observable<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.http.post<{ avatarUrl: string }>(`${this.apiUrl}/users/${this.userId}/avatar`, formData).pipe(
      tap(response => {
        const currentUser = this.authService.currentUser();
        if (currentUser) {
          this.updateCurrentUser({ ...currentUser, avatarUrl: response.avatarUrl });
        }
      })
    );
  }

  /**
   * Delete avatar
   */
  deleteAvatar(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${this.userId}/avatar`).pipe(
      tap(() => {
        const currentUser = this.authService.currentUser();
        if (currentUser) {
          this.updateCurrentUser({ ...currentUser, avatarUrl: undefined });
        }
      })
    );
  }

  /**
   * Change password
   */
  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/users/${this.userId}/change-password`, request);
  }

  /**
   * Setup MFA - returns QR code and backup codes
   */
  setupMfa(): Observable<MfaSetupResponse> {
    return this.http.post<MfaSetupResponse>(`${this.apiUrl}/users/${this.userId}/mfa/setup`, {});
  }

  /**
   * Verify MFA code and enable MFA
   */
  verifyMfa(code: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/users/${this.userId}/mfa/verify`, { code }).pipe(
      tap(() => {
        const currentUser = this.authService.currentUser();
        if (currentUser) {
          this.updateCurrentUser({ ...currentUser, mfaEnabled: true });
        }
      })
    );
  }

  /**
   * Disable MFA
   */
  disableMfa(password: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/users/${this.userId}/mfa/disable`, { password }).pipe(
      tap(() => {
        const currentUser = this.authService.currentUser();
        if (currentUser) {
          this.updateCurrentUser({ ...currentUser, mfaEnabled: false });
        }
      })
    );
  }

  /**
   * Update user preferences
   */
  updatePreferences(preferences: Partial<UserPreferences>): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.apiUrl}/users/${this.userId}/preferences`, preferences).pipe(
      tap(updatedUser => {
        this.updateCurrentUser(updatedUser);
      })
    );
  }

  /**
   * Sign out from all devices
   */
  signOutAllDevices(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/users/${this.userId}/sign-out-all`, {});
  }

  /**
   * Helper to update current user in storage and signal
   */
  private updateCurrentUser(user: AdminUser): void {
    this.authService.currentUser.set(user);
    localStorage.setItem('admin_user', JSON.stringify(user));
  }
}
