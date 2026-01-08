<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class CallSettingsController {
    
    public static function get(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT data FROM call_settings WHERE user_id = ? LIMIT 1');
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
        $existing = $pdo->prepare('SELECT data FROM call_settings WHERE user_id = ? LIMIT 1');
        $existing->execute([$userId]);
        $row = $existing->fetch();
        
        $current = self::defaults();
        if ($row && isset($row['data'])) {
            $current = self::mergeWithDefaults(self::parseData($row['data']));
        }
        
        // Update call settings
        $callFields = [
            'provider',
            'defaultCallerId',
            'callingHoursStart',
            'callingHoursEnd',
            'timezone',
            'maxRetries',
            'retryDelay',
            'callTimeout',
            'recordingEnabled',
            'voicemailEnabled',
            'autoDialingEnabled',
            'callQueueSize',
            'workingHoursEnabled',
            'workingDays',
            'callDelay',
            'maxCallsPerHour',
            'callSpacing',
            'dncCheckEnabled',
            'consentRequired',
            'autoOptOut',
            'consentMessage'
        ];
        
        foreach ($callFields as $field) {
            if (array_key_exists($field, $body)) {
                // Handle boolean fields
                if (in_array($field, ['recordingEnabled', 'voicemailEnabled', 'autoDialingEnabled', 'workingHoursEnabled', 'dncCheckEnabled', 'consentRequired', 'autoOptOut'])) {
                    $current[$field] = (bool)$body[$field];
                } 
                // Handle numeric fields
                else if (in_array($field, ['maxRetries', 'retryDelay', 'callTimeout', 'callQueueSize', 'callDelay', 'maxCallsPerHour', 'callSpacing'])) {
                    $current[$field] = (int)$body[$field];
                }
                // Handle array fields
                else if ($field === 'workingDays' && is_array($body[$field])) {
                    $current[$field] = $body[$field];
                }
                // Handle string fields
                else {
                    $current[$field] = $body[$field];
                }
            }
        }
        
        // Validation
        $errors = [];
        
        // Validate provider
        if (!in_array($current['provider'], ['signalwire', 'twilio', 'vonage'], true)) {
            $errors['provider'] = 'Invalid provider. Must be signalwire, twilio, or vonage';
        }
        
        // Validate timezone
        if (!in_array($current['timezone'], timezone_identifiers_list(), true)) {
            $errors['timezone'] = 'Invalid timezone';
        }
        
        // Validate time format (HH:MM)
        $timeRegex = '/^(?:[01]\\d|2[0-3]):[0-5]\\d$/';
        if (!preg_match($timeRegex, $current['callingHoursStart'])) {
            $errors['callingHoursStart'] = 'Invalid time format. Use HH:MM';
        }
        if (!preg_match($timeRegex, $current['callingHoursEnd'])) {
            $errors['callingHoursEnd'] = 'Invalid time format. Use HH:MM';
        }
        
        // Validate numeric ranges
        if ($current['maxRetries'] < 0 || $current['maxRetries'] > 10) {
            $errors['maxRetries'] = 'Max retries must be between 0 and 10';
        }
        if ($current['retryDelay'] < 0) {
            $errors['retryDelay'] = 'Retry delay must be non-negative';
        }
        if ($current['callTimeout'] < 10 || $current['callTimeout'] > 300) {
            $errors['callTimeout'] = 'Call timeout must be between 10 and 300 seconds';
        }
        if ($current['callQueueSize'] < 1 || $current['callQueueSize'] > 100) {
            $errors['callQueueSize'] = 'Call queue size must be between 1 and 100';
        }
        if ($current['callDelay'] < 0) {
            $errors['callDelay'] = 'Call delay must be non-negative';
        }
        if ($current['maxCallsPerHour'] < 1 || $current['maxCallsPerHour'] > 1000) {
            $errors['maxCallsPerHour'] = 'Max calls per hour must be between 1 and 1000';
        }
        if ($current['callSpacing'] < 0) {
            $errors['callSpacing'] = 'Call spacing must be non-negative';
        }
        
        // Validate working days
        $validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        foreach ($current['workingDays'] as $day) {
            if (!in_array($day, $validDays, true)) {
                $errors['workingDays'] = 'Invalid day in working days';
                break;
            }
        }
        
        if (!empty($errors)) {
            Response::validationError('Invalid call settings', $errors);
            return;
        }
        
        $json = json_encode($current, JSON_UNESCAPED_SLASHES);
        
        if (!$row) {
            $stmt = $pdo->prepare('INSERT INTO call_settings (user_id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
            $stmt->execute([$userId, $json]);
        } else {
            $stmt = $pdo->prepare('UPDATE call_settings SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?');
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
        
        $d['provider'] = $s['provider'] ?? $d['provider'];
        $d['defaultCallerId'] = $s['defaultCallerId'] ?? $d['defaultCallerId'];
        $d['callingHoursStart'] = $s['callingHoursStart'] ?? $d['callingHoursStart'];
        $d['callingHoursEnd'] = $s['callingHoursEnd'] ?? $d['callingHoursEnd'];
        $d['timezone'] = $s['timezone'] ?? $d['timezone'];
        $d['maxRetries'] = (int)($s['maxRetries'] ?? $d['maxRetries']);
        $d['retryDelay'] = (int)($s['retryDelay'] ?? $d['retryDelay']);
        $d['callTimeout'] = (int)($s['callTimeout'] ?? $d['callTimeout']);
        $d['recordingEnabled'] = (bool)($s['recordingEnabled'] ?? $d['recordingEnabled']);
        $d['voicemailEnabled'] = (bool)($s['voicemailEnabled'] ?? $d['voicemailEnabled']);
        $d['autoDialingEnabled'] = (bool)($s['autoDialingEnabled'] ?? $d['autoDialingEnabled']);
        $d['callQueueSize'] = (int)($s['callQueueSize'] ?? $d['callQueueSize']);
        $d['workingHoursEnabled'] = (bool)($s['workingHoursEnabled'] ?? $d['workingHoursEnabled']);
        $d['workingDays'] = $s['workingDays'] ?? $d['workingDays'];
        $d['callDelay'] = (int)($s['callDelay'] ?? $d['callDelay']);
        $d['maxCallsPerHour'] = (int)($s['maxCallsPerHour'] ?? $d['maxCallsPerHour']);
        $d['callSpacing'] = (int)($s['callSpacing'] ?? $d['callSpacing']);
        $d['dncCheckEnabled'] = (bool)($s['dncCheckEnabled'] ?? $d['dncCheckEnabled']);
        $d['consentRequired'] = (bool)($s['consentRequired'] ?? $d['consentRequired']);
        $d['autoOptOut'] = (bool)($s['autoOptOut'] ?? $d['autoOptOut']);
        $d['consentMessage'] = $s['consentMessage'] ?? $d['consentMessage'];
        
        return $d;
    }
    
    private static function defaults(): array {
        return [
            'provider' => 'signalwire',
            'defaultCallerId' => $_ENV['SIGNALWIRE_DEFAULT_CALLER_ID'] ?? '+1234567890',
            'callingHoursStart' => '09:00',
            'callingHoursEnd' => '17:00',
            'timezone' => 'America/New_York',
            'maxRetries' => 3,
            'retryDelay' => 30, // minutes
            'callTimeout' => 30, // seconds
            'recordingEnabled' => true,
            'voicemailEnabled' => true,
            'autoDialingEnabled' => false,
            'callQueueSize' => 10,
            'workingHoursEnabled' => true,
            'workingDays' => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            'callDelay' => 60, // seconds between calls
            'maxCallsPerHour' => 60,
            'callSpacing' => 5, // seconds minimum between calls
            'dncCheckEnabled' => true,
            'consentRequired' => true,
            'autoOptOut' => true,
            'consentMessage' => "By continuing this call, you consent to receiving calls from our company. To opt out, press 9 or say 'stop calling'."
        ];
    }
}
