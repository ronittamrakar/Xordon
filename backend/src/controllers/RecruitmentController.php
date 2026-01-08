<?php
/**
 * Recruitment Controller (ATS - Applicant Tracking System)
 * Manage job openings, applications, candidates, and hiring pipeline
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Permissions.php';

class RecruitmentController {
    private static function getWorkspaceId(): int {
        return Permissions::getWorkspaceId();
    }

    private static function getUserId(): int {
        return Permissions::getUserId();
    }

    // ==================== JOB OPENINGS ====================

    public static function getJobOpenings() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $where = ['workspace_id = ?'];
            $params = [$workspaceId];

            if (!empty($_GET['status'])) {
                $where[] = 'status = ?';
                $params[] = $_GET['status'];
            }

            if (!empty($_GET['department'])) {
                $where[] = 'department = ?';
                $params[] = $_GET['department'];
            }

            $whereClause = implode(' AND ', $where);

            $stmt = $db->prepare("
                SELECT jo.*, 
                    u.name as created_by_name,
                    (SELECT COUNT(*) FROM job_applications WHERE job_id = jo.id) as application_count,
                    (SELECT COUNT(*) FROM job_applications WHERE job_id = jo.id AND status = 'new') as new_applications
                FROM job_openings jo
                LEFT JOIN users u ON u.id = jo.created_by
                WHERE $whereClause
                ORDER BY jo.created_at DESC
            ");
            $stmt->execute($params);
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch job openings: ' . $e->getMessage());
        }
    }

    public static function createJobOpening() {
        try {
            Permissions::require('hr.recruitment.manage');
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['title']) || empty($data['department'])) {
                return Response::error('title and department required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO job_openings 
                (workspace_id, title, department, location, employment_type, experience_level,
                 salary_min, salary_max, description, requirements, responsibilities, benefits,
                 status, created_by, application_deadline)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $data['title'],
                $data['department'],
                $data['location'] ?? null,
                $data['employment_type'] ?? 'full-time',
                $data['experience_level'] ?? 'mid-level',
                $data['salary_min'] ?? null,
                $data['salary_max'] ?? null,
                $data['description'] ?? null,
                $data['requirements'] ?? null,
                $data['responsibilities'] ?? null,
                $data['benefits'] ?? null,
                $data['status'] ?? 'draft',
                $userId,
                $data['application_deadline'] ?? null
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to create job opening: ' . $e->getMessage());
        }
    }

    public static function updateJobOpening($id) {
        try {
            Permissions::require('hr.recruitment.manage');
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $updates = [];
            $params = [];

            $allowedFields = [
                'title', 'department', 'location', 'employment_type', 'experience_level',
                'salary_min', 'salary_max', 'description', 'requirements', 'responsibilities',
                'benefits', 'status', 'application_deadline', 'positions_available'
            ];

            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }

            if (empty($updates)) {
                return Response::error('No fields to update', 400);
            }

            $params[] = $id;
            $params[] = $workspaceId;

            $stmt = $db->prepare("
                UPDATE job_openings 
                SET " . implode(', ', $updates) . "
                WHERE id = ? AND workspace_id = ?
            ");
            $stmt->execute($params);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to update job opening: ' . $e->getMessage());
        }
    }

    // ==================== JOB APPLICATIONS ====================

    public static function getJobApplications() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $where = ['ja.workspace_id = ?'];
            $params = [$workspaceId];

            if (!empty($_GET['job_id'])) {
                $where[] = 'ja.job_id = ?';
                $params[] = (int)$_GET['job_id'];
            }

            if (!empty($_GET['status'])) {
                $where[] = 'ja.status = ?';
                $params[] = $_GET['status'];
            }

            if (!empty($_GET['stage'])) {
                $where[] = 'ja.current_stage = ?';
                $params[] = $_GET['stage'];
            }

            $whereClause = implode(' AND ', $where);

            $stmt = $db->prepare("
                SELECT ja.*, 
                    jo.title as job_title,
                    jo.department,
                    c.first_name as candidate_first_name,
                    c.last_name as candidate_last_name,
                    c.email as candidate_email,
                    c.phone as candidate_phone
                FROM job_applications ja
                LEFT JOIN job_openings jo ON jo.id = ja.job_id
                LEFT JOIN candidates c ON c.id = ja.candidate_id
                WHERE $whereClause
                ORDER BY ja.applied_at DESC
            ");
            $stmt->execute($params);
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch applications: ' . $e->getMessage());
        }
    }

    public static function createJobApplication() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['job_id']) || empty($data['candidate_id'])) {
                return Response::error('job_id and candidate_id required', 400);
            }

            // Check for duplicate application
            $checkStmt = $db->prepare("
                SELECT id FROM job_applications 
                WHERE workspace_id = ? AND job_id = ? AND candidate_id = ?
            ");
            $checkStmt->execute([$workspaceId, $data['job_id'], $data['candidate_id']]);
            if ($checkStmt->fetch()) {
                return Response::error('Candidate has already applied for this job', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO job_applications 
                (workspace_id, job_id, candidate_id, cover_letter, resume_file_id, 
                 current_stage, status, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $data['job_id'],
                $data['candidate_id'],
                $data['cover_letter'] ?? null,
                $data['resume_file_id'] ?? null,
                'applied',
                'new',
                $data['source'] ?? 'direct'
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to create application: ' . $e->getMessage());
        }
    }

    public static function updateApplicationStage($id) {
        try {
            Permissions::require('hr.recruitment.manage');
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['stage'])) {
                return Response::error('stage required', 400);
            }

            $stmt = $db->prepare("
                UPDATE job_applications 
                SET current_stage = ?, 
                    status = ?,
                    updated_at = NOW()
                WHERE id = ? AND workspace_id = ?
            ");
            $stmt->execute([
                $data['stage'],
                $data['status'] ?? 'in_progress',
                $id,
                $workspaceId
            ]);

            // Log stage change
            $logStmt = $db->prepare("
                INSERT INTO application_stage_history 
                (application_id, stage, changed_by, notes)
                VALUES (?, ?, ?, ?)
            ");
            $logStmt->execute([
                $id,
                $data['stage'],
                $userId,
                $data['notes'] ?? null
            ]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to update stage: ' . $e->getMessage());
        }
    }

    // ==================== CANDIDATES ====================

    public static function getCandidates() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $where = ['workspace_id = ?'];
            $params = [$workspaceId];

            if (!empty($_GET['search'])) {
                $where[] = "(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)";
                $searchTerm = '%' . $_GET['search'] . '%';
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }

            $whereClause = implode(' AND ', $where);

            $stmt = $db->prepare("
                SELECT c.*,
                    (SELECT COUNT(*) FROM job_applications WHERE candidate_id = c.id) as application_count
                FROM candidates c
                WHERE $whereClause
                ORDER BY c.created_at DESC
            ");
            $stmt->execute($params);
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch candidates: ' . $e->getMessage());
        }
    }

    public static function createCandidate() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['email'])) {
                return Response::error('email required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO candidates 
                (workspace_id, first_name, last_name, email, phone, linkedin_url, 
                 portfolio_url, current_company, current_title, years_of_experience, 
                 skills, education, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $data['first_name'] ?? null,
                $data['last_name'] ?? null,
                $data['email'],
                $data['phone'] ?? null,
                $data['linkedin_url'] ?? null,
                $data['portfolio_url'] ?? null,
                $data['current_company'] ?? null,
                $data['current_title'] ?? null,
                $data['years_of_experience'] ?? null,
                $data['skills'] ?? null,
                $data['education'] ?? null,
                $data['source'] ?? 'manual'
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to create candidate: ' . $e->getMessage());
        }
    }

    // ==================== INTERVIEWS ====================

    public static function getInterviews() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $where = ['i.workspace_id = ?'];
            $params = [$workspaceId];

            if (!empty($_GET['application_id'])) {
                $where[] = 'i.application_id = ?';
                $params[] = (int)$_GET['application_id'];
            }

            if (!empty($_GET['status'])) {
                $where[] = 'i.status = ?';
                $params[] = $_GET['status'];
            }

            $whereClause = implode(' AND ', $where);

            $stmt = $db->prepare("
                SELECT i.*, 
                    c.first_name as candidate_first_name,
                    c.last_name as candidate_last_name,
                    jo.title as job_title,
                    u.name as interviewer_name
                FROM interviews i
                LEFT JOIN job_applications ja ON ja.id = i.application_id
                LEFT JOIN candidates c ON c.id = ja.candidate_id
                LEFT JOIN job_openings jo ON jo.id = ja.job_id
                LEFT JOIN users u ON u.id = i.interviewer_id
                WHERE $whereClause
                ORDER BY i.scheduled_at ASC
            ");
            $stmt->execute($params);
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch interviews: ' . $e->getMessage());
        }
    }

    public static function scheduleInterview() {
        try {
            Permissions::require('hr.recruitment.manage');
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['application_id']) || empty($data['scheduled_at'])) {
                return Response::error('application_id and scheduled_at required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO interviews 
                (workspace_id, application_id, interview_type, scheduled_at, duration_minutes,
                 location, meeting_link, interviewer_id, notes, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $data['application_id'],
                $data['interview_type'] ?? 'phone_screen',
                $data['scheduled_at'],
                $data['duration_minutes'] ?? 60,
                $data['location'] ?? null,
                $data['meeting_link'] ?? null,
                $data['interviewer_id'] ?? $userId,
                $data['notes'] ?? null,
                'scheduled'
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to schedule interview: ' . $e->getMessage());
        }
    }

    public static function updateInterview($id) {
        try {
            Permissions::require('hr.recruitment.manage');
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $updates = [];
            $params = [];

            $allowedFields = [
                'interview_type', 'scheduled_at', 'duration_minutes', 'location',
                'meeting_link', 'interviewer_id', 'notes', 'status', 'feedback',
                'rating', 'recommendation'
            ];

            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }

            if (empty($updates)) {
                return Response::error('No fields to update', 400);
            }

            $params[] = $id;
            $params[] = $workspaceId;

            $stmt = $db->prepare("
                UPDATE interviews 
                SET " . implode(', ', $updates) . "
                WHERE id = ? AND workspace_id = ?
            ");
            $stmt->execute($params);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to update interview: ' . $e->getMessage());
        }
    }

    // ==================== ANALYTICS ====================

    public static function getRecruitmentAnalytics() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            // Overall stats
            $statsStmt = $db->prepare("
                SELECT 
                    (SELECT COUNT(*) FROM job_openings WHERE workspace_id = ? AND status = 'published') as active_jobs,
                    (SELECT COUNT(*) FROM job_applications WHERE workspace_id = ? AND status = 'new') as new_applications,
                    (SELECT COUNT(*) FROM interviews WHERE workspace_id = ? AND status = 'scheduled' AND scheduled_at >= NOW()) as upcoming_interviews,
                    (SELECT COUNT(*) FROM candidates WHERE workspace_id = ?) as total_candidates
            ");
            $statsStmt->execute([$workspaceId, $workspaceId, $workspaceId, $workspaceId]);
            $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

            // Applications by stage
            $stagesStmt = $db->prepare("
                SELECT current_stage, COUNT(*) as count
                FROM job_applications
                WHERE workspace_id = ?
                GROUP BY current_stage
            ");
            $stagesStmt->execute([$workspaceId]);
            $byStage = $stagesStmt->fetchAll(PDO::FETCH_ASSOC);

            // Applications by source
            $sourceStmt = $db->prepare("
                SELECT source, COUNT(*) as count
                FROM job_applications
                WHERE workspace_id = ?
                GROUP BY source
            ");
            $sourceStmt->execute([$workspaceId]);
            $bySource = $sourceStmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json([
                'data' => [
                    'stats' => $stats,
                    'by_stage' => $byStage,
                    'by_source' => $bySource
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to get analytics: ' . $e->getMessage());
        }
    }

    // ==================== HIRING / CONVERSION ====================

    /**
     * Convert candidate to employee (User + Staff Member)
     */
    public static function convertToEmployee($id) {
        try {
            Permissions::require('hr.recruitment.manage');
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['email'])) {
                return Response::error('Email is required for conversion', 400);
            }

            $db->beginTransaction();

            try {
                // 1. Get Candidate
                $stmt = $db->prepare("SELECT * FROM candidates WHERE id = ? AND workspace_id = ?");
                $stmt->execute([$id, $workspaceId]);
                $candidate = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$candidate) {
                    throw new Exception('Candidate not found');
                }

                // 2. Create or Get User Account
                $userStmt = $db->prepare("SELECT id FROM users WHERE email = ?");
                $userStmt->execute([$data['email']]);
                $existingUser = $userStmt->fetch(PDO::FETCH_ASSOC);
                $userId = $existingUser ? $existingUser['id'] : null;

                $isNewUser = false;
                if (!$userId) {
                    $isNewUser = true;
                    $tempPassword = bin2hex(random_bytes(8)); // 16 chars
                    $hashedPassword = password_hash($tempPassword, PASSWORD_DEFAULT);
                    
                    // Simple user creation
                    $insertUser = $db->prepare("
                        INSERT INTO users (name, email, password_hash, created_at) 
                        VALUES (?, ?, ?, NOW())
                    ");
                    $insertUser->execute([
                        $candidate['first_name'] . ' ' . $candidate['last_name'], 
                        $data['email'], 
                        $hashedPassword
                    ]);
                    $userId = $db->lastInsertId();
                    
                    // Assign default role if provided? Skipping for now.
                }

                // 3. Create Staff Member Record
                // Check if already staff
                $staffCheck = $db->prepare("SELECT id FROM staff_members WHERE user_id = ? AND workspace_id = ?");
                $staffCheck->execute([$userId, $workspaceId]);
                $existingStaff = $staffCheck->fetch(PDO::FETCH_ASSOC);

                if ($existingStaff) {
                    // Update existing staff?
                    $staffId = $existingStaff['id'];
                } else {
                    $staffStmt = $db->prepare("
                        INSERT INTO staff_members 
                        (workspace_id, user_id, first_name, last_name, email, phone, title, sort_order)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 0)
                    ");
                    $staffStmt->execute([
                        $workspaceId,
                        $userId,
                        $candidate['first_name'],
                        $candidate['last_name'],
                        $data['email'],
                        $candidate['phone'],
                        $data['job_title'] ?? $candidate['current_title']
                    ]);
                    $staffId = $db->lastInsertId();
                    
                    // Add default availability
                    $availStmt = $db->prepare("
                        INSERT INTO staff_availability (staff_id, day_of_week, start_time, end_time, is_available)
                        VALUES (?, ?, '09:00:00', '17:00:00', 1)
                    ");
                    for ($day = 1; $day <= 5; $day++) {
                        $availStmt->execute([$staffId, $day]);
                    }
                }

                // 4. Update Applications to 'Hired'
                $updateApps = $db->prepare("
                    UPDATE job_applications 
                    SET status = 'hired', current_stage = 'hired', updated_at = NOW() 
                    WHERE candidate_id = ? AND workspace_id = ?
                ");
                $updateApps->execute([$id, $workspaceId]);

                $db->commit();

                return Response::json([
                    'success' => true,
                    'data' => [
                        'user_id' => $userId,
                        'staff_id' => $staffId,
                        'is_new_user' => $isNewUser
                    ]
                ]);

            } catch (Exception $e) {
                $db->rollBack();
                throw $e;
            }
        } catch (Exception $e) {
            return Response::error('Failed to convert candidate: ' . $e->getMessage());
        }
    }
}
