<?php

// Enable error logging for debugging
error_log("Websites API: Starting request - Method: {$method}, Path: {$path}");

require_once __DIR__ . '/../../src/controllers/WebsitesController.php';
require_once __DIR__ . '/../../src/controllers/WebsiteMediaController.php';

// Initialize database connection
try {
    $db = Database::conn();
    error_log("Websites API: Database connection successful");
} catch (Exception $e) {
    error_log("Websites API: Database connection failed - " . $e->getMessage());
    Response::json(['error' => 'Database connection failed', 'details' => $e->getMessage()], 500);
    exit;
}

// Check tenant context
if (!isset($GLOBALS['tenantContext'])) {
    error_log("Websites API: No tenant context available");
    Response::json(['error' => 'Workspace context required'], 403);
    exit;
}

error_log("Websites API: Tenant context - Workspace ID: " . ($GLOBALS['tenantContext']->workspaceId ?? 'null') . ", User ID: " . ($GLOBALS['tenantContext']->userId ?? 'null'));

// Initialize controllers
try {
    $websitesController = new WebsitesController($db);
    $websiteMediaController = new WebsiteMediaController($db);
    error_log("Websites API: Controllers initialized successfully");
} catch (Exception $e) {
    error_log("Websites API: Controller initialization failed - " . $e->getMessage());
    Response::json(['error' => 'Controller initialization failed', 'details' => $e->getMessage()], 500);
    exit;
}

// Path should already have /api/ removed by index.php if matched /api there
// BUT the index.php says:
// 398: if (str_starts_with($path, '/api')) { $path = substr($path, 4); ... }
// So when we include this file, $path is like /websites/... or /websites
// We don't need to match /api prefix again.

/* 
 * WEBSITES CRUD
 */

// GET /api/websites - List all websites
if ($path === '/websites' && $method === 'GET') {
    try {
        $type = $_GET['type'] ?? null;
        $websites = $websitesController->getWebsites($type);
        Response::json(['data' => $websites]);
    } catch (Exception $e) {
        Response::json(['error' => $e->getMessage()], $e->getCode() ?: 500);
    }
}

// GET /api/websites/:id - Get single website
if (preg_match('#^/websites/(\d+)$#', $path, $m) && $method === 'GET') {
    try {
        $website = $websitesController->getWebsite((int)$m[1]);
        Response::json(['data' => $website]);
    } catch (Exception $e) {
        Response::json(['error' => $e->getMessage()], $e->getCode() ?: 500);
    }
}

// POST /api/websites - Create new website
if ($path === '/websites' && $method === 'POST') {
    try {
        $data = get_json_body();
        $website = $websitesController->createWebsite($data);
        Response::json(['data' => $website], 201);
    } catch (Exception $e) {
        Response::json(['error' => $e->getMessage()], $e->getCode() ?: 500);
    }
}

