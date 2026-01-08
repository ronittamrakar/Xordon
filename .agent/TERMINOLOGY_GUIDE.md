# Terminology Guide

## Business Terminology vs Technical Implementation

This document clarifies the important distinction between business terminology and technical implementation in the application.

---

## Core Concepts

### 1. **Contacts vs Clients**

#### **Contacts** (Prospects)
- **Definition**: People who have NOT paid yet
- **Status**: Prospects, leads, potential customers
- **Database Table**: `contacts`
- **Purpose**: Lead management, prospecting, nurturing
- **Conversion**: Contacts convert into Clients when they make a payment

**Key Characteristics:**
- May have never interacted with your business
- In the sales pipeline
- Not yet monetized
- Can be in various stages (lead, prospect, qualified, etc.)

#### **Clients** (Paying Customers)
- **Definition**: People who have paid or are currently paying
- **Status**: Active customers, paying subscribers
- **Technical Implementation**: SubAccounts (in multi-tenant architecture)
- **Purpose**: Customer management, service delivery, retention
- **Revenue**: Generate actual revenue for the business

**Key Characteristics:**
- Have made at least one payment
- Active business relationship
- Require ongoing service/support
- Generate revenue

---

### 2. **Multi-Tenant Architecture**

#### **Agencies** (Workspaces)
- **Business Term**: Agency, Company, Organization
- **Technical Term**: Workspace
- **Database Table**: `workspaces` / `agencies`
- **Purpose**: Top-level organizational unit
- **Relationship**: One Agency can have multiple Clients (SubAccounts)

**Example:**
- "Digital Marketing Pro" (Agency) manages multiple client businesses

#### **Clients** (SubAccounts)
- **Business Term**: Client, Customer Business
- **Technical Term**: SubAccount
- **Database Table**: `subaccounts`
- **Purpose**: Individual client businesses managed by an agency
- **Relationship**: Each SubAccount belongs to one Agency

**Example:**
- "Joe's Pizza Shop" (Client/SubAccount) is managed by "Digital Marketing Pro" (Agency/Workspace)

---

## Data Flow & Conversion

### Contact → Client Conversion

```
┌─────────────┐         Payment Event         ┌─────────────┐
│   Contact   │  ────────────────────────────▶ │   Client    │
│ (Prospect)  │                                │  (Paying)   │
└─────────────┘                                └─────────────┘
     │                                               │
     │                                               │
     ▼                                               ▼
contacts table                              subaccounts table
```

**Trigger Events for Conversion:**
1. First payment received
2. Subscription activated
3. Contract signed and paid
4. Service agreement executed

---

## Database Schema Overview

### Contacts Table
```sql
CREATE TABLE contacts (
    id INT PRIMARY KEY,
    workspace_id INT,
    email VARCHAR(255),
    phone VARCHAR(50),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company VARCHAR(255),
    status VARCHAR(50),  -- lead, prospect, qualified, etc.
    stage VARCHAR(50),   -- pipeline stage
    created_at TIMESTAMP,
    -- ... other prospect fields
);
```

### SubAccounts Table (Clients)
```sql
CREATE TABLE subaccounts (
    id INT PRIMARY KEY,
    agency_id INT,  -- References agencies/workspaces
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    industry VARCHAR(100),
    status VARCHAR(50),  -- active, inactive, suspended
    created_at TIMESTAMP,
    -- ... other client business fields
);
```

---

## Frontend Implementation

### Contact Management
- **Page**: `/contacts`
- **Component**: `src/pages/Contacts.tsx`
- **Type**: `src/types/contact.ts`
- **API**: `src/lib/api.ts` (contact endpoints)

**Features:**
- Lead capture
- Pipeline management
- Contact stages
- Nurturing campaigns
- Conversion tracking

### Client Management (SubAccounts)
- **Page**: `/clients` or `/subaccounts`
- **Component**: `src/pages/SubAccounts.tsx`
- **Type**: `src/types/multiTenant.ts`
- **API**: `src/services/multiTenantApi.ts`

