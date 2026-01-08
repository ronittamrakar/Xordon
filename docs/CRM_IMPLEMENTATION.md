# CRM Module - Implementation Guide

## Overview
The CRM module provides comprehensive lead management, pipeline tracking, activity logging, task management, and analytics capabilities. It's fully integrated with the multi-tenant workspace and company scoping system.

## Architecture

### Database Tables
- **`leads`** - Core lead records with scoring, stages, and values
- **`lead_activities`** - Activity timeline (calls, emails, meetings, notes)
- **`lead_tags`** - Custom tags for lead categorization
- **`lead_tag_relations`** - Many-to-many lead-tag relationships
- **`crm_tasks`** - Follow-up tasks with priorities and due dates
- **`pipeline_stages`** - Customizable pipeline stages (optional)

### Multi-Tenancy Support
All CRM tables include:
- `workspace_id` - Workspace-level data isolation
- `company_id` - Company-level scoping (for agency accounts)
- Proper indexes for efficient querying

Migration: `backend/migrations/add_crm_multitenancy.sql`

## Backend API

### CRMController (`backend/src/controllers/CRMController.php`)

#### Endpoints

**Dashboard**
- `GET /crm/dashboard` - Get dashboard metrics, recent activities, and pipeline data
  - Returns: metrics (total leads, new leads, qualified, won/lost, total value, avg score, activities)
  - Returns: recentActivities (last 10 activities)
  - Returns: pipelineData (leads count and value by stage)

**Leads Management**
- `GET /crm/leads` - List leads with pagination and filters
  - Query params: `page`, `limit`, `stage`, `source`, `search`
  - Returns: leads array with contact details, pagination info
  
- `POST /crm/leads` - Create new lead
  - Body: `contact_id` (required), `lead_score`, `lead_stage`, `lead_value`, `probability`, `expected_close_date`, `assigned_agent_id`, `source`, `campaign_id`
  
- `PUT /crm/leads/:id` - Update lead
  - Body: Any of the lead fields
  
- `GET /crm/leads/:id/activities` - Get activities for a specific lead
  
- `POST /crm/leads/:id/activities` - Add activity to lead
  - Body: `activity_type`, `activity_title`, `activity_description`, `activity_date`, `duration_minutes`, `outcome`, `next_action`, `next_action_date`

**Tasks**
- `GET /crm/tasks` - List tasks with filters
  - Query params: `status`, `priority`
  
- `POST /crm/tasks` - Create task
  - Body: `lead_id`, `contact_id`, `assigned_to`, `title`, `description`, `task_type`, `status`, `priority`, `due_date`
  
- `PATCH /crm/tasks/:id/status` - Update task status
  - Body: `status`

**Activities**
- `GET /crm/activities` - Get all activities across leads
  - Query params: `type`, `search`, `page`, `limit`
  - Returns: activities array, typeCounts, pagination

**Analytics**
- `GET /crm/analytics` - Get comprehensive analytics
  - Query params: `period` (days, default 30)
  - Returns: pipeline breakdown, conversion funnel, activity trends, lead sources, top leads, win/loss trends, stage time averages

### Multi-Tenant Scoping Pattern

```php
private static function getWorkspaceScope(): array {
    $ctx = $GLOBALS['tenantContext'] ?? null;
    if ($ctx && isset($ctx->workspaceId)) {
        return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
    }
    return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
}

private static function getCompanyScope(): ?int {
    $ctx = $GLOBALS['tenantContext'] ?? null;
    return $ctx->activeCompanyId ?? null;
}
```

All queries use workspace scoping:
```php
$scope = self::getWorkspaceScope();
$companyId = self::getCompanyScope();

$whereConditions = ["l.{$scope['col']} = ?"];
$params = [$scope['val']];

if ($companyId) {
    $whereConditions[] = "l.company_id = ?";
    $params[] = $companyId;
}
```

## Frontend Pages

### 1. CRM Dashboard (`src/pages/crm/CRMDashboard.tsx`)
- **Route:** `/crm`
- **Features:**
  - Key metrics cards (total leads, qualified, total value, activities)
  - Quick navigation buttons to all CRM sections
  - Pipeline visualization with stage counts and values
  - Recent activities feed
  - Conversion analytics (lead to qualified, qualified to won, win rate)
  - Performance metrics (avg lead score, total activities, avg deal value)

