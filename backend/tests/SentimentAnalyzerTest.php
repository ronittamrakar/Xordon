<?php
/**
 * Property-Based Tests for SentimentAnalyzer
 * 
 * These tests verify the correctness properties defined in the design document.
 * Run with: php backend/tests/SentimentAnalyzerTest.php
 */

require_once __DIR__ . '/../src/services/SentimentAnalyzer.php';

class SentimentAnalyzerTest {
    
    private SentimentAnalyzer $analyzer;
    private int $iterations = 100;
    private int $passed = 0;
    private int $failed = 0;
    
    public function __construct() {
        $this->analyzer = new SentimentAnalyzer();
    }
    
    /**
     * Run all property tests
     */
    public function runAll(): void {
        echo "=== SentimentAnalyzer Property Tests ===\n\n";
        
        $this->testProperty1_SentimentClassificationValidity();
        $this->testProperty2_KeywordDetectionAccuracy();
        $this->testProperty3_MixedSentimentDetection();
        $this->testProperty17_SmsAbbreviationHandling();
        
        echo "\n=== Test Summary ===\n";
        echo "Passed: {$this->passed}\n";
        echo "Failed: {$this->failed}\n";
        echo "Total: " . ($this->passed + $this->failed) . "\n";
    }
    
    /**
     * **Feature: intelligent-followup-automations, Property 1: Sentiment Classification Validity**
     * 
     * For any text input, the returned sentiment SHALL be one of 'positive', 'negative', 
     * or 'neutral', and the confidence score SHALL be an integer between 0 and 100 inclusive.
     * 
     * **Validates: Requirements 1.1**
     */
    public function testProperty1_SentimentClassificationValidity(): void {
        echo "Property 1: Sentiment Classification Validity\n";
        echo "  Validates: Requirements 1.1\n";
        
        $validSentiments = ['positive', 'negative', 'neutral'];
        $failures = [];
        
        for ($i = 0; $i < $this->iterations; $i++) {
            $text = $this->generateRandomText();
            $result = $this->analyzer->analyze($text);
            
            // Check sentiment is valid
            if (!in_array($result->sentiment, $validSentiments)) {
                $failures[] = "Invalid sentiment '{$result->sentiment}' for text: " . substr($text, 0, 50);
            }
            
            // Check confidence score is in range
            if ($result->confidenceScore < 0 || $result->confidenceScore > 100) {
                $failures[] = "Invalid confidence {$result->confidenceScore} for text: " . substr($text, 0, 50);
            }
            
            // Check confidence is integer
            if (!is_int($result->confidenceScore)) {
                $failures[] = "Confidence not integer for text: " . substr($text, 0, 50);
            }
        }
        
        $this->reportResult('Property 1', $failures);
    }
    
    /**
     * **Feature: intelligent-followup-automations, Property 2: Keyword Detection Accuracy**
     * 
     * For any text containing known sentiment keywords from the configured keyword lists, 
     * the Sentiment Analysis Engine SHALL include those keywords in the detectedKeywords array.
     * 
     * **Validates: Requirements 1.2, 6.2**
     */
    public function testProperty2_KeywordDetectionAccuracy(): void {
        echo "Property 2: Keyword Detection Accuracy\n";
        echo "  Validates: Requirements 1.2, 6.2\n";
        
        $keywords = $this->analyzer->getKeywords();
        $failures = [];
        
        for ($i = 0; $i < $this->iterations; $i++) {
            // Pick a random keyword to include
            $allKeywords = array_merge($keywords['positive'], $keywords['negative']);
            $chosenKeyword = $allKeywords[array_rand($allKeywords)];
            
            // Generate text containing the keyword
            $text = $this->generateTextWithKeyword($chosenKeyword);
            $result = $this->analyzer->analyze($text);
            
            // Check if keyword was detected
            $detectedWords = array_column($result->detectedKeywords, 'keyword');
            if (!in_array(strtolower($chosenKeyword), array_map('strtolower', $detectedWords))) {
                $failures[] = "Keyword '$chosenKeyword' not detected in: " . substr($text, 0, 80);
            }
        }
        
        $this->reportResult('Property 2', $failures);
    }
    
