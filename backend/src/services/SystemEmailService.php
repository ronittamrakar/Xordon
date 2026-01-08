<?php
/**
 * System Email Service
 * Handles transactional emails (invitations, password resets, etc.)
 * Uses PHPMailer for SMTP or falls back to PHP mail()
 */

require_once __DIR__ . '/../Database.php';

class SystemEmailService {
    private $pdo;
    private $appUrl;
    private $appName;
    private $fromEmail;
    private $fromName;
    private $smtpHost;
    private $smtpPort;
    private $smtpUser;
    private $smtpPass;
    private $smtpEncryption;

    public function __construct() {
        $this->pdo = Database::conn();
        $this->appUrl = $_ENV['APP_URL'] ?? 'http://localhost:5173';
        $this->appName = $_ENV['APP_NAME'] ?? 'Xordon';
        $this->fromEmail = $_ENV['MAIL_FROM_ADDRESS'] ?? 'noreply@xordon.com';
        $this->fromName = $_ENV['MAIL_FROM_NAME'] ?? 'Xordon';
        
        // SMTP config (optional)
        $this->smtpHost = $_ENV['SMTP_HOST'] ?? null;
        $this->smtpPort = (int)($_ENV['SMTP_PORT'] ?? 587);
        $this->smtpUser = $_ENV['SMTP_USERNAME'] ?? null;
        $this->smtpPass = $_ENV['SMTP_PASSWORD'] ?? null;
        $this->smtpEncryption = $_ENV['SMTP_ENCRYPTION'] ?? 'tls';
    }

