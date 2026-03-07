import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Tenant List Page Object
 *
 * Test Case Coverage:
 * - TC-TENANT-001: Tenant list loads with data
 * - TC-TENANT-002: Search functionality works
 * - TC-TENANT-003: Filter by status works
 * - TC-TENANT-004: Filter by plan works
 * - TC-TENANT-005: Filter by risk level works
 * - TC-TENANT-006: Sorting works
 * - TC-TENANT-007: Pagination works
 * - TC-TENANT-008: Click tenant navigates to detail
 * - TC-TENANT-009: Stats cards display correct counts
 */
export class TenantListPage extends BasePage {
  // Locators - Header
  readonly pageHeader: Locator;
  readonly pageDescription: Locator;

  // Locators - Stats Cards
  readonly statsCards: Locator;
  readonly totalStat: Locator;
  readonly activeStat: Locator;
  readonly trialsStat: Locator;
  readonly atRiskStat: Locator;

  // Locators - Filters
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly planFilter: Locator;
  readonly riskFilter: Locator;

  // Locators - Table
  readonly tenantsTable: Locator;
  readonly tableRows: Locator;
  readonly loadingIndicator: Locator;
  readonly emptyState: Locator;

  // Locators - Pagination
  readonly pagination: Locator;
  readonly prevPageButton: Locator;
  readonly nextPageButton: Locator;

  constructor(page: Page) {
    super(page);

    // Header
    this.pageHeader = page.locator('h1:has-text("Tenants")');
    this.pageDescription = page.locator('text=Manage all registered tenants');

    // Stats Cards - match the rendered HTML structure
    this.statsCards = page.locator('.grid > div:has(p)');
    this.totalStat = page.locator('p:has-text("Total") + p');
    this.activeStat = page.locator('p:has-text("Active") + p');
    this.trialsStat = page.locator('p:has-text("Trials") + p');
    this.atRiskStat = page.locator('p:has-text("At Risk") + p');

    // Filters - use native selectors as Angular components render to native HTML
    this.searchInput = page.locator('input[placeholder*="Search tenant"], input[type="text"]').first();
    this.statusFilter = page.locator('select').nth(0);
    this.planFilter = page.locator('select').nth(1);
    this.riskFilter = page.locator('select').nth(2);

    // Table - use native table element (second rowgroup contains data rows)
    this.tenantsTable = page.locator('table');
    // Get data rows - rows that have td cells (not header rows with th)
    this.tableRows = page.locator('table tr:has(td)');
    this.loadingIndicator = page.locator('[data-loading="true"], .animate-pulse');
    this.emptyState = page.locator('text=No tenants found');

    // Pagination - use rendered navigation element
    this.pagination = page.locator('nav[aria-label="Pagination"], app-pagination');
    this.prevPageButton = page.getByRole('button', { name: /previous/i });
    this.nextPageButton = page.getByRole('button', { name: /next/i });
  }

  /**
   * Navigate to the tenant list page
   */
  async navigate(): Promise<void> {
    await this.page.goto('/tenants');
    await this.waitForPageLoad();
  }

  /**
   * Verify the tenant list page is displayed correctly
   */
  async assertPageDisplayed(): Promise<void> {
    await this.assertVisible(this.pageHeader, 'Page header should be visible');
    await this.assertVisible(this.pageDescription, 'Page description should be visible');
  }

  /**
   * Verify stats cards are displayed
   */
  async assertStatsDisplayed(): Promise<void> {
    await expect(this.statsCards).toHaveCount(4);
    await this.assertVisible(this.totalStat, 'Total stat should be visible');
    await this.assertVisible(this.activeStat, 'Active stat should be visible');
  }

  /**
   * Get stat value by label
   */
  async getStatValue(label: string): Promise<string> {
    const stat = this.page.locator(`div:has(> p:has-text("${label}")) >> .text-2xl`);
    return this.getText(stat);
  }

  /**
   * Search for tenants
   */
  async search(searchTerm: string): Promise<void> {
    // Use specific selector for the search input on the tenants page - exact placeholder match
    const searchInput = this.page.getByRole('textbox', { name: 'Search tenants...' });
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.clear();
    await searchInput.fill(searchTerm);
    // Wait for debounce
    await this.page.waitForTimeout(500);
  }

