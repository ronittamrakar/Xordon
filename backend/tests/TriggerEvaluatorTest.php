<?php
/**
 * Property-Based Tests for TriggerEvaluator
 * 
 * Run with: php backend/tests/TriggerEvaluatorTest.php
 */

require_once __DIR__ . '/../src/services/TriggerEvaluator.php';

class TriggerEvaluatorTest {
    
    private TriggerEvaluator $evaluator;
    private int $passed = 0;
    private int $failed = 0;
    
    public function __construct() {
        $this->evaluator = new TriggerEvaluator();
    }
    
    public function runAll(): void {
        echo "=== TriggerEvaluator Property Tests ===\n\n";
        
        $this->testProperty7_ConfidenceThresholdFiltering();
        $this->testProperty8_AndOrConditionLogic();
        $this->testProperty9_TriggerReasonLogging();
        
        echo "\n=== Test Summary ===\n";
        echo "Passed: {$this->passed}\n";
        echo "Failed: {$this->failed}\n";
        echo "Total: " . ($this->passed + $this->failed) . "\n";
    }
    
    /**
     * **Feature: intelligent-followup-automations, Property 7: Confidence Threshold Filtering**
     * 
     * For any automation with a minimum confidence threshold configured, the automation 
     * SHALL only trigger when the analysis confidence score is >= the threshold.
     * 
     * **Validates: Requirements 3.2**
     */
    public function testProperty7_ConfidenceThresholdFiltering(): void {
        echo "Property 7: Confidence Threshold Filtering\n";
        echo "  Validates: Requirements 3.2\n";
        
        $failures = [];
        
        // Test various confidence levels against thresholds
        $testCases = [
            ['confidence' => 80, 'threshold' => 70, 'should_trigger' => true],
            ['confidence' => 70, 'threshold' => 70, 'should_trigger' => true],
            ['confidence' => 69, 'threshold' => 70, 'should_trigger' => false],
            ['confidence' => 50, 'threshold' => 70, 'should_trigger' => false],
            ['confidence' => 90, 'threshold' => 50, 'should_trigger' => true],
            ['confidence' => 100, 'threshold' => 100, 'should_trigger' => true],
            ['confidence' => 99, 'threshold' => 100, 'should_trigger' => false],
        ];
        
        foreach ($testCases as $case) {
            $sentiment = new SentimentResult('positive', $case['confidence']);
            $context = new AnalysisContext($sentiment);
            
            $conditions = [
                'type' => 'sentiment',
                'value' => 'positive',
                'confidence_threshold' => $case['threshold']
            ];
            
            $result = $this->evaluator->evaluate($conditions, $context);
            
            if ($result->triggered !== $case['should_trigger']) {
                $failures[] = "Confidence {$case['confidence']} with threshold {$case['threshold']}: " .
                    "expected " . ($case['should_trigger'] ? 'trigger' : 'no trigger') . 
                    ", got " . ($result->triggered ? 'trigger' : 'no trigger');
            }
        }
        
        $this->reportResult('Property 7', $failures);
    }
    
    /**
     * **Feature: intelligent-followup-automations, Property 8: AND/OR Condition Logic Evaluation**
     * 
     * For AND logic, all sub-conditions must be satisfied. For OR logic, at least one must be satisfied.
     * 
     * **Validates: Requirements 3.3**
     */
    public function testProperty8_AndOrConditionLogic(): void {
        echo "Property 8: AND/OR Condition Logic Evaluation\n";
        echo "  Validates: Requirements 3.3\n";
        
        $failures = [];
        
        // Create context with positive sentiment and purchase intent
        $sentiment = new SentimentResult('positive', 85);
        $intent = new IntentResult('purchase_intent', 80);
        $context = new AnalysisContext($sentiment, $intent, null, 'call');
        
        // Test AND logic - all must match
        $andConditions = [
            'logic' => 'AND',
            'conditions' => [
                ['type' => 'sentiment', 'value' => 'positive', 'confidence_threshold' => 70],
                ['type' => 'intent', 'value' => 'purchase_intent', 'confidence_threshold' => 70],
            ]
        ];
        
        $result = $this->evaluator->evaluate($andConditions, $context);
        if (!$result->triggered) {
            $failures[] = "AND with all matching conditions should trigger";
        }
        
        // Test AND logic - one fails
        $andConditionsFail = [
            'logic' => 'AND',
            'conditions' => [
                ['type' => 'sentiment', 'value' => 'positive', 'confidence_threshold' => 70],
                ['type' => 'intent', 'value' => 'complaint', 'confidence_threshold' => 70], // Won't match
            ]
        ];
        
        $result = $this->evaluator->evaluate($andConditionsFail, $context);
        if ($result->triggered) {
            $failures[] = "AND with one failing condition should NOT trigger";
        }
        
        // Test OR logic - one matches
        $orConditions = [
            'logic' => 'OR',
            'conditions' => [
                ['type' => 'sentiment', 'value' => 'negative', 'confidence_threshold' => 70], // Won't match
                ['type' => 'intent', 'value' => 'purchase_intent', 'confidence_threshold' => 70], // Will match
            ]
        ];
        
        $result = $this->evaluator->evaluate($orConditions, $context);
        if (!$result->triggered) {
            $failures[] = "OR with one matching condition should trigger";
        }
        
        // Test OR logic - none match
        $orConditionsFail = [
            'logic' => 'OR',
            'conditions' => [
                ['type' => 'sentiment', 'value' => 'negative', 'confidence_threshold' => 70],
                ['type' => 'intent', 'value' => 'complaint', 'confidence_threshold' => 70],
            ]
        ];
        
        $result = $this->evaluator->evaluate($orConditionsFail, $context);
        if ($result->triggered) {
            $failures[] = "OR with no matching conditions should NOT trigger";
        }
        
        $this->reportResult('Property 8', $failures);
    }
    
