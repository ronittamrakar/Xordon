<?php
/**
 * Billing Controller
 * Handles subscription management, invoices, and usage APIs
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../services/StripeService.php';
require_once __DIR__ . '/../services/MultiTenantRBACService.php';

class BillingController {
    
    // ========================================
    // SUBSCRIPTION
    // ========================================
    
    /**
     * Get current subscription
     * GET /mt/agencies/:id/billing/subscription
     */
    public static function getSubscription(int $agencyId): void {
        $userId = Auth::userIdOrFail();
        $rbac = MultiTenantRBACService::getInstance();
        
        if (!$rbac->hasAgencyPermission($userId, $agencyId, 'billing.view')) {
            Response::forbidden('Access denied');
            return;
        }
        
        $stripe = StripeService::getInstance();
        $subscription = $stripe->getSubscription($agencyId);
        $limits = $stripe->checkLimits($agencyId);
        
        Response::json([
            'subscription' => $subscription,
            'limits' => $limits
        ]);
    }
    
    /**
     * Get available plans
     * GET /mt/billing/plans
     */
    public static function getPlans(): void {
        $stripe = StripeService::getInstance();
        Response::json(['plans' => $stripe->getPlans()]);
    }
    
    /**
     * Create checkout session
     * POST /mt/agencies/:id/billing/checkout
     */
    public static function createCheckout(int $agencyId): void {
        $userId = Auth::userIdOrFail();
        $rbac = MultiTenantRBACService::getInstance();
        
        if (!$rbac->hasAgencyPermission($userId, $agencyId, 'billing.manage')) {
            Response::forbidden('Only agency owners can manage billing');
            return;
        }
        
        $body = get_json_body();
        $plan = $body['plan'] ?? 'starter';
        $billingCycle = $body['billing_cycle'] ?? 'monthly';
        
        $stripe = StripeService::getInstance();
        $result = $stripe->createCheckoutSession($agencyId, $plan, $billingCycle);
        
        if (isset($result['error'])) {
            Response::error($result['error'], 422);
            return;
        }
        
        Response::json($result);
    }
    
    /**
     * Update subscription (change plan)
     * PUT /mt/agencies/:id/billing/subscription
     */
    public static function updateSubscription(int $agencyId): void {
        $userId = Auth::userIdOrFail();
        $rbac = MultiTenantRBACService::getInstance();
        
        if (!$rbac->hasAgencyPermission($userId, $agencyId, 'billing.manage')) {
            Response::forbidden('Only agency owners can manage billing');
            return;
        }
        
        $body = get_json_body();
        $plan = $body['plan'] ?? null;
        $billingCycle = $body['billing_cycle'] ?? 'monthly';
        
        if (!$plan) {
            Response::error('Plan is required', 422);
            return;
        }
        
        $stripe = StripeService::getInstance();
        $success = $stripe->updateSubscription($agencyId, $plan, $billingCycle);
        
        if ($success) {
            Response::json(['success' => true, 'message' => 'Subscription updated']);
        } else {
            Response::error('Failed to update subscription', 500);
        }
    }
    
    /**
     * Cancel subscription
     * DELETE /mt/agencies/:id/billing/subscription
     */
    public static function cancelSubscription(int $agencyId): void {
        $userId = Auth::userIdOrFail();
        $rbac = MultiTenantRBACService::getInstance();
        
        if (!$rbac->hasAgencyPermission($userId, $agencyId, 'billing.manage')) {
            Response::forbidden('Only agency owners can manage billing');
            return;
        }
        
        $immediately = ($_GET['immediately'] ?? 'false') === 'true';
        
        $stripe = StripeService::getInstance();
        $success = $stripe->cancelSubscription($agencyId, $immediately);
        
        if ($success) {
            Response::json(['success' => true, 'message' => 'Subscription will be canceled']);
        } else {
            Response::error('Failed to cancel subscription', 500);
        }
    }
    
    // ========================================
    // USAGE
    // ========================================
    
    /**
     * Get usage for agency
     * GET /mt/agencies/:id/billing/usage
     */
    public static function getUsage(int $agencyId): void {
        $userId = Auth::userIdOrFail();
        $rbac = MultiTenantRBACService::getInstance();
        
        if (!$rbac->hasAgencyPermission($userId, $agencyId, 'billing.view')) {
            Response::forbidden('Access denied');
            return;
        }
        
        $year = (int)($_GET['year'] ?? date('Y'));
        $month = (int)($_GET['month'] ?? date('n'));
        
        $stripe = StripeService::getInstance();
        $usage = $stripe->getUsage($agencyId, $year, $month);
        
        Response::json($usage);
    }
    
    // ========================================
    // INVOICES
    // ========================================
    
    /**
     * Get invoices
     * GET /mt/agencies/:id/billing/invoices
     */
    public static function getInvoices(int $agencyId): void {
        $userId = Auth::userIdOrFail();
        $rbac = MultiTenantRBACService::getInstance();
        
        if (!$rbac->hasAgencyPermission($userId, $agencyId, 'billing.view')) {
            Response::forbidden('Access denied');
            return;
        }
        
        $limit = min((int)($_GET['limit'] ?? 20), 100);
        
        $stripe = StripeService::getInstance();
        $invoices = $stripe->getInvoices($agencyId, $limit);
        
        Response::json(['items' => $invoices]);
    }
    
    // ========================================
    // RESELLER PRICING
    // ========================================
    
    /**
     * Get reseller pricing config
     * GET /mt/agencies/:id/billing/reseller-pricing
     */
    public static function getResellerPricing(int $agencyId): void {
        $userId = Auth::userIdOrFail();
        $rbac = MultiTenantRBACService::getInstance();
        
        if (!$rbac->hasAgencyPermission($userId, $agencyId, 'billing.view')) {
            Response::forbidden('Access denied');
            return;
        }
        
        $stripe = StripeService::getInstance();
        $pricing = $stripe->getResellerPricing($agencyId);
        
        // Get available addons that can be resold
        $availableAddons = [
            ['key' => 'extra_subaccounts', 'name' => 'Additional Sub-Accounts', 'base_cost' => 2900],
            ['key' => 'extra_users', 'name' => 'Additional Team Members', 'base_cost' => 500],
            ['key' => 'email_credits_10k', 'name' => '10,000 Email Credits', 'base_cost' => 1500],
            ['key' => 'sms_credits_1k', 'name' => '1,000 SMS Credits', 'base_cost' => 2000],
            ['key' => 'whitelabel', 'name' => 'White-Label Branding', 'base_cost' => 9900],
            ['key' => 'priority_support', 'name' => 'Priority Support', 'base_cost' => 4900],
        ];
        
        Response::json([
            'pricing' => $pricing,
            'available_addons' => $availableAddons
        ]);
    }
    
    /**
     * Update reseller pricing
     * PUT /mt/agencies/:id/billing/reseller-pricing
     */
    public static function updateResellerPricing(int $agencyId): void {
        $userId = Auth::userIdOrFail();
        $rbac = MultiTenantRBACService::getInstance();
        
        if (!$rbac->hasAgencyPermission($userId, $agencyId, 'billing.manage')) {
            Response::forbidden('Only agency owners can configure reseller pricing');
            return;
        }
        
        $body = get_json_body();
        $pricing = $body['pricing'] ?? [];
        
        if (empty($pricing)) {
            Response::error('Pricing data is required', 422);
            return;
        }
        
        $stripe = StripeService::getInstance();
        $success = $stripe->setResellerPricing($agencyId, $pricing);
        
        if ($success) {
            Response::json(['success' => true]);
        } else {
            Response::error('Failed to update pricing', 500);
        }
    }
    
    // ========================================
    // WEBHOOKS
    // ========================================
    
    /**
     * Handle Stripe webhook
     * POST /webhooks/stripe
     */
    public static function handleWebhook(): void {
        $payload = file_get_contents('php://input');
        $signature = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
        
        $stripe = StripeService::getInstance();
        $result = $stripe->processWebhook($payload, $signature);
        
        if (isset($result['error'])) {
            Response::error($result['error'], 400);
            return;
        }
        
        Response::json($result);
    }
    
    // ========================================
    // PORTAL
    // ========================================
    
    /**
     * Create customer portal session
     * POST /mt/agencies/:id/billing/portal
     */
    public static function createPortalSession(int $agencyId): void {
        $userId = Auth::userIdOrFail();
        $rbac = MultiTenantRBACService::getInstance();
        
        if (!$rbac->hasAgencyPermission($userId, $agencyId, 'billing.manage')) {
            Response::forbidden('Access denied');
            return;
        }
        
        // Get customer ID
        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT stripe_customer_id FROM agency_subscriptions WHERE agency_id = ?');
        $stmt->execute([$agencyId]);
        $sub = $stmt->fetch();
        
        if (!$sub || !$sub['stripe_customer_id']) {
            Response::error('No billing account found', 404);
            return;
        }
        
        $secretKey = getenv('STRIPE_SECRET_KEY');
        if (!$secretKey) {
            // Demo mode
            Response::json([
                'portal_url' => '/agency/settings?tab=billing',
                'demo_mode' => true
            ]);
            return;
        }
        
        $returnUrl = getenv('APP_URL') . '/agency/settings?tab=billing';
        
        $ch = curl_init('https://api.stripe.com/v1/billing_portal/sessions');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_USERPWD => $secretKey . ':',
            CURLOPT_POSTFIELDS => http_build_query([
                'customer' => $sub['stripe_customer_id'],
                'return_url' => $returnUrl,
            ]),
        ]);
        $response = json_decode(curl_exec($ch), true);
        curl_close($ch);
        
        if (!isset($response['url'])) {
            Response::error('Failed to create portal session', 500);
            return;
        }
        
        Response::json(['portal_url' => $response['url']]);
    }
}
