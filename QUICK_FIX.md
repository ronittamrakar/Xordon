# Quick Fix Instructions

## The Problem
You're seeing 403 Forbidden errors on all pages because the permission system wasn't properly configured.

## The Solution
I've fixed the backend permission system. Now you just need to refresh your frontend to get a new valid token.

## Steps to Fix (Choose ONE):

### Option 1: Clear Browser Storage (Recommended)
1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Run this command:
   ```javascript
   localStorage.clear(); location.reload();
   ```
4. The page will refresh and automatically get a new valid token

### Option 2: Manual Refresh
1. Press **Ctrl+Shift+Delete** (Windows) or **Cmd+Shift+Delete** (Mac)
2. Clear "Cached images and files" and "Cookies and other site data"
3. Refresh the page (F5 or Ctrl+R)

### Option 3: Hard Refresh
1. Press **Ctrl+F5** (Windows) or **Cmd+Shift+R** (Mac)
2. If errors persist, use Option 1

## Verification

After clearing storage, you should see:
- ✅ All pages load without 403 errors
- ✅ Data displays correctly in tables
- ✅ No "You do not have permission" errors

## What Was Fixed

1. **Admin Role Permissions**: All 64 permissions were assigned to the Admin role
2. **User Role Assignments**: All users now have the Admin role (for development)
3. **Authentication Fallback**: Fixed security issue where auth was defaulting to non-existent user ID 1

## Technical Details

If you're interested in what was changed:
- See `PERMISSION_FIX_SUMMARY.md` for full technical documentation
- Run `php test_permissions.php` to verify the permission system
- Run `php fix_admin_permissions.php` if you need to re-apply the fix

## Still Having Issues?

If you still see 403 errors after clearing storage:

1. Check that the backend is running:
   ```bash
   # Should show "npm run dev" running
   ```

2. Verify the dev token endpoint works:
   ```bash
   curl http://localhost:8001/api/auth/dev-token
   ```
   Should return: `{"success":true,"token":"..."}`

3. Check browser console for errors (F12 → Console tab)

4. Make sure `VITE_DEV_MODE=true` in your `.env` file

## Need Help?

If the issue persists, please provide:
- Browser console errors (F12 → Console)
- Network tab showing the failed requests (F12 → Network)
- Screenshot of the error
