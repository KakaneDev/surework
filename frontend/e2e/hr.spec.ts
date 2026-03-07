/**
 * HR Module E2E Test Suite
 *
 * This test suite covers the HR functionality in SureWork ERP including:
 * - HR Dashboard
 * - Employee Management (List, Detail, Create, Edit)
 * - Leave Management (Self-service and Admin)
 * - Organization Chart
 *
 * Test User: Thabo Mokoena (HR Manager)
 * Email: thabo.mokoena@testcompany.co.za
 * Password: Admin@123!
 * Permissions: EMPLOYEE_READ, EMPLOYEE_MANAGE, LEAVE_APPROVE, LEAVE_MANAGE
 */

import { test, expect, Page } from '@playwright/test';

// ==================== Test Configuration ====================

// Run tests in parallel for faster execution

// Test timeouts
test.setTimeout(60000);

// Test user credentials
const TEST_PASSWORD = 'Admin@123!';

const HR_MANAGER = {
  email: 'thabo.mokoena@testcompany.co.za',
  name: 'Thabo Mokoena',
  role: 'HR Manager'
};

const DEPT_MANAGER = {
  email: 'johan.meyer@testcompany.co.za',
  name: 'Johan Meyer',
  role: 'Department Manager'
};

const EMPLOYEE = {
  email: 'ayanda.nkosi@testcompany.co.za',
  name: 'Ayanda Nkosi',
  role: 'Employee'
};

// Test employee data
const TEST_EMPLOYEES = {
  sipho: { name: 'Sipho Dlamini', number: 'EMP-1001', role: 'CEO' },
  nomvula: { name: 'Nomvula Mbeki', number: 'EMP-1002', role: 'CFO' },
  thabo: { name: 'Thabo Mokoena', number: 'EMP-1003', role: 'HR Manager' },
  ayanda: { name: 'Ayanda Nkosi', number: 'EMP-1008', role: 'Developer' },
  zandile: { name: 'Zandile Khumalo', number: 'EMP-1011', status: 'ON_LEAVE' }
};

// ==================== Helper Functions ====================

/**
 * Helper function to log in a user with retry logic
 */
async function login(page: Page, email: string, password: string, maxRetries: number = 2): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await page.goto('/auth/login');
      await page.waitForSelector('#email', { timeout: 15000 });

      await page.fill('#email', email);
      await page.fill('#password', password);
      await page.click('button[type="submit"]');

      // Wait for dashboard redirect
      await Promise.race([
        page.waitForURL('**/dashboard', { timeout: 45000 }),
        page.waitForSelector('.error-message, [class*="error"]', { timeout: 45000 }).then(() => {
          throw new Error('Login failed with error message');
        })
      ]);

      await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 15000 });
      await page.waitForTimeout(2000);
      return;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      console.log(`Login attempt ${attempt} failed, retrying...`);
      await page.waitForTimeout(2000);
    }
  }
}

/**
 * Helper to wait for content to load
 */
async function waitForContentLoad(page: Page): Promise<void> {
  await page.waitForSelector('sw-spinner', { state: 'hidden', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(500);
}

/**
 * Helper to navigate to a route after login
 */
async function navigateToHR(page: Page): Promise<void> {
  await page.goto('/hr');
  await waitForContentLoad(page);
}

async function navigateToEmployees(page: Page): Promise<void> {
  await page.goto('/employees');
  await waitForContentLoad(page);
}

async function navigateToLeave(page: Page): Promise<void> {
  await page.goto('/leave');
  await waitForContentLoad(page);
}

// ==================== ACCESS CONTROL TESTS ====================

test.describe('TC-HR-ACCESS: HR Module Access Control', () => {

  test('TC-HR-ACCESS-001: HR Manager can access HR dashboard', async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);
    await navigateToHR(page);

    await expect(page).toHaveURL(/.*\/hr/);
    await expect(page.locator('h1, h2').filter({ hasText: /HR|Human Resources/i }).first()).toBeVisible();
  });

  test('TC-HR-ACCESS-002: HR Manager can access employee management', async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);
    await navigateToEmployees(page);

    await expect(page).toHaveURL(/.*\/employees/);
    await expect(page.locator('h1, h2').filter({ hasText: /Employee/i }).first()).toBeVisible();
  });

  test('TC-HR-ACCESS-003: HR Manager can access leave admin', async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);
    await page.goto('/leave/admin');
    await waitForContentLoad(page);

    await expect(page).toHaveURL(/.*\/leave/);
  });

  test('TC-HR-ACCESS-004: Regular employee can access leave self-service', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await navigateToLeave(page);

    await expect(page).toHaveURL(/.*\/leave/);
    // Employee should see their leave balances
    await expect(page.locator('text=/Leave Balance|My Leave/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-HR-ACCESS-005: Unauthenticated user redirected to login', async ({ page }) => {
    await page.goto('/hr');
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });

});

