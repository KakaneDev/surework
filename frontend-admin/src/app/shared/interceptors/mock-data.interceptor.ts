import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Discount, CreateDiscountRequest } from '../models/billing.model';
import { AuthResponse, AdminUser, LoginRequest } from '../models/user.model';

const STORAGE_KEY = 'surework_mock_discounts';

// Mock admin user for development
const MOCK_ADMIN_USER: AdminUser = {
  id: 'mock-admin-001',
  email: 'admin@testcompany.co.za',
  firstName: 'System',
  lastName: 'Administrator',
  displayName: 'System Administrator',
  roles: [
    {
      id: 'role-001',
      code: 'SUPER_ADMIN',
      name: 'Super Administrator',
      description: 'Full system access',
      permissions: [
        {
          id: 'perm-001',
          code: 'ALL',
          name: 'All Permissions',
          description: 'Full access to all resources',
          category: 'SYSTEM',
          resource: '*',
          action: '*'
        }
      ],
      active: true,
      systemRole: true
    }
  ],
  status: 'ACTIVE',
  emailVerified: true,
  mfaEnabled: false,
  createdAt: '2024-01-01T00:00:00Z',
  lastLoginAt: new Date().toISOString()
};

// Generate a mock JWT token (expires in 24 hours)
function generateMockToken(): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: MOCK_ADMIN_USER.id,
    email: MOCK_ADMIN_USER.email,
    roles: ['SUPER_ADMIN'],
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    iat: Math.floor(Date.now() / 1000)
  }));
  const signature = btoa('mock-signature');
  return `${header}.${payload}.${signature}`;
}

function createAuthResponse(): AuthResponse {
  return {
    accessToken: generateMockToken(),
    refreshToken: generateMockToken(),
    tokenType: 'Bearer',
    expiresIn: 86400,
    user: MOCK_ADMIN_USER
  };
}

const SEED_DISCOUNTS: Discount[] = [
  {
    id: '1',
    code: 'WELCOME20',
    type: 'PERCENTAGE',
    value: 20,
    durationMonths: 3,
    validFrom: '2024-01-01T00:00:00Z',
    validUntil: '2024-12-31T23:59:59Z',
    maxUses: 100,
    currentUses: 45,
    status: 'ACTIVE',
    createdBy: 'admin',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    code: 'STARTUP50',
    type: 'PERCENTAGE',
    value: 50,
    durationMonths: 6,
    validFrom: '2024-01-15T00:00:00Z',
    validUntil: '2024-06-30T23:59:59Z',
    maxUses: 50,
    currentUses: 50,
    status: 'EXHAUSTED',
    createdBy: 'admin',
    createdAt: '2024-01-15T00:00:00Z'
  },
  {
    id: '3',
    code: 'FLAT100',
    type: 'FIXED_AMOUNT',
    value: 100,
    durationMonths: 1,
    validFrom: '2024-02-01T00:00:00Z',
    validUntil: '2024-03-01T23:59:59Z',
    maxUses: 200,
    currentUses: 87,
    status: 'EXPIRED',
    createdBy: 'admin',
    createdAt: '2024-02-01T00:00:00Z'
  },
  {
    id: '4',
    code: 'ENTERPRISE25',
    type: 'PERCENTAGE',
    value: 25,
    durationMonths: 12,
    validFrom: '2024-03-01T00:00:00Z',
    validUntil: '2025-03-01T23:59:59Z',
    maxUses: 25,
    currentUses: 12,
    status: 'ACTIVE',
    createdBy: 'admin',
    createdAt: '2024-03-01T00:00:00Z'
  },
  {
    id: '5',
    code: 'PROMO15',
    type: 'PERCENTAGE',
    value: 15,
    durationMonths: 2,
    validFrom: '2024-04-01T00:00:00Z',
    currentUses: 0,
    status: 'DISABLED',
    createdBy: 'admin',
    createdAt: '2024-04-01T00:00:00Z'
  }
];

function getDiscounts(): Discount[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DISCOUNTS));
  return SEED_DISCOUNTS;
}

