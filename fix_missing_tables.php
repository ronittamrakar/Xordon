<?php
/**
 * Create Missing Tables Migration
 * Run this to fix all missing database tables
 */

require_once __DIR__ . '/backend/src/Config.php';
require_once __DIR__ . '/backend/src/Database.php';

try {
    $db = Database::conn();
    echo "Connected to database successfully.\n\n";

    // Track created tables
    $created = [];
    $errors = [];

    // 1. webforms table
    $sql = "CREATE TABLE IF NOT EXISTS webforms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        fields JSON,
        settings JSON,
        style JSON,
        status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
        folder_id INT NULL,
        is_template BOOLEAN DEFAULT FALSE,
        views INT DEFAULT 0,
        submissions_count INT DEFAULT 0,
        conversion_rate DECIMAL(5,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_webforms_workspace (workspace_id),
        INDEX idx_webforms_user (user_id),
        INDEX idx_webforms_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    try {
        $db->exec($sql);
        $created[] = 'webforms';
        echo "✓ Created webforms table\n";
    } catch (Exception $e) {
        $errors[] = "webforms: " . $e->getMessage();
        echo "✗ webforms: " . $e->getMessage() . "\n";
    }

    // 2. form_submissions table
    $sql = "CREATE TABLE IF NOT EXISTS form_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        form_id INT NOT NULL,
        contact_id INT NULL,
        data JSON NOT NULL,
        metadata JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        referrer TEXT,
        utm_source VARCHAR(255),
        utm_medium VARCHAR(255),
        utm_campaign VARCHAR(255),
        status ENUM('new', 'read', 'replied', 'archived', 'spam') DEFAULT 'new',
        is_spam BOOLEAN DEFAULT FALSE,
        spam_score DECIMAL(5,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_form_submissions_workspace (workspace_id),
        INDEX idx_form_submissions_form (form_id),
        INDEX idx_form_submissions_contact (contact_id),
        INDEX idx_form_submissions_status (status),
        INDEX idx_form_submissions_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    try {
        $db->exec($sql);
        $created[] = 'form_submissions';
        echo "✓ Created form_submissions table\n";
    } catch (Exception $e) {
        $errors[] = "form_submissions: " . $e->getMessage();
        echo "✗ form_submissions: " . $e->getMessage() . "\n";
    }

    // 3. tasks table
    $sql = "CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        project_id INT NULL,
        assigned_to INT NULL,
        created_by INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('todo', 'in_progress', 'review', 'done', 'cancelled') DEFAULT 'todo',
        priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
        due_date DATE NULL,
        due_time TIME NULL,
        start_date DATE NULL,
        estimated_hours DECIMAL(10,2) NULL,
        actual_hours DECIMAL(10,2) NULL,
        tags JSON,
        attachments JSON,
        parent_task_id INT NULL,
        position INT DEFAULT 0,
        completed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tasks_workspace (workspace_id),
        INDEX idx_tasks_project (project_id),
        INDEX idx_tasks_assigned (assigned_to),
        INDEX idx_tasks_status (status),
        INDEX idx_tasks_due_date (due_date),
        INDEX idx_tasks_parent (parent_task_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    try {
        $db->exec($sql);
        $created[] = 'tasks';
        echo "✓ Created tasks table\n";
    } catch (Exception $e) {
        $errors[] = "tasks: " . $e->getMessage();
        echo "✗ tasks: " . $e->getMessage() . "\n";
    }

    // 4. project_tasks table (junction table linking projects and tasks)
    $sql = "CREATE TABLE IF NOT EXISTS project_tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        task_id INT NOT NULL,
        position INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_project_task (project_id, task_id),
        INDEX idx_project_tasks_project (project_id),
        INDEX idx_project_tasks_task (task_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    try {
        $db->exec($sql);
        $created[] = 'project_tasks';
        echo "✓ Created project_tasks table\n";
    } catch (Exception $e) {
        $errors[] = "project_tasks: " . $e->getMessage();
        echo "✗ project_tasks: " . $e->getMessage() . "\n";
    }

    // 5. email_campaigns table
    $sql = "CREATE TABLE IF NOT EXISTS email_campaigns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(500),
        from_name VARCHAR(255),
        from_email VARCHAR(255),
        reply_to VARCHAR(255),
        content TEXT,
        html_content LONGTEXT,
        template_id INT NULL,
        status ENUM('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled') DEFAULT 'draft',
        type ENUM('regular', 'automated', 'ab_test', 'rss') DEFAULT 'regular',
        scheduled_at TIMESTAMP NULL,
        sent_at TIMESTAMP NULL,
        total_recipients INT DEFAULT 0,
        sent_count INT DEFAULT 0,
        delivered_count INT DEFAULT 0,
        open_count INT DEFAULT 0,
        click_count INT DEFAULT 0,
        bounce_count INT DEFAULT 0,
        unsubscribe_count INT DEFAULT 0,
        complaint_count INT DEFAULT 0,
        settings JSON,
        tracking_settings JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email_campaigns_workspace (workspace_id),
        INDEX idx_email_campaigns_status (status),
        INDEX idx_email_campaigns_scheduled (scheduled_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    try {
        $db->exec($sql);
        $created[] = 'email_campaigns';
        echo "✓ Created email_campaigns table\n";
    } catch (Exception $e) {
        $errors[] = "email_campaigns: " . $e->getMessage();
        echo "✗ email_campaigns: " . $e->getMessage() . "\n";
    }

    // 6. sequences table
    $sql = "CREATE TABLE IF NOT EXISTS sequences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type ENUM('email', 'sms', 'mixed') DEFAULT 'email',
        status ENUM('draft', 'active', 'paused', 'archived') DEFAULT 'draft',
        trigger_type VARCHAR(100),
        trigger_conditions JSON,
        steps JSON,
        settings JSON,
        enrolled_count INT DEFAULT 0,
        completed_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sequences_workspace (workspace_id),
        INDEX idx_sequences_status (status),
        INDEX idx_sequences_type (type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    try {
        $db->exec($sql);
        $created[] = 'sequences';
        echo "✓ Created sequences table\n";
    } catch (Exception $e) {
        $errors[] = "sequences: " . $e->getMessage();
        echo "✗ sequences: " . $e->getMessage() . "\n";
    }

    // 7. webhooks table
    $sql = "CREATE TABLE IF NOT EXISTS webhooks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        url VARCHAR(2048) NOT NULL,
        secret VARCHAR(255),
        events JSON,
        headers JSON,
        is_active BOOLEAN DEFAULT TRUE,
        retry_count INT DEFAULT 3,
        timeout INT DEFAULT 30,
        last_triggered_at TIMESTAMP NULL,
        last_status_code INT NULL,
        last_response TEXT,
        failure_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_webhooks_workspace (workspace_id),
        INDEX idx_webhooks_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    try {
        $db->exec($sql);
        $created[] = 'webhooks';
        echo "✓ Created webhooks table\n";
    } catch (Exception $e) {
        $errors[] = "webhooks: " . $e->getMessage();
        echo "✗ webhooks: " . $e->getMessage() . "\n";
    }

    // 8. api_keys table
    $sql = "CREATE TABLE IF NOT EXISTS api_keys (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        key_hash VARCHAR(255) NOT NULL,
        key_prefix VARCHAR(10) NOT NULL,
        permissions JSON,
        scopes JSON,
        rate_limit INT DEFAULT 1000,
        is_active BOOLEAN DEFAULT TRUE,
        last_used_at TIMESTAMP NULL,
        expires_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_key_hash (key_hash),
        INDEX idx_api_keys_workspace (workspace_id),
        INDEX idx_api_keys_prefix (key_prefix),
        INDEX idx_api_keys_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    try {
        $db->exec($sql);
        $created[] = 'api_keys';
        echo "✓ Created api_keys table\n";
    } catch (Exception $e) {
        $errors[] = "api_keys: " . $e->getMessage();
        echo "✗ api_keys: " . $e->getMessage() . "\n";
    }

    // 9. sub_accounts table
    $sql = "CREATE TABLE IF NOT EXISTS sub_accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        agency_id INT NOT NULL,
        workspace_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        subdomain VARCHAR(100),
        custom_domain VARCHAR(255),
        owner_user_id INT NULL,
        status ENUM('active', 'suspended', 'cancelled', 'trial') DEFAULT 'active',
        plan VARCHAR(100),
        billing_email VARCHAR(255),
        settings JSON,
        branding JSON,
        limits JSON,
        trial_ends_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sub_accounts_agency (agency_id),
        INDEX idx_sub_accounts_workspace (workspace_id),
        INDEX idx_sub_accounts_status (status),
        UNIQUE KEY unique_subdomain (subdomain)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    try {
        $db->exec($sql);
        $created[] = 'sub_accounts';
        echo "✓ Created sub_accounts table\n";
    } catch (Exception $e) {
        $errors[] = "sub_accounts: " . $e->getMessage();
        echo "✗ sub_accounts: " . $e->getMessage() . "\n";
    }

    // 10. saved_filters table
    $sql = "CREATE TABLE IF NOT EXISTS saved_filters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        module VARCHAR(100) NOT NULL,
        filters JSON NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        is_shared BOOLEAN DEFAULT FALSE,
        color VARCHAR(7),
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_saved_filters_workspace (workspace_id),
        INDEX idx_saved_filters_user (user_id),
        INDEX idx_saved_filters_module (module)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    try {
        $db->exec($sql);
        $created[] = 'saved_filters';
        echo "✓ Created saved_filters table\n";
    } catch (Exception $e) {
        $errors[] = "saved_filters: " . $e->getMessage();
        echo "✗ saved_filters: " . $e->getMessage() . "\n";
    }

    // 11. listings table
    $sql = "CREATE TABLE IF NOT EXISTS listings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        user_id INT NOT NULL,
        platform VARCHAR(100) NOT NULL,
        external_id VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        address TEXT,
        phone VARCHAR(50),
        website VARCHAR(500),
        category VARCHAR(255),
        description TEXT,
        hours JSON,
        photos JSON,
        attributes JSON,
        status ENUM('active', 'pending', 'suspended', 'deleted') DEFAULT 'pending',
        sync_status ENUM('synced', 'pending', 'error') DEFAULT 'pending',
        last_synced_at TIMESTAMP NULL,
        rating DECIMAL(3,2),
        review_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_listings_workspace (workspace_id),
        INDEX idx_listings_platform (platform),
        INDEX idx_listings_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    try {
        $db->exec($sql);
        $created[] = 'listings';
        echo "✓ Created listings table\n";
    } catch (Exception $e) {
        $errors[] = "listings: " . $e->getMessage();
        echo "✗ listings: " . $e->getMessage() . "\n";
    }

    // Now fix missing columns in existing tables
    echo "\n=== FIXING MISSING COLUMNS ===\n";

    // Add owner_id to workspaces if missing
    try {
        $stmt = $db->query("SHOW COLUMNS FROM workspaces LIKE 'owner_id'");
        if ($stmt->rowCount() == 0) {
            $db->exec("ALTER TABLE workspaces ADD COLUMN owner_id INT NULL AFTER name");
            echo "✓ Added owner_id to workspaces\n";
        } else {
            echo "○ owner_id already exists in workspaces\n";
        }
    } catch (Exception $e) {
        echo "✗ workspaces.owner_id: " . $e->getMessage() . "\n";
    }

    // Add type to campaigns if missing
    try {
        $stmt = $db->query("SHOW COLUMNS FROM campaigns LIKE 'type'");
        if ($stmt->rowCount() == 0) {
            $db->exec("ALTER TABLE campaigns ADD COLUMN type VARCHAR(50) DEFAULT 'email' AFTER name");
            echo "✓ Added type to campaigns\n";
        } else {
            echo "○ type already exists in campaigns\n";
        }
    } catch (Exception $e) {
        echo "✗ campaigns.type: " . $e->getMessage() . "\n";
    }

    // Add sections to websites if missing
    try {
        $stmt = $db->query("SHOW COLUMNS FROM websites LIKE 'sections'");
        if ($stmt->rowCount() == 0) {
            $db->exec("ALTER TABLE websites ADD COLUMN sections JSON NULL");
            echo "✓ Added sections to websites\n";
        } else {
            echo "○ sections already exists in websites\n";
        }
    } catch (Exception $e) {
        echo "✗ websites.sections: " . $e->getMessage() . "\n";
    }

    // Add filepath to files if missing
    try {
        $stmt = $db->query("SHOW COLUMNS FROM files LIKE 'filepath'");
        if ($stmt->rowCount() == 0) {
            $db->exec("ALTER TABLE files ADD COLUMN filepath VARCHAR(1000) NULL AFTER filename");
            echo "✓ Added filepath to files\n";
        } else {
            echo "○ filepath already exists in files\n";
        }
    } catch (Exception $e) {
        echo "✗ files.filepath: " . $e->getMessage() . "\n";
    }

    // Summary
    echo "\n========================================\n";
    echo "           MIGRATION SUMMARY\n";
    echo "========================================\n\n";
    echo "Tables created: " . count($created) . "\n";
    if (!empty($created)) {
        foreach ($created as $t) {
            echo "  ✓ $t\n";
        }
    }
    echo "\n";

    if (!empty($errors)) {
        echo "Errors encountered: " . count($errors) . "\n";
        foreach ($errors as $e) {
            echo "  ✗ $e\n";
        }
    } else {
        echo "No errors!\n";
    }

    echo "\n✅ Migration completed successfully!\n";

} catch (Exception $e) {
    echo "❌ Fatal error: " . $e->getMessage() . "\n";
    exit(1);
}
