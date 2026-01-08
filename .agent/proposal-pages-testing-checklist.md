# Proposal Pages Testing Checklist

## Quick Test Guide

### 1. Proposals Dashboard
**URL**: http://localhost:5173/proposals

**Test**:
- [ ] Page loads without errors
- [ ] Stats cards display (Total, Acceptance Rate, Revenue, Pending Value)
- [ ] Search bar works
- [ ] Tabs work (All, Drafts, Sent, Viewed, Accepted, Declined)
- [ ] "New Proposal" button works
- [ ] "Templates" button works
- [ ] "Settings" button works
- [ ] Proposal cards display correctly
- [ ] Actions menu works (View, Edit, Send, Duplicate, Delete)

### 2. Proposal Builder
**URL**: http://localhost:5173/proposals/new?template=32

**Test**:
- [ ] Page loads without errors
- [ ] Template parameter is recognized
- [ ] "Use Template" dialog works
- [ ] Tabs work (Details, Content, Pricing, Settings)
- [ ] Client information fields work
- [ ] Rich text editor works
- [ ] Sections can be added/removed
- [ ] Items/pricing can be added
- [ ] Visual Builder toggle works
- [ ] Save button works
- [ ] Send button works (for drafts)

### 3. Proposal Analytics
**URL**: http://localhost:5173/proposals/analytics

**Test**:
- [ ] Page loads without errors
- [ ] Overview stats display
- [ ] Date range filter works
- [ ] Template filter works
- [ ] Status distribution chart displays
- [ ] Monthly performance chart displays
- [ ] Conversion funnel displays
- [ ] Revenue trend chart displays
- [ ] Template performance table displays
- [ ] Top clients table displays
- [ ] Export/PDF buttons present

### 4. Client Management
**URL**: http://localhost:5173/proposals/clients

**Test**:
- [ ] Page loads without errors
- [ ] Client list displays
- [ ] Search works
- [ ] "Add Client" button works
- [ ] Add client dialog works
- [ ] Client table displays correctly
- [ ] Actions menu works (Create Proposal, View Proposals, Edit, Delete)
- [ ] Edit client dialog works
- [ ] Client statistics display (proposals, revenue, last contacted)

### 5. Proposal Workflow
**URL**: http://localhost:5173/proposals/workflow

**Test**:
- [ ] Page loads without errors
- [ ] Workflow settings card displays
- [ ] Enable/Disable workflow button works
- [ ] Search proposals works
- [ ] Status filter works
- [ ] Approval queue table displays
- [ ] Actions menu works (View, Approve, Reject, Send for Approval)
- [ ] Approve dialog works
- [ ] Reject dialog works

### 6. Proposal Archive
**URL**: http://localhost:5173/proposals/archive

**Test**:
- [ ] Page loads without errors
- [ ] Archive/Deleted tabs work
- [ ] Search works
- [ ] Archive summary displays
- [ ] Archived proposals table displays
- [ ] Actions menu works (View, Restore, Archive)
- [ ] Restore dialog works
- [ ] Permanent delete dialog works (for deleted items)

### 7. Proposal Integrations
**URL**: http://localhost:5173/proposals/integrations

**Test**:
- [ ] Page loads without errors
- [ ] Integration stats cards display
- [ ] "Add Integration" button works
- [ ] Add integration dialog works
- [ ] Integration type selector works
- [ ] Integrations table displays
- [ ] Mock integrations show (HubSpot, Stripe)
- [ ] Enable/disable toggle works
- [ ] Actions menu works (Edit, Test Connection, Sync Data, Delete)
- [ ] Edit integration dialog works

## Common Issues to Check

### Navigation
- [ ] All links between pages work
- [ ] Back button works
- [ ] Breadcrumbs work (where applicable)

### Data Loading
- [ ] Loading spinners show while fetching data
- [ ] Empty states display when no data
- [ ] Error messages display on API failures

### Forms
- [ ] Required field validation works
- [ ] Form submission works
- [ ] Success/error toasts appear

### Responsive Design
- [ ] Pages work on mobile view
- [ ] Tables are scrollable on small screens
- [ ] Dialogs are properly sized

## Expected Behavior

### Mock Data
Some endpoints return mock data when backend is unavailable:
- Workflow settings return defaults
- Integrations return HubSpot and Stripe samples
- Stats return zeros if backend unavailable

### Navigation Flow
1. Dashboard → View proposal → Edit proposal
2. Dashboard → New proposal → Select template → Build → Save
3. Clients → Create proposal for client → Builder
4. Archive → Restore → Back to dashboard

## Notes
- All pages should load without console errors
- TypeScript compilation should be error-free
- All imports are properly resolved
- API methods are properly typed