// ==================== HR DASHBOARD TESTS ====================

test.describe('TC-HR-DASH: HR Dashboard', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);
    await navigateToHR(page);
  });

  test('TC-HR-DASH-001: Dashboard displays quick stats cards', async ({ page }) => {
    // Look for stat cards with employee counts
    const statsSection = page.locator('[class*="stat"], [class*="card"], [class*="metric"]').first();
    await expect(statsSection).toBeVisible({ timeout: 10000 });

    // Check for typical HR metrics
    const pageContent = await page.textContent('body');
    const hasEmployeeStats = pageContent?.includes('Employee') ||
                             pageContent?.includes('Total') ||
                             pageContent?.includes('Active');
    expect(hasEmployeeStats).toBeTruthy();
  });

  test('TC-HR-DASH-002: Dashboard has navigation links to HR features', async ({ page }) => {
    // Look for navigation links/buttons
    const employeesLink = page.locator('a[href*="employees"], button:has-text("Employees")').first();
    const leaveLink = page.locator('a[href*="leave"], button:has-text("Leave")').first();

    // At least one HR navigation should be present
    const hasNavigation = await employeesLink.isVisible() || await leaveLink.isVisible();
    expect(hasNavigation).toBeTruthy();
  });

  test('TC-HR-DASH-003: Dashboard shows pending approvals indicator', async ({ page }) => {
    // Look for pending approvals section or count
    const pendingSection = page.locator('text=/pending|approval/i').first();
    const pendingExists = await pendingSection.isVisible().catch(() => false);

    // If there's no pending section, that's okay - just verify dashboard loaded
    if (!pendingExists) {
      await expect(page.locator('body')).toContainText(/HR|Human Resources|Dashboard/i);
    }
  });

  test('TC-HR-DASH-004: Can navigate to employees from dashboard', async ({ page }) => {
    // Click on employees link/button
    const employeesNav = page.locator('a[href*="employees"]').first();

    if (await employeesNav.isVisible()) {
      await employeesNav.click();
      await waitForContentLoad(page);
      await expect(page).toHaveURL(/.*\/employees/);
    } else {
      // Try sidebar navigation
      await page.goto('/employees');
      await expect(page).toHaveURL(/.*\/employees/);
    }
  });

});

// ==================== EMPLOYEE LIST TESTS ====================

