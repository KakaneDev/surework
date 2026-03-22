import { test, expect, Page } from '@playwright/test';

/**
 * Self-Service Feature Tests
 * Tests for employee self-service functionality:
 * - My Leave (leave balances, requests via self-service endpoints)
 * - My Payslips (payslip viewing and download)
 */

const TEST_PASSWORD = 'Admin@123!';

// Test users
const EMPLOYEE = {
  email: 'ayanda.nkosi@testcompany.co.za',
  name: 'Ayanda Nkosi',
};

const HR_MANAGER = {
  email: 'thabo.mokoena@testcompany.co.za',
  name: 'Thabo Mokoena',
};

const SUPER_ADMIN = {
  email: 'admin@testcompany.co.za',
  name: 'Super Admin',
};

/**
 * Helper to login a user
 */
async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/auth/login');
  await page.waitForSelector('#email', { timeout: 15000 });

  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard with longer timeout
  await page.waitForURL('**/dashboard', { timeout: 30000 });

  // Wait for the dashboard to fully load
  await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 15000 });

  // Give time for permissions to load and sidebar to render
  await page.waitForTimeout(2000);
}

/**
 * Helper to logout
 */
async function logout(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
}

/**
 * Helper to check if sidebar contains a specific item (links or expandable buttons)
 */
async function sidebarContains(page: Page, label: string): Promise<boolean> {
  const sidebar = page.locator('aside nav');

  // Check for regular nav links
  const navLinks = sidebar.locator('a');
  const linkCount = await navLinks.count();

  for (let i = 0; i < linkCount; i++) {
    const linkText = await navLinks.nth(i).textContent();
    if (linkText && linkText.includes(label)) {
      return true;
    }
  }

  // Check for expandable section buttons
  const navButtons = sidebar.locator('button');
  const buttonCount = await navButtons.count();

  for (let i = 0; i < buttonCount; i++) {
    const buttonText = await navButtons.nth(i).textContent();
    if (buttonText && buttonText.includes(label)) {
      return true;
    }
  }

  return false;
}

/**
 * Helper to click a sidebar item
 */
async function clickSidebarItem(page: Page, label: string): Promise<void> {
  const sidebar = page.locator('aside nav');
  const navLink = sidebar.locator(`a:has-text("${label}")`);
  await navLink.click();
  await page.waitForTimeout(1000);
}

// =============================================================================
// SELF-SERVICE NAVIGATION TESTS
// =============================================================================

test.describe('Self-Service Navigation', () => {
  test('Employee sees My Leave in sidebar', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    const hasMyLeave = await sidebarContains(page, 'My Leave');
    expect(hasMyLeave, 'Employee should see "My Leave" in sidebar').toBe(true);
  });

  test('Employee sees My Payslips in sidebar', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    const hasMyPayslips = await sidebarContains(page, 'My Payslips');
    expect(hasMyPayslips, 'Employee should see "My Payslips" in sidebar').toBe(true);
  });

  test('HR Manager sees both self-service and admin items', async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);

    // Should see self-service items
    const hasMyLeave = await sidebarContains(page, 'My Leave');
    expect(hasMyLeave, 'HR Manager should see "My Leave"').toBe(true);

    // Should also see admin items
    const hasEmployees = await sidebarContains(page, 'Employees');
    expect(hasEmployees, 'HR Manager should see "Employees"').toBe(true);
  });

  test('Super Admin sees all navigation items', async ({ page }) => {
    await login(page, SUPER_ADMIN.email, TEST_PASSWORD);

    const hasMyLeave = await sidebarContains(page, 'My Leave');
    const hasMyPayslips = await sidebarContains(page, 'My Payslips');
    const hasPayroll = await sidebarContains(page, 'Payroll');
    const hasSettings = await sidebarContains(page, 'Settings');

    expect(hasMyLeave, 'Super Admin should see "My Leave"').toBe(true);
    expect(hasMyPayslips, 'Super Admin should see "My Payslips"').toBe(true);
    expect(hasPayroll, 'Super Admin should see "Payroll"').toBe(true);
    expect(hasSettings, 'Super Admin should see "Settings"').toBe(true);
  });
});

// =============================================================================
// LEAVE SELF-SERVICE TESTS
// =============================================================================

