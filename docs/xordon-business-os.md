# Xordon Business Operating System (Business OS)

## Overview

Xordon is envisioned as a **Business Operating System**: a unified platform that runs the core workflows, data, and communication for the entire business, while remaining modular so each customer only uses (and pays for) the modules they need.

Key ideas:
- **Single product experience** at `app.xordon.com` with a unified UI and navigation.
- **Modular inside**: Outreach, CRM, Operations, ERP, POS, Accounting, SEO, Project Management, Helpdesk, Scheduling, HR-lite, Inventory, Collaboration, Analytics, Integrations, and AI Copilot.
- **Per-tenant entitlements**: every account has its own set of enabled modules; customers see and access only what theyve subscribed to.

---

## URL & App Structure

- **Marketing & public site**: `https://xordon.com`
  - Landing pages and funnels for different solutions (Outreach, Operations, Service, Retail, etc.).
- **Main app**: `https://app.xordon.com`
  - Single SPA with routes like:
    - `/dashboard`
    - `/crm/...`
    - `/outreach/...` (email + SMS + calls)
    - `/operations/...` or `/jobs/...`
    - `/projects/...`
    - `/accounting/...`
    - `/erp/...`
    - `/pos/...`
- **API**: `https://api.xordon.com`
  - REST endpoints grouped by module: `/api/crm/...`, `/api/outreach/...`, `/api/operations/...`, etc.

Externally, users experience **one product** with different areas. Internally, modules are separated by code and data boundaries.

---

## Frontend Architecture (React + Vite)

- **Single SPA** with React Router.
- Use a **feature-module structure**:

  ```text
  src/
    app/
      AppShell.tsx      // layout + sidebar/topbar + <Outlet />
      routes.tsx        // top-level route mounting
    modules/
      crm/
        pages/
        components/
        hooks/
        api/
        index.tsx       // <CrmModuleRoutes />
      outreach/
        ...
      sms/
        ...
      calls/
        ...
      operations/
        ...
      projects/
        ...
      accounting/
        ...
      erp/
        ...
      pos/
        ...
    shared/
      components/
      hooks/
      lib/
      types/
  ```

- **Routing pattern**:
  - `App.tsx` mounts one module per path prefix:
    - `/crm/*` → `<CrmModuleRoutes />`
    - `/outreach/*` → `<OutreachModuleRoutes />`
    - `/operations/*` → `<OperationsModuleRoutes />`
  - Each module defines its own sub-routes and uses the shared `AppShell` / `AuthenticatedLayout`.
- **Code-splitting**:
  - Lazy-load modules (`React.lazy`) so large areas of the app load only when accessed.

This keeps the **URL and UX unified** while allowing each product area to evolve independently.

---

## Backend Architecture (PHP + MySQL)

- Current stack: PHP backend, MySQL database, controllers/services/middleware in `backend/src`.
- Target: **modular monolith** with a clear path to microservices.

### Structure

```text
backend/
  public/
    index.php          // front controller, routes /api/... into PHP
  src/
    Modules/
      Crm/
        Controllers/
        Services/
        Repositories/
        Models/
      Outreach/
      Sms/
      Calls/
      Operations/
      Proposals/
      LandingPages/
      Flows/
      Industry/
      ...
    Shared/
      Auth/
      Billing/
      Notifications/
      Infrastructure/   // DB connection, queues, HTTP clients, logging
```

### API Surface

- Group endpoints by module under a single API host:
  - `/api/auth/...`
  - `/api/crm/...`
  - `/api/outreach/...`
  - `/api/sms/...`
  - `/api/calls/...`
  - `/api/operations/...`
  - `/api/projects/...`
  - `/api/erp/...`
  - `/api/pos/...`

### Layering

Each module follows:
- **Controllers**: HTTP request/response, validation, serialize/deserialize.
- **Services (use cases)**: business logic (e.g., `CreateLead`, `StartJob`, `SendCampaign`).
- **Repositories**: DB access for the module (`CrmRepository`, `OperationsRepository`, etc.).

This creates **bounded contexts** inside a single deployable app. Later, any module can be broken out as a separate microservice without changing external URLs.

---

## Database Strategy (MySQL)

- For now: **single MySQL database**.
- Organize tables by **tenant** and **module prefix**:
  - Core/shared:
    - `tenants` (or `accounts`)
    - `users`
    - `user_tenants` / `tenant_users` (if many-to-many)
    - `plans`, `subscriptions` (optional)
  - CRM:
    - `crm_contacts`, `crm_companies`, `crm_deals`, `crm_activities`
  - Outreach/Marketing:
    - `outreach_email_campaigns`, `outreach_sequences`, `outreach_events`
  - Operations:
    - `ops_jobs`, `ops_work_orders`, `ops_schedules`
  - Projects:
    - `pm_projects`, `pm_tasks`, `pm_time_entries`
  - Accounting / ERP / POS (examples):
    - `erp_invoices`, `erp_payments`, `erp_expenses`
    - `pos_orders`, `pos_terminals`, `pos_order_items`

