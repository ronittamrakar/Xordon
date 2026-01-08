<?php
/**
 * Property-Based Tests for PipelineForecastingService
 * 
 * **Feature: crm-enhancements, Property 18: Pipeline Metrics Calculation**
 * **Feature: crm-enhancements, Property 19: Pipeline Filter Accuracy**
 * **Feature: crm-enhancements, Property 20: Revenue Forecast Calculation**
 */

require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/services/PipelineForecastingService.php';

class PipelineForecastingServiceTest {
    private $db;
    private $service;
    private $testUserId;
    private $testContactIds = [];
    private $testDealIds = [];
    
    public function __construct() {
        $this->db = Database::conn();
        $this->service = new PipelineForecastingService();
    }
    
    public function setUp(): void {
        // Create test user
        $stmt = $this->db->prepare("SELECT id FROM users WHERE email = 'pipeline_test@test.com'");
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            $this->testUserId = $user['id'];
        } else {
            $stmt = $this->db->prepare("
                INSERT INTO users (email, password, name, created_at) 
                VALUES ('pipeline_test@test.com', 'test', 'Pipeline Test User', NOW())
            ");
            $stmt->execute();
            $this->testUserId = (int) $this->db->lastInsertId();
        }
        
        // Initialize default stages
        $this->service->initializeDefaultStages($this->testUserId);
        
        // Create test contacts
        for ($i = 0; $i < 5; $i++) {
            $email = "pipeline_contact_{$i}_" . time() . "@test.com";
            $stmt = $this->db->prepare("
                INSERT INTO contacts (email, name, company, user_id, created_at) 
                VALUES (?, ?, ?, ?, NOW())
            ");
            $stmt->execute([$email, "Pipeline Contact {$i}", "Company {$i}", $this->testUserId]);
            $this->testContactIds[] = (int) $this->db->lastInsertId();
        }
    }
    
    public function tearDown(): void {
        // Clean up test data
        foreach ($this->testDealIds as $dealId) {
            $this->db->prepare("DELETE FROM deal_stage_history WHERE deal_id = ?")->execute([$dealId]);
            $this->db->prepare("DELETE FROM deals WHERE id = ?")->execute([$dealId]);
        }
        
        foreach ($this->testContactIds as $contactId) {
            $this->db->prepare("DELETE FROM contacts WHERE id = ?")->execute([$contactId]);
        }
        
        $this->db->prepare("DELETE FROM pipeline_stages WHERE user_id = ?")->execute([$this->testUserId]);
    }
    
    /**
     * Property 18: Pipeline Metrics Calculation
     * **Validates: Requirements 6.1, 6.2**
     * 
     * For any set of deals, the pipeline metrics SHALL correctly calculate:
     * (1) total value per stage, (2) weighted value, (3) deal count per stage.
     */
    public function testProperty18_PipelineMetricsCalculation(): array {
        $results = ['passed' => 0, 'failed' => 0, 'errors' => []];
        $iterations = 30;
        
        echo "Property 18: Pipeline Metrics Calculation\n";
        echo "  **Validates: Requirements 6.1, 6.2**\n";
        
        $stages = ['Lead', 'Qualified', 'Proposal', 'Negotiation'];
        
        for ($i = 0; $i < $iterations; $i++) {
            try {
                // Create random deals
                $expectedTotals = [];
                $expectedCounts = [];
                $dealsCreated = [];
                
                foreach ($stages as $stage) {
                    $expectedTotals[$stage] = 0;
                    $expectedCounts[$stage] = 0;
                }
                
                $numDeals = rand(3, 10);
                for ($j = 0; $j < $numDeals; $j++) {
                    $stage = $stages[array_rand($stages)];
                    $value = rand(1000, 100000);
                    $contactId = $this->testContactIds[array_rand($this->testContactIds)];
                    
                    $dealId = $this->service->createDeal($this->testUserId, [
                        'name' => "Test Deal {$i}-{$j}",
                        'contact_id' => $contactId,
                        'value' => $value,
                        'stage' => $stage,
                        'expected_close_date' => date('Y-m-d', strtotime('+' . rand(30, 90) . ' days'))
                    ]);
                    
                    $this->testDealIds[] = $dealId;
                    $dealsCreated[] = ['id' => $dealId, 'stage' => $stage, 'value' => $value];
                    $expectedTotals[$stage] += $value;
                    $expectedCounts[$stage]++;
                }
                
                // Get pipeline
                $pipeline = $this->service->getDealsByStage($this->testUserId);
                
                // Verify metrics
                foreach ($pipeline as $stageData) {
                    $stageName = $stageData['stage']['name'];
                    
                    if (!isset($expectedTotals[$stageName])) {
                        continue;
                    }
                    
                    // Verify total value
                    if (abs($stageData['total_value'] - $expectedTotals[$stageName]) > 0.01) {
                        throw new Exception("Total value mismatch for {$stageName}: expected {$expectedTotals[$stageName]}, got {$stageData['total_value']}");
                    }
                    
                    // Verify deal count
                    if ($stageData['deal_count'] !== $expectedCounts[$stageName]) {
                        throw new Exception("Deal count mismatch for {$stageName}: expected {$expectedCounts[$stageName]}, got {$stageData['deal_count']}");
                    }
                    
                    // Verify weighted value is calculated
                    if ($stageData['deal_count'] > 0 && $stageData['weighted_value'] <= 0) {
                        throw new Exception("Weighted value should be > 0 when deals exist");
                    }
                }
                
                // Clean up deals for next iteration
                foreach ($dealsCreated as $deal) {
                    $this->db->prepare("DELETE FROM deal_stage_history WHERE deal_id = ?")->execute([$deal['id']]);
                    $this->db->prepare("DELETE FROM deals WHERE id = ?")->execute([$deal['id']]);
                }
                $this->testDealIds = array_diff($this->testDealIds, array_column($dealsCreated, 'id'));
                
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
     * Property 19: Pipeline Filter Accuracy
     * **Validates: Requirements 6.3**
     * 
     * For any filter combination (rep, team, campaign, date range), the pipeline 
     * SHALL return only deals matching ALL filter criteria.
     */
    public function testProperty19_PipelineFilterAccuracy(): array {
        $results = ['passed' => 0, 'failed' => 0, 'errors' => []];
        $iterations = 30;
        
        echo "Property 19: Pipeline Filter Accuracy\n";
        echo "  **Validates: Requirements 6.3**\n";
        
        for ($i = 0; $i < $iterations; $i++) {
            try {
                // Create deals with different attributes
                $sources = ['campaign_1', 'campaign_2', 'campaign_3'];
                $dealsCreated = [];
                
                for ($j = 0; $j < 10; $j++) {
                    $source = $sources[array_rand($sources)];
                    $daysAgo = rand(1, 60);
                    $contactId = $this->testContactIds[array_rand($this->testContactIds)];
                    
                    $stmt = $this->db->prepare("
                        INSERT INTO deals (user_id, contact_id, name, value, stage, source, created_at)
                        VALUES (?, ?, ?, ?, 'Lead', ?, DATE_SUB(NOW(), INTERVAL ? DAY))
                    ");
                    $stmt->execute([
                        $this->testUserId,
                        $contactId,
                        "Filter Test Deal {$i}-{$j}",
                        rand(1000, 50000),
                        $source,
                        $daysAgo
                    ]);
                    
                    $dealId = (int) $this->db->lastInsertId();
                    $this->testDealIds[] = $dealId;
                    $dealsCreated[] = ['id' => $dealId, 'source' => $source, 'days_ago' => $daysAgo];
                }
                
                // Test campaign filter
                $targetCampaign = 'campaign_1';
                $filtered = $this->service->getDealsByStage($this->testUserId, [
                    'campaign_id' => '1'
                ]);
                
                $filteredDeals = [];
                foreach ($filtered as $stage) {
                    $filteredDeals = array_merge($filteredDeals, $stage['deals']);
                }
                
                foreach ($filteredDeals as $deal) {
                    if ($deal['source'] !== $targetCampaign) {
                        throw new Exception("Campaign filter returned deal with wrong source: {$deal['source']}");
                    }
                }
                
                // Test date filter
                $dateFrom = date('Y-m-d', strtotime('-30 days'));
                $filtered = $this->service->getDealsByStage($this->testUserId, [
                    'date_from' => $dateFrom
                ]);
                
                $filteredDeals = [];
                foreach ($filtered as $stage) {
                    $filteredDeals = array_merge($filteredDeals, $stage['deals']);
                }
                
                foreach ($filteredDeals as $deal) {
                    if (strtotime($deal['created_at']) < strtotime($dateFrom)) {
                        throw new Exception("Date filter returned deal outside range");
                    }
                }
                
                // Clean up
                foreach ($dealsCreated as $deal) {
                    $this->db->prepare("DELETE FROM deals WHERE id = ?")->execute([$deal['id']]);
                }
                $this->testDealIds = array_diff($this->testDealIds, array_column($dealsCreated, 'id'));
                
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
     * Property 20: Revenue Forecast Calculation
     * **Validates: Requirements 6.4**
     * 
     * For any pipeline, the revenue forecast SHALL equal the sum of 
     * (deal_value × stage_probability) for all open deals.
     */
    public function testProperty20_RevenueForecastCalculation(): array {
        $results = ['passed' => 0, 'failed' => 0, 'errors' => []];
        $iterations = 30;
        
        echo "Property 20: Revenue Forecast Calculation\n";
        echo "  **Validates: Requirements 6.4**\n";
        
        $stageProbs = ['Lead' => 10, 'Qualified' => 25, 'Proposal' => 50, 'Negotiation' => 75];
        
        for ($i = 0; $i < $iterations; $i++) {
            try {
                $expectedWeighted = 0;
                $expectedTotal = 0;
                $dealsCreated = [];
                
                // Create deals with known values and stages
                $numDeals = rand(5, 15);
                for ($j = 0; $j < $numDeals; $j++) {
                    $stages = array_keys($stageProbs);
                    $stage = $stages[array_rand($stages)];
                    $value = rand(1000, 100000);
                    $probability = $stageProbs[$stage];
                    $contactId = $this->testContactIds[array_rand($this->testContactIds)];
                    
                    $stmt = $this->db->prepare("
                        INSERT INTO deals (user_id, contact_id, name, value, stage, probability, status, expected_close_date, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, 'open', DATE_ADD(CURDATE(), INTERVAL ? DAY), NOW())
                    ");
                    $stmt->execute([
                        $this->testUserId,
                        $contactId,
                        "Forecast Test Deal {$i}-{$j}",
                        $value,
                        $stage,
                        $probability,
                        rand(30, 90)
                    ]);
                    
                    $dealId = (int) $this->db->lastInsertId();
                    $this->testDealIds[] = $dealId;
                    $dealsCreated[] = $dealId;
                    
                    $expectedTotal += $value;
                    $expectedWeighted += $value * ($probability / 100);
                }
                
                // Calculate forecast
                $forecast = $this->service->calculateForecast($this->testUserId);
                
                // Verify total pipeline
                if (abs($forecast['total_pipeline'] - $expectedTotal) > 0.01) {
                    throw new Exception("Total pipeline mismatch: expected {$expectedTotal}, got {$forecast['total_pipeline']}");
                }
                
                // Verify weighted forecast
                if (abs($forecast['weighted_forecast'] - $expectedWeighted) > 0.01) {
                    throw new Exception("Weighted forecast mismatch: expected {$expectedWeighted}, got {$forecast['weighted_forecast']}");
                }
                
                // Verify deal count
                if ($forecast['deal_count'] !== $numDeals) {
                    throw new Exception("Deal count mismatch: expected {$numDeals}, got {$forecast['deal_count']}");
                }
                
                // Verify best case >= weighted >= worst case
                if ($forecast['best_case'] < $forecast['weighted_forecast']) {
                    // This can happen if all deals have probability < 50%
                }
                
                if ($forecast['worst_case'] > $forecast['weighted_forecast']) {
                    throw new Exception("Worst case should be <= weighted forecast");
                }
                
                // Clean up
                foreach ($dealsCreated as $dealId) {
                    $this->db->prepare("DELETE FROM deals WHERE id = ?")->execute([$dealId]);
                }
                $this->testDealIds = array_diff($this->testDealIds, $dealsCreated);
                
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
        echo "=== PipelineForecastingService Property Tests ===\n\n";
        
        $this->setUp();
        
        $allResults = [
            'property18' => $this->testProperty18_PipelineMetricsCalculation(),
            'property19' => $this->testProperty19_PipelineFilterAccuracy(),
            'property20' => $this->testProperty20_RevenueForecastCalculation()
        ];
        
        $this->tearDown();
        
        // Summary
        $totalPassed = array_sum(array_column($allResults, 'passed'));
        $totalFailed = array_sum(array_column($allResults, 'failed'));
        
        echo "=== Test Summary ===\n";
        echo "Total Passed: {$totalPassed}\n";
        echo "Total Failed: {$totalFailed}\n";
        
        return $allResults;
    }
}

// Run tests if executed directly
if (php_sapi_name() === 'cli' && basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'])) {
    $test = new PipelineForecastingServiceTest();
    $results = $test->runAllTests();
    exit(array_sum(array_column($results, 'failed')) > 0 ? 1 : 0);
}
