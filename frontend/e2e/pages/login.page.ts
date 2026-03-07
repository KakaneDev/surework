import { Page, Locator, expect } from '@playwright/test';

/**
 * Login Page Object Model
 * Handles authentication flows for tests with retry logic
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly errorMessage: Locator;
  readonly welcomeHeading: Locator;
  readonly tagline: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.signInButton = page.getByRole('button', { name: /sign in/i });
    this.errorMessage = page.locator('[role="alert"]');
    this.welcomeHeading = page.locator('h1');
    this.tagline = page.locator('text=Sign in to continue');
  }

  async goto(): Promise<void> {
    await this.page.goto('/auth/login');
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for the form to be interactive
    await this.emailInput.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Performs login with retry logic for flaky API connections
   */
  async login(email: string, password: string, maxRetries: number = 3): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Ensure form elements are visible and interactive
        await this.emailInput.waitFor({ state: 'visible', timeout: 10000 });
        await this.passwordInput.waitFor({ state: 'visible', timeout: 10000 });

        // Wait for form to be interactive (not disabled)
        await this.page.waitForFunction(
          () => {
            const emailInput = document.querySelector('#email') as HTMLInputElement;
            const passwordInput = document.querySelector('#password') as HTMLInputElement;
            return emailInput && !emailInput.disabled && passwordInput && !passwordInput.disabled;
          },
          { timeout: 5000 }
        );

        // Clear and fill the form with explicit waits
        await this.emailInput.click();
        await this.emailInput.fill('');
        await this.emailInput.fill(email);

        await this.passwordInput.click();
        await this.passwordInput.fill('');
        await this.passwordInput.fill(password);

        // Verify the fields are filled correctly
        const emailValue = await this.emailInput.inputValue();
        const passwordValue = await this.passwordInput.inputValue();

        if (emailValue !== email || passwordValue !== password) {
          console.log(`Form fill verification failed on attempt ${attempt}, retrying...`);
          await this.page.waitForTimeout(500);
          continue;
        }

        // Wait for sign in button to be enabled
        await this.page.waitForFunction(
          () => {
            const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
            return btn && !btn.disabled;
          },
          { timeout: 5000 }
        );

        // Click sign in
        await this.signInButton.click();

        // Wait for either redirect to dashboard OR error message
        const result = await Promise.race([
          this.page.waitForURL('**/dashboard', { timeout: 45000 })
            .then(() => 'success' as const),
          this.waitForLoginError(10000)
            .then(() => 'error' as const),
          this.waitForLoginStuck(30000)
            .then(() => 'stuck' as const)
        ]);

        if (result === 'success') {
          // Successfully logged in
          await this.page.waitForLoadState('networkidle');
          return;
        }

        if (result === 'error') {
          const errorText = await this.errorMessage.textContent();
          throw new Error(`Login failed: ${errorText}`);
        }

        if (result === 'stuck') {
          // Login is stuck in "Signing in..." state
          console.log(`Login attempt ${attempt} stuck, retrying...`);

          // Reload the page and try again
          await this.page.reload();
          await this.page.waitForLoadState('domcontentloaded');
          await this.emailInput.waitFor({ state: 'visible', timeout: 10000 });
          continue;
        }
      } catch (error) {
        lastError = error as Error;
        console.log(`Login attempt ${attempt} failed: ${lastError.message}`);

        if (attempt < maxRetries) {
          // Wait before retry
          await this.page.waitForTimeout(1000 * attempt);

          // Reload the login page for a fresh attempt
          await this.goto();
        }
      }
    }

    throw lastError || new Error('Login failed after all retries');
  }

  /**
   * Wait for a login error message to appear
   */
  private async waitForLoginError(timeout: number): Promise<void> {
    await this.errorMessage.waitFor({ state: 'visible', timeout });
  }

  /**
   * Detect if login is stuck (button still shows "Signing in..." after timeout)
   */
  private async waitForLoginStuck(timeout: number): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const buttonText = await this.signInButton.textContent();
      const isDisabled = await this.signInButton.isDisabled();

      // If button shows "Signing in..." and is disabled, it's still processing
      if (buttonText?.includes('Signing in') && isDisabled) {
        await this.page.waitForTimeout(500);
        continue;
      }

      // If button is back to normal and we're still on login page, something went wrong
      if (!isDisabled && this.page.url().includes('/auth/login')) {
        return; // Stuck state - login didn't redirect
      }

      await this.page.waitForTimeout(500);
    }
    // Timeout reached while still in "Signing in..." state
    return;
  }

  /**
   * Login and wait for dashboard with extended timeout
   */
  async loginAndWaitForDashboard(
    email: string,
    password: string,
    dashboardTimeout: number = 45000
  ): Promise<void> {
    await this.login(email, password);

    // Double-check we're on dashboard
    const currentUrl = this.page.url();
    if (!currentUrl.includes('/dashboard')) {
      await this.page.waitForURL('**/dashboard', { timeout: dashboardTimeout });
    }

    // Wait for dashboard to fully load
    await this.page.waitForLoadState('networkidle');
  }

  async expectLoginPage(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.signInButton).toBeVisible();
  }

  async getWelcomeText(): Promise<string> {
    return await this.welcomeHeading.textContent() || '';
  }

  async getSignInButtonText(): Promise<string> {
    return await this.signInButton.textContent() || '';
  }

  /**
   * Check if currently on login page
   */
  isOnLoginPage(): boolean {
    return this.page.url().includes('/auth/login');
  }
}
