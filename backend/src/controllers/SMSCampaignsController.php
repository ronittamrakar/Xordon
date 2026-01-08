<?php

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../services/RBACService.php';
require_once __DIR__ . '/../services/SMSService.php';
require_once __DIR__ . '/../services/SMSSequenceProcessor.php';
require_once __DIR__ . '/../traits/WorkspaceScoped.php';

class SMSCampaignsController {
    use WorkspaceScoped;
    
    private $db;
    private $auth;
    private $smsService;

    public function __construct() {
        $this->db = Database::conn();
        $this->auth = new Auth();
        $this->smsService = new SMSService();
    }

    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $pathParts = explode('/', trim($path, '/'));

        // Extract campaign ID if present
        $campaignId = null;
        if (count($pathParts) >= 3 && is_numeric($pathParts[2])) {
            $campaignId = (int)$pathParts[2];
        }

        switch ($method) {
            case 'GET':
                if ($campaignId) {
                    return $this->getCampaign($campaignId);
                } else {
                    return $this->getCampaigns();
                }
            case 'POST':
                return $this->createCampaign();
            case 'PUT':
                if ($campaignId) {
                    return $this->updateCampaign($campaignId);
                }
                break;
            case 'DELETE':
                if ($campaignId) {
                    return $this->deleteCampaign($campaignId);
                }
                break;
        }

