<?php
/**
 * Sentiment Analysis Controller
 * Provides API endpoints for sentiment and intent analysis
 */

require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../services/SentimentAnalyzer.php';
require_once __DIR__ . '/../services/IntentDetector.php';
require_once __DIR__ . '/../services/AnalysisStorageService.php';
require_once __DIR__ . '/../services/ContactSentimentService.php';

class SentimentAnalysisController {
    
    /**
     * Analyze text for sentiment
     * POST /analyze/sentiment
     */
    public static function analyzeSentiment(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        
        $text = $body['text'] ?? '';
        $contactId = $body['contact_id'] ?? null;
        $channel = $body['channel'] ?? 'api';
        $storeResult = $body['store'] ?? false;
        
        if (empty(trim($text))) {
            Response::error('Text is required', 422);
        }
        
        $analyzer = new SentimentAnalyzer($userId);
        $result = $analyzer->analyze($text);
        
        // Optionally store the result
        if ($storeResult && $contactId) {
            $storage = new AnalysisStorageService();
            $storage->storeSentimentAnalysis($contactId, $channel, null, $result, $text);
        }
        
        Response::json([
            'sentiment' => $result->sentiment,
            'confidence_score' => $result->confidenceScore,
            'detected_keywords' => $result->detectedKeywords,
            'is_mixed_sentiment' => $result->isMixedSentiment,
            'dominant_emotion' => $result->dominantEmotion,
        ]);
    }
    
    /**
     * Analyze text for intent
     * POST /analyze/intent
     */
    public static function analyzeIntent(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        
        $text = $body['text'] ?? '';
        $dispositionName = $body['disposition_name'] ?? null;
        $dispositionCategory = $body['disposition_category'] ?? null;
        $contactId = $body['contact_id'] ?? null;
        $channel = $body['channel'] ?? 'api';
        $storeResult = $body['store'] ?? false;
        
        if (empty(trim($text))) {
            Response::error('Text is required', 422);
        }
        
        $detector = new IntentDetector($userId);
        $result = $detector->detectIntent($text, $dispositionName, $dispositionCategory);
        
        // Optionally store the result
        if ($storeResult && $contactId) {
            $storage = new AnalysisStorageService();
            $storage->storeIntentAnalysis($contactId, $channel, null, $result, $text);
        }
        
        Response::json([
            'primary_intent' => $result->primaryIntent,
            'confidence_score' => $result->confidenceScore,
            'secondary_intents' => $result->secondaryIntents,
            'has_conflict' => $result->hasConflict,
            'conflict_reason' => $result->conflictReason,
        ]);
    }
    
    /**
     * Get sentiment history for a contact
     * GET /contacts/:id/sentiment-history
     */
    public static function getSentimentHistory(int $contactId): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Verify contact belongs to user
        $stmt = $pdo->prepare('SELECT id FROM contacts WHERE id = ? AND user_id = ?');
        $stmt->execute([$contactId, $userId]);
        if (!$stmt->fetch()) {
            Response::error('Contact not found', 404);
        }
        
        $channel = $_GET['channel'] ?? null;
        $days = (int)($_GET['days'] ?? 30);
        
        $storage = new AnalysisStorageService();
        $sentimentService = new ContactSentimentService();
        
        // Get sentiment history
        $history = $storage->getSentimentHistory($contactId, $channel, 100);
        
        // Get overall sentiment
        $overall = $sentimentService->calculateOverallSentiment($contactId);
        
        // Get trend
        $trend = $sentimentService->calculateSentimentTrend($contactId);
        
        // Get timeline
        $timeline = $sentimentService->getSentimentTimeline($contactId, $days);
        
        // Get cross-channel comparison
        $crossChannel = $sentimentService->getCrossChannelSentiment($contactId);
        