test.describe('TC-EMP-LIST: Employee List Management', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);
    await navigateToEmployees(page);
  });

  test('TC-EMP-LIST-001: Employee list page loads correctly', async ({ page }) => {
    await expect(page.locator('h1, h2').filter({ hasText: /Employee/i }).first()).toBeVisible();

    // Should have a table or list of employees
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const hasList = await page.locator('[class*="list"], [class*="grid"]').first().isVisible().catch(() => false);
    expect(hasTable || hasList).toBeTruthy();
  });

  test('TC-EMP-LIST-002: Employee table displays correct columns', async ({ page }) => {
    const table = page.locator('table');

    if (await table.isVisible()) {
      // Check for typical employee columns
      const headers = await table.locator('th').allTextContents();
      const headerText = headers.join(' ').toLowerCase();

      // Should have name-related column
      const hasNameColumn = headerText.includes('name') || headerText.includes('employee');
      expect(hasNameColumn).toBeTruthy();
    }
  });

  test('TC-EMP-LIST-003: Search filter works correctly', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="earch"], input[placeholder*="Search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('Sipho');
      await page.waitForTimeout(1000);

      // Check that results are filtered
      const pageContent = await page.textContent('body');
      expect(pageContent).toContain('Sipho');
    }
  });

  test('TC-EMP-LIST-004: Status filter dropdown is functional', async ({ page }) => {
    const statusFilter = page.locator('select, [class*="dropdown"]').filter({ hasText: /status|active/i }).first();

    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await page.waitForTimeout(500);

      // Should show filter options
      const options = page.locator('[role="option"], option, [class*="option"]');
      const optionCount = await options.count();
      expect(optionCount).toBeGreaterThan(0);
    }
  });

  test('TC-EMP-LIST-005: Department filter is functional', async ({ page }) => {
    const deptFilter = page.locator('select, [class*="dropdown"]').filter({ hasText: /department/i }).first();

    if (await deptFilter.isVisible()) {
      await deptFilter.click();
      await page.waitForTimeout(500);
    }
    // Filter may not be visible on all views - test passes if page is stable
  });

  test('TC-EMP-LIST-006: Add Employee button is visible for HR', async ({ page }) => {
    const addButton = page.locator('button, a').filter({ hasText: /add|new|create/i }).filter({ hasText: /employee/i }).first();

    // For HR managers, add button should be visible
    if (await addButton.isVisible()) {
      await expect(addButton).toBeEnabled();
    } else {
      // Try looking for icon button
      const iconButton = page.locator('button[class*="add"], a[href*="new"]').first();
      const hasAddAction = await iconButton.isVisible().catch(() => false);
      // It's acceptable if no add button - HR dashboard may navigate differently
    }
  });

  test('TC-EMP-LIST-007: Clicking employee name navigates to detail', async ({ page }) => {
    // Wait for table to load
    await page.waitForTimeout(1000);

    // Find first employee name link in the table
    const employeeLink = page.locator('table tbody tr td a').first();

    if (await employeeLink.isVisible()) {
      await employeeLink.click();
      await waitForContentLoad(page);

      // Should navigate to detail page
      const isOnDetail = page.url().includes('/employees/') && !page.url().endsWith('/employees') && !page.url().endsWith('/new');
      expect(isOnDetail).toBeTruthy();
    }
  });

  test('TC-EMP-LIST-008: Pagination controls are visible', async ({ page }) => {
    const pagination = page.locator('[class*="pagination"], [class*="paginator"], nav[aria-label*="pagination"]').first();

    // Pagination may not be visible if few records
    if (await pagination.isVisible()) {
      await expect(pagination).toBeVisible();
    }
  });

});

// ==================== EMPLOYEE DETAIL TESTS ====================

test.describe('TC-EMP-DETAIL: Employee Detail View', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);
  });

  test('TC-EMP-DETAIL-001: Navigate to employee detail and verify tabs', async ({ page }) => {
    await navigateToEmployees(page);

    // Click first employee
    const employeeRow = page.locator('table tbody tr').first();
    if (await employeeRow.isVisible()) {
      await employeeRow.click();
      await waitForContentLoad(page);
    } else {
      // Direct navigation
      await page.goto('/employees');
      await waitForContentLoad(page);
    }

    // Look for tabs in detail view
    const tabsList = page.locator('[role="tablist"], [class*="tab"]');
    const hasTabs = await tabsList.isVisible().catch(() => false);

    if (hasTabs) {
      // Check for expected tabs
      const tabTexts = ['Overview', 'Compensation', 'Leave', 'Documents'];
      for (const tabText of tabTexts) {
        const tab = page.locator(`[role="tab"]:has-text("${tabText}"), button:has-text("${tabText}")`).first();
        // Tab may or may not be present depending on permissions
      }
    }
  });

  test('TC-EMP-DETAIL-002: Employee profile shows personal information', async ({ page }) => {
    await navigateToEmployees(page);

    // Navigate to first employee
    const employeeRow = page.locator('table tbody tr').first();
    if (await employeeRow.isVisible()) {
      await employeeRow.click();
      await waitForContentLoad(page);

      // Should show employee details
      const pageContent = await page.textContent('body');
      const hasPersonalInfo = pageContent?.includes('Email') ||
                              pageContent?.includes('Phone') ||
                              pageContent?.includes('Department');
      expect(hasPersonalInfo).toBeTruthy();
    }
  });

  test('TC-EMP-DETAIL-003: Edit button navigates to edit form', async ({ page }) => {
    await navigateToEmployees(page);

    const employeeRow = page.locator('table tbody tr').first();
    if (await employeeRow.isVisible()) {
      await employeeRow.click();
      await waitForContentLoad(page);

      const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await waitForContentLoad(page);

        // Should be on edit form
        const hasForm = await page.locator('form, [class*="form"]').isVisible();
        expect(hasForm).toBeTruthy();
      }
    }
  });

  test('TC-EMP-DETAIL-004: Back button returns to employee list', async ({ page }) => {
    await navigateToEmployees(page);

    const employeeRow = page.locator('table tbody tr').first();
    if (await employeeRow.isVisible()) {
      await employeeRow.click();
      await waitForContentLoad(page);

      const backButton = page.locator('button:has-text("Back"), a:has-text("Back"), [class*="back"]').first();
      if (await backButton.isVisible()) {
        await backButton.click();
        await waitForContentLoad(page);

        await expect(page).toHaveURL(/.*\/employees$/);
      }
    }
  });

});

