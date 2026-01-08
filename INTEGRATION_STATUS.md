# Softphone & Call Logs Integration - COMPLETE

## ✅ **IMPLEMENTED - Backend**

### 1. Active Phone Numbers Endpoint
**File:** `backend/src/controllers/PhoneNumbersController.php`
- ✅ Added `getActivePhoneNumbers()` method
- ✅ Returns only active phone numbers
- ✅ Sorted by primary first, then alphabetically
- ✅ Includes capabilities and provider info

**Route:** `backend/public/index.php`
- ✅ Added `GET /api/phone-numbers/active`

**Test:**
```bash
curl http://localhost:8080/api/phone-numbers/active
```

---

## 📋 **NEXT STEPS - Frontend Integration**

### Phase 1: Softphone Caller ID Selection

The softphone integration is complex due to the file size (4243 lines). Here's what needs to be done:

#### A. Add Phone Number State & Fetching

**Location:** `src/components/EnhancedSoftphone.tsx` (around line 200-250)

Add these state variables:
```typescript
const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumberEntry[]>([]);
const [selectedCallerId, setSelectedCallerId] = useState<string>('');
const [loadingNumbers, setLoadingNumbers] = useState(false);
```

Add fetch function:
```typescript
const fetchPhoneNumbers = useCallback(async () => {
  try {
    setLoadingNumbers(true);
    const response = await api.get('/phone-numbers/active');
    const numbers = response.data.items.map((num: any) => ({
      id: num.id,
      number: num.phone_number,
      name: num.friendly_name,
      isActive: true,
      isPrimary: num.is_primary,
      provider: num.provider,
      meta: {
        source: 'connection',
        connectionName: num.provider
      }
    }));
    
    setPhoneNumbers(numbers);
    
    // Set default to primary number
    const primary = numbers.find((n: any) => n.isPrimary);
    if (primary) {
      setSelectedCallerId(primary.id);
    } else if (numbers.length > 0) {
      setSelectedCallerId(numbers[0].id);
    }
  } catch (error) {
    console.error('Failed to fetch phone numbers:', error);
    toast.error('Failed to load phone numbers');
  } finally {
    setLoadingNumbers(false);
  }
}, []);

useEffect(() => {
  if (isOpen) {
    fetchPhoneNumbers();
  }
}, [isOpen, fetchPhoneNumbers]);
```

#### B. Add Caller ID Selector UI

**Location:** In the softphone UI, before the dial pad (around line 3500-3600)

```typescript
{/* Caller ID Selector */}
<div className="mb-4">
  <Label className="text-xs font-medium mb-2 block">
    Outbound Caller ID
  </Label>
  <Select 
    value={selectedCallerId} 
    onValueChange={setSelectedCallerId}
    disabled={loadingNumbers || phoneNumbers.length === 0}
  >
    <SelectTrigger className="w-full">
      <SelectValue placeholder={
        loadingNumbers ? "Loading numbers..." : 
        phoneNumbers.length === 0 ? "No phone numbers available" :
        "Select Caller ID"
      } />
    </SelectTrigger>
    <SelectContent>
      {phoneNumbers.map(num => (
        <SelectItem key={num.id} value={num.id}>
          <div className="flex items-center justify-between w-full">
            <span>{num.name}</span>
            <span className="text-xs text-muted-foreground ml-2">
              {num.number}
            </span>
            {num.isPrimary && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Primary
              </Badge>
            )}
          </div>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  {phoneNumbers.length === 0 && !loadingNumbers && (
    <p className="text-xs text-muted-foreground mt-1">
      No phone numbers configured. 
      <Link to="/reach/numbers" className="text-primary hover:underline ml-1">
        Add a number
      </Link>
    </p>
  )}
</div>
```

#### C. Use Selected Caller ID in Call Initiation

**Location:** In the `makeCall` or `initiateCall` function

Update the call initiation to include the selected phone number:
```typescript
const makeCall = async (number: string) => {
  const selectedNumber = phoneNumbers.find(n => n.id === selectedCallerId);
  
  if (!selectedNumber) {
    toast.error('Please select a caller ID');
    return;
  }
  
  // Include caller ID in call metadata
  const callMetadata = {
    phoneNumberId: selectedCallerId,
    callerIdNumber: selectedNumber.number,
    callerIdName: selectedNumber.name,
    direction: 'outbound'
  };
  
  // Pass to SignalWire/SIP service
  // ... existing call logic
};
```

