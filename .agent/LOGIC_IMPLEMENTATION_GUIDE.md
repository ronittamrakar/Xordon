# Form Logic Builder - Implementation Guide

## Overview

This guide explains how to integrate and use the new form logic system that was just implemented.

## What Was Implemented

### 1. Enhanced LogicAutomationsPanel Component
**File**: `src/components/webforms/form-builder/LogicAutomationsPanel.tsx`

**Features**:
- ✅ Integrated with LogicBuilderModal for creating/editing rules
- ✅ Rule management (enable/disable, edit, duplicate, delete)
- ✅ Expandable rule cards showing conditions and actions
- ✅ Visual indicators for rule status (enabled/disabled)
- ✅ Empty states with helpful prompts
- ✅ Improved automations interface
- ✅ Better UX with icons, badges, and clear labeling

**Key Improvements**:
- Rules are now displayed in cards with expand/collapse functionality
- Each rule shows its conditions, actions, and else-actions
- Enable/disable toggle for quick testing
- Duplicate functionality for creating similar rules
- Better visual hierarchy and organization

### 2. Logic Execution Engine
**File**: `src/components/webforms/form-builder/LogicEngine.ts`

**Features**:
- ✅ Runtime evaluation of logic conditions
- ✅ Support for all operators (equals, contains, greater_than, etc.)
- ✅ Field comparison support
- ✅ Case-insensitive matching
- ✅ Action execution (show/hide/require/unrequire fields)
- ✅ Dependency tracking
- ✅ Circular dependency validation
- ✅ Debug logging utilities

**Supported Operators**:
- `equals`, `not_equals`
- `contains`, `not_contains`
- `starts_with`, `ends_with`
- `is_empty`, `is_not_empty`
- `greater_than`, `less_than`
- `greater_or_equal`, `less_or_equal`

**Supported Actions**:
- `show_fields` - Make fields visible
- `hide_fields` - Hide fields and clear their values
- `require_fields` - Make fields required
- `unrequire_fields` - Make fields optional
- `set_value` - Set field value programmatically
- `calculate` - (Planned) Calculate values based on formula

### 3. React Hook for Logic Integration
**File**: `src/components/webforms/form-builder/useFormLogic.ts`

**Features**:
- ✅ Easy integration with React components
- ✅ Automatic logic execution on value changes
- ✅ Form state management
- ✅ Helper functions for field states
- ✅ Validation and debugging support

## How to Use

### In the Form Builder (Already Integrated)

The LogicAutomationsPanel is already integrated into the WebFormBuilder. When you navigate to the Logic tab:

1. Click "Create Rule" to open the advanced logic builder
2. Configure conditions (If field X equals Y)
3. Configure actions (Then show/hide/require fields)
4. Optionally configure else-actions
5. Save the rule
6. Enable/disable rules with the power button
7. Expand rules to see their details
8. Edit, duplicate, or delete rules as needed

### In Form Rendering (Needs Integration)

To make logic rules actually work when users fill out forms, you need to integrate the logic engine:

```typescript
import { useFormLogic } from '@/components/webforms/form-builder/useFormLogic';

function FormRenderer({ form, fields }) {
  const logic = useFormLogic({
    fields: fields,
    rules: form.settings?.logic_rules || [],
    debug: true, // Enable debug logging
  });

  return (
    <form>
      {fields.map(field => {
        // Check if field should be visible
        if (!logic.isFieldVisible(field.id)) {
          return null;
        }

        return (
          <div key={field.id}>
            <label>
              {field.label}
              {logic.isFieldRequired(field.id) && <span>*</span>}
            </label>
            <input
              value={logic.getFieldValue(field.id)}
              onChange={(e) => logic.setFieldValue(field.id, e.target.value)}
              disabled={logic.isFieldDisabled(field.id)}
              required={logic.isFieldRequired(field.id)}
            />
          </div>
        );
      })}
    </form>
  );
}
```

### Validation Example

```typescript
const logic = useFormLogic({
  fields,
  rules,
});

// Check if rules are valid
if (!logic.validation.valid) {
  console.error('Logic validation errors:', logic.validation.errors);
}
```

### Debug Mode

```typescript
const logic = useFormLogic({
  fields,
  rules,
  debug: true, // Logs execution to console
});
```

## Next Steps

### Immediate (Required for Logic to Work)

1. **Integrate with FormCanvas**
   - Update `FormCanvas.tsx` to use `useFormLogic` hook
   - Apply field visibility based on logic states
   - Apply required/disabled states

2. **Integrate with Form Renderer**
   - Update public form rendering to use logic engine
   - Ensure logic works for end users filling forms

3. **Backend Support**
   - Add logic validation endpoint
   - Store logic execution results with submissions
   - Add server-side validation for required fields

### Short Term (Enhancements)

1. **Calculation Fields**
   - Implement formula builder UI
   - Add calculation action support
   - Support mathematical operations

