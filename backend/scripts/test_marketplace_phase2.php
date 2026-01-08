<?php
/**
 * Test Lead Marketplace Phase 2 API Endpoints
 * Usage: php test_marketplace_phase2.php
 */

$baseUrl = 'http://127.0.0.1:8001/api';
$token = '0bdb554162f197b7e54f08617a2d6125eea94f4366d85385'; // Dev token from test-auth-token.txt

function apiRequest($method, $endpoint, $data = null, $token = null) {
    global $baseUrl;
    $ch = curl_init($baseUrl . $endpoint);
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
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        return ['code' => 0, 'error' => $error];
    }
    
    return ['code' => $httpCode, 'body' => json_decode($response, true)];
}

echo "=== Testing Lead Marketplace Phase 2 Endpoints ===\n\n";

// Test 1: Provider Reviews
echo "1. Testing Reviews API...\n";
$result = apiRequest('GET', '/lead-marketplace/reviews', null, $token);
echo "   GET /reviews: " . ($result['code'] == 200 ? "✅ OK" : "❌ FAIL ({$result['code']})") . "\n";
if ($result['code'] != 200) {
    echo "   Response: " . json_encode($result['body']) . "\n";
}

// Test 2: Provider Documents
echo "\n2. Testing Documents API...\n";
$result = apiRequest('GET', '/lead-marketplace/documents', null, $token);
echo "   GET /documents: " . ($result['code'] == 200 ? "✅ OK" : "❌ FAIL ({$result['code']})") . "\n";
if ($result['code'] != 200) {
    echo "   Response: " . json_encode($result['body']) . "\n";
}

// Test 3: Verification Status
echo "\n3. Testing Verification Status...\n";
$result = apiRequest('GET', '/lead-marketplace/documents/verification-status', null, $token);
echo "   GET /verification-status: " . ($result['code'] == 200 ? "✅ OK" : "❌ FAIL ({$result['code']})") . "\n";
if ($result['code'] == 200 && isset($result['body']['data'])) {
    $status = $result['body']['data'];
    echo "   Progress: {$status['verification_progress']}%\n";
    echo "   License: " . ($status['has_license'] ? 'Yes' : 'No') . "\n";
    echo "   Insurance: " . ($status['insurance_verified'] ? 'Yes' : 'No') . "\n";
}

// Test 4: Messaging Threads
echo "\n4. Testing Messaging API...\n";
$result = apiRequest('GET', '/lead-marketplace/messages/threads', null, $token);
echo "   GET /messages/threads: " . ($result['code'] == 200 ? "✅ OK" : "❌ FAIL ({$result['code']})") . "\n";
if ($result['code'] != 200) {
    echo "   Response: " . json_encode($result['body']) . "\n";
}

// Test 5: Booking Types
echo "\n5. Testing Booking API...\n";
$result = apiRequest('GET', '/lead-marketplace/booking/types', null, $token);
echo "   GET /booking/types: " . ($result['code'] == 200 ? "✅ OK" : "❌ FAIL ({$result['code']})") . "\n";
if ($result['code'] != 200) {
    echo "   Response: " . json_encode($result['body']) . "\n";
}

// Test 6: Geocoding Service (indirectly via nearby providers)
echo "\n6. Testing Geolocation (Nearby Providers)...\n";
$result = apiRequest('GET', '/lead-marketplace/providers/nearby?latitude=40.7128&longitude=-74.0060&radius_km=50', null, $token);
echo "   GET /providers/nearby: " . ($result['code'] == 200 ? "✅ OK" : "❌ FAIL ({$result['code']})") . "\n";
if ($result['code'] == 200 && isset($result['body']['data'])) {
    echo "   Found " . count($result['body']['data']) . " nearby providers\n";
}

// Test 7: Provider Badges
echo "\n7. Testing Provider Badges...\n";
$result = apiRequest('GET', '/lead-marketplace/badges', null, $token);
echo "   GET /badges: " . ($result['code'] == 200 ? "✅ OK" : "❌ FAIL ({$result['code']})") . "\n";
if ($result['code'] == 200 && isset($result['body']['data'])) {
    echo "   Available badges: " . count($result['body']['data']) . "\n";
    foreach (array_slice($result['body']['data'], 0, 3) as $badge) {
        echo "     - {$badge['name']}: {$badge['description']}\n";
    }
}

// Test 8: Lead Quality Feedback
echo "\n8. Testing Lead Quality Feedback...\n";
$result = apiRequest('GET', '/lead-marketplace/quality-feedback', null, $token);
echo "   GET /quality-feedback: " . ($result['code'] == 200 ? "✅ OK" : "❌ FAIL ({$result['code']})") . "\n";

echo "\n=== Test Complete ===\n";
echo "\nAll Phase 2 endpoints have been tested.\n";
echo "✅ = Working correctly\n";
echo "❌ = Needs attention\n\n";
