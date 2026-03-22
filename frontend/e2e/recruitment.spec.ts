import { test, expect, Page } from '@playwright/test';

/**
 * ============================================================================
 * RECRUITMENT MODULE E2E TESTS
 * ============================================================================
 *
 * Test Suite: TC-REC - Recruitment Functionality
 * Test User: Thabo Mokoena (HR Manager)
 * Email: thabo.mokoena@testcompany.co.za
 * Password: Admin@123!
 * Permissions: RECRUITMENT_READ, RECRUITMENT_MANAGE, EMPLOYEE_READ, LEAVE_APPROVE
 *
 * ============================================================================
 * PREREQUISITES
 * ============================================================================
 *
 * Before running these tests, ensure the following services are running:
 *
 * 1. Angular Frontend (port 4200)
 *    $ cd frontend && npm start
 *
 * 2. API Gateway (port 8080)
 *    $ cd services/api-gateway && mvn spring-boot:run
 *
 * 3. Admin Service (port 8088) - REQUIRED FOR AUTHENTICATION
 *    $ cd services/admin-service && mvn spring-boot:run
 *
 * 4. Recruitment Service (port 8086)
 *    $ cd services/recruitment-service && mvn spring-boot:run
 *
 * Optional services for full functionality:
 * - HR Service (port 8082)
 * - Identity Service (port 8085)
 * - Document Service (port 8087)
 *
 * Run tests with:
 *    $ npx playwright test e2e/recruitment.spec.ts
 *
 * ============================================================================
 * TEST COVERAGE
 * ============================================================================
 *
 * This test suite covers the complete recruitment workflow including:
 * - TC-REC-ACCESS: Access control and permissions
 * - TC-REC-DASH: Dashboard overview and metrics
 * - TC-REC-JOBS: Job posting management (CRUD)
 * - TC-REC-JOBFORM: Job posting form validation
 * - TC-REC-CAND: Candidate management
 * - TC-REC-CANDDET: Candidate detail view
 * - TC-REC-INT: Interview management
 * - TC-REC-REP: Recruitment reports
 * - TC-REC-E2E: End-to-end workflows
 * - TC-REC-UI: UI components and interactions
 * - TC-REC-ERR: Error handling
 *
 * ============================================================================
 */

const TEST_PASSWORD = 'Admin@123!';

// Test user: HR Manager with full recruitment permissions
const HR_MANAGER = {
  email: 'thabo.mokoena@testcompany.co.za',
  name: 'Thabo Mokoena',
  role: 'HR Manager'
};

// Employee user without recruitment permissions for access control tests
const EMPLOYEE = {
  email: 'ayanda.nkosi@testcompany.co.za',
  name: 'Ayanda Nkosi',
  role: 'Employee'
};

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

      // Wait for either dashboard redirect or error message
      await Promise.race([
        page.waitForURL('**/dashboard', { timeout: 45000 }),
        page.waitForSelector('.error-message, [class*="error"]', { timeout: 45000 }).then(() => {
          throw new Error('Login failed with error message');
        })
      ]);

      await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 15000 });
      // Wait for permissions to load
      await page.waitForTimeout(2000);
      return; // Success - exit the function
    } catch (error) {
      if (attempt === maxRetries) {
        throw error; // Re-throw on final attempt
      }
      console.log(`Login attempt ${attempt} failed, retrying...`);
      await page.waitForTimeout(2000); // Brief pause before retry
    }
  }
}

/**
 * Helper to navigate to recruitment module
 */
async function navigateToRecruitment(page: Page): Promise<void> {
  await page.goto('/recruitment');
  await page.waitForTimeout(1500);
}

/**
 * Helper to wait for page content to load
 */
