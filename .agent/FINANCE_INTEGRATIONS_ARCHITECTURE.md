# Finance Integrations - System Architecture

## Component Hierarchy

```
FinanceIntegrations (Main Component)
│
├── State Management
│   ├── React Query Queries
│   │   ├── integrationsList (auto-refresh every 30s)
│   │   ├── qbConnection (QuickBooks status)
│   │   ├── stripeAccount (Stripe status)
│   │   └── paypalStatus (PayPal status)
│   │
│   ├── React Query Mutations
│   │   ├── disconnectMutation
│   │   ├── testConnectionMutation
│   │   ├── syncMutation
│   │   ├── updateQbSettingsMutation
│   │   ├── connectStripeMutation
│   │   └── connectPayPalMutation
│   │
│   └── Local State
│       ├── selectedIntegration
│       ├── showSettingsModal
│       ├── showConnectModal
│       ├── qbSettings
│       ├── stripeSettings
│       └── paypalSettings
│
├── UI Components
│   ├── Header
│   │   ├── Title
│   │   ├── Description
│   │   └── Finance Settings Button
│   │
│   ├── Integration Categories (4 groups)
│   │   ├── Accounting Software
│   │   │   ├── QuickBooks Card
│   │   │   ├── FreshBooks Card
│   │   │   └── Xero Card
│   │   │
│   │   ├── Payment Processors
│   │   │   ├── Stripe Card
│   │   │   ├── PayPal Card
│   │   │   └── Square Card
│   │   │
│   │   ├── Analytics & Reporting
│   │   │   └── Financial Analytics Card
│   │   │
│   │   └── Automation & Workflows
│   │       └── Zapier Card
│   │
│   ├── Modals
│   │   ├── Settings Modal
│   │   │   ├── QuickBooks Settings
│   │   │   ├── Stripe Settings
│   │   │   └── PayPal Settings
│   │   │
│   │   └── Connection Modal
│   │       └── PayPal Connection Form
│   │
│   └── Help Section
│       └── Info Card
│
└── API Services
    ├── integrationsApi
    ├── quickbooksApi
    ├── stripeApi
    └── paypalApi
```

## Data Flow

### 1. Page Load Flow
```
User navigates to /finance/integrations
    ↓
Component mounts
    ↓
React Query fetches data (parallel)
    ├── integrationsApi.list()
    ├── quickbooksApi.getConnection()
    ├── stripeApi.getConnectAccount()
    └── paypalApi.getStatus()
    ↓
Data received
    ↓
getIntegrationStatus() determines each card's status
    ↓
UI renders with correct badges and buttons
    ↓
Auto-refresh starts (every 30 seconds)
```

### 2. Connect Integration Flow

#### QuickBooks (OAuth)
```
User clicks "Connect" on QuickBooks card
    ↓
handleConnect() called
    ↓
Redirects to /api/quickbooks/oauth/authorize
    ↓
User authorizes on QuickBooks
    ↓
Redirects back with code
    ↓
Backend exchanges code for tokens
    ↓
Connection stored in database
    ↓
User returns to page
    ↓
Status updates to "Connected"
```

#### Stripe (OAuth)
```
User clicks "Connect" on Stripe card
    ↓
connectStripeMutation.mutate()
    ↓
stripeApi.createConnectAccount()
    ↓
Account created
    ↓
stripeApi.getOnboardingUrl()
    ↓
Redirects to Stripe onboarding
    ↓
User completes onboarding
    ↓
Redirects back to app
    ↓
Status updates to "Connected"
```

#### PayPal (API Keys)
```
User clicks "Connect" on PayPal card
    ↓
Connection modal opens
    ↓
User enters credentials
    ├── Client ID
    ├── Client Secret
    └── Mode (Sandbox/Live)
    ↓
User clicks "Connect"
    ↓
connectPayPalMutation.mutate()
    ↓
paypalApi.connect()
    ↓
Backend validates credentials
    ↓
Connection stored
    ↓
Modal closes
    ↓
Status updates to "Connected"
    ↓
Success toast appears
```

### 3. Manage Integration Flow
```
User clicks "Manage" on connected integration
    ↓
handleManage() called
    ↓
selectedIntegration set
    ↓
showSettingsModal set to true
    ↓
Settings modal renders with integration-specific content
    ↓
User can:
    ├── Toggle settings
    ├── Test connection
    ├── Sync data
    └── Disconnect
```

### 4. Update Settings Flow (QuickBooks Example)
```
User toggles "Auto-sync Invoices"
    ↓
Switch onCheckedChange fires
    ↓
updateQbSettingsMutation.mutate({ auto_sync_invoices: true })
    ↓
quickbooksApi.updateSettings()
    ↓
Backend updates database
    ↓
Response received
    ↓
React Query invalidates cache
    ↓
Data refetches
    ↓
UI updates with new state
    ↓
Success toast appears
```

### 5. Test Connection Flow
```
User clicks "Test Connection"
    ↓
testConnectionMutation.mutate(provider)
    ↓
integrationsApi.test(provider)
    ↓
Backend tests connection
    ├── Makes API call to provider
    ├── Validates credentials
    └── Returns result
    ↓
Response received
    ↓
Toast shows result
    ├── Success: "Connection test successful!"
    └── Error: "Connection test failed: [reason]"
```

### 6. Sync Data Flow
```
User clicks "Sync Now"
    ↓
syncMutation.mutate(provider)
    ↓
integrationsApi.sync(provider)
    ↓
Backend starts sync job
    ├── Creates sync job record
    ├── Queues background task
    └── Returns job ID
    ↓
Response received
    ↓
Success toast appears
    ↓
React Query invalidates cache
    ↓
Status updates
```

