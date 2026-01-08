<?php
/**
 * Secure File Upload Handler
 * Implements comprehensive file upload security:
 * - MIME type validation (both extension and magic bytes)
 * - File size limits
 * - Random filename generation
 * - Path traversal prevention
 * - Dangerous file type blocking
 */

require_once __DIR__ . '/Logger.php';

class SecureUpload {
    
    // Allowed MIME types mapped to extensions
    private static $allowedTypes = [
        // Images
        'image/jpeg' => ['jpg', 'jpeg'],
        'image/png' => ['png'],
        'image/gif' => ['gif'],
        'image/webp' => ['webp'],
        'image/svg+xml' => ['svg'], // Be careful with SVG - can contain scripts
        
        // Documents
        'application/pdf' => ['pdf'],
        'text/csv' => ['csv'],
        'text/plain' => ['txt'],
        'application/vnd.ms-excel' => ['xls'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => ['xlsx'],
        
        // Audio (for call recordings)
        'audio/mpeg' => ['mp3'],
        'audio/wav' => ['wav'],
        'audio/ogg' => ['ogg'],
        'audio/webm' => ['webm'],
    ];
    
    // Magic bytes for common file types (file signature validation)
    private static $magicBytes = [
        'image/jpeg' => ["\xFF\xD8\xFF"],
        'image/png' => ["\x89\x50\x4E\x47\x0D\x0A\x1A\x0A"],
        'image/gif' => ["GIF87a", "GIF89a"],
        'image/webp' => ["RIFF"],
        'application/pdf' => ["%PDF"],
        'audio/mpeg' => ["\xFF\xFB", "\xFF\xFA", "\xFF\xF3", "ID3"],
    ];
    
    // Dangerous extensions that should NEVER be allowed
    private static $dangerousExtensions = [
        'php', 'php3', 'php4', 'php5', 'php7', 'phtml', 'phar',
        'exe', 'bat', 'cmd', 'sh', 'bash', 'ps1',
        'js', 'vbs', 'wsf', 'wsh',
        'asp', 'aspx', 'jsp', 'jspx',
        'htaccess', 'htpasswd',
        'cgi', 'pl', 'py', 'rb',
    ];
    
    // Default max file size: 10MB
    private static $defaultMaxSize = 10485760;
    
    /**
     * Validate and process an uploaded file
     * 
     * @param array $file The $_FILES array element
     * @param array $allowedMimeTypes Allowed MIME types (empty = use defaults)
     * @param int $maxSize Maximum file size in bytes
     * @return array ['success' => bool, 'error' => string|null, 'file' => array|null]
     */
    public static function validate(array $file, array $allowedMimeTypes = [], int $maxSize = null): array {
        $maxSize = $maxSize ?? self::$defaultMaxSize;
        
        // Check for upload errors
        if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            return self::error('Invalid file upload');
        }
        
        if ($file['error'] !== UPLOAD_ERR_OK) {
            return self::error(self::getUploadErrorMessage($file['error']));
        }
        
        // Check file size
        if ($file['size'] > $maxSize) {
            return self::error('File size exceeds maximum allowed (' . self::formatBytes($maxSize) . ')');
        }
        
        if ($file['size'] === 0) {
            return self::error('File is empty');
        }
        
        // Get original extension
        $originalName = $file['name'] ?? '';
        $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        
        // Block dangerous extensions
        if (in_array($extension, self::$dangerousExtensions, true)) {
            Logger::warning('Blocked dangerous file upload', [
                'filename' => $originalName,
                'extension' => $extension,
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
            ]);
            return self::error('File type not allowed');
        }
        
        // Detect actual MIME type using finfo (magic bytes)
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $detectedMime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        // Determine allowed types
        $allowed = !empty($allowedMimeTypes) ? $allowedMimeTypes : array_keys(self::$allowedTypes);
        
        // Validate MIME type
        if (!in_array($detectedMime, $allowed, true)) {
            Logger::warning('Blocked file with disallowed MIME type', [
                'filename' => $originalName,
                'detected_mime' => $detectedMime,
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
            ]);
            return self::error('File type not allowed');
        }
        
        // Additional magic bytes validation for critical types
        if (isset(self::$magicBytes[$detectedMime])) {
            if (!self::validateMagicBytes($file['tmp_name'], self::$magicBytes[$detectedMime])) {
                Logger::warning('File failed magic bytes validation', [
                    'filename' => $originalName,
                    'claimed_mime' => $detectedMime,
                    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
                ]);
                return self::error('File content does not match declared type');
            }
        }
        
        // Special handling for SVG (can contain malicious scripts)
        if ($detectedMime === 'image/svg+xml') {
            $svgValidation = self::validateSvg($file['tmp_name']);
            if (!$svgValidation['valid']) {
                return self::error($svgValidation['error']);
            }
        }
        
        // Get safe extension for the detected MIME type
        $safeExtension = self::getSafeExtension($detectedMime, $extension);
        
        return [
            'success' => true,
            'error' => null,
            'file' => [
                'tmp_name' => $file['tmp_name'],
                'original_name' => $originalName,
                'size' => $file['size'],
                'mime_type' => $detectedMime,
                'extension' => $safeExtension,
            ]
        ];
    }
    
