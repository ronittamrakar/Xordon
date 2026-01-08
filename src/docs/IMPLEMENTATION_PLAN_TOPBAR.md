# Implementation Plan: Topbar Enhancements

This plan outlines the steps for enhancing the topbar with breadcrumbs, global search, quick actions, notifications, and a workspace switcher.

## Phase 1: Core Infrastructure (Priority 1)

### 1. Breadcrumb Navigation System
- **File**: `src/components/layout/topbar/BreadcrumbNavigation.tsx`
- **Logic**: Use `useLocation` to parse path segments and map them to labels.
- **Components**: Use Radix-based `Breadcrumb` UI components.
- **Integration**: Add to `AppLayout.tsx` header.

### 2. Global Search Functionality
- **File**: `src/components/layout/topbar/GlobalSearch.tsx`
- **Features**: Keyboard shortcut (Cmd/Ctrl + K), search results dropdown.
- **Mock Data**: Initially use mock data for campaigns, contacts, etc.
- **Integration**: Add to `AppLayout.tsx` header.

## Phase 2: User Experience Enhancements (Priority 2)

### 3. Contextual Quick Actions
- **File**: `src/components/layout/topbar/QuickActions.tsx`
- **Logic**: Page-specific actions based on current route.
- **Examples**: "Create Campaign" on /campaigns, "New Form" on /forms.

### 4. Smart Notifications Center
- **File**: `src/components/layout/topbar/NotificationCenter.tsx`
- **Features**: Popover with list of notifications, unread count badge.
- **Integration**: Add to `AppLayout.tsx` header.

## Phase 3: Multi-Tenant Features (Priority 3)

### 5. Workspace/Client Context Switcher
- **File**: `src/components/layout/topbar/WorkspaceSwitcher.tsx`
- **Logic**: leverage `useTenant` (from `TenantContext`).
- **UI**: Re-style the existing `TenantSwitcher` logic for use in the topbar.

## Timeline
- **Step 1**: Breadcrumb navigation and basic topbar structure.
- **Step 2**: Global search functionality.
- **Step 3**: Contextual quick actions system.
- **Step 4**: Smart notifications center.
- **Step 5**: Workspace context switcher and final polish.
