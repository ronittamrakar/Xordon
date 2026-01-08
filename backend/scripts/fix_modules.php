<?php
require_once __DIR__ . '/src/Database.php';

$pdo = Database::conn();
echo "Connected.\n";

// Check current schema
$stmt = $pdo->query("DESCRIBE modules");
echo "Current modules schema:\n";
foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $col) {
    echo "  {$col['Field']} - {$col['Type']} - Key: {$col['Key']}\n";
}

// The old schema has 'id' as VARCHAR primary key (module name)
// We need to drop and recreate with proper schema
echo "\nDropping old modules table...\n";
$pdo->exec("DROP TABLE IF EXISTS workspace_modules");
$pdo->exec("DROP TABLE IF EXISTS modules");

echo "Creating new modules table with correct schema...\n";
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

echo "Creating workspace_modules table...\n";
$pdo->exec("
    CREATE TABLE workspace_modules (
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

echo "Inserting product modules...\n";
$pdo->exec("
    INSERT INTO modules (module_key, name, description, icon, is_core, dependencies) VALUES
        ('core', 'Core Platform', 'Core platform functionality', 'Settings', 1, NULL),
        ('outreach', 'Outreach', 'Email, SMS, Call campaigns', 'Mail', 0, '[\"core\"]'),
        ('forms', 'Forms', 'Form builder', 'ClipboardList', 0, '[\"core\"]'),
        ('operations', 'Operations', 'Field Service Management', 'Wrench', 0, '[\"core\"]'),
        ('crm', 'CRM', 'Customer Relationship Management', 'TrendingUp', 0, '[\"core\"]')
");

// Auto-install for existing workspaces
echo "Installing default modules for workspaces...\n";
$pdo->exec("
    INSERT IGNORE INTO workspace_modules (workspace_id, module_key, status)
    SELECT id, 'outreach', 'installed' FROM workspaces
");
$pdo->exec("
    INSERT IGNORE INTO workspace_modules (workspace_id, module_key, status)
    SELECT id, 'crm', 'installed' FROM workspaces
");
$pdo->exec("
    INSERT IGNORE INTO workspace_modules (workspace_id, module_key, status)
    SELECT id, 'forms', 'installed' FROM workspaces
");

// Verify
echo "\nModules in database:\n";
$stmt = $pdo->query("SELECT module_key, name, is_core FROM modules ORDER BY is_core DESC, name");
foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $m) {
    $core = $m['is_core'] ? ' (CORE)' : '';
    echo "  - {$m['module_key']}: {$m['name']}{$core}\n";
}

$stmt = $pdo->query("SELECT COUNT(*) as cnt FROM workspace_modules");
echo "\nWorkspace assignments: " . $stmt->fetch()['cnt'] . "\n";
echo "Done!\n";
