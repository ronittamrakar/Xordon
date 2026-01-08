<?php
/**
 * Stripe Controller
 * Handle Stripe payments, subscriptions, and payment links
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class StripeController {
    private static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        throw new Exception('Workspace context required');
    }

    private static function getStripeSecretKey(): ?string {
        // Get from integrations or environment
        $workspaceId = self::getWorkspaceId();
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT credentials_encrypted FROM integrations WHERE workspace_id = ? AND provider = 'stripe' AND status = 'connected'");
        $stmt->execute([$workspaceId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($row && $row['credentials_encrypted']) {
            $key = getenv('APP_KEY') ?: 'default-encryption-key-change-me';
            $data = base64_decode($row['credentials_encrypted']);
            $iv = substr($data, 0, 16);
            $encrypted = substr($data, 16);
            $decrypted = openssl_decrypt($encrypted, 'AES-256-CBC', $key, 0, $iv);
            $credentials = json_decode($decrypted, true);
            return $credentials['stripe_user_id'] ?? $credentials['access_token'] ?? null;
        }
        
        return getenv('STRIPE_SECRET_KEY') ?: null;
    }

    // ==================== ACCOUNT ====================

    /**
     * Get Stripe account status
     */
    public static function getAccountStatus() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("SELECT * FROM stripe_accounts WHERE workspace_id = ?");
            $stmt->execute([$workspaceId]);
            $account = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$account) {
                return Response::json(['data' => ['connected' => false]]);
            }

            return Response::json([
                'data' => [
                    'connected' => $account['status'] === 'connected',
                    'status' => $account['status'],
                    'charges_enabled' => (bool)$account['charges_enabled'],
                    'payouts_enabled' => (bool)$account['payouts_enabled'],
                    'default_currency' => $account['default_currency'],
                    'connected_at' => $account['connected_at']
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to get account status: ' . $e->getMessage());
        }
    }

    // ==================== PAYMENTS ====================

    /**
     * List payments
     */
    public static function listPayments() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $limit = min((int)($_GET['limit'] ?? 50), 100);
            $offset = (int)($_GET['offset'] ?? 0);

            $where = ['workspace_id = ?'];
            $params = [$workspaceId];

            if (!empty($_GET['status'])) {
                $where[] = 'status = ?';
                $params[] = $_GET['status'];
            }

            if (!empty($_GET['contact_id'])) {
                $where[] = 'contact_id = ?';
                $params[] = (int)$_GET['contact_id'];
            }

            $whereClause = implode(' AND ', $where);

            $stmt = $db->prepare("
                SELECT p.*, c.first_name, c.last_name, c.email as contact_email
                FROM payments p
                LEFT JOIN contacts c ON c.id = p.contact_id
                WHERE $whereClause
                ORDER BY p.created_at DESC
                LIMIT ? OFFSET ?
            ");
            $params[] = $limit;
            $params[] = $offset;
            $stmt->execute($params);
            $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($payments as &$p) {
                $p['metadata'] = $p['metadata'] ? json_decode($p['metadata'], true) : null;
            }

            // Get totals
            $countParams = array_slice($params, 0, -2);
            $countStmt = $db->prepare("SELECT COUNT(*), SUM(amount) FROM payments WHERE $whereClause");
            $countStmt->execute($countParams);
            $totals = $countStmt->fetch(PDO::FETCH_NUM);

            return Response::json([
                'data' => $payments,
                'meta' => [
                    'total' => (int)$totals[0],
                    'total_amount' => (float)($totals[1] ?? 0),
                    'limit' => $limit,
                    'offset' => $offset
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to list payments: ' . $e->getMessage());
        }
    }

    /**
     * Get single payment
     */
    public static function getPayment($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT p.*, c.first_name, c.last_name, c.email as contact_email
                FROM payments p
                LEFT JOIN contacts c ON c.id = p.contact_id
                WHERE p.id = ? AND p.workspace_id = ?
            ");
            $stmt->execute([$id, $workspaceId]);
            $payment = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$payment) {
                return Response::error('Payment not found', 404);
            }

            $payment['metadata'] = $payment['metadata'] ? json_decode($payment['metadata'], true) : null;

            // Get refunds
            $refundsStmt = $db->prepare("SELECT * FROM refunds WHERE payment_id = ? ORDER BY created_at DESC");
            $refundsStmt->execute([$id]);
            $payment['refunds'] = $refundsStmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $payment]);
        } catch (Exception $e) {
            return Response::error('Failed to get payment: ' . $e->getMessage());
        }
    }

    /**
     * Create payment intent
     */
    public static function createPaymentIntent() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['amount'])) {
                return Response::error('amount required', 400);
            }

            $stripeKey = self::getStripeSecretKey();
            if (!$stripeKey) {
                return Response::error('Stripe not configured', 400);
            }

            // Create payment record
            $stmt = $db->prepare("
                INSERT INTO payments 
                (workspace_id, contact_id, invoice_id, amount, currency, status, description, metadata)
                VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $data['contact_id'] ?? null,
                $data['invoice_id'] ?? null,
                $data['amount'],
                $data['currency'] ?? 'USD',
                $data['description'] ?? null,
                isset($data['metadata']) ? json_encode($data['metadata']) : null
            ]);
            $paymentId = $db->lastInsertId();

            // Create Stripe PaymentIntent
            $stripeData = [
                'amount' => (int)($data['amount'] * 100), // Convert to cents
                'currency' => strtolower($data['currency'] ?? 'usd'),
                'metadata' => [
                    'workspace_id' => $workspaceId,
                    'payment_id' => $paymentId,
                    'contact_id' => $data['contact_id'] ?? '',
                    'invoice_id' => $data['invoice_id'] ?? ''
                ]
            ];

            if (!empty($data['customer_id'])) {
                $stripeData['customer'] = $data['customer_id'];
            }

            $ch = curl_init('https://api.stripe.com/v1/payment_intents');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($stripeData));
            curl_setopt($ch, CURLOPT_USERPWD, $stripeKey . ':');
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            $result = json_decode($response, true);

            if ($httpCode !== 200) {
                return Response::error('Stripe error: ' . ($result['error']['message'] ?? 'Unknown error'), 400);
            }

            // Update payment with Stripe ID
            $db->prepare("UPDATE payments SET stripe_payment_intent_id = ?, status = 'processing' WHERE id = ?")
                ->execute([$result['id'], $paymentId]);

            return Response::json([
                'data' => [
                    'payment_id' => (int)$paymentId,
                    'client_secret' => $result['client_secret'],
                    'payment_intent_id' => $result['id']
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to create payment intent: ' . $e->getMessage());
        }
    }

    /**
     * Process refund
     */
    public static function refund($paymentId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Get payment
            $stmt = $db->prepare("SELECT * FROM payments WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$paymentId, $workspaceId]);
            $payment = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$payment) {
                return Response::error('Payment not found', 404);
            }

            if ($payment['status'] !== 'succeeded') {
                return Response::error('Can only refund succeeded payments', 400);
            }

            $refundAmount = $data['amount'] ?? $payment['amount'];
            if ($refundAmount > $payment['amount']) {
                return Response::error('Refund amount exceeds payment amount', 400);
            }

            $stripeKey = self::getStripeSecretKey();
            if (!$stripeKey || !$payment['stripe_payment_intent_id']) {
                // Manual refund (no Stripe)
                $stmt = $db->prepare("
                    INSERT INTO refunds (workspace_id, payment_id, amount, status, reason, notes, processed_by)
                    VALUES (?, ?, ?, 'succeeded', ?, ?, ?)
                ");
                $stmt->execute([
                    $workspaceId,
                    $paymentId,
                    $refundAmount,
                    $data['reason'] ?? null,
                    $data['notes'] ?? null,
                    $userId
                ]);

                // Update payment status
                $newStatus = $refundAmount >= $payment['amount'] ? 'refunded' : 'partially_refunded';
                $db->prepare("UPDATE payments SET status = ?, refunded_at = NOW() WHERE id = ?")
                    ->execute([$newStatus, $paymentId]);

                return Response::json(['data' => ['refund_id' => (int)$db->lastInsertId()]]);
            }

            // Stripe refund
            $stripeData = [
                'payment_intent' => $payment['stripe_payment_intent_id'],
                'amount' => (int)($refundAmount * 100)
            ];

            if (!empty($data['reason'])) {
                $stripeData['reason'] = $data['reason'];
            }

            $ch = curl_init('https://api.stripe.com/v1/refunds');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($stripeData));
            curl_setopt($ch, CURLOPT_USERPWD, $stripeKey . ':');
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            $result = json_decode($response, true);

            if ($httpCode !== 200) {
                return Response::error('Stripe error: ' . ($result['error']['message'] ?? 'Unknown error'), 400);
            }

            // Record refund
            $stmt = $db->prepare("
                INSERT INTO refunds (workspace_id, payment_id, stripe_refund_id, amount, status, reason, notes, processed_by)
                VALUES (?, ?, ?, ?, 'succeeded', ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $paymentId,
                $result['id'],
                $refundAmount,
                $data['reason'] ?? null,
                $data['notes'] ?? null,
                $userId
            ]);

            // Update payment status
            $newStatus = $refundAmount >= $payment['amount'] ? 'refunded' : 'partially_refunded';
            $db->prepare("UPDATE payments SET status = ?, stripe_refund_id = ?, refunded_at = NOW() WHERE id = ?")
                ->execute([$newStatus, $result['id'], $paymentId]);

            return Response::json(['data' => ['refund_id' => (int)$db->lastInsertId(), 'stripe_refund_id' => $result['id']]]);
        } catch (Exception $e) {
            return Response::error('Failed to process refund: ' . $e->getMessage());
        }
    }

    // ==================== PAYMENT LINKS ====================

    /**
     * List payment links
     */
    public static function listPaymentLinks() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT * FROM payment_links 
                WHERE workspace_id = ?
                ORDER BY created_at DESC
            ");
            $stmt->execute([$workspaceId]);
            $links = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $links]);
        } catch (Exception $e) {
            return Response::error('Failed to list payment links: ' . $e->getMessage());
        }
    }

    /**
     * Create payment link
     */
    public static function createPaymentLink() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['name'])) {
                return Response::error('name required', 400);
            }

            // Generate URL slug
            $slug = $data['url_slug'] ?? strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $data['name']));
            $slug = substr($slug, 0, 50);

            // Check uniqueness
            $checkStmt = $db->prepare("SELECT id FROM payment_links WHERE workspace_id = ? AND url_slug = ?");
            $checkStmt->execute([$workspaceId, $slug]);
            if ($checkStmt->fetch()) {
                $slug .= '-' . substr(uniqid(), -4);
            }

            $stmt = $db->prepare("
                INSERT INTO payment_links 
                (workspace_id, name, description, amount, currency, allow_custom_amount, 
                 min_amount, max_amount, product_id, service_id, url_slug, expires_at, 
                 max_uses, success_url, cancel_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $workspaceId,
                $data['name'],
                $data['description'] ?? null,
                $data['amount'] ?? null,
                $data['currency'] ?? 'USD',
                $data['allow_custom_amount'] ?? 0,
                $data['min_amount'] ?? null,
                $data['max_amount'] ?? null,
                $data['product_id'] ?? null,
                $data['service_id'] ?? null,
                $slug,
                $data['expires_at'] ?? null,
                $data['max_uses'] ?? null,
                $data['success_url'] ?? null,
                $data['cancel_url'] ?? null
            ]);

            $id = $db->lastInsertId();

            return Response::json([
                'data' => [
                    'id' => (int)$id,
                    'url_slug' => $slug,
                    'url' => '/pay/' . $slug
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to create payment link: ' . $e->getMessage());
        }
    }

    /**
     * Update payment link
     */
    public static function updatePaymentLink($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $updates = [];
            $params = [];

            $allowedFields = [
                'name', 'description', 'amount', 'currency', 'allow_custom_amount',
                'min_amount', 'max_amount', 'is_active', 'expires_at', 'max_uses',
                'success_url', 'cancel_url'
            ];

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }

            if (empty($updates)) {
                return Response::error('No valid fields to update', 400);
            }

            $params[] = $id;
            $params[] = $workspaceId;
            $stmt = $db->prepare("UPDATE payment_links SET " . implode(', ', $updates) . " WHERE id = ? AND workspace_id = ?");
            $stmt->execute($params);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to update payment link: ' . $e->getMessage());
        }
    }

    /**
     * Delete payment link
     */
    public static function deletePaymentLink($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("DELETE FROM payment_links WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete payment link: ' . $e->getMessage());
        }
    }

    // ==================== SUBSCRIPTIONS ====================

    /**
     * List subscriptions
     */
    public static function listSubscriptions() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT s.*, c.first_name, c.last_name, c.email as contact_email
                FROM subscriptions s
                LEFT JOIN contacts c ON c.id = s.contact_id
                WHERE s.workspace_id = ?
                ORDER BY s.created_at DESC
            ");
            $stmt->execute([$workspaceId]);
            $subscriptions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($subscriptions as &$s) {
                $s['metadata'] = $s['metadata'] ? json_decode($s['metadata'], true) : null;
            }

            return Response::json(['data' => $subscriptions]);
        } catch (Exception $e) {
            return Response::error('Failed to list subscriptions: ' . $e->getMessage());
        }
    }

    /**
     * Cancel subscription
     */
    public static function cancelSubscription($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $stmt = $db->prepare("SELECT * FROM subscriptions WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $subscription = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$subscription) {
                return Response::error('Subscription not found', 404);
            }

            $cancelAtPeriodEnd = $data['cancel_at_period_end'] ?? true;

            $stripeKey = self::getStripeSecretKey();
            if ($stripeKey && $subscription['stripe_subscription_id']) {
                // Cancel in Stripe
                $ch = curl_init('https://api.stripe.com/v1/subscriptions/' . $subscription['stripe_subscription_id']);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
                if ($cancelAtPeriodEnd) {
                    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query(['cancel_at_period_end' => 'true']));
                }
                curl_setopt($ch, CURLOPT_USERPWD, $stripeKey . ':');
                curl_exec($ch);
                curl_close($ch);
            }

            // Update local record
            $newStatus = $cancelAtPeriodEnd ? $subscription['status'] : 'cancelled';
            $stmt = $db->prepare("
                UPDATE subscriptions 
                SET status = ?, cancel_at_period_end = ?, cancelled_at = NOW() 
                WHERE id = ?
            ");
            $stmt->execute([$newStatus, $cancelAtPeriodEnd ? 1 : 0, $id]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to cancel subscription: ' . $e->getMessage());
        }
    }

    // ==================== WEBHOOK ====================

    /**
     * Handle Stripe webhook
     */
    public static function handleWebhook() {
        try {
            $payload = file_get_contents('php://input');
            $event = json_decode($payload, true);

            if (!$event || empty($event['type'])) {
                return Response::error('Invalid webhook payload', 400);
            }

            $db = Database::conn();

            switch ($event['type']) {
                case 'payment_intent.succeeded':
                    $paymentIntent = $event['data']['object'];
                    $db->prepare("
                        UPDATE payments 
                        SET status = 'succeeded', 
                            stripe_charge_id = ?,
                            paid_at = NOW(),
                            receipt_url = ?
                        WHERE stripe_payment_intent_id = ?
                    ")->execute([
                        $paymentIntent['latest_charge'] ?? null,
                        $paymentIntent['charges']['data'][0]['receipt_url'] ?? null,
                        $paymentIntent['id']
                    ]);
                    break;

                case 'payment_intent.payment_failed':
                    $paymentIntent = $event['data']['object'];
                    $db->prepare("
                        UPDATE payments 
                        SET status = 'failed', 
                            failure_reason = ?
                        WHERE stripe_payment_intent_id = ?
                    ")->execute([
                        $paymentIntent['last_payment_error']['message'] ?? 'Payment failed',
                        $paymentIntent['id']
                    ]);
                    break;

                case 'customer.subscription.updated':
                case 'customer.subscription.deleted':
                    $subscription = $event['data']['object'];
                    $status = $subscription['status'];
                    if ($event['type'] === 'customer.subscription.deleted') {
                        $status = 'cancelled';
                    }
                    
                    // Update legacy subscriptions table if exists
                    $db->prepare("
                        UPDATE subscriptions 
                        SET status = ?,
                            current_period_start = FROM_UNIXTIME(?),
                            current_period_end = FROM_UNIXTIME(?),
                            cancel_at_period_end = ?
                        WHERE stripe_subscription_id = ?
                    ")->execute([
                        $status,
                        $subscription['current_period_start'],
                        $subscription['current_period_end'],
                        $subscription['cancel_at_period_end'] ? 1 : 0,
                        $subscription['id']
                    ]);

                    // Update new customer_subscriptions table
                    $db->prepare("
                        UPDATE customer_subscriptions 
                        SET status = ?,
                            next_billing_date = FROM_UNIXTIME(?),
                            cancel_at_period_end = ?
                        WHERE stripe_subscription_id = ?
                    ")->execute([
                        $status,
                        $subscription['current_period_end'], // next billing is usually period end for active subs
                        $subscription['cancel_at_period_end'] ? 1 : 0,
                        $subscription['id']
                    ]);
                    break;
                
                case 'invoice.payment_succeeded':
                    $invoice = $event['data']['object'];
                    if (!$invoice['subscription']) break;
                    
                    // find subscription
                    $subStmt = $db->prepare("SELECT id, workspace_id FROM customer_subscriptions WHERE stripe_subscription_id = ?");
                    $subStmt->execute([$invoice['subscription']]);
                    $sub = $subStmt->fetch(PDO::FETCH_ASSOC);
                    
                    if ($sub) {
                        // Record in subscription_billing_history
                        $db->prepare("
                            INSERT INTO subscription_billing_history 
                            (workspace_id, subscription_id, invoice_id, amount, currency, status, transaction_id)
                            VALUES (?, ?, ?, ?, ?, 'success', ?)
                        ")->execute([
                            $sub['workspace_id'],
                            $sub['id'],
                            null, // internal invoice id not linked yet
                            $invoice['amount_paid'] / 100,
                            strtoupper($invoice['currency']),
                            $invoice['payment_intent']
                        ]);

                        // Update next billing date
                         $db->prepare("
                            UPDATE customer_subscriptions 
                            SET next_billing_date = FROM_UNIXTIME(?), status = 'active'
                            WHERE id = ?
                        ")->execute([
                            $invoice['lines']['data'][0]['period']['end'],
                            $sub['id']
                        ]);
                    }
                    break;

                case 'invoice.payment_failed':
                    $invoice = $event['data']['object'];
                    if (!$invoice['subscription']) break;
                     // find subscription
                    $subStmt = $db->prepare("SELECT id, workspace_id FROM customer_subscriptions WHERE stripe_subscription_id = ?");
                    $subStmt->execute([$invoice['subscription']]);
                    $sub = $subStmt->fetch(PDO::FETCH_ASSOC);
                     if ($sub) {
                        $db->prepare("
                            INSERT INTO subscription_billing_history 
                            (workspace_id, subscription_id, amount, currency, status, error_message)
                            VALUES (?, ?, ?, ?, 'failed', ?)
                        ")->execute([
                            $sub['workspace_id'],
                            $sub['id'],
                            $invoice['amount_due'] / 100,
                            strtoupper($invoice['currency']),
                            $invoice['last_payment_error']['message'] ?? 'Payment failed'
                        ]);
                         // Update status
                         $db->prepare("UPDATE customer_subscriptions SET status = 'past_due' WHERE id = ?")->execute([$sub['id']]);
                     }
                    break;
            }

            return Response::json(['received' => true]);
        } catch (Exception $e) {
            error_log('Stripe webhook error: ' . $e->getMessage());
            return Response::error('Webhook processing failed', 500);
        }
    }

    // ==================== ANALYTICS ====================

    /**
     * Get payment analytics
     */
    public static function getAnalytics() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $from = $_GET['from'] ?? date('Y-m-d', strtotime('-30 days'));
            $to = $_GET['to'] ?? date('Y-m-d');

            // Summary
            $summaryStmt = $db->prepare("
                SELECT 
                    COUNT(*) as total_payments,
                    SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END) as successful_payments,
                    SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END) as total_revenue,
                    SUM(CASE WHEN status = 'refunded' OR status = 'partially_refunded' THEN 1 ELSE 0 END) as refunded_count,
                    AVG(CASE WHEN status = 'succeeded' THEN amount ELSE NULL END) as avg_payment
                FROM payments
                WHERE workspace_id = ? AND created_at BETWEEN ? AND ?
            ");
            $summaryStmt->execute([$workspaceId, $from, $to . ' 23:59:59']);
            $summary = $summaryStmt->fetch(PDO::FETCH_ASSOC);

            // Daily trend
            $trendStmt = $db->prepare("
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as count,
                    SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END) as revenue
                FROM payments
                WHERE workspace_id = ? AND created_at BETWEEN ? AND ?
                GROUP BY DATE(created_at)
                ORDER BY date
            ");
            $trendStmt->execute([$workspaceId, $from, $to . ' 23:59:59']);
            $trend = $trendStmt->fetchAll(PDO::FETCH_ASSOC);

            // By status
            $byStatusStmt = $db->prepare("
                SELECT status, COUNT(*) as count, SUM(amount) as total
                FROM payments
                WHERE workspace_id = ? AND created_at BETWEEN ? AND ?
                GROUP BY status
            ");
            $byStatusStmt->execute([$workspaceId, $from, $to . ' 23:59:59']);
            $byStatus = $byStatusStmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json([
                'data' => [
                    'summary' => $summary,
                    'daily_trend' => $trend,
                    'by_status' => $byStatus,
                    'period' => ['from' => $from, 'to' => $to]
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to get analytics: ' . $e->getMessage());
        }
    }
}
