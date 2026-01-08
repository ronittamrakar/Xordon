<?php

namespace Xordon\Services;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

/**
 * Email Service - Centralized email sending functionality
 * 
 * Handles all email sending throughout the application using PHPMailer
 * Supports SMTP configuration from environment variables
 */
class EmailService
{
    private $mailer;
    private $demoMode;

    public function __construct()
    {
        $this->mailer = new PHPMailer(true);
        $this->demoMode = $_ENV['DEMO_MODE'] ?? false;
        
        if (!$this->demoMode) {
            $this->configureSMTP();
        }
    }

    /**
     * Configure SMTP settings from environment variables
     */
    private function configureSMTP()
    {
        try {
            // Server settings
            $this->mailer->isSMTP();
            $this->mailer->Host = $_ENV['SMTP_HOST'] ?? 'smtp.gmail.com';
            $this->mailer->SMTPAuth = true;
            $this->mailer->Username = $_ENV['SMTP_USER'] ?? '';
            $this->mailer->Password = $_ENV['SMTP_PASS'] ?? '';
            $this->mailer->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $this->mailer->Port = $_ENV['SMTP_PORT'] ?? 587;
            
            // Default from address
            $defaultFrom = $_ENV['SMTP_FROM'] ?? 'noreply@xordon.com';
            $defaultName = $_ENV['SMTP_FROM_NAME'] ?? 'Xordon';
            $this->mailer->setFrom($defaultFrom, $defaultName);
            
            // Enable verbose debug output in development
            if (($_ENV['APP_ENV'] ?? 'production') === 'development') {
                $this->mailer->SMTPDebug = 0; // Set to 2 for detailed debugging
            }
        } catch (Exception $e) {
            error_log("Email configuration error: " . $e->getMessage());
        }
    }