  /**
   * Clear search
   */
  async clearSearch(): Promise<void> {
    const searchInput = this.page.getByRole('textbox', { name: 'Search tenants...' });
    await searchInput.clear();
    await this.page.waitForTimeout(500);
  }

  /**
   * Filter by status
   */
  async filterByStatus(status: string): Promise<void> {
    await this.safeClick(this.statusFilter);
    await this.page.locator(`text=${status}`).click();
    await this.waitForTableLoad();
  }

  /**
   * Filter by plan
   */
  async filterByPlan(plan: string): Promise<void> {
    await this.safeClick(this.planFilter);
    await this.page.locator(`text=${plan}`).click();
    await this.waitForTableLoad();
  }

  /**
   * Filter by risk level
   */
  async filterByRisk(risk: string): Promise<void> {
    await this.safeClick(this.riskFilter);
    await this.page.locator(`text=${risk}`).click();
    await this.waitForTableLoad();
  }

  /**
   * Wait for table data to load
   */
  async waitForTableLoad(): Promise<void> {
    await this.page.waitForTimeout(500);
    // Wait for loading indicator to disappear if present
    const loadingExists = await this.exists(this.loadingIndicator);
    if (loadingExists) {
      await this.waitForElementToDisappear(this.loadingIndicator);
    }
    // Wait for at least one data row to appear (with timeout)
    try {
      await this.tableRows.first().waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      // Table might be empty, which is okay
    }
  }

  /**
   * Get the number of tenant rows in the table
   */
  async getTenantRowCount(): Promise<number> {
    await this.waitForTableLoad();
    return this.tableRows.count();
  }

  /**
   * Get tenant data from a specific row
   */
  async getTenantFromRow(rowIndex: number): Promise<{
    companyName: string;
    email: string;
    plan: string;
    status: string;
  }> {
    const row = this.tableRows.nth(rowIndex);
    // Company name is in a link element
    const companyLink = row.locator('td').first().locator('a');
    const companyName = await companyLink.textContent() ?? '';
    // Email is in a paragraph below the link
    const emailEl = row.locator('td').first().locator('p');
    const email = await emailEl.textContent() ?? '';
    // Plan is in the second cell (rendered as span or generic element)
    const planCell = row.locator('td').nth(1);
    const plan = await planCell.textContent() ?? '';
    // Status is in the third cell
    const statusCell = row.locator('td').nth(2);
    const status = await statusCell.textContent() ?? '';

    return {
      companyName: companyName.trim(),
      email: email.trim(),
      plan: plan.trim(),
      status: status.trim(),
    };
  }

  /**
   * Click on a tenant row to navigate to detail
   */
  async clickTenantRow(rowIndex: number): Promise<void> {
    const row = this.tableRows.nth(rowIndex);
    // Click the View link or the company name link
    const viewLink = row.getByRole('link', { name: /view/i });
    const linkCount = await viewLink.count();
    if (linkCount > 0) {
      await viewLink.click();
    } else {
      // Fallback to company name link
      const companyLink = row.locator('td').first().locator('a');
      await companyLink.click();
    }
  }

  /**
   * Click on tenant by company name
   */
  async clickTenantByName(companyName: string): Promise<void> {
    const link = this.page.locator(`a:has-text("${companyName}")`).first();
    await this.safeClick(link);
  }

  /**
   * Sort table by column
   */
  async sortByColumn(columnName: string): Promise<void> {
    const header = this.page.locator(`th:has-text("${columnName}")`);
    await this.safeClick(header);
    await this.waitForTableLoad();
  }

  /**
   * Go to next page
   */
  async goToNextPage(): Promise<void> {
    await this.safeClick(this.nextPageButton);
    await this.waitForTableLoad();
  }

  /**
   * Go to previous page
   */
  async goToPreviousPage(): Promise<void> {
    await this.safeClick(this.prevPageButton);
    await this.waitForTableLoad();
  }

  /**
   * Check if empty state is displayed
   */
  async isEmptyStateDisplayed(): Promise<boolean> {
    return this.exists(this.emptyState);
  }

  /**
   * Verify table has data
   */
  async assertTableHasData(): Promise<void> {
    // Wait for table to be visible and load data
    await this.tenantsTable.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(1000); // Wait for data to load
    const count = await this.getTenantRowCount();
    expect(count).toBeGreaterThan(0);
  }
}
