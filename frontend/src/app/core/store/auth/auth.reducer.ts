import { createReducer, on } from '@ngrx/store';
import { CurrentUser } from '@core/services/auth.service';
import {
  login,
  loginSuccess,
  loginFailure,
  mfaRequired,
  verifyMfa,
  verifyMfaSuccess,
  verifyMfaFailure,
  loadCurrentUser,
  loadCurrentUserSuccess,
  loadCurrentUserFailure,
  logout,
  logoutSuccess,
  sessionExpired,
  loginRateLimited,
  accountLocked,
  clearRateLimit
} from './auth.actions';

export interface RateLimitInfo {
  remainingAttempts?: number;
  isLocked: boolean;
  lockoutEndTime?: number;
}

export interface AuthState {
  user: CurrentUser | null;
  loading: boolean;
  error: string | null;
  mfaRequired: boolean;
  mfaChallengeToken: string | null;
  rateLimit: RateLimitInfo;
}

export const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  mfaRequired: false,
  mfaChallengeToken: null,
  rateLimit: {
    isLocked: false
  }
};

export const authReducer = createReducer(
  initialState,

  // Login
  on(login, (state) => ({
    ...state,
    loading: true,
    error: null,
    mfaRequired: false,
    mfaChallengeToken: null,
  })),

  on(loginSuccess, (state) => ({
    ...state,
    loading: false,
    error: null,
  })),

  on(loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // MFA
  on(mfaRequired, (state, { challengeToken }) => ({
    ...state,
    loading: false,
    mfaRequired: true,
    mfaChallengeToken: challengeToken,
  })),

  on(verifyMfa, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(verifyMfaSuccess, (state) => ({
    ...state,
    loading: false,
    mfaRequired: false,
    mfaChallengeToken: null,
  })),

  on(verifyMfaFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Load User
  on(loadCurrentUser, (state) => ({
    ...state,
    loading: true,
  })),

  on(loadCurrentUserSuccess, (state, { user }) => ({
    ...state,
    user,
    loading: false,
    error: null,
  })),

  on(loadCurrentUserFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Logout
  on(logout, (state) => ({
    ...state,
    loading: true,
  })),

  on(logoutSuccess, () => initialState),

  // Session
  on(sessionExpired, () => initialState),

  // Rate Limiting
  on(loginRateLimited, (state, { remainingAttempts }) => ({
    ...state,
    rateLimit: {
      ...state.rateLimit,
      remainingAttempts,
      isLocked: false
    }
  })),

  on(accountLocked, (state, { lockoutEndTime }) => ({
    ...state,
    loading: false,
    rateLimit: {
      ...state.rateLimit,
      isLocked: true,
      lockoutEndTime
    }
  })),

  on(clearRateLimit, (state) => ({
    ...state,
    rateLimit: {
      isLocked: false
    }
  }))
);
