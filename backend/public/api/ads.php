<?php
// Ads API Routes
// Included from index.php when path starts with /ads

require_once __DIR__ . '/../../src/controllers/AdsController.php';

// Get path from query param (set in index.php) or parse from URI
$path = $_GET['path'] ?? '';
if (!empty($path)) {
    // Path from index.php is like "ads/accounts" - strip the "ads" prefix
    if (str_starts_with($path, 'ads/')) {
        $path = substr($path, 3); // Remove "ads" to get "/accounts"
    } elseif ($path === 'ads') {
        $path = '/';
    }
}

if (empty($path) || $path === '/') {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (str_starts_with($uri, '/api/ads')) {
        $path = substr($uri, 8);
    } elseif (str_starts_with($uri, '/ads')) {
        $path = substr($uri, 4);
    }
}
$path = '/' . ltrim($path, '/');
$method = $_SERVER['REQUEST_METHOD'];

// ==================== ACCOUNTS ====================

if ($path === '/accounts' && $method === 'GET') {
    return AdsController::getAccounts();
}

if (preg_match('#^/accounts/(\d+)/disconnect$#', $path, $m) && $method === 'POST') {
    return AdsController::disconnectAccount((int)$m[1]);
}

// ==================== CAMPAIGNS ====================

if ($path === '/campaigns' && $method === 'GET') {
    return AdsController::getCampaigns();
}

if ($path === '/campaigns' && $method === 'POST') {
    return AdsController::createCampaign();
}

if ($path === '/campaigns/sync' && $method === 'POST') {
    return AdsController::syncCampaigns();
}

if (preg_match('#^/campaigns/(\d+)$#', $path, $m)) {
    $id = (int)$m[1];
    if ($method === 'GET') return AdsController::getCampaign($id);
    if ($method === 'PUT' || $method === 'PATCH') return AdsController::updateCampaign($id);
    if ($method === 'DELETE') return AdsController::deleteCampaign($id);
}

if (preg_match('#^/campaigns/(\d+)/metrics$#', $path, $m) && $method === 'GET') {
    return AdsController::getCampaignMetrics((int)$m[1]);
}

// ==================== CONVERSIONS ====================

if ($path === '/conversions' && $method === 'GET') {
    return AdsController::getConversions();
}

if ($path === '/conversions' && $method === 'POST') {
    return AdsController::trackConversion();
}

// ==================== BUDGETS ====================

if ($path === '/budgets' && $method === 'GET') {
    return AdsController::getBudgets();
}

if ($path === '/budgets' && $method === 'POST') {
    return AdsController::createBudget();
}

if (preg_match('#^/budgets/(\d+)$#', $path, $m)) {
    $id = (int)$m[1];
    if ($method === 'PUT' || $method === 'PATCH') return AdsController::updateBudget($id);
    if ($method === 'DELETE') return AdsController::deleteBudget($id);
}

// ==================== ANALYTICS ====================

if ($path === '/analytics' && $method === 'GET') {
    return AdsController::getAnalytics();
}

// ==================== A/B TESTING ====================

if ($path === '/ab-tests' && $method === 'GET') {
    return AdsController::getABTests();
}

if ($path === '/ab-tests' && $method === 'POST') {
    return AdsController::createABTest();
}

if (preg_match('#^/ab-tests/(\d+)$#', $path, $m) && $method === 'DELETE') {
    return AdsController::deleteABTest((int)$m[1]);
}

// ==================== OAUTH / CONNECT ====================

if (preg_match('#^/oauth/([^/]+)$#', $path, $m) && $method === 'GET') {
    $platform = $m[1];
    // Return a mock OAuth URL for demo purposes
    // In production, this would redirect to the actual platform OAuth flow
    return Response::json([
        'auth_url' => "http://localhost:5173/marketing/ads?connected=true&platform=" . urlencode($platform),
        'platform' => $platform,
        'message' => 'OAuth flow initiated for ' . $platform
    ]);
}

// Debug: Log unmatched paths
Logger::info('ADS API 404', ['path' => $path, 'method' => $method, 'GET_path' => $_GET['path'] ?? 'not set']);

Response::error('Ads endpoint not found: ' . $path, 404);
