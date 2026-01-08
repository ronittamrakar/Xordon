<?php

namespace App\Controllers;

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Auth.php';

use Xordon\Database;
use Auth;

class WalletController
{
    /**
     * Helper to get companyId with dev mode fallback
     */
    private static function getCompanyIdOrFail(): int
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $companyId = $ctx->activeCompanyId ?? null;
        
        if ($companyId) {
            return (int)$companyId;
        }
        
        // Dev mode: auto-create company if needed
        $appEnv = \Config::get('APP_ENV', 'development');
        if ($appEnv !== 'production') {
            $workspaceId = $ctx->workspaceId ?? 1;
            $userId = $ctx->userId ?? 1;
            $pdo = Database::conn();
            
            // Try to get existing company first
            $stmt = $pdo->prepare('SELECT id FROM companies WHERE workspace_id = ? LIMIT 1');
            $stmt->execute([$workspaceId]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            if ($row) {
                return (int)$row['id'];
            }
            
            // Create one
            $stmt = $pdo->prepare('INSERT INTO companies (workspace_id, user_id, name, status, is_client, created_at) VALUES (?, ?, ?, ?, 0, NOW())');
            $stmt->execute([$workspaceId, $userId, 'Development Company', 'active']);
            return (int)$pdo->lastInsertId();
        }
        
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Company required']);
        exit;
    }

