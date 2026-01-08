<?php
/**
 * Shift Scheduling Controller
 * Manage employee shifts, schedules, rosters, and availability
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Permissions.php';

class ShiftSchedulingController {
    private static function getWorkspaceId(): int {
        return Permissions::getWorkspaceId();
    }

    private static function getUserId(): int {
        return Permissions::getUserId();
    }

    // ==================== SHIFTS ====================

    public static function getShifts() {
        try {
            $workspaceId = self::getWorkspaceId();
            $currentUserId = self::getUserId();
            $db = Database::conn();

            $where = ['s.workspace_id = ?'];
            $params = [$workspaceId];

            // Self-only for non-managers
            if (!empty($_GET['user_id'])) {
                if (!Permissions::isManager() && (int)$_GET['user_id'] !== $currentUserId) {
                    return Response::error('Unauthorized', 403);
                }
                $where[] = 's.user_id = ?';
                $params[] = (int)$_GET['user_id'];
            } elseif (!Permissions::isManager()) {
                $where[] = 's.user_id = ?';
                $params[] = $currentUserId;
            }

            if (!empty($_GET['start_date'])) {
                $where[] = 's.shift_date >= ?';
                $params[] = $_GET['start_date'];
            }

            if (!empty($_GET['end_date'])) {
                $where[] = 's.shift_date <= ?';
                $params[] = $_GET['end_date'];
            }

            if (!empty($_GET['status'])) {
                $where[] = 's.status = ?';
                $params[] = $_GET['status'];
            }

            $whereClause = implode(' AND ', $where);

            $stmt = $db->prepare("
                SELECT s.*, 
                    u.name as user_name,
                    st.name as shift_type_name,
                    st.color as shift_type_color
                FROM shifts s
                LEFT JOIN users u ON u.id = s.user_id
                LEFT JOIN shift_types st ON st.id = s.shift_type_id
                WHERE $whereClause
                ORDER BY s.shift_date ASC, s.start_time ASC
            ");
            $stmt->execute($params);
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch shifts: ' . $e->getMessage());
        }
    }

    public static function createShift() {
        try {
            Permissions::require('hr.scheduling.manage');
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['user_id']) || empty($data['shift_date']) || empty($data['start_time']) || empty($data['end_time'])) {
                return Response::error('user_id, shift_date, start_time, and end_time required', 400);
            }

            // Check for overlapping shifts
            $overlapStmt = $db->prepare("
                SELECT id FROM shifts 
                WHERE workspace_id = ? AND user_id = ? AND shift_date = ?
                AND status != 'cancelled'
                AND (
                    (start_time <= ? AND end_time > ?) OR
                    (start_time < ? AND end_time >= ?) OR
                    (start_time >= ? AND end_time <= ?)
                )
            ");
            $overlapStmt->execute([
                $workspaceId,
                $data['user_id'],
                $data['shift_date'],
                $data['start_time'], $data['start_time'],
                $data['end_time'], $data['end_time'],
                $data['start_time'], $data['end_time']
            ]);
            
            if ($overlapStmt->fetch()) {
                return Response::error('Shift overlaps with existing shift', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO shifts 
                (workspace_id, user_id, shift_type_id, shift_date, start_time, end_time,
                 break_duration_minutes, location, notes, status, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $data['user_id'],
                $data['shift_type_id'] ?? null,
                $data['shift_date'],
                $data['start_time'],
                $data['end_time'],
                $data['break_duration_minutes'] ?? 0,
                $data['location'] ?? null,
                $data['notes'] ?? null,
                $data['status'] ?? 'scheduled',
                $userId
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to create shift: ' . $e->getMessage());
        }
    }

    public static function updateShift($id) {
        try {
            Permissions::require('hr.scheduling.manage');
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $updates = [];
            $params = [];

            $allowedFields = [
                'user_id', 'shift_type_id', 'shift_date', 'start_time', 'end_time',
                'break_duration_minutes', 'location', 'notes', 'status'
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
                UPDATE shifts 
                SET " . implode(', ', $updates) . "
                WHERE id = ? AND workspace_id = ?
            ");
            $stmt->execute($params);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to update shift: ' . $e->getMessage());
        }
    }

    public static function deleteShift($id) {
        try {
            Permissions::require('hr.scheduling.manage');
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("DELETE FROM shifts WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete shift: ' . $e->getMessage());
        }
    }

    // ==================== SHIFT SWAP REQUESTS ====================

    public static function getShiftSwapRequests() {
        try {
            $workspaceId = self::getWorkspaceId();
            $currentUserId = self::getUserId();
            $db = Database::conn();

            $where = ['ssr.workspace_id = ?'];
            $params = [$workspaceId];

            // Show requests where user is requester or target
            if (!Permissions::isManager()) {
                $where[] = '(s1.user_id = ? OR s2.user_id = ?)';
                $params[] = $currentUserId;
                $params[] = $currentUserId;
            }

            if (!empty($_GET['status'])) {
                $where[] = 'ssr.status = ?';
                $params[] = $_GET['status'];
            }

            $whereClause = implode(' AND ', $where);

            $stmt = $db->prepare("
                SELECT ssr.*, 
                    s1.shift_date as original_shift_date,
                    s1.start_time as original_start_time,
                    s1.end_time as original_end_time,
                    u1.name as requester_name,
                    s2.shift_date as target_shift_date,
                    s2.start_time as target_start_time,
                    s2.end_time as target_end_time,
                    u2.name as target_user_name
                FROM shift_swap_requests ssr
                LEFT JOIN shifts s1 ON s1.id = ssr.original_shift_id
                LEFT JOIN shifts s2 ON s2.id = ssr.target_shift_id
                LEFT JOIN users u1 ON u1.id = s1.user_id
                LEFT JOIN users u2 ON u2.id = s2.user_id
                WHERE $whereClause
                ORDER BY ssr.created_at DESC
            ");
            $stmt->execute($params);
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch swap requests: ' . $e->getMessage());
        }
    }

    public static function createShiftSwapRequest() {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['original_shift_id']) || empty($data['target_shift_id'])) {
                return Response::error('original_shift_id and target_shift_id required', 400);
            }

            // Verify user owns the original shift
            $verifyStmt = $db->prepare("
                SELECT user_id FROM shifts WHERE id = ? AND workspace_id = ?
            ");
            $verifyStmt->execute([$data['original_shift_id'], $workspaceId]);
            $shift = $verifyStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$shift || $shift['user_id'] != $userId) {
                return Response::error('You can only swap your own shifts', 403);
            }

            $stmt = $db->prepare("
                INSERT INTO shift_swap_requests 
                (workspace_id, original_shift_id, target_shift_id, reason, status)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $data['original_shift_id'],
                $data['target_shift_id'],
                $data['reason'] ?? null,
                'pending'
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to create swap request: ' . $e->getMessage());
        }
    }

    public static function respondToSwapRequest($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['action']) || !in_array($data['action'], ['approve', 'reject'])) {
                return Response::error('action must be approve or reject', 400);
            }

            // Get swap request details
            $swapStmt = $db->prepare("
                SELECT ssr.*, s2.user_id as target_user_id
                FROM shift_swap_requests ssr
                LEFT JOIN shifts s2 ON s2.id = ssr.target_shift_id
                WHERE ssr.id = ? AND ssr.workspace_id = ?
            ");
            $swapStmt->execute([$id, $workspaceId]);
            $swap = $swapStmt->fetch(PDO::FETCH_ASSOC);

            if (!$swap) {
                return Response::error('Swap request not found', 404);
            }

            // Verify user is target or manager
            if (!Permissions::isManager() && $swap['target_user_id'] != $userId) {
                return Response::error('Unauthorized', 403);
            }

            if ($data['action'] === 'approve') {
                $db->beginTransaction();
                try {
                    // Swap the user_id on both shifts
                    $stmt1 = $db->prepare("
                        UPDATE shifts SET user_id = (
                            SELECT user_id FROM shifts WHERE id = ?
                        ) WHERE id = ?
                    ");
                    $stmt1->execute([$swap['target_shift_id'], $swap['original_shift_id']]);

                    $stmt2 = $db->prepare("
                        UPDATE shifts SET user_id = (
                            SELECT user_id FROM shifts WHERE id = ?
                        ) WHERE id = ?
                    ");
                    $stmt2->execute([$swap['original_shift_id'], $swap['target_shift_id']]);

                    // Update swap request status
                    $updateStmt = $db->prepare("
                        UPDATE shift_swap_requests 
                        SET status = 'approved', responded_at = NOW(), responded_by = ?
                        WHERE id = ?
                    ");
                    $updateStmt->execute([$userId, $id]);

                    $db->commit();
                } catch (Exception $e) {
                    $db->rollBack();
                    throw $e;
                }
            } else {
                $stmt = $db->prepare("
                    UPDATE shift_swap_requests 
                    SET status = 'rejected', responded_at = NOW(), responded_by = ?, rejection_reason = ?
                    WHERE id = ?
                ");
                $stmt->execute([$userId, $data['reason'] ?? null, $id]);
            }

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to respond to swap request: ' . $e->getMessage());
        }
    }

    // ==================== AVAILABILITY ====================

    public static function getAvailability() {
        try {
            $workspaceId = self::getWorkspaceId();
            $currentUserId = self::getUserId();
            $db = Database::conn();

            $where = ['workspace_id = ?'];
            $params = [$workspaceId];

            if (!empty($_GET['user_id'])) {
                if (!Permissions::isManager() && (int)$_GET['user_id'] !== $currentUserId) {
                    return Response::error('Unauthorized', 403);
                }
                $where[] = 'user_id = ?';
                $params[] = (int)$_GET['user_id'];
            } elseif (!Permissions::isManager()) {
                $where[] = 'user_id = ?';
                $params[] = $currentUserId;
            }

            $whereClause = implode(' AND ', $where);

            $stmt = $db->prepare("
                SELECT a.*, u.name as user_name
                FROM employee_availability a
                LEFT JOIN users u ON u.id = a.user_id
                WHERE $whereClause
                ORDER BY a.day_of_week ASC, a.start_time ASC
            ");
            $stmt->execute($params);
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch availability: ' . $e->getMessage());
        }
    }

    public static function setAvailability() {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (!isset($data['day_of_week']) || empty($data['start_time']) || empty($data['end_time'])) {
                return Response::error('day_of_week, start_time, and end_time required', 400);
            }

            // Allow users to set their own availability or managers to set for others
            $targetUserId = $data['user_id'] ?? $userId;
            if ($targetUserId != $userId && !Permissions::isManager()) {
                return Response::error('Unauthorized', 403);
            }

            $stmt = $db->prepare("
                INSERT INTO employee_availability 
                (workspace_id, user_id, day_of_week, start_time, end_time, is_available)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    start_time = VALUES(start_time),
                    end_time = VALUES(end_time),
                    is_available = VALUES(is_available)
            ");
            $stmt->execute([
                $workspaceId,
                $targetUserId,
                $data['day_of_week'],
                $data['start_time'],
                $data['end_time'],
                $data['is_available'] ?? true
            ]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to set availability: ' . $e->getMessage());
        }
    }

    // ==================== SHIFT TYPES ====================

    public static function getShiftTypes() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT * FROM shift_types 
                WHERE workspace_id = ?
                ORDER BY name ASC
            ");
            $stmt->execute([$workspaceId]);
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch shift types: ' . $e->getMessage());
        }
    }

    public static function createShiftType() {
        try {
            Permissions::require('hr.scheduling.manage');
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['name'])) {
                return Response::error('name required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO shift_types 
                (workspace_id, name, description, color, default_start_time, default_end_time, default_break_minutes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $data['name'],
                $data['description'] ?? null,
                $data['color'] ?? '#3B82F6',
                $data['default_start_time'] ?? null,
                $data['default_end_time'] ?? null,
                $data['default_break_minutes'] ?? 0
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to create shift type: ' . $e->getMessage());
        }
    }

    // ==================== ANALYTICS ====================

    public static function getSchedulingAnalytics() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
            $endDate = $_GET['end_date'] ?? date('Y-m-d');

            // Total scheduled hours
            $hoursStmt = $db->prepare("
                SELECT 
                    SUM(TIMESTAMPDIFF(MINUTE, 
                        CONCAT(shift_date, ' ', start_time), 
                        CONCAT(shift_date, ' ', end_time)
                    ) - break_duration_minutes) / 60 as total_hours,
                    COUNT(*) as total_shifts,
                    COUNT(DISTINCT user_id) as employees_scheduled
                FROM shifts
                WHERE workspace_id = ? 
                AND shift_date BETWEEN ? AND ?
                AND status != 'cancelled'
            ");
            $hoursStmt->execute([$workspaceId, $startDate, $endDate]);
            $stats = $hoursStmt->fetch(PDO::FETCH_ASSOC);

            // By shift type
            $typeStmt = $db->prepare("
                SELECT st.name, COUNT(s.id) as count
                FROM shifts s
                LEFT JOIN shift_types st ON st.id = s.shift_type_id
                WHERE s.workspace_id = ? AND s.shift_date BETWEEN ? AND ?
                GROUP BY s.shift_type_id
            ");
            $typeStmt->execute([$workspaceId, $startDate, $endDate]);
            $byType = $typeStmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json([
                'data' => [
                    'stats' => $stats,
                    'by_type' => $byType
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to get analytics: ' . $e->getMessage());
        }
    }

    // ==================== CONFLICT DETECTION ====================

    /**
     * Validate shift for conflicts before creating
     */
    public static function validateShift() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['user_id']) || empty($data['shift_date']) || empty($data['start_time']) || empty($data['end_time'])) {
                return Response::error('user_id, shift_date, start_time, and end_time required', 400);
            }

            $conflicts = [];

            // Check for approved leave requests
            $leaveStmt = $db->prepare("
                SELECT lr.*, u.name as user_name
                FROM leave_requests lr
                LEFT JOIN users u ON u.id = lr.user_id
                WHERE lr.workspace_id = ? AND lr.user_id = ?
                AND lr.status = 'approved'
                AND ? BETWEEN lr.start_date AND lr.end_date
            ");
            $leaveStmt->execute([$workspaceId, $data['user_id'], $data['shift_date']]);
            $leaveConflicts = $leaveStmt->fetchAll(PDO::FETCH_ASSOC);

            if (!empty($leaveConflicts)) {
                foreach ($leaveConflicts as $leave) {
                    $conflicts[] = [
                        'type' => 'leave',
                        'severity' => 'high',
                        'message' => "Employee has approved {$leave['leave_type']} leave on this date",
                        'details' => $leave
                    ];
                }
            }

            // Check for overlapping shifts
            $overlapStmt = $db->prepare("
                SELECT s.*, u.name as user_name
                FROM shifts s
                LEFT JOIN users u ON u.id = s.user_id
                WHERE s.workspace_id = ? AND s.user_id = ? AND s.shift_date = ?
                AND s.status != 'cancelled'
                AND (
                    (s.start_time <= ? AND s.end_time > ?) OR
                    (s.start_time < ? AND s.end_time >= ?) OR
                    (s.start_time >= ? AND s.end_time <= ?)
                )
            ");
            $overlapStmt->execute([
                $workspaceId,
                $data['user_id'],
                $data['shift_date'],
                $data['start_time'], $data['start_time'],
                $data['end_time'], $data['end_time'],
                $data['start_time'], $data['end_time']
            ]);
            $shiftConflicts = $overlapStmt->fetchAll(PDO::FETCH_ASSOC);

            if (!empty($shiftConflicts)) {
                foreach ($shiftConflicts as $shift) {
                    $conflicts[] = [
                        'type' => 'shift_overlap',
                        'severity' => 'high',
                        'message' => "Shift overlaps with existing shift from {$shift['start_time']} to {$shift['end_time']}",
                        'details' => $shift
                    ];
                }
            }

            // Check employee availability
            $dayOfWeek = date('w', strtotime($data['shift_date'])); // 0 (Sunday) to 6 (Saturday)
            $availStmt = $db->prepare("
                SELECT * FROM employee_availability
                WHERE workspace_id = ? AND user_id = ? AND day_of_week = ?
                AND is_available = 0
            ");
            $availStmt->execute([$workspaceId, $data['user_id'], $dayOfWeek]);
            $unavailable = $availStmt->fetch(PDO::FETCH_ASSOC);

            if ($unavailable) {
                $conflicts[] = [
                    'type' => 'availability',
                    'severity' => 'medium',
                    'message' => "Employee marked as unavailable on this day of week",
                    'details' => $unavailable
                ];
            }

            return Response::json([
                'data' => [
                    'has_conflicts' => !empty($conflicts),
                    'conflicts' => $conflicts,
                    'can_override' => true // Managers can override
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to validate shift: ' . $e->getMessage());
        }
    }

    /**
     * Get all current scheduling conflicts
     */
    public static function getConflicts() {
        try {
            Permissions::require('hr.scheduling.manage');
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $conflicts = [];

            // Find shifts scheduled during approved leave
            $leaveConflictStmt = $db->prepare("
                SELECT 
                    s.id as shift_id,
                    s.shift_date,
                    s.start_time,
                    s.end_time,
                    u.name as employee_name,
                    lr.leave_type,
                    lr.start_date as leave_start,
                    lr.end_date as leave_end,
                    'leave_conflict' as conflict_type
                FROM shifts s
                JOIN leave_requests lr ON lr.user_id = s.user_id AND lr.workspace_id = s.workspace_id
                JOIN users u ON u.id = s.user_id
                WHERE s.workspace_id = ?
                AND s.status != 'cancelled'
                AND lr.status = 'approved'
                AND s.shift_date BETWEEN lr.start_date AND lr.end_date
                AND s.shift_date >= CURDATE()
                ORDER BY s.shift_date ASC
            ");
            $leaveConflictStmt->execute([$workspaceId]);
            $leaveConflicts = $leaveConflictStmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($leaveConflicts as $conflict) {
                $conflicts[] = array_merge($conflict, [
                    'severity' => 'high',
                    'message' => "{$conflict['employee_name']} has approved {$conflict['leave_type']} leave"
                ]);
            }

            return Response::json(['data' => $conflicts]);
        } catch (Exception $e) {
            return Response::error('Failed to get conflicts: ' . $e->getMessage());
        }
    }
}
