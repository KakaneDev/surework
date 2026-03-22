import { Page, expect } from '@playwright/test';

/**
 * Utility class for checking translation completeness
 */
export class TranslationChecker {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Check if text appears to be an untranslated key
   * Translation keys typically look like: "nav.dashboard" or "common.save"
   */
  isTranslationKey(text: string): boolean {
    if (!text || text.trim().length === 0) return false;

    // Pattern for translation keys: lowercase words separated by dots
    const keyPattern = /^[a-z]+(\.[a-zA-Z]+)+$/;
    return keyPattern.test(text.trim());
  }

  /**
   * Find all potential untranslated keys on the current page
   */
  async findUntranslatedKeys(): Promise<string[]> {
    const allText = await this.page.evaluate(() => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
      );

      const texts: string[] = [];
      let node;
      while ((node = walker.nextNode())) {
        const text = node.textContent?.trim();
        if (text && text.length > 0) {
          texts.push(text);
        }
      }
      return texts;
    });

    return allText.filter(text => this.isTranslationKey(text));
  }

  /**
   * Verify no untranslated keys exist on the current page
   */
  async verifyNoUntranslatedKeys(): Promise<void> {
    const untranslatedKeys = await this.findUntranslatedKeys();

    if (untranslatedKeys.length > 0) {
      console.log('Found potential untranslated keys:', untranslatedKeys);
    }

    expect(untranslatedKeys).toHaveLength(0);
  }

  /**
   * Get all visible text content from the page
   */
  async getAllVisibleText(): Promise<string[]> {
    return this.page.evaluate(() => {
      const elements = document.querySelectorAll('*:not(script):not(style)');
      const texts: string[] = [];

      elements.forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden') {
          const text = el.textContent?.trim();
          if (text && text.length > 0 && text.length < 500) {
            texts.push(text);
          }
        }
      });

      return Array.from(new Set(texts));
    });
  }

  /**
   * Check if the page contains expected translations for a language
   */
  async verifyLanguageContent(
    expectedWords: string[],
    minMatchCount: number = 1
  ): Promise<{ found: string[]; missing: string[] }> {
    const pageContent = await this.page.textContent('body') || '';

    const found: string[] = [];
    const missing: string[] = [];

    for (const word of expectedWords) {
      if (pageContent.includes(word)) {
        found.push(word);
      } else {
        missing.push(word);
      }
    }

    expect(found.length).toBeGreaterThanOrEqual(minMatchCount);

    return { found, missing };
  }

  /**
   * Take a screenshot for translation verification
   */
  async takeTranslationScreenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true
    });
  }
}

/**
 * Expected Afrikaans translations for common UI elements
 */
export const AFRIKAANS_COMMON = {
  save: 'Stoor',
  cancel: 'Kanselleer',
  delete: 'Verwyder',
  edit: 'Wysig',
  add: 'Voeg By',
  create: 'Skep',
  search: 'Soek',
  loading: 'Laai tans...',
  submit: 'Indien',
  close: 'Maak Toe',
  view: 'Bekyk',
  actions: 'Aksies',
  status: 'Status',
  name: 'Naam',
  email: 'E-pos',
  dashboard: 'Kontroleskerm',
  employees: 'Werknemers',
  settings: 'Instellings'
};

/**
 * Expected isiZulu translations for common UI elements
 */
export const ISIZULU_COMMON = {
  save: 'Londoloza',
  cancel: 'Khansela',
  delete: 'Susa',
  edit: 'Hlela',
  add: 'Engeza',
  create: 'Dala',
  search: 'Sesha',
  loading: 'Iyalayisha...',
  submit: 'Thumela',
  close: 'Vala',
  view: 'Buka',
  actions: 'Izenzo',
  status: 'Isimo',
  name: 'Igama',
  email: 'I-imeyili',
  dashboard: 'Ibhodi Elawulayo',
  employees: 'Abasebenzi',
  settings: 'Izilungiselelo'
};