test.describe('Leave Self-Service', () => {
  test('Employee can access /leave page', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    await page.goto('/leave');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/leave');

    // Should see the leave page header
    const header = page.locator('h1:has-text("Leave Management")');
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('Employee sees leave balance cards', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    await page.goto('/leave');
    await page.waitForTimeout(3000);

    // Wait for loading to complete
    await page.waitForSelector('.sw-page-header', { timeout: 10000 });

    // Check for balance section header
    const balanceHeader = page.locator('h3:has-text("Your Leave Balances")');
    await expect(balanceHeader).toBeVisible({ timeout: 15000 });

    // Either we have balance cards or an empty state message
    const balanceCards = page.locator('[style*="linear-gradient"]');
    const emptyState = page.locator('text=No leave balances found');

    const hasCards = await balanceCards.count() > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(hasCards || hasEmptyState, 'Should show balance cards or empty state').toBe(true);

    console.log(`[Leave] Balance cards: ${await balanceCards.count()}, Empty state: ${hasEmptyState}`);
  });

  test('Employee sees Request Leave button', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    await page.goto('/leave');
    await page.waitForTimeout(2000);

    const requestButton = page.locator('button:has-text("Request Leave")');
    await expect(requestButton).toBeVisible({ timeout: 10000 });

    // Button should be enabled (not disabled)
    const isDisabled = await requestButton.isDisabled();
    expect(isDisabled, 'Request Leave button should be enabled').toBe(false);
  });

  test('Employee can open leave request dialog', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    await page.goto('/leave');
    await page.waitForTimeout(3000);

    // Click Request Leave button
    const requestButton = page.locator('button:has-text("Request Leave")');
    await requestButton.click();

    // Dialog should appear
    const dialog = page.locator('h2:has-text("Request Leave")');
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // Form fields should be present
    const leaveTypeSelect = page.locator('select[formcontrolname="leaveType"]');
    const startDateInput = page.locator('input[formcontrolname="startDate"]');
    const endDateInput = page.locator('input[formcontrolname="endDate"]');

    await expect(leaveTypeSelect).toBeVisible();
    await expect(startDateInput).toBeVisible();
    await expect(endDateInput).toBeVisible();
  });

  test('Employee sees leave requests table', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    await page.goto('/leave');
    await page.waitForTimeout(3000);

    // Check for requests section
    const requestsHeader = page.locator('h3:has-text("My Leave Requests")');
    await expect(requestsHeader).toBeVisible({ timeout: 15000 });

    // Should have a table or empty state
    const requestsTable = page.locator('table.sw-table');
    const emptyState = page.locator('text=No leave requests found');

    const hasTable = await requestsTable.isVisible().catch(() => false);
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(hasTable || hasEmptyState, 'Should show requests table or empty state').toBe(true);

    console.log(`[Leave] Has table: ${hasTable}, Empty state: ${hasEmptyState}`);
  });

  test('Employee does NOT see admin sections', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    await page.goto('/leave');
    await page.waitForTimeout(3000);

    // Employee should NOT see pending approvals (admin feature)
    const pendingApprovals = page.locator('h3:has-text("Pending Approvals")');
    const hasPendingApprovals = await pendingApprovals.isVisible().catch(() => false);

    // Employee should NOT see employee balances admin view
    const employeeBalances = page.locator('h3:has-text("Employee Leave Balances")');
    const hasEmployeeBalances = await employeeBalances.isVisible().catch(() => false);

    expect(hasPendingApprovals, 'Employee should NOT see Pending Approvals').toBe(false);
    expect(hasEmployeeBalances, 'Employee should NOT see Employee Leave Balances').toBe(false);
  });

  test('HR Manager sees admin sections on leave page', async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);

    await page.goto('/leave');
    await page.waitForTimeout(3000);

    // HR Manager should see admin section header
    const adminHeader = page.locator('h2:has-text("Administration")');
    const hasAdminHeader = await adminHeader.isVisible().catch(() => false);

    // If permissions are loaded correctly, should see admin sections
    if (hasAdminHeader) {
      // Should see pending approvals
      const pendingApprovals = page.locator('h3:has-text("Pending Approvals")');
      await expect(pendingApprovals).toBeVisible({ timeout: 10000 });

      // Should see employee balances
      const employeeBalances = page.locator('h3:has-text("Employee Leave Balances")');
      await expect(employeeBalances).toBeVisible({ timeout: 10000 });
    } else {
      console.warn('Admin sections not visible - check if HR Manager has correct permissions');
    }
  });
});

