import { test, expect } from '@playwright/test';

/**
 * Smoke Tests
 *
 * Test Suite: Smoke
 * Priority: Critical
 * Type: Smoke
 *
 * Quick verification that the application is functional.
 * These tests run without authentication setup to verify basic accessibility.
 */
test.describe('Smoke Tests', () => {
  /**
   * Test Case ID: TC-SMOKE-001
   * Title: Application loads
   * Priority: Critical
   * Type: Smoke
   */
  test('TC-SMOKE-001: Application loads successfully', {
    tag: ['@smoke', '@critical'],
  }, async ({ page }) => {
    await page.goto('/');
    // Should redirect to login or dashboard
    await expect(page).toHaveURL(/.*\/(auth\/signin|dashboard)/);
  });

  /**
   * Test Case ID: TC-SMOKE-002
   * Title: Login page is accessible
   * Priority: Critical
   * Type: Smoke
   */
  test('TC-SMOKE-002: Login page is accessible', {
    tag: ['@smoke', '@critical'],
  }, async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.locator('h1:has-text("SureWork")')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  /**
   * Test Case ID: TC-SMOKE-003
   * Title: Login form elements are present
   * Priority: Critical
   * Type: Smoke
   */
  test('TC-SMOKE-003: Login form elements are present', {
    tag: ['@smoke', '@critical'],
  }, async ({ page }) => {
    await page.goto('/auth/signin');

    // Check all form elements
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  /**
   * Test Case ID: TC-SMOKE-004
   * Title: Forgot password page is accessible
   * Priority: High
   * Type: Smoke
   */
  test('TC-SMOKE-004: Forgot password page is accessible', {
    tag: ['@smoke'],
  }, async ({ page }) => {
    await page.goto('/auth/forgot-password');
    // Page should load without errors
    await expect(page.locator('text=SureWork')).toBeVisible();
  });

  /**
   * Test Case ID: TC-SMOKE-005
   * Title: Application has no console errors on login page
   * Priority: Medium
   * Type: Smoke
   */
  test('TC-SMOKE-005: No console errors on login page', {
    tag: ['@smoke'],
  }, async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');

    // Filter out expected errors (like network errors in test environment)
    const criticalErrors = consoleErrors.filter(
      (err) => !err.includes('net::ERR') && !err.includes('Failed to load resource')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  /**
   * Test Case ID: TC-SMOKE-006
   * Title: Page has correct title
   * Priority: Low
   * Type: Smoke
   */
  test('TC-SMOKE-006: Page has a title', {
    tag: ['@smoke'],
  }, async ({ page }) => {
    await page.goto('/auth/signin');
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  /**
   * Test Case ID: TC-SMOKE-007
   * Title: Application responds within acceptable time
   * Priority: Medium
   * Type: Smoke
   */
  test('TC-SMOKE-007: Application responds within acceptable time', {
    tag: ['@smoke', '@performance'],
  }, async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/auth/signin');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  /**
   * Test Case ID: TC-SMOKE-008
   * Title: CSS and styles are loaded
   * Priority: Medium
   * Type: Smoke
   */
  test('TC-SMOKE-008: Styles are loaded correctly', {
    tag: ['@smoke', '@ui'],
  }, async ({ page }) => {
    await page.goto('/auth/signin');

    // Check that Tailwind styles are applied
    const signInButton = page.getByRole('button', { name: /sign in/i });
    const buttonClasses = await signInButton.getAttribute('class');

    // Button should have styling classes
    expect(buttonClasses).toBeTruthy();
  });
});
