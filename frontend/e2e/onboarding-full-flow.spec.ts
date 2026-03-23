import { test, expect } from '@playwright/test';

/**
 * Full Onboarding E2E Test
 *
 * Tests the complete new-user journey in a SINGLE test to avoid
 * token loss between serial test steps:
 *   1. Sign up with new account
 *   2. Verify email via MailHog code
 *   3. Land on dashboard with TENANT_ADMIN permissions (full sidebar)
 *   4. Log out → log back in with same credentials
 *
 * Run:
 *   cd frontend && npx playwright test onboarding-full-flow.spec.ts --headed
 */

const MAILHOG_API = 'http://localhost:8025/api';

// No stored auth — this is a public signup flow
test.use({ storageState: { cookies: [], origins: [] } });
test.setTimeout(120_000);

test('Full onboarding: signup → verify → dashboard → logout → login', async ({ page }) => {
  const TEST_USER = {
    firstName: 'Test',
    lastName: 'Admin',
    email: `e2e-${Date.now()}@surework-test.co.za`,
    password: 'SureWork2026@Test!',
    companyName: `E2E-Company-${Date.now()}`,
    companyType: 'PRIVATE_COMPANY',
  };

  // Clear MailHog inbox
  await fetch(`${MAILHOG_API}/v1/messages`, { method: 'DELETE' });
  // Clear Redis rate limits (dev only) via MailHog-style HTTP call
  try {
    const { execFileSync } = require('child_process');
    execFileSync('docker', ['exec', 'surework-redis', 'redis-cli', 'FLUSHALL'], { stdio: 'ignore' });
  } catch { /* ignore if redis not available */ }

  // ─── Step 1: Sign Up ─────────────────────────────────────────────
  console.log('STEP 1: Filling signup form...');
  await page.goto('/signup');
  await page.waitForSelector('#firstName', { timeout: 20_000 });

  await page.fill('#firstName', TEST_USER.firstName);
  await page.fill('#lastName', TEST_USER.lastName);
  await page.fill('#email', TEST_USER.email);
  await page.fill('#password', TEST_USER.password);
  await page.fill('#companyName', TEST_USER.companyName);
  await page.selectOption('#companyType', TEST_USER.companyType);

  // Wait for email availability check
  await page.waitForTimeout(2000);

  // Accept terms
  await page.locator('input[formcontrolname="termsAccepted"]').check();

  // Submit
  await page.click('button[type="submit"]');

  // Should navigate to verify page
  await page.waitForURL('**/signup/verify', { timeout: 30_000 });
  await expect(page.getByText('Check your email')).toBeVisible({ timeout: 10_000 });
  console.log('STEP 1 PASSED: Signup submitted, on verify page');

  // ─── Step 2: Verify Email Code ───────────────────────────────────
  console.log('STEP 2: Fetching verification code from MailHog...');

  let emailBody = '';
  for (let attempt = 0; attempt < 20; attempt++) {
    const res = await fetch(`${MAILHOG_API}/v2/messages`);
    const data = await res.json();
    if (data.total > 0) {
      const email = data.items.find(
        (item: any) => item.Raw.To.some((to: string) => to.includes(TEST_USER.email))
      ) || data.items[0];
      emailBody = email.Content.Body;
      break;
    }
    await page.waitForTimeout(2000);
  }
  expect(emailBody, 'Verification email not received').toBeTruthy();

  // Extract 6-digit code from HTML: <span...>123456</span>
  const codeMatch = emailBody.match(/>\s*(\d{6})\s*</)
                 || emailBody.match(/(\d{6})/);
  expect(codeMatch, 'No 6-digit code found in email').toBeTruthy();
  const verificationCode = codeMatch![1];
  console.log(`Verification code: ${verificationCode}`);

  // Enter code digit by digit
  const digitInputs = page.locator('input[inputmode="numeric"]');
  await expect(digitInputs.first()).toBeVisible({ timeout: 5_000 });

  for (let i = 0; i < 6; i++) {
    await digitInputs.nth(i).fill(verificationCode[i]);
    await page.waitForTimeout(150);
  }

  // Wait for redirect to dashboard (auto-submit or click button)
  try {
    await page.waitForURL('**/dashboard', { timeout: 15_000 });
  } catch {
    const verifyBtn = page.getByRole('button', { name: /verify/i });
    if (await verifyBtn.isVisible()) {
      await verifyBtn.click();
    }
    await page.waitForURL('**/dashboard', { timeout: 15_000 });
  }

  expect(page.url()).toContain('/dashboard');
  console.log('STEP 2 PASSED: Verified, on dashboard');

  // ─── Step 3: Check admin sidebar ─────────────────────────────────
  console.log('STEP 3: Checking admin permissions...');

  // Wait for sidebar to render
  await page.waitForTimeout(3000);
  await expect(page.getByText('Dashboard').first()).toBeVisible({ timeout: 10_000 });

  // Check for admin menu sections (require TENANT_ALL permission)
  const adminSections = ['HR', 'Finance', 'Recruitment', 'Reports', 'Documents'];
  const errors: string[] = [];

  for (const section of adminSections) {
    try {
      await expect(page.getByText(section, { exact: false }).first()).toBeVisible({ timeout: 5_000 });
    } catch {
      errors.push(section);
    }
  }

  if (errors.length > 0) {
    console.error('MISSING ADMIN SECTIONS:', errors);
    await page.screenshot({ path: 'e2e/screenshots/missing-admin-sections.png', fullPage: true });
  }

  expect(errors, `Missing admin sidebar: ${errors.join(', ')}`).toHaveLength(0);
  console.log('STEP 3 PASSED: All admin sidebar sections visible');

  // ─── Step 4: Logout ──────────────────────────────────────────────
  console.log('STEP 4: Logging out...');

  // Clear tokens (most reliable logout method in E2E)
  await page.evaluate(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  });
  await page.goto('/auth/login');
  await page.waitForURL('**/auth/login**', { timeout: 10_000 });
  await expect(page.getByText(/sign in|welcome/i).first()).toBeVisible({ timeout: 10_000 });
  console.log('STEP 4 PASSED: Logged out, on login page');

  // ─── Step 5: Login with same credentials ─────────────────────────
  console.log('STEP 5: Logging back in...');

  const emailInput = page.locator('input[type="email"], input[formcontrolname="email"]');
  const passwordInput = page.locator('input[type="password"]');

  await emailInput.fill(TEST_USER.email);
  await passwordInput.fill(TEST_USER.password);

  const signInBtn = page.getByRole('button', { name: /sign in/i });
  await signInBtn.click();

  // Wait for redirect to dashboard
  try {
    await page.waitForURL('**/dashboard**', { timeout: 30_000 });
    console.log('STEP 5 PASSED: Login successful, on dashboard');
  } catch {
    const currentUrl = page.url();
    const errorEl = page.locator('[class*="error"], [class*="alert"], [class*="bg-red"]');
    const errorText = await errorEl.textContent().catch(() => 'no error element');
    console.error(`LOGIN FAILED: URL=${currentUrl}, Error="${errorText}"`);
    await page.screenshot({ path: 'e2e/screenshots/login-failure.png', fullPage: true });
    expect(page.url(), 'Login did not redirect to dashboard').toContain('/dashboard');
  }

  // ─── Step 6: Verify admin permissions after re-login ─────────────
  console.log('STEP 6: Verifying admin permissions after re-login...');

  await page.waitForTimeout(3000);
  await expect(page.getByText('Dashboard').first()).toBeVisible({ timeout: 10_000 });

  for (const section of ['HR', 'Finance', 'Recruitment']) {
    await expect(
      page.getByText(section, { exact: false }).first()
    ).toBeVisible({ timeout: 5_000 });
  }

  console.log('STEP 6 PASSED: Admin permissions intact after re-login');
  console.log('ALL STEPS PASSED');
});
