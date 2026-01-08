<?php
/**
 * Jobs Controller
 * Field service management - jobs, dispatch, and scheduling
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class JobsController {
    private static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        throw new Exception('Workspace context required');
    }

    private static function getUserId(): ?int {
        try {
            return Auth::userIdOrFail();
        } catch (Exception $e) {
            return null;
        }
    }

    private static function generateJobNumber(PDO $db, int $workspaceId): string {
        $stmt = $db->prepare("SELECT COUNT(*) + 1 FROM jobs WHERE workspace_id = ?");
        $stmt->execute([$workspaceId]);
        $num = $stmt->fetchColumn();
        return 'JOB-' . str_pad($num, 5, '0', STR_PAD_LEFT);
    }

    // ==================== JOB TYPES ====================

    public static function getJobTypes() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT jt.*, 
                    (SELECT COUNT(*) FROM jobs j WHERE j.job_type_id = jt.id) as job_count
                FROM job_types jt
                WHERE jt.workspace_id = ? AND jt.is_active = 1
                ORDER BY jt.sort_order, jt.name
            ");
            $stmt->execute([$workspaceId]);
            $types = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($types as &$t) {
                $t['checklist_template'] = $t['checklist_template'] ? json_decode($t['checklist_template'], true) : null;
            }

            return Response::json(['data' => $types]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch job types: ' . $e->getMessage());
        }
    }

    public static function createJobType() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['name'])) {
                return Response::error('name required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO job_types 
                (workspace_id, name, description, color, default_duration_minutes, default_price,
                 requires_signature, requires_photos, checklist_template, sort_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $workspaceId,
                $data['name'],
                $data['description'] ?? null,
                $data['color'] ?? '#6366f1',
                $data['default_duration_minutes'] ?? 60,
                $data['default_price'] ?? null,
                $data['requires_signature'] ?? 0,
                $data['requires_photos'] ?? 0,
                isset($data['checklist_template']) ? json_encode($data['checklist_template']) : null,
                $data['sort_order'] ?? 0
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to create job type: ' . $e->getMessage());
        }
    }

    public static function updateJobType($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $updates = [];
            $params = [];

            $allowedFields = ['name', 'description', 'color', 'default_duration_minutes', 'default_price',
                'requires_signature', 'requires_photos', 'checklist_template', 'sort_order', 'is_active'];

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[] = "$field = ?";
                    $params[] = $field === 'checklist_template' ? json_encode($data[$field]) : $data[$field];
                }
            }

            if (empty($updates)) {
                return Response::error('No valid fields to update', 400);
            }

            $params[] = $id;
            $params[] = $workspaceId;
            $stmt = $db->prepare("UPDATE job_types SET " . implode(', ', $updates) . " WHERE id = ? AND workspace_id = ?");
            $stmt->execute($params);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to update job type: ' . $e->getMessage());
        }
    }

    public static function deleteJobType($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            // Soft delete by setting inactive
            $stmt = $db->prepare("UPDATE job_types SET is_active = 0 WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete job type: ' . $e->getMessage());
        }
    }

    // ==================== JOBS ====================

    public static function index() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $limit = min((int)($_GET['limit'] ?? 50), 100);
            $offset = (int)($_GET['offset'] ?? 0);

            $where = ['j.workspace_id = ?'];
            $params = [$workspaceId];

            if (!empty($_GET['status'])) {
                $where[] = 'j.status = ?';
                $params[] = $_GET['status'];
            }

            if (!empty($_GET['assigned_to'])) {
                $where[] = 'j.assigned_to = ?';
                $params[] = (int)$_GET['assigned_to'];
            }

            if (!empty($_GET['contact_id'])) {
                $where[] = 'j.contact_id = ?';
                $params[] = (int)$_GET['contact_id'];
            }

            if (!empty($_GET['job_type_id'])) {
                $where[] = 'j.job_type_id = ?';
                $params[] = (int)$_GET['job_type_id'];
            }

            if (!empty($_GET['date'])) {
                $where[] = 'DATE(j.scheduled_start) = ?';
                $params[] = $_GET['date'];
            }

            if (!empty($_GET['from'])) {
                $where[] = 'j.scheduled_start >= ?';
                $params[] = $_GET['from'];
            }

            if (!empty($_GET['to'])) {
                $where[] = 'j.scheduled_start <= ?';
                $params[] = $_GET['to'] . ' 23:59:59';
            }

            $whereClause = implode(' AND ', $where);

            $stmt = $db->prepare("
                SELECT j.*, 
                    jt.name as job_type_name, jt.color as job_type_color,
                    c.first_name as contact_first_name, c.last_name as contact_last_name,
                    CONCAT(s.first_name, ' ', s.last_name) as assigned_name
                FROM jobs j
                LEFT JOIN job_types jt ON jt.id = j.job_type_id
                LEFT JOIN contacts c ON c.id = j.contact_id
                LEFT JOIN staff_members s ON s.id = j.assigned_to
                WHERE $whereClause
                ORDER BY j.scheduled_start DESC
                LIMIT ? OFFSET ?
            ");
            $params[] = $limit;
            $params[] = $offset;
            $stmt->execute($params);
            $jobs = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($jobs as &$job) {
                $job['team_members'] = $job['team_members'] ? json_decode($job['team_members'], true) : null;
            }

            // Get count
            $countParams = array_slice($params, 0, -2);
            $countStmt = $db->prepare("SELECT COUNT(*) FROM jobs j WHERE $whereClause");
            $countStmt->execute($countParams);
            $total = (int)$countStmt->fetchColumn();

            return Response::json([
                'data' => $jobs,
                'meta' => ['total' => $total, 'limit' => $limit, 'offset' => $offset]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch jobs: ' . $e->getMessage());
        }
    }

    public static function show($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT j.*, 
                    jt.name as job_type_name, jt.color as job_type_color,
                    c.first_name as contact_first_name, c.last_name as contact_last_name, c.email as contact_email, c.phone as contact_phone,
                    CONCAT(s.first_name, ' ', s.last_name) as assigned_name
                FROM jobs j
                LEFT JOIN job_types jt ON jt.id = j.job_type_id
                LEFT JOIN contacts c ON c.id = j.contact_id
                LEFT JOIN staff_members s ON s.id = j.assigned_to
                WHERE j.id = ? AND j.workspace_id = ?
            ");
            $stmt->execute([$id, $workspaceId]);
            $job = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$job) {
                return Response::error('Job not found', 404);
            }

            $job['team_members'] = $job['team_members'] ? json_decode($job['team_members'], true) : null;

            // Get items
            $itemsStmt = $db->prepare("SELECT * FROM job_items WHERE job_id = ? ORDER BY sort_order");
            $itemsStmt->execute([$id]);
            $job['items'] = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

            // Get checklist
            $checklistStmt = $db->prepare("SELECT * FROM job_checklist WHERE job_id = ? ORDER BY sort_order");
            $checklistStmt->execute([$id]);
            $job['checklist'] = $checklistStmt->fetchAll(PDO::FETCH_ASSOC);

            // Get photos
            $photosStmt = $db->prepare("SELECT * FROM job_photos WHERE job_id = ? ORDER BY created_at");
            $photosStmt->execute([$id]);
            $job['photos'] = $photosStmt->fetchAll(PDO::FETCH_ASSOC);

            // Get notes
            $notesStmt = $db->prepare("SELECT * FROM job_notes WHERE job_id = ? ORDER BY created_at DESC");
            $notesStmt->execute([$id]);
            $job['notes'] = $notesStmt->fetchAll(PDO::FETCH_ASSOC);

            // Get status history
            $historyStmt = $db->prepare("SELECT * FROM job_status_history WHERE job_id = ? ORDER BY created_at DESC");
            $historyStmt->execute([$id]);
            $job['status_history'] = $historyStmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $job]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch job: ' . $e->getMessage());
        }
    }

    public static function create() {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['title'])) {
                return Response::error('title required', 400);
            }

            $jobNumber = self::generateJobNumber($db, $workspaceId);

            $stmt = $db->prepare("
                INSERT INTO jobs 
                (workspace_id, company_id, contact_id, job_number, job_type_id, title, description,
                 location_type, address_line1, address_line2, city, state, postal_code, country,
                 latitude, longitude, location_notes, scheduled_start, scheduled_end, duration_minutes,
                 assigned_to, team_members, status, priority, estimated_amount, currency,
                 estimate_id, opportunity_id, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $workspaceId,
                $data['company_id'] ?? null,
                $data['contact_id'] ?? null,
                $jobNumber,
                $data['job_type_id'] ?? null,
                $data['title'],
                $data['description'] ?? null,
                $data['location_type'] ?? 'customer',
                $data['address_line1'] ?? null,
                $data['address_line2'] ?? null,
                $data['city'] ?? null,
                $data['state'] ?? null,
                $data['postal_code'] ?? null,
                $data['country'] ?? 'US',
                $data['latitude'] ?? null,
                $data['longitude'] ?? null,
                $data['location_notes'] ?? null,
                $data['scheduled_start'] ?? null,
                $data['scheduled_end'] ?? null,
                $data['duration_minutes'] ?? null,
                $data['assigned_to'] ?? null,
                isset($data['team_members']) ? json_encode($data['team_members']) : null,
                $data['status'] ?? 'pending',
                $data['priority'] ?? 'normal',
                $data['estimated_amount'] ?? null,
                $data['currency'] ?? 'USD',
                $data['estimate_id'] ?? null,
                $data['opportunity_id'] ?? null,
                $userId
            ]);

            $jobId = $db->lastInsertId();

            // Add items if provided
            if (!empty($data['items'])) {
                $itemStmt = $db->prepare("
                    INSERT INTO job_items (job_id, product_id, service_id, name, description, quantity, unit_price, total, sort_order)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                foreach ($data['items'] as $i => $item) {
                    $total = ($item['quantity'] ?? 1) * ($item['unit_price'] ?? 0);
                    $itemStmt->execute([
                        $jobId,
                        $item['product_id'] ?? null,
                        $item['service_id'] ?? null,
                        $item['name'],
                        $item['description'] ?? null,
                        $item['quantity'] ?? 1,
                        $item['unit_price'] ?? 0,
                        $total,
                        $i
                    ]);
                }
            }

            // Add checklist from job type template
            if (!empty($data['job_type_id'])) {
                $typeStmt = $db->prepare("SELECT checklist_template FROM job_types WHERE id = ?");
                $typeStmt->execute([$data['job_type_id']]);
                $template = $typeStmt->fetchColumn();
                if ($template) {
                    $checklist = json_decode($template, true);
                    if (is_array($checklist)) {
                        $checkStmt = $db->prepare("
                            INSERT INTO job_checklist (job_id, title, description, is_required, sort_order)
                            VALUES (?, ?, ?, ?, ?)
                        ");
                        foreach ($checklist as $i => $item) {
                            $checkStmt->execute([
                                $jobId,
                                $item['title'] ?? $item,
                                $item['description'] ?? null,
                                $item['is_required'] ?? 0,
                                $i
                            ]);
                        }
                    }
                }
            }

            // Log status
            $db->prepare("INSERT INTO job_status_history (job_id, new_status, changed_by) VALUES (?, 'pending', ?)")
                ->execute([$jobId, $userId]);

            return Response::json(['data' => ['id' => (int)$jobId, 'job_number' => $jobNumber]]);
        } catch (Exception $e) {
            return Response::error('Failed to create job: ' . $e->getMessage());
        }
    }

    public static function update($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Verify ownership
            $checkStmt = $db->prepare("SELECT id FROM jobs WHERE id = ? AND workspace_id = ?");
            $checkStmt->execute([$id, $workspaceId]);
            if (!$checkStmt->fetch()) {
                return Response::error('Job not found', 404);
            }

            $updates = [];
            $params = [];

            $allowedFields = [
                'company_id', 'contact_id', 'job_type_id', 'title', 'description',
                'location_type', 'address_line1', 'address_line2', 'city', 'state', 'postal_code',
                'country', 'latitude', 'longitude', 'location_notes',
                'scheduled_start', 'scheduled_end', 'duration_minutes',
                'assigned_to', 'team_members', 'priority', 'estimated_amount', 'actual_amount',
                'completion_notes'
            ];

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[] = "$field = ?";
                    $params[] = $field === 'team_members' ? json_encode($data[$field]) : $data[$field];
                }
            }

            if (!empty($updates)) {
                $params[] = $id;
                $stmt = $db->prepare("UPDATE jobs SET " . implode(', ', $updates) . " WHERE id = ?");
                $stmt->execute($params);
            }

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to update job: ' . $e->getMessage());
        }
    }

    public static function updateStatus($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['status'])) {
                return Response::error('status required', 400);
            }

            // Get current status
            $stmt = $db->prepare("SELECT status FROM jobs WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $job = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$job) {
                return Response::error('Job not found', 404);
            }

            $oldStatus = $job['status'];
            $newStatus = $data['status'];

            // Update job
            $updateFields = ['status = ?'];
            $updateParams = [$newStatus];

            // Set timestamps based on status
            switch ($newStatus) {
                case 'in_progress':
                    $updateFields[] = 'actual_start = COALESCE(actual_start, NOW())';
                    break;
                case 'completed':
                    $updateFields[] = 'actual_end = NOW()';
                    break;
            }

            $updateParams[] = $id;
            $db->prepare("UPDATE jobs SET " . implode(', ', $updateFields) . " WHERE id = ?")
                ->execute($updateParams);

            // Log status change
            $db->prepare("
                INSERT INTO job_status_history (job_id, old_status, new_status, changed_by, notes, latitude, longitude)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ")->execute([
                $id,
                $oldStatus,
                $newStatus,
                $userId,
                $data['notes'] ?? null,
                $data['latitude'] ?? null,
                $data['longitude'] ?? null
            ]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to update status: ' . $e->getMessage());
        }
    }

    public static function delete($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("DELETE FROM jobs WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete job: ' . $e->getMessage());
        }
    }

    // ==================== JOB ITEMS ====================

    public static function addItem($jobId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Verify job ownership
            $checkStmt = $db->prepare("SELECT id FROM jobs WHERE id = ? AND workspace_id = ?");
            $checkStmt->execute([$jobId, $workspaceId]);
            if (!$checkStmt->fetch()) {
                return Response::error('Job not found', 404);
            }

            if (empty($data['name'])) {
                return Response::error('name required', 400);
            }

            $total = ($data['quantity'] ?? 1) * ($data['unit_price'] ?? 0);

            $stmt = $db->prepare("
                INSERT INTO job_items (job_id, product_id, service_id, name, description, quantity, unit_price, total, sort_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $jobId,
                $data['product_id'] ?? null,
                $data['service_id'] ?? null,
                $data['name'],
                $data['description'] ?? null,
                $data['quantity'] ?? 1,
                $data['unit_price'] ?? 0,
                $total,
                $data['sort_order'] ?? 0
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to add item: ' . $e->getMessage());
        }
    }

    // ==================== CHECKLIST ====================

    public static function updateChecklist($jobId, $checklistId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Verify job ownership
            $checkStmt = $db->prepare("
                SELECT jc.id FROM job_checklist jc
                JOIN jobs j ON j.id = jc.job_id
                WHERE jc.id = ? AND jc.job_id = ? AND j.workspace_id = ?
            ");
            $checkStmt->execute([$checklistId, $jobId, $workspaceId]);
            if (!$checkStmt->fetch()) {
                return Response::error('Checklist item not found', 404);
            }

            $updates = [];
            $params = [];

            if (isset($data['is_completed'])) {
                $updates[] = 'is_completed = ?';
                $params[] = $data['is_completed'] ? 1 : 0;
                if ($data['is_completed']) {
                    $updates[] = 'completed_at = NOW()';
                    $updates[] = 'completed_by = ?';
                    $params[] = $userId;
                } else {
                    $updates[] = 'completed_at = NULL';
                    $updates[] = 'completed_by = NULL';
                }
            }

            if (isset($data['notes'])) {
                $updates[] = 'notes = ?';
                $params[] = $data['notes'];
            }

            if (!empty($updates)) {
                $params[] = $checklistId;
                $stmt = $db->prepare("UPDATE job_checklist SET " . implode(', ', $updates) . " WHERE id = ?");
                $stmt->execute($params);
            }

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to update checklist: ' . $e->getMessage());
        }
    }

    // ==================== PHOTOS ====================

    public static function addPhoto($jobId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Verify job ownership
            $checkStmt = $db->prepare("SELECT id FROM jobs WHERE id = ? AND workspace_id = ?");
            $checkStmt->execute([$jobId, $workspaceId]);
            if (!$checkStmt->fetch()) {
                return Response::error('Job not found', 404);
            }

            if (empty($data['url'])) {
                return Response::error('url required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO job_photos (job_id, file_id, photo_type, caption, url, thumbnail_url, taken_at, taken_by, latitude, longitude)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $jobId,
                $data['file_id'] ?? null,
                $data['photo_type'] ?? 'other',
                $data['caption'] ?? null,
                $data['url'],
                $data['thumbnail_url'] ?? null,
                $data['taken_at'] ?? date('Y-m-d H:i:s'),
                $userId,
                $data['latitude'] ?? null,
                $data['longitude'] ?? null
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to add photo: ' . $e->getMessage());
        }
    }

    // ==================== NOTES ====================

    public static function addNote($jobId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Verify job ownership
            $checkStmt = $db->prepare("SELECT id FROM jobs WHERE id = ? AND workspace_id = ?");
            $checkStmt->execute([$jobId, $workspaceId]);
            if (!$checkStmt->fetch()) {
                return Response::error('Job not found', 404);
            }

            if (empty($data['content'])) {
                return Response::error('content required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO job_notes (job_id, user_id, content, is_internal)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([
                $jobId,
                $userId,
                $data['content'],
                $data['is_internal'] ?? 1
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to add note: ' . $e->getMessage());
        }
    }

    // ==================== SIGNATURE ====================

    public static function addSignature($jobId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Verify job ownership
            $checkStmt = $db->prepare("SELECT id FROM jobs WHERE id = ? AND workspace_id = ?");
            $checkStmt->execute([$jobId, $workspaceId]);
            if (!$checkStmt->fetch()) {
                return Response::error('Job not found', 404);
            }

            if (empty($data['signature_url']) || empty($data['signed_by'])) {
                return Response::error('signature_url and signed_by required', 400);
            }

            $stmt = $db->prepare("
                UPDATE jobs SET customer_signature_url = ?, signed_by = ?, signed_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$data['signature_url'], $data['signed_by'], $jobId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to add signature: ' . $e->getMessage());
        }
    }

    // ==================== ANALYTICS ====================

    public static function getAnalytics() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $from = $_GET['from'] ?? date('Y-m-d', strtotime('-30 days'));
            $to = $_GET['to'] ?? date('Y-m-d');

            // Summary
            $summaryStmt = $db->prepare("
                SELECT 
                    COUNT(*) as total_jobs,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
                    SUM(CASE WHEN status IN ('pending', 'scheduled', 'dispatched') THEN 1 ELSE 0 END) as pending,
                    SUM(actual_amount) as total_revenue,
                    AVG(TIMESTAMPDIFF(MINUTE, actual_start, actual_end)) as avg_duration_minutes
                FROM jobs
                WHERE workspace_id = ? AND created_at BETWEEN ? AND ?
            ");
            $summaryStmt->execute([$workspaceId, $from, $to . ' 23:59:59']);
            $summary = $summaryStmt->fetch(PDO::FETCH_ASSOC);

            // By status
            $byStatusStmt = $db->prepare("
                SELECT status, COUNT(*) as count
                FROM jobs
                WHERE workspace_id = ? AND created_at BETWEEN ? AND ?
                GROUP BY status
            ");
            $byStatusStmt->execute([$workspaceId, $from, $to . ' 23:59:59']);
            $byStatus = $byStatusStmt->fetchAll(PDO::FETCH_ASSOC);

            // By type
            $byTypeStmt = $db->prepare("
                SELECT jt.name, jt.color, COUNT(*) as count, SUM(j.actual_amount) as revenue
                FROM jobs j
                LEFT JOIN job_types jt ON jt.id = j.job_type_id
                WHERE j.workspace_id = ? AND j.created_at BETWEEN ? AND ?
                GROUP BY j.job_type_id
            ");
            $byTypeStmt->execute([$workspaceId, $from, $to . ' 23:59:59']);
            $byType = $byTypeStmt->fetchAll(PDO::FETCH_ASSOC);

            // By technician
            $byTechStmt = $db->prepare("
                SELECT CONCAT(s.first_name, ' ', s.last_name) as name, COUNT(*) as count, SUM(j.actual_amount) as revenue
                FROM jobs j
                LEFT JOIN staff_members s ON s.id = j.assigned_to
                WHERE j.workspace_id = ? AND j.created_at BETWEEN ? AND ?
                GROUP BY j.assigned_to
                ORDER BY count DESC
                LIMIT 10
            ");
            $byTechStmt->execute([$workspaceId, $from, $to . ' 23:59:59']);
            $byTech = $byTechStmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json([
                'data' => [
                    'summary' => $summary,
                    'by_status' => $byStatus,
                    'by_type' => $byType,
                    'by_technician' => $byTech,
                    'period' => ['from' => $from, 'to' => $to]
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to get analytics: ' . $e->getMessage());
        }
    }
}