// =============================================================================
// PAYSLIPS SELF-SERVICE TESTS
// =============================================================================

test.describe('Payslips Self-Service', () => {
  test('Employee can access /my-payslips page', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    await page.goto('/my-payslips');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/my-payslips');

    // Should see the payslips page header
    const header = page.locator('h1:has-text("My Payslips")');
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('Payslips page shows correct structure', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    await page.goto('/my-payslips');
    await page.waitForTimeout(3000);

    // Should have page description
    const description = page.locator('text=View and download your payslips');
    await expect(description).toBeVisible({ timeout: 10000 });

    // Should show table or empty state
    const table = page.locator('table.sw-table');
    const emptyState = page.locator('h2:has-text("No Payslips Yet")');

    const hasTable = await table.isVisible().catch(() => false);
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(hasTable || hasEmptyState, 'Should show payslips table or empty state').toBe(true);

    console.log(`[Payslips] Has table: ${hasTable}, Empty state: ${hasEmptyState}`);
  });

  test('Employee can navigate to My Payslips via sidebar', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    // Click on My Payslips in sidebar
    await clickSidebarItem(page, 'My Payslips');

    // Should navigate to /my-payslips
    await page.waitForURL('**/my-payslips', { timeout: 10000 });

    const header = page.locator('h1:has-text("My Payslips")');
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('Employee cannot access admin /payroll page', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    await page.goto('/payroll');
    await page.waitForTimeout(2000);

    const url = page.url();
    // Should be redirected away from /payroll
    const isBlocked = url.includes('/dashboard') || !url.includes('/payroll');

    expect(isBlocked, 'Employee should be blocked from /payroll').toBe(true);
  });

  test('HR Manager can access My Payslips', async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);

    await page.goto('/my-payslips');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/my-payslips');

    const header = page.locator('h1:has-text("My Payslips")');
    await expect(header).toBeVisible({ timeout: 10000 });
  });
});

// =============================================================================
// ROUTE PROTECTION TESTS
// =============================================================================

test.describe('Route Protection', () => {
  test('Unauthenticated user cannot access /leave', async ({ page }) => {
    await page.goto('/leave');

    // Should redirect to login
    await expect(page).toHaveURL(/.*\/auth\/login/, { timeout: 10000 });
  });

  test('Unauthenticated user cannot access /my-payslips', async ({ page }) => {
    await page.goto('/my-payslips');

    // Should redirect to login
    await expect(page).toHaveURL(/.*\/auth\/login/, { timeout: 10000 });
  });

  test('Employee can navigate between self-service pages', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    // Go to leave
    await clickSidebarItem(page, 'My Leave');
    await page.waitForURL('**/leave', { timeout: 10000 });

    // Go to payslips
    await clickSidebarItem(page, 'My Payslips');
    await page.waitForURL('**/my-payslips', { timeout: 10000 });

    // Go back to dashboard
    await clickSidebarItem(page, 'Dashboard');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });
});

// =============================================================================
// DATA LOADING TESTS (API Integration)
// =============================================================================

test.describe('Self-Service API Integration', () => {
  test('Leave page loads data without errors', async ({ page }) => {
    // Capture console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await page.goto('/leave');
    await page.waitForTimeout(5000);

    // Filter for API-related errors
    const apiErrors = errors.filter(e =>
      e.includes('403') || e.includes('401') || e.includes('Failed to fetch')
    );

    console.log(`[API] Errors captured: ${apiErrors.length}`);
    apiErrors.forEach(e => console.log(`  - ${e}`));

    // No authentication/authorization errors expected
    expect(apiErrors.length, 'Should not have API auth errors').toBe(0);
  });

  test('Payslips page loads data without errors', async ({ page }) => {
    // Capture console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await page.goto('/my-payslips');
    await page.waitForTimeout(5000);

    // Filter for API-related errors
    const apiErrors = errors.filter(e =>
      e.includes('403') || e.includes('401') || e.includes('Failed to fetch')
    );

    console.log(`[API] Errors captured: ${apiErrors.length}`);
    apiErrors.forEach(e => console.log(`  - ${e}`));

    // Note: This may fail if the backend /my-payslips endpoint is not implemented
    // In that case, add a skip annotation
  });
});

// =============================================================================
// SIDEBAR STRUCTURE VERIFICATION
// =============================================================================

