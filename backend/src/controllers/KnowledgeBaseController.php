<?php

/**
 * Knowledge Base Controller
 * Manages help articles, categories, and self-service content
 */

use Xordon\Database;
use Xordon\Response;
use PDO;

class KnowledgeBaseController {
    
    /**
     * List KB articles
     * GET /api/kb/articles
     */
    public function listArticles() {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];
        
        $categoryId = $_GET['category_id'] ?? null;
        $search = $_GET['search'] ?? null;
        $published = $_GET['published'] ?? null;
        $publishedOnly = $_GET['published_only'] ?? null;
        
        $where = ['workspace_id = ?'];
        $params = [$workspaceId];
        
        if ($categoryId) {
            $where[] = 'category_id = ?';
            $params[] = intval($categoryId);
        }
        
        if ($search) {
            $where[] = '(title LIKE ? OR body LIKE ? OR tags LIKE ?)';
            $searchTerm = '%' . $search . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        if ($published !== null) {
            $where[] = 'is_published = ?';
            $params[] = $published === 'true' ? 1 : 0;
        } elseif ($publishedOnly === 'true') {
            $where[] = 'is_published = 1';
        }
        
        $whereClause = implode(' AND ', $where);
        
        $stmt = $db->prepare("
            SELECT 
                a.*,
                c.name as category_name,
                u.name as author_name
            FROM kb_articles a
            LEFT JOIN kb_categories c ON a.category_id = c.id
            LEFT JOIN users u ON a.author_id = u.id
            WHERE $whereClause
            ORDER BY a.created_at DESC
        ");
        $stmt->execute($params);
        $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($articles as &$article) {
            $article['tags'] = $article['tags'] ? json_decode($article['tags'], true) : [];
        }
        
        jsonResponse($articles);
    }
    
    /**
     * Get single article
     * GET /api/kb/articles/:id
     */
    public function getArticle($id) {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];
        
        $stmt = $db->prepare("
            SELECT 
                a.*,
                c.name as category_name,
                u.name as author_name,
                u.email as author_email
            FROM kb_articles a
            LEFT JOIN kb_categories c ON a.category_id = c.id
            LEFT JOIN users u ON a.author_id = u.id
            WHERE a.id = ? AND a.workspace_id = ?
        ");
        $stmt->execute([$id, $workspaceId]);
        $article = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$article) {
            http_response_code(404);
            jsonResponse(['error' => 'Article not found']);
            return;
        }
        
        $article['tags'] = $article['tags'] ? json_decode($article['tags'], true) : [];
        
        // Increment view count
        $viewStmt = $db->prepare("UPDATE kb_articles SET view_count = view_count + 1 WHERE id = ?");
        $viewStmt->execute([$id]);
        
        jsonResponse($article);
    }

    /**
     * Get single article by slug
     * GET /api/kb/articles/slug/:slug
     */
    public function getBySlug($slug) {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];
        
        $stmt = $db->prepare("
            SELECT 
                a.*,
                c.name as category_name,
                u.name as author_name,
                u.email as author_email
            FROM kb_articles a
            LEFT JOIN kb_categories c ON a.category_id = c.id
            LEFT JOIN users u ON a.author_id = u.id
            WHERE a.slug = ? AND a.workspace_id = ?
        ");
        $stmt->execute([$slug, $workspaceId]);
        $article = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$article) {
            http_response_code(404);
            jsonResponse(['error' => 'Article not found']);
            return;
        }
        
        $article['tags'] = $article['tags'] ? json_decode($article['tags'], true) : [];
        
        // Increment view count
        $viewStmt = $db->prepare("UPDATE kb_articles SET view_count = view_count + 1 WHERE id = ?");
        $viewStmt->execute([$article['id']]);
        
