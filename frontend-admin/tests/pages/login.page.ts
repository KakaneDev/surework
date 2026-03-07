import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Login Page Object
 *
 * Test Case Coverage:
 * - TC-AUTH-001: Valid credentials login
 * - TC-AUTH-002: Invalid password error handling
 * - TC-AUTH-003: Empty fields validation
 * - TC-AUTH-004: Password visibility toggle
 * - TC-AUTH-005: Remember me functionality
 * - TC-AUTH-006: Forgot password link navigation
 */
export class LoginPage extends BasePage {
  // Locators
  readonly pageTitle: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorMessage: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.locator('h1:has-text("SureWork")');
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.signInButton = page.getByRole('button', { name: /sign in/i });
    this.rememberMeCheckbox = page.locator('input[type="checkbox"]');
    this.forgotPasswordLink = page.getByRole('link', { name: /forgot password/i });
    this.errorMessage = page.locator('.bg-error-50, [role="alert"]');
    this.emailError = page.locator('p.text-error-600:has-text("Email is required"), p.text-error-400:has-text("Email is required")');
    this.passwordError = page.locator('p.text-error-600:has-text("Password is required"), p.text-error-400:has-text("Password is required")');
    this.loadingSpinner = page.locator('[data-loading="true"], .animate-spin');
  }

  /**
   * Navigate to the login page
   */
  async navigate(): Promise<void> {
    await this.page.goto('/auth/signin');
    await this.waitForPageLoad();
  }

  /**
   * Perform login with provided credentials
   */
  async login(email: string, password: string): Promise<void> {
    await this.safeType(this.emailInput, email);
    await this.safeType(this.passwordInput, password);
    await this.safeClick(this.signInButton);
  }

  /**
   * Check the remember me checkbox
   */
  async checkRememberMe(): Promise<void> {
    await this.rememberMeCheckbox.check();
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword(): Promise<void> {
    await this.safeClick(this.forgotPasswordLink);
  }

  /**
   * Get the error message text
   */
  async getErrorMessage(): Promise<string> {
    await this.errorMessage.waitFor({ state: 'visible' });
    return this.getText(this.errorMessage);
  }

  /**
   * Check if email validation error is displayed
   */
  async hasEmailError(): Promise<boolean> {
    return this.exists(this.emailError);
  }

  /**
   * Check if password validation error is displayed
   */
  async hasPasswordError(): Promise<boolean> {
    return this.exists(this.passwordError);
  }

  /**
   * Verify successful login by checking navigation to dashboard
   */
  async assertLoginSuccessful(): Promise<void> {
    await this.page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(this.page).toHaveURL(/.*dashboard/);
  }

  /**
   * Verify the login page is displayed correctly
   */
  async assertPageDisplayed(): Promise<void> {
    await this.assertVisible(this.pageTitle, 'Page title should be visible');
    await this.assertVisible(this.emailInput, 'Email input should be visible');
    await this.assertVisible(this.passwordInput, 'Password input should be visible');
    await this.assertVisible(this.signInButton, 'Sign in button should be visible');
  }

  /**
   * Check if the button is in loading state
   */
  async isLoading(): Promise<boolean> {
    return this.exists(this.loadingSpinner);
  }
}
