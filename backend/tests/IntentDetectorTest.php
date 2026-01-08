<?php
/**
 * Property-Based Tests for IntentDetector
 * 
 * These tests verify the correctness properties defined in the design document.
 * Run with: php backend/tests/IntentDetectorTest.php
 */

require_once __DIR__ . '/../src/services/IntentDetector.php';

class IntentDetectorTest {
    
    private IntentDetector $detector;
    private int $iterations = 100;
    private int $passed = 0;
    private int $failed = 0;
    
    public function __construct() {
        $this->detector = new IntentDetector();
    }
    
    /**
     * Run all property tests
     */
    public function runAll(): void {
        echo "=== IntentDetector Property Tests ===\n\n";
        
        $this->testProperty5_IntentDetectionAndRanking();
        $this->testProperty6_DispositionNoteConflictDetection();
        $this->testProperty18_OptOutIntentPrecedence();
        
        echo "\n=== Test Summary ===\n";
        echo "Passed: {$this->passed}\n";
        echo "Failed: {$this->failed}\n";
        echo "Total: " . ($this->passed + $this->failed) . "\n";
    }
    
    /**
     * **Feature: intelligent-followup-automations, Property 5: Intent Detection and Ranking**
     * 
     * For any text with multiple detectable intents, the Intent Detection Engine SHALL 
     * return intents ranked by confidence score in descending order, with the highest 
     * confidence intent as primaryIntent.
     * 
     * **Validates: Requirements 2.1, 2.3**
     */
    public function testProperty5_IntentDetectionAndRanking(): void {
        echo "Property 5: Intent Detection and Ranking\n";
        echo "  Validates: Requirements 2.1, 2.3\n";
        
        $validIntents = [
            'purchase_intent', 'callback_request', 'complaint', 'question',
            'referral', 'objection', 'not_qualified', 'opt_out', 'unknown'
        ];
        
        $failures = [];
        
        // Test with texts containing multiple intent indicators
        $testCases = [
            "I want to buy this product but I have a question about pricing",
            "Can you call me back? I'm interested in purchasing",
            "This is terrible service, I want to complain and get a refund",
            "My friend might be interested, can you tell me more?",
        ];
        
        foreach ($testCases as $text) {
            $allIntents = $this->detector->detectAllIntents($text);
            
            // Check ranking is by descending confidence
            for ($i = 1; $i < count($allIntents); $i++) {
                if ($allIntents[$i]->confidenceScore > $allIntents[$i-1]->confidenceScore) {
                    $failures[] = "Intents not ranked by descending confidence for: " . substr($text, 0, 50);
                    break;
                }
            }
        }
        
        // Test that primary intent matches highest confidence
        for ($i = 0; $i < $this->iterations; $i++) {
            $text = $this->generateIntentText();
            $result = $this->detector->detectIntent($text);
            
            // Check primary intent is valid
            if (!in_array($result->primaryIntent, $validIntents)) {
                $failures[] = "Invalid primary intent '{$result->primaryIntent}'";
            }
            
            // Check confidence is in range
            if ($result->confidenceScore < 0 || $result->confidenceScore > 100) {
                $failures[] = "Invalid confidence score {$result->confidenceScore}";
            }
            
            // Check secondary intents have lower or equal confidence
            foreach ($result->secondaryIntents as $secondary) {
                if ($secondary['confidence'] > $result->confidenceScore) {
                    $failures[] = "Secondary intent has higher confidence than primary";
                }
            }
        }
        
        $this->reportResult('Property 5', $failures);
    }
    
