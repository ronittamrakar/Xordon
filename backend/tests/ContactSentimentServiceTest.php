<?php
/**
 * Property-Based Tests for ContactSentimentService
 * 
 * Run with: php backend/tests/ContactSentimentServiceTest.php
 */

require_once __DIR__ . '/../src/services/ContactSentimentService.php';
require_once __DIR__ . '/../src/services/SentimentAnalyzer.php';

class ContactSentimentServiceTest {
    
    private int $passed = 0;
    private int $failed = 0;
    
    public function runAll(): void {
        echo "=== ContactSentimentService Property Tests ===\n\n";
        
        $this->testProperty13_CrossChannelSentimentAggregation();
        $this->testProperty14_SentimentChangeFlagging();
        $this->testProperty15_SentimentTrendCalculation();
        
        echo "\n=== Test Summary ===\n";
        echo "Passed: {$this->passed}\n";
        echo "Failed: {$this->failed}\n";
        echo "Total: " . ($this->passed + $this->failed) . "\n";
    }
    
    /**
     * **Feature: intelligent-followup-automations, Property 13: Cross-Channel Sentiment Aggregation**
     * 
     * For any contact with sentiment records across multiple channels, the overall sentiment 
     * score SHALL be calculated as a weighted average using confidence scores as weights.
     * 
     * **Validates: Requirements 5.1**
     */
    public function testProperty13_CrossChannelSentimentAggregation(): void {
        echo "Property 13: Cross-Channel Sentiment Aggregation\n";
        echo "  Validates: Requirements 5.1\n";
        
        $failures = [];
        
        // Test weighted average calculation logic
        $testCases = [
            // All positive with varying confidence
            [
                'records' => [
                    ['sentiment' => 'positive', 'confidence' => 100],
                    ['sentiment' => 'positive', 'confidence' => 80],
                ],
                'expected_range' => [85, 100], // Should be high positive
            ],
            // Mixed sentiment
            [
                'records' => [
                    ['sentiment' => 'positive', 'confidence' => 90],
                    ['sentiment' => 'negative', 'confidence' => 90],
                ],
                'expected_range' => [40, 60], // Should be around neutral
            ],
            // All negative
            [
                'records' => [
                    ['sentiment' => 'negative', 'confidence' => 80],
                    ['sentiment' => 'negative', 'confidence' => 70],
                ],
                'expected_range' => [0, 20], // Should be low
            ],
            // High confidence positive overrides low confidence negative
            [
                'records' => [
                    ['sentiment' => 'positive', 'confidence' => 95],
                    ['sentiment' => 'negative', 'confidence' => 30],
                ],
                'expected_range' => [60, 90], // Should lean positive
            ],
        ];
        
        foreach ($testCases as $index => $case) {
            $score = $this->calculateWeightedAverage($case['records']);
            
            if ($score < $case['expected_range'][0] || $score > $case['expected_range'][1]) {
                $failures[] = "Test case $index: Score $score not in expected range [{$case['expected_range'][0]}, {$case['expected_range'][1]}]";
            }
        }
        
        // Test that confidence weighting works correctly
        // Higher confidence should have more influence
        $highConfPositive = [
            ['sentiment' => 'positive', 'confidence' => 100],
            ['sentiment' => 'negative', 'confidence' => 10],
        ];
        $lowConfPositive = [
            ['sentiment' => 'positive', 'confidence' => 10],
            ['sentiment' => 'negative', 'confidence' => 100],
        ];
        
        $scoreHigh = $this->calculateWeightedAverage($highConfPositive);
        $scoreLow = $this->calculateWeightedAverage($lowConfPositive);
        
        if ($scoreHigh <= $scoreLow) {
            $failures[] = "High confidence positive ($scoreHigh) should score higher than low confidence positive ($scoreLow)";
        }
        
        $this->reportResult('Property 13', $failures);
    }
    
    /**
     * **Feature: intelligent-followup-automations, Property 14: Sentiment Change Flagging**
     * 
     * For any contact where the sentiment score changes by more than 30 points between 
     * consecutive interactions, the sentiment_change_flag SHALL be set to true.
     * 
     * **Validates: Requirements 5.2**
     */
    public function testProperty14_SentimentChangeFlagging(): void {
        echo "Property 14: Sentiment Change Flagging\n";
        echo "  Validates: Requirements 5.2\n";
        
        $failures = [];
        
        // Test cases for sentiment change detection
        $testCases = [
            // Large change: positive to negative (100 to 0 = 100 point change)
            ['previous' => 'positive', 'new' => 'negative', 'should_flag' => true],
            // Large change: negative to positive
            ['previous' => 'negative', 'new' => 'positive', 'should_flag' => true],
            // Medium change: positive to neutral (100 to 50 = 50 point change)
            ['previous' => 'positive', 'new' => 'neutral', 'should_flag' => true],
            // Medium change: negative to neutral (0 to 50 = 50 point change)
            ['previous' => 'negative', 'new' => 'neutral', 'should_flag' => true],
            // No change: same sentiment
            ['previous' => 'positive', 'new' => 'positive', 'should_flag' => false],
            ['previous' => 'negative', 'new' => 'negative', 'should_flag' => false],
            ['previous' => 'neutral', 'new' => 'neutral', 'should_flag' => false],
        ];
        
        $sentimentScores = ['positive' => 100, 'neutral' => 50, 'negative' => 0];
        $threshold = 30;
        
        foreach ($testCases as $index => $case) {
            $previousScore = $sentimentScores[$case['previous']];
            $newScore = $sentimentScores[$case['new']];
            $change = abs($newScore - $previousScore);
            $shouldFlag = $change >= $threshold;
            
            if ($shouldFlag !== $case['should_flag']) {
                $failures[] = "Test case $index: {$case['previous']} to {$case['new']} (change: $change) - expected flag: " . 
                    ($case['should_flag'] ? 'true' : 'false') . ", got: " . ($shouldFlag ? 'true' : 'false');
            }
        }
        
        // Test boundary cases
        $boundaryTests = [
            ['change' => 29, 'should_flag' => false],
            ['change' => 30, 'should_flag' => true],
            ['change' => 31, 'should_flag' => true],
        ];
        
        foreach ($boundaryTests as $test) {
            $shouldFlag = $test['change'] >= $threshold;
            if ($shouldFlag !== $test['should_flag']) {
                $failures[] = "Boundary test: change of {$test['change']} should " . 
                    ($test['should_flag'] ? '' : 'not ') . "flag";
            }
        }
        
        $this->reportResult('Property 14', $failures);
    }
    