    /**
     * Save an uploaded file securely
     * 
     * @param array $validatedFile Result from validate()
     * @param string $uploadDir Target directory (will be created if needed)
     * @param string|null $customFilename Optional custom filename (without extension)
     * @return array ['success' => bool, 'error' => string|null, 'path' => string|null, 'filename' => string|null]
     */
    public static function save(array $validatedFile, string $uploadDir, ?string $customFilename = null): array {
        if (!$validatedFile['success']) {
            return self::error($validatedFile['error']);
        }
        
        $file = $validatedFile['file'];
        
        // Ensure upload directory exists
        if (!is_dir($uploadDir)) {
            if (!mkdir($uploadDir, 0755, true)) {
                Logger::error('Failed to create upload directory', ['dir' => $uploadDir]);
                return self::error('Failed to create upload directory');
            }
        }
        
        // Ensure directory is writable
        if (!is_writable($uploadDir)) {
            Logger::error('Upload directory not writable', ['dir' => $uploadDir]);
            return self::error('Upload directory not writable');
        }
        
        // Generate secure filename
        if ($customFilename) {
            // Sanitize custom filename
            $filename = preg_replace('/[^a-zA-Z0-9_-]/', '', $customFilename);
            $filename = substr($filename, 0, 100); // Limit length
        } else {
            // Generate random filename
            $filename = bin2hex(random_bytes(16));
        }
        
        $fullFilename = $filename . '.' . $file['extension'];
        $targetPath = rtrim($uploadDir, '/\\') . DIRECTORY_SEPARATOR . $fullFilename;
        
        // Prevent path traversal
        $realUploadDir = realpath($uploadDir);
        $realTargetDir = realpath(dirname($targetPath));
        
        if ($realTargetDir === false || strpos($realTargetDir, $realUploadDir) !== 0) {
            Logger::warning('Path traversal attempt detected', [
                'target' => $targetPath,
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
            ]);
            return self::error('Invalid file path');
        }
        
        // Move the file
        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            Logger::error('Failed to move uploaded file', [
                'source' => $file['tmp_name'],
                'target' => $targetPath
            ]);
            return self::error('Failed to save file');
        }
        
        // Set secure permissions (readable by web server, not executable)
        chmod($targetPath, 0644);
        
        Logger::info('File uploaded successfully', [
            'original_name' => $file['original_name'],
            'saved_as' => $fullFilename,
            'size' => $file['size'],
            'mime' => $file['mime_type']
        ]);
        
