# Research: SureWork - South African SME ERP Platform

**Feature**: 001-surework-sme-erp
**Date**: 2026-01-21
**Phase**: 0 (Pre-Design Research)

## Executive Summary

This document captures research findings and technical decisions for the SureWork SME ERP platform. All specification ambiguities have been resolved through the `/speckit.clarify` session. The constitution check passed all 15 principles.

## Clarifications Resolved

All clarifications were resolved during the specification phase (see spec.md Clarifications section):

| Question | Resolution | Impact on Design |
|----------|------------|------------------|
| Multi-tenant isolation strategy | Schema-per-tenant | Each SME tenant gets isolated PostgreSQL schema; requires tenant-service for schema provisioning and connection routing |
| User authentication model | Email/password + mandatory MFA | identity-service handles authentication with JWT; MFA via SMS OTP or authenticator app |
| External API failure handling | Graceful degradation with queued retry | notification-service manages retry queue; exponential backoff (max 5 attempts over 24 hours) |
| Role-based access control model | Predefined roles with limited customization | 5 predefined roles (Owner, HR Manager, Payroll Admin, Accountant, Employee); permission overrides are audit-logged |

## Technical Research

### Multi-Tenancy Architecture

**Decision**: Schema-per-tenant isolation

**Research Findings**:
- PostgreSQL supports schema-level isolation effectively
- Spring's AbstractRoutingDataSource can route to tenant schemas
- Flyway can migrate all tenant schemas with programmatic execution
- Schema-per-tenant provides strong POPIA compliance (no data leakage risk)

**Implementation Approach**:
```
Tenant Request Flow:
1. JWT token contains tenantId claim
2. TenantContext ThreadLocal extracts tenantId from SecurityContext
3. AbstractRoutingDataSource routes to schema_{tenantId}
4. Flyway migrations run per-schema during tenant provisioning
```

### South African Regulatory Compliance

**SARS Tax Tables**:
- Tax tables published annually before 1 March
- Tables include: PAYE brackets, rebates (Primary, Secondary, Tertiary), thresholds
- Tax year: 1 March - 28/29 February (not calendar year)
- ETI (Employment Tax Incentive) for qualifying employees aged 18-29

**BCEA Leave Calculations**:
- Annual leave: 1 day per 17 days worked (minimum 15 days/year for 5-day week)
- Sick leave: 30 days per 36-month cycle (tracked from employment start)
- Family responsibility leave: 3 days per annual cycle

**POPIA Data Retention**:
- Recruitment data: 12 months (auto-delete unless consent renewed)
- Financial records: 5 years (SARS requirement)
- Employee records: 3 years post-termination, then anonymize

**Two-Pot Retirement System** (effective September 2024):
- Savings component: Accessible, taxed at marginal rate
- Retirement component: Locked until retirement
- Tax directive required for withdrawals
- Minimum withdrawal: R2,000

### External Integrations

**Open Banking (Bank Feeds)**:
- Providers: Stitch, Revio (SA-focused)
- API: REST-based, OAuth2 authentication
- Transaction fetch: Near real-time (within 24 hours)
- Reconciliation matching: >95% automatic matching target

**Background Checks**:
- Providers: MIE, LexisNexis
- Checks: Criminal record, credit, qualification verification
- Consent: Required before initiation (POPIA)
- Turnaround: 24-72 hours

**eSign (Digital Signatures)**:
- ECT Act recognizes electronic signatures as legally binding
- Options: DocuSign, Adobe Sign, or built-in eSign
- Recommendation: Built-in eSign for cost control (SME pricing constraint)

### Performance Requirements

| Metric | Target | Implementation Strategy |
|--------|--------|------------------------|
| Concurrent users | 10,000 | Virtual threads, Redis caching, HPA scaling |
| Journal creation | <30 seconds | Async Kafka event, background processing |
| Dashboard refresh | <5 seconds | Redis-cached aggregations, WebSocket updates |
| Two-Pot simulation | <3 seconds | In-memory calculation, no DB round-trip |
| PWA on 3G (1Mbps) | <5s page load | Code splitting, lazy loading, service worker caching |

### Security Architecture

**Authentication Flow**:
```
1. User submits email/password
2. identity-service validates credentials (BCrypt cost 12)
3. MFA challenge issued (SMS OTP or TOTP)
4. User submits MFA code
5. JWT issued (access token: 15min, refresh token: 7 days)
6. JWT contains: userId, tenantId, roles, permissions
```

**Authorization Model**:
- 5 predefined roles with default permission sets
- Permission overrides stored in role_permission_overrides table
- All permission changes audit-logged
- Constraint: At least one Owner per tenant; cannot self-demote last Owner

## Dependencies and Risks

### External Dependencies

| Dependency | Risk Level | Mitigation |
|------------|------------|------------|
| SARS tax table publication | Low | Tables historically available by mid-February; 2-week buffer |
| Open Banking API availability | Medium | Graceful degradation; queue-based retry; manual import fallback |
| Background check API availability | Medium | Queue-based retry; status tracking UI |
| Azure SA North region | Low | Microsoft SLA; DR to secondary region if needed |

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Schema-per-tenant migration complexity | Medium | Automated Flyway execution; tenant provisioning pipeline |
| Multi-tenant data leakage | High | Schema isolation; TenantContext validation; integration tests |
| SARS calculation accuracy | High | Unit tests against published examples; parallel run verification |
| PWA performance on 3G | Medium | Lighthouse audits; lazy loading; service worker optimization |

## Research Conclusion

**Status**: All clarifications resolved. No blocking research items remain.

**Proceed to Phase 1**: Data model design, API contracts, and quickstart documentation.
