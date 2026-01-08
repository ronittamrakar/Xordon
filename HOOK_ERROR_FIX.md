# Invalid Hook Call Error - Diagnosis and Fix

## Problem
You're experiencing an "Invalid hook call" error with the message:
```
TypeError: Cannot read properties of null (reading 'useState')
at useState (chunk-DRWLMN53.js?v=5c0dba95:1066:29)
at CallSessionProvider (CallSessionContext.tsx:53:33)
```

This error occurs when React's `useState` returns `null`, which typically means:
1. Multiple copies of React are loaded
2. React is not properly imported
3. Version mismatch between React and React DOM

## Changes Made

### 1. Removed Explicit React Aliases (`vite.config.ts`)
**Why**: Explicit path aliases can interfere with Vite's built-in deduplication.
- Removed hard-coded paths to `react`, `react-dom`, `react-router-dom`, etc.
- Kept only the `@` alias for src directory
- Relied on Vite's `dedupe` configuration instead

### 2. Added Defensive Checks (`CallSessionContext.tsx`)
**Why**: To catch and diagnose React import issues early.
- Added runtime check to ensure React is loaded before using it
- Added dev-mode logging to verify React imports
- Changed from `React.useState` to direct `useState` import usage

### 3. Added Debug Logging (`main.tsx` and `App.tsx`)
**Why**: To track React instances and verify single instance.
- Log React version on app load
- Store React instance in `window.React1` for comparison
- Verify same React instance across modules

## What to Check

### In Browser Console (http://localhost:5173):
1. Look for `[CallSessionContext] React import check:` - should show all hooks as "function"
2. Look for `[DEBUG] React version:` - should show "18.3.1"
3. Look for `[DEBUG] CallSessionProvider rendering. Same React?` - should show "true"
4. Check if the "Invalid hook call" error still appears

### If Error Persists:
1. **Clear node_modules and reinstall**:
   ```powershell
   Remove-Item -Recurse -Force node_modules
   npm install
   ```

2. **Check for nested React installations**:
   ```powershell
   Get-ChildItem -Path "node_modules" -Recurse -Directory -Filter "react" | Where-Object { $_.Parent.Name -eq "node_modules" }
   ```
   Should only show one: `D:\Backup\App Backups\Xordon\node_modules\react`

3. **Clear Vite cache**:
   ```powershell
   Remove-Item -Recurse -Force node_modules\.vite
   ```

## Root Cause Analysis

Based on `npm ls react`, all React dependencies are properly deduped to version 18.3.1. However, the error suggests that at runtime, the CallSessionProvider is receiving a `null` React object when trying to use `useState`.

This is most likely caused by:
- **Vite's module resolution** creating separate module instances during HMR (Hot Module Replacement)
- **Import order issues** where CallSessionContext is loaded before React is fully initialized
- **Build cache** containing stale module references

## Next Steps

1. **Restart the dev server** to ensure all changes are loaded
2. **Hard refresh the browser** (Ctrl+Shift+R) to clear any cached modules
3. **Check the browser console** for the debug logs we added
4. If the error persists, try the cleanup steps above

## Files Modified
- `vite.config.ts` - Removed explicit React aliases
- `src/contexts/CallSessionContext.tsx` - Added defensive checks and logging
- `src/main.tsx` - Added React version logging
- `src/App.tsx` - Added App rendering log