    /**
     * **Feature: intelligent-followup-automations, Property 9: Trigger Reason Logging Completeness**
     * 
     * For any automation execution, the log SHALL contain trigger_reason with all evaluated 
     * conditions, their results, and confidence scores.
     * 
     * **Validates: Requirements 3.4, 9.1, 9.2, 9.4**
     */
    public function testProperty9_TriggerReasonLogging(): void {
        echo "Property 9: Trigger Reason Logging Completeness\n";
        echo "  Validates: Requirements 3.4, 9.1, 9.2, 9.4\n";
        
        $failures = [];
        
        // Test that matched conditions are logged
        $sentiment = new SentimentResult('positive', 85);
        $context = new AnalysisContext($sentiment);
        
        $conditions = [
            'type' => 'sentiment',
            'value' => 'positive',
            'confidence_threshold' => 70
        ];
        
        $result = $this->evaluator->evaluate($conditions, $context);
        
        if (empty($result->matchedConditions)) {
            $failures[] = "Matched conditions should be logged";
        } else {
            $matched = $result->matchedConditions[0];
            if (!isset($matched['type']) || !isset($matched['confidence'])) {
                $failures[] = "Matched condition should include type and confidence";
            }
        }
        
        // Test that failed conditions are logged with reason
        $conditions = [
            'type' => 'sentiment',
            'value' => 'negative', // Won't match
            'confidence_threshold' => 70
        ];
        
        $result = $this->evaluator->evaluate($conditions, $context);
        
        if (empty($result->failedConditions)) {
            $failures[] = "Failed conditions should be logged";
        } else {
            $failed = $result->failedConditions[0];
            if (!isset($failed['reason'])) {
                $failures[] = "Failed condition should include reason";
            }
        }
        
        // Test skip reason for confidence threshold
        $lowConfidenceSentiment = new SentimentResult('positive', 50);
        $lowContext = new AnalysisContext($lowConfidenceSentiment);
        
        $conditions = [
            'type' => 'sentiment',
            'value' => 'positive',
            'confidence_threshold' => 70
        ];
        
        $result = $this->evaluator->evaluate($conditions, $lowContext);
        
        if ($result->triggered) {
            $failures[] = "Should not trigger with low confidence";
        }
        
        if (empty($result->failedConditions)) {
            $failures[] = "Should log failed condition for low confidence";
        } else {
            $failed = $result->failedConditions[0];
            if (!isset($failed['threshold']) || !isset($failed['confidence'])) {
                $failures[] = "Failed condition should include threshold and actual confidence";
            }
        }
        
        // Test confidence scores are recorded
        $sentiment = new SentimentResult('positive', 85);
        $intent = new IntentResult('purchase_intent', 90);
        $context = new AnalysisContext($sentiment, $intent);
        
        $conditions = [
            'logic' => 'AND',
            'conditions' => [
                ['type' => 'sentiment', 'value' => 'positive', 'confidence_threshold' => 70],
                ['type' => 'intent', 'value' => 'purchase_intent', 'confidence_threshold' => 70],
            ]
        ];
        
        $result = $this->evaluator->evaluate($conditions, $context);
        
        if (empty($result->confidenceScores)) {
            $failures[] = "Confidence scores should be recorded";
        }
        
        $this->reportResult('Property 9', $failures);
    }
    
    private function reportResult(string $propertyName, array $failures): void {
        if (empty($failures)) {
            echo "  ✓ PASSED\n\n";
            $this->passed++;
        } else {
            echo "  ✗ FAILED (" . count($failures) . " failures)\n";
            foreach (array_slice($failures, 0, 3) as $failure) {
                echo "    - $failure\n";
            }
            if (count($failures) > 3) {
                echo "    ... and " . (count($failures) - 3) . " more\n";
            }
            echo "\n";
            $this->failed++;
        }
    }
}

// Run tests if executed directly
if (php_sapi_name() === 'cli' && basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    $test = new TriggerEvaluatorTest();
    $test->runAll();
}
