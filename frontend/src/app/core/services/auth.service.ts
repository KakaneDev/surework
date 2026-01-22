import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
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
  user?: BackendUserResponse;
}

interface BackendUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: { code: string }[];
}

export interface MfaVerifyRequest {
  challengeToken: string;
  mfaCode: string;
}

export interface CurrentUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roles: string[];
  permissions: string[];
  mfaEnabled: boolean;
}

/**
 * Authentication service for login, logout, and token management.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  // Use admin-service directly for auth (port 8081)
  private readonly apiUrl = 'http://localhost:8081/api/admin/auth';

  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  /**
   * Login with email and password.
   */
  login(request: LoginRequest): Observable<LoginResponse> {
    // Transform to backend format (uses username field for email)
    const backendRequest: BackendLoginRequest = {
      username: request.email,
      password: request.password,
      mfaCode: request.mfaCode
    };
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, backendRequest).pipe(
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
   */
  getCurrentUser(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${this.apiUrl}/me`);
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
   * Store tokens in localStorage.
   */
  private storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  /**
   * Clear tokens from localStorage.
   */
  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }
}
