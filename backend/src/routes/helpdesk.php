<?php
/**
 * Helpdesk Module Routes
 * Handles all helpdesk/ticket related endpoints
 * 
 * Required variables: $path, $method
 * Must return true if route matched, false otherwise
 */

// Load Helpdesk Controllers
require_once __DIR__ . '/../controllers/TicketsController.php';
require_once __DIR__ . '/../controllers/HelpdeskController.php';
require_once __DIR__ . '/../controllers/CSATController.php';
require_once __DIR__ . '/../controllers/BulkActionsController.php';
require_once __DIR__ . '/../controllers/SLAController.php';
require_once __DIR__ . '/../controllers/HelpdeskSidebarController.php';
require_once __DIR__ . '/../controllers/KnowledgeBaseController.php';

/**
 * Match helpdesk routes
 * @return bool True if route matched
 */
function matchHelpdeskRoutes(string $path, string $method): bool {
    
    // Ticket CRUD operations
    if ($path === '/helpdesk/tickets' && $method === 'GET') {
        (new TicketsController())->list();
        return true;
    }
    if ($path === '/helpdesk/tickets' && $method === 'POST') {
        (new TicketsController())->create();
        return true;
    }
    if (preg_match('#^/helpdesk/tickets/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') {
            (new TicketsController())->show($id);
            return true;
        }
        if ($method === 'PUT' || $method === 'PATCH') {
            (new TicketsController())->update($id);
            return true;
        }
        if ($method === 'DELETE') {
            (new TicketsController())->delete($id);
            return true;
        }
    }
    
    // Ticket-related actions
    if (preg_match('#^/helpdesk/tickets/(\d+)/comments$#', $path, $m) && $method === 'POST') {
        HelpdeskController::addComment((int)$m[1]);
        return true;
    }
    if (preg_match('#^/helpdesk/tickets/(\d+)/assign$#', $path, $m) && $method === 'POST') {
        HelpdeskController::assignTicket((int)$m[1]);
        return true;
    }
    if (preg_match('#^/helpdesk/tickets/(\d+)/transfer$#', $path, $m) && $method === 'POST') {
        HelpdeskController::transferTicket((int)$m[1]);
        return true;
    }
    if (preg_match('#^/helpdesk/tickets/(\d+)/escalate$#', $path, $m) && $method === 'POST') {
        HelpdeskController::escalateTicket((int)$m[1]);
        return true;
    }
    
    // Helpdesk configuration
    if ($path === '/helpdesk/config' && $method === 'GET') {
        HelpdeskController::getConfig();
        return true;
    }
    if ($path === '/helpdesk/statuses' && $method === 'GET') {
        HelpdeskController::getStatuses();
        return true;
    }
    if ($path === '/helpdesk/priorities' && $method === 'GET') {
        HelpdeskController::getPriorities();
        return true;
    }
    
    // SLA Routes
    if ($path === '/helpdesk/sla' && $method === 'GET') {
        SLAController::list();
        return true;
    }
    if ($path === '/helpdesk/sla' && $method === 'POST') {
        SLAController::create();
        return true;
    }
    if (preg_match('#^/helpdesk/sla/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT' || $method === 'PATCH') {
            SLAController::update($id);
            return true;
        }
        if ($method === 'DELETE') {
            SLAController::delete($id);
            return true;
        }
    }
    
    // CSAT Routes
    if ($path === '/helpdesk/csat-surveys' && $method === 'GET') {
        return CSATController::list();
    }
    if ($path === '/helpdesk/csat-surveys' && $method === 'POST') {
        return CSATController::create();
    }
    if (preg_match('#^/helpdesk/csat-surveys/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') {
            CSATController::get($id);
            return true;
        }
        if ($method === 'PUT' || $method === 'PATCH') {
            CSATController::update($id);
            return true;
        }
        if ($method === 'DELETE') {
            CSATController::delete($id);
            return true;
        }
    }
    if (preg_match('#^/helpdesk/csat-surveys/(\d+)/send$#', $path, $m) && $method === 'POST') {
        CSATController::send((int)$m[1]);
        return true;
    }
    
    // Bulk Actions
    if ($path === '/helpdesk/bulk-actions' && $method === 'POST') {
        return BulkActionsController::process();
    }
    if ($path === '/helpdesk/bulk-actions/logs' && $method === 'GET') {
        return BulkActionsController::logs();
    }
    
    // Sidebar Configuration
    if ($path === '/helpdesk/sidebar' && $method === 'GET') {
        HelpdeskSidebarController::getConfig();
        return true;
    }
    if ($path === '/helpdesk/sidebar' && $method === 'PUT') {
        HelpdeskSidebarController::updateConfig();
        return true;
    }
    
    // Knowledge Base
    if ($path === '/helpdesk/kb/articles' && $method === 'GET') {
        KnowledgeBaseController::listArticles();
        return true;
    }
    if ($path === '/helpdesk/kb/articles' && $method === 'POST') {
        KnowledgeBaseController::createArticle();
        return true;
    }
    if (preg_match('#^/helpdesk/kb/articles/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') {
            KnowledgeBaseController::getArticle($id);
            return true;
        }
        if ($method === 'PUT' || $method === 'PATCH') {
            KnowledgeBaseController::updateArticle($id);
            return true;
        }
        if ($method === 'DELETE') {
            KnowledgeBaseController::deleteArticle($id);
            return true;
        }
    }
    
    if ($path === '/helpdesk/kb/categories' && $method === 'GET') {
        KnowledgeBaseController::listCategories();
        return true;
    }
    if ($path === '/helpdesk/kb/categories' && $method === 'POST') {
        KnowledgeBaseController::createCategory();
        return true;
    }
    if (preg_match('#^/helpdesk/kb/categories/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT' || $method === 'PATCH') {
            KnowledgeBaseController::updateCategory($id);
            return true;
        }
        if ($method === 'DELETE') {
            KnowledgeBaseController::deleteCategory($id);
            return true;
        }
    }
    
    // Statistics and Analytics
    if ($path === '/helpdesk/stats' && $method === 'GET') {
        HelpdeskController::getStats();
        return true;
    }
    if ($path === '/helpdesk/analytics' && $method === 'GET') {
        HelpdeskController::getAnalytics();
        return true;
    }
    
    return false; // No route matched
}

// Auto-execute if path starts with /helpdesk
if (isset($path) && isset($method) && strpos($path, '/helpdesk') === 0) {
    if (matchHelpdeskRoutes($path, $method)) {
        return; // Route handled
    }
}