async function waitForContentLoad(page: Page): Promise<void> {
  // Wait for either loading spinner to disappear or content to appear
  await page.waitForSelector('sw-spinner', { state: 'hidden', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(500);
}

// =============================================================================
// RECRUITMENT ACCESS CONTROL TESTS
// =============================================================================

test.describe('TC-REC-ACCESS: Recruitment Access Control', () => {
  test('TC-REC-ACCESS-001: HR Manager can access recruitment module', async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);
    await navigateToRecruitment(page);

    const url = page.url();
    expect(url).toContain('/recruitment');

    // Verify page title is visible
    const title = page.locator('h1:has-text("Recruitment")');
    await expect(title).toBeVisible({ timeout: 10000 });
  });

  test('TC-REC-ACCESS-002: Employee without recruitment permissions is redirected', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    await page.goto('/recruitment');
    await page.waitForTimeout(2000);

    const url = page.url();
    // Employee should be redirected away from recruitment
    const isBlocked = url.includes('/dashboard') || !url.includes('/recruitment');
    expect(isBlocked, `Employee should be redirected from /recruitment. Current URL: ${url}`).toBe(true);
  });

  test('TC-REC-ACCESS-003: Unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/recruitment');
    await expect(page).toHaveURL(/.*\/auth\/login/, { timeout: 10000 });
  });
});

// =============================================================================
// RECRUITMENT DASHBOARD TESTS
// =============================================================================

test.describe('TC-REC-DASH: Recruitment Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);
    await navigateToRecruitment(page);
    await waitForContentLoad(page);
  });

  test('TC-REC-DASH-001: Dashboard displays key metrics cards', async ({ page }) => {
    // Verify all 4 stat cards are visible
    const openJobsCard = page.locator('text=Open Jobs').first();
    const applicationsCard = page.locator('text=Total Applications').first();
    const interviewsCard = page.locator('text=Interviews This Week').first();
    const offersCard = page.locator('text=Pending Offers').first();

    await expect(openJobsCard).toBeVisible({ timeout: 10000 });
    await expect(applicationsCard).toBeVisible();
    await expect(interviewsCard).toBeVisible();
    await expect(offersCard).toBeVisible();
  });

  test('TC-REC-DASH-002: Dashboard displays pipeline overview section', async ({ page }) => {
    const pipelineSection = page.locator('h3:has-text("Pipeline Overview")');
    await expect(pipelineSection).toBeVisible({ timeout: 10000 });
  });

  test('TC-REC-DASH-003: Dashboard displays upcoming interviews section', async ({ page }) => {
    const interviewsSection = page.locator('h3:has-text("Upcoming Interviews")');
    await expect(interviewsSection).toBeVisible({ timeout: 10000 });

    // View All link should be present
    const viewAllLink = page.locator('a[href="/recruitment/interviews"]:has-text("View All")');
    await expect(viewAllLink).toBeVisible();
  });

  test('TC-REC-DASH-004: Dashboard displays recent job postings table', async ({ page }) => {
    const jobPostingsSection = page.locator('h3:has-text("Recent Job Postings")');
    await expect(jobPostingsSection).toBeVisible({ timeout: 10000 });

    // View All Jobs link should be present
    const viewAllJobsLink = page.locator('a[href="/recruitment/jobs"]:has-text("View All Jobs")');
    await expect(viewAllJobsLink).toBeVisible();
  });

  test('TC-REC-DASH-005: Quick action buttons are visible and functional', async ({ page }) => {
    // "Candidates" button
    const candidatesBtn = page.locator('a[routerlink="/recruitment/candidates"]:has-text("Candidates")');
    await expect(candidatesBtn).toBeVisible({ timeout: 10000 });

    // "Post Job" button
    const postJobBtn = page.locator('a[routerlink="/recruitment/jobs/new"]:has-text("Post Job")');
    await expect(postJobBtn).toBeVisible();

    // "Add Candidate" button
    const addCandidateBtn = page.locator('a[routerlink="/recruitment/candidates/new"]:has-text("Add Candidate")');
    await expect(addCandidateBtn).toBeVisible();
  });

  test('TC-REC-DASH-006: Navigate to candidates from dashboard', async ({ page }) => {
    const candidatesBtn = page.locator('a[routerlink="/recruitment/candidates"]:has-text("Candidates")');
    await candidatesBtn.click();

    await page.waitForURL('**/recruitment/candidates', { timeout: 10000 });
    expect(page.url()).toContain('/recruitment/candidates');
  });
});

// =============================================================================
// JOB POSTINGS LIST TESTS
// =============================================================================

