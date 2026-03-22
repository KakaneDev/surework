import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Simplified Onboarding E2E Tests
 *
 * Tests the full onboarding flow for a TENANT_ADMIN user:
 * login, dashboard setup banner, feature gating, navigation, settings, logout.
 *
 * Run against deployed app:
 *   PLAYWRIGHT_BASE_URL=http://136.116.141.75/main npx playwright test simplified-onboarding.spec.ts
 */

const USER = { email: 'harristut@gmail.com', password: 'SureWork2026@' };
const AUTH_FILE = path.join(__dirname, '.auth', 'onboarding-session.json');

// Clear any stored auth — these tests manage their own login
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * Inject saved session (localStorage tokens) into a fresh page context.
 */
async function loadSession(page: Page, baseURL: string, route: string): Promise<void> {
  const state = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));

  // Navigate to origin first so we can set localStorage
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });

  // Restore cookies
  if (state.cookies?.length) {
    await page.context().addCookies(state.cookies);
  }

  // Restore localStorage
  for (const origin of state.origins || []) {
    for (const item of origin.localStorage || []) {
      await page.evaluate(([k, v]) => localStorage.setItem(k, v), [item.name, item.value]);
    }
  }

  // Now navigate to the target route
  await page.goto(`${baseURL}${route}`);
  await page.waitForLoadState('networkidle');
}

// =============================================================================
// 1. LOGIN FLOW — performs one real login and saves session for all other groups
// =============================================================================

