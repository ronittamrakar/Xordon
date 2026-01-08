<?php

require_once __DIR__ . '/../traits/WorkspaceScoped.php';

class SMSSequenceProcessorController {
    use WorkspaceScoped;
    
    /**
     * Process pending scheduled SMS messages
     * This endpoint can be called by a cron job or scheduled task
     */
    public static function processPending() {
        try {
            // Optional: Add basic authentication for cron job
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
            $expectedToken = $_ENV['SMS_PROCESSOR_TOKEN'] ?? null;
            
            if ($expectedToken && $authHeader !== 'Bearer ' . $expectedToken) {
                http_response_code(401);
                return Response::json(['error' => 'Unauthorized']);
            }
            
            $processor = new SMSSequenceProcessor();
            
            // Get limit from query parameter, default to 100
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
            $limit = max(1, min($limit, 1000)); // Ensure limit is between 1 and 1000
            
            $result = $processor->processPendingMessages($limit);
            
            return Response::json([
                'status' => 'success',
                'message' => 'SMS sequence processing completed',
                'result' => $result
            ]);
            
        } catch (Exception $e) {
            error_log('SMS sequence processor error: ' . $e->getMessage());
            http_response_code(500);
            return Response::json(['error' => 'Failed to process SMS sequences: ' . $e->getMessage()]);
        }
    }
    
