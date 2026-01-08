<?php

require_once __DIR__ . '/../Database.php';

class SimpleMail {
    private $pdo;
    private $baseUrl;

    public function __construct() {
        $this->pdo = Database::conn();
        $this->baseUrl = $_ENV['APP_URL'] ?? 'http://localhost:9000';
    }

    /**
     * Send email using SMTP with PHPMailer
     */
    public function sendEmail(array $sendingAccount, string $recipientEmail, string $subject, string $htmlContent, int $recipientId = null, int $campaignId = null): bool {
        // Check if demo mode is enabled
        if (getenv('DEMO_MODE') === 'true' || getenv('DEMO_MODE') === '1') {
            return $this->sendEmailDemo($sendingAccount, $recipientEmail, $subject, $htmlContent, $recipientId, $campaignId);
        }
        
        // Check if SMTP is configured for this account
        if (!empty($sendingAccount['smtp_host']) && !empty($sendingAccount['smtp_password'])) {
            return $this->sendEmailSMTP($sendingAccount, $recipientEmail, $subject, $htmlContent, $recipientId, $campaignId);
        }
        
        // Fallback to PHP mail() function
        return $this->sendEmailPHP($sendingAccount, $recipientEmail, $subject, $htmlContent, $recipientId, $campaignId);
    }

