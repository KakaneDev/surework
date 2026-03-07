import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Onboarding Wizard
 * Handles all 5 steps of the signup wizard flow:
 * - Step 0: Account (email, password, name)
 * - Step 1: Company (company name, registration number, type, sector)
 * - Step 2: Compliance (SARS info: tax, VAT, UIF, SDL, PAYE)
 * - Step 3: Contact (phone, email, address)
 * - Step 4: Review & Terms acceptance
 */
export class OnboardingPage {
  readonly page: Page;

  // Navigation elements
  readonly backButton: Locator;
  readonly nextButton: Locator;
  readonly createAccountButton: Locator;

  // Progress bar steps
  readonly progressSteps: Locator;

  // Step 0: Account fields
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly passwordVisibilityToggle: Locator;
  readonly passwordStrengthIndicator: Locator;

  // Step 1: Company fields
  readonly companyNameInput: Locator;
  readonly tradingNameInput: Locator;
  readonly registrationNumberInput: Locator;
  readonly companyTypeSelect: Locator;
  readonly industrySectorSelect: Locator;

  // Step 2: Compliance fields
  readonly taxNumberInput: Locator;
  readonly vatNumberInput: Locator;
  readonly uifReferenceInput: Locator;
  readonly sdlNumberInput: Locator;
  readonly payeReferenceInput: Locator;

  // Step 3: Contact fields
  readonly phoneInput: Locator;
  readonly companyEmailInput: Locator;
  readonly streetAddressInput: Locator;
  readonly cityInput: Locator;
  readonly provinceSelect: Locator;
  readonly postalCodeInput: Locator;

  // Step 4: Review & Terms
  readonly acceptTermsCheckbox: Locator;
  readonly termsLink: Locator;
  readonly privacyLink: Locator;

  // Error messages
  readonly errorMessages: Locator;
  readonly requiredFieldError: Locator;

  // Loading overlay
  readonly loadingOverlay: Locator;
  readonly loadingSpinner: Locator;

  // Misc
  readonly signInLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Navigation - use getByRole for robust button selection
    this.backButton = page.getByRole('button', { name: /Back/ });
    this.nextButton = page.getByRole('button', { name: /Next/ });
    this.createAccountButton = page.getByRole('button', { name: /Create Account/ });

    // Progress - supports both old and new implementations
    // Old: .flex.items-center.justify-between .flex-col
    // New: nav[aria-label] ol li
    this.progressSteps = page.locator('nav[aria-label] ol li, .flex.items-center.justify-between > .flex-col');

    // Step 0: Account
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.firstNameInput = page.locator('#firstName');
    this.lastNameInput = page.locator('#lastName');
    // Button contains either visibility or visibility_off icon
    this.passwordVisibilityToggle = page.locator('#password').locator('xpath=../button');
    this.passwordStrengthIndicator = page.locator('sw-password-strength');

    // Step 1: Company
    this.companyNameInput = page.locator('#companyName');
    this.tradingNameInput = page.locator('#tradingName');
    this.registrationNumberInput = page.locator('#registrationNumber');
    this.companyTypeSelect = page.locator('#companyType');
    this.industrySectorSelect = page.locator('#industrySector');

    // Step 2: Compliance
    this.taxNumberInput = page.locator('#taxNumber');
    this.vatNumberInput = page.locator('#vatNumber');
    this.uifReferenceInput = page.locator('#uifReference');
    this.sdlNumberInput = page.locator('#sdlNumber');
    this.payeReferenceInput = page.locator('#payeReference');

    // Step 3: Contact
    this.phoneInput = page.locator('#phone');
    this.companyEmailInput = page.locator('#companyEmail');
    this.streetAddressInput = page.locator('#streetAddress');
    this.cityInput = page.locator('#city');
    this.provinceSelect = page.locator('#province');
    this.postalCodeInput = page.locator('#postalCode');

    // Step 4: Review
    this.acceptTermsCheckbox = page.locator('input[type="checkbox"][formcontrolname="acceptTerms"]');
    this.termsLink = page.locator('a[href="/terms"]');
    this.privacyLink = page.locator('a[href="/privacy"]');

    // Errors
    this.errorMessages = page.locator('.sw-error-text');
    this.requiredFieldError = page.locator('text=This field is required');

    // Loading
    this.loadingOverlay = page.locator('.fixed.inset-0.bg-black\\/50');
    this.loadingSpinner = page.locator('sw-spinner');

