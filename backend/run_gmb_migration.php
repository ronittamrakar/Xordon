<?php
/**
 * Run GMB Database Migration
 * Creates all necessary tables for Google Business Profile integration
 */

// Load environment and database config
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            putenv(trim($line));
        }
    }
}

$host = getenv('DB_HOST') ?: '127.0.0.1';
$port = getenv('DB_PORT') ?: '3306';
$dbname = getenv('DB_NAME') ?: 'xordon';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASS') ?: '';

echo "Connecting to database: $dbname@$host:$port\n";

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    echo "Connected successfully!\n\n";
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage() . "\n");
}

echo "Running GMB migration...\n\n";

$sqlFile = __DIR__ . '/migrations/create_gmb_comprehensive.sql';
if (!file_exists($sqlFile)) {
    die("Migration file not found: $sqlFile\n");
}

$sql = file_get_contents($sqlFile);

// Split by semicolons, but handle multi-line statements
$statements = [];
$currentStatement = '';

foreach (explode("\n", $sql) as $line) {
    // Skip comment-only lines
    $trimmedLine = trim($line);
    if (strpos($trimmedLine, '--') === 0) {
        continue;
    }
    
    $currentStatement .= $line . "\n";
    
    if (preg_match('/;\s*$/', $trimmedLine)) {
        $statements[] = trim($currentStatement);
        $currentStatement = '';
    }
}

if (trim($currentStatement)) {
    $statements[] = trim($currentStatement);
}

$successCount = 0;
$skipCount = 0;
$errorCount = 0;

foreach ($statements as $statement) {
    $statement = trim($statement);
    if (empty($statement)) continue;
    
    // Extract table name for feedback
    $tableName = '';
    if (preg_match('/CREATE TABLE.*?`?(\w+)`?/i', $statement, $matches)) {
        $tableName = $matches[1];
    } elseif (preg_match('/INSERT INTO `?(\w+)`?/i', $statement, $matches)) {
        $tableName = $matches[1] . ' (data)';
    }
    
    try {
        $pdo->exec($statement);
        $successCount++;
        if ($tableName) {
            echo "  ✓ $tableName\n";
        }
    } catch (PDOException $e) {
        $errorMsg = $e->getMessage();
        if (strpos($errorMsg, 'already exists') !== false || strpos($errorMsg, 'Duplicate entry') !== false) {
            $skipCount++;
            if ($tableName) {
                echo "  - $tableName (exists)\n";
            }
        } else {
            $errorCount++;
            if ($tableName) {
                echo "  ✗ $tableName: $errorMsg\n";
            } else {
                echo "  ✗ Error: $errorMsg\n";
            }
        }
    }
}

echo "\n";
echo "Migration complete!\n";
echo "  Created: $successCount\n";
echo "  Skipped: $skipCount\n";
echo "  Errors:  $errorCount\n";
