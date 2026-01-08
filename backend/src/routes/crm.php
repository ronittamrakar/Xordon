<?php
/**
 * CRM Routes Module
 * Handles all CRM-related endpoints: contacts, deals, pipelines, activities
 * 
 * Required: $path, $method
 */

use Xordon\RBACMiddleware;
use Xordon\OwnershipCheck;

/**
 * Match CRM routes and enforce RBAC
 * @return bool True if route matched
 */
function matchCRMRoutes(string $path, string $method): bool {
    
    // ===========================================
    // CONTACTS
    // ===========================================
    if ($path === '/contacts' && $method === 'GET') {
        RBACMiddleware::require('contacts.view');
        return ContactsController::list();
    }
    if ($path === '/contacts' && $method === 'POST') {
        RBACMiddleware::require('contacts.create');
        return ContactsController::create();
    }
    if (preg_match('#^/contacts/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') {
            RBACMiddleware::require('contacts.view');
            OwnershipCheck::requireOwnership('contacts', $id);
            return ContactsController::show($id);
        }
        if ($method === 'PUT' || $method === 'PATCH') {
            RBACMiddleware::require('contacts.edit');
            OwnershipCheck::requireOwnership('contacts', $id);
            return ContactsController::update($id);
        }
        if ($method === 'DELETE') {
            RBACMiddleware::require('contacts.delete');
            OwnershipCheck::requireOwnership('contacts', $id);
            return ContactsController::delete($id);
        }
    }
    
    // Contact sub-resources
    if (preg_match('#^/contacts/(\d+)/activities$#', $path, $m)) {
        RBACMiddleware::require('contacts.view');
        return ActivitiesController::listByContact((int)$m[1]);
    }
    if (preg_match('#^/contacts/(\d+)/notes$#', $path, $m)) {
        if ($method === 'GET') return NotesController::listByContact((int)$m[1]);
        if ($method === 'POST') return NotesController::createForContact((int)$m[1]);
    }
    if (preg_match('#^/contacts/(\d+)/tasks$#', $path, $m)) {
        RBACMiddleware::require('contacts.view');
        return TasksController::listByContact((int)$m[1]);
    }
    if (preg_match('#^/contacts/(\d+)/deals$#', $path, $m)) {
        RBACMiddleware::require('contacts.view');
        return DealsController::listByContact((int)$m[1]);
    }
    
    // Bulk operations
    if ($path === '/contacts/bulk-delete' && $method === 'POST') {
        RBACMiddleware::require('contacts.bulk_actions');
        return ContactsController::bulkDelete();
    }
    if ($path === '/contacts/bulk-update' && $method === 'POST') {
        RBACMiddleware::require('contacts.bulk_actions');
        return ContactsController::bulkUpdate();
    }
    if ($path === '/contacts/export' && $method === 'POST') {
        RBACMiddleware::require('contacts.export');
        return ContactsController::export();
    }
    if ($path === '/contacts/import' && $method === 'POST') {
        RBACMiddleware::require('contacts.import');
        return ContactsController::import();
    }
    
    // ===========================================
    // DEALS
    // ===========================================
    if ($path === '/deals' && $method === 'GET') {
        RBACMiddleware::require('contacts.view');
        return DealsController::list();
    }
    if ($path === '/deals' && $method === 'POST') {
        RBACMiddleware::require('contacts.create');
        return DealsController::create();
    }
    if (preg_match('#^/deals/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') {
            OwnershipCheck::requireOwnership('deals', $id);
            return DealsController::show($id);
        }
        if ($method === 'PUT' || $method === 'PATCH') {
            OwnershipCheck::requireOwnership('deals', $id);
            return DealsController::update($id);
        }
        if ($method === 'DELETE') {
            RBACMiddleware::require('contacts.delete');
            OwnershipCheck::requireOwnership('deals', $id);
            return DealsController::delete($id);
        }
    }
    if (preg_match('#^/deals/(\d+)/stage$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return DealsController::updateStage((int)$m[1]);
    }
    
    // ===========================================
    // PIPELINES
    // ===========================================
    if ($path === '/pipelines' && $method === 'GET') {
        return PipelinesController::list();
    }
    if ($path === '/pipelines' && $method === 'POST') {
        RBACMiddleware::require('settings.edit');
        return PipelinesController::create();
    }
    if (preg_match('#^/pipelines/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return PipelinesController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') {
            RBACMiddleware::require('settings.edit');
            return PipelinesController::update($id);
        }
        if ($method === 'DELETE') {
            RBACMiddleware::require('settings.edit');
            return PipelinesController::delete($id);
        }
    }
    if (preg_match('#^/pipelines/(\d+)/stages$#', $path, $m)) {
        if ($method === 'GET') return PipelineStagesController::list((int)$m[1]);
        if ($method === 'POST') {
            RBACMiddleware::require('settings.edit');
            return PipelineStagesController::create((int)$m[1]);
        }
    }
    
    // ===========================================
    // ACTIVITIES
    // ===========================================
    if ($path === '/activities' && $method === 'GET') {
        return ActivitiesController::list();
    }
    if ($path === '/activities' && $method === 'POST') {
        return ActivitiesController::create();
    }
    if (preg_match('#^/activities/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'DELETE') return ActivitiesController::delete($id);
    }
    
    // ===========================================
    // TAGS
    // ===========================================
    if ($path === '/tags' && $method === 'GET') {
        return TagsController::list();
    }
    if ($path === '/tags' && $method === 'POST') {
        return TagsController::create();
    }
    if (preg_match('#^/tags/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT' || $method === 'PATCH') return TagsController::update($id);
        if ($method === 'DELETE') return TagsController::delete($id);
    }
    
    // ===========================================
    // LISTS (SEGMENTS)
    // ===========================================
    if ($path === '/lists' && $method === 'GET') {
        return ListsController::list();
    }
    if ($path === '/lists' && $method === 'POST') {
        return ListsController::create();
    }
    if (preg_match('#^/lists/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return ListsController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return ListsController::update($id);
        if ($method === 'DELETE') return ListsController::delete($id);
    }
    if (preg_match('#^/lists/(\d+)/members$#', $path, $m)) {
        if ($method === 'GET') return ListsController::getMembers((int)$m[1]);
        if ($method === 'POST') return ListsController::addMembers((int)$m[1]);
    }
    
    // ===========================================
    // NOTES
    // ===========================================
    if ($path === '/notes' && $method === 'GET') {
        return NotesController::list();
    }
    if ($path === '/notes' && $method === 'POST') {
        return NotesController::create();
    }
    if (preg_match('#^/notes/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT' || $method === 'PATCH') return NotesController::update($id);
        if ($method === 'DELETE') return NotesController::delete($id);
    }
    
    // ===========================================
    // TASKS
    // ===========================================
    if ($path === '/tasks' && $method === 'GET') {
        return TasksController::list();
    }
    if ($path === '/tasks' && $method === 'POST') {
        return TasksController::create();
    }
    if (preg_match('#^/tasks/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return TasksController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return TasksController::update($id);
        if ($method === 'DELETE') return TasksController::delete($id);
    }
    if (preg_match('#^/tasks/(\d+)/complete$#', $path, $m) && $method === 'POST') {
        return TasksController::markComplete((int)$m[1]);
    }
    
    return false; // No route matched
}

// Auto-execute for CRM paths
$crmPrefixes = ['/contacts', '/deals', '/pipelines', '/activities', '/tags', '/lists', '/notes', '/tasks'];
if (isset($path) && isset($method)) {
    foreach ($crmPrefixes as $prefix) {
        if (strpos($path, $prefix) === 0) {
            if (matchCRMRoutes($path, $method)) {
                return;
            }
            break;
        }
    }
}
