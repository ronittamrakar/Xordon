<?php
require_once __DIR__ . '/src/Database.php';
$db = \Xordon\Database::conn();

function ensureColumn($db, $table, $column, $definition) {
    try {
        $db->exec("ALTER TABLE $table ADD COLUMN $column $definition");
        echo "  Added $column to $table.\n";
    } catch (PDOException $e) {
        if ($e->getCode() == '42S21' || strpos($e->getMessage(), 'Duplicate column') !== false) {
             echo "  $column already exists in $table.\n";
        } else {
             echo "  Error adding $column to $table: " . $e->getMessage() . "\n";
        }
    }
}

echo "Ensuring columns exist...\n";

// business_listings
ensureColumn($db, 'business_listings', 'company_id', 'INT NOT NULL DEFAULT 0');
ensureColumn($db, 'business_listings', 'accuracy_score', 'INT NULL DEFAULT 0');
ensureColumn($db, 'business_listings', 'claim_status', "ENUM('unclaimed', 'claimed', 'verified') DEFAULT 'unclaimed'");
ensureColumn($db, 'business_listings', 'status', "ENUM('not_listed', 'pending', 'claimed', 'verified', 'needs_update', 'error') DEFAULT 'not_listed'");

// seo_keywords
ensureColumn($db, 'seo_keywords', 'company_id', 'INT NOT NULL DEFAULT 0');
ensureColumn($db, 'seo_keywords', 'current_position', 'INT NULL');
ensureColumn($db, 'seo_keywords', 'previous_position', 'INT NULL');

// seo_pages
ensureColumn($db, 'seo_pages', 'company_id', 'INT NOT NULL DEFAULT 0');
ensureColumn($db, 'seo_pages', 'seo_score', 'INT NULL');

// seo_competitors
ensureColumn($db, 'seo_competitors', 'company_id', 'INT NOT NULL DEFAULT 0');

// listing_reviews
ensureColumn($db, 'listing_reviews', 'company_id', 'INT NOT NULL DEFAULT 0');
ensureColumn($db, 'listing_reviews', 'review_date', 'DATE DEFAULT NULL');

// listing_audits
ensureColumn($db, 'listing_audits', 'company_id', 'INT NOT NULL DEFAULT 0');
ensureColumn($db, 'listing_audits', 'report_data', 'JSON NULL');

// listing_duplicates
ensureColumn($db, 'listing_duplicates', 'company_id', 'INT NOT NULL DEFAULT 0');
ensureColumn($db, 'listing_duplicates', 'suppression_log', 'JSON NULL');

// leads
ensureColumn($db, 'leads', 'workspace_id', 'INT NULL');
ensureColumn($db, 'leads', 'company_id', 'INT NULL');
ensureColumn($db, 'leads', 'campaign_id', 'INT NULL');
ensureColumn($db, 'leads', 'lead_value', 'DECIMAL(10,2) NULL');
ensureColumn($db, 'leads', 'lead_score', 'INT DEFAULT 0');
ensureColumn($db, 'leads', 'lead_stage', "VARCHAR(50) DEFAULT 'new'");

// lists
// lists (legacy/placeholder)
try {
    $db->exec("CREATE TABLE IF NOT EXISTS lists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        workspace_id INT,
        company_id INT,
        campaign_type VARCHAR(50) DEFAULT 'email',
        parent_id INT DEFAULT NULL,
        is_folder BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");
     echo "  Table 'lists' checked/created.\n";
} catch (PDOException $e) {
     echo "  Error creating 'lists' table: " . $e->getMessage() . "\n";
}

// contact_lists (actual table used by ListsController)
try {
    $db->exec("CREATE TABLE IF NOT EXISTS contact_lists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        workspace_id INT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(20) DEFAULT '#3b82f6',
        icon VARCHAR(50) DEFAULT 'users',
        is_default BOOLEAN DEFAULT 0,
        parent_id INT DEFAULT NULL,
        is_folder BOOLEAN DEFAULT 0,
        campaign_type VARCHAR(50) DEFAULT 'email',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");
    echo "  Table 'contact_lists' checked/created.\n";
} catch (PDOException $e) {
    echo "  Error creating 'contact_lists' table: " . $e->getMessage() . "\n";
}

ensureColumn($db, 'contact_lists', 'workspace_id', 'INT NULL');
ensureColumn($db, 'contact_lists', 'campaign_type', "VARCHAR(50) DEFAULT 'email'");
ensureColumn($db, 'contact_lists', 'parent_id', 'INT NULL');
ensureColumn($db, 'contact_lists', 'is_folder', 'BOOLEAN DEFAULT 0');

echo "Column check complete.\n";
