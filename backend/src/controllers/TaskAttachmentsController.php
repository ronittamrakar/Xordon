<?php
/**
 * Task Attachments Controller
 * Manage file attachments for tasks
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class TaskAttachmentsController {
    
    private static function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }

    private static function verifyTaskAccess(PDO $pdo, int $taskId): bool {
        $scope = self::getWorkspaceScope();
        $stmt = $pdo->prepare("SELECT id FROM sales_tasks WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$taskId, $scope['val']]);
        return (bool)$stmt->fetch();
    }

    /**
     * GET /tasks/{taskId}/attachments
     */
    public static function index(string $taskId): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();

        if (!self::verifyTaskAccess($pdo, (int)$taskId)) {
            Response::error('Task not found', 404);
            return;
        }

        $stmt = $pdo->prepare("
            SELECT ta.*, u.name as uploaded_by_name
            FROM task_attachments ta
            LEFT JOIN users u ON ta.user_id = u.id
            WHERE ta.task_id = ?
            ORDER BY ta.created_at DESC
        ");
        $stmt->execute([$taskId]);
        $attachments = $stmt->fetchAll();

        Response::json(['items' => $attachments]);
    }

    /**
     * POST /tasks/{taskId}/attachments
     * Handles file upload
     */
    public static function upload(string $taskId): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();

        if (!self::verifyTaskAccess($pdo, (int)$taskId)) {
            Response::error('Task not found', 404);
            return;
        }

        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            Response::error('No file uploaded or upload error', 422);
            return;
        }

        $file = $_FILES['file'];
        $originalName = $file['name'];
        $mimeType = $file['type'];
        $fileSize = $file['size'];

        // Validate file size (max 10MB)
        $maxSize = 10 * 1024 * 1024;
        if ($fileSize > $maxSize) {
            Response::error('File too large. Maximum size is 10MB.', 422);
            return;
        }

        // Generate unique filename
        $extension = pathinfo($originalName, PATHINFO_EXTENSION);
        $filename = uniqid('task_') . '_' . time() . '.' . $extension;

        // Create upload directory if not exists
        $uploadDir = __DIR__ . '/../../storage/task-attachments/' . $taskId . '/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $filePath = $uploadDir . $filename;

        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            Response::error('Failed to save file', 500);
            return;
        }

        // Store relative path
        $relativePath = 'storage/task-attachments/' . $taskId . '/' . $filename;

        $stmt = $pdo->prepare("
            INSERT INTO task_attachments (task_id, user_id, filename, original_name, file_path, file_size, mime_type, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $taskId,
            $userId,
            $filename,
            $originalName,
            $relativePath,
            $fileSize,
            $mimeType
        ]);

        $id = $pdo->lastInsertId();

        // Update task attachment count
        self::updateAttachmentCount($pdo, (int)$taskId);

        $stmt = $pdo->prepare("
            SELECT ta.*, u.name as uploaded_by_name
            FROM task_attachments ta
            LEFT JOIN users u ON ta.user_id = u.id
            WHERE ta.id = ?
        ");
        $stmt->execute([$id]);
        $attachment = $stmt->fetch();

        Response::json($attachment, 201);
    }

    /**
     * DELETE /tasks/{taskId}/attachments/{id}
     */
    public static function delete(string $taskId, string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();

        if (!self::verifyTaskAccess($pdo, (int)$taskId)) {
            Response::error('Task not found', 404);
            return;
        }

        // Get attachment info first
        $stmt = $pdo->prepare("SELECT * FROM task_attachments WHERE id = ? AND task_id = ?");
        $stmt->execute([$id, $taskId]);
        $attachment = $stmt->fetch();

        if (!$attachment) {
            Response::error('Attachment not found', 404);
            return;
        }

        // Delete file from disk
        $filePath = __DIR__ . '/../../' . $attachment['file_path'];
        if (file_exists($filePath)) {
            unlink($filePath);
        }

        // Delete from database
        $stmt = $pdo->prepare("DELETE FROM task_attachments WHERE id = ?");
        $stmt->execute([$id]);

        // Update task attachment count
        self::updateAttachmentCount($pdo, (int)$taskId);

        Response::json(['success' => true]);
    }

    /**
     * GET /tasks/{taskId}/attachments/{id}/download
     */
    public static function download(string $taskId, string $id): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();

        if (!self::verifyTaskAccess($pdo, (int)$taskId)) {
            Response::error('Task not found', 404);
            return;
        }

        $stmt = $pdo->prepare("SELECT * FROM task_attachments WHERE id = ? AND task_id = ?");
        $stmt->execute([$id, $taskId]);
        $attachment = $stmt->fetch();

        if (!$attachment) {
            Response::error('Attachment not found', 404);
            return;
        }

        $filePath = __DIR__ . '/../../' . $attachment['file_path'];
        if (!file_exists($filePath)) {
            Response::error('File not found on disk', 404);
            return;
        }

        // Serve file
        header('Content-Type: ' . $attachment['mime_type']);
        header('Content-Disposition: attachment; filename="' . $attachment['original_name'] . '"');
        header('Content-Length: ' . $attachment['file_size']);
        readfile($filePath);
        exit;
    }

    private static function updateAttachmentCount(PDO $pdo, int $taskId): void {
        $stmt = $pdo->prepare("
            UPDATE sales_tasks SET 
                attachments_count = (SELECT COUNT(*) FROM task_attachments WHERE task_id = ?)
            WHERE id = ?
        ");
        $stmt->execute([$taskId, $taskId]);
    }
}
