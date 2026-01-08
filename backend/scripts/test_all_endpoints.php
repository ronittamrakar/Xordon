<?php
/**
 * Comprehensive Endpoint Testing Script
 * Tests all save/create/publish endpoints across the application
 */

require_once __DIR__ . '/src/bootstrap.php';
require_once __DIR__ . '/src/Database.php';
require_once __DIR__ . '/src/Auth.php';
require_once __DIR__ . '/src/TenantContext.php';

// Color output for terminal
function colorOutput($text, $color = 'white') {
    $colors = [
        'red' => "\033[31m",
        'green' => "\033[32m",
        'yellow' => "\033[33m",
        'blue' => "\033[34m",
        'white' => "\033[37m",
        'reset' => "\033[0m"
    ];
    return $colors[$color] . $text . $colors['reset'];
}

class EndpointTester {
    private $results = [];
    private $baseUrl = 'http://localhost:8001';
    private $authToken = null;
    private $workspaceId = 1;
    private $userId = 1;

    public function __construct() {
        // Setup test user and workspace
        $this->setupTestEnvironment();
    }

    private function setupTestEnvironment() {
        try {
            $db = Database::conn();
            
            // Ensure test user exists
            $stmt = $db->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
            $stmt->execute(['test@xordon.com']);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                $stmt = $db->prepare("INSERT INTO users (email, password, name, created_at) VALUES (?, ?, ?, NOW())");
                $stmt->execute(['test@xordon.com', password_hash('test123', PASSWORD_DEFAULT), 'Test User']);
                $this->userId = $db->lastInsertId();
            } else {
                $this->userId = $user['id'];
            }

            // Ensure test workspace exists
            $stmt = $db->prepare("SELECT id FROM workspaces WHERE name = ? LIMIT 1");
            $stmt->execute(['Test Workspace']);
            $workspace = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$workspace) {
                $stmt = $db->prepare("INSERT INTO workspaces (name, slug, created_at) VALUES (?, ?, NOW())");
                $stmt->execute(['Test Workspace', 'test-workspace']);
                $this->workspaceId = $db->lastInsertId();
            } else {
                $this->workspaceId = $workspace['id'];
            }

