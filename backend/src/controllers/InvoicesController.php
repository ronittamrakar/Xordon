<?php
/**
 * InvoicesController - GHL-style Payments & Invoices
 * Handles invoices, payments, products, and payment links
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../TenantContext.php';

class InvoicesController {
    
    private static function getScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            Response::error('Workspace context required', 403);
            exit;
        }
        return [
            'workspace_id' => (int)$ctx->workspaceId,
            'company_id' => $ctx->activeCompanyId ? (int)$ctx->activeCompanyId : null
        ];
    }
    
    // ==================== INVOICES ====================
    
    /**
     * List invoices
     * GET /invoices
     */
    public static function listInvoices(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $status = $_GET['status'] ?? null;
        $contactId = $_GET['contact_id'] ?? null;
        $limit = min((int)($_GET['limit'] ?? 50), 200);
        $offset = (int)($_GET['offset'] ?? 0);
        
        $where = ['i.workspace_id = ?'];
        $params = [$scope['workspace_id']];
        
        if ($scope['company_id']) {
            $where[] = '(i.company_id = ? OR i.company_id IS NULL)';
            $params[] = $scope['company_id'];
        }
        
        if ($status && in_array($status, ['draft', 'sent', 'viewed', 'paid', 'partial', 'overdue', 'cancelled', 'refunded'])) {
            $where[] = 'i.status = ?';
            $params[] = $status;
        }
        
        if ($contactId) {
            $where[] = 'i.contact_id = ?';
            $params[] = (int)$contactId;
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Get total
        $countSql = "SELECT COUNT(*) FROM invoices i WHERE $whereClause";
        $countStmt = $pdo->prepare($countSql);
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();
        
        $sql = "SELECT i.*, 
                    c.first_name as contact_first_name, c.last_name as contact_last_name, c.email as contact_email
                FROM invoices i
                LEFT JOIN contacts c ON i.contact_id = c.id
                WHERE $whereClause
                ORDER BY i.created_at DESC
                LIMIT ? OFFSET ?";
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json([
            'success' => true,
            'data' => $invoices,
            'meta' => ['total' => $total, 'limit' => $limit, 'offset' => $offset]
        ]);
    }
    
    /**
     * Get single invoice with items
     * GET /invoices/:id
     */
    public static function getInvoice(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $sql = "SELECT i.*, 
                    c.first_name as contact_first_name, c.last_name as contact_last_name, 
                    c.email as contact_email, c.phone as contact_phone,
                    c.address as contact_address
                FROM invoices i
                LEFT JOIN contacts c ON i.contact_id = c.id
                WHERE i.id = ? AND i.workspace_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$id, $scope['workspace_id']]);
        $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$invoice) {
            Response::notFound('Invoice not found');
            return;
        }
        
        // Get line items
        $itemsSql = "SELECT ii.*, p.name as product_name 
                     FROM invoice_items ii 
                     LEFT JOIN products p ON ii.product_id = p.id
                     WHERE ii.invoice_id = ? ORDER BY ii.sort_order";
        $itemsStmt = $pdo->prepare($itemsSql);
        $itemsStmt->execute([$id]);
        $invoice['items'] = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get payments
        $paymentsSql = "SELECT * FROM payments WHERE invoice_id = ? ORDER BY created_at DESC";
        $paymentsStmt = $pdo->prepare($paymentsSql);
        $paymentsStmt->execute([$id]);
        $invoice['payments'] = $paymentsStmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json([
            'success' => true,
            'data' => $invoice
        ]);
    }
    
    /**
     * Create invoice
     * POST /invoices
     */
    public static function createInvoice(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $pdo->beginTransaction();
        try {
            // Get next invoice number
            $settingsStmt = $pdo->prepare("SELECT invoice_prefix, next_invoice_number, default_due_days FROM invoice_settings WHERE workspace_id = ? LIMIT 1");
            $settingsStmt->execute([$scope['workspace_id']]);
            $settings = $settingsStmt->fetch(PDO::FETCH_ASSOC);
            
            $prefix = $settings['invoice_prefix'] ?? 'INV-';
            $nextNumber = $settings['next_invoice_number'] ?? 1001;
            $defaultDueDays = $settings['default_due_days'] ?? 30;
            
            $invoiceNumber = $body['invoice_number'] ?? ($prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT));
            
            $issueDate = $body['issue_date'] ?? date('Y-m-d');
            $dueDate = $body['due_date'] ?? date('Y-m-d', strtotime("+$defaultDueDays days"));
            
            // Calculate totals from items
            $items = $body['items'] ?? [];
            $subtotal = 0;
            $taxAmount = 0;
            
            foreach ($items as $item) {
                $itemTotal = ($item['quantity'] ?? 1) * ($item['unit_price'] ?? 0);
                $itemTax = $itemTotal * (($item['tax_rate'] ?? 0) / 100);
                $subtotal += $itemTotal;
                $taxAmount += $itemTax;
            }
            
            $discountAmount = $body['discount_amount'] ?? 0;
            $total = $subtotal + $taxAmount - $discountAmount;
            
            // Create invoice
            $stmt = $pdo->prepare("
                INSERT INTO invoices 
                (workspace_id, company_id, contact_id, opportunity_id, invoice_number, status,
                 issue_date, due_date, subtotal, tax_amount, discount_amount, total, amount_due,
                 currency, notes, terms, created_by, created_at)
                VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $scope['workspace_id'],
                $scope['company_id'],
                $body['contact_id'] ?? null,
                $body['opportunity_id'] ?? null,
                $invoiceNumber,
                $issueDate,
                $dueDate,
                $subtotal,
                $taxAmount,
                $discountAmount,
                $total,
                $total,
                $body['currency'] ?? 'USD',
                $body['notes'] ?? null,
                $body['terms'] ?? null,
                $userId
            ]);
            
            $invoiceId = (int)$pdo->lastInsertId();
            
            // Create line items
            if (!empty($items)) {
                $itemStmt = $pdo->prepare("
                    INSERT INTO invoice_items 
                    (invoice_id, product_id, description, quantity, unit_price, tax_rate, tax_amount, discount_percent, discount_amount, total, sort_order, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ");
                
                foreach ($items as $i => $item) {
                    $qty = $item['quantity'] ?? 1;
                    $unitPrice = $item['unit_price'] ?? 0;
                    $taxRate = $item['tax_rate'] ?? 0;
                    $itemSubtotal = $qty * $unitPrice;
                    $itemTax = $itemSubtotal * ($taxRate / 100);
                    $discountPct = $item['discount_percent'] ?? 0;
                    $discountAmt = $itemSubtotal * ($discountPct / 100);
                    $itemTotal = $itemSubtotal + $itemTax - $discountAmt;
                    
                    $itemStmt->execute([
                        $invoiceId,
                        $item['product_id'] ?? null,
                        $item['description'] ?? '',
                        $qty,
                        $unitPrice,
                        $taxRate,
                        $itemTax,
                        $discountPct,
                        $discountAmt,
                        $itemTotal,
                        $i
                    ]);
                }
            }
            
            // Update next invoice number
            if ($settings) {
                $pdo->prepare("UPDATE invoice_settings SET next_invoice_number = next_invoice_number + 1 WHERE workspace_id = ?")
                    ->execute([$scope['workspace_id']]);
            } else {
                $pdo->prepare("INSERT INTO invoice_settings (workspace_id, next_invoice_number) VALUES (?, ?)")
                    ->execute([$scope['workspace_id'], $nextNumber + 1]);
            }
            
            // Generate payment link
            $paymentLink = bin2hex(random_bytes(16));
            $pdo->prepare("UPDATE invoices SET payment_link = ? WHERE id = ?")->execute([$paymentLink, $invoiceId]);
            
            $pdo->commit();
            
            Response::json([
                'success' => true,
                'data' => ['id' => $invoiceId, 'invoice_number' => $invoiceNumber, 'payment_link' => $paymentLink],
                'message' => 'Invoice created'
            ], 201);
        } catch (Exception $e) {
            $pdo->rollBack();
            Response::error('Failed to create invoice: ' . $e->getMessage());
        }
    }
    
    /**
     * Update invoice status
     * POST /invoices/:id/status
     */
    public static function updateInvoiceStatus(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $status = $body['status'] ?? null;
        if (!$status || !in_array($status, ['draft', 'sent', 'viewed', 'paid', 'partial', 'overdue', 'cancelled', 'refunded'])) {
            Response::validationError('Valid status required');
            return;
        }
        
        $updates = ['status = ?'];
        $params = [$status];
        
        if ($status === 'sent') {
            $updates[] = 'sent_at = NOW()';
        } elseif ($status === 'viewed') {
            $updates[] = 'viewed_at = NOW()';
        } elseif ($status === 'paid') {
            $updates[] = 'paid_at = NOW()';
            $updates[] = 'amount_due = 0';
        }
        
        $params[] = $id;
        $params[] = $scope['workspace_id'];
        
        $sql = "UPDATE invoices SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ? AND workspace_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        Response::json(['success' => true, 'message' => 'Invoice status updated']);
    }

    /**
     * Update invoice
     * PUT /invoices/:id
     */
    public static function updateInvoice(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $pdo->beginTransaction();
        try {
            // Check if invoice exists
            $checkStmt = $pdo->prepare("SELECT id FROM invoices WHERE id = ? AND workspace_id = ?");
            $checkStmt->execute([$id, $scope['workspace_id']]);
            if (!$checkStmt->fetch()) {
                Response::notFound('Invoice not found');
                return;
            }
            
            // Calculate totals from items
            $items = $body['items'] ?? [];
            $subtotal = 0;
            $taxAmount = 0;
            
            foreach ($items as $item) {
                $itemTotal = ($item['quantity'] ?? 1) * ($item['unit_price'] ?? 0);
                $itemTax = $itemTotal * (($item['tax_rate'] ?? 0) / 100);
                $subtotal += $itemTotal;
                $taxAmount += $itemTax;
            }
            
            $discountAmount = $body['discount_amount'] ?? 0;
            $total = $subtotal + $taxAmount - $discountAmount;
            
            // Update invoice fields
            $updates = [
                'issue_date = ?', 'due_date = ?', 'subtotal = ?', 'tax_amount = ?', 
                'discount_amount = ?', 'total = ?', 'currency = ?', 
                'notes = ?', 'terms = ?', 'updated_at = NOW()'
            ];
            $params = [
                $body['issue_date'] ?? date('Y-m-d'),
                $body['due_date'] ?? date('Y-m-d'),
                $subtotal,
                $taxAmount,
                $discountAmount,
                $total,
                $body['currency'] ?? 'USD',
                $body['notes'] ?? null,
                $body['terms'] ?? null,
                $id,
                $scope['workspace_id']
            ];
            
            if (isset($body['contact_id'])) {
                $updates[] = 'contact_id = ?';
                // Insert contact_id before id in params
                array_splice($params, count($params) - 2, 0, $body['contact_id']);
            }

            // Also update amount_due if not paid
            // Logic: amount_due = new_total - amount_paid
            // Need to get amount_paid first
            $paidsStmt = $pdo->prepare("SELECT amount_paid FROM invoices WHERE id = ?");
            $paidsStmt->execute([$id]);
            $currentPaid = $paidsStmt->fetchColumn();
            
            $amountDue = max(0, $total - $currentPaid);
            $updates[] = 'amount_due = ?';
            // Insert amount_due before id in params
            array_splice($params, count($params) - 2, 0, $amountDue);

            $sql = "UPDATE invoices SET " . implode(', ', $updates) . " WHERE id = ? AND workspace_id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            // Replace line items
            $pdo->prepare("DELETE FROM invoice_items WHERE invoice_id = ?")->execute([$id]);
            
            if (!empty($items)) {
                $itemStmt = $pdo->prepare("
                    INSERT INTO invoice_items 
                    (invoice_id, product_id, description, quantity, unit_price, tax_rate, tax_amount, discount_percent, discount_amount, total, sort_order, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ");
                
                foreach ($items as $i => $item) {
                    $qty = $item['quantity'] ?? 1;
                    $unitPrice = $item['unit_price'] ?? 0;
                    $taxRate = $item['tax_rate'] ?? 0;
                    $itemSubtotal = $qty * $unitPrice;
                    $itemTax = $itemSubtotal * ($taxRate / 100);
                    $discountPct = $item['discount_percent'] ?? 0;
                    $discountAmt = $itemSubtotal * ($discountPct / 100);
                    $itemTotal = $itemSubtotal + $itemTax - $discountAmt;
                    
                    $itemStmt->execute([
                        $id,
                        $item['product_id'] ?? null,
                        $item['description'] ?? '',
                        $qty,
                        $unitPrice,
                        $taxRate,
                        $itemTax,
                        $discountPct,
                        $discountAmt,
                        $itemTotal,
                        $i
                    ]);
                }
            }
            
            $pdo->commit();
            
            Response::json(['success' => true, 'message' => 'Invoice updated']);
        } catch (Exception $e) {
            $pdo->rollBack();
            Response::error('Failed to update invoice: ' . $e->getMessage());
        }
    }
    
    /**
     * Delete invoice
     * DELETE /invoices/:id
     */
    public static function deleteInvoice(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        // Items and payments should ideally cascade or check FKs, but assume simple delete for now
        // Or we can just mark as cancelled? The API says delete.
        
        $stmt = $pdo->prepare("DELETE FROM invoices WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $scope['workspace_id']]);
        
        if ($stmt->rowCount() === 0) {
            Response::notFound('Invoice not found');
            return;
        }
        
        Response::json(['success' => true, 'message' => 'Invoice deleted']);
    }
    
    /**
     * Record payment
     * POST /invoices/:id/payments
     */
    public static function recordPayment(int $invoiceId): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        if (empty($body['amount']) || $body['amount'] <= 0) {
            Response::validationError('Valid amount required');
            return;
        }
        
        // Get invoice
        $invStmt = $pdo->prepare("SELECT * FROM invoices WHERE id = ? AND workspace_id = ?");
        $invStmt->execute([$invoiceId, $scope['workspace_id']]);
        $invoice = $invStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$invoice) {
            Response::notFound('Invoice not found');
            return;
        }
        
        $pdo->beginTransaction();
        try {
            // Record payment
            $stmt = $pdo->prepare("
                INSERT INTO payments 
                (workspace_id, company_id, invoice_id, contact_id, amount, currency, payment_method, status, transaction_id, notes, paid_at, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, NOW(), NOW())
            ");
            $stmt->execute([
                $scope['workspace_id'],
                $scope['company_id'],
                $invoiceId,
                $invoice['contact_id'],
                $body['amount'],
                $invoice['currency'],
                $body['payment_method'] ?? 'card',
                $body['transaction_id'] ?? null,
                $body['notes'] ?? null
            ]);
            
            $paymentId = (int)$pdo->lastInsertId();
            
            // Update invoice
            $newAmountPaid = (float)$invoice['amount_paid'] + (float)$body['amount'];
            $newAmountDue = (float)$invoice['total'] - $newAmountPaid;
            $newStatus = $newAmountDue <= 0 ? 'paid' : 'partial';
            
            $pdo->prepare("
                UPDATE invoices SET amount_paid = ?, amount_due = ?, status = ?, paid_at = IF(? = 'paid', NOW(), paid_at), updated_at = NOW()
                WHERE id = ?
            ")->execute([$newAmountPaid, max(0, $newAmountDue), $newStatus, $newStatus, $invoiceId]);
            
            $pdo->commit();
            
            // Emit event
            if ($newStatus === 'paid') {
                require_once __DIR__ . '/../services/BusinessEventsService.php';
                BusinessEventsService::emit(
                    $scope['workspace_id'],
                    $scope['company_id'],
                    'invoice.paid',
                    'invoice',
                    $invoiceId,
                    ['amount' => $body['amount'], 'total' => $invoice['total']],
                    'user',
                    $userId
                );
            }
            
            Response::json([
                'success' => true,
                'data' => ['id' => $paymentId, 'new_status' => $newStatus],
                'message' => 'Payment recorded'
            ], 201);
        } catch (Exception $e) {
            $pdo->rollBack();
            Response::error('Failed to record payment: ' . $e->getMessage());
        }
    }
    
    /**
     * Get invoice stats
     * GET /invoices/stats
     */
    public static function getStats(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $where = 'workspace_id = ?';
        $params = [$scope['workspace_id']];
        
        $sql = "SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
                    SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
                    SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
                    SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue,
                    SUM(CASE WHEN status IN ('sent', 'viewed', 'partial') THEN amount_due ELSE 0 END) as outstanding,
                    SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as collected,
                    SUM(CASE WHEN status = 'overdue' THEN amount_due ELSE 0 END) as overdue_amount
                FROM invoices WHERE $where";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        Response::json([
            'success' => true,
            'data' => $stats
        ]);
    }
    
    // ==================== PRODUCTS ====================
    
    /**
     * List products
     * GET /products
     */
    public static function listProducts(): void {
        try {
            $userId = Auth::userIdOrFail();
            $scope = self::getScope();
            $pdo = Database::conn();
            
            $sql = "SELECT * FROM products WHERE workspace_id = ?";
            $params = [$scope['workspace_id']];
            
            if ($scope['company_id']) {
                $sql .= ' AND (company_id = ? OR company_id IS NULL)';
                $params[] = $scope['company_id'];
            }
            
            $sql .= ' ORDER BY name ASC';
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            Response::json([
                'success' => true,
                'data' => $products
            ]);
        } catch (Exception $e) {
            error_log("Error in listProducts: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            Response::error('Failed to list products: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Create product
     * POST /products
     */
    public static function createProduct(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        if (empty($body['name'])) {
            Response::validationError('name is required');
            return;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO products 
            (workspace_id, company_id, name, description, sku, price, currency, unit, is_recurring, recurring_interval, recurring_interval_count, tax_rate, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $scope['workspace_id'],
            $scope['company_id'],
            $body['name'],
            $body['description'] ?? null,
            $body['sku'] ?? null,
            $body['price'] ?? 0,
            $body['currency'] ?? 'USD',
            $body['unit'] ?? 'unit',
            !empty($body['is_recurring']) ? 1 : 0,
            $body['recurring_interval'] ?? null,
            $body['recurring_interval_count'] ?? 1,
            $body['tax_rate'] ?? 0,
            isset($body['is_active']) ? ($body['is_active'] ? 1 : 0) : 1
        ]);
        
        $productId = (int)$pdo->lastInsertId();
        
        Response::json([
            'success' => true,
            'data' => ['id' => $productId],
            'message' => 'Product created'
        ], 201);
    }
    
    /**
     * Update product
     * PUT /products/:id
     */
    public static function updateProduct(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $fields = ['name', 'description', 'sku', 'price', 'currency', 'unit', 'is_recurring', 'recurring_interval', 'recurring_interval_count', 'tax_rate', 'is_active'];
        $updates = [];
        $params = [];
        
        foreach ($fields as $field) {
            if (isset($body[$field])) {
                $updates[] = "$field = ?";
                $params[] = $body[$field];
            }
        }
        
        if (empty($updates)) {
            Response::json(['success' => true, 'message' => 'No updates']);
            return;
        }
        
        $params[] = $id;
        $params[] = $scope['workspace_id'];
        
        $sql = "UPDATE products SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ? AND workspace_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        Response::json(['success' => true, 'message' => 'Product updated']);
    }
    
    /**
     * Delete product
     * DELETE /products/:id
     */
    public static function deleteProduct(int $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("DELETE FROM products WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $scope['workspace_id']]);
        
        Response::json(['success' => true, 'message' => 'Product deleted']);
    }
    
    // ==================== PAYMENT LINKS ====================
    
    /**
     * List payment links
     * GET /payment-links
     */
    public static function listPaymentLinks(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $pdo = Database::conn();
        
        $sql = "SELECT * FROM payment_links WHERE workspace_id = ?";
        $params = [$scope['workspace_id']];
        
        if ($scope['company_id']) {
            $sql .= ' AND (company_id = ? OR company_id IS NULL)';
            $params[] = $scope['company_id'];
        }
        
        $sql .= ' ORDER BY created_at DESC';
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $links = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json([
            'success' => true,
            'data' => $links
        ]);
    }
    
    /**
     * Create payment link
     * POST /payment-links
     */
    public static function createPaymentLink(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getScope();
        $body = get_json_body();
        $pdo = Database::conn();
        
        if (empty($body['name'])) {
            Response::validationError('name is required');
            return;
        }
        
        $slug = $body['slug'] ?? self::generateSlug($body['name']);
        
        // Check uniqueness
        $checkStmt = $pdo->prepare("SELECT id FROM payment_links WHERE workspace_id = ? AND slug = ?");
        $checkStmt->execute([$scope['workspace_id'], $slug]);
        if ($checkStmt->fetch()) {
            $slug .= '-' . substr(uniqid(), -4);
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO payment_links 
            (workspace_id, company_id, name, slug, description, amount, currency, is_amount_fixed, min_amount, max_amount, is_active, expires_at, success_url, cancel_url, collect_address, collect_phone, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $scope['workspace_id'],
            $scope['company_id'],
            $body['name'],
            $slug,
            $body['description'] ?? null,
            $body['amount'] ?? null,
            $body['currency'] ?? 'USD',
            isset($body['is_amount_fixed']) ? ($body['is_amount_fixed'] ? 1 : 0) : 1,
            $body['min_amount'] ?? null,
            $body['max_amount'] ?? null,
            isset($body['is_active']) ? ($body['is_active'] ? 1 : 0) : 1,
            $body['expires_at'] ?? null,
            $body['success_url'] ?? null,
            $body['cancel_url'] ?? null,
            !empty($body['collect_address']) ? 1 : 0,
            !empty($body['collect_phone']) ? 1 : 0
        ]);
        
        $linkId = (int)$pdo->lastInsertId();
        
        Response::json([
            'success' => true,
            'data' => ['id' => $linkId, 'slug' => $slug],
            'message' => 'Payment link created'
        ], 201);
    }
    
    private static function generateSlug(string $name): string {
        $slug = strtolower(trim($name));
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        $slug = trim($slug, '-');
        return $slug ?: 'payment';
    }
}