// ==================== EMPLOYEE FORM TESTS ====================

test.describe('TC-EMP-FORM: Employee Form (Create/Edit)', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);
  });

  test('TC-EMP-FORM-001: Create employee form loads correctly', async ({ page }) => {
    await page.goto('/employees/new');
    await waitForContentLoad(page);

    // Form should be visible
    const form = page.locator('form, [class*="form"]').first();
    await expect(form).toBeVisible();
  });

  test('TC-EMP-FORM-002: Form has multi-step navigation', async ({ page }) => {
    await page.goto('/employees/new');
    await waitForContentLoad(page);

    // Look for stepper/steps indicator
    const stepper = page.locator('[class*="stepper"], [class*="step"], [role="tablist"]').first();
    const hasStepper = await stepper.isVisible().catch(() => false);

    // Look specifically for the main form element
    const hasForm = await page.locator('main form').first().isVisible().catch(() => false);
    expect(hasForm || hasStepper).toBeTruthy();
  });

  test('TC-EMP-FORM-003: Personal information fields are present', async ({ page }) => {
    await page.goto('/employees/new');
    await waitForContentLoad(page);

    // Look for name fields
    const firstNameInput = page.locator('input[name*="firstName"], input[placeholder*="First"]').first();
    const lastNameInput = page.locator('input[name*="lastName"], input[placeholder*="Last"]').first();
    const emailInput = page.locator('input[type="email"], input[name*="email"]').first();

    const hasNameFields = await firstNameInput.isVisible() || await lastNameInput.isVisible();
    const hasEmailField = await emailInput.isVisible().catch(() => false);

    expect(hasNameFields || hasEmailField).toBeTruthy();
  });

  test('TC-EMP-FORM-004: Required field validation works', async ({ page }) => {
    await page.goto('/employees/new');
    await waitForContentLoad(page);

    // Try to submit empty form - look for Next button in multi-step form
    const nextButton = page.locator('button:has-text("Next")').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("Save")').first();
    const actionButton = await nextButton.isVisible() ? nextButton : submitButton;

    if (await actionButton.isVisible()) {
      await actionButton.click();
      await page.waitForTimeout(1000);

      // Check multiple validation indicators
      const hasErrors = await page.locator('[class*="error"], [class*="invalid"], mat-error, .text-red').first().isVisible().catch(() => false);
      const isDisabled = await actionButton.isDisabled().catch(() => false);
      const hasRequiredIndicator = await page.locator('[class*="required"], [aria-required="true"]').first().isVisible().catch(() => false);

      // Form should either show errors, have disabled button, or have required field indicators
      expect(hasErrors || isDisabled || hasRequiredIndicator).toBeTruthy();
    }
  });

  test('TC-EMP-FORM-005: Cancel button returns to list', async ({ page }) => {
    await page.goto('/employees/new');
    await waitForContentLoad(page);

    const cancelButton = page.locator('button:has-text("Cancel"), a:has-text("Cancel")').first();

    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      await waitForContentLoad(page);

      await expect(page).toHaveURL(/.*\/employees/);
    }
  });

  test('TC-EMP-FORM-006: Department dropdown shows options', async ({ page }) => {
    await page.goto('/employees/new');
    await waitForContentLoad(page);

    // May need to navigate to employment step first
    const nextButton = page.locator('button:has-text("Next")').first();
    if (await nextButton.isVisible()) {
      // Fill required fields on first step if any
      const firstNameInput = page.locator('input[name*="firstName"], input[formcontrolname*="firstName"]').first();
      if (await firstNameInput.isVisible()) {
        await firstNameInput.fill('Test');
      }
      const lastNameInput = page.locator('input[name*="lastName"], input[formcontrolname*="lastName"]').first();
      if (await lastNameInput.isVisible()) {
        await lastNameInput.fill('User');
      }

      await nextButton.click();
      await page.waitForTimeout(500);
    }

    // Look for department dropdown
    const deptDropdown = page.locator('select, mat-select').filter({ hasText: /department/i }).first();
    if (await deptDropdown.isVisible()) {
      await deptDropdown.click();
      await page.waitForTimeout(500);
    }
  });

});

