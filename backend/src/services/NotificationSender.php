<?php
/**
 * Notification Sender Service
 * Unified interface for sending emails (SendGrid) and SMS (SignalWire/Twilio)
 */

require_once __DIR__ . '/../Database.php';

class NotificationSender {
    
    /**
     * Send an email via SendGrid
     */
    public static function sendEmail(
        int $workspaceId,
        string $to,
        string $subject,
        string $htmlBody,
        ?string $textBody = null,
        ?string $fromEmail = null,
        ?string $fromName = null,
        ?array $metadata = null
    ): array {
        try {
            $apiKey = getenv('SENDGRID_API_KEY');
            $defaultFrom = getenv('MAIL_FROM') ?: 'noreply@xordon.com';
            
            if (!$apiKey) {
                return ['success' => false, 'error' => 'SendGrid API key not configured'];
            }
            
            $fromEmail = $fromEmail ?: $defaultFrom;
            $fromName = $fromName ?: getenv('MAIL_FROM_NAME') ?: 'Xordon';
            
            $payload = [
                'personalizations' => [
                    ['to' => [['email' => $to]], 'subject' => $subject]
                ],
                'from' => ['email' => $fromEmail, 'name' => $fromName],
                'content' => []
            ];
            
            if ($textBody) {
                $payload['content'][] = ['type' => 'text/plain', 'value' => $textBody];
            }
            $payload['content'][] = ['type' => 'text/html', 'value' => $htmlBody];
            
            $ch = curl_init('https://api.sendgrid.com/v3/mail/send');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $apiKey,
                'Content-Type: application/json'
            ]);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);
            
            if ($error) {
                self::logNotification($workspaceId, 'email', $to, $subject, 'failed', $error, $metadata);
                return ['success' => false, 'error' => $error];
            }
            
            $success = $httpCode >= 200 && $httpCode < 300;
            self::logNotification($workspaceId, 'email', $to, $subject, $success ? 'sent' : 'failed',
                $success ? null : "HTTP $httpCode: $response", $metadata);
            
            if ($success) {
                return ['success' => true, 'provider' => 'sendgrid'];
            }
            $errorData = json_decode($response, true);
            return ['success' => false, 'error' => $errorData['errors'][0]['message'] ?? "HTTP $httpCode"];
            
        } catch (Exception $e) {
            self::logNotification($workspaceId, 'email', $to, $subject, 'failed', $e->getMessage(), $metadata);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    /**
     * Send SMS via SignalWire (primary) or Twilio (fallback)
     */
    public static function sendSms(
        int $workspaceId,
        string $to,
        string $message,
        ?string $from = null,
        ?array $metadata = null
    ): array {
        $result = self::sendSmsViaSignalWire($workspaceId, $to, $message, $from, $metadata);
        
        if ($result['success'] || strpos($result['error'] ?? '', 'not configured') === false) {
            return $result;
        }
        
        return self::sendSmsViaTwilio($workspaceId, $to, $message, $from, $metadata);
    }
    
    private static function sendSmsViaSignalWire(int $workspaceId, string $to, string $message, ?string $from, ?array $metadata): array {
        try {
            $projectId = getenv('SIGNALWIRE_PROJECT_ID');
            $apiToken = getenv('SIGNALWIRE_API_TOKEN');
            $spaceUrl = getenv('SIGNALWIRE_SPACE_URL');
            $defaultFrom = getenv('SIGNALWIRE_FROM_NUMBER');
            
            if (!$projectId || !$apiToken || !$spaceUrl) {
                return ['success' => false, 'error' => 'SignalWire not configured'];
            }
            
            $from = $from ?: $defaultFrom;
            if (!$from) {
                return ['success' => false, 'error' => 'No from number configured'];
            }
            
            $to = self::normalizePhone($to);
            $from = self::normalizePhone($from);
            
            $url = "https://{$spaceUrl}/api/laml/2010-04-01/Accounts/{$projectId}/Messages.json";
            
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query(['To' => $to, 'From' => $from, 'Body' => $message]));
            curl_setopt($ch, CURLOPT_USERPWD, "{$projectId}:{$apiToken}");
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);
            
            if ($error) {
                self::logNotification($workspaceId, 'sms', $to, substr($message, 0, 50), 'failed', $error, $metadata);
                return ['success' => false, 'error' => $error];
            }
            
            $data = json_decode($response, true);
            $success = $httpCode >= 200 && $httpCode < 300;
            
            self::logNotification($workspaceId, 'sms', $to, substr($message, 0, 50), $success ? 'sent' : 'failed',
                $success ? null : ($data['message'] ?? "HTTP $httpCode"),
                array_merge($metadata ?? [], ['provider' => 'signalwire', 'sid' => $data['sid'] ?? null]));
            
            return $success 
                ? ['success' => true, 'provider' => 'signalwire', 'sid' => $data['sid'] ?? null]
                : ['success' => false, 'error' => $data['message'] ?? "HTTP $httpCode"];
                
        } catch (Exception $e) {
            self::logNotification($workspaceId, 'sms', $to, substr($message, 0, 50), 'failed', $e->getMessage(), $metadata);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    private static function sendSmsViaTwilio(int $workspaceId, string $to, string $message, ?string $from, ?array $metadata): array {
        try {
            $accountSid = getenv('TWILIO_ACCOUNT_SID');
            $authToken = getenv('TWILIO_AUTH_TOKEN');
            $defaultFrom = getenv('TWILIO_FROM_NUMBER');
            
            if (!$accountSid || !$authToken) {
                return ['success' => false, 'error' => 'Twilio not configured'];
            }
            
            $from = $from ?: $defaultFrom;
            if (!$from) {
                return ['success' => false, 'error' => 'No from number configured'];
            }
            
            $to = self::normalizePhone($to);
            $from = self::normalizePhone($from);
            
            $url = "https://api.twilio.com/2010-04-01/Accounts/{$accountSid}/Messages.json";
            
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query(['To' => $to, 'From' => $from, 'Body' => $message]));
            curl_setopt($ch, CURLOPT_USERPWD, "{$accountSid}:{$authToken}");
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);
            
            if ($error) {
                self::logNotification($workspaceId, 'sms', $to, substr($message, 0, 50), 'failed', $error, $metadata);
                return ['success' => false, 'error' => $error];
            }
            
            $data = json_decode($response, true);
            $success = $httpCode >= 200 && $httpCode < 300;
            
            self::logNotification($workspaceId, 'sms', $to, substr($message, 0, 50), $success ? 'sent' : 'failed',
                $success ? null : ($data['message'] ?? "HTTP $httpCode"),
                array_merge($metadata ?? [], ['provider' => 'twilio', 'sid' => $data['sid'] ?? null]));
            
            return $success 
                ? ['success' => true, 'provider' => 'twilio', 'sid' => $data['sid'] ?? null]
                : ['success' => false, 'error' => $data['message'] ?? "HTTP $httpCode"];
                
        } catch (Exception $e) {
            self::logNotification($workspaceId, 'sms', $to, substr($message, 0, 50), 'failed', $e->getMessage(), $metadata);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    /**
     * Send notification using template
     */
    public static function sendFromTemplate(
        int $workspaceId,
        string $templateType,
        string $channel,
        string $recipient,
        array $variables,
        ?array $metadata = null
    ): array {
        try {
            $db = Database::conn();
            
            $stmt = $db->prepare("
                SELECT * FROM notification_templates 
                WHERE (workspace_id = ? OR workspace_id IS NULL) AND type = ? AND is_active = 1
                ORDER BY workspace_id DESC LIMIT 1
            ");
            $stmt->execute([$workspaceId, $templateType]);
            $template = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$template) {
                return ['success' => false, 'error' => "Template not found: $templateType"];
            }
            
            if ($channel === 'email') {
                $subject = self::replaceVariables($template['email_subject'] ?? $template['title_template'], $variables);
                $body = self::replaceVariables($template['email_body'] ?? $template['body_template'], $variables);
                return self::sendEmail($workspaceId, $recipient, $subject, $body, null, null, null, $metadata);
            } elseif ($channel === 'sms') {
                $message = self::replaceVariables($template['sms_body'] ?? $template['body_template'], $variables);
                return self::sendSms($workspaceId, $recipient, $message, null, $metadata);
            }
            
            return ['success' => false, 'error' => "Unsupported channel: $channel"];
            
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    private static function replaceVariables(string $template, array $variables): string {
        foreach ($variables as $key => $value) {
            $template = str_replace('{{' . $key . '}}', $value ?? '', $template);
        }
        return $template;
    }
    
    private static function normalizePhone(string $phone): string {
        $phone = preg_replace('/[^0-9+]/', '', $phone);
        if (!str_starts_with($phone, '+')) {
            $phone = '+1' . $phone;
        }
        return $phone;
    }
    
    private static function logNotification(int $workspaceId, string $channel, string $recipient, string $subject, string $status, ?string $error, ?array $metadata): void {
        try {
            $db = Database::conn();
            $stmt = $db->prepare("
                INSERT INTO notification_logs (workspace_id, channel, recipient, subject, status, error_message, metadata, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([$workspaceId, $channel, $recipient, $subject, $status, $error, json_encode($metadata)]);
        } catch (Exception $e) {
            error_log("NotificationSender::logNotification error: " . $e->getMessage());
        }
    }
}