        return [
            'success' => true,
            'error' => null,
            'path' => $targetPath,
            'filename' => $fullFilename,
            'original_name' => $file['original_name'],
            'mime_type' => $file['mime_type'],
            'size' => $file['size']
        ];
    }
    
    /**
     * Validate and save in one step
     */
    public static function handleUpload(array $file, string $uploadDir, array $allowedMimeTypes = [], int $maxSize = null): array {
        $validation = self::validate($file, $allowedMimeTypes, $maxSize);
        if (!$validation['success']) {
            return $validation;
        }
        
        return self::save($validation, $uploadDir);
    }
    
    /**
     * Handle image upload with specific image types only
     */
    public static function handleImageUpload(array $file, string $uploadDir, int $maxSize = 5242880): array {
        $imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        return self::handleUpload($file, $uploadDir, $imageTypes, $maxSize);
    }
    
    /**
     * Handle document upload (PDF, CSV, Excel)
     */
    public static function handleDocumentUpload(array $file, string $uploadDir, int $maxSize = 10485760): array {
        $docTypes = [
            'application/pdf',
            'text/csv',
            'text/plain',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        return self::handleUpload($file, $uploadDir, $docTypes, $maxSize);
    }
    
    /**
     * Validate SVG for malicious content
     */
    private static function validateSvg(string $filepath): array {
        $content = file_get_contents($filepath);
        
        // Check for script tags
        if (preg_match('/<script/i', $content)) {
            return ['valid' => false, 'error' => 'SVG contains script tags'];
        }
        
        // Check for event handlers
        if (preg_match('/\bon\w+\s*=/i', $content)) {
            return ['valid' => false, 'error' => 'SVG contains event handlers'];
        }
        
        // Check for external references
        if (preg_match('/xlink:href\s*=\s*["\'](?!#)/i', $content)) {
            return ['valid' => false, 'error' => 'SVG contains external references'];
        }
        
        // Check for data URIs with scripts
        if (preg_match('/data:\s*text\/html/i', $content)) {
            return ['valid' => false, 'error' => 'SVG contains data URI with HTML'];
        }
        
        return ['valid' => true, 'error' => null];
    }
    
    /**
     * Validate file magic bytes
     */
    private static function validateMagicBytes(string $filepath, array $signatures): bool {
        $handle = fopen($filepath, 'rb');
        if (!$handle) {
            return false;
        }
        
        // Read first 12 bytes (enough for most signatures)
        $bytes = fread($handle, 12);
        fclose($handle);
        
        foreach ($signatures as $signature) {
            if (strpos($bytes, $signature) === 0) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Get safe extension for MIME type
     */
    private static function getSafeExtension(string $mimeType, string $originalExtension): string {
        if (isset(self::$allowedTypes[$mimeType])) {
            $allowedExtensions = self::$allowedTypes[$mimeType];
            
            // Use original extension if it's valid for this MIME type
            if (in_array($originalExtension, $allowedExtensions, true)) {
                return $originalExtension;
            }
            
            // Otherwise use the first allowed extension
            return $allowedExtensions[0];
        }
        
        // Fallback: derive from MIME type
        $parts = explode('/', $mimeType);
        return $parts[1] ?? 'bin';
    }
    
    /**
     * Get human-readable upload error message
     */
    private static function getUploadErrorMessage(int $errorCode): string {
        $messages = [
            UPLOAD_ERR_INI_SIZE => 'File exceeds server upload limit',
            UPLOAD_ERR_FORM_SIZE => 'File exceeds form upload limit',
            UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Server missing temporary folder',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            UPLOAD_ERR_EXTENSION => 'Upload blocked by server extension',
        ];
        
        return $messages[$errorCode] ?? 'Unknown upload error';
    }
    
    /**
     * Format bytes to human-readable string
     */
    private static function formatBytes(int $bytes): string {
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        return round($bytes, 2) . ' ' . $units[$i];
    }
    
    /**
     * Return error response
     */
    private static function error(string $message): array {
        return [
            'success' => false,
            'error' => $message,
            'file' => null
        ];
    }
    
    /**
     * Delete a file securely
     */
    public static function delete(string $filepath, string $baseDir): bool {
        // Ensure file is within allowed directory
        $realBase = realpath($baseDir);
        $realFile = realpath($filepath);
        
        if ($realFile === false || $realBase === false) {
            return false;
        }
        
        if (strpos($realFile, $realBase) !== 0) {
            Logger::warning('Attempted to delete file outside allowed directory', [
                'filepath' => $filepath,
                'base_dir' => $baseDir
            ]);
            return false;
        }
        
        if (file_exists($realFile) && is_file($realFile)) {
            return unlink($realFile);
        }
        
        return false;
    }
}
