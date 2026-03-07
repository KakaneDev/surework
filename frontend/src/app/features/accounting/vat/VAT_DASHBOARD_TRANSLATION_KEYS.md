# VAT Dashboard Translation Keys

## File Updated
`/Users/harrismogale/Documents/GitHub/inmo/surework/surework/frontend/src/app/features/accounting/vat/vat-dashboard.component.ts`

## Component Changes

### 1. Added Imports
- `TranslateModule` - Added to component imports
- `TranslateService` - Injected into component class

### 2. Replaced Hardcoded Strings
All hardcoded English strings replaced with translation keys using the pattern `accounting.vat.dashboard.*`

---

## Required Translation Keys

### Dashboard Section Keys (30 keys)

| Key | Usage | Suggested Value |
|-----|-------|-----------------|
| `accounting.vat.dashboard.pageTitle` | Main page title | "VAT201 Returns" |
| `accounting.vat.dashboard.pageDescription` | Page subtitle | "Manage VAT reports for SARS submission" |
| `accounting.vat.dashboard.reportHistory` | Report History button | "Report History" |
| `accounting.vat.dashboard.generateVatReturn` | Generate VAT Return button | "Generate VAT Return" |
| `accounting.vat.dashboard.currentPeriod` | Current Period card title | "Current Period" |
| `accounting.vat.dashboard.noReportGenerated` | Empty current period message | "No report generated" |
| `accounting.vat.dashboard.ytdVatPayable` | YTD VAT Payable card title | "YTD VAT Payable" |
| `accounting.vat.dashboard.ytdVatRefundable` | YTD VAT Refundable card title | "YTD VAT Refundable" |
| `accounting.vat.dashboard.ytdNetPosition` | YTD Net Position card title | "YTD Net Position" |
| `accounting.vat.dashboard.payableToSars` | Payable to SARS text | "Payable to SARS" |
| `accounting.vat.dashboard.refundableFromSars` | Refundable from SARS text | "Refundable from SARS" |
| `accounting.vat.dashboard.overdueReturn` | Overdue return alert | "{{count}} Overdue Return\|{{count}} Overdue Returns" |
| `accounting.vat.dashboard.submitImmediately` | Overdue warning | "Submit immediately to avoid penalties" |
| `accounting.vat.dashboard.viewOverdue` | View Overdue button | "View Overdue" |
| `accounting.vat.dashboard.pendingSubmission` | Pending submission alert | "{{count}} Pending Submission\|{{count}} Pending Submissions" |
| `accounting.vat.dashboard.nextDue` | Next due date message | "Next due: {{date}}" |
| `accounting.vat.dashboard.viewPending` | View Pending button | "View Pending" |
| `accounting.vat.dashboard.currentPeriodLabel` | Current Period section header | "Current Period: {{period}}" |
| `accounting.vat.dashboard.viewDetails` | View Details button | "View Details" |
| `accounting.vat.dashboard.submitToSars` | Submit to SARS button | "Submit to SARS" |
| `accounting.vat.dashboard.period` | Period label (reused in table) | "Period" |
| `accounting.vat.dashboard.status` | Status label (reused in table) | "Status" |
| `accounting.vat.dashboard.dueDate` | Due Date label (reused in table) | "Due Date" |
| `accounting.vat.dashboard.days` | Days suffix | "days" |
| `accounting.vat.dashboard.amountPayable` | Amount Payable label | "Amount Payable" |
| `accounting.vat.dashboard.amountRefundable` | Amount Refundable label | "Amount Refundable" |
| `accounting.vat.dashboard.recentVatReturns` | Recent returns section title | "Recent VAT Returns" |
| `accounting.vat.dashboard.viewAll` | View All link | "View All" |
| `accounting.vat.dashboard.dateRange` | Date Range table header | "Date Range" |
| `accounting.vat.dashboard.netVat` | Net VAT table header | "Net VAT" |
| `accounting.vat.dashboard.viewReport` | View Report button tooltip | "View Report" |
| `accounting.vat.dashboard.noVatReturnsGenerated` | Empty state message | "No VAT returns generated yet" |
| `accounting.vat.dashboard.generateFirstReturn` | Generate First Return button | "Generate Your First Return" |
| `accounting.vat.dashboard.unableToLoad` | Error state message | "Unable to load VAT dashboard" |
| `accounting.vat.dashboard.retry` | Retry button (error state) | "Retry" |

### Status Keys (6 keys)
Used with `translate.instant()` in the `getStatusLabel()` method

| Key | Status | Suggested Value |
|-----|--------|-----------------|
| `accounting.vat.status.generated` | GENERATED | "Generated" |
| `accounting.vat.status.submitted` | SUBMITTED | "Submitted" |
| `accounting.vat.status.accepted` | ACCEPTED | "Accepted" |
| `accounting.vat.status.rejected` | REJECTED | "Rejected" |
| `accounting.vat.status.pending` | PENDING | "Pending" |
| `accounting.vat.status.unknown` | Fallback | "Unknown" |

---

## Implementation Details

### Template Usage
All UI strings use the pipe syntax:
```html
{{ 'accounting.vat.dashboard.keyName' | translate }}
```

### Programmatic Usage
Status labels use `translate.instant()`:
```typescript
return this.translate.instant(statusKeyMap[status] || 'accounting.vat.status.unknown');
```

### Parameterized Keys
Some keys support parameters:

1. **Pluralization (count parameter)**
   - `accounting.vat.dashboard.overdueReturn` - Used with `count` for singular/plural
   - `accounting.vat.dashboard.pendingSubmission` - Used with `count` for singular/plural

2. **Date Parameter**
   - `accounting.vat.dashboard.nextDue` - Used with `date` for formatted date display

3. **Period Parameter**
   - `accounting.vat.dashboard.currentPeriodLabel` - Used with `period` for period display

Example usage:
```html
{{ 'accounting.vat.dashboard.nextDue' | translate : { date: dashboard()!.nextDueDate | date:'longDate' } }}
```

---

## Summary

- **Total Keys**: 36 (30 dashboard + 6 status)
- **Key Pattern**: `accounting.vat.dashboard.*` and `accounting.vat.status.*`
- **Pipe Usage**: `| translate` for template strings
- **Instant Method**: `translate.instant()` for programmatic status labels
- **Parameterized Keys**: 4 (supports count, period, date parameters)

---

## Next Steps

1. Add these keys to your i18n translation files (e.g., `en.json`, `fr.json`, etc.)
2. Ensure the TranslateService is properly configured in your app config
3. Test the component with different language settings
4. Consider creating a translation file specific to accounting module for organization