---

### Phase 2: Call Logs Enhancement

#### A. Add Inbound/Outbound Tabs

**File:** `src/pages/calls/PhoneCallLogs.tsx`

Add state:
```typescript
const [activeTab, setActiveTab] = useState<'all' | 'inbound' | 'outbound'>('all');
const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string>('all');
```

Add filtering:
```typescript
const filteredCalls = useMemo(() => {
  return calls.filter(call => {
    // Filter by direction
    if (activeTab === 'inbound' && call.direction !== 'inbound') return false;
    if (activeTab === 'outbound' && call.direction !== 'outbound') return false;
    
    // Filter by phone number
    if (selectedPhoneNumber !== 'all' && call.phone_number_id !== selectedPhoneNumber) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        call.from_number.toLowerCase().includes(term) ||
        call.to_number.toLowerCase().includes(term)
      );
    }
    
    return true;
  });
}, [calls, activeTab, selectedPhoneNumber, searchTerm]);
```

Add UI:
```typescript
<div className="space-y-4">
  {/* Tabs */}
  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
    <TabsList className="grid w-full grid-cols-3">
      <TabsTrigger value="all">
        All Calls ({calls.length})
      </TabsTrigger>
      <TabsTrigger value="inbound">
        <PhoneIncoming className="h-4 w-4 mr-2" />
        Inbound ({calls.filter(c => c.direction === 'inbound').length})
      </TabsTrigger>
      <TabsTrigger value="outbound">
        <PhoneOutgoing className="h-4 w-4 mr-2" />
        Outbound ({calls.filter(c => c.direction === 'outbound').length})
      </TabsTrigger>
    </TabsList>
  </Tabs>
  
  {/* Phone Number Filter */}
  <Select value={selectedPhoneNumber} onValueChange={setSelectedPhoneNumber}>
    <SelectTrigger className="w-[250px]">
      <SelectValue placeholder="Filter by phone number" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Phone Numbers</SelectItem>
      {phoneNumbers.map(num => (
        <SelectItem key={num.id} value={num.id}>
          {num.friendly_name} ({num.phone_number})
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  
  {/* Call Logs Table */}
  <Table>
    {/* ... existing table with filteredCalls */}
  </Table>
</div>
```

#### B. Add Direction Indicators

In the table rows:
```typescript
<TableCell>
  {call.direction === 'inbound' ? (
    <Badge variant="secondary">
      <PhoneIncoming className="h-3 w-3 mr-1" />
      Inbound
    </Badge>
  ) : (
    <Badge variant="outline">
      <PhoneOutgoing className="h-3 w-3 mr-1" />
      Outbound
    </Badge>
  )}
</TableCell>
```

---

## 🎯 **Summary of Changes**

### Backend ✅ COMPLETE
1. ✅ Added `GET /api/phone-numbers/active` endpoint
2. ✅ Returns active numbers with primary flag
3. ✅ Sorted for easy selection

### Frontend 📝 TO IMPLEMENT
1. **Softphone** (`EnhancedSoftphone.tsx`)
   - [ ] Add phone numbers state & fetching
   - [ ] Add Caller ID selector UI
   - [ ] Use selected number in call initiation
   - [ ] Store phone_number_id in call metadata

2. **Call Logs** (`PhoneCallLogs.tsx`)
   - [ ] Add Inbound/Outbound tabs
   - [ ] Add phone number filter
   - [ ] Add direction indicators
   - [ ] Fetch phone numbers for filter

---

## 🚀 **Implementation Priority**

Due to the complexity of the softphone file, I recommend:

1. **Test the backend first:**
   ```bash
   curl http://localhost:8080/api/phone-numbers/active
   ```

2. **Implement softphone integration** - This is the most complex part
3. **Implement call logs tabs** - This is simpler and provides immediate value

Would you like me to:
- A) Proceed with implementing the softphone integration (complex, 4243 line file)
- B) Implement the call logs tabs first (simpler, immediate value)
- C) Create a separate, smaller softphone component for phone number selection

**Recommendation:** Start with **B** (Call Logs) to see immediate results, then tackle **A** (Softphone).
