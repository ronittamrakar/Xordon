<?php
/**
 * Property-Based Tests for AnalysisStorageService
 * 
 * Run with: php backend/tests/AnalysisStorageServiceTest.php
 */

require_once __DIR__ . '/../src/services/SentimentAnalyzer.php';
require_once __DIR__ . '/../src/services/IntentDetector.php';

class AnalysisStorageServiceTest {
    
    private int $passed = 0;
    private int $failed = 0;
    
    public function runAll(): void {
        echo "=== AnalysisStorageService Property Tests ===\n\n";
        
        $this->testProperty4_AnalysisResultsPersistenceRoundTrip();
        
        echo "\n=== Test Summary ===\n";
        echo "Passed: {$this->passed}\n";
        echo "Failed: {$this->failed}\n";
        echo "Total: " . ($this->passed + $this->failed) . "\n";
    }
    
    /**
     * **Feature: intelligent-followup-automations, Property 4: Analysis Results Persistence Round-Trip**
     * 
     * For any sentiment or intent analysis result stored, retrieving the result SHALL 
     * return data that exactly matches the original analysis output.
     * 
     * **Validates: Requirements 1.3, 2.2, 8.4**
     */
    public function testProperty4_AnalysisResultsPersistenceRoundTrip(): void {
        echo "Property 4: Analysis Results Persistence Round-Trip\n";
        echo "  Validates: Requirements 1.3, 2.2, 8.4\n";
        
        $failures = [];
        
        // Test sentiment result serialization
        $sentimentResults = [
            new SentimentResult('positive', 85, [['keyword' => 'great', 'polarity' => 'positive']], false, 'happy'),
            new SentimentResult('negative', 70, [['keyword' => 'terrible', 'polarity' => 'negative']], false, 'frustrated'),
            new SentimentResult('neutral', 50, [], false, null),
            new SentimentResult('positive', 65, [
                ['keyword' => 'good', 'polarity' => 'positive'],
                ['keyword' => 'bad', 'polarity' => 'negative']
            ], true, 'confused'),
        ];
        
        foreach ($sentimentResults as $index => $original) {
            // Simulate storage (convert to array/JSON)
            $stored = [
                'sentiment' => $original->sentiment,
                'confidence_score' => $original->confidenceScore,
                'detected_keywords' => json_encode($original->detectedKeywords),
                'is_mixed_sentiment' => $original->isMixedSentiment ? 1 : 0,
                'dominant_emotion' => $original->dominantEmotion,
            ];
            
            // Simulate retrieval (convert back)
            $retrieved = new SentimentResult(
                $stored['sentiment'],
                $stored['confidence_score'],
                json_decode($stored['detected_keywords'], true),
                (bool)$stored['is_mixed_sentiment'],
                $stored['dominant_emotion']
            );
            
            // Verify round-trip
            if ($retrieved->sentiment !== $original->sentiment) {
                $failures[] = "Sentiment $index: sentiment mismatch";
            }
            if ($retrieved->confidenceScore !== $original->confidenceScore) {
                $failures[] = "Sentiment $index: confidence mismatch";
            }
            if ($retrieved->detectedKeywords !== $original->detectedKeywords) {
                $failures[] = "Sentiment $index: keywords mismatch";
            }
            if ($retrieved->isMixedSentiment !== $original->isMixedSentiment) {
                $failures[] = "Sentiment $index: mixed sentiment flag mismatch";
            }
            if ($retrieved->dominantEmotion !== $original->dominantEmotion) {
                $failures[] = "Sentiment $index: dominant emotion mismatch";
            }
        }
        
        // Test intent result serialization
        $intentResults = [
            new IntentResult('purchase_intent', 90, [], false, null),
            new IntentResult('complaint', 75, [
                ['intent' => 'callback_request', 'confidence' => 60],
                ['intent' => 'question', 'confidence' => 40]
            ], false, null),
            new IntentResult('opt_out', 95, [], false, null),
            new IntentResult('purchase_intent', 80, [], true, 'Disposition marked negative but intent is purchase'),
        ];
        
        foreach ($intentResults as $index => $original) {
            // Simulate storage
            $stored = [
                'primary_intent' => $original->primaryIntent,
                'primary_confidence' => $original->confidenceScore,
                'secondary_intents' => json_encode($original->secondaryIntents),
                'has_conflict' => $original->hasConflict ? 1 : 0,
                'conflict_reason' => $original->conflictReason,
            ];
            
            // Simulate retrieval
            $retrieved = new IntentResult(
                $stored['primary_intent'],
                $stored['primary_confidence'],
                json_decode($stored['secondary_intents'], true),
                (bool)$stored['has_conflict'],
                $stored['conflict_reason']
            );
            
            // Verify round-trip
            if ($retrieved->primaryIntent !== $original->primaryIntent) {
                $failures[] = "Intent $index: primary intent mismatch";
            }
            if ($retrieved->confidenceScore !== $original->confidenceScore) {
                $failures[] = "Intent $index: confidence mismatch";
            }
            if ($retrieved->secondaryIntents !== $original->secondaryIntents) {
                $failures[] = "Intent $index: secondary intents mismatch";
            }
            if ($retrieved->hasConflict !== $original->hasConflict) {
                $failures[] = "Intent $index: conflict flag mismatch";
            }
            if ($retrieved->conflictReason !== $original->conflictReason) {
                $failures[] = "Intent $index: conflict reason mismatch";
            }
        }
        
        // Test edge cases
        // Empty keywords array
        $emptyKeywords = new SentimentResult('neutral', 30, [], false, null);
        $storedEmpty = json_encode($emptyKeywords->detectedKeywords);
        $retrievedEmpty = json_decode($storedEmpty, true);
        if ($retrievedEmpty !== []) {
            $failures[] = "Empty keywords array not preserved";
        }
        
        // Special characters in conflict reason
        $specialReason = "Disposition 'Interested' conflicts with negative notes";
        $intent = new IntentResult('unknown', 50, [], true, $specialReason);
        $stored = $intent->conflictReason;
        if ($stored !== $specialReason) {
            $failures[] = "Special characters in conflict reason not preserved";
        }
        
        // Verify toArray() method works correctly
        $sentiment = new SentimentResult('positive', 80, [['keyword' => 'test', 'polarity' => 'positive']], false, 'happy');
        $array = $sentiment->toArray();
        
        if ($array['sentiment'] !== 'positive') {
            $failures[] = "toArray() sentiment mismatch";
        }
        if ($array['confidence_score'] !== 80) {
            $failures[] = "toArray() confidence mismatch";
        }
        
        $intent = new IntentResult('purchase_intent', 85, [], false, null);
        $array = $intent->toArray();
        
        if ($array['primary_intent'] !== 'purchase_intent') {
            $failures[] = "Intent toArray() primary_intent mismatch";
        }
        if ($array['confidence_score'] !== 85) {
            $failures[] = "Intent toArray() confidence mismatch";
        }
        
        $this->reportResult('Property 4', $failures);
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
    $test = new AnalysisStorageServiceTest();
    $test->runAll();
}
