# SignalWire API Cache Fix

## Problem
The SignalWire API credentials were hardcoded through caching. When users updated their API details in the settings page:
- The softphone continued showing numbers from the old API
- The Phone Numbers page showed no numbers (because it was trying to fetch from cache)
- Call campaigns showed numbers from the old API

## Root Cause
The system was caching phone numbers in the `connections` table's `phone_numbers` column. When API credentials were updated:
1. The cached phone numbers were NOT cleared
2. The `getConnectionPhoneNumbers` method prioritized cached data over fresh API calls
3. The `syncFromConnection` method also used cached data if available

## Solution
Made the following changes to ensure fresh data is always fetched after credential updates:

### 1. ConnectionsController.php - updateConnection()
**File**: `backend/src/controllers/ConnectionsController.php`
**Lines**: 105-120

**Change**: When the connection config is updated, the cached phone numbers are now cleared:
```php
if (isset($body['config'])) {
    $updates[] = 'config = ?';
    $params[] = json_encode($body['config']);
    // Clear cached phone numbers when config changes to force fresh fetch
    $updates[] = 'phone_numbers = ?';
    $params[] = json_encode([]);
}
```

### 2. ConnectionsController.php - getConnectionPhoneNumbers()
**File**: `backend/src/controllers/ConnectionsController.php`
**Lines**: 159-209

**Change**: The method now ALWAYS tries to fetch fresh numbers from SignalWire API first, only falling back to cache on error:
- **Before**: Returned cached numbers immediately if available
- **After**: Always fetches from API, uses cache only as fallback if API call fails

### 3. PhoneNumbersController.php - syncFromConnection()
**File**: `backend/src/controllers/PhoneNumbersController.php`
**Lines**: 410-440

**Change**: The sync method now ALWAYS fetches fresh numbers instead of checking cache first:
- **Before**: Only fetched from API if cache was empty
- **After**: Always fetches from API to ensure latest data

## Impact
- ✅ When users update SignalWire credentials, old phone numbers are immediately cleared
- ✅ All API calls fetch fresh data from the new credentials
- ✅ Softphone shows correct numbers from new API
- ✅ Phone Numbers page displays current numbers
- ✅ Call campaigns use correct phone numbers
- ✅ Cache is still used as a fallback for resilience if API calls fail

## Testing Steps
1. Go to Settings > Connections
2. Update SignalWire API credentials (Project ID, Space URL, API Token)
3. Save the connection
4. Open the Softphone - should show numbers from new API
5. Go to Phone Numbers page - should display numbers from new API
6. Create/edit a call campaign - should show numbers from new API
