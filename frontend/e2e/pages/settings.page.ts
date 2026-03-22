import { Page, Locator, expect } from '@playwright/test';

/**
 * Settings Page Object Model
 * Handles settings and appearance/language selection
 */
export class SettingsPage {
  readonly page: Page;
  readonly appearanceSection: Locator;
  readonly languageButtons: Locator;
  readonly themeButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    this.appearanceSection = page.locator('[data-testid="appearance-section"], .appearance-section');
    this.languageButtons = page.locator('button:has-text("English"), button:has-text("Afrikaans"), button:has-text("isiZulu")');
    this.themeButtons = page.locator('button:has-text("Light"), button:has-text("Dark"), button:has-text("System")');
  }

  async gotoAppearance(): Promise<void> {
    await this.page.goto('/settings/appearance');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Select a language by clicking the language button
   */
  async selectLanguage(language: 'English' | 'Afrikaans' | 'isiZulu'): Promise<void> {
    // Find the button that contains the language name
    const langButton = this.page.locator(`button:has-text("${language}")`).first();
    await langButton.click();
    // Wait for language change to propagate
    await this.page.waitForTimeout(500);
  }

  /**
   * Get the currently selected language
   */
  async getCurrentLanguage(): Promise<string> {
    // Look for the button with check_circle icon (selected state)
    const selectedButton = this.page.locator('button:has(.material-icons:text("check_circle"))').first();
    const buttonText = await selectedButton.textContent();

    if (buttonText?.includes('English')) return 'en';
    if (buttonText?.includes('Afrikaans')) return 'af';
    if (buttonText?.includes('isiZulu')) return 'zu';

    return 'en'; // default
  }

  /**
   * Get all visible setting section titles
   */
  async getSectionTitles(): Promise<string[]> {
    const titles = this.page.locator('h2');
    const count = await titles.count();
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await titles.nth(i).textContent();
      if (text) result.push(text.trim());
    }
    return result;
  }

  /**
   * Verify language was changed by checking HTML lang attribute
   */
  async verifyHtmlLangAttribute(expectedLang: string): Promise<void> {
    const htmlLang = await this.page.locator('html').getAttribute('lang');
    expect(htmlLang).toBe(expectedLang);
  }

  /**
   * Verify language is persisted in localStorage
   */
  async verifyLanguageInStorage(expectedLang: string): Promise<void> {
    const storedLang = await this.page.evaluate(() => localStorage.getItem('sw-language'));
    expect(storedLang).toBe(expectedLang);
  }
}
