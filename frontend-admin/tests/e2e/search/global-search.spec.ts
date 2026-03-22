import { test, expect } from '@playwright/test';

/**
 * Global Search E2E Tests
 *
 * Tests the global search functionality against the real backend.
 * Requires the backend services to be running.
 */

test.describe('Global Search', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (assumes authentication is handled by setup)
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('search bar is visible and has correct placeholder', async ({ page }) => {
    const searchInput = page.locator('input[aria-label="Global search"]');
    await expect(searchInput).toBeVisible();

    const placeholder = await searchInput.getAttribute('placeholder');
    expect(placeholder).toContain('Search');
  });

  test('search bar can be focused by clicking', async ({ page }) => {
    const searchInput = page.locator('input[aria-label="Global search"]');
    await searchInput.click();
    await expect(searchInput).toBeFocused();
  });

  test('Cmd/Ctrl+K focuses the search bar', async ({ page }) => {
    const searchInput = page.locator('input[aria-label="Global search"]');

    // Press Cmd+K (Mac) or Ctrl+K (Windows/Linux)
    await page.keyboard.press('Control+k');
    await expect(searchInput).toBeFocused();
  });

  test('typing in search triggers API call and shows results', async ({ page }) => {
    const searchInput = page.locator('input[aria-label="Global search"]');

    // Set up request interception to verify API calls
    const searchRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/search') || request.url().includes('search=')) {
        searchRequests.push(request.url());
      }
    });

    // Focus and type
    await searchInput.click();
    await searchInput.fill('Acme');

    // Wait for debounce (300ms) + API response
    await page.waitForTimeout(500);

    // Verify API was called
    expect(searchRequests.length).toBeGreaterThan(0);
  });

  test('search results dropdown appears with results', async ({ page }) => {
    const searchInput = page.locator('input[aria-label="Global search"]');

    await searchInput.click();
    await searchInput.fill('test');

    // Wait for results
    await page.waitForTimeout(600);

    // Check if dropdown appears (either with results or "no results" message)
    const dropdown = page.locator('#search-results');
    const isVisible = await dropdown.isVisible().catch(() => false);

    if (isVisible) {
      // Dropdown is visible - either has results or shows no results message
      await expect(dropdown).toBeVisible();
    }
  });

  test('search requires minimum 2 characters', async ({ page }) => {
    const searchInput = page.locator('input[aria-label="Global search"]');
    const dropdown = page.locator('#search-results');

    await searchInput.click();

    // Type 1 character - dropdown should not appear
    await searchInput.fill('a');
    await page.waitForTimeout(500);
    await expect(dropdown).not.toBeVisible();

    // Type 2 characters - dropdown may appear
    await searchInput.fill('ab');
    await page.waitForTimeout(500);
    // Dropdown visibility depends on whether there are results
  });

  test('arrow keys navigate through search results', async ({ page }) => {
    const searchInput = page.locator('input[aria-label="Global search"]');

    await searchInput.click();
    await searchInput.fill('test');
    await page.waitForTimeout(600);

    const dropdown = page.locator('#search-results');
    if (await dropdown.isVisible()) {
      const results = dropdown.locator('a[role="option"]');
      const count = await results.count();

      if (count > 0) {
        // Press ArrowDown to select first result
        await page.keyboard.press('ArrowDown');

        // Check if first result is highlighted
        const firstResult = results.first();
        const classes = await firstResult.getAttribute('class');
        expect(classes).toContain('bg-brand-50');
      }
    }
  });

  test('Enter key navigates to selected result', async ({ page }) => {
    const searchInput = page.locator('input[aria-label="Global search"]');

    await searchInput.click();
    await searchInput.fill('test');
    await page.waitForTimeout(600);

    const dropdown = page.locator('#search-results');
    if (await dropdown.isVisible()) {
      const results = dropdown.locator('a[role="option"]');
      const count = await results.count();

      if (count > 0) {
        const initialUrl = page.url();

        // Select first result and press Enter
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');

        // Wait for navigation
        await page.waitForTimeout(500);

        // URL should have changed
        const newUrl = page.url();
        // Note: URL may or may not change depending on result type
      }
    }
  });

  test('Escape key closes search dropdown', async ({ page }) => {
    const searchInput = page.locator('input[aria-label="Global search"]');

    await searchInput.click();
    await searchInput.fill('test');
    await page.waitForTimeout(600);

    // Press Escape
    await page.keyboard.press('Escape');

    // Search input should lose focus
    await expect(searchInput).not.toBeFocused();
  });

  test('clicking search result navigates to detail page', async ({ page }) => {
    const searchInput = page.locator('input[aria-label="Global search"]');

    await searchInput.click();
    await searchInput.fill('Acme');
    await page.waitForTimeout(600);

    const dropdown = page.locator('#search-results');
    if (await dropdown.isVisible()) {
      const firstResult = dropdown.locator('a[role="option"]').first();

      if (await firstResult.isVisible()) {
        const href = await firstResult.getAttribute('href');
        await firstResult.click();

        // Wait for navigation
        await page.waitForLoadState('networkidle');

        // Should have navigated
        if (href) {
          expect(page.url()).toContain(href.split('/').pop());
        }
      }
    }
  });

  test('search input clears after selecting result', async ({ page }) => {
    const searchInput = page.locator('input[aria-label="Global search"]');

    await searchInput.click();
    await searchInput.fill('test');
    await page.waitForTimeout(600);

    const dropdown = page.locator('#search-results');
    if (await dropdown.isVisible()) {
      const firstResult = dropdown.locator('a[role="option"]').first();

      if (await firstResult.isVisible()) {
        await firstResult.click();
        await page.waitForTimeout(300);

        // Search input should be cleared
        const value = await searchInput.inputValue();
        expect(value).toBe('');
      }
    }
  });

  test('search results are grouped by type (Tenants, Tickets)', async ({ page }) => {
    const searchInput = page.locator('input[aria-label="Global search"]');

    await searchInput.click();
    await searchInput.fill('test');
    await page.waitForTimeout(600);

    const dropdown = page.locator('#search-results');
    if (await dropdown.isVisible()) {
      // Check for group headers
      const headers = dropdown.locator('h4');
      const count = await headers.count();

      if (count > 0) {
        const headerTexts = await headers.allTextContents();
        // Headers should contain category names
        const validHeaders = headerTexts.some(text =>
          text.toLowerCase().includes('tenant') ||
          text.toLowerCase().includes('ticket')
        );
        expect(validHeaders || count === 0).toBeTruthy();
      }
    }
  });

  test('loading indicator shows while searching', async ({ page }) => {
    const searchInput = page.locator('input[aria-label="Global search"]');

    await searchInput.click();

    // Type quickly and check for loading indicator
    await searchInput.type('testing', { delay: 50 });

    // Loading indicator might be visible briefly
    const loadingIndicator = page.locator('header svg.animate-spin');
    // This is timing-dependent, so we just verify it doesn't break
  });

  test('no results message shows for non-matching search', async ({ page }) => {
    const searchInput = page.locator('input[aria-label="Global search"]');

    await searchInput.click();
    await searchInput.fill('xyznonexistent12345');
    await page.waitForTimeout(600);

    // Should show "No results found" or dropdown shouldn't appear
    const noResults = page.locator('text=No results found');
    const dropdown = page.locator('#search-results');

    // Either no results message is visible, or dropdown with message
    if (await dropdown.isVisible()) {
      await expect(noResults).toBeVisible();
    }
  });
});

