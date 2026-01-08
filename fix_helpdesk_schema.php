<?php
/**
 * Check and fix all helpdesk-related table schemas
 */

require_once __DIR__ . '/backend/src/Config.php';
require_once __DIR__ . '/backend/src/Database.php';

try {
    $db = Database::conn();
    echo "Checking helpdesk tables schema...\n\n";

    // Check ticket_messages columns
    echo "=== ticket_messages ===\n";
    $stmt = $db->query("SHOW COLUMNS FROM ticket_messages");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Current columns: " . implode(', ', $columns) . "\n";

    $required = [
        'is_private' => 'BOOLEAN DEFAULT FALSE',
        'direction' => "ENUM('inbound', 'outbound') DEFAULT 'outbound'",
        'message_type' => "VARCHAR(50) DEFAULT 'comment'",
        'from_email' => 'VARCHAR(255)',
        'to_email' => 'VARCHAR(255)',
        'subject' => 'VARCHAR(500)',
        'body_html' => 'LONGTEXT',
        'attachments' => 'JSON',
        'author_user_id' => 'INT NULL',
        'author_name' => 'VARCHAR(255)',
        'author_email' => 'VARCHAR(255)'
    ];

    foreach ($required as $col => $def) {
        if (!in_array($col, $columns)) {
            try {
                $db->exec("ALTER TABLE ticket_messages ADD COLUMN $col $def");
                echo "  ✓ Added $col\n";
            } catch (Exception $e) {
                echo "  ✗ $col: " . $e->getMessage() . "\n";
            }
        }
    }

    // Check ticket_stages columns
    echo "\n=== ticket_stages ===\n";
    $stmt = $db->query("SHOW COLUMNS FROM ticket_stages");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $required = [
        'stage_type' => "VARCHAR(50) DEFAULT 'open'",
        'color' => "VARCHAR(7) DEFAULT '#6366f1'",
        'sequence' => 'INT DEFAULT 0'
    ];

    foreach ($required as $col => $def) {
        if (!in_array($col, $columns)) {
            try {
                $db->exec("ALTER TABLE ticket_stages ADD COLUMN $col $def");
                echo "  ✓ Added $col\n";
            } catch (Exception $e) {
                echo "  ✗ $col: " . $e->getMessage() . "\n";
            }
        }
    }

    // Check ticket_types columns
    echo "\n=== ticket_types ===\n";
    $stmt = $db->query("SHOW COLUMNS FROM ticket_types");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $required = [
        'icon' => 'VARCHAR(50)',
        'is_active' => 'BOOLEAN DEFAULT TRUE'
    ];

    foreach ($required as $col => $def) {
        if (!in_array($col, $columns)) {
            try {
                $db->exec("ALTER TABLE ticket_types ADD COLUMN $col $def");
                echo "  ✓ Added $col\n";
            } catch (Exception $e) {
                echo "  ✗ $col: " . $e->getMessage() . "\n";
            }
        }
    }

    // Check ticket_teams columns
    echo "\n=== ticket_teams ===\n";
    $stmt = $db->query("SHOW COLUMNS FROM ticket_teams");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $required = [
        'is_active' => 'BOOLEAN DEFAULT TRUE'
    ];

    foreach ($required as $col => $def) {
        if (!in_array($col, $columns)) {
            try {
                $db->exec("ALTER TABLE ticket_teams ADD COLUMN $col $def");
                echo "  ✓ Added $col\n";
            } catch (Exception $e) {
                echo "  ✗ $col: " . $e->getMessage() . "\n";
            }
        }
    }

    // Check ticket_activities columns
    echo "\n=== ticket_activities ===\n";
    $stmt = $db->query("SHOW COLUMNS FROM ticket_activities");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $required = [
        'activity_type' => 'VARCHAR(100)',
        'field_name' => 'VARCHAR(100)',
        'old_value' => 'TEXT',
        'new_value' => 'TEXT',
        'description' => 'TEXT'
    ];

    foreach ($required as $col => $def) {
        if (!in_array($col, $columns)) {
            try {
                $db->exec("ALTER TABLE ticket_activities ADD COLUMN $col $def");
                echo "  ✓ Added $col\n";
            } catch (Exception $e) {
                echo "  ✗ $col: " . $e->getMessage() . "\n";
            }
        }
    }

    // Check sla_policies columns
    echo "\n=== sla_policies ===\n";
    $stmt = $db->query("SHOW COLUMNS FROM sla_policies");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $required = [
        'is_active' => 'BOOLEAN DEFAULT TRUE',
        'priority_low_response_time' => 'INT DEFAULT 480',
        'priority_low_resolution_time' => 'INT DEFAULT 2880',
        'priority_medium_response_time' => 'INT DEFAULT 240',
        'priority_medium_resolution_time' => 'INT DEFAULT 1440',
        'priority_high_response_time' => 'INT DEFAULT 120',
        'priority_high_resolution_time' => 'INT DEFAULT 480',
        'priority_urgent_response_time' => 'INT DEFAULT 60',
        'priority_urgent_resolution_time' => 'INT DEFAULT 240'
    ];

    foreach ($required as $col => $def) {
        if (!in_array($col, $columns)) {
            try {
                $db->exec("ALTER TABLE sla_policies ADD COLUMN $col $def");
                echo "  ✓ Added $col\n";
            } catch (Exception $e) {
                echo "  ✗ $col: " . $e->getMessage() . "\n";
            }
        }
    }

    echo "\n✅ Schema fixes complete!\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
