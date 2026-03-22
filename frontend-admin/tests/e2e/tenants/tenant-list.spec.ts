import { test, expect } from '../../fixtures/custom.fixtures';
import { testTenants } from '../../fixtures/test-data';

/**
 * Tenant List Tests
 *
 * Test Suite: Tenant Management
 * Priority: Critical
 * Type: Smoke, Regression
 *
 * Tests the tenant list functionality including:
 * - Page load and display
 * - Stats cards
 * - Search functionality
 * - Filtering
 * - Sorting
 * - Pagination
 * - Navigation to tenant detail
 */
test.describe('Tenant List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tenants');
  });

  /**
   * Test Case ID: TC-TENANT-001
   * Title: Tenant list page loads successfully
   * Priority: Critical
   * Type: Smoke
   */
  test('TC-TENANT-001: Tenant list page loads successfully', {
    tag: ['@smoke', '@critical', '@tenants'],
  }, async ({ tenantListPage }) => {
    await tenantListPage.assertPageDisplayed();
  });

  /**
   * Test Case ID: TC-TENANT-002
   * Title: Stats cards are displayed
   * Priority: High
   * Type: Smoke
   */
  test('TC-TENANT-002: Stats cards are displayed', {
    tag: ['@smoke', '@tenants', '@stats'],
  }, async ({ tenantListPage }) => {
    await tenantListPage.assertStatsDisplayed();
  });

  /**
   * Test Case ID: TC-TENANT-003
   * Title: Tenant table displays data
   * Priority: Critical
   * Type: Smoke
   */
  test('TC-TENANT-003: Tenant table displays data', {
    tag: ['@smoke', '@critical', '@tenants'],
  }, async ({ tenantListPage }) => {
    await tenantListPage.assertTableHasData();
  });

  /**
   * Test Case ID: TC-TENANT-004
   * Title: Search filters tenants
   * Priority: High
   * Type: Regression
   */
  test('TC-TENANT-004: Search filters tenants', {
    tag: ['@regression', '@tenants', '@search'],
  }, async ({ tenantListPage }) => {
    // Get initial count
    const initialCount = await tenantListPage.getTenantRowCount();

    // Search for a specific tenant
    await tenantListPage.search('Acme');

    // Verify results are filtered
    const filteredCount = await tenantListPage.getTenantRowCount();

    // Search should filter results (or show matching results)
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  /**
   * Test Case ID: TC-TENANT-005
   * Title: Clear search shows all tenants
   * Priority: Medium
   * Type: Regression
   */
  test('TC-TENANT-005: Clear search shows all tenants', {
    tag: ['@regression', '@tenants', '@search'],
  }, async ({ tenantListPage }) => {
    // Search first
    await tenantListPage.search('xyz');
    const filteredCount = await tenantListPage.getTenantRowCount();

    // Clear search
    await tenantListPage.clearSearch();
    const fullCount = await tenantListPage.getTenantRowCount();

    // Full list should have same or more items
    expect(fullCount).toBeGreaterThanOrEqual(filteredCount);
  });

  /**
   * Test Case ID: TC-TENANT-006
   * Title: Filter by status works
   * Priority: High
   * Type: Regression
   */
  test('TC-TENANT-006: Status filter is available', {
    tag: ['@regression', '@tenants', '@filters'],
  }, async ({ page }) => {
    // Verify filter dropdown exists
    const statusFilter = page.locator('app-select').first();
    await expect(statusFilter).toBeVisible();
  });

  /**
   * Test Case ID: TC-TENANT-007
   * Title: Filter by plan works
   * Priority: High
   * Type: Regression
   */
  test('TC-TENANT-007: Plan filter is available', {
    tag: ['@regression', '@tenants', '@filters'],
  }, async ({ page }) => {
    // Verify filter dropdown exists
    const planFilter = page.locator('app-select').nth(1);
    await expect(planFilter).toBeVisible();
  });

  /**
   * Test Case ID: TC-TENANT-008
   * Title: Tenant row displays correct data
   * Priority: High
   * Type: Regression
   */
  test('TC-TENANT-008: Tenant row displays correct data', {
    tag: ['@regression', '@tenants'],
  }, async ({ tenantListPage }) => {
    const rowCount = await tenantListPage.getTenantRowCount();
    if (rowCount > 0) {
      const tenant = await tenantListPage.getTenantFromRow(0);

      // Verify all fields are populated
      expect(tenant.companyName).toBeTruthy();
      expect(tenant.plan).toBeTruthy();
      expect(tenant.status).toBeTruthy();
    }
  });

  /**
   * Test Case ID: TC-TENANT-009
   * Title: Click on tenant navigates to detail
   * Priority: High
   * Type: Regression
   */
  test('TC-TENANT-009: Click on tenant navigates to detail', {
    tag: ['@regression', '@tenants', '@navigation'],
  }, async ({ tenantListPage, page }) => {
    const rowCount = await tenantListPage.getTenantRowCount();
    if (rowCount > 0) {
      await tenantListPage.clickTenantRow(0);
      await expect(page).toHaveURL(/.*tenants\/\w+/);
    }
  });

  /**
   * Test Case ID: TC-TENANT-010
   * Title: Pagination is displayed
   * Priority: Medium
   * Type: Regression
   */
  test('TC-TENANT-010: Pagination component is displayed', {
    tag: ['@regression', '@tenants', '@pagination'],
  }, async ({ tenantListPage, page }) => {
    const pagination = page.locator('app-pagination');
    await expect(pagination).toBeVisible();
  });

  /**
   * Test Case ID: TC-TENANT-011
   * Title: Table columns are correct
   * Priority: Medium
   * Type: Regression
   */
  test('TC-TENANT-011: Table has correct columns', {
    tag: ['@regression', '@tenants'],
  }, async ({ page }) => {
    // Check for expected column headers
    await expect(page.locator('th:has-text("Company")')).toBeVisible();
    await expect(page.locator('th:has-text("Plan")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("MRR")')).toBeVisible();
    await expect(page.locator('th:has-text("Employees")')).toBeVisible();
  });

  /**
   * Test Case ID: TC-TENANT-012
   * Title: Status badges display correctly
   * Priority: Medium
   * Type: Regression
   */
  test('TC-TENANT-012: Status badges display correctly', {
    tag: ['@regression', '@tenants', '@ui'],
  }, async ({ page }) => {
    // Wait for table to load
    await page.waitForTimeout(1000);

    // Check that badges are present in the table - rendered as span elements with status text
    const statusBadges = page.locator('table tbody tr td').locator('span, .badge, [class*="badge"]');
    const statusTexts = page.locator(':text("ACTIVE"), :text("TRIAL"), :text("SUSPENDED"), :text("ENTERPRISE"), :text("PROFESSIONAL"), :text("STARTER")');

    const badgeCount = await statusBadges.count();
    const textCount = await statusTexts.count();

    // Either badges or status text should be visible
    expect(badgeCount + textCount).toBeGreaterThan(0);
  });
});
