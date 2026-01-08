<?php
/**
 * PaymentsController - Handles payments, invoices, and billing
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class PaymentsController {
    
    // ==================== PRODUCTS ====================
    
    public static function getProducts(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $status = $_GET['status'] ?? 'active';
        
        $sql = 'SELECT * FROM products WHERE user_id = ?';
        $params = [$userId];
        
        if ($status !== 'all') {
            $sql .= ' AND status = ?';
            $params[] = $status;
        }
        
        $sql .= ' ORDER BY created_at DESC';
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        Response::json(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }
    
    public static function getProduct(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT * FROM products WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$product) {
            Response::notFound('Product not found');
            return;
        }
        
        Response::json($product);
    }
    
    public static function createProduct(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        if (empty($body['name'])) {
            Response::validationError('Product name is required');
            return;
        }
        
        $stmt = $pdo->prepare('
            INSERT INTO products (user_id, name, description, price, currency, type, recurring_interval, recurring_interval_count, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $userId,
            $body['name'],
            $body['description'] ?? null,
            $body['price'] ?? 0,
            $body['currency'] ?? 'USD',
            $body['type'] ?? 'one_time',
            $body['recurring_interval'] ?? null,
            $body['recurring_interval_count'] ?? 1,
            'active'
        ]);
        
        $id = $pdo->lastInsertId();
        
        Response::json(['id' => $id, 'message' => 'Product created successfully'], 201);
    }
    
    public static function updateProduct(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT id FROM products WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        if (!$stmt->fetch()) {
            Response::notFound('Product not found');
            return;
        }
        
        $updates = [];
        $params = [];
        
        $fields = ['name', 'description', 'price', 'currency', 'type', 'recurring_interval', 'recurring_interval_count', 'status'];
        foreach ($fields as $field) {
            if (isset($body[$field])) {
                $updates[] = "$field = ?";
                $params[] = $body[$field];
            }
        }
        
        if (empty($updates)) {
            Response::json(['message' => 'No updates provided']);
            return;
        }
        
        $params[] = $id;
        $params[] = $userId;
        
        $stmt = $pdo->prepare('UPDATE products SET ' . implode(', ', $updates) . ' WHERE id = ? AND user_id = ?');
        $stmt->execute($params);
        
        Response::json(['message' => 'Product updated successfully']);
    }
    
    public static function deleteProduct(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('UPDATE products SET status = ? WHERE id = ? AND user_id = ?');
        $stmt->execute(['archived', $id, $userId]);
        
        if ($stmt->rowCount() === 0) {
            Response::notFound('Product not found');
            return;
        }
        
        Response::json(['message' => 'Product archived successfully']);
    }
    
    // ==================== INVOICES ====================
    
    public static function getInvoices(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $status = $_GET['status'] ?? null;
        $contactId = $_GET['contact_id'] ?? null;
        
        // Note: we don't have a separate `contacts` table; use `recipients` as the contact source
        $sql = 'SELECT i.*, r.first_name, r.last_name, r.email as contact_email 
                FROM invoices i 
                LEFT JOIN recipients r ON i.contact_id = r.id 
                WHERE i.user_id = ?';
        $params = [$userId];
        
        if ($status) {
            $sql .= ' AND i.status = ?';
            $params[] = $status;
        }
        
        if ($contactId) {
            $sql .= ' AND i.contact_id = ?';
            $params[] = $contactId;
        }
        
        $sql .= ' ORDER BY i.created_at DESC';
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get items for each invoice
        foreach ($invoices as &$invoice) {
            $stmt = $pdo->prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order');
            $stmt->execute([$invoice['id']]);
            $invoice['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        Response::json(['items' => $invoices]);
    }
    
    public static function getInvoice(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Join against recipients instead of a non-existent contacts table
        $stmt = $pdo->prepare('
            SELECT i.*, r.first_name, r.last_name, r.email as contact_email, r.phone as contact_phone,
                   r.company as contact_company
            FROM invoices i 
            LEFT JOIN recipients r ON i.contact_id = r.id 
            WHERE i.id = ? AND i.user_id = ?
        ');
        $stmt->execute([$id, $userId]);
        $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$invoice) {
            Response::notFound('Invoice not found');
            return;
        }
        
        // Get items
        $stmt = $pdo->prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order');
        $stmt->execute([$id]);
        $invoice['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get payments
        $stmt = $pdo->prepare('SELECT * FROM payments WHERE invoice_id = ? ORDER BY created_at DESC');
        $stmt->execute([$id]);
        $invoice['payments'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json($invoice);
    }
    
    public static function createInvoice(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        // Generate invoice number
        $stmt = $pdo->prepare('SELECT invoice_prefix FROM payment_settings WHERE user_id = ?');
        $stmt->execute([$userId]);
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);
        $prefix = $settings['invoice_prefix'] ?? 'INV-';
        
        $stmt = $pdo->prepare('SELECT COUNT(*) as count FROM invoices WHERE user_id = ?');
        $stmt->execute([$userId]);
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'] + 1;
        $invoiceNumber = $prefix . str_pad($count, 5, '0', STR_PAD_LEFT);
        
        // Calculate totals
        $items = $body['items'] ?? [];
        $subtotal = 0;
        foreach ($items as $item) {
            $subtotal += ($item['quantity'] ?? 1) * ($item['unit_price'] ?? 0);
        }
        
        $taxRate = $body['tax_rate'] ?? 0;
        $taxAmount = $subtotal * ($taxRate / 100);
        $discountAmount = $body['discount_amount'] ?? 0;
        $total = $subtotal + $taxAmount - $discountAmount;
        
        $pdo->beginTransaction();
        
        try {
            $stmt = $pdo->prepare('
                INSERT INTO invoices (user_id, contact_id, invoice_number, status, issue_date, due_date, 
                    subtotal, tax_rate, tax_amount, discount_amount, total, currency, notes, terms)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');
            $stmt->execute([
                $userId,
                $body['contact_id'] ?? null,
                $invoiceNumber,
                $body['status'] ?? 'draft',
                $body['issue_date'] ?? date('Y-m-d'),
                $body['due_date'] ?? date('Y-m-d', strtotime('+30 days')),
                $subtotal,
                $taxRate,
                $taxAmount,
                $discountAmount,
                $total,
                $body['currency'] ?? 'USD',
                $body['notes'] ?? null,
                $body['terms'] ?? null
            ]);
            
            $invoiceId = $pdo->lastInsertId();
            
            // Insert items
            foreach ($items as $index => $item) {
                $itemAmount = ($item['quantity'] ?? 1) * ($item['unit_price'] ?? 0);
                $stmt = $pdo->prepare('
                    INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, amount, sort_order)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ');
                $stmt->execute([
                    $invoiceId,
                    $item['product_id'] ?? null,
                    $item['description'] ?? '',
                    $item['quantity'] ?? 1,
                    $item['unit_price'] ?? 0,
                    $itemAmount,
                    $index
                ]);
            }
            
            $pdo->commit();
            
            Response::json([
                'id' => $invoiceId,
                'invoice_number' => $invoiceNumber,
                'message' => 'Invoice created successfully'
            ], 201);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            Response::error('Failed to create invoice: ' . $e->getMessage());
        }
    }
    
    public static function updateInvoice(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT * FROM invoices WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$invoice) {
            Response::notFound('Invoice not found');
            return;
        }
        
        // Recalculate if items changed
        if (isset($body['items'])) {
            $items = $body['items'];
            $subtotal = 0;
            foreach ($items as $item) {
                $subtotal += ($item['quantity'] ?? 1) * ($item['unit_price'] ?? 0);
            }
            $body['subtotal'] = $subtotal;
            
            $taxRate = $body['tax_rate'] ?? $invoice['tax_rate'];
            $body['tax_amount'] = $subtotal * ($taxRate / 100);
            $body['total'] = $subtotal + $body['tax_amount'] - ($body['discount_amount'] ?? $invoice['discount_amount']);
        }
        
        $pdo->beginTransaction();
        
        try {
            $updates = [];
            $params = [];
            
            $fields = ['contact_id', 'status', 'issue_date', 'due_date', 'subtotal', 'tax_rate', 
                       'tax_amount', 'discount_amount', 'total', 'currency', 'notes', 'terms'];
            foreach ($fields as $field) {
                if (isset($body[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $body[$field];
                }
            }
            
            if (!empty($updates)) {
                $params[] = $id;
                $params[] = $userId;
                $stmt = $pdo->prepare('UPDATE invoices SET ' . implode(', ', $updates) . ' WHERE id = ? AND user_id = ?');
                $stmt->execute($params);
            }
            
            // Update items if provided
            if (isset($body['items'])) {
                $stmt = $pdo->prepare('DELETE FROM invoice_items WHERE invoice_id = ?');
                $stmt->execute([$id]);
                
                foreach ($body['items'] as $index => $item) {
                    $itemAmount = ($item['quantity'] ?? 1) * ($item['unit_price'] ?? 0);
                    $stmt = $pdo->prepare('
                        INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, amount, sort_order)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ');
                    $stmt->execute([
                        $id,
                        $item['product_id'] ?? null,
                        $item['description'] ?? '',
                        $item['quantity'] ?? 1,
                        $item['unit_price'] ?? 0,
                        $itemAmount,
                        $index
                    ]);
                }
            }
            
            $pdo->commit();
            Response::json(['message' => 'Invoice updated successfully']);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            Response::error('Failed to update invoice: ' . $e->getMessage());
        }
    }
    
    public static function deleteInvoice(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('DELETE FROM invoices WHERE id = ? AND user_id = ? AND status = ?');
        $stmt->execute([$id, $userId, 'draft']);
        
        if ($stmt->rowCount() === 0) {
            Response::error('Cannot delete invoice. Only draft invoices can be deleted.');
            return;
        }
        
        Response::json(['message' => 'Invoice deleted successfully']);
    }
    
    public static function sendInvoice(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            SELECT i.*, c.email as contact_email, c.first_name 
            FROM invoices i 
            LEFT JOIN contacts c ON i.contact_id = c.id 
            WHERE i.id = ? AND i.user_id = ?
        ');
        $stmt->execute([$id, $userId]);
        $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$invoice) {
            Response::notFound('Invoice not found');
            return;
        }
        
        if (empty($invoice['contact_email'])) {
            Response::validationError('Contact email is required to send invoice');
            return;
        }
        
        // Generate payment link (placeholder - would integrate with Stripe)
        $paymentLink = 'https://pay.example.com/invoice/' . $id;
        
        $stmt = $pdo->prepare('UPDATE invoices SET status = ?, sent_at = NOW(), payment_link = ? WHERE id = ?');
        $stmt->execute(['sent', $paymentLink, $id]);
        

        // Send email with invoice
        if (!empty($invoice['contact_email'])) {
            require_once __DIR__ . '/../services/EmailService.php';
            $emailService = new \Xordon\Services\EmailService();
            
            $subject = "Invoice " . $invoice['invoice_number'];
            $htmlBody = "
                <h1>Invoice " . $invoice['invoice_number'] . "</h1>
                <p>Hello " . ($invoice['first_name'] ?? 'Customer') . ",</p>
                <p>Please find your invoice details below.</p>
                <p><strong>Amount Due:</strong> " . $invoice['currency'] . " " . number_format($invoice['total'], 2) . "</p>
                <p><a href='$paymentLink' style='padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;'>View & Pay Invoice</a></p>
                <p>If the button above doesn't work, copy loop into your browser: $paymentLink</p>
                <p>Thank you for your business!</p>
            ";
            
            $emailService->send(
                $invoice['contact_email'],
                $subject,
                $htmlBody,
                $invoice['first_name'] ?? 'Customer'
            );
        }
        
        Response::json([
            'message' => 'Invoice sent successfully',
            'payment_link' => $paymentLink
        ]);
    }
    
    // ==================== PAYMENTS ====================
    
    public static function getPayments(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Use recipients for contact information
        $stmt = $pdo->prepare('
            SELECT p.*, i.invoice_number, r.first_name, r.last_name, r.email as contact_email,
                   a.guest_name, a.guest_email as appointment_email
            FROM payments p
            LEFT JOIN invoices i ON p.invoice_id = i.id
            LEFT JOIN recipients r ON p.contact_id = r.id
            LEFT JOIN appointments a ON p.appointment_id = a.id
            WHERE p.user_id = ?
            ORDER BY p.created_at DESC
        ');
        $stmt->execute([$userId]);
        
        Response::json(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }
    
    public static function recordPayment(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        if (empty($body['amount'])) {
            Response::validationError('Payment amount is required');
            return;
        }
        
        $pdo->beginTransaction();
        
        try {
            $stmt = $pdo->prepare('
                INSERT INTO payments (user_id, invoice_id, contact_id, amount, currency, payment_method, status, transaction_id, notes, paid_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');
            $stmt->execute([
                $userId,
                $body['invoice_id'] ?? null,
                $body['contact_id'] ?? null,
                $body['amount'],
                $body['currency'] ?? 'USD',
                $body['payment_method'] ?? 'other',
                'completed',
                $body['transaction_id'] ?? null,
                $body['notes'] ?? null,
                $body['paid_at'] ?? date('Y-m-d H:i:s')
            ]);
            
            $paymentId = $pdo->lastInsertId();
            
            // Update invoice if linked
            if (!empty($body['invoice_id'])) {
                $stmt = $pdo->prepare('SELECT total, amount_paid FROM invoices WHERE id = ? AND user_id = ?');
                $stmt->execute([$body['invoice_id'], $userId]);
                $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($invoice) {
                    $newAmountPaid = $invoice['amount_paid'] + $body['amount'];
                    $newStatus = $newAmountPaid >= $invoice['total'] ? 'paid' : 'partially_paid';
                    
                    $stmt = $pdo->prepare('UPDATE invoices SET amount_paid = ?, status = ?, paid_at = ? WHERE id = ?');
                    $stmt->execute([
                        $newAmountPaid,
                        $newStatus,
                        $newStatus === 'paid' ? date('Y-m-d H:i:s') : null,
                        $body['invoice_id']
                    ]);
                }
            }
            
            $pdo->commit();
            
            Response::json(['id' => $paymentId, 'message' => 'Payment recorded successfully'], 201);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            Response::error('Failed to record payment: ' . $e->getMessage());
        }
    }
    
    public static function refundPayment(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT * FROM payments WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        $payment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$payment) {
            Response::notFound('Payment not found');
            return;
        }
        
        if ($payment['status'] === 'refunded') {
            Response::error('Payment is already refunded');
            return;
        }
        
        $pdo->beginTransaction();
        
        try {
            // Update payment status
            $stmt = $pdo->prepare('UPDATE payments SET status = ? WHERE id = ?');
            $stmt->execute(['refunded', $id]);
            
            // Update invoice if linked
            if (!empty($payment['invoice_id'])) {
                $stmt = $pdo->prepare('SELECT total, amount_paid FROM invoices WHERE id = ?');
                $stmt->execute([$payment['invoice_id']]);
                $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($invoice) {
                    $newAmountPaid = max(0, $invoice['amount_paid'] - $payment['amount']);
                    $newStatus = $newAmountPaid <= 0 ? 'sent' : 'partially_paid';
                    
                    $stmt = $pdo->prepare('UPDATE invoices SET amount_paid = ?, status = ? WHERE id = ?');
                    $stmt->execute([$newAmountPaid, $newStatus, $payment['invoice_id']]);
                }
            }
            
            $pdo->commit();
            Response::json(['message' => 'Payment refunded successfully']);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            Response::error('Failed to refund payment: ' . $e->getMessage());
        }
    }
    
    // ==================== SETTINGS ====================
    
    public static function getSettings(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT * FROM payment_settings WHERE user_id = ?');
        $stmt->execute([$userId]);
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$settings) {
            $settings = [
                'default_currency' => 'USD',
                'default_tax_rate' => 0,
                'invoice_prefix' => 'INV-',
                'auto_send_receipts' => true
            ];
        }
        
        // Don't expose encrypted keys
        unset($settings['stripe_secret_key_encrypted']);
        unset($settings['stripe_webhook_secret_encrypted']);
        unset($settings['paypal_secret_encrypted']);
        
        Response::json($settings);
    }
    
    public static function updateSettings(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT id FROM payment_settings WHERE user_id = ?');
        $stmt->execute([$userId]);
        $exists = $stmt->fetch();
        
        $fields = ['stripe_publishable_key', 'paypal_client_id', 'default_currency', 
                   'default_tax_rate', 'invoice_prefix', 'invoice_footer', 'payment_terms', 'auto_send_receipts'];
        
        if ($exists) {
            $updates = [];
            $params = [];
            
            foreach ($fields as $field) {
                if (isset($body[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $body[$field];
                }
            }
            
            if (!empty($updates)) {
                $params[] = $userId;
                $stmt = $pdo->prepare('UPDATE payment_settings SET ' . implode(', ', $updates) . ' WHERE user_id = ?');
                $stmt->execute($params);
            }
        } else {
            // Build dynamic INSERT to handle whatever fields are provided
            $insertFields = ['user_id'];
            $questions = ['?'];
            $params = [$userId];
            
            foreach ($fields as $field) {
                if (isset($body[$field])) {
                    $insertFields[] = $field;
                    $questions[] = '?';
                    $params[] = $body[$field];
                }
            }
            
            // Add defaults for missing critical fields
            if (!in_array('default_currency', $insertFields)) {
                $insertFields[] = 'default_currency';
                $questions[] = '?';
                $params[] = 'USD';
            }
            if (!in_array('default_tax_rate', $insertFields)) {
                $insertFields[] = 'default_tax_rate';
                $questions[] = '?';
                $params[] = 0;
            }
            if (!in_array('invoice_prefix', $insertFields)) {
                $insertFields[] = 'invoice_prefix';
                $questions[] = '?';
                $params[] = 'INV-';
            }
            if (!in_array('auto_send_receipts', $insertFields)) {
                $insertFields[] = 'auto_send_receipts';
                $questions[] = '?';
                $params[] = 1;
            }
            
            $sql = 'INSERT INTO payment_settings (' . implode(', ', $insertFields) . ') VALUES (' . implode(', ', $questions) . ')';
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
        }
        
        Response::json(['message' => 'Settings updated successfully']);
    }
    
    // ==================== DASHBOARD STATS ====================
    
    public static function getDashboardStats(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Total revenue
        $stmt = $pdo->prepare('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE user_id = ? AND status = ?');
        $stmt->execute([$userId, 'completed']);
        $totalRevenue = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Outstanding invoices
        $stmt = $pdo->prepare('SELECT COALESCE(SUM(total - amount_paid), 0) as outstanding FROM invoices WHERE user_id = ? AND status IN (?, ?, ?)');
        $stmt->execute([$userId, 'sent', 'viewed', 'partially_paid']);
        $outstanding = $stmt->fetch(PDO::FETCH_ASSOC)['outstanding'];
        
        // This month revenue
        $stmt = $pdo->prepare('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE user_id = ? AND status = ? AND MONTH(paid_at) = MONTH(NOW()) AND YEAR(paid_at) = YEAR(NOW())');
        $stmt->execute([$userId, 'completed']);
        $thisMonthRevenue = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Overdue invoices
        $stmt = $pdo->prepare('SELECT COUNT(*) as count FROM invoices WHERE user_id = ? AND status IN (?, ?, ?) AND due_date < CURDATE()');
        $stmt->execute([$userId, 'sent', 'viewed', 'partially_paid']);
        $overdueCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        Response::json([
            'total_revenue' => (float) $totalRevenue,
            'outstanding_amount' => (float) $outstanding,
            'this_month_revenue' => (float) $thisMonthRevenue,
            'overdue_invoices' => (int) $overdueCount
        ]);
    }

    public static function getAnalytics(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Overview Summary
        $stmt = $pdo->prepare('SELECT 
            COUNT(*) as total_payments,
            SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as successful_payments,
            SUM(CASE WHEN status = "completed" THEN amount ELSE 0 END) as total_revenue,
            SUM(CASE WHEN status = "refunded" THEN 1 ELSE 0 END) as refunded_count,
            AVG(CASE WHEN status = "completed" THEN amount ELSE NULL END) as avg_payment
            FROM payments WHERE user_id = ?');
        $stmt->execute([$userId]);
        $summary = $stmt->fetch(PDO::FETCH_ASSOC);

        // Daily Trend (last 30 days)
        $stmt = $pdo->prepare('SELECT 
            DATE(paid_at) as date,
            COUNT(*) as count,
            SUM(amount) as revenue
            FROM payments 
            WHERE user_id = ? AND status = "completed" 
            AND paid_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(paid_at)
            ORDER BY DATE(paid_at) ASC');
        $stmt->execute([$userId]);
        $dailyTrend = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // By Status
        $stmt = $pdo->prepare('SELECT 
            status,
            COUNT(*) as count,
            SUM(amount) as total
            FROM payments 
            WHERE user_id = ?
            GROUP BY status');
        $stmt->execute([$userId]);
        $byStatus = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::json([
            'summary' => [
                'total_payments' => (int)($summary['total_payments'] ?? 0),
                'successful_payments' => (int)($summary['successful_payments'] ?? 0),
                'total_revenue' => (float)($summary['total_revenue'] ?? 0),
                'refunded_count' => (int)($summary['refunded_count'] ?? 0),
                'avg_payment' => (float)($summary['avg_payment'] ?? 0)
            ],
            'daily_trend' => $dailyTrend,
            'by_status' => $byStatus,
            'period' => [
                'from' => date('Y-m-d', strtotime('-30 days')),
                'to' => date('Y-m-d')
            ]
        ]);
    }
}
