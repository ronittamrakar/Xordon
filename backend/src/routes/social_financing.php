<?php
/**
 * Social Media Routes
 * Handles all social media planner endpoints
 * 
 * Required variables: $path, $method
 * Must return true if route matched, false otherwise
 */

/**
 * Match social media routes
 * @return bool True if route matched
 */
function matchSocialRoutes(string $path, string $method): bool {
    
    // Social Accounts
    if ($path === '/social/accounts' && $method === 'GET') {
        return \Xordon\Controllers\SocialMediaController::listAccounts();
    }
    if ($path === '/social/accounts' && $method === 'POST') {
        return \Xordon\Controllers\SocialMediaController::connectAccount();
    }
    if (preg_match('#^/social/accounts/(\d+)/disconnect$#', $path, $m) && $method === 'POST') {
        return \Xordon\Controllers\SocialMediaController::disconnectAccount((int)$m[1]);
    }
    
    // Social Posts
    if ($path === '/social/posts' && $method === 'GET') {
        return \Xordon\Controllers\SocialMediaController::listPosts();
    }
    if ($path === '/social/posts' && $method === 'POST') {
        return \Xordon\Controllers\SocialMediaController::createPost();
    }
    if (preg_match('#^/social/posts/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return \Xordon\Controllers\SocialMediaController::getPost($id);
        if ($method === 'PUT' || $method === 'PATCH') return \Xordon\Controllers\SocialMediaController::updatePost($id);
        if ($method === 'DELETE') return \Xordon\Controllers\SocialMediaController::deletePost($id);
    }
    if (preg_match('#^/social/posts/(\d+)/publish$#', $path, $m) && $method === 'POST') {
        return \Xordon\Controllers\SocialMediaController::publishPost((int)$m[1]);
    }
    
    // Analytics
    if ($path === '/social/analytics' && $method === 'GET') {
        return \Xordon\Controllers\SocialMediaController::getAnalytics();
    }
    
    return false; // No route matched
}

/**
 * Match consumer financing routes
 */
function matchFinancingRoutes(string $path, string $method): bool {
    
    // Financing Plans
    if ($path === '/financing/plans' && $method === 'GET') {
        return \Xordon\Controllers\ConsumerFinancingController::listPlans();
    }
    if ($path === '/financing/plans' && $method === 'POST') {
        return \Xordon\Controllers\ConsumerFinancingController::createPlan();
    }
    if (preg_match('#^/financing/plans/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return \Xordon\Controllers\ConsumerFinancingController::getPlan($id);
        if ($method === 'PUT' || $method === 'PATCH') return \Xordon\Controllers\ConsumerFinancingController::updatePlan($id);
        if ($method === 'DELETE') return \Xordon\Controllers\ConsumerFinancingController::deletePlan($id);
    }
    
    // Financing Applications
    if ($path === '/financing/applications' && $method === 'GET') {
        return \Xordon\Controllers\ConsumerFinancingController::listApplications();
    }
    if ($path === '/financing/applications' && $method === 'POST') {
        return \Xordon\Controllers\ConsumerFinancingController::createApplication();
    }
    if (preg_match('#^/financing/applications/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return \Xordon\Controllers\ConsumerFinancingController::getApplication($id);
    }
    if (preg_match('#^/financing/applications/(\d+)/status$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return \Xordon\Controllers\ConsumerFinancingController::updateApplicationStatus((int)$m[1]);
    }
    
    // Financing Stats
    if ($path === '/financing/stats' && $method === 'GET') {
        return \Xordon\Controllers\ConsumerFinancingController::getStats();
    }
    
    return false; // No route matched
}

// Auto-execute if path matches
if (isset($path) && isset($method)) {
    if (strpos($path, '/social') === 0 && matchSocialRoutes($path, $method)) {
        return;
    }
    if (strpos($path, '/financing') === 0 && matchFinancingRoutes($path, $method)) {
        return;
    }
}
