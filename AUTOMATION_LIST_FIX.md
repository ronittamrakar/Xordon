# Automation List Inconsistency Fix

## Issue
The lists displayed on `/automations/library` and `/automations/` were inconsistent because user-created automations were appearing in both tabs.

## Root Cause
The `allAvailableRecipes` memo was combining:
1. **System recipes** from the `automation_recipes` database table
2. **User-created automations** that didn't have a `recipe_id`

This meant that user-created automations (those created directly without installing from a template) were showing up in BOTH:
- The "Library" tab (as virtual recipes)
- The "My Automations" tab (as actual automation instances)

## Solution
Modified the `allAvailableRecipes` memo in `AutomationsUnified.tsx` to **only** include actual recipe templates from the database.

### Before:
```typescript
const allAvailableRecipes = useMemo(() => {
    const list = [...recipes];
    
    // Added user automations without recipe_id to the library
    allAutomations.forEach(auto => {
        if (!auto.original.recipe_id && !list.some(r => r.name === auto.name)) {
            list.push({...}); // Virtual recipe
        }
    });
    
    return list;
}, [recipes, allAutomations]);
```

### After:
```typescript
const allAvailableRecipes = useMemo(() => {
    // Only return recipes from the database
    // User automations appear in "My Automations" tab only
    return [...recipes];
}, [recipes]);
```

## Result
Now the tabs show distinct content:

- **Library Tab (`/automations/library`)**: Shows only recipe templates from `automation_recipes` table
- **My Automations Tab (`/automations/`)**: Shows all user automation instances (both installed from recipes and user-created)

## Files Modified
- `src/pages/AutomationsUnified.tsx` (lines 648-684)

## Testing
1. Navigate to `/automations/` - should show all your automation instances
2. Navigate to `/automations/library` - should show only recipe templates
3. User-created automations should NOT appear in the Library tab
4. Recipe templates should NOT appear in My Automations unless they've been installed
