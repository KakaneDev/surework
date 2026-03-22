# Notifications Inbox

## Overview

The notifications inbox provides a full-page view at `/notifications` where users can manage all their notifications with filtering, infinite scroll, and bulk/individual actions.

## Route

```
/notifications
```

Accessible to any authenticated user (no permission guard required).

## Files

| File | Purpose |
|------|---------|
| `src/app/features/notifications/notifications.routes.ts` | Route configuration |
| `src/app/features/notifications/notifications-inbox/notifications-inbox.component.ts` | Main inbox component |

## Features

### Infinite Scroll

Notifications load 20 at a time using an Intersection Observer that triggers when the user scrolls near the bottom of the list. The component tracks:

- `pageIndex` - Current page number
- `hasMore` - Whether more pages exist
- `loadingMore` - Loading state for pagination

```typescript
private setupIntersectionObserver(): void {
  this.intersectionObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && this.hasMore() && !this.loadingMore()) {
        this.loadMore();
      }
    },
    { threshold: 0.1 }
  );
  this.intersectionObserver.observe(this.loadMoreTrigger.nativeElement);
}
```

### Type Filter Groups

Notifications are grouped by category with filter chips:

| Filter | Notification Types |
|--------|-------------------|
| Leave | `LEAVE_SUBMITTED`, `LEAVE_APPROVED`, `LEAVE_REJECTED`, `LEAVE_CANCELLED` |
| Payroll | `PAYSLIP_READY`, `PAYROLL_PROCESSED` |
| Documents | `DOCUMENT_UPLOADED`, `DOCUMENT_EXPIRING`, `DOCUMENT_SHARED` |
| Support | `TICKET_CREATED`, `TICKET_UPDATED`, `TICKET_RESOLVED`, `TICKET_ASSIGNED` |
| Recruitment | `APPLICATION_RECEIVED`, `INTERVIEW_SCHEDULED`, `OFFER_EXTENDED` |
| System | `SYSTEM_ANNOUNCEMENT`, `ACCOUNT_UPDATED`, `PASSWORD_CHANGED` |

### Read Status Filter

Dropdown to filter by read status:
- **All** - Show all notifications
- **Unread** - Show only unread
- **Read** - Show only read

### Client-Side Filtering

Filtering happens client-side on the loaded notifications for instant feedback:

```typescript
filteredNotifications = computed(() => {
  let result = this.notifications();

  if (this.typeFilter()) {
    const group = this.typeGroups.find(g => g.key === this.typeFilter());
    if (group) {
      result = result.filter(n => group.types.includes(n.type));
    }
  }

  if (this.readFilter() === 'read') {
    result = result.filter(n => n.read);
  } else if (this.readFilter() === 'unread') {
    result = result.filter(n => !n.read);
  }

  return result;
});
```

## Actions

### Mark All as Read

Button in the page header that marks all notifications as read. Only visible when there are unread notifications.

### Individual Actions (via dropdown menu)

- **Mark as read** - Mark single notification as read (only shown for unread)
- **View details** - Navigate to the referenced entity (only shown when `referenceType` exists)
- **Delete** - Remove the notification

### Click Navigation

Clicking a notification:
1. Marks it as read if unread
2. Navigates to the referenced entity if `referenceType` and `referenceId` are set

Reference type to route mapping:

| Reference Type | Route |
|---------------|-------|
| `LEAVE_REQUEST` | `/leave/:id` |
| `PAYSLIP` | `/my-payslips/:id` |
| `DOCUMENT` | `/documents/:id` |
| `SUPPORT_TICKET` | `/support/:id` |
| `JOB_POSTING` | `/recruitment/jobs/:id` |
| `CANDIDATE` | `/recruitment/candidates/:id` |
| `EMPLOYEE` | `/employees/:id` |

## UI States

### Loading (Initial)

Centered spinner while loading first page.

### Empty State

Two variations:
- **No notifications**: "You're all caught up!" message
- **No filter matches**: "No notifications match your filters" with clear filters button

### Notification Item

Each item displays:
- Type-specific icon with color-coded background
- Title (bold if unread)
- Message body
- Relative timestamp (e.g., "5m ago", "2h ago")
- Type badge (Leave, Payroll, etc.)
- Unread indicator dot
- Actions dropdown (visible on hover)

Unread notifications have a highlighted background (`bg-primary-50`).

## Dependencies

Uses existing services and components:

- `NotificationService` - API calls and WebSocket state
- `SpinnerComponent` - Loading indicators
- `DropdownComponent` - Action menus
- `BadgeComponent` - Type badges

## Dark Mode

Fully styled for dark mode with appropriate background, text, and border colors using Tailwind dark variants.

## API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/notifications?page=N&size=20` | Paginated notifications |
| PATCH | `/api/notifications/:id/read` | Mark as read |
| POST | `/api/notifications/mark-all-read` | Mark all as read |
| DELETE | `/api/notifications/:id` | Delete notification |

## Integration with Notification Dropdown

The notification dropdown in the shell header links to this inbox via "View all notifications". Both components share:

- `NotificationService` for state management
- Icon/color mappings for notification types
- Reference type routing logic
