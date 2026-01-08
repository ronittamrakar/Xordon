<?php
/**
 * Performance Billing Service
 * LeadSmart-inspired Pay-Per-Call billing system
 * 
 * Features:
 * - Automatic call qualification (90+ seconds = billable)
 * - Dynamic pricing based on zip code, service type, time of day
 * - Wallet integration for automatic billing
 * - Dispute management system
 */

require_once __DIR__ . '/../Database.php';

class PerformanceBillingService {
    
    private const DEFAULT_MIN_DURATION = 90; // 90 seconds for qualified call
    private const DEFAULT_BASE_PRICE = 25.00;
    
    /**
     * Check if a call qualifies for billing based on duration
     */
    public static function isQualifiedCall(int $durationSeconds, ?int $workspaceId = null): bool {
        $minDuration = self::getMinDuration($workspaceId);
        return $durationSeconds >= $minDuration;
    }
    
    /**
     * Get minimum duration for qualified calls
     */
    private static function getMinDuration(?int $workspaceId = null): int {
        if (!$workspaceId) {
            return self::DEFAULT_MIN_DURATION;
        }
        
        try {
            $pdo = Database::conn();
            $stmt = $pdo->prepare('SELECT min_duration_seconds FROM call_billing_settings WHERE workspace_id = ? AND company_id IS NULL AND is_active = 1 LIMIT 1');
            $stmt->execute([$workspaceId]);
            $row = $stmt->fetch();
            return $row ? (int)$row['min_duration_seconds'] : self::DEFAULT_MIN_DURATION;
        } catch (Exception $e) {
            error_log('PerformanceBillingService::getMinDuration error: ' . $e->getMessage());
            return self::DEFAULT_MIN_DURATION;
        }
    }
    
    /**
     * Calculate the price for a call based on pricing rules
     */
    public static function calculateCallPrice(array $callData, int $workspaceId): float {
        $pdo = Database::conn();
        
        $postalCode = $callData['postal_code'] ?? null;
        $serviceCategory = $callData['service_category'] ?? null;
        $callTime = isset($callData['started_at']) ? date('H:i:s', strtotime($callData['started_at'])) : date('H:i:s');
        $dayOfWeek = isset($callData['started_at']) ? strtolower(date('D', strtotime($callData['started_at']))) : strtolower(date('D'));
        
        // Get matching pricing rules ordered by priority
        $sql = "SELECT * FROM call_pricing_rules 
                WHERE workspace_id = :workspaceId 
                AND is_active = 1 
                ORDER BY priority DESC, id ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['workspaceId' => $workspaceId]);
        $rules = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $basePrice = self::DEFAULT_BASE_PRICE;
        $multiplier = 1.0;
        
        foreach ($rules as $rule) {
            // Check if rule matches
            $matches = true;
            
            // Postal code check
            if (!empty($rule['postal_code']) && $rule['postal_code'] !== $postalCode) {
                $matches = false;
            }
            
            // Service category check
            if (!empty($rule['service_category']) && $rule['service_category'] !== $serviceCategory) {
                $matches = false;
            }
            
            // Day of week check
            if (!empty($rule['day_of_week'])) {
                $allowedDays = explode(',', $rule['day_of_week']);
                if (!in_array($dayOfWeek, $allowedDays)) {
                    $matches = false;
                }
            }
            
            // Time range check (for after-hours pricing)
            if (!empty($rule['time_start']) && !empty($rule['time_end'])) {
                $timeStart = $rule['time_start'];
                $timeEnd = $rule['time_end'];
                
                // Handle overnight ranges (e.g., 18:00-08:00)
                if ($timeStart > $timeEnd) {
                    // Overnight range
                    if (!($callTime >= $timeStart || $callTime <= $timeEnd)) {
                        $matches = false;
                    }
                } else {
                    // Normal range
                    if (!($callTime >= $timeStart && $callTime <= $timeEnd)) {
                        $matches = false;
                    }
                }
            }
            
            if ($matches) {
                $basePrice = (float)$rule['base_price'];
                $multiplier = (float)($rule['multiplier'] ?? 1.0);
                break; // Use first matching rule
            }
        }
        
