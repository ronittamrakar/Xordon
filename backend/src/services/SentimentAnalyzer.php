<?php
/**
 * Sentiment Analysis Engine
 * Analyzes text content to determine sentiment classification and confidence
 */

require_once __DIR__ . '/../Database.php';

class SentimentResult {
    public string $sentiment;
    public int $confidenceScore;
    public array $detectedKeywords;
    public bool $isMixedSentiment;
    public ?string $dominantEmotion;
    
    public function __construct(
        string $sentiment = 'neutral',
        int $confidenceScore = 0,
        array $detectedKeywords = [],
        bool $isMixedSentiment = false,
        ?string $dominantEmotion = null
    ) {
        $this->sentiment = $sentiment;
        $this->confidenceScore = max(0, min(100, $confidenceScore));
        $this->detectedKeywords = $detectedKeywords;
        $this->isMixedSentiment = $isMixedSentiment;
        $this->dominantEmotion = $dominantEmotion;
    }
    
    public function toArray(): array {
        return [
            'sentiment' => $this->sentiment,
            'confidence_score' => $this->confidenceScore,
            'detected_keywords' => $this->detectedKeywords,
            'is_mixed_sentiment' => $this->isMixedSentiment,
            'dominant_emotion' => $this->dominantEmotion,
        ];
    }
}

class SentimentAnalyzer {
    
    private array $positiveKeywords = [];
    private array $negativeKeywords = [];
    private array $smsAbbreviations = [];
    
    // Emotion indicators for more nuanced analysis
    private array $emotionIndicators = [
        'happy' => ['happy', 'glad', 'pleased', 'delighted', 'thrilled', 'excited'],
        'angry' => ['angry', 'furious', 'mad', 'outraged', 'livid'],
        'frustrated' => ['frustrated', 'annoyed', 'irritated', 'fed up'],
        'satisfied' => ['satisfied', 'content', 'fulfilled'],
        'disappointed' => ['disappointed', 'let down', 'dissatisfied'],
        'confused' => ['confused', 'unclear', 'dont understand', "don't understand"],
    ];
    
    public function __construct(?int $userId = null) {
        $this->loadKeywords($userId);
        $this->initSmsAbbreviations();
    }
    
