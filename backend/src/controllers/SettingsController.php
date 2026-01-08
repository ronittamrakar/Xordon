<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../services/AiService.php';
require_once __DIR__ . '/../services/RBACService.php';
require_once __DIR__ . '/../traits/WorkspaceScoped.php';

class SettingsController {
    use WorkspaceScoped;

    private static function isWorkspaceAdminOrOwner(): bool {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceRole)) {
            return false;
        }
        $role = strtolower((string)$ctx->workspaceRole);
        return $role === 'owner' || $role === 'admin';
    }
    
    public static function get(): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        // Check permission - allow viewing settings with any settings permission
        if (!self::isWorkspaceAdminOrOwner() && !$rbac->hasAnyPermission($userId, ['settings.general', 'settings.email', 'settings.sms', 'settings.calls', 'settings.integrations'])) {
            Response::forbidden('You do not have permission to view settings');
            return;
        }
        
        $pdo = Database::conn();
        
        // Use workspace scoping for tenant isolation
        $scope = self::workspaceWhere();
        $workspaceId = $scope['params'][0];
        
        $stmt = $pdo->prepare('SELECT data FROM settings WHERE ' . $scope['sql'] . ' LIMIT 1');
        $stmt->execute([$workspaceId]);
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
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!self::isWorkspaceAdminOrOwner() && !$rbac->hasAnyPermission($userId, ['settings.general', 'settings.email'])) {
            Response::forbidden('You do not have permission to update settings');
            return;
        }
        
        $b = get_json_body();
        $pdo = Database::conn();
        // Use workspace scoping for tenant isolation
        $scope = self::workspaceWhere();
        $workspaceId = $scope['params'][0];
        
        $existing = $pdo->prepare('SELECT data FROM settings WHERE ' . $scope['sql'] . ' LIMIT 1');
        $existing->execute([$workspaceId]);
        $row = $existing->fetch();
        
        $current = self::defaults();
        if ($row && isset($row['data'])) {
            $current = self::mergeWithDefaults(self::parseData($row['data']));
        }

        // Apply updates: support booleans & nested api_keys/webhooks
        $map = [
            'default_sending_account_id',
            'unsubscribe_redirect_url',
            'tracking_pixel_enabled',
            'open_tracking_enabled',
            'click_tracking_enabled',
            'trackOpens',
            'trackClicks',
            'warmup_enabled',
            'auto_reply_detection',
            'notify_campaign_updates',
            'notify_daily_summary',
            'sendingWindowStart',
            'sendingWindowEnd',
            'timezone',
            'emailAccount',
            'unsubscribeText',
            'footerText',
            'averageDelay',
            'sendingPriority',
            'emailDelay',
            'batchSize',
            'priority',
            'retryAttempts',
            'pauseBetweenBatches',
            'respectSendingWindow',
        ];
        foreach ($map as $k) {
            if (array_key_exists($k, $b)) {
                $current[$k] = $b[$k];
            }
        }
        // Nested objects
        if (isset($b['api_keys']) && is_array($b['api_keys'])) {
            $current['api_keys'] = array_merge($current['api_keys'] ?? [
                'openai' => '',
                'sendgrid' => '',
                'stripe' => '',
            ], $b['api_keys']);
        }
        if (isset($b['webhooks']) && is_array($b['webhooks'])) {
            $current['webhooks'] = array_merge($current['webhooks'] ?? [
                'form_submission' => '',
                'email_bounce' => '',
                'unsubscribe' => '',
            ], $b['webhooks']);
        }
        if (isset($b['ai']) && is_array($b['ai'])) {
            $current['ai'] = array_replace_recursive($current['ai'] ?? AiService::baseConfig(), $b['ai']);
        }

        // Validation
        $errors = [];
        if (isset($current['timezone'])) {
            $tz = $current['timezone'];
            if (!in_array($tz, timezone_identifiers_list(), true)) {
                $errors['timezone'] = 'Invalid timezone';
            }
        }
        $timeRegex = '/^(?:[01]\\d|2[0-3]):[0-5]\\d$/';
        if (isset($current['sendingWindowStart']) && !preg_match($timeRegex, (string)$current['sendingWindowStart'])) {
            $errors['sendingWindowStart'] = 'Invalid time format HH:MM';
        }
        if (isset($current['sendingWindowEnd']) && !preg_match($timeRegex, (string)$current['sendingWindowEnd'])) {
            $errors['sendingWindowEnd'] = 'Invalid time format HH:MM';
        }
        if (isset($current['priority'])) {
            $allowed = ['follow_ups_first','initial_first','mixed'];
            if (!in_array($current['priority'], $allowed, true)) {
                $errors['priority'] = 'Invalid priority';
            }
        }
        if (isset($current['emailDelay']) && (!is_int($current['emailDelay']) || $current['emailDelay'] < 0)) {
            $errors['emailDelay'] = 'Must be a non-negative integer';
        }
        if (isset($current['batchSize']) && (!is_int($current['batchSize']) || $current['batchSize'] <= 0)) {
            $errors['batchSize'] = 'Must be a positive integer';
        }
        if (isset($current['retryAttempts']) && (!is_int($current['retryAttempts']) || $current['retryAttempts'] < 0)) {
            $errors['retryAttempts'] = 'Must be a non-negative integer';
        }
        if (isset($current['pauseBetweenBatches']) && (!is_int($current['pauseBetweenBatches']) || $current['pauseBetweenBatches'] < 0)) {
            $errors['pauseBetweenBatches'] = 'Must be a non-negative integer';
        }
        if (!empty($errors)) {
            Response::validationError('Invalid settings', $errors);
            return;
        }

        $json = json_encode($current, JSON_UNESCAPED_SLASHES);
        if (!$row) {
            $stmt = $pdo->prepare('INSERT INTO settings (user_id, workspace_id, data, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)');
            $stmt->execute([$userId, $workspaceId, $json]);
        } else {
            $stmt = $pdo->prepare('UPDATE settings SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE ' . $scope['sql']);
            $stmt->execute([$json, $workspaceId]);
        }
        // Respond with merged settings
        Response::json(self::mergeWithDefaults($current));
    }

    private static function parseData(string $raw): array {
        if (!$raw) return [];
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }

    private static function mergeWithDefaults(array $s): array {
        $d = self::defaults();
        // Preserve other keys from DB to prevent data loss for other modules (e.g. Helpdesk)
        foreach ($s as $k => $v) {
            if (!array_key_exists($k, $d)) {
                $d[$k] = $v;
            }
        }

        // Booleans & simple fields
        $d['default_sending_account_id'] = $s['default_sending_account_id'] ?? $d['default_sending_account_id'];
        $d['unsubscribe_redirect_url'] = $s['unsubscribe_redirect_url'] ?? $d['unsubscribe_redirect_url'];
        $d['tracking_pixel_enabled'] = (bool)($s['tracking_pixel_enabled'] ?? $d['tracking_pixel_enabled']);
        $d['open_tracking_enabled'] = (bool)($s['open_tracking_enabled'] ?? $d['open_tracking_enabled']);
        $d['click_tracking_enabled'] = (bool)($s['click_tracking_enabled'] ?? $d['click_tracking_enabled']);
        $d['trackOpens'] = (bool)($s['trackOpens'] ?? $d['trackOpens']);
        $d['trackClicks'] = (bool)($s['trackClicks'] ?? $d['trackClicks']);
        $d['warmup_enabled'] = (bool)($s['warmup_enabled'] ?? $d['warmup_enabled']);
        $d['auto_reply_detection'] = (bool)($s['auto_reply_detection'] ?? $d['auto_reply_detection']);
        $d['notify_campaign_updates'] = (bool)($s['notify_campaign_updates'] ?? $d['notify_campaign_updates']);
        $d['notify_daily_summary'] = (bool)($s['notify_daily_summary'] ?? $d['notify_daily_summary']);
        
        // Email-specific settings
        $d['emailAccount'] = $s['emailAccount'] ?? $d['emailAccount'];
        $d['unsubscribeText'] = $s['unsubscribeText'] ?? $d['unsubscribeText'];
        $d['footerText'] = $s['footerText'] ?? $d['footerText'];
        $d['averageDelay'] = $s['averageDelay'] ?? $d['averageDelay'];
        $d['sendingPriority'] = $s['sendingPriority'] ?? $d['sendingPriority'];
        
        // Campaign scheduling settings
        $d['sendingWindowStart'] = $s['sendingWindowStart'] ?? $d['sendingWindowStart'];
        $d['sendingWindowEnd'] = $s['sendingWindowEnd'] ?? $d['sendingWindowEnd'];
        $d['timezone'] = $s['timezone'] ?? $d['timezone'];
        $d['emailDelay'] = (int)($s['emailDelay'] ?? $d['emailDelay']);
        $d['batchSize'] = (int)($s['batchSize'] ?? $d['batchSize']);
        $d['priority'] = $s['priority'] ?? $d['priority'];
        $d['retryAttempts'] = (int)($s['retryAttempts'] ?? $d['retryAttempts']);
        $d['pauseBetweenBatches'] = (int)($s['pauseBetweenBatches'] ?? $d['pauseBetweenBatches']);
        $d['respectSendingWindow'] = (bool)($s['respectSendingWindow'] ?? $d['respectSendingWindow']);
        
        // Nested sections
        $d['api_keys'] = array_merge($d['api_keys'], is_array($s['api_keys'] ?? null) ? $s['api_keys'] : []);
        $d['webhooks'] = array_merge($d['webhooks'], is_array($s['webhooks'] ?? null) ? $s['webhooks'] : []);
        $d['ai'] = array_replace_recursive($d['ai'], is_array($s['ai'] ?? null) ? $s['ai'] : []);
        return $d;
    }
    
    private static function defaults(): array {
        return [
            'default_sending_account_id' => null,
            'unsubscribe_redirect_url' => '',
            'tracking_pixel_enabled' => true,
            'open_tracking_enabled' => true,
            'click_tracking_enabled' => true,
            'trackOpens' => true,
            'trackClicks' => true,
            'warmup_enabled' => true,
            'auto_reply_detection' => true,
            'notify_campaign_updates' => false,
            'notify_daily_summary' => false,
            
            // Email-specific settings
            'emailAccount' => 'default',
            'unsubscribeText' => 'If you no longer wish to receive these emails, you can unsubscribe here.',
            'footerText' => 'This email was sent by {company_name}. You received this email because you signed up for our newsletter.',
            'averageDelay' => '30',
            'sendingPriority' => 'followups_first',
            
            // Campaign scheduling settings
            'sendingWindowStart' => '09:00',
            'sendingWindowEnd' => '17:00',
            'timezone' => 'UTC',
            'emailDelay' => 30, // seconds between emails
            'batchSize' => 50, // emails per batch
            'priority' => 'follow_ups_first', // follow_ups_first, initial_first, mixed
            'retryAttempts' => 3,
            'pauseBetweenBatches' => 300, // 5 minutes in seconds
            'respectSendingWindow' => true,
            
            'api_keys' => [
                'openai' => '',
                'sendgrid' => '',
                'stripe' => '',
            ],
            'webhooks' => [
                'form_submission' => '',
                'email_bounce' => '',
                'unsubscribe' => '',
            ],
            'ai' => AiService::baseConfig(),
        ];
    }

    // ================== PUBLIC ASSETS ==================

    public static function getPublicAssets(): void {
        $userId = Auth::userIdOrFail();
        // Basic read permission
        $rbac = RBACService::getInstance();
        if (!self::isWorkspaceAdminOrOwner() && !$rbac->hasAnyPermission($userId, ['settings.general', 'settings.website'])) {
            Response::forbidden('Access denied');
            return;
        }

        $pdo = Database::conn();
        $scope = self::workspaceWhere();
        $workspaceId = $scope['params'][0];

        $stmt = $pdo->prepare('SELECT * FROM public_asset_settings WHERE workspace_id = ?');
        $stmt->execute([$workspaceId]);
        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$data) {
            Response::json([
                'seo_title_template' => '{{page_title}} | {{agency_name}}',
                'cookie_consent_enabled' => false,
                'cookie_consent_message' => 'We use cookies to improve your experience on our site.',
                'primary_color' => '#3B82F6',
            ]);
            return;
        }
        
        // Convert integer booleans
        $data['cookie_consent_enabled'] = (bool)$data['cookie_consent_enabled'];
        Response::json($data);
    }

    public static function updatePublicAssets(): void {
        $userId = Auth::userIdOrFail();
        // Write permission
        $rbac = RBACService::getInstance();
        if (!self::isWorkspaceAdminOrOwner() && !$rbac->hasAnyPermission($userId, ['settings.general', 'settings.website'])) {
            Response::forbidden('Access denied');
            return;
        }

        $pdo = Database::conn();
        $scope = self::workspaceWhere();
        $workspaceId = $scope['params'][0];
        $body = get_json_body();

        $fields = [
            'seo_title_template', 'seo_description_default', 'og_image_url', 'favicon_url',
            'gtm_id', 'meta_pixel_id', 'google_analytics_id',
            'header_scripts', 'footer_scripts',
            'cookie_consent_message', 'cookie_policy_url', 'primary_color'
        ];

        $sets = [];
        $params = [];
        
        // Handle standard fields
        foreach ($fields as $f) {
            if (array_key_exists($f, $body)) {
                $sets[] = "$f = ?";
                $params[] = $body[$f];
            }
        }

        // Handle boolean
        if (isset($body['cookie_consent_enabled'])) {
            $sets[] = "cookie_consent_enabled = ?";
            $params[] = $body['cookie_consent_enabled'] ? 1 : 0;
        }

        if (empty($sets)) {
            Response::error('No valid fields updated', 422);
            return;
        }
        
        // Check if row exists
        $stmt = $pdo->prepare('SELECT id FROM public_asset_settings WHERE workspace_id = ?');
        $stmt->execute([$workspaceId]);
        
        if ($stmt->fetch()) {
            // Update
            $params[] = $workspaceId;
            $sql = "UPDATE public_asset_settings SET " . implode(', ', $sets) . ", updated_at = NOW() WHERE workspace_id = ?";
            $pdo->prepare($sql)->execute($params);
        } else {
            // Insert
            // We need to construct INSERT statement differently as sets are in Update format "col = ?"
            // Re-map for Insert
            $insertCols = ['workspace_id'];
            $insertVals = [$workspaceId];
            $placeholders = ['?'];

            foreach ($fields as $f) {
                if (array_key_exists($f, $body)) {
                    $insertCols[] = $f;
                    $insertVals[] = $body[$f];
                    $placeholders[] = '?';
                }
            }
            if (isset($body['cookie_consent_enabled'])) {
                $insertCols[] = 'cookie_consent_enabled';
                $insertVals[] = $body['cookie_consent_enabled'] ? 1 : 0;
                $placeholders[] = '?';
            }

            $sql = "INSERT INTO public_asset_settings (" . implode(', ', $insertCols) . ") VALUES (" . implode(', ', $placeholders) . ")";
            $pdo->prepare($sql)->execute($insertVals);
        }

        self::getPublicAssets(); // Return updated object
    }
}
