<?php
namespace Xordon\Services;

require_once __DIR__ . '/../Database.php';

use Xordon\Database;
use PDO;

class CertificateService {
    
    /**
     * Generate a certificate for a completed course
     */
    public static function generateCertificate(int $enrollmentId): ?int {
        // Check if certificate already exists
        $existing = self::getCertificateByEnrollment($enrollmentId);
        if ($existing) {
            return $existing['id'];
        }
        
        // Get enrollment details
        $enrollment = Database::first("SELECT * FROM course_enrollments WHERE id = ?", [$enrollmentId]);
        if (!$enrollment || $enrollment['status'] !== 'completed') {
            return null;
        }
        
        // Get course details
        $course = Database::first("SELECT * FROM courses WHERE id = ?", [$enrollment['course_id']]);
        if (!$course || !$course['certificate_enabled']) {
            return null;
        }
        
        // Generate certificate number
        $certificateNumber = self::generateCertificateNumber($course['id'], $enrollment['user_id']);
        
        // Generate verification code
        $verificationCode = self::generateVerificationCode();
        
        $sql = "INSERT INTO course_certificates (
            course_id,
            enrollment_id,
            user_id,
            certificate_number,
            verification_code
        ) VALUES (?, ?, ?, ?, ?)";
        
        $params = [
            $course['id'],
            $enrollmentId,
            $enrollment['user_id'],
            $certificateNumber,
            $verificationCode
        ];
        
        try {
            $stmt = Database::conn()->prepare($sql);
            $stmt->execute($params);
            
            $certificateId = (int) Database::conn()->lastInsertId();
            
            // Update enrollment
            $updateSql = "UPDATE course_enrollments 
                         SET certificate_issued = 1, certificate_issued_at = NOW() 
                         WHERE id = ?";
            $updateStmt = Database::conn()->prepare($updateSql);
            $updateStmt->execute([$enrollmentId]);
            
            // Generate PDF (async or sync depending on implementation)
            // self::generatePDF($certificateId);
            
            return $certificateId;
        } catch (\PDOException $e) {
            error_log("Error generating certificate: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Get certificate by enrollment
     */
    public static function getCertificateByEnrollment(int $enrollmentId): ?array {
        $sql = "SELECT * FROM course_certificates WHERE enrollment_id = ?";
        return Database::first($sql, [$enrollmentId]);
    }
    
    /**
     * Get certificate by ID
     */
    public static function getCertificate(int $certificateId): ?array {
        $sql = "SELECT cc.*, c.title as course_title, u.name as user_name, u.email as user_email
                FROM course_certificates cc
                JOIN courses c ON cc.course_id = c.id
                LEFT JOIN users u ON cc.user_id = u.id
                WHERE cc.id = ?";
        
        return Database::first($sql, [$certificateId]);
    }
    
    /**
     * Get all certificates for a user
     */
    public static function getUserCertificates(int $userId): array {
        $sql = "SELECT cc.*, c.title as course_title, c.thumbnail_url
                FROM course_certificates cc
                JOIN courses c ON cc.course_id = c.id
                WHERE cc.user_id = ?
                ORDER BY cc.issued_at DESC";
        
        return Database::select($sql, [$userId]);
    }
    
    /**
     * Get all certificates for a course
     */
    public static function getCourseCertificates(int $courseId): array {
        $sql = "SELECT cc.*, u.name as user_name, u.email as user_email
                FROM course_certificates cc
                LEFT JOIN users u ON cc.user_id = u.id
                WHERE cc.course_id = ?
                ORDER BY cc.issued_at DESC";
        
        return Database::select($sql, [$courseId]);
    }
    
    /**
     * Verify a certificate by verification code
     */
    public static function verifyCertificate(string $verificationCode): ?array {
        $sql = "SELECT cc.*, c.title as course_title, c.workspace_id, u.name as user_name
                FROM course_certificates cc
                JOIN courses c ON cc.course_id = c.id
                LEFT JOIN users u ON cc.user_id = u.id
                WHERE cc.verification_code = ?";
        
        return Database::first($sql, [$verificationCode]);
    }
    
    /**
     * Generate certificate number
     */
    private static function generateCertificateNumber(int $courseId, int $userId): string {
        $timestamp = time();
        return sprintf('CERT-%d-%d-%d', $courseId, $userId, $timestamp);
    }
    
    /**
     * Generate verification code
     */
    private static function generateVerificationCode(): string {
        return strtoupper(bin2hex(random_bytes(8)));
    }
    
    /**
     * Update certificate PDF URL
     */
    public static function updatePdfUrl(int $certificateId, string $pdfUrl): bool {
        $sql = "UPDATE course_certificates SET pdf_url = ? WHERE id = ?";
        
        try {
            $stmt = Database::conn()->prepare($sql);
            return $stmt->execute([$pdfUrl, $certificateId]);
        } catch (\PDOException $e) {
            error_log("Error updating PDF URL: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get certificate data for PDF generation
     */
    public static function getCertificateData(int $certificateId): ?array {
        $certificate = self::getCertificate($certificateId);
        
        if (!$certificate) {
            return null;
        }
        
        // Get enrollment details for completion date
        $enrollment = Database::first(
            "SELECT * FROM course_enrollments WHERE id = ?",
            [$certificate['enrollment_id']]
        );
        
        // Get course details
        $course = Database::first(
            "SELECT * FROM courses WHERE id = ?",
            [$certificate['course_id']]
        );
        
        // Get workspace details
        $workspace = Database::first(
            "SELECT * FROM workspaces WHERE id = ?",
            [$course['workspace_id']]
        );
        
        return [
            'certificate_number' => $certificate['certificate_number'],
            'verification_code' => $certificate['verification_code'],
            'user_name' => $certificate['user_name'],
            'course_title' => $certificate['course_title'],
            'completion_date' => $enrollment['completed_at'] ?? $certificate['issued_at'],
            'issued_date' => $certificate['issued_at'],
            'workspace_name' => $workspace['name'] ?? 'Unknown',
            'course_duration' => $course['duration_hours'] ?? null
        ];
    }
    
    /**
     * Get certificate statistics for a workspace
     */
    public static function getWorkspaceStats(int $workspaceId): array {
        $sql = "SELECT COUNT(*) as total
                FROM course_certificates cc
                JOIN courses c ON cc.course_id = c.id
                WHERE c.workspace_id = ?";
        
        $result = Database::first($sql, [$workspaceId]);
        
        return [
            'total_certificates' => $result['total'] ?? 0
        ];
    }
}
