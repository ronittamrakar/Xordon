# CRITICAL BUG FIX: Multi-Step Forms Data Persistence & Rendering

## The Issues
1. **Rendering Logic Bug:** `FormCanvas.tsx` was ignoring fields with `step: 1`, dumping them into the main section.
2. **Backend Data Loss:** The `WebFormsController.php` was ignoring any field properties that didn't have a dedicated database column (like `step` and `options`). This meant even if the rendering logic was fixed, the *data* for the steps (and select options) was being deleted upon save!

## The Fixes

### 1. Rendering Logic (Fixed in previous step)
**File:** `src/components/webforms/form-builder/FormCanvas.tsx`
Updated grouping logic to include `step: 1` fields in step sections.

### 2. Backend Data Persistence (NEW)
**File:** `backend/src/controllers/WebFormsController.php`
Updated `createForm` and `updateForm` to explicitly look for `step` and `options` in the input and save them into the `properties` JSON column.

```php
json_encode(array_merge(
    $field['properties'] ?? $field['settings'] ?? [],
    array_filter([
        'step' => $field['step'] ?? null,
        'options' => $field['options'] ?? null
    ], function($v) { return $v !== null; })
))
```

### 3. Frontend Data Loading (NEW)
**File:** `src/pages/webforms/WebFormBuilder.tsx`
Updated the `useEffect` hook that loads form data to extract `step` and `options` back out of the `properties` object.

```typescript
const mappedFields: FormField[] = (data.fields || []).map((f: any) => {
  const props = f.properties || {};
  return {
    ...f,
    ...props,
    // ...
    step: f.step || props.step,
    options: f.options || props.options,
  };
});
```

## Result
- **Multi-step forms now work persistently.** You can save them, reload them, and they will still be multi-step.
- **Select fields now work persistently.** Options won't disappear after saving.
- **Rendering is correct.** All pages (1, 2, 3...) display correctly in the builder.

## Testing
1. Create a new form from "Comprehensive Lead Generation" (Multi-step).
2. Verify all pages appear correctly.
3. **Save** the form (or auto-save).
4. Refresh the page.
5. Verify the pages **still** appear correctly. (Before this fix, they would have merged into one page after refresh).