    /**
     * **Feature: intelligent-followup-automations, Property 6: Disposition-Note Conflict Detection**
     * 
     * For any disposition with category 'positive' combined with notes that analyze as 
     * 'negative' sentiment (or vice versa), the Intent Detection Engine SHALL set 
     * hasConflict to true.
     * 
     * **Validates: Requirements 2.4**
     */
    public function testProperty6_DispositionNoteConflictDetection(): void {
        echo "Property 6: Disposition-Note Conflict Detection\n";
        echo "  Validates: Requirements 2.4\n";
        
        $failures = [];
        
        // Test positive disposition with negative notes
        $positiveDispositionNegativeNotes = [
            "Customer was angry and frustrated with the service",
            "They complained about everything and said it was terrible",
            "Very disappointed, said they would never buy again",
            "Upset about the price, called it a rip off",
        ];
        
        foreach ($positiveDispositionNegativeNotes as $notes) {
            $result = $this->detector->detectIntent($notes, 'Interested', 'positive');
            if (!$result->hasConflict) {
                $failures[] = "No conflict detected for positive disposition with negative notes: " . substr($notes, 0, 50);
            }
        }
        
        // Test negative disposition with positive notes
        $negativeDispositionPositiveNotes = [
            "Customer was excited and happy about the product",
            "They loved everything and want to buy immediately",
            "Very satisfied, said it was amazing and perfect",
            "Thrilled with the offer, ready to sign up",
        ];
        
        foreach ($negativeDispositionPositiveNotes as $notes) {
            $result = $this->detector->detectIntent($notes, 'Not Interested', 'negative');
            if (!$result->hasConflict) {
                $failures[] = "No conflict detected for negative disposition with positive notes: " . substr($notes, 0, 50);
            }
        }
        
        // Test matching disposition and notes (should NOT conflict)
        $matchingCases = [
            ['notes' => 'Customer was happy and interested', 'category' => 'positive'],
            ['notes' => 'Customer was not interested and frustrated', 'category' => 'negative'],
        ];
        
        foreach ($matchingCases as $case) {
            $result = $this->detector->detectIntent($case['notes'], 'Test', $case['category']);
            if ($result->hasConflict) {
                $failures[] = "False conflict detected for matching disposition and notes";
            }
        }
        
        $this->reportResult('Property 6', $failures);
    }
    
    /**
     * **Feature: intelligent-followup-automations, Property 18: Opt-Out Intent Precedence**
     * 
     * For any SMS reply containing opt-out keywords ("STOP", "UNSUBSCRIBE", etc.), 
     * the detected intent SHALL be 'opt_out' regardless of any other sentiment or 
     * intent indicators in the message.
     * 
     * **Validates: Requirements 7.3**
     */
    public function testProperty18_OptOutIntentPrecedence(): void {
        echo "Property 18: Opt-Out Intent Precedence\n";
        echo "  Validates: Requirements 7.3\n";
        
        $failures = [];
        
        $optOutKeywords = ['STOP', 'UNSUBSCRIBE', 'REMOVE', 'OPT OUT', 'CANCEL', 'DO NOT CALL'];
        
        foreach ($optOutKeywords as $keyword) {
            // Test opt-out keyword alone
            $result = $this->detector->detectIntent($keyword);
            if ($result->primaryIntent !== 'opt_out') {
                $failures[] = "Opt-out not detected for keyword '$keyword'";
            }
            
            // Test opt-out with positive content
            $textWithPositive = "I love your product but please $keyword contacting me";
            $result = $this->detector->detectIntent($textWithPositive);
            if ($result->primaryIntent !== 'opt_out') {
                $failures[] = "Opt-out not taking precedence over positive content for '$keyword'";
            }
            
            // Test opt-out with purchase intent
            $textWithPurchase = "I want to buy but first $keyword these messages";
            $result = $this->detector->detectIntent($textWithPurchase);
            if ($result->primaryIntent !== 'opt_out') {
                $failures[] = "Opt-out not taking precedence over purchase intent for '$keyword'";
            }
        }
        
        // Test that non-opt-out text doesn't trigger opt-out
        $nonOptOutTexts = [
            "I want to buy this product",
            "Please call me back tomorrow",
            "I have a question about pricing",
        ];
        
        foreach ($nonOptOutTexts as $text) {
            $result = $this->detector->detectIntent($text);
            if ($result->primaryIntent === 'opt_out') {
                $failures[] = "False opt-out detected for: " . substr($text, 0, 50);
            }
        }
        
        $this->reportResult('Property 18', $failures);
    }
    
    // === Helper Methods ===
    
    private function generateIntentText(): string {
        $templates = [
            "I want to buy this product",
            "Can you call me back later?",
            "I have a complaint about the service",
            "What is the price of this item?",
            "My friend might be interested",
            "It's too expensive for me right now",
            "I'm not the right person to talk to",
            "Just checking on my order status",
            "Thanks for the information",
            "I need more time to think about it",
        ];
        
        return $templates[array_rand($templates)];
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
    $test = new IntentDetectorTest();
    $test->runAll();
}
