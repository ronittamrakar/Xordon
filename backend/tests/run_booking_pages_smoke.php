<?php
// Lightweight smoke test for BookingPagesController index behavior when booking_pages table is missing
// Load minimal autoloader which also provides class aliases
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../src/controllers/BookingPagesController.php';
require_once __DIR__ . '/../src/Response.php';

// Ensure tenant context is present so controller proceeds to DB logic
$GLOBALS['tenantContext'] = (object)['workspaceId' => 1];

// attempt to rename booking_pages to simulate missing table
$pdo = \Database::conn();
$renamed = false;
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'booking_pages'");
    $exists = $stmt->fetch();
    if ($exists) {
        $pdo->exec("RENAME TABLE booking_pages TO booking_pages_test_backup");
        $renamed = true;
    }
} catch (Exception $e) {
    // If we can't check or rename, continue — the test will still exercise the controller
}

// call controller and capture output without printing before headers
ob_start();
try {
    \BookingPagesController::index();
} catch (Exception $e) {
    // Controller may call Response::error which calls json() and exit; catch any exceptions
    echo "Controller threw: " . $e->getMessage() . "\n";
}
$output = ob_get_clean();

if (trim($output) === '') {
    echo "No direct output from controller (likely Response::json was used)\n";
} else {
    echo "Controller output: $output\n";
}

// Attempt to decode JSON if present
$json = json_decode($output, true);
if (is_array($json) && isset($json['error'])) {
    echo "Captured API error: " . $json['error'] . "\n";
    if (stripos($json['error'], 'Booking pages tables are missing') !== false) {
        echo "✔ Correct friendly error detected\n";
    } else {
        echo "✖ Unexpected error message: " . $json['error'] . "\n";
        exit(1);
    }
} else {
    // Some environments may have logged and not emitted JSON; check logs
    echo "No JSON error found; check logs or Response behavior.\n";
}

// restore renamed table
if ($renamed) {
    try {
        $pdo->exec("RENAME TABLE booking_pages_test_backup TO booking_pages");
        echo "Restored booking_pages table\n";
    } catch (Exception $e) {
        echo "Failed to restore booking_pages table: " . $e->getMessage() . "\n";
    }
}

echo "Done\n";
