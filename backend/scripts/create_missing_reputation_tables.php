<?php
require_once __DIR__ . '/../src/Database.php';
use Xordon\Database;

try {
    $db = Database::conn();
    
    // Create review_widgets table
    $db->exec("CREATE TABLE IF NOT EXISTS review_widgets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) DEFAULT 'carousel',
        platforms JSON,
        min_rating DECIMAL(2,1) DEFAULT 4.0,
        max_reviews INT DEFAULT 10,
        show_ai_summary BOOLEAN DEFAULT FALSE,
        design_settings JSON,
        embed_code TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_workspace (workspace_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    echo "✓ Created review_widgets\n";
    
    // Create reputation_ai_agents table
    $db->exec("CREATE TABLE IF NOT EXISTS reputation_ai_agents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        instructions TEXT,
        tone JSON,
        language VARCHAR(10) DEFAULT 'en',
        review_sources JSON,
        review_types JSON,
        footer TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        response_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_workspace (workspace_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    echo "✓ Created reputation_ai_agents\n";
    
    // Create review_request_templates table
    $db->exec("CREATE TABLE IF NOT EXISTS review_request_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(20) NOT NULL,
        channel VARCHAR(20) NOT NULL,
        subject VARCHAR(255),
        message TEXT NOT NULL,
        variables JSON,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_workspace (workspace_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    echo "✓ Created review_request_templates\n";
    
    // Create reputation_settings table
    $db->exec("CREATE TABLE IF NOT EXISTS reputation_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL UNIQUE,
        ai_mode VARCHAR(20) DEFAULT 'off',
        drip_mode_enabled BOOLEAN DEFAULT FALSE,
        review_link VARCHAR(500),
        review_balancing_enabled BOOLEAN DEFAULT FALSE,
        review_platforms JSON,
        sms_enabled BOOLEAN DEFAULT TRUE,
        sms_timing VARCHAR(20) DEFAULT 'immediately',
        sms_repeat VARCHAR(20) DEFAULT 'dont-repeat',
        sms_max_retries INT DEFAULT 3,
        email_enabled BOOLEAN DEFAULT TRUE,
        email_timing VARCHAR(20) DEFAULT 'immediately',
        email_repeat VARCHAR(20) DEFAULT 'dont-repeat',
        email_max_retries INT DEFAULT 1,
        whatsapp_enabled BOOLEAN DEFAULT FALSE,
        spam_detection_enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_workspace (workspace_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    echo "✓ Created reputation_settings\n";
    
    // Create reputation_integrations table
    $db->exec("CREATE TABLE IF NOT EXISTS reputation_integrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        platform VARCHAR(50) NOT NULL,
        is_connected BOOLEAN DEFAULT FALSE,
        credentials JSON,
        settings JSON,
        last_sync_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_workspace_platform (workspace_id, platform),
        INDEX idx_workspace (workspace_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    echo "✓ Created reputation_integrations\n";
    
    // Insert default settings
    $db->exec("INSERT IGNORE INTO reputation_settings (workspace_id) VALUES (1)");
    echo "✓ Created default settings\n";
    
    echo "\n✅ All missing tables created successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