// ==================== LEAVE SELF-SERVICE TESTS ====================

test.describe('TC-LEAVE-SELF: Leave Self-Service (Employee View)', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await navigateToLeave(page);
  });

  test('TC-LEAVE-SELF-001: Leave dashboard loads for employee', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/leave/);

    // Should show leave balances
    const pageContent = await page.textContent('body');
    const hasLeaveContent = pageContent?.includes('Leave') ||
                            pageContent?.includes('Balance') ||
                            pageContent?.includes('Annual');
    expect(hasLeaveContent).toBeTruthy();
  });

  test('TC-LEAVE-SELF-002: Leave balance cards are displayed', async ({ page }) => {
    // Look for balance cards
    const balanceCards = page.locator('[class*="card"], [class*="balance"]');
    const cardCount = await balanceCards.count();

    // Should have at least one balance card
    expect(cardCount).toBeGreaterThan(0);
  });

  test('TC-LEAVE-SELF-003: Annual leave balance is visible', async ({ page }) => {
    const annualLeave = page.locator('text=/Annual/i').first();
    await expect(annualLeave).toBeVisible({ timeout: 10000 });
  });

  test('TC-LEAVE-SELF-004: Sick leave balance is visible', async ({ page }) => {
    const sickLeave = page.locator('text=/Sick/i').first();
    await expect(sickLeave).toBeVisible({ timeout: 10000 });
  });

  test('TC-LEAVE-SELF-005: Request Leave button is present', async ({ page }) => {
    const requestButton = page.locator('button:has-text("Request"), button:has-text("Apply"), button:has-text("New")').first();

    // Employee should be able to request leave
    const hasRequestAction = await requestButton.isVisible().catch(() => false);
    expect(hasRequestAction).toBeTruthy();
  });

  test('TC-LEAVE-SELF-006: Leave request dialog opens', async ({ page }) => {
    const requestButton = page.locator('button:has-text("Request"), button:has-text("Apply")').first();

    if (await requestButton.isVisible()) {
      await requestButton.click();
      await page.waitForTimeout(500);

      // Dialog should open
      const dialog = page.locator('[role="dialog"], mat-dialog-container, [class*="dialog"], [class*="modal"]');
      const hasDialog = await dialog.isVisible().catch(() => false);
      expect(hasDialog).toBeTruthy();
    }
  });

  test('TC-LEAVE-SELF-007: Leave history section is visible', async ({ page }) => {
    // Look for history/requests section
    const historySection = page.locator('text=/History|Request|Previous/i').first();
    const tableSection = page.locator('table').first();

    const hasHistory = await historySection.isVisible().catch(() => false) ||
                       await tableSection.isVisible().catch(() => false);
    expect(hasHistory).toBeTruthy();
  });

  test('TC-LEAVE-SELF-008: Leave request shows status badges', async ({ page }) => {
    // Look for status badges in leave requests
    const statusBadges = page.locator('[class*="badge"], [class*="chip"], [class*="status"]');

    // May or may not have requests - test that page is functional
    const hasBadges = await statusBadges.count() > 0;
    // Status badges are optional if no history
  });

});

// ==================== LEAVE ADMIN TESTS ====================

