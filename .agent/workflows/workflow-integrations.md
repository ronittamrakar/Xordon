---
description: Workflow Integration Map - How modules connect to each other
---

# Workflow Integration Map

This document describes how different modules in the application connect to each other for seamless user journeys.

## Core Navigation Patterns

All cross-module navigations use React Router's `navigate()` with `state` for passing context data.

---

## 1. Conversations → Other Modules

### From: `Conversations.tsx`

| Action | Destination | State Passed |
|--------|-------------|--------------|
| Create Ticket | `/helpdesk/tickets/new` | `title`, `description`, `requester_name`, `requester_email` |
| Create Service Job | `/operations/field-service` | `customerName`, `customerPhone`, `notes` |
| Create Project | `/projects/new` | `title`, `description`, `contactId` |
| Add to Pipeline | `/crm/deals` | `create: true`, `contactId` |

---

## 2. Pipeline/CRM → Other Modules

### From: `PipelinePage.tsx`

| Action | Destination | State Passed |
|--------|-------------|--------------|
| View Contact | `/contacts/:id` | - |
| Send Email | `/reach/inbound/email/replies` | `email` query param |
| Create Proposal | `/proposals/new` | `contactId`, `dealValue`, `dealName` query params |
| Create Project | `/projects/new` | `fromLead`, `leadId`, `contactId`, `title`, `description` |
| Schedule Meeting | `/scheduling/appointments/new` | `contactId`, `contactName`, `contactEmail`, `contactPhone` |

---

## 3. Proposals → Other Modules

### From: `Proposals.tsx` and `ProposalBuilder.tsx`

| Action | Destination | State Passed |
|--------|-------------|--------------|
| Create Invoice (accepted) | `/finance/invoices` | `create: true`, `contactData`, `lineItems`, `notes`, `terms` |

---

## 4. Tickets/Helpdesk → Other Modules

### From: `TicketDetail.tsx`

| Action | Destination | State Passed |
|--------|-------------|--------------|
| Create Project | `/projects/new` | `title`, `description`, `contactId` |
| Create Field Service Job | `/operations/field-service` | `createJob`, `ticketNumber`, `ticketTitle`, `customerName`, `customerPhone` |

---

## 5. Contact Profile → Other Modules

### From: `ContactProfile.tsx`

| Action | Destination | State Passed |
|--------|-------------|--------------|
| Create Project | `/projects/new` | `contactId`, `title` |
| Create Ticket | `/helpdesk/tickets/new` | `title`, `requester_name`, `requester_email` |
| Create Proposal | `/proposals/new` | `contactId` query param |
| Create Invoice | `/finance/invoices/new` | `contactId` |
| Create Deal | `/crm/deals` | `create: true`, `contactId` |

---

## 6. Projects → Other Modules

### From: `ProjectsPage.tsx`

Projects page receives state from Pipeline and Conversations:
- `fromLead`: `boolean` - Indicates source is Pipeline
- `title`: `string` - Pre-fills project title
- `description`: `string` - Pre-fills project description
- `contactId`: `string` - Links project to contact

---

## 7. Invoices → Other Modules

### From: `Invoices.tsx`

| Action | Destination | State Passed |
|--------|-------------|--------------|
| Enroll in Course | Uses `coursesApi.enrollStudent` | `courseId`, `contactId` |

### Receives from:
- Proposals (accepted proposals)
- Contact Profile
- Field Service (for billing service jobs)

---

## 8. Appointments/Scheduling → Other Modules

### From: `Appointments.tsx`

Receives state from Pipeline and other pages:
- `contactId`: Pre-fills contact
- `contactName`: Pre-fills guest name
- `contactEmail`: Pre-fills guest email  
- `contactPhone`: Pre-fills guest phone

---

## Best Practices for Navigation Integration

1. **Always use `location.state`** for passing context between pages
2. **Clear state after consumption** to prevent re-triggering on refresh
3. **Handle undefined state gracefully** - always provide fallbacks
4. **Use consistent property names** across modules
5. **Pre-fill forms** when receiving navigation state for better UX

## State Cleanup Pattern

```tsx
useEffect(() => {
  const state = location.state as { ... } | null;
  if (state?.someProperty) {
    // Handle state
    setFormData(prev => ({ ...prev, ...state }));
    // Clear state
    navigate(location.pathname, { replace: true, state: null });
  }
}, [location.state]);
```