### 2. Leads Page (`src/pages/crm/LeadsPage.tsx`)
- **Route:** `/crm/leads`
- **Features:**
  - Paginated leads list with search and filters (stage, source)
  - Lead score and value display
  - Contact information with click-to-call/email/SMS
  - Create/edit lead modals
  - Stage badges with colors
  - Tags display
  - Quick actions (email, SMS, call, edit)
  - Error handling with retry capability

### 3. Pipeline Page (`src/pages/crm/PipelinePage.tsx`)
- **Route:** `/crm/pipeline`
- **Features:**
  - Kanban board view with drag-and-drop
  - Stage columns with lead counts and total values
  - Optimistic updates with error rollback
  - Lead cards with contact info, value, score
  - Quick actions on each lead
  - Create lead modal
  - Lead detail dialog
  - List view toggle (future enhancement)

### 4. Activities Page (`src/pages/crm/ActivitiesPage.tsx`)
- **Route:** `/crm/activities`
- **Features:**
  - Activity feed with pagination
  - Filter by type (call, email, SMS, meeting, note)
  - Search functionality
  - Activity type counts summary
  - Contact information with quick actions
  - Lead stage badges
  - Campaign attribution

### 5. Tasks Page (`src/pages/crm/TasksPage.tsx`)
- **Route:** `/crm/tasks` (redirects to `/tasks`)
- **Features:**
  - Task list with filters (status, priority, overdue)
  - Task stats (total, pending, in progress, overdue)
  - Create task modal
  - Due date tracking with overdue highlighting
  - Priority badges
  - Contact linkage with quick actions
  - Toggle task completion

### 6. Analytics Page (`src/pages/crm/AnalyticsPage.tsx`)
- **Route:** `/crm/analytics`
- **Features:**
  - Key metrics (total leads, pipeline value, win rate, deals won)
  - Period selector (7/30/90/365 days)
  - Pipeline breakdown with progress bars
  - Conversion funnel visualization
  - Lead sources analysis with win rates
  - Top opportunities list
  - Average time in stage
  - Win/loss trend over time
  - Refresh button

## Frontend API Client

### API Methods (`src/lib/api.ts`)

```typescript
api.crm = {
  getDashboard(): Promise<DashboardData>
  getLeads(params?: LeadFilters): Promise<LeadsResponse>
  createLead(data: CreateLeadData): Promise<{ lead_id: number }>
  updateLead(id: string, data: UpdateLeadData): Promise<{ success: boolean }>
  getLeadActivities(leadId: string): Promise<{ activities: Activity[] }>
  addLeadActivity(leadId: string, data: ActivityData): Promise<{ activity_id: number }>
  getTasks(params?: TaskFilters): Promise<{ tasks: Task[] }>
  createTask(data: CreateTaskData): Promise<{ task_id: number }>
  updateTaskStatus(taskId: string, status: string): Promise<{ success: boolean }>
  getActivities(params?: ActivityFilters): Promise<ActivitiesResponse>
  getAnalytics(period?: number): Promise<AnalyticsData>
}
```

## Types (`src/types/crm.ts`)

### Core Types
- `Lead` - Lead record with contact, stage, score, value
- `LeadStage` - Enum: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
- `LeadActivity` - Activity record with type, title, description, date
- `ActivityType` - Enum: 'call' | 'email' | 'sms' | 'meeting' | 'note' | 'task' | 'deal_change'
- `CRMTask` - Task record with lead, contact, status, priority, due date
- `TaskStatus` - Enum: 'pending' | 'in_progress' | 'completed' | 'cancelled'
- `TaskPriority` - Enum: 'low' | 'medium' | 'high' | 'urgent'

### Configuration Constants
- `LEAD_STAGES` - Stage definitions with labels, colors, probabilities
- `ACTIVITY_TYPES` - Activity type definitions with icons
- `TASK_PRIORITIES` - Priority definitions with colors
- `TASK_TYPES` - Task type definitions

## Sidebar Configuration

CRM section in `src/components/layout/AppSidebar.tsx`:
- Collapsible "CRM" group
- Shows when `crmModuleEnabled` and `crmBundleEnabled`
- Links to: Dashboard, Leads, Pipeline, Activities, Tasks, Analytics
- Permission-gated with `CONTACTS_VIEW` permission