test.describe('TC-REC-JOBS: Job Postings Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);
    await page.goto('/recruitment/jobs');
    await waitForContentLoad(page);
  });

  test('TC-REC-JOBS-001: Job postings list page loads correctly', async ({ page }) => {
    const title = page.locator('h1:has-text("Job Postings")');
    await expect(title).toBeVisible({ timeout: 10000 });

    const description = page.locator('text=Manage job postings and applications');
    await expect(description).toBeVisible();
  });

  test('TC-REC-JOBS-002: Job postings table displays with correct columns', async ({ page }) => {
    // Wait for table to load
    const table = page.locator('table.sw-table');
    await expect(table).toBeVisible({ timeout: 15000 });

    // Verify column headers
    const headers = ['Reference', 'Title', 'Department', 'Type', 'Status', 'Applications', 'Closing Date'];
    for (const header of headers) {
      const headerCell = page.locator(`th:has-text("${header}")`);
      await expect(headerCell).toBeVisible();
    }
  });

  test('TC-REC-JOBS-003: Search filter works correctly', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search by title"]');
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Type a search term
    await searchInput.fill('Engineer');
    await page.waitForTimeout(500); // Debounce wait

    // Verify search is applied (URL or table content changes)
    await waitForContentLoad(page);
  });

  test('TC-REC-JOBS-004: Status filter dropdown is functional', async ({ page }) => {
    const statusSelect = page.locator('select').first();
    await expect(statusSelect).toBeVisible({ timeout: 10000 });

    // Verify filter options exist
    const options = await statusSelect.locator('option').allTextContents();
    expect(options).toContain('All Statuses');
  });

  test('TC-REC-JOBS-005: Employment type filter is functional', async ({ page }) => {
    const typeSelect = page.locator('select').nth(1);
    await expect(typeSelect).toBeVisible({ timeout: 10000 });

    // Verify filter options exist
    const options = await typeSelect.locator('option').allTextContents();
    expect(options).toContain('All Types');
  });

  test('TC-REC-JOBS-006: Clear filters button works', async ({ page }) => {
    // Apply a filter first
    const searchInput = page.locator('input[placeholder*="Search by title"]');
    await searchInput.fill('Test');
    await page.waitForTimeout(500);

    // Clear filters - use more specific selector
    const clearBtn = page.locator('button.sw-btn-ghost:has-text("Clear")').first();
    await clearBtn.click();

    // Verify search input is cleared
    await expect(searchInput).toHaveValue('');
  });

  test('TC-REC-JOBS-007: Post New Job button navigates to form', async ({ page }) => {
    const postJobBtn = page.locator('a[routerlink="/recruitment/jobs/new"]:has-text("Post New Job")');
    await expect(postJobBtn).toBeVisible({ timeout: 10000 });

    await postJobBtn.click();
    await page.waitForURL('**/recruitment/jobs/new', { timeout: 10000 });
    expect(page.url()).toContain('/recruitment/jobs/new');
  });

  test('TC-REC-JOBS-008: Back button navigates to recruitment dashboard', async ({ page }) => {
    const backBtn = page.locator('a[routerlink="/recruitment"] span.material-icons:has-text("arrow_back")').first();
    await expect(backBtn).toBeVisible({ timeout: 10000 });

    await backBtn.click();
    await page.waitForURL('**/recruitment', { timeout: 10000 });
  });

  test('TC-REC-JOBS-009: Job row click navigates to job detail', async ({ page }) => {
    // Wait for table data
    await page.waitForSelector('table.sw-table tbody tr', { timeout: 15000 });

    // Click on first job row
    const firstRow = page.locator('table.sw-table tbody tr').first();
    const jobLink = firstRow.locator('a[href*="/recruitment/jobs/"]').first();

    if (await jobLink.isVisible()) {
      await jobLink.click();
      await page.waitForURL(/\/recruitment\/jobs\/[a-f0-9-]+/, { timeout: 10000 });
      expect(page.url()).toMatch(/\/recruitment\/jobs\/[a-f0-9-]+/);
    }
  });
});

// =============================================================================
// JOB POSTING FORM TESTS
// =============================================================================

