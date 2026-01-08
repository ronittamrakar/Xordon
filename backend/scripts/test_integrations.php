<?php
/**
 * Test Integration APIs (Calendar Sync, Phone Provisioning, Review Integrations, Workflow Execution)
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

echo "=== Testing Integration APIs ===\n";
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
    // Calendar Sync
    ['POST', '/calendar/google/connect', ['calendar_id' => 1], 'Calendar - Google Connect URL'],
    ['POST', '/calendars/1/sync', null, 'Calendar - Trigger Sync'],
    ['POST', '/calendars/1/disconnect/google', null, 'Calendar - Disconnect'],
    
    // Phone Provisioning
    ['GET', '/phone/search?area_code=415&country=US', null, 'Phone - Search Numbers'],
    ['POST', '/phone/purchase', ['phone_number' => '+14155551234', 'friendly_name' => 'Test'], 'Phone - Purchase (will fail without real provider)'],
    
    // Review Integrations
    ['POST', '/reviews/google/connect', ['platform_config_id' => 1], 'Reviews - Google Connect URL'],
    ['POST', '/reviews/facebook/connect', ['platform_config_id' => 1], 'Reviews - Facebook Connect URL'],
    ['POST', '/reviews/platforms/1/sync', ['platform' => 'google'], 'Reviews - Sync Google'],
    
    // Existing Parity APIs (regression check)
    ['GET', '/calendars', null, 'Calendars - List'],
    ['GET', '/workflows', null, 'Workflows - List'],
    ['GET', '/review-requests', null, 'Review Requests - List'],
    ['GET', '/funnels', null, 'Funnels - List'],
    ['GET', '/memberships', null, 'Memberships - List'],
];

$passed = 0;
$failed = 0;
$skipped = 0;

foreach ($tests as $test) {
    [$method, $path, $data, $name] = $test;
    
    // Skip tests that require actual provider credentials
    if (strpos($name, 'Purchase') !== false || strpos($name, 'Sync') !== false) {
        echo "⚠️  {$name}: SKIPPED (requires provider credentials)\n";
        $skipped++;
        continue;
    }
    
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
echo "Skipped: $skipped\n";
echo "Total: " . ($passed + $failed + $skipped) . "\n";

exit($failed > 0 ? 1 : 0);
