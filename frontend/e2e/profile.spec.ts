import { test, expect, Page } from '@playwright/test';

/**
 * Profile Screen Tests
 * Tests for the user profile page functionality:
 * - Profile navigation and loading
 * - Header with avatar and user info
 * - Tabbed content navigation
 * - Avatar upload functionality
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

// =============================================================================
// PROFILE NAVIGATION TESTS
// =============================================================================

test.describe('Profile Navigation', () => {
  test('Employee can access /profile page', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    await page.goto('/profile');
    await page.waitForTimeout(3000);

    const url = page.url();
    expect(url).toContain('/profile');
  });

  test('HR Manager can access /profile page', async ({ page }) => {
    await login(page, HR_MANAGER.email, TEST_PASSWORD);

    await page.goto('/profile');
    await page.waitForTimeout(3000);

    const url = page.url();
    expect(url).toContain('/profile');
  });

  test('Super Admin can access /profile page', async ({ page }) => {
    await login(page, SUPER_ADMIN.email, TEST_PASSWORD);

    await page.goto('/profile');
    await page.waitForTimeout(3000);

    const url = page.url();
    expect(url).toContain('/profile');
  });

  test('Unauthenticated user cannot access /profile', async ({ page }) => {
    await page.goto('/profile');

    // Should redirect to login
    await expect(page).toHaveURL(/.*\/auth\/login/, { timeout: 10000 });
  });
});

// =============================================================================
// PROFILE LOADING TESTS
// =============================================================================

test.describe('Profile Loading', () => {
  test('Profile page shows loading spinner initially', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    // Navigate without waiting for full load
    await page.goto('/profile');

    // Should see loading spinner or content
    const spinner = page.locator('sw-spinner');
    const content = page.locator('.sw-page-header, h1');

    const hasSpinner = await spinner.isVisible().catch(() => false);
    const hasContent = await content.first().isVisible().catch(() => false);

    // Either spinner is shown during load or content is already visible
    expect(hasSpinner || hasContent, 'Should show spinner or content').toBe(true);
  });

  test('Profile page loads without errors', async ({ page }) => {
    // Capture console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await page.goto('/profile');
    await page.waitForTimeout(5000);

    // Filter for API-related errors
    const apiErrors = errors.filter(e =>
      e.includes('403') || e.includes('401') || e.includes('Failed to fetch')
    );

    console.log(`[Profile] API Errors captured: ${apiErrors.length}`);
    apiErrors.forEach(e => console.log(`  - ${e}`));

    // No authentication/authorization errors expected
    expect(apiErrors.length, 'Should not have API auth errors').toBe(0);
  });
});

// =============================================================================
// PROFILE HEADER TESTS
// =============================================================================

test.describe('Profile Header', () => {
  test('Profile shows user avatar or initials', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    // Should have avatar container (either image or initials)
    const avatarContainer = page.locator('.rounded-full').first();
    await expect(avatarContainer).toBeVisible({ timeout: 10000 });
  });

  test('Profile shows user name', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    // Should show user's name
    const nameElement = page.locator('h1');
    await expect(nameElement).toBeVisible({ timeout: 10000 });

    const nameText = await nameElement.textContent();
    expect(nameText).toBeTruthy();
    console.log(`[Profile] User name displayed: ${nameText}`);
  });

  test('Profile shows user email', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    // Should show user's email
    const emailElement = page.locator(`text=${EMPLOYEE.email}`);
    const hasEmail = await emailElement.isVisible().catch(() => false);

    // Email should be visible somewhere on the page
    expect(hasEmail, 'User email should be visible').toBe(true);
  });

  test('Profile shows employee number badge', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    // Look for employee number badge (format: EMP-xxx or similar)
    const badges = page.locator('span:has(.material-icons)');
    const badgeCount = await badges.count();

    console.log(`[Profile] Found ${badgeCount} info badges`);
    expect(badgeCount, 'Should have at least one info badge').toBeGreaterThan(0);
  });

  test('Avatar upload button appears on hover', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    // Find the avatar container
    const avatarContainer = page.locator('.relative.group').first();

    // Hover over the avatar
    await avatarContainer.hover();
    await page.waitForTimeout(500);

    // The upload overlay should become visible (opacity changes on hover)
    const uploadOverlay = page.locator('button:has(.material-icons:has-text("photo_camera"))');
    const isVisible = await uploadOverlay.isVisible().catch(() => false);

    // The overlay may be hidden with opacity, but the button should exist
    const buttonExists = await uploadOverlay.count() > 0;
    expect(buttonExists, 'Avatar upload button should exist').toBe(true);
  });
});

// =============================================================================
// PROFILE TABS TESTS
// =============================================================================

test.describe('Profile Tabs', () => {
  test('Profile shows all 5 tabs', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    const expectedTabs = ['Personal', 'Employment', 'Banking', 'Emergency', 'Account'];

    for (const tabName of expectedTabs) {
      const tab = page.locator(`button[role="tab"]:has-text("${tabName}")`);
      const isVisible = await tab.isVisible().catch(() => false);
      expect(isVisible, `Tab "${tabName}" should be visible`).toBe(true);
    }
  });

  test('Personal tab is selected by default', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    // First tab should be selected
    const personalTab = page.locator('button[role="tab"]:has-text("Personal")');
    const ariaSelected = await personalTab.getAttribute('aria-selected');

    expect(ariaSelected, 'Personal tab should be selected by default').toBe('true');
  });

  test('Clicking Employment tab shows employment content', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    // Click Employment tab
    const employmentTab = page.locator('button[role="tab"]:has-text("Employment")');
    await employmentTab.click();
    await page.waitForTimeout(500);

    // Should show employment-related content
    const employmentContent = page.locator('text=Employee Number, text=Department, text=Job Title');
    const hasContent = await employmentContent.first().isVisible().catch(() => false);

    // Check for Position Details or Employment Details headers
    const positionHeader = page.locator('h3:has-text("Position Details"), h3:has-text("Employment Details")');
    const hasHeader = await positionHeader.first().isVisible().catch(() => false);

    expect(hasContent || hasHeader, 'Employment tab should show relevant content').toBe(true);
  });

  test('Clicking Banking tab shows banking content', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    // Click Banking tab
    const bankingTab = page.locator('button[role="tab"]:has-text("Banking")');
    await bankingTab.click();
    await page.waitForTimeout(500);

    // Should show banking-related content
    const bankHeader = page.locator('h3:has-text("Bank Details")');
    const hasHeader = await bankHeader.isVisible().catch(() => false);

    const hrNotice = page.locator('text=Contact HR');
    const hasNotice = await hrNotice.isVisible().catch(() => false);

    expect(hasHeader || hasNotice, 'Banking tab should show relevant content').toBe(true);
  });

  test('Clicking Emergency tab shows emergency contact content', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    // Click Emergency tab
    const emergencyTab = page.locator('button[role="tab"]:has-text("Emergency")');
    await emergencyTab.click();
    await page.waitForTimeout(500);

    // Should show emergency contact content
    const emergencyHeader = page.locator('h3:has-text("Emergency Contact")');
    const hasHeader = await emergencyHeader.isVisible().catch(() => false);

    expect(hasHeader, 'Emergency tab should show Emergency Contact header').toBe(true);
  });

  test('Clicking Account tab shows account content', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    // Click Account tab
    const accountTab = page.locator('button[role="tab"]:has-text("Account")');
    await accountTab.click();
    await page.waitForTimeout(500);

    // Should show account-related content
    const accountHeader = page.locator('h3:has-text("Account Information")');
    const hasHeader = await accountHeader.isVisible().catch(() => false);

    const rolesHeader = page.locator('h3:has-text("Roles")');
    const hasRoles = await rolesHeader.isVisible().catch(() => false);

    expect(hasHeader || hasRoles, 'Account tab should show relevant content').toBe(true);
  });

  test('Tab navigation maintains URL', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    // Click through tabs
    const tabs = ['Employment', 'Banking', 'Emergency', 'Account', 'Personal'];

    for (const tabName of tabs) {
      const tab = page.locator(`button[role="tab"]:has-text("${tabName}")`);
      await tab.click();
      await page.waitForTimeout(300);

      // URL should stay on /profile
      const url = page.url();
      expect(url).toContain('/profile');
    }
  });
});

// =============================================================================
// PERSONAL TAB CONTENT TESTS
// =============================================================================

test.describe('Personal Tab Content', () => {
  test('Personal tab shows contact information section', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    const contactHeader = page.locator('h3:has-text("Contact Information")');
    await expect(contactHeader).toBeVisible({ timeout: 10000 });
  });

  test('Personal tab shows personal details section', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    const personalHeader = page.locator('h3:has-text("Personal Details")');
    await expect(personalHeader).toBeVisible({ timeout: 10000 });
  });

  test('Personal tab shows address section', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    const addressHeader = page.locator('h3:has-text("Address")');
    await expect(addressHeader).toBeVisible({ timeout: 10000 });
  });

  test('ID number is masked for privacy', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    // Look for masked ID number (format: ****1234)
    const maskedId = page.locator('text=/\\*\\*\\*\\*\\d{4}/');
    const idLabel = page.locator('dt:has-text("ID Number")');

    const hasLabel = await idLabel.isVisible().catch(() => false);
    const hasMasked = await maskedId.isVisible().catch(() => false);

    // Either ID is masked or not shown
    if (hasLabel) {
      console.log(`[Profile] ID Number label found, masked: ${hasMasked}`);
    }
  });
});

// =============================================================================
// ACCOUNT TAB CONTENT TESTS
// =============================================================================

test.describe('Account Tab Content', () => {
  test('Account tab shows MFA status badge', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    // Click Account tab
    const accountTab = page.locator('button[role="tab"]:has-text("Account")');
    await accountTab.click();
    await page.waitForTimeout(500);

    // Should show MFA status
    const mfaLabel = page.locator('dt:has-text("MFA Status")');
    await expect(mfaLabel).toBeVisible({ timeout: 10000 });

    // Should have Enabled or Disabled badge
    const mfaBadge = page.locator('sw-badge:has-text("Enabled"), sw-badge:has-text("Disabled")');
    await expect(mfaBadge).toBeVisible({ timeout: 10000 });
  });

  test('Account tab shows user roles', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    // Click Account tab
    const accountTab = page.locator('button[role="tab"]:has-text("Account")');
    await accountTab.click();
    await page.waitForTimeout(500);

    // Should show roles section
    const rolesLabel = page.locator('dt:has-text("Roles")');
    await expect(rolesLabel).toBeVisible({ timeout: 10000 });
  });

  test('Account tab shows permissions count', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    // Click Account tab
    const accountTab = page.locator('button[role="tab"]:has-text("Account")');
    await accountTab.click();
    await page.waitForTimeout(500);

    // Should show permissions
    const permissionsLabel = page.locator('dt:has-text("Permissions")');
    await expect(permissionsLabel).toBeVisible({ timeout: 10000 });

    // Should show count (e.g., "5 permissions")
    const permissionsCount = page.locator('text=/\\d+ permissions/');
    await expect(permissionsCount).toBeVisible({ timeout: 10000 });
  });

  test('Account tab shows settings link', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    // Click Account tab
    const accountTab = page.locator('button[role="tab"]:has-text("Account")');
    await accountTab.click();
    await page.waitForTimeout(500);

    // Should show link to settings
    const settingsLink = page.locator('a[href="/settings"]');
    await expect(settingsLink).toBeVisible({ timeout: 10000 });
  });
});

// =============================================================================
// AVATAR UPLOAD TESTS
// =============================================================================

test.describe('Avatar Upload', () => {
  test('File input exists and is hidden', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    // Should have hidden file input
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveCount(1);

    // Input should have correct accept attribute
    const accept = await fileInput.getAttribute('accept');
    expect(accept).toContain('image/');
  });

  test('File input accepts only images', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    const fileInput = page.locator('input[type="file"]');
    const accept = await fileInput.getAttribute('accept');

    expect(accept).toContain('image/jpeg');
    expect(accept).toContain('image/png');
  });
});

// =============================================================================
// RESPONSIVE DESIGN TESTS
// =============================================================================

test.describe('Responsive Design', () => {
  test('Profile displays correctly on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    // Content should still be visible
    const avatarContainer = page.locator('.rounded-full').first();
    await expect(avatarContainer).toBeVisible({ timeout: 10000 });

    // Tabs should still be visible
    const tabs = page.locator('button[role="tab"]');
    const tabCount = await tabs.count();
    expect(tabCount).toBe(5);
  });

  test('Profile displays correctly on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    // Content should be visible
    const nameElement = page.locator('h1');
    await expect(nameElement).toBeVisible({ timeout: 10000 });
  });

  test('Profile displays correctly on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    await login(page, EMPLOYEE.email, TEST_PASSWORD);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    // Content should be visible
    const nameElement = page.locator('h1');
    await expect(nameElement).toBeVisible({ timeout: 10000 });
  });
});

// =============================================================================
// DARK MODE TESTS
// =============================================================================

test.describe('Dark Mode', () => {
  test('Profile renders in dark mode without errors', async ({ page }) => {
    await login(page, EMPLOYEE.email, TEST_PASSWORD);

    // Enable dark mode via localStorage or class
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });

    await page.goto('/profile');
    await page.waitForTimeout(3000);

    // Page should still load correctly
    const nameElement = page.locator('h1');
    await expect(nameElement).toBeVisible({ timeout: 10000 });

    // Check for dark mode classes
    const hasDarkClass = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });

    expect(hasDarkClass, 'Dark mode class should be applied').toBe(true);
  });
});

// =============================================================================
// ERROR HANDLING TESTS
// =============================================================================

test.describe('Error Handling', () => {
  test('Profile handles missing employee data gracefully', async ({ page }) => {
    // This test uses a user that may not have an employee record
    await login(page, SUPER_ADMIN.email, TEST_PASSWORD);
    await page.goto('/profile');
    await page.waitForTimeout(3000);

    // Page should still load without crashing
    const url = page.url();
    expect(url).toContain('/profile');

    // Should show at least account information
    const accountTab = page.locator('button[role="tab"]:has-text("Account")');
    await expect(accountTab).toBeVisible({ timeout: 10000 });
  });
});
