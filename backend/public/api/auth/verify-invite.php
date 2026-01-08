<?php
require_once __DIR__ . '/../../../src/bootstrap.php';
require_once __DIR__ . '/../../../src/controllers/AuthController.php';

header('Content-Type: application/json');

// Enable CORS
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

AuthController::verifyInvite();
