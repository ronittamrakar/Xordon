<?php
/**
 * Comprehensive Gap Features Migration
 * Adds all missing features identified in the gap analysis:
 * - Advanced Project Management (subtasks, attachments, dependencies, time tracking)
 * - LMS (quizzes, reviews, discussions)
 * - HR Integration
 * - Social Media Posting
 * - Field Service GPS Tracking
 */

require_once __DIR__ . '/backend/src/Database.php';

// Load .env
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $_ENV[trim($name)] = trim($value);
            putenv(sprintf('%s=%s', trim($name), trim($value)));
        }
    }
}

try {
    $db = Database::conn();
    echo "Connected to database.\n\n";

    $migrations = [
        // =====================================================
        // 1. ADVANCED PROJECT MANAGEMENT FEATURES
        // =====================================================
        
        "Task Subtasks" => "CREATE TABLE IF NOT EXISTS task_subtasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            completed BOOLEAN DEFAULT FALSE,
            assigned_to INT NULL,
            position INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_task_subtasks_task (task_id)
        )",

        "Task Attachments" => "CREATE TABLE IF NOT EXISTS task_attachments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_id INT NOT NULL,
            user_id INT NOT NULL,
            filename VARCHAR(255) NOT NULL,
            original_name VARCHAR(255) NOT NULL,
            file_path VARCHAR(500) NOT NULL,
            file_size INT DEFAULT 0,
            mime_type VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_task_attachments_task (task_id)
        )",

        "Task Dependencies" => "CREATE TABLE IF NOT EXISTS task_dependencies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_id INT NOT NULL,
            depends_on_task_id INT NOT NULL,
            dependency_type ENUM('blocks', 'blocked_by', 'related') DEFAULT 'blocks',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_task_deps_task (task_id),
            INDEX idx_task_deps_depends (depends_on_task_id)
        )",

        "Task Watchers" => "CREATE TABLE IF NOT EXISTS task_watchers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_id INT NOT NULL,
            user_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_watcher (task_id, user_id),
            INDEX idx_task_watchers_task (task_id)
        )",

        "Task Time Entries" => "CREATE TABLE IF NOT EXISTS task_time_entries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_id INT NOT NULL,
            user_id INT NOT NULL,
            description TEXT,
            duration_minutes INT NOT NULL DEFAULT 0,
            started_at DATETIME NULL,
            ended_at DATETIME NULL,
            is_billable BOOLEAN DEFAULT FALSE,
            hourly_rate DECIMAL(10,2) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_task_time_task (task_id),
            INDEX idx_task_time_user (user_id)
        )",

        "Task Activity Log" => "CREATE TABLE IF NOT EXISTS task_activity (
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_id INT NOT NULL,
            user_id INT NOT NULL,
            action VARCHAR(50) NOT NULL,
            field_name VARCHAR(50),
            old_value TEXT,
            new_value TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_task_activity_task (task_id)
        )",

        "Project Custom Fields" => "CREATE TABLE IF NOT EXISTS project_custom_fields (
            id INT AUTO_INCREMENT PRIMARY KEY,
            project_id INT NOT NULL,
            workspace_id INT NOT NULL,
            field_name VARCHAR(100) NOT NULL,
            field_type ENUM('text', 'number', 'date', 'dropdown', 'checkbox', 'url', 'email') NOT NULL,
            field_options JSON,
            required BOOLEAN DEFAULT FALSE,
            position INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_custom_fields_project (project_id)
        )",

        "Task Custom Field Values" => "CREATE TABLE IF NOT EXISTS task_custom_field_values (
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_id INT NOT NULL,
            field_id INT NOT NULL,
            value TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_task_field (task_id, field_id)
        )",

        "Recurring Tasks" => "CREATE TABLE IF NOT EXISTS recurring_tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            workspace_id INT NOT NULL,
            project_id INT,
            template_task_id INT,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            recurrence_type ENUM('daily', 'weekly', 'monthly', 'yearly') NOT NULL,
            recurrence_interval INT DEFAULT 1,
            recurrence_days JSON,
            next_run_at DATETIME,
            last_run_at DATETIME,
            is_active BOOLEAN DEFAULT TRUE,
            created_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_recurring_workspace (workspace_id),
            INDEX idx_recurring_next_run (next_run_at)
        )",

        // =====================================================
        // 2. LMS QUIZ & ASSESSMENT SYSTEM
        // =====================================================

        "Course Quizzes" => "CREATE TABLE IF NOT EXISTS course_quizzes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            workspace_id INT NOT NULL,
            course_id INT NOT NULL,
            module_id INT,
            lesson_id INT,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            time_limit_minutes INT DEFAULT 0,
            passing_score INT DEFAULT 70,
            max_attempts INT DEFAULT 0,
            shuffle_questions BOOLEAN DEFAULT FALSE,
            show_correct_answers BOOLEAN DEFAULT TRUE,
            is_required BOOLEAN DEFAULT FALSE,
            status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
            position INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_quiz_course (course_id),
            INDEX idx_quiz_module (module_id)
        )",

        "Quiz Questions" => "CREATE TABLE IF NOT EXISTS quiz_questions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            quiz_id INT NOT NULL,
            question_type ENUM('multiple_choice', 'true_false', 'short_answer', 'essay', 'matching') NOT NULL,
            question_text TEXT NOT NULL,
            question_media_url VARCHAR(500),
            points INT DEFAULT 1,
            position INT DEFAULT 0,
            explanation TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_question_quiz (quiz_id)
        )",

        "Quiz Question Options" => "CREATE TABLE IF NOT EXISTS quiz_question_options (
            id INT AUTO_INCREMENT PRIMARY KEY,
            question_id INT NOT NULL,
            option_text TEXT NOT NULL,
            is_correct BOOLEAN DEFAULT FALSE,
            match_text TEXT,
            position INT DEFAULT 0,
            INDEX idx_option_question (question_id)
        )",

        "Quiz Attempts" => "CREATE TABLE IF NOT EXISTS quiz_attempts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            quiz_id INT NOT NULL,
            user_id INT NOT NULL,
            enrollment_id INT,
            started_at DATETIME NOT NULL,
            completed_at DATETIME,
            score INT DEFAULT 0,
            max_score INT DEFAULT 0,
            percentage DECIMAL(5,2) DEFAULT 0,
            passed BOOLEAN DEFAULT FALSE,
            time_spent_seconds INT DEFAULT 0,
            attempt_number INT DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_attempt_quiz (quiz_id),
            INDEX idx_attempt_user (user_id)
        )",

        "Quiz Attempt Answers" => "CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            attempt_id INT NOT NULL,
            question_id INT NOT NULL,
            selected_option_id INT,
            text_answer TEXT,
            is_correct BOOLEAN,
            points_earned INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_answer_attempt (attempt_id)
        )",

        "Course Reviews" => "CREATE TABLE IF NOT EXISTS course_reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            course_id INT NOT NULL,
            user_id INT NOT NULL,
            enrollment_id INT,
            rating INT NOT NULL,
            title VARCHAR(255),
            review_text TEXT,
            is_verified BOOLEAN DEFAULT FALSE,
            is_featured BOOLEAN DEFAULT FALSE,
            helpful_count INT DEFAULT 0,
            status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_review_course (course_id),
            INDEX idx_review_user (user_id)
        )",

        "Course Discussions" => "CREATE TABLE IF NOT EXISTS course_discussions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            course_id INT NOT NULL,
            lesson_id INT,
            user_id INT NOT NULL,
            parent_id INT,
            title VARCHAR(255),
            content TEXT NOT NULL,
            is_pinned BOOLEAN DEFAULT FALSE,
            is_resolved BOOLEAN DEFAULT FALSE,
            reply_count INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_discussion_course (course_id),
            INDEX idx_discussion_lesson (lesson_id),
            INDEX idx_discussion_parent (parent_id)
        )",

        "Lesson Attachments" => "CREATE TABLE IF NOT EXISTS lesson_attachments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            lesson_id INT NOT NULL,
            filename VARCHAR(255) NOT NULL,
            original_name VARCHAR(255) NOT NULL,
            file_path VARCHAR(500) NOT NULL,
            file_size INT DEFAULT 0,
            mime_type VARCHAR(100),
            download_count INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_lesson_attach_lesson (lesson_id)
        )",

        "Student Notes" => "CREATE TABLE IF NOT EXISTS student_notes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            course_id INT NOT NULL,
            lesson_id INT,
            video_timestamp INT,
            note_text TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_note_user_course (user_id, course_id),
            INDEX idx_note_lesson (lesson_id)
        )",

        // =====================================================
        // 3. ENHANCED HR INTEGRATION TABLES
        // =====================================================

        "Employee HR Summary" => "CREATE TABLE IF NOT EXISTS employee_hr_summary (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            workspace_id INT NOT NULL,
            total_hours_worked DECIMAL(10,2) DEFAULT 0,
            leave_balance_annual INT DEFAULT 0,
            leave_balance_sick INT DEFAULT 0,
            leave_balance_personal INT DEFAULT 0,
            upcoming_shifts_count INT DEFAULT 0,
            pending_leave_requests INT DEFAULT 0,
            last_clock_in DATETIME,
            last_clock_out DATETIME,
            current_status ENUM('working', 'on_leave', 'off_duty', 'on_break') DEFAULT 'off_duty',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user (user_id),
            INDEX idx_hr_summary_workspace (workspace_id)
        )",

        "Shift Leave Conflicts" => "CREATE TABLE IF NOT EXISTS shift_leave_conflicts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            shift_id INT NOT NULL,
            leave_request_id INT NOT NULL,
            conflict_type ENUM('overlap', 'partial', 'adjacent') DEFAULT 'overlap',
            resolution_status ENUM('pending', 'shift_moved', 'leave_cancelled', 'approved_override') DEFAULT 'pending',
            resolved_by INT,
            resolved_at DATETIME,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_conflict_shift (shift_id),
            INDEX idx_conflict_leave (leave_request_id)
        )",

        "Onboarding Templates" => "CREATE TABLE IF NOT EXISTS onboarding_templates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            workspace_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            department VARCHAR(100),
            position_type VARCHAR(100),
            is_default BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_onboarding_template_workspace (workspace_id)
        )",

        "Onboarding Template Tasks" => "CREATE TABLE IF NOT EXISTS onboarding_template_tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            template_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            assigned_role VARCHAR(100),
            due_days INT DEFAULT 0,
            position INT DEFAULT 0,
            is_required BOOLEAN DEFAULT TRUE,
            INDEX idx_onboarding_task_template (template_id)
        )",

        // =====================================================
        // 4. SOCIAL MEDIA POSTING ENGINE
        // =====================================================

        "Social Post Queue" => "CREATE TABLE IF NOT EXISTS social_post_queue (
            id INT AUTO_INCREMENT PRIMARY KEY,
            workspace_id INT NOT NULL,
            company_id INT NOT NULL,
            post_id INT NOT NULL,
            account_id INT NOT NULL,
            platform ENUM('facebook', 'instagram', 'linkedin', 'twitter', 'tiktok') NOT NULL,
            scheduled_for DATETIME NOT NULL,
            status ENUM('pending', 'processing', 'published', 'failed', 'cancelled') DEFAULT 'pending',
            attempt_count INT DEFAULT 0,
            last_attempt_at DATETIME,
            error_message TEXT,
            published_at DATETIME,
            external_post_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_post_queue_scheduled (scheduled_for),
            INDEX idx_post_queue_status (status),
            INDEX idx_post_queue_workspace (workspace_id)
        )",

        "Social Post Metrics" => "CREATE TABLE IF NOT EXISTS social_post_metrics (
            id INT AUTO_INCREMENT PRIMARY KEY,
            post_id INT NOT NULL,
            platform VARCHAR(50) NOT NULL,
            likes INT DEFAULT 0,
            comments INT DEFAULT 0,
            shares INT DEFAULT 0,
            saves INT DEFAULT 0,
            reach INT DEFAULT 0,
            impressions INT DEFAULT 0,
            clicks INT DEFAULT 0,
            engagement_rate DECIMAL(5,2) DEFAULT 0,
            last_synced_at DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_metrics_post (post_id)
        )",

        "Social Content Calendar" => "CREATE TABLE IF NOT EXISTS social_content_calendar (
            id INT AUTO_INCREMENT PRIMARY KEY,
            workspace_id INT NOT NULL,
            company_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            content_type ENUM('post', 'story', 'reel', 'video', 'carousel', 'event') DEFAULT 'post',
            planned_date DATE NOT NULL,
            platforms JSON,
            notes TEXT,
            status ENUM('idea', 'drafting', 'ready', 'scheduled', 'published') DEFAULT 'idea',
            assigned_to INT,
            post_id INT,
            color VARCHAR(20) DEFAULT '#3b82f6',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_calendar_date (planned_date),
            INDEX idx_calendar_workspace (workspace_id)
        )",

        // =====================================================
        // 5. FIELD SERVICE & GPS TRACKING
        // =====================================================

        "GPS Location Logs" => "CREATE TABLE IF NOT EXISTS gps_location_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            workspace_id INT NOT NULL,
            latitude DECIMAL(10,8) NOT NULL,
            longitude DECIMAL(11,8) NOT NULL,
            accuracy DECIMAL(10,2),
            altitude DECIMAL(10,2),
            speed DECIMAL(10,2),
            heading DECIMAL(5,2),
            recorded_at DATETIME NOT NULL,
            source ENUM('mobile', 'web', 'device') DEFAULT 'mobile',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_gps_user_time (user_id, recorded_at),
            INDEX idx_gps_workspace (workspace_id)
        )",

        "Service Zones" => "CREATE TABLE IF NOT EXISTS service_zones (
            id INT AUTO_INCREMENT PRIMARY KEY,
            workspace_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            zone_type ENUM('polygon', 'radius', 'zip_codes') DEFAULT 'polygon',
            zone_data JSON,
            color VARCHAR(20) DEFAULT '#3b82f6',
            assigned_team_id INT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_zone_workspace (workspace_id)
        )",

        "Field Dispatch Jobs" => "CREATE TABLE IF NOT EXISTS field_dispatch_jobs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            workspace_id INT NOT NULL,
            company_id INT,
            job_id INT,
            appointment_id INT,
            assigned_technician_id INT,
            status ENUM('pending', 'dispatched', 'en_route', 'on_site', 'completed', 'cancelled') DEFAULT 'pending',
            priority ENUM('low', 'normal', 'high', 'emergency') DEFAULT 'normal',
            scheduled_start DATETIME,
            scheduled_end DATETIME,
            actual_start DATETIME,
            actual_end DATETIME,
            customer_name VARCHAR(255),
            customer_phone VARCHAR(50),
            service_address TEXT,
            service_lat DECIMAL(10,8),
            service_lng DECIMAL(11,8),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_dispatch_workspace (workspace_id),
            INDEX idx_dispatch_technician (assigned_technician_id),
            INDEX idx_dispatch_status (status),
            INDEX idx_dispatch_scheduled (scheduled_start)
        )",

        "Technician Status" => "CREATE TABLE IF NOT EXISTS technician_status (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            workspace_id INT NOT NULL,
            current_status ENUM('available', 'busy', 'on_break', 'offline', 'en_route') DEFAULT 'offline',
            current_job_id INT,
            current_lat DECIMAL(10,8),
            current_lng DECIMAL(11,8),
            last_location_update DATETIME,
            estimated_available_at DATETIME,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user (user_id),
            INDEX idx_tech_status_workspace (workspace_id)
        )",
    ];

    // Run migrations
    $success = 0;
    $skipped = 0;
    $failed = 0;

    foreach ($migrations as $name => $sql) {
        try {
            $db->exec($sql);
            echo "✅ Created: $name\n";
            $success++;
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'already exists') !== false) {
                echo "⏭️  Skipped (exists): $name\n";
                $skipped++;
            } else {
                echo "❌ Failed: $name - " . $e->getMessage() . "\n";
                $failed++;
            }
        }
    }

    // Add columns to existing tables
    echo "\n--- Adding columns to existing tables ---\n";

    $alterQueries = [
        "sales_tasks.estimated_hours" => "ALTER TABLE sales_tasks ADD COLUMN estimated_hours DECIMAL(10,2) DEFAULT 0",
        "sales_tasks.actual_hours" => "ALTER TABLE sales_tasks ADD COLUMN actual_hours DECIMAL(10,2) DEFAULT 0",
        "sales_tasks.is_recurring" => "ALTER TABLE sales_tasks ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE",
        "sales_tasks.recurring_task_id" => "ALTER TABLE sales_tasks ADD COLUMN recurring_task_id INT",
        "sales_tasks.watchers_count" => "ALTER TABLE sales_tasks ADD COLUMN watchers_count INT DEFAULT 0",
        "sales_tasks.attachments_count" => "ALTER TABLE sales_tasks ADD COLUMN attachments_count INT DEFAULT 0",
        "sales_tasks.subtasks_count" => "ALTER TABLE sales_tasks ADD COLUMN subtasks_count INT DEFAULT 0",
        "sales_tasks.completed_subtasks_count" => "ALTER TABLE sales_tasks ADD COLUMN completed_subtasks_count INT DEFAULT 0",
    ];

    foreach ($alterQueries as $name => $sql) {
        try {
            $db->exec($sql);
            echo "✅ Added column: $name\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate column') !== false) {
                echo "⏭️  Column exists: $name\n";
            } else {
                echo "⚠️  Warning: $name - " . $e->getMessage() . "\n";
            }
        }
    }

    echo "\n========================================\n";
    echo "Migration Complete!\n";
    echo "✅ Created: $success tables\n";
    echo "⏭️  Skipped: $skipped tables\n";
    echo "❌ Failed: $failed tables\n";
    echo "========================================\n";

} catch (Exception $e) {
    echo "❌ Migration Error: " . $e->getMessage() . "\n";
    exit(1);
}
