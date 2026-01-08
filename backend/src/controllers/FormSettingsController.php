<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class FormSettingsController {
    
    public static function get(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT data FROM form_settings WHERE user_id = ? LIMIT 1');
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
        $existing = $pdo->prepare('SELECT data FROM form_settings WHERE user_id = ? LIMIT 1');
        $existing->execute([$userId]);
        $row = $existing->fetch();
        
        $current = self::defaults();
        if ($row && isset($row['data'])) {
            $current = self::mergeWithDefaults(self::parseData($row['data']));
        }
        
        // Update form settings
        $formFields = [
            'enableNotifications',
            'notificationEmail',
            'autoReplyEnabled',
            'autoReplySubject',
            'autoReplyMessage',
            'enableSpamProtection',
            'spamKeywords',
            'enableFileUploads',
            'maxFileSize',
            'allowedFileTypes'
        ];
        
        foreach ($formFields as $field) {
            if (array_key_exists($field, $body)) {
                // Handle boolean fields
                if (in_array($field, ['enableNotifications', 'autoReplyEnabled', 'enableSpamProtection', 'enableFileUploads'])) {
                    $current[$field] = (bool)$body[$field];
                } 
                // Handle numeric fields
                else if ($field === 'maxFileSize') {
                    $current[$field] = (int)$body[$field];
                }
                // Handle string fields
                else {
                    $current[$field] = $body[$field];
                }
            }
        }
        
        // Validation
        $errors = [];
        
        // Validate email if notifications are enabled
        if ($current['enableNotifications'] && !empty($current['notificationEmail'])) {
            if (!filter_var($current['notificationEmail'], FILTER_VALIDATE_EMAIL)) {
                $errors['notificationEmail'] = 'Invalid email address';
            }
        }
        
        // Validate max file size
        if ($current['maxFileSize'] < 1 || $current['maxFileSize'] > 100) {
            $errors['maxFileSize'] = 'Max file size must be between 1 and 100 MB';
        }
        
        // Validate allowed file types format
        if (!empty($current['allowedFileTypes'])) {
            $types = explode(',', $current['allowedFileTypes']);
            foreach ($types as $type) {
                $type = trim($type);
                if (!preg_match('/^[a-z0-9]+$/i', $type)) {
                    $errors['allowedFileTypes'] = 'Invalid file type format. Use comma-separated extensions (e.g., pdf,doc,jpg)';
                    break;
                }
            }
        }
        
        if (!empty($errors)) {
            Response::validationError('Invalid form settings', $errors);
            return;
        }
        
        $json = json_encode($current, JSON_UNESCAPED_SLASHES);
        
        if (!$row) {
            $stmt = $pdo->prepare('INSERT INTO form_settings (user_id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
            $stmt->execute([$userId, $json]);
        } else {
            $stmt = $pdo->prepare('UPDATE form_settings SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?');
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
        
        $d['enableNotifications'] = (bool)($s['enableNotifications'] ?? $d['enableNotifications']);
        $d['notificationEmail'] = $s['notificationEmail'] ?? $d['notificationEmail'];
        $d['autoReplyEnabled'] = (bool)($s['autoReplyEnabled'] ?? $d['autoReplyEnabled']);
        $d['autoReplySubject'] = $s['autoReplySubject'] ?? $d['autoReplySubject'];
        $d['autoReplyMessage'] = $s['autoReplyMessage'] ?? $d['autoReplyMessage'];
        $d['enableSpamProtection'] = (bool)($s['enableSpamProtection'] ?? $d['enableSpamProtection']);
        $d['spamKeywords'] = $s['spamKeywords'] ?? $d['spamKeywords'];
        $d['enableFileUploads'] = (bool)($s['enableFileUploads'] ?? $d['enableFileUploads']);
        $d['maxFileSize'] = (int)($s['maxFileSize'] ?? $d['maxFileSize']);
        $d['allowedFileTypes'] = $s['allowedFileTypes'] ?? $d['allowedFileTypes'];
        
        return $d;
    }
    
    private static function defaults(): array {
        return [
            'enableNotifications' => true,
            'notificationEmail' => '',
            'autoReplyEnabled' => true,
            'autoReplySubject' => 'Thank you for your submission',
            'autoReplyMessage' => 'Thank you for your submission. We will get back to you soon.',
            'enableSpamProtection' => true,
            'spamKeywords' => 'spam, viagra, casino',
            'enableFileUploads' => false,
            'maxFileSize' => 10, // MB
            'allowedFileTypes' => 'pdf,doc,docx,jpg,png'
        ];
    }
}
