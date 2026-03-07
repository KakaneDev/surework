# Support Tickets (Helpdesk) System

**Date:** 2026-01-24
**Status:** Implemented (Phase 1 - Navigation & Placeholder UI)
**Version:** 1.0

---

## Overview

The Support Tickets module is a self-service helpdesk system allowing employees to submit support requests to any department. Tickets are auto-routed based on category selection.

---

## Features

### Employee View (Implemented)

1. **My Tickets Dashboard** (`/support`)
   - List of all submitted tickets with status badges
   - Filter by status: All, Open, Resolved
   - Quick stats: Open tickets, Pending, Resolved

2. **Create Ticket** (`/support/new`)
   - Category dropdown (auto-routes to team)
   - Subcategory selection
   - Subject line
   - Description (rich text)
   - Priority: Low, Medium, High, Urgent
   - Attachments placeholder

3. **Ticket Detail** (`/support/:id`)
   - Full ticket info and status timeline
   - Comments thread
   - Ticket actions (close, reopen)

---

## Ticket Categories & Auto-Routing

| Category | Sub-categories | Routes To |
|----------|---------------|-----------|
| **HR Requests** | Name change, Address update, Emergency contacts, Employment verification | HR Team |
| **Payroll & Benefits** | Banking details, Tax info, Benefits enrollment, Payslip queries | Payroll Team |
| **Leave & Attendance** | Leave balance queries, Attendance corrections, Public holiday queries | Leave Admin |
| **IT Support** | Password reset, Software access, Equipment request, Email issues | IT Team |
| **Facilities** | Parking, Access cards, Workspace issues, Building maintenance | Facilities Team |
| **Finance** | Expense claims, Reimbursements, Budget queries | Finance Team |
| **Other** | General queries | Default Admin |

---

## Ticket Workflow States

```
┌─────────┐   ┌─────────────┐   ┌─────────────┐   ┌──────────┐
│   NEW   │ → │ IN PROGRESS │ → │   PENDING   │ → │ RESOLVED │
└─────────┘   └─────────────┘   │ (waiting on │   └──────────┘
                                │  requester) │         │
                                └─────────────┘         ▼
                                                  ┌──────────┐
                                                  │  CLOSED  │
                                                  └──────────┘
```

| Status | Description |
|--------|-------------|
| `NEW` | Ticket created, awaiting assignment |
| `IN_PROGRESS` | Agent working on the ticket |
| `PENDING` | Waiting on requester for information |
| `RESOLVED` | Issue resolved, awaiting closure |
| `CLOSED` | Ticket closed |

---

## Data Model

### SupportTicket

```typescript
interface SupportTicket {
  id: string;
  ticketNumber: string;      // e.g., "TKT-2026-00123"
  category: TicketCategory;
  subcategory?: string;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: TicketStatus;
  requesterId: string;       // Employee who created
  assignedTeam: string;      // Auto-assigned department
  assignedTo?: string;       // Specific agent
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  slaDeadline?: Date;
  attachments: Attachment[];
  comments: TicketComment[];
}
```

### TicketComment

```typescript
interface TicketComment {
  id: string;
  ticketId: string;
  author: string;
  authorRole: 'requester' | 'agent';
  content: string;
  createdAt: Date;
  attachments?: Attachment[];
}
```

---

## API Endpoints (Planned)

### Self-Service Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/support/my-tickets` | GET | Fetch user's tickets (paginated) |
| `/api/support/my-tickets/stats` | GET | Fetch ticket statistics |
| `/api/support/tickets` | POST | Create new ticket |
| `/api/support/tickets/{id}` | GET | Get ticket detail |
| `/api/support/tickets/{id}/comments` | POST | Add comment |
| `/api/support/tickets/{id}/close` | POST | Close ticket |
| `/api/support/tickets/{id}/reopen` | POST | Reopen ticket |

---

## Components

| Component | Route | Purpose |
|-----------|-------|---------|
| `SupportDashboardComponent` | `/support` | List user's tickets with filters |
| `TicketCreateComponent` | `/support/new` | New ticket form |
| `TicketDetailComponent` | `/support/:id` | Ticket detail & comments |

---

## Service

**File:** `core/services/support.service.ts`

### Methods

| Method | Returns | Purpose |
|--------|---------|---------|
| `getMyTickets(params)` | `Observable<SupportTicket[]>` | Fetch user's tickets |
| `getTicket(id)` | `Observable<SupportTicket>` | Get single ticket |
| `createTicket(request)` | `Observable<SupportTicket>` | Create new ticket |
| `addComment(request)` | `Observable<TicketComment>` | Add comment to ticket |
| `closeTicket(id)` | `Observable<SupportTicket>` | Close a ticket |
| `reopenTicket(id)` | `Observable<SupportTicket>` | Reopen closed ticket |
| `getTicketStats()` | `Observable<TicketStats>` | Get ticket statistics |

**Note:** Current implementation uses mock data. Replace with actual API calls when backend is ready.

---

## Navigation

The Support Tickets link appears in the **Self-Service** section of the sidebar:

```
Self-Service
├── My Leave
├── My Payslips
├── My Documents
└── Support Tickets    ← NEW
```

---

## File Structure

```
frontend/src/app/
├── core/
│   └── services/
│       └── support.service.ts       # Support API service
└── features/
    └── support/
        ├── support.routes.ts        # Module routes
        ├── support-dashboard/
        │   └── support-dashboard.component.ts
        ├── ticket-create/
        │   └── ticket-create.component.ts
        └── ticket-detail/
            └── ticket-detail.component.ts
```

---

## Implementation Phases

### Phase 1 (Current - Navigation & Placeholder UI)
- [x] Menu item with routing
- [x] Basic routing structure
- [x] Dashboard with empty state
- [x] Create ticket form UI
- [x] Ticket detail page structure
- [x] Support service with mock data

### Phase 2 (MVP - Full Frontend)
- [ ] Working ticket list with mock data
- [ ] Functional create ticket flow
- [ ] Comments functionality
- [ ] File upload placeholder

### Phase 3 (Backend Integration)
- [ ] Support service backend
- [ ] Database schema
- [ ] API endpoints
- [ ] Real ticket persistence

### Phase 4 (Admin Features)
- [ ] Ticket queue for admins
- [ ] Assign & escalate functionality
- [ ] SLA management
- [ ] Canned responses
- [ ] Reporting dashboard

---

## UI Components

### Priority Badges

| Priority | Color |
|----------|-------|
| URGENT | Red (`bg-red-100 text-red-700`) |
| HIGH | Orange (`bg-orange-100 text-orange-700`) |
| MEDIUM | Yellow (`bg-yellow-100 text-yellow-700`) |
| LOW | Gray (`bg-neutral-100 text-neutral-600`) |

### Status Badges

| Status | Color |
|--------|-------|
| NEW | Blue (`bg-blue-100 text-blue-700`) |
| IN_PROGRESS | Yellow (`bg-yellow-100 text-yellow-700`) |
| PENDING | Orange (`bg-orange-100 text-orange-700`) |
| RESOLVED | Green (`bg-green-100 text-green-700`) |
| CLOSED | Gray (`bg-neutral-100 text-neutral-600`) |

---

## Testing Checklist

- [ ] Navigate to `/support` → verify dashboard loads
- [ ] Click "New Ticket" → verify create form opens
- [ ] Select category → verify subcategories appear
- [ ] Fill form and submit → verify redirect to dashboard
- [ ] View empty state → verify helpful message shown
- [ ] Navigate via sidebar → verify "Support Tickets" link works
