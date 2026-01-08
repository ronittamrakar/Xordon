<?php
require_once __DIR__ . '/../../../src/bootstrap.php';

use Services\SMSService;
use Services\SMSSequenceProcessor;

header('Content-Type: application/json');

try {
    // Verify this is a legitimate request (you might want to add authentication)
    $secret = $_GET['secret'] ?? '';
    $expectedSecret = $_ENV['SMS_PROCESS_SECRET'] ?? 'default-secret-change-this';
    
    if ($secret !== $expectedSecret) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    
    // Initialize services
    $smsService = new SMSService();
    $sequenceProcessor = new SMSSequenceProcessor($smsService);
    
    // Get limit from query parameter (default 100)
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    $limit = min($limit, 1000); // Cap at 1000 for safety
    
    // Process pending messages
    $result = $sequenceProcessor->processPendingMessages($limit);
    
    // Return success response
    echo json_encode([
        'success' => true,
        'result' => $result,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    error_log('SMS sequence processing error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error',
        'message' => $e->getMessage()
    ]);
}