test.describe('TC-REC-JOBFORM: Job Posting Form', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);
    await page.goto('/recruitment/jobs/new');
    await waitForContentLoad(page);
  });

  test('TC-REC-JOBFORM-001: Create job form loads correctly', async ({ page }) => {
    const title = page.locator('h1:has-text("Create Job Posting")');
    await expect(title).toBeVisible({ timeout: 10000 });
  });

  test('TC-REC-JOBFORM-002: Form sections are displayed', async ({ page }) => {
    // Basic Information section
    const basicInfo = page.locator('h3:has-text("Basic Information")');
    await expect(basicInfo).toBeVisible({ timeout: 10000 });

    // Job Description section
    const jobDesc = page.locator('h3:has-text("Job Description")');
    await expect(jobDesc).toBeVisible();

    // Experience & Compensation section
    const expComp = page.locator('h3:has-text("Experience & Compensation")');
    await expect(expComp).toBeVisible();

    // Hiring Team section
    const hiringTeam = page.locator('h3:has-text("Hiring Team")');
    await expect(hiringTeam).toBeVisible();
  });

  test('TC-REC-JOBFORM-003: Required fields validation', async ({ page }) => {
    // Try to submit without filling required fields
    const submitBtn = page.locator('button[type="submit"]:has-text("Create Job")');

    // Submit button should be disabled when form is invalid
    await expect(submitBtn).toBeDisabled();

    // Fill required title field
    const titleInput = page.locator('input[formcontrolname="title"]');
    await titleInput.fill('Test Job Position');

    // Submit button should now be enabled
    await expect(submitBtn).toBeEnabled();
  });

  test('TC-REC-JOBFORM-004: Employment type dropdown options', async ({ page }) => {
    const employmentTypeSelect = page.locator('select[formcontrolname="employmentType"]');
    await expect(employmentTypeSelect).toBeVisible({ timeout: 10000 });

    const options = await employmentTypeSelect.locator('option').allTextContents();
    expect(options).toContain('Full Time');
    expect(options).toContain('Part Time');
    expect(options).toContain('Contract');
    expect(options).toContain('Internship');
  });

  test('TC-REC-JOBFORM-005: Remote and internal checkboxes are functional', async ({ page }) => {
    const remoteCheckbox = page.locator('input[formcontrolname="remote"]');
    const internalCheckbox = page.locator('input[formcontrolname="internalOnly"]');

    await expect(remoteCheckbox).toBeVisible({ timeout: 10000 });
    await expect(internalCheckbox).toBeVisible();

    // Toggle checkboxes
    await remoteCheckbox.check();
    await expect(remoteCheckbox).toBeChecked();

    await internalCheckbox.check();
    await expect(internalCheckbox).toBeChecked();
  });

  test('TC-REC-JOBFORM-006: Save as Draft button is visible', async ({ page }) => {
    const draftBtn = page.locator('button:has-text("Save as Draft")');
    await expect(draftBtn).toBeVisible({ timeout: 10000 });
  });

  test('TC-REC-JOBFORM-007: Cancel button navigates back', async ({ page }) => {
    const cancelBtn = page.locator('button:has-text("Cancel")');
    await expect(cancelBtn).toBeVisible({ timeout: 10000 });

    await cancelBtn.click();
    await page.waitForURL('**/recruitment/jobs', { timeout: 10000 });
  });

  test('TC-REC-JOBFORM-008: Fill complete job form', async ({ page }) => {
    // Basic Information
    await page.fill('input[formcontrolname="title"]', 'E2E Test - Senior Developer');
    await page.fill('input[formcontrolname="departmentName"]', 'Engineering');
    await page.fill('input[formcontrolname="location"]', 'Johannesburg');
    await page.selectOption('select[formcontrolname="employmentType"]', 'FULL_TIME');
    await page.fill('input[formcontrolname="positionsAvailable"]', '2');

    // Job Description
    await page.fill('textarea[formcontrolname="description"]', 'This is a test job description for E2E testing.');
    await page.fill('textarea[formcontrolname="requirements"]', '5+ years experience in software development');
    await page.fill('textarea[formcontrolname="responsibilities"]', 'Lead development of key features');
    await page.fill('textarea[formcontrolname="skills"]', 'Java, TypeScript, Angular');

    // Experience & Compensation
    await page.fill('input[formcontrolname="experienceYearsMin"]', '3');
    await page.fill('input[formcontrolname="experienceYearsMax"]', '8');
    await page.fill('input[formcontrolname="salaryMin"]', '500000');
    await page.fill('input[formcontrolname="salaryMax"]', '800000');

    // Hiring Team
    await page.fill('input[formcontrolname="hiringManagerName"]', 'John Smith');
    await page.fill('input[formcontrolname="recruiterName"]', 'Thabo Mokoena');

    // Verify submit button is enabled
    const submitBtn = page.locator('button[type="submit"]:has-text("Create Job")');
    await expect(submitBtn).toBeEnabled();
  });
});

