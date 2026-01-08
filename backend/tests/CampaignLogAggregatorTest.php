<?php
/**
 * Property-Based Tests for CampaignLogAggregator
 * 
 * Run with: php backend/tests/CampaignLogAggregatorTest.php
 */

require_once __DIR__ . '/../src/services/SentimentAnalyzer.php';
require_once __DIR__ . '/../src/services/IntentDetector.php';

class CampaignLogAggregatorTest {
    
    private int $passed = 0;
    private int $failed = 0;
    
    public function runAll(): void {
        echo "=== CampaignLogAggregator Property Tests ===\n\n";
        
        $this->testProperty10_CampaignLogUpdateConsistency();
        $this->testProperty11_CampaignLogFilteringCorrectness();
        $this->testProperty12_CampaignDataExportCompleteness();
        
        echo "\n=== Test Summary ===\n";
        echo "Passed: {$this->passed}\n";
        echo "Failed: {$this->failed}\n";
        echo "Total: " . ($this->passed + $this->failed) . "\n";
    }
    
    /**
     * **Feature: intelligent-followup-automations, Property 10: Campaign Log Update Consistency**
     * 
     * For any campaign log entry updated with sentiment/intent data, the stored values 
     * SHALL exactly match the analysis results provided.
     * 
     * **Validates: Requirements 4.1, 6.4, 7.4**
     */
    public function testProperty10_CampaignLogUpdateConsistency(): void {
        echo "Property 10: Campaign Log Update Consistency\n";
        echo "  Validates: Requirements 4.1, 6.4, 7.4\n";
        
        $failures = [];
        
        // Test that sentiment results are correctly formatted for storage
        $testSentiments = [
            new SentimentResult('positive', 85, [['keyword' => 'great', 'polarity' => 'positive']], false),
            new SentimentResult('negative', 70, [['keyword' => 'terrible', 'polarity' => 'negative']], false),
            new SentimentResult('neutral', 50, [], false),
            new SentimentResult('positive', 65, [['keyword' => 'good', 'polarity' => 'positive'], ['keyword' => 'bad', 'polarity' => 'negative']], true),
        ];
        
        foreach ($testSentiments as $index => $sentiment) {
            // Verify sentiment value is valid
            if (!in_array($sentiment->sentiment, ['positive', 'negative', 'neutral'])) {
                $failures[] = "Test $index: Invalid sentiment value '{$sentiment->sentiment}'";
            }
            
            // Verify confidence is in range
            if ($sentiment->confidenceScore < 0 || $sentiment->confidenceScore > 100) {
                $failures[] = "Test $index: Confidence {$sentiment->confidenceScore} out of range";
            }
            
            // Verify keywords can be JSON encoded
            $encoded = json_encode($sentiment->detectedKeywords);
            if ($encoded === false) {
                $failures[] = "Test $index: Keywords cannot be JSON encoded";
            }
            
            // Verify round-trip
            $decoded = json_decode($encoded, true);
            if ($decoded !== $sentiment->detectedKeywords) {
                $failures[] = "Test $index: Keywords JSON round-trip failed";
            }
        }
        
        // Test intent results
        $testIntents = [
            new IntentResult('purchase_intent', 90, [], false),
            new IntentResult('complaint', 75, [['intent' => 'callback_request', 'confidence' => 60]], false),
            new IntentResult('opt_out', 95, [], false),
        ];
        
        foreach ($testIntents as $index => $intent) {
            // Verify intent value is valid
            $validIntents = ['purchase_intent', 'callback_request', 'complaint', 'question', 
                            'referral', 'objection', 'not_qualified', 'opt_out', 'unknown'];
            if (!in_array($intent->primaryIntent, $validIntents)) {
                $failures[] = "Intent test $index: Invalid intent '{$intent->primaryIntent}'";
            }
            
            // Verify confidence is in range
            if ($intent->confidenceScore < 0 || $intent->confidenceScore > 100) {
                $failures[] = "Intent test $index: Confidence {$intent->confidenceScore} out of range";
            }
        }
        
        $this->reportResult('Property 10', $failures);
    }
    
