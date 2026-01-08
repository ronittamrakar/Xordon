# Phone Numbers Integration with Softphone & Call Logs

## Overview
Integrate purchased phone numbers with the Enhanced Softphone (Xoftphone) and Call Logs/History, ensuring proper separation of inbound and outbound calls while maintaining connectivity.

## Architecture

### 1. Phone Numbers as Caller IDs
**Current State:**
- Phone numbers stored in `phone_numbers` table
- Managed via PhoneNumbersList page
- Connected to SignalWire/Twilio

**Integration Needed:**
- ✅ Fetch phone numbers from `/api/phone-numbers`
- ✅ Display in softphone as available caller IDs
- ✅ Allow selection of outbound caller ID
- ✅ Route inbound calls to correct phone number

### 2. Softphone Integration

**Components to Update:**
1. **EnhancedSoftphone.tsx**
   - Add phone number fetching from API
   - Display phone numbers in caller ID dropdown
   - Use selected number for outbound calls
   - Handle inbound calls to specific numbers

2. **Call Session Management**
   - Track which phone number was used
   - Store phone_number_id in call logs
   - Separate inbound/outbound call flows

### 3. Call Logs Integration

**Database Schema:**
```sql
call_logs table:
- id
- phone_number_id (FK to phone_numbers)
- from_number
- to_number
- direction ('inbound' | 'outbound')
- status
- duration_seconds
- started_at
- ended_at
- recording_url
- metadata (JSON)
```

**Features:**
- ✅ Log all calls (inbound + outbound)
- ✅ Filter by direction
- ✅ Filter by phone number
- ✅ Click-to-call from history
- ✅ View call recordings
- ✅ Export call data

### 4. Inbound/Outbound Separation

**Inbound Calls:**
- Received on purchased phone numbers
- Routed via SignalWire webhooks
- Display caller ID
- Show which number was called
- Option to route to call flows/IVR

**Outbound Calls:**
- Select caller ID from purchased numbers
- Dial from softphone
- Track in call logs
- Associate with campaigns (optional)

## Implementation Steps

### Phase 1: Phone Number Integration in Softphone
1. ✅ Add API endpoint to fetch user's phone numbers
2. ✅ Update EnhancedSoftphone to fetch and display numbers
3. ✅ Add caller ID selector in softphone UI
4. ✅ Pass selected number to call initiation

### Phase 2: Call Logging Enhancement
1. ✅ Update call log creation to include phone_number_id
2. ✅ Add direction field to all call logs
3. ✅ Create separate views for inbound/outbound
4. ✅ Add filtering by phone number

### Phase 3: Inbound Call Handling
1. ✅ Configure SignalWire webhooks for purchased numbers
2. ✅ Create webhook handler for inbound calls
3. ✅ Route to softphone with caller info
4. ✅ Log inbound calls automatically

### Phase 4: UI Enhancements
1. ✅ Add tabs for Inbound/Outbound in Call Logs
2. ✅ Show phone number info in call history
3. ✅ Add click-to-call from logs
4. ✅ Display call recordings

## API Endpoints Needed

### Existing:
- `GET /api/phone-numbers` - List user's phone numbers
- `GET /api/phone-numbers/{id}` - Get specific number
- `GET /api/call-logs` - Get call history

### New:
- `POST /api/phone/voice/{numberId}` - Inbound voice webhook
- `POST /api/phone/sms/{numberId}` - Inbound SMS webhook
- `POST /api/phone/status/{numberId}` - Call status webhook
- `POST /api/calls/initiate` - Start outbound call
- `POST /api/calls/{id}/log` - Log call details

## UI Components

### 1. Softphone Caller ID Selector
```tsx
<Select value={selectedCallerId} onValueChange={setSelectedCallerId}>
  <SelectTrigger>
    <SelectValue placeholder="Select Caller ID" />
  </SelectTrigger>
  <SelectContent>
    {phoneNumbers.map(num => (
      <SelectItem key={num.id} value={num.id}>
        {num.friendly_name} ({num.phone_number})
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### 2. Call Logs with Tabs
```tsx
<Tabs defaultValue="all">
  <TabsList>
    <TabsTrigger value="all">All Calls</TabsTrigger>
    <TabsTrigger value="inbound">Inbound</TabsTrigger>
    <TabsTrigger value="outbound">Outbound</TabsTrigger>
  </TabsList>
  <TabsContent value="all">{/* All calls */}</TabsContent>
  <TabsContent value="inbound">{/* Inbound only */}</TabsContent>
  <TabsContent value="outbound">{/* Outbound only */}</TabsContent>
</Tabs>
```

### 3. Call Log Entry
```tsx
<TableRow>
  <TableCell>{call.direction === 'inbound' ? '📞 In' : '📱 Out'}</TableCell>
  <TableCell>{call.from_number}</TableCell>
  <TableCell>{call.to_number}</TableCell>
  <TableCell>{call.phone_number.friendly_name}</TableCell>
  <TableCell>{formatDuration(call.duration_seconds)}</TableCell>
  <TableCell>{getStatusBadge(call.status)}</TableCell>
  <TableCell>
    <Button onClick={() => callBack(call)}>Call Back</Button>
  </TableCell>
</TableRow>
```

## Data Flow

### Outbound Call:
1. User selects caller ID in softphone
2. User dials number
3. Softphone initiates call via SignalWire with selected caller ID
4. Call connects
5. Call details logged to database with phone_number_id
6. Call appears in "Outbound" tab

### Inbound Call:
1. Call received on purchased number
2. SignalWire webhook triggers
3. Backend creates call log entry
4. WebSocket/polling notifies softphone
5. Softphone rings with caller info
6. User answers/rejects
7. Call details updated in database
8. Call appears in "Inbound" tab

## Testing Checklist

- [ ] Phone numbers appear in softphone
- [ ] Can select different caller IDs
- [ ] Outbound calls use selected caller ID
- [ ] Outbound calls logged correctly
- [ ] Inbound calls trigger softphone
- [ ] Inbound calls logged correctly
- [ ] Can filter by direction
- [ ] Can filter by phone number
- [ ] Click-to-call works from history
- [ ] Call recordings accessible
- [ ] Webhooks configured correctly

## Next Steps

1. Implement phone number fetching in softphone
2. Add caller ID selector UI
3. Update call initiation to use selected number
4. Enhance call logging with phone_number_id
5. Add inbound/outbound tabs to call logs
6. Configure webhooks for inbound calls
7. Test end-to-end flow

---

**Goal:** Seamless integration where purchased phone numbers work as both inbound receivers and outbound caller IDs, with complete call history tracking.
