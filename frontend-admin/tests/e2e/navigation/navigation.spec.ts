import { test, expect } from '../../fixtures/custom.fixtures';
import { routes } from '../../fixtures/test-data';

/**
 * Navigation Tests
 *
 * Test Suite: Navigation
 * Priority: High
 * Type: Smoke, Regression
 *
 * Tests the navigation functionality including:
 * - Sidebar navigation
 * - Active link highlighting
 * - All pages are accessible
 * - Breadcrumb navigation
 */
test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  /**
   * Test Case ID: TC-NAV-001
   * Title: Sidebar displays correctly
   * Priority: High
   * Type: Smoke
   */
  test('TC-NAV-001: Sidebar displays correctly', {
    tag: ['@smoke', '@navigation'],
  }, async ({ sidebarPage }) => {
    await sidebarPage.assertSidebarDisplayed();
  });

  /**
   * Test Case ID: TC-NAV-002
   * Title: Dashboard link navigates correctly
   * Priority: High
   * Type: Regression
   */
  test('TC-NAV-002: Dashboard link navigates correctly', {
    tag: ['@regression', '@navigation'],
  }, async ({ sidebarPage, page }) => {
    // First go to another page
    await sidebarPage.goToTenants();

    // Then go back to dashboard
    await sidebarPage.goToDashboard();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  /**
   * Test Case ID: TC-NAV-003
   * Title: Tenants link navigates correctly
   * Priority: High
   * Type: Regression
   */
  test('TC-NAV-003: Tenants link navigates correctly', {
    tag: ['@regression', '@navigation'],
  }, async ({ sidebarPage, page }) => {
    await sidebarPage.goToTenants();
    await expect(page).toHaveURL(/.*tenants/);
  });

  /**
   * Test Case ID: TC-NAV-004
   * Title: Onboarding link navigates correctly
   * Priority: Medium
   * Type: Regression
   */
  test('TC-NAV-004: Onboarding link navigates correctly', {
    tag: ['@regression', '@navigation'],
  }, async ({ sidebarPage, page }) => {
    await sidebarPage.goToOnboarding();
    await expect(page).toHaveURL(/.*onboarding/);
  });

  /**
   * Test Case ID: TC-NAV-005
   * Title: Trials link navigates correctly
   * Priority: Medium
   * Type: Regression
   */
  test('TC-NAV-005: Trials link navigates correctly', {
    tag: ['@regression', '@navigation'],
  }, async ({ sidebarPage, page }) => {
    await sidebarPage.goToTrials();
    await expect(page).toHaveURL(/.*trials/);
  });

  /**
   * Test Case ID: TC-NAV-006
   * Title: Support link navigates correctly
   * Priority: High
   * Type: Regression
   */
  test('TC-NAV-006: Support link navigates correctly', {
    tag: ['@regression', '@navigation'],
  }, async ({ sidebarPage, page }) => {
    await sidebarPage.goToSupport();
    await expect(page).toHaveURL(/.*support/);
  });

  /**
   * Test Case ID: TC-NAV-007
   * Title: Discounts link navigates correctly
   * Priority: Medium
   * Type: Regression
   */
  test('TC-NAV-007: Discounts link navigates correctly', {
    tag: ['@regression', '@navigation'],
  }, async ({ sidebarPage, page }) => {
    await sidebarPage.goToDiscounts();
    await expect(page).toHaveURL(/.*discounts/);
  });

  /**
   * Test Case ID: TC-NAV-008
   * Title: All main pages are accessible
   * Priority: High
   * Type: Smoke
   */
  test('TC-NAV-008: All main pages are accessible', {
    tag: ['@smoke', '@navigation'],
  }, async ({ page }) => {
    const mainPages = [
      '/dashboard',
      '/tenants',
      '/onboarding',
      '/trials',
      '/support',
      '/discounts',
    ];

    for (const route of mainPages) {
      await page.goto(route);
      // Verify page loads without error
      const errorIndicator = page.locator('text=Error, text=404, text=Not Found');
      await expect(errorIndicator).not.toBeVisible();
    }
  });

  /**
   * Test Case ID: TC-NAV-009
   * Title: Analytics pages are accessible
   * Priority: Medium
   * Type: Regression
   */
  test('TC-NAV-009: Analytics pages are accessible', {
    tag: ['@regression', '@navigation', '@analytics'],
  }, async ({ page }) => {
    const analyticsPages = [
      '/analytics/usage',
      '/analytics/churn',
      '/analytics/health',
    ];

    for (const route of analyticsPages) {
      await page.goto(route);
      const errorIndicator = page.locator('text=Error, text=404');
      await expect(errorIndicator).not.toBeVisible();
    }
  });

  /**
   * Test Case ID: TC-NAV-010
   * Title: Billing pages are accessible
   * Priority: Medium
   * Type: Regression
   */
  test('TC-NAV-010: Billing pages are accessible', {
    tag: ['@regression', '@navigation', '@billing'],
  }, async ({ page }) => {
    const billingPages = [
      '/billing/revenue',
      '/billing/projections',
      '/billing/payments',
    ];

    for (const route of billingPages) {
      await page.goto(route);
      const errorIndicator = page.locator('text=Error, text=404');
      await expect(errorIndicator).not.toBeVisible();
    }
  });

  /**
   * Test Case ID: TC-NAV-011
   * Title: Unknown routes redirect to dashboard
   * Priority: Low
   * Type: Regression
   */
  test('TC-NAV-011: Unknown routes redirect to dashboard', {
    tag: ['@regression', '@navigation'],
  }, async ({ page }) => {
    await page.goto('/nonexistent-page');
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
