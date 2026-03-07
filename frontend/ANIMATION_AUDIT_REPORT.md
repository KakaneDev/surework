# Animation & Transition Audit Report

**Generated:** 2026-01-26
**Auditor:** UI/UX Auditor
**Scope:** Frontend animation performance, consistency, and accessibility

---

## Executive Summary

| Category | Issues Found | Severity |
|----------|-------------|----------|
| Inconsistent Timing/Duration | 8 | Medium |
| Non-GPU Animations | 12 | High |
| Missing prefers-reduced-motion | 4 locations need expansion | Medium |
| Missing Transitions | 6 | Low |
| Performance Issues | 5 | High |
| Accessibility Gaps | 3 | Medium |

---

## 1. Timing & Duration Inconsistencies

### Current Duration Values Found

| Duration | Count | Usage |
|----------|-------|-------|
| 150ms | 12 | Buttons, inputs, fast micro-interactions |
| 200ms | 18 | Cards, tabs, general hover states |
| 300ms | 14 | Larger elements, complex transitions |
| 500ms | 2 | Progress bars, chart animations |

### Issues

| File | Line | Current | Recommended | Issue |
|------|------|---------|-------------|-------|
| `shell.component.ts` | 561, 575 | `duration-300` | `duration-200` | Sidebar feels sluggish |
| `quick-action-button.component.ts` | 13, 19, 22, 29 | `duration-300` | `duration-200` | Too slow for button interactions |
| `hr-reports.component.ts` | 317, 328 | `duration-500` | `duration-300` | Progress bars too slow |
| `analytics-card.component.ts` | 35, 94, 221 | `duration-300` | `duration-200` | Card hover feels delayed |

### Recommended Duration Standards

```
Fast (micro-interactions): 150ms
Default (hover, focus): 200ms
Slow (complex, large): 300ms
```

---

## 2. Non-GPU Animations (Performance Issues)

These animations trigger layout/paint instead of compositor-only operations:

| File | Line | Property Animated | Fix Required |
|------|------|------------------|--------------|
| `button.component.ts` | 50 | `transition-all` | Use `transition-gpu` or explicit `transform, opacity` |
| `icon-button.component.ts` | 36 | `transition-all` | Use `transition-gpu` |
| `report-type-card.component.ts` | 13, 30 | `transition-all` | Use `transition-gpu` |
| `quick-action-button.component.ts` | 13 | `transition-all` + `hover:shadow-lg` | Shadow not GPU-accelerated |
| `report-generator.component.ts` | 44, 56, 94 | `transition-all` | Use specific properties |
| `shell.component.ts` | 561, 575 | `transition-all` | OK for layout, but could use `translate-x` only |
| `dashboard-content.component.ts` | 59, 212, 232, 268 | `transition-all` | Use specific properties |
| `my-documents.component.ts` | 28, 121, 129, 160, 175 | `transition-all` | Use specific properties |
| `notification-preferences.component.ts` | 68, 90, 117 | `after:transition-all` | OK for toggle switch (small element) |

### High-Priority Fixes

Progress bars animating `width` trigger layout:
- `financial-reports.component.ts:152` - `transition-all` on width
- `recruitment-reports.component.ts:138, 169` - `transition-all` on width
- `hr-reports.component.ts:317, 328` - `transition-all` on width
- `candidate-detail.component.ts:456` - `transition-all` on width
- `employee-detail.component.ts:345` - `transition-all` on width

**Recommendation:** Use `transform: scaleX()` instead of `width` for progress bars.

---

## 3. prefers-reduced-motion Support

### Current Coverage

✅ **Implemented in:**
- `styles/tokens.scss:135-140` - Sets transitions to 0ms
- `styles.scss:424-428` - Disables keyframe animations

### Missing Coverage

| File | Issue |
|------|-------|
| `spinner.component.ts` | Uses `animate-spin` - needs reduced-motion handling |
| `tailwind.config.js` | `animate-fade-in`, `animate-slide-in` not covered |
| Component inline animations | Many `transition-*` classes not affected by global setting |
| `shell.component.ts` | `navChildrenSlide` keyframe not covered |

### Recommended Fix

