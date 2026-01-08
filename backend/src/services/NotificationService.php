<?php
/**
 * Notification Service
 * 
 * Handles Slack/Teams integration, notification delivery, and action handling.
 * 
 * **Feature: crm-enhancements**
 * **Requirements: 8.1, 8.2, 8.3, 8.4**
 */

require_once __DIR__ . '/../Database.php';

class NotificationService {
    private $db;
    private const MAX_RETRIES = 3;
    
    public function __construct() {
        $this->db = Database::conn();
    }
    
    /**
     * Configure Slack/Teams integration
     * **Requirement 8.1**: Slack/Teams integration setup
     */
    public function configureIntegration(int $userId, array $config): int {
        if (!in_array($config['provider'], ['slack', 'teams'])) {
            throw new InvalidArgumentException('Provider must be slack or teams');
        }
        
        if (empty($config['channel_id'])) {
            throw new InvalidArgumentException('Channel ID is required');
        }
        
        // Check for existing config
        $stmt = $this->db->prepare("
            SELECT id FROM notification_configs 
            WHERE user_id = ? AND provider = ? AND channel_id = ?
        ");
        $stmt->execute([$userId, $config['provider'], $config['channel_id']]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            // Update existing
            $stmt = $this->db->prepare("
                UPDATE notification_configs SET
                    channel_name = ?,
                    webhook_url = ?,
                    access_token = ?,
                    triggers = ?,
                    status = 'active',
                    updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([
                $config['channel_name'] ?? null,
                $config['webhook_url'] ?? null,
                $config['access_token'] ?? null,
                json_encode($config['triggers'] ?? []),
                $existing['id']
            ]);
            return (int) $existing['id'];
        }
        
        // Create new
        $stmt = $this->db->prepare("
            INSERT INTO notification_configs (
                user_id, provider, channel_id, channel_name, webhook_url, 
                access_token, triggers, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NOW())
        ");
        $stmt->execute([
            $userId,
            $config['provider'],
            $config['channel_id'],
            $config['channel_name'] ?? null,
            $config['webhook_url'] ?? null,
            $config['access_token'] ?? null,
            json_encode($config['triggers'] ?? [])
        ]);
        
        return (int) $this->db->lastInsertId();
    }
    
    /**
     * Send notification with retry logic
     * **Requirement 8.2, 8.3**: Notification delivery with retries
     */
    public function sendNotification(int $configId, string $type, string $title, string $message, array $actions = [], array $metadata = []): int {
        // Get config
        $config = $this->getConfigById($configId);
        if (!$config) {
            throw new Exception('Notification config not found');
        }
        
        // Create notification log
        $stmt = $this->db->prepare("
            INSERT INTO notification_logs (
                config_id, notification_type, title, message, actions, metadata, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
        ");
        $stmt->execute([
            $configId,
            $type,
            $title,
            $message,
            json_encode($actions),
            json_encode($metadata)
        ]);
        $logId = (int) $this->db->lastInsertId();
        
        // Attempt delivery
        $delivered = $this->attemptDelivery($logId, $config, $title, $message, $actions);
        
        return $logId;
    }
    
    /**
     * Attempt notification delivery with retries
     */
    private function attemptDelivery(int $logId, array $config, string $title, string $message, array $actions): bool {
        $attempts = 0;
        $success = false;
        $errorMessage = null;
        
        while ($attempts < self::MAX_RETRIES && !$success) {
            $attempts++;
            
            try {
                if ($config['provider'] === 'slack') {
                    $success = $this->sendSlackNotification($config, $title, $message, $actions);
                } else {
                    $success = $this->sendTeamsNotification($config, $title, $message, $actions);
                }
            } catch (Exception $e) {
                $errorMessage = $e->getMessage();
                usleep(100000 * $attempts); // Exponential backoff
            }
        }
        
        // Update log
        $status = $success ? 'sent' : 'failed';
        $stmt = $this->db->prepare("
            UPDATE notification_logs SET
                status = ?,
                retry_count = ?,
                error_message = ?,
                sent_at = CASE WHEN ? = 'sent' THEN NOW() ELSE NULL END
            WHERE id = ?
        ");
        $stmt->execute([$status, $attempts, $errorMessage, $status, $logId]);
        
        return $success;
    }
    
    /**
     * Send Slack notification
     */
    private function sendSlackNotification(array $config, string $title, string $message, array $actions): bool {
        $webhookUrl = $config['webhook_url'];
        if (!$webhookUrl) {
            throw new Exception('Slack webhook URL not configured');
        }
        
        $payload = [
            'text' => $title,
            'blocks' => [
                [
                    'type' => 'header',
                    'text' => ['type' => 'plain_text', 'text' => $title]
                ],
                [
                    'type' => 'section',
                    'text' => ['type' => 'mrkdwn', 'text' => $message]
                ]
            ]
        ];
        
        // Add action buttons
        if (!empty($actions)) {
            $buttons = [];
            foreach ($actions as $action) {
                $buttons[] = [
                    'type' => 'button',
                    'text' => ['type' => 'plain_text', 'text' => $action['label']],
                    'action_id' => $action['id'],
                    'value' => $action['value'] ?? $action['id']
                ];
            }
            $payload['blocks'][] = [
                'type' => 'actions',
                'elements' => $buttons
            ];
        }
        
        return $this->sendWebhook($webhookUrl, $payload);
    }
    
    /**
     * Send Teams notification
     */
    private function sendTeamsNotification(array $config, string $title, string $message, array $actions): bool {
        $webhookUrl = $config['webhook_url'];
        if (!$webhookUrl) {
            throw new Exception('Teams webhook URL not configured');
        }
        
        $payload = [
            '@type' => 'MessageCard',
            '@context' => 'http://schema.org/extensions',
            'summary' => $title,
            'themeColor' => '0076D7',
            'title' => $title,
            'sections' => [
                [
                    'activityTitle' => $title,
                    'text' => $message
                ]
            ]
        ];
        
        // Add action buttons
        if (!empty($actions)) {
            $potentialActions = [];
            foreach ($actions as $action) {
                $potentialActions[] = [
                    '@type' => 'OpenUri',
                    'name' => $action['label'],
                    'targets' => [
                        ['os' => 'default', 'uri' => $action['url'] ?? '#']
                    ]
                ];
            }
            $payload['potentialAction'] = $potentialActions;
        }
        
        return $this->sendWebhook($webhookUrl, $payload);
    }
    
    /**
     * Send webhook request
     */
    private function sendWebhook(string $url, array $payload): bool {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return $httpCode >= 200 && $httpCode < 300;
    }
    
    /**
     * Handle action callback from Slack/Teams
     * **Requirement 8.4**: Interactive action handling
     */
    public function handleAction(int $notificationLogId, string $actionId, array $responseData = []): bool {
        // Verify notification exists
        $stmt = $this->db->prepare("SELECT * FROM notification_logs WHERE id = ?");
        $stmt->execute([$notificationLogId]);
        $log = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$log) {
            throw new Exception('Notification not found');
        }
        
        // Determine action type
        $actionType = 'custom';
        if (strpos($actionId, 'view') !== false) {
            $actionType = 'view';
        } elseif (strpos($actionId, 'complete') !== false) {
            $actionType = 'complete';
        } elseif (strpos($actionId, 'snooze') !== false) {
            $actionType = 'snooze';
        }
        
        // Log action response
        $stmt = $this->db->prepare("
            INSERT INTO notification_actions (
                notification_log_id, action_id, action_type, response_data, responded_at
            ) VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $notificationLogId,
            $actionId,
            $actionType,
            json_encode($responseData)
        ]);
        
        // Update notification status
        $stmt = $this->db->prepare("
            UPDATE notification_logs SET status = 'delivered' WHERE id = ?
        ");
        $stmt->execute([$notificationLogId]);
        
        return true;
    }
    
    /**
     * Get notification delivery status
     */
    public function getDeliveryStatus(int $logId): ?array {
        $stmt = $this->db->prepare("
            SELECT nl.*, nc.provider, nc.channel_name
            FROM notification_logs nl
            JOIN notification_configs nc ON nl.config_id = nc.id
            WHERE nl.id = ?
        ");
        $stmt->execute([$logId]);
        $log = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($log) {
            $log['actions'] = json_decode($log['actions'], true) ?? [];
            $log['metadata'] = json_decode($log['metadata'], true) ?? [];
            
            // Get action responses
            $stmt = $this->db->prepare("
                SELECT * FROM notification_actions WHERE notification_log_id = ?
            ");
            $stmt->execute([$logId]);
            $log['action_responses'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        return $log ?: null;
    }
    
    /**
     * Get config by ID
     */
    public function getConfigById(int $configId): ?array {
        $stmt = $this->db->prepare("SELECT * FROM notification_configs WHERE id = ?");
        $stmt->execute([$configId]);
        $config = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($config) {
            $config['triggers'] = json_decode($config['triggers'], true) ?? [];
        }
        
        return $config ?: null;
    }
    
    /**
     * Get user's notification configs
     */
    public function getUserConfigs(int $userId): array {
        $stmt = $this->db->prepare("
            SELECT * FROM notification_configs WHERE user_id = ? ORDER BY created_at DESC
        ");
        $stmt->execute([$userId]);
        $configs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($configs as &$config) {
            $config['triggers'] = json_decode($config['triggers'], true) ?? [];
        }
        
        return $configs;
    }
}