            echo colorOutput("✓ Test environment ready (User ID: {$this->userId}, Workspace ID: {$this->workspaceId})\n", 'green');
        } catch (Exception $e) {
            echo colorOutput("✗ Failed to setup test environment: " . $e->getMessage() . "\n", 'red');
        }
    }

    private function makeRequest($method, $endpoint, $data = null) {
        $url = $this->baseUrl . $endpoint;
        $ch = curl_init($url);
        
        $headers = [
            'Content-Type: application/json',
            'X-User-Id: ' . $this->userId,
            'X-Workspace-Id: ' . $this->workspaceId,
        ];

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        
        if ($data !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        return [
            'status' => $httpCode,
            'response' => $response,
            'error' => $error,
            'success' => $httpCode >= 200 && $httpCode < 300
        ];
    }

    public function testEndpoint($name, $method, $endpoint, $data = null) {
        echo "\nTesting: " . colorOutput($name, 'blue') . " ($method $endpoint)\n";
        
        $result = $this->makeRequest($method, $endpoint, $data);
        
        if ($result['success']) {
            echo colorOutput("  ✓ SUCCESS", 'green') . " (HTTP {$result['status']})\n";
            $this->results[$name] = ['status' => 'PASS', 'http_code' => $result['status']];
        } else {
            echo colorOutput("  ✗ FAILED", 'red') . " (HTTP {$result['status']})\n";
            if ($result['error']) {
                echo "  Error: " . $result['error'] . "\n";
            }
            if ($result['response']) {
                $decoded = json_decode($result['response'], true);
                if ($decoded && isset($decoded['error'])) {
                    echo "  API Error: " . $decoded['error'] . "\n";
                }
            }
            $this->results[$name] = [
                'status' => 'FAIL',
                'http_code' => $result['status'],
                'error' => $result['error'] ?: 'Unknown error',
                'response' => substr($result['response'], 0, 200)
            ];
        }

        return $result;
    }

    public function runAllTests() {
        echo colorOutput("\n=== XORDON ENDPOINT TESTING SUITE ===\n", 'yellow');
        echo colorOutput("Testing all save/create/publish endpoints...\n\n", 'yellow');

        // 1. EMAIL CAMPAIGNS
        echo colorOutput("\n--- EMAIL CAMPAIGNS ---\n", 'yellow');
        $this->testEndpoint(
            'Create Email Campaign',
            'POST',
            '/api/campaigns',
            ['name' => 'Test Campaign', 'subject' => 'Test Subject', 'status' => 'draft']
        );

        // 2. EMAIL TEMPLATES
        echo colorOutput("\n--- EMAIL TEMPLATES ---\n", 'yellow');
        $this->testEndpoint(
            'Create Email Template',
            'POST',
            '/api/templates',
            ['name' => 'Test Template', 'subject' => 'Test', 'content' => '<p>Test</p>']
        );

        // 3. EMAIL SEQUENCES
        echo colorOutput("\n--- EMAIL SEQUENCES ---\n", 'yellow');
        $this->testEndpoint(
            'Create Email Sequence',
            'POST',
            '/api/sequences',
            ['name' => 'Test Sequence', 'description' => 'Test']
        );

        // 4. SMS CAMPAIGNS
        echo colorOutput("\n--- SMS CAMPAIGNS ---\n", 'yellow');
        $this->testEndpoint(
            'Create SMS Campaign',
            'POST',
            '/api/sms/campaigns',
            ['name' => 'Test SMS Campaign', 'message' => 'Test message', 'status' => 'draft']
        );

        // 5. SMS TEMPLATES
        echo colorOutput("\n--- SMS TEMPLATES ---\n", 'yellow');
        $this->testEndpoint(
            'Create SMS Template',
            'POST',
            '/api/sms/templates',
            ['name' => 'Test SMS Template', 'message' => 'Test message']
        );

        // 6. CALL CAMPAIGNS
        echo colorOutput("\n--- CALL CAMPAIGNS ---\n", 'yellow');
        $this->testEndpoint(
            'Create Call Campaign',
            'POST',
            '/api/calls/campaigns',
            ['name' => 'Test Call Campaign', 'status' => 'draft']
        );

        // 7. CALL SCRIPTS
        echo colorOutput("\n--- CALL SCRIPTS ---\n", 'yellow');
        $this->testEndpoint(
            'Create Call Script',
            'POST',
            '/api/calls/scripts',
            ['name' => 'Test Script', 'content' => 'Test script content']
        );

        // 8. FORMS
        echo colorOutput("\n--- FORMS ---\n", 'yellow');
        $this->testEndpoint(
            'Create Form',
            'POST',
            '/api/forms',
            ['name' => 'Test Form', 'description' => 'Test']
        );

        // 9. LANDING PAGES
        echo colorOutput("\n--- LANDING PAGES ---\n", 'yellow');
        $this->testEndpoint(
            'Create Landing Page',
            'POST',
            '/api/landing-pages',
            ['name' => 'Test Landing Page', 'content' => '{}']
        );

        // 10. PROPOSALS
        echo colorOutput("\n--- PROPOSALS ---\n", 'yellow');
        $this->testEndpoint(
            'Create Proposal',
            'POST',
            '/api/proposals',
            ['name' => 'Test Proposal', 'content' => '{}']
        );

        // 11. WEBFORMS
        echo colorOutput("\n--- WEBFORMS ---\n", 'yellow');
        $this->testEndpoint(
            'Create WebForm',
            'POST',
            '/webforms-api/forms',
            ['name' => 'Test WebForm', 'description' => 'Test']
        );

        // 12. CONTACTS
        echo colorOutput("\n--- CONTACTS ---\n", 'yellow');
        $this->testEndpoint(
            'Create Contact',
            'POST',
            '/api/contacts',
            ['email' => 'test@example.com', 'first_name' => 'Test', 'last_name' => 'User']
        );

        // 13. COMPANIES
        echo colorOutput("\n--- COMPANIES ---\n", 'yellow');
        $this->testEndpoint(
            'Create Company',
            'POST',
            '/api/companies',
            ['name' => 'Test Company']
        );

        // 14. LISTS
        echo colorOutput("\n--- LISTS ---\n", 'yellow');
        $this->testEndpoint(
            'Create List',
            'POST',
            '/api/lists',
            ['name' => 'Test List', 'description' => 'Test']
        );

        // 15. SEGMENTS
        echo colorOutput("\n--- SEGMENTS ---\n", 'yellow');
        $this->testEndpoint(
            'Create Segment',
            'POST',
            '/api/segments',
            ['name' => 'Test Segment', 'filters' => []]
        );

        // 16. INVOICES
        echo colorOutput("\n--- INVOICES ---\n", 'yellow');
        $this->testEndpoint(
            'Create Invoice',
            'POST',
            '/api/invoices',
            ['contact_id' => 1, 'amount' => 100, 'status' => 'draft']
        );

        // 17. ESTIMATES
        echo colorOutput("\n--- ESTIMATES ---\n", 'yellow');
        $this->testEndpoint(
            'Create Estimate',
            'POST',
            '/api/estimates',
            ['contact_id' => 1, 'amount' => 100, 'status' => 'draft']
        );

        // 18. JOBS
        echo colorOutput("\n--- JOBS ---\n", 'yellow');
        $this->testEndpoint(
            'Create Job',
            'POST',
            '/api/jobs',
            ['title' => 'Test Job', 'status' => 'pending']
        );

        // 19. APPOINTMENTS
        echo colorOutput("\n--- APPOINTMENTS ---\n", 'yellow');
        $this->testEndpoint(
            'Create Appointment',
            'POST',
            '/api/appointments',
            ['title' => 'Test Appointment', 'start_time' => date('Y-m-d H:i:s'), 'end_time' => date('Y-m-d H:i:s', strtotime('+1 hour'))]
        );

        // 20. OPPORTUNITIES (CRM)
        echo colorOutput("\n--- OPPORTUNITIES ---\n", 'yellow');
        $this->testEndpoint(
            'Create Opportunity',
            'POST',
            '/api/opportunities',
            ['name' => 'Test Opportunity', 'value' => 1000, 'pipeline_id' => 1, 'stage_id' => 1]
        );

        // Generate summary report
        $this->generateReport();
    }

    private function generateReport() {
        echo colorOutput("\n\n=== TEST SUMMARY REPORT ===\n", 'yellow');
        
        $passed = 0;
        $failed = 0;
        $failedTests = [];

        foreach ($this->results as $name => $result) {
            if ($result['status'] === 'PASS') {
                $passed++;
            } else {
                $failed++;
                $failedTests[] = $name;
            }
        }

        $total = $passed + $failed;
        $passRate = $total > 0 ? round(($passed / $total) * 100, 1) : 0;

        echo "\nTotal Tests: $total\n";
        echo colorOutput("Passed: $passed", 'green') . "\n";
        echo colorOutput("Failed: $failed", 'red') . "\n";
        echo "Pass Rate: {$passRate}%\n";

        if ($failed > 0) {
            echo colorOutput("\n--- FAILED TESTS ---\n", 'red');
            foreach ($failedTests as $test) {
                $result = $this->results[$test];
                echo "  • $test\n";
                echo "    HTTP Code: {$result['http_code']}\n";
                echo "    Error: {$result['error']}\n";
            }
        }

        echo colorOutput("\n=== END OF REPORT ===\n", 'yellow');
    }
}

// Run tests
$tester = new EndpointTester();
$tester->runAllTests();