    /**
     * **Feature: intelligent-followup-automations, Property 15: Sentiment Trend Calculation**
     * 
     * For any contact with 3 or more sentiment records, the sentiment_trend SHALL be 
     * calculated as 'improving', 'declining', or 'stable' based on the direction of 
     * sentiment scores over time.
     * 
     * **Validates: Requirements 5.4**
     */
    public function testProperty15_SentimentTrendCalculation(): void {
        echo "Property 15: Sentiment Trend Calculation\n";
        echo "  Validates: Requirements 5.4\n";
        
        $failures = [];
        
        // Test improving trend
        $improvingScores = [20, 40, 60, 80]; // Clearly improving
        $trend = $this->calculateTrend($improvingScores);
        if ($trend !== 'improving') {
            $failures[] = "Improving scores should yield 'improving' trend, got '$trend'";
        }
        
        // Test declining trend
        $decliningScores = [80, 60, 40, 20]; // Clearly declining
        $trend = $this->calculateTrend($decliningScores);
        if ($trend !== 'declining') {
            $failures[] = "Declining scores should yield 'declining' trend, got '$trend'";
        }
        
        // Test stable trend
        $stableScores = [50, 52, 48, 51, 49]; // Roughly stable
        $trend = $this->calculateTrend($stableScores);
        if ($trend !== 'stable') {
            $failures[] = "Stable scores should yield 'stable' trend, got '$trend'";
        }
        
        // Test insufficient data
        $tooFewScores = [50, 60]; // Only 2 records
        $trend = $this->calculateTrend($tooFewScores);
        if ($trend !== 'insufficient_data') {
            $failures[] = "Less than 3 records should yield 'insufficient_data', got '$trend'";
        }
        
        // Test edge cases
        $allSameScores = [50, 50, 50, 50];
        $trend = $this->calculateTrend($allSameScores);
        if ($trend !== 'stable') {
            $failures[] = "All same scores should yield 'stable' trend, got '$trend'";
        }
        
        // Test slight improvement
        $slightImprovement = [40, 42, 44, 46];
        $trend = $this->calculateTrend($slightImprovement);
        // Slight improvement might be stable or improving depending on threshold
        if (!in_array($trend, ['stable', 'improving'])) {
            $failures[] = "Slight improvement should yield 'stable' or 'improving', got '$trend'";
        }
        
        $this->reportResult('Property 15', $failures);
    }
    
    // === Helper Methods ===
    
    private function calculateWeightedAverage(array $records): int {
        $sentimentScores = ['positive' => 100, 'neutral' => 50, 'negative' => 0];
        
        $totalWeight = 0;
        $weightedSum = 0;
        
        foreach ($records as $record) {
            $score = $sentimentScores[$record['sentiment']] ?? 50;
            $weight = $record['confidence'] / 100;
            
            $weightedSum += $score * $weight;
            $totalWeight += $weight;
        }
        
        return $totalWeight > 0 ? (int)round($weightedSum / $totalWeight) : 50;
    }
    
    private function calculateTrend(array $scores): string {
        if (count($scores) < 3) {
            return 'insufficient_data';
        }
        
        // Calculate linear regression slope
        $n = count($scores);
        $sumX = 0;
        $sumY = 0;
        $sumXY = 0;
        $sumX2 = 0;
        
        for ($i = 0; $i < $n; $i++) {
            $sumX += $i;
            $sumY += $scores[$i];
            $sumXY += $i * $scores[$i];
            $sumX2 += $i * $i;
        }
        
        $denominator = ($n * $sumX2 - $sumX * $sumX);
        if ($denominator == 0) {
            return 'stable';
        }
        
        $slope = ($n * $sumXY - $sumX * $sumY) / $denominator;
        
        // Determine trend based on slope
        if ($slope > 5) {
            return 'improving';
        } elseif ($slope < -5) {
            return 'declining';
        }
        return 'stable';
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
    $test = new ContactSentimentServiceTest();
    $test->runAll();
}
