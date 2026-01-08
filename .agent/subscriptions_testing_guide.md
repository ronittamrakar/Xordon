# Subscriptions Page - Testing Guide

## 🧪 How to Test

### Prerequisites
1. Ensure backend is running (`php -S localhost:8000 -t backend/public`)
2. Ensure frontend is running (`npm run dev`)
3. Navigate to `http://localhost:5173/finance/subscriptions`

## Test Scenarios

### 1. Create Subscription Plan
**Steps:**
1. Click "New Plan" button
2. Fill in the form:
   - Plan Name: "Premium Monthly"
   - Price: 99.99
   - Currency: USD
   - Interval: Monthly
   - Frequency: 1
   - Description: "Premium features with monthly billing"
3. Click "Create Plan"

**Expected Result:**
- ✅ Toast notification: "Subscription plan created"
- ✅ New plan appears in the list
- ✅ Stats cards update (Total Plans +1, Active Plans +1)

### 2. Test All Billing Intervals
**Create plans with each interval:**
- Daily: $5/day
- Weekly: $30/week
- Monthly: $99/month
- **Quarterly: $270/quarter** (NEW!)
- Yearly: $999/year

**Expected Result:**
- ✅ All intervals save correctly
- ✅ Display shows proper formatting (e.g., "Every quarter", "Every month")

### 3. Test Interval Frequency
**Create plans with custom frequencies:**
- Every 2 weeks
- Every 3 months
- Every 6 months

**Expected Result:**
- ✅ Display shows "Every 2 weeks", "Every 3 months", etc.
- ✅ Frequency saves correctly

### 4. Edit Subscription Plan
**Steps:**
1. Click dropdown menu on any plan
2. Select "Edit Plan"
3. Modify fields (e.g., change price from $99 to $119)
4. Change status to "Inactive"
5. Click "Save Changes"

**Expected Result:**
- ✅ Toast notification: "Subscription plan updated"
- ✅ Changes reflect in the list
- ✅ Stats update if status changed

### 5. Delete Subscription Plan
**Steps:**
1. Click dropdown menu on any plan
2. Select "Delete"
3. Confirm deletion

**Expected Result:**
- ✅ Confirmation dialog appears
- ✅ Toast notification: "Subscription plan deleted"
- ✅ Plan removed from list
- ✅ Stats update

### 6. View Modes
**Steps:**
1. Click "Grid View" button
2. Verify grid layout
3. Click "Table View" button
4. Verify table layout

**Expected Result:**
- ✅ Both views display all plans correctly
- ✅ All data visible in both views
- ✅ Hover effects work in grid view

### 7. Search Functionality
**Steps:**
1. Create multiple plans with different names
2. Type in search box (e.g., "Premium")
3. Verify filtering

**Expected Result:**
- ✅ Only matching plans shown
- ✅ Search is case-insensitive
- ✅ Searches both name and description

### 8. Empty State
**Steps:**
1. Delete all plans
2. View empty state

**Expected Result:**
- ✅ Empty state message displayed
- ✅ "Create First Plan" button visible
- ✅ Clicking button opens create dialog

### 9. Stats Calculations
**Steps:**
1. Create 3 plans: $99/month, $49/month, $199/month
2. Set one to inactive
3. Check stats cards

**Expected Result:**
- ✅ Total Plans: 3
- ✅ Active Plans: 2
- ✅ Monthly Potential Value: $247 (only active plans)

### 10. Currency Support
**Test each currency:**
- USD: $99.00
- EUR: €99.00
- GBP: £99.00
- CAD: CA$99.00

**Expected Result:**
- ✅ Correct currency symbol displayed
- ✅ Proper formatting for each currency

## 🐛 Known Issues to Watch For

### Potential Issues:
1. **Backend Validation**: Backend doesn't strictly validate interval values
   - Watch for: Any string accepted as interval
   - Impact: Could save invalid intervals if frontend validation bypassed

2. **Workspace Scoping**: Ensure plans are scoped to current workspace
   - Test: Switch workspaces and verify plans don't leak

3. **Concurrent Edits**: No optimistic locking
   - Test: Open same plan in two tabs, edit both
   - Watch for: Last write wins (expected behavior)

## 📊 Performance Testing

### Load Testing:
1. Create 50+ subscription plans
2. Test search performance
3. Test view switching (grid ↔ table)
4. Test stats calculation

**Expected:**
- ✅ No lag when switching views
- ✅ Search is instant
- ✅ Stats calculate quickly

## 🔒 Security Testing

### Authorization:
1. Ensure only authenticated users can access
2. Verify workspace isolation
3. Test with different user roles

### Input Validation:
1. Try negative prices
2. Try extremely large numbers
3. Try special characters in name
4. Try SQL injection in search

**Expected:**
- ✅ Proper validation messages
- ✅ No crashes or errors
- ✅ No security vulnerabilities

## 📱 Responsive Testing

### Test on:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

**Expected:**
- ✅ Grid adapts to screen size
- ✅ Table scrolls horizontally on mobile
- ✅ Dialogs are mobile-friendly
- ✅ All buttons accessible

## ✅ Acceptance Criteria

### Must Pass:
- [ ] All CRUD operations work
- [ ] All billing intervals save correctly
- [ ] Quarterly billing option available
- [ ] Interval display formatting correct
- [ ] Stats calculations accurate
- [ ] Search works
- [ ] Both view modes work
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Responsive on all devices

### Nice to Have:
- [ ] Smooth animations
- [ ] Fast performance with 50+ plans
- [ ] Keyboard navigation works
- [ ] Screen reader compatible

## 🚨 Regression Testing

After any code changes, verify:
1. Existing plans still load
2. Edit doesn't break existing data
3. Delete still works
4. Stats still calculate correctly
5. Search still works

## 📝 Test Data

### Sample Plans to Create:
```json
[
  {
    "name": "Basic Monthly",
    "price": 29.99,
    "interval": "monthly",
    "description": "Essential features for small teams"
  },
  {
    "name": "Pro Quarterly",
    "price": 249.99,
    "interval": "quarterly",
    "description": "Advanced features with quarterly billing"
  },
  {
    "name": "Enterprise Yearly",
    "price": 2999.99,
    "interval": "yearly",
    "description": "Full suite with annual commitment"
  },
  {
    "name": "Weekly Starter",
    "price": 9.99,
    "interval": "weekly",
    "description": "Try before you commit"
  }
]
```

## 🎯 Success Metrics

### Page is considered working if:
- ✅ 100% of CRUD operations succeed
- ✅ 0 console errors during normal use
- ✅ All billing intervals work correctly
- ✅ Stats are accurate
- ✅ UI is responsive and smooth
- ✅ No data loss or corruption

## 🔄 Continuous Testing

### After Each Deployment:
1. Smoke test: Create, edit, delete one plan
2. Verify stats update correctly
3. Check for console errors
4. Verify quarterly option still present
5. Test one search query

**Time Required:** ~5 minutes
