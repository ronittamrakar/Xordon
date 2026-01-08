<?php
/**
 * Trigger Condition Evaluator
 * Evaluates complex trigger conditions with AND/OR logic and confidence thresholds
 */

require_once __DIR__ . '/SentimentAnalyzer.php';
require_once __DIR__ . '/IntentDetector.php';
require_once __DIR__ . '/SemanticMatcher.php';

class AnalysisContext {
    public ?SentimentResult $sentiment;
    public ?IntentResult $intent;
    public ?SemanticCategory $dispositionCategory;
    public string $channel;
    public ?int $campaignId;
    public array $metadata;
    
    public function __construct(
        ?SentimentResult $sentiment = null,
        ?IntentResult $intent = null,
        ?SemanticCategory $dispositionCategory = null,
        string $channel = '',
        ?int $campaignId = null,
        array $metadata = []
    ) {
        $this->sentiment = $sentiment;
        $this->intent = $intent;
        $this->dispositionCategory = $dispositionCategory;
        $this->channel = $channel;
        $this->campaignId = $campaignId;
        $this->metadata = $metadata;
    }
}

class EvaluationResult {
    public bool $triggered;
    public array $matchedConditions;
    public array $failedConditions;
    public array $confidenceScores;
    public ?string $skipReason;
    
    public function __construct(
        bool $triggered = false,
        array $matchedConditions = [],
        array $failedConditions = [],
        array $confidenceScores = [],
        ?string $skipReason = null
    ) {
        $this->triggered = $triggered;
        $this->matchedConditions = $matchedConditions;
        $this->failedConditions = $failedConditions;
        $this->confidenceScores = $confidenceScores;
        $this->skipReason = $skipReason;
    }
    
    public function toArray(): array {
        return [
            'triggered' => $this->triggered,
            'matched_conditions' => $this->matchedConditions,
            'failed_conditions' => $this->failedConditions,
            'confidence_scores' => $this->confidenceScores,
            'skip_reason' => $this->skipReason,
        ];
    }
}

class TriggerEvaluator {
    
    private int $defaultConfidenceThreshold = 70;
    
    /**
     * Evaluate if trigger conditions are met
     */
    public function evaluate(array $conditions, AnalysisContext $context): EvaluationResult {
        if (empty($conditions)) {
            return new EvaluationResult(true, [], [], [], null);
        }
        
        $matchedConditions = [];
        $failedConditions = [];
        $confidenceScores = [];
        
        // Check for AND/OR logic wrapper
        $logic = $conditions['logic'] ?? 'AND';
        $conditionList = $conditions['conditions'] ?? [$conditions];
        
        // If conditions is a flat array without logic wrapper, treat as AND
        if (!isset($conditions['logic']) && !isset($conditions['conditions'])) {
            $conditionList = [$conditions];
            $logic = 'AND';
        }
        
        foreach ($conditionList as $condition) {
            // Handle nested condition groups
            if (isset($condition['logic']) && isset($condition['conditions'])) {
                $nestedResult = $this->evaluate($condition, $context);
                if ($nestedResult->triggered) {
                    $matchedConditions[] = [
                        'type' => 'nested_group',
                        'logic' => $condition['logic'],
                        'result' => 'matched'
                    ];
                } else {
                    $failedConditions[] = [
                        'type' => 'nested_group',
                        'logic' => $condition['logic'],
                        'result' => 'failed',
                        'reason' => $nestedResult->skipReason
                    ];
                }
                continue;
            }
            
            // Evaluate single condition
            $result = $this->evaluateSingleCondition($condition, $context);
            
            if ($result['matched']) {
                $matchedConditions[] = $result;
                if (isset($result['confidence'])) {
                    $confidenceScores[$result['type']] = $result['confidence'];
                }
            } else {
                $failedConditions[] = $result;
            }
        }
        
        // Determine if triggered based on logic
        $triggered = false;
        $skipReason = null;
        
        if ($logic === 'AND') {
            $triggered = empty($failedConditions);
            if (!$triggered && !empty($failedConditions)) {
                $skipReason = "AND condition failed: " . ($failedConditions[0]['reason'] ?? 'Unknown');
            }
        } elseif ($logic === 'OR') {
            $triggered = !empty($matchedConditions);
            if (!$triggered) {
                $skipReason = "OR condition failed: No conditions matched";
            }
        }
        
        return new EvaluationResult(
            $triggered,
            $matchedConditions,
            $failedConditions,
            $confidenceScores,
            $skipReason
        );
    }
    
