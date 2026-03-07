export interface Tenant {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone?: string;
  plan: TenantPlan;
  status: TenantStatus;
  trialEndsAt?: string;
  subscriptionStartDate?: string;
  mrr: number;
  employeeCount: number;
  userCount: number;
  onboardingStage: OnboardingStage;
  healthScore?: number;
  churnRisk?: ChurnRisk;
  createdAt: string;
  updatedAt: string;
}

export type TenantPlan = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'TRIAL';
export type TenantStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELLED' | 'PENDING_VERIFICATION';
export type OnboardingStage = 'STARTED' | 'EMAIL_VERIFIED' | 'COMPANY_SETUP' | 'USERS_ADDED' | 'ACTIVE';
export type ChurnRisk = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TenantActivity {
  id: string;
  tenantId: string;
  type: string;
  description: string;
  userId?: string;
  userName?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface TenantStats {
  totalTenants: number;
  activeTrials: number;
  activePaid: number;
  suspended: number;
  churnedThisMonth: number;
  newThisMonth: number;
}

export interface TenantFilters {
  search?: string;
  status?: TenantStatus;
  plan?: TenantPlan;
  churnRisk?: ChurnRisk;
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
