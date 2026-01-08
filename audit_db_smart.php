<?php
// Direct connection to avoid path issues
$host = '127.0.0.1';
$db   = 'xordon';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}

// Get all tables
$stmt = $pdo->query("SHOW TABLES");
$tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

$categorizedTables = [];
$uncategorizedTables = [];

// Helper to categorize tables
function categorize($tableName) {
    if (strpos($tableName, 'admin_') === 0 || $tableName === 'users' || $tableName === 'roles' || $tableName === 'permissions' || $tableName === 'workspaces') return 'Core/Auth';
    if (strpos($tableName, 'campaign') !== false || strpos($tableName, 'sequence') !== false || strpos($tableName, 'email') !== false || strpos($tableName, 'sms') !== false || strpos($tableName, 'call') !== false || strpos($tableName, 'template') !== false) return 'Communication';
    if ($tableName === 'contacts' || $tableName === 'companies' || strpos($tableName, 'contact_') === 0 || $tableName === 'recipients' || $tableName === 'tags' || $tableName === 'groups') return 'CRM';
    if (strpos($tableName, 'site') !== false || strpos($tableName, 'page') !== false || strpos($tableName, 'web') !== false || strpos($tableName, 'form') !== false) return 'Websites/Forms';
    if (strpos($tableName, 'flow') !== false || strpos($tableName, 'automat') !== false || strpos($tableName, 'trigger') !== false) return 'Automations';
    if (strpos($tableName, 'analytic') !== false || strpos($tableName, 'report') !== false) return 'Analytics';
    if (strpos($tableName, 'pay') !== false || strpos($tableName, 'invoice') !== false || strpos($tableName, 'product') !== false || strpos($tableName, 'order') !== false) return 'Sales/Finance';
    if (strpos($tableName, 'calendar') !== false || strpos($tableName, 'appointment') !== false || strpos($tableName, 'booking') !== false) return 'Scheduling';
    if (strpos($tableName, 'task') !== false || strpos($tableName, 'project') !== false || strpos($tableName, 'board') !== false) return 'Project Management';
    // Add more categories as needed
    return 'Other';
}

echo "Database Audit Report for '$db'\n";
echo "========================================\n\n";

$totalRows = 0;
$emptyTables = 0;

foreach ($tables as $table) {
    $countStmt = $pdo->query("SELECT COUNT(*) FROM `$table`");
    $count = $countStmt->fetchColumn();
    
    $cat = categorize($table);
    $categorizedTables[$cat][] = ['name' => $table, 'rows' => $count];
    
    $totalRows += $count;
    if ($count == 0) $emptyTables++;
}

ksort($categorizedTables);

foreach ($categorizedTables as $category => $tbls) {
    echo "## $category\n";
    echo str_pad("Table Name", 40) . " | Rows\n";
    echo str_repeat("-", 50) . "\n";
    foreach ($tbls as $t) {
        $warning = ($t['rows'] == 0) ? " (EMPTY⚠️)" : "";
        echo str_pad($t['name'], 40) . " | " . $t['rows'] . $warning . "\n";
    }
    echo "\n";
}

echo "Summary:\n";
echo "Total Tables: " . count($tables) . "\n";
echo "Empty Tables: " . $emptyTables . "\n";
echo "Total Rows: " . $totalRows . "\n";

?>