    /**
     * Evaluate a single condition
     */
    private function evaluateSingleCondition(array $condition, AnalysisContext $context): array {
        $type = $condition['type'] ?? '';
        $value = $condition['value'] ?? null;
        $threshold = $condition['confidence_threshold'] ?? $this->defaultConfidenceThreshold;
        
        switch ($type) {
            case 'sentiment':
                return $this->evaluateSentimentCondition($value, $threshold, $context);
                
            case 'intent':
                return $this->evaluateIntentCondition($value, $threshold, $context);
                
            case 'disposition_category':
                return $this->evaluateDispositionCategoryCondition($value, $threshold, $context);
                
            case 'channel':
                return $this->evaluateChannelCondition($value, $context);
                
            case 'campaign':
                return $this->evaluateCampaignCondition($value, $context);
                
            case 'keyword':
                return $this->evaluateKeywordCondition($value, $condition['field'] ?? 'notes', $context);
                
            case 'confidence_min':
                return $this->evaluateMinConfidenceCondition($value, $context);
                
            default:
                return [
                    'type' => $type,
                    'matched' => false,
                    'reason' => "Unknown condition type: $type"
                ];
        }
    }
    
    /**
     * Evaluate sentiment condition
     */
    private function evaluateSentimentCondition($expectedSentiment, int $threshold, AnalysisContext $context): array {
        if (!$context->sentiment) {
            return [
                'type' => 'sentiment',
                'matched' => false,
                'reason' => 'No sentiment analysis available'
            ];
        }
        
        $actualSentiment = $context->sentiment->sentiment;
        $confidence = $context->sentiment->confidenceScore;
        
        // Check if sentiment matches
        if ($actualSentiment !== $expectedSentiment) {
            return [
                'type' => 'sentiment',
                'matched' => false,
                'expected' => $expectedSentiment,
                'actual' => $actualSentiment,
                'reason' => "Sentiment mismatch: expected '$expectedSentiment', got '$actualSentiment'"
            ];
        }
        
        // Check confidence threshold
        if ($confidence < $threshold) {
            return [
                'type' => 'sentiment',
                'matched' => false,
                'expected' => $expectedSentiment,
                'actual' => $actualSentiment,
                'confidence' => $confidence,
                'threshold' => $threshold,
                'reason' => "Confidence below threshold: $confidence < $threshold"
            ];
        }
        
        return [
            'type' => 'sentiment',
            'matched' => true,
            'value' => $actualSentiment,
            'confidence' => $confidence
        ];
    }
    
    /**
     * Evaluate intent condition
     */
    private function evaluateIntentCondition($expectedIntent, int $threshold, AnalysisContext $context): array {
        if (!$context->intent) {
            return [
                'type' => 'intent',
                'matched' => false,
                'reason' => 'No intent analysis available'
            ];
        }
        
        $actualIntent = $context->intent->primaryIntent;
        $confidence = $context->intent->confidenceScore;
        
        // Check if intent matches (primary or secondary)
        $intentMatches = ($actualIntent === $expectedIntent);
        
        if (!$intentMatches) {
            // Check secondary intents
            foreach ($context->intent->secondaryIntents as $secondary) {
                if ($secondary['intent'] === $expectedIntent && $secondary['confidence'] >= $threshold) {
                    $intentMatches = true;
                    $confidence = $secondary['confidence'];
                    break;
                }
            }
        }
        
        if (!$intentMatches) {
            return [
                'type' => 'intent',
                'matched' => false,
                'expected' => $expectedIntent,
                'actual' => $actualIntent,
                'reason' => "Intent mismatch: expected '$expectedIntent', got '$actualIntent'"
            ];
        }
        
        // Check confidence threshold
        if ($confidence < $threshold) {
            return [
                'type' => 'intent',
                'matched' => false,
                'expected' => $expectedIntent,
                'confidence' => $confidence,
                'threshold' => $threshold,
                'reason' => "Confidence below threshold: $confidence < $threshold"
            ];
        }
        
        return [
            'type' => 'intent',
            'matched' => true,
            'value' => $expectedIntent,
            'confidence' => $confidence
        ];
    }
    
