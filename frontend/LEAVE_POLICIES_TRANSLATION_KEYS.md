# Leave Policies Component - Translation Keys Required

## Summary

The `leave-policies` component and its child `leave-policy-form-dialog` component have been successfully translated to use ngx-translate.

**Files Updated:**
- `/Users/harrismogale/Documents/GitHub/inmo/surework/surework/frontend/src/app/features/settings/leave-policies/leave-policies.component.ts`
- `/Users/harrismogale/Documents/GitHub/inmo/surework/surework/frontend/src/app/features/settings/leave-policies/leave-policy-form-dialog.component.ts`

**Changes Made:**
1. Added `TranslateModule` to imports in both components
2. Added `TranslateService` injection in both components
3. Replaced all hardcoded strings with translation keys using the `settings.leavePolicies.*` pattern
4. Used `| translate` pipe for template strings
5. Used `translate.instant()` for programmatic strings in error/success messages

---

## Required Translation Keys

### Main Component - UI Text (`leave-policies.component.ts`)

```json
{
  "settings.leavePolicies.title": "Leave Policies",
  "settings.leavePolicies.description": "Configure leave types and entitlements for your organization",
  "settings.leavePolicies.addLeaveType": "Add Leave Type",
  "settings.leavePolicies.loading": "Loading leave types...",
  "settings.leavePolicies.noLeaveTypes": "No leave types configured",
  "settings.leavePolicies.addFirstLeaveType": "Add Your First Leave Type",
  "settings.leavePolicies.tableHeaders.leaveType": "Leave Type",
  "settings.leavePolicies.tableHeaders.defaultDays": "Default Days",
  "settings.leavePolicies.tableHeaders.carryForward": "Carry Forward",
  "settings.leavePolicies.tableHeaders.approval": "Approval",
  "settings.leavePolicies.tableHeaders.status": "Status",
  "settings.leavePolicies.tableHeaders.actions": "Actions",
  "settings.leavePolicies.days": "days",
  "settings.leavePolicies.none": "None",
  "settings.leavePolicies.required": "Required",
  "settings.leavePolicies.auto": "Auto",
  "settings.leavePolicies.active": "Active",
  "settings.leavePolicies.inactive": "Inactive",
  "settings.leavePolicies.edit": "Edit",
  "settings.leavePolicies.deactivate": "Deactivate",
  "settings.leavePolicies.activate": "Activate",
  "settings.leavePolicies.aboutTitle": "About Leave Policies",
  "settings.leavePolicies.info.defaultDays": "Default Days",
  "settings.leavePolicies.info.defaultDaysDesc": "The annual leave entitlement for employees",
  "settings.leavePolicies.info.carryForward": "Carry Forward",
  "settings.leavePolicies.info.carryForwardDesc": "Unused days that can be carried to the next year",
  "settings.leavePolicies.info.approvalRequired": "Approval Required",
  "settings.leavePolicies.info.approvalRequiredDesc": "Whether leave requests need manager approval",
  "settings.leavePolicies.info.negativeBalance": "Negative Balance",
  "settings.leavePolicies.info.negativeBalanceDesc": "Allow employees to take leave beyond their balance",

  "settings.leavePolicies.errors.failedToLoad": "Failed to load leave types",
  "settings.leavePolicies.errors.failedToActivate": "Failed to activate leave type",
  "settings.leavePolicies.errors.failedToDeactivate": "Failed to deactivate leave type",

  "settings.leavePolicies.messages.activated": "Leave type activated",
  "settings.leavePolicies.messages.deactivated": "Leave type deactivated"
}
```

### Form Dialog Component (`leave-policy-form-dialog.component.ts`)