    /**
     * Send an agency invitation email
     */
    public function sendAgencyInvite(string $toEmail, string $agencyName, string $role, string $token): bool {
        $inviteUrl = "{$this->appUrl}/invite/accept?token={$token}";
        
        $subject = "You're Invited to Join {$agencyName}";
        
        $html = $this->wrapInTemplate("
            <h1 style='margin: 0 0 20px 0; font-size: 24px; color: #111827;'>You're Invited!</h1>
            <p style='margin: 0 0 15px 0; color: #374151;'>
                You have been invited to join <strong>{$agencyName}</strong> as a <strong>{$role}</strong>.
            </p>
            <p style='margin: 0 0 25px 0; color: #374151;'>
                Click the button below to accept the invitation and set up your account:
            </p>
            <div style='text-align: center; margin: 30px 0;'>
                <a href='{$inviteUrl}' style='display: inline-block; padding: 14px 28px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;'>
                    Accept Invitation
                </a>
            </div>
            <p style='margin: 0 0 10px 0; color: #6b7280; font-size: 14px;'>
                Or copy this link: <br/>
                <a href='{$inviteUrl}' style='color: #6366f1; word-break: break-all;'>{$inviteUrl}</a>
            </p>
            <p style='margin: 25px 0 0 0; color: #9ca3af; font-size: 13px;'>
                This invitation will expire in 7 days.
            </p>
        ");

        return $this->send($toEmail, $subject, $html);
    }

    /**
     * Send a subaccount client invitation email
     */
    public function sendSubaccountClientInvite(string $toEmail, string $subaccountName, string $agencyName, string $token): bool {
        $inviteUrl = "{$this->appUrl}/invite/accept?token={$token}";
        
        $subject = "Access Your Dashboard on {$agencyName}";
        
        $html = $this->wrapInTemplate("
            <h1 style='margin: 0 0 20px 0; font-size: 24px; color: #111827;'>Welcome!</h1>
            <p style='margin: 0 0 15px 0; color: #374151;'>
                <strong>{$agencyName}</strong> has set up a client portal for <strong>{$subaccountName}</strong>.
            </p>
            <p style='margin: 0 0 25px 0; color: #374151;'>
                Click the button below to access your dashboard and view reports:
            </p>
            <div style='text-align: center; margin: 30px 0;'>
                <a href='{$inviteUrl}' style='display: inline-block; padding: 14px 28px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;'>
                    Access Dashboard
                </a>
            </div>
            <p style='margin: 0 0 10px 0; color: #6b7280; font-size: 14px;'>
                Or copy this link: <br/>
                <a href='{$inviteUrl}' style='color: #6366f1; word-break: break-all;'>{$inviteUrl}</a>
            </p>
        ");

        return $this->send($toEmail, $subject, $html);
    }

    /**
     * Send an e-signature request email
     */
    public function sendSignatureRequest(string $toEmail, string $signerName, string $documentTitle, string $message, string $token): bool {
        $signUrl = "{$this->appUrl}/sign/{$token}";
        
        $subject = "Signature Requested: {$documentTitle}";
        
        $messageHtml = !empty($message) ? "<p style='margin: 0 0 20px 0; color: #4b5563; font-style: italic; border-left: 4px solid #e5e7eb; padding-left: 15px;'>\"{$message}\"</p>" : "";

        $html = $this->wrapInTemplate("
            <h1 style='margin: 0 0 20px 0; font-size: 24px; color: #111827;'>Signature Requested</h1>
            <p style='margin: 0 0 15px 0; color: #374151;'>
                Hello <strong>{$signerName}</strong>,
            </p>
            <p style='margin: 0 0 15px 0; color: #374151;'>
                You have been requested to review and sign the following document:
            </p>
            <div style='margin: 20px 0; padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;'>
                <strong style='font-size: 18px; color: #111827;'>{$documentTitle}</strong>
            </div>
            {$messageHtml}
            <p style='margin: 0 0 25px 0; color: #374151;'>
                Click the button below to view and securely sign the document:
            </p>
            <div style='text-align: center; margin: 30px 0;'>
                <a href='{$signUrl}' style='display: inline-block; padding: 14px 28px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;'>
                    Review & Sign
                </a>
            </div>
            <p style='margin: 0 0 10px 0; color: #6b7280; font-size: 14px;'>
                Or copy this link: <br/>
                <a href='{$signUrl}' style='color: #6366f1; word-break: break-all;'>{$signUrl}</a>
            </p>
        ");

        return $this->send($toEmail, $subject, $html);
    }

    /**
     * Send an estimate notification email (view only)
     */
    public function sendEstimateNotification(string $toEmail, string $clientName, string $estimateNumber, float $total, string $currency): bool {
        $subject = "New Estimate: {$estimateNumber}";
        
        $html = $this->wrapInTemplate("
            <h1 style='margin: 0 0 20px 0; font-size: 24px; color: #111827;'>New Estimate Received</h1>
            <p style='margin: 0 0 15px 0; color: #374151;'>
                Hello <strong>{$clientName}</strong>,
            </p>
            <p style='margin: 0 0 15px 0; color: #374151;'>
                You have received a new estimate <strong>{$estimateNumber}</strong> for the total amount of:
            </p>
            <div style='margin: 20px 0; padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; text-align: center;'>
                <strong style='font-size: 24px; color: #111827;'>" . number_format($total, 2) . " {$currency}</strong>
            </div>
            <p style='margin: 0 0 25px 0; color: #374151;'>
                Please contact us if you have any questions or would like to proceed with this estimate.
            </p>
        ");

        return $this->send($toEmail, $subject, $html);
    }



    /**
     * Core send method
     */
    private function send(string $to, string $subject, string $htmlContent): bool {
        // Check if demo mode
        if (getenv('DEMO_MODE') === 'true' || getenv('DEMO_MODE') === '1') {
            error_log("DEMO MODE: Would send email to {$to} with subject: {$subject}");
            return true;
        }

        // Try SMTP if configured
        if ($this->smtpHost && $this->smtpUser && $this->smtpPass) {
            return $this->sendViaSMTP($to, $subject, $htmlContent);
        }

        // Fallback to PHP mail()
        return $this->sendViaMail($to, $subject, $htmlContent);
    }

    /**
     * Send via SMTP using PHPMailer
     */
    private function sendViaSMTP(string $to, string $subject, string $html): bool {
        $phpmailerPath = __DIR__ . '/../../vendor/phpmailer/src/PHPMailer.php';
        if (!file_exists($phpmailerPath)) {
            error_log("PHPMailer not found, falling back to mail()");
            return $this->sendViaMail($to, $subject, $html);
        }

        require_once $phpmailerPath;
        require_once __DIR__ . '/../../vendor/phpmailer/src/SMTP.php';
        require_once __DIR__ . '/../../vendor/phpmailer/src/Exception.php';

        try {
            $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = $this->smtpHost;
            $mail->SMTPAuth = true;
            $mail->Username = $this->smtpUser;
            $mail->Password = $this->smtpPass;
            $mail->SMTPSecure = $this->smtpEncryption === 'ssl' 
                ? \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS 
                : \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = $this->smtpPort;

            $mail->setFrom($this->fromEmail, $this->fromName);
            $mail->addAddress($to);
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $html;

            return $mail->send();
        } catch (Exception $e) {
            error_log("SMTP send failed: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send via PHP mail()
     */
    private function sendViaMail(string $to, string $subject, string $html): bool {
        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=UTF-8',
            "From: \"{$this->fromName}\" <{$this->fromEmail}>",
            "Reply-To: {$this->fromEmail}",
        ];

        return mail($to, $subject, $html, implode("\r\n", $headers));
    }

    /**
     * Wrap content in a nice email template
     */
    private function wrapInTemplate(string $content): string {
        return "
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>{$this->appName}</title>
</head>
<body style='margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Arial, sans-serif; background-color: #f3f4f6;'>
    <table role='presentation' width='100%' cellspacing='0' cellpadding='0' style='background-color: #f3f4f6;'>
        <tr>
            <td align='center' style='padding: 40px 20px;'>
                <table role='presentation' width='100%' cellspacing='0' cellpadding='0' style='max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);'>
                    <!-- Header -->
                    <tr>
                        <td style='padding: 30px 40px; border-bottom: 1px solid #e5e7eb;'>
                            <h2 style='margin: 0; font-size: 20px; font-weight: 700; color: #6366f1;'>{$this->appName}</h2>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style='padding: 40px;'>
                            {$content}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style='padding: 20px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;'>
                            <p style='margin: 0; font-size: 13px; color: #9ca3af; text-align: center;'>
                                &copy; " . date('Y') . " {$this->appName}. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
    }
}
