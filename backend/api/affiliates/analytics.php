<?php
/**
 * Affiliate Analytics API
 * GET /api/affiliates/analytics - Get affiliate program analytics
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

try {
    // Get affiliate stats
    $stmt = $db->prepare("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
        FROM affiliates
        WHERE workspace_id = ?
    ");
    $stmt->execute([$workspaceId]);
    $affiliateStats = $stmt->fetch();
    
    // Get referral stats
    $stmt = $db->prepare("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted,
            SUM(commission_amount) as total_commissions
        FROM affiliate_referrals
        WHERE workspace_id = ?
    ");
    $stmt->execute([$workspaceId]);
    $referralStats = $stmt->fetch();
    
    // Get payout stats
    $stmt = $db->prepare("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_paid,
            SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount
        FROM affiliate_payouts
        WHERE workspace_id = ?
    ");
    $stmt->execute([$workspaceId]);
    $payoutStats = $stmt->fetch();
    
    // Also calculate pending from unpaid balances
    $stmt = $db->prepare("
        SELECT SUM(unpaid_balance) as total_unpaid
        FROM affiliates
        WHERE workspace_id = ?
    ");
    $stmt->execute([$workspaceId]);
    $unpaidBalance = $stmt->fetchColumn();
    
    Response::json([
        'data' => [
            'affiliates' => [
                'total' => (int)$affiliateStats['total'],
                'active' => (int)$affiliateStats['active'],
                'pending' => (int)$affiliateStats['pending']
            ],
            'referrals' => [
                'total' => (int)$referralStats['total'],
                'converted' => (int)$referralStats['converted'],
                'total_commissions' => (float)($referralStats['total_commissions'] ?? 0)
            ],
            'payouts' => [
                'total' => (int)$payoutStats['total'],
                'total_paid' => (float)($payoutStats['total_paid'] ?? 0),
                'pending_amount' => (float)($unpaidBalance ?? 0)
            ]
        ]
    ]);
} catch (Exception $e) {
    Logger::error('Affiliate Analytics API error: ' . $e->getMessage());
    Response::error('Internal server error: ' . $e->getMessage(), 500);
}
