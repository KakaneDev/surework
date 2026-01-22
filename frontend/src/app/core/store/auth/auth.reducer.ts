import { createReducer, on } from '@ngrx/store';
import { CurrentUser } from '@core/services/auth.service';
import * as AuthActions from './auth.actions';

export interface AuthState {
  user: CurrentUser | null;
  loading: boolean;
  error: string | null;
  mfaRequired: boolean;
  mfaChallengeToken: string | null;
}

export const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  mfaRequired: false,
  mfaChallengeToken: null,
};

export const authReducer = createReducer(
  initialState,

  // Login
  on(AuthActions.login, (state) => ({
    ...state,
    loading: true,
    error: null,
    mfaRequired: false,
    mfaChallengeToken: null,
  })),

  on(AuthActions.loginSuccess, (state) => ({
    ...state,
    loading: false,
    error: null,
  })),

  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // MFA
  on(AuthActions.mfaRequired, (state, { challengeToken }) => ({
    ...state,
    loading: false,
    mfaRequired: true,
    mfaChallengeToken: challengeToken,
  })),

  on(AuthActions.verifyMfa, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(AuthActions.verifyMfaSuccess, (state) => ({
    ...state,
    loading: false,
    mfaRequired: false,
    mfaChallengeToken: null,
  })),

  on(AuthActions.verifyMfaFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Load User
  on(AuthActions.loadCurrentUser, (state) => ({
    ...state,
    loading: true,
  })),

  on(AuthActions.loadCurrentUserSuccess, (state, { user }) => ({
    ...state,
    user,
    loading: false,
    error: null,
  })),

  on(AuthActions.loadCurrentUserFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Logout
  on(AuthActions.logout, (state) => ({
    ...state,
    loading: true,
  })),

  on(AuthActions.logoutSuccess, () => initialState),

  // Session
  on(AuthActions.sessionExpired, () => initialState)
);
