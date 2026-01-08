<?php
require_once __DIR__ . '/src/Database.php';

use Xordon\Database;

// Increase memory/time limits for large codebases
ini_set('memory_limit', '512M');
set_time_limit(300);

echo "Starting Codebase Usage vs Database Schema Analysis...\n";

// --- 1. Helper Function to Scan Directory Recursively
function getPhpFiles($dir) {
    $results = [];
    $files = scandir($dir);
    foreach ($files as $value) {
        $path = realpath($dir . DIRECTORY_SEPARATOR . $value);
        if (!is_dir($path)) {
            if (pathinfo($path, PATHINFO_EXTENSION) === 'php') {
                $results[] = $path;
            }
        } else if ($value != "." && $value != "..") {
            $results = array_merge($results, getPhpFiles($path));
        }
    }
    return $results;
}

// --- 2. Scan Code for Table Usage
$srcDir = __DIR__ . '/src';
$files = getPhpFiles($srcDir);
echo "Scanning " . count($files) . " PHP files in $srcDir...\n";

$tablesInCode = [];
$tableUsageMap = []; // table => [file1, file2...]

foreach ($files as $file) {
    $content = file_get_contents($file);
    // Regex to capture table names in common SQL patterns
    // Note: This is heuristic. It won't catch complex dynamic strings or query builders that don't output raw SQL strings clearly.
    // Catches: FROM users, JOIN accounts, INTO logs, UPDATE settings
    // Ignores: FROM (SELECT..., FROM $var
    $patterns = [
        '/FROM\s+[`]?([a-zA-Z0-9_]+)[`]?/i',
        '/JOIN\s+[`]?([a-zA-Z0-9_]+)[`]?/i',
        '/INSERT\s+INTO\s+[`]?([a-zA-Z0-9_]+)[`]?/i',
        '/UPDATE\s+[`]?([a-zA-Z0-9_]+)[`]?/i',
        '/DELETE\s+FROM\s+[`]?([a-zA-Z0-9_]+)[`]?/i',
        '/TRUNCATE\s+TABLE\s+[`]?([a-zA-Z0-9_]+)[`]?/i'
    ];

    foreach ($patterns as $pattern) {
        if (preg_match_all($pattern, $content, $matches)) {
            foreach ($matches[1] as $tableName) {
                // Filter out obviously non-table keywords that might slip through (though unlikely with \s+)
                if (strtolower($tableName) === 'select' || strtolower($tableName) === 'where' || strtolower($tableName) === 'set') continue;
                
                $tablesInCode[] = $tableName;
                $tableUsageMap[$tableName][] = basename($file);
            }
        }
    }
}

$tablesInCode = array_unique($tablesInCode);
sort($tablesInCode);
echo "Found " . count($tablesInCode) . " unique tables referenced in code.\n";


// --- 3. Get Actual Database Tables
try {
    $pdo = Database::conn();
    // Re-fetch db name logic
    $stmt = $pdo->query("SELECT DATABASE()");
    $dbName = $stmt->fetchColumn();
    
    echo "Connected to database: $dbName\n";

    $stmt = $pdo->query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = '$dbName'");
    $actualTables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    sort($actualTables);
    
    echo "Found " . count($actualTables) . " actual tables in database.\n";

} catch (Exception $e) {
    echo "Error connecting to database: " . $e->getMessage() . "\n";
    exit(1);
}

// --- 4. Compare
$missingTables = []; // In Code but NOT in DB (CRITICAL)
$unusedTables = [];  // In DB but NOT in Code (Maybe unused)

foreach ($tablesInCode as $table) {
    if (!in_array($table, $actualTables)) {
        $missingTables[] = $table;
    }
}

foreach ($actualTables as $table) {
    if (!in_array($table, $tablesInCode)) {
        $unusedTables[] = $table;
    }
}

// --- 5. Generate Report
$report = "# Code vs Database Alignment Report\n";
$report .= "Generated on: " . date('Y-m-d H:i:s') . "\n\n";

$report .= "## Summary\n";
$report .= "- **Tables Referenced in Code:** " . count($tablesInCode) . "\n";
$report .= "- **Actual Tables in DB:** " . count($actualTables) . "\n";
$report .= "- **MISSING TABLES (Code needs them, DB verified missing):** " . count($missingTables) . "\n";
$report .= "- **Potentially Unused Tables (In DB, no explicit code ref):** " . count($unusedTables) . "\n\n";

if (!empty($missingTables)) {
    $report .= "## 🚨 CRITICAL: Missing Tables\n";
    $report .= "The following tables are referenced in the backend code but do NOT exist in the database. Features using these will FAIL.\n\n";
    $report .= "| Missing Table | Referenced In (Example Files) |\n";
    $report .= "|---|---|\n";
    foreach ($missingTables as $table) {
        $files = array_unique($tableUsageMap[$table] ?? []);
        $fileList = implode(", ", array_slice($files, 0, 3));
        if (count($files) > 3) $fileList .= ", ...";
        $report .= "| `$table` | $fileList |\n";
    }
    $report .= "\n";
} else {
    $report .= "## ✅ Success: All code-referenced tables exist in the database.\n\n";
}

if (!empty($unusedTables)) {
    $report .= "## ⚠️ Potentially Unused Tables\n";
    $report .= "No explicit string reference found in `backend/src` for these tables. Note: dynamic queries might still use them.\n";
    $report .= "<details><summary>Click to view list</summary>\n\n";
    foreach ($unusedTables as $table) {
        $report .= "- $table\n";
    }
    $report .= "</details>\n";
}

$reportFile = 'CODE_DB_ALIGNMENT_REPORT.md';
file_put_contents(__DIR__ . '/' . $reportFile, $report);
echo "Report generated: $reportFile\n";

