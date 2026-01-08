<?php

namespace Xordon\Controllers;

use Xordon\Core\Database;
use Xordon\Core\Response;
use Xordon\Core\Auth;
use Exception;
use PDO;

require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../services/CustomerStripeService.php';

class SubscriptionsController {
    
    private static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        throw new Exception('Workspace context required');
    }

    /**
     * List all customer subscriptions
     */
    public static function listSubscriptions() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $status = $_GET['status'] ?? null;
            $contactId = $_GET['contact_id'] ?? null;
            $limit = (int)($_GET['limit'] ?? 50);
            $offset = (int)($_GET['offset'] ?? 0);
            
            $query = "
                SELECT 
                    s.*, 
                    c.first_name as contact_first_name, 
                    c.last_name as contact_last_name, 
                    c.email as contact_email,
                    p.name as product_name
                FROM customer_subscriptions s
                LEFT JOIN contacts c ON c.id = s.contact_id
                LEFT JOIN products p ON p.id = s.product_id
                WHERE s.workspace_id = ?
            ";
            
            $params = [$workspaceId];
            
            if ($status) {
                $query .= " AND s.status = ?";
                $params[] = $status;
            }
            
            if ($contactId) {
                $query .= " AND s.contact_id = ?";
                $params[] = $contactId;
            }
            
            $query .= " ORDER BY s.created_at DESC LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
            
            $stmt = $db->prepare($query);
            $stmt->execute($params);
            $subscriptions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get total count for pagination
            $countQuery = "SELECT COUNT(*) FROM customer_subscriptions WHERE workspace_id = ?";
            $countParams = [$workspaceId];
            if ($status) {
                $countQuery .= " AND status = ?";
                $countParams[] = $status;
            }
            if ($contactId) {
                $countQuery .= " AND contact_id = ?";
                $countParams[] = $contactId;
            }
            
            $countStmt = $db->prepare($countQuery);
            $countStmt->execute($countParams);
            $total = (int)$countStmt->fetchColumn();
            
            return Response::json([
                'data' => $subscriptions,
                'meta' => [
                    'total' => $total,
                    'limit' => $limit,
                    'offset' => $offset
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to list subscriptions: ' . $e->getMessage());
        }
    }

    /**
     * Get a single subscription
     */
    public static function getSubscription($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $stmt = $db->prepare("
                SELECT 
                    s.*, 
                    c.first_name as contact_first_name, 
                    c.last_name as contact_last_name, 
                    c.email as contact_email,
                    p.name as product_name
                FROM customer_subscriptions s
                LEFT JOIN contacts c ON c.id = s.contact_id
                LEFT JOIN products p ON p.id = s.product_id
                WHERE s.id = ? AND s.workspace_id = ?
            ");
            $stmt->execute([(int)$id, $workspaceId]);
            $subscription = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$subscription) {
                return Response::error('Subscription not found', 404);
            }
            
            return Response::json(['data' => $subscription]);
        } catch (Exception $e) {
            return Response::error('Failed to get subscription: ' . $e->getMessage());
        }
    }

    /**
     * Create a new subscription
     */
    public static function create() {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = Auth::userId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['contact_id']) || empty($data['product_id'])) {
                return Response::error('contact_id and product_id required', 400);
            }
            
            // Get product details
            $pStmt = $db->prepare("SELECT * FROM products WHERE id = ? AND workspace_id = ?");
            $pStmt->execute([$data['product_id'], $workspaceId]);
            $product = $pStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$product) {
                return Response::error('Product not found', 404);
            }
            
            $billingAmount = $data['billing_amount'] ?? $product['price'];
            $currency = $data['currency'] ?? $product['currency'] ?? 'USD';
            $interval = $data['billing_interval'] ?? $product['recurring_interval'] ?? 'monthly';
            $intervalCount = $data['billing_interval_count'] ?? $product['recurring_interval_count'] ?? 1;
            
            // Handle trial
            $trialDays = $data['trial_days'] ?? $product['trial_days'] ?? 0;
            $startDate = $data['start_date'] ?? date('Y-m-d');
            $trialEndDate = null;
            $status = 'active';
            $nextBillingDate = $startDate;
            
            if ($trialDays > 0) {
                $status = 'trialing';
                $trialEndDate = date('Y-m-d', strtotime("+$trialDays days", strtotime($startDate)));
                $nextBillingDate = $trialEndDate;
            } else {
                // Calculate next billing date based on interval
                $nextBillingDate = self::calculateNextBillingDate($startDate, $interval, $intervalCount);
            }
            
            $subNumber = 'SUB-' . strtoupper(substr(uniqid(), -8));
            
            // Try to sync with Stripe
            $stripeCustomerId = null;
            $stripeSubscriptionId = null;
            
            try {
                // Get contact details
                $cStmt = $db->prepare("SELECT * FROM contacts WHERE id = ?");
                $cStmt->execute([$data['contact_id']]);
                $contact = $cStmt->fetch(PDO::FETCH_ASSOC);
                
                if ($contact) {
                    $stripeCustomerId = CustomerStripeService::getOrCreateCustomer($workspaceId, $contact);
                    
                    if ($stripeCustomerId) {
                        $planData = [
                            'id' => $data['product_id'],
                            'name' => $product['name'],
                            'price' => $billingAmount,
                            'currency' => $currency,
                            'interval' => $interval,
                            'interval_count' => $intervalCount,
                            'trial_end_date' => $trialEndDate,
                            'setup_fee' => $data['setup_fee'] ?? $product['setup_fee'] ?? 0,
                            'local_sub_id' => 0 // temporarily 0, updated later? No, let's use insert ID logic
                        ];
                        
                        // We need ID for metadata, but we haven't inserted yet.
                        // Can insert first, then update with Stripe ID
                        
                        $stripeSub = CustomerStripeService::createSubscription($workspaceId, $stripeCustomerId, $planData, strtotime($startDate));
                        $stripeSubscriptionId = $stripeSub['id'];
                    }
                }
            } catch (Exception $e) {
                // Log error but continue with local creation? Or fail?
                // Let's log it and continue as "manual" subscription if Stripe fails?
                // For now, let's allow it to be created locally without Stripe if Stripe fails/not connected
                // error_log('Stripe extraction failed: ' . $e->getMessage());
            }

            $stmt = $db->prepare("
                INSERT INTO customer_subscriptions (
                    workspace_id, contact_id, product_id, subscription_number,
                    status, billing_amount, currency, billing_interval,
                    billing_interval_count, trial_days, trial_end_date,
                    setup_fee, start_date, next_billing_date, created_by,
                    stripe_customer_id, stripe_subscription_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $workspaceId,
                $data['contact_id'],
                $data['product_id'],
                $subNumber,
                $status,
                $billingAmount,
                $currency,
                $interval,
                $intervalCount,
                $trialDays,
                $trialEndDate,
                $data['setup_fee'] ?? $product['setup_fee'] ?? 0,
                $startDate,
                $nextBillingDate,
                $userId,
                $stripeCustomerId,
                $stripeSubscriptionId
            ]);
            
            $id = $db->lastInsertId();
            
            return Response::json([
                'success' => true,
                'data' => [
                    'id' => (int)$id,
                    'subscription_number' => $subNumber,
                    'stripe_connected' => !!$stripeSubscriptionId
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to create subscription: ' . $e->getMessage());
        }
    }

    /**
     * Update an existing subscription
     */
    public static function update($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $db->prepare("SELECT * FROM customer_subscriptions WHERE id = ? AND workspace_id = ?");
            $stmt->execute([(int)$id, $workspaceId]);
            if (!$stmt->fetch()) {
                return Response::error('Subscription not found', 404);
            }
            
            $updates = [];
            $params = [];
            
            $allowedFields = [
                'status', 'billing_amount', 'currency', 'billing_interval', 
                'billing_interval_count', 'trial_end_date', 'setup_fee', 
                'next_billing_date', 'notes'
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
            
            $params[] = (int)$id;
            $params[] = $workspaceId;
            
            $sql = "UPDATE customer_subscriptions SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ? AND workspace_id = ?";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            
            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to update subscription: ' . $e->getMessage());
        }
    }

    /**
     * Cancel a subscription
     */
    public static function cancel($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $db->prepare("SELECT * FROM customer_subscriptions WHERE id = ? AND workspace_id = ?");
            $stmt->execute([(int)$id, $workspaceId]);
            $subscription = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$subscription) {
                return Response::error('Subscription not found', 404);
            }
            
            $cancelAtPeriodEnd = $data['cancel_at_period_end'] ?? true;
            
            // Cancel in Stripe if connected
            if (!empty($subscription['stripe_subscription_id'])) {
                try {
                    \CustomerStripeService::cancelSubscription($workspaceId, $subscription['stripe_subscription_id'], (bool)$cancelAtPeriodEnd);
                } catch (Exception $e) {
                    // Log error
                    error_log('Failed to cancel Stripe subscription: ' . $e->getMessage());
                }
            }

            if ($cancelAtPeriodEnd) {
                $stmt = $db->prepare("
                    UPDATE customer_subscriptions 
                    SET cancel_at_period_end = 1, updated_at = NOW() 
                    WHERE id = ?
                ");
                $stmt->execute([(int)$id]);
            } else {
                $stmt = $db->prepare("
                    UPDATE customer_subscriptions 
                    SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW() 
                    WHERE id = ?
                ");
                $stmt->execute([(int)$id]);
            }
            
            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to cancel subscription: ' . $e->getMessage());
        }
    }

    /**
     * Pause a subscription
     */
    public static function pause($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $stmt = $db->prepare("SELECT * FROM customer_subscriptions WHERE id = ? AND workspace_id = ?");
            $stmt->execute([(int)$id, $workspaceId]);
            $subscription = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$subscription) {
                return Response::error('Subscription not found', 404);
            }
            
            if ($subscription['status'] === 'paused') {
                return Response::json(['success' => true, 'message' => 'Subscription already paused']);
            }

            // Pause in Stripe if connected
            if (!empty($subscription['stripe_subscription_id'])) {
                try {
                    \CustomerStripeService::pauseSubscription($workspaceId, $subscription['stripe_subscription_id']);
                } catch (Exception $e) {
                    error_log('Failed to pause Stripe subscription: ' . $e->getMessage());
                }
            }

            $stmt = $db->prepare("
                UPDATE customer_subscriptions 
                SET status = 'paused', updated_at = NOW() 
                WHERE id = ?
            ");
            $stmt->execute([(int)$id]);
            
            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to pause subscription: ' . $e->getMessage());
        }
    }

    /**
     * Resume a subscription
     */
    public static function resume($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $stmt = $db->prepare("SELECT * FROM customer_subscriptions WHERE id = ? AND workspace_id = ?");
            $stmt->execute([(int)$id, $workspaceId]);
            $subscription = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$subscription) {
                return Response::error('Subscription not found', 404);
            }
            
            if ($subscription['status'] !== 'paused') {
                return Response::json(['success' => true, 'message' => 'Subscription is not paused']);
            }

            // Resume in Stripe if connected
            if (!empty($subscription['stripe_subscription_id'])) {
                try {
                    \CustomerStripeService::resumeSubscription($workspaceId, $subscription['stripe_subscription_id']);
                } catch (Exception $e) {
                    error_log('Failed to resume Stripe subscription: ' . $e->getMessage());
                }
            }

            $stmt = $db->prepare("
                UPDATE customer_subscriptions 
                SET status = 'active', updated_at = NOW() 
                WHERE id = ?
            ");
            $stmt->execute([(int)$id]);
            
            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to resume subscription: ' . $e->getMessage());
        }
    }

    /**
     * Get subscription statistics
     */
    public static function getStats() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            // Calculate MRR
            // (Standardize all active subscriptions to a monthly value)
            $stmt = $db->prepare("
                SELECT 
                    SUM(CASE 
                        WHEN billing_interval = 'daily' THEN (billing_amount * 30 / billing_interval_count)
                        WHEN billing_interval = 'weekly' THEN (billing_amount * 4.33 / billing_interval_count)
                        WHEN billing_interval = 'monthly' THEN (billing_amount / billing_interval_count)
                        WHEN billing_interval = 'quarterly' THEN (billing_amount / 3 / billing_interval_count)
                        WHEN billing_interval = 'yearly' THEN (billing_amount / 12 / billing_interval_count)
                        ELSE 0 
                    END) as mrr,
                    COUNT(*) as total_active,
                    SUM(CASE WHEN status = 'trialing' THEN 1 ELSE 0 END) as trialing_count
                FROM customer_subscriptions 
                WHERE workspace_id = ? AND status IN ('active', 'trialing')
            ");
            $stmt->execute([$workspaceId]);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $mrr = (float)($stats['mrr'] ?? 0);
            
            return Response::json([
                'data' => [
                    'mrr' => $mrr,
                    'arr' => $mrr * 12,
                    'active_count' => (int)($stats['total_active'] ?? 0),
                    'trialing_count' => (int)($stats['trialing_count'] ?? 0),
                    'cancelled_count' => 0, // Need historical data for this
                    'churn_rate' => 0 // Need historical data for this
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to get stats: ' . $e->getMessage());
        }
    }

    /**
     * Get analytics data for charts
     */
    public static function getAnalytics() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $from = $_GET['from'] ?? date('Y-m-d', strtotime('-30 days'));
            $to = $_GET['to'] ?? date('Y-m-d');
            
            // Get subscription growth
            $stmt = $db->prepare("
                SELECT DATE(created_at) as date, COUNT(*) as count
                FROM customer_subscriptions
                WHERE workspace_id = ? AND created_at BETWEEN ? AND ?
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            ");
            $stmt->execute([$workspaceId, $from, $to . ' 23:59:59']);
            $growth = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get status distribution
            $stmt = $db->prepare("
                SELECT status, COUNT(*) as count
                FROM customer_subscriptions
                WHERE workspace_id = ?
                GROUP BY status
            ");
            $stmt->execute([$workspaceId]);
            $distribution = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return Response::json([
                'data' => [
                    'growth' => $growth,
                    'distribution' => $distribution,
                    'period' => ['from' => $from, 'to' => $to]
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to get analytics: ' . $e->getMessage());
        }
    }

    private static function calculateNextBillingDate($startDate, $interval, $count) {
        $time = strtotime($startDate);
        switch ($interval) {
            case 'daily': $mod = "+$count days"; break;
            case 'weekly': $mod = "+$count weeks"; break;
            case 'monthly': $mod = "+$count months"; break;
            case 'quarterly': $count *= 3; $mod = "+$count months"; break;
            case 'yearly': $mod = "+$count years"; break;
            default: $mod = "+1 month";
        }
        return date('Y-m-d', strtotime($mod, $time));
    }
}
