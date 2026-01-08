<?php
class LandingPageController {
    private $db;

    public function __construct() {
        $this->db = Database::conn();
    }

    public function getLandingPages(int $userId) {
        $stmt = $this->db->prepare("
            SELECT id, name, title, description, status, slug, template_id, 
                   views, conversions, published_at, created_at, updated_at 
            FROM landing_pages 
            WHERE user_id = ?
            ORDER BY updated_at DESC
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getLandingPage(int $userId, $id) {
        $stmt = $this->db->prepare("
            SELECT * FROM landing_pages 
            WHERE user_id = ? AND id = ?
        ");
        $stmt->execute([$userId, $id]);
        $page = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($page && isset($page['content'])) {
            $page['content'] = json_decode($page['content'], true);
        }
        
        return $page;
    }

    public function createLandingPage(int $userId, $data) {
        $stmt = $this->db->prepare("
            INSERT INTO landing_pages (
                user_id, name, title, description, status, content, 
                seo_title, seo_description, slug, template_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $content = json_encode($data['content'] ?? []);
        $stmt->execute([
            $userId,
            $data['name'],
            $data['title'],
            $data['description'] ?? '',
            $data['status'] ?? 'draft',
            $content,
            $data['seo_title'] ?? '',
            $data['seo_description'] ?? '',
            $data['slug'] ?? $this->generateSlug($data['name']),
            $data['template_id'] ?? null
        ]);

        $id = $this->db->lastInsertId();
        return $this->getLandingPage($userId, $id);
    }

    public function updateLandingPage(int $userId, $id, $data) {
        $stmt = $this->db->prepare("
            UPDATE landing_pages SET
                name = ?, title = ?, description = ?, status = ?, content = ?,
                seo_title = ?, seo_description = ?, slug = ?, template_id = ?,
                published_at = ?
            WHERE user_id = ? AND id = ?
        ");

        $content = json_encode($data['content'] ?? []);
        $publishedAt = ($data['status'] === 'published' && !$this->isAlreadyPublished($id)) 
            ? date('Y-m-d H:i:s') 
            : null;

        $stmt->execute([
            $data['name'],
            $data['title'],
            $data['description'] ?? '',
            $data['status'],
            $content,
            $data['seo_title'] ?? '',
            $data['seo_description'] ?? '',
            $data['slug'] ?? $this->generateSlug($data['name']),
            $data['template_id'] ?? null,
            $publishedAt,
            $userId,
            $id
        ]);

        return $this->getLandingPage($userId, $id);
    }

    public function deleteLandingPage(int $userId, $id) {
        $stmt = $this->db->prepare("DELETE FROM landing_pages WHERE user_id = ? AND id = ?");
        $stmt->execute([$userId, $id]);
        return ['deleted' => true];
    }

    private function generateSlug($name) {
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name)));
        $originalSlug = $slug;
        $counter = 1;

        while ($this->slugExists($slug)) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    private function slugExists($slug) {
        $stmt = $this->db->prepare("SELECT id FROM landing_pages WHERE slug = ?");
        $stmt->execute([$slug]);
        return $stmt->fetch() !== false;
    }

    private function isAlreadyPublished($id) {
        $stmt = $this->db->prepare("SELECT published_at FROM landing_pages WHERE id = ?");
        $stmt->execute([$id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result && $result['published_at'] !== null;
    }
}
?>
