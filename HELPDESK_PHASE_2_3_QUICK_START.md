# Helpdesk Phase 2 & 3 - Quick Start

## 🎉 New Features Available

Phase 2 & 3 adds **5 new powerful pages** to manage your helpdesk:

### New Pages
1. **Canned Responses** → `/helpdesk/canned-responses`
2. **SLA Policies** → `/helpdesk/sla-policies`
3. **Team Management** → `/helpdesk/teams`
4. **Knowledge Base Portal** → `/kb` (public)
5. **Customer Portal** → `/portal/tickets` (public)

---

## ✅ Backend Setup (Required)

### Add Routes to Backend Router

File: `backend/router.php` (or your main router file)

```php
use App\Controllers\SLAPoliciesController;
use App\Controllers\TicketTeamsController;

// SLA Policies
$router->get('/api/helpdesk/sla-policies', [SLAPoliciesController::class, 'list']);
$router->post('/api/helpdesk/sla-policies', [SLAPoliciesController::class, 'create']);
$router->put('/api/helpdesk/sla-policies/:id', [SLAPoliciesController::class, 'update']);
$router->delete('/api/helpdesk/sla-policies/:id', [SLAPoliciesController::class, 'delete']);

// Teams
$router->get('/api/helpdesk/teams', [TicketTeamsController::class, 'list']);
$router->post('/api/helpdesk/teams', [TicketTeamsController::class, 'create']);
$router->put('/api/helpdesk/teams/:id', [TicketTeamsController::class, 'update']);
$router->delete('/api/helpdesk/teams/:id', [TicketTeamsController::class, 'delete']);
$router->get('/api/helpdesk/teams/:id/members', [TicketTeamsController::class, 'listMembers']);
$router->post('/api/helpdesk/teams/:id/members', [TicketTeamsController::class, 'addMember']);
$router->delete('/api/helpdesk/teams/:id/members/:memberId', [TicketTeamsController::class, 'removeMember']);
```

**That's it!** All database tables were created in Phase 1.

---

## 🚀 5-Minute Setup

### 1. Create an SLA Policy (2 min)

1. Navigate to `/helpdesk/sla-policies`
2. Click **"New SLA Policy"**
3. Name: "Standard Support"
4. Set response/resolution times:
   - **Urgent**: 15 min / 4 hours
   - **High**: 1 hour / 8 hours
   - **Normal**: 4 hours / 24 hours
   - **Low**: 8 hours / 48 hours
5. Enable "Business Hours" → 9:00 AM to 5:00 PM
6. Business Days: `1,2,3,4,5` (Mon-Fri)
7. Click **"Save"**

### 2. Create a Support Team (1 min)

1. Navigate to `/helpdesk/teams`
2. Click **"New Team"**
3. Name: "Technical Support"
4. Description: "Handles technical issues"
5. Enable "Auto-assignment"
6. Strategy: **"Round Robin"**
7. Click **"Save"**

### 3. Add Canned Responses (2 min)

1. Navigate to `/helpdesk/canned-responses`
2. Create these quick replies:

**Thank You**
- Name: "Thank You"
- Shortcut: `/thanks`
- Message: "Thank you for contacting us! We'll get back to you shortly."
- Category: General
- Share with team: ✓

**Billing Issue**
- Name: "Escalate to Billing"
- Shortcut: `/billing`
- Message: "I've escalated this to our billing team. They'll reach out within 24 hours."
- Category: Billing
- Share with team: ✓

**Closing Ticket**
- Name: "Issue Resolved"
- Shortcut: `/close`
- Message: "This issue is now resolved. Please let us know if you need anything else!"
- Category: Closing
- Share with team: ✓

---

## 📱 Using the Features

### Canned Responses

**To use a canned response:**
1. Open any ticket
2. In the reply box, type `/thanks`
3. The response auto-fills!
4. Edit if needed and send

**Shortcuts work anywhere:**
- Ticket replies
- Internal notes
- Customer portal responses

### SLA Policies

**Automatic SLA Tracking:**
- When you create the SLA policy, it applies to all new tickets
- Tickets show "Due in X hours" badges
- Breached tickets show red warning icons
- Response time = Time to first agent reply
- Resolution time = Time to ticket closure

### Team Auto-Assignment

**How it works:**
1. Customer creates ticket
2. System checks if ticket matches team criteria
3. Auto-assigns based on strategy:
   - **Round Robin**: Agent A → B → C → A
   - **Load Balanced**: Agent with fewest open tickets
   - **Random**: Random selection

**To assign tickets to a team:**
1. Edit a ticket
2. Select team from dropdown
3. If auto-assign is enabled, agent auto-selected

---

## 🌐 Public Portals

### Knowledge Base (`/kb`)

**For customers to find answers:**
- Beautiful landing page with categories
- Search functionality
- Article view tracking
- Helpful/not helpful voting
- Mobile-responsive

**Share this URL with customers:**
```
https://your-domain.com/kb
```

### Customer Portal (`/portal/tickets`)

