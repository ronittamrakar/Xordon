<?php
namespace Xordon\Services;

require_once __DIR__ . '/../Database.php';

use Xordon\Database;
use PDO;

class CourseService {
    
    /**
     * Get all courses for a workspace
     */
    public static function getCourses(int $workspaceId, array $filters = []): array {
        $sql = "SELECT * FROM courses WHERE workspace_id = ?";
        $params = [$workspaceId];
        
        // Apply filters
        if (!empty($filters['status'])) {
            $sql .= " AND status = ?";
            $params[] = $filters['status'];
        }
        
        if (!empty($filters['category'])) {
            $sql .= " AND category = ?";
            $params[] = $filters['category'];
        }
        
        if (!empty($filters['level'])) {
            $sql .= " AND level = ?";
            $params[] = $filters['level'];
        }
        
        if (!empty($filters['is_free'])) {
            $sql .= " AND is_free = ?";
            $params[] = $filters['is_free'];
        }
        
        if (!empty($filters['search'])) {
            $sql .= " AND (title LIKE ? OR description LIKE ?)";
            $params[] = "%" . $filters['search'] . "%";
            $params[] = "%" . $filters['search'] . "%";
        }
        
        $sql .= " ORDER BY created_at DESC";
        
        return Database::select($sql, $params);
    }
    
    /**
     * Get a single course by ID
     */
    public static function getCourse(int $courseId, int $workspaceId): ?array {
        $sql = "SELECT * FROM courses WHERE id = ? AND workspace_id = ?";
        return Database::first($sql, [$courseId, $workspaceId]);
    }
    
