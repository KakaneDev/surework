# Job Postings List Component - Translation Keys

This document lists all translation keys that need to be added to your i18n translation files for the `job-postings-list.component.ts` component.

## Recruitment-Specific Keys (`recruitment.jobList.*`)

```json
{
  "recruitment": {
    "jobList": {
      "title": "Job Postings",
      "subtitle": "Manage job postings and applications",
      "postNewJob": "Post New Job",
      "searchPlaceholder": "Search by title or department...",
      "noPostings": "No job postings found",
      "adjustFilters": "Try adjusting your filters",
      "emptyState": "Get started by posting your first job",
      "reference": "Reference",
      "applications": "Applications",
      "closingDate": "Closing Date",
      "publish": "Publish",
      "putOnHold": "Put On Hold",
      "reopen": "Reopen",
      "publishSuccess": "Job published successfully",
      "publishError": "Failed to publish job",
      "putOnHoldSuccess": "Job put on hold",
      "putOnHoldError": "Failed to put job on hold",
      "reopenSuccess": "Job reopened",
      "reopenError": "Failed to reopen job",
      "closeSuccess": "Job closed",
      "closeError": "Failed to close job",
      "deleteConfirm": "Are you sure you want to delete",
      "deleteSuccess": "Job deleted",
      "deleteError": "Failed to delete job",
      "loadError": "Failed to load job postings"
    }
  }
}
```

## Common Keys (`common.*`)

These keys are shared across multiple components and should already exist or be added to the common translations:

```json
{
  "common": {
    "allStatuses": "All Statuses",
    "allTypes": "All Types",
    "clear": "Clear",
    "clearFilters": "Clear Filters",
    "title": "Title",
    "department": "Department",
    "type": "Type",
    "status": "Status",
    "view": "View",
    "edit": "Edit",
    "close": "Close",
    "delete": "Delete",
    "remote": "Remote",
    "showing": "Showing {{ from }} to {{ to }} of {{ total }}",
    "page": "Page {{ current }} of {{ total }}",
    "firstPage": "First page",
    "previousPage": "Previous page",
    "nextPage": "Next page",
    "lastPage": "Last page"
  }
}
```

## Integration Instructions

1. Add the `recruitment.jobList.*` keys to your recruitment translation files
2. Ensure the `common.*` keys are present in your common/shared translation files
3. Replace the placeholder text (e.g., "Job Postings", "Manage job postings...") with localized versions for each supported language

## Translation Files to Update

Typically these would be:
- `frontend/src/assets/i18n/en.json` (English)
- `frontend/src/assets/i18n/es.json` (Spanish)
- `frontend/src/assets/i18n/fr.json` (French)
- `frontend/src/assets/i18n/[other-languages].json`

## Notes

- All hardcoded strings in the template have been converted to use translation keys
- Toast messages and confirmation dialogs use the `translateKey()` helper method
- Pagination text uses parameter substitution with `{{ param1 }}, {{ param2 }}` syntax
- Status and employment type labels are still handled by the `RecruitmentService` methods and don't need translation keys in this component