### 7. Disconnect Flow
```
User clicks "Disconnect"
    ↓
disconnectMutation.mutate(provider)
    ↓
integrationsApi.disconnect(provider)
    ↓
Backend removes connection
    ├── Deletes tokens
    ├── Updates status
    └── Clears sync settings
    ↓
Response received
    ↓
React Query invalidates all related queries
    ├── integrationsList
    ├── qbConnection
    ├── stripeAccount
    └── paypalStatus
    ↓
Data refetches
    ↓
UI updates
    ├── Status badge → "Available"
    ├── Button → "Connect"
    └── Modal closes
    ↓
Success toast appears
```

## API Endpoints Used

### Integrations API
```
GET    /api/integrations                      → List all integrations
GET    /api/integrations/:provider            → Get specific integration
POST   /api/integrations/:provider/oauth      → Start OAuth flow
POST   /api/integrations/:provider/connect    → Connect with API keys
POST   /api/integrations/:provider/disconnect → Disconnect
POST   /api/integrations/:provider/test       → Test connection
POST   /api/integrations/:provider/sync       → Trigger sync
PUT    /api/integrations/:provider/config     → Update config
```

### QuickBooks API
```
GET    /api/quickbooks/connection             → Get connection status
POST   /api/quickbooks/connect                → Complete OAuth
POST   /api/quickbooks/disconnect             → Disconnect
PUT    /api/quickbooks/settings               → Update settings
POST   /api/quickbooks/sync-all               → Sync all data
GET    /api/quickbooks/sync-status            → Get sync status
POST   /api/quickbooks/export/invoice/:id     → Export invoice
POST   /api/quickbooks/export/payment/:id     → Export payment
```

### Stripe API
```
GET    /api/stripe/connect/account            → Get account
POST   /api/stripe/connect/create             → Create account
POST   /api/stripe/connect/onboarding-url     → Get onboarding URL
GET    /api/stripe/connect/dashboard-link     → Get dashboard link
GET    /api/stripe/connect/balance            → Get balance
GET    /api/stripe/settings                   → Get settings
PUT    /api/stripe/settings                   → Update settings
```

### PayPal API
```
GET    /api/paypal/status                     → Get status
POST   /api/paypal/connect                    → Connect account
POST   /api/paypal/disconnect                 → Disconnect
POST   /api/paypal/order                      → Create order
POST   /api/paypal/capture                    → Capture payment
```

## Database Schema

### integrations table
```sql
id                  INT PRIMARY KEY
workspace_id        INT
provider            VARCHAR (quickbooks, stripe, paypal, etc.)
provider_account_id VARCHAR
provider_account_name VARCHAR
status              ENUM (disconnected, pending, connected, error, expired)
error_message       TEXT
last_error_at       TIMESTAMP
scopes              JSON
config              JSON
last_sync_at        TIMESTAMP
last_sync_status    ENUM (success, partial, failed)
connected_by        INT
connected_at        TIMESTAMP
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

### quickbooks_connections table
```sql
id                  INT PRIMARY KEY
workspace_id        INT
realm_id            VARCHAR
company_name        VARCHAR
country             VARCHAR
sync_enabled        BOOLEAN
auto_sync_invoices  BOOLEAN
auto_sync_payments  BOOLEAN
auto_sync_customers BOOLEAN
last_sync_at        TIMESTAMP
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

### stripe_accounts table
```sql
id                  VARCHAR PRIMARY KEY
workspace_id        VARCHAR
stripe_account_id   VARCHAR
account_type        ENUM (express, standard, custom)
charges_enabled     BOOLEAN
payouts_enabled     BOOLEAN
details_submitted   BOOLEAN
business_profile    JSON
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

### paypal_connections table
```sql
id                  INT PRIMARY KEY
workspace_id        INT
status              ENUM (disconnected, pending, connected, error, disabled)
mode                ENUM (sandbox, live)
connected_at        TIMESTAMP
error_message       TEXT
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

## Error Handling Strategy

### Network Errors
```
API call fails
    ↓
Catch block executes
    ↓
Error toast displayed with message
    ↓
Loading state ends
    ↓
User can retry
```

### Validation Errors
```
User submits invalid data
    ↓
Backend validates
    ↓
Returns 400 error
    ↓
Error message displayed
    ↓
Form stays open
    ↓
User corrects and retries
```

### Authentication Errors
```
OAuth fails or expires
    ↓
Backend returns 401
    ↓
Integration status → "error" or "expired"
    ↓
Error message displayed
    ↓
User can reconnect
```

## Performance Optimizations

1. **React Query Caching**
   - Queries cached for 5 minutes
   - Stale time: 30 seconds
   - Auto-refetch on window focus

2. **Optimistic Updates**
   - Toggle switches update immediately
   - Rollback on error

3. **Lazy Loading**
   - Modals only render when open
   - Heavy components lazy loaded

4. **Debouncing**
   - API calls debounced where appropriate
   - Prevents excessive requests

## Security Considerations

1. **Credentials Storage**
   - Never stored in frontend
   - Only in backend database
   - Encrypted at rest

2. **OAuth Tokens**
   - Stored server-side only
   - Refresh tokens used
   - Automatic renewal

3. **API Keys**
   - Password input fields
   - Never logged
   - Transmitted over HTTPS only

## Future Enhancements

1. **Webhook Management**
   - View webhook events
   - Configure webhook URLs
   - Test webhooks

2. **Sync History**
   - View past syncs
   - See what was synced
   - Error logs

3. **Bulk Operations**
   - Sync multiple integrations
   - Bulk disconnect
   - Batch testing

4. **Analytics**
   - Integration usage metrics
   - Sync success rates
   - Error frequency

5. **Advanced Settings**
   - Custom field mappings
   - Sync schedules
   - Conflict resolution rules
