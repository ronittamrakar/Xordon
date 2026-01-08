<?php
namespace Xordon\Controllers;

use Xordon\Database;
use Exception;

/**
 * Blog Controller
 * Manages blog posts, categories, tags, and comments
 */
class BlogController {
    
    /**
     * Get all blog posts
     */
    public function getPosts() {
        $workspaceId = $_SESSION['workspace_id'] ?? null;
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $status = $_GET['status'] ?? 'published';
        
        $sql = "SELECT p.*, u.name as author_name,
                (SELECT COUNT(*) FROM blog_comments WHERE post_id = p.id AND status = 'approved') as comment_count
                FROM blog_posts p
                LEFT JOIN users u ON p.user_id = u.id
                WHERE p.workspace_id = ?";
        
        $params = [$workspaceId];
        
        if ($status !== 'all') {
            $sql .= " AND p.status = ?";
            $params[] = $status;
        }
        
        $sql .= " ORDER BY p.created_at DESC LIMIT 100";
        
        $posts = Database::select($sql, $params);
        
        return ['posts' => $posts];
    }
    
    /**
     * Get single blog post
     */
    public function getPost($id) {
        $workspaceId = $_SESSION['workspace_id'] ?? null;
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $sql = "SELECT p.*, u.name as author_name
                FROM blog_posts p
                LEFT JOIN users u ON p.user_id = u.id
                WHERE p.id = ? AND p.workspace_id = ?";
        
        $post = Database::first($sql, [$id, $workspaceId]);
        
        if (!$post) {
            return ['error' => 'Post not found'];
        }
        
        // Get categories
        $categories = Database::select(
            "SELECT c.* FROM blog_categories c
             INNER JOIN blog_post_categories pc ON c.id = pc.category_id
             WHERE pc.post_id = ?",
            [$id]
        );
        
        // Get tags
        $tags = Database::select(
            "SELECT t.* FROM blog_tags t
             INNER JOIN blog_post_tags pt ON t.id = pt.tag_id
             WHERE pt.post_id = ?",
            [$id]
        );
        
        $post['categories'] = $categories;
        $post['tags'] = $tags;
        
        return ['post' => $post];
    }
    
