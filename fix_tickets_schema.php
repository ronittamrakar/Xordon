<?php
/**
 * Check and fix tickets table schema
 */

require_once __DIR__ . '/backend/src/Config.php';
require_once __DIR__ . '/backend/src/Database.php';

try {
    $db = Database::conn();
    echo "Checking tickets table schema...\n\n";

    // Get current columns
    $stmt = $db->query("SHOW COLUMNS FROM tickets");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Current columns: " . implode(', ', $columns) . "\n\n";

    // Required columns for the TicketsController
    $required = [
        'workspace_id' => 'INT NOT NULL',
        'ticket_number' => 'VARCHAR(50)',
        'subject' => 'VARCHAR(500)',
        'description' => 'TEXT',
        'status' => "ENUM('new', 'open', 'pending', 'on_hold', 'resolved', 'closed') DEFAULT 'new'",
        'priority' => "ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium'",
        'stage_id' => 'INT NULL',
        'team_id' => 'INT NULL',
        'ticket_type_id' => 'INT NULL',
        'assigned_user_id' => 'INT NULL',
        'requester_name' => 'VARCHAR(255)',
        'requester_email' => 'VARCHAR(255)',
        'requester_phone' => 'VARCHAR(50)',
        'contact_id' => 'INT NULL',
        'source_channel' => "VARCHAR(50) DEFAULT 'manual'",
        'source_id' => 'VARCHAR(255)',
        'sla_policy_id' => 'INT NULL',
        'first_response_due_at' => 'TIMESTAMP NULL',
        'resolution_due_at' => 'TIMESTAMP NULL',
        'first_response_at' => 'TIMESTAMP NULL',
        'resolved_at' => 'TIMESTAMP NULL',
        'closed_at' => 'TIMESTAMP NULL',
        'sla_response_breached' => 'BOOLEAN DEFAULT FALSE',
        'sla_resolution_breached' => 'BOOLEAN DEFAULT FALSE',
        'csat_score' => 'INT NULL',
        'csat_comment' => 'TEXT',
        'tags' => 'JSON',
        'custom_fields' => 'JSON',
        'created_by' => 'INT NULL',
        'created_at' => 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'updated_at' => 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
    ];

    $missing = [];
    foreach ($required as $col => $def) {
        if (!in_array($col, $columns)) {
            $missing[$col] = $def;
        }
    }

    if (empty($missing)) {
        echo "✓ All required columns exist!\n";
    } else {
        echo "Missing columns:\n";
        foreach ($missing as $col => $def) {
            echo "  - $col\n";
            try {
                $db->exec("ALTER TABLE tickets ADD COLUMN $col $def");
                echo "    ✓ Added $col\n";
            } catch (Exception $e) {
                echo "    ✗ Error: " . $e->getMessage() . "\n";
            }
        }
    }

    // Also check for ticket_types table
    echo "\nChecking ticket_types table...\n";
    $stmt = $db->query("SHOW COLUMNS FROM ticket_types");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (!in_array('icon', $columns)) {
        echo "Adding icon column to ticket_types...\n";
        $db->exec("ALTER TABLE ticket_types ADD COLUMN icon VARCHAR(50) NULL");
        echo "✓ Added icon\n";
    }

    echo "\n✅ Schema check complete!\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