2. **Page-Level Logic**
   - Add skip_to_page action
   - Implement page visibility logic
   - Add progress bar updates

3. **Testing Interface**
   - Create logic testing panel
   - Add "Test Mode" to preview logic
   - Show which rules are firing

### Medium Term (Advanced Features)

1. **Visual Flow Builder**
   - Drag-and-drop logic builder
   - Visual dependency graph
   - Flow diagram visualization

2. **Rule Templates**
   - Pre-built rule templates
   - Import/export rules
   - Rule library

3. **Advanced Actions**
   - Webhook triggers
   - Email notifications based on conditions
   - CRM integration actions

## Data Structure

### Logic Rule Format

```typescript
{
  id: "rule_123",
  name: "Show email field if contact method is email",
  enabled: true,
  conditionLogic: "all", // or "any"
  conditions: [
    {
      fieldId: "contact_method",
      operator: "equals",
      value: "email",
      caseInsensitive: false,
      compareWithField: false
    }
  ],
  actions: [
    {
      type: "show_fields",
      targets: ["email_field"]
    },
    {
      type: "require_fields",
      targets: ["email_field"]
    }
  ],
  elseActions: [
    {
      type: "hide_fields",
      targets: ["email_field"]
    }
  ],
  elseEnabled: true
}
```

### Storage

Logic rules are stored in `form.settings.logic_rules` as an array of LogicRule objects.

## API Integration

### Recommended Endpoints

```php
// Validate logic rules
POST /api/webforms/{id}/logic/validate
{
  "rules": [...],
  "fields": [...]
}

// Test logic rules
POST /api/webforms/{id}/logic/test
{
  "rules": [...],
  "fields": [...],
  "values": {...}
}

// Get field dependencies
GET /api/webforms/{id}/logic/dependencies
```

## Troubleshooting

### Rules Not Executing

1. Check if rules are enabled (power button should be green)
2. Verify field IDs match between conditions and form fields
3. Enable debug mode to see execution logs
4. Check validation errors: `logic.validation.errors`

### Circular Dependencies

The engine validates for circular dependencies. If you get an error:
- A field cannot depend on a field that appears after it
- Reorder your fields or restructure your logic

### Performance

- Rules are executed on every value change
- For complex forms, consider:
  - Limiting number of rules
  - Using specific field dependencies
  - Debouncing value changes

## Examples

### Example 1: Show/Hide Based on Selection

```typescript
{
  name: "Show business fields if user is business",
  conditions: [
    { fieldId: "user_type", operator: "equals", value: "business" }
  ],
  actions: [
    { type: "show_fields", targets: ["company_name", "tax_id"] }
  ],
  elseActions: [
    { type: "hide_fields", targets: ["company_name", "tax_id"] }
  ]
}
```

### Example 2: Require Field Based on Condition

```typescript
{
  name: "Require phone if contact method is phone",
  conditions: [
    { fieldId: "contact_method", operator: "equals", value: "phone" }
  ],
  actions: [
    { type: "require_fields", targets: ["phone_number"] }
  ]
}
```

### Example 3: Multiple Conditions (AND logic)

```typescript
{
  name: "Show discount if member and over 65",
  conditionLogic: "all",
  conditions: [
    { fieldId: "is_member", operator: "equals", value: "yes" },
    { fieldId: "age", operator: "greater_or_equal", value: "65" }
  ],
  actions: [
    { type: "show_fields", targets: ["senior_discount"] }
  ]
}
```

### Example 4: Multiple Conditions (OR logic)

```typescript
{
  name: "Show urgent support if critical or high priority",
  conditionLogic: "any",
  conditions: [
    { fieldId: "priority", operator: "equals", value: "critical" },
    { fieldId: "priority", operator: "equals", value: "high" }
  ],
  actions: [
    { type: "show_fields", targets: ["urgent_contact"] }
  ]
}
```

## Testing Checklist

- [ ] Create a simple show/hide rule
- [ ] Test enable/disable toggle
- [ ] Test rule editing
- [ ] Test rule duplication
- [ ] Test rule deletion
- [ ] Create a rule with multiple conditions
- [ ] Create a rule with else-actions
- [ ] Test AND vs OR logic
- [ ] Verify field dependencies
- [ ] Check validation for circular dependencies

## Known Limitations

1. **No Runtime Execution Yet**: Logic rules are saved but not yet integrated with form rendering
2. **No Backend Validation**: Server doesn't validate logic rules yet
3. **No Calculation Support**: Calculate action is planned but not implemented
4. **No Page Logic**: Skip to page action exists but needs multi-step form integration
5. **No Webhook Actions**: Automation actions need backend integration

## Conclusion

The logic builder now has a solid foundation with:
- ✅ Advanced UI for creating/managing rules
- ✅ Complete execution engine
- ✅ React integration hook
- ✅ Validation and debugging tools

The main remaining work is integrating the execution engine with form rendering so logic rules actually affect the form behavior for end users.
