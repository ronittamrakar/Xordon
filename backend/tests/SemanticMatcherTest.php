<?php
/**
 * Property-Based Tests for SemanticMatcher
 * 
 * These tests verify the correctness properties defined in the design document.
 * Run with: php backend/tests/SemanticMatcherTest.php
 */

require_once __DIR__ . '/../src/services/SemanticMatcher.php';

class SemanticMatcherTest {
    
    private SemanticMatcher $matcher;
    private int $passed = 0;
    private int $failed = 0;
    
    public function __construct() {
        $this->matcher = new SemanticMatcher();
    }
    
    /**
     * Run all property tests
     */
    public function runAll(): void {
        echo "=== SemanticMatcher Property Tests ===\n\n";
        
        $this->testProperty19_SemanticDispositionCategorization();
        $this->testProperty20_SemanticSimilarityMatching();
        
        echo "\n=== Test Summary ===\n";
        echo "Passed: {$this->passed}\n";
        echo "Failed: {$this->failed}\n";
        echo "Total: " . ($this->passed + $this->failed) . "\n";
    }
    
    /**
     * **Feature: intelligent-followup-automations, Property 19: Semantic Disposition Categorization**
     * 
     * For any disposition name, the Semantic Matching Engine SHALL assign a semantic_category 
     * from the set {'positive_outcome', 'negative_outcome', 'needs_followup', 'qualified_lead', 
     * 'unqualified_lead'} with a confidence score.
     * 
     * **Validates: Requirements 8.1**
     */
    public function testProperty19_SemanticDispositionCategorization(): void {
        echo "Property 19: Semantic Disposition Categorization\n";
        echo "  Validates: Requirements 8.1\n";
        
        $validCategories = $this->matcher->getValidCategories();
        $validCategories[] = 'unknown'; // Also valid for unrecognized dispositions
        
        $failures = [];
        
        // Test known disposition names
        $testDispositions = [
            'Interested' => 'positive_outcome',
            'Not Interested' => 'negative_outcome',
            'Callback Requested' => 'needs_followup',
            'Qualified Lead' => 'qualified_lead',
            'Wrong Number' => 'negative_outcome',
            'Voicemail Left' => 'needs_followup',
            'Appointment Set' => 'positive_outcome',
            'Sale Made' => 'positive_outcome',
            'No Budget' => 'unqualified_lead',
            'Do Not Call' => 'negative_outcome',
        ];
        
        foreach ($testDispositions as $name => $expectedCategory) {
            $result = $this->matcher->categorizeDisposition($name);
            
            // Check category is valid
            if (!in_array($result->category, $validCategories)) {
                $failures[] = "Invalid category '{$result->category}' for disposition '$name'";
            }
            
            // Check confidence is in range
            if ($result->confidence < 0 || $result->confidence > 100) {
                $failures[] = "Invalid confidence {$result->confidence} for disposition '$name'";
            }
            
            // Check expected category (with some tolerance for ambiguous cases)
            if ($result->category !== $expectedCategory && !$result->isAmbiguous) {
                $failures[] = "Expected '$expectedCategory' but got '{$result->category}' for '$name'";
            }
        }
        
        // Test random/unknown dispositions still return valid results
        $randomNames = ['XYZ123', 'Random Text', 'Unknown Status', ''];
        foreach ($randomNames as $name) {
            $result = $this->matcher->categorizeDisposition($name);
            if (!in_array($result->category, $validCategories)) {
                $failures[] = "Invalid category for random disposition '$name'";
            }
        }
        
        $this->reportResult('Property 19', $failures);
    }
    
    /**
     * **Feature: intelligent-followup-automations, Property 20: Semantic Similarity Matching**
     * 
     * For any two dispositions with the same semantic_category, they SHALL match the same 
     * automation triggers that use semantic matching, regardless of their exact text names.
     * 
     * **Validates: Requirements 8.2**
     */
    public function testProperty20_SemanticSimilarityMatching(): void {
        echo "Property 20: Semantic Similarity Matching\n";
        echo "  Validates: Requirements 8.2\n";
        
        $failures = [];
        
        // Test that semantically similar dispositions match the same triggers
        $similarDispositions = [
            'positive_outcome' => ['Interested', 'Sale Made', 'Appointment Booked', 'Converted'],
            'negative_outcome' => ['Not Interested', 'Declined', 'Wrong Number', 'Do Not Call'],
            'needs_followup' => ['Callback', 'Call Back Later', 'Voicemail', 'Busy - Try Again'],
        ];
        
        foreach ($similarDispositions as $category => $dispositions) {
            // All dispositions in this group should match the same trigger category
            foreach ($dispositions as $disposition) {
                $result = $this->matcher->matchesCategory($disposition, $category);
                
                if (!$result->matches) {
                    $failures[] = "Disposition '$disposition' should match trigger '$category' but didn't";
                }
            }
            
            // Cross-check: dispositions should NOT match opposite categories
            $oppositeCategories = $this->getOppositeCategories($category);
            foreach ($dispositions as $disposition) {
                foreach ($oppositeCategories as $opposite) {
                    $result = $this->matcher->matchesCategory($disposition, $opposite);
                    if ($result->matches && $result->confidence > 70) {
                        $failures[] = "Disposition '$disposition' incorrectly matched opposite category '$opposite'";
                    }
                }
            }
        }
        
        // Test that different text names with same meaning match
        $equivalentPairs = [
            ['Interested', 'Shows Interest'],
            ['Not Interested', 'Declined Offer'],
            ['Callback', 'Call Back Requested'],
            ['Voicemail', 'Left Voicemail'],
        ];
        
        foreach ($equivalentPairs as $pair) {
            $cat1 = $this->matcher->categorizeDisposition($pair[0]);
            $cat2 = $this->matcher->categorizeDisposition($pair[1]);
            
            // They should have the same category (or both be ambiguous with overlapping suggestions)
            if ($cat1->category !== $cat2->category) {
                // Check if they share suggested categories
                $shared = array_intersect(
                    array_merge([$cat1->category], $cat1->suggestedCategories),
                    array_merge([$cat2->category], $cat2->suggestedCategories)
                );
                if (empty($shared)) {
                    $failures[] = "Equivalent dispositions '{$pair[0]}' and '{$pair[1]}' have different categories";
                }
            }
        }
        
        $this->reportResult('Property 20', $failures);
    }
    
    // === Helper Methods ===
    
    private function getOppositeCategories(string $category): array {
        $opposites = [
            'positive_outcome' => ['negative_outcome', 'unqualified_lead'],
            'negative_outcome' => ['positive_outcome', 'qualified_lead'],
            'needs_followup' => [], // No direct opposite
            'qualified_lead' => ['unqualified_lead', 'negative_outcome'],
            'unqualified_lead' => ['qualified_lead', 'positive_outcome'],
        ];
        
        return $opposites[$category] ?? [];
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
    $test = new SemanticMatcherTest();
    $test->runAll();
}