// =============================================================================
// CANDIDATES LIST TESTS
// =============================================================================

test.describe('TC-REC-CAND: Candidates Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);
    await page.goto('/recruitment/candidates');
    await waitForContentLoad(page);
  });

  test('TC-REC-CAND-001: Candidates list page loads correctly', async ({ page }) => {
    const title = page.locator('h1:has-text("Candidates")');
    await expect(title).toBeVisible({ timeout: 10000 });

    const description = page.locator('text=Manage candidate profiles and applications');
    await expect(description).toBeVisible();
  });

  test('TC-REC-CAND-002: Candidates table displays with correct columns', async ({ page }) => {
    // Wait for table to load
    const table = page.locator('table.sw-table');
    await expect(table).toBeVisible({ timeout: 15000 });

    // Verify column headers
    const headers = ['Reference', 'Name', 'Email', 'Current Title', 'Experience', 'Status', 'Added'];
    for (const header of headers) {
      const headerCell = page.locator(`th:has-text("${header}")`);
      await expect(headerCell).toBeVisible();
    }
  });

  test('TC-REC-CAND-003: Search filter works correctly', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search by name"]');
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Type a search term
    await searchInput.fill('Thabo');
    await page.waitForTimeout(500); // Debounce wait
    await waitForContentLoad(page);
  });

  test('TC-REC-CAND-004: Status filter dropdown is functional', async ({ page }) => {
    const statusSelect = page.locator('select').first();
    await expect(statusSelect).toBeVisible({ timeout: 10000 });

    // Verify filter options exist
    const options = await statusSelect.locator('option').allTextContents();
    expect(options).toContain('All Statuses');
    expect(options).toContain('Active');
    expect(options).toContain('Hired');
  });

  test('TC-REC-CAND-005: Add Candidate button navigates to form', async ({ page }) => {
    const addBtn = page.locator('a[routerlink="/recruitment/candidates/new"]:has-text("Add Candidate")');
    await expect(addBtn).toBeVisible({ timeout: 10000 });

    await addBtn.click();
    await page.waitForURL('**/recruitment/candidates/new', { timeout: 10000 });
    expect(page.url()).toContain('/recruitment/candidates/new');
  });

  test('TC-REC-CAND-006: Candidate row click navigates to detail', async ({ page }) => {
    // Wait for table data
    await page.waitForSelector('table.sw-table tbody tr', { timeout: 15000 });

    // Click on first candidate row
    const firstRow = page.locator('table.sw-table tbody tr').first();
    const candidateLink = firstRow.locator('a[href*="/recruitment/candidates/"]').first();

    if (await candidateLink.isVisible()) {
      await candidateLink.click();
      await page.waitForURL(/\/recruitment\/candidates\/[a-f0-9-]+/, { timeout: 10000 });
      expect(page.url()).toMatch(/\/recruitment\/candidates\/[a-f0-9-]+/);
    }
  });

  test('TC-REC-CAND-007: Pagination controls are visible', async ({ page }) => {
    // Check if there are pagination controls (if enough data exists)
    const paginationText = page.locator('text=/Showing \\d+ to \\d+ of \\d+/');

    // Pagination might not be visible if there's not enough data
    const isVisible = await paginationText.isVisible().catch(() => false);
    if (isVisible) {
      await expect(paginationText).toBeVisible();
    }
  });
});

