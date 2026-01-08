<?php
/**
 * Funnels API Routes
 */

require_once __DIR__ . '/../../src/controllers/FunnelsController.php';

$path = $_GET['path'] ?? '';
// If path is empty, try to parse from usage (e.g. if loaded via index.php without path param)
if (empty($path)) {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (str_starts_with($uri, '/api/funnels')) {
        $path = substr($uri, 12);
    } elseif (str_starts_with($uri, '/funnels')) {
        $path = substr($uri, 8);
    }
}
$path = ltrim($path, '/');
if (empty($path)) {
    $path = 'funnels'; // Default to list if root
}
// Prefix with funnels if not present to match simple matching logic or normalize
// Actually, let's just stick to simple matching. 
// Standardize: ensure we are matching "funnels" or "funnels/..."

// If the incoming path was just "/" (mapped to empty string), it implies list.
if ($path === '' || $path === '/') {
    $path = 'funnels';
}

$method = $_SERVER['REQUEST_METHOD'];

// List
if ($path === 'funnels' && $method === 'GET') {
    return FunnelsController::index();
}

// Create
if ($path === 'funnels' && $method === 'POST') {
    return FunnelsController::store();
}

// Single Items
if (preg_match('#^funnels/(\d+)$#', $path, $m)) {
    $id = (int)$m[1];
    if ($method === 'GET') return FunnelsController::show($id);
    if ($method === 'PUT' || $method === 'PATCH') return FunnelsController::update($id);
    if ($method === 'DELETE') return FunnelsController::destroy($id);
}

// Publish
if (preg_match('#^funnels/(\d+)/publish$#', $path, $m) && $method === 'POST') {
    return FunnelsController::publish((int)$m[1]);
}

// Analytics
if (preg_match('#^funnels/(\d+)/analytics$#', $path, $m) && $method === 'GET') {
    return FunnelsController::analytics((int)$m[1]);
}

// Tracking - Views
if (preg_match('#^funnels/(\d+)/steps/(\d+)/view$#', $path, $m) && $method === 'POST') {
    return FunnelsController::trackView((int)$m[1], (int)$m[2]);
}

// Tracking - Conversions
if (preg_match('#^funnels/(\d+)/steps/(\d+)/conversion$#', $path, $m) && $method === 'POST') {
    return FunnelsController::trackConversion((int)$m[1], (int)$m[2]);
}

Response::json(['error' => 'Funnel API endpoint not found', 'path' => $path], 404);
