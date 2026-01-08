<?php
/**
 * Time Tracking Controller
 * Employee time tracking, timesheets, and attendance
 * 
 * SCOPING: Workspace-scoped with self-only defaults
 * - Members see only their own data
 * - Managers/Admins can view all + approve
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Permissions.php';

class TimeTrackingController {
    private static function getWorkspaceId(): int {
        return Permissions::getWorkspaceId();
    }

    private static function getUserId(): int {
        return Permissions::getUserId();
    }

    /**
     * Filter user_id for HR data access
     * Members can only see their own data; managers+ can see all
     */
    private static function filterUserId(?int $requestedUserId = null): int {
        return Permissions::filterUserIdParam($requestedUserId);
    }

    // ==================== TIME ENTRIES ====================

    public static function getTimeEntries() {
        try {
            $workspaceId = self::getWorkspaceId();
            $currentUserId = self::getUserId();
            $db = Database::conn();

            $limit = min((int)($_GET['limit'] ?? 50), 100);
            $offset = (int)($_GET['offset'] ?? 0);

            $where = ['te.workspace_id = ?'];
            $params = [$workspaceId];

            // Self-only default: members can only see their own entries
            // Managers+ can view all or filter by user_id
            if (!empty($_GET['user_id'])) {
                $filteredUserId = self::filterUserId((int)$_GET['user_id']);
                $where[] = 'te.user_id = ?';
                $params[] = $filteredUserId;
            } elseif (!Permissions::isManager()) {
                // Non-managers default to self-only
                $where[] = 'te.user_id = ?';
                $params[] = $currentUserId;
            }

            if (!empty($_GET['status'])) {
                $where[] = 'te.status = ?';
                $params[] = $_GET['status'];
            }

            if (!empty($_GET['from'])) {
                $where[] = 'te.start_time >= ?';
                $params[] = $_GET['from'];
            }

            if (!empty($_GET['to'])) {
                $where[] = 'te.start_time <= ?';
                $params[] = $_GET['to'] . ' 23:59:59';
            }

            $whereClause = implode(' AND ', $where);

            $stmt = $db->prepare("
                SELECT te.*, u.name as user_name, j.title as job_title
                FROM time_entries te
                LEFT JOIN users u ON u.id = te.user_id
                LEFT JOIN jobs j ON j.id = te.job_id
                WHERE $whereClause
                ORDER BY te.start_time DESC
                LIMIT ? OFFSET ?
            ");
            $params[] = $limit;
            $params[] = $offset;
            $stmt->execute($params);
            $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $countParams = array_slice($params, 0, -2);
            $countStmt = $db->prepare("SELECT COUNT(*) FROM time_entries te WHERE $whereClause");
            $countStmt->execute($countParams);
            $total = (int)$countStmt->fetchColumn();

            return Response::json([
                'data' => $entries,
                'meta' => ['total' => $total, 'limit' => $limit, 'offset' => $offset]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch time entries: ' . $e->getMessage());
        }
    }

    public static function startTimer() {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Check for running timer
            $runningStmt = $db->prepare("
                SELECT id FROM time_entries 
                WHERE user_id = ? AND status = 'running'
            ");
            $runningStmt->execute([$userId]);
            if ($runningStmt->fetch()) {
                return Response::error('You already have a running timer', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO time_entries 
                (workspace_id, user_id, job_id, project_id, task_description, start_time,
                 is_billable, hourly_rate, start_latitude, start_longitude, notes)
                VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $userId,
                $data['job_id'] ?? null,
                $data['project_id'] ?? null,
                $data['task_description'] ?? null,
                $data['is_billable'] ?? 1,
                $data['hourly_rate'] ?? null,
                $data['latitude'] ?? null,
                $data['longitude'] ?? null,
                $data['notes'] ?? null
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to start timer: ' . $e->getMessage());
        }
    }

    public static function stopTimer($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Get entry
            $stmt = $db->prepare("
                SELECT * FROM time_entries 
                WHERE id = ? AND workspace_id = ? AND user_id = ? AND status = 'running'
            ");
            $stmt->execute([$id, $workspaceId, $userId]);
            $entry = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$entry) {
                return Response::error('Timer not found or not running', 404);
            }

            // Calculate duration
            $startTime = strtotime($entry['start_time']);
            $endTime = time();
            $durationMinutes = round(($endTime - $startTime) / 60) - ($entry['break_minutes'] ?? 0);

            // Calculate amount
            $totalAmount = null;
            if ($entry['hourly_rate'] && $entry['is_billable']) {
                $totalAmount = ($durationMinutes / 60) * $entry['hourly_rate'];
            }

            $updateStmt = $db->prepare("
                UPDATE time_entries 
                SET end_time = NOW(), duration_minutes = ?, total_amount = ?, status = 'completed',
                    end_latitude = ?, end_longitude = ?
                WHERE id = ?
            ");
            $updateStmt->execute([
                $durationMinutes,
                $totalAmount,
                $data['latitude'] ?? null,
                $data['longitude'] ?? null,
                $id
            ]);

            return Response::json(['data' => ['duration_minutes' => $durationMinutes, 'total_amount' => $totalAmount]]);
        } catch (Exception $e) {
            return Response::error('Failed to stop timer: ' . $e->getMessage());
        }
    }

    public static function createManualEntry() {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['start_time']) || empty($data['end_time'])) {
                return Response::error('start_time and end_time required', 400);
            }

            $startTime = strtotime($data['start_time']);
            $endTime = strtotime($data['end_time']);
            $durationMinutes = round(($endTime - $startTime) / 60) - ($data['break_minutes'] ?? 0);

            $totalAmount = null;
            if (!empty($data['hourly_rate']) && ($data['is_billable'] ?? true)) {
                $totalAmount = ($durationMinutes / 60) * $data['hourly_rate'];
            }

            $stmt = $db->prepare("
                INSERT INTO time_entries 
                (workspace_id, user_id, job_id, project_id, task_description, start_time, end_time,
                 duration_minutes, break_minutes, is_billable, hourly_rate, total_amount, status, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)
            ");
            $stmt->execute([
                $workspaceId,
                $data['user_id'] ?? $userId,
                $data['job_id'] ?? null,
                $data['project_id'] ?? null,
                $data['task_description'] ?? null,
                $data['start_time'],
                $data['end_time'],
                $durationMinutes,
                $data['break_minutes'] ?? 0,
                $data['is_billable'] ?? 1,
                $data['hourly_rate'] ?? null,
                $totalAmount,
                $data['notes'] ?? null
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to create entry: ' . $e->getMessage());
        }
    }

    public static function approveEntry($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Only managers+ can approve
            Permissions::require('hr.time.approve');

            $action = $data['action'] ?? 'approve';

            if ($action === 'approve') {
                $stmt = $db->prepare("
                    UPDATE time_entries SET status = 'approved', approved_by = ?, approved_at = NOW()
                    WHERE id = ? AND workspace_id = ? AND status = 'completed'
                ");
                $stmt->execute([$userId, $id, $workspaceId]);
            } else {
                $stmt = $db->prepare("
                    UPDATE time_entries SET status = 'rejected', approved_by = ?, approved_at = NOW(), rejection_reason = ?
                    WHERE id = ? AND workspace_id = ? AND status = 'completed'
                ");
                $stmt->execute([$userId, $data['reason'] ?? null, $id, $workspaceId]);
            }

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to approve entry: ' . $e->getMessage());
        }
    }

    // ==================== CLOCK IN/OUT ====================

    public static function clockIn() {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $stmt = $db->prepare("
                INSERT INTO clock_records 
                (workspace_id, user_id, clock_type, clock_time, latitude, longitude, location_name, device_type, ip_address, photo_url, notes)
                VALUES (?, ?, 'clock_in', NOW(), ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $userId,
                $data['latitude'] ?? null,
                $data['longitude'] ?? null,
                $data['location_name'] ?? null,
                $data['device_type'] ?? null,
                $_SERVER['REMOTE_ADDR'] ?? null,
                $data['photo_url'] ?? null,
                $data['notes'] ?? null
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId(), 'clock_time' => date('Y-m-d H:i:s')]]);
        } catch (Exception $e) {
            return Response::error('Failed to clock in: ' . $e->getMessage());
        }
    }

    public static function clockOut() {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $stmt = $db->prepare("
                INSERT INTO clock_records 
                (workspace_id, user_id, clock_type, clock_time, latitude, longitude, location_name, device_type, ip_address, notes)
                VALUES (?, ?, 'clock_out', NOW(), ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $userId,
                $data['latitude'] ?? null,
                $data['longitude'] ?? null,
                $data['location_name'] ?? null,
                $data['device_type'] ?? null,
                $_SERVER['REMOTE_ADDR'] ?? null,
                $data['notes'] ?? null
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId(), 'clock_time' => date('Y-m-d H:i:s')]]);
        } catch (Exception $e) {
            return Response::error('Failed to clock out: ' . $e->getMessage());
        }
    }

    public static function getClockStatus() {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT * FROM clock_records 
                WHERE workspace_id = ? AND user_id = ? AND DATE(clock_time) = CURDATE()
                ORDER BY clock_time DESC
            ");
            $stmt->execute([$workspaceId, $userId]);
            $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $lastRecord = $records[0] ?? null;
            $isClockedIn = $lastRecord && $lastRecord['clock_type'] === 'clock_in';

            return Response::json([
                'data' => [
                    'is_clocked_in' => $isClockedIn,
                    'last_record' => $lastRecord,
                    'today_records' => $records
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to get clock status: ' . $e->getMessage());
        }
    }

    // ==================== TIMESHEETS ====================

    public static function getTimesheets() {
        try {
            $workspaceId = self::getWorkspaceId();
            $currentUserId = self::getUserId();
            $db = Database::conn();

            $where = ['ts.workspace_id = ?'];
            $params = [$workspaceId];

            // Self-only default for non-managers
            if (!empty($_GET['user_id'])) {
                $filteredUserId = self::filterUserId((int)$_GET['user_id']);
                $where[] = 'ts.user_id = ?';
                $params[] = $filteredUserId;
            } elseif (!Permissions::isManager()) {
                $where[] = 'ts.user_id = ?';
                $params[] = $currentUserId;
            }

            if (!empty($_GET['status'])) {
                $where[] = 'ts.status = ?';
                $params[] = $_GET['status'];
            }

            $whereClause = implode(' AND ', $where);

            $stmt = $db->prepare("
                SELECT ts.*, u.name as user_name
                FROM timesheets ts
                LEFT JOIN users u ON u.id = ts.user_id
                WHERE $whereClause
                ORDER BY ts.period_start DESC
            ");
            $stmt->execute($params);
            $timesheets = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $timesheets]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch timesheets: ' . $e->getMessage());
        }
    }

    public static function submitTimesheet($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();

            $stmt = $db->prepare("
                UPDATE timesheets SET status = 'submitted', submitted_at = NOW()
                WHERE id = ? AND workspace_id = ? AND user_id = ? AND status = 'draft'
            ");
            $stmt->execute([$id, $workspaceId, $userId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to submit timesheet: ' . $e->getMessage());
        }
    }

    public static function approveTimesheet($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Only managers+ can approve
            Permissions::require('hr.time.approve');

            $action = $data['action'] ?? 'approve';

            if ($action === 'approve') {
                $stmt = $db->prepare("
                    UPDATE timesheets SET status = 'approved', approved_by = ?, approved_at = NOW(), manager_notes = ?
                    WHERE id = ? AND workspace_id = ? AND status = 'submitted'
                ");
                $stmt->execute([$userId, $data['notes'] ?? null, $id, $workspaceId]);
            } else {
                $stmt = $db->prepare("
                    UPDATE timesheets SET status = 'rejected', approved_by = ?, approved_at = NOW(), rejection_reason = ?, manager_notes = ?
                    WHERE id = ? AND workspace_id = ? AND status = 'submitted'
                ");
                $stmt->execute([$userId, $data['reason'] ?? null, $data['notes'] ?? null, $id, $workspaceId]);
            }

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to approve timesheet: ' . $e->getMessage());
        }
    }

    // ==================== LEAVE REQUESTS ====================

    public static function getLeaveRequests() {
        try {
            $workspaceId = self::getWorkspaceId();
            $currentUserId = self::getUserId();
            $db = Database::conn();

            $where = ['lr.workspace_id = ?'];
            $params = [$workspaceId];

            // Self-only default for non-managers
            if (!empty($_GET['user_id'])) {
                $filteredUserId = self::filterUserId((int)$_GET['user_id']);
                $where[] = 'lr.user_id = ?';
                $params[] = $filteredUserId;
            } elseif (!Permissions::isManager()) {
                $where[] = 'lr.user_id = ?';
                $params[] = $currentUserId;
            }

            if (!empty($_GET['status'])) {
                $where[] = 'lr.status = ?';
                $params[] = $_GET['status'];
            }

            $whereClause = implode(' AND ', $where);

            $stmt = $db->prepare("
                SELECT lr.*, u.name as user_name
                FROM leave_requests lr
                LEFT JOIN users u ON u.id = lr.user_id
                WHERE $whereClause
                ORDER BY lr.start_date DESC
            ");
            $stmt->execute($params);
            $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $requests]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch leave requests: ' . $e->getMessage());
        }
    }

    public static function createLeaveRequest() {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['leave_type']) || empty($data['start_date']) || empty($data['end_date'])) {
                return Response::error('leave_type, start_date, and end_date required', 400);
            }

            // Calculate hours
            $startDate = new DateTime($data['start_date']);
            $endDate = new DateTime($data['end_date']);
            $days = $startDate->diff($endDate)->days + 1;
            $totalHours = $days * 8; // Assuming 8-hour workdays

            if (!empty($data['is_half_day'])) {
                $totalHours = 4;
            }

            $stmt = $db->prepare("
                INSERT INTO leave_requests 
                (workspace_id, user_id, leave_type, start_date, end_date, is_half_day, half_day_type, total_hours, reason)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $userId,
                $data['leave_type'],
                $data['start_date'],
                $data['end_date'],
                $data['is_half_day'] ?? 0,
                $data['half_day_type'] ?? null,
                $totalHours,
                $data['reason'] ?? null
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to create leave request: ' . $e->getMessage());
        }
    }

    public static function approveLeaveRequest($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Only managers+ can approve
            Permissions::require('hr.leave.approve');

            $action = $data['action'] ?? 'approve';

            if ($action === 'approve') {
                $stmt = $db->prepare("
                    UPDATE leave_requests SET status = 'approved', approved_by = ?, approved_at = NOW(), manager_notes = ?
                    WHERE id = ? AND workspace_id = ? AND status = 'pending'
                ");
                $stmt->execute([$userId, $data['notes'] ?? null, $id, $workspaceId]);

                // Update leave balance
                $requestStmt = $db->prepare("SELECT * FROM leave_requests WHERE id = ?");
                $requestStmt->execute([$id]);
                $request = $requestStmt->fetch(PDO::FETCH_ASSOC);

                if ($request) {
                    $year = date('Y', strtotime($request['start_date']));
                    $balanceField = $request['leave_type'] . '_used';
                    
                    $db->prepare("
                        INSERT INTO leave_balances (workspace_id, user_id, year, {$balanceField})
                        VALUES (?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE {$balanceField} = {$balanceField} + ?
                    ")->execute([$workspaceId, $request['user_id'], $year, $request['total_hours'], $request['total_hours']]);
                }
            } else {
                $stmt = $db->prepare("
                    UPDATE leave_requests SET status = 'rejected', approved_by = ?, approved_at = NOW(), rejection_reason = ?, manager_notes = ?
                    WHERE id = ? AND workspace_id = ? AND status = 'pending'
                ");
                $stmt->execute([$userId, $data['reason'] ?? null, $data['notes'] ?? null, $id, $workspaceId]);
            }

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to approve leave request: ' . $e->getMessage());
        }
    }

    public static function getLeaveBalances() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            // Filter user_id for self-only access
            $requestedUserId = !empty($_GET['user_id']) ? (int)$_GET['user_id'] : null;
            $userId = self::filterUserId($requestedUserId);
            $year = $_GET['year'] ?? date('Y');

            $stmt = $db->prepare("
                SELECT * FROM leave_balances
                WHERE workspace_id = ? AND user_id = ? AND year = ?
            ");
            $stmt->execute([$workspaceId, $userId, $year]);
            $balance = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$balance) {
                $balance = [
                    'vacation_balance' => 0,
                    'vacation_used' => 0,
                    'sick_balance' => 0,
                    'sick_used' => 0,
                    'personal_balance' => 0,
                    'personal_used' => 0
                ];
            }

            return Response::json(['data' => $balance]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch leave balances: ' . $e->getMessage());
        }
    }

    public static function processAccruals($params = null) {
        try {
            $db = Database::conn();
            
            // If params provided (from CLI), use them, otherwise get from request
            if ($params === null) {
                $workspaceId = self::getWorkspaceId();
                $data = json_decode(file_get_contents('php://input'), true) ?? [];
                $userIds = $data['user_ids'] ?? null;
                $year = $data['year'] ?? date('Y');
                $dryRun = $data['dry_run'] ?? false;
            } else {
                $workspaceId = $params['workspace_id'];
                $userIds = $params['user_ids'] ?? null;
                $year = $params['year'] ?? date('Y');
                $dryRun = $params['dry_run'] ?? false;
            }

            // Get HR settings for leave
            $stmt = $db->prepare("SELECT settings_value FROM module_settings WHERE workspace_id = ? AND module_key = 'hr.leave'");
            $stmt->execute([$workspaceId]);
            $settingsJson = $stmt->fetchColumn();
            $settings = $settingsJson ? json_decode($settingsJson, true) : [];

            if (empty($settings) || !($settings['accrual_enabled'] ?? false)) {
                return Response::json(['success' => true, 'message' => 'Accruals are disabled']);
            }

            $vacationRate = (float)($settings['vacation_accrual_rate'] ?? 0);
            $sickRate = (float)($settings['sick_accrual_rate'] ?? 0);

            // Build user query
            $query = "SELECT id FROM users WHERE workspace_id = ? AND status = 'active'";
            $queryParams = [$workspaceId];

            if ($userIds !== null) {
                if (!is_array($userIds)) $userIds = [$userIds];
                if (!empty($userIds)) {
                    $placeholders = implode(',', array_fill(0, count($userIds), '?'));
                    $query .= " AND id IN ($placeholders)";
                    $queryParams = array_merge($queryParams, $userIds);
                }
            }

            $stmt = $db->prepare($query);
            $stmt->execute($queryParams);
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $processed = 0;
            $results = [];

            foreach ($users as $user) {
                $userId = $user['id'];

                if (!$dryRun) {
                    // Check if balance record exists for this year
                    $stmt = $db->prepare("SELECT id FROM leave_balances WHERE user_id = ? AND year = ?");
                    $stmt->execute([$userId, $year]);
                    $balanceId = $stmt->fetchColumn();

                    if ($balanceId) {
                        $stmt = $db->prepare("
                            UPDATE leave_balances 
                            SET vacation_balance = vacation_balance + ?,
                                vacation_accrued = vacation_accrued + ?,
                                sick_balance = sick_balance + ?,
                                sick_accrued = sick_accrued + ?
                            WHERE id = ?
                        ");
                        $stmt->execute([$vacationRate, $vacationRate, $sickRate, $sickRate, $balanceId]);
                    } else {
                        $stmt = $db->prepare("
                            INSERT INTO leave_balances (workspace_id, user_id, year, vacation_balance, vacation_accrued, sick_balance, sick_accrued)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        ");
                        $stmt->execute([$workspaceId, $userId, $year, $vacationRate, $vacationRate, $sickRate, $sickRate]);
                    }
                }
                $processed++;
                $results[] = ['user_id' => $userId, 'status' => $dryRun ? 'simulated' : 'processed'];
            }

            return Response::json([
                'success' => true, 
                'message' => ($dryRun ? "Simulated" : "Processed") . " accruals for $processed employees",
                'details' => [
                    'vacation_rate' => $vacationRate,
                    'sick_rate' => $sickRate,
                    'processed_count' => $processed,
                    'results' => $results
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to process accruals: ' . $e->getMessage());
        }
    }

    // ==================== ANALYTICS ====================

    public static function getAnalytics() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $from = $_GET['from'] ?? date('Y-m-d', strtotime('-30 days'));
            $to = $_GET['to'] ?? date('Y-m-d');

            // Time summary
            $timeSummary = $db->prepare("
                SELECT 
                    COUNT(*) as total_entries,
                    SUM(duration_minutes) as total_minutes,
                    SUM(CASE WHEN is_billable = 1 THEN duration_minutes ELSE 0 END) as billable_minutes,
                    SUM(total_amount) as total_amount
                FROM time_entries
                WHERE workspace_id = ? AND start_time BETWEEN ? AND ?
            ");
            $timeSummary->execute([$workspaceId, $from, $to . ' 23:59:59']);
            $time = $timeSummary->fetch(PDO::FETCH_ASSOC);

            // By user
            $byUserStmt = $db->prepare("
                SELECT u.name, SUM(te.duration_minutes) as minutes, SUM(te.total_amount) as amount
                FROM time_entries te
                LEFT JOIN users u ON u.id = te.user_id
                WHERE te.workspace_id = ? AND te.start_time BETWEEN ? AND ?
                GROUP BY te.user_id
                ORDER BY minutes DESC
            ");
            $byUserStmt->execute([$workspaceId, $from, $to . ' 23:59:59']);
            $byUser = $byUserStmt->fetchAll(PDO::FETCH_ASSOC);

            // Leave summary
            $leaveSummary = $db->prepare("
                SELECT 
                    leave_type,
                    COUNT(*) as count,
                    SUM(total_hours) as total_hours
                FROM leave_requests
                WHERE workspace_id = ? AND status = 'approved' AND start_date BETWEEN ? AND ?
                GROUP BY leave_type
            ");
            $leaveSummary->execute([$workspaceId, $from, $to]);
            $leave = $leaveSummary->fetchAll(PDO::FETCH_ASSOC);

            return Response::json([
                'data' => [
                    'time' => $time,
                    'by_user' => $byUser,
                    'leave' => $leave,
                    'period' => ['from' => $from, 'to' => $to]
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to get analytics: ' . $e->getMessage());
        }
    }
}
