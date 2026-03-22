# Onboarding Wizard E2E Test Report

## Test Suite: TC-ONBOARD

**Feature:** Multi-step Signup Wizard for Self-Service Tenant Registration
**Priority:** Critical
**Created:** 2026-01-28
**Test Framework:** Playwright

---

## Summary

| Metric | Value |
|--------|-------|
| Total Test Cases | 38 |
| Critical | 8 |
| High | 18 |
| Medium | 9 |
| Low | 3 |

---

## Test Coverage Matrix

### 1. Navigation & Progress (7 tests)

| Test ID | Title | Priority | Status |
|---------|-------|----------|--------|
| TC-ONBOARD-001 | Wizard loads on /signup route | Critical | Ready |
| TC-ONBOARD-002 | Display 5 progress steps | High | Ready |
| TC-ONBOARD-003 | Progress bar updates on navigation | High | Ready |
| TC-ONBOARD-004 | Back button disabled on first step | Medium | Ready |
| TC-ONBOARD-005 | Back button navigates to previous step | High | Ready |
| TC-ONBOARD-006 | Next button disabled until step is valid | High | Ready |
| TC-ONBOARD-007 | Sign in link navigates to login | Medium | Ready |

### 2. Step 0: Account (5 tests)

| Test ID | Title | Priority | Status |
|---------|-------|----------|--------|
| TC-ONBOARD-010 | Email field validation | Critical | Ready |
| TC-ONBOARD-011 | Password minimum length (12 chars) | Critical | Ready |
| TC-ONBOARD-012 | Password complexity validation | Critical | Ready |
| TC-ONBOARD-013 | Password visibility toggle | Medium | Ready |
| TC-ONBOARD-014 | First name validation (2-50 chars) | High | Ready |

### 3. Step 1: Company (5 tests)

| Test ID | Title | Priority | Status |
|---------|-------|----------|--------|
| TC-ONBOARD-020 | Company name validation | High | Ready |
| TC-ONBOARD-021 | CIPC registration number format | Critical | Ready |
| TC-ONBOARD-022 | Company type selection required | High | Ready |
| TC-ONBOARD-023 | Industry sector selection required | High | Ready |
| TC-ONBOARD-024 | Trading name is optional | Low | Ready |

### 4. Step 2: SARS Compliance (5 tests)

| Test ID | Title | Priority | Status |
|---------|-------|----------|--------|
| TC-ONBOARD-030 | SA tax number format (10 digits) | Critical | Ready |
| TC-ONBOARD-031 | VAT number format (optional) | High | Ready |
| TC-ONBOARD-032 | UIF reference format (U + 8 digits) | High | Ready |
| TC-ONBOARD-033 | SDL number format (L + 8 digits) | High | Ready |
| TC-ONBOARD-034 | PAYE reference format | High | Ready |

### 5. Step 3: Contact (4 tests)

| Test ID | Title | Priority | Status |
|---------|-------|----------|--------|
| TC-ONBOARD-040 | SA phone format (+27 + 9 digits) | High | Ready |
| TC-ONBOARD-041 | Company email validation | High | Ready |
| TC-ONBOARD-042 | Province selection from SA provinces | High | Ready |
| TC-ONBOARD-043 | SA postal code format (4 digits) | High | Ready |

### 6. Step 4: Review & Submit (4 tests)

| Test ID | Title | Priority | Status |
|---------|-------|----------|--------|
| TC-ONBOARD-050 | Review summary display | High | Ready |
| TC-ONBOARD-051 | Terms acceptance required | Critical | Ready |
| TC-ONBOARD-052 | Terms and Privacy links present | Medium | Ready |
| TC-ONBOARD-053 | 14-day trial information displayed | Medium | Ready |

### 7. Localization (3 tests)

| Test ID | Title | Priority | Status |
|---------|-------|----------|--------|
| TC-ONBOARD-060 | Default language (English) | High | Ready |
| TC-ONBOARD-061 | Afrikaans translation | High | Ready |
| TC-ONBOARD-062 | isiZulu translation | High | Ready |

### 8. Responsive Design (2 tests)

| Test ID | Title | Priority | Status |
|---------|-------|----------|--------|
| TC-ONBOARD-070 | Mobile viewport display | High | Ready |
| TC-ONBOARD-071 | Tablet viewport display | Medium | Ready |

### 9. Accessibility (2 tests)

| Test ID | Title | Priority | Status |
|---------|-------|----------|--------|
| TC-ONBOARD-080 | Form labels are associated | High | Ready |
| TC-ONBOARD-081 | Required fields are marked | Medium | Ready |

### 10. Public Access (1 test)

| Test ID | Title | Priority | Status |
|---------|-------|----------|--------|
| TC-ONBOARD-090 | No authentication required | Critical | Ready |

---

## SA-Specific Validation Patterns Tested

### CIPC Registration Number
- Format: `YYYY/NNNNNN/NN`
- Valid: `2024/123456/07`, `2020/000001/23`
- Invalid: `12345`, `2024-123456-07`

### Tax Number
- Format: 10 digits
- Valid: `1234567890`
- Invalid: `123456789` (9 digits)

### VAT Number
- Format: Starts with 4, 10 digits total
- Valid: `4123456789`
- Invalid: `1234567890` (doesn't start with 4)

### UIF Reference
- Format: U + 8 digits
- Valid: `U12345678`
- Invalid: `L12345678`, `U1234567`

### SDL Number
- Format: L + 8 digits
- Valid: `L12345678`
- Invalid: `U12345678`, `L1234567`

### PAYE Reference
- Format: `NNNNNNN/NNN/NNNN`
- Valid: `1234567/123/1234`
- Invalid: `1234567-123-1234`

### Phone Number
- Format: +27 + 9 digits
- Valid: `+27821234567`
- Invalid: `0821234567`

### Postal Code
- Format: 4 digits
- Valid: `2196`
- Invalid: `219`, `ABCD`

---

## Running the Tests

```bash
# Run all onboarding tests
npx playwright test onboarding.spec.ts

# Run with UI mode for debugging
npx playwright test onboarding.spec.ts --ui

# Run specific test by ID
npx playwright test onboarding.spec.ts --grep "TC-ONBOARD-001"

# Run validation tests only
npx playwright test onboarding.spec.ts --grep "validate"

# Run with verbose output
npx playwright test onboarding.spec.ts --reporter=list
```

---

## Page Objects Created

1. **OnboardingPage** (`e2e/pages/onboarding.page.ts`)
   - Handles all 5 wizard steps
   - Navigation helpers
   - Validation helpers
   - Complete flow helper

2. **SignupSuccessPage** (`e2e/pages/onboarding.page.ts`)
   - Success page after signup
   - Resend email functionality
   - Navigation to login

---

## Test Dependencies

- Tests use `storageState: { cookies: [], origins: [] }` to ensure no authentication
- Tests generate unique emails using timestamps to avoid conflicts
- Tests are independent and can run in any order

---

## Notes for Developers

1. **Backend API Required**: Tests that submit the form will require the backend signup API to be running
2. **Email/Registration Availability**: Tests that check availability require API connectivity
3. **Localization**: Tests verify the `lang` attribute on `<html>` and localStorage settings
4. **Mobile Tests**: Use `page.setViewportSize()` to test responsive behavior

---

## Audit Compliance

This test suite provides:
- ✅ Full traceability with unique test case IDs
- ✅ SA-specific compliance validation
- ✅ Multi-language support verification
- ✅ Accessibility verification
- ✅ Public access verification (no auth required)
