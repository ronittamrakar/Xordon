<?php
/**
 * Run the module registry migrations
 */

require_once __DIR__ . '/src/Database.php';

try {
    $pdo = Database::conn();
    echo "Database connected.\n";
    
    // Check if modules table exists and has the right schema
    $stmt = $pdo->query("SHOW TABLES LIKE 'modules'");
    $tableExists = $stmt->fetch();
    
    if ($tableExists) {
        // Check if module_key column exists
        $stmt = $pdo->query("SHOW COLUMNS FROM modules LIKE 'module_key'");
        $hasModuleKey = $stmt->fetch();
        
        if (!$hasModuleKey) {
            echo "Existing modules table has old schema. Adding module_key column...\n";
            // The old schema uses 'id' as VARCHAR primary key for module name
            // We need to add module_key and migrate
            try {
                $pdo->exec("ALTER TABLE modules ADD COLUMN module_key VARCHAR(50) UNIQUE AFTER id");
                $pdo->exec("UPDATE modules SET module_key = id WHERE module_key IS NULL");
                echo "module_key column added.\n";
            } catch (PDOException $e) {
                echo "Note: " . $e->getMessage() . "\n";
            }
        }
        
        // Check for is_core column
        $stmt = $pdo->query("SHOW COLUMNS FROM modules LIKE 'is_core'");
        $hasIsCore = $stmt->fetch();
        if (!$hasIsCore) {
            try {
                $pdo->exec("ALTER TABLE modules ADD COLUMN is_core BOOLEAN DEFAULT FALSE");
                echo "is_core column added.\n";
            } catch (PDOException $e) {
                echo "Note: " . $e->getMessage() . "\n";
            }
        }
        
        // Check for icon column
        $stmt = $pdo->query("SHOW COLUMNS FROM modules LIKE 'icon'");
        $hasIcon = $stmt->fetch();
        if (!$hasIcon) {
            try {
                $pdo->exec("ALTER TABLE modules ADD COLUMN icon VARCHAR(50) DEFAULT 'Package'");
                echo "icon column added.\n";
            } catch (PDOException $e) {
                echo "Note: " . $e->getMessage() . "\n";
            }
        }
        
        // Check for dependencies column
        $stmt = $pdo->query("SHOW COLUMNS FROM modules LIKE 'dependencies'");
        $hasDeps = $stmt->fetch();
        if (!$hasDeps) {
            try {
                $pdo->exec("ALTER TABLE modules ADD COLUMN dependencies JSON");
                echo "dependencies column added.\n";
            } catch (PDOException $e) {
                echo "Note: " . $e->getMessage() . "\n";
            }
        }
        
        echo "modules table schema updated.\n";
    } else {
        // Create modules table directly
        echo "Creating modules table...\n";
        $pdo->exec("
            CREATE TABLE modules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                module_key VARCHAR(50) NOT NULL UNIQUE,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                icon VARCHAR(50) DEFAULT 'Package',
                is_core BOOLEAN DEFAULT FALSE,
                version VARCHAR(20) DEFAULT '1.0.0',
                dependencies JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_module_key (module_key),
                INDEX idx_is_core (is_core)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        echo "modules table created.\n";
    }
    
    // Create workspace_modules table directly
    echo "Creating workspace_modules table...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS workspace_modules (
            id INT AUTO_INCREMENT PRIMARY KEY,
            workspace_id INT NOT NULL,
            module_key VARCHAR(50) NOT NULL,
            status ENUM('installed', 'disabled') DEFAULT 'installed',
            installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            installed_by INT,
            disabled_at TIMESTAMP NULL,
            disabled_by INT,
            settings JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uk_workspace_module (workspace_id, module_key),
            INDEX idx_workspace_id (workspace_id),
            INDEX idx_module_key (module_key),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "workspace_modules table ready.\n";
    
    // Seed the product modules
    echo "Seeding product modules...\n";
    $pdo->exec("
        INSERT INTO modules (module_key, name, description, icon, is_core, dependencies) VALUES
            ('core', 'Core Platform', 'Core platform functionality including auth, settings, dashboard, contacts, companies, lists, segments', 'Settings', TRUE, NULL),
            ('outreach', 'Outreach', 'Email, SMS, and Call campaigns with sequences, templates, automations, landing pages, proposals, and A/B testing', 'Mail', FALSE, '[\"core\"]'),
            ('forms', 'Forms', 'Standalone form builder with submissions, analytics, and integrations - Typeform/Jotform alternative', 'ClipboardList', FALSE, '[\"core\"]'),
            ('operations', 'Operations', 'Field Service Management - jobs, estimates, appointments, payments, staff, services, and dispatch', 'Wrench', FALSE, '[\"core\"]'),
            ('crm', 'CRM', 'Customer Relationship Management - leads, pipeline, activities, and analytics', 'TrendingUp', FALSE, '[\"core\"]')
        ON DUPLICATE KEY UPDATE 
            name = VALUES(name),
            description = VALUES(description),
            icon = VALUES(icon),
            is_core = VALUES(is_core),
            dependencies = VALUES(dependencies)
    ");
    echo "Modules seeded.\n";
    
    // Auto-install default modules for existing workspaces
    echo "Installing default modules for existing workspaces...\n";
    $pdo->exec("
        INSERT IGNORE INTO workspace_modules (workspace_id, module_key, status, installed_at)
        SELECT w.id, 'outreach', 'installed', NOW()
        FROM workspaces w
        WHERE NOT EXISTS (
            SELECT 1 FROM workspace_modules wm 
            WHERE wm.workspace_id = w.id AND wm.module_key = 'outreach'
        )
    ");
    $pdo->exec("
        INSERT IGNORE INTO workspace_modules (workspace_id, module_key, status, installed_at)
        SELECT w.id, 'crm', 'installed', NOW()
        FROM workspaces w
        WHERE NOT EXISTS (
            SELECT 1 FROM workspace_modules wm 
            WHERE wm.workspace_id = w.id AND wm.module_key = 'crm'
        )
    ");
    $pdo->exec("
        INSERT IGNORE INTO workspace_modules (workspace_id, module_key, status, installed_at)
        SELECT w.id, 'forms', 'installed', NOW()
        FROM workspaces w
        WHERE NOT EXISTS (
            SELECT 1 FROM workspace_modules wm 
            WHERE wm.workspace_id = w.id AND wm.module_key = 'forms'
        )
    ");
    echo "Default modules installed.\n";
    
    // Verify
    $stmt = $pdo->query("SELECT module_key, name, is_core FROM modules ORDER BY is_core DESC, name");
    $modules = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "\nModules in database:\n";
    foreach ($modules as $m) {
        $core = $m['is_core'] ? ' (CORE)' : '';
        echo "  - {$m['module_key']}: {$m['name']}{$core}\n";
    }
    
    // Check workspace modules
    $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM workspace_modules");
    $count = $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];
    echo "\nWorkspace module assignments: $count\n";
    
    echo "\nDone!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