    /**
     * Load keywords from database configuration
     */
    private function loadKeywords(?int $userId): void {
        try {
            $pdo = Database::conn();
            
            // Load user-specific config or fall back to system defaults
            $sql = 'SELECT positive_keywords, negative_keywords FROM sentiment_config 
                    WHERE user_id = ? OR user_id = 0 
                    ORDER BY user_id DESC LIMIT 1';
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$userId ?? 0]);
            $config = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($config) {
                $this->positiveKeywords = json_decode($config['positive_keywords'] ?? '[]', true) ?: [];
                $this->negativeKeywords = json_decode($config['negative_keywords'] ?? '[]', true) ?: [];
            }
        } catch (Exception $e) {
            // Fall back to defaults if database unavailable
            $this->loadDefaultKeywords();
        }
        
        // Ensure we have at least default keywords
        if (empty($this->positiveKeywords)) {
            $this->loadDefaultKeywords();
        }
    }
    
    /**
     * Load default keywords
     */
    private function loadDefaultKeywords(): void {
        $this->positiveKeywords = [
            'interested', 'excited', 'great', 'love', 'perfect', 'amazing', 
            'wonderful', 'excellent', 'happy', 'pleased', 'satisfied', 'yes', 
            'definitely', 'absolutely', 'sure', 'want', 'need', 'buy', 
            'purchase', 'sign up', 'agree', 'thanks', 'thank you', 'appreciate',
            'good', 'nice', 'awesome', 'fantastic', 'brilliant', 'superb'
        ];
        
        $this->negativeKeywords = [
            'not interested', 'no', 'never', 'hate', 'terrible', 'awful', 
            'bad', 'worst', 'angry', 'frustrated', 'disappointed', 'annoyed', 
            'upset', 'complaint', 'problem', 'issue', 'cancel', 'refund', 
            'stop', 'remove', 'unsubscribe', 'dont call', 'do not call', 
            'leave me alone'
        ];
    }
    
    /**
     * Initialize SMS abbreviation dictionary
     */
    private function initSmsAbbreviations(): void {
        $this->smsAbbreviations = [
            'thx' => 'thanks',
            'thnx' => 'thanks',
            'ty' => 'thank you',
            'pls' => 'please',
            'plz' => 'please',
            'u' => 'you',
            'ur' => 'your',
            'r' => 'are',
            '2' => 'to',
            '4' => 'for',
            'b4' => 'before',
            'bc' => 'because',
            'bcuz' => 'because',
            'cuz' => 'because',
            'w/' => 'with',
            'w/o' => 'without',
            'idk' => 'i do not know',
            'imo' => 'in my opinion',
            'imho' => 'in my humble opinion',
            'btw' => 'by the way',
            'fyi' => 'for your information',
            'asap' => 'as soon as possible',
            'np' => 'no problem',
            'nvm' => 'never mind',
            'omg' => 'oh my god',
            'lol' => 'laughing',
            'lmao' => 'laughing',
            'gr8' => 'great',
            'gd' => 'great',
            'gud' => 'great',
            'k' => 'okay',
            'ok' => 'okay',
            'kk' => 'okay',
            'msg' => 'message',
            'txt' => 'text',
            'tmr' => 'tomorrow',
            'tmrw' => 'tomorrow',
            'yday' => 'yesterday',
            'rn' => 'right now',
            'atm' => 'at the moment',
            'tbh' => 'to be honest',
            'ngl' => 'not going to lie',
            'ily' => 'i love you',
            'jk' => 'just kidding',
            'brb' => 'be right back',
            'gtg' => 'got to go',
            'ttyl' => 'talk to you later',
            'hbu' => 'how about you',
            'wbu' => 'what about you',
            'wyd' => 'what are you doing',
            'smh' => 'shaking my head',
            'ikr' => 'i know right',
            'dm' => 'direct message',
            'ppl' => 'people',
            'sry' => 'sorry',
            'srry' => 'sorry',
            'def' => 'definitely',
            'prob' => 'probably',
            'probs' => 'probably',
            'tho' => 'though',
            'rly' => 'really',
            'rlly' => 'really',
            'v' => 'very',
            'obv' => 'obviously',
            'obvs' => 'obviously',
        ];
    }
    
    /**
     * Expand SMS abbreviations in text
     */
    public function expandAbbreviations(string $text): string {
        $words = preg_split('/(\s+)/', $text, -1, PREG_SPLIT_DELIM_CAPTURE);
        $expanded = [];
        
        foreach ($words as $word) {
            $lowerWord = strtolower(trim($word));
            if (isset($this->smsAbbreviations[$lowerWord])) {
                $expanded[] = $this->smsAbbreviations[$lowerWord];
            } else {
                $expanded[] = $word;
            }
        }
        
        return implode('', $expanded);
    }
    
    /**
     * Analyze text and return sentiment result
     */
    public function analyze(string $text, array $customKeywords = []): SentimentResult {
        if (empty(trim($text))) {
            return new SentimentResult('neutral', 0, [], false, null);
        }
        
        // Expand SMS abbreviations
        $processedText = $this->expandAbbreviations($text);
        $lowerText = strtolower($processedText);
        
        // Merge custom keywords if provided
        $positiveWords = array_merge($this->positiveKeywords, $customKeywords['positive'] ?? []);
        $negativeWords = array_merge($this->negativeKeywords, $customKeywords['negative'] ?? []);
        
        // Detect keywords
        $detectedPositive = $this->findKeywords($lowerText, $positiveWords);
        $detectedNegative = $this->findKeywords($lowerText, $negativeWords);
        
        $positiveCount = count($detectedPositive);
        $negativeCount = count($detectedNegative);
        $totalKeywords = $positiveCount + $negativeCount;
        
        // Determine sentiment
        $sentiment = 'neutral';
        $isMixedSentiment = false;
        
        if ($positiveCount > 0 && $negativeCount > 0) {
            $isMixedSentiment = true;
            $sentiment = $positiveCount > $negativeCount ? 'positive' : 'negative';
        } elseif ($positiveCount > 0) {
            $sentiment = 'positive';
        } elseif ($negativeCount > 0) {
            $sentiment = 'negative';
        }
        
        // Calculate confidence score
        $confidenceScore = $this->calculateConfidence($positiveCount, $negativeCount, strlen($text));
        
        // Detect dominant emotion
        $dominantEmotion = $this->detectEmotion($lowerText);
        
        // Combine detected keywords
        $allDetected = array_merge(
            array_map(fn($k) => ['keyword' => $k, 'polarity' => 'positive'], $detectedPositive),
            array_map(fn($k) => ['keyword' => $k, 'polarity' => 'negative'], $detectedNegative)
        );
        
        return new SentimentResult(
            $sentiment,
            $confidenceScore,
            $allDetected,
            $isMixedSentiment,
            $dominantEmotion
        );
    }
    
    /**
     * Analyze with context from previous interactions
     */
    public function analyzeWithContext(string $text, array $history = []): SentimentResult {
        $currentResult = $this->analyze($text);
        
        // If we have history, we could adjust confidence based on consistency
        if (!empty($history)) {
            $historySentiments = array_column($history, 'sentiment');
            $consistentCount = array_count_values($historySentiments)[$currentResult->sentiment] ?? 0;
            
            // Boost confidence if consistent with history
            if ($consistentCount > count($history) / 2) {
                $currentResult->confidenceScore = min(100, $currentResult->confidenceScore + 10);
            }
        }
        
        return $currentResult;
    }
    
    /**
     * Extract sentiment keywords from text
     */
    public function extractKeywords(string $text): array {
        $lowerText = strtolower($this->expandAbbreviations($text));
        
        $positive = $this->findKeywords($lowerText, $this->positiveKeywords);
        $negative = $this->findKeywords($lowerText, $this->negativeKeywords);
        
        return [
            'positive' => $positive,
            'negative' => $negative,
        ];
    }
    
    /**
     * Find keywords in text
     */
    private function findKeywords(string $text, array $keywords): array {
        $found = [];
        
        foreach ($keywords as $keyword) {
            $keyword = strtolower($keyword);
            // Use word boundary matching for single words, contains for phrases
            if (strpos($keyword, ' ') !== false) {
                // Multi-word phrase - use contains
                if (strpos($text, $keyword) !== false) {
                    $found[] = $keyword;
                }
            } else {
                // Single word - use word boundary
                if (preg_match('/\b' . preg_quote($keyword, '/') . '\b/i', $text)) {
                    $found[] = $keyword;
                }
            }
        }
        
        return array_unique($found);
    }
    
    /**
     * Calculate confidence score based on keyword matches and text length
     */
    private function calculateConfidence(int $positiveCount, int $negativeCount, int $textLength): int {
        $totalKeywords = $positiveCount + $negativeCount;
        
        if ($totalKeywords === 0) {
            return 30; // Low confidence for no keywords
        }
        
        // Base confidence from keyword count
        $baseConfidence = min(80, $totalKeywords * 20);
        
        // Adjust for text length (longer text with same keywords = lower confidence)
        $lengthFactor = 1;
        if ($textLength > 500) {
            $lengthFactor = 0.9;
        } elseif ($textLength > 1000) {
            $lengthFactor = 0.8;
        }
        
        // Adjust for mixed sentiment (reduces confidence)
        $mixedPenalty = 0;
        if ($positiveCount > 0 && $negativeCount > 0) {
            $mixedPenalty = 15;
        }
        
        // Boost for strong signal (many keywords of same type)
        $dominanceBoost = 0;
        if ($totalKeywords > 0) {
            $dominance = max($positiveCount, $negativeCount) / $totalKeywords;
            if ($dominance > 0.8) {
                $dominanceBoost = 10;
            }
        }
        
        $confidence = ($baseConfidence * $lengthFactor) - $mixedPenalty + $dominanceBoost;
        
        return max(0, min(100, (int)round($confidence)));
    }
    
    /**
     * Detect dominant emotion from text
     */
    private function detectEmotion(string $text): ?string {
        $emotionScores = [];
        
        foreach ($this->emotionIndicators as $emotion => $indicators) {
            $count = 0;
            foreach ($indicators as $indicator) {
                if (strpos($text, strtolower($indicator)) !== false) {
                    $count++;
                }
            }
            if ($count > 0) {
                $emotionScores[$emotion] = $count;
            }
        }
        
        if (empty($emotionScores)) {
            return null;
        }
        
        arsort($emotionScores);
        return array_key_first($emotionScores);
    }
    
    /**
     * Get current keyword lists
     */
    public function getKeywords(): array {
        return [
            'positive' => $this->positiveKeywords,
            'negative' => $this->negativeKeywords,
        ];
    }
    
    /**
     * Set custom keywords (for testing or runtime override)
     */
    public function setKeywords(array $positive, array $negative): void {
        $this->positiveKeywords = $positive;
        $this->negativeKeywords = $negative;
    }
}
