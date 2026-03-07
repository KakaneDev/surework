# Button Consistency Audit Report

**Generated:** 2026-01-26
**Auditor:** UI/UX Auditor
**Scope:** All button implementations across the frontend application

---

## Executive Summary

| Category | Status | Issues |
|----------|--------|--------|
| Component Library | Good | Well-defined `sw-button` and `sw-icon-button` |
| Usage Adoption | Mixed | ~40% using components, ~60% inline styles |
| Padding Consistency | Poor | 8+ different padding combinations |
| Color Consistency | Mixed | Some use `primary-500`, others `primary-600` |
| Border Radius | Good | Mostly `rounded-lg` |
| Transitions | Mixed | Inconsistent duration/easing values |

**Overall Score: 6/10** - Component library is solid, but inconsistent adoption

---

## 1. Component Library Analysis

### sw-button (Shared Component)

**Location:** `src/app/shared/ui/button/button.component.ts`

| Property | Values | Status |
|----------|--------|--------|
| Variants | primary, secondary, outline, ghost, danger | Complete |
| Sizes | sm, md, lg | Complete |
| Loading state | Yes | Complete |
| Disabled state | Yes, with `opacity-50` | Complete |
| Focus ring | Yes, `ring-2 ring-offset-2` | Complete |
| Transition | `transition-colors duration-fast` | Optimized |

**Size Specifications:**
| Size | Padding | Font Size | Gap |
|------|---------|-----------|-----|
| sm | `px-3 py-1.5` | `text-sm` | `gap-1.5` |
| md | `px-4 py-2` | `text-sm` | `gap-2` |
| lg | `px-6 py-3` | `text-base` | `gap-2.5` |

### sw-icon-button (Shared Component)

**Location:** `src/app/shared/ui/button/icon-button.component.ts`

| Property | Values | Status |
|----------|--------|--------|
| Variants | primary, secondary, ghost, danger | Missing `outline` |
| Sizes | sm, md, lg | Complete |
| Loading state | No | Missing |
| Disabled state | Yes | Complete |

**Size Specifications:**
| Size | Padding |
|------|---------|
| sm | `p-1.5` |
| md | `p-2` |
| lg | `p-3` |

---

## 2. Inline Button Inconsistencies

### Padding Variations Found

| Pattern | Count | Files | Standard? |
|---------|-------|-------|-----------|
| `px-4 py-2` | 25+ | Multiple | **Yes (md)** |
| `px-3 py-1.5` | 8 | Multiple | **Yes (sm)** |
| `px-6 py-3` | 5 | Multiple | **Yes (lg)** |
| `px-5 py-2.5` | 4 | support-dashboard | No |
| `px-5 py-3` | 3 | quick-action-button | No |
| `px-6 py-2` | 2 | candidate-form | No |
| `px-3 py-2` | 3 | Multiple | No |
| `px-8 py-3` | 1 | report-generator | No |
| `p-2` | 15+ | Icon buttons | **Yes (md)** |
| `p-1.5` | 5 | Icon buttons | **Yes (sm)** |

### Color Variations

| Primary Button Color | Count | Standard? |
|---------------------|-------|-----------|
| `bg-primary-500 hover:bg-primary-600` | 30+ | **Yes** |
| `bg-primary-600 hover:bg-primary-700` | 6 | No (darker) |
| `bg-success-500 hover:bg-success-600` | 2 | Semantic OK |
| `bg-error-500 hover:bg-error-600` | 3 | Semantic OK |

---

## 3. Files With Inconsistent Buttons

### HIGH Priority (Non-standard padding)

| File | Issue | Line(s) |
|------|-------|---------|
| `support-dashboard.component.ts` | Uses `px-5 py-2.5` instead of `px-4 py-2` | 20, 135 |
| `quick-action-button.component.ts` | Uses `px-5 py-3` for default | 13, 67 |
| `candidate-form.component.ts` | Uses `px-6 py-2` (mixing lg padding with md height) | 294 |
| `report-generator.component.ts` | Uses `px-8 py-3` (non-standard) | 207 |
| `report-generator.component.ts` | Uses `px-6 py-3` for cancel (should be md) | 200 |
| `not-found.component.ts` | Uses `px-6 py-3` (lg) for single action | 15 |

