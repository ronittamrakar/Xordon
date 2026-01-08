<?php
/**
 * Direct SQL Migration Executor
 * Runs all migrations directly without requiring MySQL CLI
 */

// Load environment
$envFile = __DIR__ . '/.env';
$env = [];
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $env[trim($key)] = trim($value);
        }
    }
}

$host = $env['DB_HOST'] ?? '127.0.0.1';
$port = $env['DB_PORT'] ?? '3306';
$dbname = $env['DB_NAME'] ?? 'xordon';
$user = $env['DB_USER'] ?? 'root';
$pass = $env['DB_PASS'] ?? '';

echo "========================================\n";
echo "XORDON DATABASE MIGRATION\n";
echo "========================================\n\n";

echo "Connecting to database...\n";
echo "Host: $host:$port\n";
echo "Database: $dbname\n";
echo "User: $user\n\n";

try {
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
    
    echo "✓ Connected successfully!\n\n";
    
    // List of migrations
    $migrations = [
        'create_ai_workforce_complete.sql',
        'create_culture_module_complete.sql',
        'create_blog_cms_complete.sql',
        'create_critical_missing_tables.sql',
        'add_missing_columns_to_existing_tables.sql'
    ];
    
    $migrationsDir = __DIR__ . '/backend/migrations/';
    $successCount = 0;
    $errorCount = 0;
    $tableCount = 0;
    
    foreach ($migrations as $index => $file) {
        $num = $index + 1;
        $total = count($migrations);
        
        echo "[$num/$total] Running: $file\n";
        
        $filePath = $migrationsDir . $file;
        
        if (!file_exists($filePath)) {
            echo "  ⚠ File not found!\n\n";
            $errorCount++;
            continue;
        }
        
        $sql = file_get_contents($filePath);
        
        // Split into statements
        $statements = array_filter(
            explode(';', $sql),
            function($stmt) {
                $stmt = trim($stmt);
                return !empty($stmt) && 
                       !preg_match('/^--/', $stmt) &&
                       !preg_match('/^\/\*/', $stmt);
            }
        );
        
        $stmtCount = 0;
        $errors = [];
        
        foreach ($statements as $statement) {
            $statement = trim($statement);
            if (empty($statement)) continue;
            
            try {
                $pdo->exec($statement);
                $stmtCount++;
                
                // Count CREATE TABLE statements
                if (stripos($statement, 'CREATE TABLE') !== false) {
                    $tableCount++;
                }
            } catch (PDOException $e) {
                // Ignore "already exists" and "duplicate column" errors
                if (stripos($e->getMessage(), 'already exists') === false &&
                    stripos($e->getMessage(), 'Duplicate column') === false &&
                    stripos($e->getMessage(), 'Duplicate key') === false) {
                    $errors[] = $e->getMessage();
                }
            }
        }
        
        if (empty($errors)) {
            echo "  ✓ Success! ($stmtCount statements)\n\n";
            $successCount++;
        } else {
            echo "  ⚠ Completed with errors:\n";
            foreach (array_slice($errors, 0, 3) as $error) {
                echo "    - " . substr($error, 0, 100) . "...\n";
            }
            echo "\n";
            $errorCount++;
        }
    }
    
    echo "========================================\n";
    echo "MIGRATION SUMMARY\n";
    echo "========================================\n";
    echo "✓ Successful: $successCount\n";
    if ($errorCount > 0) {
        echo "⚠ With errors: $errorCount\n";
    }
    echo "📊 Tables created/updated: $tableCount\n\n";
    
    // Verify critical tables
    echo "========================================\n";
    echo "VERIFYING TABLES\n";
    echo "========================================\n\n";
    
    $tablesToCheck = [
        'ai_employees' => 'AI Workforce',
        'culture_surveys' => 'Culture Module',
        'blog_posts' => 'Blog/CMS',
        'webinar_registrations' => 'Webinars',
        'loyalty_members' => 'Loyalty Program',
        'social_accounts' => 'Social Media',
        'financing_applications' => 'Consumer Financing',
        'signature_documents' => 'E-Signatures',
        'course_enrollments' => 'LMS/Courses'
    ];
    
    $verified = 0;
    $missing = 0;
    
    foreach ($tablesToCheck as $table => $module) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            echo "✓ $module ($table)\n";
            $verified++;
        } else {
            echo "✗ $module ($table) - NOT FOUND\n";
            $missing++;
        }
    }
    
    echo "\n========================================\n";
    echo "VERIFICATION SUMMARY\n";
    echo "========================================\n";
    echo "✓ Verified: $verified\n";
    if ($missing > 0) {
        echo "✗ Missing: $missing\n";
    }
    
    // Count total tables
    $stmt = $pdo->query("SHOW TABLES");
    $totalTables = $stmt->rowCount();
    echo "📊 Total tables in database: $totalTables\n\n";
    
    if ($missing == 0) {
        echo "========================================\n";
        echo "✅ MIGRATION COMPLETE!\n";
        echo "========================================\n\n";
        echo "All critical tables verified successfully!\n";
        echo "Your database is ready to use.\n\n";
        echo "NEXT STEPS:\n";
        echo "1. Add API routes to your router\n";
        echo "2. Test endpoints with Postman\n";
        echo "3. Verify frontend integration\n\n";
        echo "See COMPLETE_IMPLEMENTATION_SUMMARY.md for details.\n\n";
    } else {
        echo "⚠ Some tables are missing. Check the errors above.\n\n";
    }
    
} catch (PDOException $e) {
    echo "✗ DATABASE ERROR: " . $e->getMessage() . "\n";
    echo "\nPlease check:\n";
    echo "1. MySQL is running\n";
    echo "2. Database credentials in .env are correct\n";
    echo "3. Database '$dbname' exists\n\n";
    exit(1);
}