function saveDiscounts(discounts: Discount[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(discounts));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export const mockDataInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.useMockData) {
    return next(req);
  }

  const url = req.url;
  const method = req.method;

  // ==================== AUTH ENDPOINTS ====================

  // POST /auth/login - Mock login
  if (url.includes('/auth/login') && method === 'POST') {
    const loginRequest = req.body as LoginRequest;

    // Accept any credentials in mock mode (for dev convenience)
    // In a real scenario, you might want to validate against known test users
    if (!loginRequest.username || !loginRequest.password) {
      return of(new HttpResponse({
        status: 400,
        body: { message: 'Username and password are required' }
      })).pipe(delay(300));
    }

    const authResponse = createAuthResponse();
    console.log('[Mock] Login successful for:', loginRequest.username);

    return of(new HttpResponse<AuthResponse>({
      body: authResponse,
      headers: req.headers,
      status: 200,
      statusText: 'OK',
      url: req.url
    })).pipe(delay(500));
  }

  // POST /auth/refresh - Mock token refresh
  if (url.includes('/auth/refresh') && method === 'POST') {
    console.log('[Mock] Token refreshed');
    const authResponse = createAuthResponse();
    return of(new HttpResponse<AuthResponse>({
      body: authResponse,
      headers: req.headers,
      status: 200,
      statusText: 'OK',
      url: req.url
    })).pipe(delay(200));
  }

  // ==================== DISCOUNT ENDPOINTS ====================

  // Match discount endpoints
  const discountsListMatch = url.match(/\/admin-api\/v1\/discounts(\?.*)?$/);
  const discountByIdMatch = url.match(/\/admin-api\/v1\/discounts\/([^\/]+)$/);
  const disableMatch = url.match(/\/admin-api\/v1\/discounts\/([^\/]+)\/disable$/);

  // POST /discounts/:id/disable - Disable a discount
  if (disableMatch && method === 'POST') {
    const id = disableMatch[1];
    const discounts = getDiscounts();
    const index = discounts.findIndex(d => d.id === id);

    if (index === -1) {
      return of(new HttpResponse({
        status: 404,
        body: { message: 'Discount not found' }
      })).pipe(delay(200));
    }

    discounts[index] = { ...discounts[index], status: 'DISABLED' };
    saveDiscounts(discounts);

    return of(new HttpResponse({
      status: 200,
      body: discounts[index]
    })).pipe(delay(200));
  }

  // GET /discounts - List all discounts
  if (discountsListMatch && method === 'GET') {
    const discounts = getDiscounts();
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const page = parseInt(urlParams.get('page') || '0', 10);
    const size = parseInt(urlParams.get('size') || '10', 10);

    const start = page * size;
    const end = start + size;
    const paginatedContent = discounts.slice(start, end);

    return of(new HttpResponse({
      status: 200,
      body: {
        content: paginatedContent,
        totalElements: discounts.length,
        totalPages: Math.ceil(discounts.length / size),
        size: size,
        number: page,
        first: page === 0,
        last: end >= discounts.length,
        empty: paginatedContent.length === 0
      }
    })).pipe(delay(300));
  }

  // GET /discounts/:id - Get single discount
  if (discountByIdMatch && method === 'GET') {
    const id = discountByIdMatch[1];
    const discounts = getDiscounts();
    const discount = discounts.find(d => d.id === id);

    if (!discount) {
      return of(new HttpResponse({
        status: 404,
        body: { message: 'Discount not found' }
      })).pipe(delay(200));
    }

    return of(new HttpResponse({
      status: 200,
      body: discount
    })).pipe(delay(200));
  }

  // POST /discounts - Create new discount
  if (discountsListMatch && method === 'POST') {
    const discounts = getDiscounts();
    const createRequest = req.body as CreateDiscountRequest;

    // Check for duplicate code
    if (discounts.some(d => d.code === createRequest.code)) {
      return of(new HttpResponse({
        status: 409,
        body: { message: `Discount code '${createRequest.code}' already exists` }
      })).pipe(delay(200));
    }

    const newDiscount: Discount = {
      id: generateId(),
      code: createRequest.code,
      type: createRequest.type,
      value: createRequest.value,
      durationMonths: createRequest.durationMonths,
      validFrom: createRequest.validFrom,
      validUntil: createRequest.validUntil,
      maxUses: createRequest.maxUses,
      currentUses: 0,
      status: 'ACTIVE',
      createdBy: 'admin',
      createdAt: new Date().toISOString()
    };

    discounts.unshift(newDiscount);
    saveDiscounts(discounts);

    return of(new HttpResponse({
      status: 201,
      body: newDiscount
    })).pipe(delay(300));
  }

  // PATCH /discounts/:id - Update discount
  if (discountByIdMatch && method === 'PATCH') {
    const id = discountByIdMatch[1];
    const discounts = getDiscounts();
    const index = discounts.findIndex(d => d.id === id);

    if (index === -1) {
      return of(new HttpResponse({
        status: 404,
        body: { message: 'Discount not found' }
      })).pipe(delay(200));
    }

    const updates = req.body as Partial<CreateDiscountRequest>;

    // Check for duplicate code if code is being changed
    if (updates.code && updates.code !== discounts[index].code) {
      if (discounts.some(d => d.code === updates.code)) {
        return of(new HttpResponse({
          status: 409,
          body: { message: `Discount code '${updates.code}' already exists` }
        })).pipe(delay(200));
      }
    }

    discounts[index] = { ...discounts[index], ...updates };
    saveDiscounts(discounts);

    return of(new HttpResponse({
      status: 200,
      body: discounts[index]
    })).pipe(delay(200));
  }

  // PUT /discounts/:id - Full update discount
  if (discountByIdMatch && method === 'PUT') {
    const id = discountByIdMatch[1];
    const discounts = getDiscounts();
    const index = discounts.findIndex(d => d.id === id);

    if (index === -1) {
      return of(new HttpResponse({
        status: 404,
        body: { message: 'Discount not found' }
      })).pipe(delay(200));
    }

    const updates = req.body as CreateDiscountRequest;

    // Check for duplicate code if code is being changed
    if (updates.code !== discounts[index].code) {
      if (discounts.some(d => d.code === updates.code)) {
        return of(new HttpResponse({
          status: 409,
          body: { message: `Discount code '${updates.code}' already exists` }
        })).pipe(delay(200));
      }
    }

    discounts[index] = {
      ...discounts[index],
      code: updates.code,
      type: updates.type,
      value: updates.value,
      durationMonths: updates.durationMonths,
      validFrom: updates.validFrom,
      validUntil: updates.validUntil,
      maxUses: updates.maxUses
    };
    saveDiscounts(discounts);

    return of(new HttpResponse({
      status: 200,
      body: discounts[index]
    })).pipe(delay(200));
  }

  // DELETE /discounts/:id - Delete discount
  if (discountByIdMatch && method === 'DELETE') {
    const id = discountByIdMatch[1];
    const discounts = getDiscounts();
    const index = discounts.findIndex(d => d.id === id);

    if (index === -1) {
      return of(new HttpResponse({
        status: 404,
        body: { message: 'Discount not found' }
      })).pipe(delay(200));
    }

    discounts.splice(index, 1);
    saveDiscounts(discounts);

    return of(new HttpResponse({
      status: 204,
      body: null
    })).pipe(delay(200));
  }

  // ==================== DASHBOARD/ANALYTICS ENDPOINTS ====================

  // GET /analytics/kpis - Dashboard KPIs
  if (url.includes('/analytics/kpis') && method === 'GET') {
    return of(new HttpResponse({
      body: {
        totalTenants: 248,
        tenantGrowth: 12.5,
        activeTrials: 34,
        trialConversionRate: 28,
        mrr: 156000,
        mrrGrowth: 8.3,
        churnRate: 2.4,
        churnTrend: -0.5,
        avgRevenuePerTenant: 629,
        activeUsers: 1256
      },
      status: 200,
      statusText: 'OK',
      url: req.url
    })).pipe(delay(200));
  }

  // GET /analytics/recent-activity - Recent activity feed
  if (url.includes('/analytics/recent-activity') && method === 'GET') {
    return of(new HttpResponse({
      body: [
        { type: 'TENANT_SIGNUP', description: 'New tenant signed up', tenantName: 'Acme Corp', timestamp: new Date().toISOString() },
        { type: 'PAYMENT_RECEIVED', description: 'Payment received for Professional plan', tenantName: 'TechStart Ltd', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { type: 'TICKET_CREATED', description: 'New support ticket created', tenantName: 'Global Solutions', timestamp: new Date(Date.now() - 7200000).toISOString() },
        { type: 'TRIAL_EXPIRING', description: 'Trial expiring in 3 days', tenantName: 'StartupXYZ', timestamp: new Date(Date.now() - 10800000).toISOString() },
        { type: 'CHURN_ALERT', description: 'High churn risk detected', tenantName: 'Legacy Systems', timestamp: new Date(Date.now() - 14400000).toISOString() }
      ],
      status: 200,
      statusText: 'OK',
      url: req.url
    })).pipe(delay(200));
  }

  // GET /analytics/onboarding-funnel - Onboarding funnel data
  if (url.includes('/analytics/onboarding-funnel') && method === 'GET') {
    return of(new HttpResponse({
      body: [
        { stage: 'Started', count: 100, percentage: 100, dropOffRate: 0 },
        { stage: 'Email Verified', count: 78, percentage: 78, dropOffRate: 22 },
        { stage: 'Company Setup', count: 65, percentage: 65, dropOffRate: 16.7 },
        { stage: 'Users Added', count: 52, percentage: 52, dropOffRate: 20 },
        { stage: 'Active', count: 45, percentage: 45, dropOffRate: 13.5 }
      ],
      status: 200,
      statusText: 'OK',
      url: req.url
    })).pipe(delay(200));
  }

  // GET /billing/revenue - Revenue metrics
  if (url.includes('/billing/revenue') && method === 'GET') {
    return of(new HttpResponse({
      body: {
        mrr: 156000,
        mrrGrowth: 8.3,
        arr: 1872000,
        avgRevenuePerTenant: 629,
        revenueByPlan: [
          { plan: 'Enterprise', revenue: 75000, tenantCount: 15, percentage: 48 },
          { plan: 'Professional', revenue: 54000, tenantCount: 36, percentage: 35 },
          { plan: 'Starter', revenue: 27000, tenantCount: 54, percentage: 17 }
        ],
        monthlyRevenue: [
          { month: 'Jan', mrr: 120000, newMrr: 15000, churnedMrr: 3000, expansionMrr: 2000 },
          { month: 'Feb', mrr: 128000, newMrr: 12000, churnedMrr: 4000, expansionMrr: 3000 },
          { month: 'Mar', mrr: 135000, newMrr: 10000, churnedMrr: 3000, expansionMrr: 2500 },
          { month: 'Apr', mrr: 142000, newMrr: 11000, churnedMrr: 4000, expansionMrr: 3500 },
          { month: 'May', mrr: 150000, newMrr: 13000, churnedMrr: 5000, expansionMrr: 4000 },
          { month: 'Jun', mrr: 156000, newMrr: 10000, churnedMrr: 4000, expansionMrr: 3000 }
        ]
      },
      status: 200,
      statusText: 'OK',
      url: req.url
    })).pipe(delay(200));
  }

  // ==================== FALLBACK FOR OTHER API ENDPOINTS ====================
  // When mock mode is enabled, prevent real API calls from failing the app
  // by returning empty/mock data for unhandled endpoints

  if (url.includes('/admin-api/v1/')) {

    // Notifications endpoints
    if (url.includes('/notifications/unread-count')) {
      return of(new HttpResponse({
        body: { count: 3 },
        status: 200,
        statusText: 'OK',
        url: req.url
      })).pipe(delay(100));
    }

    if (url.includes('/notifications')) {
      return of(new HttpResponse({
        body: { content: [], totalElements: 0, unreadCount: 0 },
        status: 200,
        statusText: 'OK',
        url: req.url
      })).pipe(delay(100));
    }

    // Tenants endpoints
    if (url.includes('/tenants')) {
      return of(new HttpResponse({
        body: { content: [], totalElements: 0, totalPages: 0 },
        status: 200,
        statusText: 'OK',
        url: req.url
      })).pipe(delay(100));
    }

    // Generic fallback for any other API endpoint
    return of(new HttpResponse({
      body: {},
      status: 200,
      statusText: 'OK',
      url: req.url
    })).pipe(delay(100));
  }

  // Pass through for non-API endpoints (assets, etc.)
  return next(req);
};
