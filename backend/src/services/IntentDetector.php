<?php
/**
 * Intent Detection Engine
 * Identifies customer intent from dispositions and notes combined
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/SentimentAnalyzer.php';

class IntentResult {
    public string $primaryIntent;
    public int $confidenceScore;
    public array $secondaryIntents;
    public bool $hasConflict;
    public ?string $conflictReason;
    
    public function __construct(
        string $primaryIntent = 'unknown',
        int $confidenceScore = 0,
        array $secondaryIntents = [],
        bool $hasConflict = false,
        ?string $conflictReason = null
    ) {
        $this->primaryIntent = $primaryIntent;
        $this->confidenceScore = max(0, min(100, $confidenceScore));
        $this->secondaryIntents = $secondaryIntents;
        $this->hasConflict = $hasConflict;
        $this->conflictReason = $conflictReason;
    }
    
    public function toArray(): array {
        return [
            'primary_intent' => $this->primaryIntent,
            'confidence_score' => $this->confidenceScore,
            'secondary_intents' => $this->secondaryIntents,
            'has_conflict' => $this->hasConflict,
            'conflict_reason' => $this->conflictReason,
        ];
    }
}

class IntentDetector {
    
    private array $intentKeywords = [];
    private array $optOutKeywords = [];
    private ?SentimentAnalyzer $sentimentAnalyzer = null;
    
    // Disposition category to sentiment mapping
    private array $dispositionSentimentMap = [
        'positive' => 'positive',
        'negative' => 'negative',
        'neutral' => 'neutral',
        'callback' => 'neutral',
    ];
    
    public function __construct(?int $userId = null) {
        $this->loadIntentKeywords($userId);
        $this->initOptOutKeywords();
        $this->sentimentAnalyzer = new SentimentAnalyzer($userId);
    }
    
    /**
     * Load intent keywords from database or defaults
     */
    private function loadIntentKeywords(?int $userId): void {
        try {
            $pdo = Database::conn();
            
            $sql = 'SELECT intent_keywords FROM sentiment_config 
                    WHERE user_id = ? OR user_id = 0 
                    ORDER BY user_id DESC LIMIT 1';
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$userId ?? 0]);
            $config = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($config && !empty($config['intent_keywords'])) {
                $this->intentKeywords = json_decode($config['intent_keywords'], true) ?: [];
            }
        } catch (Exception $e) {
            // Fall back to defaults
        }
        
        if (empty($this->intentKeywords)) {
            $this->loadDefaultIntentKeywords();
        }
    }
    
    /**
     * Load default intent keywords
     */
    private function loadDefaultIntentKeywords(): void {
        $this->intentKeywords = [
            'purchase_intent' => [
                'buy', 'purchase', 'order', 'sign up', 'subscribe', 
                'interested in buying', 'want to buy', 'pricing', 'cost', 
                'how much', 'price', 'deal', 'discount', 'offer', 'ready to buy',
                'take it', 'ill take', "i'll take", 'send me', 'get started'
            ],
            'callback_request' => [
                'call back', 'callback', 'call me', 'call later', 'busy now', 
                'not a good time', 'try again', 'call tomorrow', 'call next week',
                'reach me at', 'better time', 'schedule a call', 'ring me'
            ],
            'complaint' => [
                'complaint', 'problem', 'issue', 'not working', 'broken', 
                'disappointed', 'frustrated', 'angry', 'terrible service',
                'worst', 'unacceptable', 'ridiculous', 'scam', 'rip off',
                'never again', 'report', 'sue', 'lawyer', 'bbb'
            ],
            'question' => [
                'question', 'how does', 'what is', 'when can', 'where do', 
                'why is', 'can you explain', 'could you tell', 'is it possible',
                'tell me more', 'more information', 'details', 'clarify',
                'wondering', 'curious', 'help me understand'
            ],
            'referral' => [
                'refer', 'friend', 'colleague', 'recommend', 'someone else',
                'my brother', 'my sister', 'my boss', 'coworker', 'neighbor',
                'pass along', 'share with', 'tell others'
            ],
            'objection' => [
                'too expensive', 'not sure', 'need to think', 'maybe later', 
                'not now', 'budget', 'cant afford', "can't afford", 'too much',
                'not ready', 'need approval', 'talk to spouse', 'talk to partner',
                'compare options', 'shopping around', 'other quotes'
            ],
            'not_qualified' => [
                'wrong person', 'not the decision maker', 'not my department',
                'dont need', "don't need", 'already have', 'not applicable',
                'not relevant', 'wrong number', 'wrong company'
            ],
            'opt_out' => [
                'stop', 'unsubscribe', 'remove', 'opt out', 'optout', 'cancel',
                'do not contact', 'dont contact', "don't contact", 'leave me alone',
                'take me off', 'remove me', 'no more calls', 'no more emails',
                'do not call', 'dnc', 'blacklist'
            ]
        ];
    }
    
    /**
     * Initialize opt-out keywords (highest priority)
     */
    private function initOptOutKeywords(): void {
        $this->optOutKeywords = [
            'stop', 'unsubscribe', 'remove', 'opt out', 'optout', 'cancel',
            'do not contact', 'dont contact', "don't contact", 'leave me alone',
            'take me off', 'remove me', 'no more calls', 'no more emails',
            'do not call', 'dnc'
        ];
    }
    
    /**
     * Detect intent from text and optional disposition
     */
    public function detectIntent(
        string $text, 
        ?string $dispositionName = null,
        ?string $dispositionCategory = null
    ): IntentResult {
        // First check for opt-out intent (highest priority)
        if ($this->hasOptOutIntent($text)) {
            return new IntentResult('opt_out', 95, [], false, null);
        }
        
        // Detect all intents
        $allIntents = $this->detectAllIntents($text);
        
        // Get primary intent (highest confidence) or unknown
        $primaryIntent = 'unknown';
        $primaryConfidence = 0;
        $secondaryIntentsArray = [];
        
        if (!empty($allIntents)) {
            $primaryResult = $allIntents[0];
            $primaryIntent = $primaryResult->primaryIntent;
            $primaryConfidence = $primaryResult->confidenceScore;
            
            // Get secondary intents
            $secondaryIntents = array_slice($allIntents, 1);
            $secondaryIntentsArray = array_map(function($r) {
                return ['intent' => $r->primaryIntent, 'confidence' => $r->confidenceScore];
            }, $secondaryIntents);
        }
        
        // Check for conflict with disposition
        $hasConflict = false;
        $conflictReason = null;
        
        if ($dispositionCategory !== null) {
            $conflictCheck = $this->checkDispositionConflict(
                $text, 
                $dispositionCategory, 
                $primaryIntent
            );
            $hasConflict = $conflictCheck['has_conflict'];
            $conflictReason = $conflictCheck['reason'];
        }
        
        return new IntentResult(
            $primaryIntent,
            $primaryConfidence,
            $secondaryIntentsArray,
            $hasConflict,
            $conflictReason
        );
    }
    
    /**
     * Get all detected intents ranked by confidence
     */
    public function detectAllIntents(string $text): array {
        $lowerText = strtolower($text);
        $results = [];
        
        foreach ($this->intentKeywords as $intent => $keywords) {
            $matchCount = 0;
            $matchedKeywords = [];
            
            foreach ($keywords as $keyword) {
                $keyword = strtolower($keyword);
                if (strpos($keyword, ' ') !== false) {
                    // Multi-word phrase
                    if (strpos($lowerText, $keyword) !== false) {
                        $matchCount++;
                        $matchedKeywords[] = $keyword;
                    }
                } else {
                    // Single word with word boundary
                    if (preg_match('/\b' . preg_quote($keyword, '/') . '\b/i', $lowerText)) {
                        $matchCount++;
                        $matchedKeywords[] = $keyword;
                    }
                }
            }
            
            if ($matchCount > 0) {
                // Calculate confidence based on matches
                $confidence = $this->calculateIntentConfidence($matchCount, count($keywords), strlen($text));
                $results[] = new IntentResult($intent, $confidence, [], false, null);
            }
        }
        
        // Sort by confidence descending
        usort($results, function($a, $b) {
            return $b->confidenceScore - $a->confidenceScore;
        });
        
        return $results;
    }
    
    /**
     * Check if text contains opt-out intent
     */
    public function hasOptOutIntent(string $text): bool {
        $lowerText = strtolower($text);
        
        foreach ($this->optOutKeywords as $keyword) {
            $keyword = strtolower($keyword);
            if (strpos($keyword, ' ') !== false) {
                if (strpos($lowerText, $keyword) !== false) {
                    return true;
                }
            } else {
                if (preg_match('/\b' . preg_quote($keyword, '/') . '\b/i', $lowerText)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Check for conflict between disposition and note sentiment
     */
    public function checkDispositionConflict(
        string $noteText, 
        string $dispositionCategory,
        string $detectedIntent
    ): array {
        // Analyze note sentiment
        $sentimentResult = $this->sentimentAnalyzer->analyze($noteText);
        $noteSentiment = $sentimentResult->sentiment;
        
        // Get expected sentiment from disposition category
        $expectedSentiment = $this->dispositionSentimentMap[$dispositionCategory] ?? 'neutral';
        
        // Check for conflict
        $hasConflict = false;
        $reason = null;
        
        // Positive disposition with negative notes = conflict
        if ($expectedSentiment === 'positive' && $noteSentiment === 'negative') {
            $hasConflict = true;
            $reason = "Disposition marked as positive ($dispositionCategory) but notes indicate negative sentiment";
        }
        // Negative disposition with positive notes = conflict
        elseif ($expectedSentiment === 'negative' && $noteSentiment === 'positive') {
            $hasConflict = true;
            $reason = "Disposition marked as negative ($dispositionCategory) but notes indicate positive sentiment";
        }
        // Intent conflicts - positive disposition with negative intents
        elseif ($expectedSentiment === 'positive' && in_array($detectedIntent, ['complaint', 'opt_out', 'not_qualified'])) {
            $hasConflict = true;
            $reason = "Disposition marked as positive but detected intent is '$detectedIntent'";
        }
        // Intent conflicts - negative disposition with positive intents
        elseif ($expectedSentiment === 'negative' && in_array($detectedIntent, ['purchase_intent', 'referral'])) {
            $hasConflict = true;
            $reason = "Disposition marked as negative but detected intent is '$detectedIntent'";
        }
        // Additional check: look for strong sentiment keywords directly
        elseif ($expectedSentiment === 'positive' && $this->hasStrongNegativeIndicators($noteText)) {
            $hasConflict = true;
            $reason = "Disposition marked as positive but notes contain strong negative indicators";
        }
        elseif ($expectedSentiment === 'negative' && $this->hasStrongPositiveIndicators($noteText)) {
            $hasConflict = true;
            $reason = "Disposition marked as negative but notes contain strong positive indicators";
        }
        
        return [
            'has_conflict' => $hasConflict,
            'reason' => $reason,
            'note_sentiment' => $noteSentiment,
            'expected_sentiment' => $expectedSentiment,
        ];
    }
    
    /**
     * Check for strong negative indicators in text
     */
    private function hasStrongNegativeIndicators(string $text): bool {
        $strongNegative = [
            'angry', 'frustrated', 'terrible', 'awful', 'complained', 
            'disappointed', 'upset', 'rip off', 'never again', 'worst'
        ];
        $lowerText = strtolower($text);
        
        foreach ($strongNegative as $indicator) {
            if (strpos($lowerText, $indicator) !== false) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Check for strong positive indicators in text
     */
    private function hasStrongPositiveIndicators(string $text): bool {
        $strongPositive = [
            'excited', 'happy', 'loved', 'amazing', 'perfect', 
            'thrilled', 'satisfied', 'wonderful', 'excellent', 'great'
        ];
        $lowerText = strtolower($text);
        
        foreach ($strongPositive as $indicator) {
            if (strpos($lowerText, $indicator) !== false) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Calculate confidence score for intent detection
     */
    private function calculateIntentConfidence(int $matchCount, int $totalKeywords, int $textLength): int {
        // Base confidence from match ratio
        $matchRatio = $matchCount / max(1, min($totalKeywords, 10));
        $baseConfidence = $matchRatio * 70;
        
        // Bonus for multiple matches
        $matchBonus = min(20, $matchCount * 5);
        
        // Slight penalty for very short text (might be false positive)
        $lengthPenalty = 0;
        if ($textLength < 20) {
            $lengthPenalty = 10;
        }
        
        $confidence = $baseConfidence + $matchBonus - $lengthPenalty;
        
        return max(0, min(100, (int)round($confidence)));
    }
    
    /**
     * Get current intent keywords
     */
    public function getIntentKeywords(): array {
        return $this->intentKeywords;
    }
    
    /**
     * Set custom intent keywords (for testing)
     */
    public function setIntentKeywords(array $keywords): void {
        $this->intentKeywords = $keywords;
    }
}
