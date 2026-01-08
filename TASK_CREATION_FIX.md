# Task Creation Bug Fix - Summary

## Problem
Tasks were not showing up after creation in the project details page.

## Root Causes

### 1. Missing `$scope` Variable (Critical Bug)
**Location:** `backend/src/controllers/TasksController.php` line 200

**Issue:** The `create()` method was using `$scope['val']` without defining the `$scope` variable first.

```php
// BEFORE (Broken)
public static function create(): void {
    $userId = Auth::userIdOrFail();
    $body = get_json_body();
    // ... $scope was never defined but used on line 200
    $stmt->execute([
        $scope['val'],  // ❌ Undefined variable!
```

**Fix:** Added the missing line to get workspace scope:
```php
// AFTER (Fixed)
public static function create(): void {
    $userId = Auth::userIdOrFail();
    $scope = self::getWorkspaceScope();  // ✅ Now defined
    $body = get_json_body();
```

### 2. Missing `project_id` Field Support
**Location:** `backend/src/controllers/TasksController.php` line 194-217

**Issue:** The database has a `project_id` column (added in migration `add_projects_table.sql`), but the TasksController wasn't handling it during task creation.

**Fix:** 
- Added `project_id` to the INSERT statement column list
- Added `$body['project_id'] ?? null` to the execute parameters
- Also fixed status to accept custom values: `$body['status'] ?? 'pending'`

```php
// BEFORE
INSERT INTO sales_tasks 
(workspace_id, user_id, client_id, assigned_to, contact_id, company_id, deal_id, title, ...)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ...)

// AFTER
INSERT INTO sales_tasks 
(workspace_id, user_id, client_id, assigned_to, contact_id, company_id, deal_id, project_id, title, ...)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ...)
```

## Testing
After these fixes:
1. ✅ Tasks can be created successfully
2. ✅ Tasks are properly associated with projects via `project_id`
3. ✅ Tasks appear in the project details page
4. ✅ Workspace/tenant scoping works correctly

## Files Modified
- `backend/src/controllers/TasksController.php` - Fixed create() method

## Related Files (Already Working)
- `backend/src/controllers/ProjectsController.php` - getTasks() method properly filters by project_id
- `src/components/projects/CreateTaskDialog.tsx` - Frontend dialog sends project_id correctly
- `src/pages/projects/ProjectDetailsPage.tsx` - Fetches and displays tasks correctly