        Response::error('Method not allowed', 405);
    }

    public function getCampaigns() {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!$rbac->hasPermission($userId, 'sms.campaigns.view')) {
            Response::forbidden('You do not have permission to view SMS campaigns');
            return;
        }

        try {
            $page = (int)($_GET['page'] ?? 1);
            $limit = (int)($_GET['limit'] ?? 10);
            $offset = ($page - 1) * $limit;
            $search = $_GET['search'] ?? '';
            $status = $_GET['status'] ?? '';

            // Use workspace scoping instead of user_id for proper tenant isolation
            $scope = self::workspaceWhere();
            $whereClause = 'WHERE ' . $scope['sql'];
            $params = [];
            foreach ($scope['params'] as $i => $v) {
                $params["scope$i"] = $v;
            }
            // Rewrite placeholder from positional to named
            $whereClause = preg_replace('/\?/', ':scope0', $whereClause, 1);

            if ($search) {
                $whereClause .= ' AND (name LIKE :search OR description LIKE :search)';
                $params['search'] = "%$search%";
            }

            if ($status) {
                $whereClause .= ' AND status = :status';
                $params['status'] = $status;
            }

            // Get total count
            $countSql = "SELECT COUNT(*) FROM sms_campaigns $whereClause";
            $countStmt = $this->db->prepare($countSql);
            $countStmt->execute($params);
            $total = $countStmt->fetchColumn();

            // Get campaigns
            $sql = "SELECT * FROM sms_campaigns $whereClause ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
            $stmt = $this->db->prepare($sql);
            foreach ($params as $key => $value) {
                $stmt->bindValue(":$key", $value);
            }
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            $campaigns = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Map database fields to frontend expected format
            $mappedCampaigns = array_map(function($campaign) {
                // Map total_recipients to recipient_count for frontend compatibility
                $campaign['recipient_count'] = $campaign['total_recipients'];
                
                // Add reply_count (not stored in database, calculated from sms_replies)
                $replyStmt = $this->db->prepare("SELECT COUNT(*) FROM sms_replies WHERE campaign_id = :campaign_id");
                $replyStmt->execute(['campaign_id' => $campaign['id']]);
                $campaign['reply_count'] = $replyStmt->fetchColumn();
                
                return $campaign;
            }, $campaigns);

            Response::success([
                'campaigns' => $mappedCampaigns,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => (int)$total,
                    'pages' => ceil($total / $limit)
                ]
            ]);
        } catch (Exception $e) {
            Response::error('Failed to fetch campaigns: ' . $e->getMessage(), 500);
        }
    }

    public function getCampaign($campaignId) {
        $userId = Auth::userIdOrFail();

        try {
            $scope = self::workspaceWhere();
            $stmt = $this->db->prepare("SELECT * FROM sms_campaigns WHERE id = :id AND " . str_replace('?', ':ws_id', $scope['sql']));
            $stmt->execute(['id' => $campaignId, 'ws_id' => $scope['params'][0]]);
            $campaign = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$campaign) {
                Response::error('Campaign not found', 404);
                return;
            }

            // Map database fields to frontend expected format
            $campaign['recipient_count'] = $campaign['total_recipients'];
            // Ensure A/B test id is available (if column exists)
            if (!array_key_exists('ab_test_id', $campaign)) {
                $campaign['ab_test_id'] = null;
            }
            
            // Get campaign statistics
            $statsStmt = $this->db->prepare("
                SELECT 
                    COUNT(*) as total_messages,
                    SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_count,
                    SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_count,
                    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
                    SUM(cost) as total_cost
                FROM sms_messages 
                WHERE campaign_id = :campaign_id
            ");
            $statsStmt->execute(['campaign_id' => $campaignId]);
            $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

            $campaign['stats'] = $stats;

            // Add reply_count
            $replyStmt = $this->db->prepare("SELECT COUNT(*) FROM sms_replies WHERE campaign_id = :campaign_id");
            $replyStmt->execute(['campaign_id' => $campaignId]);
            $campaign['reply_count'] = $replyStmt->fetchColumn();

            Response::success($campaign);
        } catch (Exception $e) {
            Response::error('Failed to fetch campaign: ' . $e->getMessage(), 500);
        }
    }

    public function createCampaign() {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!$rbac->hasPermission($userId, 'sms.campaigns.create')) {
            Response::forbidden('You do not have permission to create SMS campaigns');
            return;
        }
        
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (empty($data['name'])) {
                http_response_code(400);
                return Response::json(['error' => 'Campaign name is required']);
            }
            
            $pdo = Database::conn();
            
            // Create campaign
            // Get workspace scope for tenant isolation
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Get sender_id from request data
            $senderId = null;
            if (!empty($data['sender_id'])) {
                // Validate that the sender_id belongs to the workspace
                $senderStmt = $pdo->prepare("SELECT id FROM sms_sending_accounts WHERE id = :sender_id AND " . str_replace('?', ':ws_id', $scope['sql']));
                $senderStmt->execute([
                    'sender_id' => $data['sender_id'],
                    'ws_id' => $workspaceId
                ]);
                $senderAccount = $senderStmt->fetch(PDO::FETCH_ASSOC);
                if ($senderAccount) {
                    $senderId = $senderAccount['id'];
                }
            } elseif (!empty($data['sender_number'])) {
                // Fallback: get sender_id from phone number
                $senderStmt = $pdo->prepare("SELECT id FROM sms_sending_accounts WHERE phone_number = :phone_number AND " . str_replace('?', ':ws_id', $scope['sql']));
                $senderStmt->execute([
                    'phone_number' => $data['sender_number'],
                    'ws_id' => $workspaceId
                ]);
                $senderAccount = $senderStmt->fetch(PDO::FETCH_ASSOC);
                if ($senderAccount) {
                    $senderId = $senderAccount['id'];
                }
            }

            // Handle manual recipient method - store phone numbers in recipient_tags
            $recipientTags = null;
            if ($data['recipient_method'] === 'manual' && !empty($data['phoneNumbers'])) {
                $recipientTags = json_encode($data['phoneNumbers']);
            } elseif (isset($data['recipient_tags'])) {
                $recipientTags = json_encode($data['recipient_tags']);
            }

            $stmt = $pdo->prepare("
                INSERT INTO sms_campaigns (
                    user_id, workspace_id, name, description, message, sender_id, status, 
                    recipient_method, recipient_tags, scheduled_at, 
                    throttle_rate, throttle_unit, enable_retry, retry_attempts,
                    respect_quiet_hours, quiet_hours_start, quiet_hours_end,
                    ab_test_id,
                    created_at, updated_at
                ) VALUES (
                    :user_id, :workspace_id, :name, :description, :message, :sender_id, :status,
                    :recipient_method, :recipient_tags, :scheduled_at,
                    :throttle_rate, :throttle_unit, :enable_retry, :retry_attempts,
                    :respect_quiet_hours, :quiet_hours_start, :quiet_hours_end,
                    :ab_test_id,
                    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                )
            ");
            
            $stmt->execute([
                'user_id' => $userId,
                'workspace_id' => $workspaceId,
                'name' => trim($data['name']),
                'description' => $data['description'] ?? null,
                'message' => $data['message'] ?? '',
                'sender_id' => $senderId,
                'status' => $data['status'] ?? 'draft',
                'recipient_method' => $data['recipient_method'] ?? 'all',
                'recipient_tags' => $recipientTags,
                'scheduled_at' => $data['scheduled_at'] ?? null,
                'throttle_rate' => $data['throttle_rate'] ?? 1,
                'throttle_unit' => $data['throttle_unit'] ?? 'minute',
                'enable_retry' => $data['enable_retry'] ?? false,
                'retry_attempts' => $data['retry_attempts'] ?? 3,
                'respect_quiet_hours' => $data['respect_quiet_hours'] ?? true,
                'quiet_hours_start' => $data['quiet_hours_start'] ?? '22:00:00',
                'quiet_hours_end' => $data['quiet_hours_end'] ?? '08:00:00',
                'ab_test_id' => $data['ab_test_id'] ?? null
            ]);

            $campaignId = $pdo->lastInsertId();

            // Get the created campaign
            $stmt = $pdo->prepare("SELECT * FROM sms_campaigns WHERE id = :id");
            $stmt->execute(['id' => $campaignId]);
            $campaign = $stmt->fetch(PDO::FETCH_ASSOC);

            // Calculate recipient count for the campaign
            $recipients = $this->getRecipients($campaign);
            $recipientCount = count($recipients);

            // Update campaign with recipient count
            $stmt = $pdo->prepare("UPDATE sms_campaigns SET total_recipients = :total_recipients WHERE id = :id");
            $stmt->execute(['total_recipients' => $recipientCount, 'id' => $campaignId]);
            $campaign['total_recipients'] = $recipientCount;

            // Map database fields to frontend expected format
            $campaign['recipient_count'] = $recipientCount;
            $campaign['reply_count'] = 0; // New campaign has no replies

            return Response::json($campaign);
        } catch (Exception $e) {
            http_response_code(500);
            return Response::json(['error' => 'Failed to create campaign: ' . $e->getMessage()]);
        }
    }

    public function updateCampaign($campaignId) {
        $userId = Auth::userIdOrFail();

        try {
            $pdo = Database::conn();
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Check if campaign exists and belongs to workspace
            $stmt = $pdo->prepare("SELECT * FROM sms_campaigns WHERE id = :id AND " . str_replace('?', ':ws_id', $scope['sql']));
            $stmt->execute(['id' => $campaignId, 'ws_id' => $workspaceId]);
            $campaign = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$campaign) {
                http_response_code(404);
                return Response::json(['error' => 'Campaign not found']);
            }

            $data = json_decode(file_get_contents('php://input'), true);

            // Get sender_id from sender_number if provided
            $senderId = $campaign['sender_id']; // Keep existing sender_id by default
            if (!empty($data['sender_number'])) {
                $senderStmt = $pdo->prepare("SELECT id FROM sms_sending_accounts WHERE phone_number = :phone_number AND " . str_replace('?', ':ws_id', $scope['sql']));
                $senderStmt->execute([
                    'phone_number' => $data['sender_number'],
                    'ws_id' => $workspaceId
                ]);
                $senderAccount = $senderStmt->fetch(PDO::FETCH_ASSOC);
                if ($senderAccount) {
                    $senderId = $senderAccount['id'];
                }
            }

            $sql = "UPDATE sms_campaigns SET 
                name = :name,
                description = :description,
                sequence_id = :sequence_id,
                status = :status,
                sender_id = :sender_id,
                message = :message,
                recipient_method = :recipient_method,
                recipient_tags = :recipient_tags,
                scheduled_at = :scheduled_at,
                throttle_rate = :throttle_rate,
                throttle_unit = :throttle_unit,
                enable_retry = :enable_retry,
                retry_attempts = :retry_attempts,
                respect_quiet_hours = :respect_quiet_hours,
                quiet_hours_start = :quiet_hours_start,
                quiet_hours_end = :quiet_hours_end,
                ab_test_id = :ab_test_id,
                updated_at = NOW()
            WHERE id = :id AND " . str_replace('?', ':ws_id', $scope['sql']);

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'id' => $campaignId,
                'ws_id' => $workspaceId,
                'name' => $data['name'] ?? $campaign['name'],
                'description' => $data['description'] ?? $campaign['description'],
                'sequence_id' => $data['sequence_id'] ?? $campaign['sequence_id'],
                'status' => $data['status'] ?? $campaign['status'],
                'sender_id' => $senderId,
                'message' => $data['message'] ?? $campaign['message'],
                'recipient_method' => $data['recipient_method'] ?? $campaign['recipient_method'],
                'recipient_tags' => isset($data['recipient_tags']) ? json_encode($data['recipient_tags']) : $campaign['recipient_tags'],
                'scheduled_at' => $data['scheduled_at'] ?? $campaign['scheduled_at'],
                'throttle_rate' => $data['throttle_rate'] ?? $campaign['throttle_rate'],
                'throttle_unit' => $data['throttle_unit'] ?? $campaign['throttle_unit'],
                'enable_retry' => $data['enable_retry'] ?? $campaign['enable_retry'],
                'retry_attempts' => $data['retry_attempts'] ?? $campaign['retry_attempts'],
                'respect_quiet_hours' => $data['respect_quiet_hours'] ?? $campaign['respect_quiet_hours'],
                'quiet_hours_start' => $data['quiet_hours_start'] ?? $campaign['quiet_hours_start'],
                'quiet_hours_end' => $data['quiet_hours_end'] ?? $campaign['quiet_hours_end'],
                'ab_test_id' => array_key_exists('ab_test_id', $data) ? $data['ab_test_id'] : ($campaign['ab_test_id'] ?? null)
            ]);

            // Get updated campaign
            $stmt = $pdo->prepare("SELECT * FROM sms_campaigns WHERE id = :id");
            $stmt->execute(['id' => $campaignId]);
            $updatedCampaign = $stmt->fetch(PDO::FETCH_ASSOC);

            // Map database fields to frontend expected format
            $updatedCampaign['recipient_count'] = $updatedCampaign['total_recipients'];
            
            // Add reply_count
            $replyStmt = $this->db->prepare("SELECT COUNT(*) FROM sms_replies WHERE campaign_id = :campaign_id");
            $replyStmt->execute(['campaign_id' => $campaignId]);
            $updatedCampaign['reply_count'] = $replyStmt->fetchColumn();

            return Response::json($updatedCampaign);
        } catch (Exception $e) {
            http_response_code(500);
            return Response::json(['error' => 'Failed to update campaign: ' . $e->getMessage()]);
        }
    }

    public function deleteCampaign($campaignId) {
        $userId = Auth::userIdOrFail();

        try {
            $pdo = Database::conn();
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Check if campaign exists and belongs to workspace
            $stmt = $pdo->prepare("SELECT * FROM sms_campaigns WHERE id = :id AND " . str_replace('?', ':ws_id', $scope['sql']));
            $stmt->execute(['id' => $campaignId, 'ws_id' => $workspaceId]);
            $campaign = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$campaign) {
                http_response_code(404);
                return Response::json(['error' => 'Campaign not found']);
            }

            // Delete campaign (messages will be set to NULL due to foreign key constraint)
            $stmt = $pdo->prepare("DELETE FROM sms_campaigns WHERE id = :id AND " . str_replace('?', ':ws_id', $scope['sql']));
            $stmt->execute(['id' => $campaignId, 'ws_id' => $workspaceId]);

            return Response::json(['message' => 'Campaign deleted successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            return Response::json(['error' => 'Failed to delete campaign: ' . $e->getMessage()]);
        }
    }

    public function sendCampaign($campaignId) {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!$rbac->hasPermission($userId, 'sms.campaigns.send')) {
            Response::forbidden('You do not have permission to send SMS campaigns');
            return;
        }

        try {
            $pdo = Database::conn();
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Get campaign
            $stmt = $pdo->prepare("SELECT * FROM sms_campaigns WHERE id = :id AND " . str_replace('?', ':ws_id', $scope['sql']));
            $stmt->execute(['id' => $campaignId, 'ws_id' => $workspaceId]);
            $campaign = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$campaign) {
                http_response_code(404);
                return Response::json(['error' => 'Campaign not found']);
            }

            if ($campaign['status'] !== 'draft') {
                http_response_code(400);
                return Response::json(['error' => 'Campaign is not in draft status']);
            }

            // Get recipients based on campaign settings
            $recipients = $this->getRecipients($campaign);

            if (empty($recipients)) {
                http_response_code(400);
                return Response::json(['error' => 'No recipients found for this campaign. Please ensure you have selected valid recipients or the recipients exist and are opted in.']);
            }

            // Get sender number from sender_id
            $senderNumber = null;
            if ($campaign['sender_id']) {
                $senderStmt = $this->db->prepare("SELECT phone_number FROM sms_sending_accounts WHERE id = :id AND " . str_replace('?', ':ws_id', $scope['sql']));
                $senderStmt->execute([
                    'id' => $campaign['sender_id'],
                    'ws_id' => $workspaceId
                ]);
                $senderAccount = $senderStmt->fetch(PDO::FETCH_ASSOC);
                if ($senderAccount) {
                    $senderNumber = $senderAccount['phone_number'];
                }
            }

            if (!$senderNumber) {
                http_response_code(400);
                return Response::json(['error' => 'Sender number not found. Please ensure you have a valid SMS sending account configured.']);
            }

            // Check if campaign has a sequence (follow-up messages)
            if (!empty($campaign['sequence_id'])) {
                // For sequence-based campaigns, schedule follow-ups instead of sending all at once
                $sentCount = 0;
                $failedCount = 0;

                // Send initial message and schedule follow-ups
                foreach ($recipients as $recipient) {
                    try {
                        // Send initial message
                        $result = $this->smsService->sendMessage(
                            $recipient['phone_number'],
                            $campaign['message'],
                            $senderNumber
                        );

                        // Log initial message
                        $this->logMessage($campaign, $recipient, $result);
                        $sentCount++;

                        // Schedule follow-up messages
                        $this->scheduleFollowUps($campaignId, $recipient['id'], $campaign['sequence_id']);

                    } catch (Exception $e) {
                        $this->logMessage($campaign, $recipient, ['status' => 'failed', 'error' => $e->getMessage()]);
                        $failedCount++;
                    }
                }

                // Update campaign status to active (waiting for follow-ups)
                $stmt = $pdo->prepare("
                    UPDATE sms_campaigns SET 
                        status = 'active',
                        total_recipients = :total,
                        sent_count = :sent,
                        failed_count = :failed,
                        updated_at = NOW()
                    WHERE id = :id
                ");
                $stmt->execute([
                    'id' => $campaignId,
                    'total' => count($recipients),
                    'sent' => $sentCount,
                    'failed' => $failedCount
                ]);

                return Response::json([
                    'message' => 'Campaign initiated successfully. Initial messages sent, follow-ups scheduled.',
                    'total_recipients' => count($recipients),
                    'sent_count' => $sentCount,
                    'failed_count' => $failedCount
                ]);
            } else {
                // For simple campaigns without sequences, send all messages immediately
                $sentCount = 0;
                $failedCount = 0;

                foreach ($recipients as $recipient) {
                    try {
                        $result = $this->smsService->sendMessage(
                            $recipient['phone_number'],
                            $campaign['message'],
                            $senderNumber
                        );

                        // Log message
                        $this->logMessage($campaign, $recipient, $result);
                        $sentCount++;
                    } catch (Exception $e) {
                        $this->logMessage($campaign, $recipient, ['status' => 'failed', 'error' => $e->getMessage()]);
                        $failedCount++;
                    }
                }

                // Update campaign statistics
                $stmt = $pdo->prepare("
                    UPDATE sms_campaigns SET 
                        status = 'completed',
                        total_recipients = :total,
                        sent_count = :sent,
                        failed_count = :failed,
                        updated_at = NOW()
                    WHERE id = :id
                ");
                $stmt->execute([
                    'id' => $campaignId,
                    'total' => count($recipients),
                    'sent' => $sentCount,
                    'failed' => $failedCount
                ]);

                return Response::json([
                    'message' => 'Campaign sent successfully',
                    'total_recipients' => count($recipients),
                    'sent_count' => $sentCount,
                    'failed_count' => $failedCount
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            return Response::json(['error' => 'Failed to send campaign: ' . $e->getMessage()]);
        }
    }

    public function pauseCampaign($campaignId) {
        $userId = Auth::userIdOrFail();

        try {
            $pdo = Database::conn();
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Get campaign
            $stmt = $pdo->prepare("SELECT * FROM sms_campaigns WHERE id = :id AND " . str_replace('?', ':ws_id', $scope['sql']));
            $stmt->execute(['id' => $campaignId, 'ws_id' => $workspaceId]);
            $campaign = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$campaign) {
                http_response_code(404);
                return Response::json(['error' => 'Campaign not found']);
            }

            if ($campaign['status'] !== 'sending') {
                http_response_code(400);
                return Response::json(['error' => 'Only sending campaigns can be paused']);
            }

            // Update campaign status to paused
            $stmt = $pdo->prepare("UPDATE sms_campaigns SET status = 'paused', updated_at = NOW() WHERE id = :id AND " . str_replace('?', ':ws_id', $scope['sql']));
            $stmt->execute(['id' => $campaignId, 'ws_id' => $workspaceId]);

            return Response::json(['message' => 'Campaign paused successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            return Response::json(['error' => 'Failed to pause campaign: ' . $e->getMessage()]);
        }
    }

    public function archiveCampaign($campaignId) {
        $userId = Auth::userIdOrFail();

        try {
            $pdo = Database::conn();
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Get campaign
            $stmt = $pdo->prepare("SELECT * FROM sms_campaigns WHERE id = :id AND " . str_replace('?', ':ws_id', $scope['sql']));
            $stmt->execute(['id' => $campaignId, 'ws_id' => $workspaceId]);
            $campaign = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$campaign) {
                http_response_code(404);
                return Response::json(['error' => 'Campaign not found']);
            }

            // Update campaign status to archived
            $stmt = $pdo->prepare("UPDATE sms_campaigns SET status = 'archived', updated_at = NOW() WHERE id = :id AND " . str_replace('?', ':ws_id', $scope['sql']));
            $stmt->execute(['id' => $campaignId, 'ws_id' => $workspaceId]);

            return Response::json(['message' => 'Campaign archived successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            return Response::json(['error' => 'Failed to archive campaign: ' . $e->getMessage()]);
        }
    }

    private function scheduleFollowUps($campaignId, $recipientId, $sequenceId) {
        try {
            // Create instance of SMSSequenceProcessor to schedule follow-ups
            $processor = new SMSSequenceProcessor();
            $processor->scheduleFollowUps($campaignId, $recipientId, $sequenceId);
        } catch (Exception $e) {
            error_log("Failed to schedule follow-ups for campaign $campaignId, recipient $recipientId: " . $e->getMessage());
        }
    }

    private function getRecipients($campaign) {
        $pdo = Database::conn();
        $scope = self::workspaceWhere();
        $workspaceId = $scope['params'][0];
        
        // Handle manual method with specific phone numbers stored in recipient_tags
        if ($campaign['recipient_method'] === 'manual' && !empty($campaign['recipient_tags'])) {
            $phoneNumbers = json_decode($campaign['recipient_tags'], true);
            if (!empty($phoneNumbers) && is_array($phoneNumbers)) {
                // Create placeholders for phone numbers
                $placeholders = [];
                foreach ($phoneNumbers as $index => $phone) {
                    $placeholders[] = ":phone$index";
                }
                
                $sql = "SELECT * FROM sms_recipients WHERE " . str_replace('?', ':ws_id', $scope['sql']) . " AND phone_number IN (" . implode(', ', $placeholders) . ") AND status = 'active' AND opt_in_status = 'opted_in'";
                $params = ['ws_id' => $workspaceId];
                
                foreach ($phoneNumbers as $index => $phone) {
                    $params["phone$index"] = $phone;
                }
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                return $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
        }
        
        // Handle tags method
        $sql = "SELECT * FROM sms_recipients WHERE " . str_replace('?', ':ws_id', $scope['sql']) . " AND status = 'active' AND opt_in_status = 'opted_in'";
        $params = ['ws_id' => $workspaceId];

        if ($campaign['recipient_method'] === 'tags' && $campaign['recipient_tags']) {
            $tags = json_decode($campaign['recipient_tags'], true);
            if (!empty($tags)) {
                $tagConditions = [];
                foreach ($tags as $index => $tag) {
                    $tagConditions[] = "tags LIKE :tag$index";
                    $params["tag$index"] = "%$tag%";
                }
                $sql .= ' AND (' . implode(' OR ', $tagConditions) . ')';
            }
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function sendTestSMS() {
        $userId = Auth::userIdOrFail();

        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                Response::error('Invalid JSON input', 400);
                return;
            }

            $phoneNumber = $input['phone'] ?? $input['phone_number'] ?? '';
            $message = $input['message'] ?? '';
            $senderNumber = $input['sender_number'] ?? '';

            if (empty($phoneNumber) || empty($message) || empty($senderNumber)) {
                Response::error('Phone number, message, and sender number are required', 400);
                return;
            }

            // Send test SMS
            $result = $this->smsService->sendMessage($phoneNumber, $message, $senderNumber);

            Response::success([
                'message' => 'Test SMS sent successfully',
                'result' => $result
            ]);
        } catch (Exception $e) {
            Response::error('Failed to send test SMS: ' . $e->getMessage(), 500);
        }
    }

    private function logMessage($campaign, $recipient, $result) {
        try {
            $pdo = Database::conn();
            
            $stmt = $pdo->prepare("
                INSERT INTO sms_messages (
                    campaign_id, recipient_id, message, status, 
                    external_id, cost, sent_at, created_at
                ) VALUES (
                    :campaign_id, :recipient_id, :message, :status,
                    :external_id, :cost, :sent_at, NOW()
                )
            ");
            
            $stmt->execute([
                'campaign_id' => $campaign['id'],
                'recipient_id' => $recipient['id'] ?? null,
                'message' => $campaign['message'],
                'status' => $result['status'] ?? 'unknown',
                'external_id' => $result['id'] ?? null,
                'cost' => $result['cost'] ?? 0,
                'sent_at' => $result['sent_at'] ?? null
            ]);
        } catch (Exception $e) {
            error_log("Failed to log SMS message: " . $e->getMessage());
        }
    }

    public function sendIndividualSMS() {
        $userId = Auth::userIdOrFail();
        
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                Response::error('Invalid JSON input', 400);
                return;
            }

            $phoneNumber = $input['phone'] ?? $input['phone_number'] ?? '';
            $message = $input['message'] ?? '';
            $senderNumber = $input['sender_number'] ?? '';

            if (empty($phoneNumber) || empty($message) || empty($senderNumber)) {
                Response::error('Phone number, message, and sender number are required', 400);
                return;
            }

            // Send individual SMS using SMS service
            $result = $this->smsService->sendMessage($phoneNumber, $message, $senderNumber);

            Response::success([
                'message' => 'SMS sent successfully',
                'status' => $result['status'],
                'external_id' => $result['external_id'] ?? null
            ]);

        } catch (Exception $e) {
            Response::error('Failed to send SMS: ' . $e->getMessage(), 500);
        }
    }

    public function sendTestIndividualSMS() {
        $userId = Auth::userIdOrFail();
        
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                Response::error('Invalid JSON input', 400);
                return;
            }

            $phoneNumber = $input['phone'] ?? $input['phone_number'] ?? '';
            $message = $input['message'] ?? '';
            $senderNumber = $input['sender_number'] ?? '';

            if (empty($phoneNumber) || empty($message) || empty($senderNumber)) {
                Response::error('Phone number, message, and sender number are required', 400);
                return;
            }

            // Send test individual SMS using SMS service
            $result = $this->smsService->sendMessage($phoneNumber, $message, $senderNumber);

            Response::success([
                'message' => 'Test SMS sent successfully',
                'status' => $result['status'],
                'external_id' => $result['external_id'] ?? null
            ]);

        } catch (Exception $e) {
            Response::error('Failed to send test SMS: ' . $e->getMessage(), 500);
        }
    }
}