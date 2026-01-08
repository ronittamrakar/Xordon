<?php
require_once __DIR__ . '/../Database.php';

/**
 * WebhookService - Dispatches webhook events to configured endpoints
 */
class WebhookService {
    
    /**
     * Dispatch a webhook event
     * 
     * @param int $userId User ID
     * @param string $event Event type (form_submission, email_bounce, unsubscribe, etc.)
     * @param array $data Event data payload
     * @return array Results of webhook dispatches
     */
    public static function dispatch(int $userId, string $event, array $data): array {
        $results = [];
        
        // Get user's webhook settings
        $webhookUrl = self::getWebhookUrl($userId, $event);
        if ($webhookUrl) {
            $results['settings_webhook'] = self::sendWebhook($webhookUrl, $event, $data, $userId);
        }
        
        // Get user's integrations that should receive this event
        $integrations = self::getActiveIntegrations($userId, $event);
        foreach ($integrations as $integration) {
            $config = json_decode($integration['config'], true) ?? [];
            
            switch ($integration['type']) {
                case 'webhook':
                    if (!empty($config['url'])) {
                        $results["integration_{$integration['id']}"] = self::sendWebhook(
                            $config['url'], 
                            $event, 
                            $data, 
                            $userId,
                            $config['secret'] ?? null
                        );
                    }
                    break;
                    
                case 'zapier':
                    if (!empty($config['webhook_url'])) {
                        $results["zapier_{$integration['id']}"] = self::sendZapierWebhook(
                            $config['webhook_url'],
                            $event,
                            $data
                        );
                    }
                    break;
                    
                case 'google_sheets':
                    if (!empty($config['spreadsheet_id']) && !empty($config['access_token'])) {
                        $results["sheets_{$integration['id']}"] = self::appendToGoogleSheet(
                            $config,
                            $event,
                            $data
                        );
                    }
                    break;
            }
        }
        
        // Log the webhook dispatch
        self::logWebhookDispatch($userId, $event, $data, $results);
        
        return $results;
    }
    
    /**
     * Get webhook URL from user settings
     */
    private static function getWebhookUrl(int $userId, string $event): ?string {
        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT data FROM settings WHERE user_id = ?');
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$row || empty($row['data'])) {
            return null;
        }
        
        $settings = json_decode($row['data'], true);
        $webhooks = $settings['webhooks'] ?? [];
        
        // Map event types to webhook keys
        $eventMap = [
            'form_submission' => 'form_submission',
            'formSubmission' => 'form_submission',
            'email_bounce' => 'email_bounce',
            'emailBounce' => 'email_bounce',
            'unsubscribe' => 'unsubscribe',
        ];
        
