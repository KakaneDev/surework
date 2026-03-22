# Login Security UI/UX Audit Report

**Generated:** 2026-01-28
**Scope:** Authentication flows, login security, password management, MFA
**Files Audited:** 12 files

---

## Executive Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 3 |
| HIGH | 5 |
| MEDIUM | 7 |
| LOW | 4 |

The SureWork authentication system has a solid foundation with MFA support, JWT-based authentication, and token refresh mechanisms. However, several security and UX improvements are needed, particularly around password policies, rate limiting feedback, and session management visibility.

---

## Findings

### CRITICAL Issues

| # | File | Issue | Description | Recommendation |
|---|------|-------|-------------|----------------|
| C1 | `login.component.ts` | **No password strength requirements shown** | Login form only validates `required`. Users creating accounts have no visibility into password requirements until they fail. | Show password requirements in real-time during password entry. Add strength indicator. |
| C2 | `auth.service.ts:197-200` | **Tokens stored in localStorage** | JWT tokens stored in `localStorage` are vulnerable to XSS attacks. If any script injection occurs, tokens can be stolen. | Consider `httpOnly` cookies for refresh token. Store access token in memory only. |
| C3 | `forgot-password.component.ts` | **Password reset not implemented** | Component shows "Coming Soon" - users have no way to recover accounts if they forget passwords. | Implement password reset flow with email verification and secure tokens. |

### HIGH Issues

| # | File | Issue | Description | Recommendation |
|---|------|-------|-------------|----------------|
| H1 | `login.component.ts` | **No rate limiting feedback** | No UI indication when account is locked or rate-limited after failed attempts. Users don't know why login fails repeatedly. | Display lockout message with countdown timer. Show remaining attempts. |
| H2 | `login.component.ts:145` | **Weak password validation** | Only `Validators.required` for password. No minimum length, complexity, or common password checks. | Add `Validators.minLength(8)`, pattern validator for complexity, and common password list check. |
| H3 | `auth.service.ts:166-177` | **JWT expiry check vulnerable** | Token expiry checked client-side via `atob()` without signature verification. Tampered tokens could pass validation. | Always verify tokens server-side. Client check is only for UX. |
| H4 | `account-security.component.ts:318` | **Password minLength=8 is weak** | 8 characters is below current NIST recommendations (12+ characters). | Increase minimum to 12 characters. Show strength meter. |
| H5 | `mfa.component.ts:106` | **No subscription cleanup** | Constructor subscribes without cleanup. Memory leak potential and could cause issues on fast navigation. | Use `takeUntilDestroyed()` or proper subscription management. |

### MEDIUM Issues

| # | File | Issue | Description | Recommendation |
|---|------|-------|-------------|----------------|
| M1 | `login.component.ts` | **No "Remember me" option** | Users must re-enter email every time. Poor UX for frequent users. | Add "Remember me" checkbox that stores email (not password) in localStorage. |
| M2 | `login.component.ts` | **No login attempt logging visible** | No UI showing recent login attempts or suspicious activity. | Add "Recent activity" section in account security settings. |
| M3 | `mfa.component.ts:45` | **No auto-submit on 6 digits** | Users must click "Verify" after entering MFA code. Most apps auto-submit. | Auto-submit form when 6 digits entered. |
| M4 | `account-security.component.ts` | **No session management UI** | Users cannot see or revoke active sessions on other devices. | Add "Active sessions" list with device info and revoke option. |
| M5 | `auth.guard.ts:21` | **Return URL exposed in query params** | Redirect URL visible in browser, could be used for phishing. | Store return URL in sessionStorage instead of query params. |
| M6 | `mfa.component.ts` | **No "Resend code" option** | If user doesn't receive code, no way to request new one. | Add "Didn't receive code?" link with cooldown timer. |
| M7 | `account-security.component.ts:169-171` | **MFA secret displayed in plain text** | Manual entry key shown without copy button or obfuscation option. | Add copy button, show only on user action, mask by default. |

### LOW Issues

| # | File | Issue | Description | Recommendation |
|---|------|-------|-------------|----------------|
| L1 | `login.component.ts:48` | **Email placeholder uses example** | `you@company.com` placeholder doesn't match expected format for this South African app. | Use `yourname@company.co.za` or just `Email address`. |
| L2 | `login.component.ts` | **No keyboard shortcut for password toggle** | Accessibility: Users must click icon to toggle visibility. | Add `Alt+V` or similar keyboard shortcut. |
| L3 | `account-security.component.ts:30-35` | **No password visibility toggle** | Current password field has no show/hide toggle. | Add visibility toggle consistent with login page. |
| L4 | `mfa.component.ts:46` | **MFA code tracking-[0.5em] hard to read** | Large letter spacing makes code hard to verify visually. | Reduce to `tracking-widest` (0.1em). |

---

## Security Architecture Analysis

