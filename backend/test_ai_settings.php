<?php
// Mock environment for testing controller
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/api/ai/settings';

require_once __DIR__ . '/src/bootstrap.php';
require_once __DIR__ . '/src/controllers/AISettingsController.php';

// Mock TenantContext if needed
// For now, let's see if it even gets past the requires

try {
    Xordon\Controllers\AISettingsController::getSettings();
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "TRACE:\n" . $e->getTraceAsString() . "\n";
}
