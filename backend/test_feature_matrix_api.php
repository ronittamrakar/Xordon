<?php
/**
 * Test script for Feature Matrix API endpoints
 * Run this to verify all new endpoints are working
 */

$baseUrl = 'http://localhost:8000/api';
$token = ''; // Will be set after login

// Colors for output
function colorize($text, $color) {
    $colors = [
        'green' => "\033[32m",
        'red' => "\033[31m",
        'yellow' => "\033[33m",
        'blue' => "\033[34m",
        'reset' => "\033[0m"
    ];
    return $colors[$color] . $text . $colors['reset'];
}

function testEndpoint($method, $path, $data = null, $description = '') {
    global $baseUrl, $token;
    
    $url = $baseUrl . $path;
    $ch = curl_init($url);
    
    $headers = [
        'Content-Type: application/json',
        'Accept: application/json'
    ];
    
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    if ($data && ($method === 'POST' || $method === 'PUT' || $method === 'PATCH')) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $success = $httpCode >= 200 && $httpCode < 300;
    $statusColor = $success ? 'green' : 'red';
    
    echo colorize("[$method $path]", 'blue') . " ";
    echo colorize("HTTP $httpCode", $statusColor);
    
    if ($description) {
        echo " - $description";
    }
    
    echo "\n";
    
    if (!$success) {
        echo "  Response: " . substr($response, 0, 200) . "\n";
    }
    
    return json_decode($response, true);
}

echo colorize("\n=== Feature Matrix API Tests ===\n\n", 'yellow');

// Test 1: Health Check
echo colorize("1. Health Check\n", 'yellow');
testEndpoint('GET', '/health', null, 'API health check');

// Test 2: AI Settings (requires auth)
echo colorize("\n2. AI Settings Endpoints\n", 'yellow');
testEndpoint('GET', '/ai/settings', null, 'Get AI settings (will fail without auth)');
testEndpoint('GET', '/ai/settings/feature/chatbot', null, 'Check chatbot feature');
testEndpoint('GET', '/ai/chatbot/config', null, 'Get chatbot config');

// Test 3: Courses
echo colorize("\n3. Course Endpoints\n", 'yellow');
testEndpoint('GET', '/courses', null, 'List all courses');
testEndpoint('GET', '/courses/1', null, 'Get course #1');
testEndpoint('GET', '/courses/999', null, 'Get non-existent course');

// Test 4: Enrollments
echo colorize("\n4. Enrollment Endpoints\n", 'yellow');
testEndpoint('GET', '/enrollments', null, 'Get user enrollments');
testEndpoint('GET', '/enrollments/stats', null, 'Get enrollment stats');
testEndpoint('GET', '/courses/1/enrollments', null, 'Get course enrollments');

// Test 5: Certificates
echo colorize("\n5. Certificate Endpoints\n", 'yellow');
testEndpoint('GET', '/certificates', null, 'Get user certificates');
testEndpoint('GET', '/certificates/1', null, 'Get certificate #1');
testEndpoint('GET', '/certificates/verify/TEST123', null, 'Verify certificate');

echo colorize("\n=== Tests Complete ===\n\n", 'yellow');

echo colorize("Note: ", 'blue');
echo "Most endpoints require authentication. ";
echo "To fully test, you'll need to:\n";
echo "1. Get an auth token from /api/auth/dev-token\n";
echo "2. Set the \$token variable in this script\n";
echo "3. Run the tests again\n\n";

echo colorize("API Documentation:\n", 'yellow');
echo "- AI Settings: GET/PUT /api/ai/settings\n";
echo "- Courses: GET/POST /api/courses\n";
echo "- Enrollments: POST /api/courses/{id}/enroll\n";
echo "- Certificates: GET /api/certificates\n";
echo "\n";
