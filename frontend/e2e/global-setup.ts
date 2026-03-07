import { chromium, FullConfig } from '@playwright/test';
import { TEST_USERS } from './fixtures/auth.fixture';

/**
 * Global setup that runs once before all tests.
 * Authenticates as admin and saves the session state for reuse.
 */
async function globalSetup(config: FullConfig) {
  const { baseURL, storageState } = config.projects[0].use;

  console.log('🔐 Starting global authentication setup...');
  console.log(`   Base URL: ${baseURL}`);

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const maxRetries = 5;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`   Login attempt ${attempt}/${maxRetries}...`);

      // Navigate to login page
      await page.goto(`${baseURL}/auth/login`, { timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');

      // Wait for form to be ready
      const emailInput = page.locator('#email');
      const passwordInput = page.locator('#password');

      await emailInput.waitFor({ state: 'visible', timeout: 15000 });
      await passwordInput.waitFor({ state: 'visible', timeout: 15000 });

      // Wait for form to be interactive
      await page.waitForFunction(
        () => {
          const email = document.querySelector('#email') as HTMLInputElement;
          const password = document.querySelector('#password') as HTMLInputElement;
          return email && !email.disabled && password && !password.disabled;
        },
        { timeout: 10000 }
      );

      // Fill credentials with explicit clearing
      await emailInput.click();
      await emailInput.fill('');
      await page.waitForTimeout(100);
      await emailInput.fill(TEST_USERS.admin.email);

      await passwordInput.click();
      await passwordInput.fill('');
      await page.waitForTimeout(100);
      await passwordInput.fill(TEST_USERS.admin.password);

      // Verify form is filled correctly
      const emailValue = await emailInput.inputValue();
      const passwordValue = await passwordInput.inputValue();

      if (emailValue !== TEST_USERS.admin.email || passwordValue !== TEST_USERS.admin.password) {
        console.log(`   ⚠️ Form fill verification failed, retrying...`);
        await page.waitForTimeout(1000);
        continue;
      }

      // Wait for submit button to be enabled
      await page.waitForFunction(
        () => {
          const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
          return btn && !btn.disabled;
        },
        { timeout: 5000 }
      );

      // Click sign in
      const signInButton = page.getByRole('button', { name: /sign in/i });
      await signInButton.click();

      console.log(`   ⏳ Waiting for authentication...`);

      // Wait for successful redirect to dashboard with longer timeout
      await page.waitForURL('**/dashboard', { timeout: 60000 });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      console.log(`   ✅ Authentication successful!`);

      // Save storage state (cookies, localStorage, sessionStorage)
      await context.storageState({ path: storageState as string });
      console.log(`   💾 Session saved to: ${storageState}`);

      await browser.close();
      console.log('🎉 Global setup complete!\n');
      return;

    } catch (error) {
      lastError = error as Error;
      console.log(`   ❌ Attempt ${attempt} failed: ${lastError.message}`);

      if (attempt < maxRetries) {
        // Take screenshot for debugging
        try {
          await page.screenshot({
            path: `e2e/screenshots/global-setup-error-attempt-${attempt}.png`,
            fullPage: true
          });
        } catch (e) {
          // Ignore screenshot errors
        }

        // Exponential backoff
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`   ⏰ Waiting ${waitTime}ms before retry...`);
        await page.waitForTimeout(waitTime);

        // Reload for fresh attempt
        try {
          await page.reload({ timeout: 10000 });
        } catch (e) {
          // Navigate fresh if reload fails
          await page.goto(`${baseURL}/auth/login`, { timeout: 30000 });
        }
      }
    }
  }

  await browser.close();
  throw new Error(`Global setup failed after ${maxRetries} attempts: ${lastError?.message}`);
}

export default globalSetup;
