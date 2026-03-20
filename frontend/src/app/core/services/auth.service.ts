import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { environment } from '@env/environment';

export interface LoginRequest {
  email: string;
  password: string;
  mfaCode?: string;
}

// Internal request format for backend
interface BackendLoginRequest {
  username: string;
  password: string;
  mfaCode?: string;
}

export interface LoginResponse {
  accessToken: string | null;
  refreshToken: string | null;
  expiresIn: number;
  tokenType: string;
  mfaRequired: boolean;
  mfaChallengeToken?: string | null;
  remainingAttempts?: number | null;
  user?: BackendUserResponse;
}

interface BackendUserResponse {
  id: string;
  employeeId?: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: BackendRoleResponse[];
  mfaEnabled?: boolean;
}

interface BackendRoleResponse {
  code: string;
  name?: string;
  permissions?: { code: string }[];
}

export interface MfaVerifyRequest {
  challengeToken: string;
  mfaCode: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ActiveSession {
  id: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  ipAddress: string;
  location?: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface CurrentUser {
  userId: string;
  employeeId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roles: string[];
  permissions: string[];
  mfaEnabled: boolean;
}

export interface TenantSetupStatus {
  companyDetailsComplete: boolean;
  complianceDetailsComplete: boolean;
}

/**
 * Authentication service for login, logout, and token management.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  // Use relative URL to go through Angular proxy (routes to admin-service on port 8088)
  private readonly apiUrl = '/api/admin/auth';

  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  /** Reactive signal tracking tenant setup completion state. */
  tenantSetupStatus = signal<TenantSetupStatus>({
    companyDetailsComplete: false,
    complianceDetailsComplete: false
  });

  /** Computed signal: true only when both setup gates are satisfied. */
  isSetupComplete = computed(() => {
    const status = this.tenantSetupStatus();
    return status.companyDetailsComplete && status.complianceDetailsComplete;
  });

  constructor() {
    // Hydrate setup status from any token already persisted in localStorage.
    const existingToken = this.getAccessToken();
    if (existingToken) {
      this.updateSetupStatusFromToken(existingToken);
    }
  }

  /**
   * Parse setup-status claims from a JWT and update the signal.
   * Silently ignores malformed tokens.
   */
  private updateSetupStatusFromToken(token: string): void {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.tenantSetupStatus.set({
        companyDetailsComplete: payload.companyDetailsComplete ?? false,
        complianceDetailsComplete: payload.complianceDetailsComplete ?? false
      });
    } catch {
      // If token can't be parsed, leave defaults
    }
  }

  /**
   * Fetch setup status directly from the backend and update the signal.
   * Call this after completing a setup step so guards re-evaluate.
   */
  refreshSetupStatus(): Observable<void> {
    return this.http.get<TenantSetupStatus>('/api/v1/tenant/setup/status').pipe(
      tap(status => this.tenantSetupStatus.set(status)),
      map(() => void 0)
    );
  }

  /**
   * Login with email and password.
   */
  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, {
      email: request.email,
      password: request.password,
      mfaCode: request.mfaCode
    }).pipe(
      tap(response => {
        if (response.accessToken) {
          this.storeTokens(response.accessToken, response.refreshToken!);
        }
      })
    );
  }

  /**
   * Verify MFA code.
   */
  verifyMfa(request: MfaVerifyRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/mfa/verify`, request).pipe(
      tap(response => {
        if (response.accessToken) {
          this.storeTokens(response.accessToken, response.refreshToken!);
        }
      })
    );
  }

  /**
   * Refresh access token.
   */
  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<LoginResponse>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap(response => {
        if (response.accessToken) {
          this.storeTokens(response.accessToken, response.refreshToken!);
        }
      })
    );
  }

  /**
   * Logout current user.
   */
  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => this.clearTokens())
    );
  }

  /**
   * Get current user information.
   * Transforms backend UserResponse to frontend CurrentUser format.
   */
  getCurrentUser(): Observable<CurrentUser> {
    return this.http.get<BackendUserResponse>(`${this.apiUrl}/me`).pipe(
      map(user => this.mapToCurrentUser(user))
    );
  }

  /**
   * Map backend user response to frontend CurrentUser format.
   */
  private mapToCurrentUser(user: BackendUserResponse): CurrentUser {
    // Extract unique permission codes from all roles
    const permissions = [...new Set(
      user.roles.flatMap(r => r.permissions?.map(p => p.code) ?? [])
    )];

    return {
      userId: user.id,
      employeeId: user.employeeId ?? null,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      roles: user.roles.map(r => r.code),
      permissions,
      mfaEnabled: user.mfaEnabled ?? false
    };
  }

  /**
   * Check if user is authenticated.
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) {
      return false;
    }
    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  /**
   * Get access token.
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Get refresh token.
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Store tokens in localStorage and sync setup-status signal from new token.
   */
  storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    this.updateSetupStatusFromToken(accessToken);
  }

  /**
   * Clear tokens from localStorage.
   */
  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Upload user avatar.
   */
  uploadAvatar(userId: string, file: File): Observable<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ avatarUrl: string }>(`/api/admin/users/${userId}/avatar`, formData);
  }

  /**
   * Delete user avatar.
   */
  deleteAvatar(userId: string): Observable<void> {
    return this.http.delete<void>(`/api/admin/users/${userId}/avatar`);
  }

  /**
   * Request password reset email.
   */
  forgotPassword(request: ForgotPasswordRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/password/forgot`, request);
  }

  /**
   * Reset password with token.
   */
  resetPassword(request: ResetPasswordRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/password/reset`, request);
  }

  /**
   * Validate password reset token.
   */
  validateResetToken(token: string): Observable<{ valid: boolean; email?: string }> {
    return this.http.get<{ valid: boolean; email?: string }>(`${this.apiUrl}/password/validate-token`, {
      params: { token }
    });
  }

  /**
   * Get active sessions for current user.
   */
  getActiveSessions(): Observable<ActiveSession[]> {
    return this.http.get<ActiveSession[]>(`${this.apiUrl}/sessions`);
  }

  /**
   * Revoke a specific session.
   */
  revokeSession(sessionId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/sessions/${sessionId}`);
  }

  /**
   * Revoke all sessions except current.
   */
  revokeAllOtherSessions(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/sessions/others`);
  }
}
