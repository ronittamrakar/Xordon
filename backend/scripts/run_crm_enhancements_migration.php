<?php
/**
 * CRM Enhancements Migration Runner
 */

require_once __DIR__ . '/src/Database.php';

echo "Starting CRM Enhancements Migration...\n";
echo "=====================================\n\n";

try {
    $pdo = Database::conn();
    echo "✓ Database connection established\n\n";
    
    // Read the migration SQL file
    $sqlFile = __DIR__ . '/migrations/create_crm_enhancements_tables.sql';
    
    if (!file_exists($sqlFile)) {
        throw new Exception("Migration file not found: $sqlFile");
    }
    
    $sql = file_get_contents($sqlFile);
    
    // Remove SQL comments
    $sql = preg_replace('/--.*$/m', '', $sql);
    
    // Split by semicolon and filter empty statements
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        fn($s) => !empty($s) && strlen($s) > 5
    );
    
    $successCount = 0;
    $skipCount = 0;
    $errorCount = 0;
    
    foreach ($statements as $statement) {
        $statement = trim($statement);
        if (empty($statement)) continue;
        
        try {
            $pdo->exec($statement);
            
            // Extract table name for logging
            if (preg_match('/CREATE TABLE IF NOT EXISTS\s+`?(\w+)`?/i', $statement, $matches)) {
                echo "✓ Created table: {$matches[1]}\n";
            } elseif (preg_match('/ALTER TABLE\s+`?(\w+)`?/i', $statement, $matches)) {
                echo "✓ Altered table: {$matches[1]}\n";
            }
            
            $successCount++;
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'already exists') !== false ||
                strpos($e->getMessage(), 'Duplicate') !== false) {
                if (preg_match('/CREATE TABLE.*?`?(\w+)`?/i', $statement, $matches)) {
                    echo "○ Table already exists: {$matches[1]}\n";
                }
                $skipCount++;
            } else {
                echo "✗ Error: " . $e->getMessage() . "\n";
                $errorCount++;
            }
        }
    }

    
    echo "\n=====================================\n";
    echo "Migration Summary:\n";
    echo "  Created: $successCount\n";
    echo "  Skipped: $skipCount\n";
    echo "  Errors: $errorCount\n";
    echo "=====================================\n";
    
    // Seed default modules
    echo "\nSeeding default modules...\n";
    
    $defaultModules = [
        ['id' => 'lead_scoring', 'name' => 'Lead Scoring Engine', 'description' => 'AI-powered lead scoring based on behavioral signals'],
        ['id' => 'social_outreach', 'name' => 'Social Outreach', 'description' => 'Multi-channel sequences including LinkedIn integration'],
        ['id' => 'meeting_scheduler', 'name' => 'Meeting Scheduler', 'description' => 'Calendar integration and meeting management'],
        ['id' => 'conversation_intelligence', 'name' => 'Conversation Intelligence', 'description' => 'Call transcription and analysis'],
        ['id' => 'intent_data', 'name' => 'Intent Data', 'description' => 'Intent signal tracking and automation triggers'],
        ['id' => 'pipeline_forecasting', 'name' => 'Pipeline Forecasting', 'description' => 'Deal pipeline and revenue forecasting'],
        ['id' => 'playbooks', 'name' => 'Outreach Playbooks', 'description' => 'Customizable persona-based templates'],
        ['id' => 'notifications', 'name' => 'Slack/Teams Notifications', 'description' => 'Real-time alerts and interactive notifications'],
        ['id' => 'attribution', 'name' => 'Lead Attribution', 'description' => 'Lead source tracking and attribution modeling'],
        ['id' => 'automation_engine', 'name' => 'Automation Engine', 'description' => 'Conditional and stackable automations']
    ];
    
    $insertModule = $pdo->prepare("
        INSERT INTO modules (id, name, description, permissions, default_roles, status)
        VALUES (:id, :name, :description, '[]', '{}', 'active')
        ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)
    ");
    
    foreach ($defaultModules as $module) {
        try {
            $insertModule->execute($module);
            echo "✓ Registered module: {$module['name']}\n";
        } catch (PDOException $e) {
            echo "✗ Error: " . $e->getMessage() . "\n";
        }
    }
    
    // Check if pipeline_stages already has data
    echo "\nChecking pipeline stages...\n";
    $stageCount = $pdo->query("SELECT COUNT(*) FROM pipeline_stages")->fetchColumn();
    if ($stageCount > 0) {
        echo "✓ Pipeline stages already seeded ($stageCount stages)\n";
    } else {
        echo "○ No pipeline stages found - you may want to seed them manually\n";
    }
    
    // Verify tables
    echo "\n=== Verifying Tables ===\n";
    $tables = ['lead_scores', 'sequences', 'meetings', 'call_transcriptions', 'intent_signals', 
               'deals', 'playbooks', 'notification_configs', 'lead_sources', 'crm_automations', 'modules'];
    
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->fetch()) {
            echo "✓ $table exists\n";
        } else {
            echo "✗ $table NOT FOUND\n";
        }
    }
    
    echo "\n=====================================\n";
    echo "CRM Enhancements Migration Complete!\n";
    echo "=====================================\n";
    
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
