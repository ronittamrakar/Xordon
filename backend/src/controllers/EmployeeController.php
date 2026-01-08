<?php
/**
 * Employee Controller
 * Manage HR-specific employee data: documents, onboarding, and profiles
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Permissions.php';

class EmployeeController {
    private static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        throw new Exception('Workspace context required');
    }

    private static function getUserId(): int {
        return Permissions::getUserId();
    }

    // ==================== DOCUMENTS ====================

    public static function getDocuments() {
        try {
            Permissions::require('hr.employees.view');
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $userId = $_GET['user_id'] ?? null;

            $query = "
                SELECT ed.*, f.filepath, f.filename, f.file_size, f.mime_type, u.name as user_name
                FROM employee_documents ed
                JOIN files f ON f.id = ed.file_id
                JOIN users u ON u.id = ed.user_id
                WHERE ed.workspace_id = ?
            ";
            $params = [$workspaceId];

            if ($userId) {
                $query .= " AND ed.user_id = ?";
                $params[] = $userId;
            }

            $stmt = $db->prepare($query);
            $stmt->execute($params);
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch documents: ' . $e->getMessage());
        }
    }

    public static function uploadDocument() {
        try {
            Permissions::require('hr.employees.manage');
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['user_id']) || empty($data['file_id']) || empty($data['document_type'])) {
                return Response::error('user_id, file_id, and document_type required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO employee_documents 
                (workspace_id, user_id, file_id, document_type, title, expiry_date, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $data['user_id'],
                $data['file_id'],
                $data['document_type'],
                $data['title'] ?? 'Untitled Document',
                $data['expiry_date'] ?? null,
                $data['notes'] ?? null
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to upload document: ' . $e->getMessage());
        }
    }

    // ==================== ONBOARDING ====================

    public static function getOnboardingChecklists() {
        try {
            Permissions::require('hr.employees.view');
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("SELECT * FROM onboarding_checklists WHERE workspace_id = ? AND is_active = 1");
            $stmt->execute([$workspaceId]);
            $checklists = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($checklists as &$checklist) {
                $taskStmt = $db->prepare("SELECT * FROM onboarding_tasks WHERE checklist_id = ? ORDER BY sort_order");
                $taskStmt->execute([$checklist['id']]);
                $checklist['tasks'] = $taskStmt->fetchAll(PDO::FETCH_ASSOC);
            }

            return Response::json(['data' => $checklists]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch checklists: ' . $e->getMessage());
        }
    }

    public static function getEmployeeOnboarding($userId) {
        try {
            Permissions::require('hr.employees.view');
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT eos.*, ot.title, ot.description, ot.is_required
                FROM employee_onboarding_status eos
                JOIN onboarding_tasks ot ON ot.id = eos.task_id
                WHERE eos.workspace_id = ? AND eos.user_id = ?
            ");
            $stmt->execute([$workspaceId, $userId]);
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch onboarding status: ' . $e->getMessage());
        }
    }

    public static function updateOnboardingTask($id) {
        try {
            Permissions::require('hr.employees.manage');
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $stmt = $db->prepare("
                UPDATE employee_onboarding_status 
                SET status = ?, completed_at = ?, completed_by = ?, notes = ?
                WHERE id = ? AND workspace_id = ?
            ");
            $stmt->execute([
                $data['status'] ?? 'completed',
                ($data['status'] ?? 'completed') === 'completed' ? date('Y-m-d H:i:s') : null,
                self::getUserId(),
                $data['notes'] ?? null,
                $id,
                $workspaceId
            ]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to update onboarding task: ' . $e->getMessage());
        }
    }

    // ==================== PERFORMANCE REVIEWS ====================

    public static function getPerformanceReviews() {
        try {
            Permissions::require('hr.employees.view');
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $userId = $_GET['user_id'] ?? null;

            $query = "
                SELECT pr.*, u.name as user_name, r.name as reviewer_name
                FROM performance_reviews pr
                JOIN users u ON u.id = pr.user_id
                JOIN users r ON r.id = pr.reviewer_id
                WHERE pr.workspace_id = ?
            ";
            $params = [$workspaceId];

            if ($userId) {
                $query .= " AND pr.user_id = ?";
                $params[] = $userId;
            }

            $stmt = $db->prepare($query);
            $stmt->execute($params);
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch performance reviews: ' . $e->getMessage());
        }
    }

    public static function createPerformanceReview() {
        try {
            Permissions::require('hr.employees.manage');
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $stmt = $db->prepare("
                INSERT INTO performance_reviews 
                (workspace_id, user_id, reviewer_id, review_date, period_start, period_end, rating, summary, strengths, areas_for_improvement, goals, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $data['user_id'],
                self::getUserId(),
                $data['review_date'] ?? date('Y-m-d'),
                $data['period_start'],
                $data['period_end'],
                $data['rating'],
                $data['summary'] ?? null,
                $data['strengths'] ?? null,
                $data['areas_for_improvement'] ?? null,
                $data['goals'] ?? null,
                $data['status'] ?? 'draft'
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to create performance review: ' . $e->getMessage());
        }
    }

    // ==================== ASSETS ====================

    public static function getAssets() {
        try {
            Permissions::require('hr.employees.view');
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $userId = $_GET['user_id'] ?? null;

            $query = "
                SELECT ca.*, u.name as assigned_to_name
                FROM company_assets ca
                LEFT JOIN users u ON u.id = ca.assigned_to
                WHERE ca.workspace_id = ?
            ";
            $params = [$workspaceId];

            if ($userId) {
                $query .= " AND ca.assigned_to = ?";
                $params[] = $userId;
            }

            $stmt = $db->prepare($query);
            $stmt->execute($params);
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch assets: ' . $e->getMessage());
        }
    }

    public static function updateAsset($id) {
        try {
            Permissions::require('hr.employees.manage');
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $stmt = $db->prepare("
                UPDATE company_assets 
                SET assigned_to = ?, assigned_date = ?, condition_status = ?, notes = ?
                WHERE id = ? AND workspace_id = ?
            ");
            $stmt->execute([
                $data['assigned_to'] ?? null,
                $data['assigned_date'] ?? null,
                $data['condition_status'] ?? 'good',
                $data['notes'] ?? null,
                $id,
                $workspaceId
            ]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to update asset: ' . $e->getMessage());
        }
    }

    // ==================== EMPLOYEE DATA INTEGRATION ====================

    /**
     * Get employee's time tracking entries
     */
    public static function getEmployeeTimeEntries($userId) {
        if ($userId === 'me') { $userId = self::getUserId(); }
        try {
            // Permissions::require('hr.employees.view'); // Relaxed for self-view
            $workspaceId = self::getWorkspaceId();
            $currentUserId = self::getUserId();
            $db = Database::conn();

            // Check if user can view this employee's data
            if (!Permissions::hasAny(['hr.time.view_all']) && $currentUserId != $userId) {
                return Response::error('Insufficient permissions', 403);
            }

            // Get recent time entries (last 30 days)
            $stmt = $db->prepare("
                SELECT te.*, 
                    TIMESTAMPDIFF(SECOND, te.start_time, te.end_time) as duration_seconds
                FROM time_entries te
                WHERE te.workspace_id = ? AND te.user_id = ?
                    AND te.start_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                ORDER BY te.start_time DESC
                LIMIT 50
            ");
            $stmt->execute([$workspaceId, $userId]);
            $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get summary stats
            $stmt = $db->prepare("
                SELECT 
                    SUM(TIMESTAMPDIFF(SECOND, start_time, end_time)) / 3600 as total_hours_this_month,
                    COUNT(*) as entry_count
                FROM time_entries
                WHERE workspace_id = ? AND user_id = ?
                    AND start_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            ");
            $stmt->execute([$workspaceId, $userId]);
            $summary = $stmt->fetch(PDO::FETCH_ASSOC);

            return Response::json([
                'data' => [
                    'entries' => $entries,
                    'summary' => $summary
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch time entries: ' . $e->getMessage());
        }
    }

    /**
     * Get employee's shift schedule
     */
    public static function getEmployeeShifts($userId) {
        if ($userId === 'me') { $userId = self::getUserId(); }
        try {
            // Permissions::require('hr.employees.view');
            $workspaceId = self::getWorkspaceId();
            $currentUserId = self::getUserId();
            $db = Database::conn();

            // Check if user can view this employee's data
            if (!Permissions::hasAny(['hr.scheduling.view_all']) && $currentUserId != $userId) {
                return Response::error('Insufficient permissions', 403);
            }

            // Get upcoming shifts (next 14 days)
            $stmt = $db->prepare("
                SELECT s.*, st.name as shift_type_name, st.color as shift_type_color
                FROM shifts s
                LEFT JOIN shift_types st ON st.id = s.shift_type_id
                WHERE s.workspace_id = ? AND s.user_id = ?
                    AND s.shift_date >= CURDATE()
                    AND s.shift_date <= DATE_ADD(CURDATE(), INTERVAL 14 DAY)
                ORDER BY s.shift_date ASC, s.start_time ASC
            ");
            $stmt->execute([$workspaceId, $userId]);
            $upcoming = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get recent shifts (last 30 days)
            $stmt = $db->prepare("
                SELECT s.*, st.name as shift_type_name, st.color as shift_type_color
                FROM shifts s
                LEFT JOIN shift_types st ON st.id = s.shift_type_id
                WHERE s.workspace_id = ? AND s.user_id = ?
                    AND s.shift_date < CURDATE()
                    AND s.shift_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                ORDER BY s.shift_date DESC, s.start_time DESC
                LIMIT 20
            ");
            $stmt->execute([$workspaceId, $userId]);
            $recent = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json([
                'data' => [
                    'upcoming' => $upcoming,
                    'recent' => $recent
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch shifts: ' . $e->getMessage());
        }
    }

    /**
     * Get employee's leave summary
     */
    public static function getEmployeeLeaveSummary($userId) {
        if ($userId === 'me') { $userId = self::getUserId(); }
        try {
            // Permissions::require('hr.employees.view');
            $workspaceId = self::getWorkspaceId();
            $currentUserId = self::getUserId();
            $db = Database::conn();

            // Check if user can view this employee's data
            if (!Permissions::hasAny(['hr.leave.view_all']) && $currentUserId != $userId) {
                return Response::error('Insufficient permissions', 403);
            }

            // Get leave balances
            $stmt = $db->prepare("
                SELECT * FROM leave_balances
                WHERE workspace_id = ? AND user_id = ?
            ");
            $stmt->execute([$workspaceId, $userId]);
            $balances = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get recent leave requests
            $stmt = $db->prepare("
                SELECT * FROM leave_requests
                WHERE workspace_id = ? AND user_id = ?
                ORDER BY created_at DESC
                LIMIT 10
            ");
            $stmt->execute([$workspaceId, $userId]);
            $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json([
                'data' => [
                    'balances' => $balances,
                    'requests' => $requests
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch leave summary: ' . $e->getMessage());
        }
    }

    /**
     * Get employee's payroll summary
     */
    public static function getEmployeePayrollSummary($userId) {
        if ($userId === 'me') { $userId = self::getUserId(); }
        try {
            // Permissions::require('hr.employees.view');
            $workspaceId = self::getWorkspaceId();
            $currentUserId = self::getUserId();
            $db = Database::conn();

            // Check if user can view this employee's data
            if (!Permissions::hasAny(['hr.payroll.view_all', 'hr.compensation.view']) && $currentUserId != $userId) {
                return Response::error('Insufficient permissions', 403);
            }

            // Get compensation info
            $stmt = $db->prepare("
                SELECT * FROM employee_compensation
                WHERE workspace_id = ? AND user_id = ?
                ORDER BY effective_date DESC
                LIMIT 1
            ");
            $stmt->execute([$workspaceId, $userId]);
            $compensation = $stmt->fetch(PDO::FETCH_ASSOC);

            // Get recent payroll records (last 6 months)
            $stmt = $db->prepare("
                SELECT pr.*, pp.period_start, pp.period_end, pp.pay_date
                FROM payroll_records pr
                JOIN pay_periods pp ON pp.id = pr.pay_period_id
                WHERE pr.workspace_id = ? AND pr.user_id = ?
                    AND pp.period_start >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                ORDER BY pp.period_start DESC
                LIMIT 10
            ");
            $stmt->execute([$workspaceId, $userId]);
            $payroll = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json([
                'data' => [
                    'compensation' => $compensation,
                    'recent_payroll' => $payroll
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch payroll summary: ' . $e->getMessage());
        }
    }

    /**
     * Get comprehensive employee profile
     */
    public static function getEmployeeProfile($userId) {
        if ($userId === 'me') { $userId = self::getUserId(); }
        try {
            Permissions::require('hr.employees.view');
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            // Get basic user info
            $stmt = $db->prepare("SELECT id, name, email, phone, avatar_url, status FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) return Response::error('User not found', 404);

            // Get HR profile info
            $stmt = $db->prepare("SELECT * FROM employee_profiles WHERE user_id = ? AND workspace_id = ?");
            $stmt->execute([$userId, $workspaceId]);
            $profile = $stmt->fetch(PDO::FETCH_ASSOC);

            // Get HR summary (hours, leave, etc)
            $stmt = $db->prepare("SELECT * FROM employee_hr_summary WHERE user_id = ? AND workspace_id = ?");
            $stmt->execute([$userId, $workspaceId]);
            $summary = $stmt->fetch(PDO::FETCH_ASSOC);

            return Response::json([
                'data' => [
                    'user' => $user,
                    'profile' => $profile ?: null,
                    'summary' => $summary ?: null
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch employee profile: ' . $e->getMessage());
        }
    }

    /**
     * Update employee profile
     */
    public static function updateEmployeeProfile($userId) {
        if ($userId === 'me') { $userId = self::getUserId(); }
        try {
            Permissions::require('hr.employees.manage');
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Check if profile exists
            $stmt = $db->prepare("SELECT id FROM employee_profiles WHERE user_id = ? AND workspace_id = ?");
            $stmt->execute([$userId, $workspaceId]);
            $exists = $stmt->fetch();

            if ($exists) {
                // Update
                $stmt = $db->prepare("
                    UPDATE employee_profiles 
                    SET job_title = ?, department = ?, reports_to = ?, hire_date = ?, 
                        employment_type = ?, work_location = ?, emergency_contact_name = ?, 
                        emergency_contact_phone = ?, emergency_contact_relation = ?, 
                        skills = ?, certifications = ?, notes = ?
                    WHERE user_id = ? AND workspace_id = ?
                ");
                $stmt->execute([
                    $data['job_title'] ?? null,
                    $data['department'] ?? null,
                    $data['reports_to'] ?? null,
                    $data['hire_date'] ?? null,
                    $data['employment_type'] ?? 'full_time',
                    $data['work_location'] ?? null,
                    $data['emergency_contact_name'] ?? null,
                    $data['emergency_contact_phone'] ?? null,
                    $data['emergency_contact_relation'] ?? null,
                    isset($data['skills']) ? (is_array($data['skills']) ? json_encode($data['skills']) : $data['skills']) : null,
                    isset($data['certifications']) ? (is_array($data['certifications']) ? json_encode($data['certifications']) : $data['certifications']) : null,
                    $data['notes'] ?? null,
                    $userId,
                    $workspaceId
                ]);
            } else {
                // Insert
                $stmt = $db->prepare("
                    INSERT INTO employee_profiles 
                    (user_id, workspace_id, job_title, department, reports_to, hire_date, 
                     employment_type, work_location, emergency_contact_name, 
                     emergency_contact_phone, emergency_contact_relation, skills, certifications, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $userId,
                    $workspaceId,
                    $data['job_title'] ?? null,
                    $data['department'] ?? null,
                    $data['reports_to'] ?? null,
                    $data['hire_date'] ?? null,
                    $data['employment_type'] ?? 'full_time',
                    $data['work_location'] ?? null,
                    $data['emergency_contact_name'] ?? null,
                    $data['emergency_contact_phone'] ?? null,
                    $data['emergency_contact_relation'] ?? null,
                    isset($data['skills']) ? (is_array($data['skills']) ? json_encode($data['skills']) : $data['skills']) : null,
                    isset($data['certifications']) ? (is_array($data['certifications']) ? json_encode($data['certifications']) : $data['certifications']) : null,
                    $data['notes'] ?? null
                ]);
            }

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to update employee profile: ' . $e->getMessage());
        }
    }
}
