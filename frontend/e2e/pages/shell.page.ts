import { Page, Locator, expect } from '@playwright/test';

/**
 * Shell/Layout Page Object Model
 * Handles navigation and common layout elements
 */
export class ShellPage {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly userMenu: Locator;
  readonly toggleMenuButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('nav[aria-label="Main navigation"], aside, .sidebar');
    this.userMenu = page.locator('[data-testid="user-menu"], .user-menu');
    this.toggleMenuButton = page.locator('button[aria-label*="menu"], button[aria-label*="Toggle"]');
  }

  async waitForShellLoaded(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    // Wait for main content to be visible
    await this.page.waitForSelector('main, .main-content, [role="main"]', { timeout: 10000 });
  }

  /**
   * Get navigation link text by navigation key
   */
  async getNavLinkText(navKey: string): Promise<string> {
    const link = this.page.locator(`a[href*="${navKey}"], [routerLink*="${navKey}"]`).first();
    return await link.textContent() || '';
  }

  /**
   * Get all visible navigation labels
   */
  async getVisibleNavLabels(): Promise<string[]> {
    const navLinks = this.page.locator('nav a span, .nav-item span, .mat-mdc-list-item-title');
    const count = await navLinks.count();
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await navLinks.nth(i).textContent();
      if (text && text.trim()) {
        labels.push(text.trim());
      }
    }
    return labels;
  }

  /**
   * Navigate to a specific section via sidebar
   */
  async navigateTo(path: string): Promise<void> {
    await this.page.goto(path);
    await this.waitForShellLoaded();
  }

  /**
   * Get page heading text
   */
  async getPageHeading(): Promise<string> {
    const heading = this.page.locator('h1, h2').first();
    return await heading.textContent() || '';
  }

  /**
   * Get all button texts on the current page
   */
  async getButtonTexts(): Promise<string[]> {
    const buttons = this.page.locator('button:visible');
    const count = await buttons.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await buttons.nth(i).textContent();
      if (text && text.trim()) {
        texts.push(text.trim());
      }
    }
    return texts;
  }

  /**
   * Check if text contains translation key pattern (indicates untranslated)
   */
  isUntranslatedKey(text: string): boolean {
    // Translation keys typically contain dots and are lowercase
    return /^[a-z]+\.[a-z]+(\.[a-z]+)*$/.test(text.trim());
  }
}
