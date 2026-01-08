<?php
require_once __DIR__ . '/backend/src/Database.php';

use Xordon\Database;

echo "=== Database Connection Test ===\n\n";

try {
    $db = Database::conn();
    echo "✅ Database connection successful!\n\n";
    
    // Get all tables
    $stmt = $db->query('SHOW TABLES');
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "📊 Found " . count($tables) . " tables:\n\n";
    
    // Group tables by category
    $categories = [
        'Core' => ['users', 'workspaces', 'roles', 'permissions'],
        'CRM' => ['contacts', 'companies', 'opportunities', 'pipelines', 'pipeline_stages'],
        'Forms' => ['webforms_forms', 'webforms_form_fields', 'webforms_form_submissions', 'webforms_folders'],
        'Communication' => ['conversations', 'conversation_messages', 'emails', 'sms_messages'],
        'Listings' => ['business_listings', 'listing_directories', 'local_seo_listings'],
        'Marketing' => ['campaigns', 'ads_campaigns', 'landing_pages'],
        'AI' => ['ai_agents', 'ai_conversations', 'ai_settings'],
        'Helpdesk' => ['helpdesk_tickets', 'helpdesk_departments', 'helpdesk_kb_articles'],
        'Sentiment' => ['sentiment_analyses', 'sentiment_scores', 'sentiment_keywords'],
        'Other' => []
    ];
    
    $categorized = [];
    foreach ($tables as $table) {
        $found = false;
        foreach ($categories as $category => $keywords) {
            foreach ($keywords as $keyword) {
                if ($table === $keyword || strpos($table, $keyword) !== false) {
                    $categorized[$category][] = $table;
                    $found = true;
                    break 2;
                }
            }
        }
        if (!$found) {
            $categorized['Other'][] = $table;
        }
    }
    
    foreach ($categories as $category => $keywords) {
        if (!empty($categorized[$category])) {
            echo "📁 $category Tables:\n";
            foreach ($categorized[$category] as $table) {
                // Get row count
                $countStmt = $db->query("SELECT COUNT(*) as count FROM `$table`");
                $count = $countStmt->fetch(PDO::FETCH_ASSOC)['count'];
                echo "   - $table ($count rows)\n";
            }
            echo "\n";
        }
    }
    
    // Test a simple query
    echo "=== Testing Basic Queries ===\n\n";
    
    // Test users table
    $userStmt = $db->query("SELECT COUNT(*) as count FROM users");
    $userCount = $userStmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "✅ Users table: $userCount users\n";
    
    // Test webforms
    if (in_array('webforms_forms', $tables)) {
        $formsStmt = $db->query("SELECT COUNT(*) as count FROM webforms_forms");
        $formsCount = $formsStmt->fetch(PDO::FETCH_ASSOC)['count'];
        echo "✅ Webforms table: $formsCount forms\n";
    }
    
    // Test contacts
    if (in_array('contacts', $tables)) {
        $contactsStmt = $db->query("SELECT COUNT(*) as count FROM contacts");
        $contactsCount = $contactsStmt->fetch(PDO::FETCH_ASSOC)['count'];
        echo "✅ Contacts table: $contactsCount contacts\n";
    }
    
    echo "\n=== Database Status ===\n";
    echo "✅ Database is fully connected and operational!\n";
    echo "✅ All tables are accessible!\n";
    echo "✅ Ready for use!\n\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
