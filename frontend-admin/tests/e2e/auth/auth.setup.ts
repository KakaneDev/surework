import { test as setup, expect } from '@playwright/test';
import { testUsers } from '../../fixtures/test-data';

const authFile = 'tests/.auth/user.json';

/**
 * Authentication Setup
 *
 * This setup runs before all tests that require authentication.
 * It logs in and saves the authentication state for reuse.
 */
setup('authenticate as super admin', async ({ page }) => {
  // Capture all console messages for debugging
  page.on('console', (msg) => {
    console.log('Browser console:', msg.type(), msg.text());
  });
  page.on('pageerror', (err) => {
    console.log('Page error:', err.message);
  });
  page.on('response', (response) => {
    if (response.url().includes('admin-api') || response.status() >= 400) {
      console.log('API Response:', response.url(), 'Status:', response.status());
    }
  });

  // Navigate to login page
  await page.goto('/auth/signin');
  await page.waitForLoadState('networkidle');

  // Fill in credentials (use email for frontend form validation, backend accepts both)
  await page.locator('input[name="email"]').fill(testUsers.superAdmin.email);
  await page.locator('input[name="password"]').fill(testUsers.superAdmin.password);

  // Click sign in and wait for the login request
  const [loginResponse] = await Promise.all([
    page.waitForResponse((response) => response.url().includes('auth/login'), { timeout: 30000 }),
    page.getByRole('button', { name: /sign in/i }).click(),
  ]);

  console.log('Login response status:', loginResponse.status());

  if (loginResponse.status() !== 200) {
    throw new Error(`Login failed with status ${loginResponse.status()}`);
  }

  // Wait a bit for Angular to process the response
  await page.waitForTimeout(2000);

  // Wait for either dashboard navigation or error message
  await Promise.race([
    page.waitForURL('**/dashboard', { timeout: 15000 }),
    page.locator('.bg-error-50').waitFor({ state: 'visible', timeout: 15000 }).then(() => {
      throw new Error('Error message appeared on login page');
    }),
  ]).catch(async (error) => {
    // Check current state
    const currentUrl = page.url();
    const buttonDisabled = await page.getByRole('button', { name: /sign in/i }).isDisabled();
    const errorVisible = await page.locator('.bg-error-50').isVisible().catch(() => false);
    const errorText = errorVisible
      ? await page.locator('.bg-error-50').textContent()
      : 'no error';

    throw new Error(
      `Login navigation failed. URL: ${currentUrl}, Button disabled: ${buttonDisabled}, Error: ${errorText}. Original: ${error.message}`
    );
  });

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
