<?php

/**
 * Website Builder Setup Script
 * 
 * Run this script once to set up the website builder backend
 * 
 * Usage: php backend/setup_website_builder.php
 */

require_once __DIR__ . '/config/database.php';

echo "==============================================\n";
echo "Website Builder Setup\n";
echo "==============================================\n\n";

try {
    // Step 1: Run database migration
    echo "[1/4] Running database migration...\n";
    $sql = file_get_contents(__DIR__ . '/migrations/create_websites_tables.sql');
    
    // Split by semicolon and execute each statement
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $statement) {
        if (!empty($statement)) {
            try {
                $db->exec($statement);
            } catch (PDOException $e) {
                // Ignore "table already exists" errors
                if (strpos($e->getMessage(), 'already exists') === false) {
                    throw $e;
                }
            }
        }
    }
    echo "✓ Database tables created successfully\n\n";
    
    // Step 2: Create upload directories
    echo "[2/4] Creating upload directories...\n";
    $uploadDir = __DIR__ . '/uploads/websites';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
        echo "✓ Created: $uploadDir\n";
    } else {
        echo "✓ Directory already exists: $uploadDir\n";
    }
    echo "\n";
    
    // Step 3: Verify permissions
    echo "[3/4] Verifying permissions...\n";
    if (is_writable($uploadDir)) {
        echo "✓ Upload directory is writable\n";
    } else {
        echo "⚠ Warning: Upload directory is not writable\n";
        echo "  Run: chmod 755 $uploadDir\n";
    }
    echo "\n";
    
    // Step 4: Check configuration
    echo "[4/4] Checking configuration...\n";
    
    // Check if APP_URL is set
    $appUrl = $_ENV['APP_URL'] ?? getenv('APP_URL');
    if ($appUrl) {
        echo "✓ APP_URL is set: $appUrl\n";
    } else {
        echo "⚠ Warning: APP_URL is not set in .env\n";
        echo "  Add: APP_URL=https://yourdomain.com\n";
    }
    
    // Check PHP upload settings
    $uploadMaxFilesize = ini_get('upload_max_filesize');
    $postMaxSize = ini_get('post_max_size');
    echo "✓ upload_max_filesize: $uploadMaxFilesize\n";
    echo "✓ post_max_size: $postMaxSize\n";
    
    if (intval($uploadMaxFilesize) < 10) {
        echo "⚠ Warning: upload_max_filesize is less than 10M\n";
        echo "  Consider increasing it in php.ini\n";
    }
    
    echo "\n";
    echo "==============================================\n";
    echo "Setup Complete!\n";
    echo "==============================================\n\n";
    
    echo "Next steps:\n";
    echo "1. Test the API endpoints (see BACKEND_IMPLEMENTATION_GUIDE.md)\n";
    echo "2. Configure your web server to serve /uploads/ directory\n";
    echo "3. Start using the website builder!\n\n";
    
    echo "Test the API:\n";
    echo "  curl -X GET http://localhost:8001/api/websites \\\n";
    echo "    -H \"Authorization: Bearer YOUR_TOKEN\" \\\n";
    echo "    -H \"X-Workspace-Id: 1\"\n\n";
    
} catch (Exception $e) {
    echo "\n❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
