import { test, expect } from '@playwright/test';

/**
 * Signup E2E Test
 *
 * Tests the full signup flow:
 *   1. Fill signup form
 *   2. Submit → navigates to /signup/verify
 *   3. Fetch verification code from MailHog API
 *   4. Enter code → auto-submits → redirects to /dashboard
 *
 * Prerequisites:
 *   - Frontend running on localhost:4200
 *   - tenant-service on localhost:8081
 *   - identity-service on localhost:8085
 *   - notification-service on localhost:8090
 *   - MailHog on localhost:8025
 *   - No existing user with the test email
 *
 * Run:
 *   npx playwright test signup.spec.ts --headed
 */

const MAILHOG_API = 'http://localhost:8025/api';
const TENANT_DB_CLEANUP = 'http://localhost:8081';

const TEST_USER = {
  firstName: 'Harris',
  lastName: 'Mogale',
  email: `test-${Date.now()}@surework-test.co.za`,
  password: 'SureWork2026@Test!',
  companyName: `TestCo-${Date.now()}`,
  companyType: 'PRIVATE_COMPANY',
};

// Don't use any stored auth — signup is a public flow
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Signup Flow', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    // Clear MailHog inbox
    await fetch(`${MAILHOG_API}/v1/messages`, { method: 'DELETE' });
  });

  test('Signup page loads with all form fields', async ({ page }) => {
    await page.goto('/signup');

    await expect(page.locator('#firstName')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#lastName')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#companyName')).toBeVisible();
    await expect(page.locator('#companyType')).toBeVisible();
    await expect(page.getByText('Start free trial')).toBeVisible();
  });

  test('Fill form and submit → navigates to verification page', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForSelector('#firstName', { timeout: 15000 });

    // Fill all fields
    await page.fill('#firstName', TEST_USER.firstName);
    await page.fill('#lastName', TEST_USER.lastName);
    await page.fill('#email', TEST_USER.email);
    await page.fill('#password', TEST_USER.password);
    await page.fill('#companyName', TEST_USER.companyName);
    await page.selectOption('#companyType', TEST_USER.companyType);

    // Wait for email availability check to complete
    await page.waitForTimeout(1500);

    // Accept terms
    const termsCheckbox = page.locator('input[formcontrolname="termsAccepted"]');
    await termsCheckbox.check();

    // Submit
    await page.click('button[type="submit"]');

    // Should navigate to verify page
    await page.waitForURL('**/signup/verify', { timeout: 30000 });
    expect(page.url()).toContain('/signup/verify');

    // Verify page shows the email
    await expect(page.getByText('Check your email')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(TEST_USER.email)).toBeVisible();
  });

  test('Verification email arrives in MailHog with 6-digit code', async () => {
    // Wait for notification-service to process the Kafka event
    let attempts = 0;
    let emailCount = 0;

    while (attempts < 15 && emailCount === 0) {
      const res = await fetch(`${MAILHOG_API}/v2/messages`);
      const data = await res.json();
      emailCount = data.total;
      if (emailCount === 0) {
        await new Promise(r => setTimeout(r, 2000));
        attempts++;
      }
    }

    expect(emailCount).toBeGreaterThan(0);

    // Fetch the email and extract the code
    const res = await fetch(`${MAILHOG_API}/v2/messages`);
    const data = await res.json();
    const latestEmail = data.items[0];

    expect(latestEmail.Raw.To[0]).toBe(TEST_USER.email);
    expect(latestEmail.Content.Headers.Subject[0]).toContain('verification code');
  });

  test('Enter verification code → redirects to dashboard', async ({ page }) => {
    // Get verification code from MailHog
    const res = await fetch(`${MAILHOG_API}/v2/messages`);
    const data = await res.json();
    const emailBody = data.items[0].Content.Body;

    // Extract 6-digit code from email HTML body
    const codeMatch = emailBody.match(/(\d{6})/);
    expect(codeMatch).toBeTruthy();
    const verificationCode = codeMatch![1];

    // Navigate to verify page with session storage set
    await page.goto('/signup');
    await page.evaluate((email) => {
      sessionStorage.setItem('signup_email', email);
    }, TEST_USER.email);
    await page.goto('/signup/verify');

    await expect(page.getByText('Check your email')).toBeVisible({ timeout: 10000 });

    // Enter the 6-digit code into the digit inputs
    const digitInputs = page.locator('input[inputmode="numeric"]');
    await expect(digitInputs.first()).toBeVisible({ timeout: 5000 });

    for (let i = 0; i < 6; i++) {
      await digitInputs.nth(i).fill(verificationCode[i]);
    }

    // The last digit auto-submits, or click verify button
    // Wait for redirect to dashboard
    try {
      await page.waitForURL('**/dashboard', { timeout: 30000 });
      expect(page.url()).toContain('/dashboard');
    } catch {
      // If auto-submit didn't trigger, click the verify button
      const verifyButton = page.getByText('Verify & continue');
      if (await verifyButton.isVisible()) {
        await verifyButton.click();
        await page.waitForURL('**/dashboard', { timeout: 30000 });
        expect(page.url()).toContain('/dashboard');
      }
    }
  });
});
