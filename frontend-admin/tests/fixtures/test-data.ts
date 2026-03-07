/**
 * Test Data for SureWork Admin Dashboard E2E Tests
 *
 * Contains test users, tenants, and other mock data
 */

export const testUsers = {
  superAdmin: {
    // Matches database user from V3__seed_dev_user.sql
    email: 'admin@testcompany.co.za',
    username: 'admin',
    password: 'Admin@123!',
    role: 'SUPER_ADMIN',
    name: 'System Administrator',
  },
  supportManager: {
    email: 'support.manager@surework.co.za',
    username: 'support.manager',
    password: 'SupportMgr123!',
    role: 'SUPPORT_MANAGER',
    name: 'Support Manager',
  },
  supportAgent: {
    email: 'support.agent@surework.co.za',
    username: 'support.agent',
    password: 'SupportAgent123!',
    role: 'SUPPORT_AGENT',
    name: 'Support Agent',
  },
  salesRep: {
    email: 'sales.rep@surework.co.za',
    username: 'sales.rep',
    password: 'SalesRep123!',
    role: 'SALES_REP',
    name: 'Sales Rep',
  },
  financeAnalyst: {
    email: 'finance.analyst@surework.co.za',
    username: 'finance.analyst',
    password: 'FinanceAnalyst123!',
    role: 'FINANCE_ANALYST',
    name: 'Finance Analyst',
  },
  invalid: {
    email: 'invalid@surework.co.za',
    username: 'invalid',
    password: 'wrongpassword',
  },
};

export const testTenants = {
  enterprise: {
    id: '1',
    companyName: 'Acme Corporation',
    email: 'admin@acme.com',
    plan: 'ENTERPRISE',
    status: 'ACTIVE',
    mrr: 5000,
    employeeCount: 150,
  },
  professional: {
    id: '2',
    companyName: 'TechStart Ltd',
    email: 'admin@techstart.com',
    plan: 'PROFESSIONAL',
    status: 'ACTIVE',
    mrr: 1500,
    employeeCount: 45,
  },
  trial: {
    id: '3',
    companyName: 'StartupXYZ',
    email: 'contact@startupxyz.com',
    plan: 'TRIAL',
    status: 'TRIAL',
    mrr: 0,
    employeeCount: 8,
  },
  atRisk: {
    id: '4',
    companyName: 'Legacy Systems Inc',
    email: 'support@legacysys.com',
    plan: 'STARTER',
    status: 'ACTIVE',
    mrr: 500,
    employeeCount: 22,
    churnRisk: 'HIGH',
  },
};

export const testDiscounts = {
  percentage: {
    code: 'SAVE20',
    type: 'PERCENTAGE',
    value: 20,
    durationMonths: 3,
  },
  fixed: {
    code: 'FLAT100',
    type: 'FIXED_AMOUNT',
    value: 100,
    durationMonths: 1,
  },
};

export const testTickets = {
  open: {
    subject: 'Cannot access reports',
    description: 'Getting error when trying to view monthly reports',
    priority: 'MEDIUM',
    status: 'OPEN',
  },
  inProgress: {
    subject: 'Payroll calculation issue',
    description: 'Tax calculations seem incorrect',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
  },
};

// Navigation paths for testing
export const routes = {
  login: '/auth/signin',
  forgotPassword: '/auth/forgot-password',
  dashboard: '/dashboard',
  tenants: '/tenants',
  tenantDetail: (id: string) => `/tenants/${id}`,
  onboarding: '/onboarding',
  trials: '/trials',
  support: '/support',
  ticketDetail: (id: string) => `/support/${id}`,
  cannedResponses: '/support/canned-responses',
  featureUsage: '/analytics/usage',
  churnAnalysis: '/analytics/churn',
  healthScores: '/analytics/health',
  revenue: '/billing/revenue',
  projections: '/billing/projections',
  payments: '/billing/payments',
  discounts: '/discounts',
  createDiscount: '/discounts/create',
  editDiscount: (id: string) => `/discounts/${id}/edit`,
  // Portal management routes
  portalCredentials: '/portals/credentials',
  portalDetail: (portal: string) => `/portals/credentials/${portal.toLowerCase()}`,
  failedPostings: '/portals/failed-postings',
  portalAnalytics: '/portals/analytics',
};

// Portal names for testing
export const portals = {
  PNET: 'PNET',
  LINKEDIN: 'LINKEDIN',
  INDEED: 'INDEED',
  CAREERS24: 'CAREERS24',
};
