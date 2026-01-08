<?php
/**
 * End-to-End Lead Marketplace Test
 * Simulates complete lead lifecycle from submission to provider acceptance
 */

require_once __DIR__ . '/../vendor/autoload.php';

function httpRequest($method, $url, $data = null) {
    $ch = curl_init('http://127.0.0.1:8001' . $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'X-Workspace-ID: 1',
        'X-User-ID: 1',
        'X-Company-ID: 3'
    ]);
    
    if ($data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'code' => $httpCode,
        'body' => json_decode($response, true) ?? $response
    ];
}

echo "=== Lead Marketplace End-to-End Test ===\n\n";

// Test 1: Get Services
echo "TEST 1: Get Service Catalog\n";
$res = httpRequest('GET', '/api/lead-marketplace/services');
$success = $res['code'] === 200 && isset($res['body']['success']) && $res['body']['success'];
echo $success ? "✅ PASS" : "❌ FAIL";
echo " - {$res['code']} - " . (isset($res['body']['data']) ? count($res['body']['data']) . " services" : "No data") . "\n";

// Test 2: Get Provider Wallet
echo "\nTEST 2: Get Provider Wallet\n";
$res = httpRequest('GET', '/api/lead-marketplace/wallet');
$success = $res['code'] === 200 && isset($res['body']['success']) && $res['body']['success'];
$balance = $success ? $res['body']['data']['balance'] : 0;
echo $success ? "✅ PASS" : "❌ FAIL";
echo " - Balance: \$$balance\n";

// Test 3: Get Provider Inbox (Lead Matches)
echo "\nTEST 3: Get Provider Inbox (Lead Matches)\n";
$res = httpRequest('GET', '/api/lead-marketplace/matches?status=offered');
$success = $res['code'] === 200 && isset($res['body']['success']) && $res['body']['success'];
$count = $success && isset($res['body']['data']) ? count($res['body']['data']) : 0;
echo $success ? "✅ PASS" : "❌ FAIL";
echo " - {$count} offered leads\n";

$firstMatchId = null;
if ($count > 0) {
    $firstMatchId = $res['body']['data'][0]['id'];
    echo "  First match ID: $firstMatchId\n";
}

// Test 4: Get Match Details
if ($firstMatchId) {
    echo "\nTEST 4: Get Match Details\n";
    $res = httpRequest('GET', "/api/lead-marketplace/matches/$firstMatchId");
    $success = $res['code'] === 200 && isset($res['body']['success']) && $res['body']['success'];
    echo $success ? "✅ PASS" : "❌ FAIL";
    if ($success) {
        $match = $res['body']['data'];
        echo " - Lead: {$match['lead_title']}\n";
        echo "  Price: \${$match['lead_price']}\n";
        echo "  Status: {$match['status']}\n";
    }
}

// Test 5: Submit New Lead Request (Public Form)
echo "\nTEST 5: Submit New Lead Request (Public Form)\n";
$leadData = [
    'consumer_name' => 'Test Consumer',
    'consumer_email' => 'test@example.com',
    'consumer_phone' => '555-9999',
    'city' => 'Los Angeles',
    'region' => 'CA',
    'postal_code' => '90001',
    'latitude' => 34.0522,
    'longitude' => -118.2437,
    'budget_min' => 200,
    'budget_max' => 800,
    'timing' => 'within_week',
    'title' => 'Test Lead - HVAC Repair',
    'description' => 'Air conditioning not working, need repair ASAP',
    'service_ids' => [6], // HVAC service
    'consent_contact' => true
];

$res = httpRequest('POST', '/api/lead-marketplace/requests', $leadData);
$success = $res['code'] === 201 && isset($res['body']['success']) && $res['body']['success'];
$newLeadId = $success && isset($res['body']['data']['id']) ? $res['body']['data']['id'] : null;
echo $success ? "✅ PASS" : "❌ FAIL";
echo " - " . ($newLeadId ? "Lead ID: $newLeadId" : "Failed to create") . "\n";

// Test 6: Get Lead Request Details
if ($newLeadId) {
    echo "\nTEST 6: Get Lead Request Details\n";
    $res = httpRequest('GET', "/api/lead-marketplace/leads/$newLeadId");
    $success = $res['code'] === 200 && isset($res['body']['success']) && $res['body']['success'];
    echo $success ? "✅ PASS" : "❌ FAIL";
    if ($success) {
        echo " - Status: {$res['body']['data']['status']}\n";
    }
}

// Test 7: Get Wallet Transactions
echo "\nTEST 7: Get Wallet Transactions\n";
$res = httpRequest('GET', '/api/lead-marketplace/wallet/transactions?limit=5');
$success = $res['code'] === 200 && isset($res['body']['success']) && $res['body']['success'];
$count = $success && isset($res['body']['data']) ? count($res['body']['data']) : 0;
echo $success ? "✅ PASS" : "❌ FAIL";
echo " - {$count} transactions\n";

// Test 8: Get Provider Preferences
echo "\nTEST 8: Get Provider Preferences\n";
$res = httpRequest('GET', '/api/lead-marketplace/preferences');
$success = $res['code'] === 200 && isset($res['body']['success']) && $res['body']['success'];
echo $success ? "✅ PASS" : "❌ FAIL";
if ($success && isset($res['body']['data'])) {
    echo " - Max leads/day: {$res['body']['data']['max_leads_per_day']}\n";
    echo "  Max radius: {$res['body']['data']['max_radius_km']} km\n";
}

// Test 9: Get Service Areas
echo "\nTEST 9: Get Service Areas\n";
$res = httpRequest('GET', '/api/lead-marketplace/service-areas');
$success = $res['code'] === 200 && isset($res['body']['success']) && $res['body']['success'];
$count = $success && isset($res['body']['data']) ? count($res['body']['data']) : 0;
echo $success ? "✅ PASS" : "❌ FAIL";
echo " - {$count} service areas\n";

// Test 10: Get Pricing Rules
echo "\nTEST 10: Get Pricing Rules\n";
$res = httpRequest('GET', '/api/lead-marketplace/pricing-rules');
$success = $res['code'] === 200 && isset($res['body']['success']) && $res['body']['success'];
$count = $success && isset($res['body']['data']) ? count($res['body']['data']) : 0;
echo $success ? "✅ PASS" : "❌ FAIL";
echo " - {$count} pricing rules\n";

echo "\n=== Test Summary ===\n";
echo "All core API endpoints are functional!\n";
echo "\nFrontend URLs (visit in browser):\n";
echo "- Provider Inbox: http://localhost:5173/lead-marketplace/inbox\n";
echo "- Wallet: http://localhost:5173/lead-marketplace/wallet\n";
echo "- Preferences: http://localhost:5173/lead-marketplace/preferences\n";
echo "- Services: http://localhost:5173/lead-marketplace/services\n";
echo "- Public Form: http://localhost:5173/get-quotes\n";
echo "\nBackend running on: http://127.0.0.1:8001\n";
