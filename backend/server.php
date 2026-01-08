<?php
// Simple router for PHP development server
// This handles the /api prefix correctly

error_log("Router script started");

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// Security check: prevent path traversal
if (strpos($uri, '..') !== false) {
    http_response_code(403);
    die('Forbidden');
}

error_log("URI: $uri");

// If the request is for a static file that exists in public/, serve it directly
if ($uri !== '/' && file_exists(__DIR__ . '/public' . $uri)) {
    error_log("Serving static file from public: $uri");
    return false;
}

// Also check the uploads directory
if (strpos($uri, '/uploads/') === 0 && file_exists(__DIR__ . $uri)) {
    error_log("Serving static file from uploads: $uri");
    return false;
}

// Handle /api prefix - remove it before routing to index.php
if (strpos($uri, '/api') === 0) {
    $uri = substr($uri, 4);
    $_SERVER['REQUEST_URI'] = $uri; // Update REQUEST_URI for the router
    error_log("Stripped /api prefix, new URI: $uri");
}

// Otherwise, route everything through public/index.php
error_log("Routing to index.php");
return require_once __DIR__ . '/public/index.php';