### Current Implementation

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Login Form    │────▶│   Auth Service  │────▶│   Admin API     │
│                 │     │                 │     │   (Port 8088)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  localStorage   │
                        │  - access_token │
                        │  - refresh_token│
                        └─────────────────┘
```

### Recommended Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Login Form    │────▶│   Auth Service  │────▶│   Admin API     │
│   + Rate Limit  │     │   + Memory      │     │   + Rate Limit  │
│     Feedback    │     │     Token Store │     │   + Lockout     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  httpOnly Cookie│ (refresh token)
                        │  + Memory Store │ (access token)
                        └─────────────────┘
```

---

## Positive Findings

The following security features are properly implemented:

| Feature | Implementation | File |
|---------|----------------|------|
| MFA Support | TOTP-based with QR code and backup codes | `mfa.component.ts`, `account-security.component.ts` |
| Token Refresh | Automatic refresh on 401 with interceptor | `auth.interceptor.ts` |
| Password Visibility Toggle | Clear UI with icon state change | `login.component.ts:79-88` |
| Form Validation | Real-time with aria-invalid attributes | `login.component.ts:50-51` |
| Error Display | Proper role="alert" for screen readers | `login.component.ts:97-99` |
| Session Check | Guard verifies authentication before route access | `auth.guard.ts` |
| MFA Challenge Flow | Separate MFA page with challenge token | `mfa.component.ts`, `auth.effects.ts` |
| Dark Mode Support | All auth components have dark mode styles | All auth components |

---

## Detailed Recommendations

### 1. Password Strength Implementation

```typescript
// Add to login.component.ts or shared validator
const passwordValidators = [
  Validators.required,
  Validators.minLength(12),
  Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  customPasswordValidator // Check against common passwords list
];
```

**UI Component:**
```html
<div class="password-strength-meter">
  <div class="strength-bar" [class]="strengthClass">
    <span class="strength-fill" [style.width.%]="strengthPercent"></span>
  </div>
  <span class="strength-label">{{ strengthLabel }}</span>
</div>
```

### 2. Rate Limiting Feedback

```typescript
// auth.effects.ts - Enhanced error handling
catchError(error => {
  if (error.status === 429) {
    const retryAfter = error.headers.get('Retry-After') || '60';
    return of(loginRateLimited({
      remainingSeconds: parseInt(retryAfter),
      message: `Too many attempts. Try again in ${retryAfter} seconds.`
    }));
  }
  if (error.error?.locked) {
    return of(accountLocked({
      unlockTime: error.error.unlockTime,
      message: 'Account temporarily locked due to multiple failed attempts.'
    }));
  }
  return of(loginFailure({ error: error.error?.detail || 'Login failed' }));
})
```

### 3. Secure Token Storage

```typescript
// auth.service.ts - Memory-only access token
private accessToken: string | null = null;

// For refresh token, use httpOnly cookie set by backend
// Backend response should set:
// Set-Cookie: refresh_token=xxx; HttpOnly; Secure; SameSite=Strict; Path=/api/auth
```

### 4. Session Management UI

```html
<!-- Add to account-security.component.ts -->
<div class="active-sessions-section">
  <h3>Active Sessions</h3>
  @for (session of activeSessions(); track session.id) {
    <div class="session-card">
      <div class="session-info">
        <span class="material-icons">{{ session.deviceIcon }}</span>
        <div>
          <p class="device-name">{{ session.deviceName }}</p>
          <p class="session-location">{{ session.location }} · {{ session.lastActive | relativeTime }}</p>
        </div>
      </div>
      @if (!session.isCurrent) {
        <button (click)="revokeSession(session.id)" class="sw-btn sw-btn-danger-outline sw-btn-sm">
          Revoke
        </button>
      } @else {
        <span class="current-badge">Current Session</span>
      }
    </div>
  }
</div>
```

---

## Priority Implementation Order

1. **Week 1:** Implement password reset flow (C3)
2. **Week 1:** Add rate limiting feedback UI (H1)
3. **Week 2:** Enhance password validation (H2, H4)
4. **Week 2:** Fix MFA subscription leak (H5)
5. **Week 3:** Evaluate token storage security (C2)
6. **Week 3:** Add session management UI (M4)
7. **Week 4:** Implement remaining medium/low items

---

## Compliance Considerations

| Standard | Current Status | Gap |
|----------|----------------|-----|
| POPIA (SA) | Partial | Need session management, activity logs |
| OWASP Top 10 | Partial | A01 (Broken Access Control) - token storage concern |
| NIST 800-63B | Non-compliant | Password length below recommendation |

---

## Conclusion

The SureWork authentication system has a good foundation with MFA support and proper token refresh. The critical issues around password reset functionality and token storage should be addressed immediately. The password policy should be strengthened to meet current security standards, and rate limiting feedback should be implemented to improve both security and user experience.

**Overall Security Score: 6.5/10**

With recommended fixes: **8.5/10**