        Response::json([
            'contact_id' => $contactId,
            'overall' => $overall,
            'trend' => $trend,
            'timeline' => $timeline,
            'cross_channel' => $crossChannel,
            'history' => array_map(function($record) {
                return [
                    'id' => $record['id'],
                    'sentiment' => $record['sentiment'],
                    'confidence_score' => $record['confidence_score'],
                    'channel' => $record['channel'],
                    'detected_keywords' => json_decode($record['detected_keywords'] ?? '[]', true),
                    'is_mixed_sentiment' => (bool)$record['is_mixed_sentiment'],
                    'dominant_emotion' => $record['dominant_emotion'],
                    'created_at' => $record['created_at'],
                ];
            }, $history),
        ]);
    }
    
    /**
     * Get intent history for a contact
     * GET /contacts/:id/intent-history
     */
    public static function getIntentHistory(int $contactId): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Verify contact belongs to user
        $stmt = $pdo->prepare('SELECT id FROM contacts WHERE id = ? AND user_id = ?');
        $stmt->execute([$contactId, $userId]);
        if (!$stmt->fetch()) {
            Response::error('Contact not found', 404);
        }
        
        $channel = $_GET['channel'] ?? null;
        
        $storage = new AnalysisStorageService();
        $history = $storage->getIntentHistory($contactId, $channel, 100);
        
        Response::json([
            'contact_id' => $contactId,
            'history' => array_map(function($record) {
                return [
                    'id' => $record['id'],
                    'primary_intent' => $record['primary_intent'],
                    'confidence_score' => $record['primary_confidence'],
                    'channel' => $record['channel'],
                    'secondary_intents' => json_decode($record['secondary_intents'] ?? '[]', true),
                    'has_conflict' => (bool)$record['has_conflict'],
                    'conflict_reason' => $record['conflict_reason'],
                    'created_at' => $record['created_at'],
                ];
            }, $history),
        ]);
    }
    
    /**
     * Get analysis summary for a contact
     * GET /contacts/:id/analysis-summary
     */
    public static function getAnalysisSummary(int $contactId): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Verify contact belongs to user
        $stmt = $pdo->prepare('SELECT id FROM contacts WHERE id = ? AND user_id = ?');
        $stmt->execute([$contactId, $userId]);
        if (!$stmt->fetch()) {
            Response::error('Contact not found', 404);
        }
        
        $storage = new AnalysisStorageService();
        $summary = $storage->getContactAnalysisSummary($contactId);
        
        Response::json([
            'contact_id' => $contactId,
            'summary' => $summary,
        ]);
    }
    
    /**
     * Batch analyze multiple texts
     * POST /analyze/batch
     */
    public static function batchAnalyze(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        
        $items = $body['items'] ?? [];
        
        if (empty($items) || !is_array($items)) {
            Response::error('Items array is required', 422);
        }
        
        if (count($items) > 100) {
            Response::error('Maximum 100 items per batch', 422);
        }
        
        $analyzer = new SentimentAnalyzer($userId);
        $detector = new IntentDetector($userId);
        
        $results = [];
        
        foreach ($items as $index => $item) {
            $text = $item['text'] ?? '';
            
            if (empty(trim($text))) {
                $results[] = [
                    'index' => $index,
                    'error' => 'Empty text',
                ];
                continue;
            }
            
            $sentiment = $analyzer->analyze($text);
            $intent = $detector->detectIntent($text);
            
            $results[] = [
                'index' => $index,
                'sentiment' => [
                    'sentiment' => $sentiment->sentiment,
                    'confidence_score' => $sentiment->confidenceScore,
                    'is_mixed_sentiment' => $sentiment->isMixedSentiment,
                ],
                'intent' => [
                    'primary_intent' => $intent->primaryIntent,
                    'confidence_score' => $intent->confidenceScore,
                ],
            ];
        }
        
        Response::json([
            'results' => $results,
            'total' => count($items),
            'processed' => count(array_filter($results, fn($r) => !isset($r['error']))),
        ]);
    }
}
