<?php
// Test the phone number search API
require_once __DIR__ . '/backend/src/Database.php';
require_once __DIR__ . '/backend/src/services/PhoneProvisioningService.php';

echo "=== Testing Phone Number Search ===\n\n";

// Test searchAvailableNumbers with US area code (more likely to have numbers)
$result = PhoneProvisioningService::searchAvailableNumbers('212', 'US', 5);

if ($result['success']) {
    echo "✅ SUCCESS! Found " . count($result['numbers']) . " available numbers:\n\n";
    foreach ($result['numbers'] as $num) {
        echo "  📞 " . $num['phone_number'] . " - " . $num['friendly_name'] . "\n";
    }
    echo "\nThe API is working correctly!\n";
} else {
    echo "❌ FAILED: " . ($result['error'] ?? 'Unknown error') . "\n";
}

echo "\n";
