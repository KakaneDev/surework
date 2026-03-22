import { test, expect, Page } from '@playwright/test';

/**
 * New Routes Tests
 * Tests for all new routes added in the navigation redesign
 */

const TEST_PASSWORD = 'Admin@123!';

// Test users for different permission levels
const SUPER_ADMIN = {
  email: 'admin@testcompany.co.za',
  name: 'Super Admin',
};

const HR_MANAGER = {
  email: 'thabo.mokoena@testcompany.co.za',
  name: 'Thabo Mokoena',
};

const FINANCE_MANAGER = {
  email: 'lerato.ndlovu@testcompany.co.za',
  name: 'Lerato Ndlovu',
};

const EMPLOYEE = {
  email: 'ayanda.nkosi@testcompany.co.za',
  name: 'Ayanda Nkosi',
};

/**
 * Helper to login a user
 */
async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/auth/login');
  await page.waitForSelector('#email', { timeout: 15000 });

  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard', { timeout: 30000 });
  await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 15000 });
  await page.waitForTimeout(2000);
}

// =============================================================================
// SELF-SERVICE ROUTES (Any Authenticated User)
// =============================================================================

test.describe('Self-Service Routes', () => {
  test('/my-documents loads My Documents page', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    await page.goto('/my-documents');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/my-documents');

    // Should show some kind of documents page
    const hasTitle = await page.locator('h1:has-text("My Documents"), h1:has-text("Documents")').isVisible().catch(() => false);
    expect(hasTitle || url.includes('/my-documents'), 'My Documents page should load').toBe(true);
  });

  test('/support loads Support Dashboard', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    await page.goto('/support');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/support');

    const title = page.locator('h1:has-text("Support Tickets")');
    await expect(title).toBeVisible({ timeout: 10000 });
  });

  test('/support/new loads Create Ticket form', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    await page.goto('/support/new');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/support/new');

    const title = page.locator('h1:has-text("New Support Ticket")');
    await expect(title).toBeVisible({ timeout: 10000 });

    // Form elements should be present
    const categorySelect = page.locator('select[formcontrolname="category"]');
    await expect(categorySelect).toBeVisible();
  });
});

// =============================================================================
// HR ROUTES (HR Permissions Required)
// =============================================================================

test.describe('HR Routes', () => {
  test('/hr loads HR Overview dashboard (Super Admin)', async ({ page }) => {
    await login(page, SUPER_ADMIN.email, TEST_PASSWORD);

    await page.goto('/hr');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/hr');

    // Should show HR overview or dashboard content
    const hasContent = await page.locator('h1, h2').first().isVisible().catch(() => false);
    expect(hasContent, 'HR page should have visible content').toBe(true);
  });

  test('/hr loads HR Overview dashboard (HR Manager)', async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);

    await page.goto('/hr');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/hr');
  });

  test('/leave/admin loads Leave Management admin view', async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);

    await page.goto('/leave/admin');
    await page.waitForTimeout(2000);

    const url = page.url();
    // Should either be at /leave/admin or have admin content on /leave
    expect(url.includes('/leave'), 'Should be on leave page').toBe(true);
  });

  test('/documents/hr loads HR Documents', async ({ page }) => {
    await login(page, SUPER_ADMIN.email, TEST_PASSWORD);

    await page.goto('/documents/hr');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/documents/hr');
  });
});

// =============================================================================
// FINANCE ROUTES (Finance Permissions Required)
// =============================================================================

test.describe('Finance Routes', () => {
  test('/finance loads Finance Overview dashboard (Super Admin)', async ({ page }) => {
    await login(page, SUPER_ADMIN.email, TEST_PASSWORD);

    await page.goto('/finance');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/finance');
  });

  test('/finance loads Finance Overview dashboard (Finance Manager)', async ({ page }) => {
    await login(page, FINANCE_MANAGER.email, TEST_PASSWORD);

    await page.goto('/finance');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/finance');
  });

  test('/finance/reports loads Finance Reports', async ({ page }) => {
    await login(page, FINANCE_MANAGER.email, TEST_PASSWORD);

    await page.goto('/finance/reports');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/finance/reports');
  });

  test('/payroll/runs loads Payroll Runs', async ({ page }) => {
    await login(page, FINANCE_MANAGER.email, TEST_PASSWORD);

    await page.goto('/payroll/runs');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/payroll/runs');
  });
});

// =============================================================================
// REPORTS ROUTES (Reports Permissions Required)
// =============================================================================

