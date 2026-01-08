<?php
/**
 * Analysis Storage Service
 * Stores and retrieves sentiment and intent analysis results
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/SentimentAnalyzer.php';
require_once __DIR__ . '/IntentDetector.php';

class AnalysisStorageService {
    
    private ?PDO $pdo = null;
    
    public function __construct() {
        $this->pdo = Database::conn();
    }
    
    /**
     * Store sentiment analysis result
     */
    public function storeSentimentAnalysis(
        int $contactId,
        string $channel,
        ?int $interactionId,
        SentimentResult $result,
        ?string $originalText = null
    ): int {
        $sql = 'INSERT INTO sentiment_analysis 
                (contact_id, channel, interaction_id, sentiment, confidence_score, 
                 detected_keywords, is_mixed_sentiment, dominant_emotion, original_text, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())';
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $contactId,
            $channel,
            $interactionId,
            $result->sentiment,
            $result->confidenceScore,
            json_encode($result->detectedKeywords),
            $result->isMixedSentiment ? 1 : 0,
            $result->dominantEmotion,
            $originalText
        ]);
        
        return (int)$this->pdo->lastInsertId();
    }
    
    /**
     * Store intent analysis result
     */
    public function storeIntentAnalysis(
        int $contactId,
        string $channel,
        ?int $interactionId,
        IntentResult $result,
        ?string $originalText = null
    ): int {
        $sql = 'INSERT INTO intent_analysis 
                (contact_id, channel, interaction_id, primary_intent, primary_confidence,
                 secondary_intents, has_conflict, conflict_reason, original_text, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())';
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $contactId,
            $channel,
            $interactionId,
            $result->primaryIntent,
            $result->confidenceScore,
            json_encode($result->secondaryIntents),
            $result->hasConflict ? 1 : 0,
            $result->conflictReason,
            $originalText
        ]);
        
        return (int)$this->pdo->lastInsertId();
    }

    
    /**
     * Update contact_outcomes with analysis data
     */
    public function updateContactOutcomeAnalysis(
        int $outcomeId,
        ?SentimentResult $sentiment = null,
        ?IntentResult $intent = null
    ): bool {
        $updates = [];
        $params = [];
        
        if ($sentiment) {
            $updates[] = 'sentiment_score = ?';
            $updates[] = 'sentiment_confidence = ?';
            $params[] = $sentiment->sentiment;
            $params[] = $sentiment->confidenceScore;
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
        
        $params[] = $outcomeId;
        $sql = 'UPDATE contact_outcomes SET ' . implode(', ', $updates) . ' WHERE id = ?';
        
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($params);
    }
    
    /**
     * Get sentiment history for a contact
     */
    public function getSentimentHistory(int $contactId, ?string $channel = null, int $limit = 50): array {
        $sql = 'SELECT * FROM sentiment_analysis WHERE contact_id = ?';
        $params = [$contactId];
        
        if ($channel) {
            $sql .= ' AND channel = ?';
            $params[] = $channel;
        }
        
        $sql .= ' ORDER BY created_at DESC LIMIT ?';
        $params[] = $limit;
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get intent history for a contact
     */
    public function getIntentHistory(int $contactId, ?string $channel = null, int $limit = 50): array {
        $sql = 'SELECT * FROM intent_analysis WHERE contact_id = ?';
        $params = [$contactId];
        
        if ($channel) {
            $sql .= ' AND channel = ?';
            $params[] = $channel;
        }
        
        $sql .= ' ORDER BY created_at DESC LIMIT ?';
        $params[] = $limit;
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get latest sentiment for a contact
     */
    public function getLatestSentiment(int $contactId, ?string $channel = null): ?array {
        $sql = 'SELECT * FROM sentiment_analysis WHERE contact_id = ?';
        $params = [$contactId];
        
        if ($channel) {
            $sql .= ' AND channel = ?';
            $params[] = $channel;
        }
        
        $sql .= ' ORDER BY created_at DESC LIMIT 1';
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }
    
    /**
     * Get latest intent for a contact
     */
    public function getLatestIntent(int $contactId, ?string $channel = null): ?array {
        $sql = 'SELECT * FROM intent_analysis WHERE contact_id = ?';
        $params = [$contactId];
        
        if ($channel) {
            $sql .= ' AND channel = ?';
            $params[] = $channel;
        }
        
        $sql .= ' ORDER BY created_at DESC LIMIT 1';
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }
    
    /**
     * Get analysis summary for a contact
     */
    public function getContactAnalysisSummary(int $contactId): array {
        // Get sentiment distribution
        $sentimentSql = 'SELECT sentiment, COUNT(*) as count, AVG(confidence_score) as avg_confidence 
                         FROM sentiment_analysis WHERE contact_id = ? GROUP BY sentiment';
        $stmt = $this->pdo->prepare($sentimentSql);
        $stmt->execute([$contactId]);
        $sentimentDist = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get intent distribution
        $intentSql = 'SELECT primary_intent, COUNT(*) as count, AVG(primary_confidence) as avg_confidence 
                      FROM intent_analysis WHERE contact_id = ? GROUP BY primary_intent';
        $stmt = $this->pdo->prepare($intentSql);
        $stmt->execute([$contactId]);
        $intentDist = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get latest analysis
        $latestSentiment = $this->getLatestSentiment($contactId);
        $latestIntent = $this->getLatestIntent($contactId);
        
        return [
            'sentiment_distribution' => $sentimentDist,
            'intent_distribution' => $intentDist,
            'latest_sentiment' => $latestSentiment,
            'latest_intent' => $latestIntent,
            'total_sentiment_records' => array_sum(array_column($sentimentDist, 'count')),
            'total_intent_records' => array_sum(array_column($intentDist, 'count')),
        ];
    }
}
