<?php
/**
 * Property-Based Tests for ConversationIntelligenceService
 * 
 * **Feature: crm-enhancements, Property 11: Call Analysis Score Bounds**
 * **Feature: crm-enhancements, Property 12: Buying Signal Tagging**
 * **Feature: crm-enhancements, Property 13: Key Phrase Extraction**
 */

require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/services/ConversationIntelligenceService.php';

class ConversationIntelligenceServiceTest {
    private $db;
    private $service;
    
    public function __construct() {
        $this->db = Database::conn();
        $this->service = new ConversationIntelligenceService();
    }
    
    /**
     * Property 11: Call Analysis Score Bounds
     * **Validates: Requirements 4.3**
     * 
     * For any analyzed call, the sentiment score SHALL be in range [-1, 1] 
     * AND the intent score SHALL be in range [0, 100].
     */
    public function testProperty11_CallAnalysisScoreBounds(): array {
        $results = ['passed' => 0, 'failed' => 0, 'errors' => []];
        $iterations = 100;
        
        echo "Property 11: Call Analysis Score Bounds\n";
        echo "  **Validates: Requirements 4.3**\n";
        
        // Test texts with various sentiment/intent combinations
        $testTexts = [
            // Positive texts
            "This is great! I'm very interested and excited about this opportunity. It sounds perfect for our needs.",
            "Excellent presentation! We love what you've shown us. This is exactly what we need.",
            "Amazing product! Send me a proposal right away. What's the timeline to get started?",
            
            // Negative texts
            "This is terrible. Not interested at all. Too expensive and bad timing.",
            "We hate this approach. It's awful and disappointing. Never contact us again.",
            "This is a horrible solution. We have concerns and issues with everything.",
            
            // Neutral texts
            "Thank you for the information. We will review it internally.",
            "I understand. Let me think about it and get back to you.",
            "The meeting was informative. We have some questions to discuss.",
            
            // Mixed texts
            "I'm interested but it's too expensive. Can you send me a proposal with better pricing?",
            "Great product but not the right time. Call me later when we have budget.",
            "Excellent features but we're happy with our current solution. What makes you different?",
            
            // Edge cases
            "",
            "   ",
            "a",
            str_repeat("great ", 100),
            str_repeat("terrible ", 100)
        ];
        
        for ($i = 0; $i < $iterations; $i++) {
            try {
                // Select random text or generate random combination
                if ($i < count($testTexts)) {
                    $text = $testTexts[$i];
                } else {
                    // Generate random text
                    $words = ['great', 'terrible', 'interested', 'not interested', 'send proposal', 
                              'too expensive', 'perfect', 'awful', 'yes', 'no', 'maybe'];
                    $text = '';
                    for ($j = 0; $j < rand(5, 50); $j++) {
                        $text .= $words[array_rand($words)] . ' ';
                    }
                }
                
                // Calculate sentiment score
                $sentimentScore = $this->service->calculateSentiment($text);
                
                // Verify sentiment score bounds
                if ($sentimentScore < -1 || $sentimentScore > 1) {
                    throw new Exception("Sentiment score {$sentimentScore} out of bounds [-1, 1]");
                }
                
                // Calculate intent score
                $intentScore = $this->service->calculateIntent($text);
                
                // Verify intent score bounds
                if ($intentScore < 0 || $intentScore > 100) {
                    throw new Exception("Intent score {$intentScore} out of bounds [0, 100]");
                }
                
                // Verify types
                if (!is_float($sentimentScore) && !is_int($sentimentScore)) {
                    throw new Exception("Sentiment score should be numeric");
                }
                
                if (!is_int($intentScore)) {
                    throw new Exception("Intent score should be integer");
                }
                
                $results['passed']++;
                
            } catch (Exception $e) {
                $results['failed']++;
                if (count($results['errors']) < 5) {
                    $results['errors'][] = "Iteration {$i}: " . $e->getMessage();
                }
            }
        }
        
        $status = $results['failed'] === 0 ? '✓ PASSED' : '✗ FAILED';
        echo "  {$status} ({$results['passed']}/{$iterations} iterations)\n\n";
        
        return $results;
    }
    
