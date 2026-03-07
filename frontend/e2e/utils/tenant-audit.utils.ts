/**
 * ============================================================================
 * TENANT ISOLATION AUDIT UTILITIES
 * ============================================================================
 *
 * Shared utilities for all tenant isolation E2E tests.
 *
 * Provides:
 * - TenantRequestCollector: Captures API requests with tenant/auth headers
 * - JWT decoding helpers
 * - Login helpers with retry logic
 * - Assertion helpers for tenant validation
 *
 * ============================================================================
 */

import { Page, Request, expect } from '@playwright/test';

// ==================== Constants ====================

/** Expected tenant ID for all test environments (Test Company - TESTCO) */
export const EXPECTED_TENANT_ID = '00000000-0000-0000-0000-000000000099';

/** Standard test password */
export const TEST_PASSWORD = 'Admin@123!';

/** Test users for different roles */
export const TEST_USERS = {
  admin: {
    email: 'admin@testcompany.co.za',
    name: 'Super Admin',
  },
  hr: {
    email: 'thabo.mokoena@testcompany.co.za',
    name: 'Thabo Mokoena',
  },
  employee: {
    email: 'ayanda.nkosi@testcompany.co.za',
    name: 'Ayanda Nkosi',
  },
  finance: {
    email: 'lerato.ndlovu@testcompany.co.za',
    name: 'Lerato Ndlovu',
  },
};

// ==================== Types ====================

export interface CapturedRequest {
  url: string;
  method: string;
  tenantHeader: string | null;
  authorizationHeader: string | null;
}

export interface JwtPayload {
  sub?: string;
  tenantId?: string;
  userId?: string;
  username?: string;
  roles?: string[];
  permissions?: string[];
  employeeId?: string;
  type?: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

// ==================== TenantRequestCollector ====================

/**
 * Captures all API requests made by the page and records their
 * X-Tenant-ID and Authorization headers for later assertion.
 */
export class TenantRequestCollector {
  private requests: CapturedRequest[] = [];
  private listener: ((request: Request) => void) | null = null;
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Start capturing API requests */
  start(): void {
    this.requests = [];
    this.listener = (request: Request) => {
      const url = request.url();
      if (url.includes('/api/')) {
        const headers = request.headers();
        this.requests.push({
          url,
          method: request.method(),
          tenantHeader: headers['x-tenant-id'] ?? null,
          authorizationHeader: headers['authorization'] ?? null,
        });
      }
    };
    this.page.on('request', this.listener);
  }

  /** Stop capturing requests */
  stop(): void {
    if (this.listener) {
      this.page.removeListener('request', this.listener);
      this.listener = null;
    }
  }

  /** Get all captured API requests */
  getApiRequests(): CapturedRequest[] {
    return [...this.requests];
  }

  /** Get requests that are missing the X-Tenant-ID header */
  getMissingTenantHeader(): CapturedRequest[] {
    return this.requests.filter((r) => !r.tenantHeader);
  }

  /** Get requests matching a URL pattern */
  getRequestsMatching(pattern: string | RegExp): CapturedRequest[] {
    return this.requests.filter((r) =>
      typeof pattern === 'string' ? r.url.includes(pattern) : pattern.test(r.url)
    );
  }

  /** Clear collected requests (for reuse within same session) */
  clear(): void {
    this.requests = [];
  }
}

// ==================== JWT Helpers ====================

/**
 * Decode a JWT payload (base64url → JSON).
 * Does NOT verify the signature — this is for test assertion only.
 */
export function decodeJwtPayload(token: string): JwtPayload {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error(`Invalid JWT: expected 3 parts, got ${parts.length}`);
  }
  const payload = parts[1];
  // base64url → base64
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const json = Buffer.from(base64, 'base64').toString('utf-8');
  return JSON.parse(json);
}

/**
 * Extract the JWT token from a request's Authorization header.
 * Strips the "Bearer " prefix.
 */
