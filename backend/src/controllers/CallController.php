<?php

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Logger.php';
require_once __DIR__ . '/../services/RBACService.php';

class CallController {

    /**
     * Get workspace scope for queries
     * Returns workspace_id condition if tenantContext exists, otherwise user_id fallback
     */
    private static function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }
    
    /**
     * Get current workspace ID or null
     */
    private static function getWorkspaceId(): ?int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        return ($ctx && isset($ctx->workspaceId)) ? (int)$ctx->workspaceId : null;
    }

    /**
     * Resolve which call dispositions table/schema is present.
     * Some installs use call_disposition_types, others use call_dispositions_types.
     */
    private static function resolveCallDispositionsStorage(PDO $pdo): array {
        try {
            $stmt = $pdo->query("SHOW TABLES LIKE 'call_dispositions_types'");
            if ($stmt->fetchColumn()) {
                $hasWorkspaceId = false;
                $hasUpdatedAt = false;
                $hasIsActive = false;

                $stmt = $pdo->query("SHOW COLUMNS FROM call_dispositions_types LIKE 'workspace_id'");
                $hasWorkspaceId = (bool)$stmt->fetch();
                $stmt = $pdo->query("SHOW COLUMNS FROM call_dispositions_types LIKE 'updated_at'");
                $hasUpdatedAt = (bool)$stmt->fetch();
                $stmt = $pdo->query("SHOW COLUMNS FROM call_dispositions_types LIKE 'is_active'");
                $hasIsActive = (bool)$stmt->fetch();

                return [
                    'table' => 'call_dispositions_types',
                    'has_workspace_id' => $hasWorkspaceId,
                    'has_updated_at' => $hasUpdatedAt,
                    'has_is_active' => $hasIsActive,
                    'schema' => 'plural',
                ];
            }
        } catch (Throwable $e) {
            // ignore and fall back
        }

        $hasWorkspaceId = false;
        $hasIsActive = false;
        try {
            $stmt = $pdo->query("SHOW COLUMNS FROM call_disposition_types LIKE 'workspace_id'");
            $hasWorkspaceId = (bool)$stmt->fetch();
            $stmt = $pdo->query("SHOW COLUMNS FROM call_disposition_types LIKE 'is_active'");
            $hasIsActive = (bool)$stmt->fetch();
        } catch (Throwable $e) {
            // ignore
        }

        return [
            'table' => 'call_disposition_types',
            'has_workspace_id' => $hasWorkspaceId,
            'has_updated_at' => true,
            'has_is_active' => $hasIsActive,
            'schema' => 'singular',
        ];
    }

    private static function normalizeDispositionCategory(?string $category): string {
        $c = strtolower(trim((string)($category ?? '')));
        if ($c === 'callback') return 'follow_up';
        if (in_array($c, ['positive', 'negative', 'neutral', 'follow_up'], true)) return $c;
        return 'neutral';
    }

    private static function mapCallDispositionRow(array $row, array $storage): array {
        $category = self::normalizeDispositionCategory($row['category'] ?? null);
        $createdAt = $row['created_at'] ?? null;
        $updatedAt = $storage['schema'] === 'plural'
            ? ($row['updated_at'] ?? $createdAt)
            : ($row['updated_at'] ?? $createdAt);

        $isActive = true;
        if (isset($row['is_active'])) {
            $isActive = (bool)$row['is_active'];
        }

        return [
            'id' => isset($row['id']) ? (string)$row['id'] : '',
            'name' => $row['name'] ?? '',
            'description' => $row['description'] ?? null,
            'category' => $category,
            'color' => $row['color'] ?? '#6B7280',
            'is_active' => $isActive,
            'isDefault' => isset($row['is_default']) ? (bool)$row['is_default'] : (isset($row['is_system']) ? (bool)$row['is_system'] : false),
            'created_at' => (string)($createdAt ?? ''),
            'updated_at' => (string)($updatedAt ?? ''),
        ];
    }

    /**
     * Get SignalWire credentials from user connections
     */
    private static function getSignalWireCredentials(): ?array {
        $userId = Auth::userId();
        $pdo = Database::conn();
        
        // Get SMS settings which contains the connection data
        $stmt = $pdo->prepare('SELECT data FROM sms_settings WHERE user_id = ? LIMIT 1');
        $stmt->execute([$userId]);
        $row = $stmt->fetch();
        
        if (!$row || empty($row['data'])) {
            return null;
        }
        
        $settings = json_decode($row['data'], true);
        
        // Check if SignalWire connection exists in connections array
        if (isset($settings['connections']) && is_array($settings['connections'])) {
            foreach ($settings['connections'] as $connection) {
                if ($connection['provider'] === 'signalwire' && 
                    !empty($connection['config']['projectId']) &&
                    !empty($connection['config']['spaceUrl']) &&
                    !empty($connection['config']['apiToken'])) {
                    return [
                        'projectId' => $connection['config']['projectId'],
                        'spaceUrl' => $connection['config']['spaceUrl'],
                        'apiToken' => $connection['config']['apiToken']
                    ];
                }
            }
        }
        
        // Fallback to legacy SignalWire settings
        if (!empty($settings['signalwireProjectId']) &&
            !empty($settings['signalwireSpaceUrl']) &&
            !empty($settings['signalwireApiToken'])) {
            return [
                'projectId' => $settings['signalwireProjectId'],
                'spaceUrl' => $settings['signalwireSpaceUrl'],
                'apiToken' => $settings['signalwireApiToken']
            ];
        }
        
        return null;
    }

    public static function getCampaigns(): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!$rbac->hasPermission($userId, 'calls.campaigns.view')) {
            Response::forbidden('You do not have permission to view call campaigns');
            return;
        }
        
        try {
            $pdo = Database::conn();
            $rows = [];
            try {
                $scope = self::getWorkspaceScope();
                $stmt = $pdo->prepare("
                    SELECT c.*, a.name as agent_name 
                    FROM call_campaigns c 
                    LEFT JOIN call_agents a ON c.agent_id = a.id 
                    WHERE c.{$scope['col']} = ? 
                    ORDER BY c.created_at DESC
                ");
                $stmt->execute([$scope['val']]);
                $rows = $stmt->fetchAll();
            } catch (Throwable $e) {
                Response::json([]);
                return;
            }
            $items = array_map(function($c) {
                return [
                    'id' => (string)$c['id'],
                    'name' => $c['name'],
                    'description' => $c['description'] ?? null,
                    'status' => $c['status'] ?? 'draft',
                    'caller_id' => $c['caller_id'] ?? null,
                    'call_provider' => $c['call_provider'] ?? 'signalwire',
                    'call_script' => $c['call_script'] ?? null,
                    'agent_id' => $c['agent_id'] ?? null,
                    'agent_name' => $c['agent_name'] ?? null,
                    'sequence_id' => $c['sequence_id'] ?? null,
                    'group_id' => $c['group_id'] ?? null,
                    'group_name' => $c['group_name'] ?? null,
                    'scheduled_at' => $c['scheduled_at'] ?? null,
                    'created_at' => $c['created_at'],
                    'updated_at' => $c['updated_at'],
                    'recipient_count' => (int)($c['total_recipients'] ?? 0),
                    'completed_calls' => (int)($c['completed_calls'] ?? 0),
                    'successful_calls' => (int)($c['successful_calls'] ?? 0),
                    'failed_calls' => (int)($c['failed_calls'] ?? 0),
                    'answered_calls' => (int)($c['answered_calls'] ?? 0),
                    'voicemail_calls' => (int)($c['voicemail_calls'] ?? 0),
                    'busy_calls' => (int)($c['busy_calls'] ?? 0),
                    'no_answer_calls' => (int)($c['no_answer_calls'] ?? 0)
                ];
            }, $rows ?: []);
            Response::json($items);
        } catch (Exception $e) {
            Response::json([]);
        }
    }

    public static function webhook(): void {
        // This is a simple webhook endpoint that returns basic LaML XML for call handling
        header('Content-Type: application/xml');
        
        $lamlXml = '<?xml version="1.0" encoding="UTF-8"?>';
        $lamlXml .= '<Response>';
        $lamlXml .= '<Say voice="alice">Hello, this is a test call from your softphone. The call is now connected.</Say>';
        $lamlXml .= '<Pause length="60"/>'; // Keep call alive for 60 seconds
        $lamlXml .= '</Response>';
        
        echo $lamlXml;
    }

    public static function getCampaign(string $id): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            $stmt = $pdo->prepare("
                SELECT c.*, a.name as agent_name 
                FROM call_campaigns c 
                LEFT JOIN call_agents a ON c.agent_id = a.id 
                WHERE c.id = ? AND c.{$scope['col']} = ?
            ");
            $stmt->execute([$id, $scope['val']]);
            $c = $stmt->fetch();
            if (!$c) { Response::notFound('Campaign not found'); return; }
            $item = [
                'id' => (string)$c['id'],
                'name' => $c['name'],
                'description' => $c['description'] ?? null,
                'status' => $c['status'] ?? 'draft',
                'caller_id' => $c['caller_id'] ?? null,
                'call_provider' => $c['call_provider'] ?? 'signalwire',
                'call_script' => $c['call_script'] ?? null,
                'agent_id' => $c['agent_id'] ?? null,
                'agent_name' => $c['agent_name'] ?? null,
                'sequence_id' => $c['sequence_id'] ?? null,
                'group_id' => $c['group_id'] ?? null,
                'group_name' => $c['group_name'] ?? null,
                'scheduled_at' => $c['scheduled_at'] ?? null,
                'created_at' => $c['created_at'],
                'updated_at' => $c['updated_at'],
                'recipient_count' => (int)($c['total_recipients'] ?? 0),
                'completed_calls' => (int)($c['completed_calls'] ?? 0),
                'successful_calls' => (int)($c['successful_calls'] ?? 0),
                'failed_calls' => (int)($c['failed_calls'] ?? 0),
                'answered_calls' => (int)($c['answered_calls'] ?? 0),
                'voicemail_calls' => (int)($c['voicemail_calls'] ?? 0),
                'busy_calls' => (int)($c['busy_calls'] ?? 0),
                'no_answer_calls' => (int)($c['no_answer_calls'] ?? 0)
            ];
            Response::json($item);
        } catch (Exception $e) {
            Response::error('Failed to fetch campaign: ' . $e->getMessage(), 500);
        }
    }

    public static function createCampaign(): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!$rbac->hasPermission($userId, 'calls.campaigns.create')) {
            Response::forbidden('You do not have permission to create call campaigns');
            return;
        }
        
        try {
            $b = get_json_body();
            error_log('Create campaign - Raw input: ' . file_get_contents('php://input'));
            error_log('Create campaign - Parsed data: ' . json_encode($b));
            
            if (empty($b['name'])) { 
                error_log('Create campaign - Validation failed: name is required');
                Response::validationError('Campaign name is required'); 
                return; 
            }
            
            $pdo = Database::conn();
            
            // Extract fields with proper mapping
            $name = $b['name'] ?? '';
            $description = $b['description'] ?? null;
            $callerId = $b['caller_id'] ?? $b['callerId'] ?? null;
            $callProvider = $b['call_provider'] ?? $b['callProvider'] ?? 'signalwire';
            $callScript = $b['call_script'] ?? $b['callScript'] ?? null;
            $agentId = $b['agent_id'] ?? $b['agentId'] ?? null;
            $agentName = $b['agent_name'] ?? $b['agentName'] ?? null;
            $status = $b['status'] ?? 'draft';
            
            error_log('Create campaign - Extracted fields: name=' . $name . ', callerId=' . $callerId . ', provider=' . $callProvider);
            
            // Insert the campaign with workspace_id
            $workspaceId = self::getWorkspaceId();
            $stmt = $pdo->prepare('INSERT INTO call_campaigns (user_id, workspace_id, name, description, caller_id, call_provider, call_script, agent_id, agent_name, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
            $stmt->execute([$userId, $workspaceId, $name, $description, $callerId, $callProvider, $callScript, $agentId, $agentName, $status]);
            
            if (!$stmt->rowCount()) {
                error_log('Create campaign - Insert failed: ' . json_encode($stmt->errorInfo()));
                Response::error('Failed to insert campaign', 500);
                return;
            }
            
            $id = (string)$pdo->lastInsertId();
            error_log('Create campaign - Insert successful, ID: ' . $id);
            
            // Get the full campaign data to return
            $scope = self::getWorkspaceScope();
            $stmt = $pdo->prepare("SELECT * FROM call_campaigns WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);
            $campaign = $stmt->fetch();
            
            if (!$campaign) {
                error_log('Create campaign - Failed to retrieve created campaign');
                Response::error('Failed to retrieve created campaign', 500);
                return;
            }
            
            // Return the campaign in the expected format
            $response = [
                'id' => (string)$campaign['id'],
                'name' => $campaign['name'],
                'description' => $campaign['description'],
                'status' => $campaign['status'],
                'caller_id' => $campaign['caller_id'],
                'call_provider' => $campaign['call_provider'],
                'call_script' => $campaign['call_script'],
                'agent_id' => $campaign['agent_id'],
                'agent_name' => $campaign['agent_name'],
                'sequence_id' => $campaign['sequence_id'] ?? null,
                'sequence_mode' => null,
                'group_id' => $campaign['group_id'] ?? null,
                'group_name' => $campaign['group_name'] ?? null,
                'scheduled_at' => $campaign['scheduled_at'],
                'created_at' => $campaign['created_at'],
                'updated_at' => $campaign['updated_at'],
                'recipient_count' => (int)($campaign['total_recipients'] ?? 0),
                'total_recipients' => (int)($campaign['total_recipients'] ?? 0),
                'completed_calls' => (int)($campaign['completed_calls'] ?? 0),
                'successful_calls' => (int)($campaign['successful_calls'] ?? 0),
                'failed_calls' => (int)($campaign['failed_calls'] ?? 0),
                'answered_calls' => (int)($campaign['answered_calls'] ?? 0),
                'voicemail_calls' => (int)($campaign['voicemail_calls'] ?? 0),
                'busy_calls' => (int)($campaign['busy_calls'] ?? 0),
                'no_answer_calls' => (int)($campaign['no_answer_calls'] ?? 0),
                'settings' => [
                    'caller_id' => $campaign['caller_id'] ?? '',
                    'call_timeout' => 30,
                    'voicemail_detection' => true,
                    'recording_enabled' => false,
                    'max_attempts' => 3
                ]
            ];
            
            error_log('Create campaign - Response: ' . json_encode($response));
            Response::json($response, 201);
            
        } catch (Exception $e) {
            error_log('Create campaign error: ' . $e->getMessage());
            Response::error('Failed to create campaign: ' . $e->getMessage(), 500);
        }
    }

    public static function updateCampaign(string $id): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!$rbac->hasPermission($userId, 'calls.campaigns.edit')) {
            Response::forbidden('You do not have permission to edit call campaigns');
            return;
        }
        
        try {
            $b = get_json_body();
            $pdo = Database::conn();
            
            // Extract fields with proper mapping
            $name = $b['name'] ?? null;
            $description = $b['description'] ?? null;
            $callerId = $b['caller_id'] ?? $b['callerId'] ?? null;
            $callProvider = $b['call_provider'] ?? $b['callProvider'] ?? null;
            $callScript = $b['call_script'] ?? $b['callScript'] ?? null;
            $status = $b['status'] ?? null;
            
            // Build the update query dynamically
            $updateFields = [];
            $updateValues = [];
            
            if ($name !== null) {
                $updateFields[] = 'name = ?';
                $updateValues[] = $name;
            }
            if ($description !== null) {
                $updateFields[] = 'description = ?';
                $updateValues[] = $description;
            }
            if ($callerId !== null) {
                $updateFields[] = 'caller_id = ?';
                $updateValues[] = $callerId;
            }
            if ($callProvider !== null) {
                $updateFields[] = 'call_provider = ?';
                $updateValues[] = $callProvider;
            }
            if ($callScript !== null) {
                $updateFields[] = 'call_script = ?';
                $updateValues[] = $callScript;
            }
            if ($status !== null) {
                $updateFields[] = 'status = ?';
                $updateValues[] = $status;
            }
            
            if (empty($updateFields)) {
                Response::validationError('No valid fields to update');
                return;
            }
            
            $updateFields[] = 'updated_at = CURRENT_TIMESTAMP';
            $updateValues[] = $id;
            $updateValues[] = $userId;
            
            $scope = self::getWorkspaceScope();
            $stmt = $pdo->prepare('UPDATE call_campaigns SET ' . implode(', ', $updateFields) . " WHERE id = ? AND {$scope['col']} = ?");
            $updateValues[count($updateValues) - 2] = $id;
            $updateValues[count($updateValues) - 1] = $scope['val'];
            $stmt->execute($updateValues);
            
            // Get the updated campaign data
            $stmt = $pdo->prepare("SELECT * FROM call_campaigns WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);
            $campaign = $stmt->fetch();
            
            if (!$campaign) {
                Response::error('Campaign not found', 404);
                return;
            }
            
            // Return the updated campaign in the expected format
            Response::json([
                'id' => (string)$campaign['id'],
                'name' => $campaign['name'],
                'description' => $campaign['description'],
                'status' => $campaign['status'],
                'caller_id' => $campaign['caller_id'],
                'call_provider' => $campaign['call_provider'],
                'call_script' => $campaign['call_script'],
                'sequence_id' => $campaign['sequence_id'] ?? null,
                'sequence_mode' => null,
                'group_id' => $campaign['group_id'] ?? null,
                'group_name' => $campaign['group_name'] ?? null,
                'scheduled_at' => $campaign['scheduled_at'],
                'created_at' => $campaign['created_at'],
                'updated_at' => $campaign['updated_at'],
                'recipient_count' => (int)($campaign['total_recipients'] ?? 0),
                'total_recipients' => (int)($campaign['total_recipients'] ?? 0),
                'completed_calls' => (int)($campaign['completed_calls'] ?? 0),
                'successful_calls' => (int)($campaign['successful_calls'] ?? 0),
                'failed_calls' => (int)($campaign['failed_calls'] ?? 0),
                'answered_calls' => (int)($campaign['answered_calls'] ?? 0),
                'voicemail_calls' => (int)($campaign['voicemail_calls'] ?? 0),
                'busy_calls' => (int)($campaign['busy_calls'] ?? 0),
                'no_answer_calls' => (int)($campaign['no_answer_calls'] ?? 0),
                'settings' => [
                    'caller_id' => $campaign['caller_id'] ?? '',
                    'call_timeout' => 30,
                    'voicemail_detection' => true,
                    'recording_enabled' => false,
                    'max_attempts' => 3
                ]
            ]);
            
        } catch (Exception $e) {
            error_log('Update campaign error: ' . $e->getMessage());
            Response::error('Failed to update campaign: ' . $e->getMessage(), 500);
        }
    }

    public static function deleteCampaign(string $id): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!$rbac->hasPermission($userId, 'calls.campaigns.delete')) {
            Response::forbidden('You do not have permission to delete call campaigns');
            return;
        }
        
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            $stmt = $pdo->prepare("DELETE FROM call_campaigns WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);
            Response::json(['message' => 'Campaign deleted']);
        } catch (Exception $e) {
            Response::error('Failed to delete campaign: ' . $e->getMessage(), 500);
        }
    }

    public static function createCallRecipient(): void {
        $userId = Auth::userIdOrFail();
        try {
            $b = get_json_body();
            
            // Validate required fields - accept both campaign_id and campaignId
            $campaignId = $b['campaign_id'] ?? $b['campaignId'] ?? null;
            if (empty($campaignId)) {
                Response::validationError('Campaign ID is required');
                return;
            }
            if (empty($b['phone'])) {
                Response::validationError('Phone number is required');
                return;
            }
            
            $pdo = Database::conn();
            
            // Verify campaign access with workspace scoping
            $scope = self::getWorkspaceScope();
            $stmt = $pdo->prepare("SELECT id FROM call_campaigns WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$campaignId, $scope['val']]);
            if (!$stmt->fetch()) {
                Response::error('Campaign not found or access denied', 404);
                return;
            }
            
            // Insert recipient with workspace_id
            $workspaceId = self::getWorkspaceId();
            $stmt = $pdo->prepare('INSERT INTO call_recipients (user_id, workspace_id, campaign_id, first_name, last_name, email, phone_number, company, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
            $stmt->execute([
                $userId,
                $workspaceId,
                $campaignId,
                $b['first_name'] ?? $b['firstName'] ?? null,
                $b['last_name'] ?? $b['lastName'] ?? null,
                $b['email'] ?? null,
                $b['phone'],
                $b['company'] ?? null,
                'pending'
            ]);
            
            $recipientId = (int)$pdo->lastInsertId();
            
            Response::json([
                'id' => $recipientId,
                'campaign_id' => $campaignId,
                'first_name' => $b['first_name'] ?? $b['firstName'] ?? null,
                'last_name' => $b['last_name'] ?? $b['lastName'] ?? null,
                'email' => $b['email'] ?? null,
                'phone' => $b['phone'],
                'company' => $b['company'] ?? null,
                'status' => 'pending',
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ], 201);
            
        } catch (Exception $e) {
            Response::error('Failed to create recipient: ' . $e->getMessage(), 500);
        }
    }

    public static function getCallLogs(): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            $stmt = $pdo->prepare("SELECT * FROM call_logs WHERE {$scope['col']} = ? ORDER BY created_at DESC LIMIT 100");
            $stmt->execute([$scope['val']]);
            $logs = $stmt->fetchAll();
            
            $items = array_map(function($log) {
                return [
                    'id' => (int)$log['id'],
                    'campaign_id' => $log['campaign_id'] ?? null,
                    'recipient_id' => $log['recipient_id'] ?? null,
                    'phone_number' => $log['phone_number'],
                    'status' => $log['status'],
                    'duration' => (int)($log['duration'] ?? 0),
                    'recording_url' => $log['recording_url'] ?? null,
                    'outcome' => $log['outcome'] ?? null,
                    'notes' => $log['notes'] ?? null,
                    'call_cost' => (float)($log['call_cost'] ?? 0),
                    'external_id' => $log['external_id'] ?? null,
                    'error_message' => $log['error_message'] ?? null,
                    'started_at' => $log['started_at'] ?? null,
                    'ended_at' => $log['ended_at'] ?? null,
                    'created_at' => $log['created_at'],
                    'updated_at' => $log['updated_at']
                ];
            }, $logs);
            
            Response::json(['logs' => $items]);
        } catch (Exception $e) {
            Response::error('Failed to fetch call logs: ' . $e->getMessage(), 500);
        }
    }

    public static function getCallLog(string $id): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            $stmt = $pdo->prepare("SELECT * FROM call_logs WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);
            $log = $stmt->fetch();
            if (!$log) { Response::notFound('Call log not found'); return; }
            
            $item = [
                'id' => (int)$log['id'],
                'campaign_id' => $log['campaign_id'] ?? null,
                'recipient_id' => $log['recipient_id'] ?? null,
                'phone_number' => $log['phone_number'],
                'status' => $log['status'],
                'duration' => (int)($log['duration'] ?? 0),
                'recording_url' => $log['recording_url'] ?? null,
                'outcome' => $log['outcome'] ?? null,
                'notes' => $log['notes'] ?? null,
                'call_cost' => (float)($log['call_cost'] ?? 0),
                'external_id' => $log['external_id'] ?? null,
                'error_message' => $log['error_message'] ?? null,
                'started_at' => $log['started_at'] ?? null,
                'ended_at' => $log['ended_at'] ?? null,
                'created_at' => $log['created_at'],
                'updated_at' => $log['updated_at']
            ];
            
            Response::json($item);
        } catch (Exception $e) {
            Response::error('Failed to fetch call log: ' . $e->getMessage(), 500);
        }
    }

    public static function updateCallLog(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        
        try {
            $pdo = Database::conn();
            
            // Verify access with workspace scoping
            $scope = self::getWorkspaceScope();
            $stmt = $pdo->prepare("SELECT id FROM call_logs WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);
            if (!$stmt->fetch()) {
                Response::notFound('Call log not found');
                return;
            }
            
            $updates = [];
            $params = [];
            
            if (isset($body['notes'])) {
                $updates[] = 'notes = ?';
                $params[] = $body['notes'];
            }
            
            if (isset($body['disposition'])) {
                $updates[] = 'outcome = ?';
                $params[] = $body['disposition'];
            }
            
            if (isset($body['outcome'])) {
                $updates[] = 'outcome = ?';
                $params[] = $body['outcome'];
            }
            
            if (empty($updates)) {
                Response::json(['message' => 'No fields to update']);
                return;
            }
            
            $updates[] = 'updated_at = NOW()';
            $params[] = $id;
            $params[] = $userId;
            
            $params[count($params) - 2] = $id;
            $params[count($params) - 1] = $scope['val'];
            $sql = 'UPDATE call_logs SET ' . implode(', ', $updates) . " WHERE id = ? AND {$scope['col']} = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            Response::json(['message' => 'Call log updated successfully']);
        } catch (Exception $e) {
            Response::error('Failed to update call log: ' . $e->getMessage(), 500);
        }
    }

    public static function logCall(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        
        try {
            $pdo = Database::conn();
            
            // Use correct column names matching the database schema
            $stmt = $pdo->prepare('
                INSERT INTO call_logs (
                    user_id, 
                    phone_number, 
                    duration, 
                    disposition, 
                    recording_url, 
                    campaign_id, 
                    recipient_id,
                    status,
                    started_at,
                    ended_at,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
            ');
            
            $stmt->execute([
                $userId,
                $body['phoneNumber'] ?? null,
                $body['duration'] ?? 0,
                $body['outcome'] ?? 'completed',
                $body['recordingUrl'] ?? null,
                $body['campaignId'] ?? null,
                $body['recipientId'] ?? null,
                'completed'
            ]);
            
            $logId = $pdo->lastInsertId();
            
            Response::json([
                'success' => true,
                'message' => 'Call logged successfully',
                'id' => $logId
            ]);
        } catch (Exception $e) {
            error_log('Error logging call: ' . $e->getMessage());
            Response::error('Failed to log call: ' . $e->getMessage(), 500);
        }
    }

    public static function makeCall(): void {
        Auth::userIdOrFail();
        try {
            $data = get_json_body();
            
            // Validate required fields
            if (empty($data['to'])) {
                Response::validationError('Phone number is required');
                return;
            }
            
            $userId = Auth::userId();
            $to = $data['to'];
            $from = $data['from'] ?? null;
            $campaignId = $data['campaign_id'] ?? null;
            $recipientId = $data['recipient_id'] ?? null;
            $record = $data['record'] ?? false;
            
            // Get user's call settings
            $pdo = Database::conn();
            $stmt = $pdo->prepare('SELECT data FROM call_settings WHERE user_id = ? LIMIT 1');
            $stmt->execute([$userId]);
            $row = $stmt->fetch();
            
            // Auto-create default settings if they don't exist
            if (!$row) {
                $defaultSettings = [
                    'provider' => 'signalwire',
                    'defaultCallerId' => '',
                    'callingHoursStart' => '09:00',
                    'callingHoursEnd' => '17:00',
                    'timezone' => 'America/New_York',
                    'maxRetries' => 3,
                    'retryDelay' => 30,
                    'callTimeout' => 30,
                    'recordingEnabled' => true,
                    'voicemailEnabled' => true,
                    'autoDialingEnabled' => false,
                    'callQueueSize' => 10,
                    'workingHoursEnabled' => true,
                    'workingDays' => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                    'callDelay' => 60,
                    'maxCallsPerHour' => 60,
                    'callSpacing' => 5,
                    'dncCheckEnabled' => true,
                    'consentRequired' => true,
                    'autoOptOut' => true,
                    'consentMessage' => "By continuing this call, you consent to receiving calls from our company. To opt out, press 9 or say 'stop calling'."
                ];
                
                $json = json_encode($defaultSettings, JSON_UNESCAPED_SLASHES);
                $insertStmt = $pdo->prepare('INSERT INTO call_settings (user_id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
                $insertStmt->execute([$userId, $json]);
                
                $settings = $defaultSettings;
            } else {
                $settings = json_decode($row['data'] ?? '{}', true);
            }
            
            // Get SignalWire credentials from connections
            $signalWireCreds = self::getSignalWireCredentials();
            if (!$signalWireCreds) {
                Response::error('SignalWire credentials not configured. Please configure SignalWire in the Connections tab.', 400);
                return;
            }
            
            // Prepare SignalWire credentials
            $credentials = [
                'projectId' => $signalWireCreds['projectId'],
                'spaceUrl' => $signalWireCreds['spaceUrl'],
                'apiToken' => $signalWireCreds['apiToken'],
                'defaultCallerId' => $from ?: ($settings['defaultCallerId'] ?? '')
            ];
            
            // Initialize CallService and make the call
            require_once __DIR__ . '/../services/CallService.php';
            $callService = new CallService();
            
            try {
                $result = $callService->makeCall($to, $from, null, 30, $credentials);
                
                
                // Create call log entry - use only core fields that exist in all schemas
                try {
                    $stmt = $pdo->prepare('INSERT INTO call_logs (user_id, phone_number, status, external_id, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
                    $stmt->execute([
                        $userId,
                        $to,
                        'initiated',
                        $result['call_sid']
                    ]);
                } catch (Exception $logError) {
                    // If logging fails, don't fail the call - just log the error
                    error_log('Failed to create call log: ' . $logError->getMessage());
                }
                
                Response::json([
                    'success' => true,
                    'call_sid' => $result['call_sid'],
                    'status' => $result['call_status'],
                    'message' => 'Call initiated successfully',
                    'recordingUrl' => $record ? $result['recording_url'] ?? null : null
                ]);
                
            } catch (Exception $e) {
                // Log the failed call attempt - use only core fields
                try {
                    $stmt = $pdo->prepare('INSERT INTO call_logs (user_id, phone_number, status, error_message, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)');
                    $stmt->execute([
                        $userId,
                        $to,
                        'failed',
                        $e->getMessage()
                    ]);
                } catch (Exception $logError) {
                    error_log('Failed to log failed call: ' . $logError->getMessage());
                }
                
                Response::error('Failed to make call: ' . $e->getMessage(), 500);
            }
            
        } catch (Exception $e) {
            Response::error('Failed to make call: ' . $e->getMessage(), 500);
        }
    }

    public static function endCall(): void {
        Auth::userIdOrFail();
        try {
            $data = get_json_body();
            $callSid = $data['callSid'] ?? null;
            
            if (!$callSid) {
                Response::validationError('Call SID is required');
                return;
            }
            
            // Get user's call settings
            $pdo = Database::conn();
            $stmt = $pdo->prepare('SELECT data FROM call_settings WHERE user_id = ? LIMIT 1');
            $stmt->execute([Auth::userId()]);
            $row = $stmt->fetch();
            
            if (!$row) {
                Response::error('Call settings not configured', 400);
                return;
            }
            
            $settings = json_decode($row['data'] ?? '{}', true);
            
            // Get SignalWire credentials from connections
            $signalWireCreds = self::getSignalWireCredentials();
            if (!$signalWireCreds) {
                Response::error('SignalWire credentials not configured. Please configure SignalWire in the Connections tab.', 400);
                return;
            }
            
            // Prepare SignalWire credentials
            $credentials = [
                'projectId' => $signalWireCreds['projectId'],
                'spaceUrl' => $signalWireCreds['spaceUrl'],
                'apiToken' => $signalWireCreds['apiToken']
            ];
            
            if (empty($credentials['projectId']) || empty($credentials['spaceUrl']) || empty($credentials['apiToken'])) {
                Response::error('SignalWire credentials not configured', 400);
                return;
            }
            
            // Initialize CallService and end the call
            require_once __DIR__ . '/../services/CallService.php';
            $callService = new CallService();
            
            try {
                $result = $callService->endCall($callSid, $credentials);
                
                // Update call log entry
                $stmt = $pdo->prepare('UPDATE call_logs SET status = ?, ended_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE external_id = ? AND user_id = ?');
                $stmt->execute(['completed', $callSid, Auth::userId()]);
                
                Response::json([
                    'success' => true,
                    'message' => 'Call ended successfully',
                    'call_sid' => $callSid
                ]);
                
            } catch (Exception $e) {
                Response::error('Failed to end call: ' . $e->getMessage(), 500);
            }
            
        } catch (Exception $e) {
            Response::error('Failed to end call: ' . $e->getMessage(), 500);
        }
    }

    public static function toggleMute(): void {
        Auth::userIdOrFail();
        try {
            $data = get_json_body();
            $sessionId = $data['sessionId'] ?? null;
            $muted = $data['muted'] ?? false;
            
            if (!$sessionId) {
                Response::validationError('Session ID is required');
                return;
            }
            
            // In a real implementation, this would interact with SignalWire to mute/unmute the call
            // For now, we'll simulate the action
            Response::json([
                'success' => true,
                'muted' => $muted
            ]);
            
        } catch (Exception $e) {
            Response::error('Failed to toggle mute: ' . $e->getMessage(), 500);
        }
    }

    public static function toggleRecording(): void {
        Auth::userIdOrFail();
        try {
            $data = get_json_body();
            $sessionId = $data['sessionId'] ?? null;
            $record = $data['record'] ?? false;
            
            if (!$sessionId) {
                Response::validationError('Session ID is required');
                return;
            }
            
            // In a real implementation, this would interact with SignalWire to start/stop recording
            // For now, we'll simulate the action
            Response::json([
                'success' => true,
                'recording' => $record,
                'recordingUrl' => $record ? 'https://example.com/recording.mp3' : null
            ]);
            
        } catch (Exception $e) {
            Response::error('Failed to toggle recording: ' . $e->getMessage(), 500);
        }
    }

    public static function sendDTMF(): void {
        Auth::userIdOrFail();
        try {
            $data = get_json_body();
            $sessionId = $data['sessionId'] ?? null;
            $digit = $data['digit'] ?? null;
            
            if (!$sessionId || !$digit) {
                Response::validationError('Session ID and digit are required');
                return;
            }
            
            // In a real implementation, this would interact with SignalWire to send DTMF
            // For now, we'll simulate the action
            Response::json([
                'success' => true,
                'digit' => $digit
            ]);
            
        } catch (Exception $e) {
            Response::error('Failed to send DTMF: ' . $e->getMessage(), 500);
        }
    }

    public static function toggleHold(): void {
        Auth::userIdOrFail();
        try {
            $data = get_json_body();
            $sessionId = $data['sessionId'] ?? null;
            $hold = $data['hold'] ?? false;
            
            if (!$sessionId) {
                Response::validationError('Session ID is required');
                return;
            }
            
            // In a real implementation, this would interact with SignalWire to hold/unhold the call
            // For now, we'll simulate the action
            Response::json([
                'success' => true,
                'hold' => $hold
            ]);
            
        } catch (Exception $e) {
            Response::error('Failed to toggle hold: ' . $e->getMessage(), 500);
        }
    }

    public static function transferCall(): void {
        Auth::userIdOrFail();
        try {
            $data = get_json_body();
            $sessionId = $data['sessionId'] ?? null;
            $to = $data['to'] ?? null;
            
            if (!$sessionId || !$to) {
                Response::validationError('Session ID and destination number are required');
                return;
            }
            
            // In a real implementation, this would interact with SignalWire to transfer the call
            // For now, we'll simulate the action
            Response::json([
                'success' => true,
                'transferred_to' => $to
            ]);
            
        } catch (Exception $e) {
            Response::error('Failed to transfer call: ' . $e->getMessage(), 500);
        }
    }

    public static function addToConference(): void {
        Auth::userIdOrFail();
        try {
            $data = get_json_body();
            $sessionId = $data['sessionId'] ?? null;
            $to = $data['to'] ?? null;
            
            if (!$sessionId || !$to) {
                Response::validationError('Session ID and conference number are required');
                return;
            }
            
            // In a real implementation, this would interact with SignalWire to add to conference
            // For now, we'll simulate the action
            Response::json([
                'success' => true,
                'conference_number' => $to
            ]);
            
        } catch (Exception $e) {
            Response::error('Failed to add to conference: ' . $e->getMessage(), 500);
        }
    }

    public static function getDispositionTypes(): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        $isAdmin = $rbac->isAdmin($userId);
        
        try {
            $pdo = Database::conn();
            $storage = self::resolveCallDispositionsStorage($pdo);
            $scope = self::getWorkspaceScope();

            $sql = '';
            $params = [];
            
            if ($isAdmin) {
                // Admins see everything
                $sql = "SELECT * FROM {$storage['table']} ORDER BY sort_order ASC, name ASC";
                $params = [];
            } else if ($storage['schema'] === 'plural') {
                if ($scope['col'] === 'workspace_id') {
                    $sql = "SELECT * FROM {$storage['table']} WHERE (workspace_id = ? OR user_id = ? OR user_id = 0 OR workspace_id IS NULL) ORDER BY sort_order ASC, name ASC";
                    $params = [$scope['val'], $userId];
                } else {
                    $sql = "SELECT * FROM {$storage['table']} WHERE (user_id = ? OR user_id = 0 OR workspace_id IS NULL) ORDER BY sort_order ASC, name ASC";
                    $params = [$scope['val']];
                }
            } else {
                $sql = "SELECT * FROM {$storage['table']} WHERE ({$scope['col']}=? OR user_id=? OR user_id=0) ORDER BY category, name";
                $params = [$scope['val'], $userId];
            }

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();

            $items = array_map(function ($row) use ($storage) {
                return self::mapCallDispositionRow($row, $storage);
            }, $rows ?: []);

            Response::json($items);
        } catch (Exception $e) {
            Response::error('Failed to fetch disposition types: ' . $e->getMessage(), 500);
        }
    }

    public static function createDispositionType(): void {
        $userId = Auth::userIdOrFail();
        try {
            $b = get_json_body();
            if (empty($b['name'])) { Response::validationError('Disposition type name is required'); return; }
            $pdo = Database::conn();
            $storage = self::resolveCallDispositionsStorage($pdo);
            $workspaceId = self::getWorkspaceId();

            $name = $b['name'];
            $description = $b['description'] ?? null;
            $category = self::normalizeDispositionCategory($b['category'] ?? 'neutral');
            $color = $b['color'] ?? '#6B7280';

            if ($storage['schema'] === 'plural') {
                $cols = ['user_id', 'name', 'description', 'category', 'color', 'created_at'];
                $placeholders = ['?', '?', '?', '?', '?', 'CURRENT_TIMESTAMP'];
                $values = [$userId, $name, $description, $category, $color];
                if ($storage['has_workspace_id']) {
                    array_splice($cols, 1, 0, ['workspace_id']);
                    array_splice($placeholders, 1, 0, ['?']);
                    array_splice($values, 1, 0, [$workspaceId]);
                }
                if ($storage['has_is_active']) {
                    $cols[] = 'is_active';
                    $placeholders[] = '1';
                }

                $stmt = $pdo->prepare('INSERT INTO ' . $storage['table'] . ' (' . implode(', ', $cols) . ') VALUES (' . implode(', ', $placeholders) . ')');
                $stmt->execute($values);
            } else {
                if ($storage['has_workspace_id']) {
                    $stmt = $pdo->prepare('INSERT INTO ' . $storage['table'] . ' (user_id, workspace_id, name, description, category, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
                    $stmt->execute([$userId, $workspaceId, $name, $description, $category, $color]);
                } else {
                    $stmt = $pdo->prepare('INSERT INTO ' . $storage['table'] . ' (user_id, name, description, category, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
                    $stmt->execute([$userId, $name, $description, $category, $color]);
                }
            }

            $id = (string)$pdo->lastInsertId();
            $stmt = $pdo->prepare('SELECT * FROM ' . $storage['table'] . ' WHERE id = ?');
            $stmt->execute([$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

            Response::json(self::mapCallDispositionRow($row, $storage), 201);
        } catch (Exception $e) {
            Response::error('Failed to create disposition type: ' . $e->getMessage(), 500);
        }
    }

    public static function getRecipients(): void {
        Auth::userIdOrFail();
        try {
            Response::json(['recipients' => [], 'pagination' => ['page' => 1, 'limit' => 10, 'total' => 0, 'pages' => 0]]);
        } catch (Exception $e) {
            Response::error('Failed to fetch recipients: ' . $e->getMessage(), 500);
        }
    }

    public static function getSettings(): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $userId = Auth::userId();
            
            // Get call settings
            $stmt = $pdo->prepare('SELECT data FROM call_settings WHERE user_id = ? LIMIT 1');
            $stmt->execute([$userId]);
            $row = $stmt->fetch();
            $s = $row ? json_decode($row['data'] ?? '[]', true) : [];
            
            $provider = $s['provider'] ?? 'signalwire';
            
            // Get SignalWire credentials from connections
            $signalWireCreds = self::getSignalWireCredentials();
            $projectId = $signalWireCreds['projectId'] ?? '';
            $spaceUrl = $signalWireCreds['spaceUrl'] ?? '';
            $apiToken = $signalWireCreds['apiToken'] ?? '';
            
            Response::json([
                'provider' => $provider,
                'projectId' => $projectId,
                'spaceUrl' => $spaceUrl,
                'phoneNumber' => $s['defaultCallerId'] ?? '',
                'defaultCallerId' => $s['defaultCallerId'] ?? '',
                'callingHoursStart' => $s['callingHoursStart'] ?? '08:00',
                'callingHoursEnd' => $s['callingHoursEnd'] ?? '22:00',
                'timezone' => $s['timezone'] ?? 'UTC',
                // SIP/VOIP Configuration
                'sipEnabled' => $s['sipEnabled'] ?? false,
                'sipServer' => $s['sipServer'] ?? '',
                'sipPort' => $s['sipPort'] ?? 5060,
                'sipUsername' => $s['sipUsername'] ?? '',
                'sipPassword' => $s['sipPassword'] ?? '',
                'sipDomain' => $s['sipDomain'] ?? '',
                'sipTransport' => $s['sipTransport'] ?? 'udp',
                'stunServer' => $s['stunServer'] ?? 'stun.l.google.com:19302',
                'turnServer' => $s['turnServer'] ?? '',
                'turnUsername' => $s['turnUsername'] ?? '',
                'turnPassword' => $s['turnPassword'] ?? '',
                'webrtcEnabled' => $s['webrtcEnabled'] ?? true,
                'autoAnswer' => $s['autoAnswer'] ?? false,
                'dtmfType' => $s['dtmfType'] ?? 'rfc2833'
            ]);
        } catch (Exception $e) {
            Response::error('Failed to fetch settings: ' . $e->getMessage(), 500);
        }
    }

    public static function updateSettings(): void {
        Auth::userIdOrFail();
        try {
            $b = get_json_body();
            $pdo = Database::conn();
            
            // Get existing settings
            $stmt = $pdo->prepare('SELECT data FROM call_settings WHERE user_id = ? LIMIT 1');
            $stmt->execute([Auth::userId()]);
            $row = $stmt->fetch();
            
            $current = $row ? json_decode($row['data'] ?? '{}', true) : [];
            
            // Update settings
            $fields = [
                'provider', 'signalwireProjectId', 'signalwireSpaceUrl', 'signalwireApiToken',
                'defaultCallerId', 'callingHoursStart', 'callingHoursEnd', 'timezone',
                'sipEnabled', 'sipServer', 'sipPort', 'sipUsername', 'sipPassword',
                'sipDomain', 'sipTransport', 'stunServer', 'turnServer', 'turnUsername',
                'turnPassword', 'webrtcEnabled', 'autoAnswer', 'dtmfType',
                'maxRetries', 'retryDelay', 'callTimeout', 'recordingEnabled',
                'voicemailEnabled', 'autoDialingEnabled', 'callQueueSize',
                'workingHoursEnabled', 'workingDays', 'callDelay', 'maxCallsPerHour',
                'callSpacing', 'dncCheckEnabled', 'consentRequired', 'autoOptOut',
                'consentMessage'
            ];
            
            foreach ($fields as $field) {
                if (array_key_exists($field, $b)) {
                    $current[$field] = $b[$field];
                }
            }
            
            if ($row) {
                $stmt = $pdo->prepare('UPDATE call_settings SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?');
                $stmt->execute([json_encode($current), Auth::userId()]);
            } else {
                $stmt = $pdo->prepare('INSERT INTO call_settings (user_id, data, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
                $stmt->execute([Auth::userId(), json_encode($current)]);
            }
            
            Response::json($current);
        } catch (Exception $e) {
            Response::error('Failed to update settings: ' . $e->getMessage(), 500);
        }
    }

    public static function testSIPConnection(): void {
        Auth::userIdOrFail();
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input || !isset($input['server']) || !isset($input['username'])) {
                Response::error('Server and username are required', 400);
                return;
            }

            $server = $input['server'];
            $port = $input['port'] ?? 5060;
            $username = $input['username'];
            $password = $input['password'] ?? '';
            $domain = $input['domain'] ?? '';
            $transport = $input['transport'] ?? 'udp';

            // Test SIP server connectivity
            $timeout = 5;
            $socket = @fsockopen($transport . '://' . $server, $port, $errno, $errstr, $timeout);
            
            if (!$socket) {
                Response::json([
                    'success' => false,
                    'message' => "Failed to connect to SIP server: $errstr ($errno)"
                ]);
                return;
            }

            fclose($socket);

            // Additional validation could be added here
            // For example, attempting a SIP REGISTER or OPTIONS request
            
            Response::json([
                'success' => true,
                'message' => 'SIP server connection successful',
                'details' => [
                    'server' => $server,
                    'port' => $port,
                    'transport' => $transport,
                    'username' => $username,
                    'domain' => $domain
                ]
            ]);

        } catch (Exception $e) {
            Response::error('SIP connection test failed: ' . $e->getMessage(), 500);
        }
    }

    public static function getStatus(): void {
        Auth::userIdOrFail();
        try {
            $callSid = $_GET['callSid'] ?? null;
            if (!$callSid) {
                Response::validationError('Call SID is required');
                return;
            }

            $pdo = Database::conn();
            $stmt = $pdo->prepare('SELECT status, duration, recording_url FROM call_logs WHERE external_id = ? AND user_id = ?');
            $stmt->execute([$callSid, Auth::userId()]);
            $log = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($log) {
                Response::json([
                    'success' => true,
                    'status' => $log['status'],
                    'duration' => (int)$log['duration'],
                    'recordingUrl' => $log['recording_url']
                ]);
            } else {
                // Not in logs yet? check via API if needed, or return unknown
                Response::json([
                    'success' => true,
                    'status' => 'unknown'
                ]);
            }
        } catch (Exception $e) {
            Response::error('Failed to get status: ' . $e->getMessage(), 500);
        }
    }

    private static function mapCallStatus(string $signalwireStatus): string {
        // Map SignalWire status to our internal status
        $statusMap = [
            'queued' => 'queued',
            'ringing' => 'ringing',
            'in-progress' => 'in-progress',
            'answered' => 'in-progress',
            'completed' => 'completed',
            'busy' => 'busy',
            'failed' => 'failed',
            'no-answer' => 'no-answer',
            'canceled' => 'cancelled'
        ];
        
        return $statusMap[strtolower($signalwireStatus)] ?? $signalwireStatus;
    }

    public static function handleWebhook(): void {
        try {
            // SignalWire sends data in the request body (JSON) or POST parameters
            $data = count($_POST) > 0 ? $_POST : get_json_body();
            
            error_log("Call webhook received: " . json_encode($data));
            
            $callSid = $data['CallSid'] ?? null;
            $callStatus = $data['CallStatus'] ?? null;
            $direction = $data['Direction'] ?? 'outbound-api';
            $duration = $data['CallDuration'] ?? null;
            $recordingUrl = $data['RecordingUrl'] ?? null;

            if (!$callSid) {
                error_log("Invalid webhook data - missing CallSid");
                Response::text("Error: Missing CallSid");
                return;
            }

            // Update call log
            $pdo = Database::conn();
            $stmt = $pdo->prepare('SELECT id, user_id FROM call_logs WHERE external_id = ?');
            $stmt->execute([$callSid]);
            $callLog = $stmt->fetch();

            if ($callLog) {
                $status = self::mapCallStatus($callStatus ?: 'unknown');
                $updates = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
                $params = [$status];

                if ($duration !== null) {
                    $updates[] = 'duration = ?';
                    $params[] = (int)$duration;
                }
                if ($recordingUrl !== null) {
                    $updates[] = 'recording_url = ?';
                    $params[] = $recordingUrl;
                }
                if (in_array($status, ['completed', 'failed', 'busy', 'no-answer'])) {
                    $updates[] = 'ended_at = CURRENT_TIMESTAMP';
                }

                $params[] = $callLog['id'];
                $sql = 'UPDATE call_logs SET ' . implode(', ', $updates) . ' WHERE id = ?';
                $pdo->prepare($sql)->execute($params);
            }

            // SIGNALWIRE VOICE RESPONSE
            // For both inbound AND outbound calls, we need to provide valid LaML if the status requires it
            // (e.g. when answering)
            
            header('Content-Type: application/xml');
            
            if ($direction === 'inbound' && ($callStatus === 'ringing' || $callStatus === 'queued')) {
                // Routing inbound calls to the registered user
                $stmt = $pdo->prepare('SELECT user_id FROM connections WHERE phone_numbers LIKE ? LIMIT 1');
                $stmt->execute(['%' . ($data['To'] ?? '') . '%']);
                $conn = $stmt->fetch();
                $userId = $conn ? $conn['user_id'] : ($callLog['user_id'] ?? null);

                if ($userId) {
                    echo '<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial>
        <User>user_' . $userId . '</User>
    </Dial>
</Response>';
                } else {
                    echo '<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Sorry, this number is not configured.</Say>
</Response>';
                }
            } else if ($direction === 'outbound-api' && ($callStatus === 'in-progress' || $callStatus === 'answered')) {
                // IMPORTANT: For outbound calls initiated via REST API, once the destination answers,
                // SignalWire requests this URL for instructions.
                // We bridge it to the user who started it.
                $userId = $callLog['user_id'] ?? null;
                if ($userId) {
                    echo '<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial>
        <User>user_' . $userId . '</User>
    </Dial>
</Response>';
                } else {
                    echo '<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Connecting...</Say>
    <Pause length="3600"/>
</Response>';
                }
            } else {
                // Default empty response
                echo '<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>';
            }
            exit;

        } catch (Exception $e) {
            error_log("Call webhook error: " . $e->getMessage());
            Response::text("Error: " . $e->getMessage());
        }
    }


    public static function getAnalytics(): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            
            // Get total campaigns
            $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM call_campaigns WHERE {$scope['col']} = ?");
            $stmt->execute([$scope['val']]);
            $totalCampaigns = (int)$stmt->fetchColumn();
            
            // Get total calls
            $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM call_logs WHERE {$scope['col']} = ?");
            $stmt->execute([$scope['val']]);
            $totalCalls = (int)$stmt->fetchColumn();
            
            // Get successful calls (answered)
            $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM call_logs WHERE {$scope['col']} = ? AND status = ?");
            $stmt->execute([$scope['val'], 'answered']);
            $answeredCalls = (int)$stmt->fetchColumn();
            
            // Get missed calls (no-answer, busy, failed)
            $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM call_logs WHERE {$scope['col']} = ? AND status IN (?, ?, ?)");
            $stmt->execute([$scope['val'], 'no-answer', 'busy', 'failed']);
            $missedCalls = (int)$stmt->fetchColumn();
            
            // Get voicemails
            $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM call_logs WHERE {$scope['col']} = ? AND status = ?");
            $stmt->execute([$scope['val'], 'voicemail']);
            $voicemails = (int)$stmt->fetchColumn();
            
            // Get busy calls
            $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM call_logs WHERE {$scope['col']} = ? AND status = ?");
            $stmt->execute([$scope['val'], 'busy']);
            $busyCalls = (int)$stmt->fetchColumn();
            
            // Calculate rates
            $answerRate = $totalCalls > 0 ? round(($answeredCalls / $totalCalls) * 100, 2) : 0;
            
            // Get average call duration
            $stmt = $pdo->prepare("SELECT AVG(duration) as avg_duration FROM call_logs WHERE {$scope['col']} = ? AND duration > 0");
            $stmt->execute([$scope['val']]);
            $avgDuration = (float)$stmt->fetchColumn() ?: 0;
            
            // Get daily stats for the last 30 days
            $stmt = $pdo->prepare("
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as calls,
                    COUNT(CASE WHEN status = ? THEN 1 END) as answered,
                    COUNT(CASE WHEN status = ? THEN 1 END) as missed,
                    COUNT(CASE WHEN status = ? THEN 1 END) as voicemails
                FROM call_logs 
                WHERE {$scope['col']} = ? AND created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
                GROUP BY DATE(created_at)
                ORDER BY date DESC
                LIMIT 30
            ");
            $stmt->execute(['answered', 'no-answer', 'voicemail', $scope['val']]);
            $dailyStats = $stmt->fetchAll();
            
            // Format daily stats
            $formattedDailyStats = array_map(function($stat) {
                return [
                    'date' => $stat['date'],
                    'calls' => (int)$stat['calls'],
                    'answered' => (int)$stat['answered'],
                    'missed' => (int)$stat['missed'],
                    'voicemails' => (int)$stat['voicemails']
                ];
            }, $dailyStats);
            
            // Get top campaigns by call count
            $stmt = $pdo->prepare('
                SELECT 
                    c.id,
                    c.name,
                    COUNT(l.id) as calls,
                    COUNT(CASE WHEN l.status = ? THEN 1 END) as answered,
                    ROUND((COUNT(CASE WHEN l.status = ? THEN 1 END) / COUNT(l.id)) * 100, 2) as conversion_rate
                FROM call_campaigns c
                LEFT JOIN call_logs l ON c.id = l.campaign_id
                WHERE c.user_id = ? AND l.user_id = ?
                GROUP BY c.id, c.name
                ORDER BY calls DESC
                LIMIT 10
            ');
            $stmt->execute(['answered', 'answered', $userId, $userId]);
            $topCampaigns = $stmt->fetchAll();
            
            // Format top campaigns
            $formattedTopCampaigns = array_map(function($campaign) {
                return [
                    'id' => (string)$campaign['id'],
                    'name' => $campaign['name'],
                    'calls' => (int)$campaign['calls'],
                    'answered' => (int)$campaign['answered'],
                    'conversionRate' => (float)$campaign['conversion_rate']
                ];
            }, $topCampaigns);
            
            Response::json([
                'totalCalls' => $totalCalls,
                'answeredCalls' => $answeredCalls,
                'missedCalls' => $missedCalls,
                'voicemails' => $voicemails,
                'busyCalls' => $busyCalls,
                'answerRate' => $answerRate,
                'conversionRate' => $answerRate, // Same as answer rate for calls
                'avgDuration' => $avgDuration,
                'dailyStats' => $formattedDailyStats,
                'topCampaigns' => $formattedTopCampaigns
            ]);
            
        } catch (Exception $e) {
            Response::error('Failed to fetch call analytics: ' . $e->getMessage(), 500);
        }
    }

    public static function getCallRecipients(): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $userId = Auth::userId();
            
            // Get query parameters
            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = max(1, min(100, (int)($_GET['limit'] ?? 10)));
            $offset = ($page - 1) * $limit;
            $campaignId = $_GET['campaign_id'] ?? $_GET['campaignId'] ?? null;
            
            // Build query with workspace scoping
            $scope = self::getWorkspaceScope();
            $whereClause = "{$scope['col']} = ?";
            $params = [$scope['val']];
            
            if ($campaignId) {
                $whereClause .= ' AND campaign_id = ?';
                $params[] = $campaignId;
            }
            
            // Get total count
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM call_recipients WHERE $whereClause");
            $stmt->execute($params);
            $total = (int)$stmt->fetchColumn();
            
            // Get recipients
            $stmt = $pdo->prepare("SELECT * FROM call_recipients WHERE $whereClause ORDER BY created_at DESC LIMIT ? OFFSET ?");
            $stmt->execute(array_merge($params, [$limit, $offset]));
            $recipients = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format recipients
            $formattedRecipients = array_map(function($recipient) {
                return [
                    'id' => (string)$recipient['id'],
                    'campaign_id' => (string)$recipient['campaign_id'],
                    'first_name' => $recipient['first_name'] ?? '',
                    'last_name' => $recipient['last_name'] ?? '',
                    'email' => $recipient['email'] ?? '',
                    'phone' => $recipient['phone_number'] ?? '',
                    'phone_number' => $recipient['phone_number'] ?? '',
                    'company' => $recipient['company'] ?? '',
                    'title' => $recipient['title'] ?? '',
                    'status' => $recipient['status'] ?? 'pending',
                    'notes' => $recipient['notes'] ?? '',
                    'disposition_id' => $recipient['disposition_id'] ?? null,
                    'call_count' => (int)($recipient['call_count'] ?? 0),
                    'last_call_at' => $recipient['last_call_at'] ?? null,
                    'tags' => !empty($recipient['tags']) ? json_decode($recipient['tags'], true) : [],
                    'created_at' => $recipient['created_at'],
                    'updated_at' => $recipient['updated_at']
                ];
            }, $recipients);
            
            Response::json([
                'recipients' => $formattedRecipients,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => ceil($total / $limit)
                ]
            ]);
            
        } catch (Exception $e) {
            Response::error('Failed to fetch call recipients: ' . $e->getMessage(), 500);
        }
    }

    public static function updateCallRecipient(string $id): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            
            // Verify recipient exists and belongs to workspace/user
            $stmt = $pdo->prepare("SELECT id FROM call_recipients WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);
            if (!$stmt->fetch()) {
                Response::error('Recipient not found or access denied', 404);
                return;
            }
            
            $b = get_json_body();
            
            // Build update query
            $updates = [];
            $params = [];
            
            // Handle both snake_case and camelCase field names
            $fieldMappings = [
                'first_name' => ['first_name', 'firstName'],
                'last_name' => ['last_name', 'lastName'],
                'email' => ['email'],
                'phone_number' => ['phone_number', 'phone'],
                'company' => ['company'],
                'title' => ['title'],
                'status' => ['status'],
                'notes' => ['notes'],
                'disposition_id' => ['disposition_id', 'dispositionId'],
                'call_count' => ['call_count', 'callCount'],
                'last_call_at' => ['last_call_at', 'lastCallAt'],
                'tags' => ['tags']
            ];
            
            // Special handling for tags (JSON array)
            if (isset($b['tags'])) {
                $tagsValue = is_array($b['tags']) ? json_encode($b['tags']) : $b['tags'];
                $updates[] = "tags = ?";
                $params[] = $tagsValue;
                // Remove from fieldMappings processing
                unset($fieldMappings['tags']);
            }
            
            foreach ($fieldMappings as $dbField => $inputFields) {
                foreach ($inputFields as $inputField) {
                    if (isset($b[$inputField])) {
                        $updates[] = "$dbField = ?";
                        $params[] = $b[$inputField];
                        break;
                    }
                }
            }
            
            if (empty($updates)) {
                Response::error('No fields to update', 400);
                return;
            }
            
            $scope = self::getWorkspaceScope();
            $params[] = $id;
            $params[] = $scope['val'];
            
            $stmt = $pdo->prepare("UPDATE call_recipients SET " . implode(', ', $updates) . ", updated_at = CURRENT_TIMESTAMP WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute($params);
            
            // Fetch and return the updated recipient
            $stmt = $pdo->prepare("SELECT * FROM call_recipients WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);
            $recipient = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($recipient) {
                $recipient['tags'] = !empty($recipient['tags']) ? json_decode($recipient['tags'], true) : [];
                
                // Debug log to confirm fields are being saved
                error_log('Updated recipient data: ' . json_encode($recipient));
                
                // Trigger follow-up automations if disposition or notes were updated
                if (isset($b['disposition_id']) || isset($b['notes'])) {
                    try {
                        require_once __DIR__ . '/../services/AutomationProcessor.php';
                        
                        // Get trigger data for automation
                        $triggerData = [
                            'recipient_id' => $id,
                            'campaign_id' => $recipient['campaign_id'],
                            'disposition_id' => $recipient['disposition_id'] ?? null,
                            'notes' => $recipient['notes'] ?? null,
                            'updated_fields' => array_keys($b)
                        ];
                        
                        // Trigger call disposition automations
                        if (isset($b['disposition_id']) && !empty($recipient['disposition_id'])) {
                            AutomationProcessor::processTrigger('call', 'disposition_updated', $userId, $triggerData);
                        }
                        
                        // Trigger call notes automations
                        if (isset($b['notes']) && !empty($recipient['notes'])) {
                            AutomationProcessor::processTrigger('call', 'notes_added', $userId, $triggerData);
                        }
                        
                    } catch (Exception $e) {
                        error_log('Failed to trigger automations: ' . $e->getMessage());
                    }
                }
                
                Response::json($recipient);
            } else {
                Response::json(['message' => 'Recipient updated successfully']);
            }
            
        } catch (Exception $e) {
            Response::error('Failed to update recipient: ' . $e->getMessage(), 500);
        }
    }

    public static function deleteCallRecipient(string $id): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            
            // Verify recipient exists and belongs to workspace/user
            $stmt = $pdo->prepare("SELECT id FROM call_recipients WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);
            if (!$stmt->fetch()) {
                Response::error('Recipient not found or access denied', 404);
                return;
            }
            
            $stmt = $pdo->prepare("DELETE FROM call_recipients WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);
            
            Response::json(['message' => 'Recipient deleted successfully']);
            
        } catch (Exception $e) {
            Response::error('Failed to delete recipient: ' . $e->getMessage(), 500);
        }
    }

    // Call Scripts CRUD
    public static function getCallScripts(): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        $isAdmin = $rbac->isAdmin($userId);
        
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            
            if ($isAdmin) {
                // Admins see everything
                $stmt = $pdo->prepare("SELECT * FROM call_scripts ORDER BY created_at DESC");
                $stmt->execute();
            } else if ($scope['col'] === 'workspace_id') {
                // If we have a workspace scope, also include scripts with no workspace or owned by user
                $stmt = $pdo->prepare("SELECT * FROM call_scripts WHERE (workspace_id = ? OR user_id = ? OR workspace_id IS NULL OR user_id = 0) ORDER BY created_at DESC");
                $stmt->execute([$scope['val'], $userId]);
            } else {
                $stmt = $pdo->prepare("SELECT * FROM call_scripts WHERE (user_id = ? OR user_id = 0 OR workspace_id IS NULL) ORDER BY created_at DESC");
                $stmt->execute([$scope['val']]);
            }
            
            $scripts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Parse JSON fields
            foreach ($scripts as &$script) {
                $script['tags'] = !empty($script['tags']) ? json_decode($script['tags'], true) : [];
                $script['variables'] = !empty($script['variables']) ? json_decode($script['variables'], true) : [];
            }
            
            Response::json($scripts);
        } catch (Exception $e) {
            Response::error('Failed to fetch call scripts: ' . $e->getMessage(), 500);
        }
    }

    public static function getCallScript(string $id): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        $isAdmin = $rbac->isAdmin($userId);
        
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            
            if ($isAdmin) {
                $stmt = $pdo->prepare('SELECT * FROM call_scripts WHERE id = ?');
                $stmt->execute([$id]);
            } else if ($scope['col'] === 'workspace_id') {
                $stmt = $pdo->prepare('SELECT * FROM call_scripts WHERE id = ? AND (workspace_id = ? OR user_id = ? OR workspace_id IS NULL OR user_id = 0)');
                $stmt->execute([$id, $scope['val'], $userId]);
            } else {
                $stmt = $pdo->prepare('SELECT * FROM call_scripts WHERE id = ? AND (user_id = ? OR user_id = 0 OR workspace_id IS NULL)');
                $stmt->execute([$id, $scope['val']]);
            }
            
            $script = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$script) {
                Response::error('Script not found', 404);
                return;
            }
            
            // Parse JSON fields
            $script['tags'] = !empty($script['tags']) ? json_decode($script['tags'], true) : [];
            $script['variables'] = !empty($script['variables']) ? json_decode($script['variables'], true) : [];
            
            Response::json($script);
        } catch (Exception $e) {
            Response::error('Failed to fetch call script: ' . $e->getMessage(), 500);
        }
    }

    public static function createCallScript(): void {
        Auth::userIdOrFail();
        try {
            $b = get_json_body();
            if (empty($b['name']) || empty($b['script'])) {
                Response::validationError('Script name and content are required');
                return;
            }
            
            $pdo = Database::conn();
            $userId = Auth::userId();
            $workspaceId = self::getWorkspaceId();
            
            $tags = isset($b['tags']) ? json_encode($b['tags']) : json_encode([]);
            $variables = isset($b['variables']) ? json_encode($b['variables']) : json_encode([]);
            
            $stmt = $pdo->prepare('INSERT INTO call_scripts (user_id, workspace_id, name, description, script, category, tags, variables, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
            $stmt->execute([
                $userId,
                $workspaceId,
                $b['name'],
                $b['description'] ?? null,
                $b['script'],
                $b['category'] ?? 'general',
                $tags,
                $variables
            ]);
            
            $scriptId = $pdo->lastInsertId();
            
            // Fetch the created script
            $stmt = $pdo->prepare('SELECT * FROM call_scripts WHERE id = ?');
            $stmt->execute([$scriptId]);
            $script = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Parse JSON fields
            $script['tags'] = json_decode($script['tags'], true);
            $script['variables'] = json_decode($script['variables'], true);
            
            Response::json($script, 201);
        } catch (Exception $e) {
            Response::error('Failed to create call script: ' . $e->getMessage(), 500);
        }
    }

    public static function updateCallScript(string $id): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        $isAdmin = $rbac->isAdmin($userId);
        
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            $b = get_json_body();
            
            // Verify script exists and belongs to user or workspace
            if ($isAdmin) {
                $stmt = $pdo->prepare('SELECT id FROM call_scripts WHERE id = ?');
                $stmt->execute([$id]);
            } else if ($scope['col'] === 'workspace_id') {
                $stmt = $pdo->prepare('SELECT id FROM call_scripts WHERE id = ? AND (workspace_id = ? OR user_id = ?)');
                $stmt->execute([$id, $scope['val'], $userId]);
            } else {
                $stmt = $pdo->prepare('SELECT id FROM call_scripts WHERE id = ? AND user_id = ?');
                $stmt->execute([$id, $userId]);
            }
            
            if (!$stmt->fetch()) {
                Response::error('Script not found or access denied', 404);
                return;
            }
            
            $updates = [];
            $params = [];
            
            $fields = ['name', 'description', 'script', 'category'];
            foreach ($fields as $field) {
                if (isset($b[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $b[$field];
                }
            }
            
            // Handle JSON fields
            if (isset($b['tags'])) {
                $updates[] = "tags = ?";
                $params[] = json_encode($b['tags']);
            }
            if (isset($b['variables'])) {
                $updates[] = "variables = ?";
                $params[] = json_encode($b['variables']);
            }
            
            if (empty($updates)) {
                Response::error('No fields to update', 400);
                return;
            }
            
            $params[] = $id;
            
            $stmt = $pdo->prepare('UPDATE call_scripts SET ' . implode(', ', $updates) . ', updated_at = CURRENT_TIMESTAMP WHERE id = ?');
            $stmt->execute($params);
            
            // Fetch updated script
            $stmt = $pdo->prepare('SELECT * FROM call_scripts WHERE id = ?');
            $stmt->execute([$id]);
            $script = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Parse JSON fields
            $script['tags'] = json_decode($script['tags'], true);
            $script['variables'] = json_decode($script['variables'], true);
            
            Response::json($script);
        } catch (Exception $e) {
            Response::error('Failed to update call script: ' . $e->getMessage(), 500);
        }
    }

    public static function deleteCallScript(string $id): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        $isAdmin = $rbac->isAdmin($userId);
        
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            
            // Verify script exists and belongs to user or workspace
            if ($isAdmin) {
                $stmt = $pdo->prepare('SELECT id FROM call_scripts WHERE id = ?');
                $stmt->execute([$id]);
            } else if ($scope['col'] === 'workspace_id') {
                $stmt = $pdo->prepare('SELECT id FROM call_scripts WHERE id = ? AND (workspace_id = ? OR user_id = ?)');
                $stmt->execute([$id, $scope['val'], $userId]);
            } else {
                $stmt = $pdo->prepare('SELECT id FROM call_scripts WHERE id = ? AND user_id = ?');
                $stmt->execute([$id, $userId]);
            }
            
            if (!$stmt->fetch()) {
                Response::error('Script not found or access denied', 404);
                return;
            }
            
            $stmt = $pdo->prepare('DELETE FROM call_scripts WHERE id = ?');
            $stmt->execute([$id]);
            
            Response::json(['message' => 'Script deleted successfully']);
        } catch (Exception $e) {
            Response::error('Failed to delete call script: ' . $e->getMessage(), 500);
        }
    }

    // Disposition Update/Delete
    public static function updateCallDisposition(string $id): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        $isAdmin = $rbac->isAdmin($userId);
        
        try {
            $pdo = Database::conn();
            $b = get_json_body();

            $storage = self::resolveCallDispositionsStorage($pdo);
            $scope = self::getWorkspaceScope();
            
            // Verify disposition exists and belongs to user or workspace
            if ($isAdmin) {
                $stmt = $pdo->prepare('SELECT * FROM ' . $storage['table'] . ' WHERE id = ?');
                $stmt->execute([$id]);
            } else if ($storage['schema'] === 'plural') {
                if ($scope['col'] === 'workspace_id' && $storage['has_workspace_id']) {
                    $stmt = $pdo->prepare('SELECT * FROM ' . $storage['table'] . ' WHERE id = ? AND (user_id = ? OR workspace_id = ?)');
                    $stmt->execute([$id, $userId, $scope['val']]);
                } else {
                    $stmt = $pdo->prepare('SELECT * FROM ' . $storage['table'] . ' WHERE id = ? AND user_id = ?');
                    $stmt->execute([$id, $userId]);
                }
            } else {
                $stmt = $pdo->prepare('SELECT * FROM ' . $storage['table'] . ' WHERE id = ? AND user_id = ?');
                $stmt->execute([$id, $userId]);
            }

            $existing = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$existing) {
                Response::error('Disposition not found or access denied', 404);
                return;
            }
            
            $updates = [];
            $params = [];
            
            $fields = ['name', 'description', 'category', 'color', 'is_active'];
            foreach ($fields as $field) {
                if (isset($b[$field])) {
                    if ($field === 'category') {
                        $updates[] = "$field = ?";
                        $params[] = self::normalizeDispositionCategory($b[$field]);
                        continue;
                    }
                    $updates[] = "$field = ?";
                    $params[] = $b[$field];
                }
            }
            
            if (empty($updates)) {
                Response::error('No fields to update', 400);
                return;
            }
            
            $params[] = $id;

            $sql = 'UPDATE ' . $storage['table'] . ' SET ' . implode(', ', $updates);
            if ($storage['has_updated_at']) {
                $sql .= ', updated_at = CURRENT_TIMESTAMP';
            }
            $sql .= ' WHERE id = ?';

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            // Return updated row
            $stmt = $pdo->prepare('SELECT * FROM ' . $storage['table'] . ' WHERE id = ?');
            $stmt->execute([$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: ($existing ?: []);

            Response::json(self::mapCallDispositionRow($row, $storage));
        } catch (Exception $e) {
            Response::error('Failed to update disposition: ' . $e->getMessage(), 500);
        }
    }

    public static function deleteCallDisposition(string $id): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        $isAdmin = $rbac->isAdmin($userId);
        
        try {
            $pdo = Database::conn();
            $storage = self::resolveCallDispositionsStorage($pdo);
            $scope = self::getWorkspaceScope();
            
            // Verify disposition exists and belongs to user or workspace
            if ($isAdmin) {
                $stmt = $pdo->prepare('SELECT id FROM ' . $storage['table'] . ' WHERE id = ?');
                $stmt->execute([$id]);
            } else if ($storage['schema'] === 'plural') {
                if ($scope['col'] === 'workspace_id' && $storage['has_workspace_id']) {
                    $stmt = $pdo->prepare('SELECT id FROM ' . $storage['table'] . ' WHERE id = ? AND (user_id = ? OR workspace_id = ?)');
                    $stmt->execute([$id, $userId, $scope['val']]);
                } else {
                    $stmt = $pdo->prepare('SELECT id FROM ' . $storage['table'] . ' WHERE id = ? AND user_id = ?');
                    $stmt->execute([$id, $userId]);
                }
            } else {
                $stmt = $pdo->prepare('SELECT id FROM ' . $storage['table'] . ' WHERE id = ? AND user_id = ?');
                $stmt->execute([$id, $userId]);
            }
            if (!$stmt->fetch()) {
                Response::error('Disposition not found or access denied', 404);
                return;
            }
            
            $stmt = $pdo->prepare('DELETE FROM ' . $storage['table'] . ' WHERE id = ?');
            $stmt->execute([$id]);
            
            Response::json(['success' => true]);
        } catch (Exception $e) {
            Response::error('Failed to delete disposition: ' . $e->getMessage(), 500);
        }
    }
}