    /**
     * Evaluate disposition category condition
     */
    private function evaluateDispositionCategoryCondition($expectedCategory, int $threshold, AnalysisContext $context): array {
        if (!$context->dispositionCategory) {
            return [
                'type' => 'disposition_category',
                'matched' => false,
                'reason' => 'No disposition category available'
            ];
        }
        
        $actualCategory = $context->dispositionCategory->category;
        $confidence = $context->dispositionCategory->confidence;
        
        if ($actualCategory !== $expectedCategory) {
            return [
                'type' => 'disposition_category',
                'matched' => false,
                'expected' => $expectedCategory,
                'actual' => $actualCategory,
                'reason' => "Category mismatch: expected '$expectedCategory', got '$actualCategory'"
            ];
        }
        
        if ($confidence < $threshold) {
            return [
                'type' => 'disposition_category',
                'matched' => false,
                'confidence' => $confidence,
                'threshold' => $threshold,
                'reason' => "Confidence below threshold: $confidence < $threshold"
            ];
        }
        
        return [
            'type' => 'disposition_category',
            'matched' => true,
            'value' => $actualCategory,
            'confidence' => $confidence
        ];
    }
    
    /**
     * Evaluate channel condition
     */
    private function evaluateChannelCondition($expectedChannel, AnalysisContext $context): array {
        if ($context->channel === $expectedChannel) {
            return [
                'type' => 'channel',
                'matched' => true,
                'value' => $expectedChannel
            ];
        }
        
        return [
            'type' => 'channel',
            'matched' => false,
            'expected' => $expectedChannel,
            'actual' => $context->channel,
            'reason' => "Channel mismatch: expected '$expectedChannel', got '{$context->channel}'"
        ];
    }
    
    /**
     * Evaluate campaign condition
     */
    private function evaluateCampaignCondition($expectedCampaignId, AnalysisContext $context): array {
        if ($context->campaignId === (int)$expectedCampaignId) {
            return [
                'type' => 'campaign',
                'matched' => true,
                'value' => $expectedCampaignId
            ];
        }
        
        return [
            'type' => 'campaign',
            'matched' => false,
            'expected' => $expectedCampaignId,
            'actual' => $context->campaignId,
            'reason' => "Campaign mismatch"
        ];
    }
    
    /**
     * Evaluate keyword condition
     */
    private function evaluateKeywordCondition($keyword, string $field, AnalysisContext $context): array {
        $text = $context->metadata[$field] ?? '';
        
        if (stripos($text, $keyword) !== false) {
            return [
                'type' => 'keyword',
                'matched' => true,
                'keyword' => $keyword,
                'field' => $field
            ];
        }
        
        return [
            'type' => 'keyword',
            'matched' => false,
            'keyword' => $keyword,
            'field' => $field,
            'reason' => "Keyword '$keyword' not found in $field"
        ];
    }
    
    /**
     * Evaluate minimum confidence condition
     */
    private function evaluateMinConfidenceCondition(int $minConfidence, AnalysisContext $context): array {
        $maxConfidence = 0;
        
        if ($context->sentiment) {
            $maxConfidence = max($maxConfidence, $context->sentiment->confidenceScore);
        }
        if ($context->intent) {
            $maxConfidence = max($maxConfidence, $context->intent->confidenceScore);
        }
        if ($context->dispositionCategory) {
            $maxConfidence = max($maxConfidence, $context->dispositionCategory->confidence);
        }
        
        if ($maxConfidence >= $minConfidence) {
            return [
                'type' => 'confidence_min',
                'matched' => true,
                'confidence' => $maxConfidence,
                'threshold' => $minConfidence
            ];
        }
        
        return [
            'type' => 'confidence_min',
            'matched' => false,
            'confidence' => $maxConfidence,
            'threshold' => $minConfidence,
            'reason' => "Max confidence $maxConfidence below threshold $minConfidence"
        ];
    }
    
    /**
     * Set default confidence threshold
     */
    public function setDefaultThreshold(int $threshold): void {
        $this->defaultConfidenceThreshold = max(0, min(100, $threshold));
    }
    
    /**
     * Get default confidence threshold
     */
    public function getDefaultThreshold(): int {
        return $this->defaultConfidenceThreshold;
    }
}
