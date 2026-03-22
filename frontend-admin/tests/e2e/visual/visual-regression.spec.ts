import { test, expect } from '@playwright/test';
import { StylingPage } from '../../pages/styling.page';

/**
 * Visual Regression Tests
 *
 * Test Suite: TailAdmin Visual Regression
 * Test IDs: TC-VIS-001 to TC-VIS-015
 * Priority: Critical
 *
 * Visual regression tests using Playwright screenshots to ensure
 * TailAdmin styling consistency across updates.
 *
 * Run with: npm run e2e -- --grep "@visual" --update-snapshots
 * to create/update baseline screenshots.
 */
test.describe('Visual Regression Tests @visual', () => {
  let stylingPage: StylingPage;

  test.beforeEach(async ({ page }) => {
    stylingPage = new StylingPage(page);
  });

  /**
   * Test Case ID: TC-VIS-001
   * Title: Dashboard page visual regression (light mode)
   * Priority: Critical
   */
  test('TC-VIS-001: Dashboard light mode', {
    tag: ['@visual', '@critical'],
  }, async ({ page }) => {
    await stylingPage.navigate();
    await stylingPage.disableDarkMode();
    await page.waitForTimeout(500); // Wait for animations

    await expect(page).toHaveScreenshot('dashboard-light.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  /**
   * Test Case ID: TC-VIS-002
   * Title: Dashboard page visual regression (dark mode)
   * Priority: Critical
   */
  test('TC-VIS-002: Dashboard dark mode', {
    tag: ['@visual', '@critical'],
  }, async ({ page }) => {
    await stylingPage.navigate();
    await stylingPage.enableDarkMode();
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('dashboard-dark.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  /**
   * Test Case ID: TC-VIS-003
   * Title: Sidebar visual regression (light mode)
   * Priority: High
   */
  test('TC-VIS-003: Sidebar light mode', {
    tag: ['@visual'],
  }, async ({ page }) => {
    await stylingPage.navigate();
    await stylingPage.disableDarkMode();
    await page.waitForTimeout(500);

    await expect(stylingPage.sidebar).toHaveScreenshot('sidebar-light.png', {
      animations: 'disabled',
    });
  });

  /**
   * Test Case ID: TC-VIS-004
   * Title: Sidebar visual regression (dark mode)
   * Priority: High
   */
  test('TC-VIS-004: Sidebar dark mode', {
    tag: ['@visual'],
  }, async ({ page }) => {
    await stylingPage.navigate();
    await stylingPage.enableDarkMode();
    await page.waitForTimeout(500);

    await expect(stylingPage.sidebar).toHaveScreenshot('sidebar-dark.png', {
      animations: 'disabled',
    });
  });

  /**
   * Test Case ID: TC-VIS-005
   * Title: Header visual regression (light mode)
   * Priority: High
   */
  test('TC-VIS-005: Header light mode', {
    tag: ['@visual'],
  }, async ({ page }) => {
    await stylingPage.navigate();
    await stylingPage.disableDarkMode();
    await page.waitForTimeout(500);

    await expect(stylingPage.header).toHaveScreenshot('header-light.png', {
      animations: 'disabled',
    });
  });

  /**
   * Test Case ID: TC-VIS-006
   * Title: Header visual regression (dark mode)
   * Priority: High
   */
  test('TC-VIS-006: Header dark mode', {
    tag: ['@visual'],
  }, async ({ page }) => {
    await stylingPage.navigate();
    await stylingPage.enableDarkMode();
    await page.waitForTimeout(500);

    await expect(stylingPage.header).toHaveScreenshot('header-dark.png', {
      animations: 'disabled',
    });
  });

  /**
   * Test Case ID: TC-VIS-007
   * Title: Card component visual regression
   * Priority: High
   */
  test('TC-VIS-007: Card component', {
    tag: ['@visual'],
  }, async ({ page }) => {
    await stylingPage.navigate();
    await stylingPage.disableDarkMode();
    await page.waitForTimeout(500);

    const card = page.locator('[class*="rounded-xl"][class*="shadow-card"]').first();
    if (await card.count() > 0) {
      await expect(card).toHaveScreenshot('card-light.png', {
        animations: 'disabled',
      });
    }
  });

  /**
   * Test Case ID: TC-VIS-008
   * Title: Button components visual regression
   * Priority: High
   */
  test('TC-VIS-008: Button components', {
    tag: ['@visual'],
  }, async ({ page }) => {
    await stylingPage.navigate();
    await stylingPage.disableDarkMode();
    await page.waitForTimeout(500);

    const primaryButton = page.locator('button.bg-brand-500, button[class*="bg-brand"]').first();
    if (await primaryButton.count() > 0) {
      await expect(primaryButton).toHaveScreenshot('button-primary.png', {
        animations: 'disabled',
      });
    }
  });

  /**
   * Test Case ID: TC-VIS-009
   * Title: Table component visual regression
   * Priority: High
   */
  test('TC-VIS-009: Table component', {
    tag: ['@visual'],
  }, async ({ page }) => {
    await stylingPage.navigate();
    await stylingPage.disableDarkMode();
    await page.waitForTimeout(500);

    const table = page.locator('table').locator('..').first();
    if (await table.count() > 0) {
      await expect(table).toHaveScreenshot('table-light.png', {
        animations: 'disabled',
      });
    }
  });

  /**
   * Test Case ID: TC-VIS-010
   * Title: Badge components visual regression
   * Priority: Medium
   */
  test('TC-VIS-010: Badge components', {
    tag: ['@visual'],
  }, async ({ page }) => {
    await stylingPage.navigate();
    await stylingPage.disableDarkMode();
    await page.waitForTimeout(500);

    // Capture any visible badges
    const badges = page.locator('[class*="rounded-full"][class*="px-2"]');
    if (await badges.count() > 0) {
      await expect(badges.first()).toHaveScreenshot('badge-example.png', {
        animations: 'disabled',
      });
    }
  });

  /**
   * Test Case ID: TC-VIS-011
   * Title: Dropdown visual regression
   * Priority: Medium
   */
  test('TC-VIS-011: Dropdown component', {
    tag: ['@visual'],
  }, async ({ page }) => {
    await stylingPage.navigate();
    await stylingPage.disableDarkMode();

    // Open user dropdown
    const userMenu = page.locator('header').locator('.rounded-full').last();
    if (await userMenu.count() > 0) {
      await userMenu.click();
      await page.waitForTimeout(500);

      const dropdown = page.locator('[role="menu"]').first();
      if (await dropdown.count() > 0) {
        await expect(dropdown).toHaveScreenshot('dropdown-light.png', {
          animations: 'disabled',
        });
      }
    }
  });

  /**
   * Test Case ID: TC-VIS-012
   * Title: Input field visual regression
   * Priority: Medium
   */
  test('TC-VIS-012: Input field', {
    tag: ['@visual'],
  }, async ({ page }) => {
    await stylingPage.navigate();
    await stylingPage.disableDarkMode();
    await page.waitForTimeout(500);

    const input = page.locator('input[type="text"], input[type="search"]').first();
    if (await input.count() > 0) {
      await expect(input).toHaveScreenshot('input-light.png', {
        animations: 'disabled',
      });
    }
  });

  /**
   * Test Case ID: TC-VIS-013
   * Title: Mobile dashboard visual regression
   * Priority: Critical
   */
  test('TC-VIS-013: Mobile dashboard', {
    tag: ['@visual', '@critical'],
  }, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 }, // iPhone 12 dimensions
    });
    const page = await context.newPage();

    const stylingPage = new StylingPage(page);
    await stylingPage.navigate();
    await stylingPage.disableDarkMode();
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });

    await context.close();
  });

  /**
   * Test Case ID: TC-VIS-014
   * Title: Mobile sidebar open visual regression
   * Priority: High
   */
  test('TC-VIS-014: Mobile sidebar open', {
    tag: ['@visual'],
  }, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();

    const stylingPage = new StylingPage(page);
    await stylingPage.navigate();
    await stylingPage.disableDarkMode();

    // Open sidebar - find hamburger button with flexible selector
    let hamburger = page.locator('header button').filter({
      has: page.locator('svg')
    }).first();

    if (await hamburger.count() === 0) {
      hamburger = page.locator('header button').first();
    }

    if (await hamburger.count() > 0) {
      await hamburger.click();
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('sidebar-mobile-open.png', {
        fullPage: true,
        animations: 'disabled',
      });
    }

    await context.close();
  });

  /**
   * Test Case ID: TC-VIS-015
   * Title: Tablet dashboard visual regression
   * Priority: Medium
   */
  test('TC-VIS-015: Tablet dashboard', {
    tag: ['@visual'],
  }, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 }, // iPad dimensions
    });
    const page = await context.newPage();

    const stylingPage = new StylingPage(page);
    await stylingPage.navigate();
    await stylingPage.disableDarkMode();
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('dashboard-tablet.png', {
      fullPage: true,
      animations: 'disabled',
    });

    await context.close();
  });
});
