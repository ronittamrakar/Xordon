<?php
// Test API endpoints
$baseUrl = 'http://localhost:8080/api';

// Get auth token first
$authResponse = file_get_contents(__DIR__ . '/test-auth-token.txt');
$token = trim($authResponse);

echo "Testing API endpoints with token: " . substr($token, 0, 20) . "...\n\n";

$endpoints = [
    '/campaigns',
    '/contacts',
    '/templates',
    '/analytics/dashboard',
    '/workspaces/current',
    '/users/me'
];

foreach ($endpoints as $endpoint) {
    $url = $baseUrl . $endpoint;
    echo "Testing: $url\n";
    
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => "Authorization: Bearer $token\r\n" .
                       "Content-Type: application/json\r\n"
        ]
    ]);
    
    $response = @file_get_contents($url, false, $context);
    
    if ($response === false) {
        $error = error_get_last();
        echo "  ✗ FAILED: " . ($error['message'] ?? 'Unknown error') . "\n";
    } else {
        $data = json_decode($response, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            echo "  ✓ SUCCESS: " . strlen($response) . " bytes\n";
            if (isset($data['data']) && is_array($data['data'])) {
                echo "    Records: " . count($data['data']) . "\n";
            }
        } else {
            echo "  ✗ Invalid JSON response\n";
            echo "    Response: " . substr($response, 0, 200) . "\n";
        }
    }
    echo "\n";
}
