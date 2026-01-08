<?php
namespace Xordon\Services;

use Xordon\Database;
use Xordon\Logger;
use PDO;

/**
 * CallQueueService - Handles call queuing and team-based routing
 */
class CallQueueService {
    
    /**
     * Add a call to a queue
     */
    public static function enqueue(int $queueId, string $callSid, string $callerNumber, ?string $callerName = null): array {
        $pdo = Database::conn();
        
        // Get current queue position
        $stmt = $pdo->prepare("SELECT MAX(position) as max_pos FROM call_queue_entries WHERE queue_id = ? AND status = 'waiting'");
        $stmt->execute([$queueId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $position = ($result['max_pos'] ?? 0) + 1;
        
        // Insert queue entry
        $stmt = $pdo->prepare("
            INSERT INTO call_queue_entries (queue_id, call_sid, caller_number, caller_name, position, status, wait_started_at, created_at)
            VALUES (?, ?, ?, ?, ?, 'waiting', NOW(), NOW())
        ");
        $stmt->execute([$queueId, $callSid, $callerNumber, $callerName, $position]);
        $entryId = $pdo->lastInsertId();
        
        Logger::info("Call enqueued", ['queue_id' => $queueId, 'call_sid' => $callSid, 'position' => $position]);
        
        return [
            'entry_id' => $entryId,
            'position' => $position,
            'estimated_wait' => self::estimateWaitTime($queueId, $position)
        ];
    }
    
    /**
     * Get the next available agent for a queue
     */
    public static function getNextAgent(int $queueId): ?array {
        $pdo = Database::conn();
        
        // Get queue configuration
        $stmt = $pdo->prepare("SELECT * FROM call_queues WHERE id = ?");
        $stmt->execute([$queueId]);
        $queue = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$queue) {
            return null;
        }
        
        $strategy = $queue['strategy'] ?? 'round-robin';
        
        switch ($strategy) {
            case 'simultaneous':
                return self::getAgentsForSimultaneous($queueId);
                
            case 'round-robin':
                return self::getAgentRoundRobin($queueId);
                
            case 'least-recent':
                return self::getAgentLeastRecent($queueId);
                
            case 'skills-based':
                return self::getAgentSkillsBased($queueId);
                
            default:
                return self::getAgentRoundRobin($queueId);
        }
    }
    
    /**
     * Get all available agents for simultaneous ring
     */
    private static function getAgentsForSimultaneous(int $queueId): ?array {
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("
            SELECT ca.* 
            FROM call_agents ca
            JOIN call_queue_members cqm ON ca.id = cqm.agent_id
            WHERE cqm.queue_id = ? 
            AND cqm.is_active = 1
            AND ca.status = 'available'
            AND ca.phone IS NOT NULL
            ORDER BY cqm.priority DESC
            LIMIT 10
        ");
        $stmt->execute([$queueId]);
        $agents = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return !empty($agents) ? ['type' => 'simultaneous', 'agents' => $agents] : null;
    }
    
    /**
     * Round robin - pick lowest priority agent who hasn't been called recently
     */
    private static function getAgentRoundRobin(int $queueId): ?array {
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("
            SELECT ca.*, COALESCE(MAX(cl.started_at), '1970-01-01') as last_call_time
            FROM call_agents ca
            JOIN call_queue_members cqm ON ca.id = cqm.agent_id
            LEFT JOIN phone_call_logs cl ON ca.id = cl.agent_id AND cl.started_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
            WHERE cqm.queue_id = ? 
            AND cqm.is_active = 1
            AND ca.status = 'available'
            AND ca.phone IS NOT NULL
            GROUP BY ca.id
            ORDER BY last_call_time ASC, cqm.priority DESC
            LIMIT 1
        ");
        $stmt->execute([$queueId]);
        $agent = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $agent ? ['type' => 'single', 'agent' => $agent] : null;
    }
    
    /**
     * Least recent - agent who last took a call longest ago
     */
    private static function getAgentLeastRecent(int $queueId): ?array {
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("
            SELECT ca.*, COALESCE(MAX(cl.started_at), '1970-01-01') as last_call_time
            FROM call_agents ca
            JOIN call_queue_members cqm ON ca.id = cqm.agent_id
            LEFT JOIN phone_call_logs cl ON ca.id = cl.agent_id
            WHERE cqm.queue_id = ? 
            AND cqm.is_active = 1
            AND ca.status = 'available'
            AND ca.phone IS NOT NULL
            GROUP BY ca.id
            ORDER BY last_call_time ASC
            LIMIT 1
        ");
        $stmt->execute([$queueId]);
        $agent = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $agent ? ['type' => 'single', 'agent' => $agent] : null;
    }
    
    /**
     * Skills-based routing
     */
    private static function getAgentSkillsBased(int $queueId, array $requiredSkills = []): ?array {
        $pdo = Database::conn();
        
        // If no specific skills required, fall back to round robin
        if (empty($requiredSkills)) {
            return self::getAgentRoundRobin($queueId);
        }
        
        $stmt = $pdo->prepare("
            SELECT ca.*, cqm.skills as member_skills
            FROM call_agents ca
            JOIN call_queue_members cqm ON ca.id = cqm.agent_id
            WHERE cqm.queue_id = ? 
            AND cqm.is_active = 1
            AND ca.status = 'available'
            AND ca.phone IS NOT NULL
            ORDER BY cqm.priority DESC
        ");
        $stmt->execute([$queueId]);
        $agents = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Filter by skills
        foreach ($agents as $agent) {
            $agentSkills = json_decode($agent['member_skills'] ?? '{}', true);
            $hasAllSkills = true;
            
            foreach ($requiredSkills as $skill => $value) {
                if (!isset($agentSkills[$skill]) || !in_array($value, (array)$agentSkills[$skill])) {
                    $hasAllSkills = false;
                    break;
                }
            }
            
            if ($hasAllSkills) {
                return ['type' => 'single', 'agent' => $agent];
            }
        }
        
        return null;
    }
    
    /**
     * Mark a queue entry as answered
     */
    public static function markAnswered(string $callSid, int $agentId): bool {
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("
            UPDATE call_queue_entries 
            SET status = 'answered', answered_at = NOW(), answered_by = ?
            WHERE call_sid = ? AND status = 'waiting'
        ");
        $stmt->execute([$agentId, $callSid]);
        
        // Update agent status
        $stmt = $pdo->prepare("UPDATE call_agents SET status = 'on-call' WHERE id = ?");
        $stmt->execute([$agentId]);
        
        return $stmt->rowCount() > 0;
    }
    
    /**
     * Mark a queue entry as abandoned
     */
    public static function markAbandoned(string $callSid): bool {
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("
            UPDATE call_queue_entries 
            SET status = 'abandoned'
            WHERE call_sid = ? AND status = 'waiting'
        ");
        $stmt->execute([$callSid]);
        
        return $stmt->rowCount() > 0;
    }
    
    /**
     * Request a callback instead of waiting
     */
    public static function requestCallback(string $callSid, string $callbackNumber): bool {
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("
            UPDATE call_queue_entries 
            SET status = 'callback', callback_requested = 1, callback_number = ?
            WHERE call_sid = ? AND status = 'waiting'
        ");
        $stmt->execute([$callbackNumber, $callSid]);
        
        return $stmt->rowCount() > 0;
    }
    
    /**
     * Estimate wait time based on queue metrics
     */
    public static function estimateWaitTime(int $queueId, int $position): int {
        $pdo = Database::conn();
        
        // Get average handle time for this queue
        $stmt = $pdo->prepare("
            SELECT AVG(TIMESTAMPDIFF(SECOND, answered_at, cl.ended_at)) as avg_handle_time
            FROM call_queue_entries cqe
            JOIN phone_call_logs cl ON cqe.call_sid = cl.call_sid
            WHERE cqe.queue_id = ? 
            AND cqe.status = 'answered'
            AND cqe.answered_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ");
        $stmt->execute([$queueId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $avgHandleTime = $result['avg_handle_time'] ?? 180; // Default 3 minutes
        
        // Get number of available agents
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as agent_count
            FROM call_agents ca
            JOIN call_queue_members cqm ON ca.id = cqm.agent_id
            WHERE cqm.queue_id = ? AND ca.status = 'available'
        ");
        $stmt->execute([$queueId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $agentCount = max(1, $result['agent_count'] ?? 1);
        
        // Estimate: (position / agents) * avg handle time
        $estimatedWait = ceil(($position / $agentCount) * $avgHandleTime);
        
        return (int)$estimatedWait;
    }
    
    /**
     * Get queue statistics
     */
    public static function getQueueStats(int $queueId): array {
        $pdo = Database::conn();
        
        // Current waiting
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as waiting_count,
                AVG(TIMESTAMPDIFF(SECOND, wait_started_at, NOW())) as avg_wait,
                MAX(TIMESTAMPDIFF(SECOND, wait_started_at, NOW())) as max_wait
            FROM call_queue_entries
            WHERE queue_id = ? AND status = 'waiting'
        ");
        $stmt->execute([$queueId]);
        $waiting = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Today's stats
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total_calls,
                SUM(CASE WHEN status = 'answered' THEN 1 ELSE 0 END) as answered,
                SUM(CASE WHEN status = 'abandoned' THEN 1 ELSE 0 END) as abandoned,
                SUM(CASE WHEN status = 'callback' THEN 1 ELSE 0 END) as callbacks,
                AVG(CASE WHEN status = 'answered' THEN TIMESTAMPDIFF(SECOND, wait_started_at, answered_at) END) as avg_answer_time
            FROM call_queue_entries
            WHERE queue_id = ? AND DATE(created_at) = CURDATE()
        ");
        $stmt->execute([$queueId]);
        $today = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Available agents
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as available
            FROM call_agents ca
            JOIN call_queue_members cqm ON ca.id = cqm.agent_id
            WHERE cqm.queue_id = ? AND ca.status = 'available'
        ");
        $stmt->execute([$queueId]);
        $agents = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return [
            'waiting' => [
                'count' => (int)($waiting['waiting_count'] ?? 0),
                'avgWait' => (int)($waiting['avg_wait'] ?? 0),
                'maxWait' => (int)($waiting['max_wait'] ?? 0)
            ],
            'today' => [
                'total' => (int)($today['total_calls'] ?? 0),
                'answered' => (int)($today['answered'] ?? 0),
                'abandoned' => (int)($today['abandoned'] ?? 0),
                'callbacks' => (int)($today['callbacks'] ?? 0),
                'avgAnswerTime' => (int)($today['avg_answer_time'] ?? 0)
            ],
            'agents' => [
                'available' => (int)($agents['available'] ?? 0)
            ]
        ];
    }
    
    /**
     * Generate TwiML for queue wait experience
     */
    public static function generateWaitXml(int $queueId, int $position, int $estimatedWait): string {
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("SELECT * FROM call_queues WHERE id = ?");
        $stmt->execute([$queueId]);
        $queue = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $holdMessage = $queue['hold_message'] ?? "You are caller number $position. Your estimated wait time is " . ceil($estimatedWait / 60) . " minutes.";
        $holdMusicUrl = $queue['hold_music_url'] ?? 'https://api.twilio.com/cowbell.mp3';
        
        $xml = '<?xml version="1.0" encoding="UTF-8"?><Response>';
        $xml .= '<Say>' . htmlspecialchars($holdMessage) . '</Say>';
        $xml .= '<Play loop="0">' . htmlspecialchars($holdMusicUrl) . '</Play>';
        $xml .= '</Response>';
        
        return $xml;
    }
}
