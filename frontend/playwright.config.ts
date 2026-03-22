import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// Storage state file for authenticated sessions
const authFile = path.join(__dirname, 'e2e/.auth/admin.json');

// When PLAYWRIGHT_BASE_URL is set, skip global setup and webServer
// (tests that need auth will handle their own login)
const isExternalUrl = !!process.env.PLAYWRIGHT_BASE_URL;

// Ensure baseURL has trailing slash so relative page.goto() paths resolve correctly
// e.g. baseURL 'http://host/main/' + goto('auth/login') → 'http://host/main/auth/login'
const rawBaseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4200';
const baseURL = rawBaseURL.endsWith('/') ? rawBaseURL : rawBaseURL + '/';

export default defineConfig({
  testDir: './e2e',
  timeout: 90000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],

  // Global setup - runs once before all tests to authenticate
  // Skipped when running against an external URL
  ...(isExternalUrl ? {} : { globalSetup: require.resolve('./e2e/global-setup') }),

  use: {
    baseURL,
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    actionTimeout: 20000,
    navigationTimeout: 45000,
    // Use stored authentication state
    storageState: authFile,
  },

  ...(isExternalUrl ? {} : {
    webServer: {
      command: 'npm start',
      url: 'http://localhost:4200',
      reuseExistingServer: true,
      timeout: 180000,
    },
  }),

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
    },
  ],
});