test.describe('Login Flow', () => {
  test.describe.configure({ mode: 'serial' });

  test('Login page loads with form elements', async ({ page }) => {
    await page.goto('auth/login');
    await expect(page.locator('#email')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Login with credentials redirects to /dashboard and saves session', async ({ page, context }) => {
    await page.goto('auth/login');
    await page.waitForSelector('#email', { timeout: 15000 });
    await page.fill('#email', USER.email);
    await page.fill('#password', USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/dashboard');

    // Save session for all subsequent tests
    fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
    await context.storageState({ path: AUTH_FILE });
  });

  test('User avatar visible in header', async ({ page, baseURL }) => {
    await loadSession(page, baseURL!, 'dashboard');
    const avatar = page.locator('header').locator('div.rounded-full').first();
    await expect(avatar).toBeVisible({ timeout: 10000 });
  });

  test('User name visible in header', async ({ page, baseURL }) => {
    await loadSession(page, baseURL!, 'dashboard');
    const header = page.locator('header');
    await expect(header).toBeVisible({ timeout: 10000 });
    const headerText = await header.textContent();
    expect(headerText).toBeTruthy();
  });

  test('Sidebar navigation visible with expected items', async ({ page, baseURL }) => {
    await loadSession(page, baseURL!, 'dashboard');
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible({ timeout: 10000 });
    const sidebarText = await sidebar.textContent();
    expect(sidebarText).toContain('Dashboard');
    expect(sidebarText).toContain('Settings');
  });
});

// =============================================================================
// 2. DASHBOARD + SETUP BANNER
// =============================================================================

test.describe('Dashboard + Setup Banner', () => {
  test('Dashboard heading loads', async ({ page, baseURL }) => {
    await loadSession(page, baseURL!, 'dashboard');
    const heading = page.locator('h1, h2').filter({ hasText: /dashboard/i }).first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test('Setup banner visible with setup message', async ({ page, baseURL }) => {
    await loadSession(page, baseURL!, 'dashboard');
    const banner = page.getByText('Complete your setup to unlock all features');
    await expect(banner).toBeVisible({ timeout: 15000 });
  });

  test('Both CTAs present: company details and SARS compliance', async ({ page, baseURL }) => {
    await loadSession(page, baseURL!, 'dashboard');
    const companyCta = page.getByText('Complete company details');
    const complianceCta = page.getByText('Complete SARS compliance');
    await expect(companyCta).toBeVisible({ timeout: 15000 });
    await expect(complianceCta).toBeVisible({ timeout: 15000 });
  });

  test('CTA clicks navigate to correct settings pages', async ({ page, baseURL }) => {
    await loadSession(page, baseURL!, 'dashboard');

    const companyCta = page.getByText('Complete company details');
    await expect(companyCta).toBeVisible({ timeout: 15000 });
    await companyCta.click();
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/settings');

    await page.goto(`${baseURL}dashboard`);
    await page.waitForLoadState('networkidle');
    const complianceCta = page.getByText('Complete SARS compliance');
    await expect(complianceCta).toBeVisible({ timeout: 15000 });
    await complianceCta.click();
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/settings');
  });
});

// =============================================================================
// 3. FEATURE GATING
// =============================================================================

test.describe('Feature Gating', () => {
  test('/finance redirects to setup-required with COMPANY_DETAILS gate', async ({ page, baseURL }) => {
    await loadSession(page, baseURL!, 'finance');
    await page.waitForTimeout(3000);
    expect(page.url()).toContain('setup-required');
    expect(page.url()).toContain('gate=COMPANY_DETAILS');
  });

  test('Company details block overlay shows with CTA to settings', async ({ page, baseURL }) => {
    await loadSession(page, baseURL!, 'finance');
    await page.waitForTimeout(3000);

    const blockHeading = page.getByText('Complete your company details');
    await expect(blockHeading).toBeVisible({ timeout: 15000 });

    const cta = page.getByText('Go to Company Settings');
    await expect(cta).toBeVisible({ timeout: 10000 });
  });

  test('/payroll redirects to setup-required with COMPLIANCE gate', async ({ page, baseURL }) => {
    await loadSession(page, baseURL!, 'payroll');
    await page.waitForTimeout(3000);
    expect(page.url()).toContain('setup-required');
    expect(page.url()).toContain('gate=COMPLIANCE');
  });

  test('Compliance block overlay shows with CTA to settings', async ({ page, baseURL }) => {
    await loadSession(page, baseURL!, 'payroll');
    await page.waitForTimeout(3000);

    const blockHeading = page.getByText('SARS compliance details required');
    await expect(blockHeading).toBeVisible({ timeout: 15000 });

    const cta = page.getByText('Go to Compliance Settings');
    await expect(cta).toBeVisible({ timeout: 10000 });
  });
});

// =============================================================================
// 4. NAVIGATION - UNGATED FEATURES
// =============================================================================

test.describe('Navigation - Ungated Features', () => {
  test('/dashboard is accessible without redirect', async ({ page, baseURL }) => {
    await loadSession(page, baseURL!, 'dashboard');
    expect(page.url()).toContain('/dashboard');
    expect(page.url()).not.toContain('setup-required');
  });

  test('/employees is accessible', async ({ page, baseURL }) => {
    await loadSession(page, baseURL!, 'employees');
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('setup-required');
  });

  test('/leave is accessible', async ({ page, baseURL }) => {
    await loadSession(page, baseURL!, 'leave');
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('setup-required');
  });

  test('/recruitment is accessible', async ({ page, baseURL }) => {
    await loadSession(page, baseURL!, 'recruitment');
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('setup-required');
  });

  test('/settings is accessible', async ({ page, baseURL }) => {
    await loadSession(page, baseURL!, 'settings');
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('setup-required');
  });

  test('/hr is accessible', async ({ page, baseURL }) => {
    await loadSession(page, baseURL!, 'hr');
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('setup-required');
  });
});

// =============================================================================
// 5. SETTINGS PAGES
// =============================================================================

test.describe('Settings Pages', () => {
  test('/settings/company loads Company Profile', async ({ page, baseURL }) => {
    await loadSession(page, baseURL!, 'settings/company');
    expect(page.url()).toContain('/settings');
    const content = page.locator('main, [role="main"], .content').first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });

  test('/settings/compliance loads Compliance page', async ({ page, baseURL }) => {
    await loadSession(page, baseURL!, 'settings/compliance');
    expect(page.url()).toContain('/settings');
    const content = page.locator('main, [role="main"], .content').first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });

  test('/settings/users loads User Management', async ({ page, baseURL }) => {
    await loadSession(page, baseURL!, 'settings/users');
    expect(page.url()).toContain('/settings');
    const content = page.locator('main, [role="main"], .content').first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });

  test('/settings/security loads Security settings', async ({ page, baseURL }) => {
    await loadSession(page, baseURL!, 'settings/security');
    expect(page.url()).toContain('/settings');
    const content = page.locator('main, [role="main"], .content').first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });
});

// =============================================================================
// 6. LOGOUT
// =============================================================================

test.describe('Logout', () => {
  test('Sign out option visible in user dropdown', async ({ page, baseURL }) => {
    await loadSession(page, baseURL!, 'dashboard');

    const headerButton = page.locator('header').locator('button').filter({ has: page.locator('div.rounded-full') }).first();
    await expect(headerButton).toBeVisible({ timeout: 10000 });
    await headerButton.click();
    await page.waitForTimeout(500);

    const signOut = page.getByText(/sign out|log ?out|sign off/i);
    await expect(signOut).toBeVisible({ timeout: 5000 });
  });

  test('Clicking sign out redirects to login page', async ({ page, baseURL }) => {
    await loadSession(page, baseURL!, 'dashboard');

    const headerButton = page.locator('header').locator('button').filter({ has: page.locator('div.rounded-full') }).first();
    await headerButton.click();
    await page.waitForTimeout(500);

    const signOut = page.getByText(/sign out|log ?out|sign off/i);
    await signOut.click();

    await page.waitForURL('**/auth/login', { timeout: 15000 });
    expect(page.url()).toContain('/auth/login');
  });

  test('Dashboard inaccessible after logout (redirects to login)', async ({ page, baseURL }) => {
    await loadSession(page, baseURL!, 'dashboard');

    const headerButton = page.locator('header').locator('button').filter({ has: page.locator('div.rounded-full') }).first();
    await headerButton.click();
    await page.waitForTimeout(500);
    const signOut = page.getByText(/sign out|log ?out|sign off/i);
    await signOut.click();
    await page.waitForURL('**/auth/login', { timeout: 15000 });

    // Try to access dashboard — should redirect back to login
    await page.goto(`${baseURL}dashboard`);
    await page.waitForTimeout(3000);
    expect(page.url()).toContain('/auth/login');
  });
});