```json
{
  "settings.leavePolicies.dialog.addTitle": "Add Leave Type",
  "settings.leavePolicies.dialog.editTitle": "Edit Leave Type",
  "settings.leavePolicies.dialog.subtitle": "Configure leave type settings",

  "settings.leavePolicies.dialog.nameLabel": "Name *",
  "settings.leavePolicies.dialog.namePlaceholder": "e.g., Annual Leave",
  "settings.leavePolicies.dialog.nameRequired": "Name is required",

  "settings.leavePolicies.dialog.codeLabel": "Code *",
  "settings.leavePolicies.dialog.codePlaceholder": "e.g., ANNUAL",
  "settings.leavePolicies.dialog.codeRequired": "Code is required",

  "settings.leavePolicies.dialog.descriptionLabel": "Description",
  "settings.leavePolicies.dialog.descriptionPlaceholder": "Optional description of this leave type",

  "settings.leavePolicies.dialog.defaultDaysLabel": "Default Days per Year *",
  "settings.leavePolicies.dialog.defaultDaysRequired": "Required",
  "settings.leavePolicies.dialog.defaultDaysMinError": "Must be 0 or more",

  "settings.leavePolicies.dialog.carryForwardDaysLabel": "Carry Forward Days",
  "settings.leavePolicies.dialog.carryForwardDaysHint": "Days that can be carried to next year",

  "settings.leavePolicies.dialog.requiresApprovalLabel": "Requires Approval",
  "settings.leavePolicies.dialog.requiresApprovalHint": "Leave requests must be approved by a manager",

  "settings.leavePolicies.dialog.allowNegativeBalanceLabel": "Allow Negative Balance",
  "settings.leavePolicies.dialog.allowNegativeBalanceHint": "Employees can take leave beyond their balance",

  "settings.leavePolicies.dialog.cancelButton": "Cancel",
  "settings.leavePolicies.dialog.saveButton": "Save Changes",
  "settings.leavePolicies.dialog.createButton": "Create Leave Type",
  "settings.leavePolicies.dialog.updatingButton": "Updating...",
  "settings.leavePolicies.dialog.creatingButton": "Creating...",

  "settings.leavePolicies.dialog.errorSaving": "Failed to save leave type",
  "settings.leavePolicies.dialog.updateSuccess": "Leave type updated",
  "settings.leavePolicies.dialog.createSuccess": "Leave type created"
}
```

---

## Complete Merged Key Structure

For your translation file (en.json or similar):

```json
{
  "settings": {
    "leavePolicies": {
      "title": "Leave Policies",
      "description": "Configure leave types and entitlements for your organization",
      "addLeaveType": "Add Leave Type",
      "loading": "Loading leave types...",
      "noLeaveTypes": "No leave types configured",
      "addFirstLeaveType": "Add Your First Leave Type",
      "days": "days",
      "none": "None",
      "required": "Required",
      "auto": "Auto",
      "active": "Active",
      "inactive": "Inactive",
      "edit": "Edit",
      "deactivate": "Deactivate",
      "activate": "Activate",
      "aboutTitle": "About Leave Policies",
      "tableHeaders": {
        "leaveType": "Leave Type",
        "defaultDays": "Default Days",
        "carryForward": "Carry Forward",
        "approval": "Approval",
        "status": "Status",
        "actions": "Actions"
      },
      "info": {
        "defaultDays": "Default Days",
        "defaultDaysDesc": "The annual leave entitlement for employees",
        "carryForward": "Carry Forward",
        "carryForwardDesc": "Unused days that can be carried to the next year",
        "approvalRequired": "Approval Required",
        "approvalRequiredDesc": "Whether leave requests need manager approval",
        "negativeBalance": "Negative Balance",
        "negativeBalanceDesc": "Allow employees to take leave beyond their balance"
      },
      "errors": {
        "failedToLoad": "Failed to load leave types",
        "failedToActivate": "Failed to activate leave type",
        "failedToDeactivate": "Failed to deactivate leave type"
      },
      "messages": {
        "activated": "Leave type activated",
        "deactivated": "Leave type deactivated"
      },
      "dialog": {
        "addTitle": "Add Leave Type",
        "editTitle": "Edit Leave Type",
        "subtitle": "Configure leave type settings",
        "nameLabel": "Name *",
        "namePlaceholder": "e.g., Annual Leave",
        "nameRequired": "Name is required",
        "codeLabel": "Code *",
        "codePlaceholder": "e.g., ANNUAL",
        "codeRequired": "Code is required",
        "descriptionLabel": "Description",
        "descriptionPlaceholder": "Optional description of this leave type",
        "defaultDaysLabel": "Default Days per Year *",
        "defaultDaysRequired": "Required",
        "defaultDaysMinError": "Must be 0 or more",
        "carryForwardDaysLabel": "Carry Forward Days",
        "carryForwardDaysHint": "Days that can be carried to next year",
        "requiresApprovalLabel": "Requires Approval",
        "requiresApprovalHint": "Leave requests must be approved by a manager",
        "allowNegativeBalanceLabel": "Allow Negative Balance",
        "allowNegativeBalanceHint": "Employees can take leave beyond their balance",
        "cancelButton": "Cancel",
        "saveButton": "Save Changes",
        "createButton": "Create Leave Type",
        "updatingButton": "Updating...",
        "creatingButton": "Creating...",
        "errorSaving": "Failed to save leave type",
        "updateSuccess": "Leave type updated",
        "createSuccess": "Leave type created"
      }
    }
  }
}
```

---

## Total Keys: 53 translation keys

## Translation Pattern Used
- `settings.leavePolicies.*` for main component UI text
- `settings.leavePolicies.errors.*` for error messages
- `settings.leavePolicies.messages.*` for success messages
- `settings.leavePolicies.dialog.*` for form dialog content
- `settings.leavePolicies.info.*` for informational text
- `settings.leavePolicies.tableHeaders.*` for table column headers
