/**
 * Finance Integrations Page - Manual Testing Script
 * 
 * This document provides step-by-step instructions to manually test
 * all features of the Finance Integrations page.
 */

# Finance Integrations Testing Guide

## Prerequisites
1. ✅ Development server running at http://localhost:5173
2. ✅ Backend API server running
3. ✅ Database with required tables
4. ✅ Test accounts for QuickBooks, Stripe, PayPal (optional)

## Test Scenarios

### 1. Page Load & Display
**URL**: http://localhost:5173/finance/integrations

**Expected Results**:
- [ ] Page loads without errors
- [ ] Header displays "Finance Integrations"
- [ ] "Finance Settings" button visible in header
- [ ] Four categories displayed:
  - Accounting Software
  - Payment Processors
  - Analytics & Reporting
  - Automation & Workflows
- [ ] All integration cards render correctly
- [ ] Status badges show correct states
- [ ] Icons display properly
- [ ] No console errors

**Integration Cards to Verify**:
- [ ] QuickBooks (Accounting)
- [ ] FreshBooks (Accounting) - Coming Soon
- [ ] Xero (Accounting) - Coming Soon
- [ ] Stripe (Payment)
- [ ] PayPal (Payment)
- [ ] Square (Payment) - Coming Soon
- [ ] Financial Analytics (Analytics)
- [ ] Zapier (Automation) - Coming Soon

---

### 2. QuickBooks Integration Tests

#### 2.1 Connect QuickBooks (Not Connected)
**Steps**:
1. Find QuickBooks card
2. Verify status badge shows "Available"
3. Click "Connect" button

**Expected Results**:
- [ ] Redirects to QuickBooks OAuth page OR
- [ ] Shows toast: "Starting QuickBooks OAuth flow..."
- [ ] No errors in console

#### 2.2 Manage QuickBooks (If Connected)
**Steps**:
1. Find QuickBooks card
2. Verify status badge shows "Connected"
3. Click "Manage" button

**Expected Results**:
- [ ] Settings modal opens
- [ ] Modal title: "QuickBooks Settings"
- [ ] Green status box shows "Connected"
- [ ] Company name displayed
- [ ] Four toggle switches visible:
  - Enable Sync
  - Auto-sync Invoices
  - Auto-sync Payments
  - Auto-sync Customers
- [ ] "Test Connection" button visible
- [ ] "Sync Now" button visible
- [ ] "Disconnect" button visible (red)

#### 2.3 Toggle QuickBooks Settings
**Steps**:
1. Open QuickBooks settings modal
2. Toggle "Enable Sync" switch
3. Toggle "Auto-sync Invoices" switch
4. Toggle "Auto-sync Payments" switch
5. Toggle "Auto-sync Customers" switch

**Expected Results**:
- [ ] Each toggle updates immediately
- [ ] Success toast appears: "Settings updated"
- [ ] Toggles reflect new state
- [ ] Dependent toggles disable when master toggle is off

#### 2.4 Test QuickBooks Connection
**Steps**:
1. Open QuickBooks settings modal
2. Click "Test Connection" button

**Expected Results**:
- [ ] Button shows loading spinner
- [ ] Button text changes to "Testing..."
- [ ] After completion, toast shows:
  - Success: "Connection test successful!"
  - OR Error: "Connection test failed"

#### 2.5 Sync QuickBooks Data
**Steps**:
1. Open QuickBooks settings modal
2. Click "Sync Now" button

**Expected Results**:
- [ ] Button shows loading spinner
- [ ] Button text changes to "Syncing..."
- [ ] Success toast: "Sync started successfully"
- [ ] Integration status updates

#### 2.6 Disconnect QuickBooks
**Steps**:
1. Open QuickBooks settings modal
2. Click "Disconnect" button

**Expected Results**:
- [ ] Button shows loading spinner
- [ ] Button text changes to "Disconnecting..."
- [ ] Success toast: "Integration disconnected successfully"
- [ ] Modal closes
- [ ] Card status changes to "Available"
- [ ] "Connect" button appears

---

### 3. Stripe Integration Tests

#### 3.1 Connect Stripe (Not Connected)
**Steps**:
1. Find Stripe card
2. Verify status badge shows "Available"
3. Click "Connect" button

