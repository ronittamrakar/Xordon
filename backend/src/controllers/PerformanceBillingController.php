<?php
/**
 * Performance Billing Controller
 * API endpoints for LeadSmart-style Pay-Per-Call billing system
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../services/PerformanceBillingService.php';

class PerformanceBillingController {
    
    private static function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }
    
    private static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        return ($ctx && isset($ctx->workspaceId)) ? (int)$ctx->workspaceId : 1;
    }
    
    private static function getCompanyId(): ?int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        return ($ctx && isset($ctx->activeCompanyId)) ? (int)$ctx->activeCompanyId : null;
    }
    
    /**
     * GET /api/performance-billing/settings
     * Get billing settings for current workspace
     */
    public static function getSettings(): void {
        Auth::userIdOrFail();
        $workspaceId = self::getWorkspaceId();
        
        try {
            $pdo = Database::conn();
            $stmt = $pdo->prepare('SELECT * FROM call_billing_settings WHERE workspace_id = ? ORDER BY company_id ASC');
            $stmt->execute([$workspaceId]);
            $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            Response::json([
                'success' => true,
                'data' => $settings
            ]);
        } catch (Exception $e) {
            Response::error('Failed to get billing settings: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * POST /api/performance-billing/settings
     * Update billing settings
     */
    public static function updateSettings(): void {
        Auth::userIdOrFail();
        $workspaceId = self::getWorkspaceId();
        $data = get_json_body();
        
        try {
            $pdo = Database::conn();
            
            $companyId = $data['company_id'] ?? null;
            $minDuration = $data['min_duration_seconds'] ?? 90;
            $basePrice = $data['base_price_per_call'] ?? 25.00;
            $surgeMultiplier = $data['surge_multiplier'] ?? 1.5;
            $exclusiveMultiplier = $data['exclusive_multiplier'] ?? 3.0;
            $autoBill = isset($data['auto_bill_enabled']) ? ($data['auto_bill_enabled'] ? 1 : 0) : 1;
            $disputeWindow = $data['dispute_window_hours'] ?? 72;
            $maxPrice = $data['max_price_per_call'] ?? 120.00;
            $minPrice = $data['min_price_per_call'] ?? 25.00;
            
            // Upsert
            $stmt = $pdo->prepare('
                INSERT INTO call_billing_settings 
                    (workspace_id, company_id, min_duration_seconds, base_price_per_call, surge_multiplier, exclusive_multiplier, auto_bill_enabled, dispute_window_hours, max_price_per_call, min_price_per_call, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                ON DUPLICATE KEY UPDATE
                    min_duration_seconds = VALUES(min_duration_seconds),
                    base_price_per_call = VALUES(base_price_per_call),
                    surge_multiplier = VALUES(surge_multiplier),
                    exclusive_multiplier = VALUES(exclusive_multiplier),
                    auto_bill_enabled = VALUES(auto_bill_enabled),
                    dispute_window_hours = VALUES(dispute_window_hours),
                    max_price_per_call = VALUES(max_price_per_call),
                    min_price_per_call = VALUES(min_price_per_call),
                    updated_at = CURRENT_TIMESTAMP
            ');
            $stmt->execute([
                $workspaceId, $companyId, $minDuration, $basePrice, 
                $surgeMultiplier, $exclusiveMultiplier, $autoBill, 
                $disputeWindow, $maxPrice, $minPrice
            ]);
            
            Response::json([
                'success' => true,
                'message' => 'Settings updated successfully'
            ]);
        } catch (Exception $e) {
            Response::error('Failed to update settings: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * GET /api/performance-billing/pricing-rules
     * Get call pricing rules
     */
    public static function getPricingRules(): void {
        Auth::userIdOrFail();
        $workspaceId = self::getWorkspaceId();
        
        try {
            $pdo = Database::conn();
            $stmt = $pdo->prepare('SELECT * FROM call_pricing_rules WHERE workspace_id = ? ORDER BY priority DESC, id ASC');
            $stmt->execute([$workspaceId]);
            $rules = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            Response::json([
                'success' => true,
                'data' => $rules
            ]);
        } catch (Exception $e) {
            Response::error('Failed to get pricing rules: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * POST /api/performance-billing/pricing-rules
     * Create a pricing rule
     */
    public static function createPricingRule(): void {
        Auth::userIdOrFail();
        $workspaceId = self::getWorkspaceId();
        $data = get_json_body();
        
        try {
            $pdo = Database::conn();
            
            $stmt = $pdo->prepare('
                INSERT INTO call_pricing_rules 
                    (workspace_id, name, service_category, region, postal_code, city, day_of_week, time_start, time_end, is_emergency, base_price, multiplier, priority, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');
            $stmt->execute([
                $workspaceId,
                $data['name'] ?? null,
                $data['service_category'] ?? null,
                $data['region'] ?? null,
                $data['postal_code'] ?? null,
                $data['city'] ?? null,
                $data['day_of_week'] ?? null,
                $data['time_start'] ?? null,
                $data['time_end'] ?? null,
                isset($data['is_emergency']) ? ($data['is_emergency'] ? 1 : 0) : 0,
                $data['base_price'] ?? 25.00,
                $data['multiplier'] ?? 1.0,
                $data['priority'] ?? 0,
                isset($data['is_active']) ? ($data['is_active'] ? 1 : 0) : 1
            ]);
            
            Response::json([
                'success' => true,
                'data' => ['id' => (int)$pdo->lastInsertId()]
            ], 201);
        } catch (Exception $e) {
            Response::error('Failed to create pricing rule: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * PUT /api/performance-billing/pricing-rules/:id
     * Update a pricing rule
     */
    public static function updatePricingRule(int $id): void {
        Auth::userIdOrFail();
        $workspaceId = self::getWorkspaceId();
        $data = get_json_body();
        
        try {
            $pdo = Database::conn();
            
            $allowed = ['name', 'service_category', 'region', 'postal_code', 'city', 'day_of_week', 'time_start', 'time_end', 'is_emergency', 'base_price', 'multiplier', 'priority', 'is_active'];
            $fields = [];
            $params = ['id' => $id, 'workspaceId' => $workspaceId];
            
            foreach ($allowed as $f) {
                if (array_key_exists($f, $data)) {
                    $fields[] = "$f = :$f";
                    $params[$f] = $data[$f];
                }
            }
            
            if (empty($fields)) {
                Response::validationError('No fields to update');
                return;
            }
            
            $stmt = $pdo->prepare('UPDATE call_pricing_rules SET ' . implode(', ', $fields) . ', updated_at = CURRENT_TIMESTAMP WHERE id = :id AND workspace_id = :workspaceId');
            $stmt->execute($params);
            
            Response::json(['success' => true]);
        } catch (Exception $e) {
            Response::error('Failed to update pricing rule: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * DELETE /api/performance-billing/pricing-rules/:id
     */
    public static function deletePricingRule(int $id): void {
        Auth::userIdOrFail();
        $workspaceId = self::getWorkspaceId();
        
        try {
            $pdo = Database::conn();
            $stmt = $pdo->prepare('DELETE FROM call_pricing_rules WHERE id = ? AND workspace_id = ?');
            $stmt->execute([$id, $workspaceId]);
            
            Response::json(['success' => true]);
        } catch (Exception $e) {
            Response::error('Failed to delete pricing rule: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * GET /api/performance-billing/summary
     * Get billing summary for current company
     */
    public static function getSummary(): void {
        Auth::userIdOrFail();
        $workspaceId = self::getWorkspaceId();
        $companyId = self::getCompanyId();
        
        if (!$companyId) {
            Response::validationError('Company ID required');
            return;
        }
        
        $startDate = $_GET['start_date'] ?? null;
        $endDate = $_GET['end_date'] ?? null;
        
        try {
            $summary = PerformanceBillingService::getBillingSummary($workspaceId, $companyId, $startDate, $endDate);
            Response::json([
                'success' => true,
                'data' => $summary
            ]);
        } catch (Exception $e) {
            Response::error('Failed to get billing summary: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * GET /api/performance-billing/qualified-calls
     * Get list of qualified (billable) calls
     */
    public static function getQualifiedCalls(): void {
        Auth::userIdOrFail();
        $workspaceId = self::getWorkspaceId();
        
        $status = $_GET['status'] ?? null; // billed, pending, disputed, refunded
        $limit = min((int)($_GET['limit'] ?? 50), 100);
        $offset = (int)($_GET['offset'] ?? 0);
        
        try {
            $pdo = Database::conn();
            
            $sql = "SELECT cl.*, cc.name as campaign_name 
                    FROM call_logs cl 
                    LEFT JOIN call_campaigns cc ON cc.id = cl.campaign_id
                    WHERE cl.workspace_id = ? AND cl.is_qualified = 1";
            $params = [$workspaceId];
            
            if ($status) {
                $sql .= " AND cl.billing_status = ?";
                $params[] = $status;
            }
            
            $sql .= " ORDER BY cl.created_at DESC LIMIT ? OFFSET ?";
            
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(1, $workspaceId, PDO::PARAM_INT);
            $paramIndex = 2;
            if ($status) {
                $stmt->bindValue($paramIndex++, $status, PDO::PARAM_STR);
            }
            $stmt->bindValue($paramIndex++, $limit, PDO::PARAM_INT);
            $stmt->bindValue($paramIndex, $offset, PDO::PARAM_INT);
            $stmt->execute();
            
            $calls = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format the response
            $formatted = array_map(function($call) {
                return [
                    'id' => (int)$call['id'],
                    'phone_number' => $call['phone_number'] ?? 'N/A',
                    'duration' => (int)($call['duration'] ?? $call['call_duration'] ?? 0),
                    'campaign_name' => $call['campaign_name'] ?? 'Unknown',
                    'billing_status' => $call['billing_status'] ?? 'pending',
                    'billing_price' => (float)($call['billing_price'] ?? 0),
                    'billed_at' => $call['billed_at'],
                    'created_at' => $call['created_at'],
                    'outcome' => $call['outcome'] ?? 'completed'
                ];
            }, $calls);
            
            Response::json([
                'success' => true,
                'data' => $formatted
            ]);
        } catch (Exception $e) {
            Response::error('Failed to get qualified calls: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * POST /api/performance-billing/process-call/:id
     * Manually process a call for billing
     */
    public static function processCall(int $callLogId): void {
        Auth::userIdOrFail();
        
        try {
            $result = PerformanceBillingService::processCallForBilling($callLogId);
            Response::json($result);
        } catch (Exception $e) {
            Response::error('Failed to process call: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * POST /api/performance-billing/disputes
     * Create a billing dispute
     */
    public static function createDispute(): void {
        Auth::userIdOrFail();
        $companyId = self::getCompanyId();
        
        if (!$companyId) {
            Response::validationError('Company ID required');
            return;
        }
        
        $data = get_json_body();
        $callLogId = $data['call_log_id'] ?? null;
        $disputeType = $data['dispute_type'] ?? null;
        $description = $data['description'] ?? null;
        
        if (!$callLogId || !$disputeType) {
            Response::validationError('call_log_id and dispute_type are required');
            return;
        }
        
        try {
            $result = PerformanceBillingService::createDispute($callLogId, $companyId, $disputeType, $description);
            
            if ($result['success']) {
                Response::json($result, 201);
            } else {
                Response::error($result['error'], 400);
            }
        } catch (Exception $e) {
            Response::error('Failed to create dispute: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * GET /api/performance-billing/disputes
     * Get disputes for current company
     */
    public static function getDisputes(): void {
        Auth::userIdOrFail();
        $workspaceId = self::getWorkspaceId();
        $companyId = self::getCompanyId();
        
        $status = $_GET['status'] ?? null;
        
        try {
            $pdo = Database::conn();
            
            $sql = "SELECT cd.*, cl.phone_number, cl.duration, cl.billing_price
                    FROM call_disputes cd
                    JOIN call_logs cl ON cl.id = cd.call_log_id
                    WHERE cd.workspace_id = ?";
            $params = [$workspaceId];
            
            if ($companyId) {
                $sql .= " AND cd.company_id = ?";
                $params[] = $companyId;
            }
            
            if ($status) {
                $sql .= " AND cd.status = ?";
                $params[] = $status;
            }
            
            $sql .= " ORDER BY cd.created_at DESC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $disputes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            Response::json([
                'success' => true,
                'data' => $disputes
            ]);
        } catch (Exception $e) {
            Response::error('Failed to get disputes: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * PUT /api/performance-billing/disputes/:id/resolve
     * Resolve a dispute (admin only)
     */
    public static function resolveDispute(int $disputeId): void {
        $userId = Auth::userIdOrFail();
        $data = get_json_body();
        
        $resolution = $data['resolution'] ?? null; // approved, rejected, partial_refund
        $refundAmount = $data['refund_amount'] ?? null;
        $notes = $data['notes'] ?? null;
        
        if (!$resolution || !in_array($resolution, ['approved', 'rejected', 'partial_refund'])) {
            Response::validationError('Valid resolution required (approved, rejected, partial_refund)');
            return;
        }
        
        try {
            $result = PerformanceBillingService::resolveDispute($disputeId, $resolution, $refundAmount, $notes, $userId);
            
            if ($result['success']) {
                Response::json($result);
            } else {
                Response::error($result['error'], 400);
            }
        } catch (Exception $e) {
            Response::error('Failed to resolve dispute: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * POST /api/performance-billing/calculate-price
     * Calculate price for a hypothetical call (for previews)
     */
    public static function calculatePrice(): void {
        Auth::userIdOrFail();
        $workspaceId = self::getWorkspaceId();
        $data = get_json_body();
        
        try {
            $price = PerformanceBillingService::calculateCallPrice($data, $workspaceId);
            
            Response::json([
                'success' => true,
                'data' => [
                    'price' => $price,
                    'input' => $data
                ]
            ]);
        } catch (Exception $e) {
            Response::error('Failed to calculate price: ' . $e->getMessage(), 500);
        }
    }
}
