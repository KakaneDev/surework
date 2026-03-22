export interface AdminUser {
  id: string;
  tenantId?: string;
  username?: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  phoneNumber?: string;
  mobileNumber?: string;
  avatarUrl?: string;
  employeeId?: string;
  roles: AdminRoleResponse[];
  status: string;
  emailVerified?: boolean;
  mfaEnabled?: boolean;
  lastLoginAt?: string;
  timezone?: string;
  language?: string;
  createdAt: string;
}

export interface AdminRoleResponse {
  id: string;
  code: AdminRole;
  name: string;
  description?: string;
  permissions: AdminPermission[];
  active: boolean;
  systemRole: boolean;
}

export interface AdminPermission {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  resource: string;
  action: string;
}

export type AdminRole = 'SUPER_ADMIN' | 'SUPPORT_MANAGER' | 'SUPPORT_AGENT' | 'SALES_REP' | 'FINANCE_ANALYST' | 'TENANT_ADMIN' | 'HR_ADMIN' | 'MANAGER';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: AdminUser;
  mfaRequired?: boolean;
  mfaChallengeToken?: string;
  remainingAttempts?: number;
}

export interface LoginRequest {
  username: string;
  password: string;
  mfaCode?: string;
}
