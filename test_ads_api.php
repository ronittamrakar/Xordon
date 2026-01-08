<?php
/**
 * Test script for Ads Manager API endpoints
 * Tests all button functionality from the frontend
 */

require_once __DIR__ . '/backend/src/bootstrap.php';
require_once __DIR__ . '/backend/src/Database.php';
require_once __DIR__ . '/backend/src/Response.php';
require_once __DIR__ . '/backend/src/Auth.php';
require_once __DIR__ . '/backend/src/Permissions.php';
require_once __DIR__ . '/backend/src/controllers/AdsController.php';

// Mock authentication for testing
$_SERVER['HTTP_AUTHORIZATION'] = 'Bearer dev-token';
$_SERVER['HTTP_X_WORKSPACE_ID'] = '1';
$_SERVER['HTTP_X_COMPANY_ID'] = '1';

echo "=== Testing Ads Manager API Endpoints ===\n\n";

// Test 1: Get Accounts
echo "1. Testing GET /ads/accounts...\n";
try {
    ob_start();
    AdsController::getAccounts();
    $output = ob_get_clean();
    $data = json_decode($output, true);
    if (isset($data['data'])) {
        echo "   ✓ Success: Found " . count($data['data']) . " ad accounts\n";
    } else {
        echo "   ✗ Error: " . ($data['error'] ?? 'Unknown error') . "\n";
    }
} catch (Exception $e) {
    echo "   ✗ Exception: " . $e->getMessage() . "\n";
}

// Test 2: Get Campaigns
echo "\n2. Testing GET /ads/campaigns...\n";
try {
    ob_start();
    AdsController::getCampaigns();
    $output = ob_get_clean();
    $data = json_decode($output, true);
    if (isset($data['data'])) {
        echo "   ✓ Success: Found " . count($data['data']) . " campaigns\n";
        if (count($data['data']) > 0) {
            $campaign = $data['data'][0];
            echo "   Sample: {$campaign['name']} - Status: {$campaign['status']}\n";
        }
    } else {
        echo "   ✗ Error: " . ($data['error'] ?? 'Unknown error') . "\n";
    }
} catch (Exception $e) {
    echo "   ✗ Exception: " . $e->getMessage() . "\n";
}

// Test 3: Get Analytics
echo "\n3. Testing GET /ads/analytics...\n";
try {
    ob_start();
    AdsController::getAnalytics();
    $output = ob_get_clean();
    $data = json_decode($output, true);
    if (isset($data['data']['overall'])) {
        $overall = $data['data']['overall'];
        echo "   ✓ Success: Analytics loaded\n";
        echo "   Total Spend: $" . number_format($overall['total_spend'] ?? 0, 2) . "\n";
        echo "   Total Clicks: " . number_format($overall['total_clicks'] ?? 0) . "\n";
        echo "   Total Conversions: " . number_format($overall['total_conversions'] ?? 0) . "\n";
    } else {
        echo "   ✗ Error: " . ($data['error'] ?? 'Unknown error') . "\n";
    }
} catch (Exception $e) {
    echo "   ✗ Exception: " . $e->getMessage() . "\n";
}

// Test 4: Get Budgets
echo "\n4. Testing GET /ads/budgets...\n";
try {
    ob_start();
    AdsController::getBudgets();
    $output = ob_get_clean();
    $data = json_decode($output, true);
    if (isset($data['data'])) {
        echo "   ✓ Success: Found " . count($data['data']) . " budgets\n";
    } else {
        echo "   ✗ Error: " . ($data['error'] ?? 'Unknown error') . "\n";
    }
} catch (Exception $e) {
    echo "   ✗ Exception: " . $e->getMessage() . "\n";
}

// Test 5: Get Conversions
echo "\n5. Testing GET /ads/conversions...\n";
try {
    ob_start();
    AdsController::getConversions();
    $output = ob_get_clean();
    $data = json_decode($output, true);
    if (isset($data['data'])) {
        echo "   ✓ Success: Found " . count($data['data']) . " conversions\n";
    } else {
        echo "   ✗ Error: " . ($data['error'] ?? 'Unknown error') . "\n";
    }
} catch (Exception $e) {
    echo "   ✗ Exception: " . $e->getMessage() . "\n";
}

// Test 6: Get A/B Tests
echo "\n6. Testing GET /ads/ab-tests...\n";
try {
    ob_start();
    AdsController::getABTests();
    $output = ob_get_clean();
    $data = json_decode($output, true);
    if (isset($data['data'])) {
        echo "   ✓ Success: Found " . count($data['data']) . " A/B tests\n";
    } else {
        echo "   ✗ Error: " . ($data['error'] ?? 'Unknown error') . "\n";
    }
} catch (Exception $e) {
    echo "   ✗ Exception: " . $e->getMessage() . "\n";
}

// Test 7: Create Campaign (Button Test)
echo "\n7. Testing POST /ads/campaigns (Create Campaign button)...\n";
try {
    $testData = json_encode([
        'name' => 'Test Campaign ' . time(),
        'platform' => 'google_ads',
        'campaign_type' => 'search',
        'daily_budget' => 50.00,
        'status' => 'draft'
    ]);
    
    // Mock the input
    $tmpFile = tmpfile();
    fwrite($tmpFile, $testData);
    fseek($tmpFile, 0);
    
    $oldInput = fopen('php://input', 'r');
    stream_wrapper_unregister('php');
    stream_wrapper_register('php', 'MockPhpStream');
    MockPhpStream::$data = $testData;
    
    ob_start();
    AdsController::createCampaign();
    $output = ob_get_clean();
    $data = json_decode($output, true);
    
    stream_wrapper_restore('php');
    
    if (isset($data['data']['id'])) {
        echo "   ✓ Success: Campaign created with ID: " . $data['data']['id'] . "\n";
    } else {
        echo "   ✗ Error: " . ($data['error'] ?? 'Unknown error') . "\n";
    }
} catch (Exception $e) {
    echo "   ✗ Exception: " . $e->getMessage() . "\n";
}

echo "\n=== All Tests Complete ===\n";

// Mock stream wrapper for php://input
class MockPhpStream {
    public static $data = '';
    private $position = 0;
    
    public function stream_open($path, $mode, $options, &$opened_path) {
        $this->position = 0;
        return true;
    }
    
    public function stream_read($count) {
        $ret = substr(self::$data, $this->position, $count);
        $this->position += strlen($ret);
        return $ret;
    }
    
    public function stream_eof() {
        return $this->position >= strlen(self::$data);
    }
    
    public function stream_stat() {
        return [];
    }
}
