<?php

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../TenantContext.php';

/**
 * AI Knowledge Base Controller
 * Manages knowledge bases for AI agents training data
 */
class AIKnowledgeBaseController {
    
    /**
     * List all AI knowledge bases for the current workspace
     * GET /api/ai/knowledge-bases
     */
    public static function index(): void {
        try {
            $ctx = TenantContext::resolveOrFail();
            $workspaceId = $ctx->workspaceId;
        } catch (Exception $e) {
            Response::error('Unauthorized', 401);
            return;
        }
        
        try {
            $pdo = Database::conn();
            $stmt = $pdo->prepare('
                SELECT 
                    kb.id,
                    kb.name,
                    kb.description,
                    kb.type,
                    kb.status,
                    kb.created_at,
                    kb.updated_at,
                    COUNT(ks.id) as sources
                FROM ai_knowledge_bases kb
                LEFT JOIN ai_knowledge_sources ks ON ks.knowledge_base_id = kb.id
                WHERE kb.workspace_id = ?
                GROUP BY kb.id
                ORDER BY kb.created_at DESC
            ');
            $stmt->execute([$workspaceId]);
            $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            Response::json([
                'success' => true,
                'items' => $items
            ]);
        } catch (Throwable $e) {
            Response::error('Failed to fetch knowledge bases: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Get a single AI knowledge base
     * GET /api/ai/knowledge-bases/{id}
     */
    public static function show(int $id): void {
        try {
            $ctx = TenantContext::resolveOrFail();
            $workspaceId = $ctx->workspaceId;
        } catch (Exception $e) {
            Response::error('Unauthorized', 401);
            return;
        }
        
        try {
            $pdo = Database::conn();
            $stmt = $pdo->prepare('
                SELECT * FROM ai_knowledge_bases 
                WHERE id = ? AND workspace_id = ?
            ');
            $stmt->execute([$id, $workspaceId]);
            $kb = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$kb) {
                Response::notFound('Knowledge base not found');
                return;
            }
            
            // Get sources
            $stmt = $pdo->prepare('
                SELECT * FROM ai_knowledge_sources 
                WHERE knowledge_base_id = ?
                ORDER BY created_at DESC
            ');
            $stmt->execute([$id]);
            $sources = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $kb['sources_list'] = $sources;
            $kb['sources'] = count($sources);
            
            Response::json([
                'success' => true,
                'data' => $kb
            ]);
        } catch (Throwable $e) {
            Response::error('Failed to fetch knowledge base: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Create a new AI knowledge base
     * POST /api/ai/knowledge-bases
     */
    public static function create(): void {
        try {
            $ctx = TenantContext::resolveOrFail();
            $workspaceId = $ctx->workspaceId;
        } catch (Exception $e) {
            Response::error('Unauthorized', 401);
            return;
        }
        
        $body = get_json_body();
        if (!is_array($body) || empty(trim($body['name'] ?? ''))) {
            Response::json(['error' => 'Name is required'], 400);
            return;
        }
        
        try {
            $pdo = Database::conn();
            $stmt = $pdo->prepare('
                INSERT INTO ai_knowledge_bases (workspace_id, name, description, type, status)
                VALUES (?, ?, ?, ?, ?)
            ');
            $stmt->execute([
                $workspaceId,
                trim($body['name']),
                $body['description'] ?? null,
                $body['type'] ?? 'Documents',
                'active'
            ]);
            
            $id = $pdo->lastInsertId();
            
            Response::json([
                'success' => true,
                'id' => $id,
                'message' => 'Knowledge base created successfully'
            ]);
        } catch (Throwable $e) {
            Response::error('Failed to create knowledge base: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Update an AI knowledge base
     * PUT /api/ai/knowledge-bases/{id}
     */
    public static function update(int $id): void {
        try {
            $ctx = TenantContext::resolveOrFail();
            $workspaceId = $ctx->workspaceId;
        } catch (Exception $e) {
            Response::error('Unauthorized', 401);
            return;
        }
        
        $body = get_json_body();
        if (!is_array($body)) {
            Response::json(['error' => 'Invalid payload'], 400);
            return;
        }
        
        try {
            $pdo = Database::conn();
            
            // Verify ownership
            $stmt = $pdo->prepare('SELECT id FROM ai_knowledge_bases WHERE id = ? AND workspace_id = ?');
            $stmt->execute([$id, $workspaceId]);
            if (!$stmt->fetchColumn()) {
                Response::notFound('Knowledge base not found');
                return;
            }
            
            $fields = [];
            $params = [];
            
            if (isset($body['name'])) {
                $fields[] = 'name = ?';
                $params[] = trim($body['name']);
            }
            if (isset($body['description'])) {
                $fields[] = 'description = ?';
                $params[] = $body['description'];
            }
            if (isset($body['type'])) {
                $fields[] = 'type = ?';
                $params[] = $body['type'];
            }
            if (isset($body['status'])) {
                $fields[] = 'status = ?';
                $params[] = $body['status'];
            }
            
            if (count($fields) === 0) {
                Response::json(['success' => true]);
                return;
            }
            
            $params[] = $id;
            $params[] = $workspaceId;
            
            $sql = 'UPDATE ai_knowledge_bases SET ' . implode(', ', $fields) . ' WHERE id = ? AND workspace_id = ?';
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            Response::json([
                'success' => true,
                'message' => 'Knowledge base updated successfully'
            ]);
        } catch (Throwable $e) {
            Response::error('Failed to update knowledge base: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Delete an AI knowledge base
     * DELETE /api/ai/knowledge-bases/{id}
     */
    public static function delete(int $id): void {
        try {
            $ctx = TenantContext::resolveOrFail();
            $workspaceId = $ctx->workspaceId;
        } catch (Exception $e) {
            Response::error('Unauthorized', 401);
            return;
        }
        
        try {
            $pdo = Database::conn();
            
            // Delete sources first
            $stmt = $pdo->prepare('
                DELETE ks FROM ai_knowledge_sources ks
                INNER JOIN ai_knowledge_bases kb ON ks.knowledge_base_id = kb.id
                WHERE ks.knowledge_base_id = ? AND kb.workspace_id = ?
            ');
            $stmt->execute([$id, $workspaceId]);
            
            // Delete knowledge base
            $stmt = $pdo->prepare('DELETE FROM ai_knowledge_bases WHERE id = ? AND workspace_id = ?');
            $stmt->execute([$id, $workspaceId]);
            
            Response::json([
                'success' => true,
                'message' => 'Knowledge base deleted successfully'
            ]);
        } catch (Throwable $e) {
            Response::error('Failed to delete knowledge base: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Get sources for an AI knowledge base
     * GET /api/ai/knowledge-bases/{id}/sources
     */
    public static function getSources(int $id): void {
        try {
            $ctx = TenantContext::resolveOrFail();
            $workspaceId = $ctx->workspaceId;
        } catch (Exception $e) {
            Response::error('Unauthorized', 401);
            return;
        }
        
        try {
            $pdo = Database::conn();
            
            // Verify ownership
            $stmt = $pdo->prepare('SELECT id FROM ai_knowledge_bases WHERE id = ? AND workspace_id = ?');
            $stmt->execute([$id, $workspaceId]);
            if (!$stmt->fetchColumn()) {
                Response::notFound('Knowledge base not found');
                return;
            }
            
            $stmt = $pdo->prepare('
                SELECT * FROM ai_knowledge_sources 
                WHERE knowledge_base_id = ?
                ORDER BY created_at DESC
            ');
            $stmt->execute([$id]);
            $sources = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            Response::json([
                'success' => true,
                'items' => $sources
            ]);
        } catch (Throwable $e) {
            Response::error('Failed to fetch sources: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Add a source to an AI knowledge base
     * POST /api/ai/knowledge-bases/{id}/sources
     */
    public static function addSource(int $id): void {
        try {
            $ctx = TenantContext::resolveOrFail();
            $workspaceId = $ctx->workspaceId;
        } catch (Exception $e) {
            Response::error('Unauthorized', 401);
            return;
        }
        
        $body = get_json_body();
        if (!is_array($body) || empty($body['source_type'])) {
            Response::json(['error' => 'Source type is required'], 400);
            return;
        }
        
        try {
            $pdo = Database::conn();
            
            // Verify ownership
            $stmt = $pdo->prepare('SELECT id FROM ai_knowledge_bases WHERE id = ? AND workspace_id = ?');
            $stmt->execute([$id, $workspaceId]);
            if (!$stmt->fetchColumn()) {
                Response::notFound('Knowledge base not found');
                return;
            }
            
            $stmt = $pdo->prepare('
                INSERT INTO ai_knowledge_sources 
                (knowledge_base_id, source_type, source_name, source_url, content, metadata, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ');
            $stmt->execute([
                $id,
                $body['source_type'],
                $body['source_name'] ?? 'Untitled Source',
                $body['source_url'] ?? null,
                $body['content'] ?? null,
                isset($body['metadata']) ? json_encode($body['metadata']) : null,
                'indexed' // For now, mark as indexed immediately
            ]);
            
            $sourceId = $pdo->lastInsertId();
            
            Response::json([
                'success' => true,
                'id' => $sourceId,
                'message' => 'Source added successfully'
            ]);
        } catch (Throwable $e) {
            Response::error('Failed to add source: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Delete a source
     * DELETE /api/ai/knowledge-bases/{id}/sources/{sourceId}
     */
    public static function deleteSource(int $id, int $sourceId): void {
        try {
            $ctx = TenantContext::resolveOrFail();
            $workspaceId = $ctx->workspaceId;
        } catch (Exception $e) {
            Response::error('Unauthorized', 401);
            return;
        }
        
        try {
            $pdo = Database::conn();
            
            // Verify ownership
            $stmt = $pdo->prepare('SELECT id FROM ai_knowledge_bases WHERE id = ? AND workspace_id = ?');
            $stmt->execute([$id, $workspaceId]);
            if (!$stmt->fetchColumn()) {
                Response::notFound('Knowledge base not found');
                return;
            }
            
            $stmt = $pdo->prepare('DELETE FROM ai_knowledge_sources WHERE id = ? AND knowledge_base_id = ?');
            $stmt->execute([$sourceId, $id]);
            
            Response::json([
                'success' => true,
                'message' => 'Source deleted successfully'
            ]);
        } catch (Throwable $e) {
            Response::error('Failed to delete source: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * List all AI agent templates
     * GET /api/ai/templates
     */
    public static function listTemplates(): void {
        try {
            $pdo = Database::conn();
            $stmt = $pdo->prepare('
                SELECT 
                    id,
                    name,
                    description,
                    category,
                    author,
                    type,
                    business_niches,
                    use_cases,
                    downloads,
                    rating,
                    reviews_count,
                    price,
                    image_url,
                    is_official,
                    is_verified,
                    created_at
                FROM ai_agent_templates 
                WHERE is_published = TRUE
                ORDER BY downloads DESC
            ');
            $stmt->execute();
            $templates = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Parse JSON fields
            foreach ($templates as &$template) {
                $template['business_niches'] = json_decode($template['business_niches'] ?? '[]', true);
                $template['use_cases'] = json_decode($template['use_cases'] ?? '[]', true);
            }
            
            Response::json([
                'success' => true,
                'items' => $templates
            ]);
        } catch (Throwable $e) {
            Response::error('Failed to fetch templates: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Get a single AI agent template
     * GET /api/ai/templates/{id}
     */
    public static function getTemplate(int $id): void {
        try {
            $pdo = Database::conn();
            $stmt = $pdo->prepare('SELECT * FROM ai_agent_templates WHERE id = ? AND is_published = TRUE');
            $stmt->execute([$id]);
            $template = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$template) {
                Response::notFound('Template not found');
                return;
            }
            
            // Parse JSON fields
            $template['business_niches'] = json_decode($template['business_niches'] ?? '[]', true);
            $template['use_cases'] = json_decode($template['use_cases'] ?? '[]', true);
            $template['config'] = json_decode($template['config'] ?? '{}', true);
            
            Response::json([
                'success' => true,
                'data' => $template
            ]);
        } catch (Throwable $e) {
            Response::error('Failed to fetch template: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Use a template to create an AI agent
     * POST /api/ai/templates/{id}/use
     */
    public static function useTemplate(int $id): void {
        try {
            $ctx = TenantContext::resolveOrFail();
            $userId = Auth::userIdOrFail();
        } catch (Exception $e) {
            Response::error('Unauthorized', 401);
            return;
        }
        
        try {
            $pdo = Database::conn();
            
            // Get template
            $stmt = $pdo->prepare('SELECT * FROM ai_agent_templates WHERE id = ? AND is_published = TRUE');
            $stmt->execute([$id]);
            $template = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$template) {
                Response::notFound('Template not found');
                return;
            }
            
            // Increment download count
            $updateStmt = $pdo->prepare('UPDATE ai_agent_templates SET downloads = downloads + 1 WHERE id = ?');
            $updateStmt->execute([$id]);
            
            // Get body for custom name
            $body = get_json_body();
            $agentName = $body['name'] ?? $template['name'];
            
            // Create new agent from template
            $insertStmt = $pdo->prepare('
                INSERT INTO ai_agents (user_id, name, type, config, status)
                VALUES (?, ?, ?, ?, ?)
            ');
            
            // Merge template config with default settings
            $config = json_decode($template['config'] ?? '{}', true);
            $config['template_id'] = $id;
            $config['prompt_template'] = $template['prompt_template'] ?? '';
            
            $insertStmt->execute([
                $userId,
                $agentName,
                $template['type'],
                json_encode($config),
                'active'
            ]);
            
            $agentId = $pdo->lastInsertId();
            
            Response::json([
                'success' => true,
                'id' => $agentId,
                'message' => 'Agent created from template successfully'
            ]);
        } catch (Throwable $e) {
            Response::error('Failed to use template: ' . $e->getMessage(), 500);
        }
    }
}

