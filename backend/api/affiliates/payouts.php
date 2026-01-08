<?php
/**
 * Affiliate Payouts API
 * GET /api/affiliates/payouts - List payouts
 * POST /api/affiliates/payouts - Create payout
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
            $stmt = $db->prepare("
                SELECT p.*, a.name as affiliate_name, a.email as affiliate_email
                FROM affiliate_payouts p
                JOIN affiliates a ON p.affiliate_id = a.id
                WHERE p.workspace_id = ?
                ORDER BY p.created_at DESC
            ");
            $stmt->execute([$workspaceId]);
            $payouts = $stmt->fetchAll();
            
            Response::json(['data' => $payouts]);
            break;
            
        case 'POST':
            $data = get_json_body();
            
            // Validate required fields
            if (empty($data['affiliate_id']) || empty($data['amount'])) {
                Response::error('Affiliate ID and amount are required', 400);
            }
            
            // Verify affiliate exists and has sufficient balance
            $stmt = $db->prepare("
                SELECT id, unpaid_balance, name, email 
                FROM affiliates 
                WHERE id = ? AND workspace_id = ?
            ");
            $stmt->execute([$data['affiliate_id'], $workspaceId]);
            $affiliate = $stmt->fetch();
            
            if (!$affiliate) {
                Response::error('Affiliate not found', 404);
            }
            
            if ($affiliate['unpaid_balance'] < $data['amount']) {
                Response::error('Insufficient unpaid balance', 400);
            }
            
            // Begin transaction
            $db->beginTransaction();
            
            try {
                // Insert payout
                $stmt = $db->prepare("
                    INSERT INTO affiliate_payouts (
                        workspace_id, affiliate_id, amount, currency,
                        payment_method, payment_reference, status,
                        period_start, period_end, notes,
                        processed_by, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ");
                
                $stmt->execute([
                    $workspaceId,
                    $data['affiliate_id'],
                    $data['amount'],
                    $data['currency'] ?? 'USD',
                    $data['payment_method'] ?? null,
                    $data['payment_reference'] ?? null,
                    $data['status'] ?? 'pending',
                    $data['period_start'] ?? null,
                    $data['period_end'] ?? null,
                    $data['notes'] ?? null,
                    $user['id']
                ]);
                
                $payoutId = $db->lastInsertId();
                
                // Update affiliate unpaid balance
                $stmt = $db->prepare("
                    UPDATE affiliates 
                    SET unpaid_balance = unpaid_balance - ?
                    WHERE id = ? AND workspace_id = ?
                ");
                $stmt->execute([$data['amount'], $data['affiliate_id'], $workspaceId]);
                
                // If status is completed, also update processed_at
                if ($data['status'] === 'completed') {
                    $stmt = $db->prepare("
                        UPDATE affiliate_payouts 
                        SET processed_at = NOW()
                        WHERE id = ?
                    ");
                    $stmt->execute([$payoutId]);
                }
                
                $db->commit();
                
                Response::json(['data' => ['id' => $payoutId]], 201);
            } catch (Exception $e) {
                $db->rollBack();
                throw $e;
            }
            break;
            
        default:
            Response::error('Method not allowed', 405);
    }
} catch (Exception $e) {
    Logger::error('Affiliate Payouts API error: ' . $e->getMessage());
    Response::error('Internal server error: ' . $e->getMessage(), 500);
}
