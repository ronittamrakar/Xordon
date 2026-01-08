<?php
/**
 * Settings & Team Routes Module
 * Handles settings, users, teams, and integrations
 * 
 * Required: $path, $method
 */

use Xordon\RBACMiddleware;
use Xordon\OwnershipCheck;

/**
 * Match Settings routes and enforce RBAC
 * @return bool True if route matched
 */
function matchSettingsRoutes(string $path, string $method): bool {
    
    // ===========================================
    // SETTINGS
    // ===========================================
    if ($path === '/settings' && $method === 'GET') {
        RBACMiddleware::require('settings.view');
        return SettingsController::list();
    }
    if ($path === '/settings' && $method === 'PUT') {
        RBACMiddleware::require('settings.edit');
        return SettingsController::update();
    }
    if (preg_match('#^/settings/(\w+)$#', $path, $m)) {
        $category = $m[1];
        if ($method === 'GET') {
            RBACMiddleware::require('settings.view');
            return SettingsController::getCategory($category);
        }
        if ($method === 'PUT' || $method === 'PATCH') {
            RBACMiddleware::require('settings.edit');
            return SettingsController::updateCategory($category);
        }
    }
    
    // ===========================================
    // USERS / TEAM
    // ===========================================
    if ($path === '/users' && $method === 'GET') {
        RBACMiddleware::require('users.view');
        return UsersController::list();
    }
    if ($path === '/users' && $method === 'POST') {
        RBACMiddleware::require('users.create');
        return UsersController::create();
    }
    if (preg_match('#^/users/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') {
            RBACMiddleware::require('users.view');
            return UsersController::show($id);
        }
        if ($method === 'PUT' || $method === 'PATCH') {
            RBACMiddleware::require('users.edit');
            return UsersController::update($id);
        }
        if ($method === 'DELETE') {
            RBACMiddleware::require('users.delete');
            return UsersController::delete($id);
        }
    }
    if (preg_match('#^/users/(\d+)/role$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        RBACMiddleware::require('users.change_role');
        return UsersController::updateRole((int)$m[1]);
    }
    if (preg_match('#^/users/(\d+)/deactivate$#', $path, $m) && $method === 'POST') {
        RBACMiddleware::require('users.edit');
        return UsersController::deactivate((int)$m[1]);
    }
    if (preg_match('#^/users/(\d+)/activate$#', $path, $m) && $method === 'POST') {
        RBACMiddleware::require('users.edit');
        return UsersController::activate((int)$m[1]);
    }
    
    // ===========================================
    // TEAMS
    // ===========================================
    if ($path === '/teams' && $method === 'GET') {
        RBACMiddleware::require('users.view');
        return TeamsController::list();
    }
    if ($path === '/teams' && $method === 'POST') {
        RBACMiddleware::require('users.create');
        return TeamsController::create();
    }
    if (preg_match('#^/teams/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return TeamsController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') {
            RBACMiddleware::require('users.edit');
            return TeamsController::update($id);
        }
        if ($method === 'DELETE') {
            RBACMiddleware::require('users.delete');
            return TeamsController::delete($id);
        }
    }
    if (preg_match('#^/teams/(\d+)/members$#', $path, $m)) {
        if ($method === 'GET') return TeamsController::getMembers((int)$m[1]);
        if ($method === 'POST') {
            RBACMiddleware::require('users.edit');
            return TeamsController::addMember((int)$m[1]);
        }
    }
    
    // ===========================================
    // INTEGRATIONS
    // ===========================================
    if ($path === '/integrations' && $method === 'GET') {
        RBACMiddleware::require('settings.integrations');
        return IntegrationsController::list();
    }
    if ($path === '/integrations' && $method === 'POST') {
        RBACMiddleware::require('settings.integrations');
        return IntegrationsController::create();
    }
    if (preg_match('#^/integrations/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') {
            RBACMiddleware::require('settings.integrations');
            return IntegrationsController::show($id);
        }
        if ($method === 'PUT' || $method === 'PATCH') {
            RBACMiddleware::require('settings.integrations');
            return IntegrationsController::update($id);
        }
        if ($method === 'DELETE') {
            RBACMiddleware::require('settings.integrations');
            return IntegrationsController::delete($id);
        }
    }
    if (preg_match('#^/integrations/(\d+)/test$#', $path, $m) && $method === 'POST') {
        RBACMiddleware::require('settings.integrations');
        return IntegrationsController::test((int)$m[1]);
    }
    if (preg_match('#^/integrations/(\d+)/sync$#', $path, $m) && $method === 'POST') {
        RBACMiddleware::require('settings.integrations');
        return IntegrationsController::sync((int)$m[1]);
    }
    
    // ===========================================
    // WEBHOOKS
    // ===========================================
    if ($path === '/webhooks' && $method === 'GET') {
        RBACMiddleware::require('settings.integrations');
        return WebhooksController::list();
    }
    if ($path === '/webhooks' && $method === 'POST') {
        RBACMiddleware::require('settings.integrations');
        return WebhooksController::create();
    }
    if (preg_match('#^/webhooks/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return WebhooksController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') {
            RBACMiddleware::require('settings.integrations');
            return WebhooksController::update($id);
        }
        if ($method === 'DELETE') {
            RBACMiddleware::require('settings.integrations');
            return WebhooksController::delete($id);
        }
    }
    
    // ===========================================
    // API KEYS
    // ===========================================
    if ($path === '/api-keys' && $method === 'GET') {
        RBACMiddleware::require('settings.integrations');
        return ApiKeysController::list();
    }
    if ($path === '/api-keys' && $method === 'POST') {
        RBACMiddleware::require('settings.integrations');
        return ApiKeysController::create();
    }
    if (preg_match('#^/api-keys/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'DELETE') {
            RBACMiddleware::require('settings.integrations');
            return ApiKeysController::delete($id);
        }
    }
    if (preg_match('#^/api-keys/(\d+)/regenerate$#', $path, $m) && $method === 'POST') {
        RBACMiddleware::require('settings.integrations');
        return ApiKeysController::regenerate((int)$m[1]);
    }
    
    return false; // No route matched
}

// Auto-execute for settings paths
$settingsPrefixes = ['/settings', '/users', '/teams', '/integrations', '/webhooks', '/api-keys'];
if (isset($path) && isset($method)) {
    foreach ($settingsPrefixes as $prefix) {
        if (strpos($path, $prefix) === 0) {
            if (matchSettingsRoutes($path, $method)) {
                return;
            }
            break;
        }
    }
}
