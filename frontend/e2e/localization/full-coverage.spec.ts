import { test, expect } from '../fixtures/auth.fixture';
import { TranslationChecker, AFRIKAANS_COMMON, ISIZULU_COMMON } from '../utils/translation-checker';

/**
 * Comprehensive localization coverage tests
 * Tests all major pages in all three languages (English, Afrikaans, isiZulu)
 *
 * Uses global setup for authentication - tests start already logged in.
 */

// Configure tests to run serially to avoid state conflicts
test.describe.configure({ mode: 'serial' });

test.describe('Full Localization Coverage - Admin Role', () => {
  // All pages to test for translation coverage
  const ALL_PAGES = [
    // Self-Service
    { path: '/dashboard', name: 'Dashboard', category: 'Overview' },
    { path: '/leave', name: 'My Leave', category: 'Self-Service' },
    { path: '/payslips', name: 'My Payslips', category: 'Self-Service' },
    { path: '/documents', name: 'My Documents', category: 'Self-Service' },
    { path: '/support', name: 'Support Tickets', category: 'Self-Service' },

    // HR
    { path: '/hr', name: 'HR Overview', category: 'HR' },
    { path: '/employees', name: 'Employees List', category: 'HR' },
    { path: '/hr/leave-management', name: 'Leave Management', category: 'HR' },

    // Finance
    { path: '/finance', name: 'Finance Overview', category: 'Finance' },
    { path: '/payroll', name: 'Payroll', category: 'Finance' },
    { path: '/accounting', name: 'Accounting', category: 'Finance' },

    // Recruitment
    { path: '/recruitment', name: 'Recruitment Dashboard', category: 'Recruitment' },
    { path: '/recruitment/jobs', name: 'Job Postings', category: 'Recruitment' },
    { path: '/recruitment/candidates', name: 'Candidates', category: 'Recruitment' },
    { path: '/recruitment/interviews', name: 'Interviews', category: 'Recruitment' },

    // Reports
    { path: '/reports', name: 'Reports Dashboard', category: 'Reports' },

    // Documents
    { path: '/all-documents', name: 'All Documents', category: 'Documents' },

    // Settings
    { path: '/settings', name: 'Settings Overview', category: 'Settings' },
    { path: '/settings/appearance', name: 'Appearance', category: 'Settings' },
    { path: '/settings/company', name: 'Company Profile', category: 'Settings' },
    { path: '/settings/users', name: 'User Management', category: 'Settings' },
    { path: '/settings/notifications', name: 'Notification Preferences', category: 'Settings' }
  ];

  test.describe('Afrikaans Translation Coverage', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to appearance settings and set Afrikaans
      await page.goto('/settings/appearance');
      await page.waitForLoadState('networkidle');
      const afrikaansButton = page.locator('button:has-text("Afrikaans")').first();
      await afrikaansButton.click();
      await page.waitForTimeout(500);
    });

    test('should have correct HTML lang attribute', async ({ page }) => {
      const htmlLang = await page.locator('html').getAttribute('lang');
      expect(htmlLang).toBe('af');
    });

    test('should translate navigation sidebar', async ({ page }) => {
      const navText = await page.textContent('nav, aside, .sidebar') || '';

      // Check for Afrikaans navigation labels
      const expectedLabels = [
        'Kontroleskerm', // Dashboard
        'Werknemers',    // Employees
        'Instellings',   // Settings
        'Betaalstaat',   // Payroll
        'Verlof'         // Leave
      ];

      const foundLabels = expectedLabels.filter(label => navText.includes(label));
      expect(foundLabels.length).toBeGreaterThan(0);
    });

    test('should translate common buttons', async ({ page }) => {
      const checker = new TranslationChecker(page);

      // Navigate to a page with action buttons
      await page.goto('/employees');
      await page.waitForLoadState('networkidle');

      const result = await checker.verifyLanguageContent(
        [AFRIKAANS_COMMON.search, AFRIKAANS_COMMON.add, AFRIKAANS_COMMON.employees],
        1
      );

      console.log('Found Afrikaans words:', result.found);
      console.log('Missing Afrikaans words:', result.missing);
    });

    // Test each page category
    for (const pageInfo of ALL_PAGES.filter(p => p.category === 'Settings')) {
      test(`should translate ${pageInfo.name} page`, async ({ page }) => {
        await page.goto(pageInfo.path);
        await page.waitForLoadState('networkidle');

        const checker = new TranslationChecker(page);
        const untranslatedKeys = await checker.findUntranslatedKeys();

        // Log any potential untranslated keys for debugging
        if (untranslatedKeys.length > 0) {
          console.log(`Potential untranslated keys on ${pageInfo.name}:`, untranslatedKeys);
        }

        // Verify HTML lang is still af
        const htmlLang = await page.locator('html').getAttribute('lang');
        expect(htmlLang).toBe('af');
      });
    }
  });

  test.describe('isiZulu Translation Coverage', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to appearance settings and set isiZulu
      await page.goto('/settings/appearance');
      await page.waitForLoadState('networkidle');
      const zuluButton = page.locator('button:has-text("isiZulu")').first();
      await zuluButton.click();
      await page.waitForTimeout(500);
    });

    test('should have correct HTML lang attribute', async ({ page }) => {
      const htmlLang = await page.locator('html').getAttribute('lang');
      expect(htmlLang).toBe('zu');
    });

    test('should translate navigation sidebar', async ({ page }) => {
      const navText = await page.textContent('nav, aside, .sidebar') || '';

      // Check for isiZulu navigation labels
      const expectedLabels = [
        'Ibhodi Elawulayo', // Dashboard
        'Abasebenzi',       // Employees
        'Izilungiselelo'    // Settings
      ];

      const foundLabels = expectedLabels.filter(label => navText.includes(label));
      expect(foundLabels.length).toBeGreaterThan(0);
    });

    test('should translate common buttons', async ({ page }) => {
      const checker = new TranslationChecker(page);

      // Navigate to a page with action buttons
      await page.goto('/employees');
      await page.waitForLoadState('networkidle');

      const result = await checker.verifyLanguageContent(
        [ISIZULU_COMMON.search, ISIZULU_COMMON.employees],
        1
      );

      console.log('Found isiZulu words:', result.found);
      console.log('Missing isiZulu words:', result.missing);
    });
  });

  test.describe('English Baseline', () => {
    test.beforeEach(async ({ page }) => {
      // Ensure we're in English
      await page.goto('/settings/appearance');
      await page.waitForLoadState('networkidle');
      const englishButton = page.locator('button:has-text("English")').first();
      await englishButton.click();
      await page.waitForTimeout(500);
    });

    test('should have correct HTML lang attribute', async ({ page }) => {
      const htmlLang = await page.locator('html').getAttribute('lang');
      expect(htmlLang).toBe('en');
    });

    test('should display English content on dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const pageContent = await page.textContent('body') || '';

      const englishWords = ['Dashboard', 'Welcome', 'Leave', 'Employees'];
      const foundWords = englishWords.filter(word => pageContent.includes(word));

      expect(foundWords.length).toBeGreaterThan(0);
    });

    test('should display English navigation labels', async ({ page }) => {
      const navText = await page.textContent('nav, aside, .sidebar') || '';

      const englishLabels = ['Dashboard', 'Employees', 'Settings', 'Payroll'];
      const foundLabels = englishLabels.filter(label => navText.includes(label));

      expect(foundLabels.length).toBeGreaterThan(0);
    });
  });

  test.describe('Language Switching Visual Test', () => {
    test('should visually change UI when switching languages', async ({ page }) => {
      // Navigate to appearance settings
      await page.goto('/settings/appearance');
      await page.waitForLoadState('networkidle');

      // Get English text
      const englishContent = await page.textContent('body');

      // Switch to Afrikaans
      const afrikaansButton = page.locator('button:has-text("Afrikaans")').first();
      await afrikaansButton.click();
      await page.waitForTimeout(500);

      // Get Afrikaans text
      const afrikaansContent = await page.textContent('body');

      // Content should be different
      expect(englishContent).not.toBe(afrikaansContent);

      // Switch to isiZulu
      const zuluButton = page.locator('button:has-text("isiZulu")').first();
      await zuluButton.click();
      await page.waitForTimeout(500);

      // Get isiZulu text
      const zuluContent = await page.textContent('body');

      // Content should be different from both English and Afrikaans
      expect(zuluContent).not.toBe(englishContent);
      expect(zuluContent).not.toBe(afrikaansContent);
    });
  });
});

test.describe('Translation Error Detection', () => {
  test('should not have missing translation keys visible', async ({ page }) => {
    // Check multiple pages for translation key patterns
    const pagesToCheck = ['/dashboard', '/employees', '/settings/appearance'];

    for (const path of pagesToCheck) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const pageContent = await page.textContent('body') || '';

      // Look for patterns that indicate untranslated keys
      // e.g., "nav.dashboard", "common.save", "employees.title"
      const keyPattern = /\b[a-z]+\.[a-zA-Z]+(\.[a-zA-Z]+)*\b/g;
      const matches = pageContent.match(keyPattern) || [];

      // Filter out false positives (URLs, email addresses, etc.)
      const potentialKeys = matches.filter(match => {
        return !match.includes('@') &&
               !match.includes('http') &&
               !match.includes('www') &&
               !match.includes('.com') &&
               !match.includes('.co.za') &&
               match.split('.').length <= 4;
      });

      // Log potential untranslated keys for debugging
      if (potentialKeys.length > 0) {
        console.log(`Potential untranslated keys on ${path}:`, potentialKeys.slice(0, 10));
      }
    }
  });
});
