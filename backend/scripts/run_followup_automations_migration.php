<?php
/**
 * Run Follow-up Automations Migration
 * Creates tables for outcome-based follow-up automations
 */

// Disable HTML error output for CLI
ini_set('display_errors', '0');
error_reporting(E_ALL);

require_once __DIR__ . '/src/Database.php';

echo "Running Follow-up Automations Migration...\n";
echo "==========================================\n\n";

try {
    $pdo = Database::conn();
    
    // Create followup_automations table
    echo "Creating followup_automations table...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS followup_automations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            channel VARCHAR(50) NOT NULL,
            trigger_type VARCHAR(100) NOT NULL,
            trigger_conditions JSON,
            action_type VARCHAR(100) NOT NULL,
            action_config JSON NOT NULL,
            delay_amount INT DEFAULT 0,
            delay_unit VARCHAR(20) DEFAULT 'minutes',
            is_active BOOLEAN DEFAULT TRUE,
            priority INT DEFAULT 0,
            campaign_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_followup_automations_user (user_id),
            INDEX idx_followup_automations_channel (channel),
            INDEX idx_followup_automations_trigger (trigger_type),
            INDEX idx_followup_automations_active (is_active)
        )
    ");
    echo "✓ Created followup_automations table\n";
    
    // Create automation_executions table
    echo "Creating automation_executions table...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS automation_executions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            automation_id INT NOT NULL,
            contact_id INT NOT NULL,
            trigger_event VARCHAR(100) NOT NULL,
            trigger_data JSON,
            action_result JSON,
            status VARCHAR(50) DEFAULT 'pending',
            scheduled_at DATETIME,
            executed_at DATETIME,
            error_message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_automation_executions_automation (automation_id),
            INDEX idx_automation_executions_contact (contact_id),
            INDEX idx_automation_executions_status (status),
            INDEX idx_automation_executions_scheduled (scheduled_at)
        )
    ");
    echo "✓ Created automation_executions table\n";
    
    // Create contact_outcomes table
    echo "Creating contact_outcomes table...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS contact_outcomes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            contact_id INT NOT NULL,
            user_id INT NOT NULL,
            channel VARCHAR(50) NOT NULL,
            campaign_id INT,
            outcome_type VARCHAR(100) NOT NULL,
            outcome_data JSON,
            sentiment VARCHAR(50),
            notes TEXT,
            recorded_by VARCHAR(50) DEFAULT 'system',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_contact_outcomes_contact (contact_id),
            INDEX idx_contact_outcomes_user (user_id),
            INDEX idx_contact_outcomes_channel (channel),
            INDEX idx_contact_outcomes_type (outcome_type)
        )
    ");
    echo "✓ Created contact_outcomes table\n";
    
    // Create call_dispositions_types table
    echo "Creating call_dispositions_types table...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS call_dispositions_types (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            category VARCHAR(50),
            color VARCHAR(20) DEFAULT '#6B7280',
            icon VARCHAR(50),
            is_default BOOLEAN DEFAULT FALSE,
            requires_callback BOOLEAN DEFAULT FALSE,
            requires_notes BOOLEAN DEFAULT FALSE,
            sort_order INT DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_call_dispositions_user (user_id)
        )
    ");
    echo "✓ Created call_dispositions_types table\n";
    
    echo "\n==========================================\n";
    echo "Migration completed successfully!\n\n";
    
    // Verify tables were created
    echo "Verifying tables:\n";
    $tables = ['followup_automations', 'automation_executions', 'contact_outcomes', 'call_dispositions_types'];
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->fetch()) {
            echo "✓ Table '$table' exists\n";
        } else {
            echo "✗ Table '$table' NOT found\n";
        }
    }
    
    // Insert default dispositions if table is empty
    $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM call_dispositions_types WHERE user_id = 0");
    $count = $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];
    
    if ($count == 0) {
        echo "\nInserting default call dispositions...\n";
        $defaults = [
            ['Interested', 'Prospect showed interest', 'positive', '#10B981', 'thumbs-up', 0, 0, 1],
            ['Not Interested', 'Prospect not interested', 'negative', '#EF4444', 'thumbs-down', 0, 0, 2],
            ['Callback Requested', 'Prospect requested callback', 'callback', '#F59E0B', 'phone-callback', 1, 1, 3],
            ['Left Voicemail', 'Left voicemail message', 'neutral', '#6B7280', 'voicemail', 0, 0, 4],
            ['No Answer', 'No answer, no voicemail', 'neutral', '#9CA3AF', 'phone-missed', 0, 0, 5],
            ['Busy', 'Line was busy', 'neutral', '#F97316', 'phone-off', 0, 0, 6],
            ['Wrong Number', 'Wrong number or disconnected', 'negative', '#DC2626', 'x-circle', 0, 0, 7],
            ['Do Not Call', 'Requested to not be called', 'negative', '#7C3AED', 'ban', 0, 1, 8],
            ['Appointment Set', 'Meeting/appointment scheduled', 'positive', '#059669', 'calendar-check', 0, 1, 9],
            ['Sale Made', 'Closed deal/sale', 'positive', '#047857', 'check-circle', 0, 1, 10],
        ];
        
        $stmt = $pdo->prepare('INSERT INTO call_dispositions_types (user_id, name, description, category, color, icon, is_default, requires_callback, requires_notes, sort_order) VALUES (0, ?, ?, ?, ?, ?, 1, ?, ?, ?)');
        foreach ($defaults as $d) {
            $stmt->execute($d);
            echo "  ✓ Added: {$d[0]}\n";
        }
    } else {
        echo "\nDefault dispositions already exist ($count found)\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
