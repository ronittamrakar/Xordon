<?php
namespace Xordon\Services;

use Xordon\Database;
use Xordon\Logger;
use PDO;

/**
 * IVREngineService - Complete IVR Flow Execution Engine
 * Handles all node types from the visual flow builder
 */
class IVREngineService {
    
    private static ?int $userId = null;
    private static ?int $workspaceId = null;
    
    public static function execute(int $flowId, ?string $currentNodeId = null, array $params = []): string {
        $pdo = Database::conn();
        $stmt = $pdo->prepare("SELECT * FROM call_flows WHERE id = ?");
        $stmt->execute([$flowId]);
        $flow = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$flow) {
            Logger::error("IVR Flow not found: $flowId");
            return self::xmlResponse('<Say>Call flow not found.</Say>');
        }

        // Store context for other methods
        self::$userId = $flow['user_id'] ?? null;
        self::$workspaceId = $flow['workspace_id'] ?? null;

        $nodes = json_decode($flow['nodes'], true) ?: [];
        $edges = json_decode($flow['edges'], true) ?: [];

        // Find current node
        if (!$currentNodeId) {
            // Find trigger node (incoming_call)
            foreach ($nodes as $node) {
                if (($node['data']['type'] ?? '') === 'incoming_call') {
                    $currentNodeId = $node['id'];
                    break;
                }
            }
            
            // If no incoming_call trigger, find any trigger or first node
            if (!$currentNodeId) {
                foreach ($nodes as $node) {
                    if (($node['type'] ?? '') === 'trigger') {
                        $currentNodeId = $node['id'];
                        break;
                    }
                }
            }
        }

        if (!$currentNodeId) {
             Logger::warning("No start node found for IVR flow: $flowId");
             return self::xmlResponse('<Say>No start node found in call flow.</Say>');
        }

        // Find the node object
        $currentNode = null;
        foreach ($nodes as $node) {
            if ($node['id'] === $currentNodeId) {
                $currentNode = $node;
                break;
            }
        }

        if (!$currentNode) {
            Logger::error("IVR Node not found: $currentNodeId in flow $flowId");
            return self::xmlResponse('<Say>Contact flow error.</Say>');
        }

