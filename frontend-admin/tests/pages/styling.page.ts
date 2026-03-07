import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import {
  getComputedStyle,
  getComputedStyles,
  assertBackgroundColor,
  assertTextColor,
  assertBorderColor,
  assertBorderRadius,
  assertHasShadow,
  assertNoShadow,
  assertWidth,
  assertHeight,
  assertHasBackdropBlur,
  isDarkMode,
  enableDarkMode,
  disableDarkMode,
  toggleDarkMode,
  colorsMatch,
} from '../utils/style-helpers';
import { RGB_COLORS, BORDER_RADIUS, SPACING } from '../utils/tailadmin-tokens';

/**
 * Styling Page Object
 *
 * Provides methods for testing CSS property assertions on UI components
 */
export class StylingPage extends BasePage {
  // Layout selectors
  readonly sidebar = this.page.locator('aside');
  readonly header = this.page.locator('header');
  readonly mainContent = this.page.locator('main');

  // Component selectors
  readonly primaryButtons = this.page.locator('button').filter({ hasText: /save|submit|create|add/i });
  readonly cards = this.page.locator('[class*="rounded-xl"][class*="border"]');
  readonly tables = this.page.locator('table').locator('..');
  readonly badges = this.page.locator('[class*="rounded-full"][class*="px-"]');
  readonly dropdowns = this.page.locator('[role="menu"]');
  readonly modals = this.page.locator('[role="dialog"]');
  readonly inputs = this.page.locator('input[type="text"], input[type="email"], input[type="password"]');
  readonly selects = this.page.locator('select');

  // Dark mode toggle
  readonly darkModeToggle = this.page.locator('button').filter({ has: this.page.locator('svg path[d*="M12 3v1"]') }).first();

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to dashboard (main styling test page)
   */
  async navigate(): Promise<void> {
    await this.page.goto('/dashboard');
    await this.waitForPageLoad();
  }

  // =====================
  // CSS Property Getters
  // =====================

  async getComputedStyle(locator: Locator, property: string): Promise<string> {
    return getComputedStyle(locator, property);
  }

  async getComputedStyles(locator: Locator, properties: string[]): Promise<Record<string, string>> {
    return getComputedStyles(locator, properties);
  }

  async getBorderRadius(locator: Locator): Promise<string> {
    return getComputedStyle(locator, 'border-radius');
  }

  async getBoxShadow(locator: Locator): Promise<string> {
    return getComputedStyle(locator, 'box-shadow');
  }

  async getBackgroundColor(locator: Locator): Promise<string> {
    return getComputedStyle(locator, 'background-color');
  }

  async getTextColor(locator: Locator): Promise<string> {
    return getComputedStyle(locator, 'color');
  }

  async getBorderColor(locator: Locator): Promise<string> {
    return getComputedStyle(locator, 'border-color');
  }

  async getWidth(locator: Locator): Promise<string> {
    return getComputedStyle(locator, 'width');
  }

  async getHeight(locator: Locator): Promise<string> {
    return getComputedStyle(locator, 'height');
  }

  // =====================
  // Dark Mode Methods
  // =====================