    // Misc
    this.signInLink = page.locator('a[routerlink="/auth/login"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/signup');
    await this.page.waitForLoadState('networkidle');
    // Wait for the wizard to be visible
    await this.emailInput.waitFor({ state: 'visible', timeout: 15000 });
  }

  /**
   * Get the current step number (0-indexed)
   */
  async getCurrentStep(): Promise<number> {
    // Find the step with aria-current="step"
    const currentStepButton = this.page.locator('button[aria-current="step"]');
    if (await currentStepButton.isVisible().catch(() => false)) {
      // Find its index in the step list
      const steps = await this.progressSteps.all();
      for (let i = 0; i < steps.length; i++) {
        const button = steps[i].locator('button');
        const ariaCurrent = await button.getAttribute('aria-current');
        if (ariaCurrent === 'step') {
          return i;
        }
      }
    }
    return 0;
  }

  /**
   * Click on a specific progress step to navigate directly
   */
  async clickProgressStep(stepIndex: number): Promise<void> {
    const stepButton = this.progressSteps.nth(stepIndex).locator('button');
    const isEnabled = await stepButton.isEnabled();
    if (isEnabled) {
      await stepButton.click();
      await this.page.waitForTimeout(300); // Allow for animation
    }
  }

  /**
   * Get the aria-label of a progress step
   */
  async getProgressStepAriaLabel(stepIndex: number): Promise<string | null> {
    const stepButton = this.progressSteps.nth(stepIndex).locator('button');
    return await stepButton.getAttribute('aria-label');
  }

  /**
   * Check if a progress step is enabled
   */
  async isProgressStepEnabled(stepIndex: number): Promise<boolean> {
    const stepButton = this.progressSteps.nth(stepIndex).locator('button');
    return await stepButton.isEnabled();
  }

  /**
   * Get progress percentage
   */
  async getProgressPercentage(): Promise<number> {
    const progressBar = this.page.locator('.absolute.top-5.left-0.h-0\\.5.bg-white');
    const style = await progressBar.getAttribute('style') || '';
    const match = style.match(/width:\s*([\d.]+)%/);
    return match ? parseFloat(match[1]) : 0;
  }

  // ===== STEP 0: ACCOUNT =====

  async fillAccountStep(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<void> {
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
  }

  async togglePasswordVisibility(): Promise<void> {
    await this.passwordVisibilityToggle.click();
    // Wait for Angular change detection
    await this.page.waitForTimeout(200);
  }

  async isPasswordVisible(): Promise<boolean> {
    // Wait a moment for the DOM to update
    await this.page.waitForTimeout(100);
    const type = await this.passwordInput.getAttribute('type');
    return type === 'text';
  }

  async getPasswordStrength(): Promise<string | null> {
    if (await this.passwordStrengthIndicator.isVisible()) {
      return await this.passwordStrengthIndicator.textContent();
    }
    return null;
  }

  // ===== STEP 1: COMPANY =====

  async fillCompanyStep(data: {
    companyName: string;
    tradingName?: string;
    registrationNumber: string;
    companyType: string;
    industrySector: string;
  }): Promise<void> {
    await this.companyNameInput.fill(data.companyName);
    if (data.tradingName) {
      await this.tradingNameInput.fill(data.tradingName);
    }
    await this.registrationNumberInput.fill(data.registrationNumber);
    await this.companyTypeSelect.selectOption(data.companyType);
    await this.industrySectorSelect.selectOption(data.industrySector);
  }

  // ===== STEP 2: COMPLIANCE =====

  async fillComplianceStep(data: {
    taxNumber: string;
    vatNumber?: string;
    uifReference: string;
    sdlNumber: string;
    payeReference: string;
  }): Promise<void> {
    await this.taxNumberInput.fill(data.taxNumber);
    if (data.vatNumber) {
      await this.vatNumberInput.fill(data.vatNumber);
    }
    await this.uifReferenceInput.fill(data.uifReference);
    await this.sdlNumberInput.fill(data.sdlNumber);
    await this.payeReferenceInput.fill(data.payeReference);
  }

  // ===== STEP 3: CONTACT =====

  async fillContactStep(data: {
    phone: string;
    companyEmail: string;
    streetAddress: string;
    city: string;
    province: string;
    postalCode: string;
  }): Promise<void> {
    await this.phoneInput.fill(data.phone);
    await this.companyEmailInput.fill(data.companyEmail);
    await this.streetAddressInput.fill(data.streetAddress);
    await this.cityInput.fill(data.city);
    await this.provinceSelect.selectOption(data.province);
    await this.postalCodeInput.fill(data.postalCode);
  }

  // ===== STEP 4: REVIEW =====

  async acceptTerms(): Promise<void> {
    await this.acceptTermsCheckbox.check();
    // Wait for Angular change detection
    await this.page.waitForTimeout(200);
  }

  async isTermsAccepted(): Promise<boolean> {
    return await this.acceptTermsCheckbox.isChecked();
  }

  // ===== NAVIGATION =====

  async clickNext(): Promise<void> {
    await this.nextButton.click();
    await this.page.waitForTimeout(300); // Allow for animation
  }

  async clickBack(): Promise<void> {
    await this.backButton.click();
    await this.page.waitForTimeout(300);
  }

  async clickCreateAccount(): Promise<void> {
    await this.createAccountButton.click();
  }

  async isNextButtonEnabled(): Promise<boolean> {
    // Wait a moment for Angular change detection
    await this.page.waitForTimeout(100);
    return await this.nextButton.isEnabled();
  }

  async isBackButtonEnabled(): Promise<boolean> {
    return await this.backButton.isEnabled();
  }

  async isCreateAccountButtonEnabled(): Promise<boolean> {
    // Wait a moment for Angular change detection
    await this.page.waitForTimeout(200);
    return await this.createAccountButton.isEnabled();
  }

  // ===== VALIDATION =====

  async getVisibleErrors(): Promise<string[]> {
    const errors = await this.errorMessages.all();
    const texts: string[] = [];
    for (const error of errors) {
      if (await error.isVisible()) {
        texts.push(await error.textContent() || '');
      }
    }
    return texts;
  }

  async hasValidationError(fieldId: string): Promise<boolean> {
    // Error messages are at the same level as input wrapper
    // Look for error text following the field using xpath
    const errorText = this.page.locator(`#${fieldId}`).locator('xpath=following-sibling::p[contains(@class,"sw-error-text")] | ancestor::div[1]/following-sibling::p[contains(@class,"sw-error-text")] | ancestor::div[2]/p[contains(@class,"sw-error-text")]').first();
    return await errorText.isVisible({ timeout: 1000 }).catch(() => false);
  }

  async getFieldValidationError(fieldId: string): Promise<string | null> {
    const errorText = this.page.locator(`#${fieldId}`).locator('xpath=following-sibling::p[contains(@class,"sw-error-text")] | ancestor::div[1]/following-sibling::p[contains(@class,"sw-error-text")] | ancestor::div[2]/p[contains(@class,"sw-error-text")]').first();
    if (await errorText.isVisible({ timeout: 1000 }).catch(() => false)) {
      return await errorText.textContent();
    }
    return null;
  }

  // ===== LOADING STATE =====

  async isLoading(): Promise<boolean> {
    return await this.loadingOverlay.isVisible().catch(() => false);
  }

  async waitForLoading(): Promise<void> {
    await this.loadingOverlay.waitFor({ state: 'visible', timeout: 5000 });
  }

  async waitForLoadingComplete(): Promise<void> {
    await this.loadingOverlay.waitFor({ state: 'hidden', timeout: 60000 });
  }

  // ===== EMAIL AVAILABILITY =====

  async waitForEmailCheck(): Promise<void> {
    // Wait for the loading spinner to appear and disappear
    const spinner = this.page.locator('#email').locator('..').locator('.animate-spin');
    try {
      await spinner.waitFor({ state: 'visible', timeout: 3000 });
      await spinner.waitFor({ state: 'hidden', timeout: 10000 });
    } catch {
      // Spinner may not appear if email is invalid
    }
  }

  async isEmailAvailable(): Promise<boolean | null> {
    const successText = this.page.locator('text=Email is available');
    const takenText = this.page.locator('text=Email is already registered, text=Email is taken');

    if (await successText.isVisible().catch(() => false)) {
      return true;
    }
    if (await takenText.isVisible().catch(() => false)) {
      return false;
    }
    return null;
  }

  // ===== REGISTRATION NUMBER AVAILABILITY =====

  async waitForRegistrationCheck(): Promise<void> {
    const spinner = this.page.locator('#registrationNumber').locator('..').locator('.animate-spin');
    try {
      await spinner.waitFor({ state: 'visible', timeout: 3000 });
      await spinner.waitFor({ state: 'hidden', timeout: 10000 });
    } catch {
      // Spinner may not appear
    }
  }

  async isRegistrationNumberAvailable(): Promise<boolean | null> {
    const successText = this.page.locator('text=Registration number is available');
    const takenText = this.page.locator('text=Registration number is already registered, text=Registration number is taken');

    if (await successText.isVisible().catch(() => false)) {
      return true;
    }
    if (await takenText.isVisible().catch(() => false)) {
      return false;
    }
    return null;
  }

  // ===== REVIEW STEP HELPERS =====

  async getReviewSectionData(sectionTitle: string): Promise<Record<string, string>> {
    const section = this.page.locator(`h3:has-text("${sectionTitle}")`).locator('xpath=..');
    const items = await section.locator('.grid > div').all();

    const data: Record<string, string> = {};
    for (const item of items) {
      const label = await item.locator('.text-neutral-500').textContent();
      const value = await item.locator('.font-medium').textContent();
      if (label && value) {
        data[label.trim()] = value.trim();
      }
    }
    return data;
  }

  // ===== COMPLETE FLOW HELPER =====

  async completeSignupFlow(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName: string;
    tradingName?: string;
    registrationNumber: string;
    companyType: string;
    industrySector: string;
    taxNumber: string;
    vatNumber?: string;
    uifReference: string;
    sdlNumber: string;
    payeReference: string;
    phone: string;
    companyEmail: string;
    streetAddress: string;
    city: string;
    province: string;
    postalCode: string;
  }): Promise<void> {
    // Step 0: Account
    await this.fillAccountStep({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName
    });
    await this.clickNext();

    // Step 1: Company
    await this.fillCompanyStep({
      companyName: data.companyName,
      tradingName: data.tradingName,
      registrationNumber: data.registrationNumber,
      companyType: data.companyType,
      industrySector: data.industrySector
    });
    await this.clickNext();

    // Step 2: Compliance
    await this.fillComplianceStep({
      taxNumber: data.taxNumber,
      vatNumber: data.vatNumber,
      uifReference: data.uifReference,
      sdlNumber: data.sdlNumber,
      payeReference: data.payeReference
    });
    await this.clickNext();

    // Step 3: Contact
    await this.fillContactStep({
      phone: data.phone,
      companyEmail: data.companyEmail,
      streetAddress: data.streetAddress,
      city: data.city,
      province: data.province,
      postalCode: data.postalCode
    });
    await this.clickNext();

    // Step 4: Review - do NOT auto-accept terms so tests can verify the checkbox behavior
  }
}

