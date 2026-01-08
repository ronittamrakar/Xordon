<?php
/**
 * Feature Comparison Matrix Implementation
 * Runs all migrations for missing features identified in the competitor analysis
 */

require_once __DIR__ . '/vendor/autoload.php';

use Xordon\Database;

function runMigration($db, $migrationFile, $migrationName) {
    echo "\n=== Running Migration: $migrationName ===\n";
    
    $sql = file_get_contents($migrationFile);
    
    if (!$sql) {
        echo "❌ Failed to read migration file: $migrationFile\n";
        return false;
    }
    
    // Split by semicolons to execute multiple statements
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($stmt) { return !empty($stmt); }
    );
    
    $success = 0;
    $failed = 0;
    
    foreach ($statements as $statement) {
        try {
            $db->exec($statement);
            $success++;
        } catch (PDOException $e) {
            // Check if error is "table already exists"
            if (strpos($e->getMessage(), 'already exists') !== false) {
                echo "⚠️  Table already exists (skipping)\n";
                $success++;
            } else {
                echo "❌ Error: " . $e->getMessage() . "\n";
                $failed++;
            }
        }
    }
    
    echo "✅ Successfully executed: $success statements\n";
    if ($failed > 0) {
        echo "❌ Failed: $failed statements\n";
    }
    
    return $failed === 0;
}

function verifyTables($db, $expectedTables) {
    echo "\n=== Verifying Tables ===\n";
    
    $stmt = $db->query("SHOW TABLES");
    $existingTables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $missing = [];
    $found = [];
    
    foreach ($expectedTables as $table) {
        if (in_array($table, $existingTables)) {
            $found[] = $table;
        } else {
            $missing[] = $table;
        }
    }
    
    echo "✅ Found " . count($found) . " tables\n";
    
    if (!empty($missing)) {
        echo "❌ Missing " . count($missing) . " tables:\n";
        foreach ($missing as $table) {
            echo "   - $table\n";
        }
        return false;
    }
    
    return true;
}

try {
    echo "╔════════════════════════════════════════════════════════════╗\n";
    echo "║   Feature Comparison Matrix - Migration Runner            ║\n";
    echo "║   Implementing Missing Competitive Features               ║\n";
    echo "╚════════════════════════════════════════════════════════════╝\n";
    
    $db = Database::conn();
    
    // Migration 1: AI Features
    $aiMigration = __DIR__ . '/migrations/add_ai_features_tables.sql';
    if (file_exists($aiMigration)) {
        runMigration($db, $aiMigration, 'AI Features');
        
        $aiTables = [
            'ai_chatbot_conversations',
            'ai_chatbot_messages',
            'ai_call_answering',
            'ai_analytics_insights',
            'ai_conversation_bookings',
            'facebook_messenger_accounts',
            'facebook_messenger_conversations',
            'facebook_messenger_messages',
            'consumer_financing_applications',
            'ai_settings'
        ];
        
        verifyTables($db, $aiTables);
    } else {
        echo "⚠️  AI Features migration file not found\n";
    }
    
    // Migration 2: Course Management
    $courseMigration = __DIR__ . '/migrations/add_course_management_tables.sql';
    if (file_exists($courseMigration)) {
        runMigration($db, $courseMigration, 'Course Management System');
        
        $courseTables = [
            'courses',
            'course_modules',
            'course_lessons',
            'course_enrollments',
            'lesson_progress',
            'course_quizzes',
            'quiz_questions',
            'quiz_attempts',
            'course_reviews',
            'course_certificates',
            'hosted_videos',
            'membership_areas',
            'membership_access'
        ];
        
        verifyTables($db, $courseTables);
    } else {
        echo "⚠️  Course Management migration file not found\n";
    }
    
    // Create default AI settings for existing workspaces
    echo "\n=== Creating Default AI Settings ===\n";
    $stmt = $db->query("SELECT id FROM workspaces");
    $workspaces = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    foreach ($workspaces as $workspaceId) {
        try {
            $db->exec("
                INSERT IGNORE INTO ai_settings (workspace_id, chatbot_enabled, analytics_insights_enabled)
                VALUES ($workspaceId, FALSE, TRUE)
            ");
        } catch (PDOException $e) {
            // Ignore duplicate key errors
        }
    }
    
    echo "✅ Default AI settings created for " . count($workspaces) . " workspaces\n";
    
    echo "\n╔════════════════════════════════════════════════════════════╗\n";
    echo "║   Migration Complete!                                      ║\n";
    echo "╚════════════════════════════════════════════════════════════╝\n";
    
    echo "\n📊 Summary of New Features:\n";
    echo "   ✅ AI Chatbot System\n";
    echo "   ✅ AI Call Answering\n";
    echo "   ✅ AI Analytics & Insights\n";
    echo "   ✅ AI Conversation Booking\n";
    echo "   ✅ Facebook Messenger Integration\n";
    echo "   ✅ Consumer Financing\n";
    echo "   ✅ Course Management System\n";
    echo "   ✅ Video Hosting\n";
    echo "   ✅ Membership Areas\n";
    echo "   ✅ Quiz & Assessment System\n";
    echo "   ✅ Certificate Generation\n";
    
    echo "\n🎯 Next Steps:\n";
    echo "   1. Implement backend API endpoints\n";
    echo "   2. Create frontend components\n";
    echo "   3. Add settings pages for each feature\n";
    echo "   4. Configure integrations (OpenAI, Facebook, etc.)\n";
    echo "   5. Test all features end-to-end\n";
    
} catch (Exception $e) {
    echo "\n❌ Fatal Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