    /**
     * Send an email
     *
     * @param string $to Recipient email address
     * @param string $subject Email subject
     * @param string $body Email body (HTML)
     * @param string|null $toName Recipient name (optional)
     * @param string|null $plainText Plain text version (optional)
     * @param array $attachments Array of file paths to attach (optional)
     * @return bool Success status
     */
    public function send(
        string $to,
        string $subject,
        string $body,
        ?string $toName = null,
        ?string $plainText = null,
        array $attachments = []
    ): bool {
        // Demo mode - just log and return success
        if ($this->demoMode) {
            error_log("DEMO MODE: Email would be sent to {$to} with subject: {$subject}");
            return true;
        }

        try {
            // Clear previous recipients
            $this->mailer->clearAddresses();
            $this->mailer->clearAttachments();
            
            // Recipients
            $this->mailer->addAddress($to, $toName ?? '');
            
            // Content
            $this->mailer->isHTML(true);
            $this->mailer->Subject = $subject;
            $this->mailer->Body = $body;
            
            if ($plainText) {
                $this->mailer->AltBody = $plainText;
            } else {
                // Generate plain text from HTML
                $this->mailer->AltBody = strip_tags($body);
            }
            
            // Attachments
            foreach ($attachments as $attachment) {
                if (file_exists($attachment)) {
                    $this->mailer->addAttachment($attachment);
                }
            }
            
            // Send
            $result = $this->mailer->send();
            
            if ($result) {
                error_log("Email sent successfully to {$to}");
            }
            
            return $result;
        } catch (Exception $e) {
            error_log("Email send error: " . $this->mailer->ErrorInfo);
            error_log("Exception: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send password reset email
     */
    public function sendPasswordReset(string $email, string $resetToken, string $userName = ''): bool
    {
        $resetLink = ($_ENV['APP_URL'] ?? 'http://localhost:8080') . "/reset-password?token={$resetToken}";
        
        $subject = "Password Reset Request";
        $body = "
            <html>
            <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <h2 style='color: #222;'>Password Reset Request</h2>
                    <p>Hello" . ($userName ? " {$userName}" : "") . ",</p>
                    <p>We received a request to reset your password. Click the button below to create a new password:</p>
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='{$resetLink}' style='background-color: #222; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;'>Reset Password</a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style='word-break: break-all; color: #666;'>{$resetLink}</p>
                    <p style='margin-top: 30px; color: #666; font-size: 14px;'>
                        This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
                    </p>
                    <hr style='border: none; border-top: 1px solid #eee; margin: 30px 0;'>
                    <p style='color: #999; font-size: 12px;'>
                        This is an automated message from Xordon. Please do not reply to this email.
                    </p>
                </div>
            </body>
            </html>
        ";
        
        return $this->send($email, $subject, $body, $userName);
    }

    /**
     * Send appointment confirmation email
     */
    public function sendAppointmentConfirmation(
        string $email,
        string $customerName,
        string $appointmentDate,
        string $appointmentTime,
        string $serviceName,
        ?string $staffName = null
    ): bool {
        $subject = "Appointment Confirmation - {$serviceName}";
        $body = "
            <html>
            <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <h2 style='color: #222;'>Appointment Confirmed</h2>
                    <p>Hello {$customerName},</p>
                    <p>Your appointment has been confirmed with the following details:</p>
                    <div style='background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;'>
                        <p style='margin: 5px 0;'><strong>Service:</strong> {$serviceName}</p>
                        <p style='margin: 5px 0;'><strong>Date:</strong> {$appointmentDate}</p>
                        <p style='margin: 5px 0;'><strong>Time:</strong> {$appointmentTime}</p>
                        " . ($staffName ? "<p style='margin: 5px 0;'><strong>With:</strong> {$staffName}</p>" : "") . "
                    </div>
                    <p>We look forward to seeing you!</p>
                    <p style='margin-top: 30px; color: #666; font-size: 14px;'>
                        If you need to reschedule or cancel, please contact us as soon as possible.
                    </p>
                    <hr style='border: none; border-top: 1px solid #eee; margin: 30px 0;'>
                    <p style='color: #999; font-size: 12px;'>
                        This is an automated message from Xordon.
                    </p>
                </div>
            </body>
            </html>
        ";
        
        return $this->send($email, $subject, $body, $customerName);
    }

    /**
     * Send appointment cancellation email
     */
    public function sendAppointmentCancellation(
        string $email,
        string $customerName,
        string $appointmentDate,
        string $appointmentTime,
        string $serviceName
    ): bool {
        $subject = "Appointment Cancelled - {$serviceName}";
        $body = "
            <html>
            <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <h2 style='color: #222;'>Appointment Cancelled</h2>
                    <p>Hello {$customerName},</p>
                    <p>Your appointment has been cancelled:</p>
                    <div style='background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;'>
                        <p style='margin: 5px 0;'><strong>Service:</strong> {$serviceName}</p>
                        <p style='margin: 5px 0;'><strong>Date:</strong> {$appointmentDate}</p>
                        <p style='margin: 5px 0;'><strong>Time:</strong> {$appointmentTime}</p>
                    </div>
                    <p>If you'd like to reschedule, please contact us or book a new appointment.</p>
                    <hr style='border: none; border-top: 1px solid #eee; margin: 30px 0;'>
                    <p style='color: #999; font-size: 12px;'>
                        This is an automated message from Xordon.
                    </p>
                </div>
            </body>
            </html>
        ";
        
        return $this->send($email, $subject, $body, $customerName);
    }

    /**
     * Send estimate notification email
     */
    public function sendEstimateNotification(
        string $email,
        string $customerName,
        string $estimateNumber,
        string $amount,
        string $viewLink
    ): bool {
        $subject = "New Estimate #{$estimateNumber}";
        $body = "
            <html>
            <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <h2 style='color: #222;'>New Estimate</h2>
                    <p>Hello {$customerName},</p>
                    <p>We've prepared an estimate for you:</p>
                    <div style='background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;'>
                        <p style='margin: 5px 0;'><strong>Estimate Number:</strong> #{$estimateNumber}</p>
                        <p style='margin: 5px 0;'><strong>Amount:</strong> {$amount}</p>
                    </div>
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='{$viewLink}' style='background-color: #222; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;'>View Estimate</a>
                    </div>
                    <p>If you have any questions, please don't hesitate to contact us.</p>
                    <hr style='border: none; border-top: 1px solid #eee; margin: 30px 0;'>
                    <p style='color: #999; font-size: 12px;'>
                        This is an automated message from Xordon.
                    </p>
                </div>
            </body>
            </html>
        ";
        
        return $this->send($email, $subject, $body, $customerName);
    }

    /**
     * Send review request email/SMS
     */
    public function sendReviewRequest(
        string $email,
        string $customerName,
        string $reviewLink,
        string $businessName
    ): bool {
        $subject = "We'd love your feedback!";
        $body = "
            <html>
            <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <h2 style='color: #222;'>How was your experience?</h2>
                    <p>Hello {$customerName},</p>
                    <p>Thank you for choosing {$businessName}! We'd love to hear about your experience.</p>
                    <p>Your feedback helps us improve and helps others make informed decisions.</p>
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='{$reviewLink}' style='background-color: #222; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;'>Leave a Review</a>
                    </div>
                    <p style='text-align: center; color: #666;'>It only takes a minute!</p>
                    <hr style='border: none; border-top: 1px solid #eee; margin: 30px 0;'>
                    <p style='color: #999; font-size: 12px; text-align: center;'>
                        This is an automated message from {$businessName}.
                    </p>
                </div>
            </body>
            </html>
        ";
        
        return $this->send($email, $subject, $body, $customerName);
    }

    /**
     * Send generic notification email
     */
    public function sendNotification(
        string $email,
        string $subject,
        string $message,
        ?string $recipientName = null,
        ?string $actionLink = null,
        ?string $actionText = null
    ): bool {
        $body = "
            <html>
            <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <h2 style='color: #222;'>{$subject}</h2>
                    " . ($recipientName ? "<p>Hello {$recipientName},</p>" : "") . "
                    <div style='margin: 20px 0;'>
                        {$message}
                    </div>
                    " . ($actionLink && $actionText ? "
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='{$actionLink}' style='background-color: #222; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;'>{$actionText}</a>
                    </div>
                    " : "") . "
                    <hr style='border: none; border-top: 1px solid #eee; margin: 30px 0;'>
                    <p style='color: #999; font-size: 12px;'>
                        This is an automated message from Xordon.
                    </p>
                </div>
            </body>
            </html>
        ";
        
        return $this->send($email, $subject, $body, $recipientName);
    }
}
