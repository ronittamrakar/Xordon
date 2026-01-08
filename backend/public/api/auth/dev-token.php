<?php
require_once __DIR__ . '/../../../src/bootstrap.php';
require_once __DIR__ . '/../../../src/controllers/AuthController.php';

header('Content-Type: application/json');

$env = getenv('APP_ENV') ?: '';
$isDev = ($env === 'development' || $env === 'dev');

if (!$isDev) {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

AuthController::devToken();
?>