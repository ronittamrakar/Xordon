<?php
/**
 * Sales Enablement Controller
 * 
 * Handles API endpoints for:
 * - Sales Content Library
 * - Sales Playbooks
 * - Deal Rooms
 * - Battle Cards
 * - Sales Training
 * - Sales Snippets
 * - Enablement Analytics
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Auth.php';

class SalesEnablementController {
    
    // ============================================
    // WORKSPACE SCOPING (Multi-tenant support)
    // ============================================
    
    private static function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'workspace_id', 'val' => Auth::userIdOrFail()];
    }
    
    private static function getCompanyId(): ?int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        return $ctx->activeCompanyId ?? null;
    }
    
    // ============================================
    // SALES CONTENT LIBRARY
    // ============================================
    
    /**
     * GET /sales-enablement/content
     * List content with filters
     */
    public static function listContent(): void {
        try {
            $scope = self::getWorkspaceScope();
            $companyId = self::getCompanyId();
            $db = Database::getConnection();
            
            // Filters
            $type = $_GET['type'] ?? null;
            $search = $_GET['search'] ?? null;
            $stage = $_GET['stage'] ?? null;
            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
            $offset = ($page - 1) * $limit;
            
            $whereConditions = ["{$scope['col']} = ?"];
            $params = [$scope['val']];
            
            if ($companyId) {
                $whereConditions[] = "(company_id = ? OR company_id IS NULL)";
                $params[] = $companyId;
            }
            
            $whereConditions[] = "is_active = 1";
            
            if ($type) {
                $whereConditions[] = "content_type = ?";
                $params[] = $type;
            }
            
            if ($search) {
                $whereConditions[] = "(title LIKE ? OR description LIKE ?)";
                $params[] = "%$search%";
                $params[] = "%$search%";
            }
            
            if ($stage) {
                $whereConditions[] = "JSON_CONTAINS(sales_stages, ?)";
                $params[] = json_encode($stage);
            }
            
            $whereClause = implode(' AND ', $whereConditions);
            
            // Get total count
            $countStmt = $db->prepare("SELECT COUNT(*) as total FROM sales_content WHERE $whereClause");
            $countStmt->execute($params);
            $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // Get content
            $params[] = $limit;
            $params[] = $offset;
            
            $stmt = $db->prepare("
                SELECT 
                    id, title, description, content_type, file_path, file_size, mime_type,
                    external_url, thumbnail_path, buyer_personas, sales_stages, industries,
                    products, tags, version, created_by, created_at, updated_at
                FROM sales_content 
                WHERE $whereClause
                ORDER BY updated_at DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute($params);
            $content = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Parse JSON fields
            foreach ($content as &$item) {
                $item['buyer_personas'] = json_decode($item['buyer_personas'] ?? '[]', true);
                $item['sales_stages'] = json_decode($item['sales_stages'] ?? '[]', true);
                $item['industries'] = json_decode($item['industries'] ?? '[]', true);
                $item['products'] = json_decode($item['products'] ?? '[]', true);
                $item['tags'] = json_decode($item['tags'] ?? '[]', true);
            }
            
            http_response_code(200);
            echo json_encode([
                'content' => $content,
                'pagination' => [
                    'total' => (int)$total,
                    'page' => $page,
                    'limit' => $limit,
                    'total_pages' => ceil($total / $limit)
                ]
            ]);
        } catch (Exception $e) {
            error_log("Error listing content: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to list content']);
        }
    }
    
    /**
     * POST /sales-enablement/content
     * Create new content
     */
    public static function createContent(): void {
        try {
            $scope = self::getWorkspaceScope();
            $companyId = self::getCompanyId();
            $db = Database::getConnection();
            $userId = Auth::userIdOrFail();
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['title'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Title is required']);
                return;
            }
            
            $stmt = $db->prepare("
                INSERT INTO sales_content (
                    workspace_id, company_id, title, description, content_type,
                    file_path, file_size, mime_type, external_url, thumbnail_path,
                    buyer_personas, sales_stages, industries, products, tags,
                    created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $scope['val'],
                $companyId,
                $data['title'],
                $data['description'] ?? null,
                $data['content_type'] ?? 'document',
                $data['file_path'] ?? null,
                $data['file_size'] ?? null,
                $data['mime_type'] ?? null,
                $data['external_url'] ?? null,
                $data['thumbnail_path'] ?? null,
                json_encode($data['buyer_personas'] ?? []),
                json_encode($data['sales_stages'] ?? []),
                json_encode($data['industries'] ?? []),
                json_encode($data['products'] ?? []),
                json_encode($data['tags'] ?? []),
                $userId
            ]);
            
            $contentId = $db->lastInsertId();
            
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'content_id' => (int)$contentId
            ]);
        } catch (Exception $e) {
            error_log("Error creating content: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create content']);
        }
    }
    
    /**
     * GET /sales-enablement/content/:id
     * Get content details
     */
    public static function getContent(int $id): void {
        try {
            $scope = self::getWorkspaceScope();
            $db = Database::getConnection();
            
            $stmt = $db->prepare("
                SELECT * FROM sales_content 
                WHERE id = ? AND {$scope['col']} = ?
            ");
            $stmt->execute([$id, $scope['val']]);
            $content = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$content) {
                http_response_code(404);
                echo json_encode(['error' => 'Content not found']);
                return;
            }
            
            // Parse JSON fields
            $content['buyer_personas'] = json_decode($content['buyer_personas'] ?? '[]', true);
            $content['sales_stages'] = json_decode($content['sales_stages'] ?? '[]', true);
            $content['industries'] = json_decode($content['industries'] ?? '[]', true);
            $content['products'] = json_decode($content['products'] ?? '[]', true);
            $content['tags'] = json_decode($content['tags'] ?? '[]', true);
            
            // Get usage stats
            $statsStmt = $db->prepare("
                SELECT action, COUNT(*) as count
                FROM sales_content_analytics
                WHERE content_id = ?
                GROUP BY action
            ");
            $statsStmt->execute([$id]);
            $stats = $statsStmt->fetchAll(PDO::FETCH_KEY_PAIR);
            
            $content['analytics'] = [
                'views' => (int)($stats['view'] ?? 0),
                'downloads' => (int)($stats['download'] ?? 0),
                'shares' => (int)($stats['share'] ?? 0)
            ];
            
            http_response_code(200);
            echo json_encode($content);
        } catch (Exception $e) {
            error_log("Error getting content: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to get content']);
        }
    }
    
    /**
     * PUT /sales-enablement/content/:id
     * Update content
     */
    public static function updateContent(int $id): void {
        try {
            $scope = self::getWorkspaceScope();
            $db = Database::getConnection();
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Build update query dynamically
            $updates = [];
            $params = [];
            
            $allowedFields = [
                'title', 'description', 'content_type', 'file_path', 'file_size',
                'mime_type', 'external_url', 'thumbnail_path', 'is_active'
            ];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }
            
            // JSON fields
            $jsonFields = ['buyer_personas', 'sales_stages', 'industries', 'products', 'tags'];
            foreach ($jsonFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = json_encode($data[$field]);
                }
            }
            
            if (empty($updates)) {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
                return;
            }
            
            // Increment version on update
            $updates[] = "version = version + 1";
            
            $params[] = $id;
            $params[] = $scope['val'];
            
            $updateClause = implode(', ', $updates);
            $stmt = $db->prepare("
                UPDATE sales_content 
                SET $updateClause
                WHERE id = ? AND {$scope['col']} = ?
            ");
            $stmt->execute($params);
            
            http_response_code(200);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            error_log("Error updating content: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update content']);
        }
    }
    
    /**
     * DELETE /sales-enablement/content/:id
     * Soft delete content
     */
    public static function deleteContent(int $id): void {
        try {
            $scope = self::getWorkspaceScope();
            $db = Database::getConnection();
            
            $stmt = $db->prepare("
                UPDATE sales_content 
                SET is_active = 0
                WHERE id = ? AND {$scope['col']} = ?
            ");
            $stmt->execute([$id, $scope['val']]);
            
            http_response_code(200);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            error_log("Error deleting content: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete content']);
        }
    }
    
    /**
     * POST /sales-enablement/content/:id/track
     * Track content engagement
     */
    public static function trackContentEngagement(int $id): void {
        try {
            $db = Database::getConnection();
            $userId = Auth::userId();
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            $action = $data['action'] ?? 'view';
            $leadId = $data['lead_id'] ?? null;
            $context = $data['context'] ?? null;
            
            $stmt = $db->prepare("
                INSERT INTO sales_content_analytics (content_id, user_id, lead_id, action, context)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $id,
                $userId,
                $leadId,
                $action,
                $context ? json_encode($context) : null
            ]);
            
            http_response_code(201);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            error_log("Error tracking content: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to track content']);
        }
    }
    
    // ============================================
    // SALES PLAYBOOKS
    // ============================================
    
    /**
     * GET /sales-enablement/playbooks
     * List playbooks
     */
    public static function listPlaybooks(): void {
        try {
            $scope = self::getWorkspaceScope();
            $companyId = self::getCompanyId();
            $db = Database::getConnection();
            
            $category = $_GET['category'] ?? null;
            $published = isset($_GET['published']) ? (bool)$_GET['published'] : null;
            
            $whereConditions = ["{$scope['col']} = ?", "is_active = 1"];
            $params = [$scope['val']];
            
            if ($companyId) {
                $whereConditions[] = "(company_id = ? OR company_id IS NULL)";
                $params[] = $companyId;
            }
            
            if ($category) {
                $whereConditions[] = "category = ?";
                $params[] = $category;
            }
            
            if ($published !== null) {
                $whereConditions[] = "is_published = ?";
                $params[] = $published ? 1 : 0;
            }
            
            $whereClause = implode(' AND ', $whereConditions);
            
            $stmt = $db->prepare("
                SELECT 
                    p.*,
                    (SELECT COUNT(*) FROM playbook_sections WHERE playbook_id = p.id) as section_count
                FROM sales_playbooks p
                WHERE $whereClause
                ORDER BY p.updated_at DESC
            ");
            $stmt->execute($params);
            $playbooks = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($playbooks as &$playbook) {
                $playbook['target_persona'] = json_decode($playbook['target_persona'] ?? '[]', true);
                $playbook['applicable_stages'] = json_decode($playbook['applicable_stages'] ?? '[]', true);
            }
            
            http_response_code(200);
            echo json_encode(['playbooks' => $playbooks]);
        } catch (Exception $e) {
            error_log("Error listing playbooks: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to list playbooks']);
        }
    }
    
    /**
     * POST /sales-enablement/playbooks
     * Create playbook
     */
    public static function createPlaybook(): void {
        try {
            $scope = self::getWorkspaceScope();
            $companyId = self::getCompanyId();
            $db = Database::getConnection();
            $userId = Auth::userIdOrFail();
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['name'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Name is required']);
                return;
            }
            
            $db->beginTransaction();
            
            try {
                $stmt = $db->prepare("
                    INSERT INTO sales_playbooks (
                        workspace_id, company_id, name, description, category,
                        target_persona, applicable_stages, is_published, created_by
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                
                $stmt->execute([
                    $scope['val'],
                    $companyId,
                    $data['name'],
                    $data['description'] ?? null,
                    $data['category'] ?? null,
                    json_encode($data['target_persona'] ?? []),
                    json_encode($data['applicable_stages'] ?? []),
                    $data['is_published'] ?? false,
                    $userId
                ]);
                
                $playbookId = $db->lastInsertId();
                
                // Create default sections if requested
                if (!empty($data['create_default_sections'])) {
                    $defaultSections = [
                        ['section_type' => 'overview', 'title' => 'Overview', 'order_index' => 0],
                        ['section_type' => 'discovery', 'title' => 'Discovery Questions', 'order_index' => 1],
                        ['section_type' => 'objections', 'title' => 'Objection Handling', 'order_index' => 2],
                        ['section_type' => 'scripts', 'title' => 'Talk Tracks', 'order_index' => 3],
                        ['section_type' => 'resources', 'title' => 'Resources', 'order_index' => 4],
                    ];
                    
                    $sectionStmt = $db->prepare("
                        INSERT INTO playbook_sections (playbook_id, section_type, title, order_index)
                        VALUES (?, ?, ?, ?)
                    ");
                    
                    foreach ($defaultSections as $section) {
                        $sectionStmt->execute([
                            $playbookId,
                            $section['section_type'],
                            $section['title'],
                            $section['order_index']
                        ]);
                    }
                }
                
                $db->commit();
                
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'playbook_id' => (int)$playbookId
                ]);
            } catch (Exception $e) {
                $db->rollBack();
                throw $e;
            }
        } catch (Exception $e) {
            error_log("Error creating playbook: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create playbook']);
        }
    }
    
    /**
     * GET /sales-enablement/playbooks/:id
     * Get playbook with sections
     */
    public static function getPlaybook(int $id): void {
        try {
            $scope = self::getWorkspaceScope();
            $db = Database::getConnection();
            
            $stmt = $db->prepare("
                SELECT * FROM sales_playbooks 
                WHERE id = ? AND {$scope['col']} = ?
            ");
            $stmt->execute([$id, $scope['val']]);
            $playbook = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$playbook) {
                http_response_code(404);
                echo json_encode(['error' => 'Playbook not found']);
                return;
            }
            
            $playbook['target_persona'] = json_decode($playbook['target_persona'] ?? '[]', true);
            $playbook['applicable_stages'] = json_decode($playbook['applicable_stages'] ?? '[]', true);
            
            // Get sections
            $sectionsStmt = $db->prepare("
                SELECT * FROM playbook_sections
                WHERE playbook_id = ?
                ORDER BY order_index ASC
            ");
            $sectionsStmt->execute([$id]);
            $playbook['sections'] = $sectionsStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get resources
            $resourcesStmt = $db->prepare("
                SELECT * FROM playbook_resources
                WHERE playbook_id = ?
            ");
            $resourcesStmt->execute([$id]);
            $playbook['resources'] = $resourcesStmt->fetchAll(PDO::FETCH_ASSOC);
            
            http_response_code(200);
            echo json_encode($playbook);
        } catch (Exception $e) {
            error_log("Error getting playbook: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to get playbook']);
        }
    }
    
    /**
     * PUT /sales-enablement/playbooks/:id
     * Update playbook
     */
    public static function updatePlaybook(int $id): void {
        try {
            $scope = self::getWorkspaceScope();
            $db = Database::getConnection();
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            $updates = [];
            $params = [];
            
            $allowedFields = ['name', 'description', 'category', 'is_published'];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }
            
            $jsonFields = ['target_persona', 'applicable_stages'];
            foreach ($jsonFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = json_encode($data[$field]);
                }
            }
            
            if (empty($updates)) {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
                return;
            }
            
            $params[] = $id;
            $params[] = $scope['val'];
            
            $updateClause = implode(', ', $updates);
            $stmt = $db->prepare("
                UPDATE sales_playbooks 
                SET $updateClause
                WHERE id = ? AND {$scope['col']} = ?
            ");
            $stmt->execute($params);
            
            http_response_code(200);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            error_log("Error updating playbook: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update playbook']);
        }
    }
    
    /**
     * POST /sales-enablement/playbooks/:id/sections
     * Add section to playbook
     */
    public static function addPlaybookSection(int $playbookId): void {
        try {
            $scope = self::getWorkspaceScope();
            $db = Database::getConnection();
            
            // Verify playbook ownership
            $checkStmt = $db->prepare("
                SELECT id FROM sales_playbooks 
                WHERE id = ? AND {$scope['col']} = ?
            ");
            $checkStmt->execute([$playbookId, $scope['val']]);
            if (!$checkStmt->fetch()) {
                http_response_code(404);
                echo json_encode(['error' => 'Playbook not found']);
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['title'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Title is required']);
                return;
            }
            
            // Get max order index
            $orderStmt = $db->prepare("
                SELECT COALESCE(MAX(order_index), -1) + 1 as next_order
                FROM playbook_sections WHERE playbook_id = ?
            ");
            $orderStmt->execute([$playbookId]);
            $nextOrder = $orderStmt->fetch(PDO::FETCH_ASSOC)['next_order'];
            
            $stmt = $db->prepare("
                INSERT INTO playbook_sections (playbook_id, section_type, title, content, order_index)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $playbookId,
                $data['section_type'] ?? 'custom',
                $data['title'],
                $data['content'] ?? null,
                $data['order_index'] ?? $nextOrder
            ]);
            
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'section_id' => (int)$db->lastInsertId()
            ]);
        } catch (Exception $e) {
            error_log("Error adding section: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to add section']);
        }
    }
    
    /**
     * PUT /sales-enablement/playbooks/:id/sections/:sectionId
     * Update playbook section
     */
    public static function updatePlaybookSection(int $playbookId, int $sectionId): void {
        try {
            $scope = self::getWorkspaceScope();
            $db = Database::getConnection();
            
            // Verify playbook ownership
            $checkStmt = $db->prepare("
                SELECT id FROM sales_playbooks 
                WHERE id = ? AND {$scope['col']} = ?
            ");
            $checkStmt->execute([$playbookId, $scope['val']]);
            if (!$checkStmt->fetch()) {
                http_response_code(404);
                echo json_encode(['error' => 'Playbook not found']);
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            $updates = [];
            $params = [];
            
            $allowedFields = ['section_type', 'title', 'content', 'order_index'];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }
            
            if (empty($updates)) {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
                return;
            }
            
            $params[] = $sectionId;
            $params[] = $playbookId;
            
            $updateClause = implode(', ', $updates);
            $stmt = $db->prepare("
                UPDATE playbook_sections 
                SET $updateClause
                WHERE id = ? AND playbook_id = ?
            ");
            $stmt->execute($params);
            
            http_response_code(200);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            error_log("Error updating section: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update section']);
        }
    }
    
    // ============================================
    // SALES SNIPPETS
    // ============================================
    
    /**
     * GET /sales-enablement/snippets
     * List snippets
     */
    public static function listSnippets(): void {
        try {
            $scope = self::getWorkspaceScope();
            $companyId = self::getCompanyId();
            $db = Database::getConnection();
            
            $type = $_GET['type'] ?? null;
            $category = $_GET['category'] ?? null;
            $search = $_GET['search'] ?? null;
            
            $whereConditions = ["{$scope['col']} = ?"];
            $params = [$scope['val']];
            
            if ($companyId) {
                $whereConditions[] = "(company_id = ? OR company_id IS NULL)";
                $params[] = $companyId;
            }
            
            if ($type) {
                $whereConditions[] = "snippet_type = ?";
                $params[] = $type;
            }
            
            if ($category) {
                $whereConditions[] = "category = ?";
                $params[] = $category;
            }
            
            if ($search) {
                $whereConditions[] = "(name LIKE ? OR content LIKE ? OR shortcut LIKE ?)";
                $params[] = "%$search%";
                $params[] = "%$search%";
                $params[] = "%$search%";
            }
            
            $whereClause = implode(' AND ', $whereConditions);
            
            $stmt = $db->prepare("
                SELECT * FROM sales_snippets
                WHERE $whereClause
                ORDER BY use_count DESC, name ASC
            ");
            $stmt->execute($params);
            $snippets = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($snippets as &$snippet) {
                $snippet['variables'] = json_decode($snippet['variables'] ?? '[]', true);
            }
            
            http_response_code(200);
            echo json_encode(['snippets' => $snippets]);
        } catch (Exception $e) {
            error_log("Error listing snippets: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to list snippets']);
        }
    }
    
    /**
     * POST /sales-enablement/snippets
     * Create snippet
     */
    public static function createSnippet(): void {
        try {
            $scope = self::getWorkspaceScope();
            $companyId = self::getCompanyId();
            $db = Database::getConnection();
            $userId = Auth::userIdOrFail();
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['name']) || empty($data['content'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Name and content are required']);
                return;
            }
            
            $stmt = $db->prepare("
                INSERT INTO sales_snippets (
                    workspace_id, company_id, snippet_type, name, shortcut,
                    content, variables, category, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $scope['val'],
                $companyId,
                $data['snippet_type'] ?? 'email',
                $data['name'],
                $data['shortcut'] ?? null,
                $data['content'],
                json_encode($data['variables'] ?? []),
                $data['category'] ?? null,
                $userId
            ]);
            
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'snippet_id' => (int)$db->lastInsertId()
            ]);
        } catch (Exception $e) {
            error_log("Error creating snippet: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create snippet']);
        }
    }
    
    /**
     * PUT /sales-enablement/snippets/:id
     * Update snippet
     */
    public static function updateSnippet(int $id): void {
        try {
            $scope = self::getWorkspaceScope();
            $db = Database::getConnection();
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            $updates = [];
            $params = [];
            
            $allowedFields = ['snippet_type', 'name', 'shortcut', 'content', 'category'];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }
            
            if (isset($data['variables'])) {
                $updates[] = "variables = ?";
                $params[] = json_encode($data['variables']);
            }
            
            if (empty($updates)) {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
                return;
            }
            
            $params[] = $id;
            $params[] = $scope['val'];
            
            $updateClause = implode(', ', $updates);
            $stmt = $db->prepare("
                UPDATE sales_snippets 
                SET $updateClause
                WHERE id = ? AND {$scope['col']} = ?
            ");
            $stmt->execute($params);
            
            http_response_code(200);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            error_log("Error updating snippet: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update snippet']);
        }
    }
    
    /**
     * DELETE /sales-enablement/snippets/:id
     * Delete snippet
     */
    public static function deleteSnippet(int $id): void {
        try {
            $scope = self::getWorkspaceScope();
            $db = Database::getConnection();
            
            $stmt = $db->prepare("
                DELETE FROM sales_snippets 
                WHERE id = ? AND {$scope['col']} = ?
            ");
            $stmt->execute([$id, $scope['val']]);
            
            http_response_code(200);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            error_log("Error deleting snippet: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete snippet']);
        }
    }
    
    /**
     * POST /sales-enablement/snippets/:id/use
     * Increment snippet use count
     */
    public static function useSnippet(int $id): void {
        try {
            $scope = self::getWorkspaceScope();
            $db = Database::getConnection();
            
            $stmt = $db->prepare("
                UPDATE sales_snippets 
                SET use_count = use_count + 1
                WHERE id = ? AND {$scope['col']} = ?
            ");
            $stmt->execute([$id, $scope['val']]);
            
            http_response_code(200);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            error_log("Error tracking snippet use: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to track snippet use']);
        }
    }
    
    // ============================================
    // BATTLE CARDS
    // ============================================
    
    /**
     * GET /sales-enablement/battle-cards
     * List battle cards
     */
    public static function listBattleCards(): void {
        try {
            $scope = self::getWorkspaceScope();
            $companyId = self::getCompanyId();
            $db = Database::getConnection();
            
            $search = $_GET['search'] ?? null;
            
            $whereConditions = ["{$scope['col']} = ?", "is_active = 1"];
            $params = [$scope['val']];
            
            if ($companyId) {
                $whereConditions[] = "(company_id = ? OR company_id IS NULL)";
                $params[] = $companyId;
            }
            
            if ($search) {
                $whereConditions[] = "(competitor_name LIKE ? OR overview LIKE ?)";
                $params[] = "%$search%";
                $params[] = "%$search%";
            }
            
            $whereClause = implode(' AND ', $whereConditions);
            
            $stmt = $db->prepare("
                SELECT * FROM battle_cards
                WHERE $whereClause
                ORDER BY competitor_name ASC
            ");
            $stmt->execute($params);
            $cards = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($cards as &$card) {
                $card['strengths'] = json_decode($card['strengths'] ?? '[]', true);
                $card['weaknesses'] = json_decode($card['weaknesses'] ?? '[]', true);
                $card['feature_comparison'] = json_decode($card['feature_comparison'] ?? '[]', true);
                $card['objection_handlers'] = json_decode($card['objection_handlers'] ?? '[]', true);
                $card['tags'] = json_decode($card['tags'] ?? '[]', true);
            }
            
            http_response_code(200);
            echo json_encode(['battle_cards' => $cards]);
        } catch (Exception $e) {
            error_log("Error listing battle cards: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to list battle cards']);
        }
    }
    
    /**
     * POST /sales-enablement/battle-cards
     * Create battle card
     */
    public static function createBattleCard(): void {
        try {
            $scope = self::getWorkspaceScope();
            $companyId = self::getCompanyId();
            $db = Database::getConnection();
            $userId = Auth::userIdOrFail();
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['competitor_name'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Competitor name is required']);
                return;
            }
            
            $stmt = $db->prepare("
                INSERT INTO battle_cards (
                    workspace_id, company_id, competitor_name, competitor_logo,
                    competitor_website, overview, strengths, weaknesses, pricing_info,
                    feature_comparison, objection_handlers, win_strategies, tags, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $scope['val'],
                $companyId,
                $data['competitor_name'],
                $data['competitor_logo'] ?? null,
                $data['competitor_website'] ?? null,
                $data['overview'] ?? null,
                json_encode($data['strengths'] ?? []),
                json_encode($data['weaknesses'] ?? []),
                $data['pricing_info'] ?? null,
                json_encode($data['feature_comparison'] ?? []),
                json_encode($data['objection_handlers'] ?? []),
                $data['win_strategies'] ?? null,
                json_encode($data['tags'] ?? []),
                $userId
            ]);
            
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'battle_card_id' => (int)$db->lastInsertId()
            ]);
        } catch (Exception $e) {
            error_log("Error creating battle card: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create battle card']);
        }
    }
    
    /**
     * GET /sales-enablement/battle-cards/:id
     * Get battle card details
     */
    public static function getBattleCard(int $id): void {
        try {
            $scope = self::getWorkspaceScope();
            $db = Database::getConnection();
            
            $stmt = $db->prepare("
                SELECT * FROM battle_cards 
                WHERE id = ? AND {$scope['col']} = ?
            ");
            $stmt->execute([$id, $scope['val']]);
            $card = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$card) {
                http_response_code(404);
                echo json_encode(['error' => 'Battle card not found']);
                return;
            }
            
            $card['strengths'] = json_decode($card['strengths'] ?? '[]', true);
            $card['weaknesses'] = json_decode($card['weaknesses'] ?? '[]', true);
            $card['feature_comparison'] = json_decode($card['feature_comparison'] ?? '[]', true);
            $card['objection_handlers'] = json_decode($card['objection_handlers'] ?? '[]', true);
            $card['tags'] = json_decode($card['tags'] ?? '[]', true);
            
            http_response_code(200);
            echo json_encode($card);
        } catch (Exception $e) {
            error_log("Error getting battle card: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to get battle card']);
        }
    }
    
    /**
     * PUT /sales-enablement/battle-cards/:id
     * Update battle card
     */
    public static function updateBattleCard(int $id): void {
        try {
            $scope = self::getWorkspaceScope();
            $db = Database::getConnection();
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            $updates = [];
            $params = [];
            
            $allowedFields = [
                'competitor_name', 'competitor_logo', 'competitor_website', 
                'overview', 'pricing_info', 'win_strategies', 'is_active'
            ];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }
            
            $jsonFields = ['strengths', 'weaknesses', 'feature_comparison', 'objection_handlers', 'tags'];
            foreach ($jsonFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = json_encode($data[$field]);
                }
            }
            
            if (empty($updates)) {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
                return;
            }
            
            $params[] = $id;
            $params[] = $scope['val'];
            
            $updateClause = implode(', ', $updates);
            $stmt = $db->prepare("
                UPDATE battle_cards 
                SET $updateClause
                WHERE id = ? AND {$scope['col']} = ?
            ");
            $stmt->execute($params);
            
            http_response_code(200);
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            error_log("Error updating battle card: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update battle card']);
        }
    }
    
    // ============================================
    // ENABLEMENT ANALYTICS
    // ============================================
    
    /**
     * GET /sales-enablement/analytics/dashboard
     * Get enablement dashboard analytics
     */
    public static function getAnalyticsDashboard(): void {
        try {
            $scope = self::getWorkspaceScope();
            $db = Database::getConnection();
            $period = (int)($_GET['period'] ?? 30);
            $startDate = date('Y-m-d', strtotime("-$period days"));
            
            // Content metrics
            $contentStmt = $db->prepare("
                SELECT COUNT(*) as total_content FROM sales_content 
                WHERE {$scope['col']} = ? AND is_active = 1
            ");
            $contentStmt->execute([$scope['val']]);
            $totalContent = $contentStmt->fetch(PDO::FETCH_ASSOC)['total_content'];
            
            // Content engagement
            $engagementStmt = $db->prepare("
                SELECT 
                    action,
                    COUNT(*) as count
                FROM sales_content_analytics sca
                JOIN sales_content sc ON sca.content_id = sc.id
                WHERE sc.{$scope['col']} = ? AND sca.action_date >= ?
                GROUP BY action
            ");
            $engagementStmt->execute([$scope['val'], $startDate]);
            $engagement = $engagementStmt->fetchAll(PDO::FETCH_KEY_PAIR);
            
            // Top content
            $topContentStmt = $db->prepare("
                SELECT 
                    sc.id, sc.title, sc.content_type,
                    COUNT(sca.id) as engagement_count
                FROM sales_content sc
                LEFT JOIN sales_content_analytics sca ON sc.id = sca.content_id AND sca.action_date >= ?
                WHERE sc.{$scope['col']} = ? AND sc.is_active = 1
                GROUP BY sc.id
                ORDER BY engagement_count DESC
                LIMIT 5
            ");
            $topContentStmt->execute([$startDate, $scope['val']]);
            $topContent = $topContentStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Playbook metrics
            $playbookStmt = $db->prepare("
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END) as published
                FROM sales_playbooks 
                WHERE {$scope['col']} = ? AND is_active = 1
            ");
            $playbookStmt->execute([$scope['val']]);
            $playbookMetrics = $playbookStmt->fetch(PDO::FETCH_ASSOC);
            
            // Snippet usage
            $snippetStmt = $db->prepare("
                SELECT 
                    COUNT(*) as total_snippets,
                    SUM(use_count) as total_uses
                FROM sales_snippets 
                WHERE {$scope['col']} = ?
            ");
            $snippetStmt->execute([$scope['val']]);
            $snippetMetrics = $snippetStmt->fetch(PDO::FETCH_ASSOC);
            
            // Battle cards count
            $battleCardsStmt = $db->prepare("
                SELECT COUNT(*) as total FROM battle_cards 
                WHERE {$scope['col']} = ? AND is_active = 1
            ");
            $battleCardsStmt->execute([$scope['val']]);
            $totalBattleCards = $battleCardsStmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            http_response_code(200);
            echo json_encode([
                'period' => $period,
                'content' => [
                    'total' => (int)$totalContent,
                    'views' => (int)($engagement['view'] ?? 0),
                    'downloads' => (int)($engagement['download'] ?? 0),
                    'shares' => (int)($engagement['share'] ?? 0),
                ],
                'top_content' => $topContent,
                'playbooks' => [
                    'total' => (int)$playbookMetrics['total'],
                    'published' => (int)$playbookMetrics['published'],
                ],
                'snippets' => [
                    'total' => (int)$snippetMetrics['total_snippets'],
                    'total_uses' => (int)$snippetMetrics['total_uses'],
                ],
                'battle_cards' => [
                    'total' => (int)$totalBattleCards
                ]
            ]);
        } catch (Exception $e) {
            error_log("Error getting analytics: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to get analytics']);
        }
    }
}
