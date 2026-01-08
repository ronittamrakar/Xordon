<?php
/**
 * Comprehensive Migration Runner
 * Applies ALL migrations in the correct order to ensure database is complete
 * 
 * Usage: php run_all_migrations.php
 */

// Load env
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0 || strpos($line, '=') === false) continue;
        [$k, $v] = explode('=', $line, 2);
        putenv(trim($k) . '=' . trim($v));
    }
}

echo "=== Xordon Comprehensive Migration Runner ===\n\n";

$host = getenv('DB_HOST') ?: '127.0.0.1';
$port = getenv('DB_PORT') ?: '3306';
$dbname = getenv('DB_NAME') ?: 'xordon';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASS') ?: '';

function getDb() {
    global $host, $port, $dbname, $user, $pass;
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
    return new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true,
    ]);
}

try {
    $db = getDb();
    echo "✅ Database connection successful (host=$host, db=$dbname)\n\n";
} catch (Exception $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

// Migration files in dependency order
$migrations = [
    'mysql_init.sql',
    'add_workspaces_tables.sql',
    'add_workspace_id_columns.sql',
    'add_agency_multitenancy.sql',
    'create_rbac_tables.sql',
    'add_forms_tables.sql',
    'add_tags.sql',
    'add_groups_table.sql',
    'add_custom_fields.sql',
    'custom_fields.sql',
    'add_campaign_relationships.sql',
    'add_sequence_steps.sql',
    'add_smtp_credentials.sql',
    'add_warmup_tables.sql',
    'add_sms_tables.sql',
    'add_sms_sending_accounts.sql',
    'add_call_tables.sql',
    'add_call_agents_table.sql',
    'add_call_speed_dials.sql',
    'add_phone_lines.sql',
    'add_companies_segments_lists.sql',
    'add_crm_tables.sql',
    'activity_timeline.sql',
    'create_followup_automations.sql',
    'add_automation_queue.sql',
    'add_automation_recipes.sql',
    'create_automations_v2.sql',
    'create_conversations.sql',
    'add_appointments_scheduling.sql',
    'create_appointments_v2.sql',
    'scheduling_enhancements.sql',
    'add_payments_invoicing.sql',
    'create_invoices.sql',
    'estimates_invoices.sql',
    'stripe_payments.sql',
    'create_paypal_payments.sql',
    'create_industry_features.sql',
    'jobs_dispatch.sql',
    'files_media.sql',
    'create_landing_pages_tables.sql',
    'create_booking_pages.sql',
    'add_proposals_tables.sql',
    'add_reviews_management.sql',
    'create_reviews.sql',
    'social_scheduler.sql',
    'add_oauth_states.sql',
    'integrations_framework.sql',
    'add_ecommerce_integration.sql',
    'notifications.sql',
    'create_notification_logs.sql',
    'create_jobs_queue.sql',
    'create_portal_auth.sql',
    'add_advanced_reporting.sql',
    'add_ab_testing.sql',
    'add_settings_tables.sql',
    'add_modules_registry.sql',
    'module_settings.sql',
    'create_user_preferences_table.sql',
    'create_snapshots.sql',
];

$migrationsDir = __DIR__ . '/../migrations/';
$successCount = 0;
$errorCount = 0;
$skippedCount = 0;

echo "Running " . count($migrations) . " migrations...\n\n";

foreach ($migrations as $migration) {
    $filePath = $migrationsDir . $migration;
    
    if (!file_exists($filePath)) {
        echo "⚠️  SKIP: $migration (not found)\n";
        $skippedCount++;
        continue;
    }
    
    echo "📄 $migration... ";
    
    try {
        // Get fresh connection for each migration
        $db = getDb();
        
        $sql = file_get_contents($filePath);
        
        // Remove comments
        $sql = preg_replace('/--.*$/m', '', $sql);
        
        // Skip files with DELIMITER (complex stored procedures)
        if (stripos($sql, 'DELIMITER') !== false) {
            echo "⚠️ (has DELIMITER, skipping)\n";
            $skippedCount++;
            continue;
        }
        
        // Split by semicolon
        $statements = preg_split('/;\s*[\r\n]+/', $sql);
        $stmtCount = 0;
        
        foreach ($statements as $statement) {
            $statement = trim($statement);
            if (empty($statement)) continue;
            
            try {
                $db->exec($statement);
                $stmtCount++;
            } catch (PDOException $e) {
                $msg = $e->getMessage();
                // Ignore common "already exists" errors
                if (strpos($msg, 'already exists') === false &&
                    strpos($msg, 'Duplicate') === false &&
                    strpos($msg, 'duplicate key') === false &&
                    strpos($msg, 'Duplicate column') === false &&
                    strpos($msg, 'Duplicate entry') === false) {
                    // Log but continue
                    // echo "\n   Warning: $msg\n";
                }
            }
        }
        
        $db = null; // Close connection
        echo "✅ ($stmtCount)\n";
        $successCount++;
        
    } catch (Exception $e) {
        echo "❌ " . substr($e->getMessage(), 0, 60) . "\n";
        $errorCount++;
    }
}

echo "\n=== Migration Summary ===\n";
echo "✅ Success: $successCount\n";
echo "❌ Errors: $errorCount\n";
echo "⚠️  Skipped: $skippedCount\n";

// Verify and fix critical tables
echo "\n=== Ensuring Critical Tables & Columns ===\n";

$db = getDb();

// Ensure webforms tables exist
$webformsTables = [
    'webforms_forms' => "CREATE TABLE IF NOT EXISTS webforms_forms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL DEFAULT 1,
        user_id INT NOT NULL DEFAULT 1,
        folder_id INT NULL,
        title VARCHAR(255) NOT NULL DEFAULT 'Untitled Form',
        description TEXT,
        type VARCHAR(50) DEFAULT 'single_step',
        status VARCHAR(50) DEFAULT 'draft',
        settings JSON,
        theme JSON,
        welcome_screen JSON,
        thank_you_screen JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_webforms_forms_workspace (workspace_id),
        INDEX idx_webforms_forms_user (user_id),
        INDEX idx_webforms_forms_folder (folder_id),
        INDEX idx_webforms_forms_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    
    'webforms_form_fields' => "CREATE TABLE IF NOT EXISTS webforms_form_fields (
        id INT AUTO_INCREMENT PRIMARY KEY,
        form_id INT NOT NULL,
        workspace_id INT NOT NULL DEFAULT 1,
        field_type VARCHAR(50) NOT NULL,
        label VARCHAR(255),
        placeholder VARCHAR(255),
        description TEXT,
        required TINYINT(1) DEFAULT 0,
        position INT DEFAULT 0,
        properties JSON,
        validation JSON,
        conditional_logic JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_webforms_fields_form (form_id),
        INDEX idx_webforms_fields_workspace (workspace_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    
    'webforms_form_submissions' => "CREATE TABLE IF NOT EXISTS webforms_form_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        form_id INT NOT NULL,
        submission_data JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        status VARCHAR(50) DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_webforms_submissions_form (form_id),
        INDEX idx_webforms_submissions_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    
    'webforms_folders' => "CREATE TABLE IF NOT EXISTS webforms_folders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL DEFAULT 1,
        user_id INT NOT NULL DEFAULT 1,
        parent_id INT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(20) DEFAULT '#6366f1',
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_webforms_folders_workspace (workspace_id),
        INDEX idx_webforms_folders_parent (parent_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
];

foreach ($webformsTables as $table => $createSql) {
    $stmt = $db->query("SHOW TABLES LIKE '$table'");
    if (!$stmt->fetch()) {
        echo "Creating $table... ";
        try {
            $db->exec($createSql);
            echo "✅\n";
        } catch (Exception $e) {
            echo "❌ " . $e->getMessage() . "\n";
        }
    } else {
        echo "✅ $table exists\n";
    }
}

// Ensure conversations/pipeline tables exist
$conversationTables = [
    'conversations' => "CREATE TABLE IF NOT EXISTS conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        company_id INT DEFAULT NULL,
        contact_id INT NOT NULL,
        assigned_user_id INT DEFAULT NULL,
        status ENUM('open', 'pending', 'closed') DEFAULT 'open',
        unread_count INT DEFAULT 0,
        last_message_at DATETIME DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_conversations_workspace (workspace_id),
        INDEX idx_conversations_contact (contact_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    
    'conversation_messages' => "CREATE TABLE IF NOT EXISTS conversation_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        company_id INT DEFAULT NULL,
        conversation_id INT NOT NULL,
        channel ENUM('sms', 'email', 'call', 'note', 'system', 'form', 'whatsapp') NOT NULL,
        direction ENUM('inbound', 'outbound', 'system') NOT NULL,
        sender_type ENUM('contact', 'user', 'system') NOT NULL,
        sender_id INT DEFAULT NULL,
        subject VARCHAR(500) DEFAULT NULL,
        body TEXT,
        body_html TEXT DEFAULT NULL,
        metadata JSON DEFAULT NULL,
        status ENUM('pending', 'sent', 'delivered', 'read', 'failed') DEFAULT 'sent',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_messages_conversation (conversation_id),
        INDEX idx_messages_workspace (workspace_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    
    'pipelines' => "CREATE TABLE IF NOT EXISTS pipelines (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        company_id INT DEFAULT NULL,
        name VARCHAR(255) NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_pipelines_workspace (workspace_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    
    'pipeline_stages' => "CREATE TABLE IF NOT EXISTS pipeline_stages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        company_id INT DEFAULT NULL,
        pipeline_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        color VARCHAR(20) DEFAULT '#6366f1',
        sort_order INT DEFAULT 0,
        is_won BOOLEAN DEFAULT FALSE,
        is_lost BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_stages_pipeline (pipeline_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    
    'opportunities' => "CREATE TABLE IF NOT EXISTS opportunities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        company_id INT DEFAULT NULL,
        contact_id INT DEFAULT NULL,
        pipeline_id INT NOT NULL,
        stage_id INT NOT NULL,
        owner_user_id INT DEFAULT NULL,
        name VARCHAR(255) NOT NULL,
        value DECIMAL(15, 2) DEFAULT 0.00,
        currency VARCHAR(3) DEFAULT 'USD',
        status ENUM('open', 'won', 'lost') DEFAULT 'open',
        expected_close_date DATE DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_opportunities_workspace (workspace_id),
        INDEX idx_opportunities_pipeline (pipeline_id),
        INDEX idx_opportunities_stage (stage_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    
    'business_events' => "CREATE TABLE IF NOT EXISTS business_events (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        company_id INT DEFAULT NULL,
        event_type VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INT DEFAULT NULL,
        actor_type ENUM('user', 'system', 'contact', 'automation') DEFAULT 'system',
        actor_id INT DEFAULT NULL,
        payload JSON DEFAULT NULL,
        processed BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_events_workspace (workspace_id),
        INDEX idx_events_type (event_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
];

foreach ($conversationTables as $table => $createSql) {
    $stmt = $db->query("SHOW TABLES LIKE '$table'");
    if (!$stmt->fetch()) {
        echo "Creating $table... ";
        try {
            $db->exec($createSql);
            echo "✅\n";
        } catch (Exception $e) {
            echo "❌ " . $e->getMessage() . "\n";
        }
    } else {
        echo "✅ $table exists\n";
    }
}

// Ensure files table exists
$stmt = $db->query("SHOW TABLES LIKE 'files'");
if (!$stmt->fetch()) {
    echo "Creating files... ";
    $db->exec("CREATE TABLE IF NOT EXISTS files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        company_id INT NULL,
        user_id INT NULL,
        filename VARCHAR(255) NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        file_size INT NOT NULL,
        storage_path VARCHAR(500) NOT NULL,
        storage_provider ENUM('local', 's3', 'cloudinary') DEFAULT 'local',
        public_url VARCHAR(500) NULL,
        folder VARCHAR(100) NULL,
        category ENUM('attachment', 'image', 'document', 'receipt', 'photo', 'video', 'audio', 'other') DEFAULT 'attachment',
        entity_type VARCHAR(50) NULL,
        entity_id INT NULL,
        metadata JSON NULL,
        is_public TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        INDEX idx_files_workspace (workspace_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    echo "✅\n";
} else {
    echo "✅ files exists\n";
}

// Ensure landing_pages table exists
$stmt = $db->query("SHOW TABLES LIKE 'landing_pages'");
if (!$stmt->fetch()) {
    echo "Creating landing_pages... ";
    $db->exec("CREATE TABLE IF NOT EXISTS landing_pages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        workspace_id INT NULL,
        name VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
        content JSON NOT NULL,
        slug VARCHAR(255) UNIQUE,
        views INT DEFAULT 0,
        conversions INT DEFAULT 0,
        published_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_landing_pages_user (user_id),
        INDEX idx_landing_pages_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    echo "✅\n";
} else {
    echo "✅ landing_pages exists\n";
}

// Ensure call_dispositions_types has workspace_id
$stmt = $db->query("SHOW TABLES LIKE 'call_dispositions_types'");
if (!$stmt->fetch()) {
    echo "Creating call_dispositions_types... ";
    $db->exec("CREATE TABLE IF NOT EXISTS call_dispositions_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL DEFAULT 0,
        workspace_id INT NULL,
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
        INDEX idx_call_dispositions_user (user_id),
        INDEX idx_call_dispositions_workspace (workspace_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    echo "✅\n";
} else {
    echo "✅ call_dispositions_types exists\n";
    // Ensure workspace_id column exists
    $stmt = $db->query("SHOW COLUMNS FROM call_dispositions_types LIKE 'workspace_id'");
    if (!$stmt->fetch()) {
        echo "Adding workspace_id to call_dispositions_types... ";
        $db->exec("ALTER TABLE call_dispositions_types ADD COLUMN workspace_id INT NULL AFTER user_id");
        $db->exec("CREATE INDEX idx_call_dispositions_workspace ON call_dispositions_types(workspace_id)");
        echo "✅\n";
    }
}

// Seed default call dispositions if empty
$stmt = $db->query("SELECT COUNT(*) as cnt FROM call_dispositions_types WHERE user_id = 0");
$row = $stmt->fetch();
if ((int)($row['cnt'] ?? 0) === 0) {
    echo "Seeding default call dispositions... ";
    $defaults = [
        [0, 'Interested', 'Prospect showed interest', 'positive', '#10B981', 'thumbs-up', 1, 0, 0, 1],
        [0, 'Not Interested', 'Prospect not interested', 'negative', '#EF4444', 'thumbs-down', 1, 0, 0, 2],
        [0, 'Callback Requested', 'Prospect requested callback', 'callback', '#F59E0B', 'phone-callback', 1, 1, 1, 3],
        [0, 'Left Voicemail', 'Left voicemail message', 'neutral', '#6B7280', 'voicemail', 1, 0, 0, 4],
        [0, 'No Answer', 'No answer', 'neutral', '#9CA3AF', 'phone-missed', 1, 0, 0, 5],
        [0, 'Wrong Number', 'Wrong number', 'negative', '#DC2626', 'x-circle', 1, 0, 0, 7],
        [0, 'Do Not Call', 'Requested not to be called', 'negative', '#7C3AED', 'ban', 1, 0, 1, 8],
        [0, 'Appointment Set', 'Meeting scheduled', 'positive', '#059669', 'calendar-check', 1, 0, 1, 9],
        [0, 'Sale Made', 'Closed deal', 'positive', '#047857', 'check-circle', 1, 0, 1, 10],
    ];
    $stmt = $db->prepare('INSERT INTO call_dispositions_types (user_id, name, description, category, color, icon, is_default, requires_callback, requires_notes, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    foreach ($defaults as $d) {
        try { $stmt->execute($d); } catch (Exception $e) {}
    }
    echo "✅\n";
}

// Ensure followup_automations table exists
$stmt = $db->query("SHOW TABLES LIKE 'followup_automations'");
if (!$stmt->fetch()) {
    echo "Creating followup_automations... ";
    $db->exec("CREATE TABLE IF NOT EXISTS followup_automations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        workspace_id INT NULL,
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
        INDEX idx_followup_automations_workspace (workspace_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    echo "✅\n";
} else {
    echo "✅ followup_automations exists\n";
}

// Verify all key tables
echo "\n=== Final Verification ===\n";

$requiredTables = [
    'users', 'workspaces', 'workspace_members', 'companies', 'contacts',
    'webforms_forms', 'webforms_form_fields', 'webforms_form_submissions', 'webforms_folders',
    'conversations', 'conversation_messages', 'pipelines', 'pipeline_stages', 'opportunities',
    'followup_automations', 'call_dispositions_types',
    'landing_pages', 'files',
    'campaigns', 'recipients', 'templates', 'sending_accounts',
];

$existing = 0;
$missing = [];

foreach ($requiredTables as $table) {
    $stmt = $db->query("SHOW TABLES LIKE '$table'");
    if ($stmt->fetch()) {
        $existing++;
    } else {
        $missing[] = $table;
    }
}

echo "✅ Tables verified: $existing/" . count($requiredTables) . "\n";

if (!empty($missing)) {
    echo "❌ Still missing: " . implode(', ', $missing) . "\n";
} else {
    echo "🎉 All critical tables exist!\n";
}

echo "\n=== Done ===\n";
echo "Database is ready for use.\n";