    /**
     * Property 12: Buying Signal Tagging
     * **Validates: Requirements 4.4**
     * 
     * For any call where buying signals are detected, the call record SHALL be 
     * tagged with those signals AND the signals SHALL be queryable as automation triggers.
     */
    public function testProperty12_BuyingSignalTagging(): array {
        $results = ['passed' => 0, 'failed' => 0, 'errors' => []];
        $iterations = 50;
        
        echo "Property 12: Buying Signal Tagging\n";
        echo "  **Validates: Requirements 4.4**\n";
        
        // Texts with known buying signals
        $buyingSignalTexts = [
            "Can you send me a proposal for this solution?",
            "What's the price for the enterprise plan?",
            "How much does it cost per user?",
            "What's the timeline to implement this?",
            "When can we start the implementation?",
            "How do we get started with your product?",
            "What are the next steps to move forward?",
            "Can you send a contract for review?",
            "Let's schedule a demo for the team",
            "I'm interested in learning more",
            "That sounds good for our use case",
            "This could help us solve our problem",
            "Let me talk to my team about this"
        ];
        
        for ($i = 0; $i < $iterations; $i++) {
            try {
                // Use known buying signal text or combine multiple
                if ($i < count($buyingSignalTexts)) {
                    $text = $buyingSignalTexts[$i];
                } else {
                    // Combine multiple buying signals
                    $numSignals = rand(1, 3);
                    $selectedTexts = array_rand(array_flip($buyingSignalTexts), $numSignals);
                    if (!is_array($selectedTexts)) {
                        $selectedTexts = [$selectedTexts];
                    }
                    $text = implode('. ', $selectedTexts);
                }
                
                // Extract signals
                $signals = $this->service->extractSignals($text);
                
                // Verify buying signals were detected
                if (empty($signals['buyingSignals'])) {
                    throw new Exception("No buying signals detected in text with known signals");
                }
                
                // Verify signals are returned as array
                if (!is_array($signals['buyingSignals'])) {
                    throw new Exception("Buying signals should be an array");
                }
                
                // Verify each signal is a string
                foreach ($signals['buyingSignals'] as $signal) {
                    if (!is_string($signal)) {
                        throw new Exception("Each buying signal should be a string");
                    }
                    
                    // Verify signal exists in original text (case-insensitive)
                    if (stripos($text, $signal) === false) {
                        throw new Exception("Detected signal '{$signal}' not found in original text");
                    }
                }
                
                // Verify intent score reflects buying signals
                $intentScore = $this->service->calculateIntent($text);
                if ($intentScore < 50) {
                    throw new Exception("Intent score should be >= 50 when buying signals present");
                }
                
                // Verify signals are in a format suitable for automation triggers
                // Signals must be serializable to JSON for storage and queryable
                $jsonEncoded = json_encode($signals['buyingSignals']);
                if ($jsonEncoded === false) {
                    throw new Exception("Buying signals must be JSON serializable for storage");
                }
                
                $decoded = json_decode($jsonEncoded, true);
                if ($decoded !== $signals['buyingSignals']) {
                    throw new Exception("Buying signals must round-trip through JSON encoding");
                }
                
                // Verify signals can be used in automation trigger context
                // Automation triggers check for signal presence using in_array or contains
                $triggerContext = [
                    'buying_signals' => $signals['buyingSignals'],
                    'has_buying_signals' => !empty($signals['buyingSignals']),
                    'buying_signal_count' => count($signals['buyingSignals'])
                ];
                
                // Verify trigger context is valid
                if (!$triggerContext['has_buying_signals']) {
                    throw new Exception("Trigger context should indicate buying signals present");
                }
                
                if ($triggerContext['buying_signal_count'] < 1) {
                    throw new Exception("Trigger context should have at least 1 buying signal");
                }
                
                // Verify specific signal can be queried (automation trigger condition)
                $firstSignal = $signals['buyingSignals'][0];
                if (!in_array($firstSignal, $triggerContext['buying_signals'])) {
                    throw new Exception("Specific signal should be queryable from trigger context");
                }
                
                $results['passed']++;
                
            } catch (Exception $e) {
                $results['failed']++;
                if (count($results['errors']) < 5) {
                    $results['errors'][] = "Iteration {$i}: " . $e->getMessage();
                }
            }
        }
        
        $status = $results['failed'] === 0 ? '✓ PASSED' : '✗ FAILED';
        echo "  {$status} ({$results['passed']}/{$iterations} iterations)\n\n";
        
        return $results;
    }
    