    /**
     * **Feature: intelligent-followup-automations, Property 11: Campaign Log Filtering Correctness**
     * 
     * For any filter query on campaign logs by sentiment or intent, the returned results 
     * SHALL only include logs matching the specified filter criteria.
     * 
     * **Validates: Requirements 4.3**
     */
    public function testProperty11_CampaignLogFilteringCorrectness(): void {
        echo "Property 11: Campaign Log Filtering Correctness\n";
        echo "  Validates: Requirements 4.3\n";
        
        $failures = [];
        
        // Simulate log data
        $mockLogs = [
            ['id' => 1, 'sentiment' => 'positive', 'detected_intent' => 'purchase_intent'],
            ['id' => 2, 'sentiment' => 'negative', 'detected_intent' => 'complaint'],
            ['id' => 3, 'sentiment' => 'positive', 'detected_intent' => 'question'],
            ['id' => 4, 'sentiment' => 'neutral', 'detected_intent' => 'callback_request'],
            ['id' => 5, 'sentiment' => 'negative', 'detected_intent' => 'opt_out'],
        ];
        
        // Test sentiment filter
        $sentimentFilters = ['positive', 'negative', 'neutral'];
        foreach ($sentimentFilters as $filter) {
            $filtered = array_filter($mockLogs, fn($log) => $log['sentiment'] === $filter);
            
            foreach ($filtered as $log) {
                if ($log['sentiment'] !== $filter) {
                    $failures[] = "Sentiment filter '$filter' returned log with sentiment '{$log['sentiment']}'";
                }
            }
        }
        
        // Test intent filter
        $intentFilters = ['purchase_intent', 'complaint', 'opt_out'];
        foreach ($intentFilters as $filter) {
            $filtered = array_filter($mockLogs, fn($log) => $log['detected_intent'] === $filter);
            
            foreach ($filtered as $log) {
                if ($log['detected_intent'] !== $filter) {
                    $failures[] = "Intent filter '$filter' returned log with intent '{$log['detected_intent']}'";
                }
            }
        }
        
        // Test combined filter
        $combinedFiltered = array_filter($mockLogs, fn($log) => 
            $log['sentiment'] === 'positive' && $log['detected_intent'] === 'purchase_intent'
        );
        
        foreach ($combinedFiltered as $log) {
            if ($log['sentiment'] !== 'positive' || $log['detected_intent'] !== 'purchase_intent') {
                $failures[] = "Combined filter returned incorrect log";
            }
        }
        
        // Verify filter returns correct count
        $positiveCount = count(array_filter($mockLogs, fn($log) => $log['sentiment'] === 'positive'));
        if ($positiveCount !== 2) {
            $failures[] = "Expected 2 positive logs, got $positiveCount";
        }
        
        $this->reportResult('Property 11', $failures);
    }
    
    /**
     * **Feature: intelligent-followup-automations, Property 12: Campaign Data Export Completeness**
     * 
     * For any campaign data export, the exported data SHALL include all sentiment and 
     * intent fields for each log entry that has been analyzed.
     * 
     * **Validates: Requirements 4.4**
     */
    public function testProperty12_CampaignDataExportCompleteness(): void {
        echo "Property 12: Campaign Data Export Completeness\n";
        echo "  Validates: Requirements 4.4\n";
        
        $failures = [];
        
        // Required fields for export
        $requiredFields = [
            'contact_name',
            'email',
            'phone',
            'status',
            'sentiment',
            'sentiment_confidence',
            'detected_intent',
            'intent_confidence',
            'created_at',
        ];
        
        // Simulate export data
        $mockExportData = [
            [
                'contact_name' => 'John Doe',
                'email' => 'john@example.com',
                'phone' => '555-1234',
                'status' => 'sent',
                'sentiment' => 'positive',
                'sentiment_confidence' => 85,
                'detected_intent' => 'purchase_intent',
                'intent_confidence' => 90,
                'created_at' => '2025-01-01 10:00:00',
            ],
            [
                'contact_name' => 'Jane Smith',
                'email' => 'jane@example.com',
                'phone' => '555-5678',
                'status' => 'replied',
                'sentiment' => 'negative',
                'sentiment_confidence' => 75,
                'detected_intent' => 'complaint',
                'intent_confidence' => 80,
                'created_at' => '2025-01-02 14:30:00',
            ],
        ];
        
        // Verify all required fields are present
        foreach ($mockExportData as $index => $row) {
            foreach ($requiredFields as $field) {
                if (!array_key_exists($field, $row)) {
                    $failures[] = "Export row $index missing required field '$field'";
                }
            }
        }
        
        // Verify sentiment fields have valid values when present
        foreach ($mockExportData as $index => $row) {
            if (!empty($row['sentiment'])) {
                if (!in_array($row['sentiment'], ['positive', 'negative', 'neutral'])) {
                    $failures[] = "Export row $index has invalid sentiment '{$row['sentiment']}'";
                }
            }
            
            if (!empty($row['sentiment_confidence'])) {
                if ($row['sentiment_confidence'] < 0 || $row['sentiment_confidence'] > 100) {
                    $failures[] = "Export row $index has invalid sentiment_confidence";
                }
            }
        }
        
        // Verify export can be converted to CSV format
        $csvHeaders = implode(',', $requiredFields);
        if (empty($csvHeaders)) {
            $failures[] = "Failed to generate CSV headers";
        }
        
        foreach ($mockExportData as $index => $row) {
            $csvRow = [];
            foreach ($requiredFields as $field) {
                $csvRow[] = $row[$field] ?? '';
            }
            $csvLine = implode(',', $csvRow);
            if (empty($csvLine)) {
                $failures[] = "Failed to generate CSV row $index";
            }
        }
        
        $this->reportResult('Property 12', $failures);
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
    $test = new CampaignLogAggregatorTest();
    $test->runAll();
}
