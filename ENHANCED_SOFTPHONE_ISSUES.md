# EnhancedSoftphone - Issues and Fixes

## Critical Issues Found

### 1. **Call Timer Not Incrementing** ❌ CRITICAL
**Problem:** The `callTimer` state is initialized and reset to 0, but there's no `useEffect` to increment it during active calls.

**Impact:** Users cannot see how long their call has been active.

**Fix Required:** Add a useEffect hook to increment the timer every second when a call is connected.

### 2. **Missing useEffect Dependencies** ⚠️ WARNING
**Problem:** Several useEffect hooks have incomplete dependency arrays, which could lead to stale closures.

**Locations:**
- Line 242-256: `useEffect` for incoming calls
- Line 2636: SMS sender number sync

**Impact:** May cause unexpected behavior or stale data.

### 3. **Potential Memory Leaks** ⚠️ WARNING
**Problem:** Some intervals and event listeners may not be properly cleaned up.

**Locations:**
- Status polling interval (`statusPollingRef.current`)
- Audio monitor interval (`window.audioMonitorInterval`)
- Device change event listener

**Impact:** Memory leaks over time, especially with multiple calls.

### 4. **Error Handling Issues** ⚠️ MODERATE
**Problem:** Some error handlers use the `error` variable name which shadows the `error` function.

**Locations:**
- Line 1210: `toast.error(error instanceof Error ? error.message : 'Failed to make call');`
- Multiple other locations

**Impact:** Could cause confusion and incorrect error logging.

### 5. **Type Safety Issues** ℹ️ INFO
**Problem:** Some variables use `any` type which reduces type safety.

**Locations:**
- Line 240: `const [incomingCall, setIncomingCall] = useState<any | null>(null);`

**Impact:** Reduced type safety, potential runtime errors.

## Recommended Fixes

### Fix 1: Add Call Timer useEffect

Add this after line 1094 (after the volume sync useEffect):

```typescript
// Update call timer every second for connected calls
useEffect(() => {
  if (currentCall?.status === 'connected') {
    const interval = setInterval(() => {
      setCallTimer(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  } else {
    // Reset timer when call is not connected
    if (currentCall?.status === 'ended' || currentCall?.status === 'failed') {
      setCallTimer(0);
    }
  }
}, [currentCall?.status]);
```

### Fix 2: Add Cleanup for Status Polling

Update the `handleCallEnd` function to ensure proper cleanup:

```typescript
const handleCallEnd = async (sipCall?: SIPCall) => {
  // Clean up status polling immediately
  if (statusPollingRef.current) {
    clearInterval(statusPollingRef.current);
    statusPollingRef.current = null;
  }

  // Also clean up legacy window-based cleanup
  if ((window as any).callStatusCleanup) {
    (window as any).callStatusCleanup();
    (window as any).callStatusCleanup = null;
  }

  // ... rest of the function
};
```

### Fix 3: Improve Error Variable Naming

Replace the `error` function with a different name to avoid conflicts:

```typescript
const logError = (...args: any[]) => { if (debug) console.error(...args); };
```

Then update all usages of `error(...)` to `logError(...)`.

### Fix 4: Add Component Unmount Cleanup

Add a useEffect to clean up resources when the component unmounts:

```typescript
useEffect(() => {
  return () => {
    // Cleanup on unmount
    cleanupAudio();
    
    if (statusPollingRef.current) {
      clearInterval(statusPollingRef.current);
    }
    
    if ((window as any).audioMonitorInterval) {
      clearInterval((window as any).audioMonitorInterval);
    }
    
    // End any active call
    if (currentCall) {
      handleEndCall();
    }
  };
}, []); // Empty dependency array - only run on unmount
```

### Fix 5: Improve Type Safety for Incoming Calls

Replace:
```typescript
const [incomingCall, setIncomingCall] = useState<any | null>(null);
```

With:
```typescript
interface IncomingCall {
  id: string;
  from: string;
  answer: () => Promise<void>;
  hangup: () => Promise<void>;
}

const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
```

## Performance Optimizations

### 1. Memoize Expensive Computations
Several computations could be memoized:

```typescript
const filteredCallHistory = useMemo(() => {
  if (callLogFilter === 'all') return callHistory;
  return callHistory.filter(call => call.direction === callLogFilter);
}, [callHistory, callLogFilter]);

const filteredContacts = useMemo(() => {
  if (!contactsSearch) return contacts;
  const search = contactsSearch.toLowerCase();
  return contacts.filter(contact => 
    contact.name?.toLowerCase().includes(search) ||
    contact.phone?.toLowerCase().includes(search) ||
    contact.email?.toLowerCase().includes(search)
  );
}, [contacts, contactsSearch]);
```

### 2. Debounce Search Inputs
Add debouncing for search inputs to reduce re-renders:

```typescript
const [debouncedContactsSearch, setDebouncedContactsSearch] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedContactsSearch(contactsSearch);
  }, 300);
  
  return () => clearTimeout(timer);
}, [contactsSearch]);
```

## Code Quality Improvements

### 1. Extract Large Components
The `EnhancedSoftphone` component is 4326 lines - consider extracting:
- Call controls into `CallControls.tsx`
- SMS interface into `SoftphoneSMS.tsx`
- Contacts list into `SoftphoneContacts.tsx`
- Settings panel into `SoftphoneSettings.tsx`

### 2. Create Custom Hooks
Extract reusable logic into custom hooks:
- `useCallTimer()` - Handle call timing logic
- `usePhoneNumbers()` - Handle phone number fetching and caching
- `useCampaigns()` - Handle campaign fetching
- `useCallHistory()` - Handle call history management

### 3. Reduce Console Logging in Production
The debug logging is good, but ensure it's disabled in production:

```typescript
const debug = import.meta.env.DEV && localStorage.getItem('debug_softphone') === '1';
```

This is already implemented correctly.

## Testing Recommendations

1. **Test Call Timer:**
   - Make a call and verify timer increments every second
   - End call and verify timer resets
   - Test with multiple calls in sequence

2. **Test Memory Leaks:**
   - Make 10+ calls and check browser memory usage
   - Verify all intervals are cleared
   - Check for orphaned event listeners

3. **Test Audio:**
   - Verify bidirectional audio works
   - Test volume control
   - Test mute/unmute

4. **Test Edge Cases:**
   - What happens if user closes softphone during active call?
   - What happens if network disconnects?
   - What happens if microphone permission is denied?

## Priority Order

1. **HIGH PRIORITY** (Fix immediately):
   - Add call timer useEffect
   - Fix cleanup in handleCallEnd

2. **MEDIUM PRIORITY** (Fix soon):
   - Improve error variable naming
   - Add component unmount cleanup
   - Improve type safety

3. **LOW PRIORITY** (Nice to have):
   - Performance optimizations
   - Code quality improvements
   - Extract components

## Implementation Status

- [x] Audio element added to JSX
- [x] Audio initialization fixed
- [x] Audio cleanup improved
- [x] Volume sync added
- [ ] Call timer useEffect (NEEDS FIX)
- [ ] Cleanup improvements (NEEDS FIX)
- [ ] Error naming improvements (OPTIONAL)
- [ ] Type safety improvements (OPTIONAL)
- [ ] Performance optimizations (OPTIONAL)