        // Apply multiplier
        $finalPrice = $basePrice * $multiplier;
        
        // Get billing settings for min/max
        $stmt = $pdo->prepare('SELECT min_price_per_call, max_price_per_call FROM call_billing_settings WHERE workspace_id = ? AND company_id IS NULL AND is_active = 1 LIMIT 1');
        $stmt->execute([$workspaceId]);
        $settings = $stmt->fetch();
        
        if ($settings) {
            $minPrice = (float)($settings['min_price_per_call'] ?? 0);
            $maxPrice = (float)($settings['max_price_per_call'] ?? 999);
            $finalPrice = max($minPrice, min($maxPrice, $finalPrice));
        }
        
        return round($finalPrice, 2);
    }
    
    /**
     * Process a completed call for billing
     * Called when a call webhook indicates call completion
     */
    public static function processCallForBilling(int $callLogId): array {
        $pdo = Database::conn();
        
        // Get call details
        $stmt = $pdo->prepare('SELECT * FROM call_logs WHERE id = ?');
        $stmt->execute([$callLogId]);
        $call = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$call) {
            return ['success' => false, 'error' => 'Call not found'];
        }
        
        // Check if already billed
        if ($call['is_billed']) {
            return ['success' => false, 'error' => 'Call already billed'];
        }
        
        $workspaceId = (int)($call['workspace_id'] ?? 1);
        $duration = (int)($call['duration'] ?? $call['call_duration'] ?? 0);
        
        // Check if qualified
        $isQualified = self::isQualifiedCall($duration, $workspaceId);
        
        // Update qualification status
        $stmt = $pdo->prepare('UPDATE call_logs SET is_qualified = ? WHERE id = ?');
        $stmt->execute([$isQualified ? 1 : 0, $callLogId]);
        
        if (!$isQualified) {
            return [
                'success' => true, 
                'qualified' => false, 
                'message' => "Call duration ($duration seconds) below qualification threshold"
            ];
        }
        
        // Check if auto-billing is enabled
        $stmt = $pdo->prepare('SELECT auto_bill_enabled FROM call_billing_settings WHERE workspace_id = ? AND company_id IS NULL AND is_active = 1 LIMIT 1');
        $stmt->execute([$workspaceId]);
        $settings = $stmt->fetch();
        
        $autoBill = $settings ? (bool)$settings['auto_bill_enabled'] : true;
        
        if (!$autoBill) {
            $stmt = $pdo->prepare('UPDATE call_logs SET billing_status = "pending" WHERE id = ?');
            $stmt->execute([$callLogId]);
            return [
                'success' => true,
                'qualified' => true,
                'billed' => false,
                'message' => 'Call qualified but auto-billing is disabled'
            ];
        }
        
        // Calculate price
        $price = self::calculateCallPrice($call, $workspaceId);
        
        // Get the company_id from the call or campaign
        $companyId = $call['company_id'] ?? null;
        if (!$companyId && !empty($call['campaign_id'])) {
            $stmt = $pdo->prepare('SELECT company_id FROM call_campaigns WHERE id = ?');
            $stmt->execute([$call['campaign_id']]);
            $campaign = $stmt->fetch();
            $companyId = $campaign ? $campaign['company_id'] : null;
        }
        
        if (!$companyId) {
            $stmt = $pdo->prepare('UPDATE call_logs SET billing_status = "pending", billing_price = ? WHERE id = ?');
            $stmt->execute([$price, $callLogId]);
            return [
                'success' => true,
                'qualified' => true,
                'billed' => false,
                'price' => $price,
                'error' => 'No company_id found for billing'
            ];
        }
        
        // Attempt to bill the call
        $result = self::billCall($callLogId, $workspaceId, $companyId, $price);
        
        return $result;
    }
    
    /**
     * Bill a qualified call to the company's wallet
     */
    public static function billCall(int $callLogId, int $workspaceId, int $companyId, float $price): array {
        $pdo = Database::conn();
        
        try {
            $pdo->beginTransaction();
            
            // Get wallet
            $stmt = $pdo->prepare('SELECT * FROM credits_wallets WHERE workspace_id = ? AND company_id = ? FOR UPDATE');
            $stmt->execute([$workspaceId, $companyId]);
            $wallet = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$wallet) {
                // Create wallet if doesn't exist
                $stmt = $pdo->prepare('INSERT INTO credits_wallets (workspace_id, company_id, balance) VALUES (?, ?, 0)');
                $stmt->execute([$workspaceId, $companyId]);
                $walletId = (int)$pdo->lastInsertId();
                $balanceBefore = 0;
            } else {
                $walletId = (int)$wallet['id'];
                $balanceBefore = (float)$wallet['balance'];
            }
            
            // Check if sufficient balance
            if ($balanceBefore < $price) {
                $pdo->rollBack();
                
                // Mark as pending billing
                $stmt = $pdo->prepare('UPDATE call_logs SET billing_status = "pending", billing_price = ? WHERE id = ?');
                $stmt->execute([$price, $callLogId]);
                
                return [
                    'success' => false,
                    'qualified' => true,
                    'billed' => false,
                    'error' => 'Insufficient wallet balance',
                    'balance' => $balanceBefore,
                    'required' => $price
                ];
            }
            
            $newBalance = $balanceBefore - $price;
            
            // Deduct from wallet
            $stmt = $pdo->prepare('UPDATE credits_wallets SET balance = ?, lifetime_spent = lifetime_spent + ?, last_charge_at = NOW() WHERE id = ?');
            $stmt->execute([$newBalance, $price, $walletId]);
            
            // Create transaction record
            $stmt = $pdo->prepare('INSERT INTO credit_transactions (workspace_id, company_id, wallet_id, type, amount, balance_before, balance_after, description) VALUES (?, ?, ?, "charge", ?, ?, ?, ?)');
            $stmt->execute([
                $workspaceId,
                $companyId,
                $walletId,
                -$price, // Negative for charge
                $balanceBefore,
                $newBalance,
                "Qualified call charge (Call #$callLogId)"
            ]);
            $transactionId = (int)$pdo->lastInsertId();
            
            // Update call log
            $stmt = $pdo->prepare('UPDATE call_logs SET is_billed = 1, billed_at = NOW(), billing_price = ?, billing_status = "billed", credit_transaction_id = ? WHERE id = ?');
            $stmt->execute([$price, $transactionId, $callLogId]);
            
            $pdo->commit();
            
            return [
                'success' => true,
                'qualified' => true,
                'billed' => true,
                'price' => $price,
                'transaction_id' => $transactionId,
                'balance_after' => $newBalance
            ];
            
        } catch (Exception $e) {
            $pdo->rollBack();
            error_log('PerformanceBillingService::billCall error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Billing failed: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Create a billing dispute for a call
     */
    public static function createDispute(int $callLogId, int $companyId, string $disputeType, ?string $description = null): array {
        $pdo = Database::conn();
        
        // Get call
        $stmt = $pdo->prepare('SELECT * FROM call_logs WHERE id = ?');
        $stmt->execute([$callLogId]);
        $call = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$call) {
            return ['success' => false, 'error' => 'Call not found'];
        }
        
        if (!$call['is_billed']) {
            return ['success' => false, 'error' => 'Call was not billed'];
        }
        
        $workspaceId = (int)($call['workspace_id'] ?? 1);
        
        // Check dispute window
        $stmt = $pdo->prepare('SELECT dispute_window_hours FROM call_billing_settings WHERE workspace_id = ? AND company_id IS NULL AND is_active = 1 LIMIT 1');
        $stmt->execute([$workspaceId]);
        $settings = $stmt->fetch();
        $disputeWindow = $settings ? (int)$settings['dispute_window_hours'] : 72;
        
        $billedAt = strtotime($call['billed_at']);
        $now = time();
        $hoursSinceBilled = ($now - $billedAt) / 3600;
        
        if ($hoursSinceBilled > $disputeWindow) {
            return [
                'success' => false, 
                'error' => "Dispute window expired (must dispute within $disputeWindow hours)"
            ];
        }
        
        // Create dispute
        $stmt = $pdo->prepare('INSERT INTO call_disputes (workspace_id, company_id, call_log_id, credit_transaction_id, dispute_type, description, status) VALUES (?, ?, ?, ?, ?, ?, "pending")');
        $stmt->execute([
            $workspaceId,
            $companyId,
            $callLogId,
            $call['credit_transaction_id'],
            $disputeType,
            $description
        ]);
        $disputeId = (int)$pdo->lastInsertId();
        
        // Update call status
        $stmt = $pdo->prepare('UPDATE call_logs SET billing_status = "disputed", dispute_reason = ?, disputed_at = NOW() WHERE id = ?');
        $stmt->execute([$description, $callLogId]);
        
        return [
            'success' => true,
            'dispute_id' => $disputeId,
            'message' => 'Dispute created successfully'
        ];
    }
    
    /**
     * Process a dispute (approve/reject)
     */
    public static function resolveDispute(int $disputeId, string $resolution, ?float $refundAmount = null, ?string $notes = null, ?int $resolvedBy = null): array {
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT * FROM call_disputes WHERE id = ?');
        $stmt->execute([$disputeId]);
        $dispute = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$dispute) {
            return ['success' => false, 'error' => 'Dispute not found'];
        }
        
        if ($dispute['status'] !== 'pending' && $dispute['status'] !== 'under_review') {
            return ['success' => false, 'error' => 'Dispute already resolved'];
        }
        
        try {
            $pdo->beginTransaction();
            
            $status = $resolution;
            
            // If approved, issue refund
            if ($resolution === 'approved' || $resolution === 'partial_refund') {
                $callLogId = $dispute['call_log_id'];
                
                $stmt = $pdo->prepare('SELECT * FROM call_logs WHERE id = ?');
                $stmt->execute([$callLogId]);
                $call = $stmt->fetch(PDO::FETCH_ASSOC);
                
                $originalPrice = (float)($call['billing_price'] ?? 0);
                $refund = ($resolution === 'partial_refund' && $refundAmount !== null) 
                    ? min($refundAmount, $originalPrice) 
                    : $originalPrice;
                
                if ($refund > 0) {
                    // Issue refund
                    $workspaceId = (int)$dispute['workspace_id'];
                    $companyId = (int)$dispute['company_id'];
                    
                    $stmt = $pdo->prepare('SELECT * FROM credits_wallets WHERE workspace_id = ? AND company_id = ?');
                    $stmt->execute([$workspaceId, $companyId]);
                    $wallet = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if ($wallet) {
                        $walletId = (int)$wallet['id'];
                        $balanceBefore = (float)$wallet['balance'];
                        $newBalance = $balanceBefore + $refund;
                        
                        // Add refund to wallet
                        $stmt = $pdo->prepare('UPDATE credits_wallets SET balance = ?, lifetime_refunded = lifetime_refunded + ? WHERE id = ?');
                        $stmt->execute([$newBalance, $refund, $walletId]);
                        
                        // Create refund transaction
                        $stmt = $pdo->prepare('INSERT INTO credit_transactions (workspace_id, company_id, wallet_id, type, amount, balance_before, balance_after, description) VALUES (?, ?, ?, "refund", ?, ?, ?, ?)');
                        $stmt->execute([
                            $workspaceId,
                            $companyId,
                            $walletId,
                            $refund,
                            $balanceBefore,
                            $newBalance,
                            "Dispute refund for Call #$callLogId"
                        ]);
                        $refundTransactionId = (int)$pdo->lastInsertId();
                        
                        // Update call log
                        $stmt = $pdo->prepare('UPDATE call_logs SET billing_status = "refunded", refunded_at = NOW() WHERE id = ?');
                        $stmt->execute([$callLogId]);
                        
                        // Update dispute with refund info
                        $stmt = $pdo->prepare('UPDATE call_disputes SET refund_amount = ? WHERE id = ?');
                        $stmt->execute([$refund, $disputeId]);
                    }
                }
            }
            
            // Update dispute status
            $stmt = $pdo->prepare('UPDATE call_disputes SET status = ?, resolution_notes = ?, resolved_by = ?, resolved_at = NOW() WHERE id = ?');
            $stmt->execute([$status, $notes, $resolvedBy, $disputeId]);
            
            $pdo->commit();
            
            return [
                'success' => true,
                'status' => $status,
                'refund_amount' => $refund ?? 0,
                'message' => 'Dispute resolved successfully'
            ];
            
        } catch (Exception $e) {
            $pdo->rollBack();
            error_log('PerformanceBillingService::resolveDispute error: ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    /**
     * Get billing summary for a company
     */
    public static function getBillingSummary(int $workspaceId, int $companyId, ?string $startDate = null, ?string $endDate = null): array {
        $pdo = Database::conn();
        
        $startDate = $startDate ?? date('Y-m-01'); // First of current month
        $endDate = $endDate ?? date('Y-m-d');
        
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total_calls,
                SUM(CASE WHEN is_qualified = 1 THEN 1 ELSE 0 END) as qualified_calls,
                SUM(CASE WHEN is_billed = 1 THEN 1 ELSE 0 END) as billed_calls,
                SUM(COALESCE(duration, call_duration, 0)) as total_duration_seconds,
                SUM(CASE WHEN is_billed = 1 THEN COALESCE(billing_price, 0) ELSE 0 END) as total_billed,
                AVG(CASE WHEN is_qualified = 1 THEN COALESCE(duration, call_duration, 0) ELSE NULL END) as avg_qualified_duration
            FROM call_logs 
            WHERE workspace_id = ? 
            AND (company_id = ? OR campaign_id IN (SELECT id FROM call_campaigns WHERE company_id = ?))
            AND DATE(created_at) BETWEEN ? AND ?
        ");
        $stmt->execute([$workspaceId, $companyId, $companyId, $startDate, $endDate]);
        $summary = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get disputes
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total_disputes,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_disputes,
                SUM(COALESCE(refund_amount, 0)) as total_refunded
            FROM call_disputes
            WHERE workspace_id = ? AND company_id = ?
            AND DATE(created_at) BETWEEN ? AND ?
        ");
        $stmt->execute([$workspaceId, $companyId, $startDate, $endDate]);
        $disputes = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get wallet balance
        $stmt = $pdo->prepare('SELECT balance FROM credits_wallets WHERE workspace_id = ? AND company_id = ?');
        $stmt->execute([$workspaceId, $companyId]);
        $wallet = $stmt->fetch();
        
        return [
            'period' => [
                'start' => $startDate,
                'end' => $endDate
            ],
            'calls' => [
                'total' => (int)($summary['total_calls'] ?? 0),
                'qualified' => (int)($summary['qualified_calls'] ?? 0),
                'billed' => (int)($summary['billed_calls'] ?? 0),
                'qualification_rate' => $summary['total_calls'] > 0 
                    ? round(($summary['qualified_calls'] / $summary['total_calls']) * 100, 1) 
                    : 0
            ],
            'duration' => [
                'total_seconds' => (int)($summary['total_duration_seconds'] ?? 0),
                'avg_qualified_seconds' => round((float)($summary['avg_qualified_duration'] ?? 0), 1)
            ],
            'billing' => [
                'total_billed' => round((float)($summary['total_billed'] ?? 0), 2),
                'total_refunded' => round((float)($disputes['total_refunded'] ?? 0), 2),
                'net_revenue' => round((float)($summary['total_billed'] ?? 0) - (float)($disputes['total_refunded'] ?? 0), 2)
            ],
            'disputes' => [
                'total' => (int)($disputes['total_disputes'] ?? 0),
                'approved' => (int)($disputes['approved_disputes'] ?? 0)
            ],
            'wallet_balance' => round((float)($wallet['balance'] ?? 0), 2)
        ];
    }
}