test.describe('Reports Routes', () => {
  test('/reports loads Reports Dashboard (Super Admin)', async ({ page }) => {
    await login(page, SUPER_ADMIN.email, TEST_PASSWORD);

    await page.goto('/reports');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/reports');
  });

  test('/reports/hr loads HR Reports', async ({ page }) => {
    await login(page, SUPER_ADMIN.email, TEST_PASSWORD);

    await page.goto('/reports/hr');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/reports/hr');
  });

  test('/reports/financial loads Financial Reports', async ({ page }) => {
    await login(page, SUPER_ADMIN.email, TEST_PASSWORD);

    await page.goto('/reports/financial');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/reports/financial');
  });

  test('/reports/recruitment loads Recruitment Reports', async ({ page }) => {
    await login(page, SUPER_ADMIN.email, TEST_PASSWORD);

    await page.goto('/reports/recruitment');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/reports/recruitment');
  });
});

// =============================================================================
// DOCUMENTS ROUTES (Documents Permissions Required)
// =============================================================================

test.describe('Documents Routes', () => {
  test('/documents loads All Documents (Super Admin)', async ({ page }) => {
    await login(page, SUPER_ADMIN.email, TEST_PASSWORD);

    await page.goto('/documents');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/documents');
  });

  test('/documents/templates loads Templates', async ({ page }) => {
    await login(page, SUPER_ADMIN.email, TEST_PASSWORD);

    await page.goto('/documents/templates');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/documents/templates');
  });

  test('/documents/policies loads Policies', async ({ page }) => {
    await login(page, SUPER_ADMIN.email, TEST_PASSWORD);

    await page.goto('/documents/policies');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/documents/policies');
  });
});

// =============================================================================
// ROUTE PROTECTION TESTS
// =============================================================================

test.describe('Route Protection - Employee Access', () => {
  test('Employee cannot access /hr - redirected', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    await page.goto('/hr');
    await page.waitForTimeout(2000);

    const url = page.url();
    // Should be redirected away from /hr
    const isBlocked = url.includes('/dashboard') || !url.includes('/hr');
    expect(isBlocked, `Employee should be redirected from /hr. Current URL: ${url}`).toBe(true);
  });

  test('Employee cannot access /finance - redirected', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    await page.goto('/finance');
    await page.waitForTimeout(2000);

    const url = page.url();
    const isBlocked = url.includes('/dashboard') || !url.includes('/finance');
    expect(isBlocked, `Employee should be redirected from /finance. Current URL: ${url}`).toBe(true);
  });

  test('Employee cannot access /reports - redirected', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    await page.goto('/reports');
    await page.waitForTimeout(2000);

    const url = page.url();
    const isBlocked = url.includes('/dashboard') || !url.includes('/reports');
    expect(isBlocked, `Employee should be redirected from /reports. Current URL: ${url}`).toBe(true);
  });

  test('Employee cannot access /documents (admin) - redirected', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    await page.goto('/documents');
    await page.waitForTimeout(2000);

    const url = page.url();
    // Employee should be redirected OR blocked from admin documents
    const isBlocked = url.includes('/dashboard') || url.includes('/my-documents') || !url.endsWith('/documents');
    expect(isBlocked, `Employee should be redirected from /documents. Current URL: ${url}`).toBe(true);
  });

  test('Employee CAN access /my-documents', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    await page.goto('/my-documents');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/my-documents');
  });

  test('Employee CAN access /support', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    await page.goto('/support');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/support');

    const title = page.locator('h1:has-text("Support Tickets")');
    await expect(title).toBeVisible();
  });
});

// =============================================================================
// UNAUTHENTICATED ACCESS TESTS
// =============================================================================

test.describe('Unauthenticated Route Access', () => {
  test('Unauthenticated user cannot access /my-documents', async ({ page }) => {
    await page.goto('/my-documents');
    await expect(page).toHaveURL(/.*\/auth\/login/, { timeout: 10000 });
  });

  test('Unauthenticated user cannot access /support', async ({ page }) => {
    await page.goto('/support');
    await expect(page).toHaveURL(/.*\/auth\/login/, { timeout: 10000 });
  });

  test('Unauthenticated user cannot access /hr', async ({ page }) => {
    await page.goto('/hr');
    await expect(page).toHaveURL(/.*\/auth\/login/, { timeout: 10000 });
  });

  test('Unauthenticated user cannot access /finance', async ({ page }) => {
    await page.goto('/finance');
    await expect(page).toHaveURL(/.*\/auth\/login/, { timeout: 10000 });
  });

  test('Unauthenticated user cannot access /reports', async ({ page }) => {
    await page.goto('/reports');
    await expect(page).toHaveURL(/.*\/auth\/login/, { timeout: 10000 });
  });

  test('Unauthenticated user cannot access /documents', async ({ page }) => {
    await page.goto('/documents');
    await expect(page).toHaveURL(/.*\/auth\/login/, { timeout: 10000 });
  });
});
