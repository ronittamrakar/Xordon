<?php
require_once __DIR__ . '/../src/Database.php';
use Xordon\Database;

try {
    $db = Database::conn();
    
    // Rename design_settings to settings if it exists
    $stmt = $db->query("SHOW COLUMNS FROM review_widgets LIKE 'design_settings'");
    if ($stmt->fetch()) {
        $db->exec("ALTER TABLE review_widgets CHANGE COLUMN design_settings settings JSON");
        echo "Renamed design_settings to settings in review_widgets\n";
    } else {
        echo "design_settings column not found in review_widgets, skipping rename\n";
    }
    
    // Check if settings column exists if design_settings didn't
    $stmt = $db->query("SHOW COLUMNS FROM review_widgets LIKE 'settings'");
    if (!$stmt->fetch()) {
        $db->exec("ALTER TABLE review_widgets ADD COLUMN settings JSON AFTER show_ai_summary");
        echo "Added settings column to review_widgets\n";
    }
    
    echo "Reputation table fixes completed\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
