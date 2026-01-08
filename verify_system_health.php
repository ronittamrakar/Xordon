<?php
/**
 * System Health Dashboard - Quick Verification Script
 * Run this to verify all components are working
 */

require_once __DIR__ . '/backend/src/Database.php';

echo "=== SYSTEM HEALTH DASHBOARD VERIFICATION ===\n\n";

try {
    $pdo = \Xordon\Database::conn();
    echo "✅ Database connection: OK\n";
    
    // Check security_events table
    $stmt = $pdo->query("SHOW TABLES LIKE 'security_events'");
    if ($stmt->rowCount() > 0) {
        echo "✅ security_events table: EXISTS\n";
        
        // Check table structure
        $stmt = $pdo->query("DESCRIBE security_events");
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo "   Columns: " . implode(", ", $columns) . "\n";
        
        // Count events
        $stmt = $pdo->query("SELECT COUNT(*) FROM security_events");
        $count = $stmt->fetchColumn();
        echo "   Total events: $count\n";
    } else {
        echo "❌ security_events table: MISSING\n";
        echo "   Run: php migrate_security_events.php\n";
    }
    
    echo "\n";
    
    // Check system_health_snapshots table
    $stmt = $pdo->query("SHOW TABLES LIKE 'system_health_snapshots'");
    if ($stmt->rowCount() > 0) {
        echo "✅ system_health_snapshots table: EXISTS\n";
        $stmt = $pdo->query("SELECT COUNT(*) FROM system_health_snapshots");
        $count = $stmt->fetchColumn();
        echo "   Total snapshots: $count\n";
    } else {
        echo "⚠️  system_health_snapshots table: MISSING (optional)\n";
    }
    
    echo "\n";
    
    // Check if controllers exist
    $controllers = [
        'SecurityController' => 'backend/src/controllers/SecurityController.php',
        'SystemHealthController' => 'backend/src/controllers/SystemHealthController.php'
    ];
    
    foreach ($controllers as $name => $path) {
        if (file_exists(__DIR__ . '/' . $path)) {
            echo "✅ $name: EXISTS\n";
            
            // Check for syntax errors
            $output = [];
            $return = 0;
            exec("php -l \"$path\" 2>&1", $output, $return);
            if ($return === 0) {
                echo "   Syntax: OK\n";
            } else {
                echo "   ❌ Syntax errors found\n";
            }
        } else {
            echo "❌ $name: MISSING\n";
        }
    }
    
    echo "\n";
    
    // Check frontend files
    $frontendFiles = [
        'src/pages/admin/SystemHealth.tsx',
        'src/lib/api.ts'
    ];
    
    foreach ($frontendFiles as $file) {
        if (file_exists(__DIR__ . '/' . $file)) {
            echo "✅ $file: EXISTS\n";
        } else {
            echo "❌ $file: MISSING\n";
        }
    }
    
    echo "\n=== VERIFICATION COMPLETE ===\n\n";
    echo "📍 Access URL: http://localhost:5173/admin/health\n";
    echo "📋 Requirements:\n";
    echo "   - Must be logged in as admin\n";
    echo "   - Frontend dev server running (npm run dev)\n";
    echo "   - Backend server running\n\n";
    
    echo "🧪 To test Security tab:\n";
    echo "   INSERT INTO security_events (type, severity, ip_address, metadata)\n";
    echo "   VALUES ('rate_limit_exceeded', 'warning', '127.0.0.1', '{\"test\": true}');\n\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
