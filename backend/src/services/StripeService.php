<?php
/**
 * Stripe Billing Service
 * Handles subscription management, webhook processing, and invoice operations
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Logger.php';

class StripeService {
    
    private static ?self $instance = null;
    private PDO $pdo;
    private ?string $secretKey;
    private ?string $webhookSecret;
    
    // Pricing tiers (can be managed via env or database)
    const PLANS = [
        'starter' => [
            'name' => 'Starter',
            'price_monthly' => 9700, // $97/month
            'price_yearly' => 97000, // $970/year (2 months free)
            'max_subaccounts' => 5,
            'max_team_members' => 5,
            'max_contacts' => 5000,
            'max_emails_per_month' => 25000,
            'max_sms_per_month' => 500,
        ],
        'professional' => [
            'name' => 'Professional',
            'price_monthly' => 29700,
            'price_yearly' => 297000,
            'max_subaccounts' => 25,
            'max_team_members' => 15,
            'max_contacts' => 25000,
            'max_emails_per_month' => 100000,
            'max_sms_per_month' => 2500,
        ],
        'agency' => [
            'name' => 'Agency',
            'price_monthly' => 49700,
            'price_yearly' => 497000,
            'max_subaccounts' => 100,
            'max_team_members' => 50,
            'max_contacts' => 100000,
            'max_emails_per_month' => 500000,
            'max_sms_per_month' => 10000,
        ],
        'enterprise' => [
            'name' => 'Enterprise',
            'price_monthly' => 0, // Custom pricing
            'price_yearly' => 0,
            'max_subaccounts' => -1, // Unlimited
            'max_team_members' => -1,
            'max_contacts' => -1,
            'max_emails_per_month' => -1,
            'max_sms_per_month' => -1,
        ],
    ];
    
    private function __construct() {
        $this->pdo = Database::conn();
        $this->secretKey = getenv('STRIPE_SECRET_KEY') ?: null;
        $this->webhookSecret = getenv('STRIPE_WEBHOOK_SECRET') ?: null;
    }
    
    public static function getInstance(): self {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    // ========================================
    // CUSTOMER MANAGEMENT
    // ========================================
    
    /**
     * Create or get Stripe customer for agency
     */
    public function getOrCreateCustomer(int $agencyId): ?array {
        // Check if customer already exists
        $stmt = $this->pdo->prepare('
            SELECT stripe_customer_id FROM agency_subscriptions WHERE agency_id = ?
        ');
        $stmt->execute([$agencyId]);
        $existing = $stmt->fetch();
        
        if ($existing && $existing['stripe_customer_id']) {
            return ['customer_id' => $existing['stripe_customer_id']];
        }
        
        // Get agency details
        $stmt = $this->pdo->prepare('
            SELECT a.name, a.billing_email, u.email as owner_email
            FROM agencies a
            LEFT JOIN agency_members am ON am.agency_id = a.id AND am.role = "owner"
            LEFT JOIN users u ON u.id = am.user_id
            WHERE a.id = ?
        ');
        $stmt->execute([$agencyId]);
        $agency = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$agency) return null;
        
        if (!$this->secretKey) {
            // Demo mode - generate fake customer ID
            $customerId = 'cus_demo_' . bin2hex(random_bytes(8));
        } else {
            // Real Stripe API call
            $customerId = $this->createStripeCustomer(
                $agency['billing_email'] ?? $agency['owner_email'],
                $agency['name']
            );
        }
        
        // Store customer ID
        $stmt = $this->pdo->prepare('
            INSERT INTO agency_subscriptions (agency_id, stripe_customer_id, plan_name, status)
            VALUES (?, ?, "free", "trialing")
            ON DUPLICATE KEY UPDATE stripe_customer_id = VALUES(stripe_customer_id)
        ');
        $stmt->execute([$agencyId, $customerId]);
        
        return ['customer_id' => $customerId];
    }
    
    private function createStripeCustomer(string $email, string $name): string {
        $ch = curl_init('https://api.stripe.com/v1/customers');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_USERPWD => $this->secretKey . ':',
            CURLOPT_POSTFIELDS => http_build_query([
                'email' => $email,
                'name' => $name,
            ]),
        ]);
        $response = json_decode(curl_exec($ch), true);
        curl_close($ch);
        
        return $response['id'] ?? ('cus_error_' . time());
    }
    
    // ========================================
    // SUBSCRIPTION MANAGEMENT
    // ========================================
    
    /**
     * Get current subscription for agency
     */
    public function getSubscription(int $agencyId): ?array {
        $stmt = $this->pdo->prepare('SELECT * FROM agency_subscriptions WHERE agency_id = ?');
        $stmt->execute([$agencyId]);
        $sub = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$sub) {
            // Create default trial subscription
            return $this->createTrialSubscription($agencyId);
        }
        
        // Add plan details
        $planKey = strtolower($sub['plan_name']);
        $sub['plan_details'] = self::PLANS[$planKey] ?? null;
        
        return $sub;
    }
    
    /**
     * Create trial subscription
     */
    public function createTrialSubscription(int $agencyId): array {
        $trialDays = 14;
        $plan = self::PLANS['starter'];
        
        $stmt = $this->pdo->prepare('
            INSERT INTO agency_subscriptions (
                agency_id, plan_name, status, billing_cycle,
                trial_ends_at, base_price_cents,
                max_subaccounts, max_team_members, max_contacts,
                max_emails_per_month, max_sms_per_month
            ) VALUES (?, ?, "trialing", "monthly", DATE_ADD(NOW(), INTERVAL ? DAY), ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                status = "trialing",
                trial_ends_at = DATE_ADD(NOW(), INTERVAL ? DAY)
        ');
        $stmt->execute([
            $agencyId, 'Starter', $trialDays, $plan['price_monthly'],
            $plan['max_subaccounts'], $plan['max_team_members'], $plan['max_contacts'],
            $plan['max_emails_per_month'], $plan['max_sms_per_month'],
            $trialDays
        ]);
        
        return $this->getSubscription($agencyId);
    }
    
    /**
     * Create checkout session for subscription
     */
    public function createCheckoutSession(int $agencyId, string $planKey, string $billingCycle = 'monthly'): array {
        $customer = $this->getOrCreateCustomer($agencyId);
        if (!$customer) {
            return ['error' => 'Failed to create customer'];
        }
        
        $plan = self::PLANS[$planKey] ?? null;
        if (!$plan) {
            return ['error' => 'Invalid plan'];
        }
        
        $price = $billingCycle === 'yearly' ? $plan['price_yearly'] : $plan['price_monthly'];
        
        if (!$this->secretKey) {
            // Demo mode
            return [
                'checkout_url' => '/agency/settings?checkout=demo&plan=' . $planKey,
                'session_id' => 'cs_demo_' . bin2hex(random_bytes(16)),
                'demo_mode' => true
            ];
        }
        
        // Create Stripe checkout session
        $successUrl = getenv('APP_URL') . '/agency/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}';
        $cancelUrl = getenv('APP_URL') . '/agency/settings?checkout=canceled';
        
        $ch = curl_init('https://api.stripe.com/v1/checkout/sessions');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_USERPWD => $this->secretKey . ':',
            CURLOPT_POSTFIELDS => http_build_query([
                'customer' => $customer['customer_id'],
                'payment_method_types[]' => 'card',
                'line_items[0][price_data][currency]' => 'usd',
                'line_items[0][price_data][product_data][name]' => $plan['name'] . ' Plan',
                'line_items[0][price_data][unit_amount]' => $price,
                'line_items[0][price_data][recurring][interval]' => $billingCycle === 'yearly' ? 'year' : 'month',
                'line_items[0][quantity]' => 1,
                'mode' => 'subscription',
                'success_url' => $successUrl,
                'cancel_url' => $cancelUrl,
                'metadata[agency_id]' => $agencyId,
                'metadata[plan]' => $planKey,
            ]),
        ]);
        $response = json_decode(curl_exec($ch), true);
        curl_close($ch);
        
        if (isset($response['error'])) {
            return ['error' => $response['error']['message']];
        }
        
        return [
            'checkout_url' => $response['url'],
            'session_id' => $response['id']
        ];
    }
    
    /**
     * Update subscription plan
     */
    public function updateSubscription(int $agencyId, string $planKey, string $billingCycle): bool {
        $plan = self::PLANS[$planKey] ?? null;
        if (!$plan) return false;
        
        $price = $billingCycle === 'yearly' ? $plan['price_yearly'] : $plan['price_monthly'];
        
        $stmt = $this->pdo->prepare('
            UPDATE agency_subscriptions SET
                plan_name = ?,
                billing_cycle = ?,
                base_price_cents = ?,
                max_subaccounts = ?,
                max_team_members = ?,
                max_contacts = ?,
                max_emails_per_month = ?,
                max_sms_per_month = ?,
                status = "active",
                current_period_start = NOW(),
                current_period_end = DATE_ADD(NOW(), INTERVAL IF(? = "yearly", 1 YEAR, 1 MONTH))
            WHERE agency_id = ?
        ');
        
        return $stmt->execute([
            $plan['name'], $billingCycle, $price,
            $plan['max_subaccounts'], $plan['max_team_members'], $plan['max_contacts'],
            $plan['max_emails_per_month'], $plan['max_sms_per_month'],
            $billingCycle, $agencyId
        ]);
    }
    
    /**
     * Cancel subscription
     */
    public function cancelSubscription(int $agencyId, bool $immediately = false): bool {
        if ($immediately) {
            $stmt = $this->pdo->prepare('
                UPDATE agency_subscriptions 
                SET status = "canceled", canceled_at = NOW()
                WHERE agency_id = ?
            ');
        } else {
            // Cancel at period end
            $stmt = $this->pdo->prepare('
                UPDATE agency_subscriptions 
                SET canceled_at = current_period_end
                WHERE agency_id = ?
            ');
        }
        return $stmt->execute([$agencyId]);
    }
    
    // ========================================
    // USAGE TRACKING
    // ========================================
    
    /**
     * Record usage
     */
    public function recordUsage(int $agencyId, ?int $subaccountId, string $type, int $amount = 1): void {
        $year = (int)date('Y');
        $month = (int)date('n');
        
        $column = match($type) {
            'email' => 'emails_sent',
            'sms' => 'sms_sent',
            'call' => 'calls_made',
            'api' => 'api_calls',
            default => null
        };
        
        if (!$column) return;
        
        $stmt = $this->pdo->prepare("
            INSERT INTO usage_records (agency_id, subaccount_id, period_year, period_month, $column)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE $column = $column + VALUES($column)
        ");
        $stmt->execute([$agencyId, $subaccountId, $year, $month, $amount]);
    }
    
    /**
     * Get usage for period
     */
    public function getUsage(int $agencyId, ?int $year = null, ?int $month = null): array {
        $year = $year ?? (int)date('Y');
        $month = $month ?? (int)date('n');
        
        // Agency total
        $stmt = $this->pdo->prepare('
            SELECT 
                SUM(emails_sent) as emails_sent,
                SUM(sms_sent) as sms_sent,
                SUM(calls_made) as calls_made,
                SUM(api_calls) as api_calls
            FROM usage_records
            WHERE agency_id = ? AND period_year = ? AND period_month = ?
        ');
        $stmt->execute([$agencyId, $year, $month]);
        $total = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Per sub-account breakdown
        $stmt = $this->pdo->prepare('
            SELECT u.*, s.name as subaccount_name
            FROM usage_records u
            LEFT JOIN subaccounts s ON s.id = u.subaccount_id
            WHERE u.agency_id = ? AND u.period_year = ? AND u.period_month = ?
        ');
        $stmt->execute([$agencyId, $year, $month]);
        $breakdown = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return [
            'period' => ['year' => $year, 'month' => $month],
            'total' => array_map('intval', $total),
            'breakdown' => $breakdown
        ];
    }
    
    /**
     * Check if usage limit exceeded
     */
    public function checkLimits(int $agencyId): array {
        $sub = $this->getSubscription($agencyId);
        $usage = $this->getUsage($agencyId);
        
        $limits = [];
        
        if ($sub['max_emails_per_month'] > 0) {
            $limits['emails'] = [
                'used' => $usage['total']['emails_sent'] ?? 0,
                'limit' => $sub['max_emails_per_month'],
                'percent' => min(100, round((($usage['total']['emails_sent'] ?? 0) / $sub['max_emails_per_month']) * 100))
            ];
        }
        
        if ($sub['max_sms_per_month'] > 0) {
            $limits['sms'] = [
                'used' => $usage['total']['sms_sent'] ?? 0,
                'limit' => $sub['max_sms_per_month'],
                'percent' => min(100, round((($usage['total']['sms_sent'] ?? 0) / $sub['max_sms_per_month']) * 100))
            ];
        }
        
        // Check subaccount count
        $stmt = $this->pdo->prepare('SELECT COUNT(*) as cnt FROM subaccounts WHERE agency_id = ?');
        $stmt->execute([$agencyId]);
        $subCount = (int)$stmt->fetchColumn();
        
        if ($sub['max_subaccounts'] > 0) {
            $limits['subaccounts'] = [
                'used' => $subCount,
                'limit' => $sub['max_subaccounts'],
                'percent' => min(100, round(($subCount / $sub['max_subaccounts']) * 100))
            ];
        }
        
        return $limits;
    }
    
    // ========================================
    // INVOICES
    // ========================================
    
    /**
     * Get invoices for agency
     */
    public function getInvoices(int $agencyId, int $limit = 20): array {
        $stmt = $this->pdo->prepare('
            SELECT * FROM invoices 
            WHERE agency_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        ');
        $stmt->execute([$agencyId, $limit]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get available plans
     */
    public function getPlans(): array {
        return array_map(function($key, $plan) {
            return array_merge(['key' => $key], $plan);
        }, array_keys(self::PLANS), self::PLANS);
    }
    
    // ========================================
    // RESELLER PRICING
    // ========================================
    
    /**
     * Get reseller pricing for agency
     */
    public function getResellerPricing(int $agencyId): array {
        $stmt = $this->pdo->prepare('
            SELECT * FROM reseller_pricing WHERE agency_id = ? ORDER BY price_type, addon_key
        ');
        $stmt->execute([$agencyId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Set reseller pricing
     */
    public function setResellerPricing(int $agencyId, array $pricing): bool {
        $stmt = $this->pdo->prepare('
            INSERT INTO reseller_pricing 
            (agency_id, price_type, addon_key, addon_name, base_cost_cents, markup_type, markup_value, sell_price_cents, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                addon_name = VALUES(addon_name),
                base_cost_cents = VALUES(base_cost_cents),
                markup_type = VALUES(markup_type),
                markup_value = VALUES(markup_value),
                sell_price_cents = VALUES(sell_price_cents),
                is_active = VALUES(is_active)
        ');
        
        foreach ($pricing as $item) {
            $sellPrice = $item['markup_type'] === 'percentage'
                ? $item['base_cost_cents'] * (1 + $item['markup_value'] / 100)
                : $item['base_cost_cents'] + ($item['markup_value'] * 100);
            
            $stmt->execute([
                $agencyId,
                $item['price_type'],
                $item['addon_key'] ?? null,
                $item['addon_name'] ?? null,
                $item['base_cost_cents'] ?? 0,
                $item['markup_type'] ?? 'fixed',
                $item['markup_value'] ?? 0,
                (int)$sellPrice,
                $item['is_active'] ?? true
            ]);
        }
        
        return true;
    }
    
    // ========================================
    // WEBHOOKS
    // ========================================
    
    /**
     * Process Stripe webhook
     */
    public function processWebhook(string $payload, string $signature): array {
        // Verify signature if webhook secret is set
        if ($this->webhookSecret && !$this->verifyWebhookSignature($payload, $signature)) {
            return ['error' => 'Invalid signature'];
        }
        
        $event = json_decode($payload, true);
        if (!$event || !isset($event['id'])) {
            return ['error' => 'Invalid payload'];
        }
        
        // Check idempotency
        $stmt = $this->pdo->prepare('SELECT id FROM stripe_events WHERE event_id = ?');
        $stmt->execute([$event['id']]);
        if ($stmt->fetch()) {
            return ['status' => 'already_processed'];
        }
        
        // Store event
        $stmt = $this->pdo->prepare('
            INSERT INTO stripe_events (event_id, event_type, payload) VALUES (?, ?, ?)
        ');
        $stmt->execute([$event['id'], $event['type'], $payload]);
        
        // Process based on type
        $result = match($event['type']) {
            'checkout.session.completed' => $this->handleCheckoutComplete($event['data']['object']),
            'customer.subscription.updated' => $this->handleSubscriptionUpdated($event['data']['object']),
            'customer.subscription.deleted' => $this->handleSubscriptionCanceled($event['data']['object']),
            'invoice.paid' => $this->handleInvoicePaid($event['data']['object']),
            'invoice.payment_failed' => $this->handlePaymentFailed($event['data']['object']),
            default => ['status' => 'ignored']
        };
        
        // Mark as processed
        $this->pdo->prepare('
            UPDATE stripe_events SET processed = TRUE, processed_at = NOW() WHERE event_id = ?
        ')->execute([$event['id']]);
        
        return $result;
    }
    
    private function verifyWebhookSignature(string $payload, string $signature): bool {
        // Stripe signature verification
        $parts = explode(',', $signature);
        $timestamp = null;
        $sig = null;
        
        foreach ($parts as $part) {
            [$key, $value] = explode('=', $part, 2);
            if ($key === 't') $timestamp = $value;
            if ($key === 'v1') $sig = $value;
        }
        
        if (!$timestamp || !$sig) return false;
        
        $signedPayload = $timestamp . '.' . $payload;
        $expected = hash_hmac('sha256', $signedPayload, $this->webhookSecret);
        
        return hash_equals($expected, $sig);
    }
    
    private function handleCheckoutComplete(array $session): array {
        $agencyId = $session['metadata']['agency_id'] ?? null;
        $plan = $session['metadata']['plan'] ?? 'starter';
        
        if (!$agencyId) return ['error' => 'Missing agency ID'];
        
        // Update subscription
        $stmt = $this->pdo->prepare('
            UPDATE agency_subscriptions SET
                stripe_subscription_id = ?,
                status = "active",
                current_period_start = NOW(),
                trial_ends_at = NULL
            WHERE agency_id = ?
        ');
        $stmt->execute([$session['subscription'], $agencyId]);
        
        $this->updateSubscription((int)$agencyId, $plan, 'monthly');
        
        return ['status' => 'subscription_activated'];
    }
    
    private function handleSubscriptionUpdated(array $subscription): array {
        $stmt = $this->pdo->prepare('
            UPDATE agency_subscriptions SET
                status = ?,
                current_period_start = FROM_UNIXTIME(?),
                current_period_end = FROM_UNIXTIME(?)
            WHERE stripe_subscription_id = ?
        ');
        $stmt->execute([
            $subscription['status'],
            $subscription['current_period_start'],
            $subscription['current_period_end'],
            $subscription['id']
        ]);
        
        return ['status' => 'subscription_updated'];
    }
    
    private function handleSubscriptionCanceled(array $subscription): array {
        $stmt = $this->pdo->prepare('
            UPDATE agency_subscriptions SET status = "canceled", canceled_at = NOW()
            WHERE stripe_subscription_id = ?
        ');
        $stmt->execute([$subscription['id']]);
        
        return ['status' => 'subscription_canceled'];
    }
    
    private function handleInvoicePaid(array $invoice): array {
        $stmt = $this->pdo->prepare('
            INSERT INTO invoices (agency_id, stripe_invoice_id, invoice_number, status, total_cents, paid_at)
            SELECT agency_id, ?, ?, "paid", ?, NOW()
            FROM agency_subscriptions WHERE stripe_customer_id = ?
            ON DUPLICATE KEY UPDATE status = "paid", paid_at = NOW()
        ');
        $stmt->execute([
            $invoice['id'],
            $invoice['number'],
            $invoice['amount_paid'],
            $invoice['customer']
        ]);
        
        return ['status' => 'invoice_recorded'];
    }
    
    private function handlePaymentFailed(array $invoice): array {
        $stmt = $this->pdo->prepare('
            UPDATE agency_subscriptions SET status = "past_due"
            WHERE stripe_customer_id = ?
        ');
        $stmt->execute([$invoice['customer']]);
        
        return ['status' => 'marked_past_due'];
    }
}