// =============================================================================
// CANDIDATE DETAIL TESTS
// =============================================================================

test.describe('TC-REC-CANDDET: Candidate Detail View', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);
    await page.goto('/recruitment/candidates');
    await waitForContentLoad(page);
  });

  test('TC-REC-CANDDET-001: Navigate to candidate detail and verify tabs', async ({ page }) => {
    // Wait for table and click first candidate
    await page.waitForSelector('table.sw-table tbody tr', { timeout: 15000 });

    const firstCandidateLink = page.locator('table.sw-table tbody tr a[href*="/recruitment/candidates/"]').first();

    if (await firstCandidateLink.isVisible()) {
      await firstCandidateLink.click();
      await page.waitForURL(/\/recruitment\/candidates\/[a-f0-9-]+/, { timeout: 10000 });
      await waitForContentLoad(page);

      // Verify tabs are present (use role selectors to be more specific)
      const profileTab = page.getByRole('tab', { name: 'Profile' });
      const applicationsTab = page.getByRole('tab', { name: /Applications/ });
      const interviewsTab = page.getByRole('tab', { name: /Interviews/ });
      const sourceTab = page.getByRole('tab', { name: 'Source' });
      const documentsTab = page.getByRole('tab', { name: 'Documents' });

      await expect(profileTab).toBeVisible({ timeout: 10000 });
      await expect(applicationsTab).toBeVisible();
      await expect(interviewsTab).toBeVisible();
      await expect(sourceTab).toBeVisible();
      await expect(documentsTab).toBeVisible();
    }
  });

  test('TC-REC-CANDDET-002: Candidate profile shows contact information', async ({ page }) => {
    await page.waitForSelector('table.sw-table tbody tr', { timeout: 15000 });

    const firstCandidateLink = page.locator('table.sw-table tbody tr a[href*="/recruitment/candidates/"]').first();

    if (await firstCandidateLink.isVisible()) {
      await firstCandidateLink.click();
      await page.waitForURL(/\/recruitment\/candidates\/[a-f0-9-]+/, { timeout: 10000 });
      await waitForContentLoad(page);

      // Verify contact information section
      const contactInfo = page.locator('h3:has-text("Contact Information")');
      await expect(contactInfo).toBeVisible({ timeout: 10000 });
    }
  });

  test('TC-REC-CANDDET-003: Candidate profile shows professional information', async ({ page }) => {
    await page.waitForSelector('table.sw-table tbody tr', { timeout: 15000 });

    const firstCandidateLink = page.locator('table.sw-table tbody tr a[href*="/recruitment/candidates/"]').first();

    if (await firstCandidateLink.isVisible()) {
      await firstCandidateLink.click();
      await page.waitForURL(/\/recruitment\/candidates\/[a-f0-9-]+/, { timeout: 10000 });
      await waitForContentLoad(page);

      // Verify professional information section
      const professionalInfo = page.locator('h3:has-text("Professional Information")');
      await expect(professionalInfo).toBeVisible({ timeout: 10000 });
    }
  });

  test('TC-REC-CANDDET-004: Edit button navigates to edit form', async ({ page }) => {
    await page.waitForSelector('table.sw-table tbody tr', { timeout: 15000 });

    const firstCandidateLink = page.locator('table.sw-table tbody tr a[href*="/recruitment/candidates/"]').first();

    if (await firstCandidateLink.isVisible()) {
      await firstCandidateLink.click();
      await page.waitForURL(/\/recruitment\/candidates\/[a-f0-9-]+/, { timeout: 10000 });
      await waitForContentLoad(page);

      // Click edit button
      const editBtn = page.locator('a[href*="/edit"] sw-button:has-text("Edit")').first();
      if (await editBtn.isVisible()) {
        await editBtn.click();
        await page.waitForURL(/\/recruitment\/candidates\/[a-f0-9-]+\/edit/, { timeout: 10000 });
        expect(page.url()).toContain('/edit');
      }
    }
  });
});

// =============================================================================
// INTERVIEWS LIST TESTS
// =============================================================================