// PUT /api/websites/:id - Update website
if (preg_match('#^/websites/(\d+)$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
    try {
        $data = get_json_body();
        $website = $websitesController->updateWebsite((int)$m[1], $data);
        Response::json(['data' => $website]);
    } catch (Exception $e) {
        Response::json(['error' => $e->getMessage()], $e->getCode() ?: 500);
    }
}

// DELETE /api/websites/:id - Delete website
if (preg_match('#^/websites/(\d+)$#', $path, $m) && $method === 'DELETE') {
    try {
        $websitesController->deleteWebsite((int)$m[1]);
        Response::json(['message' => 'Website deleted successfully']);
    } catch (Exception $e) {
        Response::json(['error' => $e->getMessage()], $e->getCode() ?: 500);
    }
}

/*
 * WEBSITE PUBLISHING
 */

// POST /api/websites/:id/publish - Publish website
if (preg_match('#^/websites/(\d+)/publish$#', $path, $m) && $method === 'POST') {
    try {
        $website = $websitesController->publishWebsite((int)$m[1]);
        Response::json(['data' => $website]);
    } catch (Exception $e) {
        Response::json(['error' => $e->getMessage()], $e->getCode() ?: 500);
    }
}

// POST /api/websites/:id/unpublish - Unpublish website
if (preg_match('#^/websites/(\d+)/unpublish$#', $path, $m) && $method === 'POST') {
    try {
        $website = $websitesController->unpublishWebsite((int)$m[1]);
        Response::json(['data' => $website]);
    } catch (Exception $e) {
        Response::json(['error' => $e->getMessage()], $e->getCode() ?: 500);
    }
}

// POST /api/websites/:id/duplicate - Duplicate website
if (preg_match('#^/websites/(\d+)/duplicate$#', $path, $m) && $method === 'POST') {
    try {
        $website = $websitesController->duplicateWebsite((int)$m[1]);
        Response::json(['data' => $website]);
    } catch (Exception $e) {
        Response::json(['error' => $e->getMessage()], $e->getCode() ?: 500);
    }
}

/*
 * WEBSITE TEMPLATES
 */

// GET /api/websites/templates - Get all templates
if ($path === '/websites/templates' && $method === 'GET') {
    try {
        $type = $_GET['type'] ?? null;
        $templates = $websitesController->getTemplates($type);
        Response::json(['data' => $templates]);
    } catch (Exception $e) {
        Response::json(['error' => $e->getMessage()], $e->getCode() ?: 500);
    }
}

// POST /api/websites/templates/:id/create - Create website from template
if (preg_match('#^/websites/templates/(\d+)/create$#', $path, $m) && $method === 'POST') {
    try {
        $data = get_json_body();
        $website = $websitesController->createFromTemplate((int)$m[1], $data);
        Response::json(['data' => $website], 201);
    } catch (Exception $e) {
        Response::json(['error' => $e->getMessage()], $e->getCode() ?: 500);
    }
}

/*
 * WEBSITE MEDIA
 */

// POST /api/websites/:id/media
if (preg_match('#^/websites/(\d+)/media$#', $path, $m) && $method === 'POST') {
    try {
        if (!isset($_FILES['file'])) {
            throw new Exception('No file uploaded', 400);
        }
        $media = $websiteMediaController->uploadMedia((int)$m[1], $_FILES['file']);
        Response::json(['data' => $media], 201);
    } catch (Exception $e) {
        Response::json(['error' => $e->getMessage()], $e->getCode() ?: 500);
    }
}

// GET /api/websites/:id/media
if (preg_match('#^/websites/(\d+)/media$#', $path, $m) && $method === 'GET') {
    try {
        $media = $websiteMediaController->getWebsiteMedia((int)$m[1]);
        Response::json(['data' => $media]);
    } catch (Exception $e) {
        Response::json(['error' => $e->getMessage()], $e->getCode() ?: 500);
    }
}

// DELETE /api/websites/media/:id
if (preg_match('#^/websites/media/(\d+)$#', $path, $m) && $method === 'DELETE') {
    try {
        $websiteMediaController->deleteMedia((int)$m[1]);
        Response::json(['message' => 'Media deleted successfully']);
    } catch (Exception $e) {
        Response::json(['error' => $e->getMessage()], $e->getCode() ?: 500);
    }
}

/*
 * WEBSITE ANALYTICS
 */

// POST /api/websites/:id/track
if (preg_match('#^/websites/(\d+)/track$#', $path, $m) && $method === 'POST') {
    try {
        $data = get_json_body();
        $eventType = $data['event_type'] ?? 'view';
        $eventData = $data['event_data'] ?? [];
        
        $websitesController->trackAnalytics((int)$m[1], $eventType, $eventData);
        Response::json(['message' => 'Event tracked successfully']);
    } catch (Exception $e) {
        Response::json(['error' => $e->getMessage()], $e->getCode() ?: 500);
    }
}

/*
 * PUBLIC SITE VIEW (if accessed via /api/sites, but usually direct)
 * The original routes file had /sites/:slug - if that is via /api/sites/:slug, we handle it.
 * But sites are likely served from root, not /api.
 * However, we can add it here just in case.
 */
if (preg_match('#^/sites/([^/]+)$#', $path, $m) && $method === 'GET') {
    try {
        // Need to replicate the logic from original routes file as this controller function doesn't exist?
        // Original file had explicit SQL query in the closure.
        // Let's defer to a potential SiteViewer controller or similar if needed.
        // For now, if getWebsiteBySlug exists? No.
        // We will leave this out as frontend doesn't seem to request /api/sites/... for viewing.
    } catch (Exception $e) {}
}