    /**
     * Schedule follow-ups for a specific campaign and recipient
     * This is called when a campaign is launched or a new recipient is added
     */
    public static function scheduleFollowUps($campaignId, $recipientId) {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            
            // Use workspace scoping for tenant isolation
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Verify campaign ownership via workspace
            $stmt = $db->prepare("SELECT id FROM sms_campaigns WHERE id = :id AND workspace_id = :ws_id");
            $stmt->execute(['id' => $campaignId, 'ws_id' => $workspaceId]);
            
            if (!$stmt->fetch()) {
                http_response_code(404);
                return Response::json(['error' => 'Campaign not found']);
            }
            
            // Verify recipient ownership via workspace
            $stmt = $db->prepare("SELECT id FROM sms_recipients WHERE id = :id AND workspace_id = :ws_id");
            $stmt->execute(['id' => $recipientId, 'ws_id' => $workspaceId]);
            
            if (!$stmt->fetch()) {
                http_response_code(404);
                return Response::json(['error' => 'Recipient not found']);
            }
            
            $processor = new SMSSequenceProcessor();
            $processor->scheduleFollowUps($campaignId, $recipientId);
            
            return Response::json([
                'status' => 'success',
                'message' => 'Follow-up messages scheduled successfully'
            ]);
            
        } catch (Exception $e) {
            error_log('Failed to schedule SMS follow-ups: ' . $e->getMessage());
            http_response_code(500);
            return Response::json(['error' => 'Failed to schedule follow-ups: ' . $e->getMessage()]);
        }
    }
    
    /**
     * Get scheduled message statistics
     */
    public static function getStats() {
        try {
            $userId = Auth::userIdOrFail();
            $campaignId = isset($_GET['campaign_id']) ? (int)$_GET['campaign_id'] : null;
            
            // Use workspace scoping
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Verify campaign ownership if campaign_id is provided
            if ($campaignId) {
                $db = Database::conn();
                $stmt = $db->prepare("SELECT id FROM sms_campaigns WHERE id = :id AND workspace_id = :ws_id");
                $stmt->execute(['id' => $campaignId, 'ws_id' => $workspaceId]);
                
                if (!$stmt->fetch()) {
                    http_response_code(404);
                    return Response::json(['error' => 'Campaign not found']);
                }
            }
            
            $processor = new SMSSequenceProcessor();
            $stats = $processor->getScheduledStats($workspaceId, $campaignId);
            
            return Response::json([
                'status' => 'success',
                'stats' => $stats
            ]);
            
        } catch (Exception $e) {
            error_log('Failed to get SMS stats: ' . $e->getMessage());
            http_response_code(500);
            return Response::json(['error' => 'Failed to get statistics: ' . $e->getMessage()]);
        }
    }
    
    /**
     * Get scheduled messages for a campaign
     */
    public static function getScheduledMessages($campaignId) {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            
            // Use workspace scoping
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Verify campaign ownership via workspace
            $stmt = $db->prepare("SELECT id FROM sms_campaigns WHERE id = :id AND workspace_id = :ws_id");
            $stmt->execute(['id' => $campaignId, 'ws_id' => $workspaceId]);
            
            if (!$stmt->fetch()) {
                http_response_code(404);
                return Response::json(['error' => 'Campaign not found']);
            }
            
            // Get status filter
            $status = isset($_GET['status']) ? $_GET['status'] : null;
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
            $limit = max(1, min($limit, 200)); // Ensure limit is between 1 and 200
            
            // Build query
            $whereClause = 'WHERE sm.campaign_id = :campaign_id';
            $params = ['campaign_id' => $campaignId];
            
            if ($status) {
                $whereClause .= ' AND sm.status = :status';
                $params['status'] = $status;
            }
            
            $stmt = $db->prepare("
                SELECT 
                    sm.*,
                    sr.first_name,
                    sr.last_name,
                    sr.company,
                    ss.step_order,
                    ss.delay_amount,
                    ss.delay_unit
                FROM sms_scheduled_messages sm
                JOIN sms_recipients sr ON sm.recipient_id = sr.id
                JOIN sms_sequence_steps ss ON sm.step_id = ss.id
                $whereClause
                ORDER BY sm.scheduled_at ASC
                LIMIT :limit
            ");
            
            $stmt->bindValue(':campaign_id', $campaignId);
            if ($status) {
                $stmt->bindValue(':status', $status);
            }
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            
            $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return Response::json([
                'status' => 'success',
                'messages' => array_map(function($msg) {
                    return [
                        'id' => $msg['id'],
                        'recipient' => [
                            'id' => $msg['recipient_id'],
                            'first_name' => $msg['first_name'],
                            'last_name' => $msg['last_name'],
                            'company' => $msg['company'],
                            'phone_number' => $msg['phone_number']
                        ],
                        'step' => [
                            'id' => $msg['step_id'],
                            'order' => $msg['step_order'],
                            'delay_amount' => $msg['delay_amount'],
                            'delay_unit' => $msg['delay_unit']
                        ],
                        'message' => $msg['message'],
                        'scheduled_at' => $msg['scheduled_at'],
                        'sent_at' => $msg['sent_at'],
                        'status' => $msg['status'],
                        'external_id' => $msg['external_id'],
                        'error_message' => $msg['error_message']
                    ];
                }, $messages)
            ]);
            
        } catch (Exception $e) {
            error_log('Failed to get scheduled messages: ' . $e->getMessage());
            http_response_code(500);
            return Response::json(['error' => 'Failed to get scheduled messages: ' . $e->getMessage()]);
        }
    }
    
    /**
     * Cancel scheduled messages for a campaign/recipient
     */
    public static function cancelScheduledMessages($campaignId, $recipientId = null) {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            
            // Use workspace scoping
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Verify campaign ownership via workspace
            $stmt = $db->prepare("SELECT id FROM sms_campaigns WHERE id = :id AND workspace_id = :ws_id");
            $stmt->execute(['id' => $campaignId, 'ws_id' => $workspaceId]);
            
            if (!$stmt->fetch()) {
                http_response_code(404);
                return Response::json(['error' => 'Campaign not found']);
            }
            
            // Build where clause
            $whereClause = 'WHERE campaign_id = :campaign_id AND status = \'pending\'';
            $params = ['campaign_id' => $campaignId];
            
            if ($recipientId) {
                // Verify recipient ownership via workspace
                $stmt = $db->prepare("SELECT id FROM sms_recipients WHERE id = :id AND workspace_id = :ws_id");
                $stmt->execute(['id' => $recipientId, 'ws_id' => $workspaceId]);
                
                if (!$stmt->fetch()) {
                    http_response_code(404);
                    return Response::json(['error' => 'Recipient not found']);
                }
                
                $whereClause .= ' AND recipient_id = :recipient_id';
                $params['recipient_id'] = $recipientId;
            }
            
            // Cancel pending messages
            $stmt = $db->prepare("
                UPDATE sms_scheduled_messages 
                SET status = 'cancelled', updated_at = NOW()
                $whereClause
            ");
            
            $stmt->execute($params);
            $cancelledCount = $stmt->rowCount();
            
            return Response::json([
                'status' => 'success',
                'message' => "Cancelled $cancelledCount scheduled messages",
                'cancelled_count' => $cancelledCount
            ]);
            
        } catch (Exception $e) {
            error_log('Failed to cancel scheduled messages: ' . $e->getMessage());
            http_response_code(500);
            return Response::json(['error' => 'Failed to cancel scheduled messages: ' . $e->getMessage()]);
        }
    }
}