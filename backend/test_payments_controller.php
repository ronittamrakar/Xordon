<?php
require_once __DIR__ . '/src/Auth.php';
require_once __DIR__ . '/src/Database.php';
require_once __DIR__ . '/src/Response.php';
require_once __DIR__ . '/src/controllers/PaymentsController.php';

// Mock Auth
class MockAuth extends \Xordon\Auth {
    public static function userId() { return 1; }
    public static function userIdOrFail() { return 1; }
}

// Override Auth in global namespace if possible?
// Actually, I'll just change the script to use a mock user if I can.
// But PaymentsController calls Auth::userIdOrFail() which is a static call.

echo "Testing PaymentsController::getSettings...\n";
try {
    PaymentsController::getSettings();
} catch (Exception $e) {
    echo "Caught: " . $e->getMessage() . "\n";
}

echo "\nTesting PaymentsController::updateSettings...\n";
$_POST = [
    'default_currency' => 'EUR',
    'default_tax_rate' => 20,
    'invoice_prefix' => 'TEST-',
    'auto_send_receipts' => true
];
// Mock JSON body for updateSettings
function get_json_body() {
    return [
        'default_currency' => 'EUR',
        'default_tax_rate' => 20,
        'invoice_prefix' => 'TEST-',
        'auto_send_receipts' => true
    ];
}

try {
    PaymentsController::updateSettings();
} catch (Exception $e) {
    echo "Caught: " . $e->getMessage() . "\n";
}
