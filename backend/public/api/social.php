<?php

use App\Controllers\SocialController;

// Extract the sub-path after /social
// The path in index.php was modified to remove the leading slash, so we might receive "posts" or "accounts" directly in $socialPath variable if passed
// But here we rely on the main index.php setting $_GET['path'] = $socialPath

$path = $_GET['path'] ?? '';
$path = '/' . ltrim($path, '/'); // Ensure leading slash

// Debug logging
if (getenv('API_DEBUG') === 'true') {
    error_log("[SOCIAL] Processing path: $path, method: $method");
}

/*
 * Routes:
 *
 * GET  /accounts           -> getAccounts
 * POST /accounts/:id/disconnect -> disconnectAccount
 *
 * GET  /posts              -> getPosts
 * POST /posts              -> createPost
 * GET  /posts/:id          -> getPost
 * PUT  /posts/:id          -> updatePost
 * DELETE /posts/:id        -> deletePost
 * POST /posts/:id/publish  -> publishPost
 * 
 * GET  /categories         -> getCategories
 * POST /categories         -> createCategory
 * 
 * GET  /templates          -> getTemplates
 * POST /templates          -> createTemplate
 * 
 * GET  /hashtag-groups     -> getHashtagGroups
 * POST /hashtag-groups     -> createHashtagGroup
 * 
 * GET  /analytics          -> getAnalytics
 * 
 * POST /bulk-import        -> bulkImport
 * POST /ai/generate        -> generateAIContent
 * 
 * GET  /oauth/:platform    -> oauth
 * 
 * GET  /streams            -> getStreams
 */

// ==================== ACCOUNTS ====================
if ($path === '/accounts' && $method === 'GET') {
    return SocialController::getAccounts();
}

if (preg_match('#^/accounts/(\d+)/disconnect#', $path, $m) && $method === 'POST') {
    return SocialController::disconnectAccount($m[1]);
}

// ==================== POSTS ====================
if ($path === '/posts' && $method === 'GET') {
    return SocialController::getPosts();
}

if ($path === '/posts' && $method === 'POST') {
    return SocialController::createPost();
}

if (preg_match('#^/posts/(\d+)/publish#', $path, $m) && $method === 'POST') {
    return SocialController::publishPost($m[1]);
}

if (preg_match('#^/posts/(\d+)$#', $path, $m)) {
    $id = $m[1];
    if ($method === 'GET') return SocialController::getPost($id);
    if ($method === 'PUT' || $method === 'PATCH') return SocialController::updatePost($id);
    if ($method === 'DELETE') return SocialController::deletePost($id);
}

// ==================== CATEGORIES ====================
if ($path === '/categories' && $method === 'GET') {
    return SocialController::getCategories();
}

if ($path === '/categories' && $method === 'POST') {
    return SocialController::createCategory();
}

// ==================== TEMPLATES ====================
if ($path === '/templates' && $method === 'GET') {
    return SocialController::getTemplates();
}

if ($path === '/templates' && $method === 'POST') {
    return SocialController::createTemplate();
}

// ==================== HASHTAG GROUPS ====================
if ($path === '/hashtag-groups' && $method === 'GET') {
    return SocialController::getHashtagGroups();
}

if ($path === '/hashtag-groups' && $method === 'POST') {
    return SocialController::createHashtagGroup();
}

// ==================== ANALYTICS ====================
if ($path === '/analytics' && $method === 'GET') {
    return SocialController::getAnalytics();
}

// ==================== TOOLS ====================
if ($path === '/bulk-import' && $method === 'POST') {
    return SocialController::bulkImport();
}

if ($path === '/ai/generate' && $method === 'POST') {
    return SocialController::generateAIContent();
}

if (preg_match('#^/oauth/([^/]+)#', $path, $m) && $method === 'GET') {
    return SocialController::oauth($m[1]);
}

if ($path === '/oauth/callback' && $method === 'POST') {
    return SocialController::handleCallback();
}

if ($path === '/streams' && $method === 'GET') {
    return SocialController::getStreams();
}

// 404 Fallback
Response::json(['error' => 'Social API endpoint not found', 'path' => $path], 404);