### MEDIUM Priority (Not using shared components)

| File | Issue | Recommendation |
|------|-------|----------------|
| `payroll-run-list.component.ts` | Inline primary button styles | Use `<sw-button variant="primary">` |
| `payroll-run-detail.component.ts` | Multiple inline buttons | Use `<sw-button>` components |
| `recruitment/candidate-detail.component.ts` | 10+ inline buttons | Refactor to use `<sw-button>` |
| `recruitment/job-posting-detail.component.ts` | 5+ inline buttons | Refactor to use `<sw-button>` |
| `my-payslips.component.ts` | Inline primary button | Use `<sw-button variant="primary">` |
| `my-documents.component.ts` | Multiple inline styles | Use shared components |

### Using `primary-600` Instead of `primary-500`

| File | Lines |
|------|-------|
| `support-dashboard.component.ts` | 20, 115, 135 |

---

## 4. Missing Features in Components

### sw-icon-button Missing

1. **Loading state** - No spinner support
2. **Outline variant** - Only ghost available for bordered style
3. **aria-busy** - Not implemented during loading

### sw-button Missing

1. **Icon slot** - No built-in icon support (must use `<ng-content>`)
2. **Icon-only mode** - Would need to use `sw-icon-button` instead

---

## 5. Text/Link Buttons

Found inconsistent "link-style" buttons:

| Pattern | Files |
|---------|-------|
| `text-primary-500 hover:text-primary-600 font-medium` | 8 files |
| `px-4 py-2 text-primary-500 hover:text-primary-600` | 5 files |
| `text-neutral-600 hover:bg-neutral-100` | 10+ files (ghost variant) |

**Recommendation:** Create a `link` variant in `sw-button` or use ghost consistently.

---

## 6. Recommended Fixes

### Critical (Fix Immediately)

1. **Standardize primary button color to `primary-500`**
   ```diff
   - bg-primary-600 hover:bg-primary-700
   + bg-primary-500 hover:bg-primary-600
   ```

2. **Fix non-standard padding in support-dashboard.component.ts**
   ```diff
   - px-5 py-2.5
   + px-4 py-2  (for md size)
   ```

### High Priority

3. **Add missing features to sw-icon-button:**
   - Add loading state
   - Add outline variant

4. **Refactor high-traffic pages to use shared components:**
   - `candidate-detail.component.ts`
   - `job-posting-detail.component.ts`
   - `payroll-run-detail.component.ts`

### Medium Priority

5. **Create text/link button variant:**
   ```typescript
   // Add to button.component.ts variants
   link: 'bg-transparent text-primary-500 hover:text-primary-600 hover:underline focus:ring-primary-500'
   ```

6. **Document button usage guidelines** in a style guide

---

## 7. Button Usage Patterns Reference

### When to Use Each Variant

| Variant | Use Case | Example |
|---------|----------|---------|
| Primary | Main CTA, submit forms | "Save", "Create", "Confirm" |
| Secondary | Secondary actions | "Export", "Filter" |
| Outline | Tertiary actions, cancel | "Cancel", "Edit" |
| Ghost | Icon actions, minimal UI | Menu triggers, close buttons |
| Danger | Destructive actions | "Delete", "Remove" |

### When to Use Each Size

| Size | Use Case |
|------|----------|
| sm | Compact UI, table actions, inline |
| md | Default for all buttons |
| lg | Hero sections, prominent CTAs |

---

## 8. Consistency Checklist

- [ ] All primary buttons use `bg-primary-500`
- [ ] All buttons use standard padding (sm/md/lg)
- [ ] All interactive buttons have hover states
- [ ] All buttons have focus-visible ring
- [ ] All buttons have disabled state styling
- [ ] Icon buttons have aria-label
- [ ] Loading buttons show spinner and disable interaction
- [ ] Danger buttons use `bg-error-500`

---

## Appendix: Files Scanned

Scanned **71 files** containing button elements across:
- `/features/` - 58 files
- `/shared/` - 8 files
- `/core/` - 5 files
