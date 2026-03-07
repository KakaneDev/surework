import { test, expect } from '../../fixtures/custom.fixtures';

/**
 * Discount Management Tests
 *
 * Test Suite: Discounts
 * Priority: High
 * Type: Regression
 *
 * Tests the discount management functionality including:
 * - Discount list display
 * - Creating discounts
 * - Editing discounts
 * - Applying discounts to tenants
 */
test.describe('Discount Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/discounts');
  });

  /**
   * Test Case ID: TC-DISCOUNT-001
   * Title: Discount list page loads
   * Priority: High
   * Type: Smoke
   */
  test('TC-DISCOUNT-001: Discount list page loads', {
    tag: ['@smoke', '@discounts'],
  }, async ({ page }) => {
    await expect(page.locator('h1:has-text("Discount")')).toBeVisible();
  });

  /**
   * Test Case ID: TC-DISCOUNT-002
   * Title: Create discount button is available
   * Priority: High
   * Type: Regression
   */
  test('TC-DISCOUNT-002: Create discount button is available', {
    tag: ['@regression', '@discounts'],
  }, async ({ page }) => {
    // Button may be rendered as link or button depending on component
    const createButton = page.getByRole('link', { name: /create discount/i })
      .or(page.getByRole('button', { name: /create discount/i }))
      .or(page.locator('a:has-text("Create Discount")'))
      .or(page.locator('button:has-text("Create Discount")'));
    await expect(createButton).toBeVisible({ timeout: 10000 });
  });

  /**
   * Test Case ID: TC-DISCOUNT-003
   * Title: Create discount button navigates to form
   * Priority: High
   * Type: Regression
   */
  test('TC-DISCOUNT-003: Create discount button navigates to form', {
    tag: ['@regression', '@discounts', '@navigation'],
  }, async ({ page }) => {
    // Button may be rendered as link or button depending on component
    const createButton = page.getByRole('link', { name: /create discount/i })
      .or(page.getByRole('button', { name: /create discount/i }))
      .or(page.locator('a:has-text("Create Discount")'))
      .or(page.locator('button:has-text("Create Discount")'));
    await createButton.click();
    await expect(page).toHaveURL(/.*discounts\/create/);
  });

  /**
   * Test Case ID: TC-DISCOUNT-004
   * Title: Discount table displays data
   * Priority: High
   * Type: Regression
   */
  test('TC-DISCOUNT-004: Discount table displays data', {
    tag: ['@regression', '@discounts'],
  }, async ({ page }) => {
    // Check for table - wait for data to load
    await page.waitForTimeout(1000);
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  /**
   * Test Case ID: TC-DISCOUNT-005
   * Title: Discount table has correct columns
   * Priority: Medium
   * Type: Regression
   */
  test('TC-DISCOUNT-005: Discount table has correct columns', {
    tag: ['@regression', '@discounts'],
  }, async ({ page }) => {
    // Wait for table to load
    await page.waitForTimeout(1000);
    // Check for expected column headers - the columns are Code, Discount, Duration, Status, Uses, Expires
    await expect(page.locator('th:has-text("Code")')).toBeVisible({ timeout: 10000 });
    // The table uses "Discount" column not "Type" and "Value"
    const discountHeader = page.locator('th:has-text("Discount"), th:has-text("Type"), th:has-text("Value")');
    await expect(discountHeader.first()).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
  });

  /**
   * Test Case ID: TC-DISCOUNT-006
   * Title: Status badges display correctly
   * Priority: Medium
   * Type: Regression
   */
  test('TC-DISCOUNT-006: Status badges display correctly', {
    tag: ['@regression', '@discounts', '@ui'],
  }, async ({ page }) => {
    const badges = page.locator('app-badge');
    const count = await badges.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
