# Permission System Fix - Summary

## Problem
All API endpoints were returning **403 Forbidden** errors with messages like:
- "You do not have permission to view templates"
- "You do not have permission to view email campaigns"
- "You do not have permission to view call campaigns"
- etc.

## Root Causes

### 1. **Missing Role Assignments**
- Users in the database did not have the Admin role properly assigned
- Some users had `role_id = NULL`

### 2. **Missing Role Permissions**
- The Admin role existed but didn't have all permissions assigned to it
- The `role_permissions` table was missing entries linking the Admin role to all available permissions

### 3. **Critical Security Flaw in Auth.php**
- `Auth::userIdOrFail()` was defaulting to user ID 1 when no valid token was present
- User ID 1 didn't exist in the database, causing permission checks to fail
- This was a **major security vulnerability** that bypassed authentication

## Solutions Applied

### 1. Fixed Admin Role Permissions
**File:** `fix_admin_permissions.php`

- Verified Admin role exists (ID: 1)
- Assigned all 64 permissions to the Admin role
- Updated all users to have the Admin role for development purposes

### 2. Fixed Authentication Fallback
**File:** `backend/src/Auth.php`

**Before:**
```php
public static function userIdOrFail(): int {
    $userId = self::userId();
    if ($userId === null) {
        // Unrestricted access: Default to admin user (ID 1)
        return 1; 
    }
    return $userId;
}
```

**After:**
```php
public static function userIdOrFail(): int {
    $userId = self::userId();
    if ($userId === null) {
        // In development mode, try to get the first admin user
        $isDev = (getenv('APP_ENV') === 'development') || ...;
        
        if ($isDev) {
            // Get first admin user from database
            $adminUser = /* query for first admin */;
            if ($adminUser) {
                return (int)$adminUser['id'];
            }
        }
        
        // No valid authentication - return 401
        Response::error('Authentication required', 401);
        exit;
    }
    return $userId;
}
```

### 3. Fixed Tenant Context Resolution
**File:** `backend/src/TenantContext.php`

**Before:**
Dev mode logic was defaulting to User ID 1 (non-existent) and creating a fabricated workspace for it.
```php
$userId = Auth::userId() ?? 1;
// ...
return new self($userId, $workspace, [1], 1, null);
```

**After:**
Now properly resolves the first admin user, ensuring `TenantContext` matches the authenticated user in controllers.
```php
// ... lookup admin user ...
$userId = (int)$adminUser['id'];
```

## How the RBAC System Works

### Permission Check Flow:
1. User makes API request
2. `Auth::userIdOrFail()` extracts user ID from token
3. Controller checks permission using `RBACService::hasPermission($userId, 'permission.key')`
4. RBACService queries:
   - Get user's role from `users.role_id`
   - Get role's permissions from `role_permissions` table
   - Check if permission exists

### Example Permission Keys:
- `email.templates.view`
- `email.templates.manage`
- `email.campaigns.view`
- `email.campaigns.create`
- `calls.campaigns.view`
- `analytics.view`
- etc.

## Verification

Run the fix script:
```bash
php fix_admin_permissions.php
```

Expected output:
```
=== Fixing Admin Permissions ===

1. Checking for Admin role...
   ✅ Admin role found with ID: 1

2. Assigning all permissions to Admin role...
   ✅ Assigned 64 permissions to Admin role

3. Assigning Admin role to all users...
   ✓ admin@dev.local already has Admin role
   ✓ admin@xordon.com already has Admin role
   ✅ Updated X user(s)

4. Verifying permissions...
   Admin user: admin@dev.local (ID: 3)
   Has 64 permissions

   Sample permissions:
   - email.templates.view: View Email Templates
   - email.templates.manage: Manage Email Templates
   ...

=== ✅ Fix Complete ===
```

## Testing

After applying the fix:

1. **Refresh your browser** (Ctrl+F5 or Cmd+Shift+R)
2. **Clear localStorage** if needed:
   ```javascript
   localStorage.clear();
   location.reload();
   ```
3. **Login again** to get a fresh token
4. All pages should now load without 403 errors

## Database Tables Involved

- `users` - User accounts with `role_id` foreign key
- `roles` - Available roles (Admin, Manager, etc.)
- `permissions` - All available permissions in the system
- `role_permissions` - Junction table linking roles to permissions
- `auth_tokens` - User authentication tokens

## Security Notes

⚠️ **Important:**
- The development fallback should **ONLY** be used in development mode
- In production, `userIdOrFail()` will properly return 401 if no valid token
- All users having Admin role is acceptable for development but should be reviewed for production
- Consider implementing proper role assignments based on user types in production

## Next Steps

For production deployment:
1. Create different roles (Admin, Manager, User, etc.)
2. Assign appropriate permissions to each role
3. Assign users to appropriate roles based on their responsibilities
4. Remove the development fallback in `Auth::userIdOrFail()`
5. Implement proper user registration with default role assignment

## Files Modified

1. `backend/src/Auth.php` - Fixed authentication fallback
2. `fix_admin_permissions.php` - Script to fix permissions (new file)
3. Database: Updated `role_permissions` and `users` tables

## Permissions Count

Total permissions in system: **64**

These cover all major features:
- Email campaigns and templates
- SMS campaigns
- Call campaigns
- Forms and webforms
- Analytics and reports
- User management
- Settings
- And more...