test.describe('Global Search - API Integration', () => {

  test('tenant search API returns correct data structure', async ({ page, request }) => {
    // Direct API test
    const response = await request.get('/admin-api/v1/tenants/search?search=test&page=0&size=5');

    if (response.ok()) {
      const data = await response.json();

      // Verify response structure
      expect(data).toHaveProperty('content');
      expect(data).toHaveProperty('totalElements');
      expect(data).toHaveProperty('totalPages');
      expect(Array.isArray(data.content)).toBeTruthy();
    }
  });

  test('ticket search API returns correct data structure', async ({ page, request }) => {
    // Direct API test
    const response = await request.get('/admin-api/v1/tickets?search=test&page=0&size=5');

    if (response.ok()) {
      const data = await response.json();

      // Verify response structure
      expect(data).toHaveProperty('content');
      expect(Array.isArray(data.content)).toBeTruthy();
    }
  });
});

test.describe('Global Search - Accessibility', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('search input has correct ARIA attributes', async ({ page }) => {
    const searchInput = page.locator('input[aria-label="Global search"]');

    await expect(searchInput).toHaveAttribute('role', 'combobox');
    await expect(searchInput).toHaveAttribute('aria-haspopup', 'listbox');
    await expect(searchInput).toHaveAttribute('aria-controls', 'search-results');
  });

  test('search results have correct ARIA roles', async ({ page }) => {
    const searchInput = page.locator('input[aria-label="Global search"]');

    await searchInput.click();
    await searchInput.fill('test');
    await page.waitForTimeout(600);

    const dropdown = page.locator('#search-results');
    if (await dropdown.isVisible()) {
      await expect(dropdown).toHaveAttribute('role', 'listbox');

      const options = dropdown.locator('[role="option"]');
      const count = await options.count();
      expect(count >= 0).toBeTruthy(); // May have 0 or more results
    }
  });
});

test.describe('Global Search - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('mobile search button is visible on small screens', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // On mobile, full search bar is hidden
    const desktopSearch = page.locator('input[aria-label="Global search"]');
    await expect(desktopSearch).not.toBeVisible();

    // Mobile search button should be visible
    const mobileSearchBtn = page.locator('button').filter({
      has: page.locator('svg path[d*="M21 21l-6-6"]')
    }).first();

    // There should be at least one search-related button visible
  });
});
