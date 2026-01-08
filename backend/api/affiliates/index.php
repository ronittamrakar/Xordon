<?php
/**
 * Affiliates API - Main endpoint
 * GET /api/affiliates - List affiliates
 * POST /api/affiliates - Create affiliate
 * GET /api/affiliates/:id - Get affiliate details
 * PUT /api/affiliates/:id - Update affiliate
 * DELETE /api/affiliates/:id - Delete affiliate
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
$uri = $_SERVER['REQUEST_URI'];

// Extract ID from URI if present (e.g., /api/affiliates/123)
$parts = explode('/', trim(parse_url($uri, PHP_URL_PATH), '/'));
$id = null;
if (count($parts) >= 3 && is_numeric($parts[2])) {
    $id = (int)$parts[2];
}

try {
    switch ($method) {
        case 'GET':
            if ($id) {
                // Get single affiliate with details
                $stmt = $db->prepare("
                    SELECT * FROM affiliates 
                    WHERE id = ? AND workspace_id = ?
                ");
                $stmt->execute([$id, $workspaceId]);
                $affiliate = $stmt->fetch();
                
                if (!$affiliate) {
                    Response::error('Affiliate not found', 404);
                }
                
                // Get recent referrals
                $stmt = $db->prepare("
                    SELECT * FROM affiliate_referrals
                    WHERE affiliate_id = ? AND workspace_id = ?
                    ORDER BY referred_at DESC
                    LIMIT 20
                ");
                $stmt->execute([$id, $workspaceId]);
                $affiliate['recent_referrals'] = $stmt->fetchAll();
                
                // Get payout history
                $stmt = $db->prepare("
                    SELECT * FROM affiliate_payouts
                    WHERE affiliate_id = ? AND workspace_id = ?
                    ORDER BY created_at DESC
                    LIMIT 20
                ");
                $stmt->execute([$id, $workspaceId]);
                $affiliate['payout_history'] = $stmt->fetchAll();
                
                Response::json(['data' => $affiliate]);
            } else {
                // List all affiliates
                $stmt = $db->prepare("
                    SELECT * FROM affiliates 
                    WHERE workspace_id = ?
                    ORDER BY created_at DESC
                ");
                $stmt->execute([$workspaceId]);
                $affiliates = $stmt->fetchAll();
                
                Response::json(['data' => $affiliates]);
            }
            break;
            
        case 'POST':
            $data = get_json_body();
            
            // Validate required fields
            if (empty($data['name']) || empty($data['email'])) {
                Response::error('Name and email are required', 400);
            }
            
            // Generate unique code
            $uniqueCode = strtoupper(substr(md5($data['email'] . time()), 0, 8));
            
            // Check if code exists
            while (true) {
                $stmt = $db->prepare("SELECT id FROM affiliates WHERE unique_code = ?");
                $stmt->execute([$uniqueCode]);
                if (!$stmt->fetch()) break;
                $uniqueCode = strtoupper(substr(md5($uniqueCode . time()), 0, 8));
            }
            
            // Insert affiliate
            $stmt = $db->prepare("
                INSERT INTO affiliates (
                    workspace_id, name, email, status, commission_rate,
                    unique_code, phone, company_name, payment_method, payment_email,
                    notes, welcome_message, cookie_duration_days, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            
            $status = $data['status'] ?? 'pending';
            $commissionRate = $data['commission_rate'] ?? 20.00;
            
            $stmt->execute([
                $workspaceId,
                $data['name'],
                $data['email'],
                $status,
                $commissionRate,
                $uniqueCode,
                $data['phone'] ?? null,
                $data['company_name'] ?? null,
                $data['payment_method'] ?? null,
                $data['payment_email'] ?? null,
                $data['notes'] ?? null,
                $data['welcome_message'] ?? null,
                $data['cookie_duration_days'] ?? 30
            ]);
            
            $affiliateId = $db->lastInsertId();
            
            // TODO: Send invitation email with welcome message
            
            Response::json([
                'data' => [
                    'id' => $affiliateId,
                    'unique_code' => $uniqueCode
                ]
            ], 201);
            break;
            
        case 'PUT':
            if (!$id) {
                Response::error('Affiliate ID required', 400);
            }
            
            $data = get_json_body();
            
            // Check affiliate exists
            $stmt = $db->prepare("SELECT id FROM affiliates WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            if (!$stmt->fetch()) {
                Response::error('Affiliate not found', 404);
            }
            
            // Build update query dynamically
            $updates = [];
            $params = [];
            $allowedFields = ['name', 'email', 'status', 'commission_rate', 'phone', 
                             'company_name', 'payment_method', 'payment_email', 
                             'notes', 'cookie_duration_days'];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }
            
            if (empty($updates)) {
                Response::error('No fields to update', 400);
            }
            
            $params[] = $id;
            $params[] = $workspaceId;
            
            $stmt = $db->prepare("
                UPDATE affiliates 
                SET " . implode(', ', $updates) . "
                WHERE id = ? AND workspace_id = ?
            ");
            $stmt->execute($params);
            
            Response::json(['message' => 'Affiliate updated successfully']);
            break;
            
        case 'DELETE':
            if (!$id) {
                Response::error('Affiliate ID required', 400);
            }
            
            // Check affiliate exists
            $stmt = $db->prepare("SELECT id FROM affiliates WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            if (!$stmt->fetch()) {
                Response::error('Affiliate not found', 404);
            }
            
            // Delete affiliate (cascades will handle related records)
            $stmt = $db->prepare("DELETE FROM affiliates WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            
            Response::json(['message' => 'Affiliate deleted successfully']);
            break;
            
        default:
            Response::error('Method not allowed', 405);
    }
} catch (Exception $e) {
    Logger::error('Affiliates API error: ' . $e->getMessage());
    Response::error('Internal server error: ' . $e->getMessage(), 500);
}