## Features Implemented

### ✅ Core Functionality
- Lead creation and management
- Pipeline visualization with drag-and-drop
- Activity tracking and logging
- Task management with priorities
- Multi-stage lead progression
- Lead scoring and valuation
- Contact integration

### ✅ Advanced Features
- Multi-tenant workspace scoping
- Company-level data isolation
- Comprehensive analytics dashboard
- Conversion funnel tracking
- Lead source analysis
- Win/loss trending
- Stage time analysis
- Optimistic UI updates with rollback
- Error handling and retry logic
- Empty states and loading states

### ✅ Integrations
- Contact management integration
- Campaign attribution
- Email/SMS/Call quick actions
- Softphone integration
- User assignment

## Setup Instructions

### 1. Run Database Migrations

```bash
cd backend
php run_all_migrations.php
```

Or specifically:
```bash
mysql -u root -p mailmandu < migrations/add_crm_tables.sql
mysql -u root -p mailmandu < migrations/add_crm_multitenancy.sql
```

### 2. Verify Backend Routes

Check `backend/public/index.php` includes:
```php
require_once __DIR__ . '/../src/controllers/CRMController.php';
```

And routes are registered (lines ~1644-1662)

### 3. Frontend Access

Navigate to:
- Dashboard: `http://localhost:5173/crm`
- Leads: `http://localhost:5173/crm/leads`
- Pipeline: `http://localhost:5173/crm/pipeline`
- Activities: `http://localhost:5173/crm/activities`
- Analytics: `http://localhost:5173/crm/analytics`

## Best Practices

### Backend
1. Always use workspace scoping in queries
2. Include company_id filtering when available
3. Validate required fields before database operations
4. Use transactions for multi-table operations
5. Log errors with context for debugging

### Frontend
1. Implement optimistic updates for better UX
2. Always provide rollback on API errors
3. Show loading states during async operations
4. Display meaningful error messages
5. Provide retry functionality
6. Use empty states when no data
7. Validate form inputs before submission

## Testing Checklist

- [ ] Create lead from contact
- [ ] Update lead stage via pipeline drag-and-drop
- [ ] Add activity to lead
- [ ] Create task for lead
- [ ] Complete task
- [ ] Filter leads by stage
- [ ] Search leads by contact name/email
- [ ] View analytics for different periods
- [ ] Test multi-tenant isolation (switch workspaces)
- [ ] Test company scoping (agency accounts)
- [ ] Verify error handling (network failures)
- [ ] Test pagination on leads/activities
- [ ] Verify optimistic updates rollback on error

## Known Issues & Future Enhancements

### To Fix
- [ ] Add bulk operations (bulk stage change, bulk delete)
- [ ] Implement lead assignment workflow
- [ ] Add email/SMS templates for quick actions
- [ ] Create custom pipeline stages UI
- [ ] Add lead import/export functionality
- [ ] Implement lead scoring automation
- [ ] Add activity reminders
- [ ] Create mobile-responsive views

### Future Features
- [ ] Lead scoring rules engine
- [ ] Automated lead routing
- [ ] Email tracking integration
- [ ] Calendar integration for activities
- [ ] Custom fields for leads
- [ ] Lead lifecycle automation
- [ ] Forecasting and projections
- [ ] Team performance dashboards
- [ ] Lead nurturing campaigns
- [ ] Integration with external CRMs

## Troubleshooting

### Leads not loading
1. Check browser console for API errors
2. Verify backend is running on port 8001
3. Check database connection in backend
4. Verify workspace_id is set in localStorage
5. Check TenantContext is properly initialized

### Drag-and-drop not working
1. Verify dnd-kit library is installed
2. Check browser console for errors
3. Ensure lead has valid id field
4. Verify API endpoint is accessible

### Analytics showing no data
1. Ensure leads exist in database
2. Check date range/period filter
3. Verify workspace scoping is correct
4. Check SQL queries in backend logs

## Support

For issues or questions:
1. Check browser console for errors
2. Review backend error logs
3. Verify database migrations are applied
4. Check API responses in Network tab
5. Consult this documentation

---

**Last Updated:** December 20, 2025
**Version:** 1.0.0
**Status:** Production Ready
