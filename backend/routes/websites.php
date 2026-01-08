<?php

/**
 * Websites API Routes
 * 
 * Add these routes to your main routes file (e.g., backend/public/index.php)
 */

use App\Controllers\WebsitesController;
use App\Controllers\WebsiteMediaController;

// Initialize controllers
$websitesController = new WebsitesController($db);
$websiteMediaController = new WebsiteMediaController($db);

// =====================================================
// WEBSITES CRUD
// =====================================================

// GET /api/websites - List all websites
$router->get('/api/websites', function() use ($websitesController) {
    try {
        $websites = $websitesController->getWebsites();
        sendJsonResponse(['data' => $websites]);
    } catch (Exception $e) {
        sendJsonResponse(['error' => $e->getMessage()], $e->getCode() ?: 500);
    }
});

// GET /api/websites/:id - Get single website
$router->get('/api/websites/{id}', function($id) use ($websitesController) {
    try {
        $website = $websitesController->getWebsite((int)$id);
        sendJsonResponse(['data' => $website]);
    } catch (Exception $e) {
        sendJsonResponse(['error' => $e->getMessage()], $e->getCode() ?: 500);
    }
});

// POST /api/websites - Create new website
$router->post('/api/websites', function() use ($websitesController) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $website = $websitesController->createWebsite($data);
        sendJsonResponse(['data' => $website], 201);
    } catch (Exception $e) {
        sendJsonResponse(['error' => $e->getMessage()], $e->getCode() ?: 500);
    }
});

// PUT /api/websites/:id - Update website
$router->put('/api/websites/{id}', function($id) use ($websitesController) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $website = $websitesController->updateWebsite((int)$id, $data);
        sendJsonResponse(['data' => $website]);
    } catch (Exception $e) {
        sendJsonResponse(['error' => $e->getMessage()], $e->getCode() ?: 500);
    }
});

// DELETE /api/websites/:id - Delete website
$router->delete('/api/websites/{id}', function($id) use ($websitesController) {
    try {
        $websitesController->deleteWebsite((int)$id);
        sendJsonResponse(['message' => 'Website deleted successfully']);
    } catch (Exception $e) {
        sendJsonResponse(['error' => $e->getMessage()], $e->getCode() ?: 500);
    }
});

// =====================================================
// WEBSITE PUBLISHING
// =====================================================

// POST /api/websites/:id/publish - Publish website
$router->post('/api/websites/{id}/publish', function($id) use ($websitesController) {
    try {
        $website = $websitesController->publishWebsite((int)$id);
        sendJsonResponse(['data' => $website]);
    } catch (Exception $e) {
        sendJsonResponse(['error' => $e->getMessage()], $e->getCode() ?: 500);
    }
});

// POST /api/websites/:id/unpublish - Unpublish website
$router->post('/api/websites/{id}/unpublish', function($id) use ($websitesController) {
    try {
        $website = $websitesController->unpublishWebsite((int)$id);
        sendJsonResponse(['data' => $website]);
    } catch (Exception $e) {
        sendJsonResponse(['error' => $e->getMessage()], $e->getCode() ?: 500);
    }
});

// POST /api/websites/:id/duplicate - Duplicate website
$router->post('/api/websites/{id}/duplicate', function($id) use ($websitesController) {
    try {
        $website = $websitesController->duplicateWebsite((int)$id);
        sendJsonResponse(['data' => $website]);
    } catch (Exception $e) {
        sendJsonResponse(['error' => $e->getMessage()], $e->getCode() ?: 500);
    }
});

// =====================================================
// WEBSITE TEMPLATES
// =====================================================

// GET /api/websites/templates - Get all templates
$router->get('/api/websites/templates', function() use ($websitesController) {
    try {
        $type = $_GET['type'] ?? null;
        $templates = $websitesController->getTemplates($type);
        sendJsonResponse(['data' => $templates]);
    } catch (Exception $e) {
        sendJsonResponse(['error' => $e->getMessage()], $e->getCode() ?: 500);
    }
});

// POST /api/websites/templates/:id/create - Create website from template
$router->post('/api/websites/templates/{id}/create', function($id) use ($websitesController) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $website = $websitesController->createFromTemplate((int)$id, $data);
        sendJsonResponse(['data' => $website], 201);
    } catch (Exception $e) {
        sendJsonResponse(['error' => $e->getMessage()], $e->getCode() ?: 500);
    }
});

// =====================================================
// WEBSITE MEDIA/UPLOADS
// =====================================================

// POST /api/websites/:id/media - Upload media for website
$router->post('/api/websites/{id}/media', function($id) use ($websiteMediaController) {
    try {
        if (!isset($_FILES['file'])) {
            throw new Exception('No file uploaded', 400);
        }
        
        $media = $websiteMediaController->uploadMedia((int)$id, $_FILES['file']);
        sendJsonResponse(['data' => $media], 201);
    } catch (Exception $e) {
        sendJsonResponse(['error' => $e->getMessage()], $e->getCode() ?: 500);
    }
});

// GET /api/websites/:id/media - Get all media for website
$router->get('/api/websites/{id}/media', function($id) use ($websiteMediaController) {
    try {
        $media = $websiteMediaController->getWebsiteMedia((int)$id);
        sendJsonResponse(['data' => $media]);
    } catch (Exception $e) {
        sendJsonResponse(['error' => $e->getMessage()], $e->getCode() ?: 500);
    }
});

// DELETE /api/websites/media/:id - Delete media
$router->delete('/api/websites/media/{id}', function($id) use ($websiteMediaController) {
    try {
        $websiteMediaController->deleteMedia((int)$id);
        sendJsonResponse(['message' => 'Media deleted successfully']);
    } catch (Exception $e) {
        sendJsonResponse(['error' => $e->getMessage()], $e->getCode() ?: 500);
    }
});

// =====================================================
// WEBSITE ANALYTICS
// =====================================================

// POST /api/websites/:id/track - Track analytics event
$router->post('/api/websites/{id}/track', function($id) use ($websitesController) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $eventType = $data['event_type'] ?? 'view';
        $eventData = $data['event_data'] ?? [];
        
        $websitesController->trackAnalytics((int)$id, $eventType, $eventData);
        sendJsonResponse(['message' => 'Event tracked successfully']);
    } catch (Exception $e) {
        sendJsonResponse(['error' => $e->getMessage()], $e->getCode() ?: 500);
    }
});

// =====================================================
// PUBLIC WEBSITE VIEWING
// =====================================================

// GET /sites/:slug - View published website
$router->get('/sites/{slug}', function($slug) use ($db) {
    try {
        $stmt = $db->prepare("
            SELECT * FROM websites 
            WHERE slug = :slug 
                AND status = 'published' 
                AND deleted_at IS NULL
        ");
        $stmt->execute(['slug' => $slug]);
        $website = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$website) {
            http_response_code(404);
            echo "Website not found";
            return;
        }
        
        // Decode content
        $website['content'] = json_decode($website['content'], true);
        
        // Track view
        $stmt = $db->prepare("UPDATE websites SET views = views + 1 WHERE id = :id");
        $stmt->execute(['id' => $website['id']]);
        
        // Render website
        renderWebsite($website);
    } catch (Exception $e) {
        http_response_code(500);
        echo "Error loading website";
    }
});

/**
 * Helper function to send JSON response
 */
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

/**
 * Helper function to render published website
 */
function renderWebsite($website) {
    // This will render the website using the content
    // You can create a template engine or simple renderer
    include __DIR__ . '/../views/website-renderer.php';
}
