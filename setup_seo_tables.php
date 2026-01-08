<?php
require_once __DIR__ . '/backend/src/Database.php';

$db = Database::conn();

$queries = [
    "CREATE TABLE IF NOT EXISTS seo_audits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        company_id INT NOT NULL,
        url VARCHAR(255) NOT NULL,
        audit_type VARCHAR(50) DEFAULT 'full',
        status VARCHAR(50) DEFAULT 'pending',
        seo_score INT DEFAULT 0,
        technical_score INT DEFAULT 0,
        content_score INT DEFAULT 0,
        performance_score INT DEFAULT 0,
        accessibility_score INT DEFAULT 0,
        issues_count INT DEFAULT 0,
        warnings_count INT DEFAULT 0,
        report_data JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        started_at DATETIME,
        finished_at DATETIME,
        INDEX (workspace_id, company_id)
    )",
    "CREATE TABLE IF NOT EXISTS seo_backlinks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        company_id INT NOT NULL,
        source_url VARCHAR(500) NOT NULL,
        source_domain VARCHAR(255) NOT NULL,
        target_url VARCHAR(500) NOT NULL,
        anchor_text VARCHAR(255),
        link_type VARCHAR(50) DEFAULT 'dofollow',
        domain_authority INT DEFAULT 0,
        page_authority INT DEFAULT 0,
        toxicity_score INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        first_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_check_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX (workspace_id, company_id),
        INDEX (source_domain)
    )",
    "CREATE TABLE IF NOT EXISTS seo_keywords (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        company_id INT NOT NULL,
        keyword VARCHAR(255) NOT NULL,
        search_volume INT DEFAULT 0,
        difficulty INT DEFAULT 0,
        current_rank INT,
        previous_rank INT,
        url VARCHAR(500),
        tags JSON,
        location VARCHAR(100) DEFAULT 'us',
        device VARCHAR(20) DEFAULT 'desktop',
        last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX (workspace_id, company_id)
    )",
    "CREATE TABLE IF NOT EXISTS seo_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        company_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        report_type VARCHAR(50) DEFAULT 'one-time',
        frequency VARCHAR(50),
        email_recipients JSON,
        modules JSON,
        status VARCHAR(50) DEFAULT 'draft',
        last_generated_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX (workspace_id, company_id)
    )",
    "CREATE TABLE IF NOT EXISTS seo_competitors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        company_id INT NOT NULL,
        domain VARCHAR(255) NOT NULL,
        type VARCHAR(50) DEFAULT 'direct',
        tracked_since DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX (workspace_id, company_id)
    )",
    "CREATE TABLE IF NOT EXISTS seo_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        company_id INT NOT NULL,
        setting_key VARCHAR(100) NOT NULL,
        setting_value JSON,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY (workspace_id, company_id, setting_key)
    )"
];

foreach ($queries as $sql) {
    try {
        $db->exec($sql);
        echo "Executed table creation successfully.\n";
    } catch (PDOException $e) {
        echo "Error creating table: " . $e->getMessage() . "\n";
    }
}

// Add columns if they don't exist (migrations)
try {
    // seo_audits: ensure technical_score and content_score exist
    $cols = $db->query("SHOW COLUMNS FROM seo_audits")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('technical_score', $cols)) {
        $db->exec("ALTER TABLE seo_audits ADD COLUMN technical_score INT DEFAULT 0 AFTER seo_score");
        echo "Added technical_score to seo_audits\n";
    }
    if (!in_array('content_score', $cols)) {
        $db->exec("ALTER TABLE seo_audits ADD COLUMN content_score INT DEFAULT 0 AFTER technical_score");
        echo "Added content_score to seo_audits\n";
    }
} catch (Exception $e) {
    echo "Migration error: " . $e->getMessage() . "\n";
}

echo "Done.\n";
