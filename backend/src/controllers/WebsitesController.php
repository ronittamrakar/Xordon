<?php

use PDO;
use Exception;

class WebsitesController
{
    private PDO $db;
    private ?int $workspaceId;
    private ?int $userId;

    public function __construct(PDO $db)
    {
        $this->db = $db;
        $tenantContext = $GLOBALS['tenantContext'] ?? null;
        $this->workspaceId = $tenantContext?->workspaceId;
        $this->userId = $tenantContext?->userId;

        if (!$this->workspaceId && PHP_SAPI !== 'cli') {
            error_log("WebsitesController: No workspace context available");
        }
    }

    /**
     * Get all websites for the workspace
     */
    public function getWebsites(?string $type = null): array
    {
        if (!$this->workspaceId) {
            return [];
        }

        $sql = "
            SELECT 
                id,
                name,
                title,
                description,
                slug,
                type,
                status,
                seo_title,
                seo_description,
                custom_domain,
                published_url,
                published_at,
                views,
                conversions,
                created_at,
                updated_at
            FROM websites
            WHERE workspace_id = :workspace_id
                AND deleted_at IS NULL";
        
        $params = ['workspace_id' => $this->workspaceId];

        if ($type) {
            $sql .= " AND type = :type";
            $params['type'] = $type;
        }

        $sql .= " ORDER BY updated_at DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get a single website by ID
     */
    public function getWebsite(int $id): array
    {
        if (!$this->workspaceId) {
            throw new Exception('Workspace context required');
        }

        $stmt = $this->db->prepare("
            SELECT *
            FROM websites
            WHERE id = :id
                AND workspace_id = :workspace_id
                AND deleted_at IS NULL
        ");

        $stmt->execute([
            'id' => $id,
            'workspace_id' => $this->workspaceId
        ]);

        $website = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$website) {
            throw new Exception('Website not found', 404);
        }

        // Decode JSON content
        if ($website['content']) {
            $website['content'] = json_decode($website['content'], true);
        }

        return $website;
    }

    /**
     * Create a new website
     */
    public function createWebsite(array $data): array
    {
        if (!$this->workspaceId || !$this->userId) {
            throw new Exception('Workspace and user context required');
        }

        // Generate slug if not provided
        $slug = $data['slug'] ?? $this->generateSlug($data['name'] ?? 'website');

        // Prepare content
        $content = json_encode($data['content'] ?? [
            'sections' => [],
            'settings' => [
                'seoTitle' => $data['title'] ?? 'New Website',
                'backgroundColor' => '#ffffff',
                'fontFamily' => 'Inter, sans-serif',
                'accentColor' => '#3b82f6'
            ]
        ]);

        $stmt = $this->db->prepare("
            INSERT INTO websites (
                workspace_id,
                user_id,
                name,
                title,
                description,
                slug,
                type,
                status,
                seo_title,
                seo_description,
                content
            ) VALUES (
                :workspace_id,
                :user_id,
                :name,
                :title,
                :description,
                :slug,
                :type,
                :status,
                :seo_title,
                :seo_description,
                :content
            )
        ");

        $stmt->execute([
            'workspace_id' => $this->workspaceId,
            'user_id' => $this->userId,
            'name' => $data['name'] ?? 'Untitled Website',
            'title' => $data['title'] ?? 'Untitled Website',
            'description' => $data['description'] ?? null,
            'slug' => $slug,
            'type' => $data['type'] ?? 'landing-page',
            'status' => $data['status'] ?? 'draft',
            'seo_title' => $data['seo_title'] ?? $data['title'] ?? null,
            'seo_description' => $data['seo_description'] ?? null,
            'content' => $content
        ]);

        $websiteId = $this->db->lastInsertId();

        // Create initial version
        $this->createVersion($websiteId, $content, 'Initial version');

        return $this->getWebsite($websiteId);
    }

    /**
     * Update a website
     */
    public function updateWebsite(int $id, array $data): array
    {
        if (!$this->workspaceId) {
            throw new Exception('Workspace context required');
        }

        // Verify website exists and belongs to workspace
        $existing = $this->getWebsite($id);

        $updateFields = [];
        $params = ['id' => $id, 'workspace_id' => $this->workspaceId];

        // Build dynamic update query
        $allowedFields = ['name', 'title', 'description', 'slug', 'type', 'status', 
                         'seo_title', 'seo_description', 'og_image', 'custom_domain'];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateFields[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }

        // Handle content separately (needs JSON encoding)
        if (isset($data['content'])) {
            $updateFields[] = "content = :content";
            $params['content'] = json_encode($data['content']);
            
            // Create new version
            $this->createVersion($id, $params['content'], $data['change_description'] ?? 'Updated website');
        }

        if (empty($updateFields)) {
            return $existing;
        }

        $sql = "UPDATE websites SET " . implode(', ', $updateFields) . " 
                WHERE id = :id AND workspace_id = :workspace_id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $this->getWebsite($id);
    }

    /**
     * Delete a website (soft delete)
     */
    public function deleteWebsite(int $id): bool
    {
        if (!$this->workspaceId) {
            throw new Exception('Workspace context required');
        }

        $stmt = $this->db->prepare("
            UPDATE websites
            SET deleted_at = NOW()
            WHERE id = :id AND workspace_id = :workspace_id
        ");

        return $stmt->execute([
            'id' => $id,
            'workspace_id' => $this->workspaceId
        ]);
    }

    /**
     * Publish a website
     */
    public function publishWebsite(int $id): array
    {
        if (!$this->workspaceId) {
            throw new Exception('Workspace context required');
        }

        $website = $this->getWebsite($id);

        // Generate published URL if not using custom domain
        $publishedUrl = $website['custom_domain'] 
            ? "https://{$website['custom_domain']}"
            : $this->generatePublishedUrl($website['slug']);

        $stmt = $this->db->prepare("
            UPDATE websites
            SET status = 'published',
                published_url = :published_url,
                published_at = NOW()
            WHERE id = :id AND workspace_id = :workspace_id
        ");

        $stmt->execute([
            'id' => $id,
            'workspace_id' => $this->workspaceId,
            'published_url' => $publishedUrl
        ]);

        return $this->getWebsite($id);
    }

    /**
     * Unpublish a website
     */
    public function unpublishWebsite(int $id): array
    {
        if (!$this->workspaceId) {
            throw new Exception('Workspace context required');
        }

        $stmt = $this->db->prepare("
            UPDATE websites
            SET status = 'draft'
            WHERE id = :id AND workspace_id = :workspace_id
        ");

        $stmt->execute([
            'id' => $id,
            'workspace_id' => $this->workspaceId
        ]);

        return $this->getWebsite($id);
    }

    /**
     * Duplicate a website
     */
    public function duplicateWebsite(int $id): array
    {
        if (!$this->workspaceId || !$this->userId) {
            throw new Exception('Workspace and user context required');
        }

        $original = $this->getWebsite($id);

        $data = [
            'name' => $original['name'] . ' (Copy)',
            'title' => $original['title'] . ' (Copy)',
            'description' => $original['description'],
            'type' => $original['type'],
            'status' => 'draft',
            'seo_title' => $original['seo_title'],
            'seo_description' => $original['seo_description'],
            'content' => $original['content']
        ];

        return $this->createWebsite($data);
    }

    /**
     * Get website templates
     */
    public function getTemplates(?string $type = null): array
    {
        $sql = "SELECT * FROM website_templates WHERE is_active = 1";
        $params = [];

        if ($type) {
            $sql .= " AND type = :type";
            $params['type'] = $type;
        }

        $sql .= " ORDER BY usage_count DESC, created_at DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        
        $templates = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decode JSON content
        foreach ($templates as &$template) {
            if ($template['content']) {
                $template['content'] = json_decode($template['content'], true);
            }
        }

        return $templates;
    }

    /**
     * Create website from template
     */
    public function createFromTemplate(int $templateId, array $data): array
    {
        $stmt = $this->db->prepare("SELECT * FROM website_templates WHERE id = :id AND is_active = 1");
        $stmt->execute(['id' => $templateId]);
        $template = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$template) {
            throw new Exception('Template not found', 404);
        }

        // Merge template content with user data
        $templateContent = json_decode($template['content'], true);
        $websiteData = array_merge([
            'name' => $data['name'] ?? $template['name'],
            'title' => $data['title'] ?? $template['name'],
            'description' => $data['description'] ?? $template['description'],
            'type' => $template['type'],
            'content' => $templateContent
        ], $data);

        // Increment template usage count
        $this->db->prepare("UPDATE website_templates SET usage_count = usage_count + 1 WHERE id = :id")
            ->execute(['id' => $templateId]);

        return $this->createWebsite($websiteData);
    }

    /**
     * Track website analytics
     */
    public function trackAnalytics(int $websiteId, string $eventType, array $eventData = []): bool
    {
        $stmt = $this->db->prepare("
            INSERT INTO website_analytics (
                website_id,
                event_type,
                event_data,
                visitor_ip,
                user_agent,
                referrer,
                device_type,
                browser
            ) VALUES (
                :website_id,
                :event_type,
                :event_data,
                :visitor_ip,
                :user_agent,
                :referrer,
                :device_type,
                :browser
            )
        ");

        return $stmt->execute([
            'website_id' => $websiteId,
            'event_type' => $eventType,
            'event_data' => json_encode($eventData),
            'visitor_ip' => $_SERVER['REMOTE_ADDR'] ?? null,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
            'referrer' => $_SERVER['HTTP_REFERER'] ?? null,
            'device_type' => $this->detectDeviceType(),
            'browser' => $this->detectBrowser()
        ]);
    }

    /**
     * Create a version snapshot
     */
    private function createVersion(int $websiteId, string $content, string $description = ''): bool
    {
        // Get current version number
        $stmt = $this->db->prepare("
            SELECT COALESCE(MAX(version_number), 0) + 1 as next_version
            FROM website_versions
            WHERE website_id = :website_id
        ");
        $stmt->execute(['website_id' => $websiteId]);
        $nextVersion = $stmt->fetchColumn();

        $stmt = $this->db->prepare("
            INSERT INTO website_versions (
                website_id,
                user_id,
                version_number,
                content,
                change_description
            ) VALUES (
                :website_id,
                :user_id,
                :version_number,
                :content,
                :change_description
            )
        ");

        return $stmt->execute([
            'website_id' => $websiteId,
            'user_id' => $this->userId,
            'version_number' => $nextVersion,
            'content' => $content,
            'change_description' => $description
        ]);
    }

    /**
     * Generate unique slug
     */
    private function generateSlug(string $name): string
    {
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name)));
        $originalSlug = $slug;
        $counter = 1;

        while ($this->slugExists($slug)) {
            $slug = $originalSlug . '-' . $counter++;
        }

        return $slug;
    }

    /**
     * Check if slug exists
     */
    private function slugExists(string $slug): bool
    {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM websites 
            WHERE slug = :slug AND workspace_id = :workspace_id AND deleted_at IS NULL
        ");
        $stmt->execute([
            'slug' => $slug,
            'workspace_id' => $this->workspaceId
        ]);
        return $stmt->fetchColumn() > 0;
    }

    /**
     * Generate published URL
     */
    private function generatePublishedUrl(string $slug): string
    {
        $baseUrl = $_ENV['APP_URL'] ?? 'https://app.example.com';
        return "{$baseUrl}/sites/{$slug}";
    }

    /**
     * Detect device type from user agent
     */
    private function detectDeviceType(): string
    {
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        if (preg_match('/mobile/i', $userAgent)) return 'mobile';
        if (preg_match('/tablet/i', $userAgent)) return 'tablet';
        return 'desktop';
    }

    /**
     * Detect browser from user agent
     */
    private function detectBrowser(): string
    {
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        if (preg_match('/Edge/i', $userAgent)) return 'Edge';
        if (preg_match('/Chrome/i', $userAgent)) return 'Chrome';
        if (preg_match('/Safari/i', $userAgent)) return 'Safari';
        if (preg_match('/Firefox/i', $userAgent)) return 'Firefox';
        return 'Other';
    }
}