export function extractJwtFromRequest(request: CapturedRequest): string | null {
  const auth = request.authorizationHeader;
  if (!auth || !auth.startsWith('Bearer ')) {
    return null;
  }
  return auth.substring(7);
}

// ==================== Assertion Helpers ====================

/**
 * Assert that every captured API request has the correct X-Tenant-ID header.
 * Skips assertion if no requests were captured (annotates instead of failing).
 */
export function assertAllRequestsHaveTenantHeader(
  collector: TenantRequestCollector,
  expectedTenantId: string = EXPECTED_TENANT_ID
): void {
  const requests = collector.getApiRequests();
  const missing = collector.getMissingTenantHeader();

  if (requests.length === 0) {
    // No API requests captured — caller should handle this gracefully
    return;
  }

  expect(
    missing,
    `${missing.length} of ${requests.length} API requests are missing X-Tenant-ID header: ${missing.map((r) => r.url).join(', ')}`
  ).toHaveLength(0);

  // Verify correct value
  for (const req of requests) {
    expect(req.tenantHeader, `Wrong X-Tenant-ID on ${req.url}`).toBe(expectedTenantId);
  }
}

/**
 * Assert that a JWT token contains the expected tenantId claim.
 */
export function assertJwtContainsTenant(
  token: string,
  expectedTenantId: string = EXPECTED_TENANT_ID
): JwtPayload {
  const payload = decodeJwtPayload(token);
  expect(payload.tenantId, 'JWT should contain tenantId claim').toBeDefined();
  expect(payload.tenantId, 'JWT tenantId should match expected').toBe(expectedTenantId);
  return payload;
}

// ==================== Login Helper ====================

/**
 * Log in a user via the UI with retry logic.
 * Use this ONLY when you genuinely need a fresh UI login (e.g. AUTH group tests
 * that clear storageState, or CROSS tests that switch between users).
 *
 * For tests that just need an authenticated session, use `ensureAuthenticated()`
 * instead — it reuses the global-setup session and is ~10x faster.
 */
export async function login(
  page: Page,
  email: string,
  password: string,
  maxRetries: number = 2
): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await page.goto('/auth/login');
      await page.waitForSelector('#email', { timeout: 15000 });

      await page.fill('#email', email);
      await page.fill('#password', password);
      await page.click('button[type="submit"]');

      await Promise.race([
        page.waitForURL('**/dashboard', { timeout: 45000 }),
        page.waitForSelector('.error-message, [class*="error"]', { timeout: 45000 }).then(() => {
          throw new Error('Login failed with error message');
        }),
      ]);

      await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 15000 });
      await page.waitForTimeout(500);
      return;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      console.log(`Login attempt ${attempt} failed, retrying...`);
      await page.waitForTimeout(2000);
    }
  }
}

/**
 * Ensure the page has a valid authenticated session.
 *
 * The global setup saves an admin session to storageState, which Playwright
 * automatically restores into every test's browser context. This function
 * navigates to /dashboard to verify the session is live. If the session has
 * expired (redirected to /auth/login), it falls back to a UI login.
 *
 * This is ~10x faster than login() because it skips form fill + submit
 * when the stored session is still valid (the common case).
 */
export async function ensureAuthenticated(page: Page): Promise<void> {
  await page.goto('/dashboard', { timeout: 30000 });

  // Check if session is valid (stayed on dashboard) or expired (redirected to login)
  const url = page.url();
  if (url.includes('/auth/login')) {
    // Session expired — fall back to UI login
    console.log('Stored session expired, re-authenticating via UI...');
    await login(page, TEST_USERS.admin.email, TEST_PASSWORD);
  } else {
    // Session is valid — just wait for the page to settle
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  }
}

// ==================== Navigation Helpers ====================

/**
 * Wait for content to load (spinner hidden).
 */
export async function waitForContentLoad(page: Page): Promise<void> {
  await page.waitForSelector('sw-spinner', { state: 'hidden', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(500);
}