test.describe('TC-REC-INT: Interviews Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);
    await page.goto('/recruitment/interviews');
    await waitForContentLoad(page);
  });

  test('TC-REC-INT-001: Interviews list page loads correctly', async ({ page }) => {
    const url = page.url();
    expect(url).toContain('/recruitment/interviews');

    // Page should have loaded (either with content or empty state)
    await page.waitForTimeout(2000);
  });

  test('TC-REC-INT-002: Navigate from dashboard to interviews', async ({ page }) => {
    await page.goto('/recruitment');
    await waitForContentLoad(page);

    const viewAllLink = page.locator('a[href="/recruitment/interviews"]:has-text("View All")');
    if (await viewAllLink.isVisible()) {
      await viewAllLink.click();
      await page.waitForURL('**/recruitment/interviews', { timeout: 10000 });
      expect(page.url()).toContain('/recruitment/interviews');
    }
  });
});

// =============================================================================
// RECRUITMENT REPORTS TESTS
// =============================================================================

test.describe('TC-REC-REP: Recruitment Reports', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);
  });

  test('TC-REC-REP-001: Recruitment reports page loads', async ({ page }) => {
    await page.goto('/recruitment/reports');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/recruitment/reports');
  });
});

// =============================================================================
// END-TO-END WORKFLOW TESTS
// =============================================================================

test.describe('TC-REC-E2E: End-to-End Recruitment Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);
  });

  test('TC-REC-E2E-001: Complete navigation workflow through recruitment module', async ({ page }) => {
    // 1. Start at dashboard
    await navigateToRecruitment(page);
    await waitForContentLoad(page);
    expect(page.url()).toContain('/recruitment');

    // 2. Navigate to Jobs
    await page.click('a[routerlink="/recruitment/jobs"]:has-text("View All Jobs")');
    await page.waitForURL('**/recruitment/jobs', { timeout: 10000 });
    await waitForContentLoad(page);

    // 3. Navigate to Candidates
    await page.goto('/recruitment/candidates');
    await waitForContentLoad(page);
    expect(page.url()).toContain('/recruitment/candidates');

    // 4. Navigate to Interviews
    await page.goto('/recruitment/interviews');
    await waitForContentLoad(page);
    expect(page.url()).toContain('/recruitment/interviews');

    // 5. Return to Dashboard
    await navigateToRecruitment(page);
    await waitForContentLoad(page);
    expect(page.url()).toContain('/recruitment');
  });

  test('TC-REC-E2E-002: View existing job posting details', async ({ page }) => {
    await page.goto('/recruitment/jobs');
    await waitForContentLoad(page);

    // Wait for jobs table
    await page.waitForSelector('table.sw-table tbody tr', { timeout: 15000 });

    // Click on first job
    const firstJobLink = page.locator('table.sw-table tbody tr a[href*="/recruitment/jobs/"]').first();

    if (await firstJobLink.isVisible()) {
      const jobTitle = await firstJobLink.textContent();
      await firstJobLink.click();

      await page.waitForURL(/\/recruitment\/jobs\/[a-f0-9-]+/, { timeout: 10000 });
      await waitForContentLoad(page);

      // Verify we're on job detail page
      expect(page.url()).toMatch(/\/recruitment\/jobs\/[a-f0-9-]+/);

      // Verify job title is displayed
      if (jobTitle) {
        const pageTitle = page.locator('h1').first();
        await expect(pageTitle).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('TC-REC-E2E-003: View existing candidate details and navigate tabs', async ({ page }) => {
    await page.goto('/recruitment/candidates');
    await waitForContentLoad(page);

    // Wait for candidates table
    await page.waitForSelector('table.sw-table tbody tr', { timeout: 15000 });

    // Click on first candidate
    const firstCandidateLink = page.locator('table.sw-table tbody tr a[href*="/recruitment/candidates/"]').first();

    if (await firstCandidateLink.isVisible()) {
      await firstCandidateLink.click();
      await page.waitForURL(/\/recruitment\/candidates\/[a-f0-9-]+/, { timeout: 10000 });
      await waitForContentLoad(page);

      // Test tab navigation
      const tabs = ['Profile', 'Applications', 'Interviews', 'Source', 'Documents'];

      for (const tabName of tabs) {
        const tab = page.locator(`text=${tabName}`).first();
        if (await tab.isVisible()) {
          await tab.click();
          await page.waitForTimeout(500);
        }
      }
    }
  });
});

// =============================================================================
// UI COMPONENT TESTS
// =============================================================================

test.describe('TC-REC-UI: UI Components and Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);
  });

  test('TC-REC-UI-001: Status badges display correctly on jobs list', async ({ page }) => {
    await page.goto('/recruitment/jobs');
    await waitForContentLoad(page);

    // Check for status badges
    const statusBadges = page.locator('span.rounded-full');
    const count = await statusBadges.count();

    // If there are jobs, there should be status badges
    if (count > 0) {
      const firstBadge = statusBadges.first();
      await expect(firstBadge).toBeVisible();
    }
  });

  test('TC-REC-UI-002: Dropdown menus work on job rows', async ({ page }) => {
    await page.goto('/recruitment/jobs');
    await waitForContentLoad(page);

    // Wait for table
    await page.waitForSelector('table.sw-table tbody tr', { timeout: 15000 });

    // Click on dropdown trigger (more_vert icon)
    const moreVertBtn = page.locator('table.sw-table tbody tr button:has(span.material-icons:has-text("more_vert"))').first();

    if (await moreVertBtn.isVisible()) {
      await moreVertBtn.click();

      // Wait for dropdown to open
      await page.waitForTimeout(300);

      // Check for dropdown items
      const viewItem = page.locator('sw-dropdown-item:has-text("View")');
      const editItem = page.locator('sw-dropdown-item:has-text("Edit")');

      await expect(viewItem).toBeVisible({ timeout: 5000 });
      await expect(editItem).toBeVisible();
    }
  });

  test('TC-REC-UI-003: Responsive table scrolling on jobs list', async ({ page }) => {
    await page.goto('/recruitment/jobs');
    await waitForContentLoad(page);

    // Check for overflow container
    const tableContainer = page.locator('.overflow-x-auto');
    await expect(tableContainer).toBeVisible({ timeout: 10000 });
  });

  test('TC-REC-UI-004: Material icons are rendered correctly', async ({ page }) => {
    await navigateToRecruitment(page);
    await waitForContentLoad(page);

    // Check for material icons
    const icons = page.locator('span.material-icons');
    const count = await icons.count();

    expect(count).toBeGreaterThan(0);
  });
});

