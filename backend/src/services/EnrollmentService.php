<?php
namespace Xordon\Services;

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/CourseService.php';
require_once __DIR__ . '/CertificateService.php';

use Xordon\Database;
use PDO;

class EnrollmentService {
    
    /**
     * Enroll a user in a course
     */
    public static function enroll(int $courseId, int $userId, int $workspaceId, array $data = []): ?int {
        // Check if already enrolled
        $existing = self::getEnrollment($courseId, $userId);
        if ($existing) {
            return $existing['id'];
        }
        
        // Get course details
        $course = CourseService::getCourse($courseId, $workspaceId);
        if (!$course) {
            return null;
        }
        
        $sql = "INSERT INTO course_enrollments (
            course_id,
            user_id,
            contact_id,
            workspace_id,
            status,
            total_lessons,
            payment_id,
            amount_paid,
            expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $params = [
            $courseId,
            $userId,
            $data['contact_id'] ?? null,
            $workspaceId,
            'active',
            $course['total_lessons'],
            $data['payment_id'] ?? null,
            $data['amount_paid'] ?? 0.00,
            $data['expires_at'] ?? null
        ];
        
        try {
            $stmt = Database::conn()->prepare($sql);
            $stmt->execute($params);
            
            $enrollmentId = (int) Database::conn()->lastInsertId();
            
            // Update course student count
            self::updateStudentCount($courseId);
            
            return $enrollmentId;
        } catch (\PDOException $e) {
            error_log("Error enrolling user: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Get enrollment by course and user
     */
    public static function getEnrollment(int $courseId, int $userId): ?array {
        $sql = "SELECT * FROM course_enrollments WHERE course_id = ? AND user_id = ?";
        return Database::first($sql, [$courseId, $userId]);
    }
    
    /**
     * Get all enrollments for a user
     */
    public static function getUserEnrollments(int $userId, string $status = null): array {
        $sql = "SELECT e.*, c.title, c.thumbnail_url, c.category, c.level
                FROM course_enrollments e
                JOIN courses c ON e.course_id = c.id
                WHERE e.user_id = ?";
        
        $params = [$userId];
        
        if ($status) {
            $sql .= " AND e.status = ?";
            $params[] = $status;
        }
        
        $sql .= " ORDER BY e.last_accessed_at DESC, e.created_at DESC";
        
        return Database::select($sql, $params);
    }
    
    /**
     * Get all enrollments for a course
     */
    public static function getCourseEnrollments(int $courseId, string $status = null): array {
        $sql = "SELECT e.*, u.name as user_name, u.email as user_email
                FROM course_enrollments e
                LEFT JOIN users u ON e.user_id = u.id
                WHERE e.course_id = ?";
        
        $params = [$courseId];
        
        if ($status) {
            $sql .= " AND e.status = ?";
            $params[] = $status;
        }
        
        $sql .= " ORDER BY e.created_at DESC";
        
        return Database::select($sql, $params);
    }
    
    /**
     * Update enrollment progress
     */
    public static function updateProgress(int $enrollmentId, int $lessonId, array $data): bool {
        // Update or create lesson progress
        $sql = "INSERT INTO lesson_progress (
            enrollment_id,
            lesson_id,
            user_id,
            status,
            progress_percentage,
            time_spent,
            last_position,
            completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            progress_percentage = VALUES(progress_percentage),
            time_spent = time_spent + VALUES(time_spent),
            last_position = VALUES(last_position),
            completed_at = VALUES(completed_at)";
        
        $params = [
            $enrollmentId,
            $lessonId,
            $data['user_id'],
            $data['status'] ?? 'in_progress',
            $data['progress_percentage'] ?? 0,
            $data['time_spent'] ?? 0,
            $data['last_position'] ?? null,
            $data['completed_at'] ?? null
        ];
        
        try {
            $stmt = Database::conn()->prepare($sql);
            $stmt->execute($params);
            
            // Recalculate overall enrollment progress
            self::recalculateEnrollmentProgress($enrollmentId);
            
            return true;
        } catch (\PDOException $e) {
            error_log("Error updating progress: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Recalculate enrollment progress
     */
    private static function recalculateEnrollmentProgress(int $enrollmentId): void {
        $sql = "UPDATE course_enrollments e
                SET 
                    completed_lessons = (
                        SELECT COUNT(*) FROM lesson_progress 
                        WHERE enrollment_id = ? AND status = 'completed'
                    ),
                    progress_percentage = (
                        SELECT AVG(progress_percentage) FROM lesson_progress 
                        WHERE enrollment_id = ?
                    ),
                    last_accessed_at = NOW()
                WHERE id = ?";
        
        try {
            $stmt = Database::conn()->prepare($sql);
            $stmt->execute([$enrollmentId, $enrollmentId, $enrollmentId]);
            
            // Check if course is completed
            $enrollment = Database::first("SELECT * FROM course_enrollments WHERE id = ?", [$enrollmentId]);
            
            if ($enrollment && $enrollment['completed_lessons'] >= $enrollment['total_lessons']) {
                self::completeCourse($enrollmentId);
            }
        } catch (\PDOException $e) {
            error_log("Error recalculating progress: " . $e->getMessage());
        }
    }
    
    /**
     * Mark course as completed
     */
    public static function completeCourse(int $enrollmentId): bool {
        $sql = "UPDATE course_enrollments 
                SET status = 'completed', completed_at = NOW() 
                WHERE id = ? AND status = 'active'";
        
        try {
            $stmt = Database::conn()->prepare($sql);
            $result = $stmt->execute([$enrollmentId]);
            
            if ($result) {
                // Check if certificate should be issued
                $enrollment = Database::first("SELECT * FROM course_enrollments WHERE id = ?", [$enrollmentId]);
                if ($enrollment) {
                    $course = Database::first("SELECT * FROM courses WHERE id = ?", [$enrollment['course_id']]);
                    if ($course && $course['certificate_enabled']) {
                        CertificateService::generateCertificate($enrollmentId);
                    }
                }
            }
            
            return $result;
        } catch (\PDOException $e) {
            error_log("Error completing course: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Cancel enrollment
     */
    public static function cancelEnrollment(int $enrollmentId): bool {
        $sql = "UPDATE course_enrollments SET status = 'cancelled' WHERE id = ?";
        
        try {
            $stmt = Database::conn()->prepare($sql);
            return $stmt->execute([$enrollmentId]);
        } catch (\PDOException $e) {
            error_log("Error cancelling enrollment: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get lesson progress for an enrollment
     */
    public static function getLessonProgress(int $enrollmentId, int $lessonId): ?array {
        $sql = "SELECT * FROM lesson_progress WHERE enrollment_id = ? AND lesson_id = ?";
        return Database::first($sql, [$enrollmentId, $lessonId]);
    }
    
    /**
     * Get all lesson progress for an enrollment
     */
    public static function getAllLessonProgress(int $enrollmentId): array {
        $sql = "SELECT lp.*, cl.title as lesson_title, cl.content_type
                FROM lesson_progress lp
                JOIN course_lessons cl ON lp.lesson_id = cl.id
                WHERE lp.enrollment_id = ?
                ORDER BY cl.order_index ASC";
        
        return Database::select($sql, [$enrollmentId]);
    }
    
    /**
     * Update student count for a course
     */
    private static function updateStudentCount(int $courseId): void {
        $sql = "UPDATE courses SET total_students = (
            SELECT COUNT(*) FROM course_enrollments WHERE course_id = ? AND status IN ('active', 'completed')
        ) WHERE id = ?";
        
        try {
            $stmt = Database::conn()->prepare($sql);
            $stmt->execute([$courseId, $courseId]);
        } catch (\PDOException $e) {
            error_log("Error updating student count: " . $e->getMessage());
        }
    }
    
    /**
     * Get enrollment statistics for a workspace
     */
    public static function getWorkspaceStats(int $workspaceId): array {
        $stats = [];
        
        // Total enrollments
        $sql = "SELECT COUNT(*) as total FROM course_enrollments WHERE workspace_id = ?";
        $result = Database::first($sql, [$workspaceId]);
        $stats['total_enrollments'] = $result['total'] ?? 0;
        
        // Active enrollments
        $sql = "SELECT COUNT(*) as total FROM course_enrollments WHERE workspace_id = ? AND status = 'active'";
        $result = Database::first($sql, [$workspaceId]);
        $stats['active_enrollments'] = $result['total'] ?? 0;
        
        // Completed enrollments
        $sql = "SELECT COUNT(*) as total FROM course_enrollments WHERE workspace_id = ? AND status = 'completed'";
        $result = Database::first($sql, [$workspaceId]);
        $stats['completed_enrollments'] = $result['total'] ?? 0;
        
        // Total revenue
        $sql = "SELECT SUM(amount_paid) as total FROM course_enrollments WHERE workspace_id = ?";
        $result = Database::first($sql, [$workspaceId]);
        $stats['total_revenue'] = $result['total'] ?? 0;
        
        // Completion rate
        if ($stats['total_enrollments'] > 0) {
            $stats['completion_rate'] = round(($stats['completed_enrollments'] / $stats['total_enrollments']) * 100, 2);
        } else {
            $stats['completion_rate'] = 0;
        }
        
        return $stats;
    }
}
