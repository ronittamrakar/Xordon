<?php

namespace Xordon\Controllers;

use Xordon\Core\Database;
use Xordon\Core\Auth;
use Xordon\Core\Response;

class QuickBooksController {
    
    private const QB_OAUTH_URL = 'https://appcenter.intuit.com/connect/oauth2';
    private const QB_API_URL = 'https://quickbooks.api.intuit.com/v3';
    
    public static function getConnection() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM quickbooks_connections WHERE workspace_id = ?");
        $stmt->execute([$ctx->workspaceId]);
        $connection = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$connection) {
            return Response::success(['connected' => false]);
        }
        
        // Hide sensitive tokens
        unset($connection['access_token']);
        unset($connection['refresh_token']);
        
        $connection['connected'] = true;
        
        return Response::success($connection);
    }
    
    public static function connect() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        // OAuth flow - store authorization code and exchange for tokens
        $authCode = $data['code'] ?? null;
        $realmId = $data['realm_id'] ?? null;
        
        if (!$authCode || !$realmId) {
            return Response::error('Authorization code and realm_id required', 400);
        }
        

        // OAuth Exchange (Mock)
        // In production, use QuickBooks SDK to exchange $authCode for tokens
        // $oauthClient->exchangeAuthCodeForToken($authCode, $realmId);
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            INSERT INTO quickbooks_connections 
            (workspace_id, realm_id, access_token, refresh_token, token_expires_at, sync_enabled)
            VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR), 1)
            ON DUPLICATE KEY UPDATE
            realm_id = VALUES(realm_id),
            access_token = VALUES(access_token),
            refresh_token = VALUES(refresh_token),
            token_expires_at = VALUES(token_expires_at),
            updated_at = NOW()
        ");
        
        $stmt->execute([
            $ctx->workspaceId,
            $realmId,
            'placeholder_access_token',
            'placeholder_refresh_token'
        ]);
        
        return Response::success(['connected' => true]);
    }
    
    public static function disconnect() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("DELETE FROM quickbooks_connections WHERE workspace_id = ?");
        $stmt->execute([$ctx->workspaceId]);
        
        return Response::success(['disconnected' => true]);
    }
    
    public static function updateSettings() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $fields = [];
        $params = [];
        
        $allowedFields = ['sync_enabled', 'auto_sync_invoices', 'auto_sync_payments', 'auto_sync_customers'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($fields)) {
            return Response::error('No fields to update', 400);
        }
        
        $params[] = $ctx->workspaceId;
        
        $sql = "UPDATE quickbooks_connections SET " . implode(', ', $fields) . " WHERE workspace_id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        return self::getConnection();
    }
    
    public static function exportInvoice($invoiceId) {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        // Get connection
        $stmt = $db->prepare("SELECT * FROM quickbooks_connections WHERE workspace_id = ?");
        $stmt->execute([$ctx->workspaceId]);
        $connection = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$connection) {
            return Response::error('QuickBooks not connected', 400);
        }
        
        // Get invoice
        $stmt = $db->prepare("SELECT * FROM invoices WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$invoiceId, $ctx->workspaceId]);
        $invoice = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$invoice) {
            return Response::error('Invoice not found', 404);
        }
        
        // Check if already synced
        $stmt = $db->prepare("
            SELECT * FROM quickbooks_sync_mappings 
            WHERE workspace_id = ? AND entity_type = 'invoice' AND local_id = ?
        ");
        $stmt->execute([$ctx->workspaceId, $invoiceId]);
        $mapping = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if ($mapping) {
            return Response::error('Invoice already synced to QuickBooks', 400);
        }
        
        // TODO: Actually export to QuickBooks API
        // For now, create placeholder mapping
        
        $qbInvoiceId = 'QB-' . $invoiceId . '-' . time();
        
        $stmt = $db->prepare("
            INSERT INTO quickbooks_sync_mappings 
            (workspace_id, entity_type, local_id, quickbooks_id, sync_status)
            VALUES (?, 'invoice', ?, ?, 'synced')
        ");
        $stmt->execute([$ctx->workspaceId, $invoiceId, $qbInvoiceId]);
        
        return Response::success([
            'synced' => true,
            'quickbooks_id' => $qbInvoiceId
        ]);
    }
    
    public static function exportPayment($paymentId) {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        // Get connection
        $stmt = $db->prepare("SELECT * FROM quickbooks_connections WHERE workspace_id = ?");
        $stmt->execute([$ctx->workspaceId]);
        $connection = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$connection) {
            return Response::error('QuickBooks not connected', 400);
        }
        
        // Get payment transaction
        $stmt = $db->prepare("SELECT * FROM payment_transactions WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$paymentId, $ctx->workspaceId]);
        $payment = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$payment) {
            return Response::error('Payment not found', 404);
        }
        
        // TODO: Actually export to QuickBooks API
        
        $qbPaymentId = 'QB-PMT-' . $paymentId . '-' . time();
        
        $stmt = $db->prepare("
            INSERT INTO quickbooks_sync_mappings 
            (workspace_id, entity_type, local_id, quickbooks_id, sync_status)
            VALUES (?, 'payment', ?, ?, 'synced')
        ");
        $stmt->execute([$ctx->workspaceId, $paymentId, $qbPaymentId]);
        
        return Response::success([
            'synced' => true,
            'quickbooks_id' => $qbPaymentId
        ]);
    }
    
    public static function getSyncStatus() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            SELECT entity_type, COUNT(*) as count, sync_status
            FROM quickbooks_sync_mappings
            WHERE workspace_id = ?
            GROUP BY entity_type, sync_status
        ");
        $stmt->execute([$ctx->workspaceId]);
        $stats = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        $stmt = $db->prepare("
            SELECT * FROM quickbooks_sync_mappings
            WHERE workspace_id = ?
            ORDER BY last_synced_at DESC
            LIMIT 20
        ");
        $stmt->execute([$ctx->workspaceId]);
        $recentSyncs = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return Response::success([
            'stats' => $stats,
            'recent_syncs' => $recentSyncs
        ]);
    }
    
    public static function syncAll() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        // Get connection
        $stmt = $db->prepare("SELECT * FROM quickbooks_connections WHERE workspace_id = ?");
        $stmt->execute([$ctx->workspaceId]);
        $connection = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$connection || !$connection['sync_enabled']) {
            return Response::error('QuickBooks sync not enabled', 400);
        }
        
        // Update last sync time
        $stmt = $db->prepare("UPDATE quickbooks_connections SET last_sync_at = NOW() WHERE workspace_id = ?");
        $stmt->execute([$ctx->workspaceId]);
        

        // Simulate sync logic for now (mock implementation)
        // In a real implementation:
        // 1. Fetch changed customers, invoices, payments from local DB
        // 2. Push to QuickBooks API
        // 3. Update sync mappings
        
        $logDetails = [
            'customers_synced' => 0,
            'invoices_synced' => 0,
            'payments_synced' => 0,
            'status' => 'completed'
        ];
        
        // Log the sync attempt
        error_log("QuickBooks Sync: Workspace {$ctx->workspaceId} simulated sync completed.");
        
        return Response::success([
            'synced' => true,
            'message' => 'Sync completed successfully',
            'details' => $logDetails
        ]);
    }
}
