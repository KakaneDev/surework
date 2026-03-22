import { test, expect } from '../../fixtures/custom.fixtures';

/**
 * Billing & Revenue Tests
 *
 * Test Suite: Billing
 * Priority: High
 * Type: Regression
 *
 * Tests the billing and revenue functionality including:
 * - Revenue dashboard
 * - Payment history
 * - Revenue projections
 */
test.describe('Billing & Revenue', () => {
  /**
   * Test Case ID: TC-BILLING-001
   * Title: Revenue dashboard page loads
   * Priority: High
   * Type: Smoke
   */
  test('TC-BILLING-001: Revenue dashboard page loads', {
    tag: ['@smoke', '@billing'],
  }, async ({ page }) => {
    await page.goto('/billing/revenue');
    await expect(page.locator('h1:has-text("Revenue")')).toBeVisible();
  });

  /**
   * Test Case ID: TC-BILLING-002
   * Title: Revenue metrics are displayed
   * Priority: High
   * Type: Regression
   */
  test('TC-BILLING-002: Revenue metrics are displayed', {
    tag: ['@regression', '@billing', '@metrics'],
  }, async ({ page }) => {
    await page.goto('/billing/revenue');

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Check for metric cards - MRR and ARR text should be visible
    const mrrText = page.locator(':text("MRR")');
    const arrText = page.locator(':text("ARR")');

    const hasMrr = (await mrrText.count()) > 0;
    const hasArr = (await arrText.count()) > 0;

    // At least one revenue metric should be visible
    expect(hasMrr || hasArr).toBe(true);
  });

  /**
   * Test Case ID: TC-BILLING-003
   * Title: Revenue chart is displayed
   * Priority: Medium
   * Type: Regression
   */
  test('TC-BILLING-003: Revenue chart is displayed', {
    tag: ['@regression', '@billing', '@charts'],
  }, async ({ page }) => {
    await page.goto('/billing/revenue');

    // Check for chart component
    const chart = page.locator('apx-chart, .chart, canvas');
    const chartExists = (await chart.count()) > 0;

    // Chart should be present
    expect(chartExists).toBe(true);
  });

  /**
   * Test Case ID: TC-BILLING-004
   * Title: Projections page loads
   * Priority: High
   * Type: Smoke
   */
  test('TC-BILLING-004: Projections page loads', {
    tag: ['@smoke', '@billing', '@projections'],
  }, async ({ page }) => {
    await page.goto('/billing/projections');
    await expect(page.locator('h1:has-text("Projection")')).toBeVisible();
  });

  /**
   * Test Case ID: TC-BILLING-005
   * Title: Payment history page loads
   * Priority: High
   * Type: Smoke
   */
  test('TC-BILLING-005: Payment history page loads', {
    tag: ['@smoke', '@billing', '@payments'],
  }, async ({ page }) => {
    await page.goto('/billing/payments');
    await expect(page.locator('h1:has-text("Payment")')).toBeVisible();
  });

  /**
   * Test Case ID: TC-BILLING-006
   * Title: Payment history table displays
   * Priority: High
   * Type: Regression
   */
  test('TC-BILLING-006: Payment history table displays', {
    tag: ['@regression', '@billing', '@payments'],
  }, async ({ page }) => {
    await page.goto('/billing/payments');

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Check for table
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  /**
   * Test Case ID: TC-BILLING-007
   * Title: Payment table has correct columns
   * Priority: Medium
   * Type: Regression
   */
  test('TC-BILLING-007: Payment table has correct columns', {
    tag: ['@regression', '@billing', '@payments'],
  }, async ({ page }) => {
    await page.goto('/billing/payments');

    // Check for expected columns
    await expect(page.locator('th:has-text("Amount")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
  });

  /**
   * Test Case ID: TC-BILLING-008
   * Title: Revenue projections chart displays
   * Priority: Medium
   * Type: Regression
   */
  test('TC-BILLING-008: Revenue projections chart displays', {
    tag: ['@regression', '@billing', '@projections'],
  }, async ({ page }) => {
    await page.goto('/billing/projections');

    // Check for chart or projection data
    const chart = page.locator('apx-chart, .chart, canvas, .projection');
    const chartExists = (await chart.count()) > 0;

    expect(chartExists).toBe(true);
  });
});
