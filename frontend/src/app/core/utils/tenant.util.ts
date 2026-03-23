import { environment } from '@env/environment';

/**
 * Get the current tenant ID from the JWT token, falling back to environment default.
 * For signup users, the tenant ID is in the JWT claims, not in environment.
 */
export function getTenantId(): string {
  try {
    const token = localStorage.getItem('access_token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.tenantId) return payload.tenantId;
    }
  } catch { /* fallback to environment */ }
  return environment.tenantId;
}
