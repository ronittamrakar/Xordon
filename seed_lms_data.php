<?php
require_once __DIR__ . '/backend/src/Database.php';
require_once __DIR__ . '/backend/src/Config.php';

use Xordon\Database;

try {
    $db = Database::conn();
    $workspaceId = 1;
    $userId = 1;

    // 1. Seed Courses
    $db->exec("INSERT IGNORE INTO courses (id, workspace_id, title, slug, price, status, certificate_enabled) VALUES 
        (1, $workspaceId, 'Introduction to Digital Marketing', 'intro-digital-marketing', 49.99, 'published', 1),
        (2, $workspaceId, 'Advanced SEO Strategies', 'advanced-seo', 99.00, 'published', 1),
        (3, $workspaceId, 'React Mastery 2024', 'react-mastery', 199.00, 'draft', 0)");

    // 2. Seed Modules
    $db->exec("INSERT IGNORE INTO course_modules (id, course_id, title, order_index) VALUES 
        (1, 1, 'Module 1: Getting Started', 0),
        (2, 1, 'Module 2: Content Strategy', 1),
        (3, 2, 'Module 1: Technical SEO', 0)");

    // 3. Seed Lessons
    $db->exec("INSERT IGNORE INTO course_lessons (id, module_id, course_id, title, order_index, content_type) VALUES 
        (1, 1, 1, 'What is Digital Marketing?', 0, 'video'),
        (2, 1, 1, 'Setting Your Goals', 1, 'text'),
        (3, 2, 1, 'Creating a Content Calendar', 0, 'video')");

    // 4. Seed Enrollments
    $db->exec("INSERT IGNORE INTO course_enrollments (id, course_id, user_id, workspace_id, status, progress_percentage, completed_lessons, total_lessons, completed_at) VALUES 
        (1, 1, $userId, $workspaceId, 'completed', 100, 3, 3, NOW()),
        (2, 2, $userId, $workspaceId, 'active', 25, 1, 4, NULL)");

    // 5. Seed Certificates
    $db->exec("INSERT IGNORE INTO course_certificates (id, course_id, enrollment_id, user_id, certificate_number, verification_code, issued_at) VALUES 
        (1, 1, 1, $userId, 'CERT-1-1-1704100000', 'XORDON-VALID-2024', NOW())");

    // 6. Seed Memberships
    $db->exec("INSERT IGNORE INTO memberships (id, workspace_id, name, slug, access_type, price, status) VALUES 
        (1, $workspaceId, 'Premium All-Access', 'premium-all-access', 'subscription', 29.99, 'active'),
        (2, $workspaceId, 'SEO Masters Circle', 'seo-masters', 'paid', 499.00, 'active')");

    // 7. Seed Membership Content
    $db->exec("INSERT IGNORE INTO membership_content (id, membership_id, title, content_type, sort_order) VALUES 
        (1, 1, 'Quick Start Guide', 'lesson', 0),
        (2, 1, 'Advanced Techniques', 'module', 1),
        (3, 1, 'Case Study: 0 to 1M', 'video', 2)");

    echo "Seeding completed successfully.\n";

} catch (Exception $e) {
    echo "Error seeding: " . $e->getMessage() . "\n";
}