**Expected Results**:
- [ ] Stripe Connect account creation starts
- [ ] Redirects to Stripe onboarding page
- [ ] OR Shows loading indicator
- [ ] No errors in console

#### 3.2 Manage Stripe (If Connected)
**Steps**:
1. Find Stripe card
2. Verify status badge shows "Connected"
3. Click "Manage" button

**Expected Results**:
- [ ] Settings modal opens
- [ ] Modal title: "Stripe Settings"
- [ ] Purple status box shows "Connected"
- [ ] Business name displayed
- [ ] Two status boxes visible:
  - Charges: Enabled/Disabled
  - Payouts: Enabled/Disabled
- [ ] "Test Connection" button visible
- [ ] "Sync Now" button visible
- [ ] "Disconnect" button visible (red)

#### 3.3 Test Stripe Connection
**Steps**:
1. Open Stripe settings modal
2. Click "Test Connection" button

**Expected Results**:
- [ ] Button shows loading spinner
- [ ] Success/error toast appears
- [ ] Connection status verified

#### 3.4 Disconnect Stripe
**Steps**:
1. Open Stripe settings modal
2. Click "Disconnect" button

**Expected Results**:
- [ ] Confirmation or immediate disconnect
- [ ] Success toast appears
- [ ] Modal closes
- [ ] Card status changes to "Available"

---

### 4. PayPal Integration Tests

#### 4.1 Connect PayPal (Not Connected)
**Steps**:
1. Find PayPal card
2. Verify status badge shows "Available"
3. Click "Connect" button

**Expected Results**:
- [ ] Connection modal opens
- [ ] Modal title: "Connect PayPal"
- [ ] Three input fields visible:
  - Client ID (text input)
  - Client Secret (password input)
  - Mode (radio buttons: Sandbox/Live)
- [ ] "Cancel" button visible
- [ ] "Connect" button visible

#### 4.2 Enter PayPal Credentials
**Steps**:
1. Open PayPal connection modal
2. Enter Client ID: "test_client_id"
3. Enter Client Secret: "test_secret"
4. Select "Sandbox" mode
5. Click "Connect" button

**Expected Results**:
- [ ] Button shows loading spinner
- [ ] Button text changes to "Connecting..."
- [ ] On success:
  - Success toast: "PayPal connected successfully"
  - Modal closes
  - Card status changes to "Connected"
- [ ] On error:
  - Error toast with message
  - Modal stays open

#### 4.3 Manage PayPal (If Connected)
**Steps**:
1. Find PayPal card
2. Verify status badge shows "Connected"
3. Click "Manage" button

**Expected Results**:
- [ ] Settings modal opens
- [ ] Modal title: "PayPal Settings"
- [ ] Blue status box shows "Connected"
- [ ] Mode displayed (sandbox/live)
- [ ] "Test Connection" button visible
- [ ] "Sync Now" button visible
- [ ] "Disconnect" button visible (red)

#### 4.4 Disconnect PayPal
**Steps**:
1. Open PayPal settings modal
2. Click "Disconnect" button

**Expected Results**:
- [ ] Success toast appears
- [ ] Modal closes
- [ ] Card status changes to "Available"

---

### 5. Coming Soon Integrations

#### 5.1 Test Coming Soon Cards
**Cards to Test**:
- FreshBooks
- Xero
- Square
- Zapier

**Steps for Each**:
1. Find the card
2. Verify status badge shows "Coming Soon"
3. Click the card or button

**Expected Results**:
- [ ] Button is disabled
- [ ] Button text: "Coming Soon"
- [ ] No action occurs
- [ ] OR Toast: "This integration is coming soon!"

---

### 6. Navigation Tests

#### 6.1 Finance Settings Button
**Steps**:
1. Click "Finance Settings" button in header

**Expected Results**:
- [ ] Navigates to /finance/settings
- [ ] OR Navigates to /settings?tab=finance
- [ ] No errors

#### 6.2 Financial Analytics Card
**Steps**:
1. Find "Financial Analytics" card
2. Click "Connect" or the card itself

**Expected Results**:
- [ ] Navigates to /finance/overview
- [ ] Analytics dashboard loads