    /**
     * **Feature: intelligent-followup-automations, Property 3: Mixed Sentiment Detection**
     * 
     * For any text containing both positive and negative sentiment indicators (at least one of each), 
     * the Sentiment Analysis Engine SHALL set isMixedSentiment to true in the result.
     * 
     * **Validates: Requirements 1.4**
     */
    public function testProperty3_MixedSentimentDetection(): void {
        echo "Property 3: Mixed Sentiment Detection\n";
        echo "  Validates: Requirements 1.4\n";
        
        $keywords = $this->analyzer->getKeywords();
        $failures = [];
        
        for ($i = 0; $i < $this->iterations; $i++) {
            // Pick one positive and one negative keyword
            $positiveKeyword = $keywords['positive'][array_rand($keywords['positive'])];
            $negativeKeyword = $keywords['negative'][array_rand($keywords['negative'])];
            
            // Generate text with both
            $text = $this->generateMixedText($positiveKeyword, $negativeKeyword);
            $result = $this->analyzer->analyze($text);
            
            // Check if mixed sentiment was detected
            if (!$result->isMixedSentiment) {
                $failures[] = "Mixed sentiment not detected for text with '$positiveKeyword' and '$negativeKeyword': " . substr($text, 0, 80);
            }
        }
        
        $this->reportResult('Property 3', $failures);
    }
    
    /**
     * **Feature: intelligent-followup-automations, Property 17: SMS Abbreviation Handling**
     * 
     * For any SMS text containing common abbreviations, the Sentiment Analysis Engine 
     * SHALL correctly interpret them as their full-word equivalents for sentiment analysis.
     * 
     * **Validates: Requirements 7.2**
     */
    public function testProperty17_SmsAbbreviationHandling(): void {
        echo "Property 17: SMS Abbreviation Handling\n";
        echo "  Validates: Requirements 7.2\n";
        
        $abbreviationTests = [
            ['abbr' => 'thx', 'full' => 'thanks', 'sentiment' => 'positive'],
            ['abbr' => 'ty', 'full' => 'thank you', 'sentiment' => 'positive'],
            ['abbr' => 'gr8', 'full' => 'great', 'sentiment' => 'positive'],
            ['abbr' => 'gud', 'full' => 'good', 'sentiment' => 'positive'],
        ];
        
        $failures = [];
        
        foreach ($abbreviationTests as $test) {
            // Test with abbreviation
            $textWithAbbr = "I think this is {$test['abbr']}";
            $resultAbbr = $this->analyzer->analyze($textWithAbbr);
            
            // Test with full word
            $textWithFull = "I think this is {$test['full']}";
            $resultFull = $this->analyzer->analyze($textWithFull);
            
            // Both should detect the positive sentiment
            if ($resultAbbr->sentiment !== $test['sentiment']) {
                $failures[] = "Abbreviation '{$test['abbr']}' not correctly interpreted. Expected {$test['sentiment']}, got {$resultAbbr->sentiment}";
            }
        }
        
        // Additional random tests with abbreviations
        $abbreviations = ['thx', 'ty', 'pls', 'u', 'ur', 'gr8', 'gud'];
        for ($i = 0; $i < 50; $i++) {
            $abbr = $abbreviations[array_rand($abbreviations)];
            $text = "Hey $abbr for the help";
            
            // Should not crash and should return valid result
            $result = $this->analyzer->analyze($text);
            if (!in_array($result->sentiment, ['positive', 'negative', 'neutral'])) {
                $failures[] = "Invalid result for SMS text with '$abbr'";
            }
        }
        
        $this->reportResult('Property 17', $failures);
    }
    
    // === Helper Methods ===
    
    private function generateRandomText(): string {
        $words = ['hello', 'world', 'test', 'message', 'sample', 'text', 'random', 
                  'content', 'data', 'input', 'string', 'value', 'item', 'thing'];
        
        $length = rand(3, 20);
        $text = [];
        
        for ($i = 0; $i < $length; $i++) {
            $text[] = $words[array_rand($words)];
        }
        
        return implode(' ', $text);
    }
    
    private function generateTextWithKeyword(string $keyword): string {
        $prefixes = ['I am', 'This is', 'We are', 'They seem', 'It looks'];
        $suffixes = ['about this', 'with the service', 'regarding the product', 'about everything'];
        
        $prefix = $prefixes[array_rand($prefixes)];
        $suffix = $suffixes[array_rand($suffixes)];
        
        return "$prefix $keyword $suffix";
    }
    
    private function generateMixedText(string $positive, string $negative): string {
        $templates = [
            "I am $positive but also $negative about this",
            "The product is $positive however the service was $negative",
            "While I feel $positive, I must say I'm also $negative",
            "It's $positive in some ways but $negative in others",
        ];
        
        return $templates[array_rand($templates)];
    }
    
    private function reportResult(string $propertyName, array $failures): void {
        if (empty($failures)) {
            echo "  ✓ PASSED ({$this->iterations} iterations)\n\n";
            $this->passed++;
        } else {
            echo "  ✗ FAILED (" . count($failures) . " failures)\n";
            // Show first 3 failures
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
    $test = new SentimentAnalyzerTest();
    $test->runAll();
}
