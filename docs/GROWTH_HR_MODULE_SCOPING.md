# Growth & HR Module Scoping Implementation

## Overview

This document describes the multi-tenancy and permission implementation for Growth and HR modules.

## Architecture

### Scoping Rules

| Module | Scope | Description |
|--------|-------|-------------|
| **Growth Suite** | Company-scoped | Data is isolated per company within a workspace |
| - Social Scheduler | Company | Posts, accounts, templates per company |
| - Listings/SEO | Company | Listings, keywords, competitors per company |
| - Ads Manager | Company | Ad accounts, campaigns, budgets per company |
| **HR Suite** | Workspace-scoped | Data is isolated per workspace with self-only defaults |
| - Time Tracking | Workspace + User | Members see own data; managers see all |
| - Expenses | Workspace + User | Members see own data; managers see all |
| - Commissions | Workspace + User | Members see own data; managers see all |

### Permission Model

#### Role Hierarchy
```
owner (100) > admin (80) > manager (60) > member (20)
```

#### Growth Permissions
- `growth.social.view` - View social data
- `growth.social.create` - Create posts
- `growth.social.publish` - Publish posts (manager+)
- `growth.social.manage_accounts` - Connect/disconnect accounts (admin+)
- `growth.social.manage_settings` - Manage settings (admin+)

- `growth.listings.view` - View listings/SEO data
- `growth.listings.manage` - Manage listings
- `growth.listings.manage_settings` - Manage settings (admin+)

- `growth.ads.view` - View ads data
- `growth.ads.manage_budgets` - Manage budgets (manager+)
- `growth.ads.manage_accounts` - Manage ad accounts (admin+)
- `growth.ads.manage_settings` - Manage settings (admin+)

#### HR Permissions
- `hr.time.view_own` - View own time entries
- `hr.time.create_own` - Create own time entries
- `hr.time.view_all` - View all time entries (manager+)
- `hr.time.approve` - Approve time entries (manager+)
- `hr.time.manage_settings` - Manage settings (admin+)

- `hr.leave.view_own` - View own leave requests
- `hr.leave.create_own` - Create leave requests
- `hr.leave.view_all` - View all leave requests (manager+)
- `hr.leave.approve` - Approve leave requests (manager+)

- `hr.expenses.view_own` - View own expenses
- `hr.expenses.create_own` - Create expenses
- `hr.expenses.view_all` - View all expenses (manager+)
- `hr.expenses.approve` - Approve expenses (manager+)
- `hr.expenses.manage_categories` - Manage categories (admin+)

- `hr.commissions.view_own` - View own commissions
- `hr.commissions.view_all` - View all commissions (manager+)
- `hr.commissions.approve` - Approve commissions (manager+)
- `hr.commissions.manage_plans` - Manage plans (admin+)

## Files Changed

### Backend

#### New Files
- `backend/src/Permissions.php` - Centralized permission service
- `backend/migrations/growth_company_scoping.sql` - Add company_id to Growth tables
- `backend/migrations/module_settings.sql` - Module settings table
- `backend/scripts/backfill_growth_company_id.php` - Backfill script
- `backend/src/controllers/ModuleSettingsController.php` - Settings API

#### Modified Controllers
- `SocialController.php` - Added company_id scoping
- `ListingsController.php` - Added company_id scoping
- `AdsController.php` - Added company_id scoping
- `TimeTrackingController.php` - Added self-only defaults + approval checks
- `ExpensesController.php` - Added self-only defaults + approval checks

### Frontend

#### New Files
- `src/hooks/useWorkspacePermissions.ts` - Permission hook
- `src/hooks/useActiveCompany.ts` - Company context hook
- `src/services/moduleSettingsApi.ts` - Settings API service

#### Modified Pages
- `src/pages/growth/SocialScheduler.tsx` - Company-scoped queries
- `src/pages/growth/ListingsSeo.tsx` - Company-scoped queries
- `src/pages/growth/AdsManager.tsx` - Company-scoped queries

## API Endpoints

### Permissions
- `GET /permissions/workspace` - Get workspace role and module permissions

### Module Settings
- `GET /settings/modules` - Get all module settings
- `GET /settings/module/:module` - Get settings for a module
- `PUT /settings/module/:module` - Update settings for a module
- `DELETE /settings/module/:module` - Reset settings to defaults
- `GET /settings/module/:module/:key` - Get a single setting

## QA Verification Checklist

### Growth Module Tests

- [ ] **Company Scoping**
  - [ ] Social posts only show for active company
  - [ ] Switching company refreshes social data
  - [ ] Creating post assigns correct company_id
  - [ ] Cannot access other company's posts via API

- [ ] **Permission Checks**
  - [ ] Members can view social data
  - [ ] Members can create draft posts
  - [ ] Only managers+ can publish posts
  - [ ] Only admins+ can manage accounts
  - [ ] 403 returned for unauthorized actions

### HR Module Tests

- [ ] **Self-Only Defaults**
  - [ ] Members only see their own time entries
  - [ ] Members only see their own expenses
  - [ ] Members only see their own commissions
  - [ ] Managers can see all entries

- [ ] **Approval Permissions**
  - [ ] Members cannot approve time entries (403)
  - [ ] Members cannot approve expenses (403)
  - [ ] Members cannot approve leave requests (403)
  - [ ] Managers can approve all above

### Settings Tests

- [ ] **Growth Settings (Company-scoped)**
  - [ ] Settings saved per company
  - [ ] Switching company loads different settings
  - [ ] Only admins can modify settings

- [ ] **HR Settings (Workspace-scoped)**
  - [ ] Settings saved per workspace
  - [ ] Same settings across all companies
  - [ ] Only admins can modify settings

## Migration Steps

1. Run `backend/migrations/growth_company_scoping.sql`
2. Run `backend/migrations/module_settings.sql`
3. Run `php backend/scripts/backfill_growth_company_id.php`
4. Deploy updated controllers
5. Deploy frontend changes

## Rollback Plan

If issues occur:
1. Revert controller changes (remove company_id checks)
2. Frontend will continue to work (company_id in queries is ignored)
3. Data remains intact (company_id columns are nullable)
