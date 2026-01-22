import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectCurrentUser = createSelector(
  selectAuthState,
  (state) => state.user
);

export const selectIsAuthenticated = createSelector(
  selectCurrentUser,
  (user) => !!user
);

export const selectAuthLoading = createSelector(
  selectAuthState,
  (state) => state.loading
);

export const selectAuthError = createSelector(
  selectAuthState,
  (state) => state.error
);

export const selectMfaRequired = createSelector(
  selectAuthState,
  (state) => state.mfaRequired
);

export const selectMfaChallengeToken = createSelector(
  selectAuthState,
  (state) => state.mfaChallengeToken
);

export const selectUserRoles = createSelector(
  selectCurrentUser,
  (user) => user?.roles ?? []
);

export const selectUserPermissions = createSelector(
  selectCurrentUser,
  (user) => user?.permissions ?? []
);

export const selectHasRole = (role: string) => createSelector(
  selectUserRoles,
  (roles) => roles.includes(role)
);

export const selectHasPermission = (permission: string) => createSelector(
  selectUserPermissions,
  (permissions) => permissions.includes(permission) || permissions.includes('*')
);