---

### 7. Error Handling Tests

#### 7.1 API Error Simulation
**Steps**:
1. Disconnect network or stop backend
2. Try to connect an integration
3. Try to test connection
4. Try to sync

**Expected Results**:
- [ ] Error toast appears with message
- [ ] Loading state ends
- [ ] No app crash
- [ ] User can retry

#### 7.2 Invalid Credentials
**Steps**:
1. Open PayPal connection modal
2. Enter invalid credentials
3. Click "Connect"

**Expected Results**:
- [ ] Error toast appears
- [ ] Modal stays open
- [ ] User can correct and retry

---

### 8. UI/UX Tests

#### 8.1 Responsive Design
**Steps**:
1. Resize browser to mobile width (375px)
2. Resize to tablet width (768px)
3. Resize to desktop width (1920px)

**Expected Results**:
- [ ] Cards stack properly on mobile
- [ ] Grid adjusts to screen size
- [ ] Modals are responsive
- [ ] No horizontal scroll
- [ ] All text readable

#### 8.2 Dark Mode
**Steps**:
1. Toggle dark mode
2. Check all elements

**Expected Results**:
- [ ] All text readable
- [ ] Cards have proper contrast
- [ ] Modals styled correctly
- [ ] Status badges visible
- [ ] No white backgrounds

#### 8.3 Loading States
**Steps**:
1. Observe page initial load
2. Trigger various actions

**Expected Results**:
- [ ] Skeleton loaders on initial load
- [ ] Button spinners during mutations
- [ ] Disabled states during operations
- [ ] Smooth transitions

---

### 9. Data Persistence Tests

#### 9.1 Status Persistence
**Steps**:
1. Connect an integration
2. Refresh the page
3. Navigate away and back

**Expected Results**:
- [ ] Integration status persists
- [ ] Settings persist
- [ ] No re-authentication needed

#### 9.2 Auto-Refresh
**Steps**:
1. Keep page open for 30+ seconds
2. Observe network tab

**Expected Results**:
- [ ] Status refreshes every 30 seconds
- [ ] No performance issues
- [ ] Updates reflect automatically

---

### 10. Console & Network Tests

#### 10.1 Console Errors
**Steps**:
1. Open browser console
2. Perform all actions above

**Expected Results**:
- [ ] No errors in console
- [ ] Only expected warnings (if any)
- [ ] No 404s or failed requests

#### 10.2 Network Requests
**Steps**:
1. Open Network tab
2. Perform various actions

**Expected Results**:
- [ ] API calls to correct endpoints
- [ ] Proper request/response format
- [ ] No unnecessary requests
- [ ] Proper error handling

---

## Summary Checklist

### Critical Features
- [ ] Page loads successfully
- [ ] All integrations display correctly
- [ ] Connect buttons work
- [ ] Manage buttons work
- [ ] Settings modals open
- [ ] Toggles update settings
- [ ] Test connection works
- [ ] Sync triggers work
- [ ] Disconnect works
- [ ] Toast notifications appear
- [ ] Loading states show
- [ ] Error handling works

### Nice-to-Have Features
- [ ] Auto-refresh works
- [ ] Dark mode works
- [ ] Responsive design works
- [ ] Smooth animations
- [ ] Proper accessibility

---

## Known Issues / Notes

### Backend Requirements
- All API endpoints must be implemented
- Database tables must exist
- OAuth providers must be configured

### Environment Variables
- Stripe publishable key
- PayPal client credentials
- QuickBooks app credentials

### Browser Compatibility
- Tested on: Chrome, Firefox, Safari, Edge
- Mobile browsers: Safari iOS, Chrome Android

---

## Bug Report Template

If you find issues, report them with:

```
**Issue**: [Brief description]
**Steps to Reproduce**:
1. 
2. 
3. 

**Expected**: [What should happen]
**Actual**: [What actually happened]
**Console Errors**: [Any errors]
**Screenshot**: [If applicable]
**Browser**: [Browser and version]
```

---

## Test Results

Date: _____________
Tester: _____________

**Overall Status**: [ ] PASS  [ ] FAIL  [ ] PARTIAL

**Notes**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
