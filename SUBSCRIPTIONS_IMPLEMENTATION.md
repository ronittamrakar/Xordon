# Customer Subscriptions Implementation Plan

## Database Schema

The following tables need to be created in the database:

### 1. customer_subscriptions
```sql
CREATE TABLE customer_subscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workspace_id INT NOT NULL,
    contact_id INT NOT NULL,
    product_id INT NOT NULL,
    subscription_number VARCHAR(50) UNIQUE,
    status ENUM('active', 'trialing', 'paused', 'cancelled', 'expired', 'past_due'),
    billing_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    billing_interval VARCHAR(20) NOT NULL,
    billing_interval_count INT DEFAULT 1,
    trial_days INT DEFAULT 0,
    trial_end_date DATE,
    setup_fee DECIMAL(10, 2) DEFAULT 0,
    setup_fee_paid BOOLEAN DEFAULT FALSE,
    start_date DATE NOT NULL,
    next_billing_date DATE,
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2. subscription_billing_history
Tracks all billing attempts and payments

### 3. subscription_analytics
Caches MRR, ARR, churn metrics

### 4. payment_gateway_settings
Stores Stripe/PayPal API credentials

## Implementation Steps

1. Run database migration
2. Create SubscriptionsController.php backend
3. Create subscriptionsApi.ts frontend service
4. Build ActiveSubscriptions.tsx component
5. Add SubscriptionAnalytics.tsx dashboard
6. Integrate Stripe SDK
7. Add trial and setup fee support

## Files to Create

- backend/src/controllers/SubscriptionsController.php
- backend/src/services/StripeService.php
- src/services/subscriptionsApi.ts
- src/pages/finance/ActiveSubscriptions.tsx
- src/pages/finance/SubscriptionAnalytics.tsx
- src/components/subscriptions/SubscriptionCard.tsx
- src/components/subscriptions/TrialBanner.tsx

Would you like me to proceed with creating these files?
