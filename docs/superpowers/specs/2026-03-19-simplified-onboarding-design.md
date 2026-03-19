# Simplified Onboarding Design

**Date:** 2026-03-19
**Status:** Draft

## Problem

The current onboarding wizard collects 27 fields across 5 steps (Account, Company Details, SARS Compliance, Contact Info, Review). This creates significant friction for user acquisition. Most of these fields aren't needed to start using the product — they're only required for specific features like payroll and invoicing.

## Solution

Reduce signup to 6 fields in a single step, defer company and compliance details to admin settings, and gate features that depend on those details until they're completed. Use reminder emails to nudge admins to complete setup.

## Signup Flow

### Step 1: Sign Up (6 fields, single form)

| Field | Validation |
|-------|-----------|
| First name | 2-50 chars |
| Last name | 2-50 chars |
| Work email | Valid email, async availability check |
| Password | Min 12 chars, uppercase, lowercase, digit, special char |
| Company name | 2-200 chars |
| Company type | Dropdown: Pty Ltd, CC, Sole Proprietor, Partnership, Trust, etc. |

Plus terms of service checkbox.

### Step 2: In-App Verification Code

- 6-digit numeric code sent to the provided email address
- User enters code on a dedicated screen (6 individual digit inputs)
- Code expires after 10 minutes
- Resend button with 60-second cooldown
- On successful verification: user status changes from PENDING to ACTIVE, JWT returned, redirect to dashboard

### Step 3: Dashboard

User lands on the dashboard with immediate access to ungated features.

## Feature Gating

Two boolean flags on the Tenant entity control feature access:

### Company Details Gate (`companyDetailsComplete`)

**Required fields:** Registration number, trading name (optional), industry sector, phone, company email, street address, city, province, postal code.

**Blocked features:**
- Invoicing (invoice dashboard, invoice list, invoice form, invoice detail)
- Customer management
- Financial reports
- Finance dashboard

### Compliance Gate (`complianceDetailsComplete`)

**Required fields:** Tax number, VAT number (optional), UIF reference, SDL number, PAYE reference.

**Blocked features:**
- Payroll runs, payroll dashboard, payslip generation
- VAT reports (list, form, detail)
- Accounting journal entries
- Payroll-accounting integration

### Ungated Features (available immediately)

Dashboard, Employee management, Leave management, Recruitment, Documents, Support tickets, HR module, Settings, Profile, Notifications, Onboarding tracker.

### Blocked UX

When a user navigates to a gated feature, the page content is replaced entirely by a full-screen overlay:

- Semi-transparent white background (95% opacity) over faintly visible page skeleton
- Centered card with:
  - Icon indicating the gate type (company or compliance)
  - Clear heading: "Complete your company details" or "SARS compliance details required"
  - Explanation of why this feature needs the details (1-2 sentences)
  - CTA button linking to the relevant Settings page
  - Breadcrumb hint: "Settings → Company Profile" or "Settings → Compliance"

## Deferred Details — Settings Pages

### Company Profile (existing page, extended)

Add the deferred fields to the existing Company Profile settings page:
- Registration number (CIPC format: YYYY/NNNNNN/NN)
- Trading name (optional)
- Industry sector (dropdown, 17 sectors)
- Phone (+27XXXXXXXXX format)
- Company email
- Street address, city, province (dropdown), postal code

When all required fields are saved, the backend sets `companyDetailsComplete = true` on the Tenant.

### Compliance Settings (new section)

New settings section under Settings for SARS compliance:
- Tax number (10 digits)
- VAT number (optional, 10 digits starting with 4)
- UIF reference (U followed by 8 digits)
- SDL number (L followed by 8 digits)
- PAYE reference (NNNNNNN/NNN/NNNN format)

When all required fields are saved, the backend sets `complianceDetailsComplete = true` on the Tenant.

## Persistent Setup Banner

- Displayed at the top of the dashboard for `TENANT_ADMIN` users only
- Shows remaining setup steps with progress: "Complete company details" and/or "Complete compliance details"
- Each step has a CTA button linking to the relevant Settings page
- Dismissible but reappears on next login until both gates are complete
- Disappears permanently once both `companyDetailsComplete` and `complianceDetailsComplete` are true

## Reminder Emails

Moderate cadence — 3 emails during the 14-day trial:

| Day | Subject | Content |
|-----|---------|---------|
| 2 | "You're set up — now unlock the rest" | Highlights blocked features, explains what's needed, links to Settings |
| 7 | "Your trial is half over" | Emphasizes time remaining, lists what they're missing out on |
| 12 | "2 days left on your trial" | Urgency messaging, blocked feature list, direct Settings links |

**Rules:**
- Only sent if at least one gate is still incomplete
- Each email links directly to the appropriate Settings page
- Stop sending once both gates are complete

## Backend Architecture

### Service Ownership

This project spans multiple services. Clear ownership:

