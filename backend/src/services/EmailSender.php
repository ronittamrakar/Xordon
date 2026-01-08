<?php

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../../vendor/phpmailer/src/PHPMailer.php';
require_once __DIR__ . '/../../vendor/phpmailer/src/SMTP.php';
require_once __DIR__ . '/../../vendor/phpmailer/src/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class EmailSender {
    private $pdo;
    private $baseUrl;

    public function __construct() {
        $this->pdo = Database::conn();
        $this->baseUrl = $_ENV['APP_URL'] ?? 'http://localhost:9000';
    }

    /**
     * Send email to a recipient with tracking
     */
    public function sendEmail(array $sendingAccount, string $recipientEmail, string $subject, string $htmlContent, int $recipientId = null, int $campaignId = null): bool {
        try {
            $mail = new PHPMailer(true);

            // Server settings
            $mail->isSMTP();
            $mail->Host = $sendingAccount['smtp_host'] ?? 'smtp.gmail.com';
            $mail->SMTPAuth = true;
            $mail->Username = $sendingAccount['smtp_username'] ?? $sendingAccount['email'];
            $mail->Password = $sendingAccount['smtp_password'];
            $mail->SMTPSecure = $sendingAccount['smtp_encryption'] ?? PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = $sendingAccount['smtp_port'] ?? 587;

            // Recipients
            $mail->setFrom($sendingAccount['email'], $sendingAccount['name'] ?? '');
            $mail->addAddress($recipientEmail);

            // Content
            $mail->isHTML(true);
            $mail->Subject = $subject;
            
            // Generate unique message ID for threading
            $messageId = '<' . uniqid() . '@' . parse_url($this->baseUrl, PHP_URL_HOST) . '>';
            $mail->MessageID = $messageId;
            
            // Add tracking to email content
            $trackedContent = $this->addTrackingToContent($htmlContent, $recipientId, $campaignId);
            $mail->Body = $trackedContent;

            // Send the email
            $result = $mail->send();

            if ($result && $recipientId) {
                // Update recipient status
                $stmt = $this->pdo->prepare('UPDATE recipients SET status = "sent", sent_at = CURRENT_TIMESTAMP WHERE id = ?');
                $stmt->execute([$recipientId]);

                // Update campaign sent count
                if ($campaignId) {
                    $stmt = $this->pdo->prepare('UPDATE campaigns SET sent = sent + 1 WHERE id = ?');
                    $stmt->execute([$campaignId]);
                }

                // Update sending account daily count
                $stmt = $this->pdo->prepare('UPDATE sending_accounts SET sent_today = sent_today + 1 WHERE id = ?');
                $stmt->execute([$sendingAccount['id']]);

                // Save sent email to email_replies table for tracking
                if ($campaignId) {
                    // Generate thread ID based on subject and participants
                    $normalizedSubject = preg_replace('/^(Re:|Fwd?:|RE:|FWD?:)\s*/i', '', $subject);
                    $threadId = md5($normalizedSubject . $sendingAccount['email'] . $recipientEmail);
                    
                    $stmt = $this->pdo->prepare('
                        INSERT INTO email_replies (user_id, campaign_id, recipient_id, from_email, to_email, subject, body, is_read, is_starred, is_archived, thread_id, message_id, created_at) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ');
                    $stmt->execute([
                        $sendingAccount['user_id'] ?? null,
                        $campaignId,
                        $recipientId,
                        $sendingAccount['email'],
                        $recipientEmail,
                        $subject,
                        $htmlContent, // Store original content without tracking
                        true, // Mark as read since it's an outgoing email
                        false, // is_starred
                        false, // is_archived
                        $threadId,
                        $messageId
                    ]);
                }
            }

            return $result;

        } catch (Exception $e) {
            error_log('Email sending failed: ' . $e->getMessage());
            
            if ($recipientId) {
                // Mark as bounced if sending failed
                $stmt = $this->pdo->prepare('UPDATE recipients SET status = "bounced" WHERE id = ?');
                $stmt->execute([$recipientId]);

                // Update campaign bounce count
                if ($campaignId) {
                    $stmt = $this->pdo->prepare('UPDATE campaigns SET bounces = bounces + 1 WHERE id = ?');
                    $stmt->execute([$campaignId]);
                }
            }

            return false;
        }
    }

    /**
     * Add tracking pixel and modify links in email content
     */
    private function addTrackingToContent(string $htmlContent, int $recipientId = null, int $campaignId = null): string {
        if (!$recipientId) {
            return $htmlContent;
        }

        // Add tracking pixel for opens
        $trackingPixel = sprintf(
            '<img src="%s/api/track/open?rid=%d&cid=%d" width="1" height="1" style="display:none;" alt="" />',
            $this->baseUrl,
            $recipientId,
            $campaignId ?? 0
        );

        // Add tracking pixel before closing body tag, or at the end if no body tag
        if (stripos($htmlContent, '</body>') !== false) {
            $htmlContent = str_ireplace('</body>', $trackingPixel . '</body>', $htmlContent);
        } else {
            $htmlContent .= $trackingPixel;
        }

        // Modify all links to include click tracking
        $htmlContent = preg_replace_callback(
            '/<a\s+([^>]*?)href=["\']([^"\']+)["\']([^>]*?)>/i',
            function($matches) use ($recipientId, $campaignId) {
                $originalUrl = $matches[2];
                
                // Skip if it's already a tracking URL or an anchor link
                if (strpos($originalUrl, '/track/click') !== false || strpos($originalUrl, '#') === 0) {
                    return $matches[0];
                }

                // Create tracking URL
                $trackingUrl = sprintf(
                    '%s/api/track/click?rid=%d&cid=%d&url=%s',
                    $this->baseUrl,
                    $recipientId,
                    $campaignId ?? 0,
                    urlencode($originalUrl)
                );

                return sprintf('<a %shref="%s"%s>', $matches[1], $trackingUrl, $matches[3]);
            },
            $htmlContent
        );

        // Add unsubscribe link if not present
        if (stripos($htmlContent, 'unsubscribe') === false) {
            $unsubscribeUrl = sprintf(
                '%s/api/track/unsubscribe?rid=%d&cid=%d',
                $this->baseUrl,
                $recipientId,
                $campaignId ?? 0
            );

            $unsubscribeLink = sprintf(
                '<p style="font-size: 12px; color: #666; text-align: center; margin-top: 20px;">
                    <a href="%s" style="color: #666; text-decoration: underline;">Unsubscribe</a>
                </p>',
                $unsubscribeUrl
            );

            // Add unsubscribe link before closing body tag, or at the end
            if (stripos($htmlContent, '</body>') !== false) {
                $htmlContent = str_ireplace('</body>', $unsubscribeLink . '</body>', $htmlContent);
            } else {
                $htmlContent .= $unsubscribeLink;
            }
        }

        return $htmlContent;
    }

    /**
     * Send campaign emails to all pending recipients
     */
    public function sendCampaign(int $campaignId, int $userId): array {
        try {
            // Get campaign details
            $stmt = $this->pdo->prepare('SELECT * FROM campaigns WHERE id = ? AND user_id = ?');
            $stmt->execute([$campaignId, $userId]);
            $campaign = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$campaign) {
                throw new Exception('Campaign not found');
            }

            // Get sending account
            $stmt = $this->pdo->prepare('SELECT * FROM sending_accounts WHERE id = ? AND user_id = ?');
            $stmt->execute([$campaign['sending_account_id'], $userId]);
            $sendingAccount = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$sendingAccount || $sendingAccount['status'] !== 'active') {
                throw new Exception('Active sending account not found');
            }

            // Check daily limit
            if ($sendingAccount['sent_today'] >= $sendingAccount['daily_limit']) {
                throw new Exception('Daily sending limit reached');
            }

            // Get pending recipients
            $stmt = $this->pdo->prepare('SELECT * FROM recipients WHERE campaign_id = ? AND status = "pending" ORDER BY id');
            $stmt->execute([$campaignId]);
            $recipients = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $results = [
                'sent' => 0,
                'failed' => 0,
                'skipped' => 0,
                'errors' => []
            ];

            foreach ($recipients as $recipient) {
                // Check if we've hit the daily limit
                if ($sendingAccount['sent_today'] >= $sendingAccount['daily_limit']) {
                    $results['skipped']++;
                    continue;
                }

                $success = $this->sendEmail(
                    $sendingAccount,
                    $recipient['email'],
                    $campaign['subject'],
                    $campaign['html_content'],
                    $recipient['id'],
                    $campaignId
                );

                if ($success) {
                    $results['sent']++;
                    $sendingAccount['sent_today']++; // Update local counter
                } else {
                    $results['failed']++;
                    $results['errors'][] = "Failed to send to {$recipient['email']}";
                }

                // Add small delay to avoid overwhelming SMTP server
                usleep(100000); // 0.1 second delay
            }

            // Update campaign status
            if ($results['sent'] > 0) {
                $newStatus = ($results['skipped'] > 0 || $results['failed'] > 0) ? 'sending' : 'completed';
                $stmt = $this->pdo->prepare('UPDATE campaigns SET status = ? WHERE id = ?');
                $stmt->execute([$newStatus, $campaignId]);
            }

            return $results;

        } catch (Exception $e) {
            error_log('Campaign sending failed: ' . $e->getMessage());
            return [
                'sent' => 0,
                'failed' => 0,
                'skipped' => 0,
                'errors' => [$e->getMessage()]
            ];
        }
    }

    /**
     * Send sequence step email
     */
    public function sendSequenceStep(int $sequenceId, int $stepId, int $recipientId, int $userId): bool {
        try {
            // Get sequence step details
            $stmt = $this->pdo->prepare('
                SELECT ss.*, s.name as sequence_name 
                FROM sequence_steps ss 
                JOIN sequences s ON s.id = ss.sequence_id 
                WHERE ss.id = ? AND ss.sequence_id = ? AND s.user_id = ?
            ');
            $stmt->execute([$stepId, $sequenceId, $userId]);
            $step = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$step) {
                throw new Exception('Sequence step not found');
            }

            // Get recipient details
            $stmt = $this->pdo->prepare('SELECT * FROM recipients WHERE id = ?');
            $stmt->execute([$recipientId]);
            $recipient = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$recipient) {
                throw new Exception('Recipient not found');
            }

            // Get sending account (assuming first active account for now)
            $stmt = $this->pdo->prepare('SELECT * FROM sending_accounts WHERE user_id = ? AND status = "active" LIMIT 1');
            $stmt->execute([$userId]);
            $sendingAccount = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$sendingAccount) {
                throw new Exception('No active sending account found');
            }

            // Send the email
            return $this->sendEmail(
                $sendingAccount,
                $recipient['email'],
                $step['subject'],
                $step['content'],
                $recipientId,
                null // No campaign ID for sequence emails
            );

        } catch (Exception $e) {
            error_log('Sequence email sending failed: ' . $e->getMessage());
            return false;
        }
    }
}