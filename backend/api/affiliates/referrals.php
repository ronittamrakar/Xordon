<?php
/**
 * Affiliate Referrals API
 * GET /api/affiliates/referrals - List referrals
 * POST /api/affiliates/referrals - Create referral
 */

require_once __DIR__ . '/../../src/bootstrap.php';
require_once __DIR__ . '/../../src/Auth.php';
require_once __DIR__ . '/../../src/Database.php';
require_once __DIR__ . '/../../src/TenantContext.php';
require_once __DIR__ . '/../../src/Response.php';

use Xordon\Database;
use Xordon\TenantContext;

header('Content-Type: application/json');

// Verify authentication
$user = Auth::getCurrentUser();
if (!$user) {
    Response::error('Unauthorized', 401);
}

// Get workspace context
$workspaceId = TenantContext::getWorkspaceId();
if (!$workspaceId) {
    Response::error('Workspace context required', 400);
}

$db = Database::conn();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $affiliateId = $_GET['affiliate_id'] ?? null;
            $status = $_GET['status'] ?? null;
            $limit = $_GET['limit'] ?? 100;
            $offset = $_GET['offset'] ?? 0;
            
            $sql = "
                SELECT r.*, a.name as affiliate_name, a.email as affiliate_email
                FROM affiliate_referrals r
                JOIN affiliates a ON r.affiliate_id = a.id
                WHERE r.workspace_id = ?
            ";
            $params = [$workspaceId];
            
            if ($affiliateId) {
                $sql .= " AND r.affiliate_id = ?";
                $params[] = $affiliateId;
            }
            
            if ($status) {
                $sql .= " AND r.status = ?";
                $params[] = $status;
            }
            
            $sql .= " ORDER BY r.referred_at DESC LIMIT ? OFFSET ?";
            $params[] = (int)$limit;
            $params[] = (int)$offset;
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $referrals = $stmt->fetchAll();
            
            // Get total count
            $countSql = "
                SELECT COUNT(*) FROM affiliate_referrals r
                WHERE r.workspace_id = ?
            ";
            $countParams = [$workspaceId];
            
            if ($affiliateId) {
                $countSql .= " AND r.affiliate_id = ?";
                $countParams[] = $affiliateId;
            }
            
            if ($status) {
                $countSql .= " AND r.status = ?";
                $countParams[] = $status;
            }
            
            $stmt = $db->prepare($countSql);
            $stmt->execute($countParams);
            $total = $stmt->fetchColumn();
            
            Response::json([
                'data' => $referrals,
                'meta' => [
                    'total' => (int)$total,
                    'limit' => (int)$limit,
                    'offset' => (int)$offset
                ]
            ]);
            break;
            
        case 'POST':
            $data = get_json_body();
            
            // Validate required fields
            if (empty($data['affiliate_id'])) {
                Response::error('Affiliate ID required', 400);
            }
            
            // Verify affiliate exists
            $stmt = $db->prepare("
                SELECT id, commission_rate 
                FROM affiliates 
                WHERE id = ? AND workspace_id = ?
            ");
            $stmt->execute([$data['affiliate_id'], $workspaceId]);
            $affiliate = $stmt->fetch();
            
            if (!$affiliate) {
                Response::error('Affiliate not found', 404);
            }
            
            // Calculate commission if conversion_value provided
            $commissionAmount = 0;
            if (!empty($data['conversion_value'])) {
                $commissionRate = $data['commission_rate'] ?? $affiliate['commission_rate'];
                $commissionAmount = ($data['conversion_value'] * $commissionRate) / 100;
            }
            
            // Insert referral
            $stmt = $db->prepare("
                INSERT INTO affiliate_referrals (
                    workspace_id, affiliate_id, contact_id,
                    customer_email, customer_name, status,
                    conversion_type, conversion_value, commission_amount,
                    referral_source, landing_page,
                    utm_source, utm_medium, utm_campaign,
                    ip_address, user_agent, referred_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            
            $stmt->execute([
                $workspaceId,
                $data['affiliate_id'],
                $data['contact_id'] ?? null,
                $data['customer_email'] ?? null,
                $data['customer_name'] ?? null,
                $data['status'] ?? 'pending',
                $data['conversion_type'] ?? null,
                $data['conversion_value'] ?? 0,
                $commissionAmount,
                $data['referral_source'] ?? null,
                $data['landing_page'] ?? null,
                $data['utm_source'] ?? null,
                $data['utm_medium'] ?? null,
                $data['utm_campaign'] ?? null,
                $data['ip_address'] ?? $_SERVER['REMOTE_ADDR'] ?? null,
                $data['user_agent'] ?? $_SERVER['HTTP_USER_AGENT'] ?? null
            ]);
            
            $referralId = $db->lastInsertId();
            
            // Update affiliate totals
            if ($data['status'] === 'converted') {
                $stmt = $db->prepare("
                    UPDATE affiliates 
                    SET total_referrals = total_referrals + 1,
                        total_earnings = total_earnings + ?,
                        unpaid_balance = unpaid_balance + ?
                    WHERE id = ? AND workspace_id = ?
                ");
                $stmt->execute([$commissionAmount, $commissionAmount, $data['affiliate_id'], $workspaceId]);
            }
            
            Response::json(['data' => ['id' => $referralId]], 201);
            break;
            
        default:
            Response::error('Method not allowed', 405);
    }
} catch (Exception $e) {
    Logger::error('Affiliate Referrals API error: ' . $e->getMessage());
    Response::error('Internal server error: ' . $e->getMessage(), 500);
}