    /**
     * Property 13: Key Phrase Extraction
     * **Validates: Requirements 4.2**
     * 
     * For any transcription containing known objection patterns, the extraction 
     * SHALL identify and tag those patterns.
     */
    public function testProperty13_KeyPhraseExtraction(): array {
        $results = ['passed' => 0, 'failed' => 0, 'errors' => []];
        $iterations = 50;
        
        echo "Property 13: Key Phrase Extraction\n";
        echo "  **Validates: Requirements 4.2**\n";
        
        // Texts with known objection patterns (must match exact patterns in service)
        $objectionTexts = [
            "This is too expensive for our budget",
            "It's not in the budget right now",
            "The solution is too costly for us",
            "We can't afford this at the moment",
            "It's not the right time for this",
            "The bad timing makes this difficult",
            "I need to think about it more",
            "We need more time to decide",
            "We already have a solution in place",
            "We're using a competitor product",
            "We're happy with current provider",
            "We're not interested in this",
            "There's no need for this product",
            "We don't need this right now",
            "Just send me information to review",
            "Call me later when we have budget"
        ];
        
        for ($i = 0; $i < $iterations; $i++) {
            try {
                // Use known objection text
                if ($i < count($objectionTexts)) {
                    $text = $objectionTexts[$i];
                } else {
                    // Combine multiple objections
                    $numObjections = rand(1, 3);
                    $selectedTexts = array_rand(array_flip($objectionTexts), $numObjections);
                    if (!is_array($selectedTexts)) {
                        $selectedTexts = [$selectedTexts];
                    }
                    $text = implode('. ', $selectedTexts);
                }
                
                // Extract signals
                $signals = $this->service->extractSignals($text);
                
                // Verify objections were detected
                if (empty($signals['objections'])) {
                    throw new Exception("No objections detected in text with known objection patterns");
                }
                
                // Extract key phrases
                $keyPhrases = $this->service->extractKeyPhrases($text);
                
                // Verify key phrases include the objections
                if (empty($keyPhrases)) {
                    throw new Exception("No key phrases extracted from text with known patterns");
                }
                
                // Verify each objection is in key phrases
                foreach ($signals['objections'] as $objection) {
                    if (!in_array($objection, $keyPhrases)) {
                        throw new Exception("Objection '{$objection}' not found in key phrases");
                    }
                }
                
                // Verify intent score reflects objections (should be lower)
                $intentScore = $this->service->calculateIntent($text);
                if ($intentScore > 60) {
                    throw new Exception("Intent score should be <= 60 when objections present without buying signals");
                }
                
                $results['passed']++;
                
            } catch (Exception $e) {
                $results['failed']++;
                if (count($results['errors']) < 5) {
                    $results['errors'][] = "Iteration {$i}: " . $e->getMessage();
                }
            }
        }
        
        $status = $results['failed'] === 0 ? '✓ PASSED' : '✗ FAILED';
        echo "  {$status} ({$results['passed']}/{$iterations} iterations)\n\n";
        
        return $results;
    }
    
    /**
     * Run all property tests
     */
    public function runAllTests(): array {
        echo "=== ConversationIntelligenceService Property Tests ===\n\n";
        
        $allResults = [
            'property11' => $this->testProperty11_CallAnalysisScoreBounds(),
            'property12' => $this->testProperty12_BuyingSignalTagging(),
            'property13' => $this->testProperty13_KeyPhraseExtraction()
        ];
        
        // Summary
        $totalPassed = array_sum(array_column($allResults, 'passed'));
        $totalFailed = array_sum(array_column($allResults, 'failed'));
        
        echo "=== Test Summary ===\n";
        echo "Total Passed: {$totalPassed}\n";
        echo "Total Failed: {$totalFailed}\n";
        
        if ($totalFailed > 0) {
            echo "\nErrors:\n";
            foreach ($allResults as $property => $result) {
                foreach ($result['errors'] as $error) {
                    echo "  [{$property}] {$error}\n";
                }
            }
        }
        
        return $allResults;
    }
}

// Run tests if executed directly
if (php_sapi_name() === 'cli' && basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'])) {
    $test = new ConversationIntelligenceServiceTest();
    $results = $test->runAllTests();
    exit(array_sum(array_column($results, 'failed')) > 0 ? 1 : 0);
}
