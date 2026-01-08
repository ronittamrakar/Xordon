<?php
/**
 * Files Controller
 * Handles file uploads, attachments, and media library
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../services/EmailService.php';

class FilesController {
    private static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        throw new Exception('Workspace context required');
    }

    private static function getUserId(): ?int {
        try {
            return Auth::userIdOrFail();
        } catch (Exception $e) {
            return null;
        }
    }

    private static function getUploadDir(): string {
        $baseDir = __DIR__ . '/../../uploads';
        if (!is_dir($baseDir)) {
            mkdir($baseDir, 0755, true);
        }
        return $baseDir;
    }

    /**
     * Log file activity
     */
    private static function logActivity(int $fileId, string $activityType, ?string $description = null, ?array $metadata = null): void {
        try {
            $db = Database::conn();
            $userId = self::getUserId();
            
            $stmt = $db->prepare("
                INSERT INTO file_activities (file_id, user_id, activity_type, description, metadata, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;
            $metadataJson = $metadata ? json_encode($metadata) : null;
            
            $stmt->execute([$fileId, $userId, $activityType, $description, $metadataJson, $ipAddress, $userAgent]);
        } catch (Exception $e) {
            error_log("Failed to log activity: " . $e->getMessage());
        }
    }

    /**
     * List files with filtering
     */
    /**
     * List files with filtering
     */
    public static function index() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $where = ['workspace_id = ?'];
            $params = [$workspaceId];

            // Filter by entity
            if (!empty($_GET['entity_type']) && !empty($_GET['entity_id'])) {
                $where[] = 'entity_type = ?';
                $where[] = 'entity_id = ?';
                $params[] = $_GET['entity_type'];
                $params[] = (int)$_GET['entity_id'];
            }

            // Filter by folder (ID)
            if (isset($_GET['folder_id'])) {
                if ($_GET['folder_id'] === '' || $_GET['folder_id'] === 'null') {
                    $where[] = 'folder_id IS NULL';
                } else {
                    $where[] = 'folder_id = ?';
                    $params[] = (int)$_GET['folder_id'];
                }
            } elseif (isset($_GET['folder'])) {
                // Legacy support or fallback: if 'folder' param is used, try to look up ID
                $folderName = $_GET['folder'];
                if ($folderName === 'All Files' || $folderName === '') {
                    // Do nothing, show all? Or root? Assuming root usually.
                    // But legacy 'All Files' usually meant no filter.
                } else {
                    $fStmt = $db->prepare("SELECT id FROM folders WHERE name = ? AND workspace_id = ?");
                    $fStmt->execute([$folderName, $workspaceId]);
                    $fid = $fStmt->fetchColumn();
                    if ($fid) {
                        $where[] = 'folder_id = ?';
                        $params[] = $fid;
                    }
                }
            }

            // Filter by category
            if (!empty($_GET['category'])) {
                $where[] = 'category = ?';
                $params[] = $_GET['category'];
            }

            // Search
            if (!empty($_GET['q'])) {
                $where[] = '(filename LIKE ? OR original_filename LIKE ? OR description LIKE ?)';
                $search = '%' . $_GET['q'] . '%';
                $params[] = $search;
                $params[] = $search;
                $params[] = $search;
            }

            // Exclude deleted
            $where[] = 'deleted_at IS NULL';
            $where[] = 'is_archived = 0';

            $whereClause = implode(' AND ', $where);

            // Pagination
            $limit = min((int)($_GET['limit'] ?? 50), 100);
            $offset = (int)($_GET['offset'] ?? 0);

            $stmt = $db->prepare("
                SELECT * FROM files 
                WHERE $whereClause 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?
            ");
            $params[] = $limit;
            $params[] = $offset;
            $stmt->execute($params);
            $files = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get total count
            $countParams = array_slice($params, 0, -2);
            $countStmt = $db->prepare("SELECT COUNT(*) FROM files WHERE $whereClause");
            $countStmt->execute($countParams);
            $total = (int)$countStmt->fetchColumn();

            // Parse metadata JSON and url
            foreach ($files as &$file) {
                $file['metadata'] = $file['metadata'] ? json_decode($file['metadata'], true) : null;
                $file['url'] = '/uploads/' . $file['storage_path'];
            }

            return Response::json([
                'data' => $files,
                'meta' => [
                    'total' => $total,
                    'limit' => $limit,
                    'offset' => $offset
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch files: ' . $e->getMessage());
        }
    }

    /**
     * Get single file
     */
    public static function show($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT * FROM files 
                WHERE id = ? AND workspace_id = ? AND deleted_at IS NULL
            ");
            $stmt->execute([$id, $workspaceId]);
            $file = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$file) {
                return Response::error('File not found', 404);
            }

            $file['metadata'] = $file['metadata'] ? json_decode($file['metadata'], true) : null;

            // Get tags
            $tagStmt = $db->prepare("SELECT tag FROM file_tags WHERE file_id = ?");
            $tagStmt->execute([$id]);
            $file['tags'] = $tagStmt->fetchAll(PDO::FETCH_COLUMN);

            return Response::json(['data' => $file]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch file: ' . $e->getMessage());
        }
    }

    /**
     * Upload file(s)
     */
    public static function upload() {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();

            if (empty($_FILES['file'])) {
                return Response::error('No file uploaded', 400);
            }

            $uploadDir = self::getUploadDir();
            $workspaceDir = $uploadDir . '/' . $workspaceId;
            if (!is_dir($workspaceDir)) {
                mkdir($workspaceDir, 0755, true);
            }

            // Handle single or multiple files
            $files = $_FILES['file'];
            $isMultiple = is_array($files['name']);
            
            if (!$isMultiple) {
                $files = [
                    'name' => [$files['name']],
                    'type' => [$files['type']],
                    'tmp_name' => [$files['tmp_name']],
                    'error' => [$files['error']],
                    'size' => [$files['size']]
                ];
            }

            $uploaded = [];
            $errors = [];

            for ($i = 0; $i < count($files['name']); $i++) {
                if ($files['error'][$i] !== UPLOAD_ERR_OK) {
                    $errors[] = ['filename' => $files['name'][$i], 'error' => 'Upload failed'];
                    continue;
                }

                $originalFilename = $files['name'][$i];
                $mimeType = $files['type'][$i];
                $fileSize = $files['size'][$i];
                $tmpName = $files['tmp_name'][$i];

                // Generate unique filename
                $ext = pathinfo($originalFilename, PATHINFO_EXTENSION);
                $filename = uniqid() . '_' . time() . ($ext ? '.' . $ext : '');
                $storagePath = $workspaceId . '/' . date('Y/m') . '/' . $filename;
                
                $fullDir = $workspaceDir . '/' . date('Y/m');
                if (!is_dir($fullDir)) {
                    mkdir($fullDir, 0755, true);
                }

                $fullPath = $uploadDir . '/' . $storagePath;

                if (!move_uploaded_file($tmpName, $fullPath)) {
                    $errors[] = ['filename' => $originalFilename, 'error' => 'Failed to save file'];
                    continue;
                }

                // Determine category
                $category = 'attachment';
                if (strpos($mimeType, 'image/') === 0) {
                    $category = 'image';
                } elseif (strpos($mimeType, 'video/') === 0) {
                    $category = 'video';
                } elseif (strpos($mimeType, 'audio/') === 0) {
                    $category = 'audio';
                } elseif (in_array($mimeType, ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])) {
                    $category = 'document';
                }

                // Get image dimensions if applicable
                $metadata = [];
                if ($category === 'image') {
                    $imageInfo = @getimagesize($fullPath);
                    if ($imageInfo) {
                        $metadata['width'] = $imageInfo[0];
                        $metadata['height'] = $imageInfo[1];
                    }
                }

                $companyId = $_POST['company_id'] ?? null;
                $entityType = $_POST['entity_type'] ?? null;
                $entityId = $_POST['entity_id'] ?? null;
                
                // Handle folder input (could be ID or Name)
                $folderId = null;
                $folderInput = $_POST['folder'] ?? null;
                if ($folderInput && $folderInput !== 'All Files') {
                    if (is_numeric($folderInput)) {
                        $folderId = (int)$folderInput;
                    } else {
                        // Look up by name
                        $fStmt = $db->prepare("SELECT id FROM folders WHERE name = ? AND workspace_id = ?");
                        $fStmt->execute([$folderInput, $workspaceId]);
                        $folderId = $fStmt->fetchColumn() ?: null;
                    }
                }

                $stmt = $db->prepare("
                    INSERT INTO files (
                        workspace_id, company_id, user_id, filename, original_filename,
                        mime_type, file_size, storage_path, storage_provider, category,
                        entity_type, entity_id, folder_id, metadata
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'local', ?, ?, ?, ?, ?)
                ");

                $stmt->execute([
                    $workspaceId,
                    $companyId,
                    $userId,
                    $filename,
                    $originalFilename,
                    $mimeType,
                    $fileSize,
                    $storagePath,
                    $category,
                    $entityType,
                    $entityId,
                    $folderId,
                    !empty($metadata) ? json_encode($metadata) : null
                ]);

                $fileId = $db->lastInsertId();
                
                // Log activity
                self::logActivity($fileId, 'upload', "Uploaded file: $originalFilename");

                $uploaded[] = [
                    'id' => (int)$fileId,
                    'filename' => $filename,
                    'original_filename' => $originalFilename,
                    'mime_type' => $mimeType,
                    'file_size' => $fileSize,
                    'category' => $category,
                    'url' => '/uploads/' . $storagePath,
                    'metadata' => $metadata ?: null
                ];
            }

            return Response::json([
                'data' => $uploaded,
                'errors' => $errors
            ], count($errors) > 0 && count($uploaded) === 0 ? 400 : 200);

        } catch (Exception $e) {
            return Response::error('Upload failed: ' . $e->getMessage());
        }
    }

    /**
     * Update file metadata
     */
    public static function update($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Verify ownership
            $stmt = $db->prepare("SELECT id FROM files WHERE id = ? AND workspace_id = ? AND deleted_at IS NULL");
            $stmt->execute([$id, $workspaceId]);
            if (!$stmt->fetch()) {
                return Response::error('File not found', 404);
            }

            $updates = [];
            $params = [];

            $allowedFields = ['folder', 'category', 'alt_text', 'description', 'is_public', 'entity_type', 'entity_id', 'original_filename', 'folder_id'];
            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }

            if (empty($updates)) {
                return Response::error('No valid fields to update', 400);
            }

            $params[] = $id;
            $stmt = $db->prepare("UPDATE files SET " . implode(', ', $updates) . " WHERE id = ?");
            $stmt->execute($params);

            // Handle tags
            if (isset($data['tags']) && is_array($data['tags'])) {
                $db->prepare("DELETE FROM file_tags WHERE file_id = ?")->execute([$id]);
                
                $tagStmt = $db->prepare("INSERT INTO file_tags (file_id, tag) VALUES (?, ?)");
                foreach ($data['tags'] as $tag) {
                    $tagStmt->execute([$id, trim($tag)]);
                }
            }

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Update failed: ' . $e->getMessage());
        }
    }

    /**
     * Delete file (soft delete)
     */
    public static function delete($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                UPDATE files SET deleted_at = NOW() 
                WHERE id = ? AND workspace_id = ?
            ");
            $stmt->execute([$id, $workspaceId]);

            if ($stmt->rowCount() === 0) {
                return Response::error('File not found', 404);
            }

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Delete failed: ' . $e->getMessage());
        }
    }

    /**
     * Attach file to entity
     */
    public static function attach($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['entity_type']) || empty($data['entity_id'])) {
                return Response::error('entity_type and entity_id required', 400);
            }

            $stmt = $db->prepare("
                UPDATE files SET entity_type = ?, entity_id = ? 
                WHERE id = ? AND workspace_id = ? AND deleted_at IS NULL
            ");
            $stmt->execute([$data['entity_type'], $data['entity_id'], $id, $workspaceId]);

            if ($stmt->rowCount() === 0) {
                return Response::error('File not found', 404);
            }

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Attach failed: ' . $e->getMessage());
        }
    }

    /**
     * Get files for an entity
     */
    public static function forEntity($entityType, $entityId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT * FROM files 
                WHERE workspace_id = ? AND entity_type = ? AND entity_id = ? AND deleted_at IS NULL
                ORDER BY created_at DESC
            ");
            $stmt->execute([$workspaceId, $entityType, $entityId]);
            $files = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($files as &$file) {
                $file['metadata'] = $file['metadata'] ? json_decode($file['metadata'], true) : null;
                $file['url'] = '/uploads/' . $file['storage_path'];
            }

            return Response::json(['data' => $files]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch files: ' . $e->getMessage());
        }
    }

    /**
     * Get folders list
     */
    public static function folders() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT f.id, f.name, f.parent_id, f.created_at,
                (SELECT COUNT(*) FROM files WHERE folder_id = f.id AND deleted_at IS NULL) as file_count,
                (SELECT SUM(file_size) FROM files WHERE folder_id = f.id AND deleted_at IS NULL) as total_size
                FROM folders f
                WHERE f.workspace_id = ? AND f.deleted_at IS NULL
                ORDER BY f.name
            ");
            $stmt->execute([$workspaceId]);
            $folders = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $folders]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch folders: ' . $e->getMessage());
        }
    }

    /**
     * Create a new folder
     */
    public static function createFolder() {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['name'])) {
                return Response::error('Folder name is required', 400);
            }
            
            $parentId = !empty($data['parent_id']) ? (int)$data['parent_id'] : null;

            $folderName = trim($data['name']);
            
            // Check if folder already exists in this parent
            $sql = "SELECT id FROM folders WHERE workspace_id = ? AND name = ? AND deleted_at IS NULL";
            $params = [$workspaceId, $folderName];
            
            if ($parentId) {
                $sql .= " AND parent_id = ?";
                $params[] = $parentId;
            } else {
                $sql .= " AND parent_id IS NULL";
            }
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            
            if ($stmt->fetch()) {
                return Response::error('Folder already exists', 400);
            }

            $ins = $db->prepare("INSERT INTO folders (workspace_id, user_id, name, parent_id, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())");
            $ins->execute([$workspaceId, $userId, $folderName, $parentId]);
            $folderId = $db->lastInsertId();

            return Response::json([
                'success' => true,
                'data' => [
                    'id' => (int)$folderId,
                    'name' => $folderName,
                    'parent_id' => $parentId,
                    'file_count' => 0,
                    'total_size' => 0,
                    'created_at' => date('Y-m-d H:i:s')
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to create folder: ' . $e->getMessage());
        }
    }

    /**
     * Move files or folders
     */
    public static function move() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Destination folder ID (null for root)
            $targetFolderId = !empty($data['folder_id']) ? (int)$data['folder_id'] : null;

            // Move Files
            if (!empty($data['file_ids']) && is_array($data['file_ids'])) {
                $fileIds = array_map('intval', $data['file_ids']);
                $placeholders = implode(',', array_fill(0, count($fileIds), '?'));
                $params = array_merge([$targetFolderId], $fileIds, [$workspaceId]);
                
                $stmt = $db->prepare("
                    UPDATE files 
                    SET folder_id = ? 
                    WHERE id IN ($placeholders) AND workspace_id = ? AND deleted_at IS NULL
                ");
                $stmt->execute($params);
                
                foreach ($fileIds as $id) {
                    self::logActivity($id, 'move', "Moved to folder ID: " . ($targetFolderId ?: 'Root'));
                }
            }

            // Move Folders
            if (!empty($data['folder_ids']) && is_array($data['folder_ids'])) {
                $folderIds = array_map('intval', $data['folder_ids']);
                
                if ($targetFolderId) {
                    foreach ($folderIds as $fId) {
                        if ($fId === $targetFolderId) {
                            return Response::error('Cannot move folder into itself', 400);
                        }
                        
                        if (self::isDescendantOf($targetFolderId, $fId, $db)) {
                            return Response::error('Cannot move folder into one of its subfolders', 400);
                        }
                    }
                }

                $placeholders = implode(',', array_fill(0, count($folderIds), '?'));
                $params = array_merge([$targetFolderId], $folderIds, [$workspaceId]);

                $stmt = $db->prepare("
                    UPDATE folders 
                    SET parent_id = ? 
                    WHERE id IN ($placeholders) AND workspace_id = ? AND deleted_at IS NULL
                ");
                $stmt->execute($params);
            }

            return Response::json([
                'success' => true,
                'message' => 'Items moved successfully'
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to move items: ' . $e->getMessage());
        }
    }

    /**
     * Helper to check if a folder is a descendant of another
     */
    private static function isDescendantOf($targetId, $potentialAncestorId, $db) {
        $currentId = $targetId;
        while ($currentId !== null) {
            $stmt = $db->prepare("SELECT parent_id FROM folders WHERE id = ? AND deleted_at IS NULL");
            $stmt->execute([$currentId]);
            $folder = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$folder) return false;
            
            if ((int)$folder['parent_id'] === (int)$potentialAncestorId) {
                return true;
            }
            
            $currentId = $folder['parent_id'] ? (int)$folder['parent_id'] : null;
        }
        return false;
    }

    /**
     * Bulk delete files
     */
    public static function bulkDelete() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['file_ids']) || !is_array($data['file_ids'])) {
                return Response::error('file_ids array is required', 400);
            }

            $fileIds = array_map('intval', $data['file_ids']);
            $placeholders = implode(',', array_fill(0, count($fileIds), '?'));
            $params = array_merge($fileIds, [$workspaceId]);

            $stmt = $db->prepare("
                UPDATE files 
                SET deleted_at = NOW() 
                WHERE id IN ($placeholders) AND workspace_id = ? AND deleted_at IS NULL
            ");
            $stmt->execute($params);

            // Log activity for each file
            foreach ($fileIds as $id) {
                self::logActivity($id, 'delete', "File deleted (bulk)");
            }

            return Response::json([
                'success' => true,
                'message' => $stmt->rowCount() . ' file(s) deleted'
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to delete files: ' . $e->getMessage());
        }
    }

    /**
     * Toggle star/favorite status
     */
    public static function toggleStar($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            // Get current starred status
            $stmt = $db->prepare("
                SELECT starred FROM files 
                WHERE id = ? AND workspace_id = ? AND deleted_at IS NULL
            ");
            $stmt->execute([$id, $workspaceId]);
            $file = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$file) {
                return Response::error('File not found', 404);
            }

            $newStarred = !($file['starred'] ?? false);

            $updateStmt = $db->prepare("
                UPDATE files 
                SET starred = ? 
                WHERE id = ? AND workspace_id = ?
            ");
            $updateStmt->execute([$newStarred ? 1 : 0, $id, $workspaceId]);

            // Log activity
            $activityType = $newStarred ? 'star' : 'unstar';
            self::logActivity($id, $activityType, $newStarred ? 'File starred' : 'File unstarred');

            return Response::json([
                'success' => true,
                'starred' => $newStarred
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to toggle star: ' . $e->getMessage());
        }
    }

    /**
     * Get file activity timeline
     */
    public static function getActivity($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            // Verify file exists and user has access
            $stmt = $db->prepare("
                SELECT id FROM files 
                WHERE id = ? AND workspace_id = ? AND deleted_at IS NULL
            ");
            $stmt->execute([$id, $workspaceId]);
            
            if (!$stmt->fetch()) {
                return Response::error('File not found', 404);
            }

            // Get activities
            $activityStmt = $db->prepare("
                SELECT 
                    fa.*,
                    u.first_name,
                    u.last_name,
                    u.email
                FROM file_activities fa
                LEFT JOIN users u ON fa.user_id = u.id
                WHERE fa.file_id = ?
                ORDER BY fa.created_at DESC
                LIMIT 100
            ");
            $activityStmt->execute([$id]);
            $activities = $activityStmt->fetchAll(PDO::FETCH_ASSOC);

            // Parse metadata JSON
            foreach ($activities as &$activity) {
                $activity['metadata'] = $activity['metadata'] ? json_decode($activity['metadata'], true) : null;
                $activity['user_name'] = trim(($activity['first_name'] ?? '') . ' ' . ($activity['last_name'] ?? '')) ?: ($activity['email'] ?? 'Unknown');
            }

            return Response::json([
                'success' => true,
                'data' => $activities
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to get activity: ' . $e->getMessage());
        }
    }

    /**
     * Get storage quota stats
     */
    public static function getStorageQuota() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT SUM(file_size) as used_bytes, COUNT(*) as file_count 
                FROM files 
                WHERE workspace_id = ? AND deleted_at IS NULL
            ");
            $stmt->execute([$workspaceId]);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);

            // Default limit 1GB for now
            $limitBytes = 1024 * 1024 * 1024; 

            return Response::json([
                'data' => [
                    'used_bytes' => (int)($stats['used_bytes'] ?? 0),
                    'total_bytes' => $limitBytes,
                    'file_count' => (int)($stats['file_count'] ?? 0),
                    'percentage' => round((($stats['used_bytes'] ?? 0) / $limitBytes) * 100, 2)
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to get storage quota: ' . $e->getMessage());
        }
    }
    public static function renameFolder($id = null) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            
            if (!$id) return Response::error('Folder ID required', 400);

            if (empty($data['name'])) {
                return Response::error('New name required', 400);
            }
            
            $stmt = $db->prepare("
                UPDATE folders SET name = ?, updated_at = NOW()
                WHERE id = ? AND workspace_id = ? AND deleted_at IS NULL
            ");
            $stmt->execute([$data['name'], $id, $workspaceId]);
            
            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Rename failed: ' . $e->getMessage());
        }
    }

    public static function deleteFolder($id = null) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            if (!$id) return Response::error('Folder ID required', 400); // From route params
            
            // Soft delete folder
            $stmt = $db->prepare("
                UPDATE folders SET deleted_at = NOW() 
                WHERE id = ? AND workspace_id = ? AND deleted_at IS NULL
            ");
            $stmt->execute([$id, $workspaceId]);
            
            // Soft delete files directly in this folder
            $stmtFiles = $db->prepare("
                UPDATE files SET deleted_at = NOW() 
                WHERE folder_id = ? AND workspace_id = ? AND deleted_at IS NULL
            ");
            $stmtFiles->execute([$id, $workspaceId]);
            
            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Delete failed: ' . $e->getMessage());
        }
    }

    public static function renameFile($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            
            if (empty($data['name'])) {
                return Response::error('Name required', 400);
            }
            
            $stmt = $db->prepare("
                UPDATE files SET original_filename = ? 
                WHERE id = ? AND workspace_id = ? AND deleted_at IS NULL
            ");
            $stmt->execute([$data['name'], $id, $workspaceId]);
            
            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Rename failed: ' . $e->getMessage());
        }
    }
}

