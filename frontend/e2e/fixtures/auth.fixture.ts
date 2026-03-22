import { test as base, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { ShellPage } from '../pages/shell.page';
import { SettingsPage } from '../pages/settings.page';

/**
 * Standard test password used across all test users
 */
export const TEST_PASSWORD = 'Admin@123!';

/**
 * Test credentials for different roles
 */
export const TEST_USERS = {
  admin: {
    email: 'admin@testcompany.co.za',
    password: TEST_PASSWORD
  },
  hr: {
    email: 'thabo.mokoena@testcompany.co.za',
    password: TEST_PASSWORD
  },
  employee: {
    email: 'lerato.ndlovu@testcompany.co.za',
    password: TEST_PASSWORD
  },
  finance: {
    email: 'ayanda.nkosi@testcompany.co.za',
    password: TEST_PASSWORD
  }
};

/**
 * Extended test fixture with page objects and authentication helpers
 */
export interface TestFixtures {
  loginPage: LoginPage;
  shellPage: ShellPage;
  settingsPage: SettingsPage;
  authenticatedPage: Page;
}

/**
 * Base test with page object fixtures.
 *
 * IMPORTANT: With the global setup, tests start already authenticated.
 * The storageState from global-setup.ts is automatically loaded.
 *
 * For tests that need to test the login flow itself, use:
 * test.use({ storageState: { cookies: [], origins: [] } });
 */
export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  shellPage: async ({ page }, use) => {
    const shellPage = new ShellPage(page);
    await use(shellPage);
  },

  settingsPage: async ({ page }, use) => {
    const settingsPage = new SettingsPage(page);
    await use(settingsPage);
  },

  /**
   * Pre-authenticated page fixture.
   * Since global setup handles authentication, this navigates to dashboard
   * and ensures we're properly authenticated.
   */
  authenticatedPage: async ({ page }, use) => {
    // Navigate to dashboard - we should already be authenticated from global setup
    await page.goto('/dashboard', { timeout: 30000 });

    // Check if we got redirected to login (session expired or invalid)
    const currentUrl = page.url();
    if (currentUrl.includes('/auth/login')) {
      console.log('Session invalid, re-authenticating...');
      const loginPage = new LoginPage(page);
      await loginPage.loginAndWaitForDashboard(TEST_USERS.admin.email, TEST_USERS.admin.password);
    } else {
      // Wait for dashboard to load
      await page.waitForLoadState('networkidle', { timeout: 20000 });
    }

    await use(page);
  }
});

export { expect };