    public static function getWallet(): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $companyId = self::getCompanyIdOrFail();

        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT * FROM credits_wallets WHERE company_id = :companyId AND workspace_id = :workspaceId');
        $stmt->execute(['companyId' => $companyId, 'workspaceId' => $workspaceId]);
        $wallet = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$wallet) {
            // Create wallet
            $stmt = $pdo->prepare('INSERT INTO credits_wallets (workspace_id, company_id, balance) VALUES (:workspaceId, :companyId, 0)');
            $stmt->execute(['workspaceId' => $workspaceId, 'companyId' => $companyId]);
            $wallet = ['id' => (int)$pdo->lastInsertId(), 'workspace_id' => $workspaceId, 'company_id' => $companyId, 'balance' => 0, 'lifetime_purchased' => 0, 'lifetime_spent' => 0, 'lifetime_refunded' => 0];
        }

        echo json_encode(['success' => true, 'data' => $wallet]);
    }

    public static function getTransactions(): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $companyId = self::getCompanyIdOrFail();

        $type = $_GET['type'] ?? null;
        $limit = min((int)($_GET['limit'] ?? 50), 100);
        $offset = (int)($_GET['offset'] ?? 0);

        $pdo = Database::conn();
        $sql = "SELECT ct.*, lr.title as lead_title FROM credit_transactions ct LEFT JOIN lead_requests lr ON lr.id = ct.lead_request_id WHERE ct.workspace_id = :workspaceId AND ct.company_id = :companyId";
        $params = ['workspaceId' => $workspaceId, 'companyId' => $companyId];

        if ($type) { $sql .= " AND ct.type = :type"; $params['type'] = $type; }
        $sql .= " ORDER BY ct.created_at DESC LIMIT :limit OFFSET :offset";
        $params['limit'] = $limit;
        $params['offset'] = $offset;

        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':workspaceId', $workspaceId, \PDO::PARAM_INT);
        $stmt->bindValue(':companyId', $companyId, \PDO::PARAM_INT);
        if ($type) { $stmt->bindValue(':type', $type, \PDO::PARAM_STR); }
        $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, \PDO::PARAM_INT);
        $stmt->execute();

        echo json_encode(['success' => true, 'data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)]);
    }

    public static function getCreditPackages(): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;

        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT * FROM credit_packages WHERE workspace_id = :workspaceId AND is_active = 1 ORDER BY sort_order ASC');
        $stmt->execute(['workspaceId' => $workspaceId]);

        echo json_encode(['success' => true, 'data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)]);
    }

    public static function createCheckout(): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $companyId = self::getCompanyIdOrFail();

        $data = json_decode(file_get_contents('php://input'), true);
        $provider = $data['provider'] ?? 'stripe';
        $packageId = $data['package_id'] ?? null;
        $amount = $data['amount'] ?? null;
        $promoCode = $data['promo_code'] ?? null;

        $pdo = Database::conn();

        // Get package or use custom amount
        $creditsAmount = 0;
        $price = 0;
        $bonusCredits = 0;

        if ($packageId) {
            $stmt = $pdo->prepare('SELECT * FROM credit_packages WHERE id = :id AND workspace_id = :workspaceId AND is_active = 1');
            $stmt->execute(['id' => $packageId, 'workspaceId' => $workspaceId]);
            $package = $stmt->fetch(\PDO::FETCH_ASSOC);
            if (!$package) { http_response_code(404); echo json_encode(['success' => false, 'error' => 'Package not found']); return; }
            $creditsAmount = $package['credits_amount'];
            $price = $package['price'];
            $bonusCredits = $package['bonus_credits'];
        } elseif ($amount && $amount >= 10) {
            $creditsAmount = $amount;
            $price = $amount;
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Package or amount required (min $10)']);
            return;
        }

        // Apply promo code
        if ($promoCode) {
            $stmt = $pdo->prepare('SELECT * FROM promo_codes WHERE workspace_id = :workspaceId AND code = :code AND is_active = 1 AND (valid_from IS NULL OR valid_from <= NOW()) AND (valid_until IS NULL OR valid_until >= NOW()) AND (max_uses IS NULL OR current_uses < max_uses)');
            $stmt->execute(['workspaceId' => $workspaceId, 'code' => $promoCode]);
            $promo = $stmt->fetch(\PDO::FETCH_ASSOC);
            if ($promo) {
                if ($promo['min_purchase'] && $price < $promo['min_purchase']) {
                    // Promo doesn't apply
                } else {
                    switch ($promo['discount_type']) {
                        case 'percent':
                            $price = $price * (1 - $promo['discount_value'] / 100);
                            break;
                        case 'fixed':
                            $price = max(0, $price - $promo['discount_value']);
                            break;
                        case 'credits':
                            $bonusCredits += $promo['discount_value'];
                            break;
                    }
                }
            }
        }

        $totalCredits = $creditsAmount + $bonusCredits;

        // Dev fallback: If payment keys are not configured, instantly add credits.
        // This enables UI testing without Stripe/PayPal setup.
        if ($provider === 'stripe' && !getenv('STRIPE_SECRET_KEY')) {
            $paymentId = 'dev_stripe_' . uniqid();
            self::addCredits($workspaceId, $companyId, $totalCredits, 'manual', $paymentId, $promoCode);
            $appUrl = getenv('APP_URL') ?: '';
            $checkoutUrl = rtrim($appUrl, '/') . '/lead-marketplace/wallet?success=1&dev=1';
            echo json_encode(['success' => true, 'data' => ['checkout_url' => $checkoutUrl, 'credits' => $totalCredits, 'price' => $price]]);
            return;
        }

        if ($provider === 'paypal' && (!getenv('PAYPAL_CLIENT_ID') || !getenv('PAYPAL_CLIENT_SECRET'))) {
            $paymentId = 'dev_paypal_' . uniqid();
            self::addCredits($workspaceId, $companyId, $totalCredits, 'manual', $paymentId, $promoCode);
            $appUrl = getenv('APP_URL') ?: '';
            $checkoutUrl = rtrim($appUrl, '/') . '/lead-marketplace/wallet?success=1&dev=1';
            echo json_encode(['success' => true, 'data' => ['checkout_url' => $checkoutUrl, 'credits' => $totalCredits, 'price' => $price]]);
            return;
        }

        // Create checkout session based on provider
        if ($provider === 'stripe') {
            $result = self::createStripeCheckout($workspaceId, $companyId, $price, $totalCredits, $packageId, $promoCode);
        } elseif ($provider === 'paypal') {
            $result = self::createPayPalCheckout($workspaceId, $companyId, $price, $totalCredits, $packageId, $promoCode);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid provider']);
            return;
        }

        $checkoutUrl = null;
        $checkoutError = null;
        if (is_array($result)) {
            $checkoutUrl = $result['url'] ?? null;
            $checkoutError = $result['error'] ?? null;
        } else {
            $checkoutUrl = $result;
        }

        if (!$checkoutUrl) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to create checkout' . ($checkoutError ? (': ' . $checkoutError) : '')]);
            return;
        }

        echo json_encode(['success' => true, 'data' => ['checkout_url' => $checkoutUrl, 'credits' => $totalCredits, 'price' => $price]]);
    }

    private static function createStripeCheckout($workspaceId, $companyId, $price, $credits, $packageId, $promoCode)
    {
        $stripeKey = getenv('STRIPE_SECRET_KEY');
        if (!$stripeKey) return ['url' => null, 'error' => 'Stripe key not configured'];

        $successUrl = getenv('APP_URL') . '/lead-marketplace/wallet?success=1&session_id={CHECKOUT_SESSION_ID}';
        $cancelUrl = getenv('APP_URL') . '/lead-marketplace/wallet?canceled=1';

        $payload = [
            'mode' => 'payment',
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'line_items' => [[
                'price_data' => [
                    'currency' => 'usd',
                    'unit_amount' => (int)($price * 100),
                    'product_data' => [
                        'name' => "Lead Credits ($credits credits)",
                        'description' => "Purchase $credits lead credits"
                    ]
                ],
                'quantity' => 1
            ]],
            'metadata' => [
                'workspace_id' => $workspaceId,
                'company_id' => $companyId,
                'credits' => $credits,
                'package_id' => $packageId,
                'promo_code' => $promoCode,
                'type' => 'lead_credits'
            ]
        ];

        $ch = curl_init('https://api.stripe.com/v1/checkout/sessions');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $stripeKey]);
        $response = curl_exec($ch);

        if ($response === false) {
            $err = curl_error($ch);
            curl_close($ch);
            error_log("Stripe checkout curl error: $err");
            return ['url' => null, 'error' => "Curl error: $err"];
        }

        $res = json_decode($response, true);
        if (isset($res['error'])) {
            error_log('Stripe checkout API error: ' . json_encode($res));
            return ['url' => null, 'error' => $res['error']['message'] ?? json_encode($res['error'])];
        }

        // Stripe may return the checkout URL under 'url' or require client-side redirect via session id
        if (!empty($res['url'])) {
            curl_close($ch);
            return ['url' => $res['url'], 'error' => null];
        }

        if (!empty($res['id'])) {
            // Return a redirect URL which client can use to call stripe.js, but provide session id for now
            curl_close($ch);
            $appUrl = getenv('APP_URL') ?: '';
            return ['url' => rtrim($appUrl, '/') . '/lead-marketplace/wallet?session_id=' . $res['id'] . '&stripe=1', 'error' => null];
        }

        error_log('Stripe checkout unexpected response: ' . $response);
        curl_close($ch);
        return ['url' => null, 'error' => 'Unexpected Stripe response'];
    }

    private static function createPayPalCheckout($workspaceId, $companyId, $price, $credits, $packageId, $promoCode)
    {
        $clientId = getenv('PAYPAL_CLIENT_ID');
        $clientSecret = getenv('PAYPAL_CLIENT_SECRET');
        if (!$clientId || !$clientSecret) return ['url' => null, 'error' => 'PayPal keys not configured'];

        $baseUrl = getenv('PAYPAL_SANDBOX') ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

        // Get access token
        $ch = curl_init("$baseUrl/v1/oauth2/token");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, 'grant_type=client_credentials');
        curl_setopt($ch, CURLOPT_USERPWD, "$clientId:$clientSecret");
        $tokenResponseRaw = curl_exec($ch);
        if ($tokenResponseRaw === false) {
            $err = curl_error($ch);
            curl_close($ch);
            error_log("PayPal token curl error: $err");
            return ['url' => null, 'error' => "Curl error: $err"];
        }
        $tokenResponse = json_decode($tokenResponseRaw, true);
        curl_close($ch);

        if (!isset($tokenResponse['access_token'])) {
            error_log('PayPal token error: ' . $tokenResponseRaw);
            return ['url' => null, 'error' => 'Failed to get PayPal access token'];
        }
        $accessToken = $tokenResponse['access_token'];

        $returnUrl = getenv('APP_URL') . '/lead-marketplace/wallet?paypal=success';
        $cancelUrl = getenv('APP_URL') . '/lead-marketplace/wallet?paypal=canceled';

        $payload = [
            'intent' => 'CAPTURE',
            'purchase_units' => [[
                'amount' => [
                    'currency_code' => 'USD',
                    'value' => number_format($price, 2, '.', '')
                ],
                'description' => "Lead Credits ($credits credits)",
                'custom_id' => json_encode(['workspace_id' => $workspaceId, 'company_id' => $companyId, 'credits' => $credits, 'package_id' => $packageId, 'promo_code' => $promoCode])
            ]],
            'application_context' => [
                'return_url' => $returnUrl,
                'cancel_url' => $cancelUrl
            ]
        ];

        $ch = curl_init("$baseUrl/v2/checkout/orders");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json'
        ]);
        $orderResponseRaw = curl_exec($ch);
        if ($orderResponseRaw === false) {
            $err = curl_error($ch);
            curl_close($ch);
            error_log("PayPal order curl error: $err");
            return ['url' => null, 'error' => "Curl error: $err"];
        }
        $orderResponse = json_decode($orderResponseRaw, true);
        curl_close($ch);

        foreach ($orderResponse['links'] ?? [] as $link) {
            if ($link['rel'] === 'approve') return ['url' => $link['href'], 'error' => null];
        }

        error_log('PayPal unexpected response: ' . $orderResponseRaw);
        return ['url' => null, 'error' => 'Unexpected PayPal response'];
    }

    public static function handleStripeWebhook(): void
    {
        $payload = file_get_contents('php://input');
        $event = json_decode($payload, true);

        if ($event['type'] !== 'checkout.session.completed') {
            echo json_encode(['success' => true, 'message' => 'Ignored']);
            return;
        }

        $session = $event['data']['object'];
        $metadata = $session['metadata'] ?? [];

        if (($metadata['type'] ?? '') !== 'lead_credits') {
            echo json_encode(['success' => true, 'message' => 'Not lead credits']);
            return;
        }

        $workspaceId = (int)$metadata['workspace_id'];
        $companyId = (int)$metadata['company_id'];
        $credits = (float)$metadata['credits'];
        $paymentId = $session['id'];

        self::addCredits($workspaceId, $companyId, $credits, 'stripe', $paymentId, $metadata['promo_code'] ?? null);

        echo json_encode(['success' => true]);
    }

    /**
     * Confirm a Stripe Checkout Session and add credits (useful when webhooks are not configured)
     */
    public static function confirmStripeSession(): void
    {
        $sessionId = $_GET['session_id'] ?? null;
        if (!$sessionId) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'session_id required']); return; }

        $stripeKey = getenv('STRIPE_SECRET_KEY');
        if (!$stripeKey) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'Stripe key not configured']); return; }

        $ch = curl_init('https://api.stripe.com/v1/checkout/sessions/' . urlencode($sessionId));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $stripeKey]);
        $response = curl_exec($ch);

        if ($response === false) {
            $err = curl_error($ch);
            curl_close($ch);
            error_log("Stripe session fetch error: $err");
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => "Failed to fetch Stripe session: $err"]);
            return;
        }

        $res = json_decode($response, true);
        curl_close($ch);

        if (isset($res['error'])) {
            error_log('Stripe session API error: ' . json_encode($res));
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $res['error']['message'] ?? 'Stripe API error']);
            return;
        }

        // Check metadata and payment status
        $metadata = $res['metadata'] ?? [];
        if (($metadata['type'] ?? '') !== 'lead_credits') { http_response_code(400); echo json_encode(['success' => false, 'error' => 'Not lead credits']); return; }

        // Consider paid if payment_status is 'paid' or status is 'complete'
        $paid = ($res['payment_status'] ?? '') === 'paid' || ($res['status'] ?? '') === 'complete';
        if (!$paid) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'Payment not completed']); return; }

        $workspaceId = (int)$metadata['workspace_id'];
        $companyId = (int)$metadata['company_id'];
        $credits = (float)$metadata['credits'];
        $paymentId = $res['id'] ?? $sessionId;

        self::addCredits($workspaceId, $companyId, $credits, 'stripe', $paymentId, $metadata['promo_code'] ?? null);

        echo json_encode(['success' => true, 'message' => 'Credits added']);
    }

    public static function handlePayPalWebhook(): void
    {
        $payload = json_decode(file_get_contents('php://input'), true);

        if (($payload['event_type'] ?? '') !== 'CHECKOUT.ORDER.APPROVED') {
            echo json_encode(['success' => true, 'message' => 'Ignored']);
            return;
        }

        $resource = $payload['resource'] ?? [];
        $customId = $resource['purchase_units'][0]['custom_id'] ?? null;
        if (!$customId) {
            echo json_encode(['success' => true, 'message' => 'No custom_id']);
            return;
        }

        $meta = json_decode($customId, true);
        $workspaceId = (int)$meta['workspace_id'];
        $companyId = (int)$meta['company_id'];
        $credits = (float)$meta['credits'];
        $paymentId = $resource['id'];

        self::addCredits($workspaceId, $companyId, $credits, 'paypal', $paymentId, $meta['promo_code'] ?? null);

        echo json_encode(['success' => true]);
    }

    private static function addCredits($workspaceId, $companyId, $credits, $provider, $paymentId, $promoCode): void
    {
        $pdo = Database::conn();

        // Check for duplicate
        $stmt = $pdo->prepare('SELECT id FROM credit_transactions WHERE payment_id = :paymentId AND payment_provider = :provider LIMIT 1');
        $stmt->execute(['paymentId' => $paymentId, 'provider' => $provider]);
        if ($stmt->fetch(\PDO::FETCH_ASSOC)) return;

        // Get or create wallet
        $stmt = $pdo->prepare('SELECT * FROM credits_wallets WHERE company_id = :companyId AND workspace_id = :workspaceId');
        $stmt->execute(['companyId' => $companyId, 'workspaceId' => $workspaceId]);
        $wallet = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$wallet) {
            $stmt = $pdo->prepare('INSERT INTO credits_wallets (workspace_id, company_id, balance) VALUES (:workspaceId, :companyId, 0)');
            $stmt->execute(['workspaceId' => $workspaceId, 'companyId' => $companyId]);
            $walletId = (int)$pdo->lastInsertId();
            $balanceBefore = 0;
        } else {
            $walletId = (int)$wallet['id'];
            $balanceBefore = (float)$wallet['balance'];
        }

        $newBalance = $balanceBefore + (float)$credits;

        // Update wallet
        $stmt = $pdo->prepare('UPDATE credits_wallets SET balance = :balance, lifetime_purchased = lifetime_purchased + :credits, last_purchase_at = NOW() WHERE id = :walletId');
        $stmt->execute(['balance' => $newBalance, 'credits' => $credits, 'walletId' => $walletId]);

        // Create transaction
        $stmt = $pdo->prepare('INSERT INTO credit_transactions (workspace_id, company_id, wallet_id, type, amount, balance_before, balance_after, payment_provider, payment_id, payment_status, promo_code, description) VALUES (:workspaceId, :companyId, :walletId, "purchase", :amount, :before, :after, :provider, :paymentId, "completed", :promoCode, "Credits purchase")');
        $stmt->execute([
            'workspaceId' => $workspaceId,
            'companyId' => $companyId,
            'walletId' => $walletId,
            'amount' => $credits,
            'before' => $balanceBefore,
            'after' => $newBalance,
            'provider' => $provider,
            'paymentId' => $paymentId,
            'promoCode' => $promoCode,
        ]);

        // Update promo code usage
        if ($promoCode) {
            $stmt = $pdo->prepare('UPDATE promo_codes SET current_uses = current_uses + 1 WHERE workspace_id = :workspaceId AND code = :code');
            $stmt->execute(['workspaceId' => $workspaceId, 'code' => $promoCode]);
        }
    }

    public static function addManualCredits(): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;

        $data = json_decode(file_get_contents('php://input'), true);
        $companyId = $data['company_id'] ?? null;
        $amount = $data['amount'] ?? 0;
        $type = $data['type'] ?? 'adjustment';
        $description = $data['description'] ?? 'Manual adjustment';

        if (!$companyId || !$amount) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'company_id and amount required']);
            return;
        }

        $pdo = Database::conn();

        // Get or create wallet
        $stmt = $pdo->prepare('SELECT * FROM credits_wallets WHERE company_id = :companyId AND workspace_id = :workspaceId');
        $stmt->execute(['companyId' => $companyId, 'workspaceId' => $workspaceId]);
        $wallet = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$wallet) {
            $stmt = $pdo->prepare('INSERT INTO credits_wallets (workspace_id, company_id, balance) VALUES (:workspaceId, :companyId, 0)');
            $stmt->execute(['workspaceId' => $workspaceId, 'companyId' => $companyId]);
            $walletId = (int)$pdo->lastInsertId();
            $balanceBefore = 0;
        } else {
            $walletId = (int)$wallet['id'];
            $balanceBefore = (float)$wallet['balance'];
        }

        $newBalance = $balanceBefore + $amount;

        $stmt = $pdo->prepare('UPDATE credits_wallets SET balance = :balance WHERE id = :walletId');
        $stmt->execute(['balance' => $newBalance, 'walletId' => $walletId]);

        $stmt = $pdo->prepare('INSERT INTO credit_transactions (workspace_id, company_id, wallet_id, type, amount, balance_before, balance_after, description, created_by) VALUES (:workspaceId, :companyId, :walletId, :type, :amount, :before, :after, :description, :createdBy)');
        $userId = Auth::userId();
        $stmt->execute([
            'workspaceId' => $workspaceId,
            'companyId' => $companyId,
            'walletId' => $walletId,
            'type' => $type,
            'amount' => $amount,
            'before' => $balanceBefore,
            'after' => $newBalance,
            'description' => $description,
            'createdBy' => $userId,
        ]);

        echo json_encode(['success' => true, 'data' => ['balance_after' => $newBalance]]);
    }

    // ==================== PRICING RULES ====================

    public static function getPricingRules(): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;

        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT pr.*, sc.name as service_name FROM lead_pricing_rules pr LEFT JOIN service_catalog sc ON sc.id = pr.service_id WHERE pr.workspace_id = :workspaceId ORDER BY pr.priority DESC, pr.id ASC');
        $stmt->execute(['workspaceId' => $workspaceId]);

        echo json_encode(['success' => true, 'data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)]);
    }

    public static function createPricingRule(): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $data = json_decode(file_get_contents('php://input'), true);

        $basePrice = $data['base_price'] ?? 25.00;
        if ($basePrice < 0) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'Invalid price']); return; }

        $pdo = Database::conn();
        $stmt = $pdo->prepare('INSERT INTO lead_pricing_rules (workspace_id, name, service_id, region, postal_code, city, timing, budget_min, budget_max, property_type, is_exclusive, base_price, surge_multiplier, exclusive_multiplier, priority, is_active) VALUES (:workspaceId, :name, :serviceId, :region, :postal, :city, :timing, :budgetMin, :budgetMax, :propType, :isExclusive, :basePrice, :surge, :exclusive, :priority, :isActive)');

        $stmt->execute([
            'workspaceId' => $workspaceId,
            'name' => $data['name'] ?? null,
            'serviceId' => $data['service_id'] ?? null,
            'region' => $data['region'] ?? null,
            'postal' => $data['postal_code'] ?? null,
            'city' => $data['city'] ?? null,
            'timing' => $data['timing'] ?? null,
            'budgetMin' => $data['budget_min'] ?? null,
            'budgetMax' => $data['budget_max'] ?? null,
            'propType' => $data['property_type'] ?? null,
            'isExclusive' => isset($data['is_exclusive']) ? ($data['is_exclusive'] ? 1 : 0) : null,
            'basePrice' => $basePrice,
            'surge' => $data['surge_multiplier'] ?? 1.0,
            'exclusive' => $data['exclusive_multiplier'] ?? 3.0,
            'priority' => $data['priority'] ?? 0,
            'isActive' => ($data['is_active'] ?? true) ? 1 : 0,
        ]);

        echo json_encode(['success' => true, 'data' => ['id' => (int)$pdo->lastInsertId()]]);
    }

    public static function updatePricingRule(int $id): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $data = json_decode(file_get_contents('php://input'), true);

        $allowed = ['name', 'service_id', 'region', 'postal_code', 'city', 'timing', 'budget_min', 'budget_max', 'property_type', 'is_exclusive', 'base_price', 'surge_multiplier', 'exclusive_multiplier', 'priority', 'is_active'];
        $fields = [];
        $params = ['id' => $id, 'workspaceId' => $workspaceId];

        foreach ($allowed as $f) {
            if (array_key_exists($f, $data)) {
                $fields[] = "$f = :$f";
                $params[$f] = $data[$f];
            }
        }

        if (empty($fields)) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'No fields']); return; }

        $pdo = Database::conn();
        $stmt = $pdo->prepare('UPDATE lead_pricing_rules SET ' . implode(', ', $fields) . ' WHERE id = :id AND workspace_id = :workspaceId');
        echo json_encode(['success' => $stmt->execute($params)]);
    }

    public static function deletePricingRule(int $id): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;

        $pdo = Database::conn();
        $stmt = $pdo->prepare('DELETE FROM lead_pricing_rules WHERE id = :id AND workspace_id = :workspaceId');
        echo json_encode(['success' => $stmt->execute(['id' => $id, 'workspaceId' => $workspaceId])]);
    }

    // ==================== PROMO CODES ====================

    public static function getPromoCodes(): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;

        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT * FROM promo_codes WHERE workspace_id = :workspaceId ORDER BY created_at DESC');
        $stmt->execute(['workspaceId' => $workspaceId]);

        echo json_encode(['success' => true, 'data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)]);
    }

    public static function createPromoCode(): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $data = json_decode(file_get_contents('php://input'), true);

        $code = strtoupper(trim($data['code'] ?? ''));
        if (empty($code)) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'Code required']); return; }

        $pdo = Database::conn();
        $stmt = $pdo->prepare('INSERT INTO promo_codes (workspace_id, code, description, discount_type, discount_value, min_purchase, max_uses, max_uses_per_user, valid_from, valid_until, is_active) VALUES (:workspaceId, :code, :description, :discountType, :discountValue, :minPurchase, :maxUses, :maxUsesPerUser, :validFrom, :validUntil, :isActive)');

        $stmt->execute([
            'workspaceId' => $workspaceId,
            'code' => $code,
            'description' => $data['description'] ?? null,
            'discountType' => $data['discount_type'] ?? 'percent',
            'discountValue' => $data['discount_value'] ?? 0,
            'minPurchase' => $data['min_purchase'] ?? null,
            'maxUses' => $data['max_uses'] ?? null,
            'maxUsesPerUser' => $data['max_uses_per_user'] ?? 1,
            'validFrom' => $data['valid_from'] ?? null,
            'validUntil' => $data['valid_until'] ?? null,
            'isActive' => ($data['is_active'] ?? true) ? 1 : 0,
        ]);

        echo json_encode(['success' => true, 'data' => ['id' => (int)$pdo->lastInsertId()]]);
    }

    public static function validatePromoCode(): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $code = $_GET['code'] ?? '';

        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT * FROM promo_codes WHERE workspace_id = :workspaceId AND code = :code AND is_active = 1 AND (valid_from IS NULL OR valid_from <= NOW()) AND (valid_until IS NULL OR valid_until >= NOW()) AND (max_uses IS NULL OR current_uses < max_uses)');
        $stmt->execute(['workspaceId' => $workspaceId, 'code' => $code]);
        $promo = $stmt->fetch(\PDO::FETCH_ASSOC);

        if ($promo) {
            echo json_encode(['success' => true, 'data' => ['valid' => true, 'discount_type' => $promo['discount_type'], 'discount_value' => $promo['discount_value'], 'min_purchase' => $promo['min_purchase']]]);
        } else {
            echo json_encode(['success' => true, 'data' => ['valid' => false]]);
        }
    }
}
