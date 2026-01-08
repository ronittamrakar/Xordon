<?php

class WebinarsController {
    private static function getTenantId() {
        return $GLOBALS['tenantContext']['tenant_id'] ?? null;
    }

    public static function list() {
        $tenantId = self::getTenantId();
        if (!$tenantId) {
            Response::error('Unauthorized', 401);
            return;
        }

        $db = Database::conn();
        $stmt = $db->prepare("
            SELECT 
                w.*,
                COUNT(DISTINCT wr.id) as registrant_count
            FROM webinars w
            LEFT JOIN webinar_registrants wr ON w.id = wr.webinar_id
            WHERE w.tenant_id = ?
            GROUP BY w.id
            ORDER BY w.created_at DESC
        ");
        $stmt->execute([$tenantId]);
        $webinars = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::json($webinars);
    }

    public static function get($id) {
        $tenantId = self::getTenantId();
        if (!$tenantId) {
            Response::error('Unauthorized', 401);
            return;
        }

        $db = Database::conn();
        $stmt = $db->prepare("
            SELECT 
                w.*,
                COUNT(DISTINCT wr.id) as registrant_count
            FROM webinars w
            LEFT JOIN webinar_registrants wr ON w.id = wr.webinar_id
            WHERE w.id = ? AND w.tenant_id = ?
            GROUP BY w.id
        ");
        $stmt->execute([$id, $tenantId]);
        $webinar = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$webinar) {
            Response::error('Webinar not found', 404);
            return;
        }

        Response::json($webinar);
    }

    public static function create() {
        $tenantId = self::getTenantId();
        if (!$tenantId) {
            Response::error('Unauthorized', 401);
            return;
        }

        $data = Request::body();
        $id = bin2hex(random_bytes(18));

        $db = Database::conn();
        $stmt = $db->prepare("
            INSERT INTO webinars (
                id, tenant_id, title, description, thumbnail, 
                scheduled_at, duration_minutes, status, is_evergreen, max_registrants
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $id,
            $tenantId,
            $data['title'] ?? 'Untitled Webinar',
            $data['description'] ?? null,
            $data['thumbnail'] ?? null,
            $data['scheduled_at'] ?? null,
            $data['duration_minutes'] ?? 60,
            $data['status'] ?? 'draft',
            $data['is_evergreen'] ?? false,
            $data['max_registrants'] ?? null
        ]);

        Response::json(['id' => $id, 'success' => true]);
    }

    public static function update($id) {
        $tenantId = self::getTenantId();
        if (!$tenantId) {
            Response::error('Unauthorized', 401);
            return;
        }

        $data = Request::body();
        $db = Database::conn();

        // Verify ownership
        $stmt = $db->prepare("SELECT id FROM webinars WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$id, $tenantId]);
        if (!$stmt->fetch()) {
            Response::error('Webinar not found', 404);
            return;
        }

        $fields = [];
        $values = [];

        if (isset($data['title'])) {
            $fields[] = 'title = ?';
            $values[] = $data['title'];
        }
        if (isset($data['description'])) {
            $fields[] = 'description = ?';
            $values[] = $data['description'];
        }
        if (isset($data['thumbnail'])) {
            $fields[] = 'thumbnail = ?';
            $values[] = $data['thumbnail'];
        }
        if (isset($data['scheduled_at'])) {
            $fields[] = 'scheduled_at = ?';
            $values[] = $data['scheduled_at'];
        }
        if (isset($data['duration_minutes'])) {
            $fields[] = 'duration_minutes = ?';
            $values[] = $data['duration_minutes'];
        }
        if (isset($data['status'])) {
            $fields[] = 'status = ?';
            $values[] = $data['status'];
        }
        if (isset($data['is_evergreen'])) {
            $fields[] = 'is_evergreen = ?';
            $values[] = $data['is_evergreen'];
        }
        if (isset($data['max_registrants'])) {
            $fields[] = 'max_registrants = ?';
            $values[] = $data['max_registrants'];
        }

        if (empty($fields)) {
            Response::json(['success' => true]);
            return;
        }

        $values[] = $id;
        $values[] = $tenantId;

        $sql = "UPDATE webinars SET " . implode(', ', $fields) . " WHERE id = ? AND tenant_id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($values);

        Response::json(['success' => true]);
    }

    public static function delete($id) {
        $tenantId = self::getTenantId();
        if (!$tenantId) {
            Response::error('Unauthorized', 401);
            return;
        }

        $db = Database::conn();
        $stmt = $db->prepare("DELETE FROM webinars WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$id, $tenantId]);

        Response::json(['success' => true]);
    }

    public static function listRegistrants($webinarId) {
        $tenantId = self::getTenantId();
        if (!$tenantId) {
            Response::error('Unauthorized', 401);
            return;
        }

        $db = Database::conn();
        
        // Verify webinar ownership
        $stmt = $db->prepare("SELECT id FROM webinars WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$webinarId, $tenantId]);
        if (!$stmt->fetch()) {
            Response::error('Webinar not found', 404);
            return;
        }

        $stmt = $db->prepare("
            SELECT * FROM webinar_registrants 
            WHERE webinar_id = ? 
            ORDER BY created_at DESC
        ");
        $stmt->execute([$webinarId]);
        $registrants = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::json($registrants);
    }

    public static function removeRegistrant($webinarId, $registrantId) {
        $tenantId = self::getTenantId();
        if (!$tenantId) {
            Response::error('Unauthorized', 401);
            return;
        }

        $db = Database::conn();
        
        // Verify webinar ownership
        $stmt = $db->prepare("SELECT id FROM webinars WHERE id = ? AND tenant_id = ?");
        $stmt->execute([$webinarId, $tenantId]);
        if (!$stmt->fetch()) {
            Response::error('Webinar not found', 404);
            return;
        }

        $stmt = $db->prepare("DELETE FROM webinar_registrants WHERE id = ? AND webinar_id = ?");
        $stmt->execute([$registrantId, $webinarId]);

        Response::json(['success' => true]);
    }
}
