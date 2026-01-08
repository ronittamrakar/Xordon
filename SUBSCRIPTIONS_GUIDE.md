# Subscription Management - Quick Reference Guide

## 🚀 Getting Started

### 1. Access the Subscriptions Page
Navigate to: **Finance → Subscriptions** (`/finance/subscriptions`)

### 2. Three Main Tabs

#### 📋 Subscription Plans
- Create recurring billing plans
- Configure pricing, intervals, trial periods, and setup fees
- Manage plan status (active/inactive)
- View/edit/delete existing plans

#### 👥 Active Subscriptions
- View all customer subscriptions
- Monitor subscription status (active, trialing, past_due, cancelled)
- View detailed subscription information
- Cancel subscriptions (immediate or at period end)
- Quick stats: Active, Trialing, Past Due, Total

#### 📊 Analytics
- **MRR** (Monthly Recurring Revenue)
- **ARR** (Annual Recurring Revenue)
- **Active Subscribers** count
- **Trialing Subscribers** count
- **Growth Chart** - New subscriptions over time
- **Status Distribution** - Pie chart of subscription states

## 💡 Common Tasks

### Create a Subscription Plan
1. Go to **Subscription Plans** tab
2. Click **Create Plan**
3. Fill in:
   - Name (e.g., "Premium Monthly")
   - Price (e.g., 29.99)
   - Currency (USD, EUR, etc.)
   - Billing Interval (daily, weekly, monthly, quarterly, yearly)
   - Trial Days (optional, e.g., 7)
   - Setup Fee (optional, e.g., 49.99)
4. Click **Create Plan**

### Create a Customer Subscription
**Via API:**
```javascript
POST /api/subscriptions
{
  "contact_id": 123,
  "product_id": 456,
  "billing_amount": 29.99,
  "currency": "USD",
  "billing_interval": "monthly",
  "trial_days": 7,
  "setup_fee": 49.99
}
```

### View Subscription Details
1. Go to **Active Subscriptions** tab
2. Click the **⋮** menu on any subscription
3. Select **View Details**
4. View tabs: Overview, Billing, History

### Cancel a Subscription
**Option 1: From Table**
1. Click **⋮** menu
2. Select **Cancel Subscription**
3. Confirm cancellation

**Option 2: From Detail Dialog**
1. Open subscription details
2. Click **Cancel Subscription** button
3. Confirm cancellation

**Note:** Subscriptions are cancelled at the end of the billing period by default.

## 🎨 Status Indicators

| Status | Color | Meaning |
|--------|-------|---------|
| **Active** | 🟢 Green | Subscription is active and billing normally |
| **Trialing** | 🔵 Blue | In trial period, not yet billed |
| **Past Due** | 🟠 Orange | Payment failed, requires attention |
| **Cancelled** | 🔴 Red | Subscription has been cancelled |
| **Paused** | ⚪ Gray | Temporarily paused (future feature) |

## 🔗 Stripe Integration

### Automatic Sync
When Stripe is connected:
- ✅ Customers are automatically created in Stripe
- ✅ Subscriptions are synced to Stripe
- ✅ Webhooks update local database in real-time
- ✅ Billing history is tracked automatically

### Without Stripe
- ✅ Manual subscription management still works
- ✅ All features available except automated billing
- ✅ Perfect for offline/manual billing scenarios

## 📊 Understanding Metrics

### MRR (Monthly Recurring Revenue)
Total monthly revenue from all active subscriptions, normalized:
- Daily → × 30
- Weekly → × 4.33
- Monthly → × 1
- Quarterly → ÷ 3
- Yearly → ÷ 12

### ARR (Annual Recurring Revenue)
`ARR = MRR × 12`

### Growth Trend
Shows new subscriptions created per day/week/month

### Status Distribution
Breakdown of subscriptions by status (active, trialing, cancelled, etc.)

## 🔧 Advanced Features

### Trial Periods
- Set trial days when creating a plan
- Automatic status change from "trialing" to "active"
- Trial end date calculated automatically
- Visual trial indicators in UI

### Setup Fees
- One-time fee charged at subscription start
- Tracked separately from recurring billing
- Can be marked as paid/unpaid

### Billing Intervals
- **Daily** - Billed every day
- **Weekly** - Billed every week
- **Monthly** - Billed every month
- **Quarterly** - Billed every 3 months
- **Yearly** - Billed every year
- **Custom** - Use interval count (e.g., every 2 weeks)

## 🔔 Webhook Events

### Handled Events
- `customer.subscription.updated` - Sync status changes
- `customer.subscription.deleted` - Handle cancellations
- `invoice.payment_succeeded` - Record successful payments
- `invoice.payment_failed` - Mark as past due

### Webhook URL
Configure in Stripe Dashboard:
```
https://your-domain.com/api/stripe/webhook
```

## 📱 API Endpoints

### List Subscriptions
```
GET /api/subscriptions
```

### Get Subscription
```
GET /api/subscriptions/{id}
```

### Create Subscription
```
POST /api/subscriptions
```

### Update Subscription
```
PUT /api/subscriptions/{id}
```

### Cancel Subscription
```
POST /api/subscriptions/{id}/cancel
{
  "cancel_at_period_end": true
}
```

### Get Statistics
```
GET /api/subscriptions/stats
```

### Get Analytics
```
GET /api/subscriptions/analytics?from=2024-01-01&to=2024-12-31
```

## 🎯 Best Practices

### Plan Creation
✅ Use clear, descriptive names
✅ Set appropriate trial periods for conversion
✅ Consider setup fees for onboarding costs
✅ Test with small amounts first

### Subscription Management
✅ Monitor past due subscriptions regularly
✅ Review trial conversions weekly
✅ Track MRR/ARR trends monthly
✅ Set up email notifications for payment failures

### Customer Communication
✅ Notify before trial ends
✅ Send receipts for successful payments
✅ Alert on payment failures
✅ Confirm cancellations

## 🐛 Troubleshooting

### Subscription Not Syncing to Stripe
1. Check Stripe integration status
2. Verify API keys are correct
3. Check webhook configuration
4. Review error logs

### MRR Calculation Seems Wrong
1. Verify all subscriptions have correct intervals
2. Check for duplicate subscriptions
3. Ensure cancelled subscriptions are excluded
4. Review billing amounts and currency

### Customer Not Receiving Invoices
1. Verify Stripe is connected
2. Check email settings in Stripe
3. Confirm customer email is correct
4. Review Stripe webhook logs

## 📞 Support

For issues or questions:
1. Check the implementation docs: `SUBSCRIPTIONS_COMPLETE.md`
2. Review the codebase:
   - Backend: `backend/src/controllers/SubscriptionsController.php`
   - Frontend: `src/pages/finance/Subscriptions.tsx`
   - API: `src/services/subscriptionsApi.ts`

---

**Last Updated:** January 2026
**Version:** 1.0.0