  async isDarkMode(): Promise<boolean> {
    return this.page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });
  }

  async enableDarkMode(): Promise<void> {
    await this.page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    });
    // Wait for styles to apply
    await this.page.waitForTimeout(100);
  }

  async disableDarkMode(): Promise<void> {
    await this.page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    });
    // Wait for styles to apply
    await this.page.waitForTimeout(100);
  }

  async toggleDarkMode(): Promise<void> {
    await this.page.evaluate(() => {
      document.documentElement.classList.toggle('dark');
      const isDark = document.documentElement.classList.contains('dark');
      localStorage.setItem('darkMode', isDark ? 'true' : 'false');
    });
    // Wait for styles to apply
    await this.page.waitForTimeout(100);
  }

  // =====================
  // Assertion Methods
  // =====================

  async assertRoundedXl(locator: Locator): Promise<void> {
    await assertBorderRadius(locator, 'xl');
  }

  async assertRounded2xl(locator: Locator): Promise<void> {
    await assertBorderRadius(locator, '2xl');
  }

  async assertHasShadow(locator: Locator): Promise<void> {
    await assertHasShadow(locator);
  }

  async assertNoShadow(locator: Locator): Promise<void> {
    await assertNoShadow(locator);
  }

  async assertBrandBackgroundColor(locator: Locator): Promise<void> {
    await assertBackgroundColor(locator, RGB_COLORS.brand500);
  }

  async assertBrandTextColor(locator: Locator): Promise<void> {
    await assertTextColor(locator, RGB_COLORS.brand500);
  }

  async assertWhiteBackground(locator: Locator): Promise<void> {
    await assertBackgroundColor(locator, RGB_COLORS.white);
  }

  // =====================
  // Layout Assertions
  // =====================

  async assertSidebarWidth(): Promise<void> {
    await assertWidth(this.sidebar, SPACING.sidebar.width);
  }

  async assertHeaderHeight(): Promise<void> {
    await assertHeight(this.header, SPACING.header.height);
  }

  async assertHeaderHasBackdropBlur(): Promise<void> {
    await assertHasBackdropBlur(this.header);
  }

  async assertSidebarDarkBackground(): Promise<void> {
    const bgColor = await this.getBackgroundColor(this.sidebar);
    const isGrayDark = colorsMatch(bgColor, RGB_COLORS.grayDark);
    expect(isGrayDark, `Sidebar should have dark:bg-gray-dark background. Got: ${bgColor}`).toBe(true);
  }

  // =====================
  // Component Assertions
  // =====================

  async assertPrimaryButtonBrandColor(): Promise<void> {
    const button = this.primaryButtons.first();
    if (await button.count() > 0) {
      const bgColor = await this.getBackgroundColor(button);
      const isBrand = colorsMatch(bgColor, RGB_COLORS.brand500);
      expect(isBrand, `Primary button should have bg-brand-500. Got: ${bgColor}`).toBe(true);
    }
  }

  async assertCardHasShadow(): Promise<void> {
    const card = this.cards.first();
    if (await card.count() > 0) {
      await this.assertHasShadow(card);
    }
  }

  async assertCardRoundedXl(): Promise<void> {
    const card = this.cards.first();
    if (await card.count() > 0) {
      await this.assertRoundedXl(card);
    }
  }

  async assertTableRoundedXl(): Promise<void> {
    const table = this.tables.first();
    if (await table.count() > 0) {
      await this.assertRoundedXl(table);
    }
  }

  async assertTableHasShadow(): Promise<void> {
    const table = this.tables.first();
    if (await table.count() > 0) {
      await this.assertHasShadow(table);
    }
  }

  async assertSuccessBadgeColor(): Promise<void> {
    const successBadge = this.badges.filter({ hasText: /active|success|paid|completed/i }).first();
    if (await successBadge.count() > 0) {
      const bgColor = await this.getBackgroundColor(successBadge);
      const isSuccess = colorsMatch(bgColor, RGB_COLORS.success50);
      expect(isSuccess, `Success badge should have bg-success-50. Got: ${bgColor}`).toBe(true);
    }
  }

  async assertInputRoundedXl(): Promise<void> {
    const input = this.inputs.first();
    if (await input.count() > 0) {
      await this.assertRoundedXl(input);
    }
  }

  async assertInputHasShadow(): Promise<void> {
    const input = this.inputs.first();
    if (await input.count() > 0) {
      await this.assertHasShadow(input);
    }
  }

  async assertDropdownRoundedXl(): Promise<void> {
    const dropdown = this.dropdowns.first();
    if (await dropdown.count() > 0) {
      await this.assertRoundedXl(dropdown);
    }
  }

  async assertDropdownHasShadow(): Promise<void> {
    const dropdown = this.dropdowns.first();
    if (await dropdown.count() > 0) {
      await this.assertHasShadow(dropdown);
    }
  }

  async assertModalRounded2xl(): Promise<void> {
    const modal = this.modals.first();
    if (await modal.count() > 0) {
      await this.assertRounded2xl(modal);
    }
  }

  // =====================
  // Active State Assertions
  // =====================

  async assertActiveSidebarLinkBrandBackground(): Promise<void> {
    const activeLink = this.sidebar.locator('a.bg-brand-50, a[class*="bg-brand"]').first();
    if (await activeLink.count() > 0) {
      const bgColor = await this.getBackgroundColor(activeLink);
      const isBrand = colorsMatch(bgColor, RGB_COLORS.brand50);
      expect(isBrand, `Active sidebar link should have bg-brand-50. Got: ${bgColor}`).toBe(true);
    }
  }

  async assertActiveSidebarLinkBrandTextColor(): Promise<void> {
    const activeLink = this.sidebar.locator('a.text-brand-600, a[class*="text-brand"]').first();
    if (await activeLink.count() > 0) {
      const textColor = await this.getTextColor(activeLink);
      // Check for brand-600 text color
      const isBrandText = colorsMatch(textColor, 'rgb(68, 76, 231)'); // brand-600
      expect(isBrandText, `Active sidebar link should have text-brand-600. Got: ${textColor}`).toBe(true);
    }
  }

  // =====================
  // User Avatar Assertions
  // =====================

  async assertUserAvatarBrandBackground(): Promise<void> {
    const avatar = this.header.locator('.rounded-full').filter({ hasText: /[A-Z]{2}/ }).first();
    if (await avatar.count() > 0) {
      const bgColor = await this.getBackgroundColor(avatar);
      const isBrand = colorsMatch(bgColor, RGB_COLORS.brand50);
      expect(isBrand, `User avatar should have bg-brand-50. Got: ${bgColor}`).toBe(true);
    }
  }
}
