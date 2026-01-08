<?php
class TrackController {
    private static function findRecipient(PDO $pdo, int $rid, int $userId): ?array {
        $stmt = $pdo->prepare('SELECT * FROM recipients WHERE id = ?');
        $stmt->execute([$rid]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) return null;
        // Ensure recipient belongs to a campaign owned by user (or is global contact later)
        if (!empty($row['campaign_id'])) {
            $s = $pdo->prepare('SELECT 1 FROM campaigns WHERE id = ? AND user_id = ?');
            $s->execute([$row['campaign_id'], $userId]);
            if (!$s->fetch()) return null;
        }
        return $row;
    }
    private static function findRecipientByToken(PDO $pdo, string $token): ?array {
        if (!$token) return null;
        $stmt = $pdo->prepare('SELECT r.* FROM recipients r WHERE r.track_token = ? LIMIT 1');
        $stmt->execute([$token]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public static function open(): void {
        $pdo = Database::conn();
        $token = get_query('token');
        $rid = (int)(get_query('rid', 0));
        $rec = null;
        if ($token) {
            $rec = self::findRecipientByToken($pdo, $token);
        } elseif ($rid) {
            $userId = Auth::userIdOrFail();
            $rec = self::findRecipient($pdo, $rid, $userId);
        }
        if (!$rec) { Response::error('Not found', 404); return; }
        $stmt = $pdo->prepare('UPDATE recipients SET opens = opens + 1, opened_at = COALESCE(opened_at, CURRENT_TIMESTAMP) WHERE id = ?');
        $stmt->execute([$rec['id']]);
        if (!empty($rec['campaign_id'])) {
            $cstmt = $pdo->prepare('UPDATE campaigns SET opens = opens + 1 WHERE id = ?');
            $cstmt->execute([$rec['campaign_id']]);
            
            // Log analytics
            $astmt = $pdo->prepare('INSERT INTO analytics (user_id, campaign_id, metric_type, metric_value, date_recorded) 
                                   SELECT c.user_id, c.id, "opened", 1, CURDATE() 
                                   FROM campaigns c WHERE c.id = ?
                                   ON DUPLICATE KEY UPDATE metric_value = metric_value + 1');
            $astmt->execute([$rec['campaign_id']]);
        }
        header('Content-Type: image/gif');
        header('Cache-Control: no-cache, no-store, must-revalidate');
        echo base64_decode('R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==');
    }

    public static function click(): void {
        $pdo = Database::conn();
        $token = get_query('token');
        $rid = (int)(get_query('rid', 0));
        $url = get_query('url');
        if (!$url) { Response::error('Bad Request', 400); return; }
        $rec = null;
        if ($token) {
            $rec = self::findRecipientByToken($pdo, $token);
        } elseif ($rid) {
            $userId = Auth::userIdOrFail();
            $rec = self::findRecipient($pdo, $rid, $userId);
        }
        if (!$rec) { Response::error('Not found', 404); return; }
        $stmt = $pdo->prepare('UPDATE recipients SET clicks = clicks + 1, clicked_at = COALESCE(clicked_at, CURRENT_TIMESTAMP) WHERE id = ?');
        $stmt->execute([$rec['id']]);
        if (!empty($rec['campaign_id'])) {
            $cstmt = $pdo->prepare('UPDATE campaigns SET clicks = clicks + 1 WHERE id = ?');
            $cstmt->execute([$rec['campaign_id']]);
            
            // Log analytics
            $astmt = $pdo->prepare('INSERT INTO analytics (user_id, campaign_id, metric_type, metric_value, date_recorded) 
                                   SELECT c.user_id, c.id, "clicked", 1, CURDATE() 
                                   FROM campaigns c WHERE c.id = ?
                                   ON DUPLICATE KEY UPDATE metric_value = metric_value + 1');
            $astmt->execute([$rec['campaign_id']]);
        }
        header('Location: ' . $url, true, 302);
    }

    public static function bounce(): void {
        $pdo = Database::conn();
        $token = get_query('token');
        $rid = (int)(get_query('rid', 0));
        $rec = null;
        if ($token) {
            $rec = self::findRecipientByToken($pdo, $token);
        } elseif ($rid) {
            $userId = Auth::userIdOrFail();
            $rec = self::findRecipient($pdo, $rid, $userId);
        }
        if (!$rec) { Response::error('Not found', 404); return; }
        $stmt = $pdo->prepare('UPDATE recipients SET bounces = bounces + 1, bounced_at = COALESCE(bounced_at, CURRENT_TIMESTAMP) WHERE id = ?');
        $stmt->execute([$rec['id']]);
        if (!empty($rec['campaign_id'])) {
            $cstmt = $pdo->prepare('UPDATE campaigns SET bounces = bounces + 1 WHERE id = ?');
            $cstmt->execute([$rec['campaign_id']]);
            
            // Log analytics
            $astmt = $pdo->prepare('INSERT INTO analytics (user_id, campaign_id, metric_type, metric_value, date_recorded) 
                                   SELECT c.user_id, c.id, "bounced", 1, CURDATE() 
                                   FROM campaigns c WHERE c.id = ?
                                   ON DUPLICATE KEY UPDATE metric_value = metric_value + 1');
            $astmt->execute([$rec['campaign_id']]);
        }
        Response::json(['success' => true]);
    }

    /**
     * Handle bounce webhooks from email providers (SendGrid, SES, Mailgun, etc.)
     */
    public static function bounceWebhook(): void {
        $pdo = Database::conn();
        
        // Get webhook payload
        $payload = json_decode(file_get_contents('php://input'), true);
        if (!$payload) {
            Response::error('Invalid JSON payload', 400);
            return;
        }
        
        try {
            // Handle different provider formats
            $recipientEmail = null;
            $messageId = null;
            $bounceType = null;
            
            // SendGrid format
            if (isset($payload['email'])) {
                $recipientEmail = $payload['email'];
                $messageId = $payload['smtp-id'] ?? null;
                $bounceType = $payload['event'] ?? 'bounce';
            }
            // AWS SES format
            elseif (isset($payload['Message'])) {
                $messageData = json_decode($payload['Message'], true);
                if (isset($messageData['mail']['destination'][0])) {
                    $recipientEmail = $messageData['mail']['destination'][0];
                    $messageId = $messageData['mail']['messageId'] ?? null;
                    if (isset($messageData['bounce'])) {
                        $bounceType = 'bounce';
                    } elseif (isset($messageData['complaint'])) {
                        $bounceType = 'complaint';
                    }
                }
            }
            // Generic format
            elseif (isset($payload['recipient'])) {
                $recipientEmail = $payload['recipient'];
                $messageId = $payload['message_id'] ?? null;
                $bounceType = $payload['type'] ?? 'bounce';
            }
            
            if (!$recipientEmail) {
                Response::error('Recipient email not found in payload', 400);
                return;
            }
            
            // Find recipient by email and message ID if available
            $recipient = null;
            if ($messageId) {
                // Try to find by message ID first (more accurate)
                $stmt = $pdo->prepare('SELECT r.* FROM recipients r 
                                     JOIN email_replies er ON er.recipient_id = r.id 
                                     WHERE r.email = ? AND er.message_id = ? 
                                     ORDER BY r.id DESC LIMIT 1');
                $stmt->execute([$recipientEmail, $messageId]);
                $recipient = $stmt->fetch(PDO::FETCH_ASSOC);
            }
            
            // Fallback to finding by email only
            if (!$recipient) {
                $stmt = $pdo->prepare('SELECT * FROM recipients WHERE email = ? ORDER BY id DESC LIMIT 1');
                $stmt->execute([$recipientEmail]);
                $recipient = $stmt->fetch(PDO::FETCH_ASSOC);
            }
            
            if (!$recipient) {
                Response::error('Recipient not found', 404);
                return;
            }
            
            // Update recipient status
            $status = ($bounceType === 'complaint') ? 'complained' : 'bounced';
            $stmt = $pdo->prepare('UPDATE recipients SET status = ?, bounces = bounces + 1, bounced_at = CURRENT_TIMESTAMP WHERE id = ?');
            $stmt->execute([$status, $recipient['id']]);
            
            // Update campaign bounces if applicable
            if (!empty($recipient['campaign_id'])) {
                $cstmt = $pdo->prepare('UPDATE campaigns SET bounces = bounces + 1 WHERE id = ?');
                $cstmt->execute([$recipient['campaign_id']]);
                
                // Log analytics
                $astmt = $pdo->prepare('INSERT INTO analytics (user_id, campaign_id, metric_type, metric_value, date_recorded) 
                                       SELECT c.user_id, c.id, ?, 1, CURDATE() 
                                       FROM campaigns c WHERE c.id = ?
                                       ON DUPLICATE KEY UPDATE metric_value = metric_value + 1');
                $metricType = ($bounceType === 'complaint') ? 'complained' : 'bounced';
                $astmt->execute([$metricType, $recipient['campaign_id']]);
            }
            
            Response::success(['message' => 'Webhook processed successfully']);
            
        } catch (Exception $e) {
            error_log('Bounce webhook error: ' . $e->getMessage());
            Response::error('Webhook processing failed', 500);
        }
    }

    public static function status(int $rid): void {
        $pdo = Database::conn();
        $token = get_query('token');
        $rec = null;
        if ($token) {
            $rec = self::findRecipientByToken($pdo, $token);
        } else {
            $userId = Auth::userIdOrFail();
            $rec = self::findRecipient($pdo, $rid, $userId);
        }
        if (!$rec) { Response::error('Not found', 404); return; }
        Response::json([
            'id' => (string)$rec['id'],
            'opens' => (int)($rec['opens'] ?? 0),
            'clicks' => (int)($rec['clicks'] ?? 0),
            'bounces' => (int)($rec['bounces'] ?? 0),
            'opened_at' => $rec['opened_at'] ?? null,
            'clicked_at' => $rec['clicked_at'] ?? null,
            'bounced_at' => $rec['bounced_at'] ?? null,
            'sent_at' => $rec['sent_at'] ?? null,
        ]);
    }

    public static function unsubscribe(): void {
        $pdo = Database::conn();
        $token = get_query('token');
        $rid = (int)(get_query('rid', 0));
        $cid = (int)(get_query('cid', 0));
        
        $rec = null;
        if ($token) {
            $rec = self::findRecipientByToken($pdo, $token);
        } elseif ($rid) {
            // For unsubscribe, we don't require authentication since it's a public action
            $stmt = $pdo->prepare('SELECT * FROM recipients WHERE id = ?');
            $stmt->execute([$rid]);
            $rec = $stmt->fetch(PDO::FETCH_ASSOC);
        }
        
        if (!$rec) { 
            Response::error('Not found', 404); 
            return; 
        }
        
        // Check if already unsubscribed
        if ($rec['unsubscribed_at']) {
            Response::json(['success' => true, 'message' => 'Already unsubscribed']);
            return;
        }
        
        // Update recipient as unsubscribed
        $stmt = $pdo->prepare('UPDATE recipients SET unsubscribes = unsubscribes + 1, unsubscribed_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmt->execute([$rec['id']]);
        
        // Update campaign unsubscribe count
        if (!empty($rec['campaign_id'])) {
            $cstmt = $pdo->prepare('UPDATE campaigns SET unsubscribes = unsubscribes + 1 WHERE id = ?');
            $cstmt->execute([$rec['campaign_id']]);
        }
        
        // Log analytics
        if (!empty($rec['campaign_id'])) {
            $astmt = $pdo->prepare('INSERT INTO analytics (user_id, campaign_id, metric_type, metric_value, date_recorded) 
                                   SELECT c.user_id, c.id, "unsubscribed", 1, CURDATE() 
                                   FROM campaigns c WHERE c.id = ?');
            $astmt->execute([$rec['campaign_id']]);
        }
        
        Response::json(['success' => true, 'message' => 'Successfully unsubscribed']);
    }
}