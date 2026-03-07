# SureWork Admin Dashboard - E2E Tests

Comprehensive end-to-end tests for the SureWork Admin Dashboard using Playwright.

## Test Structure

```
tests/
├── e2e/                      # End-to-end test specs
│   ├── auth/                 # Authentication tests
│   │   ├── auth.setup.ts     # Authentication setup
│   │   └── login.spec.ts     # Login functionality tests
│   ├── dashboard/            # Dashboard tests
│   │   └── dashboard.spec.ts
│   ├── tenants/              # Tenant management tests
│   │   └── tenant-list.spec.ts
│   ├── support/              # Support ticket tests
│   │   └── ticket-list.spec.ts
│   ├── billing/              # Billing & revenue tests
│   │   └── billing.spec.ts
│   ├── analytics/            # Analytics tests
│   │   └── analytics.spec.ts
│   ├── discounts/            # Discount management tests
│   │   └── discount-list.spec.ts
│   ├── navigation/           # Navigation tests
│   │   └── navigation.spec.ts
│   └── smoke/                # Smoke tests
│       └── smoke.spec.ts
├── pages/                    # Page Object Models
│   ├── base.page.ts          # Base page class
│   ├── login.page.ts
│   ├── dashboard.page.ts
│   ├── tenant-list.page.ts
│   └── sidebar.page.ts
├── fixtures/                 # Test fixtures
│   ├── test-data.ts          # Test users, tenants, etc.
│   └── custom.fixtures.ts    # Extended Playwright fixtures
├── utils/                    # Utilities
│   └── test-reporter.ts      # Custom test reporter
├── reports/                  # Generated reports (gitignored)
├── playwright.config.ts      # Playwright configuration
└── package.json
```

## Quick Start

### Install Dependencies

```bash
cd tests
npm install
npx playwright install
```

### Run Tests

```bash
# Run all tests
npm test

# Run smoke tests only (no auth required)
npm run test:smoke

# Run specific browser
npm run test:chrome
npm run test:firefox

# Run with UI mode for debugging
npm run test:ui

# Run in debug mode
npm run test:debug

# Run headed (visible browser)
npm run test:headed
```

### View Reports

```bash
npm run test:report
```

## Test Tags

Tests are tagged for selective execution:

| Tag | Description |
|-----|-------------|
| `@smoke` | Quick verification tests |
| `@critical` | Business-critical functionality |
| `@regression` | Full regression suite |
| `@auth` | Authentication-related |
| `@navigation` | Navigation and routing |
| `@dashboard` | Dashboard functionality |
| `@tenants` | Tenant management |
| `@support` | Support tickets |
| `@billing` | Billing and revenue |
| `@analytics` | Analytics features |
| `@discounts` | Discount management |

Run tests by tag:

```bash
npx playwright test --grep @smoke
npx playwright test --grep @critical
npx playwright test --grep "@smoke|@critical"
```

## Test Coverage

### Authentication (TC-AUTH-*)
- [x] TC-AUTH-001: Valid credentials login
- [x] TC-AUTH-002: Invalid password error
- [x] TC-AUTH-003: Empty email validation
- [x] TC-AUTH-004: Empty password validation
- [x] TC-AUTH-005: Forgot password navigation
- [x] TC-AUTH-006: Remember me checkbox
- [x] TC-AUTH-007: Login page elements

### Dashboard (TC-DASH-*)
- [x] TC-DASH-001: Page loads successfully
- [x] TC-DASH-002: KPI cards displayed
- [x] TC-DASH-003: KPI values populated
- [x] TC-DASH-004: Charts displayed
- [x] TC-DASH-005: Activity feed displayed
- [x] TC-DASH-006: Quick actions displayed
- [x] TC-DASH-007-010: Quick action navigation
- [x] TC-DASH-011-012: Export/Refresh buttons

### Tenant Management (TC-TENANT-*)
- [x] TC-TENANT-001: Page loads
- [x] TC-TENANT-002: Stats cards displayed
- [x] TC-TENANT-003: Table displays data
- [x] TC-TENANT-004-005: Search functionality
- [x] TC-TENANT-006-007: Filter controls
- [x] TC-TENANT-008: Row data display
- [x] TC-TENANT-009: Navigation to detail
- [x] TC-TENANT-010-012: Table structure

### Navigation (TC-NAV-*)
- [x] TC-NAV-001-007: Sidebar navigation
- [x] TC-NAV-008: Main pages accessible
- [x] TC-NAV-009: Analytics pages accessible
- [x] TC-NAV-010: Billing pages accessible
- [x] TC-NAV-011: Unknown route redirect

### Support (TC-SUPPORT-*)
- [x] TC-SUPPORT-001-005: Ticket list functionality

### Billing (TC-BILLING-*)
- [x] TC-BILLING-001-008: Revenue and payment tests

### Analytics (TC-ANALYTICS-*)
- [x] TC-ANALYTICS-001-008: Analytics page tests

### Discounts (TC-DISCOUNT-*)
- [x] TC-DISCOUNT-001-006: Discount management tests

### Smoke Tests (TC-SMOKE-*)
- [x] TC-SMOKE-001-008: Basic functionality verification

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run E2E Tests
  run: |
    cd frontend-admin/tests
    npm ci
    npx playwright install --with-deps
    npm run test:ci
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | Application URL | `http://localhost:4201` |
| `CI` | CI environment flag | - |

## Reports

The test suite generates:

1. **HTML Report** - Interactive test results (`reports/html/`)
2. **JSON Report** - CI/CD integration (`reports/json/`)
3. **JUnit Report** - Test management tools (`reports/junit/`)
4. **Developer Report** - Technical analysis (`reports/developer/`)
5. **Audit Report** - Compliance documentation (`reports/audit/`)

## Writing New Tests

### 1. Create Page Object (if needed)

```typescript
// pages/my-feature.page.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class MyFeaturePage extends BasePage {
  readonly someElement: Locator;

  constructor(page: Page) {
    super(page);
    this.someElement = page.locator('...');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/my-feature');
  }
}
```

### 2. Create Test Spec

```typescript
// e2e/my-feature/my-feature.spec.ts
import { test, expect } from '../../fixtures/custom.fixtures';

test.describe('My Feature', () => {
  test('TC-FEATURE-001: Does something', {
    tag: ['@regression'],
  }, async ({ page }) => {
    // Test implementation
  });
});
```

### 3. Follow Test Case Format

```typescript
/**
 * Test Case ID: TC-[MODULE]-[NUMBER]
 * Title: [Descriptive title]
 * Priority: Critical | High | Medium | Low
 * Type: Smoke | Regression | Integration | E2E
 *
 * Preconditions:
 * - [List prerequisites]
 *
 * Steps:
 * 1. [Action] → [Expected Result]
 */
```

## Best Practices

1. **Use Page Objects** - Encapsulate page interactions
2. **Use Test Tags** - Enable selective test execution
3. **Follow Naming Convention** - TC-[MODULE]-[NUMBER]
4. **Add Meaningful Assertions** - Clear failure messages
5. **Handle Loading States** - Wait for elements properly
6. **Mock Data Fallback** - Tests work without backend
