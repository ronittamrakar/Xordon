<?php
// Files and Folders API Routes
// Included from index.php when path starts with /files or /folders

require_once __DIR__ . '/../../src/controllers/FilesController.php';
require_once __DIR__ . '/../../src/controllers/FoldersController.php';

// Get path from query param (set in index.php) or parse from URI
$path = $_GET['path'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// Ensure path has leading slash for consistency
$path = '/' . ltrim($path, '/');

// ============================================
// FILES ROUTES (Media Library)
// ============================================
if (str_starts_with($path, '/files')) {
    $subPath = substr($path, 6);
    if ($subPath === '') $subPath = '/';
    
    // /files (GET) - List files
    if ($subPath === '/' && $method === 'GET') {
        return FilesController::index();
    }
    
    // /files (POST) - Upload files
    if ($subPath === '/' && $method === 'POST') {
        return FilesController::upload();
    }
    
    // /files/folders (GET/POST) - Folders in media library
    if ($subPath === '/folders') {
        if ($method === 'GET') return FilesController::folders();
        if ($method === 'POST') return FilesController::createFolder();
    }
    
    // /files/move (POST) - Move files
    if ($subPath === '/move' && $method === 'POST') {
        return FilesController::move();
    }
    
    // /files/bulk-delete (POST) - Bulk delete
    if ($subPath === '/bulk-delete' && $method === 'POST') {
        return FilesController::bulkDelete();
    }
    
    // /files/storage-quota (GET) - Stats
    if ($subPath === '/storage-quota' && $method === 'GET') {
        return FilesController::getStorageQuota();
    }
    
    // /files/entity/{entityType}/{entityId} (GET) - Files for specific entity
    if (preg_match('#^/entity/([^/]+)/([^/]+)$#', $subPath, $m)) {
        return FilesController::forEntity($m[1], $m[2]);
    }
    
    // /files/{id}/* - Single file operations
    if (preg_match('#^/(\d+)(.*)$#', $subPath, $m)) {
        $id = (int)$m[1];
        $action = $m[2];
        
        if ($action === '' || $action === '/') {
            if ($method === 'GET') return FilesController::show($id);
            if ($method === 'PUT' || $method === 'PATCH') return FilesController::update($id);
            if ($method === 'DELETE') return FilesController::delete($id);
        }
        
        if ($action === '/attach' && $method === 'POST') {
            return FilesController::attach($id);
        }
        
        if ($action === '/star' && $method === 'POST') {
            return FilesController::toggleStar($id);
        }
        
        if ($action === '/activity' && $method === 'GET') {
            return FilesController::getActivity($id);
        }
        
        if ($action === '/rename' && ($method === 'POST' || $method === 'PUT' || $method === 'PATCH')) {
            return FilesController::renameFile($id);
        }
    }
}

// ============================================
// FOLDERS ROUTES (General & Campaigns/Forms)
// ============================================
if (str_starts_with($path, '/folders')) {
    $subPath = substr($path, 8);
    if ($subPath === '') $subPath = '/';
    
    // /folders (GET) - List folders
    if ($subPath === '/' && $method === 'GET') {
        return FoldersController::index();
    }
    
    // /folders (POST) - Create folder
    if ($subPath === '/' && $method === 'POST') {
        return FoldersController::create();
    }
    
    // /folders/move-campaign (POST)
    if ($subPath === '/move-campaign' && $method === 'POST') {
        return FoldersController::moveCampaign();
    }
    
    // /folders/move-form (POST)
    if ($subPath === '/move-form' && $method === 'POST') {
        return FoldersController::moveForm();
    }
    
    // /folders/{id}/*
    if (preg_match('#^/(\d+)(.*)$#', $subPath, $m)) {
        $id = (int)$m[1];
        $action = $m[2];

        if ($action === '' || $action === '/') {
            if ($method === 'PUT' || $method === 'PATCH') return FoldersController::update($id);
            if ($method === 'DELETE') return FoldersController::delete($id);
            if ($method === 'GET') {
                // Not standard in FoldersController yet, but index usually filters?
                // For now just 404 or redirect to index with filter if needed?
            }
        }

        if ($action === '/rename' && ($method === 'POST' || $method === 'PUT' || $method === 'PATCH')) {
            // FoldersController might not have renameFolder, but FilesController does!
            // Wait, FilesController::renameFolder uses folders table.
            return FilesController::renameFolder($id);
        }
    }
}

// ============================================
// MEDIA ALIAS (Optional, for redundancy)
// ============================================
if (str_starts_with($path, '/media')) {
    $mediaPath = '/files' . substr($path, 6);
    $_GET['path'] = ltrim($mediaPath, '/');
    require_once __FILE__;
    exit;
}

// Debug logs for 404
Logger::info('FILES API 404', [
    'path' => $path,
    'method' => $method,
    'get_path' => $_GET['path'] ?? 'none'
]);

Response::error('Media/File endpoint not found: ' . $path, 404);
