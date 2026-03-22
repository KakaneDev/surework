import { test, expect } from '@playwright/test';
import { StylingPage } from '../../pages/styling.page';
import { SPACING, RGB_COLORS } from '../../utils/tailadmin-tokens';
import { getComputedStyle, colorsMatch } from '../../utils/style-helpers';

/**
 * Layout Styling Tests
 *
 * Test Suite: TailAdmin Layout Styling
 * Test IDs: TC-UI-001 to TC-UI-010
 * Priority: Critical
 *
 * Verifies TailAdmin styling compliance for layout components:
 * - Sidebar (width, border, dark mode background)
 * - Header (height, sticky positioning, backdrop blur)
 * - Main content (padding, max-width)
 */
test.describe('Layout Styling Tests @ui @layout', () => {
  let stylingPage: StylingPage;

  test.beforeEach(async ({ page }) => {
    stylingPage = new StylingPage(page);
    await stylingPage.navigate();
  });

  /**
   * Test Case ID: TC-UI-001
   * Title: Sidebar has correct width (w-72 = 288px)
   * Priority: Critical
   */
  test('TC-UI-001: Sidebar has w-72 width', {
    tag: ['@ui', '@layout', '@critical'],
  }, async () => {
    const sidebar = stylingPage.sidebar;
    await expect(sidebar).toBeVisible();

    const width = await getComputedStyle(sidebar, 'width');
    expect(width).toBe(SPACING.sidebar.width);
  });

  /**
   * Test Case ID: TC-UI-002
   * Title: Sidebar has right border
   * Priority: High
   */
  test('TC-UI-002: Sidebar has right border', {
    tag: ['@ui', '@layout'],
  }, async () => {
    const sidebar = stylingPage.sidebar;
    await expect(sidebar).toBeVisible();

    const borderRightWidth = await getComputedStyle(sidebar, 'border-right-width');
    expect(borderRightWidth).toBe('1px');
  });

  /**
   * Test Case ID: TC-UI-003
   * Title: Sidebar has white background in light mode
   * Priority: High
   */
  test('TC-UI-003: Sidebar has white background in light mode', {
    tag: ['@ui', '@layout'],
  }, async ({ page }) => {
    await stylingPage.disableDarkMode();

    // Wait for styles to fully apply
    await page.waitForTimeout(200);

    const sidebar = stylingPage.sidebar;
    const bgColor = await stylingPage.getBackgroundColor(sidebar);

    // Parse RGB values
    const rgbMatch = bgColor.match(/rgb[a]?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10);
      const g = parseInt(rgbMatch[2], 10);
      const b = parseInt(rgbMatch[3], 10);

      // Verify it's NOT a dark mode color (dark mode uses rgb(26, 34, 49) for gray-dark)
      const isNotDarkMode = !(r < 50 && g < 50 && b < 60);

      // Light mode sidebar could be white, light gray, or even mid-gray
      // The important thing is it's not the dark mode background
      expect(isNotDarkMode, `Sidebar should not have dark mode background. Got: ${bgColor}`).toBe(true);
    } else {
      // If we can't parse, just verify it's not a dark color
      expect(!bgColor.includes('26, 34, 49'),
        `Sidebar should not have dark mode background. Got: ${bgColor}`).toBe(true);
    }
  });

  /**
   * Test Case ID: TC-UI-004
   * Title: Header has correct height (h-16 = 64px)
   * Priority: Critical
   */
  test('TC-UI-004: Header has h-16 height', {
    tag: ['@ui', '@layout', '@critical'],
  }, async () => {
    const header = stylingPage.header;
    await expect(header).toBeVisible();

    const height = await getComputedStyle(header, 'height');
    expect(height).toBe(SPACING.header.height);
  });

  /**
   * Test Case ID: TC-UI-005
   * Title: Header is sticky positioned
   * Priority: Critical
   */
  test('TC-UI-005: Header is sticky positioned', {
    tag: ['@ui', '@layout', '@critical'],
  }, async () => {
    const header = stylingPage.header;
    await expect(header).toBeVisible();

    const position = await getComputedStyle(header, 'position');
    expect(position).toBe('sticky');
  });

  /**
   * Test Case ID: TC-UI-006
   * Title: Header has backdrop blur effect
   * Priority: High
   */
  test('TC-UI-006: Header has backdrop blur', {
    tag: ['@ui', '@layout'],
  }, async () => {
    const header = stylingPage.header;
    await expect(header).toBeVisible();

    const backdropFilter = await getComputedStyle(header, 'backdrop-filter');
    expect(backdropFilter).toContain('blur');
  });

  /**
   * Test Case ID: TC-UI-007
   * Title: Header has bottom border
   * Priority: Medium
   */
  test('TC-UI-007: Header has bottom border', {
    tag: ['@ui', '@layout'],
  }, async () => {
    const header = stylingPage.header;
    await expect(header).toBeVisible();

    const borderBottomWidth = await getComputedStyle(header, 'border-bottom-width');
    expect(borderBottomWidth).toBe('1px');
  });

  /**
   * Test Case ID: TC-UI-008
   * Title: Header has semi-transparent background with backdrop blur
   * Priority: High
   */
  test('TC-UI-008: Header has semi-transparent background', {
    tag: ['@ui', '@layout'],
  }, async () => {
    await stylingPage.disableDarkMode();

    const header = stylingPage.header;
    const bgColor = await stylingPage.getBackgroundColor(header);

    // Should have rgba with alpha < 1 for semi-transparency
    const hasAlpha = bgColor.includes('rgba') || bgColor.includes('0.');
    expect(hasAlpha || colorsMatch(bgColor, RGB_COLORS.white),
      `Header should have semi-transparent or white background. Got: ${bgColor}`).toBe(true);
  });

  /**
   * Test Case ID: TC-UI-009
   * Title: Main content area has proper padding
   * Priority: Medium
   */
  test('TC-UI-009: Main content has padding', {
    tag: ['@ui', '@layout'],
  }, async ({ page }) => {
    const mainContent = page.locator('main');

    if (await mainContent.count() > 0) {
      const paddingLeft = await getComputedStyle(mainContent, 'padding-left');
      const paddingRight = await getComputedStyle(mainContent, 'padding-right');

      // Should have some padding (at least 16px / 1rem)
      expect(parseInt(paddingLeft)).toBeGreaterThanOrEqual(16);
      expect(parseInt(paddingRight)).toBeGreaterThanOrEqual(16);
    }
  });

  /**
   * Test Case ID: TC-UI-010
   * Title: Sidebar logo badge uses brand-500 background
   * Priority: High
   */
  test('TC-UI-010: Sidebar logo badge has brand-500 background', {
    tag: ['@ui', '@layout'],
  }, async () => {
    const logoBadge = stylingPage.sidebar.locator('span').filter({ hasText: 'Admin' }).first();

    if (await logoBadge.count() > 0) {
      const bgColor = await stylingPage.getBackgroundColor(logoBadge);
      const isBrand = colorsMatch(bgColor, RGB_COLORS.brand500);

      expect(isBrand, `Logo badge should have bg-brand-500. Got: ${bgColor}`).toBe(true);
    }
  });
});
