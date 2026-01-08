# Helpdesk Module - Quick Start Guide

## Installation (5 Minutes)

### Step 1: Run Database Migrations

```powershell
# From the Xordon root directory
cd backend

# Run vendor widget settings migration
php scripts/run_migration.php migrations/add_vendor_widget_settings.sql

# Run helpdesk module migration (creates all tables + seed data)
php scripts/run_migration.php migrations/add_helpdesk_module.sql
```

**Expected Output:**
- 15+ tables created
- 5 ticket stages added
- 5 ticket types added
- 1 support team created
- 1 SLA policy created
- 4 canned responses added
- 3 KB categories added

### Step 2: Verify Installation

Navigate to: `http://localhost:5173/helpdesk/tickets`

You should see:
- Ticket list page with "New Ticket" button
- Stats dashboard (0 open, 0 assigned, etc.)
- Filters (status, priority, assignment)

### Step 3: Create Your First Ticket

1. Click "New Ticket" button
2. Fill in:
   - **Title:** "Test support ticket"
   - **Description:** "Testing the helpdesk module"
   - **Requester Email:** customer@example.com
   - **Priority:** Medium
   - **Type:** Question
3. Click "Create Ticket"
4. You'll be redirected to ticket detail page (T000001)

### Step 4: Reply to Ticket

1. On ticket detail page, type a reply
2. Choose "Reply" (customer-facing) or "Private Note" (internal only)
3. Click "Send"
4. Message appears in conversation thread

### Step 5: Update Ticket Status

1. In the right sidebar, change "Status" to "Resolved"
2. Ticket auto-updates
3. Activity log shows status change

---

## Using Vendor Widgets (Optional)

### For Intercom

1. Go to `/helpdesk/settings`
2. Enable "Vendor Widget"
3. Select "Intercom"
4. Enter your Intercom App ID (find in Intercom → Settings → Installation)
5. Click "Save Settings"
6. Widget will appear on public pages

### For Zendesk

1. Go to `/helpdesk/settings`
2. Enable "Vendor Widget"
3. Select "Zendesk"
4. Enter your Zendesk Widget Key
5. Click "Save Settings"
6. Widget will appear on public pages

---

## Typical Workflows

### Agent Workflow

1. **Morning:** Check `/helpdesk/tickets?assigned_to=me`
2. **Triage New:** Filter by status=new, assign to yourself or team
3. **Reply:** Click ticket → type reply → send
4. **Use Macros:** Type `/thanks` or `/working` for canned responses
5. **Close:** Change status to "Resolved" when done
6. **Follow-up:** CSAT survey auto-sends (future feature)

### Manager Workflow

1. **Dashboard:** Check stats at top of ticket list
2. **SLA Monitoring:** Look for red "SLA Breach" badges
3. **Team Workload:** Filter by team_id to see distribution
4. **Unassigned Queue:** Filter by assigned_to=unassigned
5. **Weekly Review:** Check avg resolution time and CSAT score

### Customer Workflow (Future: Customer Portal)

1. Customer submits form/email → auto-creates ticket
2. Receives ticket number (T000001) via email
3. Can reply via email → adds message to ticket
4. Receives updates when agent replies
5. Gets CSAT survey when ticket closed

---

## Advanced Tips

### Using Canned Responses

Create shortcuts for common replies:
- `/thanks` → "Thank you for contacting us..."
- `/working` → "We are currently working on your request..."
- `/resolved` → "Your issue has been resolved..."
- `/info` → "To better assist you, could you provide..."

### SLA Best Practices

Default SLA policy (in minutes):
- **Low:** 8 hours response, 2 days resolution
- **Medium:** 4 hours response, 1 day resolution
- **High:** 1 hour response, 8 hours resolution
- **Urgent:** 15 minutes response, 2 hours resolution

Customize via API:
```javascript
PUT /api/sla-policies/1
{
  "priority_urgent_response_time": 10, // 10 minutes
  "priority_urgent_resolution_time": 60 // 1 hour
}
```

### Multi-Channel Support

Tickets can come from:
- **Email:** Set up email-to-ticket forwarding (future)
- **Webchat:** Built-in webchat widget
- **Phone:** Manual ticket creation from call logs
- **SMS:** Integration with SMS replies
- **Form:** Public lead/support forms
- **API:** Direct ticket creation via API
- **Manual:** Agent creates on behalf of customer

### Knowledge Base

Build self-service:
1. Create categories: Getting Started, FAQs, Troubleshooting
2. Write articles with step-by-step guides
3. Publish articles (toggle is_published=true)
4. Customers can search KB before opening tickets
5. Track article views and helpfulness ratings

---

## Keyboard Shortcuts (Future Enhancement)

Planned shortcuts:
- `c` - Create new ticket
- `r` - Reply to ticket
- `p` - Add private note
- `s` - Change status
- `a` - Assign to me
- `/` - Trigger canned response picker
- `Cmd+Enter` - Send message

---

## Troubleshooting

### Tickets Not Showing
- Check migrations ran: `SHOW TABLES LIKE 'tickets';`
- Verify workspace_id matches logged-in user
- Check browser console for API errors

### Can't Create Tickets
- Ensure ticket_stages table has data
- Check sla_policies has at least one active policy
- Verify user has authentication token

### Vendor Widget Not Appearing
- Go to `/helpdesk/settings`
- Confirm "Enable Vendor Widget" is ON
- Check App ID is correct (no spaces)
- Open browser console, look for widget script loading

### SLA Dates Not Calculating
- Ensure sla_policies table has data
- Check priority field matches column naming (priority_medium_response_time)
- Verify server time is correct

---

## Next Steps

### For Administrators
- [ ] Customize ticket types and stages
- [ ] Set up SLA policies for your teams
- [ ] Create team-specific canned responses
- [ ] Build knowledge base articles
- [ ] Configure email-to-ticket automation

### For Developers
- [ ] Add custom ticket fields
- [ ] Integrate with CRM (contacts → tickets)
- [ ] Build customer portal
- [ ] Implement Zendesk/Intercom sync
- [ ] Add advanced reporting dashboards

### For Product Managers
- [ ] Define SLA targets per product tier
- [ ] Create agent training documentation
- [ ] Set up ticket routing rules
- [ ] Design customer satisfaction workflows
- [ ] Plan integration roadmap

---

## API Examples

### Create Ticket via API

```javascript
POST /api/tickets
{
  "title": "Cannot login to account",
  "description": "Getting error 'Invalid credentials'",
  "priority": "high",
  "requester_email": "customer@example.com",
  "requester_name": "John Doe",
  "ticket_type_id": 1,
  "source_channel": "email",
  "initial_message": "Hi John, we're looking into this for you."
}

Response:
{
  "id": 123,
  "ticket_number": "T000123"
}
```

### Add Message

```javascript
POST /api/tickets/123/messages
{
  "body": "We've reset your password. Please try logging in again.",
  "direction": "outbound",
  "message_type": "comment",
  "is_private": false
}

Response:
{
  "id": 456
}
```

### Get Ticket Stats

```javascript
GET /api/tickets/stats

Response:
{
  "total": 1250,
  "open": 45,
  "unassigned": 12,
  "assigned_to_me": 8,
  "sla_breached": 3,
  "avg_resolution_hours": 18.5,
  "avg_csat": 4.2
}
```

---

## Support

- **Documentation:** See `HELPDESK_IMPLEMENTATION.md` for full technical details
- **API Reference:** All endpoints documented in implementation summary
- **Community:** (Add your support channel here)
- **Email:** support@xordon.com

---

**You're ready to go!** Start managing support tickets like a pro. 🎉
