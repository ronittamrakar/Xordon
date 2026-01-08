# Future Modules & Hidden Features

This document tracks all modules/features that exist in the codebase but are **hidden from the main navigation** for MVP focus. These are not deleted—routes still work, and code is preserved.

> **To re-enable any feature:** Edit `src/config/features.ts` and change the `status` from `'hidden'` or `'advanced'` to `'core'`.

---

## Status Legend

| Status | Meaning |
|--------|---------|
| `core` | Always visible in main navigation |
| `advanced` | Visible in collapsed "Advanced" section |
| `hidden` | Not shown in nav, routes still work |
| `coming_soon` | Shown with badge, not clickable |

---

## Currently Hidden Features

These features have `status: 'hidden'` and are **not shown anywhere** in the navigation:

| Feature | Path | Reason |
|---------|------|--------|
| Email Contacts | `/email/contacts` | Merged into unified `/contacts` |
| SMS Contacts | `/sms/contacts` | Merged into unified `/contacts` |
| Call Contacts | `/calls/contacts` | Merged into unified `/contacts` |
| CRM Tasks | `/crm/tasks` | Use `/tasks` (Today's Actions) instead |

---

## Advanced Features (Collapsed Section)

These features have `status: 'advanced'` and appear in a **collapsed "Advanced" section** at the bottom of the sidebar:

### Operations / Field Service

| Feature | Path | Description |
|---------|------|-------------|
| Jobs/Dispatch | `/jobs` | Job scheduling and dispatch |
| Estimates/Quotes | `/estimates` | Estimate and quote management |
| Referrals | `/referrals` | Referral program management |
| Recalls | `/recalls` | Service recall management |
| Staff Members | `/staff` | Staff and team management |
| Intake Forms | `/intake-forms` | Client intake forms |
| Playbooks | `/playbooks` | Sales and service playbooks |
| Payments & Invoicing | `/payments` | Payment processing and invoicing |
| Appointments | `/appointments` | Appointment scheduling |

### Agency / Platform

| Feature | Path | Description |
|---------|------|-------------|
| Store Integration | `/ecommerce` | E-commerce store integrations |
| Client Accounts | `/agency` | Agency client management |
| Industry Settings | `/industry-settings` | Industry-specific configuration |
| Services | `/services` | Service catalog management |

### Telecom / Config

| Feature | Path | Description |
|---------|------|-------------|
| Phone Lines | `/phone-numbers` | Business phone line management |

### Other

| Feature | Path | Description |
|---------|------|-------------|
| Reviews | `/reviews` | Review and reputation management |

---

## Core Features (Always Visible)

For reference, these are the **core features** that are always visible:

### Dashboard & Global
- Dashboard (`/dashboard`)
- Inbox (`/inbox`)
- Today's Actions (`/tasks`)

### Email Outreach
- Campaigns (`/email/campaigns`)
- Sequences (`/email/sequences`)
- Templates (`/email/templates`)
- Template Builder (`/email/templates/builder`)
- Replies (`/email/replies`)
- Unsubscribers (`/email/unsubscribers`)

### SMS Outreach
- Campaigns (`/sms/campaigns`)
- Sequences (`/sms/sequences`)
- Templates (`/sms/templates`)
- Replies (`/sms/replies`)
- Unsubscribers (`/sms/unsubscribers`)

### Calls Outreach
- Campaigns (`/calls/campaigns`)
- Scripts (`/calls/scripts`)
- Agents (`/calls/agents`)
- Call Logs (`/calls/logs`)

### Engagement
- Forms (`/forms`)
- Form Replies (`/form-replies`)
- Landing Pages (`/landing-pages`)
- Landing Templates (`/landing-pages/templates`)
- Landing Builder (`/landing-pages/builder`)
- Proposals (`/proposals`)
- Proposal Templates (`/proposals/templates`)
- Proposal Settings (`/proposals/settings`)

### Automation
- Flow Builder (`/flows`)
- Automations (`/automations`)
- Workflows (`/workflows`)
- A/B Testing (`/ab-testing`)

### CRM
- CRM Overview (`/crm`)
- Leads (`/crm/leads`)
- Activities (`/crm/activities`)
- Analytics (`/crm/analytics`)

### Contacts
- All Contacts (`/contacts`)
- Companies (`/companies`)
- Lists (`/lists`)
- Segments (`/segments`)

### Admin
- Reports & Analytics (`/reports`)
- Settings (`/settings`)
- Users (`/admin/users`)

---

## How to Promote a Feature

1. Open `src/config/features.ts`
2. Find the feature by its `id`
3. Change `status: 'advanced'` or `status: 'hidden'` to `status: 'core'`
4. The feature will now appear in the main navigation

Example:
```typescript
// Before
{
  id: 'payments',
  path: '/payments',
  label: 'Payments & Invoicing',
  status: 'advanced', // Hidden in Advanced section
  // ...
}

// After
{
  id: 'payments',
  path: '/payments',
  label: 'Payments & Invoicing',
  status: 'core', // Now visible in main nav
  // ...
}
```

---

## Notes

- All routes remain functional regardless of nav visibility
- Direct URL access always works (e.g., `/jobs` still loads the Jobs page)
- Feature flags are purely for navigation organization
- The feature registry is the single source of truth for all modules

---

*Last updated: December 2024*
