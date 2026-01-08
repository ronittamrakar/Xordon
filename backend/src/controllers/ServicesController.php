<?php
/**
 * Services Controller
 * CRUD for bookable services
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class ServicesController {
    private static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        throw new Exception('Workspace context required');
    }

    /**
     * List all services
     */
    public static function index() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $includeInactive = ($_GET['include_inactive'] ?? '') === 'true';
            $categoryId = $_GET['category_id'] ?? null;
            
            $sql = "
                SELECT s.*, sc.name as category_name,
                       (SELECT COUNT(*) FROM staff_services ss WHERE ss.service_id = s.id) as staff_count
                FROM services s
                LEFT JOIN service_categories sc ON s.category_id = sc.id
                WHERE s.workspace_id = ?
            ";
            $params = [$workspaceId];
            
            if (!$includeInactive) {
                $sql .= " AND s.is_active = 1";
            }
            
            if ($categoryId) {
                $sql .= " AND s.category_id = ?";
                $params[] = $categoryId;
            }
            
            $sql .= " ORDER BY s.name";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return Response::json(['data' => $services]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch services: ' . $e->getMessage());
        }
    }

    /**
     * Get single service
     */
    public static function show($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $stmt = $db->prepare("
                SELECT s.*, sc.name as category_name
                FROM services s
                LEFT JOIN service_categories sc ON s.category_id = sc.id
                WHERE s.id = ? AND s.workspace_id = ?
            ");
            $stmt->execute([$id, $workspaceId]);
            $service = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$service) {
                return Response::error('Service not found', 404);
            }
            
            // Get assigned staff
            $stmt = $db->prepare("
                SELECT sm.*, ss.custom_duration_minutes, ss.custom_price
                FROM staff_members sm
                JOIN staff_services ss ON sm.id = ss.staff_id
                WHERE ss.service_id = ? AND sm.is_active = 1
                ORDER BY sm.sort_order, sm.first_name
            ");
            $stmt->execute([$id]);
            $service['staff'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return Response::json(['data' => $service]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch service: ' . $e->getMessage());
        }
    }

    /**
     * Create service
     */
    public static function store() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['name'])) {
                return Response::error('Name is required', 400);
            }
            
            $stmt = $db->prepare("
                INSERT INTO services 
                (workspace_id, category_id, name, description, price, price_type,
                 duration_minutes, buffer_before_minutes, buffer_after_minutes,
                 requires_confirmation, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $workspaceId,
                $data['category_id'] ?? null,
                $data['name'],
                $data['description'] ?? null,
                $data['price'] ?? null,
                $data['price_type'] ?? 'fixed',
                $data['duration_minutes'] ?? 60,
                $data['buffer_before_minutes'] ?? $data['buffer_before'] ?? 0,
                $data['buffer_after_minutes'] ?? $data['buffer_after'] ?? 0,
                $data['requires_confirmation'] ?? 0,
                $data['is_active'] ?? 1
            ]);
            
            $id = $db->lastInsertId();
            
            // Assign staff if provided
            if (!empty($data['staff_ids'])) {
                self::assignStaff($db, $id, $data['staff_ids']);
            }
            
            return self::show($id);
        } catch (Exception $e) {
            return Response::error('Failed to create service: ' . $e->getMessage());
        }
    }

    /**
     * Update service
     */
    public static function update($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Verify ownership
            $stmt = $db->prepare("SELECT id FROM services WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            if (!$stmt->fetch()) {
                return Response::error('Service not found', 404);
            }
            
            $fields = [];
            $params = [];
            
            $allowedFields = [
                'category_id', 'name', 'description', 'price', 'price_type',
                'duration_minutes', 'buffer_before_minutes', 'buffer_after_minutes',
                'requires_confirmation', 'is_active', 'allow_online_booking', 'currency'
            ];
            
            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $fields[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }
            
            if (empty($fields)) {
                return Response::error('No fields to update', 400);
            }
            
            $params[] = $id;
            $params[] = $workspaceId;
            
            $stmt = $db->prepare("UPDATE services SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?");
            $stmt->execute($params);
            
            // Update staff assignments if provided
            if (isset($data['staff_ids'])) {
                $db->prepare("DELETE FROM staff_services WHERE service_id = ?")->execute([$id]);
                if (!empty($data['staff_ids'])) {
                    self::assignStaff($db, $id, $data['staff_ids']);
                }
            }
            
            return self::show($id);
        } catch (Exception $e) {
            return Response::error('Failed to update service: ' . $e->getMessage());
        }
    }

    /**
     * Delete/archive service
     */
    public static function destroy($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            // Soft delete (set inactive)
            $stmt = $db->prepare("UPDATE services SET is_active = 0 WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            
            if ($stmt->rowCount() === 0) {
                return Response::error('Service not found', 404);
            }
            
            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete service: ' . $e->getMessage());
        }
    }

    /**
     * List service categories
     */
    public static function categories() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            // Note: service_categories uses user_id for scoping in existing schema
            $stmt = $db->prepare("
                SELECT sc.*, 
                       (SELECT COUNT(*) FROM services s WHERE s.category_id = sc.id AND s.is_active = 1) as service_count
                FROM service_categories sc
                WHERE sc.is_active = 1
                ORDER BY sc.sort_order, sc.name
            ");
            $stmt->execute();
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch categories: ' . $e->getMessage());
        }
    }

    /**
     * Create category
     */
    public static function createCategory() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['name'])) {
                return Response::error('Name is required', 400);
            }
            
            // Note: service_categories uses user_id for scoping in existing schema
            $userId = Auth::userIdOrFail();
            $stmt = $db->prepare("
                INSERT INTO service_categories (user_id, name, description, color, icon, sort_order)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $userId,
                $data['name'],
                $data['description'] ?? null,
                $data['color'] ?? '#6366f1',
                $data['icon'] ?? null,
                $data['sort_order'] ?? 0
            ]);
            
            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to create category: ' . $e->getMessage());
        }
    }

    private static function assignStaff(PDO $db, int $serviceId, array $staffIds): void {
        $stmt = $db->prepare("INSERT INTO staff_services (staff_id, service_id) VALUES (?, ?)");
        foreach ($staffIds as $staffId) {
            $stmt->execute([$staffId, $serviceId]);
        }
    }
}
