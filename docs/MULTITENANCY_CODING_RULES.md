# Multi-Tenancy Coding Rules

## Hierarchy Model

```
Workspace (Tenant / Account)
    └── Company/Client (optional sub-scope)
        └── Team (grouping only, not access boundary)
            └── Users (workspace members with RBAC)
```

### Key Principles

1. **Workspace = Hard Isolation Boundary**
   - Every tenant-owned table MUST have `workspace_id`
   - All queries MUST include `workspace_id` in WHERE clauses
   - Never allow cross-workspace data access

2. **Company = Optional Sub-Scope**
   - Companies belong to a workspace
   - Users may have access to specific companies via `user_company_access`
   - Use `X-Company-Id` header for company-scoped endpoints

3. **Team = Grouping Only (Mode A)**
   - Teams do NOT restrict data access
   - Used for assignment, workflows, and optional RBAC grouping
   - Does not filter data queries

4. **User Access**
   - Users belong to workspaces via `workspace_members`
   - Permissions evaluated via RBAC within workspace context
   - Company access controlled via `user_company_access`

---

## Controller Implementation Rules

### Rule 1: Always Use WorkspaceScoped Trait

```php
<?php
require_once __DIR__ . '/../traits/WorkspaceScoped.php';

class MyController {
    use WorkspaceScoped;
    
    public function index() {
        // Use workspace scoping
        $scope = self::workspaceWhere();
        $workspaceId = $scope['params'][0];
        
        // Query with workspace scoping
        $stmt = $db->prepare("SELECT * FROM my_table WHERE workspace_id = ?");
        $stmt->execute([$workspaceId]);
    }
}
```

### Rule 2: Never Use user_id for Tenant Scoping

❌ **WRONG:**
```php
$stmt = $db->prepare("SELECT * FROM campaigns WHERE user_id = ?");
$stmt->execute([$userId]);
```

✅ **CORRECT:**
```php
$scope = self::workspaceWhere();
$stmt = $db->prepare("SELECT * FROM campaigns WHERE workspace_id = ?");
$stmt->execute([$scope['params'][0]]);
```

### Rule 3: Use Strict Enforcement for Tenant-Owned Endpoints

```php
public function create() {
    // Require workspace context - will error if missing
    $workspaceId = self::requireWorkspaceContext();
    
    // For company-scoped endpoints
    $companyId = self::requireCompanyAccess();
    
    // Proceed with operation
}
```

### Rule 4: Include workspace_id in INSERT Statements

```php
$stmt = $db->prepare("
    INSERT INTO my_table (user_id, workspace_id, name, ...)
    VALUES (:user_id, :workspace_id, :name, ...)
");
$stmt->execute([
    'user_id' => $userId,           // Creator/audit
    'workspace_id' => $workspaceId, // Tenant boundary
    'name' => $data['name'],
]);
```

### Rule 5: Validate Ownership via Workspace

```php
// Verify record belongs to workspace before update/delete
$stmt = $db->prepare("SELECT id FROM my_table WHERE id = ? AND workspace_id = ?");
$stmt->execute([$id, $workspaceId]);
if (!$stmt->fetch()) {
    Response::notFound('Record not found');
    return;
}
```

---

## Available Helper Methods (WorkspaceScoped Trait)

| Method | Purpose |
|--------|---------|
| `requireWorkspaceContext()` | Returns workspace_id or terminates with 400 |
| `requireWorkspaceMembership()` | Validates user belongs to workspace |
| `requireCompanyContext()` | Returns company_id or terminates with 400 |
| `requireCompanyAccess($companyId)` | Validates user has access to company |
| `workspaceWhere($alias, $strict)` | Returns SQL + params for workspace scoping |
| `getWorkspaceId()` | Returns workspace_id or null |
| `getAllowedCompanyIds()` | Returns array of company IDs user can access |
| `hasCompanyAccess($companyId)` | Checks if user has access to specific company |

---

## Frontend Requirements

### Headers

All API calls MUST include:
- `Authorization: Bearer <token>`
- `X-Workspace-Id: <workspace_id>` (from `localStorage.tenant_id`)
- `X-Company-Id: <company_id>` (from `localStorage.active_client_id`) - for company-scoped endpoints

### Using the API Module

```typescript
import { api } from '@/lib/api';

// The api module automatically includes workspace headers
const campaigns = await api.get('/sms/campaigns');
```

---

## Database Schema Requirements

### Required Columns for Tenant-Owned Tables

```sql
ALTER TABLE my_table 
ADD COLUMN workspace_id INT UNSIGNED NOT NULL AFTER user_id,
ADD INDEX idx_my_table_workspace_created (workspace_id, created_at);
```

### For Company-Scoped Tables

```sql
ALTER TABLE my_table 
ADD COLUMN company_id INT UNSIGNED NULL AFTER workspace_id,
ADD INDEX idx_my_table_workspace_company (workspace_id, company_id);
```

---

## Checklist for New Controllers

- [ ] Include `WorkspaceScoped` trait
- [ ] Use `workspaceWhere()` or `requireWorkspaceContext()` in all methods
- [ ] Include `workspace_id` in all INSERT statements
- [ ] Validate ownership via workspace in UPDATE/DELETE operations
- [ ] Never use `user_id` alone for data scoping
- [ ] Add RBAC permission checks where appropriate
- [ ] For company-scoped endpoints, use `requireCompanyAccess()`

---

## Migration Guide for Existing Controllers

1. Add `require_once __DIR__ . '/../traits/WorkspaceScoped.php';`
2. Add `use WorkspaceScoped;` to class
3. Replace `WHERE user_id = ?` with `WHERE workspace_id = ?`
4. Update INSERT statements to include `workspace_id`
5. Test all CRUD operations
6. Run verification script: `php backend/scripts/verify_multitenancy.php`
