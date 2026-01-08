<?php
/**
 * Lead Marketplace Notification Service
 * Handles email/SMS notifications for lead lifecycle events
 */

namespace App\Services;

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/NotificationSender.php';

use PDO;
use NotificationSender;

class LeadNotificationService
{
    /**
     * Notify provider about a new lead match
     */
    public static function notifyNewLead(int $matchId): void
    {
        $conn = \Xordon\Database::conn();
        
        // Get match details with lead and provider info
        $stmt = $conn->prepare("
            SELECT 
                lm.*,
                lr.title as lead_title,
                lr.description as lead_description,
                lr.city,
                lr.region,
                lr.timing,
                lr.budget_min,
                lr.budget_max,
                sp.contact_email,
                sp.contact_phone,
                sp.contact_name,
                sp.business_name,
                pp.notify_email,
                pp.notify_sms,
                pp.notify_push,
                (SELECT GROUP_CONCAT(sc.name SEPARATOR ', ') 
                 FROM lead_request_services lrs 
                 JOIN service_catalog sc ON sc.id = lrs.service_id 
                 WHERE lrs.lead_request_id = lr.id) as service_names
            FROM lead_matches lm
            JOIN lead_requests lr ON lr.id = lm.lead_request_id
            JOIN service_pros sp ON sp.company_id = lm.company_id AND sp.workspace_id = lm.workspace_id
            LEFT JOIN pro_preferences pp ON pp.company_id = lm.company_id AND pp.workspace_id = lm.workspace_id
            WHERE lm.id = ?
        ");
        $stmt->execute([$matchId]);
        $match = $stmt->fetch();
        
        if (!$match) return;

        $subject = "New Lead: " . ($match['lead_title'] ?: $match['service_names'] ?: 'Service Request');
        $location = trim(($match['city'] ?: '') . ($match['region'] ? ', ' . $match['region'] : ''));
        
        $emailBody = "
            <h2>You have a new lead!</h2>
            <p><strong>Services:</strong> {$match['service_names']}</p>
            " . ($location ? "<p><strong>Location:</strong> $location</p>" : "") . "
            " . ($match['timing'] ? "<p><strong>Timeline:</strong> {$match['timing']}</p>" : "") . "
            " . ($match['budget_max'] ? "<p><strong>Budget:</strong> \${$match['budget_min']} - \${$match['budget_max']}</p>" : "") . "
            " . ($match['lead_description'] ? "<p><strong>Details:</strong> {$match['lead_description']}</p>" : "") . "
            <p><strong>Lead Cost:</strong> \${$match['lead_price']}</p>
            <p>This lead expires in 24 hours. Log in to accept or decline.</p>
            <p><a href='" . getenv('APP_URL') . "/lead-marketplace/leads/{$match['id']}' style='background:#f97316;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;'>View Lead</a></p>
        ";

        $smsBody = "New lead: {$match['service_names']}" . ($location ? " in $location" : "") . ". Cost: \${$match['lead_price']}. Log in to view.";

        $notifyEmail = ($match['notify_email'] === null) ? true : (bool)$match['notify_email'];
        $notifySms = ($match['notify_sms'] === null) ? true : (bool)$match['notify_sms'];
        $notifyPush = ($match['notify_push'] === null) ? true : (bool)$match['notify_push'];

        // Send email notification
        if ($notifyEmail && $match['contact_email']) {
            try {
                NotificationSender::sendEmail(
                    $match['contact_email'],
                    $subject,
                    $emailBody,
                    $match['contact_name'] ?: $match['business_name']
                );
                self::logNotification($match['workspace_id'], $matchId, 'email', 'new_lead', 'sent');
            } catch (\Exception $e) {
                self::logNotification($match['workspace_id'], $matchId, 'email', 'new_lead', 'failed', $e->getMessage());
            }
        }

        // Send SMS notification
        if ($notifySms && $match['contact_phone']) {
            try {
                NotificationSender::sendSMS($match['contact_phone'], $smsBody);
                self::logNotification($match['workspace_id'], $matchId, 'sms', 'new_lead', 'sent');
            } catch (\Exception $e) {
                self::logNotification($match['workspace_id'], $matchId, 'sms', 'new_lead', 'failed', $e->getMessage());
            }
        }
    }

    /**
     * Notify provider that a lead is expiring soon
     */
    public static function notifyLeadExpiring(int $matchId): void
    {
        $conn = \Xordon\Database::conn();
        
        $stmt = $conn->prepare("
            SELECT 
                lm.*,
                lr.title as lead_title,
                sp.contact_email,
                sp.contact_name,
                pp.notify_email,
                (SELECT GROUP_CONCAT(sc.name SEPARATOR ', ') 
                 FROM lead_request_services lrs 
                 JOIN service_catalog sc ON sc.id = lrs.service_id 
                 WHERE lrs.lead_request_id = lr.id) as service_names
            FROM lead_matches lm
            JOIN lead_requests lr ON lr.id = lm.lead_request_id
            JOIN service_pros sp ON sp.company_id = lm.company_id AND sp.workspace_id = lm.workspace_id
            LEFT JOIN pro_preferences pp ON pp.company_id = lm.company_id AND pp.workspace_id = lm.workspace_id
            WHERE lm.id = ? AND lm.status IN ('offered', 'viewed')
        ");
        $stmt->execute([$matchId]);
        $match = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $notifyEmail = ($match && array_key_exists('notify_email', $match) && $match['notify_email'] !== null) ? (bool)$match['notify_email'] : true;
        if (!$match || !$notifyEmail || !$match['contact_email']) return;

        $subject = "Lead Expiring Soon: " . ($match['lead_title'] ?: $match['service_names']);
        $emailBody = "
            <h2>Your lead is expiring soon!</h2>
            <p>The lead for <strong>{$match['service_names']}</strong> will expire in 2 hours.</p>
            <p>Don't miss out - accept this lead before it's gone!</p>
            <p><a href='" . getenv('APP_URL') . "/lead-marketplace/leads/{$match['id']}' style='background:#f97316;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;'>View Lead</a></p>
        ";

        try {
            NotificationSender::sendEmail(
                $match['contact_email'],
                $subject,
                $emailBody,
                $match['contact_name']
            );
            self::logNotification($match['workspace_id'], $matchId, 'email', 'lead_expiring', 'sent');
        } catch (\Exception $e) {
            self::logNotification($match['workspace_id'], $matchId, 'email', 'lead_expiring', 'failed', $e->getMessage());
        }
    }

    /**
     * Notify consumer that their request has been matched
     */
    public static function notifyConsumerMatched(int $leadRequestId, int $matchCount): void
    {
        $conn = \Xordon\Database::conn();
        
        $stmt = $conn->prepare("
            SELECT lr.*, 
                (SELECT GROUP_CONCAT(sc.name SEPARATOR ', ') 
                 FROM lead_request_services lrs 
                 JOIN service_catalog sc ON sc.id = lrs.service_id 
                 WHERE lrs.lead_request_id = lr.id) as service_names
            FROM lead_requests lr
            WHERE lr.id = ?
        ");
        $stmt->execute([$leadRequestId]);
        $lead = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$lead || !$lead['consumer_email']) return;

        $subject = "Your request has been sent to $matchCount professionals";
        $emailBody = "
            <h2>Good news!</h2>
            <p>Your request for <strong>{$lead['service_names']}</strong> has been sent to <strong>$matchCount</strong> qualified professionals in your area.</p>
            <p>You should start receiving quotes soon. We'll notify you when professionals respond.</p>
            <p>Request details:</p>
            <ul>
                " . ($lead['city'] ? "<li>Location: {$lead['city']}" . ($lead['region'] ? ", {$lead['region']}" : "") . "</li>" : "") . "
                " . ($lead['timing'] ? "<li>Timeline: {$lead['timing']}</li>" : "") . "
                " . ($lead['budget_max'] ? "<li>Budget: \${$lead['budget_min']} - \${$lead['budget_max']}</li>" : "") . "
            </ul>
        ";

        try {
            NotificationSender::sendEmail(
                $lead['consumer_email'],
                $subject,
                $emailBody,
                $lead['consumer_name']
            );
        } catch (\Exception $e) {
            error_log("Failed to notify consumer: " . $e->getMessage());
        }
    }

    /**
     * Notify consumer that a pro has sent a quote
     */
    public static function notifyConsumerQuote(int $quoteId): void
    {
        $conn = \Xordon\Database::conn();
        
        $stmt = $conn->prepare("
            SELECT 
                lq.*,
                lr.consumer_email,
                lr.consumer_name,
                sp.business_name,
                sp.avg_rating,
                (SELECT GROUP_CONCAT(sc.name SEPARATOR ', ') 
                 FROM lead_request_services lrs 
                 JOIN service_catalog sc ON sc.id = lrs.service_id 
                 WHERE lrs.lead_request_id = lr.id) as service_names
            FROM lead_quotes lq
            JOIN lead_matches lm ON lm.id = lq.lead_match_id
            JOIN lead_requests lr ON lr.id = lm.lead_request_id
            JOIN service_pros sp ON sp.company_id = lm.company_id AND sp.workspace_id = lm.workspace_id
            WHERE lq.id = ?
        ");
        $stmt->execute([$quoteId]);
        $quote = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$quote || !$quote['consumer_email']) return;

        $subject = "New quote from {$quote['business_name']}";
        $priceRange = '';
        if ($quote['price_min'] || $quote['price_max']) {
            $priceRange = "<p><strong>Quoted Price:</strong> \${$quote['price_min']}" . ($quote['price_max'] ? " - \${$quote['price_max']}" : "") . "</p>";
        }

        $emailBody = "
            <h2>You received a quote!</h2>
            <p><strong>{$quote['business_name']}</strong> " . ($quote['avg_rating'] ? "(★ {$quote['avg_rating']})" : "") . " has responded to your request for <strong>{$quote['service_names']}</strong>.</p>
            " . ($quote['message'] ? "<p><strong>Message:</strong> {$quote['message']}</p>" : "") . "
            $priceRange
            <p>Log in to view the full quote and contact this professional.</p>
        ";

        try {
            NotificationSender::sendEmail(
                $quote['consumer_email'],
                $subject,
                $emailBody,
                $quote['consumer_name']
            );
        } catch (\Exception $e) {
            error_log("Failed to notify consumer of quote: " . $e->getMessage());
        }
    }

    /**
     * Notify provider of low credit balance
     */
    public static function notifyLowBalance(int $workspaceId, int $companyId, float $balance): void
    {
        $conn = \Xordon\Database::conn();
        
        $stmt = $conn->prepare("
            SELECT sp.contact_email, sp.contact_name, sp.business_name, pp.auto_recharge_threshold
            FROM service_pros sp
            LEFT JOIN pro_preferences pp ON pp.company_id = sp.company_id AND pp.workspace_id = sp.workspace_id
            WHERE sp.workspace_id = ? AND sp.company_id = ?
        ");
        $stmt->execute([$workspaceId, $companyId]);
        $pro = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$pro || !$pro['contact_email']) return;

        $subject = "Low credit balance warning";
        $emailBody = "
            <h2>Your credit balance is low</h2>
            <p>Your current balance is <strong>\${$balance}</strong>.</p>
            <p>You may miss out on new leads if your balance runs out. Add credits now to keep receiving leads.</p>
            <p><a href='" . getenv('APP_URL') . "/lead-marketplace/wallet' style='background:#f97316;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;'>Add Credits</a></p>
        ";

        try {
            NotificationSender::sendEmail(
                $pro['contact_email'],
                $subject,
                $emailBody,
                $pro['contact_name'] ?: $pro['business_name']
            );
        } catch (\Exception $e) {
            error_log("Failed to notify low balance: " . $e->getMessage());
        }
    }

    /**
     * Log notification attempt
     */
    private static function logNotification(int $workspaceId, int $matchId, string $channel, string $type, string $status, ?string $error = null): void
    {
        $conn = \Xordon\Database::conn();
        $stmt = $conn->prepare("
            INSERT INTO lead_activity_log (workspace_id, lead_match_id, activity_type, description)
            VALUES (?, ?, ?, ?)
        ");
        $desc = "Notification ($channel): $type - $status" . ($error ? " - $error" : "");
        $actType = "notification_$status";
        $stmt->execute([$workspaceId, $matchId, $actType, $desc]);
    }

    /**
     * Process expiring leads and send reminders
     * Should be called by cron job
     */
    public static function processExpiringLeads(): int
    {
        $conn = \Xordon\Database::conn();
        
        // Find leads expiring in 2 hours that haven't been reminded
        $stmt = $conn->prepare("
            SELECT lm.id
            FROM lead_matches lm
            WHERE lm.status IN ('offered', 'viewed')
            AND lm.expires_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 2 HOUR)
            AND lm.id NOT IN (
                SELECT DISTINCT lead_match_id FROM lead_activity_log 
                WHERE activity_type = 'notification_sent' 
                AND description LIKE '%lead_expiring%'
                AND lead_match_id IS NOT NULL
            )
        ");
        $stmt->execute();
        $matches = $stmt->fetchAll();
        
        $count = 0;
        foreach ($matches as $match) {
            self::notifyLeadExpiring($match['id']);
            $count++;
        }
        
        return $count;
    }

    /**
     * Process expired leads and update status
     * Should be called by cron job
     */
    public static function processExpiredLeads(): int
    {
        $conn = \Xordon\Database::conn();
        
        // Update expired matches
        $stmt = $conn->prepare("
            UPDATE lead_matches 
            SET status = 'expired'
            WHERE status IN ('offered', 'viewed')
            AND expires_at < NOW()
        ");
        $stmt->execute();
        
        return $stmt->rowCount();
    }
}
