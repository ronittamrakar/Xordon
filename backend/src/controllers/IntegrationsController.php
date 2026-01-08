<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

/**
 * IntegrationsController - Manages third-party integrations
 * Handles Zapier, Google Sheets, and webhook configurations
 */
class IntegrationsController {
    
    /**
     * Get all integrations for the current user
     */
    public static function getAll(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            SELECT * FROM integrations 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        ');
        $stmt->execute([$userId]);
        $integrations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Parse JSON config for each integration
        foreach ($integrations as &$integration) {
            if (isset($integration['config'])) {
                $integration['config'] = json_decode($integration['config'], true) ?? [];
            }
        }
        
        Response::json(['items' => $integrations]);
    }
    
    /**
     * Get a specific integration by ID
     */
    public static function get(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT * FROM integrations WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        $integration = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$integration) {
            Response::notFound('Integration not found');
            return;
        }
        
        if (isset($integration['config'])) {
            $integration['config'] = json_decode($integration['config'], true) ?? [];
        }
        
        Response::json($integration);
    }
    
    /**
     * Create a new integration
     */
    public static function create(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        
        $required = ['name', 'type'];
        foreach ($required as $field) {
            if (empty($body[$field])) {
                Response::validationError("Field '$field' is required");
                return;
            }
        }
        
        $validTypes = ['zapier', 'google_sheets', 'webhook', 'hubspot', 'salesforce', 'pipedrive'];
        if (!in_array($body['type'], $validTypes)) {
            Response::validationError('Invalid integration type');
            return;
        }
        
        $pdo = Database::conn();
        $id = uniqid('int_', true);
        
        $config = $body['config'] ?? [];
        $status = $body['status'] ?? 'inactive';
        
        $stmt = $pdo->prepare('
            INSERT INTO integrations (id, user_id, name, type, config, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ');
        $stmt->execute([
            $id,
            $userId,
            $body['name'],
            $body['type'],
            json_encode($config),
            $status
        ]);
        
        Response::json([
            'id' => $id,
            'name' => $body['name'],
            'type' => $body['type'],
            'config' => $config,
            'status' => $status,
            'message' => 'Integration created successfully'
        ], 201);
    }
    
    /**
     * Update an existing integration
     */
    public static function update(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        // Check if integration exists
        $stmt = $pdo->prepare('SELECT * FROM integrations WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$existing) {
            Response::notFound('Integration not found');
            return;
        }
        
        $updates = [];
        $params = [];
        
        if (isset($body['name'])) {
            $updates[] = 'name = ?';
            $params[] = $body['name'];
        }
        if (isset($body['config'])) {
            $updates[] = 'config = ?';
            $params[] = json_encode($body['config']);
        }
        if (isset($body['status'])) {
            $updates[] = 'status = ?';
            $params[] = $body['status'];
        }
        
        if (empty($updates)) {
            Response::json(['message' => 'No updates provided']);
            return;
        }
        
        $updates[] = 'updated_at = CURRENT_TIMESTAMP';
        $params[] = $id;
        $params[] = $userId;
        
        $sql = 'UPDATE integrations SET ' . implode(', ', $updates) . ' WHERE id = ? AND user_id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        Response::json(['message' => 'Integration updated successfully']);
    }
    
    /**
     * Delete an integration
     */
    public static function delete(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('DELETE FROM integrations WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        
        if ($stmt->rowCount() === 0) {
            Response::notFound('Integration not found');
            return;
        }
        
        Response::json(['message' => 'Integration deleted successfully']);
    }
    
    /**
     * Test an integration connection
     */
    public static function test(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT * FROM integrations WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        $integration = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$integration) {
            Response::notFound('Integration not found');
            return;
        }
        
        $config = json_decode($integration['config'], true) ?? [];
        $result = ['success' => false, 'message' => 'Unknown integration type'];
        
        switch ($integration['type']) {
            case 'webhook':
                $result = self::testWebhook($config);
                break;
            case 'google_sheets':
                $result = self::testGoogleSheets($config);
                break;
            case 'zapier':
                $result = self::testZapier($config);
                break;
            default:
                $result = ['success' => false, 'message' => 'Testing not available for this integration type'];
        }
        
        // Update last_tested timestamp
        $stmt = $pdo->prepare('UPDATE integrations SET last_tested = CURRENT_TIMESTAMP WHERE id = ?');
        $stmt->execute([$id]);
        
        Response::json($result);
    }
    
    /**
     * Test a webhook URL
     */
    private static function testWebhook(array $config): array {
        $url = $config['url'] ?? '';
        if (empty($url)) {
            return ['success' => false, 'message' => 'Webhook URL not configured'];
        }
        
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return ['success' => false, 'message' => 'Invalid webhook URL'];
        }
        
        $testPayload = [
            'event' => 'test',
            'timestamp' => date('c'),
            'data' => [
                'message' => 'This is a test webhook from Xordon'
            ]
        ];
        
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($testPayload),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'X-Xordon-Event: test',
                'X-Xordon-Signature: ' . hash_hmac('sha256', json_encode($testPayload), $config['secret'] ?? 'xordon')
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_FOLLOWLOCATION => true
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            return ['success' => false, 'message' => "Connection failed: $error"];
        }
        
        if ($httpCode >= 200 && $httpCode < 300) {
            return ['success' => true, 'message' => "Webhook test successful (HTTP $httpCode)"];
        }
        
        return ['success' => false, 'message' => "Webhook returned HTTP $httpCode"];
    }
    
    /**
     * Test Google Sheets connection
     */
    private static function testGoogleSheets(array $config): array {
        $spreadsheetId = $config['spreadsheet_id'] ?? '';
        $accessToken = $config['access_token'] ?? '';
        
        if (empty($spreadsheetId)) {
            return ['success' => false, 'message' => 'Spreadsheet ID not configured'];
        }
        
        if (empty($accessToken)) {
            return ['success' => false, 'message' => 'Google Sheets not authenticated. Please connect your Google account.'];
        }
        
        // Test API access
        $url = "https://sheets.googleapis.com/v4/spreadsheets/{$spreadsheetId}?fields=properties.title";
        
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_HTTPHEADER => [
                "Authorization: Bearer $accessToken"
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            $data = json_decode($response, true);
            $title = $data['properties']['title'] ?? 'Unknown';
            return ['success' => true, 'message' => "Connected to spreadsheet: $title"];
        }
        
        if ($httpCode === 401) {
            return ['success' => false, 'message' => 'Authentication expired. Please reconnect your Google account.'];
        }
        
        return ['success' => false, 'message' => "Failed to access spreadsheet (HTTP $httpCode)"];
    }
    
    /**
     * Test Zapier webhook
     */
    private static function testZapier(array $config): array {
        $webhookUrl = $config['webhook_url'] ?? '';
        
        if (empty($webhookUrl)) {
            return ['success' => false, 'message' => 'Zapier webhook URL not configured'];
        }
        
        // Zapier webhooks should start with hooks.zapier.com
        if (strpos($webhookUrl, 'hooks.zapier.com') === false && strpos($webhookUrl, 'zapier.com') === false) {
            return ['success' => false, 'message' => 'Invalid Zapier webhook URL'];
        }
        
        $testPayload = [
            'event' => 'test',
            'timestamp' => date('c'),
            'source' => 'xordon',
            'data' => [
                'message' => 'Test connection from Xordon'
            ]
        ];
        
        $ch = curl_init($webhookUrl);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($testPayload),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            return ['success' => false, 'message' => "Connection failed: $error"];
        }
        
        if ($httpCode >= 200 && $httpCode < 300) {
            return ['success' => true, 'message' => 'Zapier webhook test successful'];
        }
        
        return ['success' => false, 'message' => "Zapier returned HTTP $httpCode"];
    }
    
    /**
     * Get Zapier API key for the user (generates if not exists)
     */
    public static function getZapierApiKey(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Check if user already has a Zapier API key
        $stmt = $pdo->prepare('SELECT zapier_api_key FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $apiKey = $row['zapier_api_key'] ?? null;
        
        if (!$apiKey) {
            // Generate a new API key
            $apiKey = 'zap_' . bin2hex(random_bytes(24));
            
            $stmt = $pdo->prepare('UPDATE users SET zapier_api_key = ? WHERE id = ?');
            $stmt->execute([$apiKey, $userId]);
        }
        
        Response::json([
            'api_key' => $apiKey,
            'webhook_base_url' => self::getWebhookBaseUrl()
        ]);
    }
    
    /**
     * Regenerate Zapier API key
     */
    public static function regenerateZapierApiKey(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $apiKey = 'zap_' . bin2hex(random_bytes(24));
        
        $stmt = $pdo->prepare('UPDATE users SET zapier_api_key = ? WHERE id = ?');
        $stmt->execute([$apiKey, $userId]);
        
        Response::json([
            'api_key' => $apiKey,
            'message' => 'API key regenerated successfully'
        ]);
    }
    
    /**
     * Get available triggers for Zapier
     */
    public static function getZapierTriggers(): void {
        Auth::userIdOrFail();
        
        $triggers = [
            [
                'key' => 'form_submission',
                'name' => 'Form Submission',
                'description' => 'Triggers when a form is submitted'
            ],
            [
                'key' => 'email_reply',
                'name' => 'Email Reply',
                'description' => 'Triggers when someone replies to a campaign email'
            ],
            [
                'key' => 'email_bounce',
                'name' => 'Email Bounce',
                'description' => 'Triggers when an email bounces'
            ],
            [
                'key' => 'unsubscribe',
                'name' => 'Unsubscribe',
                'description' => 'Triggers when someone unsubscribes'
            ],
            [
                'key' => 'campaign_completed',
                'name' => 'Campaign Completed',
                'description' => 'Triggers when a campaign finishes sending'
            ],
            [
                'key' => 'new_contact',
                'name' => 'New Contact',
                'description' => 'Triggers when a new contact is added'
            ],
            [
                'key' => 'call_completed',
                'name' => 'Call Completed',
                'description' => 'Triggers when a call campaign call is completed'
            ],
            [
                'key' => 'sms_reply',
                'name' => 'SMS Reply',
                'description' => 'Triggers when someone replies to an SMS'
            ]
        ];
        
        Response::json(['triggers' => $triggers]);
    }
    
    /**
     * Get available actions for Zapier
     */
    public static function getZapierActions(): void {
        Auth::userIdOrFail();
        
        $actions = [
            [
                'key' => 'create_contact',
                'name' => 'Create Contact',
                'description' => 'Add a new contact to your list'
            ],
            [
                'key' => 'update_contact',
                'name' => 'Update Contact',
                'description' => 'Update an existing contact'
            ],
            [
                'key' => 'add_to_campaign',
                'name' => 'Add to Campaign',
                'description' => 'Add a contact to an email campaign'
            ],
            [
                'key' => 'add_tag',
                'name' => 'Add Tag',
                'description' => 'Add a tag to a contact'
            ],
            [
                'key' => 'remove_tag',
                'name' => 'Remove Tag',
                'description' => 'Remove a tag from a contact'
            ]
        ];
        
        Response::json(['actions' => $actions]);
    }
    
    private static function getWebhookBaseUrl(): string {
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        return "{$protocol}://{$host}/api/webhooks";
    }
}
