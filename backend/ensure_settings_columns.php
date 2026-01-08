<?php
require_once __DIR__ . '/src/Database.php';
$db = \Xordon\Database::conn();

echo "Checking database schema for Public Assets & Branding...\n";

// 1. Ensure 'agency_branding' table has new columns
$table = 'agency_branding';
$columns = [
    'font_family' => "VARCHAR(100) DEFAULT 'Inter'",
    'custom_css' => "TEXT DEFAULT NULL",
    'login_page_description' => "TEXT DEFAULT NULL",
    'login_background_url' => "VARCHAR(255) DEFAULT NULL",
    'email_footer_text' => "TEXT DEFAULT NULL",
    'email_from_name' => "VARCHAR(255) DEFAULT NULL",
    'email_from_address' => "VARCHAR(255) DEFAULT NULL",
];

foreach ($columns as $col => $def) {
    try {
        $db->exec("ALTER TABLE $table ADD COLUMN $col $def");
        echo "  Added $col to $table.\n";
    } catch (PDOException $e) {
        // Ignroe "Duplicate column" errors
        if ($e->getCode() == '42S21' || strpos($e->getMessage(), 'Duplicate column') !== false) {
             echo "  $col already exists in $table.\n";
        } else {
             echo "  Error adding $col to $table: " . $e->getMessage() . "\n";
        }
    }
}

// 2. Create 'public_asset_settings' table
try {
    $db->exec("CREATE TABLE IF NOT EXISTS public_asset_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        
        -- SEO
        seo_title_template VARCHAR(255) DEFAULT '{{page_title}} | {{agency_name}}',
        seo_description_default TEXT,
        og_image_url VARCHAR(255),
        favicon_url VARCHAR(255),
        
        -- Tracking
        gtm_id VARCHAR(50),
        meta_pixel_id VARCHAR(50),
        google_analytics_id VARCHAR(50),
        
        -- Scripts
        header_scripts TEXT,
        footer_scripts TEXT,
        
        -- Cookie Consent
        cookie_consent_enabled BOOLEAN DEFAULT 0,
        cookie_consent_message TEXT,
        cookie_policy_url VARCHAR(255),
        primary_color VARCHAR(20) DEFAULT '#3B82F6',
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        UNIQUE KEY unique_workspace (workspace_id)
    )");
    echo "  Table 'public_asset_settings' checked/created.\n";
} catch (PDOException $e) {
    echo "  Error creating 'public_asset_settings' table: " . $e->getMessage() . "\n";
}

echo "Schema update complete.\n";
