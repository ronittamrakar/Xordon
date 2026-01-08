<?php
require_once __DIR__ . '/backend/src/Database.php';
use Xordon\Database;

try {
    $pdo = Database::conn();
    
    echo "Checking for new tables...\n\n";
    
    $tables = [
        'AI Workforce' => ['ai_employees', 'ai_capabilities', 'ai_workflows', 'ai_workflow_executions', 'ai_task_queue'],
        'Culture' => ['culture_surveys', 'culture_survey_responses', 'peer_recognition', 'team_events', 'event_attendees', 'culture_champions'],
        'Blog' => ['blog_posts', 'blog_categories', 'blog_tags', 'blog_comments'],
        'Webinar' => ['webinar_registrations', 'webinar_sessions', 'webinar_polls'],
        'Loyalty' => ['loyalty_members', 'loyalty_transactions', 'loyalty_rewards', 'loyalty_redemptions'],
        'Social' => ['social_accounts', 'social_posts', 'social_post_analytics'],
        'Financing' => ['financing_applications', 'financing_plans'],
        'E-Signature' => ['signature_documents', 'signature_recipients', 'signature_fields'],
        'LMS' => ['course_enrollments', 'course_progress', 'course_quizzes', 'quiz_attempts']
    ];
    
    $totalFound = 0;
    $totalMissing = 0;
    
    foreach ($tables as $module => $tableList) {
        echo "=== $module ===\n";
        foreach ($tableList as $table) {
            $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
            if ($stmt->rowCount() > 0) {
                echo "  ✓ $table\n";
                $totalFound++;
            } else {
                echo "  ✗ $table (MISSING)\n";
                $totalMissing++;
            }
        }
        echo "\n";
    }
    
    echo "========================================\n";
    echo "SUMMARY\n";
    echo "========================================\n";
    echo "✓ Found: $totalFound\n";
    echo "✗ Missing: $totalMissing\n";
    
    // Check if webinars table exists (parent table)
    echo "\nChecking parent tables:\n";
    $stmt = $pdo->query("SHOW TABLES LIKE 'webinars'");
    echo ($stmt->rowCount() > 0 ? "✓" : "✗") . " webinars\n";
    
    $stmt = $pdo->query("SHOW TABLES LIKE 'loyalty_programs'");
    echo ($stmt->rowCount() > 0 ? "✓" : "✗") . " loyalty_programs\n";
    
    $stmt = $pdo->query("SHOW TABLES LIKE 'courses'");
    echo ($stmt->rowCount() > 0 ? "✓" : "✗") . " courses\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
