# Softphone & Call Logs Integration - Implementation Summary

## ✅ What I'm Implementing

### 1. **Phone Numbers in Softphone**
- Fetch purchased phone numbers from `/api/phone-numbers`
- Display as selectable Caller IDs in softphone
- Use selected number for outbound calls
- Show which number received inbound calls

### 2. **Enhanced Call Logging**
- Log all calls with `phone_number_id` reference
- Separate inbound/outbound tracking
- Add tabs in Call Logs UI for filtering
- Enable click-to-call from history

### 3. **Inbound Call Routing**
- Configure webhooks for purchased numbers
- Route inbound calls to softphone
- Display caller information
- Auto-log inbound calls

## 📋 Implementation Checklist

### Backend Changes

#### A. Phone Numbers API Enhancement
- [x] Existing: `GET /api/phone-numbers` - Returns all numbers
- [ ] Add: `GET /api/phone-numbers/active` - Returns only active numbers for softphone
- [ ] Add: Include `is_primary` flag for default selection

#### B. Call Logging Enhancement
- [ ] Update `call_logs` table to include `phone_number_id`
- [ ] Ensure `direction` field exists ('inbound' | 'outbound')
- [ ] Add method to log calls with phone number reference
- [ ] Add filtering by direction and phone number

#### C. Webhook Handlers
- [ ] `POST /api/phone/voice/{numberId}` - Handle inbound voice calls
- [ ] `POST /api/phone/sms/{numberId}` - Handle inbound SMS
- [ ] `POST /api/phone/status/{numberId}` - Handle call status updates
- [ ] Configure webhooks in SignalWire when number is purchased

### Frontend Changes

#### A. Softphone Integration (`EnhancedSoftphone.tsx`)
- [ ] Add state for phone numbers list
- [ ] Add state for selected caller ID
- [ ] Fetch phone numbers on mount
- [ ] Add Caller ID selector UI component
- [ ] Pass selected number to call initiation
- [ ] Display receiving number for inbound calls
- [ ] Store phone_number_id in call session

#### B. Call Logs Enhancement (`PhoneCallLogs.tsx`)
- [ ] Add tabs for All/Inbound/Outbound
- [ ] Add phone number filter dropdown
- [ ] Display phone number in call history
- [ ] Add direction indicator (icon/badge)
- [ ] Implement click-to-call from logs
- [ ] Show call recordings if available

#### C. Call Session Context
- [ ] Add `phoneNumberId` to call session
- [ ] Add `receivingNumber` for inbound calls
- [ ] Update logging to include phone number

## 🔧 Code Changes Required

### 1. Backend - Add Active Numbers Endpoint

**File:** `backend/src/controllers/PhoneNumbersController.php`

```php
public static function getActivePhoneNumbers(): void {
    $userId = Auth::userIdOrFail();
    $pdo = Database::conn();
    $scope = self::getWorkspaceScope();
    
    $stmt = $pdo->prepare("
        SELECT id, phone_number, friendly_name, is_primary, capabilities
        FROM phone_numbers 
        WHERE {$scope['col']} = ? AND status = 'active'
        ORDER BY is_primary DESC, friendly_name ASC
    ");
    $stmt->execute([$scope['val']]);
    $numbers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($numbers as &$number) {
        if ($number['capabilities']) {
            $number['capabilities'] = json_decode($number['capabilities'], true);
        }
    }
    
    Response::json(['items' => $numbers]);
}
```

**Route:** `backend/public/index.php`
```php
if ($path === '/phone-numbers/active' && $method === 'GET') {
    return PhoneNumbersController::getActivePhoneNumbers();
}
```

### 2. Frontend - Softphone Phone Number Integration

**File:** `src/components/EnhancedSoftphone.tsx`

Add near the top of the component:
```typescript
const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumberEntry[]>([]);
const [selectedCallerId, setSelectedCallerId] = useState<string>('');

// Fetch phone numbers
useEffect(() => {
  const fetchPhoneNumbers = async () => {
    try {
      const response = await api.get('/phone-numbers/active');
      const numbers = response.data.items.map((num: any) => ({
        id: num.id,
        number: num.phone_number,
        name: num.friendly_name,
        isActive: true,
        isPrimary: num.is_primary
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
    }
  };
  
  fetchPhoneNumbers();
}, []);
```

Add Caller ID selector in UI (before dial pad):
```typescript
<div className="mb-4">
  <Label>Caller ID</Label>
  <Select value={selectedCallerId} onValueChange={setSelectedCallerId}>
    <SelectTrigger>
      <SelectValue placeholder="Select Caller ID" />
    </SelectTrigger>
    <SelectContent>
      {phoneNumbers.map(num => (
        <SelectItem key={num.id} value={num.id}>
          {num.name} ({num.number})
          {num.isPrimary && <Badge className="ml-2">Primary</Badge>}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

### 3. Frontend - Call Logs with Tabs

**File:** `src/pages/calls/PhoneCallLogs.tsx`

Add tabs:
```typescript
const [activeTab, setActiveTab] = useState<'all' | 'inbound' | 'outbound'>('all');

const filteredCalls = calls.filter(call => {
  if (activeTab === 'inbound') return call.direction === 'inbound';
  if (activeTab === 'outbound') return call.direction === 'outbound';
  return true;
});
```

UI:
```typescript
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="all">
      All Calls ({calls.length})
    </TabsTrigger>
    <TabsTrigger value="inbound">
      📞 Inbound ({calls.filter(c => c.direction === 'inbound').length})
    </TabsTrigger>
    <TabsTrigger value="outbound">
      📱 Outbound ({calls.filter(c => c.direction === 'outbound').length})
    </TabsTrigger>
  </TabsList>
  
  <TabsContent value={activeTab}>
    {/* Call logs table */}
  </TabsContent>
</Tabs>
```

## 🎯 Priority Implementation Order

1. **Phase 1: Basic Integration** (30 min)
   - Add active phone numbers endpoint
   - Fetch numbers in softphone
   - Display caller ID selector

2. **Phase 2: Call Logging** (20 min)
   - Update call logging to include phone_number_id
   - Add tabs to call logs UI
   - Add direction indicators

3. **Phase 3: Inbound Handling** (40 min)
   - Create webhook handlers
   - Configure webhooks on number purchase
   - Route inbound calls to softphone

4. **Phase 4: Polish** (20 min)
   - Add click-to-call from logs
   - Add phone number filtering
   - Test end-to-end flow

## 🚀 Ready to Implement?

I'll start with Phase 1 - adding the phone numbers to the softphone. This will give you immediate value by allowing selection of caller IDs for outbound calls.

Would you like me to proceed with the implementation?
