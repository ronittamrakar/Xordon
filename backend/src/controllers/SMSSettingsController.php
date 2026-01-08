<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../services/SMSService.php';

class SMSSettingsController {
    
    public static function get(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT data FROM sms_settings WHERE user_id = ? LIMIT 1');
        $stmt->execute([$userId]);
        $row = $stmt->fetch();
        
        if (!$row) {
            Response::json(self::defaults());
            return;
        }
        
        $data = self::parseData($row['data'] ?? '');
        Response::json(self::mergeWithDefaults($data));
    }
    
    public static function update(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        // Get existing settings
        $existing = $pdo->prepare('SELECT data FROM sms_settings WHERE user_id = ? LIMIT 1');
        $existing->execute([$userId]);
        $row = $existing->fetch();
        
        $current = self::defaults();
        if ($row && isset($row['data'])) {
            $current = self::mergeWithDefaults(self::parseData($row['data']));
        }
        
        // Update SMS settings
        $smsFields = [
            'signalwireProjectId',
            'signalwireSpaceUrl', 
            'signalwireApiToken',
            'defaultSenderNumber',
            'quietHoursStart',
            'quietHoursEnd',
            'retryAttempts',
            'retryDelay',
            'unsubscribeKeywords',
            'averageDelay',
            'sendingPriority',
            'timezone',
            'enableQuietHours',
            'enableRetries'
        ];
        
        foreach ($smsFields as $field) {
            if (array_key_exists($field, $body)) {
                $current[$field] = is_bool($body[$field]) ? ($body[$field] ? 1 : 0) : $body[$field];
            }
        }
        
        $json = json_encode($current, JSON_UNESCAPED_SLASHES);
        
        if (!$row) {
            $stmt = $pdo->prepare('INSERT INTO sms_settings (user_id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
            $stmt->execute([$userId, $json]);
        } else {
            $stmt = $pdo->prepare('UPDATE sms_settings SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?');
            $stmt->execute([$json, $userId]);
        }
        
        Response::json(self::mergeWithDefaults($current));
    }
    
    private static function parseData(string $raw): array {
        if (!$raw) return [];
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }
    
    private static function mergeWithDefaults(array $s): array {
        $d = self::defaults();
        
        $d['signalwireProjectId'] = $s['signalwireProjectId'] ?? $d['signalwireProjectId'];
        $d['signalwireSpaceUrl'] = $s['signalwireSpaceUrl'] ?? $d['signalwireSpaceUrl'];
        $d['signalwireApiToken'] = $s['signalwireApiToken'] ?? $d['signalwireApiToken'];
        $d['defaultSenderNumber'] = $s['defaultSenderNumber'] ?? $d['defaultSenderNumber'];
        $d['quietHoursStart'] = $s['quietHoursStart'] ?? $d['quietHoursStart'];
        $d['quietHoursEnd'] = $s['quietHoursEnd'] ?? $d['quietHoursEnd'];
        $d['retryAttempts'] = (int)($s['retryAttempts'] ?? $d['retryAttempts']);
        $d['retryDelay'] = (int)($s['retryDelay'] ?? $d['retryDelay']);
        $d['unsubscribeKeywords'] = $s['unsubscribeKeywords'] ?? $d['unsubscribeKeywords'];
        $d['averageDelay'] = (int)($s['averageDelay'] ?? $d['averageDelay']);
        $d['sendingPriority'] = $s['sendingPriority'] ?? $d['sendingPriority'];
        $d['timezone'] = $s['timezone'] ?? $d['timezone'];
        $d['enableQuietHours'] = (bool)($s['enableQuietHours'] ?? $d['enableQuietHours']);
        $d['enableRetries'] = (bool)($s['enableRetries'] ?? $d['enableRetries']);
        
        return $d;
    }
    
    private static function defaults(): array {
        return [
            'signalwireProjectId' => $_ENV['SIGNALWIRE_PROJECT_ID'] ?? '',
            'signalwireSpaceUrl' => $_ENV['SIGNALWIRE_SPACE_URL'] ?? '',
            'signalwireApiToken' => $_ENV['SIGNALWIRE_API_TOKEN'] ?? '',
            'defaultSenderNumber' => $_ENV['SIGNALWIRE_DEFAULT_SENDER'] ?? '',
            'quietHoursStart' => '22:00',
            'quietHoursEnd' => '08:00',
            'retryAttempts' => 3,
            'retryDelay' => 60, // minutes
            'unsubscribeKeywords' => 'STOP, UNSUBSCRIBE, QUIT, CANCEL, END',
            'averageDelay' => 5, // seconds between SMS
            'sendingPriority' => 'followups_first',
            'timezone' => 'UTC',
            'enableQuietHours' => true,
            'enableRetries' => true
        ];
    }
    
    public static function getAvailableNumbers(): void {
        $userId = Auth::userIdOrFail();
        
        try {
            // Get current SMS settings
            $pdo = Database::conn();
            $stmt = $pdo->prepare('SELECT data FROM sms_settings WHERE user_id = ? LIMIT 1');
            $stmt->execute([$userId]);
            $row = $stmt->fetch();
            
            // Use defaults if no user settings exist
            $settings = $row ? self::parseData($row['data'] ?? '') : self::defaults();
            
            // Check if we have SignalWire credentials
            if (empty($settings['signalwireProjectId']) || empty($settings['signalwireSpaceUrl']) || empty($settings['signalwireApiToken'])) {
                Response::json(['accounts' => []]);
                return;
            }
            
            // Fetch available numbers from SignalWire
            $smsService = new SMSService();
            $numbers = $smsService->getAvailableNumbers(
                $settings['signalwireProjectId'],
                $settings['signalwireSpaceUrl'],
                $settings['signalwireApiToken']
            );
            
            // Format numbers as sending accounts
            $accounts = array_map(function($number) {
                return [
                    'id' => $number['number_id'] ?? uniqid(),
                    'name' => $number['friendly_name'] ?? $number['phone_number'],
                    'type' => 'signalwire',
                    'phone_number' => $number['phone_number'],
                    'status' => 'active',
                    'provider_config' => [
                        'number_id' => $number['number_id'] ?? '',
                        'capabilities' => $number['capabilities'] ?? []
                    ]
                ];
            }, $numbers);
            
            Response::json(['accounts' => $accounts]);
            
        } catch (Exception $e) {
            error_log('Error fetching available numbers: ' . $e->getMessage());
            Response::json(['accounts' => []]);
        }
    }
    
    public static function createSendingAccount(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        
        // Validate required fields
        $required = ['name', 'phone_number', 'type'];
        foreach ($required as $field) {
            if (empty($body[$field])) {
                Response::json(['error' => "Missing required field: $field"], 400);
                return;
            }
        }
        
        try {
            // For now, we'll just return the account data as-is
            // In a real implementation, you might want to store this in a database
            $account = [
                'id' => uniqid(),
                'name' => $body['name'],
                'type' => $body['type'],
                'phone_number' => $body['phone_number'],
                'status' => 'active',
                'provider_config' => $body['provider_config'] ?? []
            ];
            
            Response::json($account);
            
        } catch (Exception $e) {
            error_log('Error creating sending account: ' . $e->getMessage());
            Response::json(['error' => 'Failed to create sending account'], 500);
        }
    }
    
    public static function fetchSignalWireNumbers(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        
        // Validate required fields
        $required = ['projectId', 'spaceUrl', 'apiToken'];
        foreach ($required as $field) {
            if (empty($body[$field])) {
                Response::json(['error' => "Missing required field: $field"], 400);
                return;
            }
        }
        
        try {
            // Fetch available numbers from SignalWire
            $smsService = new SMSService();
            $numbers = $smsService->getAvailableNumbers(
                $body['projectId'],
                $body['spaceUrl'],
                $body['apiToken']
            );
            
            Response::json([
                'success' => true,
                'numbers' => $numbers
            ]);
            
        } catch (Exception $e) {
            error_log('Error fetching SignalWire numbers: ' . $e->getMessage());
            Response::json(['error' => 'Failed to fetch SignalWire numbers'], 500);
        }
    }

    public static function testTwilioConnection(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        
        // Validate required fields
        $required = ['accountSid', 'authToken', 'phoneNumber'];
        foreach ($required as $field) {
            if (empty($body[$field])) {
                Response::json(['error' => "Missing required field: $field"], 400);
                return;
            }
        }
        
        try {
            // Test Twilio connection by attempting to fetch account info
            $smsService = new SMSService();
            $isValid = $smsService->testTwilioConnection(
                $body['accountSid'],
                $body['authToken'],
                $body['phoneNumber']
            );
            
            Response::json([
                'success' => true,
                'valid' => $isValid,
                'message' => $isValid ? 'Twilio connection successful' : 'Twilio connection failed'
            ]);
            
        } catch (Exception $e) {
            error_log('Error testing Twilio connection: ' . $e->getMessage());
            Response::json([
                'success' => false,
                'valid' => false,
                'error' => 'Failed to test Twilio connection'
            ], 500);
        }
    }

    public static function getProviderSettings(): void {
        $userId = Auth::userIdOrFail();
        
        try {
            $pdo = Database::conn();
            $stmt = $pdo->prepare('SELECT provider, settings FROM sms_provider_settings WHERE user_id = ?');
            $stmt->execute([$userId]);
            $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $formattedSettings = [];
            foreach ($settings as $setting) {
                $formattedSettings[$setting['provider']] = json_decode($setting['settings'], true);
            }
            
            Response::json([
                'success' => true,
                'settings' => $formattedSettings
            ]);
            
        } catch (Exception $e) {
            error_log('Error getting provider settings: ' . $e->getMessage());
            Response::json(['error' => 'Failed to get provider settings'], 500);
        }
    }

    public static function updateProviderSettings(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        
        if (empty($body['provider']) || !isset($body['settings'])) {
            Response::json(['error' => 'Provider and settings are required'], 400);
            return;
        }
        
        try {
            $pdo = Database::conn();
            
            // Check if settings exist for this provider
            $stmt = $pdo->prepare('SELECT id FROM sms_provider_settings WHERE user_id = ? AND provider = ?');
            $stmt->execute([$userId, $body['provider']]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existing) {
                // Update existing settings
                $stmt = $pdo->prepare('UPDATE sms_provider_settings SET settings = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND provider = ?');
                $stmt->execute([json_encode($body['settings']), $userId, $body['provider']]);
            } else {
                // Insert new settings
                $stmt = $pdo->prepare('INSERT INTO sms_provider_settings (user_id, provider, settings, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
                $stmt->execute([$userId, $body['provider'], json_encode($body['settings'])]);
            }
            
            Response::json([
                'success' => true,
                'message' => 'Provider settings updated successfully'
            ]);
            
        } catch (Exception $e) {
            error_log('Error updating provider settings: ' . $e->getMessage());
            Response::json(['error' => 'Failed to update provider settings'], 500);
        }
    }
}