<?php
/**
 * ConversationIntelligenceService - Call transcription and analysis
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

require_once __DIR__ . '/../Database.php';

class ConversationIntelligenceService {
    private $db;
    
    // Known objection patterns
    private $objectionPatterns = [
        'too expensive',
        'not in the budget',
        'too costly',
        'can\'t afford',
        'not the right time',
        'bad timing',
        'need to think about it',
        'need more time',
        'already have a solution',
        'using a competitor',
        'happy with current',
        'not interested',
        'no need',
        'don\'t need',
        'send me information',
        'call me later',
        'not a priority'
    ];
    
    // Known buying signal patterns
    private $buyingSignalPatterns = [
        'send me a proposal',
        'what\'s the price',
        'how much does it cost',
        'what\'s the timeline',
        'when can we start',
        'how do we get started',
        'what are the next steps',
        'can you send a contract',
        'let\'s schedule a demo',
        'i\'m interested',
        'sounds good',
        'that would work',
        'we need this',
        'this could help',
        'let me talk to my team',
        'who else should be involved'
    ];
    
    public function __construct() {
        $this->db = Database::conn();
    }
    
    /**
     * Transcribe a call recording
     * Requirements: 4.1
     * 
     * @param int $callId
     * @return int Transcription ID
     */
    public function transcribeCall(int $callId): int {
        // Check if transcription already exists
        $stmt = $this->db->prepare("SELECT id, status FROM call_transcriptions WHERE call_id = ?");
        $stmt->execute([$callId]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing && $existing['status'] === 'completed') {
            return $existing['id'];
        }
        
        // Create or update transcription record
        if ($existing) {
            $transcriptionId = $existing['id'];
            $stmt = $this->db->prepare("UPDATE call_transcriptions SET status = 'processing' WHERE id = ?");
            $stmt->execute([$transcriptionId]);
        } else {
            $stmt = $this->db->prepare("
                INSERT INTO call_transcriptions (call_id, status, created_at)
                VALUES (?, 'processing', NOW())
            ");
            $stmt->execute([$callId]);
            $transcriptionId = (int) $this->db->lastInsertId();
        }
        
        // In production, this would call an external transcription service
        // For now, simulate transcription
        try {
            $transcriptionResult = $this->simulateTranscription($callId);
            
            $stmt = $this->db->prepare("
                UPDATE call_transcriptions 
                SET text = ?, speakers = ?, status = 'completed', 
                    duration_seconds = ?, word_count = ?, completed_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([
                $transcriptionResult['text'],
                json_encode($transcriptionResult['speakers']),
                $transcriptionResult['duration'],
                $transcriptionResult['word_count'],
                $transcriptionId
            ]);
            
        } catch (Exception $e) {
            $stmt = $this->db->prepare("
                UPDATE call_transcriptions 
                SET status = 'failed', failure_reason = ?
                WHERE id = ?
            ");
            $stmt->execute([$e->getMessage(), $transcriptionId]);
            throw $e;
        }
        
        return $transcriptionId;
    }
    
    /**
     * Analyze a transcription for sentiment, intent, and signals
     * Requirements: 4.2, 4.3, 4.4
     * 
     * @param int $transcriptionId
     * @return array Analysis results
     */
    public function analyzeTranscription(int $transcriptionId): array {
        // Get transcription
        $stmt = $this->db->prepare("SELECT * FROM call_transcriptions WHERE id = ?");
        $stmt->execute([$transcriptionId]);
        $transcription = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$transcription) {
            throw new RuntimeException('Transcription not found');
        }
        
        if ($transcription['status'] !== 'completed') {
            throw new RuntimeException('Transcription not yet completed');
        }
        
        $text = $transcription['text'];
        
        // Calculate sentiment score (-1 to 1)
        $sentimentScore = $this->calculateSentiment($text);
        
        // Calculate intent score (0-100)
        $intentScore = $this->calculateIntent($text);
        
        // Extract signals
        $signals = $this->extractSignals($text);
        
        // Extract key phrases
        $keyPhrases = $this->extractKeyPhrases($text);
        
        // Calculate talk ratio from speakers
        $speakers = json_decode($transcription['speakers'], true) ?? [];
        $talkRatio = $this->calculateTalkRatio($speakers);
        
        // Check if analysis already exists
        $stmt = $this->db->prepare("SELECT id FROM call_analyses WHERE transcription_id = ?");
        $stmt->execute([$transcriptionId]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            $stmt = $this->db->prepare("
                UPDATE call_analyses 
                SET sentiment_score = ?, intent_score = ?, key_phrases = ?,
                    objections = ?, buying_signals = ?, talk_ratio = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $sentimentScore,
                $intentScore,
                json_encode($keyPhrases),
                json_encode($signals['objections']),
                json_encode($signals['buyingSignals']),
                $talkRatio,
                $existing['id']
            ]);
            $analysisId = $existing['id'];
        } else {
            $stmt = $this->db->prepare("
                INSERT INTO call_analyses 
                (transcription_id, sentiment_score, intent_score, key_phrases, objections, buying_signals, talk_ratio, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $transcriptionId,
                $sentimentScore,
                $intentScore,
                json_encode($keyPhrases),
                json_encode($signals['objections']),
                json_encode($signals['buyingSignals']),
                $talkRatio
            ]);
            $analysisId = (int) $this->db->lastInsertId();
        }
        
        return [
            'id' => $analysisId,
            'transcription_id' => $transcriptionId,
            'sentiment_score' => $sentimentScore,
            'intent_score' => $intentScore,
            'key_phrases' => $keyPhrases,
            'objections' => $signals['objections'],
            'buying_signals' => $signals['buyingSignals'],
            'talk_ratio' => $talkRatio
        ];
    }
    
    /**
     * Extract objections and buying signals from text
     * Requirements: 4.2, 4.4
     * 
     * @param string $text
     * @return array
     */
    public function extractSignals(string $text): array {
        $textLower = strtolower($text);
        
        $objections = [];
        $buyingSignals = [];
        
        // Find objections
        foreach ($this->objectionPatterns as $pattern) {
            if (strpos($textLower, $pattern) !== false) {
                $objections[] = $pattern;
            }
        }
        
        // Find buying signals
        foreach ($this->buyingSignalPatterns as $pattern) {
            if (strpos($textLower, $pattern) !== false) {
                $buyingSignals[] = $pattern;
            }
        }
        
        return [
            'objections' => array_unique($objections),
            'buyingSignals' => array_unique($buyingSignals)
        ];
    }
    
    /**
     * Calculate sentiment score from text
     * Requirements: 4.3
     * 
     * @param string $text
     * @return float Score between -1 and 1
     */
    public function calculateSentiment(string $text): float {
        $textLower = strtolower($text);
        
        // Positive words
        $positiveWords = [
            'great', 'excellent', 'good', 'wonderful', 'fantastic', 'amazing',
            'interested', 'excited', 'happy', 'pleased', 'perfect', 'love',
            'helpful', 'useful', 'valuable', 'impressive', 'awesome', 'yes'
        ];
        
        // Negative words
        $negativeWords = [
            'bad', 'terrible', 'awful', 'horrible', 'poor', 'disappointing',
            'not interested', 'no', 'never', 'hate', 'dislike', 'problem',
            'issue', 'concern', 'worried', 'expensive', 'difficult', 'hard'
        ];
        
        $positiveCount = 0;
        $negativeCount = 0;
        
        foreach ($positiveWords as $word) {
            $positiveCount += substr_count($textLower, $word);
        }
        
        foreach ($negativeWords as $word) {
            $negativeCount += substr_count($textLower, $word);
        }
        
        $total = $positiveCount + $negativeCount;
        
        if ($total === 0) {
            return 0.0;
        }
        
        // Calculate score between -1 and 1
        $score = ($positiveCount - $negativeCount) / $total;
        
        // Clamp to valid range
        return max(-1.0, min(1.0, $score));
    }
    
    /**
     * Calculate intent score from text
     * Requirements: 4.3
     * 
     * @param string $text
     * @return int Score between 0 and 100
     */
    public function calculateIntent(string $text): int {
        $signals = $this->extractSignals($text);
        
        $buyingSignalCount = count($signals['buyingSignals']);
        $objectionCount = count($signals['objections']);
        
        // Base score
        $score = 50;
        
        // Add points for buying signals
        $score += $buyingSignalCount * 15;
        
        // Subtract points for objections
        $score -= $objectionCount * 10;
        
        // Clamp to valid range
        return max(0, min(100, $score));
    }
    
    /**
     * Extract key phrases from text
     * Requirements: 4.2
     * 
     * @param string $text
     * @return array
     */
    public function extractKeyPhrases(string $text): array {
        $keyPhrases = [];
        
        // Combine objection and buying signal patterns
        $allPatterns = array_merge($this->objectionPatterns, $this->buyingSignalPatterns);
        
        $textLower = strtolower($text);
        
        foreach ($allPatterns as $pattern) {
            if (strpos($textLower, $pattern) !== false) {
                $keyPhrases[] = $pattern;
            }
        }
        
        return array_unique($keyPhrases);
    }
    
    /**
     * Calculate talk ratio from speaker segments
     */
    private function calculateTalkRatio(array $speakers): float {
        if (empty($speakers)) {
            return 0.5;
        }
        
        $agentTime = 0;
        $customerTime = 0;
        
        foreach ($speakers as $segment) {
            $duration = ($segment['end'] ?? 0) - ($segment['start'] ?? 0);
            if (($segment['speaker'] ?? '') === 'agent') {
                $agentTime += $duration;
            } else {
                $customerTime += $duration;
            }
        }
        
        $total = $agentTime + $customerTime;
        if ($total === 0) {
            return 0.5;
        }
        
        return round($agentTime / $total, 2);
    }
    
    /**
     * Simulate transcription (placeholder for external service)
     */
    private function simulateTranscription(int $callId): array {
        // In production, this would call an external transcription service
        return [
            'text' => 'This is a simulated transcription for call ' . $callId,
            'speakers' => [
                ['speaker' => 'agent', 'start' => 0, 'end' => 30],
                ['speaker' => 'customer', 'start' => 30, 'end' => 60]
            ],
            'duration' => 60,
            'word_count' => 10
        ];
    }
    
    /**
     * Get transcription by ID
     */
    public function getTranscription(int $transcriptionId): ?array {
        $stmt = $this->db->prepare("
            SELECT t.*, a.sentiment_score, a.intent_score, a.key_phrases, 
                   a.objections, a.buying_signals, a.talk_ratio
            FROM call_transcriptions t
            LEFT JOIN call_analyses a ON a.transcription_id = t.id
            WHERE t.id = ?
        ");
        $stmt->execute([$transcriptionId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }
    
    /**
     * Get analysis for a call
     */
    public function getCallAnalysis(int $callId): ?array {
        $stmt = $this->db->prepare("
            SELECT t.*, a.sentiment_score, a.intent_score, a.key_phrases, 
                   a.objections, a.buying_signals, a.talk_ratio
            FROM call_transcriptions t
            LEFT JOIN call_analyses a ON a.transcription_id = t.id
            WHERE t.call_id = ?
        ");
        $stmt->execute([$callId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }
}
