<?php
/**
 * Test all new Thryv/GHL parity API endpoints
 */

$baseUrl = 'http://127.0.0.1:8001';

// Get fresh token
$tokenResponse = file_get_contents($baseUrl . '/auth/dev-token');
$tokenData = json_decode($tokenResponse, true);
$token = $tokenData['token'] ?? null;

if (!$token) {
    echo "Failed to get auth token\n";
    exit(1);
}

echo "=== Testing Thryv/GHL Parity APIs ===\n";
echo "Token: " . substr($token, 0, 16) . "...\n\n";

function apiCall($method, $url, $data = null, $token = null) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    $headers = ['Content-Type: application/json'];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    if ($data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return ['code' => $code, 'body' => json_decode($response, true)];
}

$tests = [
    // Calendars
    ['GET', '/calendars', null, 'Calendars - List'],
    ['POST', '/calendars', ['name' => 'Test Calendar', 'timezone' => 'America/New_York'], 'Calendars - Create'],
    
    // Workflows
    ['GET', '/workflows', null, 'Workflows - List'],
    ['GET', '/workflows/options', null, 'Workflows - Options'],
    ['POST', '/workflows', ['name' => 'Test Workflow', 'trigger_type' => 'contact.created'], 'Workflows - Create'],
    
    // Review Requests
    ['GET', '/review-requests', null, 'Review Requests - List'],
    ['GET', '/review-requests/stats', null, 'Review Requests - Stats'],
    ['GET', '/review-requests/platforms', null, 'Review Platforms - List'],
    
    // Funnels
    ['GET', '/funnels', null, 'Funnels - List'],
    ['POST', '/funnels', ['name' => 'Test Funnel'], 'Funnels - Create'],
    
    // Memberships
    ['GET', '/memberships', null, 'Memberships - List'],
    ['POST', '/memberships', ['name' => 'Test Membership', 'access_type' => 'paid', 'price' => 99.00], 'Memberships - Create'],
    
    // Existing Thryv-parity endpoints
    ['GET', '/services', null, 'Services - List'],
    ['GET', '/staff-members', null, 'Staff Members - List'],
    ['GET', '/services/categories', null, 'Service Categories - List'],
    ['GET', '/paypal/status', null, 'PayPal - Status'],
];

$passed = 0;
$failed = 0;

foreach ($tests as $test) {
    [$method, $path, $data, $name] = $test;
    
    $result = apiCall($method, $baseUrl . $path, $data, $token);
    $success = $result['code'] >= 200 && $result['code'] < 300;
    
    if ($success) {
        echo "✅ {$name}: OK ({$result['code']})\n";
        $passed++;
    } else {
        echo "❌ {$name}: FAIL ({$result['code']})\n";
        if (isset($result['body']['error'])) {
            echo "   Error: " . substr($result['body']['error'], 0, 100) . "\n";
        }
        $failed++;
    }
}

echo "\n=== Results ===\n";
echo "Passed: $passed\n";
echo "Failed: $failed\n";
echo "Total: " . ($passed + $failed) . "\n";
