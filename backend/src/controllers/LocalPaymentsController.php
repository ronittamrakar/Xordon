<?php

namespace Xordon\Controllers;

use Xordon\Database;
use Xordon\Response;
use Auth;
use TenantContext;
use PDO;
use Exception;

/**
 * Local Payments Controller
 * Manages point-of-sale and in-person payment transactions
 */

class LocalPaymentsController
{
    private static function getContext()
    {
        $ctx = $GLOBALS['tenantContext'] ?? TenantContext::resolveOrFail();
        return $ctx;
    }

    /**
     * Get dashboard stats for local payments
     */
    public static function getStats()
    {
        try {
            $ctx = self::getContext();
            $db = Database::conn();
            $today = date('Y-m-d');
            $weekStart = date('Y-m-d', strtotime('-7 days'));
            $monthStart = date('Y-m-01');

            // Today's volume
            $stmt = $db->prepare("
                SELECT COALESCE(SUM(amount), 0) as volume, COUNT(*) as count
                FROM payment_transactions 
                WHERE workspace_id = ? 
                AND status = 'completed'
                AND DATE(created_at) = ?
            ");
            $stmt->execute([$ctx->workspaceId, $today]);
            $todayData = $stmt->fetch(PDO::FETCH_ASSOC);

            // Pending settlements
            $stmt = $db->prepare("
                SELECT COALESCE(SUM(amount), 0)
                FROM payment_transactions 
                WHERE workspace_id = ? 
                AND status = 'pending'
            ");
            $stmt->execute([$ctx->workspaceId]);
            $pendingSettlements = (float)$stmt->fetchColumn();

            // Weekly volume
            $stmt = $db->prepare("
                SELECT COALESCE(SUM(amount), 0)
                FROM payment_transactions 
                WHERE workspace_id = ? 
                AND status = 'completed'
                AND DATE(created_at) >= ?
            ");
            $stmt->execute([$ctx->workspaceId, $weekStart]);
            $weeklyVolume = (float)$stmt->fetchColumn();

            // Monthly volume
            $stmt = $db->prepare("
                SELECT COALESCE(SUM(amount), 0)
                FROM payment_transactions 
                WHERE workspace_id = ? 
                AND status = 'completed'
                AND DATE(created_at) >= ?
            ");
            $stmt->execute([$ctx->workspaceId, $monthStart]);
            $monthlyVolume = (float)$stmt->fetchColumn();

            // Average transaction
            $stmt = $db->prepare("
                SELECT AVG(amount)
                FROM payment_transactions 
                WHERE workspace_id = ? 
                AND status = 'completed'
            ");
            $stmt->execute([$ctx->workspaceId]);
            $avgTransaction = (float)($stmt->fetchColumn() ?: 0);

            // Success rate
            $stmt = $db->prepare("
                SELECT 
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as success,
                    COUNT(*) as total
                FROM payment_transactions 
                WHERE workspace_id = ?
            ");
            $stmt->execute([$ctx->workspaceId]);
            $rateData = $stmt->fetch(PDO::FETCH_ASSOC);
            $successRate = $rateData['total'] > 0 
                ? round(($rateData['success'] / $rateData['total']) * 100, 1) 
                : 100;

            return Response::json([
                'today_volume' => (float)$todayData['volume'],
                'today_transactions' => (int)$todayData['count'],
                'pending_settlements' => $pendingSettlements,
                'weekly_volume' => $weeklyVolume,
                'monthly_volume' => $monthlyVolume,
                'avg_transaction' => round($avgTransaction, 2),
                'success_rate' => $successRate
            ]);
        } catch (Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * List all transactions
     */
    public static function getTransactions()
    {
        try {
            $ctx = self::getContext();
            $db = Database::conn();

            $status = $_GET['status'] ?? null;
            $method = $_GET['payment_method'] ?? null;
            $startDate = $_GET['start_date'] ?? null;
            $endDate = $_GET['end_date'] ?? null;

            $sql = "
                SELECT t.*, 
                       c.first_name as contact_first_name,
                       c.last_name as contact_last_name
                FROM payment_transactions t
                LEFT JOIN contacts c ON t.contact_id = c.id
                WHERE t.workspace_id = ?
            ";
            $params = [$ctx->workspaceId];

            if ($status) {
                $sql .= " AND t.status = ?";
                $params[] = $status;
            }

            if ($method) {
                $sql .= " AND t.payment_method = ?";
                $params[] = $method;
            }

            if ($startDate) {
                $sql .= " AND DATE(t.created_at) >= ?";
                $params[] = $startDate;
            }

            if ($endDate) {
                $sql .= " AND DATE(t.created_at) <= ?";
                $params[] = $endDate;
            }

            $sql .= " ORDER BY t.created_at DESC LIMIT 100";

            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Format customer name if from contact
            foreach ($transactions as &$tx) {
                if (!empty($tx['contact_first_name']) || !empty($tx['contact_last_name'])) {
                    $tx['customer_name'] = trim(($tx['contact_first_name'] ?? '') . ' ' . ($tx['contact_last_name'] ?? ''));
                }
                unset($tx['contact_first_name'], $tx['contact_last_name']);
            }

            return Response::json(['items' => $transactions]);
        } catch (Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get a single transaction by ID
     */
    public static function getTransaction($id)
    {
        try {
            $ctx = self::getContext();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT t.*, 
                       c.first_name as contact_first_name,
                       c.last_name as contact_last_name,
                       c.email as contact_email,
                       c.phone as contact_phone
                FROM payment_transactions t
                LEFT JOIN contacts c ON t.contact_id = c.id
                WHERE t.id = ? AND t.workspace_id = ?
            ");
            $stmt->execute([$id, $ctx->workspaceId]);
            $tx = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$tx) {
                return Response::json(['error' => 'Transaction not found'], 404);
            }

            return Response::json($tx);
        } catch (Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Process a new payment transaction
     */
    public static function processTransaction()
    {
        try {
            $ctx = self::getContext();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);

            // Generate transaction ID
            $txId = 'TXN-' . strtoupper(substr(md5(uniqid()), 0, 8));

            $stmt = $db->prepare("
                INSERT INTO payment_transactions (
                    workspace_id, transaction_id, amount, payment_method, status,
                    customer_name, customer_email, contact_id, invoice_id,
                    terminal_id, card_last_four, card_brand, notes, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");

            $status = $data['status'] ?? 'completed';
            
            $stmt->execute([
                $ctx->workspaceId,
                $txId,
                $data['amount'] ?? 0,
                $data['payment_method'] ?? 'card',
                $status,
                $data['customer_name'] ?? '',
                $data['customer_email'] ?? null,
                $data['contact_id'] ?? null,
                $data['invoice_id'] ?? null,
                $data['terminal_id'] ?? null,
                $data['card_last_four'] ?? null,
                $data['card_brand'] ?? null,
                $data['notes'] ?? null
            ]);

            $newId = $db->lastInsertId();

            return Response::json([
                'success' => true,
                'id' => $newId,
                'transaction_id' => $txId,
                'status' => $status
            ], 201);
        } catch (Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Refund a transaction
     */
    public static function refundTransaction($id)
    {
        try {
            $ctx = self::getContext();
            $db = Database::conn();

            // Verify transaction exists and is completed
            $stmt = $db->prepare("
                SELECT * FROM payment_transactions 
                WHERE id = ? AND workspace_id = ? AND status = 'completed'
            ");
            $stmt->execute([$id, $ctx->workspaceId]);
            $tx = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$tx) {
                return Response::json(['error' => 'Transaction not found or cannot be refunded'], 400);
            }

            // Update status to refunded
            $stmt = $db->prepare("
                UPDATE payment_transactions 
                SET status = 'refunded', refunded_at = NOW()
                WHERE id = ? AND workspace_id = ?
            ");
            $stmt->execute([$id, $ctx->workspaceId]);

            return Response::json(['success' => true, 'message' => 'Transaction refunded']);
        } catch (Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * List payment terminals
     */
    public static function getTerminals()
    {
        try {
            $ctx = self::getContext();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT t.*, 
                       (SELECT COUNT(*) FROM payment_transactions WHERE terminal_id = t.id) as total_transactions,
                       (SELECT MAX(created_at) FROM payment_transactions WHERE terminal_id = t.id) as last_transaction_at
                FROM payment_terminals t
                WHERE t.workspace_id = ?
                ORDER BY t.terminal_name ASC
            ");
            $stmt->execute([$ctx->workspaceId]);
            $terminals = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // If no terminals exist, return mock data for demo
            if (empty($terminals)) {
                $terminals = [
                    [
                        'id' => 1,
                        'terminal_name' => 'Front Desk POS',
                        'terminal_id' => 'TERM-001',
                        'provider' => 'stripe',
                        'status' => 'active',
                        'location' => 'Main Office',
                        'total_transactions' => 0,
                        'last_transaction_at' => null
                    ],
                    [
                        'id' => 2,
                        'terminal_name' => 'Mobile Terminal',
                        'terminal_id' => 'TERM-002',
                        'provider' => 'square',
                        'status' => 'active',
                        'location' => 'Field Service',
                        'total_transactions' => 0,
                        'last_transaction_at' => null
                    ]
                ];
            }

            return Response::json(['items' => $terminals]);
        } catch (Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Add a new terminal
     */
    public static function addTerminal()
    {
        try {
            $ctx = self::getContext();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);

            // Generate terminal ID if not provided
            $terminalId = $data['terminal_id'] ?? 'TERM-' . strtoupper(substr(md5(uniqid()), 0, 6));

            $stmt = $db->prepare("
                INSERT INTO payment_terminals (
                    workspace_id, terminal_name, terminal_id, provider, status, location, created_at
                ) VALUES (?, ?, ?, ?, 'active', ?, NOW())
            ");

            $stmt->execute([
                $ctx->workspaceId,
                $data['terminal_name'] ?? 'New Terminal',
                $terminalId,
                $data['provider'] ?? 'stripe',
                $data['location'] ?? ''
            ]);

            return Response::json([
                'success' => true,
                'id' => $db->lastInsertId(),
                'terminal_id' => $terminalId
            ], 201);
        } catch (Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Update a terminal
     */
    public static function updateTerminal($id)
    {
        try {
            $ctx = self::getContext();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);

            $allowedFields = ['terminal_name', 'provider', 'status', 'location'];
            $updates = [];
            $params = [];

            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }

            if (empty($updates)) {
                return Response::json(['error' => 'No fields to update'], 400);
            }

            $params[] = $id;
            $params[] = $ctx->workspaceId;

            $sql = "UPDATE payment_terminals SET " . implode(', ', $updates) . " WHERE id = ? AND workspace_id = ?";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete a terminal
     */
    public static function deleteTerminal($id)
    {
        try {
            $ctx = self::getContext();
            $db = Database::conn();

            $stmt = $db->prepare("DELETE FROM payment_terminals WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $ctx->workspaceId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }
}
