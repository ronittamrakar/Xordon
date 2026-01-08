<?php

namespace Xordon\Controllers;

use Xordon\Core\Database;
use Xordon\Core\Auth;
use Xordon\Core\Response;

class PaymentTransactionsController {
    
    public static function recordPayment() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $invoiceId = isset($data['invoice_id']) && $data['invoice_id'] !== '' ? $data['invoice_id'] : null;
        $amount = $data['amount'] ?? null;
        $paymentType = $data['payment_type'] ?? 'partial';
        $paymentMethod = $data['payment_method'] ?? 'manual';
        $notes = $data['notes'] ?? null;
        
        if (!$amount) {
            return Response::error('Amount required', 400);
        }
        
        $db = Database::conn();
        
        // Validate invoice if provided
        $invoice = null;
        if ($invoiceId) {
            $stmt = $db->prepare("SELECT * FROM invoices WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$invoiceId, $ctx->workspaceId]);
            $invoice = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            if (!$invoice) {
                return Response::error('Invoice not found', 404);
            }
        }
        
        // Record transaction
        $stmt = $db->prepare("
            INSERT INTO payment_transactions 
            (workspace_id, company_id, invoice_id, amount, payment_method, payment_type, notes, created_by, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed')
        ");
        
        $stmt->execute([
            $ctx->workspaceId,
            $ctx->activeCompanyId ?? null,
            $invoiceId,
            $amount,
            $paymentMethod,
            $paymentType,
            $notes,
            Auth::userId()
        ]);
        
        $transactionId = $db->lastInsertId();
        
        $newStatus = null;
        $newAmountDue = null;

        // Update invoice amounts if invoice exists
        if ($invoice) {
            $newAmountPaid = $invoice['amount_paid'] + $amount;
            $newAmountDue = $invoice['total'] - $newAmountPaid;
            
            $newStatus = 'partial';
            if ($newAmountDue <= 0) {
                $newStatus = 'paid';
                $newAmountDue = 0;
            } elseif ($newAmountPaid == 0) {
                $newStatus = $invoice['status'];
            }
            
            $stmt = $db->prepare("
                UPDATE invoices 
                SET amount_paid = ?, amount_due = ?, status = ?, updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$newAmountPaid, $newAmountDue, $newStatus, $invoiceId]);
        }
        
        // Emit webhook event
        self::emitWebhookEvent('payment.received', [
            'transaction_id' => $transactionId,
            'invoice_id' => $invoiceId,
            'amount' => $amount,
            'payment_type' => $paymentType
        ]);
        
        return Response::success([
            'transaction_id' => $transactionId,
            'invoice_status' => $newStatus,
            'amount_due' => $newAmountDue
        ]);
    }
    
    public static function listTransactions() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $invoiceId = $_GET['invoice_id'] ?? null;
        
        $db = Database::conn();
        
        $sql = "SELECT * FROM payment_transactions WHERE workspace_id = ?";
        $params = [$ctx->workspaceId];
        
        if ($invoiceId) {
            $sql .= " AND invoice_id = ?";
            $params[] = $invoiceId;
        }
        
        $sql .= " ORDER BY created_at DESC";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $transactions = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return Response::success($transactions);
    }
    
    private static function emitWebhookEvent($eventType, $payload) {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) return;
        
        $db = Database::conn();
        
        // Get active webhooks for this event
        $stmt = $db->prepare("
            SELECT * FROM webhook_endpoints 
            WHERE workspace_id = ? AND is_active = 1
        ");
        $stmt->execute([$ctx->workspaceId]);
        $endpoints = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        foreach ($endpoints as $endpoint) {
            $events = json_decode($endpoint['events'], true);
            if (in_array($eventType, $events) || in_array('*', $events)) {
                // Queue webhook delivery
                $stmt = $db->prepare("
                    INSERT INTO webhook_deliveries 
                    (endpoint_id, event_type, payload, status)
                    VALUES (?, ?, ?, 'pending')
                ");
                $stmt->execute([
                    $endpoint['id'],
                    $eventType,
                    json_encode($payload)
                ]);
            }
        }
    }
}