| Concern | Owner Service | Rationale |
|---------|--------------|-----------|
| Signup orchestration | tenant-service | Already owns `SignupController`, continues to orchestrate |
| Verification code storage & validation | identity-service | Code verifies a **user's** email, not a tenant — belongs with User entity |
| User activation (PENDING → ACTIVE) | identity-service | Owns User entity and status transitions |
| Tenant completion flags | tenant-service | Owns the canonical Tenant entity (`com.surework.tenant.domain.Tenant`) |
| Setup gate filter | Each gated service (accounting-service, etc.) | Each service checks tenant flags via cached tenant context from JWT/header |
| Reminder emails | notification-service | Scheduled job, queries tenant-service for incomplete tenants |

**Note:** There are two Tenant entity classes — `com.surework.tenant.domain.Tenant` (tenant-service, source of truth) and `com.surework.admin.domain.Tenant` (admin-service, admin operations). The completion flags live on the **tenant-service** entity. Admin-service reads them via inter-service call or shared cache when needed.

### Tenant Entity Changes (tenant-service)

New fields on `com.surework.tenant.domain.Tenant`:
- `companyDetailsComplete` (boolean, default false)
- `complianceDetailsComplete` (boolean, default false)

New Flyway migration for these columns.

### User Entity Changes (identity-service)

New fields on `com.surework.identity.domain.User`:
- `verificationCode` (String, nullable)
- `verificationCodeExpiry` (Instant, nullable)

New Flyway migration for these columns.

### Signup API Changes

**Reduced `SignupRequest`:**
```
email, password, firstName, lastName, companyName, companyType, acceptTerms
```

**New endpoints (tenant-service, orchestrates across services):**
- `POST /api/v1/signup/verify` — accepts `{ email, code }`. Tenant-service forwards to identity-service to validate code and activate user. On success, identity-service returns user details, tenant-service updates tenant status to TRIAL if still PENDING, returns JWT.
- `POST /api/v1/signup/resend-code` — tenant-service forwards to identity-service to regenerate code and resend email. 60-second cooldown enforced at identity-service.

**Flow:**
1. Validate email availability (via identity-service), company name uniqueness
2. Create Tenant with both completion flags `false`, status PENDING
3. Create User with PENDING status via identity-service
4. Identity-service generates 6-digit verification code on User entity, stores with 10-minute expiry
5. Identity-service sends verification code email via notification-service
6. Tenant-service returns `{ tenantId, email }`

**Verification flow:**
1. User submits code → tenant-service `POST /api/v1/signup/verify`
2. Tenant-service calls identity-service to validate code against User entity
3. Identity-service: validates code + expiry, transitions User status PENDING → ACTIVE
4. Tenant-service: transitions Tenant status PENDING → TRIAL
5. Tenant-service generates JWT, returns to frontend
6. Frontend stores JWT, redirects to dashboard

### Feature Gate Enforcement

**Backend:** Each gated service (accounting-service, etc.) applies a `SetupGateFilter` — a servlet filter that:
- Reads tenant completion flags from the tenant context (propagated via JWT claims or inter-service header, cached in `TenantContext`)
- Checks the relevant flag for gated URL patterns
- Returns `403` with body `{ "error": "SETUP_REQUIRED", "gate": "COMPANY_DETAILS" | "COMPLIANCE" }` for blocked requests
- **Exemptions:** Settings/profile endpoints are never gated (the admin needs to access them to complete setup)
- Gated URL patterns per service:
  - accounting-service (company gate): `/api/v1/invoices/**`, `/api/v1/customers/**`
  - accounting-service (compliance gate): `/api/v1/payroll-accounting/**`, `/api/v1/vat/**`, `/api/v1/accounting/journals/**`
  - Reports endpoints (company gate): `/api/v1/reports/financial/**`
  - Payroll endpoints (compliance gate): `/api/v1/payroll/**`

**Frontend:** `SetupGuard` route guard:
- Reads tenant completion status from auth service (loaded on login, included in JWT claims, cached)
- For gated routes, checks the relevant flag
- If incomplete, renders `SetupBlockComponent` overlay instead of the route component
- Refreshes tenant status after settings saves

### Completion Detection

When admin saves Company Profile or Compliance settings:
1. Backend (tenant-service) validates all required fields are present
2. Sets the relevant completion flag to `true` on the tenant-service Tenant entity
3. Publishes a domain event (`TenantSetupCompleted`) so other services can refresh cached flags
4. Returns updated tenant status in the response
5. Frontend updates cached tenant status (and JWT on next refresh), gates clear reactively

### Reminder Email Scheduler

`SetupReminderScheduler` in notification-service:
- Runs daily as a scheduled job
- Queries tenant-service for tenants where:
  - Either completion flag is `false`
  - Trial start date matches Day 2, 7, or 12 relative to today
- Sends appropriate templated email via `EmailServiceImpl`
- Three Thymeleaf templates: `setup-reminder-day2.html`, `setup-reminder-day7.html`, `setup-reminder-day12.html`

## Out of Scope

- SARS/CIPC validation against external databases (format-only validation)
- Subscription tier feature gating (separate concern, uses `enabledFeatures`)
- Post-trial conversion flow
- Multi-user invite during onboarding
