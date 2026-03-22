import { defineConfig, devices } from '@playwright/test';

/**
 * SureWork Admin Dashboard - Playwright E2E Test Configuration
 *
 * This configuration sets up comprehensive E2E testing for the admin dashboard
 * with support for multiple browsers, reporters, and CI/CD integration.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['json', { outputFile: 'reports/json/results.json' }],
    ['junit', { outputFile: 'reports/junit/results.xml' }],
  ],

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:4201',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Main test projects
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'tests/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: 'tests/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    // Mobile testing
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: 'tests/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    // Smoke tests (no auth required)
    {
      name: 'smoke',
      testMatch: /.*smoke.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Local dev server
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:4201',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
