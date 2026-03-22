import { Page, Locator, expect } from '@playwright/test';

/**
 * Base Page Object
 *
 * Provides common methods and utilities for all page objects.
 * All page objects should extend this class.
 */
export abstract class BasePage {
  constructor(protected page: Page) {}

  /**
   * Wait for the page to fully load
   */
  protected async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Safely click an element after waiting for it to be visible
   */
  protected async safeClick(locator: Locator, options?: { timeout?: number }): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: options?.timeout ?? 10000 });
    await locator.click();
  }

  /**
   * Safely type text into an input after waiting for it to be visible
   */
  protected async safeType(locator: Locator, text: string): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.clear();
    await locator.fill(text);
  }

  /**
   * Assert that an element is visible
   */
  protected async assertVisible(locator: Locator, message?: string): Promise<void> {
    await expect(locator, message).toBeVisible();
  }

  /**
   * Assert that an element is hidden
   */
  protected async assertHidden(locator: Locator, message?: string): Promise<void> {
    await expect(locator, message).toBeHidden();
  }

  /**
   * Wait for URL to match a pattern
   */
  protected async waitForUrl(urlPattern: string | RegExp): Promise<void> {
    await this.page.waitForURL(urlPattern);
  }

  /**
   * Capture a screenshot for debugging or reporting
   */
  protected async captureScreenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `tests/reports/screenshots/${name}-${Date.now()}.png`,
      fullPage: true,
    });
  }

  /**
   * Get text content of an element
   */
  protected async getText(locator: Locator): Promise<string> {
    await locator.waitFor({ state: 'visible' });
    return (await locator.textContent()) ?? '';
  }

  /**
   * Check if an element exists on the page
   */
  protected async exists(locator: Locator): Promise<boolean> {
    return (await locator.count()) > 0;
  }

  /**
   * Wait for an element to disappear (useful for loaders)
   */
  protected async waitForElementToDisappear(locator: Locator, timeout = 30000): Promise<void> {
    await locator.waitFor({ state: 'hidden', timeout });
  }

  /**
   * Select an option from a dropdown
   */
  protected async selectOption(locator: Locator, value: string): Promise<void> {
    await locator.selectOption(value);
  }

  /**
   * Get the current page title
   */
  async getPageTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Get the current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }
}