    /**
     * Simulate email sending for demo mode
     */
    private function sendEmailDemo(array $sendingAccount, string $recipientEmail, string $subject, string $htmlContent, int $recipientId = null, int $campaignId = null): bool {
        try {
            // Log the simulated email
            error_log("DEMO MODE: Simulated email sent to {$recipientEmail} with subject: {$subject}");
            
            // Add small delay to simulate real sending
            usleep(100000); // 0.1 second delay
            
            if ($recipientId) {
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
                    // Generate unique message ID and thread ID for threading
                    $messageId = '<' . uniqid() . '@' . parse_url($this->baseUrl, PHP_URL_HOST) . '>';
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

            return true;

        } catch (Exception $e) {
            error_log('Demo email simulation failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send email using SMTP with PHPMailer
     */
    private function sendEmailSMTP(array $sendingAccount, string $recipientEmail, string $subject, string $htmlContent, int $recipientId = null, int $campaignId = null): bool {
        require_once __DIR__ . '/../../vendor/phpmailer/src/PHPMailer.php';
        require_once __DIR__ . '/../../vendor/phpmailer/src/SMTP.php';
        require_once __DIR__ . '/../../vendor/phpmailer/src/Exception.php';

        try {
            $mail = new \PHPMailer\PHPMailer\PHPMailer(true);

            // Server settings
            $mail->isSMTP();
            $mail->Host = $sendingAccount['smtp_host'];
            $mail->SMTPAuth = true;
            $mail->Username = $sendingAccount['smtp_username'] ?? $sendingAccount['email'];
            $mail->Password = $sendingAccount['smtp_password'];
            $mail->SMTPSecure = $sendingAccount['smtp_encryption'] ?? \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = $sendingAccount['smtp_port'] ?? 587;

            // Recipients - Clean up sender name to avoid email duplication
            $senderName = $sendingAccount['name'] ?? '';
            // Remove email address from sender name if it's included
            $senderName = preg_replace('/\s*-?\s*' . preg_quote($sendingAccount['email'], '/') . '\s*$/', '', $senderName);
            // Remove common prefixes like "Gmail SMTP", "SMTP", etc.
            $senderName = preg_replace('/^(Gmail\s+SMTP|SMTP|Gmail)\s*-?\s*/i', '', $senderName);
            // If name is empty after cleanup, use a default professional name
            if (empty(trim($senderName))) {
                $senderName = 'Xordon';
            }
            $mail->setFrom($sendingAccount['email'], trim($senderName));
            $mail->addAddress($recipientEmail);

            // Content
            $mail->isHTML(true);
            $mail->Subject = $subject;
            
            // Generate unique message ID for threading
            $messageId = '<' . uniqid() . '@' . parse_url($this->baseUrl, PHP_URL_HOST) . '>';
            $mail->MessageID = $messageId;
            
            // Add tracking to email content
            $userId = $sendingAccount['user_id'] ?? null;
            $trackedContent = $this->addTrackingToContent($htmlContent, $recipientId, $campaignId, $userId);
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
            $errorMsg = "SMTP Email sending failed to {$recipientEmail}: " . $e->getMessage();
            error_log($errorMsg);
            
            // Log more specific error details
            if (strpos($e->getMessage(), 'authenticate') !== false) {
                error_log("SMTP Authentication failed for account: {$sendingAccount['email']} on host: {$sendingAccount['smtp_host']}");
            } elseif (strpos($e->getMessage(), 'connect') !== false) {
                error_log("SMTP Connection failed to host: {$sendingAccount['smtp_host']}:{$sendingAccount['smtp_port']}");
            }
            
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
     * Send email using PHP's mail() function with tracking (fallback)
     */
    private function sendEmailPHP(array $sendingAccount, string $recipientEmail, string $subject, string $htmlContent, int $recipientId = null, int $campaignId = null): bool {
        try {
            // Add tracking to email content
            $userId = $sendingAccount['user_id'] ?? null;
            $trackedContent = $this->addTrackingToContent($htmlContent, $recipientId, $campaignId, $userId);
            
            // Clean up sender name to avoid email duplication
            $senderName = $sendingAccount['name'] ?? '';
            // Remove email address from sender name if it's included
            $senderName = preg_replace('/\s*-?\s*' . preg_quote($sendingAccount['email'], '/') . '\s*$/', '', $senderName);
            // Remove common prefixes like "Gmail SMTP", "SMTP", etc.
            $senderName = preg_replace('/^(Gmail\s+SMTP|SMTP|Gmail)\s*-?\s*/i', '', $senderName);
            // If name is empty after cleanup, use a default professional name
            if (empty(trim($senderName))) {
                $senderName = 'Xordon';
            }
            
            // Set headers for HTML email
            $fromHeader = !empty(trim($senderName)) ? '"' . trim($senderName) . '" <' . $sendingAccount['email'] . '>' : $sendingAccount['email'];
            $headers = [
                'MIME-Version: 1.0',
                'Content-type: text/html; charset=UTF-8',
                'From: ' . $fromHeader,
                'Reply-To: ' . $sendingAccount['email'],
                'X-Mailer: PHP/' . phpversion()
            ];

            // Send the email
            $result = mail($recipientEmail, $subject, $trackedContent, implode("\r\n", $headers));

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
     * Get user settings from database
     */
    private function getUserSettings(int $userId): array {
        $stmt = $this->pdo->prepare('SELECT data FROM settings WHERE user_id = ?');
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($row) {
            return json_decode($row['data'], true) ?? [];
        }
        
        return [];
    }

    /**
     * Replace template variables in text
     */
    private function replaceTemplateVariables(string $text, array $variables): string {
        foreach ($variables as $key => $value) {
            $text = str_replace('{{' . $key . '}}', $value, $text);
            $text = str_replace('{' . $key . '}', $value, $text);
        }
        return $text;
    }

    /**
     * Get template variables for a specific recipient
     */
    private function getTemplateVariables(int $recipientId = null, int $campaignId = null, int $userId = null): array {
        // Get user information
        $userInfo = [];
        if ($userId) {
            $stmt = $this->pdo->prepare('SELECT name, email FROM users WHERE id = ?');
            $stmt->execute([$userId]);
            $userInfo = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
        }

        // Get sender information (from sending account)
        $senderInfo = [];
        if ($campaignId) {
            $stmt = $this->pdo->prepare('SELECT sa.name, sa.email FROM sending_accounts sa JOIN campaigns c ON sa.id = c.sending_account_id WHERE c.id = ?');
            $stmt->execute([$campaignId]);
            $senderInfo = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
        }

        // Get campaign information
        $campaignInfo = [];
        if ($campaignId) {
            $stmt = $this->pdo->prepare('SELECT name, subject, created_at FROM campaigns WHERE id = ?');
            $stmt->execute([$campaignId]);
            $campaignInfo = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
        }
        
        // Get recipient information if available
        $recipientInfo = [];
        $customFields = [];
        if ($recipientId) {
            $stmt = $this->pdo->prepare('SELECT name, email, company, custom_fields FROM recipients WHERE id = ?');
            $stmt->execute([$recipientId]);
            $recipientInfo = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
            
            // Parse custom fields if they exist
            if (!empty($recipientInfo['custom_fields'])) {
                $customFieldsData = json_decode($recipientInfo['custom_fields'], true);
                if (is_array($customFieldsData)) {
                    $customFields = $customFieldsData;
                }
            }
        }
        
        // Parse recipient name for legacy variables
        $recipientName = $recipientInfo['name'] ?? 'Valued Customer';
        $nameParts = explode(' ', trim($recipientName), 2);
        $firstName = $nameParts[0] ?? '';
        $lastName = $nameParts[1] ?? '';
        
        // Prepare comprehensive template variables
        $templateVars = [
            // Company/Sender variables
            'company_name' => $userInfo['name'] ?? 'Your Company',
            'company_email' => $userInfo['email'] ?? 'contact@yourcompany.com',
            'sender_name' => $senderInfo['name'] ?? 'Your Team',
            'sender_email' => $senderInfo['email'] ?? 'noreply@example.com',
            
            // Campaign variables
            'campaign_name' => $campaignInfo['name'] ?? 'Newsletter',
            'campaign_subject' => $campaignInfo['subject'] ?? 'Important Update',
            
            // Recipient variables (new format)
            'recipient_name' => $recipientName,
            'recipient_email' => $recipientInfo['email'] ?? '',
            'recipient_company' => $recipientInfo['company'] ?? '',
            
            // Legacy recipient variables (for backward compatibility)
            'firstName' => $firstName,
            'lastName' => $lastName,
            'name' => $recipientName,
            'email' => $recipientInfo['email'] ?? '',
            'company' => $recipientInfo['company'] ?? '',
            
            // Date/Time variables
            'current_date' => date('F j, Y'),
            'current_year' => date('Y'),
            'current_month' => date('F'),
            'current_day' => date('j'),
            
            // Tracking variables (new format)
            'unsubscribe_url' => sprintf('%s/api/track/unsubscribe?rid=%d&cid=%d', $this->baseUrl, $recipientId, $campaignId ?? 0),
            'campaign_id' => $campaignId ?? 0,
            'recipient_id' => $recipientId ?? 0,
            
            // Legacy tracking variables (for backward compatibility)
            'unsubscribeUrl' => sprintf('%s/api/track/unsubscribe?rid=%d&cid=%d', $this->baseUrl, $recipientId, $campaignId ?? 0)
        ];
        
        // Add custom fields to template variables
        foreach ($customFields as $key => $value) {
            // Prefix custom fields to avoid conflicts with standard variables
            $templateVars['custom_' . $key] = $value;
            // Also add without prefix for backward compatibility
            $templateVars[$key] = $value;
        }

        return $templateVars;
    }

    /**
     * Add tracking pixel and modify links in email content
     */
    private function addTrackingToContent(string $htmlContent, int $recipientId = null, int $campaignId = null, int $userId = null): string {
        // Get user tracking settings
        $userSettings = $this->getUserSettings($userId);
        $openTrackingEnabled = $userSettings['open_tracking_enabled'] ?? true;
        $clickTrackingEnabled = $userSettings['click_tracking_enabled'] ?? true;
        if (!$recipientId) {
            return $this->wrapInEmailTemplate($htmlContent);
        }

        // Get recipient track token for anonymous tracking
        $trackToken = $this->getRecipientTrackToken($recipientId);
        if (!$trackToken) {
            return $this->wrapInEmailTemplate($htmlContent);
        }

        $trackingPixel = '';
        
        // Add tracking pixel for opens if enabled
        if ($openTrackingEnabled) {
            $trackingPixel = sprintf(
                '<img src="%s/api/track/open?token=%s&cid=%d" width="1" height="1" style="display:none;" alt="" />',
                $this->baseUrl,
                $trackToken,
                $campaignId ?? 0
            );
        }

        // Modify all links to include click tracking if enabled
        if ($clickTrackingEnabled) {
            $htmlContent = preg_replace_callback(
                '/<a\s+([^>]*?)href=["\']([^"\']+)["\']([^>]*?)>/i',
                function($matches) use ($trackToken, $campaignId) {
                    $originalUrl = $matches[2];
                    
                    // Skip if it's already a tracking URL, an anchor link, or mailto
                    if (strpos($originalUrl, '/track/click') !== false || 
                        strpos($originalUrl, '#') === 0 || 
                        strpos($originalUrl, 'mailto:') === 0) {
                        return $matches[0];
                    }

                    // Create tracking URL
                    $trackingUrl = sprintf(
                        '%s/api/track/click?token=%s&cid=%d&url=%s',
                        $this->baseUrl,
                        $trackToken,
                        $campaignId ?? 0,
                        urlencode($originalUrl)
                    );

                    return sprintf('<a %shref="%s"%s>', $matches[1], $trackingUrl, $matches[3]);
                },
                $htmlContent
            );
        }

        // Get user settings for footer
        $userSettings = [];
        $footerHtml = '';
        
        if ($userId) {
            $userSettings = $this->getUserSettings($userId);
            
            // Get template variables for this recipient
            $templateVars = $this->getTemplateVariables($recipientId, $campaignId, $userId);
            
            // Get footer text from settings
            $footerText = $userSettings['footerText'] ?? 'This email was sent by {company_name}. You received this email because you signed up for our newsletter.';
            $footerText = $this->replaceTemplateVariables($footerText, $templateVars);
            
            // Create footer HTML
            $footerHtml = sprintf(
                '<div style="margin-top: 40px; padding: 20px 0; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; text-align: center; line-height: 1.5;">
                    <p style="margin: 0 0 15px 0;">%s</p>
                </div>',
                htmlspecialchars($footerText)
            );
        }

        // Add unsubscribe link if not present
        $unsubscribeUrl = sprintf(
            '%s/api/track/unsubscribe?rid=%d&cid=%d',
            $this->baseUrl,
            $recipientId,
            $campaignId ?? 0
        );

        $unsubscribeText = $userSettings['unsubscribeText'] ?? 'If you no longer wish to receive these emails, you can unsubscribe here.';
        $unsubscribeText = $this->replaceTemplateVariables($unsubscribeText, $templateVars);
        
        $unsubscribeLink = sprintf(
            '<p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0; line-height: 1.4;">
                %s <a href="%s" style="color: #6366f1; text-decoration: underline;">Unsubscribe</a>
            </p>',
            htmlspecialchars($unsubscribeText),
            $unsubscribeUrl
        );

        // Combine footer and unsubscribe
        $emailFooter = $footerHtml . $unsubscribeLink;

        // Wrap content in professional email template
        $wrappedContent = $this->wrapInEmailTemplate($htmlContent, $emailFooter, $trackingPixel);

        return $wrappedContent;
    }

    /**
     * Wrap content in a professional email template with proper HTML structure
     */
    private function wrapInEmailTemplate(string $content, string $footer = '', string $trackingPixel = ''): string {
        // Check if content already has full HTML structure
        if (stripos($content, '<html') !== false && stripos($content, '<body') !== false) {
            // Content already has HTML structure, just add footer and tracking if provided
            if ($footer) {
                $content = str_ireplace('</body>', $footer . '</body>', $content);
            }
            if ($trackingPixel) {
                $content = str_ireplace('</body>', $trackingPixel . '</body>', $content);
            }
            return $content;
        }

        // Wrap content in professional email template
        return sprintf('
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #374151;
            background-color: #f9fafb;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }
        .email-content {
            padding: 40px 30px;
        }
        .email-content p {
            margin: 0 0 16px 0;
            line-height: 1.6;
        }
        .email-content h1, .email-content h2, .email-content h3 {
            margin: 0 0 20px 0;
            line-height: 1.3;
            color: #111827;
        }
        .email-content h1 {
            font-size: 28px;
            font-weight: 700;
        }
        .email-content h2 {
            font-size: 24px;
            font-weight: 600;
        }
        .email-content h3 {
            font-size: 20px;
            font-weight: 600;
        }
        .email-content a {
            color: #6366f1;
            text-decoration: underline;
        }
        .email-content a:hover {
            color: #4f46e5;
        }
        .email-content ul, .email-content ol {
            margin: 0 0 16px 0;
            padding-left: 20px;
        }
        .email-content li {
            margin-bottom: 8px;
        }
        .email-content blockquote {
            margin: 20px 0;
            padding: 15px 20px;
            background-color: #f3f4f6;
            border-left: 4px solid #6366f1;
            font-style: italic;
        }
        .email-content img {
            max-width: 100%%;
            height: auto;
            display: block;
            margin: 20px 0;
        }
        .email-content table {
            width: 100%%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .email-content th, .email-content td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        .email-content th {
            background-color: #f9fafb;
            font-weight: 600;
        }
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100%% !important;
                margin: 0 !important;
            }
            .email-content {
                padding: 30px 20px !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-content">
            %s
        </div>
        %s
    </div>
    %s
</body>
</html>', $content, $footer, $trackingPixel);
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
            $stmt = $this->pdo->prepare('SELECT * FROM recipients WHERE campaign_id = ? AND status = "pending" ORDER BY id LIMIT 10');
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

                // Get template variables for this recipient
                $templateVars = $this->getTemplateVariables($recipient['id'], $campaignId, $userId);
                
                // Process template variables in subject and content
                $personalizedSubject = $this->replaceTemplateVariables($campaign['subject'], $templateVars);
                $personalizedContent = $this->replaceTemplateVariables($campaign['html_content'], $templateVars);

                $success = $this->sendEmail(
                    $sendingAccount,
                    $recipient['email'],
                    $personalizedSubject,
                    $personalizedContent,
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

                // Add small delay to avoid overwhelming mail server
                usleep(500000); // 0.5 second delay
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
     * Get recipient track token for anonymous tracking
     */
    private function getRecipientTrackToken(int $recipientId): ?string {
        try {
            $stmt = $this->pdo->prepare('SELECT track_token FROM recipients WHERE id = ?');
            $stmt->execute([$recipientId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $result['track_token'] ?? null;
        } catch (Exception $e) {
            error_log('Failed to get recipient track token: ' . $e->getMessage());
            return null;
        }
    }
}