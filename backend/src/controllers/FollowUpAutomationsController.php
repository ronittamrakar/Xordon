<?php
/**
 * Follow-up Automations Controller
 * Manages outcome-based automation rules for email, SMS, and calls
 */

require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../services/SentimentAnalyzer.php';
require_once __DIR__ . '/../services/IntentDetector.php';
require_once __DIR__ . '/../services/SemanticMatcher.php';
require_once __DIR__ . '/../services/TriggerEvaluator.php';
require_once __DIR__ . '/../services/AutomationQueueProcessor.php';
require_once __DIR__ . '/../services/SimpleMail.php';
require_once __DIR__ . '/../services/SMSService.php';
require_once __DIR__ . '/../services/TelephonyConfig.php';

class FollowUpAutomationsController {

    private static function getWorkspaceIdFromContext(): ?int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        return null;
    }

    /**
     * Returns SQL fragments/params to scope automations.
     * If workspace context is available, scope to all users in that workspace via workspace_members.
     * Otherwise fall back to legacy user_id scoping.
     */
    private static function automationScopeSql(string $alias = ''): array {
        $prefix = $alias ? $alias . '.' : '';
        $workspaceId = self::getWorkspaceIdFromContext();
        if ($workspaceId !== null) {
            return [
                'join' => 'JOIN workspace_members wm ON wm.user_id = ' . $prefix . 'user_id AND wm.workspace_id = ?',
                'where' => '1=1',
                'params' => [$workspaceId],
            ];
        }
        return [
            'join' => '',
            'where' => $prefix . 'user_id = ?',
            'params' => [Auth::userIdOrFail()],
        ];
    }
    
    // Valid trigger types by channel - now includes sentiment/intent-based triggers
    private static $triggerTypes = [
        'email' => [
            'email_opened' => 'Email Opened',
            'email_clicked' => 'Link Clicked',
            'email_replied' => 'Email Replied',
            'email_replied_positive' => 'Positive Reply Received',
            'email_replied_negative' => 'Negative Reply Received',
            'email_replied_neutral' => 'Neutral Reply Received',
            'email_bounced' => 'Email Bounced',
            'email_unsubscribed' => 'Unsubscribed',
            // New sentiment-based triggers
            'sentiment_positive' => 'Sentiment: Positive (Analyzed)',
            'sentiment_negative' => 'Sentiment: Negative (Analyzed)',
            'sentiment_neutral' => 'Sentiment: Neutral (Analyzed)',
            // New intent-based triggers
            'intent_purchase' => 'Intent: Purchase Interest',
            'intent_complaint' => 'Intent: Complaint Detected',
            'intent_question' => 'Intent: Question Asked',
        ],
        'sms' => [
            'sms_delivered' => 'SMS Delivered',
            'sms_replied' => 'SMS Replied',
            'sms_replied_positive' => 'Positive Reply Received',
            'sms_replied_negative' => 'Negative Reply Received',
            'sms_replied_keyword' => 'Reply Contains Keyword',
            'sms_clicked' => 'Link Clicked',
            'sms_failed' => 'SMS Failed',
            'sms_opted_out' => 'Opted Out',
            // New sentiment-based triggers
            'sentiment_positive' => 'Sentiment: Positive (Analyzed)',
            'sentiment_negative' => 'Sentiment: Negative (Analyzed)',
            'sentiment_neutral' => 'Sentiment: Neutral (Analyzed)',
            // New intent-based triggers
            'intent_purchase' => 'Intent: Purchase Interest',
            'intent_opt_out' => 'Intent: Opt-Out Detected',
            'intent_callback' => 'Intent: Callback Request',
        ],
        'call' => [
            'call_answered' => 'Call Answered',
            'call_voicemail' => 'Voicemail Left',
            'call_no_answer' => 'No Answer',
            'call_busy' => 'Line Busy',
            'call_failed' => 'Call Failed',
            'disposition_interested' => 'Disposition: Interested',
            'disposition_not_interested' => 'Disposition: Not Interested',
            'disposition_callback' => 'Disposition: Callback Requested',
            'disposition_voicemail' => 'Disposition: Left Voicemail',
            'disposition_no_answer' => 'Disposition: No Answer',
            'disposition_busy' => 'Disposition: Busy',
            'disposition_wrong_number' => 'Disposition: Wrong Number',
            'disposition_dnc' => 'Disposition: Do Not Call',
            'disposition_appointment' => 'Disposition: Appointment Set',
            'disposition_sale' => 'Disposition: Sale Made',
            'disposition_custom' => 'Disposition: Custom (specify)',
            'outcome_positive' => 'Outcome: Positive Sentiment',
            'outcome_negative' => 'Outcome: Negative Sentiment',
            'outcome_neutral' => 'Outcome: Neutral Sentiment',
            'notes_contain' => 'Notes Contain Keyword',
            // New sentiment-based triggers
            'sentiment_positive' => 'Sentiment: Positive (Analyzed)',
            'sentiment_negative' => 'Sentiment: Negative (Analyzed)',
            'sentiment_neutral' => 'Sentiment: Neutral (Analyzed)',
            // New intent-based triggers
            'intent_purchase' => 'Intent: Purchase Interest',
            'intent_callback' => 'Intent: Callback Request',
            'intent_complaint' => 'Intent: Complaint Detected',
            'intent_objection' => 'Intent: Objection Raised',
            // Semantic disposition matching
            'semantic_positive_outcome' => 'Semantic: Positive Outcome',
            'semantic_negative_outcome' => 'Semantic: Negative Outcome',
            'semantic_needs_followup' => 'Semantic: Needs Follow-up',
            'semantic_qualified_lead' => 'Semantic: Qualified Lead',
            // Combined conditions
            'combined_conditions' => 'Combined Conditions (AND/OR)',
        ],
        'form' => [
            'form_submitted' => 'Form Submitted',
            'form_field_value' => 'Form Field Has Value',
        ],
        'whatsapp' => [
            'message_received' => 'Message Received',
            'message_sent' => 'Message Sent',
            'message_delivered' => 'Message Delivered',
            'message_read' => 'Message Read',
            'message_failed' => 'Message Failed',
            'opted_out' => 'Contact Opted Out',
            'template_sent' => 'Template Message Sent',
            'sentiment_positive' => 'Sentiment: Positive',
            'sentiment_negative' => 'Sentiment: Negative',
            'intent_purchase' => 'Intent: Purchase Interest',
            'intent_support' => 'Intent: Support Request',
        ],
        'messenger' => [
            'message_received' => 'Message Received',
            'message_sent' => 'Message Sent',
            'message_delivered' => 'Message Delivered',
            'message_read' => 'Message Read',
            'postback' => 'Button/Postback Clicked',
            'sentiment_positive' => 'Sentiment: Positive',
            'sentiment_negative' => 'Sentiment: Negative',
            'intent_purchase' => 'Intent: Purchase Interest',
            'intent_support' => 'Intent: Support Request',
        ],
        'linkedin' => [
            'task_created' => 'Task Created',
            'task_completed' => 'Task Completed',
            'task_overdue' => 'Task Overdue',
            'lead_synced' => 'Lead Synced from Form',
            'connection_accepted' => 'Connection Accepted',
            'message_replied' => 'Message Replied',
        ],
        'appointment' => [
            'appointment_booked' => 'Appointment Booked',
            'appointment_confirmed' => 'Appointment Confirmed',
            'appointment_cancelled' => 'Appointment Cancelled',
            'appointment_rescheduled' => 'Appointment Rescheduled',
            'appointment_completed' => 'Appointment Completed',
            'appointment_no_show' => 'Appointment No-Show',
            'appointment_reminder_due' => 'Reminder Due (24h before)',
            'appointment_starting_soon' => 'Starting Soon (1h before)',
            'appointment_followup_due' => 'Follow-up Due (after completion)',
        ],
    ];
    
    // Condition types for advanced filtering
    private static $conditionTypes = [
        'disposition_id' => 'Specific Disposition',
        'disposition_category' => 'Disposition Category',
        'sentiment' => 'Sentiment',
        'notes_keyword' => 'Notes Contain Keyword',
        'reply_keyword' => 'Reply Contains Keyword',
        'call_duration_min' => 'Minimum Call Duration (seconds)',
        'call_duration_max' => 'Maximum Call Duration (seconds)',
        'response_time_hours' => 'Response Within Hours',
        'link_url_contains' => 'Clicked Link Contains',
        'form_field' => 'Form Field Value',
    ];
    
    // Valid action types
    private static $actionTypes = [
        'send_email' => 'Send Email',
        'send_sms' => 'Send SMS',
        'schedule_call' => 'Schedule Call',
        'schedule_appointment' => 'Schedule Appointment',
        'send_booking_link' => 'Send Booking Link',
        'add_tag' => 'Add Tag',
        'remove_tag' => 'Remove Tag',
        'move_to_campaign' => 'Move to Campaign',
        'update_status' => 'Update Contact Status',
        'notify_user' => 'Send Notification',
        'webhook' => 'Trigger Webhook',
        'add_to_sequence' => 'Add to Sequence',
        'remove_from_sequence' => 'Remove from Sequence',
        // WhatsApp actions
        'send_whatsapp_template' => 'Send WhatsApp Template',
        'send_whatsapp_message' => 'Send WhatsApp Message',
        // Messenger actions
        'send_messenger_message' => 'Send Messenger Message',
        'send_messenger_quick_replies' => 'Send Messenger Quick Replies',
        // LinkedIn actions
        'create_linkedin_task' => 'Create LinkedIn Task',
        'assign_linkedin_template' => 'Assign LinkedIn Template',
    ];
    
    /**
     * Get all automations for the user
     */
    public static function index(): void {
        $pdo = Database::conn();

        $channel = $_GET['channel'] ?? null;
        $isActive = isset($_GET['is_active']) ? $_GET['is_active'] === 'true' : null;

        $scope = self::automationScopeSql('fa');
        $sql = 'SELECT fa.* FROM followup_automations fa ' . $scope['join'] . ' WHERE ' . $scope['where'];
        $params = $scope['params'];
        
        if ($channel) {
            $sql .= ' AND fa.channel = ?';
            $params[] = $channel;
        }
        
        if ($isActive !== null) {
            $sql .= ' AND fa.is_active = ?';
            $params[] = $isActive ? 1 : 0;
        }

        $sql .= ' ORDER BY fa.priority DESC, fa.created_at DESC';
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $automations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json([
            'automations' => array_map([self::class, 'mapAutomation'], $automations),
            'trigger_types' => self::$triggerTypes,
            'action_types' => self::$actionTypes,
        ]);
    }
    
    /**
     * Get a single automation
     */
    public static function show(string $id): void {
        $pdo = Database::conn();

        $scope = self::automationScopeSql('fa');
        $stmt = $pdo->prepare('SELECT fa.* FROM followup_automations fa ' . $scope['join'] . ' WHERE fa.id = ? AND ' . $scope['where']);
        $stmt->execute(array_merge([(int)$id], $scope['params']));
        $automation = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$automation) {
            Response::error('Automation not found', 404);
        }
        
        // Get execution stats
        $stmt = $pdo->prepare('
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = "executed" THEN 1 ELSE 0 END) as executed,
                SUM(CASE WHEN status = "failed" THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending
            FROM automation_executions 
            WHERE automation_id = ?
        ');
        $stmt->execute([$id]);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $result = self::mapAutomation($automation);
        $result['stats'] = $stats;
        
        Response::json(['automation' => $result]);
    }
    
    /**
     * Create a new automation
     */
    public static function create(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        
        // Validate required fields
        $name = trim($body['name'] ?? '');
        $channel = $body['channel'] ?? '';
        $triggerType = $body['trigger_type'] ?? '';
        $actionType = $body['action_type'] ?? '';
        $actionConfig = $body['action_config'] ?? [];
        
        if (!$name) Response::error('Name is required', 422);
        if (!$channel) Response::error('Channel is required', 422);
        if (!$triggerType) Response::error('Trigger type is required', 422);
        if (!$actionType) Response::error('Action type is required', 422);
        
        // Validate channel
        if (!isset(self::$triggerTypes[$channel])) {
            Response::error('Invalid channel', 422);
        }
        
        // Validate trigger type for channel
        if (!isset(self::$triggerTypes[$channel][$triggerType])) {
            Response::error('Invalid trigger type for channel', 422);
        }
        
        // Validate action type
        if (!isset(self::$actionTypes[$actionType])) {
            Response::error('Invalid action type', 422);
        }
        
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            INSERT INTO followup_automations 
            (user_id, name, description, channel, trigger_type, trigger_conditions, action_type, action_config, delay_amount, delay_unit, is_active, priority, campaign_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ');
        
        $stmt->execute([
            $userId,
            $name,
            $body['description'] ?? null,
            $channel,
            $triggerType,
            json_encode($body['trigger_conditions'] ?? []),
            $actionType,
            json_encode($actionConfig),
            (int)($body['delay_amount'] ?? 0),
            $body['delay_unit'] ?? 'minutes',
            isset($body['is_active']) ? ($body['is_active'] ? 1 : 0) : 1,
            (int)($body['priority'] ?? 0),
            $body['campaign_id'] ?? null,
        ]);
        
        $id = $pdo->lastInsertId();
        
        $stmt = $pdo->prepare('SELECT * FROM followup_automations WHERE id = ?');
        $stmt->execute([$id]);
        $automation = $stmt->fetch(PDO::FETCH_ASSOC);
        
        Response::json(['automation' => self::mapAutomation($automation)], 201);
    }
    
    /**
     * Update an automation
     */
    public static function update(string $id): void {
        $body = get_json_body();
        $pdo = Database::conn();

        // Check ownership
        $scope = self::automationScopeSql('fa');
        $stmt = $pdo->prepare('SELECT fa.* FROM followup_automations fa ' . $scope['join'] . ' WHERE fa.id = ? AND ' . $scope['where']);
        $stmt->execute(array_merge([(int)$id], $scope['params']));
        if (!$stmt->fetch()) {
            Response::error('Automation not found', 404);
        }
        
        $updates = [];
        $params = [];
        
        $allowedFields = ['name', 'description', 'trigger_conditions', 'action_config', 'delay_amount', 'delay_unit', 'is_active', 'priority', 'campaign_id'];
        
        foreach ($allowedFields as $field) {
            if (isset($body[$field])) {
                $value = $body[$field];
                
                if (in_array($field, ['trigger_conditions', 'action_config'])) {
                    $value = json_encode($value);
                } elseif ($field === 'is_active') {
                    $value = $value ? 1 : 0;
                } elseif (in_array($field, ['delay_amount', 'priority'])) {
                    $value = (int)$value;
                }
                
                $updates[] = "$field = ?";
                $params[] = $value;
            }
        }
        
        if (empty($updates)) {
            Response::error('No fields to update', 422);
        }
        
        $updates[] = 'updated_at = CURRENT_TIMESTAMP';
        $params[] = $id;
        
        $sql = 'UPDATE followup_automations SET ' . implode(', ', $updates) . ' WHERE id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        $stmt = $pdo->prepare('SELECT * FROM followup_automations WHERE id = ?');
        $stmt->execute([$id]);
        $automation = $stmt->fetch(PDO::FETCH_ASSOC);
        
        Response::json(['automation' => self::mapAutomation($automation)]);
    }
    
    /**
     * Delete an automation
     */
    public static function delete(string $id): void {
        $pdo = Database::conn();

        $scope = self::automationScopeSql('fa');
        $stmt = $pdo->prepare('SELECT fa.* FROM followup_automations fa ' . $scope['join'] . ' WHERE fa.id = ? AND ' . $scope['where']);
        $stmt->execute(array_merge([(int)$id], $scope['params']));
        if (!$stmt->fetch()) {
            Response::error('Automation not found', 404);
        }
        
        $stmt = $pdo->prepare('DELETE FROM followup_automations WHERE id = ?');
        $stmt->execute([$id]);
        
        Response::json(['success' => true]);
    }
    
    /**
     * Toggle automation active status
     */
    public static function toggle(string $id): void {
        $pdo = Database::conn();

        $scope = self::automationScopeSql('fa');
        $stmt = $pdo->prepare('SELECT fa.is_active FROM followup_automations fa ' . $scope['join'] . ' WHERE fa.id = ? AND ' . $scope['where']);
        $stmt->execute(array_merge([(int)$id], $scope['params']));
        $automation = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$automation) {
            Response::error('Automation not found', 404);
        }
        
        $newStatus = $automation['is_active'] ? 0 : 1;
        
        $stmt = $pdo->prepare('UPDATE followup_automations SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmt->execute([$newStatus, $id]);
        
        Response::json(['is_active' => (bool)$newStatus]);
    }
    
    /**
     * Get automation execution history
     */
    public static function executions(string $id): void {
        $pdo = Database::conn();

        // Verify ownership
        $scope = self::automationScopeSql('fa');
        $stmt = $pdo->prepare('SELECT fa.* FROM followup_automations fa ' . $scope['join'] . ' WHERE fa.id = ? AND ' . $scope['where']);
        $stmt->execute(array_merge([(int)$id], $scope['params']));
        if (!$stmt->fetch()) {
            Response::error('Automation not found', 404);
        }
        
        $limit = min((int)($_GET['limit'] ?? 50), 100);
        $offset = (int)($_GET['offset'] ?? 0);
        
        $stmt = $pdo->prepare('
            SELECT ae.*, c.email, c.first_name, c.last_name
            FROM automation_executions ae
            LEFT JOIN contacts c ON ae.contact_id = c.id
            WHERE ae.automation_id = ?
            ORDER BY ae.created_at DESC
            LIMIT ? OFFSET ?
        ');
        $stmt->execute([$id, $limit, $offset]);
        $executions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json([
            'executions' => array_map(function($e) {
                return [
                    'id' => (string)$e['id'],
                    'contact' => [
                        'id' => (string)$e['contact_id'],
                        'email' => $e['email'],
                        'name' => trim(($e['first_name'] ?? '') . ' ' . ($e['last_name'] ?? '')),
                    ],
                    'trigger_event' => $e['trigger_event'],
                    'trigger_data' => json_decode($e['trigger_data'], true),
                    'action_result' => json_decode($e['action_result'], true),
                    'status' => $e['status'],
                    'scheduled_at' => $e['scheduled_at'],
                    'executed_at' => $e['executed_at'],
                    'error_message' => $e['error_message'],
                    'created_at' => $e['created_at'],
                ];
            }, $executions),
        ]);
    }
    
    /**
     * Get available trigger types, action types, and dispositions
     */
    public static function options(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Get available dispositions
        $stmt = $pdo->prepare('
            SELECT * FROM call_dispositions_types 
            WHERE (user_id = ? OR user_id = 0) AND is_active = 1
            ORDER BY sort_order ASC
        ');
        $stmt->execute([$userId]);
        $dispositions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json([
            'trigger_types' => self::$triggerTypes,
            'action_types' => self::$actionTypes,
            'condition_types' => self::$conditionTypes,
            'delay_units' => [
                'minutes' => 'Minutes',
                'hours' => 'Hours',
                'days' => 'Days',
            ],
            'sentiments' => [
                'positive' => 'Positive',
                'neutral' => 'Neutral',
                'negative' => 'Negative',
            ],
            'disposition_categories' => [
                'positive' => 'Positive Outcomes',
                'negative' => 'Negative Outcomes',
                'neutral' => 'Neutral Outcomes',
                'callback' => 'Callback Required',
            ],
            'dispositions' => array_map(function($d) {
                return [
                    'id' => (string)$d['id'],
                    'name' => $d['name'],
                    'category' => $d['category'],
                    'color' => $d['color'],
                ];
            }, $dispositions),
        ]);
    }
    
    /**
     * Process a trigger event (called internally or via webhook)
     */
    public static function processTrigger(int $userId, string $channel, string $triggerType, int $contactId, array $triggerData = []): array {
        $pdo = Database::conn();
        $results = [];
        
        // Find matching automations
        $stmt = $pdo->prepare('
            SELECT * FROM followup_automations 
            WHERE user_id = ? AND channel = ? AND trigger_type = ? AND is_active = 1
            ORDER BY priority DESC
        ');
        $stmt->execute([$userId, $channel, $triggerType]);
        $automations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($automations as $automation) {
            // Check trigger conditions
            $conditions = json_decode($automation['trigger_conditions'], true) ?? [];
            if (!self::checkConditions($conditions, $triggerData)) {
                continue;
            }
            
            // Check campaign filter
            if ($automation['campaign_id'] && isset($triggerData['campaign_id'])) {
                if ($automation['campaign_id'] != $triggerData['campaign_id']) {
                    continue;
                }
            }
            
            // Calculate scheduled time
            $delay = (int)$automation['delay_amount'];
            $unit = $automation['delay_unit'];
            $scheduledAt = new DateTime();
            
            if ($delay > 0) {
                switch ($unit) {
                    case 'minutes':
                        $scheduledAt->modify("+{$delay} minutes");
                        break;
                    case 'hours':
                        $scheduledAt->modify("+{$delay} hours");
                        break;
                    case 'days':
                        $scheduledAt->modify("+{$delay} days");
                        break;
                }
            }
            
            // Create execution record
            $stmt = $pdo->prepare('
                INSERT INTO automation_executions 
                (automation_id, contact_id, trigger_event, trigger_data, status, scheduled_at, created_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ');
            $stmt->execute([
                $automation['id'],
                $contactId,
                $triggerType,
                json_encode($triggerData),
                $delay > 0 ? 'scheduled' : 'pending',
                $scheduledAt->format('Y-m-d H:i:s'),
            ]);
            
            $executionId = $pdo->lastInsertId();
            
            // If no delay, execute immediately
            if ($delay === 0) {
                $actionResult = self::executeAction($automation, $contactId, $triggerData);
                
                $stmt = $pdo->prepare('
                    UPDATE automation_executions 
                    SET status = ?, action_result = ?, executed_at = CURRENT_TIMESTAMP, error_message = ?
                    WHERE id = ?
                ');
                $stmt->execute([
                    $actionResult['success'] ? 'executed' : 'failed',
                    json_encode($actionResult),
                    $actionResult['error'] ?? null,
                    $executionId,
                ]);
                
                $results[] = [
                    'automation_id' => $automation['id'],
                    'automation_name' => $automation['name'],
                    'execution_id' => $executionId,
                    'result' => $actionResult,
                ];
            } else {
                // Queue for later execution
                $queueId = AutomationQueueProcessor::queueAction(
                    (int)$automation['user_id'],
                    (int)$contactId,
                    (string)$automation['action_type'],
                    json_decode($automation['action_config'], true) ?? [],
                    (int)$automation['id'],
                    null,
                    $scheduledAt->format('Y-m-d H:i:s'),
                    (int)($automation['priority'] ?? 0)
                );
                $results[] = [
                    'automation_id' => $automation['id'],
                    'automation_name' => $automation['name'],
                    'execution_id' => $executionId,
                    'scheduled_at' => $scheduledAt->format('Y-m-d H:i:s'),
                    'queue_id' => (int)$queueId,
                ];
            }
        }
        
        return $results;
    }
    
    /**
     * Check if trigger conditions are met - enhanced for disposition/outcome-based conditions
     */
    private static function checkConditions(array $conditions, array $data): bool {
        foreach ($conditions as $key => $value) {
            switch ($key) {
                case 'disposition_id':
                    // Check specific disposition
                    if (!isset($data['disposition_id']) || $data['disposition_id'] != $value) {
                        return false;
                    }
                    break;
                    
                case 'disposition_category':
                    // Check disposition category (positive, negative, neutral, callback)
                    if (!isset($data['disposition_category']) || $data['disposition_category'] != $value) {
                        return false;
                    }
                    break;
                    
                case 'sentiment':
                    // Check sentiment (positive, neutral, negative)
                    if (!isset($data['sentiment']) || $data['sentiment'] != $value) {
                        return false;
                    }
                    break;
                    
                case 'notes_keyword':
                    // Check if notes contain keyword (case-insensitive)
                    $notes = strtolower($data['notes'] ?? '');
                    $keyword = strtolower($value);
                    if (strpos($notes, $keyword) === false) {
                        return false;
                    }
                    break;
                    
                case 'reply_keyword':
                    // Check if reply content contains keyword
                    $reply = strtolower($data['reply_content'] ?? $data['message'] ?? '');
                    $keyword = strtolower($value);
                    if (strpos($reply, $keyword) === false) {
                        return false;
                    }
                    break;
                    
                case 'call_duration_min':
                    // Check minimum call duration
                    $duration = (int)($data['call_duration'] ?? 0);
                    if ($duration < (int)$value) {
                        return false;
                    }
                    break;
                    
                case 'call_duration_max':
                    // Check maximum call duration
                    $duration = (int)($data['call_duration'] ?? 0);
                    if ($duration > (int)$value) {
                        return false;
                    }
                    break;
                    
                case 'link_url_contains':
                    // Check if clicked link URL contains string
                    $url = strtolower($data['link_url'] ?? $data['clicked_url'] ?? '');
                    if (strpos($url, strtolower($value)) === false) {
                        return false;
                    }
                    break;
                    
                case 'form_field':
                    // Check form field value - value should be {field_name: expected_value}
                    if (is_array($value)) {
                        foreach ($value as $fieldName => $expectedValue) {
                            $formData = $data['form_data'] ?? $data['fields'] ?? [];
                            if (!isset($formData[$fieldName]) || $formData[$fieldName] != $expectedValue) {
                                return false;
                            }
                        }
                    }
                    break;
                    
                case 'disposition_names':
                    // Check if disposition name is in list
                    if (is_array($value)) {
                        $dispositionName = strtolower($data['disposition_name'] ?? '');
                        $matchFound = false;
                        foreach ($value as $name) {
                            if (strtolower($name) == $dispositionName) {
                                $matchFound = true;
                                break;
                            }
                        }
                        if (!$matchFound) {
                            return false;
                        }
                    }
                    break;
                    
                default:
                    // Standard comparison
                    if (!isset($data[$key])) {
                        return false;
                    }
                    if (is_array($value)) {
                        if (!in_array($data[$key], $value)) {
                            return false;
                        }
                    } else {
                        if ($data[$key] != $value) {
                            return false;
                        }
                    }
            }
        }
        
        return true;
    }
    
    /**
     * Execute an automation action
     */
    private static function executeAction(array $automation, int $contactId, array $triggerData): array {
        $actionConfig = json_decode($automation['action_config'], true) ?? [];
        $actionType = $automation['action_type'];
        
        try {
            switch ($actionType) {
                case 'send_email':
                    return self::actionSendEmail($automation['user_id'], $contactId, $actionConfig);
                    
                case 'send_sms':
                    return self::actionSendSMS($automation['user_id'], $contactId, $actionConfig);
                    
                case 'schedule_call':
                    return self::actionScheduleCall($automation['user_id'], $contactId, $actionConfig);
                    
                case 'add_tag':
                    return self::actionAddTag($automation['user_id'], $contactId, $actionConfig);
                    
                case 'remove_tag':
                    return self::actionRemoveTag($automation['user_id'], $contactId, $actionConfig);
                    
                case 'update_status':
                    return self::actionUpdateStatus($automation['user_id'], $contactId, $actionConfig);
                    
                case 'notify_user':
                    return self::actionNotifyUser($automation['user_id'], $contactId, $actionConfig, $triggerData);
                    
                case 'webhook':
                    return self::actionWebhook($automation['user_id'], $contactId, $actionConfig, $triggerData);
                    
                case 'move_to_campaign':
                    return self::actionMoveToCampaign($automation['user_id'], $contactId, $actionConfig);
                    
                default:
                    return ['success' => false, 'error' => 'Unknown action type'];
            }
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    // Action implementations
    private static function actionSendEmail(int $userId, int $contactId, array $config): array {
        $pdo = Database::conn();

        $stmt = $pdo->prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?');
        $stmt->execute([$contactId, $userId]);
        $contact = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$contact || empty($contact['email'])) {
            return ['success' => false, 'error' => 'Contact not found or no email'];
        }

        $subject = $config['subject'] ?? 'Automated Message';
        $body = $config['body'] ?? '';

        if (!empty($config['template_id'])) {
            $stmt = $pdo->prepare('SELECT * FROM templates WHERE id = ? AND user_id = ?');
            $stmt->execute([(int)$config['template_id'], $userId]);
            $template = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($template) {
                $subject = $template['subject'] ?? $subject;
                $body = $template['content'] ?? $body;
            }
        }

        // Replace variables
        $replacements = [
            '{{first_name}}' => $contact['first_name'] ?? '',
            '{{last_name}}' => $contact['last_name'] ?? '',
            '{{email}}' => $contact['email'] ?? '',
            '{{phone}}' => $contact['phone'] ?? '',
            '{{company}}' => $contact['company'] ?? '',
            '{{name}}' => trim(($contact['first_name'] ?? '') . ' ' . ($contact['last_name'] ?? '')),
        ];
        $subject = str_replace(array_keys($replacements), array_values($replacements), (string)$subject);
        $body = str_replace(array_keys($replacements), array_values($replacements), (string)$body);

        // Resolve sending account
        $sendingAccountId = $config['sending_account_id'] ?? null;
        $sendingAccount = null;
        if (!empty($sendingAccountId)) {
            $stmt = $pdo->prepare('SELECT * FROM sending_accounts WHERE id = ? AND user_id = ? LIMIT 1');
            $stmt->execute([(int)$sendingAccountId, $userId]);
            $sendingAccount = $stmt->fetch(PDO::FETCH_ASSOC);
        }
        if (!$sendingAccount) {
            $stmt = $pdo->prepare('SELECT * FROM sending_accounts WHERE user_id = ? AND status = "active" ORDER BY id ASC LIMIT 1');
            $stmt->execute([$userId]);
            $sendingAccount = $stmt->fetch(PDO::FETCH_ASSOC);
        }
        if (!$sendingAccount) {
            return ['success' => false, 'error' => 'No active sending account configured'];
        }

        $mailer = new SimpleMail();
        $ok = $mailer->sendEmail($sendingAccount, (string)$contact['email'], (string)$subject, (string)$body, null, null);
        if (!$ok) {
            return ['success' => false, 'error' => 'Email sending failed'];
        }

        return [
            'success' => true,
            'action' => 'send_email',
            'recipient' => $contact['email'],
            'subject' => $subject,
        ];
    }
    
    private static function actionSendSMS(int $userId, int $contactId, array $config): array {
        $pdo = Database::conn();

        $stmt = $pdo->prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?');
        $stmt->execute([$contactId, $userId]);
        $contact = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$contact || empty($contact['phone'])) {
            return ['success' => false, 'error' => 'Contact not found or no phone'];
        }

        $message = $config['message'] ?? '';

        if (!empty($config['template_id'])) {
            $stmt = $pdo->prepare('SELECT * FROM sms_templates WHERE id = ? AND user_id = ?');
            $stmt->execute([(int)$config['template_id'], $userId]);
            $template = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($template) {
                $message = $template['content'] ?? $message;
            }
        }

        $replacements = [
            '{{first_name}}' => $contact['first_name'] ?? '',
            '{{last_name}}' => $contact['last_name'] ?? '',
            '{{email}}' => $contact['email'] ?? '',
            '{{phone}}' => $contact['phone'] ?? '',
            '{{company}}' => $contact['company'] ?? '',
            '{{name}}' => trim(($contact['first_name'] ?? '') . ' ' . ($contact['last_name'] ?? '')),
        ];
        $message = str_replace(array_keys($replacements), array_values($replacements), (string)$message);

        $to = (string)$contact['phone'];
        $from = $config['from'] ?? $config['from_phone'] ?? null;
        $credentials = null;
        try {
            $credentials = TelephonyConfig::ensureSignalWireConfig((string)$userId);
        } catch (Exception $e) {
            // leave null to allow SMSService env fallback (if configured)
        }

        $sms = new SMSService($credentials, (string)$userId);
        $result = $sms->sendMessage($to, (string)$message, $from, $credentials);

        return [
            'success' => true,
            'action' => 'send_sms',
            'recipient' => $to,
            'external_id' => $result['external_id'] ?? null,
        ];
    }
    
    private static function actionScheduleCall(int $userId, int $contactId, array $config): array {
        // Implementation would create a scheduled call task
        return ['success' => true, 'action' => 'schedule_call', 'scheduled_for' => $config['scheduled_for'] ?? null];
    }
    
    private static function actionAddTag(int $userId, int $contactId, array $config): array {
        $pdo = Database::conn();
        $tagId = $config['tag_id'] ?? null;
        
        if (!$tagId) {
            return ['success' => false, 'error' => 'Tag ID required'];
        }
        
        // Add tag to contact (implementation depends on your tag system)
        $stmt = $pdo->prepare('INSERT IGNORE INTO contact_tags (contact_id, tag_id) VALUES (?, ?)');
        $stmt->execute([$contactId, $tagId]);
        
        return ['success' => true, 'action' => 'add_tag', 'tag_id' => $tagId];
    }
    
    private static function actionRemoveTag(int $userId, int $contactId, array $config): array {
        $pdo = Database::conn();
        $tagId = $config['tag_id'] ?? null;
        
        if (!$tagId) {
            return ['success' => false, 'error' => 'Tag ID required'];
        }
        
        $stmt = $pdo->prepare('DELETE FROM contact_tags WHERE contact_id = ? AND tag_id = ?');
        $stmt->execute([$contactId, $tagId]);
        
        return ['success' => true, 'action' => 'remove_tag', 'tag_id' => $tagId];
    }
    
    private static function actionUpdateStatus(int $userId, int $contactId, array $config): array {
        $pdo = Database::conn();
        $status = $config['status'] ?? null;
        
        if (!$status) {
            return ['success' => false, 'error' => 'Status required'];
        }
        
        $stmt = $pdo->prepare('UPDATE contacts SET status = ? WHERE id = ? AND user_id = ?');
        $stmt->execute([$status, $contactId, $userId]);
        
        return ['success' => true, 'action' => 'update_status', 'status' => $status];
    }
    
    private static function actionNotifyUser(int $userId, int $contactId, array $config, array $triggerData): array {
        // Implementation would send notification (email, push, etc.)
        return ['success' => true, 'action' => 'notify_user', 'notification_type' => $config['type'] ?? 'email'];
    }
    
    private static function actionWebhook(int $userId, int $contactId, array $config, array $triggerData): array {
        $url = $config['url'] ?? null;
        
        if (!$url) {
            return ['success' => false, 'error' => 'Webhook URL required'];
        }
        
        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT * FROM contacts WHERE id = ?');
        $stmt->execute([$contactId]);
        $contact = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $payload = [
            'event' => 'automation_triggered',
            'contact' => $contact,
            'trigger_data' => $triggerData,
            'timestamp' => date('c'),
        ];
        
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return [
            'success' => $httpCode >= 200 && $httpCode < 300,
            'action' => 'webhook',
            'http_code' => $httpCode,
        ];
    }
    
    private static function actionMoveToCampaign(int $userId, int $contactId, array $config): array {
        $campaignId = $config['campaign_id'] ?? null;
        
        if (!$campaignId) {
            return ['success' => false, 'error' => 'Campaign ID required'];
        }
        
        $pdo = Database::conn();
        
        // Add contact to new campaign as recipient
        $stmt = $pdo->prepare('
            INSERT OR IGNORE INTO recipients (campaign_id, contact_id, email, status, created_at)
            SELECT ?, id, email, "pending", CURRENT_TIMESTAMP FROM contacts WHERE id = ?
        ');
        $stmt->execute([$campaignId, $contactId]);
        
        return ['success' => true, 'action' => 'move_to_campaign', 'campaign_id' => $campaignId];
    }
    
    /**
     * Process trigger with intelligent analysis (sentiment, intent, semantic matching)
     * This is the enhanced version that uses the analysis engines
     */
    public static function processIntelligentTrigger(
        int $userId, 
        string $channel, 
        int $contactId, 
        array $triggerData = []
    ): array {
        $pdo = Database::conn();
        $results = [];
        
        // Initialize analysis engines
        $sentimentAnalyzer = new SentimentAnalyzer($userId);
        $intentDetector = new IntentDetector($userId);
        $semanticMatcher = new SemanticMatcher();
        $triggerEvaluator = new TriggerEvaluator();
        
        // Analyze text content if available
        $textContent = $triggerData['notes'] ?? $triggerData['reply_content'] ?? $triggerData['message'] ?? '';
        $sentimentResult = null;
        $intentResult = null;
        
        if (!empty($textContent)) {
            $sentimentResult = $sentimentAnalyzer->analyze($textContent);
            $intentResult = $intentDetector->detectIntent(
                $textContent,
                $triggerData['disposition_name'] ?? null,
                $triggerData['disposition_category'] ?? null
            );
            
            // Add analysis results to trigger data
            $triggerData['sentiment'] = $sentimentResult->sentiment;
            $triggerData['sentiment_confidence'] = $sentimentResult->confidenceScore;
            $triggerData['detected_intent'] = $intentResult->primaryIntent;
            $triggerData['intent_confidence'] = $intentResult->confidenceScore;
            $triggerData['has_conflict'] = $intentResult->hasConflict;
        }
        
        // Semantic categorization for dispositions
        $dispositionCategory = null;
        if (!empty($triggerData['disposition_name'])) {
            $dispositionCategory = $semanticMatcher->categorizeDisposition($triggerData['disposition_name']);
            $triggerData['semantic_category'] = $dispositionCategory->category;
            $triggerData['semantic_confidence'] = $dispositionCategory->confidence;
        }
        
        // Find all active automations for this channel
        $stmt = $pdo->prepare('
            SELECT * FROM followup_automations 
            WHERE user_id = ? AND channel = ? AND is_active = 1
            ORDER BY priority DESC
        ');
        $stmt->execute([$userId, $channel]);
        $automations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Build analysis context
        $context = new AnalysisContext(
            $sentimentResult,
            $intentResult,
            $dispositionCategory,
            $channel,
            $triggerData['campaign_id'] ?? null,
            $triggerData
        );
        
        foreach ($automations as $automation) {
            $triggerType = $automation['trigger_type'];
            $conditions = json_decode($automation['trigger_conditions'], true) ?? [];
            
            // Check if this automation should trigger
            $shouldTrigger = false;
            $triggerReason = [];
            $skipReason = null;
            
            // Handle sentiment-based triggers
            if (strpos($triggerType, 'sentiment_') === 0) {
                $expectedSentiment = str_replace('sentiment_', '', $triggerType);
                if ($sentimentResult && $sentimentResult->sentiment === $expectedSentiment) {
                    $threshold = $conditions['confidence_threshold'] ?? 70;
                    if ($sentimentResult->confidenceScore >= $threshold) {
                        $shouldTrigger = true;
                        $triggerReason = [
                            'type' => 'sentiment_match',
                            'expected' => $expectedSentiment,
                            'actual' => $sentimentResult->sentiment,
                            'confidence' => $sentimentResult->confidenceScore
                        ];
                    } else {
                        $skipReason = "Confidence {$sentimentResult->confidenceScore} below threshold $threshold";
                    }
                }
            }
            // Handle intent-based triggers
            elseif (strpos($triggerType, 'intent_') === 0) {
                $expectedIntent = str_replace('intent_', '', $triggerType);
                if ($intentResult && $intentResult->primaryIntent === $expectedIntent) {
                    $threshold = $conditions['confidence_threshold'] ?? 70;
                    if ($intentResult->confidenceScore >= $threshold) {
                        $shouldTrigger = true;
                        $triggerReason = [
                            'type' => 'intent_match',
                            'expected' => $expectedIntent,
                            'actual' => $intentResult->primaryIntent,
                            'confidence' => $intentResult->confidenceScore
                        ];
                    } else {
                        $skipReason = "Confidence {$intentResult->confidenceScore} below threshold $threshold";
                    }
                }
            }
            // Handle semantic disposition triggers
            elseif (strpos($triggerType, 'semantic_') === 0) {
                $expectedCategory = str_replace('semantic_', '', $triggerType);
                if ($dispositionCategory && $dispositionCategory->category === $expectedCategory) {
                    $threshold = $conditions['confidence_threshold'] ?? 60;
                    if ($dispositionCategory->confidence >= $threshold) {
                        $shouldTrigger = true;
                        $triggerReason = [
                            'type' => 'semantic_match',
                            'expected' => $expectedCategory,
                            'actual' => $dispositionCategory->category,
                            'confidence' => $dispositionCategory->confidence
                        ];
                    } else {
                        $skipReason = "Confidence {$dispositionCategory->confidence} below threshold $threshold";
                    }
                }
            }
            // Handle combined conditions
            elseif ($triggerType === 'combined_conditions') {
                $evalResult = $triggerEvaluator->evaluate($conditions, $context);
                $shouldTrigger = $evalResult->triggered;
                $triggerReason = [
                    'type' => 'combined_conditions',
                    'matched' => $evalResult->matchedConditions,
                    'confidence_scores' => $evalResult->confidenceScores
                ];
                $skipReason = $evalResult->skipReason;
            }
            // Handle standard triggers with condition checking
            else {
                // Check if trigger type matches
                $triggerTypeMatches = self::checkTriggerTypeMatch($triggerType, $triggerData);
                if ($triggerTypeMatches && self::checkConditions($conditions, $triggerData)) {
                    $shouldTrigger = true;
                    $triggerReason = ['type' => 'standard_match', 'trigger_type' => $triggerType];
                }
            }
            
            if (!$shouldTrigger) {
                continue;
            }
            
            // Check campaign filter
            if ($automation['campaign_id'] && isset($triggerData['campaign_id'])) {
                if ($automation['campaign_id'] != $triggerData['campaign_id']) {
                    continue;
                }
            }
            
            // Calculate scheduled time
            $delay = (int)$automation['delay_amount'];
            $unit = $automation['delay_unit'];
            $scheduledAt = new DateTime();
            
            if ($delay > 0) {
                switch ($unit) {
                    case 'minutes': $scheduledAt->modify("+{$delay} minutes"); break;
                    case 'hours': $scheduledAt->modify("+{$delay} hours"); break;
                    case 'days': $scheduledAt->modify("+{$delay} days"); break;
                }
            }
            
            // Create execution record with trigger reason
            $stmt = $pdo->prepare('
                INSERT INTO automation_executions 
                (automation_id, contact_id, trigger_event, trigger_data, trigger_reason, matched_confidence, status, scheduled_at, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ');
            $stmt->execute([
                $automation['id'],
                $contactId,
                $triggerType,
                json_encode($triggerData),
                json_encode($triggerReason),
                $triggerReason['confidence'] ?? null,
                $delay > 0 ? 'scheduled' : 'pending',
                $scheduledAt->format('Y-m-d H:i:s'),
            ]);
            
            $executionId = $pdo->lastInsertId();
            
            // Execute immediately if no delay
            if ($delay === 0) {
                $actionResult = self::executeAction($automation, $contactId, $triggerData);
                
                $stmt = $pdo->prepare('
                    UPDATE automation_executions 
                    SET status = ?, action_result = ?, executed_at = CURRENT_TIMESTAMP, error_message = ?
                    WHERE id = ?
                ');
                $stmt->execute([
                    $actionResult['success'] ? 'executed' : 'failed',
                    json_encode($actionResult),
                    $actionResult['error'] ?? null,
                    $executionId,
                ]);
                
                $results[] = [
                    'automation_id' => $automation['id'],
                    'automation_name' => $automation['name'],
                    'execution_id' => $executionId,
                    'trigger_reason' => $triggerReason,
                    'result' => $actionResult,
                ];
            } else {
                // Queue for later execution
                $queueId = AutomationQueueProcessor::queueAction(
                    (int)$automation['user_id'],
                    (int)$contactId,
                    (string)$automation['action_type'],
                    json_decode($automation['action_config'], true) ?? [],
                    (int)$automation['id'],
                    null,
                    $scheduledAt->format('Y-m-d H:i:s'),
                    (int)($automation['priority'] ?? 0)
                );
                $results[] = [
                    'automation_id' => $automation['id'],
                    'automation_name' => $automation['name'],
                    'execution_id' => $executionId,
                    'trigger_reason' => $triggerReason,
                    'scheduled_at' => $scheduledAt->format('Y-m-d H:i:s'),
                    'queue_id' => (int)$queueId,
                ];
            }
        }
        
        return $results;
    }
    
    /**
     * Check if trigger type matches the event data
     */
    private static function checkTriggerTypeMatch(string $triggerType, array $data): bool {
        // Map trigger types to data conditions
        $triggerChecks = [
            'call_answered' => isset($data['call_status']) && $data['call_status'] === 'answered',
            'call_voicemail' => isset($data['call_status']) && $data['call_status'] === 'voicemail',
            'call_no_answer' => isset($data['call_status']) && $data['call_status'] === 'no_answer',
            'call_busy' => isset($data['call_status']) && $data['call_status'] === 'busy',
            'email_opened' => isset($data['event']) && $data['event'] === 'opened',
            'email_clicked' => isset($data['event']) && $data['event'] === 'clicked',
            'email_replied' => isset($data['event']) && $data['event'] === 'replied',
            'sms_delivered' => isset($data['sms_status']) && $data['sms_status'] === 'delivered',
            'sms_replied' => isset($data['event']) && $data['event'] === 'sms_reply',
            'form_submitted' => isset($data['event']) && $data['event'] === 'form_submitted',
        ];
        
        // Check disposition-based triggers
        if (strpos($triggerType, 'disposition_') === 0) {
            $dispositionType = str_replace('disposition_', '', $triggerType);
            $dispositionName = strtolower($data['disposition_name'] ?? '');
            return strpos($dispositionName, $dispositionType) !== false || 
                   ($data['disposition_category'] ?? '') === $dispositionType;
        }
        
        return $triggerChecks[$triggerType] ?? true;
    }
    
    /**
     * Map automation record to API response
     */
    private static function mapAutomation(array $a): array {
        return [
            'id' => (string)$a['id'],
            'name' => $a['name'],
            'description' => $a['description'],
            'channel' => $a['channel'],
            'trigger_type' => $a['trigger_type'],
            'trigger_conditions' => json_decode($a['trigger_conditions'], true) ?? [],
            'action_type' => $a['action_type'],
            'action_config' => json_decode($a['action_config'], true) ?? [],
            'delay_amount' => (int)$a['delay_amount'],
            'delay_unit' => $a['delay_unit'],
            'is_active' => (bool)$a['is_active'],
            'priority' => (int)$a['priority'],
            'campaign_id' => $a['campaign_id'] ? (string)$a['campaign_id'] : null,
            'created_at' => $a['created_at'],
            'updated_at' => $a['updated_at'],
        ];
    }
}
