<?php
/**
 * Custom Fields Controller
 * Universal custom fields for contacts, opportunities, jobs, invoices, etc.
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class CustomFieldsController {
    private static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        throw new Exception('Workspace context required');
    }

    /**
     * List custom field definitions for an entity type
     */
    public static function getDefinitions() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $entityType = $_GET['entity_type'] ?? null;

            $where = ['workspace_id = ?', 'is_active = 1'];
            $params = [$workspaceId];

            if ($entityType) {
                $where[] = 'entity_type = ?';
                $params[] = $entityType;
            }

            $whereClause = implode(' AND ', $where);

            $stmt = $db->prepare("
                SELECT * FROM custom_field_definitions 
                WHERE $whereClause 
                ORDER BY entity_type, sort_order, field_label
            ");
            $stmt->execute($params);
            $fields = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($fields as &$f) {
                $f['options'] = $f['options'] ? json_decode($f['options'], true) : null;
            }

            return Response::json(['data' => $fields]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch field definitions: ' . $e->getMessage());
        }
    }

    /**
     * Create custom field definition
     */
    public static function createDefinition() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['entity_type']) || empty($data['field_key']) || empty($data['field_label']) || empty($data['field_type'])) {
                return Response::error('entity_type, field_key, field_label, and field_type required', 400);
            }

            // Validate field_key format
            if (!preg_match('/^[a-z][a-z0-9_]*$/', $data['field_key'])) {
                return Response::error('field_key must be snake_case starting with a letter', 400);
            }

            // Check for duplicate
            $checkStmt = $db->prepare("
                SELECT id FROM custom_field_definitions 
                WHERE workspace_id = ? AND entity_type = ? AND field_key = ?
            ");
            $checkStmt->execute([$workspaceId, $data['entity_type'], $data['field_key']]);
            if ($checkStmt->fetch()) {
                return Response::error('Field key already exists for this entity type', 400);
            }

            // Get next sort order
            $orderStmt = $db->prepare("
                SELECT COALESCE(MAX(sort_order), 0) + 1 
                FROM custom_field_definitions 
                WHERE workspace_id = ? AND entity_type = ?
            ");
            $orderStmt->execute([$workspaceId, $data['entity_type']]);
            $sortOrder = (int)$orderStmt->fetchColumn();

            $stmt = $db->prepare("
                INSERT INTO custom_field_definitions 
                (workspace_id, entity_type, field_key, field_label, field_type, options,
                 is_required, default_value, placeholder, help_text, validation_regex,
                 min_value, max_value, max_length, sort_order, field_group, 
                 show_in_list, show_in_filters)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $workspaceId,
                $data['entity_type'],
                $data['field_key'],
                $data['field_label'],
                $data['field_type'],
                isset($data['options']) ? json_encode($data['options']) : null,
                $data['is_required'] ?? 0,
                $data['default_value'] ?? null,
                $data['placeholder'] ?? null,
                $data['help_text'] ?? null,
                $data['validation_regex'] ?? null,
                $data['min_value'] ?? null,
                $data['max_value'] ?? null,
                $data['max_length'] ?? null,
                $data['sort_order'] ?? $sortOrder,
                $data['field_group'] ?? null,
                $data['show_in_list'] ?? 0,
                $data['show_in_filters'] ?? 0
            ]);

            $id = $db->lastInsertId();

            return Response::json(['data' => ['id' => (int)$id]]);
        } catch (Exception $e) {
            return Response::error('Failed to create field: ' . $e->getMessage());
        }
    }

    /**
     * Update custom field definition
     */
    public static function updateDefinition($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Verify ownership and not system field
            $checkStmt = $db->prepare("
                SELECT is_system FROM custom_field_definitions 
                WHERE id = ? AND workspace_id = ?
            ");
            $checkStmt->execute([$id, $workspaceId]);
            $field = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if (!$field) {
                return Response::error('Field not found', 404);
            }

            if ($field['is_system']) {
                return Response::error('Cannot modify system fields', 400);
            }

            $updates = [];
            $params = [];

            $allowedFields = [
                'field_label', 'options', 'is_required', 'default_value', 'placeholder',
                'help_text', 'validation_regex', 'min_value', 'max_value', 'max_length',
                'sort_order', 'field_group', 'show_in_list', 'show_in_filters', 'is_active'
            ];

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[] = "$field = ?";
                    if ($field === 'options') {
                        $params[] = is_array($data[$field]) ? json_encode($data[$field]) : $data[$field];
                    } else {
                        $params[] = $data[$field];
                    }
                }
            }

            if (empty($updates)) {
                return Response::error('No valid fields to update', 400);
            }

            $params[] = $id;
            $stmt = $db->prepare("UPDATE custom_field_definitions SET " . implode(', ', $updates) . " WHERE id = ?");
            $stmt->execute($params);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to update field: ' . $e->getMessage());
        }
    }

    /**
     * Delete custom field definition
     */
    public static function deleteDefinition($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            // Verify ownership and not system field
            $checkStmt = $db->prepare("
                SELECT is_system FROM custom_field_definitions 
                WHERE id = ? AND workspace_id = ?
            ");
            $checkStmt->execute([$id, $workspaceId]);
            $field = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if (!$field) {
                return Response::error('Field not found', 404);
            }

            if ($field['is_system']) {
                return Response::error('Cannot delete system fields', 400);
            }

            // Delete field and all values (cascade)
            $stmt = $db->prepare("DELETE FROM custom_field_definitions WHERE id = ?");
            $stmt->execute([$id]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete field: ' . $e->getMessage());
        }
    }

    /**
     * Reorder custom fields
     */
    public static function reorderDefinitions() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['field_ids']) || !is_array($data['field_ids'])) {
                return Response::error('field_ids array required', 400);
            }

            $stmt = $db->prepare("
                UPDATE custom_field_definitions SET sort_order = ? 
                WHERE id = ? AND workspace_id = ?
            ");

            foreach ($data['field_ids'] as $order => $fieldId) {
                $stmt->execute([$order, $fieldId, $workspaceId]);
            }

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to reorder fields: ' . $e->getMessage());
        }
    }

    /**
     * Get custom field values for an entity
     */
    public static function getValues($entityType, $entityId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT 
                    cfd.id as field_id,
                    cfd.field_key,
                    cfd.field_label,
                    cfd.field_type,
                    cfd.options,
                    cfv.value_text,
                    cfv.value_number,
                    cfv.value_date,
                    cfv.value_datetime,
                    cfv.value_boolean,
                    cfv.value_json
                FROM custom_field_definitions cfd
                LEFT JOIN custom_field_values cfv ON cfv.field_id = cfd.id 
                    AND cfv.entity_type = ? AND cfv.entity_id = ?
                WHERE cfd.workspace_id = ? AND cfd.entity_type = ? AND cfd.is_active = 1
                ORDER BY cfd.sort_order
            ");
            $stmt->execute([$entityType, $entityId, $workspaceId, $entityType]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $values = [];
            foreach ($rows as $row) {
                $value = self::extractValue($row);
                $values[$row['field_key']] = [
                    'field_id' => (int)$row['field_id'],
                    'field_key' => $row['field_key'],
                    'field_label' => $row['field_label'],
                    'field_type' => $row['field_type'],
                    'options' => $row['options'] ? json_decode($row['options'], true) : null,
                    'value' => $value
                ];
            }

            return Response::json(['data' => $values]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch values: ' . $e->getMessage());
        }
    }

    /**
     * Set custom field values for an entity
     */
    public static function setValues($entityType, $entityId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['values']) || !is_array($data['values'])) {
                return Response::error('values object required', 400);
            }

            // Get field definitions
            $stmt = $db->prepare("
                SELECT id, field_key, field_type 
                FROM custom_field_definitions 
                WHERE workspace_id = ? AND entity_type = ? AND is_active = 1
            ");
            $stmt->execute([$workspaceId, $entityType]);
            $fields = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $fields[$row['field_key']] = $row;
            }

            // Upsert values
            $upsertStmt = $db->prepare("
                INSERT INTO custom_field_values 
                (workspace_id, field_id, entity_type, entity_id, value_text, value_number, value_date, value_datetime, value_boolean, value_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    value_text = VALUES(value_text),
                    value_number = VALUES(value_number),
                    value_date = VALUES(value_date),
                    value_datetime = VALUES(value_datetime),
                    value_boolean = VALUES(value_boolean),
                    value_json = VALUES(value_json)
            ");

            foreach ($data['values'] as $fieldKey => $value) {
                if (!isset($fields[$fieldKey])) {
                    continue; // Skip unknown fields
                }

                $field = $fields[$fieldKey];
                $valueParams = self::prepareValueParams($field['field_type'], $value);

                $upsertStmt->execute([
                    $workspaceId,
                    $field['id'],
                    $entityType,
                    $entityId,
                    $valueParams['text'],
                    $valueParams['number'],
                    $valueParams['date'],
                    $valueParams['datetime'],
                    $valueParams['boolean'],
                    $valueParams['json']
                ]);
            }

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to set values: ' . $e->getMessage());
        }
    }

    /**
     * Extract value from row based on field type
     */
    private static function extractValue(array $row) {
        switch ($row['field_type']) {
            case 'number':
            case 'decimal':
            case 'currency':
                return $row['value_number'] !== null ? (float)$row['value_number'] : null;
            case 'date':
                return $row['value_date'];
            case 'datetime':
                return $row['value_datetime'];
            case 'boolean':
                return $row['value_boolean'] !== null ? (bool)$row['value_boolean'] : null;
            case 'multiselect':
            case 'file':
                return $row['value_json'] ? json_decode($row['value_json'], true) : null;
            default:
                return $row['value_text'];
        }
    }

    /**
     * Prepare value parameters for insert/update
     */
    private static function prepareValueParams(string $fieldType, $value): array {
        $params = [
            'text' => null,
            'number' => null,
            'date' => null,
            'datetime' => null,
            'boolean' => null,
            'json' => null
        ];

        if ($value === null || $value === '') {
            return $params;
        }

        switch ($fieldType) {
            case 'number':
            case 'decimal':
            case 'currency':
                $params['number'] = is_numeric($value) ? (float)$value : null;
                break;
            case 'date':
                $params['date'] = $value;
                break;
            case 'datetime':
                $params['datetime'] = $value;
                break;
            case 'boolean':
                $params['boolean'] = $value ? 1 : 0;
                break;
            case 'multiselect':
            case 'file':
                $params['json'] = is_array($value) ? json_encode($value) : $value;
                break;
            default:
                $params['text'] = (string)$value;
        }

        return $params;
    }

    // ==================== TAGS ====================

    /**
     * List tags
     */
    public static function getTags() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $entityType = $_GET['entity_type'] ?? null;

            $stmt = $db->prepare("
                SELECT t.*, 
                    (SELECT COUNT(*) FROM entity_tags et WHERE et.tag_id = t.id) as usage_count
                FROM tags t
                WHERE t.workspace_id = ?
                ORDER BY t.name
            ");
            $stmt->execute([$workspaceId]);
            $tags = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($tags as &$t) {
                $t['entity_types'] = $t['entity_types'] ? json_decode($t['entity_types'], true) : null;
            }

            // Filter by entity type if specified
            if ($entityType) {
                $tags = array_filter($tags, function($t) use ($entityType) {
                    return $t['entity_types'] === null || in_array($entityType, $t['entity_types']);
                });
                $tags = array_values($tags);
            }

            return Response::json(['data' => $tags]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch tags: ' . $e->getMessage());
        }
    }

    /**
     * Create tag
     */
    public static function createTag() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['name'])) {
                return Response::error('name required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO tags (workspace_id, name, color, description, entity_types)
                VALUES (?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $workspaceId,
                $data['name'],
                $data['color'] ?? '#6366f1',
                $data['description'] ?? null,
                isset($data['entity_types']) ? json_encode($data['entity_types']) : null
            ]);

            $id = $db->lastInsertId();

            return Response::json(['data' => ['id' => (int)$id]]);
        } catch (Exception $e) {
            if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
                return Response::error('Tag name already exists', 400);
            }
            return Response::error('Failed to create tag: ' . $e->getMessage());
        }
    }

    /**
     * Update tag
     */
    public static function updateTag($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $updates = [];
            $params = [];

            if (isset($data['name'])) {
                $updates[] = 'name = ?';
                $params[] = $data['name'];
            }
            if (isset($data['color'])) {
                $updates[] = 'color = ?';
                $params[] = $data['color'];
            }
            if (isset($data['description'])) {
                $updates[] = 'description = ?';
                $params[] = $data['description'];
            }
            if (array_key_exists('entity_types', $data)) {
                $updates[] = 'entity_types = ?';
                $params[] = $data['entity_types'] ? json_encode($data['entity_types']) : null;
            }

            if (empty($updates)) {
                return Response::error('No valid fields to update', 400);
            }

            $params[] = $id;
            $params[] = $workspaceId;
            $stmt = $db->prepare("UPDATE tags SET " . implode(', ', $updates) . " WHERE id = ? AND workspace_id = ?");
            $stmt->execute($params);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to update tag: ' . $e->getMessage());
        }
    }

    /**
     * Delete tag
     */
    public static function deleteTag($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("DELETE FROM tags WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete tag: ' . $e->getMessage());
        }
    }

    /**
     * Get tags for an entity
     */
    public static function getEntityTags($entityType, $entityId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT t.* FROM tags t
                JOIN entity_tags et ON et.tag_id = t.id
                WHERE et.workspace_id = ? AND et.entity_type = ? AND et.entity_id = ?
                ORDER BY t.name
            ");
            $stmt->execute([$workspaceId, $entityType, $entityId]);
            $tags = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $tags]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch entity tags: ' . $e->getMessage());
        }
    }

    /**
     * Set tags for an entity
     */
    public static function setEntityTags($entityType, $entityId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (!isset($data['tag_ids']) || !is_array($data['tag_ids'])) {
                return Response::error('tag_ids array required', 400);
            }

            // Remove existing tags
            $deleteStmt = $db->prepare("
                DELETE FROM entity_tags 
                WHERE workspace_id = ? AND entity_type = ? AND entity_id = ?
            ");
            $deleteStmt->execute([$workspaceId, $entityType, $entityId]);

            // Add new tags
            if (!empty($data['tag_ids'])) {
                $insertStmt = $db->prepare("
                    INSERT INTO entity_tags (workspace_id, tag_id, entity_type, entity_id, created_by)
                    VALUES (?, ?, ?, ?, ?)
                ");

                foreach ($data['tag_ids'] as $tagId) {
                    $insertStmt->execute([$workspaceId, $tagId, $entityType, $entityId, $userId]);
                }
            }

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to set entity tags: ' . $e->getMessage());
        }
    }

    /**
     * Add tag to entity
     */
    public static function addEntityTag($entityType, $entityId, $tagId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = Auth::userIdOrFail();
            $db = Database::conn();

            $stmt = $db->prepare("
                INSERT IGNORE INTO entity_tags (workspace_id, tag_id, entity_type, entity_id, created_by)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([$workspaceId, $tagId, $entityType, $entityId, $userId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to add tag: ' . $e->getMessage());
        }
    }

    /**
     * Remove tag from entity
     */
    public static function removeEntityTag($entityType, $entityId, $tagId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                DELETE FROM entity_tags 
                WHERE workspace_id = ? AND tag_id = ? AND entity_type = ? AND entity_id = ?
            ");
            $stmt->execute([$workspaceId, $tagId, $entityType, $entityId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to remove tag: ' . $e->getMessage());
        }
    }
}
