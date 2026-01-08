<?php
/**
 * PayPal Controller
 * Handles PayPal payment processing, order creation, and webhooks
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class PayPalController {
    private static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        throw new Exception('Workspace context required');
    }

    /**
     * Get PayPal credentials for workspace
     */
    private static function getCredentials(int $workspaceId): ?array {
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM paypal_accounts WHERE workspace_id = ? AND status = 'connected'");
        $stmt->execute([$workspaceId]);
        $account = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$account) {
            // Fallback to env
            $clientId = getenv('PAYPAL_CLIENT_ID');
            $clientSecret = getenv('PAYPAL_SECRET');
            $mode = getenv('PAYPAL_MODE') ?: 'sandbox';
            
            if (!$clientId || !$clientSecret) {
                return null;
            }
            
            return [
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'mode' => $mode
            ];
        }
        
        // Decrypt stored credentials
        return [
            'client_id' => self::decrypt($account['client_id_encrypted']),
            'client_secret' => self::decrypt($account['client_secret_encrypted']),
            'mode' => $account['mode']
        ];
    }

    /**
     * Get PayPal access token
     */
    private static function getAccessToken(array $credentials): ?string {
        $baseUrl = $credentials['mode'] === 'live' 
            ? 'https://api-m.paypal.com' 
            : 'https://api-m.sandbox.paypal.com';
        
        $ch = curl_init($baseUrl . '/v1/oauth2/token');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, 'grant_type=client_credentials');
        curl_setopt($ch, CURLOPT_USERPWD, $credentials['client_id'] . ':' . $credentials['client_secret']);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            return null;
        }
        
        $data = json_decode($response, true);
        return $data['access_token'] ?? null;
    }

    /**
     * Create PayPal order for invoice payment
     */
    public static function createOrder() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $invoiceId = $data['invoice_id'] ?? null;
            $workspaceId = $data['workspace_id'] ?? self::getWorkspaceId();
            
            if (!$invoiceId) {
                return Response::error('invoice_id is required', 400);
            }
            
            $db = Database::conn();
            
            // Get invoice
            $stmt = $db->prepare("
                SELECT i.*, c.email, c.first_name, c.last_name
                FROM invoices i
                LEFT JOIN contacts c ON i.contact_id = c.id
                WHERE i.id = ? AND i.workspace_id = ?
            ");
            $stmt->execute([$invoiceId, $workspaceId]);
            $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$invoice) {
                return Response::error('Invoice not found', 404);
            }
            
            if ($invoice['status'] === 'paid') {
                return Response::error('Invoice already paid', 400);
            }
            
            $credentials = self::getCredentials($workspaceId);
            if (!$credentials) {
                return Response::error('PayPal not configured', 400);
            }
            
            $accessToken = self::getAccessToken($credentials);
            if (!$accessToken) {
                return Response::error('Failed to authenticate with PayPal', 500);
            }
            
            $baseUrl = $credentials['mode'] === 'live' 
                ? 'https://api-m.paypal.com' 
                : 'https://api-m.sandbox.paypal.com';
            
            $appUrl = getenv('APP_URL') ?: 'http://localhost:5173';
            
            // Create PayPal order
            $orderData = [
                'intent' => 'CAPTURE',
                'purchase_units' => [
                    [
                        'reference_id' => 'invoice_' . $invoiceId,
                        'description' => 'Invoice #' . $invoice['invoice_number'],
                        'amount' => [
                            'currency_code' => $invoice['currency'] ?? 'USD',
                            'value' => number_format($invoice['total'], 2, '.', '')
                        ]
                    ]
                ],
                'application_context' => [
                    'brand_name' => getenv('APP_NAME') ?: 'Xordon',
                    'return_url' => $appUrl . '/pay/' . $invoiceId . '/success?provider=paypal',
                    'cancel_url' => $appUrl . '/pay/' . $invoiceId . '?cancelled=true'
                ]
            ];
            
            $ch = curl_init($baseUrl . '/v2/checkout/orders');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orderData));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $accessToken
            ]);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            $orderResponse = json_decode($response, true);
            
            if ($httpCode !== 201) {
                return Response::error('Failed to create PayPal order: ' . ($orderResponse['message'] ?? 'Unknown error'), 500);
            }
            
            $paypalOrderId = $orderResponse['id'];
            $approvalUrl = null;
            foreach ($orderResponse['links'] as $link) {
                if ($link['rel'] === 'approve') {
                    $approvalUrl = $link['href'];
                    break;
                }
            }
            
            // Store order
            $stmt = $db->prepare("
                INSERT INTO paypal_orders 
                (workspace_id, invoice_id, contact_id, paypal_order_id, amount, currency, status, approval_url)
                VALUES (?, ?, ?, ?, ?, ?, 'created', ?)
            ");
            $stmt->execute([
                $workspaceId,
                $invoiceId,
                $invoice['contact_id'],
                $paypalOrderId,
                $invoice['total'],
                $invoice['currency'] ?? 'USD',
                $approvalUrl
            ]);
            
            return Response::json([
                'success' => true,
                'data' => [
                    'order_id' => $paypalOrderId,
                    'approval_url' => $approvalUrl
                ]
            ]);
            
        } catch (Exception $e) {
            return Response::error('Order creation failed: ' . $e->getMessage());
        }
    }

    /**
     * Capture PayPal order after approval
     */
    public static function captureOrder() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $orderId = $data['order_id'] ?? null;
            
            if (!$orderId) {
                return Response::error('order_id is required', 400);
            }
            
            $db = Database::conn();
            
            // Get order
            $stmt = $db->prepare("SELECT * FROM paypal_orders WHERE paypal_order_id = ?");
            $stmt->execute([$orderId]);
            $order = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$order) {
                return Response::error('Order not found', 404);
            }
            
            if ($order['status'] === 'completed') {
                return Response::error('Order already captured', 400);
            }
            
            $credentials = self::getCredentials($order['workspace_id']);
            if (!$credentials) {
                return Response::error('PayPal not configured', 400);
            }
            
            $accessToken = self::getAccessToken($credentials);
            if (!$accessToken) {
                return Response::error('Failed to authenticate with PayPal', 500);
            }
            
            $baseUrl = $credentials['mode'] === 'live' 
                ? 'https://api-m.paypal.com' 
                : 'https://api-m.sandbox.paypal.com';
            
            // Capture the order
            $ch = curl_init($baseUrl . '/v2/checkout/orders/' . $orderId . '/capture');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, '{}');
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $accessToken
            ]);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            $captureResponse = json_decode($response, true);
            
            if ($httpCode !== 201 && $httpCode !== 200) {
                return Response::error('Failed to capture order: ' . ($captureResponse['message'] ?? 'Unknown error'), 500);
            }
            
            $captureId = $captureResponse['purchase_units'][0]['payments']['captures'][0]['id'] ?? null;
            $payerEmail = $captureResponse['payer']['email_address'] ?? null;
            $payerName = trim(($captureResponse['payer']['name']['given_name'] ?? '') . ' ' . ($captureResponse['payer']['name']['surname'] ?? ''));
            $payerId = $captureResponse['payer']['payer_id'] ?? null;
            
            // Update order
            $stmt = $db->prepare("
                UPDATE paypal_orders 
                SET status = 'completed', capture_id = ?, captured_at = NOW(),
                    payer_id = ?, payer_email = ?, payer_name = ?
                WHERE id = ?
            ");
            $stmt->execute([$captureId, $payerId, $payerEmail, $payerName, $order['id']]);
            
            // Create payment record
            $stmt = $db->prepare("
                INSERT INTO payments 
                (workspace_id, contact_id, invoice_id, paypal_order_id, paypal_capture_id,
                 amount, currency, provider, status, payment_method_type, paid_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'paypal', 'succeeded', 'paypal', NOW())
            ");
            $stmt->execute([
                $order['workspace_id'],
                $order['contact_id'],
                $order['invoice_id'],
                $orderId,
                $captureId,
                $order['amount'],
                $order['currency']
            ]);
            
            // Update invoice status
            if ($order['invoice_id']) {
                $stmt = $db->prepare("
                    UPDATE invoices SET status = 'paid', paid_at = NOW() WHERE id = ?
                ");
                $stmt->execute([$order['invoice_id']]);
            }
            
            return Response::json([
                'success' => true,
                'data' => [
                    'capture_id' => $captureId,
                    'status' => 'completed'
                ]
            ]);
            
        } catch (Exception $e) {
            return Response::error('Capture failed: ' . $e->getMessage());
        }
    }

    /**
     * Handle PayPal webhooks
     */
    public static function handleWebhook() {
        try {
            $payload = file_get_contents('php://input');
            $data = json_decode($payload, true);
            
            if (!$data) {
                return Response::error('Invalid payload', 400);
            }
            
            $db = Database::conn();
            
            $eventId = $data['id'] ?? null;
            $eventType = $data['event_type'] ?? null;
            $resourceType = $data['resource_type'] ?? null;
            $resource = $data['resource'] ?? [];
            
            // Check for duplicate event
            if ($eventId) {
                $stmt = $db->prepare("SELECT id FROM paypal_webhook_events WHERE event_id = ?");
                $stmt->execute([$eventId]);
                if ($stmt->fetch()) {
                    return Response::json(['success' => true, 'message' => 'Event already processed']);
                }
            }
            
            // Determine workspace from order
            $workspaceId = null;
            $orderId = $resource['id'] ?? $resource['supplementary_data']['related_ids']['order_id'] ?? null;
            
            if ($orderId) {
                $stmt = $db->prepare("SELECT workspace_id FROM paypal_orders WHERE paypal_order_id = ?");
                $stmt->execute([$orderId]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                $workspaceId = $row ? $row['workspace_id'] : null;
            }
            
            // Log event
            $stmt = $db->prepare("
                INSERT INTO paypal_webhook_events 
                (workspace_id, event_id, event_type, resource_type, resource_id, payload, status)
                VALUES (?, ?, ?, ?, ?, ?, 'received')
            ");
            $stmt->execute([
                $workspaceId,
                $eventId,
                $eventType,
                $resourceType,
                $resource['id'] ?? null,
                $payload
            ]);
            $logId = $db->lastInsertId();
            
            // Process event
            try {
                switch ($eventType) {
                    case 'CHECKOUT.ORDER.APPROVED':
                        // Order approved, ready to capture
                        if ($orderId) {
                            $stmt = $db->prepare("UPDATE paypal_orders SET status = 'approved' WHERE paypal_order_id = ?");
                            $stmt->execute([$orderId]);
                        }
                        break;
                        
                    case 'PAYMENT.CAPTURE.COMPLETED':
                        // Payment captured successfully
                        $captureId = $resource['id'] ?? null;
                        if ($captureId) {
                            // Find order by capture ID and mark as completed
                            $stmt = $db->prepare("
                                UPDATE paypal_orders SET status = 'completed', captured_at = NOW()
                                WHERE capture_id = ? OR paypal_order_id = ?
                            ");
                            $stmt->execute([$captureId, $orderId]);
                        }
                        break;
                        
                    case 'PAYMENT.CAPTURE.DENIED':
                    case 'PAYMENT.CAPTURE.DECLINED':
                        // Payment failed
                        if ($orderId) {
                            $stmt = $db->prepare("UPDATE paypal_orders SET status = 'failed' WHERE paypal_order_id = ?");
                            $stmt->execute([$orderId]);
                        }
                        break;
                        
                    case 'PAYMENT.CAPTURE.REFUNDED':
                        // Refund processed
                        $captureId = $resource['id'] ?? null;
                        if ($captureId) {
                            // Update payment status
                            $stmt = $db->prepare("
                                UPDATE payments SET status = 'refunded', refunded_at = NOW()
                                WHERE paypal_capture_id = ?
                            ");
                            $stmt->execute([$captureId]);
                        }
                        break;
                }
                
                // Mark event as processed
                $stmt = $db->prepare("UPDATE paypal_webhook_events SET status = 'processed', processed_at = NOW() WHERE id = ?");
                $stmt->execute([$logId]);
                
            } catch (Exception $e) {
                $stmt = $db->prepare("UPDATE paypal_webhook_events SET status = 'failed', error_message = ? WHERE id = ?");
                $stmt->execute([$e->getMessage(), $logId]);
            }
            
            return Response::json(['success' => true]);
            
        } catch (Exception $e) {
            return Response::error('Webhook processing failed: ' . $e->getMessage());
        }
    }

    /**
     * Connect PayPal account
     */
    public static function connect() {
        try {
            $workspaceId = self::getWorkspaceId();
            $data = json_decode(file_get_contents('php://input'), true);
            
            $clientId = $data['client_id'] ?? null;
            $clientSecret = $data['client_secret'] ?? null;
            $mode = $data['mode'] ?? 'sandbox';
            
            if (!$clientId || !$clientSecret) {
                return Response::error('Client ID and Secret are required', 400);
            }
            
            // Test credentials
            $credentials = [
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'mode' => $mode
            ];
            
            $accessToken = self::getAccessToken($credentials);
            if (!$accessToken) {
                return Response::error('Invalid PayPal credentials', 400);
            }
            
            $db = Database::conn();
            
            // Upsert account
            $stmt = $db->prepare("
                INSERT INTO paypal_accounts 
                (workspace_id, client_id_encrypted, client_secret_encrypted, mode, status, connected_at)
                VALUES (?, ?, ?, ?, 'connected', NOW())
                ON DUPLICATE KEY UPDATE
                    client_id_encrypted = VALUES(client_id_encrypted),
                    client_secret_encrypted = VALUES(client_secret_encrypted),
                    mode = VALUES(mode),
                    status = 'connected',
                    error_message = NULL,
                    connected_at = NOW()
            ");
            $stmt->execute([
                $workspaceId,
                self::encrypt($clientId),
                self::encrypt($clientSecret),
                $mode
            ]);
            
            return Response::json(['success' => true, 'message' => 'PayPal connected successfully']);
            
        } catch (Exception $e) {
            return Response::error('Connection failed: ' . $e->getMessage());
        }
    }

    /**
     * Disconnect PayPal account
     */
    public static function disconnect() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $stmt = $db->prepare("
                UPDATE paypal_accounts 
                SET status = 'disconnected', client_id_encrypted = NULL, client_secret_encrypted = NULL
                WHERE workspace_id = ?
            ");
            $stmt->execute([$workspaceId]);
            
            return Response::json(['success' => true]);
            
        } catch (Exception $e) {
            return Response::error('Disconnect failed: ' . $e->getMessage());
        }
    }

    /**
     * Get PayPal connection status
     */
    public static function status() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $stmt = $db->prepare("SELECT status, mode, connected_at, error_message FROM paypal_accounts WHERE workspace_id = ?");
            $stmt->execute([$workspaceId]);
            $account = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return Response::json([
                'data' => $account ?: ['status' => 'disconnected']
            ]);
            
        } catch (Exception $e) {
            return Response::error('Failed to get status: ' . $e->getMessage());
        }
    }

    private static function encrypt(string $value): string {
        $key = getenv('APP_KEY') ?: 'default-encryption-key-change-me';
        $iv = random_bytes(16);
        $encrypted = openssl_encrypt($value, 'AES-256-CBC', $key, 0, $iv);
        return base64_encode($iv . $encrypted);
    }

    private static function decrypt(string $encrypted): string {
        $key = getenv('APP_KEY') ?: 'default-encryption-key-change-me';
        $data = base64_decode($encrypted);
        $iv = substr($data, 0, 16);
        $encrypted = substr($data, 16);
        return openssl_decrypt($encrypted, 'AES-256-CBC', $key, 0, $iv);
    }
}
