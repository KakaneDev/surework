import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';
import { TenantListPage } from '../pages/tenant-list.page';
import { SidebarPage } from '../pages/sidebar.page';
import { HeaderPage } from '../pages/header.page';
import { testUsers } from './test-data';

/**
 * Custom Test Fixtures for SureWork Admin Dashboard
 *
 * Extends Playwright's base test with custom page objects and authentication states
 */

type TestFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  tenantListPage: TenantListPage;
  sidebarPage: SidebarPage;
  headerPage: HeaderPage;
  authenticatedPage: DashboardPage;
};

export const test = base.extend<TestFixtures>({
  // Login page fixture
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await use(loginPage);
  },

  // Dashboard page fixture
  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  // Tenant list page fixture
  tenantListPage: async ({ page }, use) => {
    const tenantListPage = new TenantListPage(page);
    await use(tenantListPage);
  },

  // Sidebar page fixture
  sidebarPage: async ({ page }, use) => {
    const sidebarPage = new SidebarPage(page);
    await use(sidebarPage);
  },

  // Header page fixture
  headerPage: async ({ page }, use) => {
    const headerPage = new HeaderPage(page);
    await use(headerPage);
  },

  // Authenticated page fixture - logs in before test
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(testUsers.superAdmin.email, testUsers.superAdmin.password);

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.navigate();
    await use(dashboardPage);
  },
});

export { expect };
