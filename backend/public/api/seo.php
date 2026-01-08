<?php
/**
 * SEO API Routes
 */

require_once __DIR__ . '/../../src/controllers/SeoController.php';

$path = $_GET['path'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// ============================================
// DASHBOARD & OVERVIEW
// ============================================

if ($path === 'seo/dashboard' && $method === 'GET') {
    return SeoController::getDashboardData();
}

if ($path === 'seo/settings' && $method === 'GET') {
    return SeoController::getSettings();
}

if ($path === 'seo/settings' && $method === 'POST') {
    return SeoController::updateSettings();
}

// ============================================
// KEYWORD EXPLORER & TRACKING
// ============================================

if (($path === 'seo/keywords' || $path === 'keywords') && $method === 'GET') {
    return SeoController::getKeywords();
}

if (($path === 'seo/keywords' || $path === 'keywords') && $method === 'POST') {
    return SeoController::addKeyword();
}

if (preg_match('#^seo/keywords/(\d+)$#', $path, $m) && $method === 'DELETE') {
    return SeoController::deleteKeyword($m[1]);
}

if (($path === 'seo/keywords/explore' || $path === 'keywords/explore') && $method === 'POST') {
    return SeoController::exploreKeywords();
}

if (($path === 'seo/keywords/gap' || $path === 'keywords/gap' || $path === 'seo/keyword-gap' || $path === 'keyword-gap') && $method === 'POST') {
    return SeoController::keywordGapAnalysis();
}

if (($path === 'seo/keywords/cluster' || $path === 'keywords/cluster') && $method === 'POST') {
    return SeoController::keywordClustering();
}

if (($path === 'seo/serp/analyze' || $path === 'serp/analyze') && $method === 'GET') {
    return SeoController::serpAnalysis();
}

if (($path === 'seo/topics/research' || $path === 'topics/research' || $path === 'seo/content/topics') && $method === 'GET') {
    return SeoController::topicResearch();
}

if (($path === 'seo/questions/related' || $path === 'questions/related') && $method === 'GET') {
    return SeoController::getRelatedQuestions();
}

if (($path === 'seo/competitors' || $path === 'competitors') && $method === 'GET') {
    return SeoController::getCompetitors();
}

if (($path === 'seo/competitors' || $path === 'competitors') && $method === 'POST') {
    return SeoController::addCompetitor();
}

// ============================================
// BACKLINKS
// ============================================

if (($path === 'seo/backlinks' || $path === 'backlinks') && $method === 'GET') {
    return SeoController::getBacklinks();
}

if (($path === 'seo/backlinks' || $path === 'backlinks') && $method === 'POST') {
    return SeoController::addBacklink();
}

if (($path === 'seo/backlinks/domains' || $path === 'backlinks/domains') && $method === 'GET') {
    return SeoController::getBacklinksByDomain();
}

if (($path === 'seo/backlinks/gap' || $path === 'backlinks/gap') && $method === 'POST') {
    return SeoController::backlinkGapAnalysis();
}

if (($path === 'seo/backlinks/analytics' || $path === 'backlinks/analytics') && $method === 'GET') {
    // Determine which analytics based on query param or sub-path?
    // Start with general analytics or splitting them if needed
    // Assuming simple endpoint for now or check sub-paths
    // The controller methods are split: getAnchorTextDistribution, getLinkVelocity, detectToxicLinks
    
    $type = $_GET['type'] ?? 'overview';
    if ($type === 'anchors') return SeoController::getAnchorTextDistribution();
    if ($type === 'velocity') return SeoController::getLinkVelocity();
    if ($type === 'toxic') return SeoController::detectToxicLinks();
    
    return Response::json(['error' => 'Invalid analytics type'], 400);
}

// Specific analytics endpoints if frontend calls them directly
if (($path === 'seo/backlinks/anchors' || $path === 'backlinks/anchors') && $method === 'GET') {
    return SeoController::getAnchorTextDistribution();
}
if (($path === 'seo/backlinks/velocity' || $path === 'backlinks/velocity') && $method === 'GET') {
    return SeoController::getLinkVelocity();
}
if (($path === 'seo/backlinks/toxic' || $path === 'backlinks/toxic') && $method === 'GET') {
    return SeoController::detectToxicLinks();
}

// Competitor Backlinks
if (preg_match('#^seo/backlinks/competitors/(\d+)$#', $path, $m) && $method === 'GET') {
    return SeoController::getCompetitorBacklinks($m[1]);
}

// ============================================
// SITE AUDITS
// ============================================

if (($path === 'seo/audits' || $path === 'audits') && $method === 'GET') {
    return SeoController::getAudits();
}

if (($path === 'seo/audits' || $path === 'audits') && $method === 'POST') {
    return SeoController::createAudit();
}

if (preg_match('#^seo/audits/(\d+)$#', $path, $m) && $method === 'GET') {
    return SeoController::getAudit($m[1]);
}

if (preg_match('#^seo/audits/(\d+)/cwv$#', $path, $m) && $method === 'GET') {
    return SeoController::getCoreWebVitals($m[1]);
}

if (preg_match('#^seo/audits/(\d+)/structured-data$#', $path, $m) && $method === 'GET') {
    return SeoController::getStructuredData($m[1]);
}

if (($path === 'seo/audits/deep-crawl' || $path === 'audits/deep-crawl') && $method === 'POST') {
    return SeoController::runDeepCrawl();
}

// ============================================
// CONTENT
// ============================================

if (($path === 'seo/content/analyze' || $path === 'content/analyze') && $method === 'POST') {
    return SeoController::analyzeContent();
}

// ============================================
// REPORTS
// ============================================

if (($path === 'seo/reports' || $path === 'reports') && $method === 'GET') {
    return SeoController::getReports();
}

if (($path === 'seo/reports' || $path === 'reports') && $method === 'POST') {
    return SeoController::generateReport();
}

if (($path === 'seo/reports/schedule' || $path === 'reports/schedule') && $method === 'POST') {
    return SeoController::scheduleReport();
}

// 404
Response::json(['error' => 'SEO API endpoint not found', 'path' => $path], 404);
