<?php
/**
 * Contact Sentiment Service
 * Manages cross-channel sentiment aggregation and tracking for contacts
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/SentimentAnalyzer.php';
require_once __DIR__ . '/AnalysisStorageService.php';

class ContactSentimentService {
    
    private ?PDO $pdo = null;
    private AnalysisStorageService $storageService;
    
    // Threshold for significant sentiment change (30 points)
    private const SENTIMENT_CHANGE_THRESHOLD = 30;
    
    // Minimum interactions for trend calculation
    private const MIN_INTERACTIONS_FOR_TREND = 3;
    
    public function __construct() {
        $this->pdo = Database::conn();
        $this->storageService = new AnalysisStorageService();
    }
    
    /**
     * Calculate overall sentiment score for a contact
     * Uses weighted average based on confidence scores
     */
    public function calculateOverallSentiment(int $contactId): array {
        $sql = 'SELECT sentiment, confidence_score, channel, created_at 
                FROM sentiment_analysis 
                WHERE contact_id = ? 
                ORDER BY created_at DESC 
                LIMIT 20';
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$contactId]);
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($records)) {
            return [
                'overall_score' => 50, // Neutral
                'sentiment' => 'neutral',
                'confidence' => 0,
                'record_count' => 0
            ];
        }
        
        // Convert sentiment to numeric score
        $sentimentScores = [
            'positive' => 100,
            'neutral' => 50,
            'negative' => 0
        ];
        
        $totalWeight = 0;
        $weightedSum = 0;
        
        foreach ($records as $record) {
            $score = $sentimentScores[$record['sentiment']] ?? 50;
            $weight = $record['confidence_score'] / 100;
            
            $weightedSum += $score * $weight;
            $totalWeight += $weight;
        }
        
        $overallScore = $totalWeight > 0 ? (int)round($weightedSum / $totalWeight) : 50;
        
        // Determine sentiment category
        $sentiment = 'neutral';
        if ($overallScore >= 65) {
            $sentiment = 'positive';
        } elseif ($overallScore <= 35) {
            $sentiment = 'negative';
        }
        
        return [
            'overall_score' => $overallScore,
            'sentiment' => $sentiment,
            'confidence' => (int)round($totalWeight / count($records) * 100),
            'record_count' => count($records)
        ];
    }

    
    /**
     * Calculate sentiment trend from recent interactions
     * Returns: 'improving', 'declining', or 'stable'
     */
    public function calculateSentimentTrend(int $contactId): array {
        $sql = 'SELECT sentiment, confidence_score, created_at 
                FROM sentiment_analysis 
                WHERE contact_id = ? 
                ORDER BY created_at DESC 
                LIMIT 10';
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$contactId]);
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($records) < self::MIN_INTERACTIONS_FOR_TREND) {
            return [
                'trend' => 'insufficient_data',
                'direction' => 0,
                'record_count' => count($records)
            ];
        }
        
        // Convert to numeric scores
        $sentimentScores = ['positive' => 100, 'neutral' => 50, 'negative' => 0];
        $scores = array_map(function($r) use ($sentimentScores) {
            return $sentimentScores[$r['sentiment']] ?? 50;
        }, $records);
        
        // Reverse to chronological order
        $scores = array_reverse($scores);
        
        // Calculate trend using linear regression
        $n = count($scores);
        $sumX = 0;
        $sumY = 0;
        $sumXY = 0;
        $sumX2 = 0;
        
        for ($i = 0; $i < $n; $i++) {
            $sumX += $i;
            $sumY += $scores[$i];
            $sumXY += $i * $scores[$i];
            $sumX2 += $i * $i;
        }
        
        $slope = ($n * $sumXY - $sumX * $sumY) / ($n * $sumX2 - $sumX * $sumX);
        
        // Determine trend
        $trend = 'stable';
        if ($slope > 5) {
            $trend = 'improving';
        } elseif ($slope < -5) {
            $trend = 'declining';
        }
        
        return [
            'trend' => $trend,
            'direction' => round($slope, 2),
            'record_count' => $n
        ];
    }
    
    /**
     * Check for significant sentiment change
     * Returns true if change exceeds threshold
     */
    public function checkSentimentChange(int $contactId, SentimentResult $newSentiment): array {
        $latestRecord = $this->storageService->getLatestSentiment($contactId);
        
        if (!$latestRecord) {
            return [
                'has_change' => false,
                'change_amount' => 0,
                'previous_sentiment' => null,
                'new_sentiment' => $newSentiment->sentiment
            ];
        }
        
        $sentimentScores = ['positive' => 100, 'neutral' => 50, 'negative' => 0];
        
        $previousScore = $sentimentScores[$latestRecord['sentiment']] ?? 50;
        $newScore = $sentimentScores[$newSentiment->sentiment] ?? 50;
        
        $changeAmount = abs($newScore - $previousScore);
        $hasChange = $changeAmount >= self::SENTIMENT_CHANGE_THRESHOLD;
        
        return [
            'has_change' => $hasChange,
            'change_amount' => $changeAmount,
            'previous_sentiment' => $latestRecord['sentiment'],
            'new_sentiment' => $newSentiment->sentiment,
            'previous_score' => $previousScore,
            'new_score' => $newScore
        ];
    }
    
    /**
     * Update contact sentiment tracking record
     */
    public function updateContactSentimentTracking(int $contactId): bool {
        $overall = $this->calculateOverallSentiment($contactId);
        $trend = $this->calculateSentimentTrend($contactId);
        
        // Check if tracking record exists
        $checkSql = 'SELECT id FROM contact_sentiment_tracking WHERE contact_id = ?';
        $stmt = $this->pdo->prepare($checkSql);
        $stmt->execute([$contactId]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            $sql = 'UPDATE contact_sentiment_tracking 
                    SET overall_sentiment_score = ?, sentiment_trend = ?, updated_at = NOW()
                    WHERE contact_id = ?';
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([$overall['overall_score'], $trend['trend'], $contactId]);
        } else {
            $sql = 'INSERT INTO contact_sentiment_tracking 
                    (contact_id, overall_sentiment_score, sentiment_trend, created_at, updated_at)
                    VALUES (?, ?, ?, NOW(), NOW())';
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([$contactId, $overall['overall_score'], $trend['trend']]);
        }
    }
    
    /**
     * Flag contact for sentiment change
     */
    public function flagSentimentChange(int $contactId, array $changeInfo): bool {
        if (!$changeInfo['has_change']) {
            return false;
        }
        
        $sql = 'UPDATE contact_sentiment_tracking 
                SET sentiment_change_flag = 1, 
                    last_change_amount = ?,
                    last_change_direction = ?,
                    updated_at = NOW()
                WHERE contact_id = ?';
        
        $direction = $changeInfo['new_score'] > $changeInfo['previous_score'] ? 'positive' : 'negative';
        
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$changeInfo['change_amount'], $direction, $contactId]);
    }
    
    /**
     * Get contacts with sentiment changes (for alerts/automations)
     */
    public function getContactsWithSentimentChanges(int $userId, bool $unacknowledgedOnly = true): array {
        $sql = 'SELECT cst.*, c.first_name, c.last_name, c.email, c.phone
                FROM contact_sentiment_tracking cst
                JOIN contacts c ON c.id = cst.contact_id
                WHERE c.user_id = ? AND cst.sentiment_change_flag = 1';
        
        if ($unacknowledgedOnly) {
            $sql .= ' AND (cst.change_acknowledged IS NULL OR cst.change_acknowledged = 0)';
        }
        
        $sql .= ' ORDER BY cst.updated_at DESC';
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$userId]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Acknowledge sentiment change (clear flag)
     */
    public function acknowledgeSentimentChange(int $contactId): bool {
        $sql = 'UPDATE contact_sentiment_tracking 
                SET sentiment_change_flag = 0, change_acknowledged = 1, updated_at = NOW()
                WHERE contact_id = ?';
        
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$contactId]);
    }
    
    /**
     * Get sentiment timeline for a contact
     */
    public function getSentimentTimeline(int $contactId, int $days = 30): array {
        $sql = 'SELECT DATE(created_at) as date, 
                       AVG(CASE sentiment WHEN "positive" THEN 100 WHEN "neutral" THEN 50 ELSE 0 END) as avg_score,
                       COUNT(*) as interaction_count,
                       GROUP_CONCAT(DISTINCT channel) as channels
                FROM sentiment_analysis 
                WHERE contact_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY DATE(created_at)
                ORDER BY date ASC';
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$contactId, $days]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get cross-channel sentiment comparison
     */
    public function getCrossChannelSentiment(int $contactId): array {
        $sql = 'SELECT channel,
                       COUNT(*) as interaction_count,
                       AVG(CASE sentiment WHEN "positive" THEN 100 WHEN "neutral" THEN 50 ELSE 0 END) as avg_score,
                       AVG(confidence_score) as avg_confidence,
                       MAX(created_at) as last_interaction
                FROM sentiment_analysis 
                WHERE contact_id = ?
                GROUP BY channel';
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$contactId]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
