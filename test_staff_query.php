<?php
require_once 'backend/src/Database.php';
try {
    $db = Database::conn();
    $workspaceId = 1; // Assuming workspace 1
    $where = 'AND is_active = 1';
    $sql = "
                SELECT s.*,
                    s.name as full_name,
                    SUBSTRING_INDEX(s.name, ' ', 1) as first_name,
                    CASE WHEN LOCATE(' ', s.name) > 0 THEN SUBSTRING(s.name, LOCATE(' ', s.name) + 1) ELSE '' END as last_name,
                    s.photo_url as avatar_url,
                    (SELECT COUNT(*) FROM staff_services ss WHERE ss.staff_id = s.id) as service_count,
                    (SELECT COUNT(*) FROM appointments a WHERE a.staff_id = s.id AND a.status = 'scheduled' AND a.scheduled_at > NOW()) as upcoming_appointments
                FROM staff_members s
                WHERE s.workspace_id = ? $where
                ORDER BY s.name
            ";
    $stmt = $db->prepare($sql);
    $stmt->execute([$workspaceId]);
    echo "SUCCESS";
} catch (Exception $e) {
    echo $e->getMessage();
}
