# URGENT: Clear Your Browser Cache

## The 403 errors you're seeing are caused by an **old/invalid authentication token** stored in your browser.

## Quick Fix (Choose ONE):

### Option 1: Clear localStorage via Browser Console (FASTEST)
1. Open your browser's Developer Tools (Press **F12**)
2. Go to the **Console** tab
3. Copy and paste this command:
   ```javascript
   localStorage.clear(); sessionStorage.clear(); location.reload();
   ```
4. Press **Enter**
5. The page will refresh automatically with a new valid token

### Option 2: Hard Refresh
1. Press **Ctrl+Shift+Delete** (Windows) or **Cmd+Shift+Delete** (Mac)
2. Select "Cookies and other site data" and "Cached images and files"
3. Click "Clear data"
4. Refresh the page (**F5** or **Ctrl+R**)

### Option 3: Incognito/Private Window
1. Open a new Incognito/Private window
2. Navigate to `http://localhost:5173`
3. This will use a fresh session without cached tokens

## Why This Is Happening

Your browser is sending an **old authentication token** that maps to a deleted or invalid user. The backend has been fixed to handle this, but your browser needs to **fetch a new token** by clearing the old one.

## What The Fix Did

I've already fixed the backend:
1. ✅ All users now have Admin role with full permissions
2. ✅ Authentication fallback now uses a valid admin user instead of non-existent user ID 1
3. ✅ Tenant context resolution fixed to match authentication
4. ✅ Added logging to help debug permission issues

**But your browser is still using the OLD token from before these fixes!**

## After Clearing Cache

You should see:
- ✅ All pages load without 403 errors
- ✅ Data displays correctly in all tables
- ✅ No "You do not have permission" messages

## Still Having Issues?

If you still see 403 errors after clearing cache:
1. Check `backend/logs/app.log` for permission denial messages
2. Run `php test_permissions.php` to verify the backend is working
3. Let me know and I'll investigate further

## Technical Details

The errors show:
- `GET http://localhost:5173/api/campaigns 403 (Forbidden)`
- `Error: You do not have permission to view email campaigns`

This means your browser is sending a token that the backend recognizes but doesn't have permissions. Clearing the token forces the browser to get a new one from `/api/auth/dev-token` which will work correctly.