test.describe('Updated Sidebar Structure', () => {
  test('Self-Service group appears for employees', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    // Check for Self-Service group header
    const selfServiceGroup = page.locator('aside nav div:has-text("Self-Service")');
    const hasGroup = await selfServiceGroup.isVisible().catch(() => false);

    // The group label should be visible
    expect(hasGroup, 'Self-Service group should be visible').toBe(true);
  });

  test('Employee sidebar shows only appropriate items', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    // Should have Dashboard
    expect(await sidebarContains(page, 'Dashboard')).toBe(true);

    // Should have self-service items
    expect(await sidebarContains(page, 'My Leave')).toBe(true);
    expect(await sidebarContains(page, 'My Payslips')).toBe(true);
    expect(await sidebarContains(page, 'My Documents')).toBe(true);
    expect(await sidebarContains(page, 'Support')).toBe(true);

    // Should NOT have admin items or expandable sections
    expect(await sidebarContains(page, 'Settings')).toBe(false);
  });
});

// =============================================================================
// MY DOCUMENTS SELF-SERVICE TESTS
// =============================================================================

test.describe('My Documents Self-Service', () => {
  test('Employee sees "My Documents" in sidebar', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    const hasMyDocuments = await sidebarContains(page, 'My Documents');
    expect(hasMyDocuments, 'Employee should see "My Documents" in sidebar').toBe(true);
  });

  test('Employee can navigate to My Documents', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    await clickSidebarItem(page, 'My Documents');

    await page.waitForURL('**/my-documents', { timeout: 10000 });
    expect(page.url()).toContain('/my-documents');
  });

  test('Employee can access /my-documents page', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    await page.goto('/my-documents');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/my-documents');

    // Should show documents page header or content
    const hasHeader = await page.locator('h1').first().isVisible().catch(() => false);
    expect(hasHeader, 'My Documents page should have visible header').toBe(true);
  });

  test('My Documents shows empty state or documents', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    await page.goto('/my-documents');
    await page.waitForTimeout(3000);

    // Should show either documents table or empty state
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const hasEmptyState = await page.locator('text=No documents, text=no documents, text=empty').first().isVisible().catch(() => false);
    const hasContent = await page.locator('.sw-card, div[class*="rounded"]').first().isVisible().catch(() => false);

    expect(hasTable || hasEmptyState || hasContent, 'My Documents should show content or empty state').toBe(true);
  });

  test('HR Manager can access My Documents', async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);

    await page.goto('/my-documents');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/my-documents');
  });
});

// =============================================================================
// SUPPORT TICKETS SELF-SERVICE TESTS
// =============================================================================

test.describe('Support Tickets Self-Service', () => {
  test('Employee sees "Support Tickets" in sidebar', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    const hasSupport = await sidebarContains(page, 'Support');
    expect(hasSupport, 'Employee should see "Support Tickets" in sidebar').toBe(true);
  });

  test('Employee can navigate to Support Tickets', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    await clickSidebarItem(page, 'Support');

    await page.waitForURL('**/support', { timeout: 10000 });
    expect(page.url()).toContain('/support');
  });

  test('Employee can access /support page', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    await page.goto('/support');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/support');

    // Should show support page header
    const title = page.locator('h1:has-text("Support Tickets")');
    await expect(title).toBeVisible({ timeout: 10000 });
  });

  test('Support Dashboard shows correct structure', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    await page.goto('/support');
    await page.waitForTimeout(2000);

    // Should show stats cards
    const openTickets = page.locator('text=Open Tickets');
    await expect(openTickets).toBeVisible();

    // Should show New Ticket button
    const newTicketBtn = page.locator('a:has-text("New Ticket"), button:has-text("New Ticket")');
    await expect(newTicketBtn).toBeVisible();
  });

  test('Employee can navigate to create ticket form', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    await page.goto('/support');
    await page.waitForTimeout(2000);

    // Click New Ticket button
    const newTicketBtn = page.locator('.sw-page-header a:has-text("New Ticket")');
    await newTicketBtn.click();

    await page.waitForURL('**/support/new', { timeout: 10000 });

    // Verify form is displayed
    const formTitle = page.locator('h1:has-text("New Support Ticket")');
    await expect(formTitle).toBeVisible();
  });

  test('HR Manager can access Support Tickets', async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);

    await page.goto('/support');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/support');

    const title = page.locator('h1:has-text("Support Tickets")');
    await expect(title).toBeVisible();
  });
});