        jsonResponse($article);
    }
    
    /**
     * Create article
     * POST /api/kb/articles
     */
    public function createArticle() {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Generate slug
        $slug = $this->generateSlug($data['title'], $workspaceId, $db);
        
        $stmt = $db->prepare("
            INSERT INTO kb_articles (
                workspace_id, title, slug, body, body_html, excerpt,
                category_id, tags, is_published, is_internal,
                meta_title, meta_description, author_id, published_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $isPublished = $data['is_published'] ?? false;
        $publishedAt = $isPublished ? date('Y-m-d H:i:s') : null;
        
        $stmt->execute([
            $workspaceId,
            $data['title'],
            $slug,
            $data['body'],
            $data['body_html'] ?? null,
            $data['excerpt'] ?? null,
            $data['category_id'] ?? null,
            isset($data['tags']) ? json_encode($data['tags']) : null,
            $isPublished,
            $data['is_internal'] ?? false,
            $data['meta_title'] ?? null,
            $data['meta_description'] ?? null,
            $user['id'],
            $publishedAt
        ]);
        
        jsonResponse(['id' => $db->lastInsertId(), 'slug' => $slug], 201);
    }
    
    /**
     * Update article
     * PUT /api/kb/articles/:id
     */
    public function updateArticle($id) {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [];
        
        $allowedFields = ['title', 'body', 'body_html', 'excerpt', 'category_id', 'is_published', 'is_internal', 'meta_title', 'meta_description'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (isset($data['tags'])) {
            $fields[] = "tags = ?";
            $params[] = json_encode($data['tags']);
        }
        
        // Update slug if title changed
        if (isset($data['title'])) {
            $slug = $this->generateSlug($data['title'], $workspaceId, $db, $id);
            $fields[] = "slug = ?";
            $params[] = $slug;
        }
        
        // Set published_at when publishing
        if (isset($data['is_published']) && $data['is_published']) {
            $stmt = $db->prepare("SELECT published_at FROM kb_articles WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $current = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$current['published_at']) {
                $fields[] = "published_at = NOW()";
            }
        }
        
        if (empty($fields)) {
            jsonResponse(['message' => 'No changes']);
            return;
        }
        
        $fields[] = "updated_at = NOW()";
        $params[] = $id;
        $params[] = $workspaceId;
        
        $sql = "UPDATE kb_articles SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        jsonResponse(['message' => 'Article updated']);
    }
    
    /**
     * Delete article
     * DELETE /api/kb/articles/:id
     */
    public function deleteArticle($id) {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];
        
        $stmt = $db->prepare("DELETE FROM kb_articles WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        
        jsonResponse(['message' => 'Article deleted']);
    }
    
    /**
     * List KB categories
     * GET /api/kb/categories
     */
    public function listCategories() {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];
        
        $stmt = $db->prepare("
            SELECT 
                c.*,
                (SELECT COUNT(*) FROM kb_articles WHERE category_id = c.id AND is_published = TRUE) as article_count
            FROM kb_categories c
            WHERE c.workspace_id = ?
            ORDER BY c.sequence, c.name
        ");
        $stmt->execute([$workspaceId]);
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        jsonResponse($categories);
    }
    
    /**
     * Create category
     * POST /api/kb/categories
     */
    public function createCategory() {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $slug = $this->slugify($data['name']);
        
        $stmt = $db->prepare("
            INSERT INTO kb_categories (
                workspace_id, name, slug, description, icon, parent_id, sequence, is_published
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $workspaceId,
            $data['name'],
            $slug,
            $data['description'] ?? null,
            $data['icon'] ?? null,
            $data['parent_id'] ?? null,
            $data['sequence'] ?? 0,
            $data['is_published'] ?? true
        ]);
        
        jsonResponse(['id' => $db->lastInsertId(), 'slug' => $slug], 201);
    }
    
    /**
     * Update category
     * PUT /api/kb/categories/:id
     */
    public function updateCategory($id) {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [];
        
        $allowedFields = ['name', 'description', 'icon', 'parent_id', 'sequence', 'is_published'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (isset($data['name'])) {
            $slug = $this->slugify($data['name']);
            $fields[] = "slug = ?";
            $params[] = $slug;
        }
        
        if (empty($fields)) {
            jsonResponse(['message' => 'No changes']);
            return;
        }
        
        $fields[] = "updated_at = NOW()";
        $params[] = $id;
        $params[] = $workspaceId;
        
        $sql = "UPDATE kb_categories SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        jsonResponse(['message' => 'Category updated']);
    }
    
    /**
     * Delete category
     * DELETE /api/kb/categories/:id
     */
    public function deleteCategory($id) {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];
        
        // Check if category has articles
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM kb_articles WHERE category_id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        if ($count > 0) {
            http_response_code(400);
            jsonResponse(['error' => 'Cannot delete category with articles. Please reassign or delete articles first.']);
            return;
        }
        
        $deleteStmt = $db->prepare("DELETE FROM kb_categories WHERE id = ? AND workspace_id = ?");
        $deleteStmt->execute([$id, $workspaceId]);
        
        jsonResponse(['message' => 'Category deleted']);
    }
    
    /**
     * Generate unique slug
     */
    private function generateSlug($title, $workspaceId, $db, $excludeId = null) {
        $slug = $this->slugify($title);
        $originalSlug = $slug;
        $counter = 1;
        
        while (true) {
            $stmt = $db->prepare("SELECT id FROM kb_articles WHERE workspace_id = ? AND slug = ? AND id != ?");
            $stmt->execute([$workspaceId, $slug, $excludeId ?? 0]);
            
            if (!$stmt->fetch()) {
                break;
            }
            
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }
        
        return $slug;
    }
    
    /**
     * Convert string to URL-friendly slug
     */
    private function slugify($text) {
        $text = strtolower($text);
        $text = preg_replace('/[^a-z0-9\s-]/', '', $text);
        $text = preg_replace('/[\s-]+/', '-', $text);
        $text = trim($text, '-');
        return $text;
    }
}