Add to `styles.scss`:
```scss
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 4. Missing Transitions

Elements with state changes but no transition feedback:

| Component | Element | Missing |
|-----------|---------|---------|
| `card.component.ts` | Card without `hover=true` | No transition on border/shadow |
| `data-table.component.ts` | Row selection | Abrupt background change |
| `tabs.component.ts` | Tab indicator | No slide animation |
| `pagination.component.ts` | Page buttons | No hover transition |
| `select.component.ts` | Dropdown arrow rotation | No rotation animation |
| Dialog backdrop | `.sw-backdrop` | No fade transition |

---

## 5. Easing Function Audit

### Current Easing Values

| Easing | Count | Usage |
|--------|-------|-------|
| `ease` | 8 | Most inline styles |
| `ease-out` | 4 | Keyframe animations |
| `ease-in-out` | 6 | Tailwind defaults |
| `linear` | 1 | Spinner only |

### Issues

- **Inconsistent:** Mix of `ease`, `ease-out`, and `ease-in-out` for similar interactions
- **Missing:** No `ease-out` for exit animations (dropdowns closing)

### Recommended Standard

```
Enter animations: ease-out (starts fast, slows down)
Exit animations: ease-in (starts slow, speeds up)
Hover/focus: ease-in-out (smooth both ways)
```

---

## 6. Loading Animation Consistency

### Spinner Analysis

| Location | Implementation | Consistent? |
|----------|---------------|-------------|
| `spinner.component.ts` | `animate-spin` | ✅ Base component |
| `button.component.ts` | `.sw-spinner` class | ✅ Uses shared |
| `styles.scss` | `.sw-spinner` definition | ✅ Centralized |

### Issues Found

- No skeleton loader component for content loading states
- Some loading states use inline spinners inconsistently:
  - `employees-list.component.ts` - Uses shared spinner ✅
  - `job-postings-list.component.ts` - Uses shared spinner ✅

---

## 7. Hover/Focus Transition Audit

### Elements Without Proper Feedback

| Element Type | File | Issue |
|--------------|------|-------|
| Icon-only buttons | Various | Some missing `hover:bg-*` |
| Table rows | `data-table.component.ts` | Has `hover:bg-neutral-50` but no transition |
| Sidebar nav | `shell.component.ts` | Uses `transition-colors` ✅ |
| Form inputs | `input.component.ts` | Uses `transition-colors duration-150` ✅ |

### Positive Findings

- Button components have consistent hover states ✅
- Dropdown items have proper focus states ✅
- Cards with `hover=true` have shadow transitions ✅

---

## 8. Page Transition Audit

### Current State

- **Router animations:** None configured
- **Route changes:** Instant, no transition
- **Modal/Dialog:** Uses `animate-fade-in` ✅

### Recommendations

1. Consider adding Angular route animations for smoother page transitions
2. Add fade transition to `router-outlet` content

---

## 9. Animation Performance Metrics

### High-Risk Patterns

| Pattern | Risk | Occurrences |
|---------|------|-------------|
| `transition-all` | Animates all properties | 50+ |
| Width/height animations | Triggers layout | 8 |
| Box-shadow animations | Triggers paint | 12 |
| `transform` + `opacity` only | GPU-composited ✅ | 6 |

### Recommended Refactors

1. **Replace `transition-all` with specific properties:**
   ```diff
   - transition-all duration-200
   + transition-gpu duration-200  // for opacity/transform only
   + transition-colors duration-200  // for background/border colors
   ```

2. **Progress bar optimization:**
   ```diff
   - <div class="h-full bg-primary-500 transition-all" [style.width.%]="progress">
   + <div class="h-full bg-primary-500 origin-left transition-transform"
   +      [style.transform]="'scaleX(' + progress/100 + ')'">
   ```

---

## 10. Priority Action Items

### Critical (Fix Immediately)

1. ⚠️ Add global `prefers-reduced-motion` override for all transitions
2. ⚠️ Replace progress bar `width` animations with `transform: scaleX()`
3. ⚠️ Replace `transition-all` in button components with `transition-colors`

### High (Fix This Sprint)

4. Standardize durations: 150ms/200ms/300ms only
5. Add transition to table row hover states
6. Optimize card shadow hover with pseudo-element opacity trick

### Medium (Backlog)

7. Add route transition animations
8. Create skeleton loader component
9. Standardize easing functions
10. Add dialog backdrop fade animation

---

## Appendix: Animation Token Reference

### Recommended Design Tokens

```scss
// Duration
--duration-fast: 150ms;
--duration-base: 200ms;
--duration-slow: 300ms;

// Easing
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

// GPU-safe properties only
--transition-gpu: transform, opacity;
--transition-colors: background-color, border-color, color, fill, stroke;
--transition-shadow: box-shadow;
```

### Tailwind Config Addition

```javascript
// tailwind.config.js
transitionDuration: {
  'fast': '150ms',
  'base': '200ms',
  'slow': '300ms',
},
transitionTimingFunction: {
  'in': 'cubic-bezier(0.4, 0, 1, 1)',
  'out': 'cubic-bezier(0, 0, 0.2, 1)',
  'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
}
```
