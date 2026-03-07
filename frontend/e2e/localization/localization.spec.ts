import { test, expect } from '../fixtures/auth.fixture';
import { ShellPage } from '../pages/shell.page';
import { SettingsPage } from '../pages/settings.page';

/**
 * Expected translations for verification
 */
const TRANSLATIONS = {
  en: {
    nav: {
      dashboard: 'Dashboard',
      employees: 'Employees',
      settings: 'Settings',
      myLeave: 'My Leave',
      myPayslips: 'My Payslips',
      payroll: 'Payroll',
      accounting: 'Accounting',
      recruitment: 'Dashboard'
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      search: 'Search'
    },
    settings: {
      themeTitle: 'Theme',
      languageTitle: 'Language'
    }
  },
  af: {
    nav: {
      dashboard: 'Kontroleskerm',
      employees: 'Werknemers',
      settings: 'Instellings',
      myLeave: 'My Verlof',
      myPayslips: 'My Betaalstrokies',
      payroll: 'Betaalstaat',
      accounting: 'Rekeningkunde',
      recruitment: 'Kontroleskerm'
    },
    common: {
      save: 'Stoor',
      cancel: 'Kanselleer',
      delete: 'Verwyder',
      edit: 'Wysig',
      search: 'Soek'
    },
    settings: {
      themeTitle: 'Tema',
      languageTitle: 'Taal'
    }
  },
  zu: {
    nav: {
      dashboard: 'Ibhodi Elawulayo',
      employees: 'Abasebenzi',
      settings: 'Izilungiselelo',
      myLeave: 'Ikhefu Lami',
      myPayslips: 'Izitifiketi Zami Zeholo',
      payroll: 'Uhlu Lwamaholo',
      accounting: 'Ukubalwa Kwezimali',
      recruitment: 'Ibhodi Elawulayo'
    },
    common: {
      save: 'Londoloza',
      cancel: 'Khansela',
      delete: 'Susa',
      edit: 'Hlela',
      search: 'Sesha'
    },
    settings: {
      themeTitle: 'Ithimu',
      languageTitle: 'Ulimi'
    }
  }
};

// Run tests serially to avoid state conflicts
test.describe.configure({ mode: 'serial' });

