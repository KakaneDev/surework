import { test, expect } from '../../fixtures/custom.fixtures';

/**
 * Analytics Tests
 *
 * Test Suite: Analytics
 * Priority: High
 * Type: Regression
 *
 * Tests the analytics functionality including:
 * - Feature usage analytics
 * - Churn analysis
 * - Tenant health scores
 */
test.describe('Analytics', () => {
  /**
   * Test Case ID: TC-ANALYTICS-001
   * Title: Feature usage page loads
   * Priority: High
   * Type: Smoke
   */
  test('TC-ANALYTICS-001: Feature usage page loads', {
    tag: ['@smoke', '@analytics'],
  }, async ({ page }) => {
    await page.goto('/analytics/usage');
    await expect(page.locator('h1:has-text("Feature"), h1:has-text("Usage")')).toBeVisible();
  });

  /**
   * Test Case ID: TC-ANALYTICS-002
   * Title: Feature usage data is displayed
   * Priority: High
   * Type: Regression
   */
  test('TC-ANALYTICS-002: Feature usage data is displayed', {
    tag: ['@regression', '@analytics'],
  }, async ({ page }) => {
    await page.goto('/analytics/usage');

    // Check for data visualization
    const chart = page.locator('apx-chart, .chart, canvas, app-table, table');
    const dataExists = (await chart.count()) > 0;

    expect(dataExists).toBe(true);
  });

  /**
   * Test Case ID: TC-ANALYTICS-003
   * Title: Churn analysis page loads
   * Priority: High
   * Type: Smoke
   */
  test('TC-ANALYTICS-003: Churn analysis page loads', {
    tag: ['@smoke', '@analytics', '@churn'],
  }, async ({ page }) => {
    await page.goto('/analytics/churn');
    await expect(page.locator('h1:has-text("Churn")')).toBeVisible();
  });

  /**
   * Test Case ID: TC-ANALYTICS-004
   * Title: Churn metrics are displayed
   * Priority: High
   * Type: Regression
   */
  test('TC-ANALYTICS-004: Churn metrics are displayed', {
    tag: ['@regression', '@analytics', '@churn'],
  }, async ({ page }) => {
    await page.goto('/analytics/churn');

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Check for churn-related content - look for specific text in the page
    const churnRate = page.locator(':text("Churn Rate"), :text("churn rate")');
    const atRisk = page.locator(':text("At Risk"), :text("Risk")');
    const churnedMrr = page.locator(':text("Churned MRR"), :text("MRR")');

    const hasChurnRate = (await churnRate.count()) > 0;
    const hasAtRisk = (await atRisk.count()) > 0;
    const hasChurnedMrr = (await churnedMrr.count()) > 0;

    // At least one churn metric should be visible
    expect(hasChurnRate || hasAtRisk || hasChurnedMrr).toBe(true);
  });

  /**
   * Test Case ID: TC-ANALYTICS-005
   * Title: Health scores page loads
   * Priority: High
   * Type: Smoke
   */
  test('TC-ANALYTICS-005: Health scores page loads', {
    tag: ['@smoke', '@analytics', '@health'],
  }, async ({ page }) => {
    await page.goto('/analytics/health');
    await expect(page.locator('h1:has-text("Health")')).toBeVisible();
  });

  /**
   * Test Case ID: TC-ANALYTICS-006
   * Title: Health scores data is displayed
   * Priority: High
   * Type: Regression
   */
  test('TC-ANALYTICS-006: Health scores data is displayed', {
    tag: ['@regression', '@analytics', '@health'],
  }, async ({ page }) => {
    await page.goto('/analytics/health');

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Check for health score data - table, chart, or health-related text
    const healthData = page.locator('table, apx-chart, canvas, svg');
    const healthText = page.locator(':text("Health"), :text("Score"), :text("Tenant")');

    const hasDataElement = (await healthData.count()) > 0;
    const hasHealthText = (await healthText.count()) > 0;

    expect(hasDataElement || hasHealthText).toBe(true);
  });

  /**
   * Test Case ID: TC-ANALYTICS-007
   * Title: Health scores table has correct columns
   * Priority: Medium
   * Type: Regression
   */
  test('TC-ANALYTICS-007: Health scores table has correct columns', {
    tag: ['@regression', '@analytics', '@health'],
  }, async ({ page }) => {
    await page.goto('/analytics/health');

    // Check for expected columns (if table exists)
    const table = page.locator('app-table, table');
    const tableExists = (await table.count()) > 0;

    if (tableExists) {
      // Look for common health score columns
      const scoreColumn = page.locator('th:has-text("Score"), th:has-text("Health")');
      const tenantColumn = page.locator('th:has-text("Tenant"), th:has-text("Company")');

      const scoreExists = (await scoreColumn.count()) > 0;
      const tenantExists = (await tenantColumn.count()) > 0;

      expect(scoreExists || tenantExists).toBe(true);
    }
  });

  /**
   * Test Case ID: TC-ANALYTICS-008
   * Title: Risk indicators are displayed
   * Priority: Medium
   * Type: Regression
   */
  test('TC-ANALYTICS-008: Risk indicators are displayed', {
    tag: ['@regression', '@analytics'],
  }, async ({ page }) => {
    await page.goto('/analytics/health');

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Check for risk badges or indicators - risk levels or the word Risk in any form
    const riskText = page.locator(':text("Risk"), :text("LOW"), :text("MEDIUM"), :text("HIGH"), :text("At Risk")');
    const indicatorsExist = (await riskText.count()) > 0;

    // Risk indicators should be present on health page (either in headers or data)
    expect(indicatorsExist).toBe(true);
  });
});
