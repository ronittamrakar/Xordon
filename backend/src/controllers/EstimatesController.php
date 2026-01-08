<?php
/**
 * Estimates Controller
 * Quotes and estimates management
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class EstimatesController {
    private static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        throw new Exception('Workspace context required');
    }

    private static function getUserId(): ?int {
        try {
            return Auth::userIdOrFail();
        } catch (Exception $e) {
            return null;
        }
    }

    private static function generateEstimateNumber(PDO $db, int $workspaceId): string {
        $stmt = $db->prepare("SELECT COUNT(*) + 1 FROM estimates WHERE workspace_id = ?");
        $stmt->execute([$workspaceId]);
        $num = $stmt->fetchColumn();
        return 'EST-' . str_pad($num, 5, '0', STR_PAD_LEFT);
    }

    private static function calculateTotals(array $items, ?string $discountType, ?float $discountValue, ?float $taxRate): array {
        $subtotal = 0;
        foreach ($items as $item) {
            $subtotal += $item['total'] ?? (($item['quantity'] ?? 1) * ($item['unit_price'] ?? 0));
        }

        $discountAmount = 0;
        if ($discountValue && $discountValue > 0) {
            if ($discountType === 'percentage') {
                $discountAmount = $subtotal * ($discountValue / 100);
            } else {
                $discountAmount = $discountValue;
            }
        }

        $afterDiscount = $subtotal - $discountAmount;
        $taxAmount = $taxRate ? ($afterDiscount * ($taxRate / 100)) : 0;
        $total = $afterDiscount + $taxAmount;

        return [
            'subtotal' => round($subtotal, 2),
            'discount_amount' => round($discountAmount, 2),
            'tax_amount' => round($taxAmount, 2),
            'total' => round($total, 2)
        ];
    }

    public static function index() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $limit = min((int)($_GET['limit'] ?? 50), 100);
            $offset = (int)($_GET['offset'] ?? 0);

            $where = ['e.workspace_id = ?'];
            $params = [$workspaceId];

            if (!empty($_GET['status'])) {
                $where[] = 'e.status = ?';
                $params[] = $_GET['status'];
            }

            if (!empty($_GET['contact_id'])) {
                $where[] = 'e.contact_id = ?';
                $params[] = (int)$_GET['contact_id'];
            }

            $whereClause = implode(' AND ', $where);

            $stmt = $db->prepare("
                SELECT e.*, 
                    c.first_name as contact_first_name, c.last_name as contact_last_name, c.email as contact_email
                FROM estimates e
                LEFT JOIN contacts c ON c.id = e.contact_id
                WHERE $whereClause
                ORDER BY e.created_at DESC
                LIMIT ? OFFSET ?
            ");
            $params[] = $limit;
            $params[] = $offset;
            $stmt->execute($params);
            $estimates = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $countParams = array_slice($params, 0, -2);
            $countStmt = $db->prepare("SELECT COUNT(*) FROM estimates e WHERE $whereClause");
            $countStmt->execute($countParams);
            $total = (int)$countStmt->fetchColumn();

            return Response::json([
                'data' => $estimates,
                'meta' => ['total' => $total, 'limit' => $limit, 'offset' => $offset]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch estimates: ' . $e->getMessage());
        }
    }

    public static function show($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT e.*, 
                    c.first_name as contact_first_name, c.last_name as contact_last_name, 
                    c.email as contact_email, c.phone as contact_phone
                FROM estimates e
                LEFT JOIN contacts c ON c.id = e.contact_id
                WHERE e.id = ? AND e.workspace_id = ?
            ");
            $stmt->execute([$id, $workspaceId]);
            $estimate = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$estimate) {
                return Response::error('Estimate not found', 404);
            }

            // Get items
            $itemsStmt = $db->prepare("SELECT * FROM estimate_items WHERE estimate_id = ? ORDER BY sort_order");
            $itemsStmt->execute([$id]);
            $estimate['items'] = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $estimate]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch estimate: ' . $e->getMessage());
        }
    }

    public static function create() {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $estimateNumber = $data['estimate_number'] ?? self::generateEstimateNumber($db, $workspaceId);

            // Calculate totals from items
            $items = $data['items'] ?? [];
            $totals = self::calculateTotals(
                $items,
                $data['discount_type'] ?? null,
                $data['discount_value'] ?? null,
                $data['tax_rate'] ?? null
            );

            $stmt = $db->prepare("
                INSERT INTO estimates 
                (workspace_id, company_id, contact_id, estimate_number, title, issue_date, expiry_date,
                 status, subtotal, discount_type, discount_value, discount_amount, tax_rate, tax_amount,
                 total, currency, notes, terms, footer, assigned_to)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $workspaceId,
                $data['company_id'] ?? null,
                $data['contact_id'] ?? null,
                $estimateNumber,
                $data['title'] ?? null,
                $data['issue_date'] ?? date('Y-m-d'),
                $data['expiry_date'] ?? null,
                $data['status'] ?? 'draft',
                $totals['subtotal'],
                $data['discount_type'] ?? null,
                $data['discount_value'] ?? null,
                $totals['discount_amount'],
                $data['tax_rate'] ?? null,
                $totals['tax_amount'],
                $totals['total'],
                $data['currency'] ?? 'USD',
                $data['notes'] ?? null,
                $data['terms'] ?? null,
                $data['footer'] ?? null,
                $data['assigned_to'] ?? $userId
            ]);

            $estimateId = $db->lastInsertId();

            // Add items
            if (!empty($items)) {
                $itemStmt = $db->prepare("
                    INSERT INTO estimate_items 
                    (estimate_id, product_id, service_id, name, description, quantity, unit_price,
                     discount_type, discount_value, tax_rate, subtotal, discount_amount, tax_amount, total, sort_order)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");

                foreach ($items as $i => $item) {
                    $qty = $item['quantity'] ?? 1;
                    $price = $item['unit_price'] ?? 0;
                    $itemSubtotal = $qty * $price;
                    $itemDiscount = 0;
                    if (!empty($item['discount_value'])) {
                        $itemDiscount = $item['discount_type'] === 'percentage' 
                            ? $itemSubtotal * ($item['discount_value'] / 100)
                            : $item['discount_value'];
                    }
                    $afterDiscount = $itemSubtotal - $itemDiscount;
                    $itemTax = !empty($item['tax_rate']) ? $afterDiscount * ($item['tax_rate'] / 100) : 0;
                    $itemTotal = $afterDiscount + $itemTax;

                    $itemStmt->execute([
                        $estimateId,
                        $item['product_id'] ?? null,
                        $item['service_id'] ?? null,
                        $item['name'],
                        $item['description'] ?? null,
                        $qty,
                        $price,
                        $item['discount_type'] ?? null,
                        $item['discount_value'] ?? null,
                        $item['tax_rate'] ?? null,
                        $itemSubtotal,
                        $itemDiscount,
                        $itemTax,
                        $itemTotal,
                        $i
                    ]);
                }
            }

            return Response::json(['data' => ['id' => (int)$estimateId, 'estimate_number' => $estimateNumber]]);
        } catch (Exception $e) {
            return Response::error('Failed to create estimate: ' . $e->getMessage());
        }
    }

    public static function update($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Verify ownership
            $checkStmt = $db->prepare("SELECT id FROM estimates WHERE id = ? AND workspace_id = ?");
            $checkStmt->execute([$id, $workspaceId]);
            if (!$checkStmt->fetch()) {
                return Response::error('Estimate not found', 404);
            }

            // Recalculate if items provided
            if (isset($data['items'])) {
                $totals = self::calculateTotals(
                    $data['items'],
                    $data['discount_type'] ?? null,
                    $data['discount_value'] ?? null,
                    $data['tax_rate'] ?? null
                );
                $data = array_merge($data, $totals);

                // Replace items
                $db->prepare("DELETE FROM estimate_items WHERE estimate_id = ?")->execute([$id]);

                $itemStmt = $db->prepare("
                    INSERT INTO estimate_items 
                    (estimate_id, product_id, service_id, name, description, quantity, unit_price,
                     discount_type, discount_value, tax_rate, subtotal, discount_amount, tax_amount, total, sort_order)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");

                foreach ($data['items'] as $i => $item) {
                    $qty = $item['quantity'] ?? 1;
                    $price = $item['unit_price'] ?? 0;
                    $itemSubtotal = $qty * $price;
                    $itemDiscount = 0;
                    if (!empty($item['discount_value'])) {
                        $itemDiscount = $item['discount_type'] === 'percentage' 
                            ? $itemSubtotal * ($item['discount_value'] / 100)
                            : $item['discount_value'];
                    }
                    $afterDiscount = $itemSubtotal - $itemDiscount;
                    $itemTax = !empty($item['tax_rate']) ? $afterDiscount * ($item['tax_rate'] / 100) : 0;
                    $itemTotal = $afterDiscount + $itemTax;

                    $itemStmt->execute([
                        $id,
                        $item['product_id'] ?? null,
                        $item['service_id'] ?? null,
                        $item['name'],
                        $item['description'] ?? null,
                        $qty,
                        $price,
                        $item['discount_type'] ?? null,
                        $item['discount_value'] ?? null,
                        $item['tax_rate'] ?? null,
                        $itemSubtotal,
                        $itemDiscount,
                        $itemTax,
                        $itemTotal,
                        $i
                    ]);
                }
                unset($data['items']);
            }

            $updates = [];
            $params = [];

            $allowedFields = [
                'company_id', 'contact_id', 'title', 'issue_date', 'expiry_date', 'status',
                'subtotal', 'discount_type', 'discount_value', 'discount_amount', 'tax_rate',
                'tax_amount', 'total', 'currency', 'notes', 'terms', 'footer', 'assigned_to'
            ];

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }

            if (!empty($updates)) {
                $params[] = $id;
                $stmt = $db->prepare("UPDATE estimates SET " . implode(', ', $updates) . " WHERE id = ?");
                $stmt->execute($params);
            }

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to update estimate: ' . $e->getMessage());
        }
    }

    public static function send($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                UPDATE estimates SET status = 'sent', sent_at = NOW()
                WHERE id = ? AND workspace_id = ? AND status = 'draft'
            ");
            $stmt->execute([$id, $workspaceId]);

            if ($stmt->rowCount() === 0) {
                return Response::error('Estimate not found or already sent', 400);
            }

            // Fetch estimate details for email
            $stmt = $db->prepare("
                SELECT e.*, c.first_name, c.last_name, c.email 
                FROM estimates e 
                JOIN contacts c ON c.id = e.contact_id 
                WHERE e.id = ?
            ");
            $stmt->execute([$id]);
            $est = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($est && !empty($est['email'])) {
                require_once __DIR__ . '/../services/SystemEmailService.php';
                $emailService = new SystemEmailService();
                $emailService->sendEstimateNotification(
                    $est['email'],
                    ($est['first_name'] . ' ' . $est['last_name']),
                    $est['estimate_number'],
                    (float)$est['total'],
                    $est['currency']
                );
            }

            return Response::json(['success' => true]);

        } catch (Exception $e) {
            return Response::error('Failed to send estimate: ' . $e->getMessage());
        }
    }

    public static function accept($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $stmt = $db->prepare("
                UPDATE estimates 
                SET status = 'accepted', accepted_at = NOW(), accepted_by = ?, signature_url = ?
                WHERE id = ? AND workspace_id = ? AND status IN ('sent', 'viewed')
            ");
            $stmt->execute([
                $data['accepted_by'] ?? null,
                $data['signature_url'] ?? null,
                $id,
                $workspaceId
            ]);

            if ($stmt->rowCount() === 0) {
                return Response::error('Estimate not found or cannot be accepted', 400);
            }

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to accept estimate: ' . $e->getMessage());
        }
    }

    public static function decline($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                UPDATE estimates SET status = 'declined', declined_at = NOW()
                WHERE id = ? AND workspace_id = ? AND status IN ('sent', 'viewed')
            ");
            $stmt->execute([$id, $workspaceId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to decline estimate: ' . $e->getMessage());
        }
    }

    public static function convertToInvoice($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            // Get estimate
            $stmt = $db->prepare("SELECT * FROM estimates WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $estimate = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$estimate) {
                return Response::error('Estimate not found', 404);
            }

            if ($estimate['converted_to_invoice_id']) {
                return Response::error('Estimate already converted', 400);
            }

            // Generate invoice number
            $numStmt = $db->prepare("SELECT COUNT(*) + 1 FROM invoices WHERE workspace_id = ?");
            $numStmt->execute([$workspaceId]);
            $invoiceNumber = 'INV-' . str_pad($numStmt->fetchColumn(), 5, '0', STR_PAD_LEFT);

            // Create invoice
            $invoiceStmt = $db->prepare("
                INSERT INTO invoices 
                (workspace_id, company_id, contact_id, estimate_id, invoice_number, title,
                 issue_date, due_date, status, subtotal, discount_type, discount_value, discount_amount,
                 tax_rate, tax_amount, total, currency, notes, terms, footer)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $invoiceStmt->execute([
                $workspaceId,
                $estimate['company_id'],
                $estimate['contact_id'],
                $id,
                $invoiceNumber,
                $estimate['title'],
                date('Y-m-d'),
                date('Y-m-d', strtotime('+30 days')),
                $estimate['subtotal'],
                $estimate['discount_type'],
                $estimate['discount_value'],
                $estimate['discount_amount'],
                $estimate['tax_rate'],
                $estimate['tax_amount'],
                $estimate['total'],
                $estimate['currency'],
                $estimate['notes'],
                $estimate['terms'],
                $estimate['footer']
            ]);

            $invoiceId = $db->lastInsertId();

            // Copy items
            $itemsStmt = $db->prepare("SELECT * FROM estimate_items WHERE estimate_id = ?");
            $itemsStmt->execute([$id]);
            $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

            $insertItemStmt = $db->prepare("
                INSERT INTO invoice_items 
                (invoice_id, product_id, service_id, name, description, quantity, unit_price,
                 discount_type, discount_value, tax_rate, subtotal, discount_amount, tax_amount, total, sort_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            foreach ($items as $item) {
                $insertItemStmt->execute([
                    $invoiceId,
                    $item['product_id'],
                    $item['service_id'],
                    $item['name'],
                    $item['description'],
                    $item['quantity'],
                    $item['unit_price'],
                    $item['discount_type'],
                    $item['discount_value'],
                    $item['tax_rate'],
                    $item['subtotal'],
                    $item['discount_amount'],
                    $item['tax_amount'],
                    $item['total'],
                    $item['sort_order']
                ]);
            }

            // Update estimate
            $db->prepare("UPDATE estimates SET status = 'converted', converted_to_invoice_id = ?, converted_at = NOW() WHERE id = ?")
                ->execute([$invoiceId, $id]);

            return Response::json([
                'data' => [
                    'invoice_id' => (int)$invoiceId,
                    'invoice_number' => $invoiceNumber
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to convert estimate: ' . $e->getMessage());
        }
    }

    public static function delete($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("DELETE FROM estimates WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete estimate: ' . $e->getMessage());
        }
    }

    public static function duplicate($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            // Get original
            $stmt = $db->prepare("SELECT * FROM estimates WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $original = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$original) {
                return Response::error('Estimate not found', 404);
            }

            $newNumber = self::generateEstimateNumber($db, $workspaceId);

            // Create copy
            $copyStmt = $db->prepare("
                INSERT INTO estimates 
                (workspace_id, company_id, contact_id, estimate_number, title, issue_date, expiry_date,
                 status, subtotal, discount_type, discount_value, discount_amount, tax_rate, tax_amount,
                 total, currency, notes, terms, footer, assigned_to)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $copyStmt->execute([
                $workspaceId,
                $original['company_id'],
                $original['contact_id'],
                $newNumber,
                $original['title'] . ' (Copy)',
                date('Y-m-d'),
                $original['expiry_date'] ? date('Y-m-d', strtotime('+30 days')) : null,
                $original['subtotal'],
                $original['discount_type'],
                $original['discount_value'],
                $original['discount_amount'],
                $original['tax_rate'],
                $original['tax_amount'],
                $original['total'],
                $original['currency'],
                $original['notes'],
                $original['terms'],
                $original['footer'],
                $original['assigned_to']
            ]);

            $newId = $db->lastInsertId();

            // Copy items
            $itemsStmt = $db->prepare("SELECT * FROM estimate_items WHERE estimate_id = ?");
            $itemsStmt->execute([$id]);

            $insertStmt = $db->prepare("
                INSERT INTO estimate_items 
                (estimate_id, product_id, service_id, name, description, quantity, unit_price,
                 discount_type, discount_value, tax_rate, subtotal, discount_amount, tax_amount, total, sort_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            while ($item = $itemsStmt->fetch(PDO::FETCH_ASSOC)) {
                $insertStmt->execute([
                    $newId,
                    $item['product_id'],
                    $item['service_id'],
                    $item['name'],
                    $item['description'],
                    $item['quantity'],
                    $item['unit_price'],
                    $item['discount_type'],
                    $item['discount_value'],
                    $item['tax_rate'],
                    $item['subtotal'],
                    $item['discount_amount'],
                    $item['tax_amount'],
                    $item['total'],
                    $item['sort_order']
                ]);
            }

            return Response::json(['data' => ['id' => (int)$newId, 'estimate_number' => $newNumber]]);
        } catch (Exception $e) {
            return Response::error('Failed to duplicate estimate: ' . $e->getMessage());
        }
    }
}
