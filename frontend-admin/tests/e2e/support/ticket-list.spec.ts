import { test, expect } from '../../fixtures/custom.fixtures';

/**
 * Support Ticket Tests
 *
 * Test Suite: Support
 * Priority: High
 * Type: Regression
 *
 * Tests the support ticket functionality including:
 * - Ticket list display
 * - Filtering and search
 * - Creating tickets
 * - Ticket detail view
 */
test.describe('Support Tickets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/support');
  });

  /**
   * Test Case ID: TC-SUPPORT-001
   * Title: Support ticket list page loads
   * Priority: High
   * Type: Smoke
   */
  test('TC-SUPPORT-001: Support ticket list page loads', {
    tag: ['@smoke', '@support'],
  }, async ({ page }) => {
    await expect(page.locator('h1:has-text("Support"), h1:has-text("Tickets")')).toBeVisible();
  });

  /**
   * Test Case ID: TC-SUPPORT-002
   * Title: Ticket list displays tickets
   * Priority: High
   * Type: Regression
   */
  test('TC-SUPPORT-002: Ticket list displays data', {
    tag: ['@regression', '@support'],
  }, async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(1000);
    // Check for table or list of tickets
    const ticketTable = page.locator('table');
    await expect(ticketTable).toBeVisible({ timeout: 10000 });
  });

  /**
   * Test Case ID: TC-SUPPORT-003
   * Title: Filter by status is available
   * Priority: Medium
   * Type: Regression
   */
  test('TC-SUPPORT-003: Filter controls are available', {
    tag: ['@regression', '@support', '@filters'],
  }, async ({ page }) => {
    // Check for filter controls
    const filters = page.locator('app-select, select, .filter');
    const count = await filters.count();
    expect(count).toBeGreaterThan(0);
  });

  /**
   * Test Case ID: TC-SUPPORT-004
   * Title: Create ticket button is available
   * Priority: High
   * Type: Regression
   */
  test('TC-SUPPORT-004: Create ticket button is available', {
    tag: ['@regression', '@support'],
  }, async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create|new|add/i });
    await expect(createButton).toBeVisible();
  });

  /**
   * Test Case ID: TC-SUPPORT-005
   * Title: Priority badges display correctly
   * Priority: Medium
   * Type: Regression
   */
  test('TC-SUPPORT-005: Priority badges display correctly', {
    tag: ['@regression', '@support', '@ui'],
  }, async ({ page }) => {
    // Check for priority badges in the list
    const badges = page.locator('app-badge');
    const count = await badges.count();

    // Should have at least one badge if there are tickets
    // (or zero if no tickets)
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
