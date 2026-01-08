<?php
// Test API endpoints

$token = '9e986fb4d132df75ea3b889ffd1bb68d3b2ad70a4bc56c8b';
$baseUrl = 'http://127.0.0.1:8001';

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
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return ['code' => $httpCode, 'body' => json_decode($response, true)];
}

echo "=== Testing Thryv-Parity API Endpoints ===\n\n";

// Test 1: Services API
echo "1. Testing Services API...\n";
$result = apiCall('GET', $baseUrl . '/services', null, $token);
echo "   GET /services: " . ($result['code'] == 200 ? "✅ OK" : "❌ FAIL ({$result['code']})") . "\n";

// Create a service
$result = apiCall('POST', $baseUrl . '/services', [
    'name' => 'Test Consultation',
    'duration_minutes' => 60,
    'price' => 100.00,
    'description' => 'A test service'
], $token);
echo "   POST /services: " . ($result['code'] == 200 || $result['code'] == 201 ? "✅ OK" : "❌ FAIL ({$result['code']})") . "\n";
if ($result['code'] != 200 && $result['code'] != 201) {
    echo "   Error: " . json_encode($result['body']) . "\n";
}
$serviceId = $result['body']['data']['id'] ?? null;
if ($serviceId) echo "   Created service ID: $serviceId\n";

// Test 2: Staff Members API
echo "\n2. Testing Staff Members API...\n";
$result = apiCall('GET', $baseUrl . '/staff-members', null, $token);
echo "   GET /staff-members: " . ($result['code'] == 200 ? "✅ OK" : "❌ FAIL ({$result['code']})") . "\n";
if ($result['code'] != 200) echo "   Error: " . json_encode($result['body']) . "\n";

// Create a staff member
$result = apiCall('POST', $baseUrl . '/staff-members', [
    'first_name' => 'John',
    'last_name' => 'Doe',
    'email' => 'john@example.com'
], $token);
echo "   POST /staff-members: " . ($result['code'] == 200 || $result['code'] == 201 ? "✅ OK" : "❌ FAIL ({$result['code']})") . "\n";
if ($result['code'] != 200 && $result['code'] != 201) echo "   Error: " . json_encode($result['body']) . "\n";
$staffId = $result['body']['data']['id'] ?? null;
if ($staffId) echo "   Created staff ID: $staffId\n";

// Test 3: Booking Slots API
echo "\n3. Testing Booking Slots API...\n";
if ($serviceId) {
    $date = date('Y-m-d', strtotime('+1 day'));
    $result = apiCall('GET', $baseUrl . "/booking/slots?service_id=$serviceId&date=$date", null, $token);
    echo "   GET /booking/slots: " . ($result['code'] == 200 ? "✅ OK" : "❌ FAIL ({$result['code']})") . "\n";
    if ($result['code'] != 200) {
        echo "   Error: " . json_encode($result['body']) . "\n";
    }
} else {
    echo "   ⚠️ Skipped (no service created)\n";
}

// Test 4: Service Categories API
echo "\n4. Testing Service Categories API...\n";
$result = apiCall('GET', $baseUrl . '/services/categories', null, $token);
echo "   GET /services/categories: " . ($result['code'] == 200 ? "✅ OK" : "❌ FAIL ({$result['code']})") . "\n";
if ($result['code'] != 200) echo "   Error: " . json_encode($result['body']) . "\n";

// Test 5: PayPal Status API
echo "\n5. Testing PayPal API...\n";
$result = apiCall('GET', $baseUrl . '/paypal/status', null, $token);
echo "   GET /paypal/status: " . ($result['code'] == 200 ? "✅ OK" : "❌ FAIL ({$result['code']})") . "\n";

// Test 6: Portal Auth API (no auth required for request)
echo "\n6. Testing Portal Auth API...\n";
$result = apiCall('POST', $baseUrl . '/portal/auth/magic-link', [
    'email' => 'test@example.com',
    'workspace_id' => 1
], null);
echo "   POST /portal/auth/magic-link: " . (in_array($result['code'], [200, 400, 404]) ? "✅ OK (responded)" : "❌ FAIL ({$result['code']})") . "\n";
if (isset($result['body']['error'])) {
    echo "   Response: " . $result['body']['error'] . "\n";
}

echo "\n=== Test Complete ===\n";