- Every business table includes a `tenant_id` (or `account_id`) to support multi-tenant isolation.
- Avoid deep cross-module joins where possible; cross-module communication goes through services/use-cases.

### When to Introduce Multiple Databases

Only when needed for:
- **Scale/performance** (a module like POS or logging dominates load),
- **Data residency/compliance** (EU vs US),
- Or very strong isolation for specific product lines.

At that point, modules can be moved into separate services with their own DBs, behind the same `/api/...` interface.

---

## Entitlements & Modular Packaging

Goal: Customers can buy only what they need (e.g., Outreach-only, Operations-only), and the app will show and allow access only to those modules.

### Database Model

- `tenants` (accounts/companies)
- `modules`
  - `id`
  - `key` (e.g., `outreach`, `crm`, `operations`, `erp`, `pos`)
  - `name`
  - `description`
- `tenant_modules`
  - `id`
  - `tenant_id`
  - `module_id`
  - `status` (`active`, `trial`, `canceled`)
  - `starts_at`
  - `ends_at`

(Optionally, add `features` and `tenant_features` for granular feature flags.)

### Backend Enforcement

- On authentication, resolve the users **tenant** and load enabled modules from `tenant_modules`.
- Store enabled modules in:
  - Session/JWT claims, or
  - A request-scoped context service.
- Implement a simple guard, e.g. `requireModule('outreach')`, that:
  - Checks if the tenant has the module,
  - Returns 403 or an upgrade required error if not.
- Apply this guard at the controller or route level for each modules endpoints.

Result: Even if a user tries to access hidden APIs directly, the backend enforces only what you pay for.

### Frontend Gating

- On app load or login, call an endpoint like `/api/me` or `/api/account` that returns:

  ```json
  {
    "tenant": { ... },
    "modules": ["outreach", "crm"]
  }
  ```

- Store `modules` in existing React contexts (e.g., `PermissionContext`, `AccountSettingsContext`).
- Sidebar/navigation:
  - Each item declares `requiredModule` (e.g., `outreach`, `operations`).
  - Only render items for modules the tenant has.
- Routes:
  - Wrap module routes in a `ModuleGuard` that checks if the user has that module.
  - If not, redirect to a generic dashboard or Upgrade page.

Result: The same codebase and app URL, but each tenant sees only the pieces theyve enabled.

---

## Business OS Modules & Capabilities

Xordon as a Business OS can eventually include:

- **Outreach & Marketing**: email campaigns, SMS campaigns, landing pages, forms, proposals, sequences, analytics.
- **CRM & Sales**: contacts, companies, deals, pipelines, tasks/activities, sales analytics.
- **Operations**: jobs, work orders, schedules, dispatch, mobile job views, checklists.
- **Project Management**: projects, tasks, time tracking, project templates, resource utilization.
- **Helpdesk & Support**: tickets, shared inbox, SLAs, priorities, customer history.
- **Scheduling & Calendar**: appointment booking, calendars, reminders, no-show tracking.
- **HR-lite & People Ops**: employee profiles, roles, basic attendance/leave, onboarding checklists.
- **Inventory & Assets**: products/SKUs, stock levels, warehouses, purchase orders.
- **Accounting / Billing / POS**: estimates, invoices, payments, POS, cashflow snapshots.
- **Collaboration Layer**: comments & mentions, activity feed, contextual discussion around records.
- **Analytics & Executive Dashboards**: cross-module dashboards for pipeline, revenue, jobs, utilization, support, etc.
- **Integrations & App Marketplace**: calendars, accounting systems, phone providers, payment gateways, plus an API/webhooks.
- **AI Copilot**: assist with content, planning, forecasting, search and summarization across modules.

Each becomes a **module** that can be:
- Exposed in marketing,
- Sold individually or in bundles,
- Enabled/disabled via `tenant_modules`,
- Protected by backend guards and frontend gating.

---

## Summary

- Xordon is positioned as a **modular Business Operating System**.
- The platform runs on:
  - A **single, unified SPA** (`app.xordon.com`) with internal feature modules.
  - A **PHP modular monolith** backend (evolving toward microservices) with a stable API (`api.xordon.com`).
  - A **single MySQL database** for now, structured by tenant and module prefixes.
- A **module entitlement model** lets each customer buy only the modules they need and only see/use those in the UI and API.

This document is intended as the canonical reference for the Xordon Business OS vision, architecture, and entitlements approach within this codebase.
