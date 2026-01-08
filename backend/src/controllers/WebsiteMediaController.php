<?php

use PDO;
use Exception;

class WebsiteMediaController
{
    private PDO $db;
    private ?int $workspaceId;
    private ?int $userId;
    private string $uploadDir;
    private string $baseUrl;

    public function __construct(PDO $db)
    {
        $this->db = $db;
        $tenantContext = $GLOBALS['tenantContext'] ?? null;
        $this->workspaceId = $tenantContext?->workspaceId;
        $this->userId = $tenantContext?->userId;
        
        // Configure upload directory
        $this->uploadDir = __DIR__ . '/../../uploads/websites';
        
        if (isset($_ENV['APP_URL']) && !empty($_ENV['APP_URL'])) {
            $this->baseUrl = $_ENV['APP_URL'];
        } else {
            $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
            $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
            $this->baseUrl = $protocol . $host;
        }
        
        // Create upload directory if it doesn't exist
        if (!is_dir($this->uploadDir)) {
            mkdir($this->uploadDir, 0755, true);
        }
    }

    /**
     * Upload media file for a website
     */
    public function uploadMedia(int $websiteId, array $file): array
    {
        if (!$this->workspaceId) {
            throw new Exception('Workspace context required');
        }

        // Verify website exists and belongs to workspace
        $stmt = $this->db->prepare("
            SELECT id FROM websites 
            WHERE id = :id AND workspace_id = :workspace_id AND deleted_at IS NULL
        ");
        $stmt->execute([
            'id' => $websiteId,
            'workspace_id' => $this->workspaceId
        ]);

        if (!$stmt->fetch()) {
            throw new Exception('Website not found', 404);
        }

        // Validate file
        $this->validateFile($file);

        // Generate unique filename
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = uniqid() . '_' . time() . '.' . $extension;
        
        // Create workspace-specific directory
        $workspaceDir = $this->uploadDir . '/' . $this->workspaceId;
        if (!is_dir($workspaceDir)) {
            mkdir($workspaceDir, 0755, true);
        }

        // Create website-specific directory
        $websiteDir = $workspaceDir . '/' . $websiteId;
        if (!is_dir($websiteDir)) {
            mkdir($websiteDir, 0755, true);
        }

        $filePath = $websiteDir . '/' . $filename;
        $fileUrl = $this->baseUrl . '/uploads/websites/' . $this->workspaceId . '/' . $websiteId . '/' . $filename;

        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            throw new Exception('Failed to upload file', 500);
        }

        // Get image dimensions if it's an image
        $dimensions = $this->getImageDimensions($filePath, $file['type']);

        // Save to database
        $stmt = $this->db->prepare("
            INSERT INTO website_media (
                website_id,
                workspace_id,
                filename,
                original_filename,
                file_path,
                file_url,
                file_type,
                file_size,
                mime_type,
                width,
                height
            ) VALUES (
                :website_id,
                :workspace_id,
                :filename,
                :original_filename,
                :file_path,
                :file_url,
                :file_type,
                :file_size,
                :mime_type,
                :width,
                :height
            )
        ");

        $stmt->execute([
            'website_id' => $websiteId,
            'workspace_id' => $this->workspaceId,
            'filename' => $filename,
            'original_filename' => $file['name'],
            'file_path' => $filePath,
            'file_url' => $fileUrl,
            'file_type' => $this->getFileType($file['type']),
            'file_size' => $file['size'],
            'mime_type' => $file['type'],
            'width' => $dimensions['width'] ?? null,
            'height' => $dimensions['height'] ?? null
        ]);

        $mediaId = $this->db->lastInsertId();

        return [
            'id' => $mediaId,
            'filename' => $filename,
            'original_filename' => $file['name'],
            'url' => $fileUrl,
            'file_type' => $this->getFileType($file['type']),
            'file_size' => $file['size'],
            'mime_type' => $file['type'],
            'width' => $dimensions['width'] ?? null,
            'height' => $dimensions['height'] ?? null,
            'created_at' => date('Y-m-d H:i:s')
        ];
    }

    /**
     * Get all media for a website
     */
    public function getWebsiteMedia(int $websiteId): array
    {
        if (!$this->workspaceId) {
            throw new Exception('Workspace context required');
        }

        $stmt = $this->db->prepare("
            SELECT 
                id,
                filename,
                original_filename,
                file_url,
                file_type,
                file_size,
                mime_type,
                width,
                height,
                alt_text,
                created_at
            FROM website_media
            WHERE website_id = :website_id
                AND workspace_id = :workspace_id
            ORDER BY created_at DESC
        ");

        $stmt->execute([
            'website_id' => $websiteId,
            'workspace_id' => $this->workspaceId
        ]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Delete media file
     */
    public function deleteMedia(int $mediaId): bool
    {
        if (!$this->workspaceId) {
            throw new Exception('Workspace context required');
        }

        // Get media info
        $stmt = $this->db->prepare("
            SELECT file_path 
            FROM website_media 
            WHERE id = :id AND workspace_id = :workspace_id
        ");
        $stmt->execute([
            'id' => $mediaId,
            'workspace_id' => $this->workspaceId
        ]);

        $media = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$media) {
            throw new Exception('Media not found', 404);
        }

        // Delete file from filesystem
        if (file_exists($media['file_path'])) {
            unlink($media['file_path']);
        }

        // Delete from database
        $stmt = $this->db->prepare("
            DELETE FROM website_media 
            WHERE id = :id AND workspace_id = :workspace_id
        ");

        return $stmt->execute([
            'id' => $mediaId,
            'workspace_id' => $this->workspaceId
        ]);
    }

    /**
     * Validate uploaded file
     */
    private function validateFile(array $file): void
    {
        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new Exception('File upload error: ' . $file['error'], 400);
        }

        // Check file size (max 10MB)
        $maxSize = 10 * 1024 * 1024; // 10MB
        if ($file['size'] > $maxSize) {
            throw new Exception('File size exceeds maximum allowed size (10MB)', 400);
        }

        // Check file type
        $allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            'video/mp4',
            'video/webm',
            'audio/mpeg',
            'audio/mp3',
            'audio/wav',
            'application/pdf',
            'application/zip'
        ];

        if (!in_array($file['type'], $allowedTypes)) {
            throw new Exception('File type not allowed', 400);
        }

        // Additional security: check file extension
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp4', 'webm', 'mp3', 'wav', 'pdf', 'zip'];

        if (!in_array($extension, $allowedExtensions)) {
            throw new Exception('File extension not allowed', 400);
        }
    }

    /**
     * Get file type category
     */
    private function getFileType(string $mimeType): string
    {
        if (strpos($mimeType, 'image/') === 0) return 'image';
        if (strpos($mimeType, 'video/') === 0) return 'video';
        if (strpos($mimeType, 'audio/') === 0) return 'audio';
        if ($mimeType === 'application/pdf') return 'pdf';
        return 'other';
    }

    /**
     * Get image dimensions
     */
    private function getImageDimensions(string $filePath, string $mimeType): array
    {
        if (strpos($mimeType, 'image/') !== 0) {
            return [];
        }

        try {
            $size = getimagesize($filePath);
            if ($size) {
                return [
                    'width' => $size[0],
                    'height' => $size[1]
                ];
            }
        } catch (Exception $e) {
            // Ignore errors
        }

        return [];
    }

    /**
     * Update media alt text
     */
    public function updateAltText(int $mediaId, string $altText): bool
    {
        if (!$this->workspaceId) {
            throw new Exception('Workspace context required');
        }

        $stmt = $this->db->prepare("
            UPDATE website_media 
            SET alt_text = :alt_text
            WHERE id = :id AND workspace_id = :workspace_id
        ");

        return $stmt->execute([
            'id' => $mediaId,
            'workspace_id' => $this->workspaceId,
            'alt_text' => $altText
        ]);
    }
}
