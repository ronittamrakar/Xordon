<?php

require_once __DIR__ . '/SMSService.php';

class SMSSequenceProcessor {
    private $smsService;
    
    public function __construct() {
        $this->smsService = new SMSService();
    }
    
    /**
     * Schedule follow-up messages for a campaign based on its sequence
     */
    public function scheduleFollowUps($campaignId, $recipientId, $initialMessageSentAt = null) {
        try {
            $db = Database::conn();
            
            // Get campaign details
            $stmt = $db->prepare("
                SELECT c.*, s.* 
                FROM sms_campaigns c
                JOIN sms_sequences s ON c.sequence_id = s.id
                WHERE c.id = :campaign_id AND c.status = 'active'
            ");
            $stmt->execute(['campaign_id' => $campaignId]);
            $campaign = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$campaign) {
                throw new Exception('Campaign not found or not active');
            }
            
            // Get recipient details
            $stmt = $db->prepare("SELECT * FROM sms_recipients WHERE id = :recipient_id AND opt_in_status = 'opted_in'");
            $stmt->execute(['recipient_id' => $recipientId]);
            $recipient = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$recipient) {
                throw new Exception('Recipient not found or not opted in');
            }
            
            // Get sequence steps
            $stmt = $db->prepare("
                SELECT * FROM sms_sequence_steps 
                WHERE sequence_id = :sequence_id 
                ORDER BY step_order ASC
            ");
            $stmt->execute(['sequence_id' => $campaign['sequence_id']]);
            $steps = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($steps)) {
                throw new Exception('No sequence steps found');
            }
            
            // Use current time if no initial message time provided
            $baseTime = $initialMessageSentAt ?: date('Y-m-d H:i:s');
            
            // Schedule each step
            foreach ($steps as $step) {
                $this->scheduleStep($campaign, $recipient, $step, $baseTime);
            }
            
            return true;
            
        } catch (Exception $e) {
            error_log('Failed to schedule SMS follow-ups: ' . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Schedule a single sequence step
     */
    private function scheduleStep($campaign, $recipient, $step, $baseTime) {
        try {
            $db = Database::conn();
            
            // Calculate scheduled time based on delay
            $scheduledAt = $this->calculateScheduledTime($baseTime, $step['delay_amount'], $step['delay_unit']);
            
            // Replace variables in message
            $message = $this->replaceVariables($step['message'], $recipient);
            
            // Check if already scheduled (prevent duplicates)
            $stmt = $db->prepare("
                SELECT id FROM sms_scheduled_messages 
                WHERE campaign_id = :campaign_id AND step_id = :step_id AND recipient_id = :recipient_id
            ");
            $stmt->execute([
                'campaign_id' => $campaign['id'],
                'step_id' => $step['id'],
                'recipient_id' => $recipient['id']
            ]);
            
            if ($stmt->fetch()) {
                // Already scheduled, skip
                return;
            }
            
            // Schedule the message
            $stmt = $db->prepare("
                INSERT INTO sms_scheduled_messages (
                    user_id, campaign_id, sequence_id, step_id, recipient_id,
                    phone_number, message, scheduled_at, status, created_at, updated_at
                ) VALUES (
                    :user_id, :campaign_id, :sequence_id, :step_id, :recipient_id,
                    :phone_number, :message, :scheduled_at, 'pending', NOW(), NOW()
                )
            ");
            
            $stmt->execute([
                'user_id' => $campaign['user_id'],
                'campaign_id' => $campaign['id'],
                'sequence_id' => $campaign['sequence_id'],
                'step_id' => $step['id'],
                'recipient_id' => $recipient['id'],
                'phone_number' => $recipient['phone_number'],
                'message' => $message,
                'scheduled_at' => $scheduledAt
            ]);
            
        } catch (Exception $e) {
            error_log('Failed to schedule SMS step: ' . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Process pending scheduled messages
     */
    public function processPendingMessages($limit = 100) {
        try {
            $db = Database::conn();
            
            // Get pending messages that are due to be sent
            $stmt = $db->prepare("
                SELECT sm.*, c.sender_id as sending_account_id, sa.phone_number as sender_number
                FROM sms_scheduled_messages sm
                JOIN sms_campaigns c ON sm.campaign_id = c.id
                JOIN sms_sending_accounts sa ON c.sender_id = sa.id
                WHERE sm.status = 'pending' AND sm.scheduled_at <= NOW()
                ORDER BY sm.scheduled_at ASC
                LIMIT :limit
            ");
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $processed = 0;
            $failed = 0;
            
            foreach ($messages as $message) {
                try {
                    $this->sendScheduledMessage($message);
                    $processed++;
                } catch (Exception $e) {
                    $failed++;
                    error_log('Failed to send scheduled SMS: ' . $e->getMessage());
                }
            }
            
            return [
                'processed' => $processed,
                'failed' => $failed,
                'total' => count($messages)
            ];
            
        } catch (Exception $e) {
            error_log('Failed to process pending SMS messages: ' . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Send a scheduled message
     */
    private function sendScheduledMessage($message) {
        try {
            $db = Database::conn();
            
            // Check if recipient is still opted in
            $stmt = $db->prepare("SELECT opt_in_status FROM sms_recipients WHERE id = :recipient_id");
            $stmt->execute(['recipient_id' => $message['recipient_id']]);
            $recipient = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$recipient || $recipient['opt_in_status'] !== 'opted_in') {
                // Recipient opted out, cancel the message
                $this->updateMessageStatus($message['id'], 'cancelled', 'Recipient opted out');
                return;
            }
            
            // Check if campaign is still active
            $stmt = $db->prepare("SELECT status FROM sms_campaigns WHERE id = :campaign_id");
            $stmt->execute(['campaign_id' => $message['campaign_id']]);
            $campaign = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$campaign || $campaign['status'] !== 'active') {
                // Campaign paused/stopped, cancel the message
                $this->updateMessageStatus($message['id'], 'cancelled', 'Campaign not active');
                return;
            }
            
            // Send the message
            $result = $this->smsService->sendMessage(
                $message['phone_number'],
                $message['message'],
                $message['sender_number']
            );
            
            // Update message status
            $this->updateMessageStatus(
                $message['id'], 
                'sent', 
                null, 
                $result['external_id']
            );
            
            // Log the sent message
            $this->logSentMessage($message, $result);
            
        } catch (Exception $e) {
            // Update message status to failed
            $this->updateMessageStatus($message['id'], 'failed', $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Update message status
     */
    private function updateMessageStatus($messageId, $status, $errorMessage = null, $externalId = null) {
        try {
            $db = Database::conn();
            
            $stmt = $db->prepare("
                UPDATE sms_scheduled_messages 
                SET status = :status, 
                    error_message = :error_message,
                    external_id = COALESCE(:external_id, external_id),
                    sent_at = CASE WHEN :status = 'sent' THEN NOW() ELSE sent_at END,
                    updated_at = NOW()
                WHERE id = :id
            ");
            
            $stmt->execute([
                'status' => $status,
                'error_message' => $errorMessage,
                'external_id' => $externalId,
                'id' => $messageId
            ]);
            
        } catch (Exception $e) {
            error_log('Failed to update SMS message status: ' . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Log sent message for tracking
     */
    private function logSentMessage($message, $sendResult) {
        try {
            $db = Database::conn();
            
            $stmt = $db->prepare("
                INSERT INTO sms_messages (
                    user_id, campaign_id, recipient_id, phone_number, message,
                    status, external_id, cost, created_at, updated_at
                ) VALUES (
                    :user_id, :campaign_id, :recipient_id, :phone_number, :message,
                    'sent', :external_id, :cost, NOW(), NOW()
                )
            ");
            
            $stmt->execute([
                'user_id' => $message['user_id'],
                'campaign_id' => $message['campaign_id'],
                'recipient_id' => $message['recipient_id'],
                'phone_number' => $message['phone_number'],
                'message' => $message['message'],
                'external_id' => $sendResult['external_id'],
                'cost' => $sendResult['cost'] ?? 0
            ]);
            
        } catch (Exception $e) {
            error_log('Failed to log sent SMS message: ' . $e->getMessage());
            // Don't throw here, logging failure shouldn't stop the process
        }
    }
    
    /**
     * Calculate scheduled time based on delay
     */
    private function calculateScheduledTime($baseTime, $delayAmount, $delayUnit) {
        $timestamp = strtotime($baseTime);
        
        switch ($delayUnit) {
            case 'minutes':
                $timestamp += ($delayAmount * 60);
                break;
            case 'hours':
                $timestamp += ($delayAmount * 3600);
                break;
            case 'days':
                $timestamp += ($delayAmount * 86400);
                break;
            case 'weeks':
                $timestamp += ($delayAmount * 604800);
                break;
            default:
                // Default to hours
                $timestamp += ($delayAmount * 3600);
        }
        
        return date('Y-m-d H:i:s', $timestamp);
    }
    
    /**
     * Replace variables in message template
     */
    private function replaceVariables($message, $recipient) {
        $variables = [
            '{{firstName}}' => $recipient['first_name'] ?? '',
            '{{lastName}}' => $recipient['last_name'] ?? '',
            '{{name}}' => trim(($recipient['first_name'] ?? '') . ' ' . ($recipient['last_name'] ?? '')),
            '{{company}}' => $recipient['company'] ?? '',
            '{{unsubscribeUrl}}' => $this->generateUnsubscribeUrl($recipient['id'])
        ];
        
        return str_replace(array_keys($variables), array_values($variables), $message);
    }
    
    /**
     * Generate unsubscribe URL
     */
    private function generateUnsubscribeUrl($recipientId) {
        // Generate a secure unsubscribe token
        $token = bin2hex(random_bytes(32));
        
        // Store the token in the database
        $db = Database::conn();
        $stmt = $db->prepare("
            UPDATE sms_recipients 
            SET unsubscribe_token = :token, updated_at = NOW()
            WHERE id = :id
        ");
        $stmt->execute(['token' => $token, 'id' => $recipientId]);
        
        // Return the unsubscribe URL
        $baseUrl = $_ENV['APP_URL'] ?? 'http://localhost:9000';
        return $baseUrl . '/sms/unsubscribe/' . $recipientId . '/' . $token;
    }
    
    /**
     * Get statistics for scheduled messages
     */
    public function getScheduledStats($userId = null, $campaignId = null) {
        try {
            $db = Database::conn();
            
            $whereClause = '';
            $params = [];
            
            if ($userId) {
                $whereClause .= ' WHERE user_id = :user_id';
                $params['user_id'] = $userId;
            }
            
            if ($campaignId) {
                $whereClause .= ($whereClause ? ' AND' : ' WHERE') . ' campaign_id = :campaign_id';
                $params['campaign_id'] = $campaignId;
            }
            
            $stmt = $db->prepare("
                SELECT 
                    status,
                    COUNT(*) as count
                FROM sms_scheduled_messages
                $whereClause
                GROUP BY status
            ");
            
            $stmt->execute($params);
            $stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $result = [
                'pending' => 0,
                'sent' => 0,
                'failed' => 0,
                'cancelled' => 0
            ];
            
            foreach ($stats as $stat) {
                $result[$stat['status']] = $stat['count'];
            }
            
            return $result;
            
        } catch (Exception $e) {
            error_log('Failed to get SMS scheduled stats: ' . $e->getMessage());
            throw $e;
        }
    }
}