**For customers to track tickets:**
- View all their tickets
- Create new tickets
- Reply to existing tickets
- See ticket status & priority

**Share this URL with customers:**
```
https://your-domain.com/portal/tickets
```

---

## 🎯 Quick Actions

### Daily Agent Tasks

**Using Canned Responses:**
1. Click on ticket
2. Type `/` to see all shortcuts
3. Select or type shortcut
4. Send

**Checking SLA Status:**
- Tickets list shows SLA due dates
- Red icon = breached
- Yellow icon = approaching
- Green = within SLA

**Team Collaboration:**
- Share canned responses with team
- View team member assignments
- See team performance metrics

### Customer Self-Service

**Knowledge Base:**
1. Customer visits `/kb`
2. Searches "how to reset password"
3. Finds article, reads solution
4. Votes "helpful"
5. No ticket needed! ✓

**Customer Portal:**
1. Customer visits `/portal/tickets`
2. Clicks "New Ticket"
3. Fills subject, description, priority
4. Submits
5. Can track and reply anytime

---

## 🔧 Advanced Configuration

### Custom SLA Priorities

Edit times in minutes:
- 60 minutes = 1 hour
- 240 minutes = 4 hours
- 1440 minutes = 24 hours
- 2880 minutes = 48 hours

### Team Assignment Rules

**Round Robin** (Recommended):
- Fair distribution
- Prevents overload
- Easy to understand

**Load Balanced** (For uneven workloads):
- Assigns to least busy agent
- Self-balancing
- Great for varied ticket complexity

**Random** (Simple):
- No logic
- Quick setup
- Unpredictable distribution

### Canned Response Variables

Use these in any response:
- `{{firstName}}` - Contact first name
- `{{lastName}}` - Contact last name
- `{{company}}` - Company name
- `{{email}}` - Contact email
- `{{phone}}` - Contact phone

---

## ✅ Testing Checklist

Before going live:

**SLA Policies**
- [ ] Create at least 1 active policy
- [ ] Verify times display correctly
- [ ] Check business hours settings

**Teams**
- [ ] Create at least 1 team
- [ ] Add 2+ members (if available)
- [ ] Enable auto-assignment
- [ ] Test assignment strategy

**Canned Responses**
- [ ] Create 5+ common responses
- [ ] Test shortcuts work in ticket replies
- [ ] Share responses with team
- [ ] Test variable substitution

**Knowledge Base**
- [ ] Publish 10+ articles
- [ ] Test search functionality
- [ ] Verify category browsing
- [ ] Check mobile view

**Customer Portal**
- [ ] Create test ticket
- [ ] Reply to ticket
- [ ] View ticket list
- [ ] Test priority selection

---

## 📊 Metrics to Track

### Week 1
- Number of canned responses used
- % of tickets meeting SLA
- Team auto-assignment rate
- KB article views

### Month 1
- Average response time improvement
- % of tickets self-served via KB
- Customer satisfaction (CSAT)
- Agent productivity increase

---

## 🐛 Common Issues

**"Canned responses not loading"**
- Check backend endpoint: `/api/canned-responses`
- Verify controller registered in router
- Check browser console for errors

**"SLA times not calculating"**
- Verify SLA policy is active
- Check ticket has priority set
- Ensure workspace_id matches

**"Auto-assignment not working"**
- Verify team has "auto_assign_enabled" = true
- Check team has active members
- Confirm strategy is set

**"Knowledge base shows no articles"**
- Articles must be published (`is_published = 1`)
- Check category associations
- Verify workspace_id

---

## 🎓 Training Resources

### Create These KB Articles

1. "How to Use Canned Responses" (for agents)
2. "Understanding SLA Policies" (for agents)
3. "Team Auto-Assignment Guide" (for admins)
4. "How to Submit a Support Ticket" (for customers)
5. "Using the Knowledge Base" (for customers)

---

## 📈 What's Next?

### Phase 3 Advanced Features (Available Soon)

1. **Advanced Reporting Dashboard**
   - Charts & graphs
   - Export capabilities
   - Custom date ranges

2. **Bulk Actions**
   - Multi-select tickets
   - Bulk assign/close/tag

3. **Saved Filters**
   - Custom views
   - Quick access

4. **CSAT Automation**
   - Auto-send surveys
   - Track satisfaction

5. **Ticket Merge/Split**
   - Combine duplicates
   - Split complex issues

---

## 📞 Support

**Documentation:**
- Full details: `HELPDESK_PHASE_2_3_REPORT.md`
- Phase 1 docs: `HELPDESK_IMPLEMENTATION.md`

**Files:**
- Frontend: `src/pages/Canned*.tsx`, `src/pages/SLA*.tsx`
- Backend: `backend/src/controllers/SLAPoliciesController.php`
- API: `src/services/ticketsApi.ts`

---

## 🎉 You're Ready!

Your helpdesk now has professional-grade features:
✅ Quick reply templates  
✅ SLA tracking  
✅ Team management  
✅ Self-service KB  
✅ Customer portal  

Start using them today! 🚀