    /**
     * Create blog post
     */
    public function createPost() {
        $workspaceId = $_SESSION['workspace_id'] ?? $GLOBALS['tenantContext']['workspace_id'] ?? null;
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Handle summary vs excerpt
        if (isset($data['summary']) && !isset($data['excerpt'])) {
            $data['excerpt'] = $data['summary'];
        }
        
        // Generate slug if not provided
        $slug = $data['slug'] ?? $this->generateSlug($data['title']);
        
        $sql = "INSERT INTO blog_posts (
            workspace_id, website_id, title, slug, content, excerpt,
            featured_image, user_id, status, published_at, seo_title,
            seo_description, seo_keywords, allow_comments, is_featured
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        try {
            Database::execute($sql, [
                $workspaceId,
                $data['website_id'] ?? null,
                $data['title'],
                $slug,
                $data['content'] ?? '',
                $data['excerpt'] ?? null,
                $data['featured_image'] ?? null,
                $_SESSION['user_id'] ?? null,
                $data['status'] ?? 'draft',
                $data['status'] === 'published' ? date('Y-m-d H:i:s') : null,
                $data['seo_title'] ?? $data['title'],
                $data['seo_description'] ?? null,
                $data['seo_keywords'] ?? null,
                $data['allow_comments'] ?? true,
                $data['is_featured'] ?? false
            ]);
            
            $postId = Database::conn()->lastInsertId();
            
            // Handle Category (String or ID)
            if (!empty($data['category'])) {
                $category = $this->ensureCategory($data['category'], $workspaceId);
                if ($category) {
                    $this->updatePostCategories($postId, [$category['id']]);
                }
            }
            
            // Handle Tags (Array of Strings or IDs)
            if (!empty($data['tags'])) {
                $tagIds = [];
                foreach ($data['tags'] as $tagName) {
                    $tag = $this->ensureTag($tagName, $workspaceId);
                    if ($tag) $tagIds[] = $tag['id'];
                }
                $this->updatePostTags($postId, $tagIds);
            }
            
            return ['success' => true, 'id' => $postId];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Update blog post
     */
    public function updatePost($id) {
        $workspaceId = $_SESSION['workspace_id'] ?? $GLOBALS['tenantContext']['workspace_id'] ?? null;
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Handle summary vs excerpt
        if (isset($data['summary']) && !isset($data['excerpt'])) {
            $data['excerpt'] = $data['summary'];
        }
        
        $sql = "UPDATE blog_posts SET
                title = ?, slug = ?, content = ?, excerpt = ?,
                featured_image = ?, status = ?, seo_title = ?,
                seo_description = ?, seo_keywords = ?, allow_comments = ?,
                is_featured = ?";
        
        $params = [
            $data['title'],
            $data['slug'] ?? $this->generateSlug($data['title']),
            $data['content'] ?? '',
            $data['excerpt'] ?? null,
            $data['featured_image'] ?? null,
            $data['status'] ?? 'draft',
            $data['seo_title'] ?? $data['title'],
            $data['seo_description'] ?? null,
            $data['seo_keywords'] ?? null,
            $data['allow_comments'] ?? true,
            $data['is_featured'] ?? false
        ];
        
        // Set published_at if publishing for the first time
        if ($data['status'] === 'published') {
            $sql .= ", published_at = COALESCE(published_at, NOW())";
        }
        
        $sql .= " WHERE id = ? AND workspace_id = ?";
        $params[] = $id;
        $params[] = $workspaceId;
        
        try {
            Database::execute($sql, $params);
            
            // Handle Category (String or ID)
            if (!empty($data['category'])) {
                $category = $this->ensureCategory($data['category'], $workspaceId);
                if ($category) {
                    $this->updatePostCategories($id, [$category['id']]);
                }
            }
            
            // Handle Tags (Array of Strings or IDs)
            if (!empty($data['tags'])) {
                $tagIds = [];
                foreach ($data['tags'] as $tagName) {
                    $tag = $this->ensureTag($tagName, $workspaceId);
                    if ($tag) $tagIds[] = $tag['id'];
                }
                $this->updatePostTags($id, $tagIds);
            }
            
            return ['success' => true];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }

    /**
     * Ensure category exists
     */
    private function ensureCategory($categoryNameOrId, $workspaceId) {
        if (is_numeric($categoryNameOrId)) {
            return Database::first("SELECT id FROM blog_categories WHERE id = ?", [$categoryNameOrId]);
        }
        
        $category = Database::first(
            "SELECT id FROM blog_categories WHERE name = ? AND workspace_id = ?",
            [$categoryNameOrId, $workspaceId]
        );
        
        if (!$category) {
            Database::execute(
                "INSERT INTO blog_categories (workspace_id, name, slug) VALUES (?, ?, ?)",
                [$workspaceId, $categoryNameOrId, $this->generateSlug($categoryNameOrId)]
            );
            $category = ['id' => Database::conn()->lastInsertId()];
        }
        
        return $category;
    }

    /**
     * Ensure tag exists
     */
    private function ensureTag($tagNameOrId, $workspaceId) {
        if (is_numeric($tagNameOrId)) {
            return Database::first("SELECT id FROM blog_tags WHERE id = ?", [$tagNameOrId]);
        }
        
        $tag = Database::first(
            "SELECT id FROM blog_tags WHERE name = ? AND workspace_id = ?",
            [$tagNameOrId, $workspaceId]
        );
        
        if (!$tag) {
            Database::execute(
                "INSERT INTO blog_tags (workspace_id, name, slug) VALUES (?, ?, ?)",
                [$workspaceId, $tagNameOrId, $this->generateSlug($tagNameOrId)]
            );
            $tag = ['id' => Database::conn()->lastInsertId()];
        }
        
        return $tag;
    }
    
    /**
     * Delete blog post
     */
    public function deletePost($id) {
        $workspaceId = $_SESSION['workspace_id'] ?? null;
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        try {
            Database::execute(
                "DELETE FROM blog_posts WHERE id = ? AND workspace_id = ?",
                [$id, $workspaceId]
            );
            
            return ['success' => true];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Get categories
     */
    public function getCategories() {
        $workspaceId = $_SESSION['workspace_id'] ?? null;
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $sql = "SELECT * FROM blog_categories WHERE workspace_id = ? ORDER BY name";
        $categories = Database::select($sql, [$workspaceId]);
        
        return ['categories' => $categories];
    }
    
    /**
     * Create category
     */
    public function createCategory() {
        $workspaceId = $_SESSION['workspace_id'] ?? null;
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $slug = $data['slug'] ?? $this->generateSlug($data['name']);
        
        $sql = "INSERT INTO blog_categories (workspace_id, name, slug, description, parent_id)
                VALUES (?, ?, ?, ?, ?)";
        
        try {
            Database::execute($sql, [
                $workspaceId,
                $data['name'],
                $slug,
                $data['description'] ?? null,
                $data['parent_id'] ?? null
            ]);
            
            $id = Database::conn()->lastInsertId();
            return ['success' => true, 'id' => $id];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Get tags
     */
    public function getTags() {
        $workspaceId = $_SESSION['workspace_id'] ?? null;
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $sql = "SELECT * FROM blog_tags WHERE workspace_id = ? ORDER BY name";
        $tags = Database::select($sql, [$workspaceId]);
        
        return ['tags' => $tags];
    }
    
    /**
     * Create tag
     */
    public function createTag() {
        $workspaceId = $_SESSION['workspace_id'] ?? null;
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $slug = $data['slug'] ?? $this->generateSlug($data['name']);
        
        $sql = "INSERT INTO blog_tags (workspace_id, name, slug) VALUES (?, ?, ?)";
        
        try {
            Database::execute($sql, [$workspaceId, $data['name'], $slug]);
            
            $id = Database::conn()->lastInsertId();
            return ['success' => true, 'id' => $id];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Get comments for a post
     */
    public function getComments($postId) {
        $sql = "SELECT * FROM blog_comments 
                WHERE post_id = ? AND status = 'approved'
                ORDER BY created_at DESC";
        
        $comments = Database::select($sql, [$postId]);
        
        return ['comments' => $comments];
    }
    
    /**
     * Add comment
     */
    public function addComment($postId) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $sql = "INSERT INTO blog_comments (
            post_id, author_name, author_email, author_website,
            author_ip, content, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        try {
            Database::execute($sql, [
                $postId,
                $data['author_name'],
                $data['author_email'],
                $data['author_website'] ?? null,
                $_SERVER['REMOTE_ADDR'] ?? null,
                $data['content'],
                'pending' // Require moderation
            ]);
            
            return ['success' => true, 'message' => 'Comment submitted for moderation'];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Helper: Generate slug from title
     */
    private function generateSlug($title) {
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $title)));
        return $slug;
    }
    
    /**
     * Helper: Update post categories
     */
    private function updatePostCategories($postId, $categoryIds) {
        // Remove existing
        Database::execute("DELETE FROM blog_post_categories WHERE post_id = ?", [$postId]);
        
        // Add new
        foreach ($categoryIds as $categoryId) {
            Database::execute(
                "INSERT INTO blog_post_categories (post_id, category_id) VALUES (?, ?)",
                [$postId, $categoryId]
            );
        }
    }
    
    /**
     * Helper: Update post tags
     */
    private function updatePostTags($postId, $tagIds) {
        // Remove existing
        Database::execute("DELETE FROM blog_post_tags WHERE post_id = ?", [$postId]);
        
        // Add new
        foreach ($tagIds as $tagId) {
            Database::execute(
                "INSERT INTO blog_post_tags (post_id, tag_id) VALUES (?, ?)",
                [$postId, $tagId]
            );
        }
    }
}