/**
 * Page Object Model for the Signup Success page
 */
export class SignupSuccessPage {
  readonly page: Page;

  readonly successIcon: Locator;
  readonly title: Locator;
  readonly subtitle: Locator;
  readonly emailDisplay: Locator;
  readonly subdomainDisplay: Locator;
  readonly resendButton: Locator;
  readonly goToLoginButton: Locator;
  readonly backToHomeLink: Locator;
  readonly cooldownText: Locator;

  constructor(page: Page) {
    this.page = page;

    this.successIcon = page.locator('.material-icons:text("check_circle")');
    this.title = page.locator('h1');
    this.subtitle = page.locator('h1 + p');
    this.emailDisplay = page.locator('.bg-neutral-50 .font-medium, .bg-neutral-800 .font-medium');
    this.subdomainDisplay = page.locator('.font-mono.font-medium');
    this.resendButton = page.getByRole('button', { name: /Resend/ });
    this.goToLoginButton = page.getByRole('button', { name: /Go to Login/ });
    this.backToHomeLink = page.locator('a[href="/"]');
    this.cooldownText = page.locator('text=/Resend in \\d+ seconds/');
  }

  async goto(): Promise<void> {
    await this.page.goto('/signup/success');
    await this.page.waitForLoadState('networkidle');
  }

  async isOnSuccessPage(): Promise<boolean> {
    return this.page.url().includes('/signup/success');
  }

  async getDisplayedEmail(): Promise<string | null> {
    if (await this.emailDisplay.isVisible()) {
      return await this.emailDisplay.textContent();
    }
    return null;
  }

  async getDisplayedSubdomain(): Promise<string | null> {
    if (await this.subdomainDisplay.isVisible()) {
      return await this.subdomainDisplay.textContent();
    }
    return null;
  }

  async clickResendEmail(): Promise<void> {
    await this.resendButton.click();
  }

  async clickGoToLogin(): Promise<void> {
    await this.goToLoginButton.click();
  }

  async isResendButtonEnabled(): Promise<boolean> {
    return await this.resendButton.isEnabled();
  }

  async getCooldownSeconds(): Promise<number> {
    const text = await this.resendButton.textContent() || '';
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }
}