        // Process the node
        return self::processNode($flowId, $currentNode, $nodes, $edges, $params);
    }

    private static function xmlResponse(string $content): string {
        return '<?xml version="1.0" encoding="UTF-8"?><Response>' . $content . '</Response>';
    }

    private static function processNode(int $flowId, array $node, array $nodes, array $edges, array $params): string {
        $type = $node['data']['type'] ?? '';
        $config = $node['data']['config'] ?? [];

        Logger::info("Processing IVR Node: $type", ['flow' => $flowId, 'node' => $node['id']]);

        switch ($type) {
            case 'incoming_call':
            case 'missed_call':
            case 'scheduled_callback':
                return self::moveToNextNode($flowId, $node['id'], $nodes, $edges, $params);

            case 'play_audio':
                return self::handlePlayAudio($flowId, $node, $edges, $config, $params);

            case 'gather_input':
                return self::handleGatherInput($flowId, $node, $config, $params);

            case 'forward_call':
            case 'transfer_call':
                return self::handleForwardCall($flowId, $node, $config, $params);

            case 'record_voicemail':
                return self::handleVoicemail($flowId, $node, $config, $params);

            case 'send_sms':
                return self::handleSendSMS($flowId, $node, $nodes, $edges, $config, $params);

            case 'send_email':
                return self::handleSendEmail($flowId, $node, $nodes, $edges, $config, $params);

            case 'webhook':
                return self::handleWebhook($flowId, $node, $nodes, $edges, $config, $params);

            case 'hangup':
                return self::xmlResponse('<Hangup/>');

            case 'menu_option':
                return self::handleMenuOption($flowId, $node, $edges, $config, $params);

            // ============================================
            // CONDITION NODES
            // ============================================
            case 'time_check':
                return self::handleTimeCheck($flowId, $node, $nodes, $edges, $config, $params);

            case 'caller_id_check':
                return self::handleCallerIdCheck($flowId, $node, $nodes, $edges, $config, $params);

            case 'vip_check':
                return self::handleVipCheck($flowId, $node, $nodes, $edges, $config, $params);

            case 'language_check':
                return self::handleLanguageCheck($flowId, $node, $nodes, $edges, $config, $params);

            case 'geo_check':
                return self::handleGeoCheck($flowId, $node, $nodes, $edges, $config, $params);

            case 'agent_availability':
                return self::handleAgentAvailability($flowId, $node, $nodes, $edges, $config, $params);

            case 'queue_status':
                return self::handleQueueStatus($flowId, $node, $nodes, $edges, $config, $params);

            case 'holiday_check':
                return self::handleHolidayCheck($flowId, $node, $nodes, $edges, $config, $params);

            // ============================================
            // ACTION NODES
            // ============================================
            case 'queue_call':
                return self::handleQueueCall($flowId, $node, $config, $params);

            case 'ai_agent':
                return self::handleAIAgent($flowId, $node, $config, $params);

            case 'tag_call':
                return self::handleTagCall($flowId, $node, $nodes, $edges, $config, $params);

            case 'update_crm':
            case 'create_ticket':
                return self::handleCRMAction($flowId, $node, $nodes, $edges, $config, $params);

            case 'callback_request':
                return self::handleCallbackRequest($flowId, $node, $config, $params);

            case 'survey':
                return self::handleSurvey($flowId, $node, $config, $params);

            case 'play_music':
                return self::handlePlayMusic($flowId, $node, $edges, $config, $params);

            case 'conference_call':
                return self::handleConference($flowId, $node, $config, $params);

            case 'screen_call':
                return self::handleScreenCall($flowId, $node, $config, $params);

            default:
                Logger::warning("Unknown IVR node type: $type");
                return self::moveToNextNode($flowId, $node['id'], $nodes, $edges, $params);
        }
    }

    // ============================================
    // AUDIO & MEDIA HANDLERS
    // ============================================

    private static function handlePlayAudio(int $flowId, array $node, array $edges, array $config, array $params): string {
        $content = '';
        $audioSource = $config['audioSource'] ?? 'tts';
        
        if ($audioSource === 'tts') {
            $voice = $config['voice'] ?? 'alice';
            $language = $config['language'] ?? 'en-US';
            $message = htmlspecialchars($config['message'] ?? 'Hello.');
            $content .= "<Say voice=\"$voice\" language=\"$language\">$message</Say>";
        } else if ($audioSource === 'url' && !empty($config['audioUrl'])) {
            $content .= '<Play>' . htmlspecialchars($config['audioUrl']) . '</Play>';
        } else if ($audioSource === 'library' && !empty($config['mediaId'])) {
            // Look up media URL from database
            $mediaUrl = self::getMediaUrl($config['mediaId']);
            if ($mediaUrl) {
                $content .= '<Play>' . htmlspecialchars($mediaUrl) . '</Play>';
            } else {
                $content .= '<Say>Audio file not found.</Say>';
            }
        }
        
        // Add redirect to next node
        $nextNodeId = self::findNextNodeId($node['id'], $edges);
        if ($nextNodeId) {
            $content .= "<Redirect>/api/phone/ivr-callback/$flowId?nodeId=$nextNodeId</Redirect>";
        } else {
            $content .= '<Hangup/>';
        }
        
        return self::xmlResponse($content);
    }

    private static function getMediaUrl(string $mediaId): ?string {
        $pdo = Database::conn();
        $stmt = $pdo->prepare("SELECT url, file_path FROM media_files WHERE id = ?");
        $stmt->execute([$mediaId]);
        $media = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($media) {
            return $media['url'] ?? $media['file_path'] ?? null;
        }
        return null;
    }

    private static function handlePlayMusic(int $flowId, array $node, array $edges, array $config, array $params): string {
        $musicUrl = $config['musicUrl'] ?? 'https://example.com/hold-music.mp3';
        $duration = $config['duration'] ?? 30;
        
        // For hold music, we typically loop
        $content = "<Play loop=\"0\">$musicUrl</Play>";
        
        return self::xmlResponse($content);
    }

    // ============================================
    // INPUT GATHERING
    // ============================================

    private static function handleGatherInput(int $flowId, array $node, array $config, array $params): string {
        $numDigits = $config['numDigits'] ?? 1;
        $timeout = $config['timeout'] ?? 5;
        $finishOnKey = $config['finishOnKey'] ?? '#';
        
        $callbackUrl = "/api/phone/ivr-callback/$flowId?nodeId={$node['id']}&action=gather";
        
        $content = "<Gather numDigits=\"$numDigits\" timeout=\"$timeout\" finishOnKey=\"$finishOnKey\" action=\"$callbackUrl\">";
        if (!empty($config['prompt'])) {
            $content .= '<Say>' . htmlspecialchars($config['prompt']) . '</Say>';
        }
        $content .= '</Gather>';
        $content .= '<Say>We did not receive any input. Goodbye.</Say><Hangup/>';
        
        return self::xmlResponse($content);
    }

    private static function handleMenuOption(int $flowId, array $node, array $edges, array $config, array $params): string {
        // Check if we already have digits from a Gather
        if (isset($params['Digits'])) {
            $digits = $params['Digits'];
            Logger::info("IVR Menu selection: $digits");
            
            // Find edge with this digit
            $nextNodeId = null;
            foreach ($edges as $edge) {
                if ($edge['source'] === $node['id'] && 
                    ($edge['sourceHandle'] === $digits || $edge['label'] === $digits || $edge['sourceHandle'] === "digit_$digits")) {
                    $nextNodeId = $edge['target'];
                    break;
                }
            }
            
            if ($nextNodeId) {
                return self::execute($flowId, $nextNodeId, $params);
            } else {
                // Invalid option - repeat menu
                $content = '<Say>I\'m sorry, that is not a valid option.</Say>';
                $callbackUrl = "/api/phone/ivr-callback/$flowId?nodeId={$node['id']}";
                $content .= "<Gather numDigits=\"1\" timeout=\"10\" action=\"$callbackUrl\">";
                if (!empty($config['prompt'])) {
                    $content .= '<Say>' . htmlspecialchars($config['prompt']) . '</Say>';
                }
                $content .= '</Gather>';
                return self::xmlResponse($content);
            }
        }
        
        // If no digits, start gathering
        $callbackUrl = "/api/phone/ivr-callback/$flowId?nodeId={$node['id']}";
        $content = "<Gather numDigits=\"1\" timeout=\"10\" action=\"$callbackUrl\">";
        if (!empty($config['prompt'])) {
            $content .= '<Say>' . htmlspecialchars($config['prompt']) . '</Say>';
        }
        $content .= '</Gather>';
        
        return self::xmlResponse($content);
    }

    // ============================================
    // CALL ROUTING
    // ============================================

    private static function handleForwardCall(int $flowId, array $node, array $config, array $params): string {
        $forwardType = $config['forwardType'] ?? 'number';
        $destination = $config['destination'] ?? '';
        $timeout = $config['timeout'] ?? 30;
        $record = $config['record'] ?? false;
        
        $content = '';
        $dialAttrs = "timeout=\"$timeout\"";
        if ($record) {
            $dialAttrs .= ' record="record-from-answer"';
        }
        
        // Handle whisper announcement
        if (!empty($config['whisper']) && !empty($config['whisperText'])) {
            $whisperUrl = "/api/phone/whisper?text=" . urlencode($config['whisperText']);
            $dialAttrs .= " url=\"$whisperUrl\"";
        }
        
        if ($forwardType === 'agent' && $destination) {
            // Look up agent's phone number
            $agentNumber = self::getAgentNumber($destination);
            if ($agentNumber) {
                $content .= "<Dial $dialAttrs><Number>$agentNumber</Number></Dial>";
            } else {
                $content .= '<Say>No agent available.</Say>';
            }
        } else if ($forwardType === 'queue') {
            // Add to call queue
            $content .= self::generateQueueXml($destination, $config);
        } else if ($forwardType === 'department') {
            // Simultaneous ring to all agents in department
            $numbers = self::getDepartmentNumbers($destination);
            if (!empty($numbers)) {
                $content .= "<Dial $dialAttrs>";
                foreach ($numbers as $number) {
                    $content .= "<Number>$number</Number>";
                }
                $content .= '</Dial>';
            } else {
                $content .= '<Say>No agents available in this department.</Say>';
            }
        } else if ($destination) {
            // Direct number forward
            $content .= "<Dial $dialAttrs><Number>" . htmlspecialchars($destination) . "</Number></Dial>";
        } else {
            $content .= '<Say>No transfer destination configured.</Say>';
        }
        
        return self::xmlResponse($content);
    }

    private static function getAgentNumber(string $agentId): ?string {
        $pdo = Database::conn();
        $stmt = $pdo->prepare("SELECT phone, extension FROM call_agents WHERE id = ? AND status = 'available'");
        $stmt->execute([$agentId]);
        $agent = $stmt->fetch(PDO::FETCH_ASSOC);
        return $agent['phone'] ?? null;
    }

    private static function getDepartmentNumbers(string $department): array {
        $pdo = Database::conn();
        $stmt = $pdo->prepare("
            SELECT ca.phone FROM call_agents ca 
            WHERE ca.department = ? AND ca.status = 'available' AND ca.phone IS NOT NULL
            LIMIT 10
        ");
        $stmt->execute([$department]);
        return array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'phone');
    }

    private static function generateQueueXml(string $queueName, array $config): string {
        $maxWait = $config['maxWaitTime'] ?? 300;
        $musicUrl = $config['holdMusic'] ?? '';
        
        $content = "<Enqueue waitUrl=\"/api/phone/queue-wait\" waitUrlMethod=\"POST\"";
        if ($musicUrl) {
            $content .= " waitUrl=\"" . htmlspecialchars($musicUrl) . "\"";
        }
        $content .= ">" . htmlspecialchars($queueName) . "</Enqueue>";
        
        return $content;
    }

    // ============================================
    // QUEUE MANAGEMENT
    // ============================================

    private static function handleQueueCall(int $flowId, array $node, array $config, array $params): string {
        $queueName = $config['queueName'] ?? 'default';
        $maxSize = $config['maxSize'] ?? 0;
        $waitMusic = $config['waitMusic'] ?? 'default';
        
        // Check queue size if limit set
        if ($maxSize > 0) {
            $pdo = Database::conn();
            $stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM call_queue_entries WHERE queue_id = ? AND status = 'waiting'");
            // Would need to look up queue_id by name
            
            // If queue is full, go to fallback
        }
        
        $content = "<Enqueue waitUrl=\"/api/phone/queue-wait?music=$waitMusic\" waitUrlMethod=\"POST\">$queueName</Enqueue>";
        
        return self::xmlResponse($content);
    }

    // ============================================
    // CONDITION HANDLERS
    // ============================================

    private static function handleTimeCheck(int $flowId, array $node, array $nodes, array $edges, array $config, array $params): string {
        $timezone = $config['timezone'] ?? 'America/New_York';
        $startTime = $config['startTime'] ?? '09:00';
        $endTime = $config['endTime'] ?? '17:00';
        $activeDays = $config['activeDays'] ?? [1, 2, 3, 4, 5]; // Monday-Friday
        
        try {
            $tz = new \DateTimeZone($timezone);
            $now = new \DateTime('now', $tz);
            $currentTime = $now->format('H:i');
            $dayOfWeek = (int)$now->format('w'); // 0 = Sunday
            
            $isWithinHours = ($currentTime >= $startTime && $currentTime <= $endTime);
            $isActiveDay = in_array($dayOfWeek, $activeDays);
            $isOpen = $isWithinHours && $isActiveDay;
            
            Logger::info("Time check: $currentTime, day: $dayOfWeek, isOpen: " . ($isOpen ? 'yes' : 'no'));
            
            // Route to yes/no path
            $handle = $isOpen ? 'yes' : 'no';
            $nextNodeId = self::findNextNodeId($node['id'], $edges, $handle);
            
            if ($nextNodeId) {
                return self::execute($flowId, $nextNodeId, $params);
            }
        } catch (\Exception $e) {
            Logger::error("Time check error: " . $e->getMessage());
        }
        
        return self::xmlResponse('<Say>We are currently closed. Please call back during business hours.</Say><Hangup/>');
    }

    private static function handleHolidayCheck(int $flowId, array $node, array $nodes, array $edges, array $config, array $params): string {
        $pdo = Database::conn();
        $today = date('Y-m-d');
        $todayMD = date('m-d'); // For recurring holidays
        
        $stmt = $pdo->prepare("
            SELECT id FROM holidays 
            WHERE (user_id = ? OR workspace_id = ?)
            AND (date = ? OR (is_recurring = 1 AND DATE_FORMAT(date, '%m-%d') = ?))
        ");
        $stmt->execute([self::$userId, self::$workspaceId, $today, $todayMD]);
        $isHoliday = $stmt->fetch() !== false;
        
        $handle = $isHoliday ? 'yes' : 'no';
        $nextNodeId = self::findNextNodeId($node['id'], $edges, $handle);
        
        if ($nextNodeId) {
            return self::execute($flowId, $nextNodeId, $params);
        }
        
        if ($isHoliday) {
            return self::xmlResponse('<Say>We are closed for a holiday. Please call back on the next business day.</Say><Hangup/>');
        }
        
        return self::moveToNextNode($flowId, $node['id'], $nodes, $edges, $params);
    }

    private static function handleCallerIdCheck(int $flowId, array $node, array $nodes, array $edges, array $config, array $params): string {
        $callerNumber = $params['From'] ?? $params['Caller'] ?? '';
        $matchType = $config['matchType'] ?? 'exact'; // exact, contains, starts_with, ends_with, regex
        $matchValue = $config['matchValue'] ?? '';
        
        $matches = false;
        
        switch ($matchType) {
            case 'exact':
                $matches = ($callerNumber === $matchValue);
                break;
            case 'contains':
                $matches = (strpos($callerNumber, $matchValue) !== false);
                break;
            case 'starts_with':
                $matches = (strpos($callerNumber, $matchValue) === 0);
                break;
            case 'ends_with':
                $matches = (substr($callerNumber, -strlen($matchValue)) === $matchValue);
                break;
            case 'regex':
                $matches = (preg_match('/' . $matchValue . '/', $callerNumber) === 1);
                break;
        }
        
        $handle = $matches ? 'yes' : 'no';
        $nextNodeId = self::findNextNodeId($node['id'], $edges, $handle);
        
        if ($nextNodeId) {
            return self::execute($flowId, $nextNodeId, $params);
        }
        
        return self::moveToNextNode($flowId, $node['id'], $nodes, $edges, $params);
    }

    private static function handleVipCheck(int $flowId, array $node, array $nodes, array $edges, array $config, array $params): string {
        $callerNumber = $params['From'] ?? $params['Caller'] ?? '';
        
        // Check if caller is VIP in contacts
        $pdo = Database::conn();
        $stmt = $pdo->prepare("
            SELECT is_vip, vip_priority FROM contacts 
            WHERE phone = ? OR phone = ? OR phone LIKE ?
            AND (user_id = ? OR workspace_id = ?)
        ");
        $cleanNumber = preg_replace('/[^0-9]/', '', $callerNumber);
        $stmt->execute([$callerNumber, $cleanNumber, "%$cleanNumber%", self::$userId, self::$workspaceId]);
        $contact = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $isVip = ($contact && $contact['is_vip']);
        
        $handle = $isVip ? 'yes' : 'no';
        $nextNodeId = self::findNextNodeId($node['id'], $edges, $handle);
        
        if ($nextNodeId) {
            return self::execute($flowId, $nextNodeId, $params);
        }
        
        return self::moveToNextNode($flowId, $node['id'], $nodes, $edges, $params);
    }

    private static function handleLanguageCheck(int $flowId, array $node, array $nodes, array $edges, array $config, array $params): string {
        // For language detection, we typically prompt the user
        $callbackUrl = "/api/phone/ivr-callback/$flowId?nodeId={$node['id']}&action=language";
        
        $content = '<Gather numDigits="1" timeout="10" action="' . $callbackUrl . '">';
        $content .= '<Say language="en-US">For English, press 1.</Say>';
        $content .= '<Say language="es-ES">Para español, presione 2.</Say>';
        $content .= '<Say language="fr-FR">Pour le français, appuyez sur 3.</Say>';
        $content .= '</Gather>';
        
        return self::xmlResponse($content);
    }

    private static function handleGeoCheck(int $flowId, array $node, array $nodes, array $edges, array $config, array $params): string {
        $callerNumber = $params['From'] ?? $params['Caller'] ?? '';
        $targetAreaCodes = $config['areaCodes'] ?? [];
        
        // Extract area code from phone number
        $cleanNumber = preg_replace('/[^0-9]/', '', $callerNumber);
        $areaCode = '';
        
        if (strlen($cleanNumber) >= 10) {
            // US/Canada format
            if (strlen($cleanNumber) == 11 && $cleanNumber[0] == '1') {
                $areaCode = substr($cleanNumber, 1, 3);
            } else if (strlen($cleanNumber) == 10) {
                $areaCode = substr($cleanNumber, 0, 3);
            }
        }
        
        $matches = in_array($areaCode, $targetAreaCodes);
        
        $handle = $matches ? 'yes' : 'no';
        $nextNodeId = self::findNextNodeId($node['id'], $edges, $handle);
        
        if ($nextNodeId) {
            return self::execute($flowId, $nextNodeId, $params);
        }
        
        return self::moveToNextNode($flowId, $node['id'], $nodes, $edges, $params);
    }

    private static function handleAgentAvailability(int $flowId, array $node, array $nodes, array $edges, array $config, array $params): string {
        $pdo = Database::conn();
        
        // Check if any agents are available
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as available_count 
            FROM call_agents 
            WHERE (user_id = ? OR workspace_id = ?)
            AND status = 'available'
        ");
        $stmt->execute([self::$userId, self::$workspaceId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $hasAvailable = ($result['available_count'] ?? 0) > 0;
        
        $handle = $hasAvailable ? 'yes' : 'no';
        $nextNodeId = self::findNextNodeId($node['id'], $edges, $handle);
        
        if ($nextNodeId) {
            return self::execute($flowId, $nextNodeId, $params);
        }
        
        return self::moveToNextNode($flowId, $node['id'], $nodes, $edges, $params);
    }

    private static function handleQueueStatus(int $flowId, array $node, array $nodes, array $edges, array $config, array $params): string {
        $queueName = $config['queueName'] ?? 'default';
        $maxWait = $config['maxWait'] ?? 10; // minutes
        $maxSize = $config['maxSize'] ?? 20;
        
        $pdo = Database::conn();
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as queue_size, 
                   AVG(TIMESTAMPDIFF(MINUTE, wait_started_at, NOW())) as avg_wait
            FROM call_queue_entries cqe
            JOIN call_queues cq ON cqe.queue_id = cq.id
            WHERE cq.name = ? AND cqe.status = 'waiting'
        ");
        $stmt->execute([$queueName]);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $queueSize = (int)($stats['queue_size'] ?? 0);
        $avgWait = (float)($stats['avg_wait'] ?? 0);
        
        $isAcceptable = ($queueSize < $maxSize && $avgWait < $maxWait);
        
        $handle = $isAcceptable ? 'yes' : 'no';
        $nextNodeId = self::findNextNodeId($node['id'], $edges, $handle);
        
        if ($nextNodeId) {
            return self::execute($flowId, $nextNodeId, $params);
        }
        
        return self::moveToNextNode($flowId, $node['id'], $nodes, $edges, $params);
    }

    // ============================================
    // INTEGRATION HANDLERS
    // ============================================

    private static function handleSendSMS(int $flowId, array $node, array $nodes, array $edges, array $config, array $params): string {
        $callerNumber = $params['From'] ?? $params['Caller'] ?? '';
        $message = $config['message'] ?? '';
        $fromNumber = $config['fromNumber'] ?? null;
        
        // Replace variables in message
        $message = str_replace(
            ['{caller_number}', '{date}', '{time}'],
            [$callerNumber, date('Y-m-d'), date('H:i')],
            $message
        );
        
        if ($message && $callerNumber) {
            try {
                // Fire SMS via existing SMS service
                require_once __DIR__ . '/SMSService.php';
                
                $pdo = Database::conn();
                // Get default sending number if not specified
                if (!$fromNumber || $fromNumber === 'auto') {
                    $stmt = $pdo->prepare("SELECT phone_number FROM phone_numbers WHERE (user_id = ? OR workspace_id = ?) AND sms_enabled = 1 ORDER BY is_primary DESC LIMIT 1");
                    $stmt->execute([self::$userId, self::$workspaceId]);
                    $row = $stmt->fetch(PDO::FETCH_ASSOC);
                    $fromNumber = $row['phone_number'] ?? null;
                }
                
                if ($fromNumber) {
                    $smsService = new \SMSService();
                    $result = $smsService->sendSMS($fromNumber, $callerNumber, $message);
                    Logger::info("IVR SMS sent", ['to' => $callerNumber, 'result' => $result]);
                }
            } catch (\Exception $e) {
                Logger::error("IVR SMS failed: " . $e->getMessage());
            }
        }
        
        return self::moveToNextNode($flowId, $node['id'], $nodes, $edges, $params);
    }

    private static function handleSendEmail(int $flowId, array $node, array $nodes, array $edges, array $config, array $params): string {
        $callerNumber = $params['From'] ?? $params['Caller'] ?? '';
        
        // Look up contact email
        $pdo = Database::conn();
        $stmt = $pdo->prepare("SELECT email, first_name FROM contacts WHERE phone LIKE ? LIMIT 1");
        $cleanNumber = preg_replace('/[^0-9]/', '', $callerNumber);
        $stmt->execute(["%$cleanNumber%"]);
        $contact = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($contact && $contact['email']) {
            // Would integrate with email service here
            Logger::info("IVR Email would be sent to: " . $contact['email']);
        }
        
        return self::moveToNextNode($flowId, $node['id'], $nodes, $edges, $params);
    }

    private static function handleWebhook(int $flowId, array $node, array $nodes, array $edges, array $config, array $params): string {
        $url = $config['url'] ?? '';
        $method = $config['method'] ?? 'POST';
        $headers = [];
        $payload = [];
        
        // Parse headers JSON
        if (!empty($config['headers'])) {
            $parsed = json_decode($config['headers'], true);
            if (is_array($parsed)) {
                $headers = $parsed;
            }
        }
        
        // Build payload with call data
        $payload = [
            'call_sid' => $params['CallSid'] ?? '',
            'caller' => $params['From'] ?? $params['Caller'] ?? '',
            'called' => $params['To'] ?? $params['Called'] ?? '',
            'direction' => $params['Direction'] ?? 'inbound',
            'timestamp' => date('c'),
            'flow_id' => $flowId,
            'node_id' => $node['id']
        ];
        
        // Merge custom payload
        if (!empty($config['payload'])) {
            $customPayload = json_decode($config['payload'], true);
            if (is_array($customPayload)) {
                $payload = array_merge($payload, $customPayload);
            }
        }
        
        if ($url) {
            try {
                $ch = curl_init($url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_TIMEOUT, $config['timeout'] ?? 10);
                
                if ($method === 'POST') {
                    curl_setopt($ch, CURLOPT_POST, true);
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
                    $headers['Content-Type'] = 'application/json';
                }
                
                if (!empty($headers)) {
                    $headerStrings = [];
                    foreach ($headers as $key => $value) {
                        $headerStrings[] = "$key: $value";
                    }
                    curl_setopt($ch, CURLOPT_HTTPHEADER, $headerStrings);
                }
                
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                
                Logger::info("IVR Webhook called", ['url' => $url, 'status' => $httpCode]);
            } catch (\Exception $e) {
                Logger::error("IVR Webhook failed: " . $e->getMessage());
            }
        }
        
        return self::moveToNextNode($flowId, $node['id'], $nodes, $edges, $params);
    }

    private static function handleTagCall(int $flowId, array $node, array $nodes, array $edges, array $config, array $params): string {
        $tagName = $config['tagName'] ?? '';
        $callSid = $params['CallSid'] ?? '';
        
        if ($tagName && $callSid) {
            $pdo = Database::conn();
            
            // Find or create the tag
            $stmt = $pdo->prepare("SELECT id FROM tags WHERE name = ? AND (user_id = ? OR workspace_id = ?)");
            $stmt->execute([$tagName, self::$userId, self::$workspaceId]);
            $tag = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$tag) {
                // Create tag
                $stmt = $pdo->prepare("INSERT INTO tags (name, user_id, workspace_id, created_at) VALUES (?, ?, ?, NOW())");
                $stmt->execute([$tagName, self::$userId, self::$workspaceId]);
                $tagId = $pdo->lastInsertId();
            } else {
                $tagId = $tag['id'];
            }
            
            // Update call log with tag
            $stmt = $pdo->prepare("UPDATE phone_call_logs SET tags = JSON_ARRAY_APPEND(COALESCE(tags, '[]'), '$', ?) WHERE call_sid = ?");
            $stmt->execute([$tagName, $callSid]);
            
            Logger::info("IVR Tagged call", ['call_sid' => $callSid, 'tag' => $tagName]);
        }
        
        return self::moveToNextNode($flowId, $node['id'], $nodes, $edges, $params);
    }

    private static function handleCRMAction(int $flowId, array $node, array $nodes, array $edges, array $config, array $params): string {
        $callerNumber = $params['From'] ?? $params['Caller'] ?? '';
        $actionType = $node['data']['type'] ?? '';
        
        $pdo = Database::conn();
        
        if ($actionType === 'create_ticket') {
            // Create helpdesk ticket
            $stmt = $pdo->prepare("
                INSERT INTO helpdesk_tickets (user_id, workspace_id, subject, description, priority, status, source, created_at)
                VALUES (?, ?, ?, ?, ?, 'open', 'phone', NOW())
            ");
            $stmt->execute([
                self::$userId,
                self::$workspaceId,
                $config['ticketSubject'] ?? "Call from $callerNumber",
                $config['ticketDescription'] ?? "Inbound call received from $callerNumber",
                $config['ticketPriority'] ?? 'medium'
            ]);
            
            Logger::info("IVR Created ticket for call from: $callerNumber");
        } else if ($actionType === 'update_crm') {
            // Update contact record or pipeline
            $cleanNumber = preg_replace('/[^0-9]/', '', $callerNumber);
            
            // Find contact
            $stmt = $pdo->prepare("SELECT id FROM contacts WHERE phone LIKE ? LIMIT 1");
            $stmt->execute(["%$cleanNumber%"]);
            $contact = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($contact && !empty($config['pipelineStage'])) {
                $stmt = $pdo->prepare("UPDATE contacts SET pipeline_stage = ?, updated_at = NOW() WHERE id = ?");
                $stmt->execute([$config['pipelineStage'], $contact['id']]);
            }
        }
        
        return self::moveToNextNode($flowId, $node['id'], $nodes, $edges, $params);
    }

    // ============================================
    // CALLBACK & VOICEMAIL
    // ============================================

    private static function handleVoicemail(int $flowId, array $node, array $config, array $params): string {
        $greeting = $config['greeting'] ?? 'Please leave a message after the beep.';
        $maxDuration = $config['maxDuration'] ?? 60;
        $transcribe = $config['transcribe'] ?? false;
        
        $callbackUrl = "/api/phone/recording-complete?flowId=$flowId";
        
        $content = '<Say>' . htmlspecialchars($greeting) . '</Say>';
        $content .= '<Record maxLength="' . $maxDuration . '"';
        if ($transcribe) {
            $content .= ' transcribe="true" transcribeCallback="' . $callbackUrl . '"';
        }
        $content .= ' action="' . $callbackUrl . '" />';
        
        return self::xmlResponse($content);
    }

    private static function handleCallbackRequest(int $flowId, array $node, array $config, array $params): string {
        $callerNumber = $params['From'] ?? $params['Caller'] ?? '';
        
        // Log callback request
        $pdo = Database::conn();
        $stmt = $pdo->prepare("
            INSERT INTO call_queue_entries (queue_id, call_sid, caller_number, callback_requested, callback_number, status, wait_started_at, created_at)
            VALUES (NULL, ?, ?, 1, ?, 'callback', NOW(), NOW())
        ");
        $stmt->execute([
            $params['CallSid'] ?? '',
            $callerNumber,
            $callerNumber
        ]);
        
        $content = '<Say>Thank you. We will call you back as soon as possible. Goodbye.</Say><Hangup/>';
        
        return self::xmlResponse($content);
    }

    private static function handleSurvey(int $flowId, array $node, array $config, array $params): string {
        $question = $config['question'] ?? 'On a scale of 1 to 5, how satisfied are you with our service?';
        $callbackUrl = "/api/phone/ivr-callback/$flowId?nodeId={$node['id']}&action=survey";
        
        $content = '<Gather numDigits="1" timeout="10" action="' . $callbackUrl . '">';
        $content .= '<Say>' . htmlspecialchars($question) . '</Say>';
        $content .= '</Gather>';
        $content .= '<Say>Thank you for your feedback. Goodbye.</Say><Hangup/>';
        
        return self::xmlResponse($content);
    }

    // ============================================
    // AI & ADVANCED
    // ============================================

    private static function handleAIAgent(int $flowId, array $node, array $config, array $params): string {
        $agentId = $config['agentId'] ?? '';
        $greeting = $config['greeting'] ?? 'Hello, how can I help you today?';
        $callSid = $params['CallSid'] ?? '';

        if (!$agentId) {
            return self::xmlResponse('<Say>AI agent configuration error.</Say><Hangup/>');
        }

        // Initialize AI conversation
        $xml = '<?xml version="1.0" encoding="UTF-8"?><Response>';
        $callbackUrl = "/api/phone/ai-callback?agentId=$agentId&flowId=$flowId&nodeId={$node['id']}";
        
        $xml .= '<Gather input="speech" action="' . $callbackUrl . '" timeout="3">';
        $xml .= '<Say>' . htmlspecialchars($greeting) . '</Say>';
        $xml .= '</Gather>';
        $xml .= '<Redirect>' . $callbackUrl . '?status=no-input</Redirect>';
        $xml .= '</Response>';
        
        return $xml;
    }

    private static function handleScreenCall(int $flowId, array $node, array $config, array $params): string {
        $callbackUrl = "/api/phone/ivr-callback/$flowId?nodeId={$node['id']}&action=screen";
        
        $content = '<Gather numDigits="20" timeout="10" finishOnKey="#" action="' . $callbackUrl . '">';
        $content .= '<Say>Please enter your account number followed by the pound sign.</Say>';
        $content .= '</Gather>';
        $content .= '<Say>We did not receive your account number. Goodbye.</Say><Hangup/>';
        
        return self::xmlResponse($content);
    }

    private static function handleConference(int $flowId, array $node, array $config, array $params): string {
        $roomName = $config['roomName'] ?? 'conference-' . time();
        $muteOnEntry = $config['muteOnEntry'] ?? false;
        $record = $config['record'] ?? false;
        $beep = $config['beep'] ?? true;
        
        $confAttrs = '';
        if ($muteOnEntry) $confAttrs .= ' muted="true"';
        if ($record) $confAttrs .= ' record="record-from-start"';
        if (!$beep) $confAttrs .= ' beep="false"';
        
        $content = '<Dial><Conference' . $confAttrs . '>' . htmlspecialchars($roomName) . '</Conference></Dial>';
        
        return self::xmlResponse($content);
    }

    // ============================================
    // HELPERS
    // ============================================

    private static function findNextNodeId(string $nodeId, array $edges, ?string $handle = null): ?string {
        foreach ($edges as $edge) {
            if ($edge['source'] === $nodeId) {
                if ($handle && ($edge['sourceHandle'] ?? '') !== $handle) {
                    continue;
                }
                return $edge['target'];
            }
        }
        return null;
    }

    private static function moveToNextNode(int $flowId, string $currentNodeId, array $nodes, array $edges, array $params): string {
        $nextNodeId = self::findNextNodeId($currentNodeId, $edges);
        if ($nextNodeId) {
            return self::execute($flowId, $nextNodeId, $params);
        }
        return self::xmlResponse('<Hangup/>');
    }
}