        $webhookKey = $eventMap[$event] ?? $event;
        return $webhooks[$webhookKey] ?? null;
    }
    
    /**
     * Get active integrations for a specific event
     */
    private static function getActiveIntegrations(int $userId, string $event): array {
        $pdo = Database::conn();
        $stmt = $pdo->prepare('
            SELECT * FROM integrations 
            WHERE user_id = ? AND status = ?
        ');
        $stmt->execute([$userId, 'active']);
        $integrations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Filter integrations that should receive this event
        return array_filter($integrations, function($integration) use ($event) {
            $config = json_decode($integration['config'], true) ?? [];
            $events = $config['events'] ?? [];
            
            // If no events specified, send all events
            if (empty($events)) {
                return true;
            }
            
            return in_array($event, $events);
        });
    }
    
    /**
     * Send a webhook to a URL
     */
    private static function sendWebhook(string $url, string $event, array $data, int $userId, ?string $secret = null): array {
        $payload = [
            'event' => $event,
            'timestamp' => date('c'),
            'user_id' => $userId,
            'data' => $data
        ];
        
        $jsonPayload = json_encode($payload);
        $signature = hash_hmac('sha256', $jsonPayload, $secret ?? 'xordon_' . $userId);
        
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $jsonPayload,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'X-Xordon-Event: ' . $event,
                'X-Xordon-Signature: ' . $signature,
                'X-Xordon-Timestamp: ' . time()
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_FOLLOWLOCATION => true
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        return [
            'success' => $httpCode >= 200 && $httpCode < 300,
            'http_code' => $httpCode,
            'error' => $error ?: null,
            'url' => $url
        ];
    }
    
    /**
     * Send a webhook to Zapier
     */
    private static function sendZapierWebhook(string $url, string $event, array $data): array {
        $payload = array_merge([
            'event' => $event,
            'timestamp' => date('c'),
            'source' => 'xordon'
        ], $data);
        
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        return [
            'success' => $httpCode >= 200 && $httpCode < 300,
            'http_code' => $httpCode,
            'error' => $error ?: null
        ];
    }
    
    /**
     * Append data to a Google Sheet
     */
    private static function appendToGoogleSheet(array $config, string $event, array $data): array {
        $spreadsheetId = $config['spreadsheet_id'];
        $accessToken = $config['access_token'];
        $sheetName = $config['sheet_name'] ?? 'Sheet1';
        
        // Prepare row data based on event type
        $rowData = self::formatDataForSheet($event, $data);
        
        $url = "https://sheets.googleapis.com/v4/spreadsheets/{$spreadsheetId}/values/{$sheetName}:append";
        $url .= "?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS";
        
        $payload = [
            'values' => [$rowData]
        ];
        
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                "Authorization: Bearer $accessToken"
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        return [
            'success' => $httpCode >= 200 && $httpCode < 300,
            'http_code' => $httpCode,
            'error' => $error ?: null
        ];
    }
    
    /**
     * Format data for Google Sheets row
     */
    private static function formatDataForSheet(string $event, array $data): array {
        $timestamp = date('Y-m-d H:i:s');
        
        switch ($event) {
            case 'form_submission':
                return [
                    $timestamp,
                    $event,
                    $data['form_name'] ?? '',
                    $data['email'] ?? '',
                    $data['name'] ?? '',
                    json_encode($data['fields'] ?? [])
                ];
                
            case 'email_bounce':
                return [
                    $timestamp,
                    $event,
                    $data['email'] ?? '',
                    $data['campaign_name'] ?? '',
                    $data['bounce_type'] ?? '',
                    $data['reason'] ?? ''
                ];
                
            case 'unsubscribe':
                return [
                    $timestamp,
                    $event,
                    $data['email'] ?? '',
                    $data['campaign_name'] ?? '',
                    $data['reason'] ?? ''
                ];
                
            case 'new_contact':
                return [
                    $timestamp,
                    $event,
                    $data['email'] ?? '',
                    $data['first_name'] ?? '',
                    $data['last_name'] ?? '',
                    $data['company'] ?? '',
                    $data['phone'] ?? ''
                ];
                
            default:
                return [
                    $timestamp,
                    $event,
                    json_encode($data)
                ];
        }
    }
    
    /**
     * Log webhook dispatch for debugging
     */
    private static function logWebhookDispatch(int $userId, string $event, array $data, array $results): void {
        $pdo = Database::conn();
        
        // Check if webhook_logs table exists
        try {
            $stmt = $pdo->prepare('
                INSERT INTO webhook_logs (user_id, event, payload, results, created_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ');
            $stmt->execute([
                $userId,
                $event,
                json_encode($data),
                json_encode($results)
            ]);
        } catch (PDOException $e) {
            // Table might not exist, log to error log instead
            error_log("Webhook dispatch: user=$userId event=$event results=" . json_encode($results));
        }
    }
    
    /**
     * Trigger form submission webhook
     */
    public static function triggerFormSubmission(int $userId, array $formData): array {
        return self::dispatch($userId, 'form_submission', $formData);
    }
    
    /**
     * Trigger email bounce webhook
     */
    public static function triggerEmailBounce(int $userId, array $bounceData): array {
        return self::dispatch($userId, 'email_bounce', $bounceData);
    }
    
    /**
     * Trigger unsubscribe webhook
     */
    public static function triggerUnsubscribe(int $userId, array $unsubscribeData): array {
        return self::dispatch($userId, 'unsubscribe', $unsubscribeData);
    }
    
    /**
     * Trigger new contact webhook
     */
    public static function triggerNewContact(int $userId, array $contactData): array {
        return self::dispatch($userId, 'new_contact', $contactData);
    }
    
    /**
     * Trigger campaign completed webhook
     */
    public static function triggerCampaignCompleted(int $userId, array $campaignData): array {
        return self::dispatch($userId, 'campaign_completed', $campaignData);
    }
}