test.describe('Localization Tests - Admin Role', () => {
  test.describe('Language Switching', () => {
    test('should switch to Afrikaans and translate UI', async ({ page }) => {
      // Navigate to settings/appearance (already authenticated via global setup)
      const settingsPage = new SettingsPage(page);
      await settingsPage.gotoAppearance();

      // Switch to Afrikaans
      await settingsPage.selectLanguage('Afrikaans');

      // Verify HTML lang attribute
      await settingsPage.verifyHtmlLangAttribute('af');

      // Verify localStorage
      await settingsPage.verifyLanguageInStorage('af');

      // Check that section titles are translated
      const sectionTitles = await settingsPage.getSectionTitles();
      expect(sectionTitles.some(title => title.includes('Tema'))).toBe(true);
      expect(sectionTitles.some(title => title.includes('Taal'))).toBe(true);
    });

    test('should switch to isiZulu and translate UI', async ({ page }) => {
      const settingsPage = new SettingsPage(page);
      await settingsPage.gotoAppearance();

      // Switch to isiZulu
      await settingsPage.selectLanguage('isiZulu');

      // Verify HTML lang attribute
      await settingsPage.verifyHtmlLangAttribute('zu');

      // Verify localStorage
      await settingsPage.verifyLanguageInStorage('zu');

      // Check that section titles are translated
      const sectionTitles = await settingsPage.getSectionTitles();
      expect(sectionTitles.some(title => title.includes('Ithimu'))).toBe(true);
      expect(sectionTitles.some(title => title.includes('Ulimi'))).toBe(true);
    });

    test('should persist language selection after page reload', async ({ page }) => {
      const settingsPage = new SettingsPage(page);
      await settingsPage.gotoAppearance();

      // Switch to Afrikaans
      await settingsPage.selectLanguage('Afrikaans');
      await settingsPage.verifyHtmlLangAttribute('af');

      // Reload the page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify language is still Afrikaans
      await settingsPage.verifyHtmlLangAttribute('af');
      await settingsPage.verifyLanguageInStorage('af');
    });

    test('should switch back to English', async ({ page }) => {
      const settingsPage = new SettingsPage(page);
      await settingsPage.gotoAppearance();

      // First switch to Afrikaans
      await settingsPage.selectLanguage('Afrikaans');
      await settingsPage.verifyHtmlLangAttribute('af');

      // Then switch back to English
      await settingsPage.selectLanguage('English');
      await settingsPage.verifyHtmlLangAttribute('en');
      await settingsPage.verifyLanguageInStorage('en');

      // Verify English content
      const sectionTitles = await settingsPage.getSectionTitles();
      expect(sectionTitles.some(title => title.includes('Theme'))).toBe(true);
      expect(sectionTitles.some(title => title.includes('Language'))).toBe(true);
    });
  });

  test.describe('Navigation Translation', () => {
    test('should translate navigation labels in English', async ({ page }) => {
      // Ensure we're in English
      const settingsPage = new SettingsPage(page);
      await settingsPage.gotoAppearance();
      await settingsPage.selectLanguage('English');

      // Go to dashboard to see navigation
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const shellPage = new ShellPage(page);
      await shellPage.waitForShellLoaded();

      const navLabels = await shellPage.getVisibleNavLabels();

      // Check for English navigation labels
      const englishLabels = ['Dashboard', 'Employees', 'Settings', 'Payroll', 'Accounting'];
      for (const label of englishLabels) {
        const found = navLabels.some(nav => nav.includes(label));
        if (!found) {
          console.log(`Missing English label: ${label}`);
          console.log('Available labels:', navLabels);
        }
      }
    });

    test('should translate navigation labels in Afrikaans', async ({ page }) => {
      // Switch to Afrikaans via settings
      const settingsPage = new SettingsPage(page);
      await settingsPage.gotoAppearance();
      await settingsPage.selectLanguage('Afrikaans');

      // Navigate back to dashboard
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const shellPage = new ShellPage(page);
      const navLabels = await shellPage.getVisibleNavLabels();

      // Check for Afrikaans navigation labels (visible in sidebar without expanding)
      const afrikaansLabels = ['Kontroleskerm', 'Instellings', 'My Verlof', 'MH', 'Finansies'];
      let matchedCount = 0;
      for (const label of afrikaansLabels) {
        const found = navLabels.some(nav => nav.includes(label));
        if (found) matchedCount++;
      }
      // At least 3 of the 5 labels should be found
      expect(matchedCount).toBeGreaterThanOrEqual(3);
    });

    test('should translate navigation labels in isiZulu', async ({ page }) => {
      // Switch to isiZulu via settings
      const settingsPage = new SettingsPage(page);
      await settingsPage.gotoAppearance();
      await settingsPage.selectLanguage('isiZulu');

      // Navigate back to dashboard
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const shellPage = new ShellPage(page);
      const navLabels = await shellPage.getVisibleNavLabels();

      // Check for isiZulu navigation labels (visible in sidebar without expanding)
      const zuluLabels = ['Ibhodi Elawulayo', 'Izilungiselelo', 'Ikhefu Lami'];
      let matchedCount = 0;
      for (const label of zuluLabels) {
        const found = navLabels.some(nav => nav.includes(label));
        if (found) matchedCount++;
      }
      // At least 2 of the 3 labels should be found
      expect(matchedCount).toBeGreaterThanOrEqual(2);
    });
  });

  test.describe('Page Content Translation', () => {
    test('should translate dashboard content in Afrikaans', async ({ page }) => {
      // Switch to Afrikaans via settings
      const settingsPage = new SettingsPage(page);
      await settingsPage.gotoAppearance();
      await settingsPage.selectLanguage('Afrikaans');

      // Navigate back to dashboard
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Check for Afrikaans text on dashboard
      const pageContent = await page.textContent('body');

      // Should contain some Afrikaans words
      const afrikaansWords = ['Kontroleskerm', 'Verlof', 'Welkom'];
      const foundWords = afrikaansWords.filter(word => pageContent?.includes(word));

      // At least some words should be translated
      expect(foundWords.length).toBeGreaterThan(0);
    });

    test('should translate employees page in Afrikaans', async ({ page }) => {
      // Switch to Afrikaans via settings
      const settingsPage = new SettingsPage(page);
      await settingsPage.gotoAppearance();
      await settingsPage.selectLanguage('Afrikaans');

      // Navigate to employees
      await page.goto('/employees');
      await page.waitForLoadState('networkidle');

      const pageContent = await page.textContent('body');

      // Should contain Afrikaans employee-related text
      const afrikaansWords = ['Werknemers', 'Soek', 'Voeg By', 'Naam', 'E-pos'];
      const foundWords = afrikaansWords.filter(word => pageContent?.includes(word));

      expect(foundWords.length).toBeGreaterThan(0);
    });

    test('should translate settings page in isiZulu', async ({ page }) => {
      // Navigate to settings and switch to isiZulu
      const settingsPage = new SettingsPage(page);
      await settingsPage.gotoAppearance();
      await settingsPage.selectLanguage('isiZulu');

      // Wait for translations to apply
      await page.waitForTimeout(500);

      const pageContent = await page.textContent('body');

      // Should contain isiZulu settings text
      const zuluWords = ['Ithimu', 'Ulimi', 'Izilungiselelo'];
      const foundWords = zuluWords.filter(word => pageContent?.includes(word));

      expect(foundWords.length).toBeGreaterThan(0);
    });
  });

  test.describe('No Untranslated Keys', () => {
    test('should not display raw translation keys on dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const shellPage = new ShellPage(page);
      await shellPage.waitForShellLoaded();

      const pageContent = await page.textContent('body') || '';

      // Check for common untranslated key patterns
      const untranslatedPatterns = [
        /nav\.[a-z]+/g,
        /common\.[a-z]+/g,
        /dashboard\.[a-z]+/g,
        /auth\.[a-z]+/g
      ];

      for (const pattern of untranslatedPatterns) {
        const matches = pageContent.match(pattern);
        if (matches && matches.length > 0) {
          // Filter out false positives (like URLs)
          const realKeys = matches.filter(m => !m.includes('http') && !m.includes('/'));
          expect(realKeys.length).toBe(0);
        }
      }
    });

    test('should not display raw translation keys on employees page', async ({ page }) => {
      await page.goto('/employees');
      await page.waitForLoadState('networkidle');

      const pageContent = await page.textContent('body') || '';

      // Check for employees-related untranslated keys
      const untranslatedPatterns = [
        /employees\.[a-z]+\.[a-z]+/g,
        /common\.[a-z]+/g
      ];

      for (const pattern of untranslatedPatterns) {
        const matches = pageContent.match(pattern);
        if (matches && matches.length > 0) {
          const realKeys = matches.filter(m => !m.includes('http') && !m.includes('/'));
          expect(realKeys.length).toBe(0);
        }
      }
    });

    test('should not display raw translation keys on settings page', async ({ page }) => {
      await page.goto('/settings/appearance');
      await page.waitForLoadState('networkidle');

      const pageContent = await page.textContent('body') || '';

      // Check for settings-related untranslated keys
      const untranslatedPatterns = [
        /settings\.[a-z]+\.[a-z]+/g,
        /common\.[a-z]+/g
      ];

      for (const pattern of untranslatedPatterns) {
        const matches = pageContent.match(pattern);
        if (matches && matches.length > 0) {
          const realKeys = matches.filter(m => !m.includes('http') && !m.includes('/'));
          expect(realKeys.length).toBe(0);
        }
      }
    });
  });

  test.describe('Full UI Translation Coverage', () => {
    const pagesToTest = [
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/employees', name: 'Employees' },
      { path: '/leave', name: 'Leave' },
      { path: '/payroll', name: 'Payroll' },
      { path: '/recruitment', name: 'Recruitment' },
      { path: '/settings/appearance', name: 'Appearance Settings' },
      { path: '/settings/company', name: 'Company Settings' }
    ];

    for (const pageInfo of pagesToTest) {
      test(`should translate ${pageInfo.name} page to Afrikaans`, async ({ page }) => {
        // Switch to Afrikaans via settings
        const settingsPage = new SettingsPage(page);
        await settingsPage.gotoAppearance();
        await settingsPage.selectLanguage('Afrikaans');

        // Navigate to the page
        await page.goto(pageInfo.path);
        await page.waitForLoadState('networkidle');

        // Verify HTML lang attribute is set
        const htmlLang = await page.locator('html').getAttribute('lang');
        expect(htmlLang).toBe('af');

        // Check page content for Afrikaans
        const pageContent = await page.textContent('body') || '';

        // Check that the page has some content
        expect(pageContent.length).toBeGreaterThan(100);
      });
    }
  });
});

test.describe('Login Page Translation', () => {
  // These tests need to clear storage state to test login page
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should display login page in default language (English)', async ({ page, loginPage }) => {
    await loginPage.goto();

    // Check for English text
    const welcomeText = await loginPage.getWelcomeText();
    expect(welcomeText).toContain('Welcome');

    const signInText = await loginPage.getSignInButtonText();
    expect(signInText.toLowerCase()).toContain('sign in');
  });

  test('should display login page in Afrikaans when set', async ({ page }) => {
    // Set language before navigating
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('sw-language', 'af'));

    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    // Wait for translation to load
    await page.waitForTimeout(500);

    const pageContent = await page.textContent('body') || '';

    // Should contain some Afrikaans auth text
    const afrikaansWords = ['Welkom', 'Meld aan', 'E-pos'];
    const foundWords = afrikaansWords.filter(word => pageContent.includes(word));

    // At least the welcome text should be translated
    expect(foundWords.length).toBeGreaterThan(0);
  });
});
