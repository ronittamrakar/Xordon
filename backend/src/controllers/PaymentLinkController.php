<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class PaymentLinkController {
    
    // ==================== ADMIN ENDPOINTS ====================
    
    public static function getLinks(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            SELECT pl.*, p.name as product_name, p.type as product_type
            FROM payment_links pl
            JOIN products p ON pl.product_id = p.id
            WHERE pl.user_id = ?
            ORDER BY pl.created_at DESC
        ');
        $stmt->execute([$userId]);
        
        $links = $stmt->fetchAll();
        foreach ($links as &$link) {
            $link['settings'] = json_decode($link['settings'] ?? '{}', true);
            $link['metadata'] = json_decode($link['metadata'] ?? '{}', true);
        }
        
        Response::json(['items' => $links]);
    }
    
    public static function getLink(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            SELECT pl.*, p.name as product_name, p.description as product_description
            FROM payment_links pl
            JOIN products p ON pl.product_id = p.id
            WHERE pl.id = ? AND pl.user_id = ?
        ');
        $stmt->execute([$id, $userId]);
        $link = $stmt->fetch();
        
        if (!$link) {
            Response::error('Payment link not found', 404);
            return;
        }
        
        $link['settings'] = json_decode($link['settings'] ?? '{}', true);
        $link['metadata'] = json_decode($link['metadata'] ?? '{}', true);
        Response::json($link);
    }
    
    public static function createLink(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $productId = $body['product_id'] ?? null;
        if (!$productId) {
            Response::error('product_id is required', 422);
            return;
        }
        
        // Verify product belongs to user
        $stmt = $pdo->prepare('SELECT id, name, price, currency FROM products WHERE id = ? AND user_id = ?');
        $stmt->execute([$productId, $userId]);
        $product = $stmt->fetch();
        
        if (!$product) {
            Response::error('Product not found', 404);
            return;
        }
        
        // Generate unique slug
        $baseName = $body['name'] ?? $product['name'];
        $slug = self::generateUniqueSlug($pdo, $baseName);
        
        $stmt = $pdo->prepare('
            INSERT INTO payment_links 
            (user_id, product_id, slug, name, description, price, currency, active, 
             collect_shipping, collect_billing, allow_promotion_codes, success_url, cancel_url, settings, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        
        $stmt->execute([
            $userId,
            $productId,
            $slug,
            $baseName,
            $body['description'] ?? $product['name'],
            $body['price'] ?? $product['price'],
            $body['currency'] ?? $product['currency'] ?? 'USD',
            $body['active'] ?? 1,
            $body['collect_shipping'] ?? 1,
            $body['collect_billing'] ?? 1,
            $body['allow_promotion_codes'] ?? 0,
            $body['success_url'] ?? null,
            $body['cancel_url'] ?? null,
            json_encode($body['settings'] ?? []),
            json_encode($body['metadata'] ?? []),
        ]);
        
        $id = (int)$pdo->lastInsertId();
        $stmt = $pdo->prepare('SELECT * FROM payment_links WHERE id = ?');
        $stmt->execute([$id]);
        
        Response::json($stmt->fetch(), 201);
    }
    
    public static function updateLink(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            UPDATE payment_links SET
                name = COALESCE(?, name),
                description = COALESCE(?, description),
                price = COALESCE(?, price),
                active = COALESCE(?, active),
                collect_shipping = COALESCE(?, collect_shipping),
                collect_billing = COALESCE(?, collect_billing),
                allow_promotion_codes = COALESCE(?, allow_promotion_codes),
                success_url = COALESCE(?, success_url),
                cancel_url = COALESCE(?, cancel_url),
                settings = COALESCE(?, settings),
                metadata = COALESCE(?, metadata),
                updated_at = NOW()
            WHERE id = ? AND user_id = ?
        ');
        
        $stmt->execute([
            $body['name'] ?? null,
            $body['description'] ?? null,
            $body['price'] ?? null,
            isset($body['active']) ? (int)$body['active'] : null,
            isset($body['collect_shipping']) ? (int)$body['collect_shipping'] : null,
            isset($body['collect_billing']) ? (int)$body['collect_billing'] : null,
            isset($body['allow_promotion_codes']) ? (int)$body['allow_promotion_codes'] : null,
            $body['success_url'] ?? null,
            $body['cancel_url'] ?? null,
            isset($body['settings']) ? json_encode($body['settings']) : null,
            isset($body['metadata']) ? json_encode($body['metadata']) : null,
            $id,
            $userId
        ]);
        
        $stmt = $pdo->prepare('SELECT * FROM payment_links WHERE id = ?');
        $stmt->execute([$id]);
        
        Response::json($stmt->fetch());
    }
    
    public static function deleteLink(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('DELETE FROM payment_links WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        
        Response::json(['success' => true]);
    }
    
    // ==================== PUBLIC ENDPOINTS ====================
    
    public static function getPublicLink(string $slug): void {
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            SELECT pl.*, p.name as product_name, p.description as product_description, p.type as product_type
            FROM payment_links pl
            JOIN products p ON pl.product_id = p.id
            WHERE pl.slug = ? AND pl.active = 1
        ');
        $stmt->execute([$slug]);
        $link = $stmt->fetch();
        
        if (!$link) {
            Response::error('Payment link not found or inactive', 404);
            return;
        }
        
        // Only expose safe data
        $safeData = [
            'slug' => $link['slug'],
            'name' => $link['name'],
            'description' => $link['description'],
            'price' => $link['price'],
            'currency' => $link['currency'],
            'collect_shipping' => (bool)$link['collect_shipping'],
            'collect_billing' => (bool)$link['collect_billing'],
            'allow_promotion_codes' => (bool)$link['allow_promotion_codes'],
            'settings' => json_decode($link['settings'] ?? '{}', true),
        ];
        
        Response::json($safeData);
    }
    
    public static function createOrder(): void {
        $body = get_json_body();
        $slug = $body['slug'] ?? null;
        
        if (!$slug) {
            Response::error('slug is required', 422);
            return;
        }
        
        $pdo = Database::conn();
        
        // Get payment link
        $stmt = $pdo->prepare('SELECT * FROM payment_links WHERE slug = ? AND active = 1');
        $stmt->execute([$slug]);
        $link = $stmt->fetch();
        
        if (!$link) {
            Response::error('Payment link not found', 404);
            return;
        }
        
        // Create order record
        $stmt = $pdo->prepare('
            INSERT INTO payment_link_orders 
            (payment_link_id, customer_email, customer_name, amount, currency, status, 
             shipping_address, billing_address, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        
        $stmt->execute([
            $link['id'],
            $body['customer_email'] ?? '',
            $body['customer_name'] ?? '',
            $link['price'],
            $link['currency'],
            'pending',
            json_encode($body['shipping_address'] ?? null),
            json_encode($body['billing_address'] ?? null),
            json_encode($body['metadata'] ?? []),
        ]);
        
        $orderId = (int)$pdo->lastInsertId();
        
        // In production, integrate with Stripe/PayPal here
        // For now, return order details
        Response::json([
            'order_id' => $orderId,
            'amount' => $link['price'],
            'currency' => $link['currency'],
            'status' => 'pending',
            'message' => 'Order created. In production, this would redirect to Stripe/PayPal.'
        ], 201);
    }
    
    public static function sendViaSMS(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $phoneNumber = $body['phone_number'] ?? null;
        
        if (!$phoneNumber) {
            Response::error('phone_number is required', 422);
            return;
        }
        
        $pdo = Database::conn();
        
        // Fetch the payment link
        $stmt = $pdo->prepare('
            SELECT pl.*, p.name as product_name 
            FROM payment_links pl
            JOIN products p ON pl.product_id = p.id
            WHERE pl.id = ? AND pl.user_id = ?
        ');
        $stmt->execute([$id, $userId]);
        $link = $stmt->fetch();
        
        if (!$link) {
            Response::error('Payment link not found', 404);
            return;
        }
        
        // Prepare the message
        $appUrl = getenv('APP_URL') ?: 'https://xordon.com';
        $paymentUrl = rtrim($appUrl, '/') . '/checkout/' . $link['slug'];
        $message = sprintf(
            "Hi! Here is your payment link for %s: %s",
            $link['product_name'] ?: $link['name'],
            $paymentUrl
        );
        
        try {
            require_once __DIR__ . '/../services/SMSService.php';
            $smsService = new SMSService(null, (string)$userId);
            $result = $smsService->sendMessage($phoneNumber, $message);
            
            Response::json([
                'success' => true,
                'message' => 'Payment link sent via SMS',
                'sid' => $result['external_id'] ?? null
            ]);
        } catch (Exception $e) {
            Response::error('Failed to send SMS: ' . $e->getMessage(), 500);
        }
    }

    // ==================== HELPERS ====================
    
    private static function generateUniqueSlug(PDO $pdo, string $name): string {
        $baseSlug = strtolower(preg_replace('/[^a-z0-9]+/', '-', $name));
        $baseSlug = trim($baseSlug, '-');
        $slug = $baseSlug;
        $counter = 1;
        
        while (true) {
            $stmt = $pdo->prepare('SELECT id FROM payment_links WHERE slug = ?');
            $stmt->execute([$slug]);
            if (!$stmt->fetch()) {
                return $slug;
            }
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }
    }
}
