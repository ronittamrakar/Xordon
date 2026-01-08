# Archive & Trash Implementation Status

## Overview
This document tracks the implementation of Archive and Trash functionality across all creatable items in the application.

## Completed Items

### 1. **Global Pages** ✅
- **Archive.tsx** - Global archive page with support for:
  - Email Campaigns
  - SMS Campaigns
  - Call Campaigns
  - Websites
  - Web Forms
  - Proposals
- **Trash.tsx** - Global trash page with support for same items

### 2. **Type Definitions** ✅
Updated `src/lib/api.ts` to include `'archived' | 'trashed'` status for:
- `Campaign` (Email)
- `SMSCampaign`
- `CallCampaign`
- `HybridCampaign`
- `Sequence`
- `Form`
- `FormTemplate`
- `Template` (Email Templates)
- `SMSTemplate`
- `SMSSequence`
- `CallSequence`
- `CallScript`
- `ProposalTemplate`
- `Proposal`

### 3. **Campaign Pages** ✅
- **Email Campaigns** (`src/pages/reach/outbound/email/EmailCampaigns.tsx`)
  - Changed "Delete" to "Move to Trash"
  - Added "Archive" action
  - Filters out archived/trashed from main view
  
- **SMS Campaigns** (`src/pages/reach/outbound/sms/SMSCampaigns.tsx`)
  - Changed "Delete" to "Move to Trash"
  - Added "Archive" action
  - Filters out archived/trashed from main view

- **Call Campaigns** (`src/pages/calls/CallCampaigns.tsx`)
  - Changed "Delete" to "Move to Trash"
  - Added "Archive" action
  - Filters out archived/trashed from main view

### 4. **Template Pages** ✅
- **Email Templates** (`src/pages/reach/assets/EmailTemplates.tsx`)
  - Changed "Delete" to "Move to Trash"
  - Added "Archive" action
  - Filters out archived/trashed from main view
  - Fixed lint errors (toast import, blocks type)

- **SMS Templates** (`src/pages/reach/assets/SMSTemplates.tsx`)
  - Changed "Delete" to "Move to Trash"
  - Added "Archive" action
  - Filters out archived/trashed from main view
  - Updated bulk actions

### 5. **Workflow Pages** ✅
- **Workflows** (`src/pages/Workflows.tsx`)
  - Changed "Delete" to "Move to Trash"
  - Added "Archive" action
  - Filters out archived/trashed from main view
  - Updated AutomationInstance type

### 6. **Navigation** ✅
- **AppSidebar.tsx** - Added Archive and Trash links under Admin section
- **features.ts** - Configured global_archive and global_trash features

### 7. **API Updates** ✅
- **updateTemplate** in api.ts - Now supports status updates

## Items Requiring Implementation

### High Priority
1. **Email Sequences** (`src/pages/Sequences.tsx`)
   - Add Archive/Trash actions
   - Filter out archived/trashed items
   - Update delete logic to soft delete

2. **SMS Sequences** (`src/pages/SMSSequences.tsx`)
   - Add Archive/Trash actions
   - Filter out archived/trashed items
   - Update delete logic to soft delete

3. **Call Sequences** (`src/pages/calls/CallSequences.tsx`)
   - Add Archive/Trash actions
   - Filter out archived/trashed items
   - Update delete logic to soft delete

4. **Call Scripts** (`src/pages/calls/CallScripts.tsx`)
   - Add Archive/Trash actions
   - Filter out archived/trashed items
   - Update delete logic to soft delete

5. **Forms** (`src/pages/Forms.tsx`)
   - Add Archive/Trash actions
   - Filter out archived/trashed items
   - Update delete logic to soft delete

6. **Proposals** (Already has Archive/Trash in global pages)
   - Verify proposal list page filters correctly
   - Ensure proposal actions use soft delete

### Medium Priority
7. **Social Posts** (`src/pages/marketing/SocialPlanner.tsx`)
   - Add Archive/Trash for scheduled posts
   - Filter out archived/trashed items

8. **Courses** (`src/pages/courses/CoursesPage.tsx`)
   - Add Archive/Trash actions
   - Filter out archived/trashed items

### Lower Priority (Module-Specific)
9. **Web Forms** - Already has dedicated Archive/Trash pages
   - Verify integration with global Archive/Trash
   - Ensure consistency

10. **Websites** - Already integrated with global Archive/Trash
    - Verify all actions work correctly

## Implementation Pattern

For each remaining item, follow this pattern:

### 1. Update Type (if not done)
```typescript
// In src/lib/api.ts
status: 'draft' | 'active' | 'paused' | 'completed' | 'archived' | 'trashed';
```

### 2. Add Archive/Trash Handlers
```typescript
const handleMoveToTrash = async (id: string) => {
  await api.updateItem(id, { status: 'trashed' });
  // Remove from local state or refetch
};

const handleArchive = async (id: string) => {
  await api.updateItem(id, { status: 'archived' });
  // Remove from local state or refetch
};
```

### 3. Filter Main View
```typescript
const filteredItems = items.filter(item => 
  item.status !== 'archived' && item.status !== 'trashed'
);
```

### 4. Update UI Actions
- Change "Delete" buttons to "Move to Trash"
- Add "Archive" option to dropdown menus
- Import Archive icon from lucide-react

### 5. Integrate with Global Pages
Add to `Archive.tsx` and `Trash.tsx`:
```typescript
// In loadArchivedItems/loadTrashedItems
try {
  const items = await api.getItems();
  const archivedItems = items.filter(i => i.status === 'archived');
  archivedItems.forEach(i => {
    archivedItems.push({
      id: i.id,
      name: i.name,
      type: 'Item Type',
      originalType: 'item_type',
      archivedAt: i.created_at,
      source: i
    });
  });
} catch (err) {
  console.error('Failed to fetch archived items', err);
}
```

## Testing Checklist

For each implemented item:
- [ ] Can archive an item
- [ ] Can move an item to trash
- [ ] Archived items appear in global Archive page
- [ ] Trashed items appear in global Trash page
- [ ] Can restore from Archive
- [ ] Can restore from Trash
- [ ] Can move from Archive to Trash
- [ ] Can permanently delete from Trash
- [ ] Items don't appear in main view when archived/trashed
- [ ] Bulk actions work correctly
- [ ] No console errors

## Notes

### Backend Considerations
- Backend endpoints should support `status` field updates
- Backend should filter by status when requested
- Permanent delete should only happen from Trash page

### UI/UX Consistency
- All "Delete" actions should be "Move to Trash" (soft delete)
- Archive and Trash should be accessible from Admin section
- Icons: Archive (📦), Trash (🗑️)
- Confirmation dialogs for destructive actions

### Future Enhancements
- Auto-delete from Trash after X days
- Bulk archive/trash operations
- Search within Archive/Trash
- Filter Archive/Trash by type
- Export archived items

## Last Updated
2026-01-04 18:06 NPT