**Features:**
- Client onboarding
- Service delivery
- Account management
- Billing & payments
- Team collaboration

---

## Backend Implementation

### Contact Endpoints
```
GET    /api/contacts              - List all contacts (prospects)
POST   /api/contacts              - Create new contact
GET    /api/contacts/:id          - Get contact details
PUT    /api/contacts/:id          - Update contact
DELETE /api/contacts/:id          - Delete contact
POST   /api/contacts/:id/convert  - Convert to client
```

### Client/SubAccount Endpoints
```
GET    /api/subaccounts           - List all clients
POST   /api/subaccounts           - Create new client
GET    /api/subaccounts/:id       - Get client details
PUT    /api/subaccounts/:id       - Update client
DELETE /api/subaccounts/:id       - Delete client
POST   /api/subaccounts/:id/switch - Switch context to client
```

---

## Key Differences Summary

| Aspect | Contacts (Prospects) | Clients (Paying) |
|--------|---------------------|------------------|
| **Payment Status** | Not paid | Paid or paying |
| **Database** | `contacts` table | `subaccounts` table |
| **Purpose** | Lead generation | Service delivery |
| **Revenue** | $0 (potential) | $X (actual) |
| **Management** | Sales/Marketing | Account Management |
| **Conversion** | Can convert to Client | Already converted |
| **Features** | Nurturing, scoring | Billing, support |
| **Relationship** | One-to-many with workspace | One-to-many with agency |

---

## Best Practices

### When to Use "Contact"
- Lead capture forms
- Marketing campaigns
- Sales pipelines
- Prospecting activities
- Cold outreach
- Nurture sequences

### When to Use "Client"
- After first payment
- Service delivery
- Account management
- Billing operations
- Support tickets
- Client portals

### Conversion Logic
```typescript
// Example conversion flow
async function convertContactToClient(contactId: string) {
  // 1. Verify payment received
  const payment = await verifyPayment(contactId);
  
  if (payment.status === 'completed') {
    // 2. Create SubAccount from Contact data
    const contact = await api.getContact(contactId);
    const client = await multiTenantApi.createSubaccount({
      name: contact.company || `${contact.firstName} ${contact.lastName}`,
      email: contact.email,
      phone: contact.phone,
      industry: contact.industry,
      // ... map other fields
    });
    
    // 3. Update contact status
    await api.updateContact(contactId, {
      stage: 'client',
      status: 'converted',
      client_id: client.id
    });
    
    // 4. Trigger onboarding workflow
    await triggerClientOnboarding(client.id);
  }
}
```

---

## UI/UX Considerations

### Navigation
- **Contacts** should be under "Sales" or "Marketing" section
- **Clients** should be under "Accounts" or "Management" section

### Terminology in UI
- Use "Contacts" for prospects
- Use "Clients" for paying customers
- Be consistent across all pages and components
- Consider user role (sales vs account manager)

### Status Indicators
**Contacts:**
- Lead
- Prospect
- Qualified
- Negotiation
- Converted

**Clients:**
- Active
- Inactive
- Suspended
- Churned

---

## Common Pitfalls to Avoid

❌ **Don't:**
- Use "Client" for prospects who haven't paid
- Mix contact and client data in the same table without clear distinction
- Assume all contacts will become clients
- Treat SubAccounts as simple contacts

✅ **Do:**
- Maintain clear separation between contacts and clients
- Use proper conversion workflows
- Track conversion metrics
- Implement proper access controls for each entity type
- Use appropriate terminology in UI based on payment status

---

## Related Documentation

- Multi-Tenant Architecture: See `src/types/multiTenant.ts`
- Contact Types: See `src/types/contact.ts`
- API Documentation: See backend controllers
- Conversion Workflows: See automation workflows

---

**Last Updated**: 2026-01-04
**Version**: 1.0
