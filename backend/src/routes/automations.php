<?php
/**
 * Automations Routes Module
 * Handles all automation-related endpoints
 * 
 * Required: $path, $method
 */

use Xordon\RBACMiddleware;
use Xordon\OwnershipCheck;

/**
 * Match Automation routes and enforce RBAC
 * @return bool True if route matched
 */
function matchAutomationRoutes(string $path, string $method): bool {
    
    // ===========================================
    // AUTOMATIONS
    // ===========================================
    if ($path === '/automations' && $method === 'GET') {
        RBACMiddleware::require('automations.view');
        return AutomationsController::list();
    }
    if ($path === '/automations' && $method === 'POST') {
        RBACMiddleware::require('automations.create');
        return AutomationsController::create();
    }
    if (preg_match('#^/automations/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') {
            RBACMiddleware::require('automations.view');
            OwnershipCheck::requireOwnership('automations', $id);
            return AutomationsController::show($id);
        }
        if ($method === 'PUT' || $method === 'PATCH') {
            RBACMiddleware::require('automations.edit');
            OwnershipCheck::requireOwnership('automations', $id);
            return AutomationsController::update($id);
        }
        if ($method === 'DELETE') {
            RBACMiddleware::require('automations.delete');
            OwnershipCheck::requireOwnership('automations', $id);
            return AutomationsController::delete($id);
        }
    }
    
    // Automation actions
    if (preg_match('#^/automations/(\d+)/activate$#', $path, $m) && $method === 'POST') {
        RBACMiddleware::require('automations.activate');
        return AutomationsController::activate((int)$m[1]);
    }
    if (preg_match('#^/automations/(\d+)/deactivate$#', $path, $m) && $method === 'POST') {
        RBACMiddleware::require('automations.activate');
        return AutomationsController::deactivate((int)$m[1]);
    }
    if (preg_match('#^/automations/(\d+)/duplicate$#', $path, $m) && $method === 'POST') {
        RBACMiddleware::require('automations.create');
        return AutomationsController::duplicate((int)$m[1]);
    }
    
    // Automation runs/executions
    if (preg_match('#^/automations/(\d+)/runs$#', $path, $m) && $method === 'GET') {
        RBACMiddleware::require('automations.view');
        return AutomationRunsController::listByAutomation((int)$m[1]);
    }
    if (preg_match('#^/automations/(\d+)/stats$#', $path, $m) && $method === 'GET') {
        RBACMiddleware::require('automations.view');
        return AutomationsController::stats((int)$m[1]);
    }
    
    // ===========================================
    // AUTOMATION RUNS
    // ===========================================
    if ($path === '/automation-runs' && $method === 'GET') {
        RBACMiddleware::require('automations.view');
        return AutomationRunsController::list();
    }
    if (preg_match('#^/automation-runs/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') {
            return AutomationRunsController::show($id);
        }
        if ($method === 'DELETE') {
            RBACMiddleware::require('automations.delete');
            return AutomationRunsController::delete($id);
        }
    }
    if (preg_match('#^/automation-runs/(\d+)/cancel$#', $path, $m) && $method === 'POST') {
        RBACMiddleware::require('automations.edit');
        return AutomationRunsController::cancel((int)$m[1]);
    }
    
    // ===========================================
    // SEQUENCES
    // ===========================================
    if ($path === '/sequences' && $method === 'GET') {
        return SequencesController::list();
    }
    if ($path === '/sequences' && $method === 'POST') {
        RBACMiddleware::require('automations.create');
        return SequencesController::create();
    }
    if (preg_match('#^/sequences/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return SequencesController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') {
            RBACMiddleware::require('automations.edit');
            return SequencesController::update($id);
        }
        if ($method === 'DELETE') {
            RBACMiddleware::require('automations.delete');
            return SequencesController::delete($id);
        }
    }
    if (preg_match('#^/sequences/(\d+)/steps$#', $path, $m)) {
        if ($method === 'GET') return SequencesController::getSteps((int)$m[1]);
        if ($method === 'POST') {
            RBACMiddleware::require('automations.edit');
            return SequencesController::addStep((int)$m[1]);
        }
    }
    
    // ===========================================
    // WORKFLOWS
    // ===========================================
    if ($path === '/workflows' && $method === 'GET') {
        return WorkflowsController::list();
    }
    if ($path === '/workflows' && $method === 'POST') {
        RBACMiddleware::require('automations.create');
        return WorkflowsController::create();
    }
    if (preg_match('#^/workflows/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return WorkflowsController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') {
            RBACMiddleware::require('automations.edit');
            return WorkflowsController::update($id);
        }
        if ($method === 'DELETE') {
            RBACMiddleware::require('automations.delete');
            return WorkflowsController::delete($id);
        }
    }
    
    // ===========================================
    // TRIGGERS
    // ===========================================
    if ($path === '/triggers' && $method === 'GET') {
        return TriggersController::list();
    }
    if ($path === '/triggers' && $method === 'POST') {
        RBACMiddleware::require('automations.create');
        return TriggersController::create();
    }
    if (preg_match('#^/triggers/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return TriggersController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') {
            RBACMiddleware::require('automations.edit');
            return TriggersController::update($id);
        }
        if ($method === 'DELETE') {
            RBACMiddleware::require('automations.delete');
            return TriggersController::delete($id);
        }
    }
    
    return false; // No route matched
}

// Auto-execute for automation paths
$automationPrefixes = ['/automations', '/automation-runs', '/sequences', '/workflows', '/triggers'];
if (isset($path) && isset($method)) {
    foreach ($automationPrefixes as $prefix) {
        if (strpos($path, $prefix) === 0) {
            if (matchAutomationRoutes($path, $method)) {
                return;
            }
            break;
        }
    }
}
