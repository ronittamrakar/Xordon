<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class FulfillmentController {
    
    public static function getFulfillments(): void {
        $userId = Auth::userIdOrFail();
        $status = $_GET['status'] ?? null;
        $pdo = Database::conn();
        
        $sql = 'SELECT * FROM fulfillments WHERE user_id = ?';
        $params = [$userId];
        
        if ($status) {
            $sql .= ' AND status = ?';
            $params[] = $status;
        }
        
        $sql .= ' ORDER BY created_at DESC LIMIT 100';
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        $fulfillments = $stmt->fetchAll();
        foreach ($fulfillments as &$f) {
            $f['shipping_address'] = json_decode($f['shipping_address'] ?? '{}', true);
            $f['line_items'] = json_decode($f['line_items'] ?? '[]', true);
        }
        
        Response::json(['items' => $fulfillments]);
    }
    
    public static function getUnfulfilledOrders(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Get paid invoices that haven't been fulfilled yet
        $stmt = $pdo->prepare('
            SELECT i.id, i.invoice_number, i.total, i.currency, i.created_at,
                   c.name as customer_name, c.email as customer_email
            FROM invoices i
            LEFT JOIN contacts c ON i.contact_id = c.id
            LEFT JOIN fulfillments f ON f.invoice_id = i.id AND f.order_type = "invoice"
            WHERE i.user_id = ? 
              AND i.status = "paid"
              AND f.id IS NULL
            ORDER BY i.created_at DESC
            LIMIT 100
        ');
        $stmt->execute([$userId]);
        
        $orders = $stmt->fetchAll();
        
        // Get items for each invoice
        foreach ($orders as &$order) {
            $stmt = $pdo->prepare('SELECT * FROM invoice_items WHERE invoice_id = ?');
            $stmt->execute([$order['id']]);
            $order['items'] = $stmt->fetchAll();
        }
        
        Response::json(['items' => $orders]);
    }
    
    public static function createFulfillment(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $invoiceId = $body['invoice_id'] ?? null;
        $orderType = $body['order_type'] ?? 'invoice';
        
        if (!$invoiceId && $orderType === 'invoice') {
            Response::error('invoice_id is required', 422);
            return;
        }
        
        $stmt = $pdo->prepare('
            INSERT INTO fulfillments 
            (user_id, invoice_id, order_id, order_type, status, tracking_number, courier, 
             tracking_url, shipping_address, line_items, notes, shipped_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        
        $shippedAt = $body['status'] === 'shipped' ? date('Y-m-d H:i:s') : null;
        
        $stmt->execute([
            $userId,
            $invoiceId,
            $body['order_id'] ?? null,
            $orderType,
            $body['status'] ?? 'processing',
            $body['tracking_number'] ?? null,
            $body['courier'] ?? null,
            $body['tracking_url'] ?? null,
            json_encode($body['shipping_address'] ?? null),
            json_encode($body['line_items'] ?? []),
            $body['notes'] ?? null,
            $shippedAt,
        ]);
        
        $id = (int)$pdo->lastInsertId();
        
        // Update invoice status if needed
        if ($invoiceId && $body['status'] === 'shipped') {
            $stmt = $pdo->prepare('UPDATE invoices SET status = "fulfilled" WHERE id = ?');
            $stmt->execute([$invoiceId]);
        }
        
        $stmt = $pdo->prepare('SELECT * FROM fulfillments WHERE id = ?');
        $stmt->execute([$id]);
        
        Response::json($stmt->fetch(), 201);
    }
    
    public static function updateFulfillment(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        // Build update query dynamically
        $updates = [];
        $params = [];
        
        if (isset($body['status'])) {
            $updates[] = 'status = ?';
            $params[] = $body['status'];
            
            // Update timestamps based on status
            if ($body['status'] === 'shipped' && isset($body['shipped_at'])) {
                $updates[] = 'shipped_at = ?';
                $params[] = $body['shipped_at'];
            } elseif ($body['status'] === 'delivered' && isset($body['delivered_at'])) {
                $updates[] = 'delivered_at = ?';
                $params[] = $body['delivered_at'];
            }
        }
        
        if (isset($body['tracking_number'])) {
            $updates[] = 'tracking_number = ?';
            $params[] = $body['tracking_number'];
        }
        
        if (isset($body['courier'])) {
            $updates[] = 'courier = ?';
            $params[] = $body['courier'];
        }
        
        if (isset($body['tracking_url'])) {
            $updates[] = 'tracking_url = ?';
            $params[] = $body['tracking_url'];
        }
        
        if (isset($body['notes'])) {
            $updates[] = 'notes = ?';
            $params[] = $body['notes'];
        }
        
        if (empty($updates)) {
            Response::error('No fields to update', 422);
            return;
        }
        
        $updates[] = 'updated_at = NOW()';
        $params[] = $id;
        $params[] = $userId;
        
        $sql = 'UPDATE fulfillments SET ' . implode(', ', $updates) . ' WHERE id = ? AND user_id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        $stmt = $pdo->prepare('SELECT * FROM fulfillments WHERE id = ?');
        $stmt->execute([$id]);
        
        Response::json($stmt->fetch());
    }
    
    public static function deleteFulfillment(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('DELETE FROM fulfillments WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        
        Response::json(['success' => true]);
    }
    
    public static function getDashboardStats(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Count unfulfilled orders
        $stmt = $pdo->prepare('
            SELECT COUNT(*) as count FROM fulfillments 
            WHERE user_id = ? AND status IN ("unfulfilled", "processing")
        ');
        $stmt->execute([$userId]);
        $unfulfilled = $stmt->fetch()['count'];
        
        // Count shipped this month
        $stmt = $pdo->prepare('
            SELECT COUNT(*) as count FROM fulfillments 
            WHERE user_id = ? AND status = "shipped" 
              AND shipped_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ');
        $stmt->execute([$userId]);
        $shippedThisMonth = $stmt->fetch()['count'];
        
        // Count delivered this month
        $stmt = $pdo->prepare('
            SELECT COUNT(*) as count FROM fulfillments 
            WHERE user_id = ? AND status = "delivered" 
              AND delivered_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ');
        $stmt->execute([$userId]);
        $deliveredThisMonth = $stmt->fetch()['count'];
        
        Response::json([
            'unfulfilled_orders' => (int)$unfulfilled,
            'shipped_this_month' => (int)$shippedThisMonth,
            'delivered_this_month' => (int)$deliveredThisMonth,
        ]);
    }
}
