<?php
/**
 * Router script for PHP built-in server
 * This handles the routing for paths that contain dots (like permissions/check/users.view)
 */

// Get the requested URI
$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);

// Security check: prevent path traversal
if (strpos($path, '..') !== false) {
    http_response_code(403);
    die('Forbidden');
}

// Check if the request is for a real file
if ($path !== '/' && file_exists(__DIR__ . $path)) {
    // Let the built-in server handle static files
    return false;
}

// Route everything else through index.php
require __DIR__ . '/index.php';
