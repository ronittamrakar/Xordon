<?php
namespace Xordon\Controllers;

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../TenantContext.php';
require_once __DIR__ . '/../services/CourseService.php';

use Xordon\Services\CourseService;
use Auth;
use TenantContext;

class CourseController {
    
    /**
     * Get all courses
     * GET /api/courses
     */
    public static function index(): void {
        try {
            $ctx = TenantContext::resolveOrFail();
            $workspaceId = $ctx->workspaceId;
        } catch (\Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }
        
        // Get filters from query params
        $filters = [];
        if (isset($_GET['status'])) $filters['status'] = $_GET['status'];
        if (isset($_GET['category'])) $filters['category'] = $_GET['category'];
        if (isset($_GET['level'])) $filters['level'] = $_GET['level'];
        if (isset($_GET['is_free'])) $filters['is_free'] = $_GET['is_free'] === 'true';
        if (isset($_GET['search'])) $filters['search'] = $_GET['search'];
        
        $courses = CourseService::getCourses($workspaceId, $filters);
        
        // Parse JSON fields
        foreach ($courses as &$course) {
            if (isset($course['learning_outcomes'])) {
                $course['learning_outcomes'] = json_decode($course['learning_outcomes'], true);
            }
        }
        
        http_response_code(200);
        echo json_encode($courses);
    }
    
    /**
     * Get a single course
     * GET /api/courses/{id}
     */
    public static function show(int $id): void {
        try {
            $ctx = TenantContext::resolveOrFail();
            $workspaceId = $ctx->workspaceId;
        } catch (\Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }
        
        $course = CourseService::getCourse($id, $workspaceId);
        
        if (!$course) {
            http_response_code(404);
            echo json_encode(['error' => 'Course not found']);
            return;
        }
        
        // Parse JSON fields
        if (isset($course['learning_outcomes'])) {
            $course['learning_outcomes'] = json_decode($course['learning_outcomes'], true);
        }
        
        // Get modules and lessons
        $modules = CourseService::getModules($id);
        foreach ($modules as &$module) {
            $module['lessons'] = CourseService::getLessons($module['id']);
            foreach ($module['lessons'] as &$lesson) {
                if (isset($lesson['attachments'])) {
                    $lesson['attachments'] = json_decode($lesson['attachments'], true);
                }
            }
        }
        
        $course['modules'] = $modules;
        
        // Get statistics
        $course['stats'] = CourseService::getCourseStats($id);
        
        http_response_code(200);
        echo json_encode($course);
    }
    
    /**
     * Create a new course
     * POST /api/courses
     */
    public static function store(): void {
        try {
            $ctx = TenantContext::resolveOrFail();
            $workspaceId = $ctx->workspaceId;
        } catch (\Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['title'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Title is required']);
            return;
        }
        
        $courseId = CourseService::createCourse($workspaceId, $input);
        
        if ($courseId) {
            $course = CourseService::getCourse($courseId, $workspaceId);
            
            if (isset($course['learning_outcomes'])) {
                $course['learning_outcomes'] = json_decode($course['learning_outcomes'], true);
            }
            
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Course created successfully',
                'data' => $course
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create course']);
        }
    }
    
    /**
     * Update a course
     * PUT /api/courses/{id}
     */
    public static function update(int $id): void {
        try {
            $ctx = TenantContext::resolveOrFail();
            $workspaceId = $ctx->workspaceId;
        } catch (\Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid input']);
            return;
        }
        
        $success = CourseService::updateCourse($id, $workspaceId, $input);
        
        if ($success) {
            $course = CourseService::getCourse($id, $workspaceId);
            
            if (isset($course['learning_outcomes'])) {
                $course['learning_outcomes'] = json_decode($course['learning_outcomes'], true);
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Course updated successfully',
                'data' => $course
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update course']);
        }
    }
    
    /**
     * Delete a course
     * DELETE /api/courses/{id}
     */
    public static function delete(int $id): void {
        try {
            $ctx = TenantContext::resolveOrFail();
            $workspaceId = $ctx->workspaceId;
        } catch (\Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }
        
        $success = CourseService::deleteCourse($id, $workspaceId);
        
        if ($success) {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Course deleted successfully'
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete course']);
        }
    }
    
    /**
     * Publish a course
     * POST /api/courses/{id}/publish
     */
    public static function publish(int $id): void {
        try {
            $ctx = TenantContext::resolveOrFail();
            $workspaceId = $ctx->workspaceId;
        } catch (\Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }
        
        $success = CourseService::publishCourse($id, $workspaceId);
        
        if ($success) {
            $course = CourseService::getCourse($id, $workspaceId);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Course published successfully',
                'data' => $course
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to publish course']);
        }
    }
    
    /**
     * Create a module
     * POST /api/courses/{id}/modules
     */
    public static function createModule(int $courseId): void {
        try {
            $ctx = TenantContext::resolveOrFail();
            $workspaceId = $ctx->workspaceId;
        } catch (\Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['title'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Title is required']);
            return;
        }
        
        $moduleId = CourseService::createModule($courseId, $input);
        
        if ($moduleId) {
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Module created successfully',
                'data' => ['id' => $moduleId]
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create module']);
        }
    }
    
    /**
     * Create a lesson
     * POST /api/courses/{courseId}/modules/{moduleId}/lessons
     */
    public static function createLesson(int $courseId, int $moduleId): void {
        try {
            $ctx = TenantContext::resolveOrFail();
            $workspaceId = $ctx->workspaceId;
        } catch (\Exception $e) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['title']) || !isset($input['content_type'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Title and content_type are required']);
            return;
        }
        
        $lessonId = CourseService::createLesson($moduleId, $courseId, $input);
        
        if ($lessonId) {
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Lesson created successfully',
                'data' => ['id' => $lessonId]
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create lesson']);
        }
    }
}
