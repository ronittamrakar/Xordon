<?php
// Router script for PHP built-in server
// This script handles URL routing for the development server

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Security check: prevent path traversal
if (strpos($path, '..') !== false) {
    http_response_code(403);
    die('Forbidden');
}

// Serve static files directly
if (file_exists(__DIR__ . '/public' . $path) && is_file(__DIR__ . '/public' . $path)) {
    return false; // Let the PHP built-in server handle static files
}

// Serve uploads directly
if (strpos($path, '/uploads/') === 0 && file_exists(__DIR__ . $path) && is_file(__DIR__ . $path)) {
    return false;
}

// Set up environment for routing
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['PHP_SELF'] = '/index.php';

// Route all other requests to index.php
require __DIR__ . '/public/index.php';