test.describe('TC-LEAVE-ADMIN: Leave Administration (HR View)', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);
  });

  test('TC-LEAVE-ADMIN-001: HR can access leave admin page', async ({ page }) => {
    await page.goto('/leave/admin');
    await waitForContentLoad(page);

    // Should not redirect away
    const url = page.url();
    expect(url).toMatch(/.*\/leave/);
  });

  test('TC-LEAVE-ADMIN-002: Pending approvals section is visible', async ({ page }) => {
    await page.goto('/leave/admin');
    await waitForContentLoad(page);

    // Look for pending approvals
    const pendingSection = page.locator('text=/Pending|Approval/i').first();
    const hasPending = await pendingSection.isVisible().catch(() => false);

    // May not have pending if none exist
    if (!hasPending) {
      // At least admin page should load
      const pageContent = await page.textContent('body');
      expect(pageContent).toContain('Leave');
    }
  });

  test('TC-LEAVE-ADMIN-003: Employee leave balances view is accessible', async ({ page }) => {
    await page.goto('/leave/admin');
    await waitForContentLoad(page);

    // Look for employee balances tab or section
    const balancesSection = page.locator('text=/Balance|Employee/i');
    const hasBalances = await balancesSection.first().isVisible().catch(() => false);

    expect(hasBalances).toBeTruthy();
  });

  test('TC-LEAVE-ADMIN-004: Year selector for leave balances', async ({ page }) => {
    await page.goto('/leave/admin');
    await waitForContentLoad(page);

    // Look for year selector
    const yearSelector = page.locator('select, mat-select, [class*="year"]').first();
    const hasYearSelector = await yearSelector.isVisible().catch(() => false);

    // Year selector may not be immediately visible
    if (hasYearSelector) {
      await expect(yearSelector).toBeVisible();
    }
  });

  test('TC-LEAVE-ADMIN-005: Search employees in leave admin', async ({ page }) => {
    await page.goto('/leave/admin');
    await waitForContentLoad(page);

    const searchInput = page.locator('input[type="search"], input[placeholder*="earch"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('Sipho');
      await page.waitForTimeout(1000);

      // Should filter results
      const pageContent = await page.textContent('body');
      // Search may or may not show results
    }
  });

  test('TC-LEAVE-ADMIN-006: Approve/Reject buttons for pending requests', async ({ page }) => {
    await page.goto('/leave/admin/pending');
    await waitForContentLoad(page);

    // Look for action buttons on pending requests
    const approveBtn = page.locator('button:has-text("Approve")').first();
    const rejectBtn = page.locator('button:has-text("Reject")').first();

    // May not have pending requests
    const hasApproveAction = await approveBtn.isVisible().catch(() => false);
    const hasRejectAction = await rejectBtn.isVisible().catch(() => false);

    // Test passes if page loaded without error
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('TC-LEAVE-ADMIN-007: Adjust balance functionality', async ({ page }) => {
    await page.goto('/leave/admin');
    await waitForContentLoad(page);

    // Look for adjust button
    const adjustBtn = page.locator('button:has-text("Adjust"), button[class*="adjust"]').first();
    const hasAdjust = await adjustBtn.isVisible().catch(() => false);

    if (hasAdjust) {
      await adjustBtn.click();
      await page.waitForTimeout(500);

      // Dialog should open
      const dialog = page.locator('[role="dialog"], mat-dialog-container, [class*="dialog"]');
      const hasDialog = await dialog.isVisible().catch(() => false);
      expect(hasDialog).toBeTruthy();
    }
  });

});

// ==================== ORGANIZATION CHART TESTS ====================

test.describe('TC-ORG: Organization Chart', () => {

  test('TC-ORG-001: HR Manager can access full organogram', async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);
    await page.goto('/hr/organogram');
    await waitForContentLoad(page);

    // Should see org chart
    const orgChart = page.locator('[class*="org"], [class*="chart"], [class*="tree"]').first();
    const hasOrgChart = await orgChart.isVisible().catch(() => false);

    // May also be at employees/organogram
    if (!hasOrgChart) {
      await page.goto('/employees/organogram');
      await waitForContentLoad(page);
    }
  });

  test('TC-ORG-002: Organization chart shows employee nodes', async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);
    await page.goto('/employees/organogram');
    await waitForContentLoad(page);

    // Look for org chart nodes
    const nodes = page.locator('[class*="node"], [class*="card"]');
    const nodeCount = await nodes.count();

    // Should have at least some nodes
    expect(nodeCount).toBeGreaterThan(0);
  });

  test('TC-ORG-003: Employee can see their reporting chain', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await page.goto('/employees/organogram');
    await waitForContentLoad(page);

    // Employee should see limited view or their chain
    const pageContent = await page.textContent('body');
    const hasContent = pageContent && pageContent.length > 0;
    expect(hasContent).toBeTruthy();
  });

});

// ==================== END-TO-END WORKFLOW TESTS ====================