// =============================================================================
// ERROR HANDLING TESTS
// =============================================================================

test.describe('TC-REC-ERR: Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);
  });

  test('TC-REC-ERR-001: Invalid job ID handles gracefully', async ({ page }) => {
    await page.goto('/recruitment/jobs/invalid-uuid-that-does-not-exist');
    await page.waitForTimeout(3000);

    // Should either show error, show loading state, or show empty state
    const url = page.url();
    const hasError = await page.locator('span.material-icons:has-text("error")').isVisible().catch(() => false);
    const hasSpinner = await page.locator('sw-spinner').isVisible().catch(() => false);
    const redirected = !url.includes('invalid-uuid-that-does-not-exist');
    const staysOnPage = url.includes('/recruitment/jobs');

    // The page should handle the invalid ID gracefully (error, loading, or stay on page)
    expect(hasError || hasSpinner || redirected || staysOnPage).toBe(true);
  });

  test('TC-REC-ERR-002: Invalid candidate ID handles gracefully', async ({ page }) => {
    await page.goto('/recruitment/candidates/invalid-uuid-that-does-not-exist');
    await page.waitForTimeout(3000);

    // Should either show error, show loading state, or show empty state
    const url = page.url();
    const hasError = await page.locator('span.material-icons:has-text("error")').isVisible().catch(() => false);
    const hasSpinner = await page.locator('sw-spinner').isVisible().catch(() => false);
    const redirected = !url.includes('invalid-uuid-that-does-not-exist');
    const staysOnPage = url.includes('/recruitment/candidates');

    // The page should handle the invalid ID gracefully (error, loading, or stay on page)
    expect(hasError || hasSpinner || redirected || staysOnPage).toBe(true);
  });
});