    /**
     * Create a new course
     */
    public static function createCourse(int $workspaceId, array $data): ?int {
        $sql = "INSERT INTO courses (
            workspace_id,
            title,
            slug,
            description,
            short_description,
            thumbnail_url,
            category,
            level,
            status,
            price,
            currency,
            is_free,
            duration_hours,
            certificate_enabled,
            drip_enabled,
            drip_days,
            prerequisites,
            learning_outcomes,
            instructor_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $slug = self::generateSlug($data['title'], $workspaceId);
        
        $params = [
            $workspaceId,
            $data['title'],
            $slug,
            $data['description'] ?? null,
            $data['short_description'] ?? null,
            $data['thumbnail_url'] ?? null,
            $data['category'] ?? null,
            $data['level'] ?? 'all_levels',
            $data['status'] ?? 'draft',
            $data['price'] ?? 0.00,
            $data['currency'] ?? 'USD',
            $data['is_free'] ?? false,
            $data['duration_hours'] ?? null,
            $data['certificate_enabled'] ?? false,
            $data['drip_enabled'] ?? false,
            $data['drip_days'] ?? null,
            $data['prerequisites'] ?? null,
            isset($data['learning_outcomes']) ? json_encode($data['learning_outcomes']) : null,
            $data['instructor_id'] ?? null
        ];
        
        try {
            $stmt = Database::conn()->prepare($sql);
            $stmt->execute($params);
            return (int) Database::conn()->lastInsertId();
        } catch (\PDOException $e) {
            error_log("Error creating course: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Update a course
     */
    public static function updateCourse(int $courseId, int $workspaceId, array $data): bool {
        $allowedFields = [
            'title', 'description', 'short_description', 'thumbnail_url',
            'category', 'level', 'status', 'price', 'currency', 'is_free',
            'duration_hours', 'certificate_enabled', 'drip_enabled', 'drip_days',
            'prerequisites', 'learning_outcomes', 'instructor_id'
        ];
        
        $updates = [];
        $params = [];
        
        foreach ($data as $key => $value) {
            if (in_array($key, $allowedFields)) {
                $updates[] = "$key = ?";
                
                if ($key === 'learning_outcomes' && is_array($value)) {
                    $params[] = json_encode($value);
                } else {
                    $params[] = $value;
                }
            }
        }
        
        if (empty($updates)) {
            return false;
        }
        
        // Update slug if title changed
        if (isset($data['title'])) {
            $updates[] = "slug = ?";
            $params[] = self::generateSlug($data['title'], $workspaceId);
        }
        
        $params[] = $courseId;
        $params[] = $workspaceId;
        
        $sql = "UPDATE courses SET " . implode(', ', $updates) . " WHERE id = ? AND workspace_id = ?";
        
        try {
            $stmt = Database::conn()->prepare($sql);
            return $stmt->execute($params);
        } catch (\PDOException $e) {
            error_log("Error updating course: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Delete a course
     */
    public static function deleteCourse(int $courseId, int $workspaceId): bool {
        $sql = "DELETE FROM courses WHERE id = ? AND workspace_id = ?";
        
        try {
            $stmt = Database::conn()->prepare($sql);
            return $stmt->execute([$courseId, $workspaceId]);
        } catch (\PDOException $e) {
            error_log("Error deleting course: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Publish a course
     */
    public static function publishCourse(int $courseId, int $workspaceId): bool {
        $sql = "UPDATE courses SET status = 'published', published_at = NOW() WHERE id = ? AND workspace_id = ?";
        
        try {
            $stmt = Database::conn()->prepare($sql);
            return $stmt->execute([$courseId, $workspaceId]);
        } catch (\PDOException $e) {
            error_log("Error publishing course: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get course modules
     */
    public static function getModules(int $courseId): array {
        $sql = "SELECT * FROM course_modules WHERE course_id = ? ORDER BY order_index ASC";
        return Database::select($sql, [$courseId]);
    }
    
    /**
     * Create a course module
     */
    public static function createModule(int $courseId, array $data): ?int {
        $sql = "INSERT INTO course_modules (course_id, title, description, order_index, is_published)
                VALUES (?, ?, ?, ?, ?)";
        
        $params = [
            $courseId,
            $data['title'],
            $data['description'] ?? null,
            $data['order_index'] ?? 0,
            $data['is_published'] ?? true
        ];
        
        try {
            $stmt = Database::conn()->prepare($sql);
            $stmt->execute($params);
            return (int) Database::conn()->lastInsertId();
        } catch (\PDOException $e) {
            error_log("Error creating module: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Get lessons for a module
     */
    public static function getLessons(int $moduleId): array {
        $sql = "SELECT * FROM course_lessons WHERE module_id = ? ORDER BY order_index ASC";
        return Database::select($sql, [$moduleId]);
    }
    
    /**
     * Create a lesson
     */
    public static function createLesson(int $moduleId, int $courseId, array $data): ?int {
        $sql = "INSERT INTO course_lessons (
            module_id,
            course_id,
            title,
            slug,
            content_type,
            content,
            video_url,
            video_duration,
            video_provider,
            attachments,
            is_preview,
            is_published,
            order_index,
            estimated_duration
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $slug = self::generateSlug($data['title'], $courseId);
        
        $params = [
            $moduleId,
            $courseId,
            $data['title'],
            $slug,
            $data['content_type'],
            $data['content'] ?? null,
            $data['video_url'] ?? null,
            $data['video_duration'] ?? null,
            $data['video_provider'] ?? null,
            isset($data['attachments']) ? json_encode($data['attachments']) : null,
            $data['is_preview'] ?? false,
            $data['is_published'] ?? true,
            $data['order_index'] ?? 0,
            $data['estimated_duration'] ?? null
        ];
        
        try {
            $stmt = Database::conn()->prepare($sql);
            $stmt->execute($params);
            
            // Update course total lessons count
            self::updateLessonCount($courseId);
            
            return (int) Database::conn()->lastInsertId();
        } catch (\PDOException $e) {
            error_log("Error creating lesson: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Update lesson count for a course
     */
    private static function updateLessonCount(int $courseId): void {
        $sql = "UPDATE courses SET total_lessons = (
            SELECT COUNT(*) FROM course_lessons WHERE course_id = ?
        ) WHERE id = ?";
        
        try {
            $stmt = Database::conn()->prepare($sql);
            $stmt->execute([$courseId, $courseId]);
        } catch (\PDOException $e) {
            error_log("Error updating lesson count: " . $e->getMessage());
        }
    }
    
    /**
     * Generate a unique slug
     */
    private static function generateSlug(string $title, int $workspaceId): string {
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $title), '-'));
        
        // Check if slug exists
        $sql = "SELECT COUNT(*) as count FROM courses WHERE slug = ? AND workspace_id = ?";
        $result = Database::first($sql, [$slug, $workspaceId]);
        
        if ($result && $result['count'] > 0) {
            $slug .= '-' . time();
        }
        
        return $slug;
    }
    
    /**
     * Get course statistics
     */
    public static function getCourseStats(int $courseId): array {
        $stats = [];
        
        // Total enrollments
        $sql = "SELECT COUNT(*) as total FROM course_enrollments WHERE course_id = ?";
        $result = Database::first($sql, [$courseId]);
        $stats['total_enrollments'] = $result['total'] ?? 0;
        
        // Active enrollments
        $sql = "SELECT COUNT(*) as total FROM course_enrollments WHERE course_id = ? AND status = 'active'";
        $result = Database::first($sql, [$courseId]);
        $stats['active_enrollments'] = $result['total'] ?? 0;
        
        // Completed enrollments
        $sql = "SELECT COUNT(*) as total FROM course_enrollments WHERE course_id = ? AND status = 'completed'";
        $result = Database::first($sql, [$courseId]);
        $stats['completed_enrollments'] = $result['total'] ?? 0;
        
        // Average progress
        $sql = "SELECT AVG(progress_percentage) as avg_progress FROM course_enrollments WHERE course_id = ?";
        $result = Database::first($sql, [$courseId]);
        $stats['average_progress'] = round($result['avg_progress'] ?? 0, 2);
        
        // Average rating
        $sql = "SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews 
                FROM course_reviews WHERE course_id = ? AND is_published = 1";
        $result = Database::first($sql, [$courseId]);
        $stats['average_rating'] = round($result['avg_rating'] ?? 0, 2);
        $stats['total_reviews'] = $result['total_reviews'] ?? 0;
        
        return $stats;
    }
}