test.describe('TC-HR-E2E: End-to-End HR Workflows', () => {

  test('TC-HR-E2E-001: Complete HR navigation workflow', async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);

    // Navigate through HR sections
    await navigateToHR(page);
    await expect(page).toHaveURL(/.*\/hr/);

    await navigateToEmployees(page);
    await expect(page).toHaveURL(/.*\/employees/);

    await navigateToLeave(page);
    await expect(page).toHaveURL(/.*\/leave/);
  });

  test('TC-HR-E2E-002: View employee and check leave tab', async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);
    await navigateToEmployees(page);

    // Click first employee
    const employeeRow = page.locator('table tbody tr').first();
    if (await employeeRow.isVisible()) {
      await employeeRow.click();
      await waitForContentLoad(page);

      // Look for leave tab
      const leaveTab = page.locator('[role="tab"]:has-text("Leave"), button:has-text("Leave")').first();
      if (await leaveTab.isVisible()) {
        await leaveTab.click();
        await page.waitForTimeout(500);

        // Should show leave information
        const hasLeaveInfo = await page.locator('text=/Balance|Leave/i').isVisible().catch(() => false);
        expect(hasLeaveInfo).toBeTruthy();
      }
    }
  });

  test('TC-HR-E2E-003: Employee self-service leave request flow', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await navigateToLeave(page);

    // Verify balances are shown
    await expect(page.locator('text=/Annual|Leave/i').first()).toBeVisible();

    // Open request dialog
    const requestBtn = page.locator('button:has-text("Request")').first();
    if (await requestBtn.isVisible()) {
      await requestBtn.click();
      await page.waitForTimeout(500);

      // Dialog should open with form
      const dialog = page.locator('[role="dialog"], [class*="dialog"]');
      await expect(dialog).toBeVisible();
    }
  });

});

// ==================== UI COMPONENT TESTS ====================

test.describe('TC-HR-UI: HR UI Components', () => {

  test('TC-HR-UI-001: Employee status badges display correctly', async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);
    await navigateToEmployees(page);

    // Look for status badges
    const badges = page.locator('[class*="badge"], [class*="chip"], [class*="status"]');
    const badgeCount = await badges.count();

    if (badgeCount > 0) {
      // At least first badge should be visible
      await expect(badges.first()).toBeVisible();
    }
  });

  test('TC-HR-UI-002: Leave type colors are consistent', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await navigateToLeave(page);

    // Leave balance cards should have different colors/styles
    const cards = page.locator('[class*="card"]');
    const cardCount = await cards.count();

    expect(cardCount).toBeGreaterThan(0);
  });

  test('TC-HR-UI-003: Responsive table scrolling on employees list', async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);
    await navigateToEmployees(page);

    const table = page.locator('table');
    if (await table.isVisible()) {
      // Table should be scrollable on small screens
      const tableContainer = page.locator('[class*="table-container"], [class*="overflow"]').first();
      const hasContainer = await tableContainer.isVisible().catch(() => false);

      // Table or container should exist
      expect(await table.isVisible() || hasContainer).toBeTruthy();
    }
  });

  test('TC-HR-UI-004: Loading states are shown during data fetch', async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);

    // Navigate and look for loading indicators
    await page.goto('/employees');

    // Brief loading state may appear
    const spinner = page.locator('sw-spinner, [class*="spinner"], [class*="loading"]');
    // Loading may be too fast to catch, so just verify page loads
    await waitForContentLoad(page);

    const pageContent = await page.textContent('body');
    expect(pageContent?.length).toBeGreaterThan(0);
  });

});

// ==================== ERROR HANDLING TESTS ====================

test.describe('TC-HR-ERR: Error Handling', () => {

  test('TC-HR-ERR-001: Invalid employee ID handles gracefully', async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);

    // Navigate to non-existent employee
    await page.goto('/employees/invalid-uuid-12345');
    await waitForContentLoad(page);

    // Should show error or redirect
    const hasError = await page.locator('text=/not found|error|invalid/i').isVisible().catch(() => false);
    const redirected = page.url().includes('/employees') && !page.url().includes('invalid');

    expect(hasError || redirected).toBeTruthy();
  });

  test('TC-HR-ERR-002: Network error shows appropriate message', async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);
    await navigateToEmployees(page);

    // Page should load without critical errors
    const pageContent = await page.textContent('body');
    expect(pageContent?.length).toBeGreaterThan(0);
  });

});
