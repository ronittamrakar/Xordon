<?php
// Router script for PHP built-in server
// This ensures all requests are handled by index.php
// WebForms API (/webforms-api/*) is now handled by the main backend

$uri = $_SERVER['REQUEST_URI'];
$uriPath = parse_url($uri, PHP_URL_PATH);

// Security check: prevent path traversal
if (strpos($uriPath, '..') !== false) {
    http_response_code(403);
    die('Forbidden');
}

// NOTE: /webforms-api/* routes are now handled by backend/public/index.php
// The XordonForms folder is no longer needed and can be deleted

$filename = __DIR__ . '/backend/public' . $uriPath;

if (file_exists($filename) && is_file($filename)) {
    // Serve existing files from backend/public (docroot is project root)
    $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    if ($ext === 'php') {
        include $filename;
        return true;
    }

    $mime = function_exists('mime_content_type') ? mime_content_type($filename) : 'application/octet-stream';
    header('Content-Type: ' . ($mime ?: 'application/octet-stream'));
    readfile($filename);
    return true;
} else {
    // Route everything else to index.php
    include __DIR__ . '/backend/public/index.php';
}
