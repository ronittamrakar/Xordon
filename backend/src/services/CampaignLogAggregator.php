<?php
/**
 * Campaign Log Aggregator Service
 * Updates campaign logs with sentiment and intent analysis data
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/SentimentAnalyzer.php';
require_once __DIR__ . '/IntentDetector.php';

class CampaignLogAggregator {
    
    private ?PDO $pdo = null;
    
    public function __construct() {
        $this->pdo = Database::conn();
    }
    
    /**
     * Update email campaign log with sentiment/intent
     */
    public function updateEmailLog(
        int $logId,
        ?SentimentResult $sentiment = null,
        ?IntentResult $intent = null
    ): bool {
        return $this->updateLog('email_campaign_logs', $logId, $sentiment, $intent);
    }
    
    /**
     * Update SMS campaign log with sentiment/intent
     */
    public function updateSmsLog(
        int $logId,
        ?SentimentResult $sentiment = null,
        ?IntentResult $intent = null
    ): bool {
        return $this->updateLog('sms_campaign_logs', $logId, $sentiment, $intent);
    }
    
    /**
     * Update call campaign log with sentiment/intent
     */
    public function updateCallLog(
        int $logId,
        ?SentimentResult $sentiment = null,
        ?IntentResult $intent = null
    ): bool {
        return $this->updateLog('call_logs', $logId, $sentiment, $intent);
    }
    
    /**
     * Generic log update method
     */
    private function updateLog(
        string $table,
        int $logId,
        ?SentimentResult $sentiment,
        ?IntentResult $intent
    ): bool {
        $updates = [];
        $params = [];
        
        if ($sentiment) {
            $updates[] = 'sentiment = ?';
            $updates[] = 'sentiment_confidence = ?';
            $updates[] = 'sentiment_keywords = ?';
            $params[] = $sentiment->sentiment;
            $params[] = $sentiment->confidenceScore;
            $params[] = json_encode($sentiment->detectedKeywords);
        }
        
        if ($intent) {
            $updates[] = 'detected_intent = ?';
            $updates[] = 'intent_confidence = ?';
            $params[] = $intent->primaryIntent;
            $params[] = $intent->confidenceScore;
        }
        
        if (empty($updates)) {
            return false;
        }
        
        $params[] = $logId;
        $sql = "UPDATE $table SET " . implode(', ', $updates) . " WHERE id = ?";
        
        try {
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute($params);
        } catch (PDOException $e) {
            // Column might not exist, log and continue
            error_log("CampaignLogAggregator: Failed to update $table: " . $e->getMessage());
            return false;
        }
    }

    
    /**
     * Get campaign logs filtered by sentiment
     */
    public function getLogsBySentiment(
        string $table,
        int $campaignId,
        ?string $sentiment = null,
        ?string $intent = null,
        int $limit = 100
    ): array {
        $sql = "SELECT * FROM $table WHERE campaign_id = ?";
        $params = [$campaignId];
        
        if ($sentiment) {
            $sql .= ' AND sentiment = ?';
            $params[] = $sentiment;
        }
        
        if ($intent) {
            $sql .= ' AND detected_intent = ?';
            $params[] = $intent;
        }
        
        $sql .= ' ORDER BY created_at DESC LIMIT ?';
        $params[] = $limit;
        
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }
    
    /**
     * Get sentiment summary for a campaign
     */
    public function getCampaignSentimentSummary(string $table, int $campaignId): array {
        $sql = "SELECT 
                    sentiment,
                    COUNT(*) as count,
                    AVG(sentiment_confidence) as avg_confidence
                FROM $table 
                WHERE campaign_id = ? AND sentiment IS NOT NULL
                GROUP BY sentiment";
        
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$campaignId]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $summary = [
                'positive' => ['count' => 0, 'avg_confidence' => 0],
                'neutral' => ['count' => 0, 'avg_confidence' => 0],
                'negative' => ['count' => 0, 'avg_confidence' => 0],
                'total_analyzed' => 0
            ];
            
            foreach ($results as $row) {
                $summary[$row['sentiment']] = [
                    'count' => (int)$row['count'],
                    'avg_confidence' => round((float)$row['avg_confidence'], 1)
                ];
                $summary['total_analyzed'] += (int)$row['count'];
            }
            
            return $summary;
        } catch (PDOException $e) {
            return [];
        }
    }
    
    /**
     * Get intent summary for a campaign
     */
    public function getCampaignIntentSummary(string $table, int $campaignId): array {
        $sql = "SELECT 
                    detected_intent,
                    COUNT(*) as count,
                    AVG(intent_confidence) as avg_confidence
                FROM $table 
                WHERE campaign_id = ? AND detected_intent IS NOT NULL
                GROUP BY detected_intent
                ORDER BY count DESC";
        
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$campaignId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }
    
    /**
     * Export campaign data with sentiment/intent
     */
    public function exportCampaignData(string $table, int $campaignId): array {
        $sql = "SELECT l.*, c.first_name, c.last_name, c.email, c.phone
                FROM $table l
                LEFT JOIN contacts c ON c.id = l.contact_id
                WHERE l.campaign_id = ?
                ORDER BY l.created_at DESC";
        
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$campaignId]);
            $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format for export
            $exportData = [];
            foreach ($logs as $log) {
                $exportData[] = [
                    'contact_name' => trim(($log['first_name'] ?? '') . ' ' . ($log['last_name'] ?? '')),
                    'email' => $log['email'] ?? '',
                    'phone' => $log['phone'] ?? '',
                    'status' => $log['status'] ?? '',
                    'sentiment' => $log['sentiment'] ?? '',
                    'sentiment_confidence' => $log['sentiment_confidence'] ?? '',
                    'detected_intent' => $log['detected_intent'] ?? '',
                    'intent_confidence' => $log['intent_confidence'] ?? '',
                    'created_at' => $log['created_at'] ?? '',
                ];
            }
            
            return $exportData;
        } catch (PDOException $e) {
            return [];
        }
    }
    
    /**
     * Batch analyze and update campaign logs
     */
    public function batchAnalyzeLogs(
        string $table,
        int $campaignId,
        string $textField = 'reply_text'
    ): array {
        $sql = "SELECT id, $textField as text FROM $table 
                WHERE campaign_id = ? AND $textField IS NOT NULL AND $textField != ''
                AND (sentiment IS NULL OR sentiment = '')";
        
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$campaignId]);
            $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $analyzer = new SentimentAnalyzer();
            $detector = new IntentDetector();
            
            $processed = 0;
            $errors = 0;
            
            foreach ($logs as $log) {
                try {
                    $sentiment = $analyzer->analyze($log['text']);
                    $intent = $detector->detectIntent($log['text']);
                    
                    $this->updateLog($table, $log['id'], $sentiment, $intent);
                    $processed++;
                } catch (Exception $e) {
                    $errors++;
                }
            }
            
            return [
                'total' => count($logs),
                'processed' => $processed,
                'errors' => $errors
            ];
        } catch (PDOException $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Get negative sentiment alerts for a campaign
     */
    public function getNegativeSentimentAlerts(string $table, int $campaignId, int $confidenceThreshold = 70): array {
        $sql = "SELECT l.*, c.first_name, c.last_name, c.email, c.phone
                FROM $table l
                LEFT JOIN contacts c ON c.id = l.contact_id
                WHERE l.campaign_id = ? 
                AND l.sentiment = 'negative' 
                AND l.sentiment_confidence >= ?
                ORDER BY l.created_at DESC";
        
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$campaignId, $confidenceThreshold]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }
}
