<?php
/**
 * Automation Queue Processor
 * Processes pending automation actions from the queue
 * Should be called by a cron job or worker process
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/SimpleMail.php';
require_once __DIR__ . '/SMSService.php';
require_once __DIR__ . '/TelephonyConfig.php';

class AutomationQueueProcessor {
    private $pdo;
    private $batchSize = 50;
    private $settings = [];
    
    public function __construct() {
        $this->pdo = Database::conn();
    }
    
    /**
     * Process pending queue items
     */
    public function processPending(): array {
        $results = ['processed' => 0, 'success' => 0, 'failed' => 0, 'skipped' => 0];
        
        // Get pending items that are due
        $stmt = $this->pdo->prepare('
            SELECT q.*, a.name as automation_name, f.name as flow_name
            FROM automation_queue q
            LEFT JOIN followup_automations a ON q.automation_id = a.id
            LEFT JOIN campaign_flows f ON q.flow_id = f.id
            WHERE q.status = "pending" 
            AND q.scheduled_for <= NOW()
            AND q.attempts < q.max_attempts
            ORDER BY q.priority DESC, q.scheduled_for ASC
            LIMIT ?
        ');
        $stmt->execute([$this->batchSize]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($items as $item) {
            $results['processed']++;
            
            // Mark as processing
            $this->updateStatus($item['id'], 'processing');
            
            // Load user settings for rate limiting
            $this->loadUserSettings($item['user_id']);
            
            // Check rate limits
            if (!$this->checkRateLimits($item)) {
                $this->updateStatus($item['id'], 'pending', 'Rate limit exceeded, will retry');
                $results['skipped']++;
                continue;
            }
            
            // Check quiet hours
            if ($this->isQuietHours($item['user_id'])) {
                $this->rescheduleAfterQuietHours($item);
                $results['skipped']++;
                continue;
            }
            
            // Execute the action
            $startTime = microtime(true);
            $result = $this->executeAction($item);
            $executionTime = (int)((microtime(true) - $startTime) * 1000);
            
            if ($result['success']) {
                $this->completeItem($item['id'], $result);
                $this->logExecution($item, 'action_executed', $result, 'success', null, $executionTime);
                $this->incrementRateLimit($item);
                $results['success']++;
            } else {
                $this->failItem($item, $result['error'] ?? 'Unknown error');
                $this->logExecution($item, 'action_failed', $result, 'failed', $result['error'], $executionTime);
                $results['failed']++;
            }
        }
        
        return $results;
    }
    
    /**
     * Execute an automation action
     */
    private function executeAction(array $item): array {
        $actionType = $item['action_type'];
        $actionConfig = json_decode($item['action_config'], true) ?? [];
        $contactId = $item['contact_id'];
        $userId = $item['user_id'];
        
        try {
            switch ($actionType) {
                case 'send_email':
                    return $this->sendEmail($userId, $contactId, $actionConfig);
                    
                case 'send_sms':
                    return $this->sendSMS($userId, $contactId, $actionConfig);
                    
                case 'add_tag':
                    return $this->addTag($userId, $contactId, $actionConfig);
                    
                case 'remove_tag':
                    return $this->removeTag($userId, $contactId, $actionConfig);
                    
                case 'update_status':
                    return $this->updateContactStatus($userId, $contactId, $actionConfig);
                    
                case 'notify_user':
                    return $this->notifyUser($userId, $contactId, $actionConfig);
                    
                case 'webhook':
                    return $this->triggerWebhook($userId, $contactId, $actionConfig);
                    
                case 'schedule_call':
                    return $this->scheduleCall($userId, $contactId, $actionConfig);
                    
                case 'add_to_sequence':
                    return $this->addToSequence($userId, $contactId, $actionConfig);
                    
                default:
                    return ['success' => false, 'error' => 'Unknown action type: ' . $actionType];
            }
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    /**
     * Send email action
     */
    private function sendEmail(int $userId, int $contactId, array $config): array {
        // Get contact info
        $stmt = $this->pdo->prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?');
        $stmt->execute([$contactId, $userId]);
        $contact = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$contact || empty($contact['email'])) {
            return ['success' => false, 'error' => 'Contact not found or no email'];
        }
        
        // Get template if specified
        $subject = $config['subject'] ?? 'Automated Message';
        $body = $config['body'] ?? '';
        
        if (!empty($config['template_id'])) {
            $stmt = $this->pdo->prepare('SELECT * FROM templates WHERE id = ? AND user_id = ?');
            $stmt->execute([$config['template_id'], $userId]);
            $template = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($template) {
                $subject = $template['subject'] ?? $subject;
                $body = $template['content'] ?? $body;
            }
        }
        
        // Replace variables
        $subject = $this->replaceVariables($subject, $contact);
        $body = $this->replaceVariables($body, $contact);
        
        // Resolve sending account
        $sendingAccountId = $config['sending_account_id'] ?? $this->settings['default_sending_account_id'] ?? null;
        $sendingAccount = null;
        if (!empty($sendingAccountId)) {
            $stmt = $this->pdo->prepare('SELECT * FROM sending_accounts WHERE id = ? AND user_id = ? LIMIT 1');
            $stmt->execute([(int)$sendingAccountId, $userId]);
            $sendingAccount = $stmt->fetch(PDO::FETCH_ASSOC);
        }
        if (!$sendingAccount) {
            $stmt = $this->pdo->prepare('SELECT * FROM sending_accounts WHERE user_id = ? AND status = "active" ORDER BY id ASC LIMIT 1');
            $stmt->execute([$userId]);
            $sendingAccount = $stmt->fetch(PDO::FETCH_ASSOC);
        }
        if (!$sendingAccount) {
            return ['success' => false, 'error' => 'No active sending account configured'];
        }

        $mailer = new SimpleMail();
        $ok = $mailer->sendEmail($sendingAccount, (string)$contact['email'], (string)$subject, (string)$body, null, null);
        if (!$ok) {
            return ['success' => false, 'error' => 'Email sending failed'];
        }

        return [
            'success' => true,
            'action' => 'send_email',
            'recipient' => $contact['email'],
            'subject' => $subject,
        ];
    }
    
    /**
     * Send SMS action
     */
    private function sendSMS(int $userId, int $contactId, array $config): array {
        $stmt = $this->pdo->prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?');
        $stmt->execute([$contactId, $userId]);
        $contact = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$contact || empty($contact['phone'])) {
            return ['success' => false, 'error' => 'Contact not found or no phone'];
        }
        
        $message = $config['message'] ?? '';
        
        if (!empty($config['template_id'])) {
            $stmt = $this->pdo->prepare('SELECT * FROM sms_templates WHERE id = ? AND user_id = ?');
            $stmt->execute([$config['template_id'], $userId]);
            $template = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($template) {
                $message = $template['content'] ?? $message;
            }
        }
        
        $message = $this->replaceVariables($message, $contact);
        
        $to = (string)$contact['phone'];
        $from = $config['from'] ?? $config['from_phone'] ?? null;
        $credentials = null;
        try {
            $credentials = TelephonyConfig::ensureSignalWireConfig((string)$userId);
        } catch (Exception $e) {
            // leave null to allow SMSService env fallback (if configured)
        }

        $sms = new SMSService($credentials, (string)$userId);
        $result = $sms->sendMessage($to, (string)$message, $from, $credentials);

        return [
            'success' => true,
            'action' => 'send_sms',
            'recipient' => $to,
            'external_id' => $result['external_id'] ?? null,
        ];
    }
    
    /**
     * Add tag to contact
     */
    private function addTag(int $userId, int $contactId, array $config): array {
        $tagId = $config['tag_id'] ?? null;
        if (!$tagId) {
            return ['success' => false, 'error' => 'Tag ID required'];
        }
        
        $stmt = $this->pdo->prepare('INSERT IGNORE INTO contact_tags (contact_id, tag_id, created_at) VALUES (?, ?, NOW())');
        $stmt->execute([$contactId, $tagId]);
        
        return ['success' => true, 'action' => 'add_tag', 'tag_id' => $tagId];
    }
    
    /**
     * Remove tag from contact
     */
    private function removeTag(int $userId, int $contactId, array $config): array {
        $tagId = $config['tag_id'] ?? null;
        if (!$tagId) {
            return ['success' => false, 'error' => 'Tag ID required'];
        }
        
        $stmt = $this->pdo->prepare('DELETE FROM contact_tags WHERE contact_id = ? AND tag_id = ?');
        $stmt->execute([$contactId, $tagId]);
        
        return ['success' => true, 'action' => 'remove_tag', 'tag_id' => $tagId];
    }
    
    /**
     * Update contact status
     */
    private function updateContactStatus(int $userId, int $contactId, array $config): array {
        $status = $config['status'] ?? null;
        if (!$status) {
            return ['success' => false, 'error' => 'Status required'];
        }
        
        $stmt = $this->pdo->prepare('UPDATE contacts SET status = ?, updated_at = NOW() WHERE id = ? AND user_id = ?');
        $stmt->execute([$status, $contactId, $userId]);
        
        return ['success' => true, 'action' => 'update_status', 'status' => $status];
    }
    
    /**
     * Notify user
     */
    private function notifyUser(int $userId, int $contactId, array $config): array {
        $message = $config['message'] ?? 'Automation notification';
        
        // Get contact info for context
        $stmt = $this->pdo->prepare('SELECT first_name, last_name, email FROM contacts WHERE id = ?');
        $stmt->execute([$contactId]);
        $contact = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // TODO: Send actual notification (email, push, in-app)
        error_log("AUTOMATION: Notify user $userId about contact $contactId: $message");
        
        return ['success' => true, 'action' => 'notify_user', 'message' => $message];
    }
    
    /**
     * Trigger webhook
     */
    private function triggerWebhook(int $userId, int $contactId, array $config): array {
        $url = $config['url'] ?? null;
        if (!$url) {
            return ['success' => false, 'error' => 'Webhook URL required'];
        }
        
        // Get contact data
        $stmt = $this->pdo->prepare('SELECT * FROM contacts WHERE id = ?');
        $stmt->execute([$contactId]);
        $contact = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $payload = [
            'event' => 'automation_triggered',
            'contact' => $contact,
            'config' => $config,
            'timestamp' => date('c')
        ];
        
        // Send webhook
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
        curl_close($ch);
        
        if ($httpCode >= 200 && $httpCode < 300) {
            return ['success' => true, 'action' => 'webhook', 'http_code' => $httpCode];
        }
        
        return ['success' => false, 'error' => "Webhook failed with HTTP $httpCode"];
    }
    
    /**
     * Schedule a call task
     */
    private function scheduleCall(int $userId, int $contactId, array $config): array {
        $scheduledFor = $config['scheduled_for'] ?? date('Y-m-d H:i:s', strtotime('+1 day'));
        
        // Create a task for the call
        $stmt = $this->pdo->prepare('
            INSERT INTO tasks (user_id, contact_id, type, title, description, due_date, status, created_at)
            VALUES (?, ?, "call", ?, ?, ?, "pending", NOW())
        ');
        $stmt->execute([
            $userId,
            $contactId,
            $config['title'] ?? 'Scheduled Call',
            $config['description'] ?? 'Automated call task',
            $scheduledFor
        ]);
        
        return ['success' => true, 'action' => 'schedule_call', 'scheduled_for' => $scheduledFor];
    }
    
    /**
     * Add contact to sequence
     */
    private function addToSequence(int $userId, int $contactId, array $config): array {
        $sequenceId = $config['sequence_id'] ?? null;
        if (!$sequenceId) {
            return ['success' => false, 'error' => 'Sequence ID required'];
        }
        
        // TODO: Add to sequence enrollment table
        error_log("AUTOMATION: Would add contact $contactId to sequence $sequenceId");
        
        return ['success' => true, 'action' => 'add_to_sequence', 'sequence_id' => $sequenceId];
    }
    
    /**
     * Replace template variables with contact data
     */
    private function replaceVariables(string $text, array $contact): string {
        $replacements = [
            '{{first_name}}' => $contact['first_name'] ?? '',
            '{{last_name}}' => $contact['last_name'] ?? '',
            '{{email}}' => $contact['email'] ?? '',
            '{{phone}}' => $contact['phone'] ?? '',
            '{{company}}' => $contact['company'] ?? '',
            '{{name}}' => trim(($contact['first_name'] ?? '') . ' ' . ($contact['last_name'] ?? '')),
        ];
        
        return str_replace(array_keys($replacements), array_values($replacements), $text);
    }
    
    /**
     * Load user automation settings
     */
    private function loadUserSettings(int $userId): void {
        $stmt = $this->pdo->prepare('SELECT data FROM settings WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1');
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        $this->settings = [];
        if ($row && !empty($row['data'])) {
            $allSettings = json_decode($row['data'], true) ?? [];
            if (is_array($allSettings)) {
                $this->settings = $allSettings['automation_settings'] ?? $allSettings;
            }
        }
    }
    
    /**
     * Check if within quiet hours
     */
    private function isQuietHours(int $userId): bool {
        if (empty($this->settings['quiet_hours_enabled'])) {
            return false;
        }
        
        $tz = $this->settings['quiet_hours_timezone'] ?? 'UTC';
        $now = new DateTime('now', new DateTimeZone($tz));
        $currentTime = $now->format('H:i');
        
        $start = $this->settings['quiet_hours_start'] ?? '21:00';
        $end = $this->settings['quiet_hours_end'] ?? '08:00';
        
        // Handle overnight quiet hours (e.g., 21:00 - 08:00)
        if ($start > $end) {
            return $currentTime >= $start || $currentTime < $end;
        }
        
        return $currentTime >= $start && $currentTime < $end;
    }
    
    /**
     * Check rate limits
     */
    private function checkRateLimits(array $item): bool {
        $channel = $this->getChannelFromAction($item['action_type']);
        
        $hourlyLimit = $this->settings[$channel . '_hourly_limit'] ?? 100;
        $dailyLimit = $this->settings[$channel . '_daily_limit'] ?? 1000;
        
        // Check hourly limit
        $hourStart = date('Y-m-d H:00:00');
        $stmt = $this->pdo->prepare('
            SELECT count FROM automation_rate_limits 
            WHERE user_id = ? AND channel = ? AND period_start = ? AND period_type = "hour"
        ');
        $stmt->execute([$item['user_id'], $channel, $hourStart]);
        $hourly = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($hourly && $hourly['count'] >= $hourlyLimit) {
            return false;
        }
        
        // Check daily limit
        $dayStart = date('Y-m-d 00:00:00');
        $stmt = $this->pdo->prepare('
            SELECT count FROM automation_rate_limits 
            WHERE user_id = ? AND channel = ? AND period_start = ? AND period_type = "day"
        ');
        $stmt->execute([$item['user_id'], $channel, $dayStart]);
        $daily = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($daily && $daily['count'] >= $dailyLimit) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Increment rate limit counters
     */
    private function incrementRateLimit(array $item): void {
        $channel = $this->getChannelFromAction($item['action_type']);
        $userId = $item['user_id'];
        
        // Increment hourly
        $hourStart = date('Y-m-d H:00:00');
        $stmt = $this->pdo->prepare('
            INSERT INTO automation_rate_limits (user_id, channel, period_start, period_type, count)
            VALUES (?, ?, ?, "hour", 1)
            ON DUPLICATE KEY UPDATE count = count + 1
        ');
        $stmt->execute([$userId, $channel, $hourStart]);
        
        // Increment daily
        $dayStart = date('Y-m-d 00:00:00');
        $stmt = $this->pdo->prepare('
            INSERT INTO automation_rate_limits (user_id, channel, period_start, period_type, count)
            VALUES (?, ?, ?, "day", 1)
            ON DUPLICATE KEY UPDATE count = count + 1
        ');
        $stmt->execute([$userId, $channel, $dayStart]);
    }
    
    /**
     * Get channel from action type
     */
    private function getChannelFromAction(string $actionType): string {
        if (strpos($actionType, 'email') !== false) return 'email';
        if (strpos($actionType, 'sms') !== false) return 'sms';
        if (strpos($actionType, 'call') !== false) return 'call';
        return 'other';
    }
    
    /**
     * Update queue item status
     */
    private function updateStatus(int $id, string $status, ?string $error = null): void {
        $stmt = $this->pdo->prepare('
            UPDATE automation_queue 
            SET status = ?, error_message = ?, last_attempt_at = NOW(), attempts = attempts + 1
            WHERE id = ?
        ');
        $stmt->execute([$status, $error, $id]);
    }
    
    /**
     * Mark item as completed
     */
    private function completeItem(int $id, array $result): void {
        $stmt = $this->pdo->prepare('
            UPDATE automation_queue 
            SET status = "completed", result = ?, completed_at = NOW()
            WHERE id = ?
        ');
        $stmt->execute([json_encode($result), $id]);
    }
    
    /**
     * Mark item as failed
     */
    private function failItem(array $item, string $error): void {
        $newStatus = $item['attempts'] + 1 >= $item['max_attempts'] ? 'failed' : 'pending';
        
        // If retrying, schedule for later
        $scheduledFor = null;
        if ($newStatus === 'pending') {
            $retryDelay = $this->settings['retry_delay_minutes'] ?? 30;
            $scheduledFor = date('Y-m-d H:i:s', strtotime("+$retryDelay minutes"));
        }
        
        $stmt = $this->pdo->prepare('
            UPDATE automation_queue 
            SET status = ?, error_message = ?, last_attempt_at = NOW(), attempts = attempts + 1,
                scheduled_for = COALESCE(?, scheduled_for)
            WHERE id = ?
        ');
        $stmt->execute([$newStatus, $error, $scheduledFor, $item['id']]);
    }
    
    /**
     * Reschedule item after quiet hours
     */
    private function rescheduleAfterQuietHours(array $item): void {
        $tz = $this->settings['quiet_hours_timezone'] ?? 'UTC';
        $end = $this->settings['quiet_hours_end'] ?? '08:00';
        
        $tomorrow = new DateTime('tomorrow ' . $end, new DateTimeZone($tz));
        $scheduledFor = $tomorrow->format('Y-m-d H:i:s');
        
        $stmt = $this->pdo->prepare('UPDATE automation_queue SET scheduled_for = ? WHERE id = ?');
        $stmt->execute([$scheduledFor, $item['id']]);
    }
    
    /**
     * Log execution event
     */
    private function logExecution(array $item, string $eventType, array $data, string $status, ?string $error, int $executionTime): void {
        $stmt = $this->pdo->prepare('
            INSERT INTO automation_logs 
            (user_id, automation_id, flow_id, queue_id, contact_id, event_type, event_data, status, error_message, execution_time_ms, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ');
        $stmt->execute([
            $item['user_id'],
            $item['automation_id'],
            $item['flow_id'],
            $item['id'],
            $item['contact_id'],
            $eventType,
            json_encode($data),
            $status,
            $error,
            $executionTime
        ]);
    }
    
    /**
     * Queue an action for later execution
     */
    public static function queueAction(int $userId, int $contactId, string $actionType, array $actionConfig, ?int $automationId = null, ?int $flowId = null, ?string $scheduledFor = null, int $priority = 0): int {
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            INSERT INTO automation_queue 
            (user_id, automation_id, flow_id, contact_id, action_type, action_config, priority, scheduled_for, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ');
        $stmt->execute([
            $userId,
            $automationId,
            $flowId,
            $contactId,
            $actionType,
            json_encode($actionConfig),
            $priority,
            $scheduledFor ?? date('Y-m-d H:i:s')
        ]);
        
        return (int)$pdo->lastInsertId();
    }
    
    /**
     * Get queue stats for a user
     */
    public static function getQueueStats(int $userId): array {
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            SELECT 
                status,
                COUNT(*) as count
            FROM automation_queue
            WHERE user_id = ?
            GROUP BY status
        ');
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $stats = ['pending' => 0, 'processing' => 0, 'completed' => 0, 'failed' => 0];
        foreach ($rows as $row) {
            $stats[$row['status']] = (int)$row['count'];
        }
        
        return $stats;
    }
}
