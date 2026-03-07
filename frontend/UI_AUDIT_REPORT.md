# UI/UX Audit Report: Onboarding Flow

**Generated:** 2026-01-29
**Scope:** `/src/app/features/onboarding/**`
**Auditor:** Claude UI/UX Auditor

---

## Executive Summary

The onboarding wizard is **well-implemented** with a solid foundation. The flow uses Angular 18+ best practices including signals, standalone components, and modern control flow syntax. Tailwind CSS is used consistently with a well-defined design token system.

### Scores

| Category | Score | Grade |
|----------|-------|-------|
| **Consistency** | 85/100 | A |
| **Accessibility** | 72/100 | B |
| **UX Patterns** | 78/100 | B+ |
| **Mobile Responsiveness** | 80/100 | B+ |
| **Performance** | 90/100 | A |

### Issue Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 3 |
| Medium | 8 |
| Low | 6 |

---

## Detailed Findings

### HIGH SEVERITY

#### HIGH-001: Missing ARIA Live Regions for Async Validation
**Files:** `account-step.component.ts:64-69`, `company-step.component.ts:96-101`
**Issue:** Email and registration number availability feedback is not announced to screen readers.

\`\`\`html
<!-- Current -->
@if (emailAvailable() === false && form.get('email')?.valid) {
  <p class="sw-error-text">{{ 'onboarding.account.emailTaken' | translate }}</p>
}

<!-- Recommended -->
<div role="status" aria-live="polite" class="sr-only">
  {{ emailAvailable() === false ? ('onboarding.account.emailTaken' | translate) : '' }}
</div>
@if (emailAvailable() === false && form.get('email')?.valid) {
  <p class="sw-error-text">{{ 'onboarding.account.emailTaken' | translate }}</p>
}
\`\`\`

**Impact:** Screen reader users won't be notified of async validation results.

---

#### HIGH-002: Progress Bar Steps Not Keyboard Accessible
**File:** `onboarding-wizard.component.ts:60-72`
**Issue:** Progress bar step indicators are not focusable or clickable, violating WCAG 2.1 SC 2.4.1 (Bypass Blocks).

\`\`\`html
<!-- Current - Not interactive -->
<div class="flex flex-col items-center relative z-10">
  <div [ngClass]="...">
    <span class="material-icons text-lg">{{ step.icon }}</span>
  </div>
  <span class="text-xs text-white mt-2 hidden sm:block">{{ step.label | translate }}</span>
</div>

<!-- Recommended - Clickable steps -->
<button
  type="button"
  class="flex flex-col items-center relative z-10"
  [disabled]="step.id > currentStep()"
  [attr.aria-current]="step.id === currentStep() ? 'step' : null"
  [attr.aria-label]="step.label | translate"
  (click)="goToStep(step.id)"
>
  <!-- ... -->
</button>
\`\`\`

**Impact:** Users cannot navigate between steps directly; must use Back button repeatedly.

---

#### HIGH-003: Form Validation Errors Not Associated with Inputs
**Files:** All step components
**Issue:** Error messages lack \`aria-describedby\` association with their inputs.

\`\`\`html
<!-- Current -->
<input id="email" ... />
@if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
  <p class="sw-error-text">{{ 'errors.requiredField' | translate }}</p>
}

<!-- Recommended -->
<input
  id="email"
  [attr.aria-describedby]="form.get('email')?.invalid && form.get('email')?.touched ? 'email-error' : null"
  [attr.aria-invalid]="form.get('email')?.invalid && form.get('email')?.touched"
  ...
/>
@if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
  <p id="email-error" class="sw-error-text" role="alert">{{ 'errors.requiredField' | translate }}</p>
}
\`\`\`

**Impact:** Screen readers won't associate error messages with form fields.

---

### MEDIUM SEVERITY

#### MED-001: No Loading State for Availability Checks
**Files:** \`account-step.component.ts:48-56\`
**Issue:** Loading spinner shown but no text alternative for screen readers.

\`\`\`html
<!-- Current -->
@if (checkingEmail()) {
  <span class="absolute right-3 top-1/2 -translate-y-1/2">
    <span class="animate-spin material-icons text-neutral-400">refresh</span>
  </span>
}

<!-- Recommended -->
@if (checkingEmail()) {
  <span class="absolute right-3 top-1/2 -translate-y-1/2" role="status">
    <span class="animate-spin material-icons text-neutral-400" aria-hidden="true">refresh</span>
    <span class="sr-only">{{ 'common.checking' | translate }}</span>
  </span>
}
\`\`\`

---

#### MED-002: Password Toggle Button Missing ARIA State
**File:** \`account-step.component.ts:87-95\`
**Issue:** Password visibility toggle lacks \`aria-pressed\` state.

\`\`\`html
<!-- Current -->
<button type="button" (click)="togglePasswordVisibility()" class="...">
  <span class="material-icons">{{ hidePassword() ? 'visibility_off' : 'visibility' }}</span>
</button>

<!-- Recommended -->
<button
  type="button"
  (click)="togglePasswordVisibility()"
  [attr.aria-pressed]="!hidePassword()"
  [attr.aria-label]="hidePassword() ? ('common.showPassword' | translate) : ('common.hidePassword' | translate)"
  class="..."
>
  <span class="material-icons" aria-hidden="true">{{ hidePassword() ? 'visibility_off' : 'visibility' }}</span>
</button>
\`\`\`

---

#### MED-003: Select Dropdowns Missing Placeholder Styling
**Files:** \`company-step.component.ts:116\`, \`contact-step.component.ts:137\`
**Issue:** Default empty option uses same styling as selected values.

\`\`\`html
<!-- Current -->
<option value="">{{ 'onboarding.company.selectCompanyType' | translate }}</option>

<!-- Recommended - Add disabled and hidden attributes -->
<option value="" disabled hidden>{{ 'onboarding.company.selectCompanyType' | translate }}</option>
\`\`\`

Or use CSS to style placeholder differently:
\`\`\`scss
select option[value=""] {
  color: theme('colors.neutral.400');
}
\`\`\`

---

#### MED-004: Review Step Data Display Lacks Visual Hierarchy
**File:** \`review-step.component.ts:29-132\`
**Issue:** All sections have identical styling, making it hard to scan quickly.

**Recommendation:** Differentiate sections with subtle color variations or icons with different colors per section.

---

#### MED-005: No Confirmation Before Navigation Away
**File:** \`onboarding-wizard.component.ts\`
**Issue:** If user has entered data and accidentally navigates away, all progress is lost.

**Recommendation:** Add \`canDeactivate\` guard:
\`\`\`typescript
@HostListener('window:beforeunload', ['$event'])
unloadNotification($event: any) {
  if (this.hasUnsavedChanges()) {
    $event.returnValue = true;
  }
}
\`\`\`

---

#### MED-006: Step Transition Has No Animation
**File:** \`onboarding-wizard.component.ts:78-96\`
**Issue:** Step content changes instantly without visual feedback.

**Recommendation:** Add fade/slide animation using existing animation utilities:
\`\`\`html
<div class="p-6 md:p-8 animate-slide-up">
  @switch (currentStep()) { ... }
</div>
\`\`\`

---

#### MED-007: Terms Checkbox Touch Target Too Small
**File:** \`review-step.component.ts:137-141\`
**Issue:** Checkbox is 20x20px (w-5 h-5), below 44x44px minimum touch target.

\`\`\`html
<!-- Current -->
<input type="checkbox" class="mt-1 w-5 h-5 ..." />

<!-- Recommended - Larger clickable area -->
<label class="flex items-start gap-3 cursor-pointer p-2 -m-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
  <input type="checkbox" class="mt-1 w-5 h-5 ..." />
  <span class="text-sm ...">...</span>
</label>
\`\`\`

---

#### MED-008: Missing Input Icons for Visual Context
**Files:** \`compliance-step.component.ts\`, \`contact-step.component.ts\`
**Issue:** Unlike account step (email icon), compliance and contact fields lack visual icons.

**Recommendation:** Add consistent iconography:
- Tax Number: \`receipt_long\`
- VAT Number: \`account_balance\`
- UIF Reference: \`people\`
- SDL Number: \`school\`
- PAYE Reference: \`payments\`
- Phone: \`phone\`
- Address: \`location_on\`

---

### LOW SEVERITY

#### LOW-001: Inconsistent Input Field Padding
**Files:** Various step components
**Issue:** Password field has \`pr-10\` for icon, email has \`pr-10\`, but other fields don't have icons but could benefit from consistent padding.

---

#### LOW-002: Progress Bar Hidden Labels on Mobile
**File:** \`onboarding-wizard.component.ts:69\`
**Issue:** Step labels hidden on mobile (\`hidden sm:block\`), reducing context.

**Recommendation:** Consider showing truncated labels or numbered indicators on mobile.

---

#### LOW-003: Missing Autofocus on First Field
**Files:** All step components
**Issue:** First field in each step doesn't receive autofocus, requiring extra tab press.

\`\`\`html
<input id="email" ... autofocus />
\`\`\`

Or in component:
\`\`\`typescript
@ViewChild('firstInput') firstInput: ElementRef;
ngAfterViewInit() {
  this.firstInput?.nativeElement?.focus();
}
\`\`\`

---

#### LOW-004: Success Page Missing Skip Link
**File:** \`signup-success.component.ts\`
**Issue:** No way to skip to main content for keyboard users.

---

#### LOW-005: Hard-Coded "South Africa" in Address
**File:** Noted from backend \`SignupServiceImpl.java:158\`
**Issue:** Country is hard-coded; UI should either show this or allow selection.

---

#### LOW-006: Email Checking Debounce Could Be Shorter
**File:** \`account-step.component.ts:177\`
**Issue:** 500ms debounce feels slightly sluggish.

**Recommendation:** Reduce to 300ms for better perceived performance.

---

## Consistency Analysis

### What's Working Well

1. **Tailwind Integration** - Consistent use of \`sw-*\` component classes
2. **Color Palette** - Proper use of design tokens (primary-500, neutral-600, etc.)
3. **Spacing System** - Consistent use of Tailwind spacing scale (space-y-6, gap-4)
4. **Typography** - Consistent heading sizes (text-2xl for section titles)
5. **Form Elements** - All inputs use \`sw-input\`, \`sw-label\`, \`sw-error-text\`
6. **Dark Mode** - Full dark mode support throughout
7. **i18n** - Complete internationalization coverage

### Design Token Usage

| Token | Usage | Consistency |
|-------|-------|-------------|
| \`primary-500\` | CTAs, active states | Excellent |
| \`neutral-*\` | Text, borders | Excellent |
| \`error-500\` | Validation errors | Excellent |
| \`success-500/600\` | Success states | Good |
| \`sw-input\` | All form inputs | Excellent |
| \`sw-label\` | All form labels | Excellent |

---

## Mobile Responsiveness Analysis

### Breakpoints Used
- \`sm:\` (640px) - Step labels, grid columns
- \`md:\` (768px) - Card padding, grid layouts

### Issues
1. Progress bar labels hidden on mobile
2. Some grid layouts (2-col) don't stack properly on narrow screens
3. Navigation button spacing could be tighter on mobile

---

## Accessibility Checklist

| Criteria | Status | Notes |
|----------|--------|-------|
| Semantic HTML | Partial | Missing proper form landmarks |
| ARIA Labels | Needs Work | Progress steps, async feedback |
| Focus Management | Partial | No autofocus, step navigation |
| Keyboard Navigation | Good | Forms navigable, progress not clickable |
| Color Contrast | Excellent | Proper contrast ratios |
| Screen Reader | Needs Work | Missing announcements for validation |
| Reduced Motion | Excellent | Respects prefers-reduced-motion |

---

## Performance Analysis

### Strengths
1. **Change Detection** - OnPush strategy used throughout
2. **Signals** - Modern signal-based state management
3. **Lazy Loading** - Route lazy-loads onboarding module
4. **Debounced Validation** - Async checks properly debounced

### Potential Improvements
1. Consider skeleton loading for slow networks
2. Preload next step's validation requirements

---

## Prioritized Recommendations

### Immediate (This Sprint)
1. **HIGH-001**: Add aria-live regions for async validation
2. **HIGH-003**: Associate error messages with inputs
3. **MED-002**: Fix password toggle accessibility

### Short Term (Next Sprint)
4. **HIGH-002**: Make progress steps clickable
5. **MED-005**: Add unsaved changes guard
6. **MED-006**: Add step transition animation
7. **MED-007**: Increase checkbox touch target

### Backlog
8. MED-001 through MED-008 (medium items)
9. All LOW items

---

## Files Modified Checklist

When implementing fixes, the following files need updates:

- [ ] \`onboarding-wizard.component.ts\` - Progress bar accessibility, step navigation
- [ ] \`account-step.component.ts\` - ARIA live region, autofocus
- [ ] \`company-step.component.ts\` - ARIA live region, select placeholder
- [ ] \`compliance-step.component.ts\` - Input icons, error association
- [ ] \`contact-step.component.ts\` - Input icons, select placeholder
- [ ] \`review-step.component.ts\` - Checkbox touch target, visual hierarchy
- [ ] \`signup-success.component.ts\` - Skip link
- [ ] \`src/styles.scss\` - Additional accessibility utilities
- [ ] \`src/assets/i18n/en.json\` - New translation keys for accessibility

---

## Conclusion

The onboarding flow has a strong foundation with good consistency and modern Angular practices. The main gaps are in accessibility, particularly for screen reader users and keyboard navigation. Implementing the HIGH priority items will significantly improve the experience for users with disabilities while the MEDIUM items will enhance the overall UX polish.

**Estimated Effort:** 8-12 hours for HIGH + MEDIUM items
