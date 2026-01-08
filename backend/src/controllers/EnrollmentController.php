<?php
namespace Xordon\Controllers;

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../TenantContext.php';
require_once __DIR__ . '/../services/EnrollmentService.php';

use Xordon\Services\EnrollmentService;
use Auth;
use TenantContext;

class EnrollmentController {
    
    /**
     * Enroll in a course
     * POST /api/courses/{courseId}/enroll
     */
    public static function enroll(int $courseId): void {
        try {
            $ctx = TenantContext::resolveOrFail();
            $workspaceId = $ctx->workspaceId;
            $userId = $ctx->userId;
        } catch (\Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }
        
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        
        $enrollmentId = EnrollmentService::enroll($courseId, $userId, $workspaceId, $input);
        
        if ($enrollmentId) {
            $enrollment = EnrollmentService::getEnrollment($courseId, $userId);
            
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Enrolled successfully',
                'data' => $enrollment
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to enroll']);
        }
    }
    
    /**
     * Get user's enrollments
     * GET /api/enrollments
     */
    public static function getUserEnrollments(): void {
        try {
            $ctx = TenantContext::resolveOrFail();
            $userId = $ctx->userId;
        } catch (\Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }
        
        $status = $_GET['status'] ?? null;
        
        $enrollments = EnrollmentService::getUserEnrollments($userId, $status);
        
        http_response_code(200);
        echo json_encode($enrollments);
    }
    
    /**
     * Get course enrollments (for instructors/admins)
     * GET /api/courses/{courseId}/enrollments
     */
    public static function getCourseEnrollments(int $courseId): void {
        $user = Auth::user();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }
        
        $status = $_GET['status'] ?? null;
        
        $enrollments = EnrollmentService::getCourseEnrollments($courseId, $status);
        
        http_response_code(200);
        echo json_encode($enrollments);
    }
    
    /**
     * Update lesson progress
     * POST /api/enrollments/{enrollmentId}/progress
     */
    public static function updateProgress(int $enrollmentId): void {
        $user = Auth::user();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }
        
        $userId = $user['id'] ?? null;
        if (!$userId) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid user data']);
            return;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['lesson_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'lesson_id is required']);
            return;
        }
        
        $input['user_id'] = $userId;
        
        $success = EnrollmentService::updateProgress($enrollmentId, $input['lesson_id'], $input);
        
        if ($success) {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Progress updated successfully'
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update progress']);
        }
    }
    
    /**
     * Get lesson progress
     * GET /api/enrollments/{enrollmentId}/progress
     */
    public static function getProgress(int $enrollmentId): void {
        $user = Auth::user();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }
        
        $progress = EnrollmentService::getAllLessonProgress($enrollmentId);
        
        http_response_code(200);
        echo json_encode($progress);
    }
    
    /**
     * Cancel enrollment
     * POST /api/enrollments/{enrollmentId}/cancel
     */
    public static function cancel(int $enrollmentId): void {
        $user = Auth::user();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }
        
        $success = EnrollmentService::cancelEnrollment($enrollmentId);
        
        if ($success) {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Enrollment cancelled successfully'
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to cancel enrollment']);
        }
    }
    
    /**
     * Get workspace enrollment statistics
     * GET /api/enrollments/stats
     */
    public static function getStats(): void {
        try {
            $ctx = TenantContext::resolveOrFail();
            $workspaceId = $ctx->workspaceId;
        } catch (\Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }
        
        $stats = EnrollmentService::getWorkspaceStats($workspaceId);
        
        http_response_code(200);
        echo json_encode($stats);
    }
}
