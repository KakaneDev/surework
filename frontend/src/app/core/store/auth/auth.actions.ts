import { createAction, props } from '@ngrx/store';
import { CurrentUser, LoginRequest, LoginResponse, MfaVerifyRequest } from '@core/services/auth.service';

// Login
export const login = createAction(
  '[Auth] Login',
  props<{ request: LoginRequest }>()
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ response: LoginResponse }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
);

// MFA
export const mfaRequired = createAction(
  '[Auth] MFA Required',
  props<{ challengeToken: string }>()
);

export const verifyMfa = createAction(
  '[Auth] Verify MFA',
  props<{ request: MfaVerifyRequest }>()
);

export const verifyMfaSuccess = createAction(
  '[Auth] Verify MFA Success',
  props<{ response: LoginResponse }>()
);

export const verifyMfaFailure = createAction(
  '[Auth] Verify MFA Failure',
  props<{ error: string }>()
);

// Load User
export const loadCurrentUser = createAction('[Auth] Load Current User');

export const loadCurrentUserSuccess = createAction(
  '[Auth] Load Current User Success',
  props<{ user: CurrentUser }>()
);

export const loadCurrentUserFailure = createAction(
  '[Auth] Load Current User Failure',
  props<{ error: string }>()
);

// Logout
export const logout = createAction('[Auth] Logout');

export const logoutSuccess = createAction('[Auth] Logout Success');

// Session
export const checkSession = createAction('[Auth] Check Session');

export const sessionExpired = createAction('[Auth] Session Expired');
