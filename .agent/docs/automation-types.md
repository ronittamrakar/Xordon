# Automation Types and Categorization

This document describes the three-tier automation categorization system used in the Xordon platform.

## Overview

The system categorizes automations into three main types based on their execution characteristics:

| Type | Icon | Color | Key Identifier |
|------|------|-------|----------------|
| **Trigger** | ⚡ Zap | Orange | `delay_amount === 0` or null |
| **Rule** | 🎚️ SlidersHorizontal | Blue | `delay_amount > 0` or `nodes_count <= 3` |
| **Workflow** | 🔀 Workflow | Purple | `nodes_count > 3` |

---

## 1. Triggers (Immediate Actions)

**Definition**: Automations that execute immediately when their condition is met.

**Key Identifier**: `delay_amount = 0` or `null`

**Characteristics**:
- Simple event-action pairs
- Instant execution
- No waiting period

**Examples**:
- "Send welcome email immediately when contact is added"
- "Send SMS notification right away when form is submitted"
- "Make a call instantly when lead status changes"

---

## 2. Rules (Conditional Logic with Delay)

**Definition**: Automations that include delayed execution or conditional logic.

**Key Identifier**: `delay_amount > 0` OR flow with `nodes_count <= 3`

**Characteristics**:
- Non-zero delay (minutes/hours/days)
- Conditional logic (if-then-else scenarios)
- Strategic timing

**Examples**:
- "Send follow-up email 2 days after initial contact"
- "Send reminder SMS 1 hour before appointment"
- "Escalate to manager if no response after 3 days"

---

## 3. Workflows (Complex Multi-step Processes)

**Definition**: Complex flows with multiple steps and nodes.

**Key Identifier**: `nodes_count > 3`

**Characteristics**:
- Multiple nodes/steps
- Complex flow structures
- Multi-step processes
- Often include branching logic

**Examples**:
- "Complete nurture sequence with 5 email steps over 2 weeks"
- "Lead scoring workflow with multiple touchpoints"
- "Customer onboarding flow with conditional branches"

---

## Visual Distinctions in the UI

### Badge Styles

```tsx
// Trigger Badge
<Badge className="bg-orange-50 text-orange-700 border-orange-200">
  <Zap className="h-3 w-3" />
  Trigger
</Badge>

// Rule Badge
<Badge className="bg-blue-50 text-blue-700 border-blue-200">
  <SlidersHorizontal className="h-3 w-3" />
  Rule
</Badge>

// Workflow Badge
<Badge className="bg-purple-50 text-purple-700 border-purple-200">
  <Workflow className="h-3 w-3" />
  Workflow
</Badge>
```

---

## Classification Logic

Located in `AutomationsUnified.tsx` in the `allAutomations` useMemo:

```typescript
// For regular automations (FollowUpAutomation):
const type = (!a.delay_amount || a.delay_amount === 0) ? 'trigger' : 'rule';

// For flows:
const type = (f.nodes_count || 0) > 3 ? 'workflow' : 'rule';
```

---

## Type Definitions

### Recipe Interface
```typescript
interface Recipe {
  // ... other fields
  type?: 'trigger' | 'rule' | 'workflow';
}
```

### FollowUpAutomation
The `FollowUpAutomation` type doesn't include a `type` field directly. Instead, the type is computed at runtime based on the `delay_amount` property.

---

## Why This Distinction Matters

| Type | Use Case |
|------|----------|
| **Triggers** | Immediate responses - perfect for time-sensitive actions |
| **Rules** | Strategic timing - allowing for thoughtful delays and conditional logic |
| **Workflows** | Complex campaigns - multi-step, sophisticated automation sequences |

This categorization helps users understand the execution timing and complexity of their automations, making it easier to choose the right type for their specific use case.

---

## Files Affected

1. **`src/pages/AutomationsUnified.tsx`** - Main automation management UI
2. **`src/pages/Workflows.tsx`** - Workflow library
3. **`src/lib/api.ts`** - API types (FollowUpAutomation)

---

## Filter Options

Users can filter automations by type in both the "My Automations" and "Library" tabs:

```tsx
<SelectContent>
  <SelectItem value="all">All Types</SelectItem>
  <SelectItem value="trigger">Triggers</SelectItem>
  <SelectItem value="rule">Rules</SelectItem>
  <SelectItem value="workflow">Workflows</SelectItem>
</SelectContent>
```

---

## Stats Dashboard

The stats cards at the top of the "My Automations" tab show counts for each type:

| Card | Filter | Icon Color |
|------|--------|------------|
| Total | All automations | Blue |
| Triggers | `type === 'trigger'` | Orange |
| Rules | `type === 'rule'` | Blue |
| Workflows | `type === 'workflow'` | Purple |
| Active | `status === 'active'` | Green |
