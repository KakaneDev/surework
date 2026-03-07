import { test, expect } from '../../fixtures/custom.fixtures';
import { routes } from '../../fixtures/test-data';

/**
 * Dashboard Tests
 *
 * Test Suite: Dashboard
 * Priority: Critical
 * Type: Smoke, Regression
 *
 * Tests the main dashboard functionality including:
 * - Page load and display
 * - KPI cards display and values
 * - Charts rendering
 * - Activity feed
 * - Quick actions navigation
 */
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  /**
   * Test Case ID: TC-DASH-001
   * Title: Dashboard page loads successfully
   * Priority: Critical
   * Type: Smoke
   */
  test('TC-DASH-001: Dashboard page loads successfully', {
    tag: ['@smoke', '@critical', '@dashboard'],
  }, async ({ dashboardPage }) => {
    await dashboardPage.assertPageDisplayed();
  });

  /**
   * Test Case ID: TC-DASH-002
   * Title: All KPI cards are displayed
   * Priority: Critical
   * Type: Smoke
   */
  test('TC-DASH-002: All KPI cards are displayed', {
    tag: ['@smoke', '@critical', '@dashboard', '@kpi'],
  }, async ({ dashboardPage }) => {
    await dashboardPage.assertKpiCardsDisplayed();
  });

  /**
   * Test Case ID: TC-DASH-003
   * Title: KPI values are populated
   * Priority: High
   * Type: Regression
   */
  test('TC-DASH-003: KPI values are populated', {
    tag: ['@regression', '@dashboard', '@kpi'],
  }, async ({ dashboardPage, page }) => {
    // Wait for data to load
    await page.waitForTimeout(1000);

    const totalTenants = await dashboardPage.getKpiValue('Total Tenants');
    const activeTrials = await dashboardPage.getKpiValue('Active Trials');
    const mrr = await dashboardPage.getKpiValue('MRR');
    const churnRate = await dashboardPage.getKpiValue('Churn Rate');

    // Values should be present - they can be 0 if no data is loaded from API
    // but the text should at least be truthy (not empty/undefined)
    expect(totalTenants).toBeTruthy();
    expect(activeTrials).toBeTruthy();
    expect(mrr).toBeTruthy();
    expect(churnRate).toBeTruthy();
  });

  /**
   * Test Case ID: TC-DASH-004
   * Title: Charts are displayed
   * Priority: High
   * Type: Regression
   */
  test('TC-DASH-004: Charts are displayed', {
    tag: ['@regression', '@dashboard', '@charts'],
  }, async ({ dashboardPage }) => {
    await dashboardPage.assertChartsDisplayed();
  });

  /**
   * Test Case ID: TC-DASH-005
   * Title: Activity feed is displayed
   * Priority: Medium
   * Type: Regression
   */
  test('TC-DASH-005: Activity feed is displayed', {
    tag: ['@regression', '@dashboard'],
  }, async ({ dashboardPage }) => {
    await dashboardPage.assertActivityFeedDisplayed();
  });

  /**
   * Test Case ID: TC-DASH-006
   * Title: Quick actions card is displayed
   * Priority: Medium
   * Type: Regression
   */
  test('TC-DASH-006: Quick actions card is displayed', {
    tag: ['@regression', '@dashboard'],
  }, async ({ dashboardPage }) => {
    await dashboardPage.assertQuickActionsDisplayed();
  });

  /**
   * Test Case ID: TC-DASH-007
   * Title: Quick action - View Tenants navigates correctly
   * Priority: Medium
   * Type: Regression
   */
  test('TC-DASH-007: Quick action - View Tenants navigates correctly', {
    tag: ['@regression', '@dashboard', '@navigation'],
  }, async ({ dashboardPage, page }) => {
    await dashboardPage.clickViewTenants();
    await expect(page).toHaveURL(/.*tenants/);
  });

  /**
   * Test Case ID: TC-DASH-008
   * Title: Quick action - Support Tickets navigates correctly
   * Priority: Medium
   * Type: Regression
   */
  test('TC-DASH-008: Quick action - Support Tickets navigates correctly', {
    tag: ['@regression', '@dashboard', '@navigation'],
  }, async ({ dashboardPage, page }) => {
    await dashboardPage.clickSupportTickets();
    await expect(page).toHaveURL(/.*support/);
  });

  /**
   * Test Case ID: TC-DASH-009
   * Title: Quick action - Trial Management navigates correctly
   * Priority: Medium
   * Type: Regression
   */
  test('TC-DASH-009: Quick action - Trial Management navigates correctly', {
    tag: ['@regression', '@dashboard', '@navigation'],
  }, async ({ dashboardPage, page }) => {
    await dashboardPage.clickTrialManagement();
    await expect(page).toHaveURL(/.*trials/);
  });

  /**
   * Test Case ID: TC-DASH-010
   * Title: Quick action - Health Scores navigates correctly
   * Priority: Medium
   * Type: Regression
   */
  test('TC-DASH-010: Quick action - Health Scores navigates correctly', {
    tag: ['@regression', '@dashboard', '@navigation'],
  }, async ({ dashboardPage, page }) => {
    await dashboardPage.clickHealthScores();
    await expect(page).toHaveURL(/.*analytics\/health/);
  });

  /**
   * Test Case ID: TC-DASH-011
   * Title: Export button is clickable
   * Priority: Low
   * Type: Regression
   */
  test('TC-DASH-011: Export button is clickable', {
    tag: ['@regression', '@dashboard'],
  }, async ({ dashboardPage, page }) => {
    const exportButton = page.getByRole('button', { name: /export/i });
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();
  });

  /**
   * Test Case ID: TC-DASH-012
   * Title: Refresh button is clickable
   * Priority: Low
   * Type: Regression
   */
  test('TC-DASH-012: Refresh button is clickable', {
    tag: ['@regression', '@dashboard'],
  }, async ({ dashboardPage, page }) => {
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await expect(refreshButton).toBeVisible();
    await expect(refreshButton).toBeEnabled();
  });
});
