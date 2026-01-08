<?php
// Front controller for API routes
ini_set('display_errors', '1');
error_reporting(E_ALL);

// Composer autoload for PSR-4 classes
require_once __DIR__ . '/../vendor/autoload.php';

// Load environment variables from .env file BEFORE other dependencies
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
                putenv(sprintf('%s=%s', $name, $value));
                $_ENV[$name] = $value;
                $_SERVER[$name] = $value;
            }
        }
    }
}

// Load core utilities once
require_once __DIR__ . '/../src/bootstrap.php';

// Core classes (Config, Database, Auth, etc.) are now autoloaded via bootstrap.php

// Apply security headers
SecurityHeaders::applyCorsHeaders();

// Handle preflight OPTIONS requests
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ---------------------------------------------------------
// MAINTENANCE MODE CHECK
// ---------------------------------------------------------
$maintenanceFile = __DIR__ . '/../maintenance.flag';
if (file_exists($maintenanceFile)) {
    $pathInfo = $_SERVER['PATH_INFO'] ?? parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    // Allow access to maintenance status check and auth/login so admins can get in
    $allowedPaths = ['/system/tools/maintenance', '/auth/login', '/auth/dev-token', '/auth/status'];
    $isAllowed = false;
    foreach ($allowedPaths as $allowed) {
        if (strpos($pathInfo, $allowed) !== false) {
            $isAllowed = true;
            break;
        }
    }

    if (!$isAllowed) {
        header('Content-Type: application/json');
        http_response_code(503);
        echo json_encode([
            'success' => false, 
            'error' => 'System is currently under maintenance. Please try again later.',
            'maintenance' => true
        ]);
        exit;
    }
}
// ---------------------------------------------------------

// Apply global rate limiting
$rateLimitMiddleware = RateLimiter::middleware(10000, 60, 'global');
$rateLimitMiddleware();

/**
 * Controllers are now autoloaded via spl_autoload_register in bootstrap.php
 * to improve performance by avoiding loading 300+ files on every request.
 */

// Apply security headers immediately
SecurityHeaders::apply();

// ---------------------------------------------------------
// REQUEST TIMING FOR TRAFFIC ANALYTICS
// ---------------------------------------------------------
$GLOBALS['_request_start_time'] = microtime(true);
register_shutdown_function(function() {
    // Only log if we have valid request data and table exists
    $elapsed = (int)((microtime(true) - ($GLOBALS['_request_start_time'] ?? microtime(true))) * 1000);
    $path = $_SERVER['PATH_INFO'] ?? parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    $path = is_string($path) ? $path : '/';
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $statusCode = http_response_code() ?: 200;
    
    // Skip logging for very fast requests and static files to reduce DB load (sampling)
    if ($elapsed < 10 || preg_match('/\.(js|css|png|jpg|svg|ico)$/', $path)) {
        return;
    }
    
    // Require controller for logging
    if (class_exists('SystemHealthController', false)) {
        try {
            SystemHealthController::logRequest($method, $path, $statusCode, $elapsed, \Auth::userId());
        } catch (Exception $e) {
            // Silently fail
        }
    }
});


// Resolve workspace/company context early for authenticated requests.
// Controllers can use $GLOBALS['tenantContext'] when needed.
try {
    $pathInfo = $_SERVER['PATH_INFO'] ?? parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    $pathInfo = is_string($pathInfo) ? $pathInfo : '/';
    $isAuthRoute = (strpos($pathInfo, '/auth/') === 0) || ($pathInfo === '/auth');
    $isAutomationQueueProcess = ($pathInfo === '/automation-queue/process') || ($pathInfo === '/api/automation-queue/process');
    $isPublicESign = (strpos($pathInfo, '/e-signature/public/') !== false) || (strpos($pathInfo, '/api/e-signature/public/') !== false);
    
    // Apply rate limiting to all API routes except auth and automation queue
    // Apply rate limiting to all API routes except auth and automation queue - High limit for development audit
    if (!$isAuthRoute && !$isAutomationQueueProcess && strpos($pathInfo, '/api/') === 0) {
        RateLimiter::middleware(10000, 60)(); // 10000 requests per minute
    }
    
    // Stricter rate limiting for sensitive endpoints
    if (preg_match('#^/(auth|login|signup|forgot-password|reset-password)#', $pathInfo)) {
        // High limit for development to avoid race conditions on startup
        $authLimit = ($env === 'development') ? 100 : 5;
        // Don't rate limit the dev token endpoint in development at all to prevent blockers
        if ($env === 'development' && $pathInfo === '/auth/dev-token') {
             // Skip auth rate limit for dev-token
        } else {
            RateLimiter::middleware($authLimit, 300, 'auth')(); // In prod, 5 attempts per 5 minutes
        }
    }

    if ($pathInfo === '/debug-path') {
        Response::json(['path' => $pathInfo, 'request_uri' => $_SERVER['REQUEST_URI']]);
        return;
    }

    $authHeader = get_header('Authorization');
    $authTokenHeader = get_header('X-Auth-Token');
    $hasAuth = (is_string($authHeader) && trim($authHeader) !== '') || (is_string($authTokenHeader) && trim($authTokenHeader) !== '');

    if (($hasAuth || ($env === 'development')) && !$isAuthRoute && !$isAutomationQueueProcess && !$isPublicESign) {
        $GLOBALS['tenantContext'] = TenantContext::resolveOrFail();
    }

} catch (Exception $e) {
    // resolveOrFail already returns JSON errors; keep a fallback.
}

/**
 * Controllers and Services are now autoloaded via spl_autoload_register in bootstrap.php
 * to improve performance by avoiding loading 300+ files on every request.
 */

// RBAC Controllers
// Autoloaded
require_once __DIR__ . '/../src/services/RBACService.php';
require_once __DIR__ . '/../src/controllers/RolesController.php';
require_once __DIR__ . '/../src/controllers/PermissionsController.php';
require_once __DIR__ . '/../src/controllers/AuditController.php';

// CRM Enhancement Controllers
require_once __DIR__ . '/../src/services/ModuleManager.php';
require_once __DIR__ . '/../src/controllers/ModuleController.php';
require_once __DIR__ . '/../src/services/LeadScoringService.php';
require_once __DIR__ . '/../src/controllers/LeadScoringController.php';

// Companies, Lists, Segments Controllers
// Autoloaded

// Proposal Controllers
// Autoloaded

// Missing Feature Controllers
// Autoloaded

// Apps Manager (Odoo-style workspace modules)
// Autoloaded

// New Feature Controllers
// Autoloaded

// GHL-style Conversations & Opportunities Controllers
require_once __DIR__ . '/../src/controllers/ConversationsController.php';
require_once __DIR__ . '/../src/controllers/OpportunitiesController.php';
require_once __DIR__ . '/../src/controllers/AutomationsV2Controller.php';
require_once __DIR__ . '/../src/controllers/AppointmentsV2Controller.php';
require_once __DIR__ . '/../src/controllers/InvoicesController.php';
require_once __DIR__ . '/../src/controllers/ReviewsV2Controller.php';
require_once __DIR__ . '/../src/controllers/SnapshotsController.php';
require_once __DIR__ . '/../src/services/BusinessEventsService.php';

// Phase 0: Platform Foundations Controllers
require_once __DIR__ . '/../src/controllers/FilesController.php';
require_once __DIR__ . '/../src/controllers/NotificationsController.php';
require_once __DIR__ . '/../src/controllers/ActivitiesController.php';
require_once __DIR__ . '/../src/controllers/CustomFieldsController.php';
require_once __DIR__ . '/../src/controllers/IntegrationsFrameworkController.php';

// Phase 1: CRM Enhancements Controllers
require_once __DIR__ . '/../src/controllers/LeadAttributionController.php';
require_once __DIR__ . '/../src/controllers/StaffController.php';
require_once __DIR__ . '/../src/controllers/ContactStagesController.php';

// Phase 2: Revenue & Operations Controllers
require_once __DIR__ . '/../src/controllers/StripeController.php';
require_once __DIR__ . '/../src/controllers/EstimatesController.php';
require_once __DIR__ . '/../src/controllers/JobsController.php';
require_once __DIR__ . '/../src/controllers/RequestsController.php';
require_once __DIR__ . '/../src/controllers/ProjectsController.php';
require_once __DIR__ . '/../src/controllers/TasksController.php';
require_once __DIR__ . '/../src/controllers/FoldersController.php';

// Phase 3: Growth Suite Controllers
// Autoloaded

// Phase 4: HR Suite Controllers
require_once __DIR__ . '/../src/controllers/RecruitmentController.php';
require_once __DIR__ . '/../src/controllers/ShiftSchedulingController.php';
require_once __DIR__ . '/../src/controllers/PayrollController.php';

// Thryv-Parity Controllers (Booking, Payments, Portal)
// Autoloaded

// P0-P6 Parity Controllers (Calendars, Workflows, Funnels, Memberships, Phone, Reviews)
require_once __DIR__ . '/../src/controllers/AutomationController.php';
require_once __DIR__ . '/../src/controllers/AutomationRecipesController.php';
require_once __DIR__ . '/../src/controllers/WorkflowsController.php';
require_once __DIR__ . '/../src/controllers/ContactsController.php';
require_once __DIR__ . '/../src/controllers/TagsController.php';
require_once __DIR__ . '/../src/controllers/CRMController.php';
// Autoloaded

// Lead Marketplace Controllers (Thumbtack/Bark-style)
// Autoloaded

// Performance Billing (LeadSmart-style Pay-Per-Call)
// Autoloaded

// Feature Matrix Implementation (AI, Courses, Memberships)
// Autoloaded

use App\Controllers\LeadMarketplaceController;
use App\Controllers\LeadMatchesController;
use App\Controllers\WalletController;
use App\Controllers\MarketplaceReviewsController;
use App\Controllers\ProviderDocumentsController;
use App\Controllers\MarketplaceMessagingController;
use App\Controllers\MarketplaceBookingController;
use App\Services\GeolocationService;

// Handle CORS
Cors::handle();

// Parse the request
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Debug: record incoming request details for route troubleshooting
Logger::info('ROUTE DEBUG START', [
    'original_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
    'parsed_path' => $path ?? 'unknown',
    'method' => $method ?? 'unknown',
    'host' => $_SERVER['HTTP_HOST'] ?? 'unknown'
]);
// Log key headers (Authorization and X-Workspace-Id if present) and content length for POSTs
Logger::info('ROUTE DEBUG HEADERS', [
    'Authorization' => get_header('Authorization') ?? 'none',
    'X-Workspace-Id' => get_header('X-Workspace-Id') ?? 'none',
    'Content-Length' => $_SERVER['CONTENT_LENGTH'] ?? $_SERVER['HTTP_CONTENT_LENGTH'] ?? 'none',
    'Content-Type' => $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? 'none'
]);

$env = getenv('APP_ENV') ?: '';
$isDev = ($env === 'development' || $env === 'dev');

// Debug endpoint to check environment variables
if ($path === '/debug-env' || $path === '/api/debug-env') {
    Response::json([
        'SKIP_PERMISSION_GUARD_getenv' => getenv('SKIP_PERMISSION_GUARD'),
        'SKIP_PERMISSION_GUARD_ENV' => $_ENV['SKIP_PERMISSION_GUARD'] ?? 'not set',
        'SKIP_PERMISSION_GUARD_SERVER' => $_SERVER['SKIP_PERMISSION_GUARD'] ?? 'not set',
        'APP_ENV' => $env,
        'isDev' => $isDev,
    ]);
    return;
}

// Remove /api prefix if present to match frontend expectations
// NOTE: This is critical when running via PHP's built-in server (php -S),
// because it doesn't apply .htaccess/NGINX rewrites for /api/*.
if (str_starts_with($path, '/api')) {
    $path = substr($path, 4);
    if ($path === '') {
        $path = '/';
    }
    // Debug: show path after /api prefix stripped
    Logger::info('ROUTE DEBUG AFTER_API_STRIP', ['path' => $path]);
}

// Ensure SavedFiltersController is loaded
require_once __DIR__ . '/../src/Controllers/SavedFiltersController.php';

// Saved Filters Routes - Direct Dispatch
// Check if path matches /helpdesk/saved-filters (either from /api rewrite or direct)
if ($path === '/helpdesk/saved-filters' && $method === 'POST') {
    return SavedFiltersController::create();
}
if ($path === '/helpdesk/saved-filters' && $method === 'GET') {
    return SavedFiltersController::list();
}
if (preg_match('#^/helpdesk/saved-filters/(\d+)$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
    return SavedFiltersController::update((int)$m[1]);
}
if (preg_match('#^/helpdesk/saved-filters/(\d+)$#', $path, $m) && $method === 'DELETE') {
    return SavedFiltersController::delete((int)$m[1]);
}

// Health check
if ($path === '/' && $method === 'GET') {
    Response::json(['status' => 'ok', 'service' => 'xordon-api']);
    return;
}

// Support a dedicated /health endpoint (useful for monitoring tools that hit /api/health)
if ($path === '/health' && $method === 'GET') {
    // Delegate to the health-check handler in the public directory
    require_once __DIR__ . '/health-check.php';
    return;
}

// ============================================
// CALL SCRIPTS & DISPOSITIONS
// ============================================
require_once __DIR__ . '/../src/controllers/CallScriptsController.php';
require_once __DIR__ . '/../src/controllers/CallDispositionsController.php';

if ($path === '/calls/scripts' && $method === 'GET') {
    return CallScriptsController::listScripts();
}
if ($path === '/calls/scripts' && $method === 'POST') {
    return CallScriptsController::createScript();
}
if (preg_match('#^/calls/scripts/(\d+)$#', $path, $m)) {
    $id = $m[1];
    if ($method === 'GET') return CallScriptsController::getScript($id); // Added getScript just in case, though usually list is enough? 
    if ($method === 'PUT' || $method === 'PATCH') return CallScriptsController::updateScript($id);
    if ($method === 'DELETE') return CallScriptsController::deleteScript($id);
}

if ($path === '/calls/dispositions' && $method === 'GET') {
    return CallDispositionsController::index();
}
if ($path === '/calls/dispositions' && $method === 'POST') {
    return CallDispositionsController::create();
}
if (preg_match('#^/calls/dispositions/(\d+)$#', $path, $m)) {
    $id = $m[1];
    if ($method === 'PUT' || $method === 'PATCH') return CallDispositionsController::update($id);
    if ($method === 'DELETE') return CallDispositionsController::delete($id);
}

// ============================================
// CALL AGENTS
// ============================================
require_once __DIR__ . '/../src/controllers/CallAgentsController.php';

if ($path === '/calls/agents' && $method === 'GET') {
    return CallAgentsController::getAgents();
}
if ($path === '/calls/agents' && $method === 'POST') {
    return CallAgentsController::createAgent();
}
if (preg_match('#^/calls/agents/([^/]+)$#', $path, $m)) {
    $id = $m[1];
    if ($method === 'GET') return CallAgentsController::getAgent($id);
    if ($method === 'PUT' || $method === 'PATCH') return CallAgentsController::updateAgent($id);
    if ($method === 'DELETE') return CallAgentsController::deleteAgent($id);
}
if (preg_match('#^/calls/agents/([^/]+)/stats$#', $path, $m) && $method === 'GET') {
    return CallAgentsController::getAgentStats($m[1]);
}

// ============================================
// AI AGENTS & TEMPLATES
// ============================================
require_once __DIR__ . '/../src/controllers/AiAgentsController.php';
require_once __DIR__ . '/../src/controllers/AiController.php';
require_once __DIR__ . '/../src/controllers/AISettingsController.php';
require_once __DIR__ . '/../src/controllers/AIKnowledgeBaseController.php';
require_once __DIR__ . '/../src/controllers/AIFeaturesController.php';

if ($path === '/ai/agents' && $method === 'GET') {
    return AiAgentsController::listAgents();
}
if ($path === '/ai/agents' && $method === 'POST') {
    return AiAgentsController::createAgent();
}
if (preg_match('#^/ai/agents/(\d+)$#', $path, $m)) {
    $id = $m[1];
    if ($method === 'GET') return AiAgentsController::getAgent($id);
    if ($method === 'PUT' || $method === 'PATCH') return AiAgentsController::updateAgent($id);
    if ($method === 'DELETE') return AiAgentsController::deleteAgent($id);
}

if ($path === '/ai/templates' && $method === 'GET') {
    return AiAgentsController::getTemplates();
}
if (preg_match('#^/ai/templates/([^/]+)/use$#', $path, $m) && $method === 'POST') {
    return AiAgentsController::useTemplate($m[1]);
}
if ($path === '/ai/generate' && $method === 'POST') {
    // Check if AIFeaturesController handles this or AiController?
    // Calls api.generateAiContent which posts to /ai/generate
    return AiController::generate();
}

// ============================================
// AI SETTINGS
// ============================================
if ($path === '/ai/settings' && $method === 'GET') {
    return \Xordon\Controllers\AISettingsController::getSettings();
}
if ($path === '/ai/settings' && ($method === 'PUT' || $method === 'PATCH')) {
    return \Xordon\Controllers\AISettingsController::updateSettings();
}
if (preg_match('#^/ai/settings/feature/([^/]+)$#', $path, $m) && $method === 'GET') {
    return \Xordon\Controllers\AISettingsController::checkFeature($m[1]);
}
if ($path === '/ai/chatbot/config' && $method === 'GET') {
    return \Xordon\Controllers\AISettingsController::getChatbotConfig();
}

// ============================================
// AI KNOWLEDGE BASES
// ============================================
if ($path === '/ai/knowledge-bases' && $method === 'GET') {
    return AIKnowledgeBaseController::index();
}
if ($path === '/ai/knowledge-bases' && $method === 'POST') {
    return AIKnowledgeBaseController::create();
}
if (preg_match('#^/ai/knowledge-bases/(\d+)$#', $path, $m)) {
    $id = (int)$m[1];
    if ($method === 'GET') return AIKnowledgeBaseController::show($id);
    if ($method === 'PUT' || $method === 'PATCH') return AIKnowledgeBaseController::update($id);
    if ($method === 'DELETE') return AIKnowledgeBaseController::delete($id);
}

// Knowledge Base Sources
if (preg_match('#^/ai/knowledge-bases/(\d+)/sources$#', $path, $m)) {
    $id = (int)$m[1];
    if ($method === 'GET') return AIKnowledgeBaseController::getSources($id);
    if ($method === 'POST') return AIKnowledgeBaseController::addSource($id);
}
if (preg_match('#^/ai/knowledge-bases/(\d+)/sources/(\d+)$#', $path, $m) && $method === 'DELETE') {
    return AIKnowledgeBaseController::deleteSource((int)$m[1], (int)$m[2]);
}

// ============================================
// AI CONTENT GENERATION
// ============================================
if ($path === '/ai/content/generate' && $method === 'POST') {
    return \Xordon\Controllers\AIFeaturesController::generateContent();
}
if ($path === '/ai/content/generations' && $method === 'GET') {
    return \Xordon\Controllers\AIFeaturesController::listGenerations();
}
if (preg_match('#^/ai/content/generations/(\d+)/rate$#', $path, $m) && $method === 'POST') {
    return \Xordon\Controllers\AIFeaturesController::rateGeneration((int)$m[1]);
}

// ============================================
// AI SENTIMENT ANALYSIS
// ============================================
if ($path === '/ai/sentiment/analyze' && $method === 'POST') {
    return \Xordon\Controllers\AIFeaturesController::analyzeSentiment();
}
if ($path === '/ai/sentiment' && $method === 'GET') {
    return \Xordon\Controllers\AIFeaturesController::getSentimentAnalysis();
}

// ============================================
// AI RECOMMENDATIONS
// ============================================
if ($path === '/ai/recommendations' && $method === 'GET') {
    return \Xordon\Controllers\AIFeaturesController::getRecommendations();
}
if (preg_match('#^/ai/recommendations/(\d+)/status$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
    return \Xordon\Controllers\AIFeaturesController::updateRecommendationStatus((int)$m[1]);
}

// ============================================
// AI SIMULATE CHAT
// ============================================
if ($path === '/ai/simulate-chat' && $method === 'POST') {
    return AiAgentsController::simulateChat();
}

// ============================================
// AI TEMPLATES (Additional)
// ============================================
if ($path === '/ai/templates' && $method === 'POST') {
    return AiAgentsController::createTemplate();
}

if ($path === '/dashboard/summary' && $method === 'GET') {
    return DashboardSummaryController::getSummary();
}

// ============================================
// SEO & MARKETING ROUTES
// ============================================
if (str_starts_with($path, '/seo')) {
    $seoPath = substr($path, 1); // Remove leading slash
    // If path is just /seo, map to empty or root
    $_GET['path'] = $seoPath;
    require_once __DIR__ . '/api/seo.php';
    exit;
}

// ============================================
// ADS ROUTES
// ============================================
if (str_starts_with($path, '/ads')) {
    $adsPath = substr($path, 1); // Remove leading slash
    $_GET['path'] = $adsPath;
    require_once __DIR__ . '/api/ads.php';
    exit;
}

// ============================================
// SOCIAL MEDIA ROUTES
// ============================================
if (str_starts_with($path, '/social')) {
    $socialPath = substr($path, 7); // Remove '/social'
    $_GET['path'] = $socialPath;
    require_once __DIR__ . '/api/social.php';
    exit;
}

// ============================================
// FILES & MEDIA ROUTES
// ============================================
if (str_starts_with($path, '/files') || str_starts_with($path, '/folders') || str_starts_with($path, '/media')) {
    $_GET['path'] = substr($path, 1); // Pass full path without leading slash
    require_once __DIR__ . '/api/files.php';
    exit;
}

// ============================================
// ANALYTICS ROUTES
// ============================================
if (str_starts_with($path, '/analytics')) {
    require_once __DIR__ . '/../src/controllers/AnalyticsController.php';

    if ($path === '/analytics/summary' && $method === 'GET') {
        return AnalyticsController::summary();
    }
    if ($path === '/analytics/marketing' && $method === 'GET') {
        return AnalyticsController::marketing();
    }
    if ($path === '/analytics/websites' && $method === 'GET') {
        return AnalyticsController::websites();
    }
    if ($path === '/analytics/finance' && $method === 'GET') {
        return AnalyticsController::finance();
    }
    if ($path === '/analytics/estimates' && $method === 'GET') {
        return AnalyticsController::estimates();
    }
    if ($path === '/analytics/field-service' && $method === 'GET') {
        return AnalyticsController::fieldService();
    }
    if ($path === '/analytics/scheduling' && $method === 'GET') {
        return AnalyticsController::scheduling();
    }
    if ($path === '/analytics/ecommerce' && $method === 'GET') {
        return AnalyticsController::ecommerce();
    }
    if ($path === '/analytics/hr' && $method === 'GET') {
        return AnalyticsController::hr();
    }
    if ($path === '/analytics/culture' && $method === 'GET') {
        return AnalyticsController::culture();
    }
    if ($path === '/analytics/reputation' && $method === 'GET') {
        return AnalyticsController::reputation();
    }
    if ($path === '/analytics/courses' && $method === 'GET') {
        return AnalyticsController::courses();
    }
    if ($path === '/analytics/automation' && $method === 'GET') {
        return AnalyticsController::automation();
    }
    if ($path === '/analytics/ai-agents' && $method === 'GET') {
        return AnalyticsController::aiAgents();
    }
    if ($path === '/analytics/sales' && $method === 'GET') {
        return AnalyticsController::sales();
    }
    if ($path === '/analytics/funnels' && $method === 'GET') {
        return AnalyticsController::funnels();
    }
}

// ============================================
// PROPOSALS ROUTES
// ============================================
if (str_starts_with($path, '/proposals')) {
    $propPath = substr($path, 10); // Remove '/proposals'
    if ($propPath === '' || $propPath === false) {
        $propPath = '/';
    }
    
    // Public/Client routes
    if (preg_match('#^/public/([^/]+)$#', $propPath, $m) && $method === 'GET') {
        return ProposalsController::getPublic($m[1]);
    }
    if (preg_match('#^/public/([^/]+)/accept$#', $propPath, $m) && $method === 'POST') {
        return ProposalsController::acceptPublic($m[1]);
    }
    if (preg_match('#^/public/([^/]+)/decline$#', $propPath, $m) && $method === 'POST') {
        return ProposalsController::declinePublic($m[1]);
    }

    // Auth required for strict api
    // (TenantContext resolved at top)

    // Template routes
    if ($propPath === '/templates' && $method === 'GET') {
        return ProposalTemplatesController::getAll();
    }
    if ($propPath === '/templates' && $method === 'POST') {
        return ProposalTemplatesController::create();
    }
    if ($propPath === '/templates/categories' && $method === 'GET') {
        return ProposalTemplatesController::getCategories();
    }
    if (preg_match('#^/templates/(\d+)$#', $propPath, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return ProposalTemplatesController::getOne($id);
        if ($method === 'PUT' || $method === 'PATCH') return ProposalTemplatesController::update($id);
        if ($method === 'DELETE') return ProposalTemplatesController::delete($id);
    }
    if (preg_match('#^/templates/(\d+)/duplicate$#', $propPath, $m) && $method === 'POST') {
        return ProposalTemplatesController::duplicate((int)$m[1]);
    }

    // Settings routes
    if ($propPath === '/settings' && $method === 'GET') {
        return ProposalSettingsController::get();
    }
    if ($propPath === '/settings' && ($method === 'PUT' || $method === 'POST' || $method === 'PATCH')) {
        // Technically update should be PUT/PATCH but some frontends use POST for convenience
        return ProposalSettingsController::update();
    }

    if ($propPath === '/stats' && $method === 'GET') {
        return ProposalsController::getStats();
    }

    // Integrations
    if ($propPath === '/integrations' && $method === 'GET') {
        return ProposalsController::getIntegrations();
    }

    // Workflow Settings
    if ($propPath === '/workflow/settings' && $method === 'GET') {
        return ProposalsController::getWorkflowSettings();
    }
    if ($propPath === '/workflow/settings' && ($method === 'PUT' || $method === 'POST')) {
        return ProposalsController::updateWorkflowSettings();
    }

    // Archive Routes
    if ($propPath === '/archive' && $method === 'GET') {
        return ProposalsController::getArchived();
    }

    if (preg_match('#^/(\d+)/archive$#', $propPath, $m) && $method === 'POST') {
        return ProposalsController::archive((int)$m[1]);
    }
    
    if (preg_match('#^/(\d+)/restore$#', $propPath, $m) && $method === 'POST') {
        return ProposalsController::restore((int)$m[1]);
    }
    
    if (preg_match('#^/(\d+)/permanent$#', $propPath, $m) && $method === 'DELETE') {
        return ProposalsController::destroyPermanent((int)$m[1]);
    }
    
    if ($propPath === '/' || $propPath === '') {
        if ($method === 'GET') return ProposalsController::getAll();
        if ($method === 'POST') return ProposalsController::create();
    }
    
    if (preg_match('#^/(\d+)$#', $propPath, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return ProposalsController::getOne($id);
        if ($method === 'PUT' || $method === 'PATCH') return ProposalsController::update($id);
        if ($method === 'DELETE') return ProposalsController::delete($id);
    }
    
    if (preg_match('#^/(\d+)/duplicate$#', $propPath, $m) && $method === 'POST') {
        return ProposalsController::duplicate((int)$m[1]);
    }
    
    if (preg_match('#^/(\d+)/send$#', $propPath, $m) && $method === 'POST') {
        return ProposalsController::send((int)$m[1]);
    }
    
    if (preg_match('#^/(\d+)/comments$#', $propPath, $m) && $method === 'POST') {
        return ProposalsController::addComment((int)$m[1]);
    }
    
    return;
}

// ============================================
// WEBSITES ROUTES
// ============================================
if (str_starts_with($path, '/websites')) {
    require_once __DIR__ . '/api/websites.php';
    exit;
}

// ECOMMERCE ROUTES
// ============================================
if (str_starts_with($path, '/ecommerce')) {
    $ecomPath = substr($path, 10); // Remove '/ecommerce'
    if ($ecomPath === '' || $ecomPath === false) {
        $ecomPath = '/';
    }
    
    require_once __DIR__ . '/../src/controllers/EcommerceController.php';
    
    $db = Database::conn();
    $tenantId = $GLOBALS['tenantContext']['tenant_id'] ?? null;
    
    if (!$tenantId) {
        Response::error('Tenant context required', 401);
        return;
    }
    
    $controller = new EcommerceController($db, $tenantId);

    // Dashboard
    if ($ecomPath === '/dashboard' && $method === 'GET') {
        try {
            $data = $controller->getDashboard();
            Response::json($data);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
        return;
    }

    // ==================== STORES ====================
    if ($ecomPath === '/stores' && $method === 'GET') {
        try {
            $data = $controller->getStores();
            Response::json(['items' => $data]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
        return;
    }
    if ($ecomPath === '/stores' && $method === 'POST') {
        try {
            $input = Request::body();
            $result = $controller->createStore($input);
            Response::json($result);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
        return;
    }
    if (preg_match('#^/stores/(\d+)$#', $ecomPath, $m)) {
        $id = (int)$m[1];
        try {
            if ($method === 'GET') {
                $data = $controller->getStore($id);
                Response::json($data);
            } elseif ($method === 'PUT' || $method === 'PATCH') {
                $input = Request::body();
                $result = $controller->updateStore($id, $input);
                Response::json($result);
            } elseif ($method === 'DELETE') {
                $result = $controller->deleteStore($id);
                Response::json($result);
            }
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
        return;
    }
    if (preg_match('#^/stores/(\d+)/sync$#', $ecomPath, $m) && $method === 'POST') {
        try {
            $result = $controller->syncStore((int)$m[1]);
            Response::json($result);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
        return;
    }

    // ==================== ABANDONED CARTS ====================
    if ($ecomPath === '/abandoned-carts' && $method === 'GET') {
        try {
            $data = $controller->getAbandonedCarts();
            Response::json(['items' => $data]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
        return;
    }
    if (preg_match('#^/abandoned-carts/(\d+)/recover$#', $ecomPath, $m) && $method === 'POST') {
        try {
            $input = Request::body();
            $result = $controller->recoverCart((int)$m[1], $input);
            Response::json($result);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
        return;
    }

    // ==================== WAREHOUSES ====================
    if ($ecomPath === '/warehouses' && $method === 'GET') {
        try {
            $data = $controller->getWarehouses();
            Response::json(['items' => $data]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
        return;
    }
    if ($ecomPath === '/warehouses' && $method === 'POST') {
        try {
            $input = Request::body();
            $result = $controller->createWarehouse($input);
            Response::json($result);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
        return;
    }
    if (preg_match('#^/warehouses/(\d+)$#', $ecomPath, $m)) {
        $id = (int)$m[1];
        try {
            if ($method === 'PUT' || $method === 'PATCH') {
                $input = Request::body();
                $result = $controller->updateWarehouse($id, $input);
                Response::json($result);
            } elseif ($method === 'DELETE') {
                $result = $controller->deleteWarehouse($id);
                Response::json($result);
            }
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
        return;
    }

    // ==================== INVENTORY ====================
    if ($ecomPath === '/inventory' && $method === 'GET') {
        try {
            $data = $controller->getInventory();
            Response::json(['items' => $data]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
        return;
    }
    if ($ecomPath === '/inventory/stats' && $method === 'GET') {
        try {
            $data = $controller->getInventoryStats();
            Response::json($data);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
        return;
    }
    if ($ecomPath === '/inventory' && $method === 'POST') {
        try {
            $input = Request::body();
            $result = $controller->createInventory($input);
            Response::json($result);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
        return;
    }
    if (preg_match('#^/inventory/(\d+)$#', $ecomPath, $m)) {
        $id = (int)$m[1];
        try {
            if ($method === 'PUT' || $method === 'PATCH') {
                $input = Request::body();
                $result = $controller->updateInventory($id, $input);
                Response::json($result);
            } elseif ($method === 'DELETE') {
                $result = $controller->deleteInventory($id);
                Response::json($result);
            }
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
        return;
    }

    // ==================== COUPONS ====================
    if ($ecomPath === '/coupons' && $method === 'GET') {
        try {
            $data = $controller->getCoupons();
            Response::json(['items' => $data]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
        return;
    }
    if ($ecomPath === '/coupons/stats' && $method === 'GET') {
        try {
            $data = $controller->getCouponStats();
            Response::json($data);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
        return;
    }
    if ($ecomPath === '/coupons' && $method === 'POST') {
        try {
            $input = Request::body();
            $result = $controller->createCoupon($input);
            Response::json($result);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
        return;
    }
    if ($ecomPath === '/coupons/validate' && $method === 'POST') {
        try {
            $input = Request::body();
            $result = $controller->validateCoupon($input);
            Response::json($result);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
        return;
    }
    if (preg_match('#^/coupons/(\d+)$#', $ecomPath, $m)) {
        $id = (int)$m[1];
        try {
            if ($method === 'PUT' || $method === 'PATCH') {
                $input = Request::body();
                $result = $controller->updateCoupon($id, $input);
                Response::json($result);
            } elseif ($method === 'DELETE') {
                $result = $controller->deleteCoupon($id);
                Response::json($result);
            }
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
        return;
    }

    // ==================== SHIPPING METHODS ====================
    if ($ecomPath === '/shipping-methods' && $method === 'GET') {
        try {
            $data = $controller->getShippingMethods();
            Response::json(['items' => $data]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
        return;
    }
    if ($ecomPath === '/shipping-methods' && $method === 'POST') {
        try {
            $input = Request::body();
            $result = $controller->createShippingMethod($input);
            Response::json($result);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
        return;
    }
    if (preg_match('#^/shipping-methods/(\d+)$#', $ecomPath, $m)) {
        $id = (int)$m[1];
        try {
            if ($method === 'PUT' || $method === 'PATCH') {
                $input = Request::body();
                $result = $controller->updateShippingMethod($id, $input);
                Response::json($result);
            } elseif ($method === 'DELETE') {
                $result = $controller->deleteShippingMethod($id);
                Response::json($result);
            }
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
        return;
    }

    // ==================== COLLECTIONS ====================
    if ($ecomPath === '/collections' && $method === 'GET') {
        try {
            $data = $controller->getCollections();
            Response::json(['items' => $data]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
        return;
    }
    if ($ecomPath === '/collections' && $method === 'POST') {
        try {
            $input = Request::body();
            $result = $controller->createCollection($input);
            Response::json($result);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
        return;
    }
    if (preg_match('#^/collections/(\d+)$#', $ecomPath, $m)) {
        $id = (int)$m[1];
        try {
            if ($method === 'GET') {
                $data = $controller->getCollection($id);
                Response::json($data);
            } elseif ($method === 'PUT' || $method === 'PATCH') {
                $input = Request::body();
                $result = $controller->updateCollection($id, $input);
                Response::json($result);
            } elseif ($method === 'DELETE') {
                $result = $controller->deleteCollection($id);
                Response::json($result);
            }
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
        return;
    }
    if (preg_match('#^/collections/(\d+)/products$#', $ecomPath, $m)) {
        $id = (int)$m[1];
        try {
            if ($method === 'GET') {
                $data = $controller->getCollectionProducts($id);
                Response::json(['items' => $data]);
            } elseif ($method === 'POST') {
                $input = Request::body();
                $result = $controller->addProductToCollection($id, $input);
                Response::json($result);
            }
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
        return;
    }
    if (preg_match('#^/collections/(\d+)/products/(\d+)$#', $ecomPath, $m) && $method === 'DELETE') {
        try {
            $result = $controller->removeProductFromCollection((int)$m[1], (int)$m[2]);
            Response::json($result);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
        return;
    }
    if (preg_match('#^/collections/(\d+)/products/reorder$#', $ecomPath, $m) && $method === 'PUT') {
        try {
            $input = Request::body();
            $result = $controller->reorderCollectionProducts((int)$m[1], $input);
            Response::json($result);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
        return;
    }
    
    return;
}

// ============================================
// FUNNELS ROUTES
// ============================================
if (str_starts_with($path, '/funnels')) {
    $funnelsPath = substr($path, 1); // Remove leading slash
    $_GET['path'] = $funnelsPath;
    require_once __DIR__ . '/api/funnels.php';
    exit;
}

// ============================================
// QR CODES ROUTES
// ============================================
if (str_starts_with($path, '/qr-codes')) {
    $qrPath = substr($path, 1); // Remove leading slash
    $_GET['path'] = $qrPath;
    require_once __DIR__ . '/api/qr-codes.php';
    exit;
}

// ============================================
// RECRUITMENT ROUTES (ATS)
// ============================================
if (str_starts_with($path, '/recruitment')) {
    $recPath = substr($path, 12); // Remove '/recruitment'
    if ($recPath === '' || $recPath === false) {
        $recPath = '/';
    }

    // Job Openings
    if ($recPath === '/jobs' && $method === 'GET') {
        return RecruitmentController::getJobOpenings();
    }
    if ($recPath === '/jobs' && $method === 'POST') {
        return RecruitmentController::createJobOpening();
    }
    if (preg_match('#^/jobs/(\d+)$#', $recPath, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return RecruitmentController::updateJobOpening((int)$m[1]);
    }

    // Candidates
    if ($recPath === '/candidates' && $method === 'GET') {
        return RecruitmentController::getCandidates();
    }
    if ($recPath === '/candidates' && $method === 'POST') {
        return RecruitmentController::createCandidate();
    }
    if (preg_match('#^/candidates/(\d+)/convert-to-employee$#', $recPath, $m) && $method === 'POST') {
        return RecruitmentController::convertToEmployee((int)$m[1]);
    }

    // Applications
    if ($recPath === '/applications' && $method === 'GET') {
        return RecruitmentController::getJobApplications();
    }
    if ($recPath === '/applications' && $method === 'POST') {
        return RecruitmentController::createJobApplication();
    }
    if (preg_match('#^/applications/(\d+)/stage$#', $recPath, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return RecruitmentController::updateApplicationStage((int)$m[1]);
    }

    // Interviews
    if ($recPath === '/interviews' && $method === 'GET') {
        return RecruitmentController::getInterviews();
    }
    if ($recPath === '/interviews' && $method === 'POST') {
        return RecruitmentController::scheduleInterview();
    }
    if (preg_match('#^/interviews/(\d+)$#', $recPath, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return RecruitmentController::updateInterview((int)$m[1]);
    }

    // Analytics
    if ($recPath === '/analytics' && $method === 'GET') {
        return RecruitmentController::getRecruitmentAnalytics();
    }

    Response::json(['error' => 'Recruitment endpoint not found'], 404);
    return;
}

// ============================================
// PAYROLL ROUTES
// ============================================
if (str_starts_with($path, '/payroll')) {
    $payPath = substr($path, 8); // Remove '/payroll'
    if ($payPath === '' || $payPath === false) {
        $payPath = '/';
    }

    // Pay Periods
    if ($payPath === '/pay-periods' && $method === 'GET') {
        return PayrollController::getPayPeriods();
    }
    if ($payPath === '/pay-periods' && $method === 'POST') {
        return PayrollController::createPayPeriod();
    }
    if (preg_match('#^/pay-periods/(\d+)/process$#', $payPath, $m) && $method === 'POST') {
        return PayrollController::processPayPeriod((int)$m[1]);
    }
    if (preg_match('#^/pay-periods/(\d+)/approve$#', $payPath, $m) && $method === 'POST') {
        return PayrollController::approvePayPeriod((int)$m[1]);
    }

    // Payroll Records
    if ($payPath === '/records' && $method === 'GET') {
        return PayrollController::getPayrollRecords();
    }
    if (preg_match('#^/records/(\d+)/paid$#', $payPath, $m) && $method === 'POST') {
        return PayrollController::markPayrollPaid((int)$m[1]); 
    }
    
    // Compensation
    if ($payPath === '/compensation' && $method === 'GET') {
        return PayrollController::getEmployeeCompensation();
    }
    if ($payPath === '/compensation' && $method === 'POST') {
        return PayrollController::createEmployeeCompensation();
    }
    if (preg_match('#^/compensation/(\d+)$#', $payPath, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return PayrollController::updateEmployeeCompensation((int)$m[1]);
    }

    // Analytics
    if ($payPath === '/analytics' && $method === 'GET') {
        return PayrollController::getPayrollAnalytics();
    }

    // Tax Brackets
    if ($payPath === '/tax-brackets' && $method === 'GET') {
        return PayrollController::getTaxBrackets();
    }
    if ($payPath === '/tax-brackets' && $method === 'POST') {
        return PayrollController::createTaxBracket();
    }
    if (preg_match('#^/tax-brackets/(\d+)$#', $payPath, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT' || $method === 'PATCH') return PayrollController::updateTaxBracket($id);
        if ($method === 'DELETE') return PayrollController::deleteTaxBracket($id);
    }

    return;
}

// ============================================
// SCHEDULING ROUTES (Appointments, Video Providers, Booking Pages)
// ============================================
if (str_starts_with($path, '/scheduling') || str_starts_with($path, '/video') || 
    str_starts_with($path, '/booking-types') || str_starts_with($path, '/appointments') ||
    str_starts_with($path, '/booking-pages') || str_starts_with($path, '/availability') ||
    str_starts_with($path, '/calendar-sync')) {
    $schedulingPath = $path;
    // Remove leading slash for consistency with other API files
    if (str_starts_with($schedulingPath, '/')) {
        $schedulingPath = substr($schedulingPath, 1);
    }
    $_GET['path'] = $schedulingPath;
    require_once __DIR__ . '/api/scheduling.php';
    exit;
}

// Public booking routes (no auth required)
if (preg_match('#^/public/book(ing)?/#', $path)) {
    $schedulingPath = substr($path, 1); // Remove leading slash
    $_GET['path'] = $schedulingPath;
    require_once __DIR__ . '/api/scheduling.php';
    exit;
}

// ============================================
// TELEPHONY WEBHOOKS (Public / Provider Callbacks)
// ============================================
if ($path === '/webhooks/inbound-call' && $method === 'POST') {
    return InboundCallController::handleInboundCall();
}
if ($path === '/webhooks/call-status' && $method === 'POST') {
    return InboundCallController::handleCallStatus();
}
if ($path === '/webhooks/recording-complete' && $method === 'POST') {
    return InboundCallController::handleRecordingComplete();
}
if ($path === '/webhooks/voicemail-transcription' && $method === 'POST') {
    return InboundCallController::handleVoicemailTranscription();
}
if ($path === '/webhooks/whisper' && $method === 'GET') {
    return InboundCallController::handleWhisper();
}

// ============================================
// PUBLIC Checkout Routes (No Auth Required)
// ============================================
require_once __DIR__ . '/../src/controllers/PaymentLinkController.php';

if (preg_match('#^/checkout/([a-z0-9-]+)$#', $path, $m) && $method === 'GET') {
    return PaymentLinkController::getPublicLink($m[1]);
}

if ($path === '/checkout/order' && $method === 'POST') {
    return PaymentLinkController::createOrder();
}




// ============================================
// CONNECTIONS ROUTES
// ============================================
if (str_starts_with($path, '/connections')) {
    require_once __DIR__ . '/../src/controllers/ConnectionsController.php';

    // Test Config (New endpoint)
    if ($path === '/connections/test-config' && $method === 'POST') {
        return ConnectionsController::testConnectionConfig();
    }

    // CRUD
    if ($path === '/connections' && $method === 'GET') {
        return ConnectionsController::getConnections();
    }
    if ($path === '/connections' && $method === 'POST') {
        return ConnectionsController::createConnection();
    }
    // Allow both numeric and UUID/hex IDs
    if (preg_match('#^/connections/([a-zA-Z0-9-]+)$#', $path, $m)) {
        $id = $m[1];
        if ($id === 'test-config') { 
            // Handle collision if test-config matches the regex (though it shouldn't if test-config is handled first, but safer to be specific)
             // already handled above
        } else {
            if ($method === 'GET') return ConnectionsController::getConnection($id);
            if ($method === 'PUT' || $method === 'PATCH') return ConnectionsController::updateConnection($id);
            if ($method === 'DELETE') return ConnectionsController::deleteConnection($id);
        }
    }
    
    // Actions
    if (preg_match('#^/connections/([a-zA-Z0-9-]+)/test$#', $path, $m) && $method === 'POST') {
        return ConnectionsController::testConnection($m[1]);
    }
    if (preg_match('#^/connections/([a-zA-Z0-9-]+)/sync$#', $path, $m) && $method === 'POST') {
        return ConnectionsController::syncConnection($m[1]);
    }
    if (preg_match('#^/connections/([a-zA-Z0-9-]+)/phone-numbers$#', $path, $m) && $method === 'GET') {
        return ConnectionsController::getConnectionPhoneNumbers($m[1]);
    }
    if (preg_match('#^/connections/([a-zA-Z0-9-]+)/token$#', $path, $m) && $method === 'GET') {
        return ConnectionsController::getConnectionToken($m[1]);
    }

    return;
}

    // ============================================
    // WebForms Routes (Legacy/Alias)
    // ============================================
    if ($path === '/webforms' && $method === 'GET') {
        return WebFormsController::getForms();
    }

// ============================================================================
// WebForms API routes (/webforms-api/*)
// These replace the legacy XordonForms/api/index.php functionality
// ============================================================================
if (str_starts_with($path, '/webforms-api')) {
    $wfPath = substr($path, 13); // Remove '/webforms-api'
    if ($wfPath === '' || $wfPath === false) {
        $wfPath = '/';
    }
    
    // Public endpoints (no auth required)
    if (preg_match('#^/forms/(\d+)/public$#', $wfPath, $m) && $method === 'GET') {
        return WebFormsController::getPublicForm((int)$m[1]);
    }
    if (preg_match('#^/forms/(\d+)/submit$#', $wfPath, $m) && $method === 'POST') {
        return WebFormsController::submitForm((int)$m[1]);
    }
    if (preg_match('#^/forms/(\d+)/start$#', $wfPath, $m) && $method === 'POST') {
        return WebFormsControllerExtensions::trackFormStart((int)$m[1]);
    }
    
    // All other webforms endpoints require auth - TenantContext already resolved above
    
    // Dashboard / Analytics
    if ($wfPath === '/analytics/dashboard' && $method === 'GET') {
        return WebFormsController::getDashboardStats();
    }
    
    // Forms CRUD
    if ($wfPath === '/forms' && $method === 'GET') {
        return WebFormsController::getForms();
    }
    if (($wfPath === '/forms' || $wfPath === '/forms/create') && $method === 'POST') {
        return WebFormsController::createForm();
    }
    if (preg_match('#^/forms/(\d+)/marketplace/preview$#', $wfPath, $m) && $method === 'POST') {
        return WebFormsController::previewMarketplaceLead((int)$m[1]);
    }
    if (preg_match('#^/forms/(\d+)$#', $wfPath, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return WebFormsController::getForm($id);
        if ($method === 'PUT' || $method === 'PATCH') return WebFormsController::updateForm($id);
        if ($method === 'DELETE') return WebFormsController::deleteForm($id);
    }
    if (preg_match('#^/forms/(\d+)/duplicate$#', $wfPath, $m) && $method === 'POST') {
        return WebFormsController::duplicateForm((int)$m[1]);
    }
    
    // Form Submissions
    if (preg_match('#^/forms/(\d+)/submissions$#', $wfPath, $m) && $method === 'GET') {
        return WebFormsController::getSubmissions((int)$m[1]);
    }
    if (preg_match('#^/forms/(\d+)/submissions/(\d+)/reply$#', $wfPath, $m) && $method === 'POST') {
        return WebFormsController::replyToSubmission((int)$m[1], (int)$m[2]);
    }
    if (preg_match('#^/submissions/(\d+)$#', $wfPath, $m) && $method === 'GET') {
        return WebFormsController::getSubmission((int)$m[1]);
    }
    
    // Folders CRUD
    if ($wfPath === '/folders' && $method === 'GET') {
        return WebFormsController::getFolders();
    }
    if ($wfPath === '/folders' && $method === 'POST') {
        return WebFormsController::createFolder();
    }
    if (preg_match('#^/folders/(\d+)$#', $wfPath, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return WebFormsController::getFolder($id);
        if ($method === 'PUT' || $method === 'PATCH') return WebFormsController::updateFolder($id);
        if ($method === 'DELETE') return WebFormsController::deleteFolder($id);
    }
    
    // User Settings
    if ($wfPath === '/user/settings' && $method === 'GET') {
        return WebFormsController::getUserSettings();
    }
    if ($wfPath === '/user/settings' && ($method === 'PUT' || $method === 'PATCH')) {
        return WebFormsController::updateUserSettings();
    }
    if ($wfPath === '/user/export' && $method === 'GET') {
        return WebFormsController::exportUserData();
    }
    
    // Users (Team Management)
    if ($wfPath === '/users' && $method === 'GET') {
        return WebFormsController::getUsers();
    }
    if ($wfPath === '/users/invite' && $method === 'POST') {
        return WebFormsController::inviteUser();
    }
    if (preg_match('#^/users/(\d+)$#', $wfPath, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return WebFormsController::getUser($id);
        if ($method === 'PUT' || $method === 'PATCH') return WebFormsController::updateUser($id);
        if ($method === 'DELETE') return WebFormsController::removeUser($id);
    }
    
    // Webhooks CRUD
    if ($wfPath === '/webhooks' && $method === 'GET') {
        return WebFormsController::getWebhooks();
    }
    if ($wfPath === '/webhooks' && $method === 'POST') {
        return WebFormsController::createWebhook();
    }
    if (preg_match('#^/webhooks/(\d+)$#', $wfPath, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT' || $method === 'PATCH') return WebFormsController::updateWebhook($id);
        if ($method === 'DELETE') return WebFormsController::deleteWebhook($id);
    }
    if (preg_match('#^/webhooks/(\d+)/test$#', $wfPath, $m) && $method === 'POST') {
        return WebFormsController::testWebhook((int)$m[1]);
    }
    
    // ============================================
    // HELPDESK / TICKETS MAIN ROUTES
    // ============================================
    require_once __DIR__ . '/../src/controllers/TicketsController.php';
    require_once __DIR__ . '/../src/controllers/CannedResponsesController.php';
    require_once __DIR__ . '/../src/controllers/KnowledgeBaseController.php';

    // Ticket Stats
    if ($path === '/tickets/stats' && $method === 'GET') {
        return (new TicketsController())->stats();
    }

    // Ticket Stages, Types, Teams
    if ($path === '/ticket-stages' && $method === 'GET') {
        return (new TicketsController())->listStages();
    }
    if ($path === '/ticket-types' && $method === 'GET') {
        return (new TicketsController())->listTypes();
    }
    if (($path === '/ticket-teams' || $path === '/tickets/teams') && $method === 'GET') {
        return (new TicketsController())->listTeams();
    }

    // Tickets CRUD
    if (($path === '/tickets' || $path === '/helpdesk/tickets') && $method === 'GET') {
        return (new TicketsController())->list();
    }
    if (($path === '/tickets' || $path === '/helpdesk/tickets') && $method === 'POST') {
        return (new TicketsController())->create();
    }
    if (preg_match('#^/tickets/number/([^/]+)$#', $path, $m) && $method === 'GET') {
        return (new TicketsController())->getByNumber($m[1]);
    }
    if (preg_match('#^/tickets/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        $controller = new TicketsController();
        if ($method === 'GET') return $controller->get($id);
        if ($method === 'PUT' || $method === 'PATCH') return $controller->update($id);
    }
    if (preg_match('#^/tickets/(\d+)/messages$#', $path, $m) && $method === 'POST') {
        return (new TicketsController())->addMessage((int)$m[1]);
    }

    // Canned Responses
    if (($path === '/canned-responses' || $path === '/helpdesk/canned-responses') && $method === 'GET') {
        return (new CannedResponsesController())->list();
    }
    if (($path === '/canned-responses' || $path === '/helpdesk/canned-responses') && $method === 'POST') {
        return (new CannedResponsesController())->create();
    }
    if (preg_match('#^/canned-responses/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        $controller = new CannedResponsesController();
        if ($method === 'GET') return $controller->get($id);
        if ($method === 'PUT' || $method === 'PATCH') return $controller->update($id);
        if ($method === 'DELETE') return $controller->delete($id);
    }

    // Knowledge Base
    if ($path === '/kb/articles' && $method === 'GET') {
        return (new KnowledgeBaseController())->listArticles();
    }
    if ($path === '/kb/articles' && $method === 'POST') {
        return (new KnowledgeBaseController())->createArticle();
    }
    if (preg_match('#^/kb/articles/([^/]+)$#', $path, $m)) {
        $param = $m[1];
        $controller = new KnowledgeBaseController();
        if ($method === 'GET') {
            if (is_numeric($param)) {
                return $controller->getArticle((int)$param);
            } else {
                return $controller->getBySlug($param);
            }
        }
        if ($method === 'PUT' || $method === 'PATCH') return $controller->updateArticle((int)$param);
        if ($method === 'DELETE') return $controller->deleteArticle((int)$param);
    }

    if ($path === '/kb/categories' && $method === 'GET') {
        return (new KnowledgeBaseController())->listCategories();
    }
    if ($path === '/kb/categories' && $method === 'POST') {
        return (new KnowledgeBaseController())->createCategory();
    }
    if (preg_match('#^/kb/categories/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        $controller = new KnowledgeBaseController();
        if ($method === 'PUT' || $method === 'PATCH') return $controller->updateCategory($id);
        if ($method === 'DELETE') return $controller->deleteCategory($id);
    }

    // Helpdesk merge/split endpoints
    if ($path === '/helpdesk/tickets/merge' && $method === 'POST') {
        return MergeSplitController::merge();
    }
    if ($path === '/helpdesk/merge-history' && $method === 'GET') {
        return MergeSplitController::history();
    }
    if (preg_match('#^/helpdesk/merge-history/(\d+)/undo$#', $path, $m) && $method === 'POST') {
        return MergeSplitController::undo((int)$m[1]);
    }

    // Helpdesk CSAT endpoints
    if ($path === '/helpdesk/csat-surveys' && $method === 'GET') {
        return CSATController::list();
    }
    if ($path === '/helpdesk/csat-surveys' && $method === 'POST') {
        return CSATController::create();
    }
    if (preg_match('#^/helpdesk/csat-surveys/(\d+)$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return CSATController::update((int)$m[1]);
    }
    if (preg_match('#^/helpdesk/csat-surveys/(\d+)$#', $path, $m) && $method === 'DELETE') {
        return CSATController::delete((int)$m[1]);
    }
    if (preg_match('#^/helpdesk/csat-surveys/(\d+)/send$#', $path, $m) && $method === 'POST') {
        return CSATController::send((int)$m[1]);
    }

    // Helpdesk Saved Filters endpoints - NOTE: Already defined at top of file (lines ~311-322)
    // Removed duplicate definition to prevent code duplication

    // Helpdesk Bulk Actions
    if ($path === '/helpdesk/bulk-actions' && $method === 'POST') {
        return BulkActionsController::process();
    }
    if ($path === '/helpdesk/bulk-actions/logs' && $method === 'GET') {
        return BulkActionsController::logs();
    }

    // Helpdesk reporting endpoints
    if ($path === '/helpdesk/reports/metrics' && $method === 'GET') {
        return HelpdeskReportingController::metrics();
    }
    if ($path === '/helpdesk/reports/export' && $method === 'GET') {
        return HelpdeskReportingController::export();
    }

    // Load extensions for new endpoints
    require_once __DIR__ . '/../src/controllers/WebFormsControllerExtensions.php';
    
    // Insights
    if (preg_match('#^/forms/(\d+)/insights$#', $wfPath, $m) && $method === 'GET') {
        return WebFormsControllerExtensions::getFormInsights((int)$m[1]);
    }
    
    // Files
    if (preg_match('#^/forms/(\d+)/files$#', $wfPath, $m) && $method === 'GET') {
        return WebFormsControllerExtensions::getFormFiles((int)$m[1]);
    }
    if (preg_match('#^/forms/(\d+)/files/(\d+)$#', $wfPath, $m) && $method === 'DELETE') {
        return WebFormsControllerExtensions::deleteFormFile((int)$m[1], (int)$m[2]);
    }
    
    // Reports
    if (preg_match('#^/forms/(\d+)/reports$#', $wfPath, $m)) {
        $formId = (int)$m[1];
        if ($method === 'GET') return WebFormsControllerExtensions::getFormReports($formId);
        if ($method === 'POST') return WebFormsControllerExtensions::generateReport($formId);
    }
    if (preg_match('#^/forms/(\d+)/scheduled-reports$#', $wfPath, $m)) {
        $formId = (int)$m[1];
        if ($method === 'GET') return WebFormsControllerExtensions::getScheduledReports($formId);
        if ($method === 'POST') return WebFormsControllerExtensions::createScheduledReport($formId);
    }
    if (preg_match('#^/forms/(\d+)/scheduled-reports/(\d+)$#', $wfPath, $m)) {
        $formId = (int)$m[1];
        $reportId = (int)$m[2];
        if ($method === 'PUT' || $method === 'PATCH') return WebFormsControllerExtensions::updateScheduledReport($formId, $reportId);
        if ($method === 'DELETE') return WebFormsControllerExtensions::deleteScheduledReport($formId, $reportId);
    }
    
    // Bulk actions
    if (preg_match('#^/forms/(\d+)/submissions/bulk$#', $wfPath, $m) && $method === 'POST') {
        return WebFormsControllerExtensions::bulkUpdateSubmissions((int)$m[1]);
    }
    if (preg_match('#^/forms/(\d+)/submissions/export$#', $wfPath, $m) && $method === 'GET') {
        return WebFormsControllerExtensions::exportSubmissions((int)$m[1]);
    }
    
    // Fallback: endpoint not found within webforms-api
    Response::json(['error' => 'WebForms API endpoint not found', 'path' => $wfPath, 'method' => $method], 404);
    return;
}

// Operations module routes
// PROTECTED: Requires 'operations' module to be enabled for the workspace
if (str_starts_with($path, '/operations')) {
    // Check module access before delegating (bypass in development)
    // $appEnv = Config::get('APP_ENV', 'development');
    // if ($appEnv === 'production' && !App\Controllers\AppsController::requireModule('operations')) {
    //    exit;
    // }
    // Extract the sub-path after /operations
    $opsPath = substr($path, 11); // Remove '/operations'
    if ($opsPath === '' || $opsPath === false) {
        $opsPath = '/';
    }
    $_GET['path'] = ltrim($opsPath, '/');
    require_once __DIR__ . '/api/operations.php';
    exit;
}

// GHL-style invoices & payments are part of the Operations module
// PROTECTED: Requires 'operations' module to be enabled for the workspace
if (str_starts_with($path, '/invoices')) {
    require_once __DIR__ . '/../src/controllers/InvoicesController.php';
    if ($path === '/invoices' && $method === 'GET') return InvoicesController::listInvoices();
    if ($path === '/invoices' && $method === 'POST') return InvoicesController::createInvoice();
    if ($path === '/invoices/stats' && $method === 'GET') return InvoicesController::getStats();
    if (preg_match('#^/invoices/(\d+)$#', $path, $m)) {
        if ($method === 'GET') return InvoicesController::getInvoice((int)$m[1]);
        if ($method === 'PUT' || $method === 'PATCH') return InvoicesController::updateInvoice((int)$m[1]);
        if ($method === 'DELETE') return InvoicesController::deleteInvoice((int)$m[1]);
    }
    if (preg_match('#^/invoices/(\d+)/status$#', $path, $m) && $method === 'POST') {
        return InvoicesController::updateInvoiceStatus((int)$m[1]);
    }
    if (preg_match('#^/invoices/(\d+)/payments$#', $path, $m) && $method === 'POST') {
        return InvoicesController::recordPayment((int)$m[1]);
    }
}

if (str_starts_with($path, '/products')) {
    require_once __DIR__ . '/../src/controllers/InvoicesController.php';
    if ($path === '/products' && $method === 'GET') return InvoicesController::listProducts();
    if ($path === '/products' && $method === 'POST') return InvoicesController::createProduct();
    if (preg_match('#^/products/(\d+)$#', $path, $m)) {
        if ($method === 'PUT' || $method === 'PATCH') return InvoicesController::updateProduct((int)$m[1]);
        if ($method === 'DELETE') return InvoicesController::deleteProduct((int)$m[1]);
    }
}

if (str_starts_with($path, '/payment-links')) {
    require_once __DIR__ . '/../src/controllers/InvoicesController.php';
    require_once __DIR__ . '/../src/controllers/PaymentLinkController.php';
    
    if ($path === '/payment-links' && $method === 'GET') return InvoicesController::listPaymentLinks();
    if ($path === '/payment-links' && $method === 'POST') return InvoicesController::createPaymentLink();
    
    if (preg_match('#^/payment-links/(\d+)/send-sms$#', $path, $m) && $method === 'POST') {
        return PaymentLinkController::sendViaSMS($m[1]);
    }
}



// Route processing complete



// Debug route to test path matching
if ($isDev && $path === '/debug/path' && $method === 'GET') {
    Response::json(['path' => $path, 'method' => $method, 'original_uri' => $_SERVER['REQUEST_URI']]);
    return;
}

// ============================================
// AUTOMATIONS (Legacy/V1)
// ============================================
if ($path === '/automations' && $method === 'GET') {
    $controller = new AutomationController();
    return $controller->index();
}
if ($path === '/automations' && $method === 'POST') {
    $controller = new AutomationController();
    return $controller->create();
}
if ($path === '/automations/options' && $method === 'GET') {
    return AutomationsV2Controller::options();
}
if (preg_match('#^/automations/(\d+)$#', $path, $m)) {
    $id = (int)$m[1];
    $controller = new AutomationController();
    if ($method === 'GET') return $controller->show($id);
    if ($method === 'PUT' || $method === 'PATCH') return $controller->update($id);
    if ($method === 'DELETE') return $controller->delete($id);
}
if (preg_match('#^/automations/(\d+)/toggle$#', $path, $m) && $method === 'POST') {
    $controller = new AutomationController();
    return $controller->toggle((int)$m[1]);
}


// ============================================
// AUTOMATION RECIPES
// ============================================
if (($path === '/automation-recipes' || $path === '/automations/recipes') && $method === 'GET') {
    return AutomationRecipesController::index();
}
if (($path === '/automation-recipes' || $path === '/automations/recipes') && $method === 'POST') {
    return AutomationRecipesController::create();
}
if (preg_match('#^/automation-recipes/(\d+)$#', $path, $m)) {
    $id = $m[1];
    if ($method === 'GET') return AutomationRecipesController::show($id);
    if ($method === 'PUT' || $method === 'PATCH') return AutomationRecipesController::update($id);
    if ($method === 'DELETE') return AutomationRecipesController::delete($id);
}
if (preg_match('#^/automation-recipes/(\d+)/install$#', $path, $m) && $method === 'POST') {
    return AutomationRecipesController::install($m[1]);
}
if ($path === '/automation-recipes/categories' && $method === 'GET') {
    return AutomationRecipesController::getCategories();
}


// ============================================
// FLOWS / WORKFLOWS (V2)
// ============================================
if (($path === '/flows' || $path === '/automations/v2/workflows') && $method === 'GET') {
    return AutomationsV2Controller::listWorkflows();
}
if (($path === '/flows' || $path === '/automations/v2/workflows') && $method === 'POST') {
    return AutomationsV2Controller::createWorkflow();
}
if (preg_match('#^/automations/v2/workflows/(\d+)$#', $path, $m)) {
    $id = (int)$m[1];
    if ($method === 'GET') return AutomationsV2Controller::getWorkflow($id);
    if ($method === 'PUT' || $method === 'PATCH') return AutomationsV2Controller::updateWorkflow($id);
    if ($method === 'DELETE') return AutomationsV2Controller::deleteWorkflow($id);
}
if (preg_match('#^/automations/v2/workflows/(\d+)/toggle$#', $path, $m) && $method === 'POST') {
    return AutomationsV2Controller::toggleWorkflow((int)$m[1]);
}
if (preg_match('#^/automations/v2/workflows/(\d+)/executions$#', $path, $m) && $method === 'GET') {
    return AutomationsV2Controller::getExecutions((int)$m[1]);
}

// V2 Recipes & Options
if ($path === '/automations/v2/recipes' && $method === 'GET') {
    return AutomationsV2Controller::listRecipes();
}
if ($path === '/automations/v2/recipes/categories' && $method === 'GET') {
    return AutomationsV2Controller::getRecipeCategories();
}
if (preg_match('#^/automations/v2/recipes/(\d+)/use$#', $path, $m) && $method === 'POST') {
    return AutomationsV2Controller::useRecipe((int)$m[1]);
}
if ($path === '/automations/v2/stats' && $method === 'GET') {
    return AutomationsV2Controller::getStats();
}
if ($path === '/automations/v2/triggers' && $method === 'GET') {
    return AutomationsV2Controller::getTriggerTypes();
}
if ($path === '/automations/v2/actions' && $method === 'GET') {
    return AutomationsV2Controller::getActionTypes();
}

// Test route to verify routing is working
if ($isDev && $path === '/test' && $method === 'GET') {
    Response::json(['status' => 'test_route_working', 'path' => $path, 'method' => $method]);
    return;
}

// Debug route to show path parsing
if ($isDev && $path === '/debug/paths' && $method === 'GET') {
    Response::json([
        'original_uri' => $_SERVER['REQUEST_URI'],
        'parsed_path' => $path,
        'method' => $method,
        'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'not set',
        'php_self' => $_SERVER['PHP_SELF'] ?? 'not set'
    ]);
    return;
}

// Performance: Debug logging disabled by default for speed
// Set API_DEBUG=true in .env to enable request logging
$apiDebug = (getenv('API_DEBUG') === 'true');
if ($apiDebug) {
    error_log("[API] $method $path");
}

// Route matching
try {
    // Auth routes
    if ($path === '/auth/signup' && $method === 'POST') return AuthController::signup();
    if ($path === '/auth/register' && $method === 'POST') return AuthController::signup();
    if ($path === '/auth/login' && $method === 'POST') return AuthController::login();
    if ($path === '/auth/logout' && $method === 'POST') return AuthController::logout();
    if ($path === '/auth/me' && $method === 'GET') return AuthController::me();
    if ($path === '/auth/verify' && $method === 'GET') return AuthController::me(); // Use me() for token verification
    if ($path === '/auth/dev-token' && $method === 'GET') return AuthController::devToken();
    if ($path === '/auth/verify-invite' && $method === 'GET') return AuthController::verifyInvite();
    if ($path === '/auth/accept-invite' && $method === 'POST') return AuthController::acceptInvite();
    if ($path === '/auth/companies/allowed' && $method === 'GET') return AuthController::allowedCompanies();

    // Workspace routes
    if ($path === '/workspaces' && $method === 'GET') return WorkspacesController::index();
    if ($path === '/workspaces' && $method === 'POST') return WorkspacesController::create();
    if ($path === '/workspaces/current' && $method === 'GET') return WorkspacesController::current();
    if (preg_match('#^/workspaces/(\d+)$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return WorkspacesController::update($m[1]);
    }

    // ========================================
    // Multi-Tenant Routes (Agencies & Subaccounts)
    // ========================================
    
    // Agencies
    if ($path === '/mt/agencies' && $method === 'GET') return MultiTenantController::listAgencies();
    if ($path === '/mt/agencies' && $method === 'POST') return MultiTenantController::createAgency();
    if ($path === '/mt/agencies/current' && $method === 'GET') return MultiTenantController::getCurrentAgency();
    if (preg_match('#^/mt/agencies/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return MultiTenantController::getAgency($id);
        if ($method === 'PUT' || $method === 'PATCH') return MultiTenantController::updateAgency($id);
    }
    if (preg_match('#^/mt/agencies/(\d+)/branding$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return MultiTenantController::getAgencyBranding($id);
        if ($method === 'PUT' || $method === 'PATCH') return MultiTenantController::updateAgencyBranding($id);
    }
    if (preg_match('#^/mt/agencies/(\d+)/members$#', $path, $m) && $method === 'GET') {
        return MultiTenantController::getAgencyMembers((int)$m[1]);
    }
    
    // Subaccounts
    if ($path === '/mt/subaccount/stats' && $method === 'GET') return ClientDashboardController::getStats();
    if (preg_match('#^/mt/agencies/(\d+)/subaccounts$#', $path, $m)) {
        $agencyId = (int)$m[1];
        if ($method === 'GET') return MultiTenantController::listSubaccounts($agencyId);
        if ($method === 'POST') return MultiTenantController::createSubaccount($agencyId);
    }
    if (preg_match('#^/mt/subaccounts/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return MultiTenantController::getSubaccount($id);
        if ($method === 'PUT' || $method === 'PATCH') return MultiTenantController::updateSubaccount($id);
        if ($method === 'DELETE') return MultiTenantController::deleteSubaccount($id);
    }
    if (preg_match('#^/mt/subaccounts/(\d+)/settings$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return MultiTenantController::getSubaccountSettings($id);
        if ($method === 'PUT' || $method === 'PATCH') return MultiTenantController::updateSubaccountSettings($id);
    }
    if (preg_match('#^/mt/subaccounts/(\d+)/members$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return MultiTenantController::getSubaccountMembers($id);
        if ($method === 'POST') return MultiTenantController::inviteSubaccountMember($id);
    }
    
    // Context Switching
    if ($path === '/mt/context/subaccount' && $method === 'GET') return MultiTenantController::getCurrentSubaccount();
    if (preg_match('#^/mt/context/switch/(\d+)$#', $path, $m) && $method === 'POST') {
        return MultiTenantController::switchSubaccount((int)$m[1]);
    }
    
    // Agency Domains (Whitelabel)
    if (preg_match('#^/mt/agencies/(\d+)/domains$#', $path, $m)) {
        $agencyId = (int)$m[1];
        if ($method === 'GET') return AgencyDomainsController::list($agencyId);
        if ($method === 'POST') return AgencyDomainsController::create($agencyId);
    }
    if (preg_match('#^/mt/agencies/(\d+)/domains/(\d+)$#', $path, $m)) {
        $agencyId = (int)$m[1];
        $domainId = (int)$m[2];
        if ($method === 'PUT' || $method === 'PATCH') return AgencyDomainsController::update($agencyId, $domainId);
        if ($method === 'DELETE') return AgencyDomainsController::delete($agencyId, $domainId);
    }
    if (preg_match('#^/mt/agencies/(\d+)/domains/(\d+)/verify$#', $path, $m) && $method === 'POST') {
        return AgencyDomainsController::verify((int)$m[1], (int)$m[2]);
    }
    
    // Theme Resolution (Public - for login pages)
    if ($path === '/mt/theme/resolve' && $method === 'GET') {
        $host = $_GET['host'] ?? $_SERVER['HTTP_HOST'] ?? '';
        return AgencyDomainsController::resolveByHost($host);
    }
    
    // Team Management - Agency
    if (preg_match('#^/mt/agencies/(\d+)/team$#', $path, $m)) {
        $agencyId = (int)$m[1];
        if ($method === 'GET') return TeamController::listAgencyTeam($agencyId);
    }
    if (preg_match('#^/mt/agencies/(\d+)/team/invite$#', $path, $m) && $method === 'POST') {
        return TeamController::inviteToAgency((int)$m[1]);
    }
    if (preg_match('#^/mt/agencies/(\d+)/team/(\d+)$#', $path, $m)) {
        $agencyId = (int)$m[1];
        $memberId = (int)$m[2];
        if ($method === 'PUT' || $method === 'PATCH') return TeamController::updateAgencyMember($agencyId, $memberId);
        if ($method === 'DELETE') return TeamController::removeAgencyMember($agencyId, $memberId);
    }
    if (preg_match('#^/mt/agencies/(\d+)/team/(\d+)/resend$#', $path, $m) && $method === 'POST') {
        return TeamController::resendInvite((int)$m[1], (int)$m[2]);
    }
    
    // Accept invitation
    if ($path === '/mt/invites/accept' && $method === 'POST') return TeamController::acceptInvite();
    
    // Team Management - Subaccount
    if (preg_match('#^/mt/subaccounts/(\d+)/team$#', $path, $m)) {
        $subaccountId = (int)$m[1];
        if ($method === 'GET') return TeamController::listSubaccountTeam($subaccountId);
        if ($method === 'POST') return TeamController::addSubaccountMember($subaccountId);
    }
    if (preg_match('#^/mt/subaccounts/(\d+)/team/(\d+)$#', $path, $m)) {
        $subaccountId = (int)$m[1];
        $memberId = (int)$m[2];
        if ($method === 'PUT' || $method === 'PATCH') return TeamController::updateSubaccountMember($subaccountId, $memberId);
        if ($method === 'DELETE') return TeamController::removeSubaccountMember($subaccountId, $memberId);
    }
    
    // Audit Log
    if (preg_match('#^/mt/agencies/(\d+)/audit$#', $path, $m) && $method === 'GET') {
        return TeamController::getAgencyAuditLog((int)$m[1]);
    }
    
    // Permissions Check
    if ($path === '/mt/permissions/check' && $method === 'GET') return TeamController::checkPermissions();
    if ($path === '/mt/permissions/me' && $method === 'GET') return TeamController::myAccess();
    
    // Billing - Plans (Public)
    if ($path === '/mt/billing/plans' && $method === 'GET') return BillingController::getPlans();
    
    // Billing - Agency-specific
    if (preg_match('#^/mt/agencies/(\d+)/billing/subscription$#', $path, $m)) {
        $agencyId = (int)$m[1];
        if ($method === 'GET') return BillingController::getSubscription($agencyId);
        if ($method === 'PUT' || $method === 'PATCH') return BillingController::updateSubscription($agencyId);
        if ($method === 'DELETE') return BillingController::cancelSubscription($agencyId);
    }
    if (preg_match('#^/mt/agencies/(\d+)/billing/checkout$#', $path, $m) && $method === 'POST') {
        return BillingController::createCheckout((int)$m[1]);
    }
    if (preg_match('#^/mt/agencies/(\d+)/billing/portal$#', $path, $m) && $method === 'POST') {
        return BillingController::createPortalSession((int)$m[1]);
    }
    if (preg_match('#^/mt/agencies/(\d+)/billing/usage$#', $path, $m) && $method === 'GET') {
        return BillingController::getUsage((int)$m[1]);
    }
    if (preg_match('#^/mt/agencies/(\d+)/billing/invoices$#', $path, $m) && $method === 'GET') {
        return BillingController::getInvoices((int)$m[1]);
    }
    if (preg_match('#^/mt/agencies/(\d+)/billing/reseller-pricing$#', $path, $m)) {
        $agencyId = (int)$m[1];
        if ($method === 'GET') return BillingController::getResellerPricing($agencyId);
        if ($method === 'PUT') return BillingController::updateResellerPricing($agencyId);
    }
    
    // Stripe Webhook (No auth required)
    if ($path === '/webhooks/stripe' && $method === 'POST') {
        return BillingController::handleWebhook();
    }

    // User routes (alias for auth/me)
    if ($path === '/users/me' && $method === 'GET') return AuthController::me();

    // User Profile & Preferences
    if ($path === '/user/profile' && $method === 'GET') return UserController::getProfile();
    if ($path === '/user/profile' && ($method === 'PUT' || $method === 'PATCH')) return UserController::updateProfile();
    if ($path === '/user/notifications' && $method === 'GET') return UserController::getNotificationPreferences();
    if ($path === '/user/notifications' && ($method === 'PUT' || $method === 'PATCH')) return UserController::updateNotificationPreferences();
    
    // Legacy user routes (for compatibility) - only for 'me' endpoint
    if ($path === '/users/me' && ($method === 'PUT' || $method === 'PATCH')) {
        return UserController::updateProfile();
    }

    // RBAC - Roles
    if ($path === '/roles' && $method === 'GET') return RolesController::index();
    if ($path === '/roles' && $method === 'POST') return RolesController::create();
    if (preg_match('#^/roles/(\d+)/permissions$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return RolesController::getPermissions($id);
        if ($method === 'PUT' || $method === 'PATCH') return RolesController::setPermissions($id);
    }
    if (preg_match('#^/roles/(\d+)/users$#', $path, $m) && $method === 'GET') {
        return RolesController::getUsersWithRole((int)$m[1]);
    }
    if (preg_match('#^/roles/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return RolesController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return RolesController::update($id);
        if ($method === 'DELETE') return RolesController::delete($id);
    }

    // RBAC - Permissions
    if ($path === '/permissions' && $method === 'GET') return PermissionsController::index();
    if ($path === '/permissions/categories' && $method === 'GET') return PermissionsController::getByCategory();
    if ($path === '/permissions/matrix' && $method === 'GET') return PermissionsController::getMatrix();
    if ($path === '/permissions/export' && $method === 'GET') return PermissionsController::export();
    if ($path === '/permissions/import' && $method === 'POST') return PermissionsController::import();
    if ($path === '/permissions/me' && $method === 'GET') return PermissionsController::myPermissions();
    if ($path === '/permissions/workspace' && $method === 'GET') {
        // Return workspace role and module-specific permissions (HR/Growth)
        require_once __DIR__ . '/../src/Permissions.php';
        return Response::json([
            'success' => true,
            'data' => [
                'role' => Permissions::getRoleInfo(),
                'permissions' => Permissions::getAllPermissions()
            ]
        ]);
    }
    if (preg_match('#^/permissions/check/(.+)$#', $path, $m) && $method === 'GET') {
        return PermissionsController::check($m[1]);
    }

    // RBAC - User Role Assignment
    if (preg_match('#^/users/(\d+)/role$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return UserController::assignRole((int)$m[1]);
    }
    
    // RBAC - Audit Log
    if ($path === '/rbac/audit-log' && $method === 'GET') return AuditController::index();
    if ($path === '/rbac/audit-log/actions' && $method === 'GET') return AuditController::getActionTypes();
    if ($path === '/rbac/audit-log/summary' && $method === 'GET') return AuditController::getSummary();

    // Sentiment Configuration & Intelligence
    if ($path === '/sentiment-config' && $method === 'GET') return SentimentConfigController::index();
    if ($path === '/sentiment-config' && ($method === 'PUT' || $method === 'POST')) return SentimentConfigController::update();
    if ($path === '/sentiment-config/keywords' && $method === 'POST') return SentimentConfigController::addKeywords();
    if ($path === '/sentiment-config/keywords' && $method === 'DELETE') return SentimentConfigController::removeKeywords();
    
    // Plural/Advanced Sentiment Configs
    if ($path === '/sentiment-configs' && $method === 'GET') return SentimentConfigController::listConfigs();
    if ($path === '/sentiment-configs' && $method === 'POST') return SentimentConfigController::createConfig();
    if (preg_match('#^/sentiment-configs/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'PUT' || $method === 'PATCH') return SentimentConfigController::updateConfig($id);
        if ($method === 'DELETE') return SentimentConfigController::deleteConfig($id); // Note: need to add deleteConfig to controller if not there
    }
    if (preg_match('#^/sentiment-configs/([^/]+)/preview$#', $path, $m) && $method === 'POST') {
        return SentimentConfigController::previewConfig($m[1]);
    }

    // Sentiment Analysis Actions
    if ($path === '/analyze/sentiment' && $method === 'POST') return SentimentAnalysisController::analyzeSentiment();
    if ($path === '/analyze/intent' && $method === 'POST') return SentimentAnalysisController::analyzeIntent();
    if ($path === '/analyze/batch' && $method === 'POST') return SentimentAnalysisController::batchAnalyze();
    if (preg_match('#^/contacts/(\d+)/sentiment-history$#', $path, $m) && $method === 'GET') {
        return SentimentAnalysisController::getSentimentHistory((int)$m[1]);
    }
    if (preg_match('#^/contacts/(\d+)/intent-history$#', $path, $m) && $method === 'GET') {
        return SentimentAnalysisController::getIntentHistory((int)$m[1]);
    }
    if (preg_match('#^/contacts/(\d+)/analysis-summary$#', $path, $m) && $method === 'GET') {
        return SentimentAnalysisController::getAnalysisSummary((int)$m[1]);
    }
    
    // System Health
    if ($path === '/system/health' && $method === 'GET') return SystemHealthController::getHealth();
    if ($path === '/system/connectivity' && $method === 'GET') return SystemHealthController::getConnectivity();
    if ($path === '/system/connectivity/check' && $method === 'POST') return SystemHealthController::checkExternalConnectivity();
    if ($path === '/system/trends' && $method === 'GET') return SystemHealthController::getTrends();
    if ($path === '/system/tools/client-errors' && $method === 'GET') return SystemHealthController::getClientErrors();
    if ($path === '/system/tools/client-errors' && $method === 'POST') return SystemHealthController::logClientError();
    if ($path === '/system/performance/live' && $method === 'GET') return SystemHealthController::getPerformanceMetrics();
    if ($path === '/system/diagnostics' && $method === 'POST') return SystemHealthController::runDiagnostics();
    if ($path === '/system/fix' && $method === 'POST') return SystemHealthController::fixIssue();
    if ($path === '/system/cache/clear' && $method === 'POST') return SystemHealthController::clearCache();
    if ($path === '/system/database/optimize' && $method === 'POST') return SystemHealthController::optimizeDatabase();
    if ($path === '/system/database/insights' && $method === 'GET') return SystemHealthController::getDatabaseInsights();
    if ($path === '/system/scheduler/status' && $method === 'GET') return SystemHealthController::getSchedulerStatus();
    
    // System Tools
    if ($path === '/system/tools/logs' && $method === 'GET') return SystemHealthController::getLogs();
    if ($path === '/system/tools/cache' && $method === 'GET') return SystemHealthController::getCacheKeys();
    if (preg_match('#^/system/tools/cache/([^/]+)$#', $path, $m) && $method === 'DELETE') {
        return SystemHealthController::deleteCacheKey($m[1]);
    }
    if ($path === '/system/tools/resources' && $method === 'GET') return SystemHealthController::getServerResources();
    if ($path === '/system/tools/test-email' && $method === 'POST') return SystemHealthController::testEmail();
    if ($path === '/system/tools/maintenance' && ($method === 'GET' || $method === 'POST')) return SystemHealthController::maintenanceMode();
    
    // Security
    if ($path === '/system/security/events' && $method === 'GET') return SystemHealthController::getSecurityEvents();
    if ($path === '/system/security/stats' && $method === 'GET') return SystemHealthController::getSecurityStats();
    
    // Comprehensive System Health - Phase 2
    if ($path === '/system/health/migrate' && $method === 'POST') return SystemHealthController::runMigration();
    if ($path === '/system/health/snapshot' && $method === 'POST') return SystemHealthController::takeSnapshot();
    if ($path === '/system/health/prune' && $method === 'POST') return SystemHealthController::pruneOldData();
    if ($path === '/system/traffic' && $method === 'GET') return SystemHealthController::getTrafficAnalytics();
    if ($path === '/system/business-health' && $method === 'GET') return SystemHealthController::getBusinessHealth();
    if ($path === '/system/database/internals' && $method === 'GET') return SystemHealthController::getDatabaseInternals();
    if ($path === '/system/alerts' && $method === 'GET') return SystemHealthController::getAlerts();
    if ($path === '/system/trends/detailed' && $method === 'GET') return SystemHealthController::getDetailedTrends();
    if (preg_match('#^/system/alerts/(\d+)$#', $path, $m) && $method === 'POST') {
        return SystemHealthController::updateAlert((int)$m[1]);
    }
    
    // Apps Manager (Odoo-style workspace modules)
    if ($path === '/apps' && $method === 'GET') return App\Controllers\AppsController::index();
    if ($path === '/apps/workspace' && $method === 'GET') return App\Controllers\AppsController::workspaceModules();
    if (preg_match('#^/apps/([^/]+)/install$#', $path, $m) && $method === 'POST') {
        return App\Controllers\AppsController::install($m[1]);
    }
    if (preg_match('#^/apps/([^/]+)/disable$#', $path, $m) && $method === 'POST') {
        return App\Controllers\AppsController::disable($m[1]);
    }
    
    // Companies (for multi-company support)
    if ($path === '/companies/allowed' && $method === 'GET') {
        return AuthController::allowedCompanies();
    }
    
    // Module Management (legacy user-level)
    if ($path === '/modules' && $method === 'GET') {
        $controller = new ModuleController();
        return $controller->index();
    }
    if ($path === '/modules' && $method === 'POST') {
        $controller = new ModuleController();
        return $controller->store();
    }
    if (preg_match('#^/modules/user/(\d+)$#', $path, $m) && $method === 'GET') {
        $controller = new ModuleController();
        return $controller->userModules((int)$m[1]);
    }
    if (preg_match('#^/modules/([^/]+)/enable$#', $path, $m) && $method === 'POST') {
        $controller = new ModuleController();
        return $controller->enable($m[1]);
    }
    if (preg_match('#^/modules/([^/]+)/disable$#', $path, $m) && $method === 'POST') {
        $controller = new ModuleController();
        return $controller->disable($m[1]);
    }
    if (preg_match('#^/modules/([^/]+)/rollout$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        $controller = new ModuleController();
        return $controller->updateRollout($m[1]);
    }
    if (preg_match('#^/modules/([^/]+)/check$#', $path, $m) && $method === 'GET') {
        $controller = new ModuleController();
        return $controller->checkAccess($m[1]);
    }
    if (preg_match('#^/modules/([^/]+)$#', $path, $m) && $method === 'GET') {
        $controller = new ModuleController();
        return $controller->show($m[1]);
    }
    
    // Lead Scoring
    if ($path === '/leads/scores' && $method === 'GET') {
        $controller = new LeadScoringController();
        return $controller->getTopLeads();
    }
    if ($path === '/lead-scoring/weights' && $method === 'GET') {
        $controller = new LeadScoringController();
        return $controller->getWeights();
    }
    if ($path === '/lead-scoring/weights' && ($method === 'PUT' || $method === 'PATCH')) {
        $controller = new LeadScoringController();
        return $controller->updateWeights();
    }
    if ($path === '/lead-scoring/recalculate-all' && $method === 'POST') {
        $controller = new LeadScoringController();
        return $controller->recalculateAll();
    }
    if (preg_match('#^/leads/(\d+)/score$#', $path, $m) && $method === 'GET') {
        $controller = new LeadScoringController();
        return $controller->getScore((int)$m[1]);
    }
    if (preg_match('#^/leads/(\d+)/calculate-score$#', $path, $m) && $method === 'POST') {
        $controller = new LeadScoringController();
        return $controller->calculateScore((int)$m[1]);
    }
    if (preg_match('#^/leads/(\d+)/score-history$#', $path, $m) && $method === 'GET') {
        $controller = new LeadScoringController();
        return $controller->getScoreHistory((int)$m[1]);
    }
    if (preg_match('#^/leads/(\d+)/score-changes$#', $path, $m) && $method === 'GET') {
        $controller = new LeadScoringController();
        return $controller->getScoreChanges((int)$m[1]);
    }
    
    // Multi-Channel Sequences
    if ($path === '/sequences' && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/SequenceController.php';
        $controller = new SequenceController();
        return $controller->index();
    }
    if ($path === '/sequences' && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/SequenceController.php';
        $controller = new SequenceController();
        return $controller->store();
    }
    if (preg_match('#^/sequences/(\d+)$#', $path, $m) && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/SequenceController.php';
        $controller = new SequenceController();
        return $controller->show((int)$m[1]);
    }
    if (preg_match('#^/sequences/(\d+)$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        require_once __DIR__ . '/../src/controllers/SequenceController.php';
        $controller = new SequenceController();
        return $controller->update((int)$m[1]);
    }
    if (preg_match('#^/sequences/(\d+)$#', $path, $m) && $method === 'DELETE') {
        require_once __DIR__ . '/../src/controllers/SequenceController.php';
        $controller = new SequenceController();
        return $controller->destroy((int)$m[1]);
    }
    if (preg_match('#^/sequences/(\d+)/execute$#', $path, $m) && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/SequenceController.php';
        $controller = new SequenceController();
        return $controller->execute((int)$m[1]);
    }
    if (preg_match('#^/sequences/(\d+)/status$#', $path, $m) && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/SequenceController.php';
        $controller = new SequenceController();
        return $controller->status((int)$m[1]);
    }
    if (preg_match('#^/sequences/(\d+)/pause$#', $path, $m) && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/SequenceController.php';
        $controller = new SequenceController();
        return $controller->pause((int)$m[1]);
    }
    if (preg_match('#^/sequences/(\d+)/resume$#', $path, $m) && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/SequenceController.php';
        $controller = new SequenceController();
        return $controller->resume((int)$m[1]);
    }

    // Automations (Legacy V1 - Triggers/Rules)
    // IMPORTANT: Frontend expects { automations: [] } for this endpoint
    if ($path === '/automations' && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/AutomationController.php';
        return (new AutomationController())->index();
    }
    if ($path === '/automations' && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/AutomationController.php';
        return (new AutomationController())->create();
    }
    if (preg_match('#^/automations/(\d+)$#', $path, $m)) {
        require_once __DIR__ . '/../src/controllers/AutomationController.php';
        $automationController = new AutomationController();
        $id = (int)$m[1];
        if ($method === 'GET') return $automationController->show($id);
        if ($method === 'PUT' || $method === 'PATCH') return $automationController->update($id);
        if ($method === 'DELETE') return $automationController->delete($id);
    }
    if (preg_match('#^/automations/(\d+)/toggle$#', $path, $m) && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/AutomationController.php';
        return (new AutomationController())->toggle((int)$m[1]);
    }

    // Automations V2 Options (Combined)
    if ($path === '/automations/options' && $method === 'GET') {
        return AutomationsV2Controller::options();
    }

    // Automation Recipes
    if ($path === '/automation-recipes' && $method === 'POST') return AutomationsV2Controller::createRecipe();
    if ($path === '/automation-recipes' && $method === 'GET') return AutomationsV2Controller::listRecipes();

    // Flows (V2 Workflows)
    if ($path === '/flows' && $method === 'GET') return AutomationsV2Controller::listFlows();
    if ($path === '/flows' && $method === 'POST') return AutomationsV2Controller::createWorkflow();
    if (preg_match('#^/flows/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return AutomationsV2Controller::getWorkflow($id);
        if ($method === 'PUT' || $method === 'PATCH') return AutomationsV2Controller::updateWorkflow($id);
        if ($method === 'DELETE') return AutomationsV2Controller::deleteWorkflow($id);
    }
    // Route /flows/:id/status to updateWorkflow since it accepts status update
    if (preg_match('#^/flows/(\d+)/status$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return AutomationsV2Controller::updateWorkflow((int)$m[1]);
    }
    
    // Meeting Scheduler
    if ($path === '/meetings' && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/MeetingController.php';
        $controller = new MeetingController();
        return $controller->index();
    }
    if ($path === '/meetings' && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/MeetingController.php';
        $controller = new MeetingController();
        return $controller->store();
    }
    if ($path === '/meetings/upcoming' && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/MeetingController.php';
        $controller = new MeetingController();
        return $controller->upcoming();
    }

    // ============================================
    // AFFILIATES ROUTES
    // ============================================
    if (str_starts_with($path, '/affiliates')) {
        require_once __DIR__ . '/../src/controllers/AffiliatesController.php';
        
        // Clicks (Public)
        if ($path === '/affiliates/record-click' && $method === 'POST') {
            return AffiliatesController::recordClick();
        }

        // Analytics
        if ($path === '/affiliates/analytics' && $method === 'GET') {
            return AffiliatesController::getAnalytics();
        }

        // Settings
        if ($path === '/affiliates/settings' && $method === 'GET') {
            return AffiliatesController::getSettings();
        }
        if ($path === '/affiliates/settings' && $method === 'POST') {
            return AffiliatesController::updateSettings();
        }

        // Export
        if ($path === '/affiliates/export-payouts' && $method === 'GET') {
            return AffiliatesController::exportPayouts();
        }

        // Referrals
        if ($path === '/affiliates/referrals' && $method === 'GET') {
            return AffiliatesController::getReferrals();
        }
        if ($path === '/affiliates/referrals' && $method === 'POST') {
            return AffiliatesController::createReferral();
        }

        // Payouts
        if ($path === '/affiliates/payouts' && $method === 'GET') {
            return AffiliatesController::getPayouts();
        }
        if ($path === '/affiliates/payouts' && $method === 'POST') {
            return AffiliatesController::createPayout();
        }

        // Affiliates CRUD
        if ($path === '/affiliates' && $method === 'GET') {
            return AffiliatesController::getAffiliates();
        }
        if ($path === '/affiliates' && $method === 'POST') {
            return AffiliatesController::createAffiliate();
        }
        if (preg_match('#^/affiliates/(\d+)$#', $path, $m)) {
            $id = (int)$m[1];
            if ($method === 'GET') return AffiliatesController::getAffiliate($id);
            if ($method === 'PUT' || $method === 'PATCH') return AffiliatesController::updateAffiliate($id);
            if ($method === 'DELETE') return AffiliatesController::deleteAffiliate($id);
        }
        
        return;
    }
    if (preg_match('#^/meetings/(\d+)$#', $path, $m) && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/MeetingController.php';
        $controller = new MeetingController();
        return $controller->show((int)$m[1]);
    }
    if (preg_match('#^/meetings/(\d+)/status$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        require_once __DIR__ . '/../src/controllers/MeetingController.php';
        $controller = new MeetingController();
        return $controller->updateStatus((int)$m[1]);
    }
    if ($path === '/calendar/connect' && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/MeetingController.php';
        $controller = new MeetingController();
        return $controller->connectCalendar();
    }
    if ($path === '/calendar/status' && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/MeetingController.php';
        $controller = new MeetingController();
        return $controller->calendarStatus();
    }
    
    // Conversation Intelligence
    if (preg_match('#^/calls/(\d+)/transcribe$#', $path, $m) && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/ConversationIntelligenceController.php';
        $controller = new ConversationIntelligenceController();
        return $controller->transcribe((int)$m[1]);
    }
    if (preg_match('#^/calls/(\d+)/analysis$#', $path, $m) && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/ConversationIntelligenceController.php';
        $controller = new ConversationIntelligenceController();
        return $controller->getAnalysis((int)$m[1]);
    }
    if (preg_match('#^/calls/(\d+)/signals$#', $path, $m) && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/ConversationIntelligenceController.php';
        $controller = new ConversationIntelligenceController();
        return $controller->getSignals((int)$m[1]);
    }
    if (preg_match('#^/calls/(\d+)/analyze$#', $path, $m) && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/ConversationIntelligenceController.php';
        $controller = new ConversationIntelligenceController();
        return $controller->analyze((int)$m[1]);
    }
    if (preg_match('#^/transcriptions/(\d+)$#', $path, $m) && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/ConversationIntelligenceController.php';
        $controller = new ConversationIntelligenceController();
        return $controller->getTranscription((int)$m[1]);
    }
    
    // Intent Data
    if ($path === '/intent/ingest' && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/IntentDataController.php';
        $controller = new IntentDataController();
        return $controller->ingest();
    }
    if ($path === '/intent/mark-stale' && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/IntentDataController.php';
        $controller = new IntentDataController();
        return $controller->markStale();
    }
    if ($path === '/intent/high' && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/IntentDataController.php';
        $controller = new IntentDataController();
        return $controller->getHighIntent();
    }
    if ($path === '/intent/signals' && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/IntentDataController.php';
        $controller = new IntentDataController();
        return $controller->getSignals();
    }
    if (preg_match('#^/intent/signals/(\d+)$#', $path, $m) && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/IntentDataController.php';
        $controller = new IntentDataController();
        return $controller->getSignal((int)$m[1]);
    }
    if (preg_match('#^/intent/topics/(.+)$#', $path, $m) && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/IntentDataController.php';
        $controller = new IntentDataController();
        return $controller->getByTopic($m[1]);
    }
    if (preg_match('#^/contacts/(\d+)/intent$#', $path, $m) && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/IntentDataController.php';
        $controller = new IntentDataController();
        return $controller->getContactIntent((int)$m[1]);
    }
    
    // Users list (for admin)
    if ($path === '/users' && $method === 'GET') return UserController::getAllUsers();
    if ($path === '/users' && $method === 'POST') return UserController::createUser();
    
    // User invitation
    if (preg_match('#^/users/(\d+)/invite$#', $path, $m) && $method === 'POST') {
        return UserController::sendInvitation((int)$m[1]);
    }
    
    // User CRUD operations
    if (preg_match('#^/users/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT' || $method === 'PATCH') return UserController::updateUser($id);
        if ($method === 'DELETE') return UserController::deleteUser($id);
    }

    // Campaigns
    if ($path === '/campaigns' && $method === 'GET') return CampaignsController::index();
    if ($path === '/campaigns' && $method === 'POST') return CampaignsController::create();

    // Campaign list for campaign selector (grouped by channel)
    // Must be before the generic /campaigns/{id} route.
    if ($path === '/campaigns/list' && $method === 'GET') {
        $controller = new CombinedAnalyticsController();
        return $controller->getCampaignsList();
    }

    if (preg_match('#^/campaigns/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return CampaignsController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return CampaignsController::update($id);
        if ($method === 'DELETE') return CampaignsController::delete($id);
    }
    if (preg_match('#^/campaigns/([^/]+)/simulate-send$#', $path, $m) && $method === 'POST') {
        return CampaignsController::simulateSend($m[1]);
    }
    if (preg_match('#^/campaigns/([^/]+)/send$#', $path, $m) && $method === 'POST') {
        return CampaignsController::send($m[1]);
    }

    // ============================================
    // PROJECTS & TASKS Routes
    // ============================================

    // Projects
    if ($path === '/projects' && $method === 'GET') return ProjectsController::index();
    if ($path === '/projects' && $method === 'POST') return ProjectsController::create();
    if ($path === '/projects/analytics' && $method === 'GET') return ProjectsController::getAnalytics();
    if (preg_match('#^/projects/(\d+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return ProjectsController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return ProjectsController::update($id);
        if ($method === 'DELETE') return ProjectsController::delete($id);
    }
    if (preg_match('#^/projects/(\d+)/tasks$#', $path, $m) && $method === 'GET') {
        return ProjectsController::getTasks($m[1]);
    }
    if (preg_match('#^/projects/(\d+)/activity$#', $path, $m) && $method === 'GET') {
        return ProjectsController::getActivity($m[1]);
    }
    if (preg_match('#^/projects/(\d+)/members$#', $path, $m) && $method === 'POST') {
        return ProjectsController::addMember($m[1]);
    }
    if (preg_match('#^/projects/(\d+)/members/(\d+)$#', $path, $m) && $method === 'DELETE') {
        return ProjectsController::removeMember($m[1], $m[2]);
    }

    // Tasks
    if ($path === '/tasks' && $method === 'GET') return TasksController::index();
    if ($path === '/tasks' && $method === 'POST') return TasksController::create();
    if ($path === '/tasks/today' && $method === 'GET') return TasksController::getToday();
    if ($path === '/tasks/daily-goals' && $method === 'GET') return TasksController::getDailyGoals();
    if ($path === '/tasks/daily-goals' && ($method === 'POST' || $method === 'PUT')) return TasksController::updateDailyGoals();
    if ($path === '/tasks/types' && $method === 'GET') return TasksController::getTypes();
    if ($path === '/tasks/bulk-update' && $method === 'POST') return TasksController::bulkUpdate();
    if (preg_match('#^/tasks/(\d+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return TasksController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return TasksController::update($id);
        if ($method === 'DELETE') return TasksController::delete($id);
    }
    if (preg_match('#^/tasks/(\d+)/complete$#', $path, $m) && $method === 'POST') {
        return TasksController::complete($m[1]);
    }
    if (preg_match('#^/tasks/(\d+)/activity$#', $path, $m) && $method === 'GET') {
        return TasksController::getActivity($m[1]);
    }

    // Folders
    if ($path === '/folders' && $method === 'GET') return FoldersController::index();
    if ($path === '/folders' && $method === 'POST') return FoldersController::create();
    if ($path === '/folders/move-campaign' && $method === 'POST') return FoldersController::moveCampaign();
    if ($path === '/folders/move-form' && $method === 'POST') return FoldersController::moveForm();
    if (preg_match('#^/folders/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT' || $method === 'PATCH') return FoldersController::update($id);
        if ($method === 'DELETE') return FoldersController::delete($id);
    }



    // ============================================
    // CRM - CONTACTS
    // ============================================
    if ($path === '/contacts' && $method === 'GET') return ContactsController::index();
    if ($path === '/contacts' && $method === 'POST') return ContactsController::create();
    if ($path === '/contacts/import' && $method === 'POST') return ContactsController::import();
    if ($path === '/contacts/upload' && $method === 'POST') return ContactsController::upload();
    if ($path === '/contacts/bulk-action' && $method === 'POST') return ContactsController::bulkAction();
    if ($path === '/contacts/tags' && $method === 'GET') return ContactsController::getTags();
    if ($path === '/contacts/duplicates' && $method === 'GET') return ContactsController::findDuplicates();
    if ($path === '/contacts/duplicates/remove' && $method === 'POST') return ContactsController::removeDuplicates();
    if ($path === '/contacts/duplicates/merge' && $method === 'POST') return ContactsController::mergeDuplicates();
    
    if (preg_match('#^/contacts/(\d+)$#', $path, $m)) {
         $id = $m[1];
         if ($method === 'GET') return ContactsController::show($id);
         if ($method === 'PUT' || $method === 'PATCH') return ContactsController::update($id);
         if ($method === 'DELETE') return ContactsController::delete($id);
    }

    // ============================================
    // CRM - TAGS
    // ============================================
    if ($path === '/tags' && $method === 'GET') return TagsController::index();
    if ($path === '/tags' && $method === 'POST') return TagsController::create();
    if ($path === '/tags/assign' && $method === 'POST') return TagsController::addToRecipient();
    if ($path === '/tags/remove' && $method === 'POST') return TagsController::removeFromRecipient();
    if ($path === '/tags/bulk-assign' && $method === 'POST') return TagsController::bulkAddToRecipients();

    if (preg_match('#^/tags/(\d+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'PUT' || $method === 'PATCH') return TagsController::update($id);
        if ($method === 'DELETE') return TagsController::delete($id);
    }
    
    // ============================================
    // CRM - DASHBOARD & LEADS
    // ============================================
    if ($path === '/crm/dashboard' && $method === 'GET') return CRMController::getDashboard();
    if ($path === '/crm/leads' && $method === 'GET') return CRMController::getLeads();
    if ($path === '/crm/leads' && $method === 'POST') return CRMController::createLead();
    
    if (preg_match('#^/crm/leads/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT' || $method === 'PATCH') return CRMController::updateLead($id);
    }
    
    if (preg_match('#^/crm/leads/(\d+)/activities$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return CRMController::getLeadActivities($id);
        if ($method === 'POST') return CRMController::addLeadActivity($id);
    }
    
    if ($path === '/crm/tasks' && $method === 'GET') return CRMController::getTasks();
    if ($path === '/crm/tasks' && $method === 'POST') return CRMController::createTask();
    
    if (preg_match('#^/crm/tasks/(\d+)/status$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return CRMController::updateTaskStatus((int)$m[1]);
    }
    
    if ($path === '/crm/activities' && $method === 'GET') return CRMController::getAllActivities();
    if ($path === '/crm/analytics' && $method === 'GET') return CRMController::getAnalytics();
    if ($path === '/crm/goals' && $method === 'GET') return CRMController::getDailyGoals();
    if ($path === '/crm/goals' && ($method === 'POST' || $method === 'PUT')) return CRMController::updateDailyGoals();
    if ($path === '/crm/forecast' && $method === 'GET') return CRMController::getForecast();
    if ($path === '/crm/playbooks' && $method === 'GET') return CRMController::getPlaybooks();
    if ($path === '/crm/playbooks' && $method === 'POST') return CRMController::createPlaybook();
    if ($path === '/crm/settings' && $method === 'GET') return CRMController::getSettings();
    if ($path === '/crm/settings' && ($method === 'POST' || $method === 'PUT')) return CRMController::updateSettings();
    if ($path === '/crm/products' && $method === 'GET') return CRMController::getProducts();

    // ==================== ANALYTICS ====================
    // SMS Analytics
    if ($path === '/analytics/sms/dashboard' && $method === 'GET') {
        $controller = new SMSAnalyticsController();
        return $controller->getDashboard();
    }
    if (preg_match('#^/analytics/sms/campaigns/(\d+)$#', $path, $m) && $method === 'GET') {
        $controller = new SMSAnalyticsController();
        return $controller->getCampaignAnalytics((int)$m[1]);
    }
    if (preg_match('#^/analytics/sms/sequences/(\d+)$#', $path, $m) && $method === 'GET') {
        $controller = new SMSAnalyticsController();
        return $controller->getSequenceAnalytics((int)$m[1]);
    }
    
    // Call Analytics
    // Note: CallAnalyticsController methods are static
    if ($path === '/analytics/calls' && $method === 'GET') {
        return CallAnalyticsController::getAnalytics();
    }
    
    // Combined Analytics
    if ($path === '/analytics/combined' && $method === 'GET') {
        $controller = new CombinedAnalyticsController();
        return $controller->getCombinedAnalytics();
    }

    // ==================== MEDIA LIBRARY ====================
    if ($path === '/storage/quota' && $method === 'GET') return FilesController::getStorageQuota();
    if ($path === '/files' && $method === 'GET') return FilesController::index();
    if ($path === '/files' && $method === 'POST') return FilesController::upload();
    if ($path === '/files/upload' && $method === 'POST') return FilesController::upload();
    if ($path === '/files/folders' && $method === 'GET') return FilesController::folders();
    if ($path === '/files/folders' && $method === 'POST') return FilesController::createFolder();
    if ($path === '/files/move' && $method === 'POST') return FilesController::move();
    if ($path === '/files/bulk-delete' && $method === 'POST') return FilesController::bulkDelete();

    // /media Alises for frontend compatibility
    if ($path === '/media/files' && $method === 'GET') return FilesController::index();
    if ($path === '/media/folders' && $method === 'GET') return FilesController::folders();
    if ($path === '/media/folders' && $method === 'POST') return FilesController::createFolder();
    if ($path === '/media/upload' && $method === 'POST') return FilesController::upload();
    if ($path === '/media/move' && $method === 'POST') return FilesController::move();
    if ($path === '/media/delete' && $method === 'DELETE') {
        // Handle both 'ids' and 'file_ids' from frontend
        $data = get_json_body();
        if (isset($data['ids']) && !isset($data['file_ids'])) {
            $_POST['file_ids'] = $data['ids'];
        }
        return FilesController::bulkDelete();
    }

    // File-specific operations
    if (preg_match('#^/files/(\d+)/star$#', $path, $m) && $method === 'POST') {
        return FilesController::toggleStar((int)$m[1]);
    }
    if (preg_match('#^/files/(\d+)/activity$#', $path, $m) && $method === 'GET') {
        return FilesController::getActivity((int)$m[1]);
    }
    if (preg_match('#^/files/(\d+)/attach$#', $path, $m) && $method === 'POST') {
        return FilesController::attach((int)$m[1]);
    }

    // Single file operations
    if (preg_match('#^/files/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return FilesController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return FilesController::update($id);
        if ($method === 'DELETE') return FilesController::delete($id);
    }

    // Folder operations
    if (preg_match('#^/files/folders/(\d+)/rename$#', $path, $m) && $method === 'POST') {
        return FilesController::renameFolder((int)$m[1]);
    }
    if (preg_match('#^/files/folders/(\d+)$#', $path, $m) && $method === 'DELETE') {
        return FilesController::deleteFolder((int)$m[1]);
    }

    // Entity file attachments
    if (preg_match('#^/files/entity/([^/]+)/(\d+)$#', $path, $m) && $method === 'GET') {
        return FilesController::forEntity($m[1], (int)$m[2]);
    }

    // Hybrid Campaigns (separate from email/sms/call campaigns)
    if ($path === '/hybrid-campaigns' && $method === 'GET') return HybridCampaignsController::index();
    if ($path === '/hybrid-campaigns' && $method === 'POST') return HybridCampaignsController::create();
    if (preg_match('#^/hybrid-campaigns/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return HybridCampaignsController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return HybridCampaignsController::update($id);
        if ($method === 'DELETE') return HybridCampaignsController::delete($id);
    }
    if (preg_match('#^/hybrid-campaigns/([^/]+)/steps$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return HybridCampaignsController::getSteps($id);
        if ($method === 'POST' || $method === 'PUT') return HybridCampaignsController::saveSteps($id);
    }
    if (preg_match('#^/hybrid-campaigns/([^/]+)/contacts$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return HybridCampaignsController::getContacts($id);
        if ($method === 'POST') return HybridCampaignsController::addContacts($id);
    }
    if (preg_match('#^/hybrid-campaigns/([^/]+)/start$#', $path, $m) && $method === 'POST') {
        return HybridCampaignsController::start($m[1]);
    }
    if ($path === '/hybrid-campaigns/process-pending' && $method === 'POST') {
        return HybridCampaignsController::processPending();
    }

    // Recipients
    if ($path === '/recipients' && $method === 'GET') return RecipientsController::index();
    if ($path === '/recipients/unsubscribed' && $method === 'GET') return RecipientsController::unsubscribed();
    if ($path === '/recipients/bulk-unsubscribe' && $method === 'POST') return RecipientsController::bulkUnsubscribe();
    if ($path === '/recipients' && $method === 'POST') return RecipientsController::bulkCreate();
    if (preg_match('#^/recipients/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'PUT' || $method === 'PATCH') return RecipientsController::update($id);
        if ($method === 'DELETE') return RecipientsController::delete($id);
    }

    // Softphone speed dial (must appear before generic /contacts/:id routes)
    if ($path === '/contacts/speed-dial' && $method === 'GET') return SoftphoneController::getSpeedDials();
    if ($path === '/contacts/speed-dial' && $method === 'POST') return SoftphoneController::createSpeedDial();
    if (preg_match('#^/contacts/speed-dial/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'PUT' || $method === 'PATCH') return SoftphoneController::updateSpeedDial($id);
        if ($method === 'DELETE') return SoftphoneController::deleteSpeedDial($id);
    }

    // Unified Contacts API
    if ($path === '/contacts' && $method === 'GET') return ContactsController::index();
    if ($path === '/contacts' && $method === 'POST') return ContactsController::create();
    if ($path === '/contacts/import' && $method === 'POST') return ContactsController::import();
    if ($path === '/contacts/upload' && $method === 'POST') return ContactsController::upload();
    if ($path === '/contacts/bulk-action' && $method === 'POST') return ContactsController::bulkAction();
    if ($path === '/contacts/tags' && $method === 'GET') return ContactsController::getTags();
    // Duplicate detection and management
    if ($path === '/contacts/duplicates' && $method === 'GET') return ContactsController::findDuplicates();
    if ($path === '/contacts/duplicates/remove' && $method === 'POST') return ContactsController::removeDuplicates();
    if ($path === '/contacts/duplicates/merge' && $method === 'POST') return ContactsController::mergeDuplicates();
    if (preg_match('#^/contacts/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return ContactsController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return ContactsController::update($id);
        if ($method === 'DELETE') return ContactsController::delete($id);
    }

    // Companies API
    if ($path === '/companies/allowed' && $method === 'GET') return CompaniesController::allowedCompanies();
    if ($path === '/companies' && $method === 'GET') return CompaniesController::index();
    if ($path === '/companies' && $method === 'POST') return CompaniesController::create();
    
    // Workspace/Agency API
    if ($path === '/workspace/info' && $method === 'GET') return CompaniesController::workspaceInfo();
    if ($path === '/workspace' && $method === 'PUT') return CompaniesController::updateWorkspace();
    
    // Client Management API (Agency features)
    if ($path === '/clients' && $method === 'GET') return CompaniesController::listClients();
    if ($path === '/clients' && $method === 'POST') return CompaniesController::createClient();
    if (preg_match('#^/clients/([^/]+)/archive$#', $path, $m) && $method === 'POST') {
        return CompaniesController::archiveClient($m[1]);
    }
    if (preg_match('#^/clients/([^/]+)/restore$#', $path, $m) && $method === 'POST') {
        return CompaniesController::restoreClient($m[1]);
    }
    if (preg_match('#^/clients/([^/]+)/team$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return CompaniesController::getClientTeam($id);
        if ($method === 'POST') return CompaniesController::grantClientAccess($id);
        if ($method === 'DELETE') return CompaniesController::revokeClientAccess($id);
    }
    if (preg_match('#^/companies/([^/]+)/contacts$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return CompaniesController::getContacts($id);
        if ($method === 'POST') return CompaniesController::addContact($id);
        if ($method === 'DELETE') return CompaniesController::removeContact($id);
    }
    if (preg_match('#^/companies/([^/]+)/notes$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return CompaniesController::getNotes($id);
        if ($method === 'POST') return CompaniesController::addNote($id);
    }
    if (preg_match('#^/companies/([^/]+)/activities$#', $path, $m) && $method === 'GET') {
        return CompaniesController::getActivities($m[1]);
    }
    if (preg_match('#^/companies/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return CompaniesController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return CompaniesController::update($id);
        if ($method === 'DELETE') return CompaniesController::delete($id);
    }
    
    // Client Properties API
    if (preg_match('#^/clients/([^/]+)/properties$#', $path, $m)) {
        $companyId = $m[1];
        if ($method === 'GET') return ClientPropertiesController::index($companyId);
        if ($method === 'POST') return ClientPropertiesController::create($companyId);
    }
    if (preg_match('#^/clients/([^/]+)/properties/([^/]+)$#', $path, $m)) {
        $companyId = $m[1];
        $propertyId = $m[2];
        if ($method === 'PUT' || $method === 'PATCH') return ClientPropertiesController::update($companyId, $propertyId);
        if ($method === 'DELETE') return ClientPropertiesController::delete($companyId, $propertyId);
    }
    
    // Client Actions API
    if (preg_match('#^/clients/([^/]+)/overview$#', $path, $m) && $method === 'GET') {
        return ClientActionsController::getOverview($m[1]);
    }
    if (preg_match('#^/clients/([^/]+)/vcard$#', $path, $m) && $method === 'GET') {
        return ClientActionsController::downloadVCard($m[1]);
    }
    if (preg_match('#^/clients/([^/]+)/send-login$#', $path, $m) && $method === 'POST') {
        return ClientActionsController::sendLoginEmail($m[1]);
    }
    if (preg_match('#^/clients/([^/]+)/login-as$#', $path, $m) && $method === 'POST') {
        return ClientActionsController::loginAsClient($m[1]);
    }

    // Lists API (Contact Lists)
    if ($path === '/lists' && $method === 'GET') return ListsController::index();
    if ($path === '/lists' && $method === 'POST') return ListsController::create();
    if ($path === '/lists/bulk-add' && $method === 'POST') return ListsController::bulkAddToList();
    if (preg_match('#^/lists/([^/]+)/contacts$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return ListsController::getContacts($id);
        if ($method === 'POST') return ListsController::addContacts($id);
        if ($method === 'DELETE') return ListsController::removeContacts($id);
    }
    if (preg_match('#^/lists/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return ListsController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return ListsController::update($id);
        if ($method === 'DELETE') return ListsController::delete($id);
    }

    // Segments API (Dynamic Contact Groups)
    if ($path === '/segments' && $method === 'GET') return SegmentsController::index();
    if ($path === '/segments' && $method === 'POST') return SegmentsController::create();
    if ($path === '/segments/preview' && $method === 'POST') return SegmentsController::preview();
    if (preg_match('#^/segments/([^/]+)/contacts$#', $path, $m) && $method === 'GET') {
        return SegmentsController::getContacts($m[1]);
    }
    if (preg_match('#^/segments/([^/]+)/recalculate$#', $path, $m) && $method === 'POST') {
        return SegmentsController::recalculate($m[1]);
    }
    if (preg_match('#^/segments/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return SegmentsController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return SegmentsController::update($id);
        if ($method === 'DELETE') return SegmentsController::delete($id);
    }

    // ==================== OUTREACH: LANDING PAGES ====================
    if ($path === '/landing-pages' && $method === 'GET') {
         require_once __DIR__ . '/../src/controllers/LandingPageController.php';
         $controller = new LandingPageController();
         return Response::json($controller->getLandingPages(Auth::user()['id']));
    }
    if ($path === '/landing-pages' && $method === 'POST') {
         require_once __DIR__ . '/../src/controllers/LandingPageController.php';
         $controller = new LandingPageController();
         $data = json_decode(file_get_contents('php://input'), true);
         return Response::json($controller->createLandingPage(Auth::user()['id'], $data));
    }
    if (preg_match('#^/landing-pages/(\d+)$#', $path, $m)) {
         require_once __DIR__ . '/../src/controllers/LandingPageController.php';
         $controller = new LandingPageController();
         $id = (int)$m[1];
         if ($method === 'GET') return Response::json($controller->getLandingPage(Auth::user()['id'], $id));
         if ($method === 'PUT' || $method === 'PATCH') {
            $data = json_decode(file_get_contents('php://input'), true);
            return Response::json($controller->updateLandingPage(Auth::user()['id'], $id, $data));
         }
         if ($method === 'DELETE') return Response::json($controller->deleteLandingPage(Auth::user()['id'], $id));
    }

    // ==================== OUTREACH: PROPOSALS ====================
    if ($path === '/proposals' && $method === 'GET') return ProposalsController::getAll();
    if ($path === '/proposals' && $method === 'POST') return ProposalsController::create();
    if ($path === '/proposals/stats' && $method === 'GET') return ProposalsController::getStats();
    
    // Public proposal routes (no auth)
    if (preg_match('#^/proposals/public/([^/]+)$#', $path, $m) && $method === 'GET') {
        return ProposalsController::getPublic($m[1]);
    }
    if (preg_match('#^/proposals/public/([^/]+)/accept$#', $path, $m) && $method === 'POST') {
        return ProposalsController::acceptPublic($m[1]);
    }
    if (preg_match('#^/proposals/public/([^/]+)/decline$#', $path, $m) && $method === 'POST') {
        return ProposalsController::declinePublic($m[1]);
    }
    
    if (preg_match('#^/proposals/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return ProposalsController::getOne($id);
        if ($method === 'PUT' || $method === 'PATCH') return ProposalsController::update($id);
        if ($method === 'DELETE') return ProposalsController::delete($id);
    }
    if (preg_match('#^/proposals/(\d+)/duplicate$#', $path, $m) && $method === 'POST') {
        return ProposalsController::duplicate((int)$m[1]);
    }
    if (preg_match('#^/proposals/(\d+)/send$#', $path, $m) && $method === 'POST') {
        return ProposalsController::send((int)$m[1]);
    }
    if (preg_match('#^/proposals/(\d+)/comments$#', $path, $m) && $method === 'POST') {
        return ProposalsController::addComment((int)$m[1]);
    }
    
    // Proposal Templates
    if ($path === '/proposal-templates' && $method === 'GET') return ProposalTemplatesController::getAll();
    if ($path === '/proposal-templates' && $method === 'POST') return ProposalTemplatesController::create();
    if ($path === '/proposal-templates/categories' && $method === 'GET') return ProposalTemplatesController::getCategories();
    
    if (preg_match('#^/proposal-templates/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return ProposalTemplatesController::getOne($id);
        if ($method === 'PUT' || $method === 'PATCH') return ProposalTemplatesController::update($id);
        if ($method === 'DELETE') return ProposalTemplatesController::delete($id);
    }
    if (preg_match('#^/proposal-templates/(\d+)/duplicate$#', $path, $m) && $method === 'POST') {
        return ProposalTemplatesController::duplicate((int)$m[1]);
    }
    
    // Proposal Settings
    if ($path === '/proposal-settings' && $method === 'GET') return ProposalSettingsController::get();
    if ($path === '/proposal-settings' && ($method === 'PUT' || $method === 'PATCH')) return ProposalSettingsController::update();

    // ==================== CRM MODULE ====================
    
    // CRM Dashboard
    if ($path === '/crm/dashboard' && $method === 'GET') return CRMController::getDashboard();
    
    // CRM Leads
    if ($path === '/crm/leads' && $method === 'GET') return CRMController::getLeads();
    if ($path === '/crm/leads' && $method === 'POST') return CRMController::createLead();
    if (preg_match('#^/crm/leads/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT' || $method === 'PATCH') return CRMController::updateLead($id);
    }
    if (preg_match('#^/crm/leads/(\d+)/activities$#', $path, $m) && $method === 'GET') {
        return CRMController::getLeadActivities((int)$m[1]);
    }
    if (preg_match('#^/crm/leads/(\d+)/activities$#', $path, $m) && $method === 'POST') {
        return CRMController::addLeadActivity((int)$m[1]);
    }
    
    // CRM Tasks
    if ($path === '/crm/tasks' && $method === 'GET') return CRMController::getTasks();
    if ($path === '/crm/tasks' && $method === 'POST') return CRMController::createTask();
    if (preg_match('#^/crm/tasks/(\d+)/status$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return CRMController::updateTaskStatus((int)$m[1]);
    }
    
    // CRM Activities
    if ($path === '/crm/activities' && $method === 'GET') return CRMController::getAllActivities();
    
    // CRM Analytics
    if ($path === '/crm/analytics' && $method === 'GET') return CRMController::getAnalytics();
    
    // CRM Goals
    if ($path === '/crm/goals/daily' && $method === 'GET') return CRMController::getDailyGoals();
    if ($path === '/crm/goals/daily' && ($method === 'PUT' || $method === 'PATCH')) {
        return CRMController::updateDailyGoals();
    }
    
    // CRM Forecasting
    if ($path === '/crm/forecast' && $method === 'GET') return CRMController::getForecast();
    
    // CRM Playbooks
    if ($path === '/crm/playbooks' && $method === 'GET') return CRMController::getPlaybooks();
    if ($path === '/crm/playbooks' && $method === 'POST') return CRMController::createPlaybook();
    
    // CRM Settings
    if ($path === '/crm/settings' && $method === 'GET') return CRMController::getSettings();
    if ($path === '/crm/settings' && ($method === 'PUT' || $method === 'PATCH')) {
        return CRMController::updateSettings();
    }
    
    // CRM Products
    if ($path === '/crm/products' && $method === 'GET') return CRMController::getProducts();

    if ($path === '/ai/generate' && $method === 'POST') return AiController::generate();

    // AI Agents CRUD
    if ($path === '/ai/agents' && $method === 'GET') return AiAgentsController::listAgents();
    if ($path === '/ai/agents' && $method === 'POST') return AiAgentsController::createAgent();
    if ($path === '/ai/agents/simulate' && $method === 'POST') return AiAgentsController::simulateChat();
    if (preg_match('#^/ai/agents/([^/]+)$#', $path, $m) && in_array($method, ['GET', 'PUT', 'PATCH', 'DELETE'])) {
        $id = $m[1];
        if ($method === 'GET') return AiAgentsController::getAgent($id);
        if ($method === 'PUT' || $method === 'PATCH') return AiAgentsController::updateAgent($id);
        if ($method === 'DELETE') return AiAgentsController::deleteAgent($id);
    }

    // AI Knowledge Bases CRUD
    if ($path === '/ai/knowledge-bases' && $method === 'GET') return AIKnowledgeBaseController::index();
    if ($path === '/ai/knowledge-bases' && $method === 'POST') return AIKnowledgeBaseController::create();
    if (preg_match('#^/ai/knowledge-bases/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return AIKnowledgeBaseController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return AIKnowledgeBaseController::update($id);
        if ($method === 'DELETE') return AIKnowledgeBaseController::delete($id);
    }
    // AI Knowledge Base Sources
    if (preg_match('#^/ai/knowledge-bases/(\d+)/sources$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return AIKnowledgeBaseController::getSources($id);
        if ($method === 'POST') return AIKnowledgeBaseController::addSource($id);
    }
    if (preg_match('#^/ai/knowledge-bases/(\d+)/sources/(\d+)$#', $path, $m) && $method === 'DELETE') {
        return AIKnowledgeBaseController::deleteSource((int)$m[1], (int)$m[2]);
    }

    // AI Agent Templates (Read-only marketplace)
    if ($path === '/ai/templates' && $method === 'GET') return AIKnowledgeBaseController::listTemplates();
    if (preg_match('#^/ai/templates/(\d+)$#', $path, $m) && $method === 'GET') {
        return AIKnowledgeBaseController::getTemplate((int)$m[1]);
    }
    if (preg_match('#^/ai/templates/(\d+)/use$#', $path, $m) && $method === 'POST') {
        return AIKnowledgeBaseController::useTemplate((int)$m[1]);
    }

    // ==================== AI WORKFORCE ====================
    require_once __DIR__ . '/../src/controllers/AIWorkforceController.php';
    
    // AI Employees
    if ($path === '/ai/workforce/employees' && $method === 'GET') return Xordon\Controllers\AIWorkforceController::listEmployees();
    if ($path === '/ai/workforce/employees' && $method === 'POST') return Xordon\Controllers\AIWorkforceController::createEmployee();
    if (preg_match('#^/ai/workforce/employees/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return Xordon\Controllers\AIWorkforceController::getEmployee($id);
        if ($method === 'PUT' || $method === 'PATCH') return Xordon\Controllers\AIWorkforceController::updateEmployee($id);
        if ($method === 'DELETE') return Xordon\Controllers\AIWorkforceController::deleteEmployee($id);
    }
    
    // Work History
    if ($path === '/ai/workforce/work-history' && $method === 'GET') return Xordon\Controllers\AIWorkforceController::getWorkHistory();
    if ($path === '/ai/workforce/work-history' && $method === 'POST') return Xordon\Controllers\AIWorkforceController::logWorkAction();
    
    // Approvals
    if ($path === '/ai/workforce/approvals' && $method === 'GET') return Xordon\Controllers\AIWorkforceController::getApprovals();
    if (preg_match('#^/ai/workforce/approvals/(\d+)/decide$#', $path, $m) && $method === 'POST') {
        return Xordon\Controllers\AIWorkforceController::decideApproval((int)$m[1]);
    }
    
    // Metrics & Hierarchy
    if ($path === '/ai/workforce/metrics' && $method === 'GET') return Xordon\Controllers\AIWorkforceController::getMetrics();
    if ($path === '/ai/workforce/hierarchy' && $method === 'GET') return Xordon\Controllers\AIWorkforceController::getHierarchy();

    // AI Workflows
    if ($path === '/ai/workforce/workflows' && $method === 'GET') return Xordon\Controllers\AIWorkforceController::listWorkflows();
    if ($path === '/ai/workforce/workflows' && $method === 'POST') return Xordon\Controllers\AIWorkforceController::createWorkflow();
    if (preg_match('#^/ai/workforce/workflows/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'DELETE') return Xordon\Controllers\AIWorkforceController::deleteWorkflow($id);
    }
    if (preg_match('#^/ai/workforce/workflows/(\d+)/execute$#', $path, $m) && $method === 'POST') {
        return Xordon\Controllers\AIWorkforceController::executeWorkflow((int)$m[1]);
    }

    // ==================== GHL-STYLE CONVERSATIONS (Unified Inbox) ====================
    if ($path === '/conversations' && $method === 'GET') return ConversationsController::index();
    if ($path === '/conversations' && $method === 'POST') return ConversationsController::create();
    if ($path === '/conversations/stats' && $method === 'GET') return ConversationsController::stats();
    if ($path === '/conversations/for-contact' && $method === 'POST') return ConversationsController::getOrCreateForContact();
    if ($path === '/conversations/inbound' && $method === 'POST') return ConversationsController::receiveInbound();
    if (preg_match('#^/conversations/(\d+)/messages$#', $path, $m) && $method === 'POST') {
        return ConversationsController::sendMessage((int)$m[1]);
    }
    if (preg_match('#^/conversations/(\d+)/notes$#', $path, $m) && $method === 'POST') {
        return ConversationsController::addNote((int)$m[1]);
    }
    if (preg_match('#^/conversations/(\d+)/assign$#', $path, $m) && $method === 'POST') {
        return ConversationsController::assign((int)$m[1]);
    }
    if (preg_match('#^/conversations/(\d+)/status$#', $path, $m) && $method === 'POST') {
        return ConversationsController::updateStatus((int)$m[1]);
    }
    if (preg_match('#^/conversations/(\d+)$#', $path, $m) && $method === 'GET') {
        return ConversationsController::show((int)$m[1]);
    }

    // ==================== GHL-STYLE OPPORTUNITIES (Pipeline) ====================
    if ($path === '/pipelines' && $method === 'GET') return OpportunitiesController::getPipelines();
    if ($path === '/pipelines' && $method === 'POST') return OpportunitiesController::createPipeline();
    if (preg_match('#^/pipelines/(\d+)/stages$#', $path, $m)) {
        $pipelineId = (int)$m[1];
        if ($method === 'GET') return OpportunitiesController::getStages($pipelineId);
        if ($method === 'POST') return OpportunitiesController::createStage($pipelineId);
    }
    if (preg_match('#^/pipelines/(\d+)/stages/reorder$#', $path, $m) && $method === 'POST') {
        return OpportunitiesController::reorderStages((int)$m[1]);
    }
    if (preg_match('#^/pipelines/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return OpportunitiesController::getPipeline($id);
        if ($method === 'PUT' || $method === 'PATCH') return OpportunitiesController::updatePipeline($id);
        if ($method === 'DELETE') return OpportunitiesController::deletePipeline($id);
    }
    if (preg_match('#^/pipeline-stages/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT' || $method === 'PATCH') return OpportunitiesController::updateStage($id);
        if ($method === 'DELETE') return OpportunitiesController::deleteStage($id);
    }
    
    if ($path === '/opportunities' && $method === 'GET') return OpportunitiesController::index();
    if ($path === '/opportunities' && $method === 'POST') return OpportunitiesController::create();
    if ($path === '/opportunities/stats' && $method === 'GET') return OpportunitiesController::stats();
    if (preg_match('#^/opportunities/(\d+)/move$#', $path, $m) && $method === 'POST') {
        return OpportunitiesController::moveStage((int)$m[1]);
    }
    if (preg_match('#^/opportunities/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return OpportunitiesController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return OpportunitiesController::update($id);
        if ($method === 'DELETE') return OpportunitiesController::delete($id);
    }

    // ==================== BUSINESS EVENTS ====================
    if ($path === '/events' && $method === 'GET') return OpportunitiesController::getEvents();

    // ==================== AUTOMATIONS (V1 & Unified) ====================
    require_once __DIR__ . '/../src/controllers/FollowUpAutomationsController.php';
    require_once __DIR__ . '/../src/controllers/AutomationRecipesController.php';
    require_once __DIR__ . '/../src/controllers/WorkflowsController.php';

    // Follow-up Automations (Triggers)
    if ($path === '/automations' && $method === 'GET') return FollowUpAutomationsController::index();
    if ($path === '/automations' && $method === 'POST') return FollowUpAutomationsController::create();
    if ($path === '/automations/options' && $method === 'GET') return FollowUpAutomationsController::options();
    if (preg_match('#^/automations/(\d+)/toggle$#', $path, $m) && $method === 'POST') {
        return FollowUpAutomationsController::toggle((int)$m[1]);
    }
    if (preg_match('#^/automations/(\d+)/executions$#', $path, $m) && $method === 'GET') {
        return FollowUpAutomationsController::executions((int)$m[1]);
    }
    if (preg_match('#^/automations/(\d+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return FollowUpAutomationsController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return FollowUpAutomationsController::update($id);
        if ($method === 'DELETE') return FollowUpAutomationsController::delete($id);
    }

    // Automation Recipes
    if ($path === '/automation-recipes' && $method === 'GET') return AutomationRecipesController::index();
    if ($path === '/automation-recipes' && $method === 'POST') return AutomationRecipesController::create();
    if ($path === '/automation-recipes/categories' && $method === 'GET') return AutomationRecipesController::getCategories();
    if ($path === '/automation-recipes/instances' && $method === 'GET') return AutomationRecipesController::getInstances();
    if (preg_match('#^/automation-recipes/(\d+)/install$#', $path, $m) && $method === 'POST') {
        return AutomationRecipesController::install((int)$m[1]);
    }
    if (preg_match('#^/automation-recipes/instances/(\d+)$#', $path, $m)) {
         $id = $m[1];
         if ($method === 'PUT' || $method === 'PATCH') return AutomationRecipesController::updateInstance($id);
         if ($method === 'DELETE') return AutomationRecipesController::deleteInstance($id);
    }
    if (preg_match('#^/automation-recipes/(\d+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return AutomationRecipesController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return AutomationRecipesController::update($id);
        if ($method === 'DELETE') return AutomationRecipesController::delete($id);
    }

    // Workflows (Visual Flows)
    if ($path === '/flows' && $method === 'GET') return WorkflowsController::index();
    if ($path === '/flows' && $method === 'POST') return WorkflowsController::store();
    if ($path === '/flows/options' && $method === 'GET') return WorkflowsController::getOptions();
    if (preg_match('#^/flows/(\d+)/toggle$#', $path, $m) && $method === 'POST') {
        return WorkflowsController::toggle((int)$m[1]);
    }
    if (preg_match('#^/flows/(\d+)/enroll$#', $path, $m) && $method === 'POST') {
        return WorkflowsController::enroll((int)$m[1]);
    }
    if (preg_match('#^/flows/(\d+)/enrollments$#', $path, $m) && $method === 'GET') {
        return WorkflowsController::getEnrollments((int)$m[1]);
    }
    if (preg_match('#^/flows/(\d+)/enrollments/(\d+)/logs$#', $path, $m) && $method === 'GET') {
        return WorkflowsController::getExecutionLogs((int)$m[1], (int)$m[2]);
    }
    if (preg_match('#^/flows/(\d+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return WorkflowsController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return WorkflowsController::update($id);
        if ($method === 'DELETE') return WorkflowsController::destroy($id);
    }

    // ==================== GHL-STYLE AUTOMATIONS V2 ====================
    if ($path === '/automations/v2/workflows' && $method === 'GET') return AutomationsV2Controller::listWorkflows();
    if ($path === '/automations/v2/workflows' && $method === 'POST') return AutomationsV2Controller::createWorkflow();
    if ($path === '/automations/v2/stats' && $method === 'GET') return AutomationsV2Controller::getStats();
    if ($path === '/automations/v2/triggers' && $method === 'GET') return AutomationsV2Controller::getTriggerTypes();
    if ($path === '/automations/v2/actions' && $method === 'GET') return AutomationsV2Controller::getActionTypes();
    if ($path === '/automations/v2/recipes' && $method === 'GET') return AutomationsV2Controller::listRecipes();
    if ($path === '/automations/v2/recipes' && $method === 'POST') return AutomationsV2Controller::createRecipe();
    if ($path === '/automations/v2/recipes/categories' && $method === 'GET') return AutomationsV2Controller::getRecipeCategories();
    if (preg_match('#^/automations/v2/recipes/(\d+)/use$#', $path, $m) && $method === 'POST') {
        return AutomationsV2Controller::useRecipe((int)$m[1]);
    }
    if (preg_match('#^/automations/v2/workflows/(\d+)/toggle$#', $path, $m) && $method === 'POST') {
        return AutomationsV2Controller::toggleWorkflow((int)$m[1]);
    }
    if (preg_match('#^/automations/v2/workflows/(\d+)/executions$#', $path, $m) && $method === 'GET') {
        return AutomationsV2Controller::getExecutions((int)$m[1]);
    }
    if (preg_match('#^/automations/v2/workflows/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return AutomationsV2Controller::getWorkflow($id);
        if ($method === 'PUT' || $method === 'PATCH') return AutomationsV2Controller::updateWorkflow($id);
        if ($method === 'DELETE') return AutomationsV2Controller::deleteWorkflow($id);
    }

    // ==================== GHL-STYLE APPOINTMENTS V2 ====================
    if ($path === '/booking-types' && $method === 'GET') return AppointmentsV2Controller::listBookingTypes();
    if ($path === '/booking-types' && $method === 'POST') return AppointmentsV2Controller::createBookingType();
    if (preg_match('#^/booking-types/(\d+)/slots$#', $path, $m) && $method === 'GET') {
        return AppointmentsV2Controller::getAvailableSlots((int)$m[1]);
    }
    if (preg_match('#^/booking-types/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return AppointmentsV2Controller::getBookingType($id);
        if ($method === 'PUT' || $method === 'PATCH') return AppointmentsV2Controller::updateBookingType($id);
        if ($method === 'DELETE') return AppointmentsV2Controller::deleteBookingType($id);
    }
    
    if ($path === '/availability' && $method === 'GET') return AppointmentsV2Controller::getAvailability();
    if ($path === '/availability' && $method === 'POST') return AppointmentsV2Controller::setAvailability();
    
    if ($path === '/appointments/v2' && $method === 'GET') return AppointmentsV2Controller::listAppointments();
    if ($path === '/appointments/v2/book' && $method === 'POST') return AppointmentsV2Controller::bookAppointment();
    if ($path === '/appointments/v2/stats' && $method === 'GET') return AppointmentsV2Controller::getStats();
    if (preg_match('#^/appointments/v2/(\d+)/status$#', $path, $m) && $method === 'POST') {
        return AppointmentsV2Controller::updateAppointmentStatus((int)$m[1]);
    }
    if (preg_match('#^/book/([a-z0-9-]+)$#', $path, $m) && $method === 'GET') {
        return AppointmentsV2Controller::getPublicBookingPage($m[1]);
    }

    // ==================== GHL-STYLE INVOICES & PAYMENTS ====================
    if ($path === '/invoices' && $method === 'GET') return InvoicesController::listInvoices();
    if ($path === '/invoices' && $method === 'POST') return InvoicesController::createInvoice();
    if ($path === '/invoices/stats' && $method === 'GET') return InvoicesController::getStats();
    if (preg_match('#^/invoices/(\d+)/status$#', $path, $m) && $method === 'POST') {
        return InvoicesController::updateInvoiceStatus((int)$m[1]);
    }
    if (preg_match('#^/invoices/(\d+)/payments$#', $path, $m) && $method === 'POST') {
        return InvoicesController::recordPayment((int)$m[1]);
    }
    if (preg_match('#^/invoices/(\d+)$#', $path, $m) && $method === 'GET') {
        return InvoicesController::getInvoice((int)$m[1]);
    }
    
    if ($path === '/products' && $method === 'GET') return InvoicesController::listProducts();
    if ($path === '/products' && $method === 'POST') return InvoicesController::createProduct();
    if (preg_match('#^/products/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT' || $method === 'PATCH') return InvoicesController::updateProduct($id);
        if ($method === 'DELETE') return InvoicesController::deleteProduct($id);
    }
    
    if ($path === '/payment-links' && $method === 'GET') return InvoicesController::listPaymentLinks();
    if ($path === '/payment-links' && $method === 'POST') return InvoicesController::createPaymentLink();

    // ==================== BOOKING SERVICES ====================
    if ($path === '/services' && $method === 'GET') return ServicesController::index();
    if ($path === '/services' && $method === 'POST') return ServicesController::store();
    if (preg_match('#^/services/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return ServicesController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return ServicesController::update($id);
        if ($method === 'DELETE') return ServicesController::destroy($id);
    }
    if ($path === '/services/categories' && $method === 'GET') return ServicesController::categories();
    if ($path === '/services/categories' && $method === 'POST') return ServicesController::createCategory();

    // ==================== GHL-STYLE REVIEWS & REPUTATION ====================
    if ($path === '/reviews/v2' && $method === 'GET') return ReviewsV2Controller::listReviews();
    if ($path === '/reviews/v2/stats' && $method === 'GET') return ReviewsV2Controller::getStats();
    if (preg_match('#^/reviews/v2/(\d+)/reply$#', $path, $m) && $method === 'POST') {
        return ReviewsV2Controller::replyToReview((int)$m[1]);
    }
    if (preg_match('#^/reviews/v2/(\d+)/status$#', $path, $m) && $method === 'POST') {
        return ReviewsV2Controller::updateReviewStatus((int)$m[1]);
    }
    
    if ($path === '/reviews/v2/requests' && $method === 'GET') return ReviewsV2Controller::listRequests();
    if ($path === '/reviews/v2/requests' && $method === 'POST') return ReviewsV2Controller::sendRequest();
    if ($path === '/reviews/v2/requests/stats' && $method === 'GET') return ReviewsV2Controller::getRequestStats();
    
    if ($path === '/reviews/v2/platforms' && $method === 'GET') return ReviewsV2Controller::listPlatforms();
    if ($path === '/reviews/v2/platforms' && $method === 'POST') return ReviewsV2Controller::addPlatform();
    if (preg_match('#^/reviews/v2/platforms/(\d+)$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return ReviewsV2Controller::updatePlatform((int)$m[1]);
    }

    // ==================== GHL-STYLE SNAPSHOTS ====================
    if ($path === '/snapshots' && $method === 'GET') return SnapshotsController::listSnapshots();
    if ($path === '/snapshots' && $method === 'POST') return SnapshotsController::createSnapshot();
    if ($path === '/snapshots/imports' && $method === 'GET') return SnapshotsController::listImports();
    if (preg_match('#^/snapshots/(\d+)/import$#', $path, $m) && $method === 'POST') {
        return SnapshotsController::importSnapshot((int)$m[1]);
    }
    if (preg_match('#^/snapshots/(\d+)/download$#', $path, $m) && $method === 'GET') {
        return SnapshotsController::downloadSnapshot((int)$m[1]);
    }
    if (preg_match('#^/snapshots/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return SnapshotsController::getSnapshot($id);
        if ($method === 'DELETE') return SnapshotsController::deleteSnapshot($id);
    }

    // Sending Accounts
    if ($path === '/sending-accounts' && $method === 'GET') return SendingAccountsController::index();
    if ($path === '/sending-accounts' && $method === 'POST') return SendingAccountsController::create();
    if (preg_match('#^/sending-accounts/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return SendingAccountsController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return SendingAccountsController::update($id);
        if ($method === 'DELETE') return SendingAccountsController::delete($id);
    }

    // Generic Folders Management
    if ($path === '/folders' && $method === 'GET') return FoldersController::index();
    if ($path === '/folders' && $method === 'POST') return FoldersController::create();
    if (preg_match('#^/folders/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT' || $method === 'PATCH') return FoldersController::update($id);
        if ($method === 'DELETE') return FoldersController::delete($id);
    }

    // Templates
    if ($path === '/templates' && $method === 'GET') return TemplatesController::index();
    if ($path === '/templates' && $method === 'POST') return TemplatesController::create();
    if (preg_match('#^/templates/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return TemplatesController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return TemplatesController::update($id);
        if ($method === 'DELETE') return TemplatesController::delete($id);
    }

    // Settings
    if ($path === '/settings' && $method === 'GET') return SettingsController::get();
    if ($path === '/settings' && ($method === 'PUT' || $method === 'PATCH')) return SettingsController::update();

    // /settings Alises for frontend compatibility
    if ($path === '/settings/email' && $method === 'GET') return SettingsController::get();
    if ($path === '/settings/email' && ($method === 'PUT' || $method === 'PATCH')) return SettingsController::update();
    if ($path === '/settings/integrations' && $method === 'GET') return IntegrationsController::getAll();
    if ($path === '/settings/integrations' && ($method === 'PUT' || $method === 'PATCH')) return IntegrationsController::update();

    // Module Settings (Growth & HR)
    require_once __DIR__ . '/../src/controllers/ModuleSettingsController.php';
    if ($path === '/settings/modules' && $method === 'GET') return ModuleSettingsController::getAllSettings();
    if (preg_match('#^/settings/module/([^/]+)/([^/]+)$#', $path, $m) && $method === 'GET') {
        return ModuleSettingsController::getSetting($m[1], $m[2]);
    }
    if (preg_match('#^/settings/module/([^/]+)$#', $path, $m)) {
        $module = $m[1];
        if ($method === 'GET') return ModuleSettingsController::getModuleSettings($module);
        if ($method === 'PUT' || $method === 'PATCH') return ModuleSettingsController::updateModuleSettings($module);
        if ($method === 'DELETE') return ModuleSettingsController::resetModuleSettings($module);
    }
    
    // SMS Settings
    if ($path === '/sms-settings' && $method === 'GET') return SMSSettingsController::get();
    if ($path === '/sms-settings' && ($method === 'PUT' || $method === 'PATCH')) return SMSSettingsController::update();
    
    // Call Settings
    if ($path === '/call-settings' && $method === 'GET') return CallSettingsController::get();
    if ($path === '/call-settings' && ($method === 'PUT' || $method === 'PATCH')) return CallSettingsController::update();
    
    // Form Settings
    if ($path === '/form-settings' && $method === 'GET') return FormSettingsController::get();
    if ($path === '/form-settings' && ($method === 'PUT' || $method === 'PATCH')) return FormSettingsController::update();

    // Payments & Finance Settings
    if ($path === '/payments/settings' && $method === 'GET') return PaymentsController::getSettings();
    if ($path === '/payments/settings' && ($method === 'PUT' || $method === 'POST')) return PaymentsController::updateSettings();

    // Analytics
    if ($path === '/analytics/summary' && $method === 'GET') return AnalyticsController::summary();

    // Test endpoint (bypass authentication)
    if ($path === '/test' && $method === 'GET') {
        Response::json([
            'message' => 'Backend is working!',
            'timestamp' => date('Y-m-d H:i:s'),
            'database' => 'connected',
            'path' => $path,
            'method' => $method
        ]);
    }

    // Analytics
    if ($path === '/analytics' && $method === 'GET') return AnalyticsController::summary();
    if ($path === '/analytics/summary' && $method === 'GET') return AnalyticsController::summary();
    if ($path === '/analytics/combined' && $method === 'GET') {
        $controller = new CombinedAnalyticsController();
        return $controller->getCombinedAnalytics();
    }
    if ($path === '/analytics/extended' && $method === 'GET') {
        $controller = new CombinedAnalyticsController();
        return $controller->getExtendedAnalytics();
    }
    
    if ($path === '/form-analytics' && $method === 'GET') return FormsController::getAnalytics();
    if ($path === '/all-data' && $method === 'GET') return AllDataController::getAllData();

    // Sequences
    if ($path === '/sequences' && $method === 'GET') return SequencesController::index();
    if ($path === '/sequences' && $method === 'POST') return SequencesController::create();
    if (preg_match('#^/sequences/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return SequencesController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return SequencesController::update($id);
        if ($method === 'DELETE') return SequencesController::delete($id);
    }

    // Follow-up Emails
    if ($path === '/follow-up-emails' && $method === 'GET') return FollowUpEmailsController::index();
    if ($path === '/follow-up-emails' && $method === 'POST') return FollowUpEmailsController::create();
    if (preg_match('#^/follow-up-emails/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'PUT' || $method === 'PATCH') return FollowUpEmailsController::update($id);
        if ($method === 'DELETE') return FollowUpEmailsController::delete($id);
    }

    // OAuth routes
    if ($path === '/oauth/gmail' && $method === 'POST') return OAuthController::gmailAuth();
    if ($path === '/oauth/gmail/callback' && $method === 'GET') return OAuthController::gmailCallback();
    if ($path === '/oauth/smtp/test' && $method === 'POST') return OAuthController::testSmtpConnection();

    // Automation Recipes
    require_once __DIR__ . '/../src/controllers/AutomationRecipesController.php';
    if ($path === '/automation-recipes' && $method === 'GET') {
        return AutomationRecipesController::index();
    }
    if ($path === '/automation-recipes' && $method === 'POST') {
        return AutomationRecipesController::create();
    }
    if (preg_match('#^/automation-recipes/([^/]+)/install$#', $path, $m) && $method === 'POST') {
         return AutomationRecipesController::install($m[1]);
    }
    if (preg_match('#^/automation-recipes/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return AutomationRecipesController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return AutomationRecipesController::update($id);
        if ($method === 'DELETE') return AutomationRecipesController::delete($id);
    }

    // Automations (Triggers/Rules)
    if ($path === '/automations' && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/AutomationController.php';
        return (new AutomationController())->index();
    }
    if ($path === '/automations' && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/AutomationController.php';
        return (new AutomationController())->create();
    }
    if (preg_match('#^/automations/(\d+)$#', $path, $m)) {
        require_once __DIR__ . '/../src/controllers/AutomationController.php';
        $controller = new AutomationController();
        $id = (int)$m[1];
        if ($method === 'GET') return $controller->show($id);
        if ($method === 'PUT' || $method === 'PATCH') return $controller->update($id);
        if ($method === 'DELETE') return $controller->delete($id);
    }
    if (preg_match('#^/automations/(\d+)/toggle$#', $path, $m) && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/AutomationController.php';
        return (new AutomationController())->toggle((int)$m[1]);
    }

    // Call Flows
    require_once __DIR__ . '/../src/controllers/CallFlowsController.php';
    if ($path === '/call-flows' && $method === 'GET') return CallFlowsController::getFlows();
    if ($path === '/call-flows' && $method === 'POST') return CallFlowsController::createFlow();
    if (preg_match('#^/call-flows/(\d+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return CallFlowsController::getFlow($id);
        if ($method === 'PUT' || $method === 'PATCH') return CallFlowsController::updateFlow($id);
        if ($method === 'DELETE') return CallFlowsController::deleteFlow($id);
    }

    // Flows (Legacy/General support redirecting to Call Flows or appropriate controller)
    // Note: If 'flows' refers to campaign_flows, we might need a separate controller. 
    // For now assuming existing flow usage maps to CallFlows or similar. 
    // If your frontend expects /flows for automation workflows, we might need to point to AutomationsV2 or similar.
    // Based on user context, /flows seems to be used for "Workflows".
    // Let's alias /flows to AutomationsV2 for Workflows if that's the intention, 
    // OR if there is a specific FlowsController (which I didn't find), I'd use that.
    // Given the context of "Workflows" in the UI, it often maps to "Campaign Flows" or "Automation Workflows".
    // Let's try mapping /flows to CallFlows for now as a fallback, or better, check if there is a 'CampaignFlowsController'.
    // I will check for CampaignFlowsController next. For now, I will start with Automations.

    // Automations V2 (Workflows)
    require_once __DIR__ . '/../src/controllers/AutomationsV2Controller.php';
    if ($path === '/flows' && $method === 'GET') return AutomationsV2Controller::listWorkflows();
    if ($path === '/flows' && $method === 'POST') return AutomationsV2Controller::createWorkflow();
    if (preg_match('#^/flows/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return AutomationsV2Controller::getWorkflow($id);
        if ($method === 'PUT' || $method === 'PATCH') return AutomationsV2Controller::updateWorkflow($id);
        if ($method === 'DELETE') return AutomationsV2Controller::deleteWorkflow($id);
    }
    if (preg_match('#^/flows/(\d+)/toggle$#', $path, $m) && $method === 'POST') {
        return AutomationsV2Controller::toggleWorkflow((int)$m[1]);
    }

    // Tracking routes
    if ($path === '/track/open' && $method === 'GET') return TrackController::open();
    if ($path === '/track/click' && $method === 'GET') return TrackController::click();
    if ($path === '/track/bounce' && $method === 'POST') return TrackController::bounce();
    if ($path === '/track/unsubscribe' && $method === 'GET') return TrackController::unsubscribe();
    if (preg_match('#^/track/status/([^/]+)$#', $path, $m) && $method === 'GET') {
        return TrackController::status((int)$m[1]);
    }
    
    // Bounce webhook routes for email providers
    if ($path === '/webhooks/bounce' && $method === 'POST') return TrackController::bounceWebhook();

    // Forms routes
    $formsController = new FormsController();
    if (str_starts_with($path, '/forms')) {
        return $formsController->handleRequest($method, $path);
    }

    // Form Templates routes
    if ($path === '/form-templates' && $method === 'GET') return FormTemplatesController::getTemplates();
    if ($path === '/form-templates' && $method === 'POST') return FormTemplatesController::createTemplate();
    if (preg_match('#^/form-templates/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return FormTemplatesController::getTemplate($id);
        if ($method === 'PUT' || $method === 'PATCH') return FormTemplatesController::updateTemplate($id);
        if ($method === 'DELETE') return FormTemplatesController::deleteTemplate($id);
    }

    // Form Responses routes (bulk endpoint for FormReplies page)
    if ($path === '/form-responses' && $method === 'GET') {
        return $formsController->getAllResponses();
    }
    if ($path === '/form-responses/bulk' && $method === 'POST') {
        return $formsController->bulkUpdateResponses();
    }
    if (preg_match('#^/form-responses/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'PUT' || $method === 'PATCH') return $formsController->updateResponse($id);
        if ($method === 'DELETE') return $formsController->deleteResponse($id);
    }


    // Helpdesk Settings
    if ($path === '/helpdesk/settings' && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/HelpdeskSettingsController.php';
        return Xordon\Controllers\HelpdeskSettingsController::get();
    }
    if ($path === '/helpdesk/settings' && ($method === 'PUT' || $method === 'POST')) {
        require_once __DIR__ . '/../src/controllers/HelpdeskSettingsController.php';
        return Xordon\Controllers\HelpdeskSettingsController::update();
    }

    // Helpdesk / Tickets Routes
    if ($path === '/tickets' && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/TicketsController.php';
        return (new TicketsController())->list();
    }
    if ($path === '/tickets' && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/TicketsController.php';
        return (new TicketsController())->create();
    }
    if ($path === '/tickets/stats' && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/TicketsController.php';
        return (new TicketsController())->stats();
    }
    if (preg_match('#^/tickets/(\d+)$#', $path, $m)) {
        require_once __DIR__ . '/../src/controllers/TicketsController.php';
        $controller = new TicketsController();
        $id = (int)$m[1];
        if ($method === 'GET') return $controller->get($id);
        if ($method === 'PUT' || $method === 'PATCH') return $controller->update($id);
    }
    if (preg_match('#^/tickets/(\d+)/messages$#', $path, $m) && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/TicketsController.php';
        return (new TicketsController())->addMessage((int)$m[1]);
    }
    
    // Ticket Merge/Split Routes
    if ($path === '/helpdesk/tickets/merge' && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/MergeSplitController.php';
        return MergeSplitController::merge();
    }
    if ($path === '/helpdesk/merge-history' && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/MergeSplitController.php';
        return MergeSplitController::history();
    }
    if (preg_match('#^/helpdesk/merge-history/(\d+)/undo$#', $path, $m) && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/MergeSplitController.php';
        return MergeSplitController::undo((int)$m[1]);
    }
    
    // Ticket Metadata Routes
    if ($path === '/ticket-stages' && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/TicketsController.php';
        return (new TicketsController())->listStages();
    }
    if ($path === '/ticket-types' && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/TicketsController.php';
        return (new TicketsController())->listTypes();
    }
    if ($path === '/ticket-teams' && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/TicketsController.php';
        return (new TicketsController())->listTeams();
    }
    
    // Canned Responses Routes
    if ($path === '/canned-responses' && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/CannedResponsesController.php';
        return (new CannedResponsesController())->index();
    }
    if ($path === '/canned-responses' && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/CannedResponsesController.php';
        return (new CannedResponsesController())->create();
    }
    if (preg_match('#^/canned-responses/(\d+)$#', $path, $m)) {
        require_once __DIR__ . '/../src/controllers/CannedResponsesController.php';
        $controller = new CannedResponsesController();
        $id = (int)$m[1];
        if ($method === 'GET') return $controller->show($id);
        if ($method === 'PUT' || $method === 'PATCH') return $controller->update($id);
        if ($method === 'DELETE') return $controller->delete($id);
    }
    
    // Knowledge Base Routes
    if ($path === '/kb/articles' && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/KnowledgeBaseController.php';
        return (new KnowledgeBaseController())->listArticles();
    }
    if ($path === '/kb/articles' && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/KnowledgeBaseController.php';
        return (new KnowledgeBaseController())->createArticle();
    }
    if (preg_match('#^/kb/articles/([^/]+)$#', $path, $m)) {
        require_once __DIR__ . '/../src/controllers/KnowledgeBaseController.php';
        $controller = new KnowledgeBaseController();
        // slug or id handling might be in getArticle
        if ($method === 'GET') return $controller->getArticle($m[1]); 
        if ($method === 'PUT' || $method === 'PATCH') return $controller->updateArticle($m[1]);
        if ($method === 'DELETE') return $controller->deleteArticle($m[1]);
    }
    if ($path === '/kb/categories' && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/KnowledgeBaseController.php';
        return (new KnowledgeBaseController())->listCategories();
    }
    if ($path === '/kb/categories' && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/KnowledgeBaseController.php';
        return (new KnowledgeBaseController())->createCategory();
    }
    if (preg_match('#^/kb/categories/(\d+)$#', $path, $m)) {
        require_once __DIR__ . '/../src/controllers/KnowledgeBaseController.php';
        $controller = new KnowledgeBaseController();
        if ($method === 'PUT' || $method === 'PATCH') return $controller->updateCategory((int)$m[1]);
        if ($method === 'DELETE') return $controller->deleteCategory((int)$m[1]);
    }

    // Reputation Routes (Mapping /reputation/* to ReputationController static methods)
    if (str_starts_with($path, '/reputation/')) {
        require_once __DIR__ . '/../src/controllers/ReputationController.php';
        require_once __DIR__ . '/../src/controllers/ReputationRequestsController.php';
        require_once __DIR__ . '/../src/controllers/ReputationWidgetsController.php';
        require_once __DIR__ . '/../src/controllers/ReputationSettingsController.php';
        
        if ($path === '/reputation/stats' && $method === 'GET') return \Xordon\Controllers\ReputationController::getStats();
        if ($path === '/reputation/reviews' && $method === 'GET') return \Xordon\Controllers\ReputationController::getReviews();
        if (preg_match('#^/reputation/reviews/(\d+)$#', $path, $m) && $method === 'GET') return \Xordon\Controllers\ReputationController::getReview((int)$m[1]);
        if (preg_match('#^/reputation/reviews/(\d+)/reply$#', $path, $m) && $method === 'POST') return \Xordon\Controllers\ReputationController::replyToReview((int)$m[1]);
        if (preg_match('#^/reputation/reviews/(\d+)$#', $path, $m) && $method === 'PATCH') return \Xordon\Controllers\ReputationController::updateReview((int)$m[1]);
        if (preg_match('#^/reputation/reviews/(\d+)$#', $path, $m) && $method === 'DELETE') return \Xordon\Controllers\ReputationController::deleteReview((int)$m[1]);
        
        // Requests
        if ($path === '/reputation/requests' && $method === 'GET') return (new ReputationRequestsController())->index();
        if ($path === '/reputation/requests' && $method === 'POST') return (new ReputationRequestsController())->create();
        if (preg_match('#^/reputation/requests/(\d+)/send$#', $path, $m) && $method === 'POST') return (new ReputationRequestsController())->send((int)$m[1]);
        
        // Widgets
        if ($path === '/reputation/widgets' && $method === 'GET') return (new ReputationWidgetsController())->index();
        if ($path === '/reputation/widgets' && $method === 'POST') return (new ReputationWidgetsController())->create();
        if (preg_match('#^/reputation/widgets/(\d+)$#', $path, $m)) {
            $controller = new ReputationWidgetsController();
            if ($method === 'GET') return $controller->show((int)$m[1]);
            if ($method === 'PUT' || $method === 'PATCH') return $controller->update((int)$m[1]);
            if ($method === 'DELETE') return $controller->delete((int)$m[1]);
        }
        
        // Settings
        if ($path === '/reputation/settings' && $method === 'GET') return (new ReputationSettingsController())->get();
        if ($path === '/reputation/settings' && ($method === 'PUT' || $method === 'PATCH')) return (new ReputationSettingsController())->update();
    }

    // Email Replies routes
    $emailRepliesController = new EmailRepliesController();
    if (str_starts_with($path, '/email-replies')) {
        return $emailRepliesController->handleRequest($method, $path);
    }

    // Custom Variables routes
    $customVariablesController = new CustomVariablesController(Database::conn());
    if ($path === '/custom-variables' && $method === 'GET') return $customVariablesController->getAll();
    if ($path === '/custom-variables' && $method === 'POST') return $customVariablesController->create();
    if (preg_match('#^/custom-variables/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'PUT' || $method === 'PATCH') return $customVariablesController->update($id);
        if ($method === 'DELETE') return $customVariablesController->delete($id);
    }

    // Hunter.io routes
    $hunterController = new HunterController();
    if ($path === '/hunter/domain-search' && $method === 'GET') return $hunterController->domainSearch();
    if ($path === '/hunter/email-finder' && $method === 'POST') return $hunterController->emailFinder();
    if ($path === '/hunter/email-verifier' && $method === 'POST') return $hunterController->emailVerifier();
    if ($path === '/hunter/bulk-verifier' && $method === 'POST') return $hunterController->bulkEmailVerifier();

    // SMS Controller instances
    $smsCampaignsController = new SMSCampaignsController();
    $smsRecipientsController = new SMSRecipientsController();
    $smsSequencesController = new SMSSequencesController();
    $smsTemplatesController = new SMSTemplatesController();
    $smsAnalyticsController = new SMSAnalyticsController();
    $smsRepliesController = new SMSRepliesController();
    if ($path === '/hunter/account' && $method === 'GET') return $hunterController->getAccount();
    if ($path === '/hunter/save-recipients' && $method === 'POST') return $hunterController->saveAsRecipients();
    if ($path === '/hunter/domain-search-save' && $method === 'POST') return $hunterController->domainSearchAndSave();


    // Tags
    if ($path === '/tags' && $method === 'GET') return TagsController::index();
    if ($path === '/tags' && $method === 'POST') return TagsController::create();
    if (preg_match('#^/tags/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'PUT' || $method === 'PATCH') return TagsController::update($id);
        if ($method === 'DELETE') return TagsController::delete($id);
    }
    if ($path === '/tags/add-to-recipient' && $method === 'POST') return TagsController::addToRecipient();
    if ($path === '/tags/remove-from-recipient' && $method === 'POST') return TagsController::removeFromRecipient();
    if ($path === '/tags/bulk-add-to-recipients' && $method === 'POST') return TagsController::bulkAddToRecipients();

    // Deliverability & Warmup
    if ($path === '/deliverability/accounts' && $method === 'GET') return DeliverabilityController::accounts();
    if ($path === '/deliverability/profiles' && $method === 'POST') return DeliverabilityController::createProfile();
    if (preg_match('#^/deliverability/profiles/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'PUT' || $method === 'PATCH') return DeliverabilityController::updateProfile($id);
    }
    if (preg_match('#^/deliverability/profiles/([^/]+)/pause$#', $path, $m) && $method === 'POST') {
        return DeliverabilityController::pauseProfile($m[1]);
    }
    if (preg_match('#^/deliverability/profiles/([^/]+)/resume$#', $path, $m) && $method === 'POST') {
        return DeliverabilityController::resumeProfile($m[1]);
    }
    if ($path === '/deliverability/schedule-runs' && $method === 'POST') return DeliverabilityController::scheduleRuns();
    if ($path === '/deliverability/dns-check' && $method === 'POST') return DeliverabilityController::checkDns();

    // SMS Campaigns
    if ($path === '/sms-campaigns' && $method === 'GET') return $smsCampaignsController->getCampaigns();
    if ($path === '/sms-campaigns' && $method === 'POST') return $smsCampaignsController->createCampaign();
    if (preg_match('#^/sms-campaigns/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return $smsCampaignsController->getCampaign($id);
        if ($method === 'PUT' || $method === 'PATCH') return $smsCampaignsController->updateCampaign($id);
        if ($method === 'DELETE') return $smsCampaignsController->deleteCampaign($id);
    }
    if (preg_match('#^/sms-campaigns/([^/]+)/send$#', $path, $m) && $method === 'POST') {
        return $smsCampaignsController->sendCampaign($m[1]);
    }
    if (preg_match('#^/sms-campaigns/([^/]+)/pause$#', $path, $m) && $method === 'POST') {
        return $smsCampaignsController->pauseCampaign($m[1]);
    }
    if (preg_match('#^/sms-campaigns/([^/]+)/start$#', $path, $m) && $method === 'POST') {
        return $smsCampaignsController->sendCampaign($m[1]);
    }
    if (preg_match('#^/sms-campaigns/([^/]+)/archive$#', $path, $m) && $method === 'POST') {
        return $smsCampaignsController->archiveCampaign($m[1]);
    }
    if ($path === '/sms-campaigns/test' && $method === 'POST') {
        return $smsCampaignsController->sendTestSMS();
    }

    // SMS Recipients
    if ($path === '/sms-recipients' && $method === 'GET') return $smsRecipientsController->getRecipients();
    if ($path === '/sms-recipients' && $method === 'POST') return $smsRecipientsController->createRecipient();
    if ($path === '/sms-recipients/import' && $method === 'POST') return $smsRecipientsController->bulkImport();
    if ($path === '/sms-recipients/import-csv' && $method === 'POST') return $smsRecipientsController->bulkImport(); // Alias for frontend compatibility
    if ($path === '/sms-recipients/bulk-action' && $method === 'POST') return $smsRecipientsController->bulkAction();
    if ($path === '/sms-recipients/bulk-delete' && $method === 'POST') return $smsRecipientsController->bulkAction(); // Alias for frontend compatibility
    if ($path === '/sms-recipients/bulk-unsubscribe' && $method === 'POST') return $smsRecipientsController->bulkUnsubscribe();
    if ($path === '/sms-recipients/unsubscribed' && $method === 'GET') return $smsRecipientsController->getUnsubscribedRecipients();
    if ($path === '/sms-recipients/tags' && $method === 'GET') return $smsRecipientsController->getTags();
    if ($path === '/sms-recipients/export-csv' && $method === 'GET') return $smsRecipientsController->exportRecipients(); // Add export endpoint
    if (preg_match('#^/sms-recipients/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'PUT' || $method === 'PATCH') return $smsRecipientsController->updateRecipient($id);
        if ($method === 'DELETE') return $smsRecipientsController->deleteRecipient($id);
    }

    // SMS Replies
    if ($path === '/sms-replies' && $method === 'GET') return $smsRepliesController->getReplies();
    if ($path === '/sms-replies/bulk-action' && $method === 'POST') return $smsRepliesController->bulkAction();
    if (preg_match('#^/sms-replies/([^/]+)/mark-read$#', $path, $m) && $method === 'POST') {
        return $smsRepliesController->markAsRead($m[1]);
    }
    if (preg_match('#^/sms-replies/([^/]+)/mark-unread$#', $path, $m) && $method === 'POST') {
        return $smsRepliesController->markAsUnread($m[1]);
    }
    if (preg_match('#^/sms-replies/([^/]+)/star$#', $path, $m) && $method === 'POST') {
        return $smsRepliesController->toggleStar($m[1]);
    }
    if (preg_match('#^/sms-replies/([^/]+)/archive$#', $path, $m) && $method === 'POST') {
        return $smsRepliesController->toggleArchive($m[1]);
    }
    if (preg_match('#^/sms-replies/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'DELETE') return $smsRepliesController->deleteReply($id);
    }
    if (preg_match('#^/sms-replies/campaign/([^/]+)$#', $path, $m) && $method === 'GET') {
        return $smsRepliesController->getCampaignReplies($m[1]);
    }

    // SMS Sequences
    if ($path === '/sms-sequences' && $method === 'GET') return $smsSequencesController->getSequences();
    if ($path === '/sms-sequences' && $method === 'POST') return $smsSequencesController->createSequence();
    if ($path === '/sms-sequences/templates' && $method === 'GET') return $smsSequencesController->getSequenceTemplates();
    
    // Check preview route first (more specific)
    if (preg_match('#^/sms-sequences/([^/]+)/preview$#', $path, $m) && $method === 'POST') {
        return $smsSequencesController->previewSequence($m[1]);
    }
    
    // Check duplicate route
    if (preg_match('#^/sms-sequences/([^/]+)/duplicate$#', $path, $m) && $method === 'POST') {
        return $smsSequencesController->duplicateSequence($m[1]);
    }
    if (preg_match('#^/sms-sequences/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return $smsSequencesController->getSequence($id);
        if ($method === 'PUT' || $method === 'PATCH') return $smsSequencesController->updateSequence($id);
        if ($method === 'DELETE') return $smsSequencesController->deleteSequence($id);
    }

    // SMS Sequence Processor
    $smsSequenceProcessorController = new SMSSequenceProcessorController();
    if ($path === '/sms-sequence-processor/process-pending' && $method === 'POST') {
        return $smsSequenceProcessorController->processPending();
    }
    if (preg_match('#^/sms-campaigns/([^/]+)/schedule-followups$#', $path, $m) && $method === 'POST') {
        return $smsSequenceProcessorController->scheduleFollowUps($m[1], $_POST['recipient_id'] ?? null);
    }
    if ($path === '/sms-sequence-processor/stats' && $method === 'GET') {
        return $smsSequenceProcessorController->getStats();
    }
    if (preg_match('#^/sms-campaigns/([^/]+)/scheduled-messages$#', $path, $m) && $method === 'GET') {
        return $smsSequenceProcessorController->getScheduledMessages($m[1]);
    }
    if (preg_match('#^/sms-campaigns/([^/]+)/cancel-scheduled$#', $path, $m) && $method === 'POST') {
        return $smsSequenceProcessorController->cancelScheduledMessages($m[1]);
    }

    // SMS Templates
    if ($path === '/sms-templates' && $method === 'GET') return $smsTemplatesController->getTemplates();
    if ($path === '/sms-templates' && $method === 'POST') return $smsTemplatesController->createTemplate();
    if ($path === '/sms-templates/categories' && $method === 'GET') return $smsTemplatesController->getCategories();
    if (preg_match('#^/sms-templates/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return $smsTemplatesController->getTemplate($id);
        if ($method === 'PUT' || $method === 'PATCH') return $smsTemplatesController->updateTemplate($id);
        if ($method === 'DELETE') return $smsTemplatesController->deleteTemplate($id);
    }
    if (preg_match('#^/sms-templates/([^/]+)/duplicate$#', $path, $m) && $method === 'POST') {
        return $smsTemplatesController->duplicateTemplate($m[1]);
    }
    if (preg_match('#^/sms-templates/([^/]+)/preview$#', $path, $m) && $method === 'POST') {
        return $smsTemplatesController->previewTemplate($m[1]);
    }

    // SMS Analytics
    if ($path === '/sms-analytics' && $method === 'GET') return $smsAnalyticsController->getDashboard();
    if (preg_match('#^/sms-analytics/campaigns/([^/]+)$#', $path, $m) && $method === 'GET') {
        return $smsAnalyticsController->getCampaignAnalytics($m[1]);
    }
    if (preg_match('#^/sms-analytics/sequences/([^/]+)$#', $path, $m) && $method === 'GET') {
        return $smsAnalyticsController->getSequenceAnalytics($m[1]);
    }
    if ($path === '/sms-analytics/export' && $method === 'POST') return $smsAnalyticsController->exportReport();

    // SMS Settings
    if ($path === '/sms-settings' && $method === 'GET') return SMSSettingsController::get();
    // Accept both POST and PUT for updates to align with frontend client
    if ($path === '/sms-settings' && ($method === 'POST' || $method === 'PUT')) return SMSSettingsController::update();
    if ($path === '/sms-settings/test-connection' && $method === 'POST') {
        $payload = json_decode(file_get_contents('php://input'), true) ?: [];
        $connectionId = $_POST['connection_id'] ?? $payload['connectionId'] ?? $payload['id'] ?? '';
        return ConnectionsController::testConnection($connectionId);
    }
    
    // Twilio connection testing
    if ($path === '/twilio/test-connection' && $method === 'POST') return SMSSettingsController::testTwilioConnection();
    
    // Vonage connection testing  
    // Note: testVonageConnection method not implemented yet - using testConnection as fallback
    if ($path === '/vonage/test-connection' && $method === 'POST') {
        Response::json(['error' => 'Vonage test not implemented'], 400);
        return;
    }
    
    // SignalWire direct number fetching
    if ($path === '/sms/fetch-signalwire-numbers' && $method === 'POST') return SMSSettingsController::fetchSignalWireNumbers();

    // SMS Send Individual Message
    if ($path === '/sms/send' && $method === 'POST') {
        $userId = Auth::userIdOrFail();
        $smsService = new SMSService(null, $userId);
        $body = json_decode(file_get_contents('php://input'), true) ?: [];
        $phoneNumber = $body['phone_number'] ?? '';
        $message = $body['message'] ?? '';
        $senderNumber = $body['sender_number'] ?? '';
        
        if (empty($phoneNumber) || empty($message)) {
            http_response_code(400);
            Response::json(['error' => 'Phone number and message are required']);
            return;
        }
        
        try {
            $result = $smsService->sendMessage($phoneNumber, $message, $senderNumber ?: null);
            return Response::json([
                'message' => 'SMS sent successfully',
                'status' => $result['status'] ?? 'sent',
                'external_id' => $result['external_id'] ?? null
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            Response::json(['error' => 'Failed to send SMS: ' . $e->getMessage()]);
            return;
        }
    }

    // SMS Accounts (for sending accounts/numbers)
    if ($path === '/sms-accounts' && $method === 'GET') return SMSSettingsController::getAvailableNumbers();
    if ($path === '/sms-accounts' && $method === 'POST') return SMSSettingsController::createSendingAccount();

    // SMS Webhook endpoint for delivery status updates
    if ($path === '/sms-webhook' && $method === 'POST') {
        $smsService = new SMSService();
        $webhookData = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        return $smsService->handleWebhook($webhookData);
    }

    // Standardized Inbound SMS Webhook
    if ($path === '/webhooks/sms/inbound' && $method === 'POST') {
        $smsService = new SMSService();
        $webhookData = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        return $smsService->handleWebhook($webhookData);
    }

    // Call Outreach Routes
    if ($path === '/calls/campaigns' && $method === 'GET') return CallController::getCampaigns();
    if ($path === '/calls/campaigns' && $method === 'POST') return CallController::createCampaign();
    if (preg_match('#^/calls/campaigns/([^/]+)$#', $path, $m) && in_array($method, ['GET', 'PUT', 'PATCH', 'DELETE'])) {
        $id = $m[1];
        if ($method === 'GET') return CallController::getCampaign($id);
        if ($method === 'PUT' || $method === 'PATCH') return CallController::updateCampaign($id);
        if ($method === 'DELETE') return CallController::deleteCampaign($id);
    }
    if ($path === '/calls/logs' && $method === 'GET') return CallController::getCallLogs();
    if ($path === '/calls/logs' && $method === 'POST') return CallController::createCallRecipient();
    if ($path === '/calls/log' && $method === 'POST') return CallController::logCall();
    if (preg_match('#^/calls/logs/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return CallController::getCallLog($id);
        if ($method === 'PUT' || $method === 'PATCH') return CallController::updateCallLog($id);
    }
    if ($path === '/calls/dispositions' && $method === 'GET') return CallController::getDispositionTypes();
    if ($path === '/calls/dispositions' && $method === 'POST') return CallController::createDispositionType();
    if (preg_match('#^/calls/dispositions/([^/]+)$#', $path, $m) && in_array($method, ['PUT', 'PATCH', 'DELETE'])) {
        $id = $m[1];
        if ($method === 'PUT' || $method === 'PATCH') return CallController::updateCallDisposition($id);
        if ($method === 'DELETE') return CallController::deleteCallDisposition($id);
    }
    if ($path === '/calls/scripts' && $method === 'GET') return CallController::getCallScripts();
    if ($path === '/calls/scripts' && $method === 'POST') return CallController::createCallScript();
    if (preg_match('#^/calls/scripts/([^/]+)$#', $path, $m) && in_array($method, ['GET', 'PUT', 'PATCH', 'DELETE'])) {
        $id = $m[1];
        if ($method === 'GET') return CallController::getCallScript($id);
        if ($method === 'PUT' || $method === 'PATCH') return CallController::updateCallScript($id);
        if ($method === 'DELETE') return CallController::deleteCallScript($id);
    }
    error_log("About to check calls/recipients route. Current path: $path, method: $method");
    if ($path === '/calls/recipients' && $method === 'GET') {
        error_log("Matched calls/recipients route!");
        return CallController::getCallRecipients();
    }
    if ($path === '/calls/recipients' && $method === 'POST') return CallController::createCallRecipient();
    if (preg_match('#^/calls/recipients/([^/]+)$#', $path, $m) && in_array($method, ['PUT', 'DELETE'])) {
        $id = $m[1];
        if ($method === 'PUT') return CallController::updateCallRecipient($id);
        if ($method === 'DELETE') return CallController::deleteCallRecipient($id);
    }
    if ($path === '/calls/agents' && $method === 'GET') return CallAgentsController::getAgents();
    if ($path === '/calls/agents' && $method === 'POST') return CallAgentsController::createAgent();
    if (preg_match('#^/calls/agents/([^/]+)$#', $path, $m) && in_array($method, ['GET', 'PUT', 'PATCH', 'DELETE'])) {
        $id = $m[1];
        if ($method === 'GET') return CallAgentsController::getAgent($id);
        if ($method === 'PUT' || $method === 'PATCH') return CallAgentsController::updateAgent($id);
        if ($method === 'DELETE') return CallAgentsController::deleteAgent($id);
    }
    if (preg_match('#^/calls/agents/([^/]+)/stats$#', $path, $m) && $method === 'GET') return CallAgentsController::getAgentStats($m[1]);
    if ($path === '/calls/settings' && $method === 'GET') return CallController::getSettings();
    if ($path === '/calls/settings' && $method === 'PUT') return CallController::updateSettings();
    if ($path === '/calls/analytics' && $method === 'GET') return CallController::getAnalytics();
    if ($path === '/calls/status' && $method === 'GET') return CallController::getStatus();
    if ($path === '/calls/make' && $method === 'POST') return CallController::makeCall();
    if ($path === '/calls/mute' && $method === 'POST') return CallController::toggleMute();
    if ($path === '/calls/recording' && $method === 'POST') return CallController::toggleRecording();
    if ($path === '/calls/dtmf' && $method === 'POST') return CallController::sendDTMF();
    if ($path === '/calls/end' && $method === 'POST') return CallController::endCall();
    if ($path === '/calls/hold' && $method === 'POST') return CallController::toggleHold();
    if ($path === '/calls/test-sip' && $method === 'POST') return CallController::testSIPConnection();
    if ($path === '/calls/webhook' && $method === 'POST') return CallController::handleWebhook();
    
    // Call Flows (Visual IVR Builder)
    require_once __DIR__ . '/../src/controllers/CallFlowsController.php';
    if ($path === '/call-flows' && $method === 'GET') return CallFlowsController::getFlows();
    if ($path === '/call-flows' && $method === 'POST') return CallFlowsController::createFlow();
    if (preg_match('#^/call-flows/([^/]+)$#', $path, $m) && in_array($method, ['GET', 'PUT', 'PATCH', 'DELETE'])) {
        $id = $m[1];
        if ($method === 'GET') return CallFlowsController::getFlow($id);
        if ($method === 'PUT' || $method === 'PATCH') return CallFlowsController::updateFlow($id);
        if ($method === 'DELETE') return CallFlowsController::deleteFlow($id);
    }
    if (preg_match('#^/call-flows/([^/]+)/duplicate$#', $path, $m) && $method === 'POST') {
        return CallFlowsController::duplicateFlow($m[1]);
    }
    
    // ============================================
    // CALL INBOX & INBOUND MANAGEMENT
    // ============================================
    require_once __DIR__ . '/../src/controllers/CallInboxController.php';
    
    // Inbox items (missed calls, voicemails, callbacks)
    if ($path === '/calls/inbox' && $method === 'GET') return CallInboxController::getInboxItems();
    if (preg_match('#^/calls/inbox/([^/]+)$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return CallInboxController::updateInboxItem($m[1]);
    }
    if (preg_match('#^/calls/inbox/([^/]+)/callback$#', $path, $m) && $method === 'POST') {
        return CallInboxController::scheduleCallback($m[1]);
    }
    
    // Voicemails
    if ($path === '/calls/voicemails' && $method === 'GET') return CallInboxController::getVoicemails();
    
    // Live call monitoring
    if ($path === '/calls/live' && $method === 'GET') return CallInboxController::getLiveCalls();
    
    // Agent presence/status
    if ($path === '/calls/agent-presence' && $method === 'GET') return CallInboxController::getAgentPresence();
    if ($path === '/calls/agent-status' && $method === 'PUT') return CallInboxController::updateAgentStatus();
    
    // IVR Callback endpoint (for TwiML webhooks from IVR flows)
    if (preg_match('#^/phone/ivr-callback/(\d+)$#', $path, $m) && $method === 'POST') {
        $flowId = (int)$m[1];
        $nodeId = $_GET['nodeId'] ?? $_POST['nodeId'] ?? null;
        $params = array_merge($_GET, $_POST);
        echo \Xordon\Services\IVREngineService::execute($flowId, $nodeId, $params);
        return;
    }
    
    // AI Callback endpoint (for multi-turn AI interactions)
    if ($path === '/phone/ai-callback' && $method === 'POST') {
        $agentId = (int)($_GET['agentId'] ?? $_POST['agentId'] ?? 0);
        $speechResult = $_POST['SpeechResult'] ?? '';
        $callSid = $_POST['CallSid'] ?? '';
        
        if (empty($speechResult) && ($_GET['status'] ?? '') === 'no-input') {
            echo '<?xml version="1.0" encoding="UTF-8"?><Response><Say>I didn\'t hear anything. Goodbye.</Say><Hangup/></Response>';
            return;
        }
        
        $result = \Xordon\Services\AIVoiceBotService::handleTurn($agentId, $speechResult, $callSid);
        echo \Xordon\Services\AIVoiceBotService::generateLoopXml($result['response'], $agentId, $callSid);
        return;
    }
    
    // Queue wait webhook (hold music/position announcement)
    if ($path === '/phone/queue-wait' && $method === 'POST') {
        header('Content-Type: text/xml');
        echo '<?xml version="1.0" encoding="UTF-8"?><Response><Play loop="0">https://api.twilio.com/cowbell.mp3</Play></Response>';
        return;
    }
    
    // Whisper announcement webhook
    if ($path === '/phone/whisper' && $method === 'POST') {
        header('Content-Type: text/xml');
        $text = $_GET['text'] ?? 'Incoming call';
        echo '<?xml version="1.0" encoding="UTF-8"?><Response><Say>' . htmlspecialchars($text) . '</Say></Response>';
        return;
    }
    
    // Recording complete webhook
    if ($path === '/phone/recording-complete' && $method === 'POST') {
        $flowId = $_GET['flowId'] ?? null;
        $recordingUrl = $_POST['RecordingUrl'] ?? '';
        $transcription = $_POST['TranscriptionText'] ?? '';
        $callSid = $_POST['CallSid'] ?? '';
        
        // Update call log with recording
        if ($callSid && $recordingUrl) {
            $pdo = Database::conn();
            $stmt = $pdo->prepare("UPDATE phone_call_logs SET recording_url = ?, transcription = ? WHERE call_sid = ?");
            $stmt->execute([$recordingUrl, $transcription, $callSid]);
        }
        
        header('Content-Type: text/xml');
        echo '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Thank you for your message. Goodbye.</Say><Hangup/></Response>';
        return;
    }
    
    // DNI (Dynamic Number Insertion) Routes
    require_once __DIR__ . '/../src/controllers/DNIController.php';
    
    // Public DNI endpoints (no auth)
    if ($path === '/dni/swap' && $method === 'GET') return DNIController::getSwapNumber();
    if ($path === '/dni/track-page' && $method === 'POST') return DNIController::trackPageVisit();
    
    // Authenticated DNI endpoints
    if ($path === '/number-pools' && $method === 'GET') return DNIController::getPools();
    if ($path === '/number-pools' && $method === 'POST') return DNIController::createPool();
    if (preg_match('#^/number-pools/([^/]+)$#', $path, $m) && in_array($method, ['GET', 'PUT', 'PATCH', 'DELETE'])) {
        $id = $m[1];
        if ($method === 'PUT' || $method === 'PATCH') return DNIController::updatePool($id);
        if ($method === 'DELETE') return DNIController::deletePool($id);
    }
    if ($path === '/dni/snippet' && $method === 'GET') return DNIController::getTrackingSnippet();
    if ($path === '/dni/analytics' && $method === 'GET') return DNIController::getAnalytics();

    // Groups
    if ($path === '/groups' && $method === 'GET') return GroupsController::index();
    if ($path === '/groups' && $method === 'POST') return GroupsController::create();
    if (preg_match('#^/groups/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'PUT' || $method === 'PATCH') return GroupsController::update($id);
        if ($method === 'DELETE') return GroupsController::delete($id);
    }
    if ($path === '/groups/move-item' && $method === 'POST') return GroupsController::moveItem();
    if ($path === '/groups/bulk-move-items' && $method === 'POST') return GroupsController::bulkMoveItems();

    // Connections (for communication providers like SignalWire, Twilio, etc.)
    if ($path === '/connections' && $method === 'GET') return ConnectionsController::getConnections();
    if ($path === '/connections' && $method === 'POST') return ConnectionsController::createConnection();
    if (preg_match('#^/connections/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return ConnectionsController::getConnection($id);
        if ($method === 'PUT' || $method === 'PATCH') return ConnectionsController::updateConnection($id);
        if ($method === 'DELETE') return ConnectionsController::deleteConnection($id);
    }
    if (preg_match('#^/connections/([^/]+)/phone-numbers$#', $path, $m) && $method === 'GET') return ConnectionsController::getConnectionPhoneNumbers($m[1]);
    if (preg_match('#^/connections/([^/]+)/token$#', $path, $m) && $method === 'POST') return ConnectionsController::getConnectionToken($m[1]);
    if (preg_match('#^/connections/([^/]+)/test$#', $path, $m) && $method === 'POST') return ConnectionsController::testConnection($m[1]);
    if (preg_match('#^/connections/([^/]+)/sync$#', $path, $m) && $method === 'POST') return ConnectionsController::syncConnection($m[1]);
    if ($path === '/connections/test-config' && $method === 'POST') return ConnectionsController::testConnectionConfig();

    // Groups
    if (preg_match('#^/calls/dispositions/([^/]+)$#', $path, $m) && $method === 'PUT') return CallController::updateCallDisposition($m[1]);
    if (preg_match('#^/calls/dispositions/([^/]+)$#', $path, $m) && $method === 'DELETE') return CallController::deleteCallDisposition($m[1]);
    if ($path === '/calls/connections' && $method === 'GET') return ConnectionsController::getConnections();
    if ($path === '/calls/connections' && $method === 'POST') return ConnectionsController::createConnection();
    if (preg_match('#^/calls/connections/([^/]+)$#', $path, $m) && $method === 'GET') return ConnectionsController::getConnection($m[1]);
    if (preg_match('#^/calls/connections/([^/]+)$#', $path, $m) && $method === 'PUT') return ConnectionsController::updateConnection($m[1]);
    if (preg_match('#^/calls/connections/([^/]+)$#', $path, $m) && $method === 'DELETE') return ConnectionsController::deleteConnection($m[1]);
    if (preg_match('#^/calls/connections/([^/]+)/phone-numbers$#', $path, $m) && $method === 'GET') return ConnectionsController::getConnectionPhoneNumbers($m[1]);
    if (preg_match('#^/calls/connections/([^/]+)/sync$#', $path, $m) && $method === 'POST') return ConnectionsController::syncConnection($m[1]);
    if (preg_match('#^/calls/connections/([^/]+)/test$#', $path, $m) && $method === 'POST') return ConnectionsController::testConnection($m[1]);
    // Campaigns POST route - REMOVED DUPLICATE (already defined above)

    // Logs routes
    if ($path === '/logs' && $method === 'GET') {
        $logsController = new LogsController();
        return $logsController->getLogFiles();
    }

    // Integrations routes
    if ($path === '/integrations' && $method === 'GET') return IntegrationsController::getAll();
    if ($path === '/integrations' && $method === 'POST') return IntegrationsController::create();
    if (preg_match('#^/integrations/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return IntegrationsController::get($id);
        if ($method === 'PUT' || $method === 'PATCH') return IntegrationsController::update($id);
        if ($method === 'DELETE') return IntegrationsController::delete($id);
    }
    if (preg_match('#^/integrations/([^/]+)/test$#', $path, $m) && $method === 'POST') {
        return IntegrationsController::test($m[1]);
    }
    
    // Zapier-specific routes
    if ($path === '/integrations/zapier/api-key' && $method === 'GET') return IntegrationsController::getZapierApiKey();
    if ($path === '/integrations/zapier/api-key/regenerate' && $method === 'POST') return IntegrationsController::regenerateZapierApiKey();
    if ($path === '/integrations/zapier/triggers' && $method === 'GET') return IntegrationsController::getZapierTriggers();

    // CRM Routes
    if ($path === '/crm/dashboard' && $method === 'GET') return CRMController::getDashboard();
    if ($path === '/crm/leads' && $method === 'GET') return CRMController::getLeads();
    if ($path === '/crm/leads' && $method === 'POST') return CRMController::createLead();
    if (preg_match('#^/crm/leads/([^/]+)$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return CRMController::updateLead($m[1]);
    }
    if (preg_match('#^/crm/leads/([^/]+)/activities$#', $path, $m) && $method === 'GET') {
        return CRMController::getLeadActivities($m[1]);
    }
    if (preg_match('#^/crm/leads/([^/]+)/activities$#', $path, $m) && $method === 'POST') {
        return CRMController::addLeadActivity($m[1]);
    }
    if ($path === '/crm/tasks' && $method === 'GET') return CRMController::getTasks();
    if ($path === '/crm/tasks' && $method === 'POST') return CRMController::createTask();
    if (preg_match('#^/crm/tasks/([^/]+)/status$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return CRMController::updateTaskStatus($m[1]);
    }
    if ($path === '/crm/activities' && $method === 'GET') return CRMController::getAllActivities();
    if ($path === '/crm/analytics' && $method === 'GET') return CRMController::getAnalytics();
    
    // Additional CRM Routes
    if ($path === '/crm/settings' && $method === 'GET') return CRMController::getSettings();
    if ($path === '/crm/settings' && $method === 'PUT') return CRMController::updateSettings();
    if ($path === '/crm/playbooks' && $method === 'GET') return CRMController::getPlaybooks();
    if ($path === '/crm/playbooks' && $method === 'POST') return CRMController::createPlaybook();
    if ($path === '/crm/forecast' && $method === 'GET') return CRMController::getForecast();
    if ($path === '/crm/products' && $method === 'GET') return CRMController::getProducts();
    if ($path === '/crm/goals/daily' && $method === 'GET') return CRMController::getDailyGoals();
    if ($path === '/crm/goals/daily' && $method === 'PUT') return CRMController::updateDailyGoals();

    if ($path === '/integrations/zapier/actions' && $method === 'GET') return IntegrationsController::getZapierActions();
    
    // Webhook test endpoint (for testing configured webhooks)
    if ($path === '/webhooks/test' && $method === 'POST') {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $event = $body['event'] ?? 'test';
        $data = $body['data'] ?? ['message' => 'Test webhook from Xordon'];
        $results = WebhookService::dispatch($userId, $event, $data);
        Response::json(['success' => true, 'results' => $results]);
        return;
    }

    // Follow-up Automations (outcome-based automation rules)
    if ($path === '/automations' && $method === 'GET') return FollowUpAutomationsController::index();
    if ($path === '/automations' && $method === 'POST') return FollowUpAutomationsController::create();
    if ($path === '/automations/options' && $method === 'GET') return FollowUpAutomationsController::options();
    if (preg_match('#^/automations/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return FollowUpAutomationsController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return FollowUpAutomationsController::update($id);
        if ($method === 'DELETE') return FollowUpAutomationsController::delete($id);
    }
    if (preg_match('#^/automations/([^/]+)/toggle$#', $path, $m) && $method === 'POST') {
        return FollowUpAutomationsController::toggle($m[1]);
    }
    if (preg_match('#^/automations/([^/]+)/executions$#', $path, $m) && $method === 'GET') {
        return FollowUpAutomationsController::executions($m[1]);
    }

    // Call Dispositions (outcome types for calls)
    if ($path === '/call-dispositions' && $method === 'GET') return CallDispositionsController::index();
    if ($path === '/call-dispositions' && $method === 'POST') return CallDispositionsController::create();
    if (preg_match('#^/call-dispositions/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'PUT' || $method === 'PATCH') return CallDispositionsController::update($id);
        if ($method === 'DELETE') return CallDispositionsController::delete($id);
    }

    // Contact Outcomes (tracking interaction outcomes)
    if ($path === '/contact-outcomes' && $method === 'GET') return ContactOutcomesController::index();
    if ($path === '/contact-outcomes' && $method === 'POST') return ContactOutcomesController::create();
    if ($path === '/contact-outcomes/stats' && $method === 'GET') return ContactOutcomesController::stats();
    if ($path === '/contact-outcomes/call-disposition' && $method === 'POST') return ContactOutcomesController::recordCallDisposition();

    // Sentiment Configuration (intelligent analysis settings)
    if ($path === '/sentiment-config' && $method === 'GET') return SentimentConfigController::index();
    if ($path === '/sentiment-config' && $method === 'PUT') return SentimentConfigController::update();
    if ($path === '/sentiment-config/keywords' && $method === 'POST') return SentimentConfigController::addKeywords();
    if ($path === '/sentiment-config/keywords' && $method === 'DELETE') return SentimentConfigController::removeKeywords();

    // Sentiment Analysis API (intelligent analysis endpoints)
    if ($path === '/analyze/sentiment' && $method === 'POST') return SentimentAnalysisController::analyzeSentiment();
    if ($path === '/analyze/intent' && $method === 'POST') return SentimentAnalysisController::analyzeIntent();
    if ($path === '/analyze/batch' && $method === 'POST') return SentimentAnalysisController::batchAnalyze();
    if (preg_match('#^/contacts/(\d+)/sentiment-history$#', $path, $m) && $method === 'GET') {
        return SentimentAnalysisController::getSentimentHistory((int)$m[1]);
    }
    if (preg_match('#^/contacts/(\d+)/intent-history$#', $path, $m) && $method === 'GET') {
        return SentimentAnalysisController::getIntentHistory((int)$m[1]);
    }
    if (preg_match('#^/contacts/(\d+)/analysis-summary$#', $path, $m) && $method === 'GET') {
        return SentimentAnalysisController::getAnalysisSummary((int)$m[1]);
    }

    // ============================================
    // SYSTEM HEALTH & TOOLS
    // ============================================
    if ($path === '/system/health' && $method === 'GET') return SystemHealthController::getHealth();
    if ($path === '/system/connectivity' && $method === 'GET') return SystemHealthController::getConnectivity();
    if ($path === '/system/trends' && $method === 'GET') return SystemHealthController::getTrends();
    if ($path === '/system/security/events' && $method === 'GET') return SystemHealthController::getSecurityEvents();
    if ($path === '/system/security/stats' && $method === 'GET') return SystemHealthController::getSecurityStats();
    if ($path === '/system/performance/live' && $method === 'GET') return SystemHealthController::getPerformanceMetrics();
    if ($path === '/system/connectivity/check' && $method === 'POST') return SystemHealthController::checkExternalConnectivity();
    if ($path === '/system/database/insights' && $method === 'GET') return SystemHealthController::getDatabaseInsights();
    if ($path === '/system/scheduler/status' && $method === 'GET') return SystemHealthController::getSchedulerStatus();
    if ($path === '/system/diagnostics' && $method === 'POST') return SystemHealthController::runDiagnostics();
    if ($path === '/system/fix' && $method === 'POST') return SystemHealthController::fixIssue();
    if ($path === '/system/cache/clear' && $method === 'POST') return SystemHealthController::clearCache();
    if ($path === '/system/database/optimize' && $method === 'POST') return SystemHealthController::optimizeDatabase();

    // Comprehensive Health - Phase 2
    if ($path === '/system/traffic/analytics' && $method === 'GET') return SystemHealthController::getTrafficAnalytics();
    if ($path === '/system/business/health' && $method === 'GET') return SystemHealthController::getBusinessHealth();
    if ($path === '/system/database/internals' && $method === 'GET') return SystemHealthController::getDatabaseInternals();
    if ($path === '/system/alerts' && $method === 'GET') return SystemHealthController::getAlerts();
    if (preg_match('#^/system/alerts/(\d+)/(.+)$#', $path, $m) && $method === 'POST') return SystemHealthController::updateAlert((int)$m[1]);
    if ($path === '/system/trends/detailed' && $method === 'GET') return SystemHealthController::getDetailedTrends();
    if ($path === '/system/health/migrate' && $method === 'POST') return SystemHealthController::runMigration();
    if ($path === '/system/health/snapshot' && $method === 'POST') return SystemHealthController::takeSnapshot();
    if ($path === '/system/health/prune' && $method === 'POST') return SystemHealthController::pruneOldData();

    // System Tools
    if ($path === '/system/tools/logs' && $method === 'GET') return SystemToolsController::getLogs();
    if ($path === '/system/tools/cache' && $method === 'GET') return SystemToolsController::getCacheKeys();
    if (preg_match('#^/system/tools/cache/(.+)$#', $path, $m) && $method === 'DELETE') return SystemToolsController::deleteCacheKey($m[1]);
    if ($path === '/system/tools/maintenance' && ($method === 'GET' || $method === 'POST')) return SystemToolsController::maintenanceMode();
    if ($path === '/system/tools/test-email' && $method === 'POST') return SystemToolsController::testEmail();
    if ($path === '/system/tools/resources' && $method === 'GET') return SystemToolsController::getServerResources();
    if ($path === '/system/tools/client-errors' && $method === 'GET') return SystemHealthController::getClientErrors();
    if ($path === '/system/tools/client-errors' && $method === 'POST') return SystemHealthController::logClientError();

    // ============================================
    // ADS MANAGER ROUTES
    // ============================================
    
    // Ad Accounts
    if ($path === '/ads/accounts' && $method === 'GET') return AdsController::getAccounts();
    if (preg_match('#^/ads/accounts/(\d+)/disconnect$#', $path, $m) && $method === 'POST') {
        return AdsController::disconnectAccount($m[1]);
    }

    // Ad Campaigns
    if ($path === '/ads/campaigns' && $method === 'GET') return AdsController::getCampaigns();
    if ($path === '/ads/campaigns' && $method === 'POST') return AdsController::createCampaign();
    if ($path === '/ads/campaigns/sync' && $method === 'POST') return AdsController::syncCampaigns();
    if (preg_match('#^/ads/campaigns/(\d+)$#', $path, $m)) {
        if ($method === 'GET') return AdsController::getCampaign($m[1]);
        if ($method === 'PUT' || $method === 'PATCH') return AdsController::updateCampaign($m[1]);
        if ($method === 'DELETE') return AdsController::deleteCampaign($m[1]);
    }
    if (preg_match('#^/ads/campaigns/(\d+)/metrics$#', $path, $m) && $method === 'GET') {
        return AdsController::getCampaignMetrics($m[1]);
    }

    // Ad Budgets
    if ($path === '/ads/budgets' && $method === 'GET') return AdsController::getBudgets();
    if ($path === '/ads/budgets' && $method === 'POST') return AdsController::createBudget();
    if (preg_match('#^/ads/budgets/(\d+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'PUT' || $method === 'PATCH') return AdsController::updateBudget($id);
        if ($method === 'DELETE') return AdsController::deleteBudget($id);
    }

    // Ad Conversions
    if ($path === '/ads/conversions' && $method === 'GET') return AdsController::getConversions();
    if ($path === '/ads/conversions' && $method === 'POST') return AdsController::trackConversion();
    
    // Ad Analytics
    if ($path === '/ads/analytics' && $method === 'GET') return AdsController::getAnalytics();

    // A/B Testing
    if ($path === '/ads/ab-tests' && $method === 'GET') return AdsController::getABTests();
    if ($path === '/ads/ab-tests' && $method === 'POST') return AdsController::createABTest();
    if (preg_match('#^/ads/ab-tests/(\d+)$#', $path, $m) && $method === 'DELETE') {
        return AdsController::deleteABTest($m[1]);
    }
    
    // Ad OAuth
    if (preg_match('#^/ads/oauth/([^/]+)(/callback)?$#', $path, $m)) {
        // Mock successful connection/callback
        if (strpos($path, 'callback') !== false) {
             Response::json(['success' => true, 'message' => 'Account connected successfully']);
        } else {
             // Initiate - in a real app this redirects. 
             // For the SPA popup flow, we return a URL or just success if it's a direct link.
             // The frontend expects a URL to open in a popup? 
             // Frontend: `window.open('/api/ads/oauth/' + platformId, ...)`
             // So this endpoint should REDIRECT or output HTML.
             // Since we are mocking, let's output a script that posts a message back to opener.
             echo "<script>window.opener.postMessage({ type: 'AD_ACCOUNT_CONNECTED', platform: '{$m[1]}' }, '*'); window.close();</script>";
             exit;
        }
    }

    // CRM Enhancement Routes (with RBAC middleware applied in controllers)
    
    // Pipeline Routes
    if ($path === '/pipeline' && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/PipelineController.php';
        return (new \App\Controllers\PipelineController())->index();
    }
    if ($path === '/pipeline/forecast' && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/PipelineController.php';
        return (new \App\Controllers\PipelineController())->getForecast();
    }
    if ($path === '/pipeline/velocity' && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/PipelineController.php';
        return (new \App\Controllers\PipelineController())->getVelocity();
    }
    if ($path === '/pipeline/probabilities' && $method === 'PUT') {
        require_once __DIR__ . '/../src/controllers/PipelineController.php';
        return (new \App\Controllers\PipelineController())->updateProbabilities();
    }

    // Playbook Routes
    if ($path === '/playbooks' && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/PlaybookController.php';
        return (new \App\Controllers\PlaybookController())->index();
    }
    if ($path === '/playbooks' && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/PlaybookController.php';
        return (new \App\Controllers\PlaybookController())->create();
    }
    if (preg_match('#^/playbooks/(\d+)$#', $path, $m)) {
        require_once __DIR__ . '/../src/controllers/PlaybookController.php';
        $controller = new \App\Controllers\PlaybookController();
        if ($method === 'GET') return $controller->show((int)$m[1]);
        if ($method === 'PUT') return $controller->update((int)$m[1]);
        if ($method === 'DELETE') return $controller->delete((int)$m[1]);
    }
    if (preg_match('#^/playbooks/(\d+)/versions$#', $path, $m) && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/PlaybookController.php';
        return (new \App\Controllers\PlaybookController())->getVersions((int)$m[1]);
    }

    // Notification Routes
    if ($path === '/notifications/configure' && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/NotificationController.php';
        return (new \App\Controllers\NotificationController())->configure();
    }
    if ($path === '/notifications/send' && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/NotificationController.php';
        return (new \App\Controllers\NotificationController())->send();
    }
    if ($path === '/notifications/action' && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/NotificationController.php';
        return (new \App\Controllers\NotificationController())->handleAction();
    }
    if ($path === '/notifications/config' && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/NotificationController.php';
        return (new \App\Controllers\NotificationController())->getConfig();
    }
    if (preg_match('#^/notifications/status/(\d+)$#', $path, $m) && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/NotificationController.php';
        return (new \App\Controllers\NotificationController())->getStatus((int)$m[1]);
    }

    // Attribution Routes
    if ($path === '/attribution/report' && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/AttributionController.php';
        return (new \App\Controllers\AttributionController())->getReport();
    }
    if ($path === '/attribution/sources' && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/AttributionController.php';
        return (new \App\Controllers\AttributionController())->getSources();
    }
    if ($path === '/attribution/models' && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/AttributionController.php';
        return (new \App\Controllers\AttributionController())->getModels();
    }
    if (preg_match('#^/contacts/(\d+)/journey$#', $path, $m) && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/AttributionController.php';
        return (new \App\Controllers\AttributionController())->getJourney((int)$m[1]);
    }
    if (preg_match('#^/contacts/(\d+)/touchpoint$#', $path, $m) && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/AttributionController.php';
        return (new \App\Controllers\AttributionController())->addTouchpoint((int)$m[1]);
    }

    // CRM Automation Routes (advanced automation engine)
    if ($path === '/crm/automations' && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/AutomationController.php';
        return (new AutomationController())->index();
    }
    if ($path === '/crm/automations' && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/AutomationController.php';
        return (new AutomationController())->create();
    }
    if ($path === '/crm/automations/triggers' && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/AutomationController.php';
        return (new AutomationController())->getTriggers();
    }
    if ($path === '/crm/automations/actions' && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/AutomationController.php';
        return (new AutomationController())->getActions();
    }
    if (preg_match('#^/crm/automations/(\d+)$#', $path, $m)) {
        require_once __DIR__ . '/../src/controllers/AutomationController.php';
        $controller = new AutomationController();
        if ($method === 'GET') return $controller->show((int)$m[1]);
        if ($method === 'PUT') return $controller->update((int)$m[1]);
        if ($method === 'DELETE') return $controller->delete((int)$m[1]);
    }
    if (preg_match('#^/crm/automations/(\d+)/logs$#', $path, $m) && $method === 'GET') {
        require_once __DIR__ . '/../src/controllers/AutomationController.php';
        return (new AutomationController())->getLogs((int)$m[1]);
    }
    if (preg_match('#^/crm/automations/(\d+)/toggle$#', $path, $m) && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/AutomationController.php';
        return (new AutomationController())->toggle((int)$m[1]);
    }

    // ==================== PROJECTS & TASKS ====================
    // Projects Routes
    if ($path === '/projects' && $method === 'GET') return ProjectsController::index();
    if ($path === '/projects' && $method === 'POST') return ProjectsController::create();
    if (preg_match('#^/projects/(\d+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return ProjectsController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return ProjectsController::update($id);
        if ($method === 'DELETE') return ProjectsController::delete($id);
    }
    if (preg_match('#^/projects/(\d+)/tasks$#', $path, $m) && $method === 'GET') {
        return ProjectsController::getTasks($m[1]);
    }
    if (preg_match('#^/projects/(\d+)/activity$#', $path, $m) && $method === 'GET') {
        return ProjectsController::getActivity($m[1]);
    }
    if (preg_match('#^/projects/(\d+)/members$#', $path, $m) && $method === 'POST') {
        return ProjectsController::addMember($m[1]);
    }
    if (preg_match('#^/projects/(\d+)/members/(\d+)$#', $path, $m) && $method === 'DELETE') {
        return ProjectsController::removeMember($m[1], $m[2]);
    }

    // Tasks Routes
    if ($path === '/tasks' && $method === 'GET') return TasksController::index();
    if ($path === '/tasks' && $method === 'POST') return TasksController::create();
    if ($path === '/tasks/today' && $method === 'GET') return TasksController::getToday();
    if ($path === '/tasks/types' && $method === 'GET') return TasksController::getTypes();
    if ($path === '/tasks/bulk' && $method === 'POST') return TasksController::bulkUpdate();
    if ($path === '/tasks/daily-goals' && $method === 'GET') return TasksController::getDailyGoals();
    if ($path === '/tasks/daily-goals' && $method === 'POST') return TasksController::updateDailyGoals();
    if (preg_match('#^/tasks/(\d+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return TasksController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return TasksController::update($id);
        if ($method === 'DELETE') return TasksController::delete($id);
    }
    if (preg_match('#^/tasks/(\d+)/complete$#', $path, $m) && $method === 'POST') {
        return TasksController::complete($m[1]);
    }

    // CRM Tasks Routes (for backward compatibility)
    if ($path === '/crm/tasks' && $method === 'GET') return CRMController::getTasks();
    if ($path === '/crm/tasks' && $method === 'POST') return CRMController::createTask();
    if (preg_match('#^/crm/tasks/(\d+)/status$#', $path, $m) && $method === 'PUT') {
        return CRMController::updateTaskStatus((int)$m[1]);
    }

    // Proposal Routes
    if ($path === '/proposals' && $method === 'GET') return ProposalsController::getAll();
    if ($path === '/proposals' && $method === 'POST') return ProposalsController::create();
    if ($path === '/proposals/stats' && $method === 'GET') return ProposalsController::getStats();
    if (preg_match('#^/proposals/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return ProposalsController::getOne($id);
        if ($method === 'PUT' || $method === 'PATCH') return ProposalsController::update($id);
        if ($method === 'DELETE') return ProposalsController::delete($id);
    }
    if (preg_match('#^/proposals/(\d+)/duplicate$#', $path, $m) && $method === 'POST') {
        return ProposalsController::duplicate((int)$m[1]);
    }
    if (preg_match('#^/proposals/(\d+)/send$#', $path, $m) && $method === 'POST') {
        return ProposalsController::send((int)$m[1]);
    }
    if (preg_match('#^/proposals/(\d+)/comments$#', $path, $m) && $method === 'POST') {
        return ProposalsController::addComment((int)$m[1]);
    }
    
    // Public Proposal Routes (no auth required)
    if (preg_match('#^/proposals/public/([^/]+)$#', $path, $m) && $method === 'GET') {
        return ProposalsController::getPublic($m[1]);
    }
    if (preg_match('#^/proposals/public/([^/]+)/accept$#', $path, $m) && $method === 'POST') {
        return ProposalsController::acceptPublic($m[1]);
    }
    if (preg_match('#^/proposals/public/([^/]+)/decline$#', $path, $m) && $method === 'POST') {
        return ProposalsController::declinePublic($m[1]);
    }
    
    // Proposal Templates Routes
    if ($path === '/proposal-templates' && $method === 'GET') return ProposalTemplatesController::getAll();
    if ($path === '/proposal-templates' && $method === 'POST') return ProposalTemplatesController::create();
    if ($path === '/proposal-templates/categories' && $method === 'GET') return ProposalTemplatesController::getCategories();
    if (preg_match('#^/proposal-templates/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return ProposalTemplatesController::getOne($id);
        if ($method === 'PUT' || $method === 'PATCH') return ProposalTemplatesController::update($id);
        if ($method === 'DELETE') return ProposalTemplatesController::delete($id);
    }
    if (preg_match('#^/proposal-templates/(\d+)/duplicate$#', $path, $m) && $method === 'POST') {
        return ProposalTemplatesController::duplicate((int)$m[1]);
    }
    
    // Proposal Settings Routes
    if ($path === '/proposal-settings' && $method === 'GET') return ProposalSettingsController::get();
    if ($path === '/proposal-settings' && ($method === 'PUT' || $method === 'PATCH')) return ProposalSettingsController::update();

    // Payments Routes
    if ($path === '/payments/products' && $method === 'GET') return PaymentsController::getProducts();
    if ($path === '/payments/products' && $method === 'POST') return PaymentsController::createProduct();
    if (preg_match('#^/payments/products/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return PaymentsController::getProduct($id);
        if ($method === 'PUT' || $method === 'PATCH') return PaymentsController::updateProduct($id);
        if ($method === 'DELETE') return PaymentsController::deleteProduct($id);
    }
    if ($path === '/payments/invoices' && $method === 'GET') return PaymentsController::getInvoices();
    if ($path === '/payments/invoices' && $method === 'POST') return PaymentsController::createInvoice();
    if (preg_match('#^/payments/invoices/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return PaymentsController::getInvoice($id);
        if ($method === 'PUT' || $method === 'PATCH') return PaymentsController::updateInvoice($id);
        if ($method === 'DELETE') return PaymentsController::deleteInvoice($id);
    }
    if (preg_match('#^/payments/invoices/([^/]+)/send$#', $path, $m) && $method === 'POST') {
        return PaymentsController::sendInvoice($m[1]);
    }
    if ($path === '/payments/payments' && $method === 'GET') return PaymentsController::getPayments();
    if ($path === '/payments/payments' && $method === 'POST') return PaymentsController::recordPayment();
    if (preg_match('#^/payments/payments/([^/]+)/refund$#', $path, $m) && $method === 'POST') {
        return PaymentsController::refundPayment($m[1]);
    }
    if ($path === '/payments/settings' && $method === 'GET') return PaymentsController::getSettings();
    if ($path === '/payments/settings' && ($method === 'PUT' || $method === 'PATCH' || $method === 'POST')) return PaymentsController::updateSettings();
    if ($path === '/payments/dashboard-stats' && $method === 'GET') return PaymentsController::getDashboardStats();

    // Appointments Routes
    if ($path === '/appointments/booking-types' && $method === 'GET') return AppointmentsController::getBookingTypes();
    if ($path === '/appointments/booking-types' && $method === 'POST') return AppointmentsController::createBookingType();
    if (preg_match('#^/appointments/booking-types/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return AppointmentsController::getBookingType($id);
        if ($method === 'PUT' || $method === 'PATCH') return AppointmentsController::updateBookingType($id);
        if ($method === 'DELETE') return AppointmentsController::deleteBookingType($id);
    }
    if ($path === '/appointments/availability' && $method === 'GET') return AppointmentsController::getAvailability();
    if ($path === '/appointments/availability' && ($method === 'POST' || $method === 'PUT')) return AppointmentsController::saveAvailability();
    if ($path === '/appointments/availability/overrides' && $method === 'POST') return AppointmentsController::addOverride();
    if (preg_match('#^/appointments/availability/overrides/([^/]+)$#', $path, $m) && $method === 'DELETE') {
        return AppointmentsController::deleteOverride($m[1]);
    }
    if ($path === '/appointments/booking-page-settings' && $method === 'GET') return AppointmentsController::getBookingPageSettings();
    if ($path === '/appointments/booking-page-settings' && ($method === 'POST' || $method === 'PUT')) return AppointmentsController::updateBookingPageSettings();
    if ($path === '/appointments' && $method === 'GET') return AppointmentsController::getAppointments();
    if ($path === '/appointments' && $method === 'POST') return AppointmentsController::createAppointment();
    if ($path === '/appointments/dashboard-stats' && $method === 'GET') return AppointmentsController::getDashboardStats();
    
    // Appointment automation & widget routes (must be before generic /appointments/:id pattern)
    if ($path === '/appointments/generate-booking-link' && $method === 'POST') return AppointmentsController::generateBookingLink();
    if ($path === '/appointments/widget-code' && $method === 'GET') return AppointmentsController::getWidgetCode();
    if ($path === '/appointments/process-reminders' && $method === 'POST') return AppointmentsController::getAppointmentsNeedingReminders();
    if ($path === '/appointments/process-starting-soon' && $method === 'POST') return AppointmentsController::getAppointmentsStartingSoon();
    
    // Generic appointment routes
    if (preg_match('#^/appointments/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return AppointmentsController::getAppointment($id);
        if ($method === 'PUT' || $method === 'PATCH') return AppointmentsController::updateAppointment($id);
        if ($method === 'DELETE') return AppointmentsController::deleteAppointment($id);
    }
    if (preg_match('#^/appointments/([^/]+)/cancel$#', $path, $m) && $method === 'POST') {
        return AppointmentsController::cancelAppointment($m[1]);
    }
    if (preg_match('#^/appointments/([^/]+)/reschedule$#', $path, $m) && $method === 'POST') {
        return AppointmentsController::rescheduleAppointment($m[1]);
    }

    // Public booking routes (no auth required)
    if (preg_match('#^/public/booking/([^/]+)$#', $path, $m) && $method === 'GET') {
        return AppointmentsController::getPublicBookingPageList($m[1]);
    }
    if (preg_match('#^/public/booking/([^/]+)/([^/]+)$#', $path, $m) && $method === 'GET') {
        return AppointmentsController::getPublicBookingPage($m[1], $m[2]);
    }
    if (preg_match('#^/public/booking/([^/]+)/([^/]+)/slots$#', $path, $m) && $method === 'GET') {
        return AppointmentsController::getAvailableSlots($m[1], $m[2]);
    }
    if (preg_match('#^/public/booking/([^/]+)/([^/]+)/book$#', $path, $m) && $method === 'POST') {
        return AppointmentsController::bookPublicAppointment($m[1], $m[2]);
    }

    // Phone Numbers & Telephony Routes
    if ($path === '/phone-numbers' && $method === 'GET') return PhoneNumbersController::getPhoneNumbers();
    if ($path === '/phone-numbers/active' && $method === 'GET') return PhoneNumbersController::getActivePhoneNumbers();
    if ($path === '/phone-numbers' && $method === 'POST') return PhoneNumbersController::purchaseNumber();
    if ($path === '/phone-numbers/sync-from-connection' && $method === 'POST') return PhoneNumbersController::syncFromConnection();
    if ($path === '/phone-numbers/search' && $method === 'GET') return PhoneNumbersController::searchAvailableNumbers();
    if ($path === '/phone-numbers/bulk' && $method === 'PUT') return PhoneNumbersController::bulkUpdatePhoneNumbers();
    if (preg_match('#^/phone-numbers/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return PhoneNumbersController::getPhoneNumber($id);
        if ($method === 'PUT' || $method === 'PATCH') return PhoneNumbersController::updatePhoneNumber($id);
        if ($method === 'DELETE') return PhoneNumbersController::releaseNumber($id);
    }
    if (preg_match('#^/phone-numbers/([^/]+)/routing-rules$#', $path, $m)) {
        $phoneId = $m[1];
        if ($method === 'GET') return PhoneNumbersController::getRoutingRules($phoneId);
        if ($method === 'POST') return PhoneNumbersController::createRoutingRule($phoneId);
    }
    if (preg_match('#^/phone-numbers/([^/]+)/routing-rules/([^/]+)$#', $path, $m)) {
        $phoneId = $m[1];
        $ruleId = $m[2];
        if ($method === 'PUT' || $method === 'PATCH') return PhoneNumbersController::updateRoutingRule($phoneId, $ruleId);
        if ($method === 'DELETE') return PhoneNumbersController::deleteRoutingRule($phoneId, $ruleId);
    }
    if ($path === '/phone/voicemails' && $method === 'GET') return PhoneNumbersController::getVoicemails();
    if (preg_match('#^/phone/voicemails/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return PhoneNumbersController::getVoicemail($id);
        if ($method === 'PUT' || $method === 'PATCH') return PhoneNumbersController::updateVoicemail($id);
        if ($method === 'DELETE') return PhoneNumbersController::deleteVoicemail($id);
    }
    if ($path === '/phone/call-logs' && $method === 'GET') return PhoneNumbersController::getCallLogs();
    if (preg_match('#^/phone/call-logs/([^/]+)$#', $path, $m) && $method === 'GET') {
        return PhoneNumbersController::getCallLog($m[1]);
    }
    if ($path === '/phone/sms-conversations' && $method === 'GET') return PhoneNumbersController::getSMSConversations();
    if (preg_match('#^/phone/sms-conversations/([^/]+)$#', $path, $m) && $method === 'GET') {
        return PhoneNumbersController::getSMSConversation($m[1]);
    }
    if ($path === '/phone/sms' && $method === 'POST') return PhoneNumbersController::sendSMS();
    if ($path === '/phone/settings' && $method === 'GET') return PhoneNumbersController::getSettings();
    if ($path === '/phone/settings' && ($method === 'PUT' || $method === 'PATCH')) return PhoneNumbersController::updateSettings();
    if ($path === '/phone/dashboard-stats' && $method === 'GET') return PhoneNumbersController::getDashboardStats();
    if ($path === '/analytics/calls' && $method === 'GET') return CallAnalyticsController::getAnalytics();
    
    // External Phone Webhooks (Accessible by SignalWire/Twilio)
    if (preg_match('#^/phone/voice/([^/]+)$#', $path, $m)) {
        return PhoneNumbersController::handleVoiceWebhook($m[1]);
    }
    if (preg_match('#^/phone/sms/([^/]+)$#', $path, $m)) {
        return PhoneNumbersController::handleSMSWebhook($m[1]);
    }
    if (preg_match('#^/phone/ivr-callback/(\d+)$#', $path, $m)) {
        header('Content-Type: text/xml');
        echo \Xordon\Services\IVREngineService::execute((int)$m[1], $_GET['nodeId'] ?? null, array_merge($_GET, $_POST));
        return;
    }
    if (preg_match('#^/phone/status/([^/]+)$#', $path, $m)) {
        // Handle status callback if needed
        Response::json(['status' => 'received']);
        return;
    }

    // Reports & Analytics Routes
    if ($path === '/reports' && $method === 'GET') return ReportsController::getReports();
    if ($path === '/reports' && $method === 'POST') return ReportsController::createReport();
    if (preg_match('#^/reports/(\d+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return ReportsController::getReport($id);
        if ($method === 'PUT' || $method === 'PATCH') return ReportsController::updateReport($id);
        if ($method === 'DELETE') return ReportsController::deleteReport($id);
    }
    if (preg_match('#^/reports/(\d+)/run$#', $path, $m) && $method === 'GET') {
        return ReportsController::runReport($m[1]);
    }
    if ($path === '/dashboards' && $method === 'GET') return ReportsController::getDashboards();
    if ($path === '/dashboards' && $method === 'POST') return ReportsController::createDashboard();
    if (preg_match('#^/dashboards/(\d+)$#', $path, $m) && $method === 'GET') {
        return ReportsController::getDashboard($m[1]);
    }
    if ($path === '/goals' && $method === 'GET') return ReportsController::getGoals();
    if ($path === '/goals' && $method === 'POST') return ReportsController::createGoal();
    if ($path === '/reports/overview-stats' && $method === 'GET') return ReportsController::getOverviewStats();

    // Campaign Flows Routes
    if (str_starts_with($path, '/flows')) {
        $flowPath = substr($path, 6); // Remove '/flows' prefix
        $_GET['path'] = ltrim($flowPath, '/');
        return require __DIR__ . '/api/flows.php';
    }

    // Industry Features Routes
    if (str_starts_with($path, '/industry')) {
        $industryPath = substr($path, 9); // Remove '/industry' prefix
        $_GET['path'] = ltrim($industryPath, '/');
        return require __DIR__ . '/api/industry.php';
    }

    // ==================== AGENCY MULTI-TENANT ROUTES ====================
    if ($path === '/agency/clients' && $method === 'GET') return AgencyController::getClients();
    if ($path === '/agency/clients' && $method === 'POST') return AgencyController::createClient();
    if ($path === '/agency/analytics' && $method === 'GET') return AgencyController::getCrossClientAnalytics();
    if ($path === '/agency/reports' && $method === 'GET') return AgencyController::getReports();
    if ($path === '/agency/reports' && $method === 'POST') return AgencyController::createReport();
    if (preg_match('#^/agency/clients/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return AgencyController::getClient($id);
        if ($method === 'PUT' || $method === 'PATCH') return AgencyController::updateClient($id);
        if ($method === 'DELETE') return AgencyController::deleteClient($id);
    }

    // ==================== A/B TESTING ROUTES ====================
    if ($path === '/ab-tests' && $method === 'GET') return ABTestingController::index();
    if ($path === '/ab-tests' && $method === 'POST') return ABTestingController::create();
    if ($path === '/ab-tests/dev/seed' && $method === 'POST') return ABTestingController::devSeed();
    if (preg_match('#^/ab-tests/([^/]+)/start$#', $path, $m) && $method === 'POST') {
        return ABTestingController::start($m[1]);
    }
    if (preg_match('#^/ab-tests/([^/]+)/stop$#', $path, $m) && $method === 'POST') {
        return ABTestingController::stop($m[1]);
    }
    if (preg_match('#^/ab-tests/([^/]+)/winner$#', $path, $m) && $method === 'POST') {
        return ABTestingController::selectWinner($m[1]);
    }
    if (preg_match('#^/ab-tests/([^/]+)/variants/([^/]+)$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return ABTestingController::updateVariant($m[1], $m[2]);
    }
    if (preg_match('#^/ab-tests/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return ABTestingController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return ABTestingController::update($id);
        if ($method === 'DELETE') return ABTestingController::delete($id);
    }

    // ==================== SEND TIME OPTIMIZATION ROUTES ====================
    if ($path === '/send-time/optimal' && $method === 'GET') return SendTimeController::getOptimalTimes();
    if ($path === '/send-time/timezones' && $method === 'GET') return SendTimeController::getTimezones();
    if ($path === '/send-time/record' && $method === 'POST') return SendTimeController::recordEngagement();
    if (preg_match('#^/send-time/contacts/([^/]+)$#', $path, $m) && $method === 'GET') {
        return SendTimeController::getContactAnalytics($m[1]);
    }
    if (preg_match('#^/send-time/contacts/([^/]+)/optimal$#', $path, $m) && $method === 'GET') {
        return SendTimeController::calculateOptimalTime($m[1]);
    }
    if (preg_match('#^/send-time/campaigns/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return SendTimeController::getCampaignSettings($id);
        if ($method === 'POST' || $method === 'PUT') return SendTimeController::saveCampaignSettings($id);
    }

    // ==================== AUTOMATION QUEUE ROUTES ====================
    require_once __DIR__ . '/../src/controllers/AutomationQueueController.php';
    if ($path === '/automation-queue' && $method === 'GET') return AutomationQueueController::index();
    if ($path === '/automation-queue' && $method === 'POST') return AutomationQueueController::create();
    if ($path === '/automation-queue/process' && $method === 'POST') return AutomationQueueController::process();
    if ($path === '/automation-queue/stats' && $method === 'GET') return AutomationQueueController::stats();
    if ($path === '/automation-queue/logs' && $method === 'GET') return AutomationQueueController::logs();
    if (preg_match('#^/automation-queue/([^/]+)/cancel$#', $path, $m) && $method === 'POST') {
        return AutomationQueueController::cancel($m[1]);
    }
    if (preg_match('#^/automation-queue/([^/]+)/retry$#', $path, $m) && $method === 'POST') {
        return AutomationQueueController::retry($m[1]);
    }

    // ==================== AUTOMATION RECIPES ROUTES ====================
    if ($path === '/automation-recipes' && $method === 'GET') return AutomationRecipesController::index();
    if ($path === '/automation-recipes' && $method === 'POST') return AutomationRecipesController::create();
    if ($path === '/automation-recipes/categories' && $method === 'GET') return AutomationRecipesController::getCategories();
    if ($path === '/automation-recipes/instances' && $method === 'GET') return AutomationRecipesController::getInstances();
    if (preg_match('#^/automation-recipes/([^/]+)/install$#', $path, $m) && $method === 'POST') {
        return AutomationRecipesController::install($m[1]);
    }
    if (preg_match('#^/automation-recipes/instances/([^/]+)$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return AutomationRecipesController::updateInstance($m[1]);
    }
    if (preg_match('#^/automation-recipes/instances/([^/]+)$#', $path, $m) && $method === 'DELETE') {
        return AutomationRecipesController::deleteInstance($m[1]);
    }
    if (preg_match('#^/automation-recipes/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return AutomationRecipesController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return AutomationRecipesController::update($id);
        if ($method === 'DELETE') return AutomationRecipesController::delete($id);
    }

    // ==================== ECOMMERCE ROUTES ====================
    if ($path === '/ecommerce/dashboard' && $method === 'GET') return EcommerceController::getDashboard();
    if ($path === '/ecommerce/stores' && $method === 'GET') return EcommerceController::getStores();
    if ($path === '/ecommerce/stores' && $method === 'POST') return EcommerceController::createStore();
    if ($path === '/ecommerce/orders' && $method === 'GET') return EcommerceController::getOrders();
    if ($path === '/ecommerce/abandoned-carts' && $method === 'GET') return EcommerceController::getAbandonedCarts();
    if ($path === '/ecommerce/revenue-attribution' && $method === 'GET') return EcommerceController::getRevenueAttribution();
    if (preg_match('#^/ecommerce/stores/([^/]+)/sync$#', $path, $m) && $method === 'POST') {
        return EcommerceController::syncStore($m[1]);
    }
    if (preg_match('#^/ecommerce/stores/([^/]+)/products$#', $path, $m) && $method === 'GET') {
        return EcommerceController::getProducts($m[1]);
    }
    if (preg_match('#^/ecommerce/stores/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return EcommerceController::getStore($id);
        if ($method === 'PUT' || $method === 'PATCH') return EcommerceController::updateStore($id);
        if ($method === 'DELETE') return EcommerceController::deleteStore($id);
    }
    if (preg_match('#^/ecommerce/orders/([^/]+)$#', $path, $m) && $method === 'GET') {
        return EcommerceController::getOrder($m[1]);
    }
    if (preg_match('#^/ecommerce/abandoned-carts/([^/]+)/recover$#', $path, $m) && $method === 'POST') {
        return EcommerceController::sendCartRecovery($m[1]);
    }

    // ==================== REVIEWS MANAGEMENT ROUTES ====================
    if ($path === '/reviews/dashboard' && $method === 'GET') return ReviewsController::getDashboard();
    if ($path === '/reviews/reputation-score' && $method === 'GET') return ReviewsController::getReputationScore();
    if ($path === '/reviews/platforms' && $method === 'GET') return ReviewsController::getPlatforms();
    if ($path === '/reviews/platforms' && $method === 'POST') return ReviewsController::createPlatform();
    if ($path === '/reviews' && $method === 'GET') return ReviewsController::getReviews();
    if ($path === '/reviews/requests' && $method === 'GET') return ReviewsController::getReviewRequests();
    if ($path === '/reviews/requests' && $method === 'POST') return ReviewsController::createReviewRequest();
    if ($path === '/reviews/templates' && $method === 'GET') return ReviewsController::getTemplates();
    if ($path === '/reviews/templates' && $method === 'POST') return ReviewsController::createTemplate();
    if (preg_match('#^/reviews/platforms/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'PUT' || $method === 'PATCH') return ReviewsController::updatePlatform($id);
        if ($method === 'DELETE') return ReviewsController::deletePlatform($id);
    }
    if (preg_match('#^/reviews/([^/]+)/respond$#', $path, $m) && $method === 'POST') {
        return ReviewsController::respondToReview($m[1]);
    }
    if (preg_match('#^/reviews/([^/]+)/status$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return ReviewsController::updateReviewStatus($m[1]);
    }
    if (preg_match('#^/reviews/requests/([^/]+)/send$#', $path, $m) && $method === 'POST') {
        return ReviewsController::sendReviewRequest($m[1]);
    }
    if (preg_match('#^/reviews/([^/]+)$#', $path, $m) && $method === 'GET') {
        return ReviewsController::getReview($m[1]);
    }

    // ==================== MESSAGING CHANNELS ROUTES ====================
    // WhatsApp Routes
    require_once __DIR__ . '/../src/controllers/WhatsAppController.php';
    if ($path === '/channels/whatsapp/accounts' && $method === 'GET') return WhatsAppController::getAccounts();
    if ($path === '/channels/whatsapp/connect' && $method === 'POST') return WhatsAppController::connect();
    if ($path === '/channels/whatsapp/settings' && $method === 'GET') return WhatsAppController::getSettings();
    if ($path === '/channels/whatsapp/settings' && ($method === 'PUT' || $method === 'PATCH')) return WhatsAppController::updateSettings();
    if ($path === '/channels/whatsapp/send' && $method === 'POST') return WhatsAppController::sendMessage();
    if ($path === '/channels/whatsapp/messages' && $method === 'GET') return WhatsAppController::getMessages();
    if ($path === '/channels/whatsapp/conversations' && $method === 'GET') return WhatsAppController::getConversations();
    if (preg_match('#^/channels/whatsapp/accounts/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return WhatsAppController::getAccount($id);
    }
    if (preg_match('#^/channels/whatsapp/accounts/([^/]+)/disconnect$#', $path, $m) && $method === 'POST') {
        return WhatsAppController::disconnect($m[1]);
    }
    if (preg_match('#^/channels/whatsapp/accounts/([^/]+)/templates$#', $path, $m) && $method === 'GET') {
        return WhatsAppController::getTemplates($m[1]);
    }
    if (preg_match('#^/channels/whatsapp/accounts/([^/]+)/templates/sync$#', $path, $m) && $method === 'POST') {
        return WhatsAppController::syncTemplates($m[1]);
    }
    if (preg_match('#^/channels/whatsapp/templates/([^/]+)/mappings$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return WhatsAppController::updateTemplateMappings($m[1]);
    }

    // Messenger Routes
    require_once __DIR__ . '/../src/controllers/MessengerController.php';
    if ($path === '/channels/messenger/accounts' && $method === 'GET') return MessengerController::getAccounts();
    if ($path === '/channels/messenger/connect' && $method === 'POST') return MessengerController::connect();
    if ($path === '/channels/messenger/send' && $method === 'POST') return MessengerController::sendMessage();
    if ($path === '/channels/messenger/send-quick-replies' && $method === 'POST') return MessengerController::sendQuickReplies();
    if ($path === '/channels/messenger/messages' && $method === 'GET') return MessengerController::getMessages();
    if ($path === '/channels/messenger/conversations' && $method === 'GET') return MessengerController::getConversations();
    if ($path === '/channels/messenger/settings' && $method === 'GET') return MessengerController::getSettings();
    if ($path === '/channels/messenger/settings' && ($method === 'PUT' || $method === 'PATCH')) return MessengerController::updateSettings();
    if (preg_match('#^/channels/messenger/accounts/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return MessengerController::getAccount($id);
    }
    if (preg_match('#^/channels/messenger/accounts/([^/]+)/disconnect$#', $path, $m) && $method === 'POST') {
        return MessengerController::disconnect($m[1]);
    }

    // LinkedIn Routes (Compliant - Tasks + Templates)
    require_once __DIR__ . '/../src/controllers/LinkedInController.php';
    if ($path === '/channels/linkedin/accounts' && $method === 'GET') return LinkedInController::getAccounts();
    if ($path === '/channels/linkedin/connect' && $method === 'POST') return LinkedInController::connect();
    if (preg_match('#^/channels/linkedin/accounts/([^/]+)/disconnect$#', $path, $m) && $method === 'POST') {
        return LinkedInController::disconnect($m[1]);
    }
    if ($path === '/channels/linkedin/tasks' && $method === 'GET') return LinkedInController::getTasks();
    if ($path === '/channels/linkedin/tasks' && $method === 'POST') return LinkedInController::createTask();
    if ($path === '/channels/linkedin/templates' && $method === 'GET') return LinkedInController::getTemplates();
    if ($path === '/channels/linkedin/templates' && $method === 'POST') return LinkedInController::createTemplate();
    if ($path === '/channels/linkedin/lead-forms' && $method === 'GET') return LinkedInController::getLeadForms();
    if ($path === '/channels/linkedin/settings' && $method === 'GET') return LinkedInController::getSettings();
    if ($path === '/channels/linkedin/settings' && ($method === 'PUT' || $method === 'PATCH')) return LinkedInController::updateSettings();
    if (preg_match('#^/channels/linkedin/tasks/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return LinkedInController::getTask($id);
        if ($method === 'PUT' || $method === 'PATCH') return LinkedInController::updateTask($id);
        if ($method === 'DELETE') return LinkedInController::deleteTask($id);
    }
    if (preg_match('#^/channels/linkedin/tasks/([^/]+)/complete$#', $path, $m) && $method === 'POST') {
        return LinkedInController::completeTask($m[1]);
    }
    if (preg_match('#^/channels/linkedin/templates/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return LinkedInController::getTemplate($id);
        if ($method === 'PUT' || $method === 'PATCH') return LinkedInController::updateTemplate($id);
        if ($method === 'DELETE') return LinkedInController::deleteTemplate($id);
    }
    if (preg_match('#^/channels/linkedin/templates/([^/]+)/render$#', $path, $m) && $method === 'POST') {
        return LinkedInController::renderTemplate($m[1]);
    }
    if (preg_match('#^/channels/linkedin/lead-forms/([^/]+)/leads$#', $path, $m) && $method === 'GET') {
        return LinkedInController::getLeads($m[1]);
    }
    if (preg_match('#^/channels/linkedin/leads/([^/]+)/sync$#', $path, $m) && $method === 'POST') {
        return LinkedInController::syncLead($m[1]);
    }

    // ==================== SOCIAL MEDIA SCHEDULER ROUTES ====================
    // Social Accounts
    if ($path === '/social/accounts' && $method === 'GET') return SocialController::getAccounts();
    if (preg_match('#^/social/accounts/(\d+)/disconnect$#', $path, $m) && $method === 'POST') {
        return SocialController::disconnectAccount((int)$m[1]);
    }

    // Social Posts
    if ($path === '/social/posts' && $method === 'GET') return SocialController::getPosts();
    if ($path === '/social/posts' && $method === 'POST') return SocialController::createPost();
    if (preg_match('#^/social/posts/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return SocialController::getPost($id);
        if ($method === 'PUT' || $method === 'PATCH') return SocialController::updatePost($id);
        if ($method === 'DELETE') return SocialController::deletePost($id);
    }
    if (preg_match('#^/social/posts/(\d+)/publish$#', $path, $m) && $method === 'POST') {
        return SocialController::publishPost((int)$m[1]);
    }

    // Social Templates
    if ($path === '/social/templates' && $method === 'GET') return SocialController::getTemplates();
    if ($path === '/social/templates' && $method === 'POST') return SocialController::createTemplate();

    // Social Advanced Features
    if ($path === '/social/bulk-import' && $method === 'POST') return SocialController::bulkImport();
    if ($path === '/social/ai/generate' && $method === 'POST') return SocialController::generateAIContent();
    if ($path === '/social/streams' && $method === 'GET') return SocialController::getStreams();
    if (preg_match('#^/social/oauth/([^/]+)$#', $path, $m) && $method === 'GET') {
        return SocialController::oauth($m[1]);
    }

    // Hashtag Groups
    if ($path === '/social/hashtag-groups' && $method === 'GET') return SocialController::getHashtagGroups();
    if ($path === '/social/hashtag-groups' && $method === 'POST') return SocialController::createHashtagGroup();

    // Social Categories
    if ($path === '/social/categories' && $method === 'GET') return SocialController::getCategories();
    if ($path === '/social/categories' && $method === 'POST') return SocialController::createCategory();

    // Social Analytics
    if ($path === '/social/analytics' && $method === 'GET') return SocialController::getAnalytics();

    // Meta Webhooks (WhatsApp + Messenger)
    require_once __DIR__ . '/../src/controllers/MetaWebhookController.php';
    if ($path === '/webhooks/meta' && ($method === 'GET' || $method === 'POST')) {
        if ($method === 'GET') return MetaWebhookController::verify();
        if ($method === 'POST') return MetaWebhookController::handle();
    }
    if ($path === '/webhooks/whatsapp' && ($method === 'GET' || $method === 'POST')) {
        return MetaWebhookController::handleWhatsApp();
    }
    if ($path === '/webhooks/messenger' && ($method === 'GET' || $method === 'POST')) {
        return MetaWebhookController::handleMessenger();
    }

    // ==================== UNIFIED INBOX ROUTES ====================
    // ==================== MULTI-TENANT (MT) ROUTES ====================
    if ($path === '/api/mt/agencies' && $method === 'GET') return MultiTenantController::listAgencies();
    if ($path === '/api/mt/agencies' && $method === 'POST') return MultiTenantController::createAgency();
    if ($path === '/api/mt/agencies/current' && $method === 'GET') return MultiTenantController::getCurrentAgency();
    if (preg_match('#^/api/mt/agencies/(\d+)$#', $path, $m)) {
        if ($method === 'GET') return MultiTenantController::getAgency((int)$m[1]);
        if ($method === 'PUT' || $method === 'PATCH') return MultiTenantController::updateAgency((int)$m[1]);
    }
    if (preg_match('#^/api/mt/agencies/(\d+)/branding$#', $path, $m)) {
        if ($method === 'GET') return MultiTenantController::getAgencyBranding((int)$m[1]);
        if ($method === 'PUT' || $method === 'PATCH') return MultiTenantController::updateAgencyBranding((int)$m[1]);
    }
    if (preg_match('#^/api/mt/agencies/(\d+)/members$#', $path, $m)) {
        if ($method === 'GET') return MultiTenantController::getAgencyMembers((int)$m[1]);
        if ($method === 'POST') return MultiTenantController::inviteAgencyMember((int)$m[1]);
    }
    if (preg_match('#^/api/mt/agencies/(\d+)/subaccounts$#', $path, $m)) {
        if ($method === 'GET') return MultiTenantController::listSubaccounts((int)$m[1]);
        if ($method === 'POST') return MultiTenantController::createSubaccount((int)$m[1]);
    }
    if (preg_match('#^/api/mt/subaccounts/(\d+)$#', $path, $m)) {
        if ($method === 'GET') return MultiTenantController::getSubaccount((int)$m[1]);
        if ($method === 'PUT' || $method === 'PATCH') return MultiTenantController::updateSubaccount((int)$m[1]);
        if ($method === 'DELETE') return MultiTenantController::deleteSubaccount((int)$m[1]);
    }
    if (preg_match('#^/api/mt/subaccounts/(\d+)/members$#', $path, $m)) {
        if ($method === 'GET') return MultiTenantController::getSubaccountMembers((int)$m[1]);
        if ($method === 'POST') return MultiTenantController::inviteSubaccountMember((int)$m[1]);
    }
    if (preg_match('#^/api/mt/subaccounts/(\d+)/settings$#', $path, $m)) {
        if ($method === 'GET') return MultiTenantController::getSubaccountSettings((int)$m[1]);
        if ($method === 'PUT' || $method === 'PATCH') return MultiTenantController::updateSubaccountSettings((int)$m[1]);
    }
    if ($path === '/api/mt/context/subaccount' && $method === 'GET') return MultiTenantController::getCurrentSubaccount();
    if (preg_match('#^/api/mt/context/switch/(\d+)$#', $path, $m) && $method === 'POST') {
        return MultiTenantController::switchSubaccount((int)$m[1]);
    }

    // Agency Domains
    if (preg_match('#^/api/mt/agencies/(\d+)/domains$#', $path, $m)) {
        if ($method === 'GET') return AgencyDomainsController::list((int)$m[1]);
        if ($method === 'POST') return AgencyDomainsController::create((int)$m[1]);
    }
    if (preg_match('#^/api/mt/agencies/(\d+)/domains/(\d+)$#', $path, $m)) {
        if ($method === 'PUT' || $method === 'PATCH') return AgencyDomainsController::update((int)$m[1], (int)$m[2]);
        if ($method === 'DELETE') return AgencyDomainsController::delete((int)$m[1], (int)$m[2]);
    }
    if (preg_match('#^/api/mt/agencies/(\d+)/domains/(\d+)/verify$#', $path, $m) && $method === 'POST') {
        return AgencyDomainsController::verify((int)$m[1], (int)$m[2]);
    }

    if ($path === '/inbox/stats' && $method === 'GET') return InboxController::getStats();
    if ($path === '/inbox/recent' && $method === 'GET') return InboxController::getRecent();

    // ==================== TASKS / TODAY'S ACTIONS ROUTES ====================
    if ($path === '/tasks' && $method === 'GET') return TasksController::index();
    if ($path === '/tasks' && $method === 'POST') return TasksController::create();
    if ($path === '/tasks/today' && $method === 'GET') return TasksController::getToday();
    if ($path === '/tasks/types' && $method === 'GET') return TasksController::getTypes();
    if ($path === '/tasks/bulk' && $method === 'POST') return TasksController::bulkUpdate();
    if ($path === '/tasks/daily-goals' && $method === 'GET') return TasksController::getDailyGoals();
    if ($path === '/tasks/daily-goals' && ($method === 'POST' || $method === 'PUT')) return TasksController::updateDailyGoals();
    // Task Comments
    if (preg_match('#^/tasks/(\d+)/comments$#', $path, $m)) {
        require_once __DIR__ . '/../src/controllers/TaskCommentsController.php';
        if ($method === 'GET') return TaskCommentsController::index($m[1]);
        if ($method === 'POST') return TaskCommentsController::create($m[1]);
    }
    if (preg_match('#^/tasks/(\d+)/comments/(\d+)$#', $path, $m)) {
        require_once __DIR__ . '/../src/controllers/TaskCommentsController.php';
        if ($method === 'DELETE') return TaskCommentsController::delete($m[1], $m[2]);
    }

    if (preg_match('#^/tasks/([^/]+)/complete$#', $path, $m) && $method === 'POST') {
        return TasksController::complete($m[1]);
    }
    if (preg_match('#^/tasks/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return TasksController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return TasksController::update($id);
        if ($method === 'DELETE') return TasksController::delete($id);
    }

    // Files & Media Library - Handled above in MEDIA LIBRARY section


    // ==================== PHASE 0: NOTIFICATIONS ====================
    if ($path === '/notifications' && $method === 'GET') return NotificationsController::index();
    if ($path === '/notifications' && $method === 'POST') return NotificationsController::create();
    if ($path === '/notifications/unread-count' && $method === 'GET') return NotificationsController::unreadCount();
    if ($path === '/notifications/mark-all-read' && $method === 'POST') return NotificationsController::markAllRead();
    if ($path === '/notifications/preferences' && $method === 'GET') return NotificationsController::getPreferences();
    if ($path === '/notifications/preferences' && ($method === 'POST' || $method === 'PUT')) return NotificationsController::updatePreferences();
    if (preg_match('#^/notifications/(\d+)/read$#', $path, $m) && $method === 'POST') {
        return NotificationsController::markRead((int)$m[1]);
    }
    if (preg_match('#^/notifications/(\d+)/archive$#', $path, $m) && $method === 'POST') {
        return NotificationsController::archive((int)$m[1]);
    }
    if (preg_match('#^/notifications/(\d+)$#', $path, $m) && $method === 'DELETE') {
        return NotificationsController::delete((int)$m[1]);
    }

    // ==================== PHASE 0: ACTIVITIES / TIMELINE ====================
    if ($path === '/activities' && $method === 'GET') return ActivitiesController::index();
    if ($path === '/activities' && $method === 'POST') return ActivitiesController::create();
    if (preg_match('#^/activities/entity/([^/]+)/(\d+)$#', $path, $m) && $method === 'GET') {
        return ActivitiesController::forEntity($m[1], (int)$m[2]);
    }
    if (preg_match('#^/activities/(\d+)/pin$#', $path, $m) && $method === 'POST') {
        return ActivitiesController::togglePin((int)$m[1]);
    }
    if (preg_match('#^/activities/(\d+)/comments$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return ActivitiesController::getComments($id);
        if ($method === 'POST') return ActivitiesController::addComment($id);
    }

    // ==================== PHASE 0: CUSTOM FIELDS ====================
    if ($path === '/custom-fields' && $method === 'GET') return CustomFieldsController::getDefinitions();
    if ($path === '/custom-fields' && $method === 'POST') return CustomFieldsController::createDefinition();
    if ($path === '/custom-fields/reorder' && $method === 'POST') return CustomFieldsController::reorderDefinitions();
    if (preg_match('#^/custom-fields/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT' || $method === 'PATCH') return CustomFieldsController::updateDefinition($id);
        if ($method === 'DELETE') return CustomFieldsController::deleteDefinition($id);
    }
    if (preg_match('#^/custom-fields/values/([^/]+)/(\d+)$#', $path, $m)) {
        $entityType = $m[1];
        $entityId = (int)$m[2];
        if ($method === 'GET') return CustomFieldsController::getValues($entityType, $entityId);
        if ($method === 'POST' || $method === 'PUT') return CustomFieldsController::setValues($entityType, $entityId);
    }

    // ==================== PHASE 0: TAGS ====================
    if ($path === '/tags' && $method === 'GET') return CustomFieldsController::getTags();
    if ($path === '/tags' && $method === 'POST') return CustomFieldsController::createTag();
    if (preg_match('#^/tags/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT' || $method === 'PATCH') return CustomFieldsController::updateTag($id);
        if ($method === 'DELETE') return CustomFieldsController::deleteTag($id);
    }
    if (preg_match('#^/tags/entity/([^/]+)/(\d+)$#', $path, $m)) {
        $entityType = $m[1];
        $entityId = (int)$m[2];
        if ($method === 'GET') return CustomFieldsController::getEntityTags($entityType, $entityId);
        if ($method === 'POST' || $method === 'PUT') return CustomFieldsController::setEntityTags($entityType, $entityId);
    }
    if (preg_match('#^/tags/entity/([^/]+)/(\d+)/(\d+)$#', $path, $m)) {
        $entityType = $m[1];
        $entityId = (int)$m[2];
        $tagId = (int)$m[3];
        if ($method === 'POST') return CustomFieldsController::addEntityTag($entityType, $entityId, $tagId);
        if ($method === 'DELETE') return CustomFieldsController::removeEntityTag($entityType, $entityId, $tagId);
    }

    // ==================== PHASE 0: INTEGRATIONS FRAMEWORK ====================
    if ($path === '/integrations' && $method === 'GET') return IntegrationsFrameworkController::index();
    if ($path === '/integrations/providers' && $method === 'GET') return IntegrationsFrameworkController::providers();
    if ($path === '/integrations/oauth/callback' && ($method === 'GET' || $method === 'POST')) {
        return IntegrationsFrameworkController::handleOAuthCallback();
    }
    if (preg_match('#^/integrations/([^/]+)/oauth$#', $path, $m) && $method === 'POST') {
        return IntegrationsFrameworkController::startOAuth($m[1]);
    }
    if (preg_match('#^/integrations/([^/]+)/connect$#', $path, $m) && $method === 'POST') {
        return IntegrationsFrameworkController::connectWithKeys($m[1]);
    }
    if (preg_match('#^/integrations/([^/]+)/disconnect$#', $path, $m) && $method === 'POST') {
        return IntegrationsFrameworkController::disconnect($m[1]);
    }
    if (preg_match('#^/integrations/([^/]+)/test$#', $path, $m) && $method === 'POST') {
        return IntegrationsFrameworkController::test($m[1]);
    }
    if (preg_match('#^/integrations/([^/]+)/config$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return IntegrationsFrameworkController::updateConfig($m[1]);
    }
    if (preg_match('#^/integrations/([^/]+)/sync$#', $path, $m) && $method === 'POST') {
        return IntegrationsFrameworkController::sync($m[1]);
    }
    if (preg_match('#^/integrations/sync-jobs/(\d+)$#', $path, $m) && $method === 'GET') {
        return IntegrationsFrameworkController::getSyncJob((int)$m[1]);
    }
    if (preg_match('#^/integrations/([^/]+)$#', $path, $m) && $method === 'GET') {
        return IntegrationsFrameworkController::show($m[1]);
    }

    // ==================== PHASE 1: LEAD ATTRIBUTION ====================
    if ($path === '/lead-sources' && $method === 'GET') return LeadAttributionController::getSources();
    if ($path === '/lead-sources' && $method === 'POST') return LeadAttributionController::createSource();
    if (preg_match('#^/lead-sources/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT' || $method === 'PATCH') return LeadAttributionController::updateSource($id);
        if ($method === 'DELETE') return LeadAttributionController::deleteSource($id);
    }
    if ($path === '/attributions' && $method === 'POST') return LeadAttributionController::createAttribution();
    if ($path === '/attributions/analytics' && $method === 'GET') return LeadAttributionController::getAnalytics();
    if ($path === '/attributions/track' && $method === 'POST') return LeadAttributionController::track();
    if (preg_match('#^/contacts/(\d+)/attributions$#', $path, $m) && $method === 'GET') {
        return LeadAttributionController::getContactAttributions((int)$m[1]);
    }

    // ==================== PHASE 1: STAFF MANAGEMENT ====================
    if ($path === '/staff' && $method === 'GET') return StaffController::index();
    if ($path === '/staff' && $method === 'POST') return StaffController::create();
    if (preg_match('#^/staff/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return StaffController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return StaffController::update($id);
        if ($method === 'DELETE') return StaffController::delete($id);
    }
    if (preg_match('#^/staff/(\d+)/availability$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return StaffController::getAvailability($id);
        if ($method === 'POST' || $method === 'PUT') return StaffController::setAvailability($id);
    }
    if (preg_match('#^/staff/(\d+)/time-off$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return StaffController::getTimeOff($id);
        if ($method === 'POST') return StaffController::addTimeOff($id);
    }
    if (preg_match('#^/staff/(\d+)/time-off/(\d+)$#', $path, $m) && $method === 'DELETE') {
        return StaffController::deleteTimeOff((int)$m[1], (int)$m[2]);
    }
    if (preg_match('#^/staff/(\d+)/services$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return StaffController::getServices($id);
        if ($method === 'POST' || $method === 'PUT') return StaffController::setServices($id);
    }
    if (preg_match('#^/staff/(\d+)/available-slots$#', $path, $m) && $method === 'GET') {
        return StaffController::getAvailableSlots((int)$m[1]);
    }

    // ==================== PHASE 1: CONTACT STAGES & SCORING ====================
    if ($path === '/contact-stages' && $method === 'GET') return ContactStagesController::getStages();
    if ($path === '/contact-stages' && $method === 'POST') return ContactStagesController::createStage();
    if ($path === '/contact-stages/reorder' && $method === 'POST') return ContactStagesController::reorderStages();
    if (preg_match('#^/contact-stages/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT' || $method === 'PATCH') return ContactStagesController::updateStage($id);
        if ($method === 'DELETE') return ContactStagesController::deleteStage($id);
    }
    if (preg_match('#^/contacts/(\d+)/stage/(\d+)$#', $path, $m) && $method === 'POST') {
        return ContactStagesController::moveContact((int)$m[1], (int)$m[2]);
    }
    if ($path === '/scoring-rules' && $method === 'GET') return ContactStagesController::getScoringRules();
    if ($path === '/scoring-rules' && $method === 'POST') return ContactStagesController::createScoringRule();
    if (preg_match('#^/scoring-rules/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT' || $method === 'PATCH') return ContactStagesController::updateScoringRule($id);
        if ($method === 'DELETE') return ContactStagesController::deleteScoringRule($id);
    }
    if (preg_match('#^/contacts/(\d+)/score$#', $path, $m) && $method === 'POST') {
        return ContactStagesController::applyScore((int)$m[1]);
    }
    if ($path === '/segments' && $method === 'GET') return ContactStagesController::getSegments();
    if ($path === '/segments' && $method === 'POST') return ContactStagesController::createSegment();
    if (preg_match('#^/segments/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT' || $method === 'PATCH') return ContactStagesController::updateSegment($id);
        if ($method === 'DELETE') return ContactStagesController::deleteSegment($id);
    }
    if (preg_match('#^/segments/(\d+)/contacts$#', $path, $m) && $method === 'GET') {
        return ContactStagesController::getSegmentContacts((int)$m[1]);
    }

    // ==================== PHASE 2: STRIPE PAYMENTS ====================
    if ($path === '/stripe/account' && $method === 'GET') return StripeController::getAccountStatus();
    if ($path === '/stripe/webhook' && $method === 'POST') return StripeController::handleWebhook();
    if ($path === '/payments' && $method === 'GET') return StripeController::listPayments();
    if ($path === '/payments/intent' && $method === 'POST') return StripeController::createPaymentIntent();
    if ($path === '/payments/analytics' && $method === 'GET') return StripeController::getAnalytics();
    if (preg_match('#^/payments/(\d+)$#', $path, $m) && $method === 'GET') {
        return StripeController::getPayment((int)$m[1]);
    }
    if (preg_match('#^/payments/(\d+)/refund$#', $path, $m) && $method === 'POST') {
        return StripeController::refund((int)$m[1]);
    }
    if ($path === '/payment-links' && $method === 'GET') return StripeController::listPaymentLinks();
    if ($path === '/payment-links' && $method === 'POST') return StripeController::createPaymentLink();
    if (preg_match('#^/payment-links/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT' || $method === 'PATCH') return StripeController::updatePaymentLink($id);
        if ($method === 'DELETE') return StripeController::deletePaymentLink($id);
    }
    require_once __DIR__ . '/../src/controllers/SubscriptionsController.php';
    if ($path === '/subscriptions' && $method === 'GET') return SubscriptionsController::listSubscriptions();
    if ($path === '/subscriptions' && $method === 'POST') return SubscriptionsController::create();
    if ($path === '/subscriptions/stats' && $method === 'GET') return SubscriptionsController::getStats();
    if ($path === '/subscriptions/analytics' && $method === 'GET') return SubscriptionsController::getAnalytics();
    if (preg_match('#^/subscriptions/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return SubscriptionsController::getSubscription($id);
        if ($method === 'POST' || $method === 'PUT' || $method === 'PATCH') return SubscriptionsController::update($id);
    }
    if (preg_match('#^/subscriptions/(\d+)/(cancel|pause|resume)$#', $path, $m) && $method === 'POST') {
        $id = (int)$m[1];
        $action = $m[2];
        if ($action === 'cancel') {
            return SubscriptionsController::cancel($id);
        } elseif ($action === 'pause') {
            return SubscriptionsController::pause($id);
        } elseif ($action === 'resume') {
            return SubscriptionsController::resume($id);
        }
    }


    // ============================================
    // E-SIGNATURE ROUTES
    // ============================================
    // Load controller if not already loaded
    require_once __DIR__ . '/../src/controllers/ESignatureController.php';

    if (str_starts_with($path, '/e-signature')) {
        $eSignPath = substr($path, 12); // Remove '/e-signature'
        if ($eSignPath === '' || $eSignPath === false) {
            $eSignPath = '/';
        }

        // Requests
        if ($eSignPath === '/requests' && $method === 'GET') {
            return ESignatureController::listRequests();
        }
        if ($eSignPath === '/requests' && $method === 'POST') {
            return ESignatureController::createRequest();
        }

        // Public Signing Methods
        if (preg_match('#^/public/signer/([^/]+)$#', $eSignPath, $m) && $method === 'GET') {
            return ESignatureController::getSignerContext($m[1]);
        }
        if (preg_match('#^/public/signer/([^/]+)/sign$#', $eSignPath, $m) && $method === 'POST') {
            return ESignatureController::completeSignature($m[1]);
        }

        if (preg_match('#^/requests/([^/]+)$#', $eSignPath, $m)) {
            if ($method === 'GET') return ESignatureController::getRequest($m[1]);
            if ($method === 'DELETE') return ESignatureController::deleteRequest($m[1]);
        }
        if (preg_match('#^/requests/([^/]+)/send$#', $eSignPath, $m) && $method === 'POST') {
            return ESignatureController::send($m[1]);
        }
        if (preg_match('#^/requests/([^/]+)/void$#', $eSignPath, $m) && $method === 'POST') {
            return ESignatureController::voidRequest($m[1]);
        }
        if (preg_match('#^/requests/([^/]+)/audit-trail$#', $eSignPath, $m) && $method === 'GET') {
            return ESignatureController::getAuditTrail($m[1]);
        }

        // Templates
        if ($eSignPath === '/templates' && $method === 'GET') {
            return ESignatureController::getTemplates();
        }

        // Settings
        if ($eSignPath === '/settings' && $method === 'GET') {
            return ESignatureController::getSettings();
        }
        if ($eSignPath === '/settings' && ($method === 'PUT' || $method === 'POST')) {
            return ESignatureController::updateSettings();
        }
        
        return;
    }

    // ==================== PHASE 2: ESTIMATES ====================
    if ($path === '/estimates' && $method === 'GET') return EstimatesController::index();
    if ($path === '/estimates' && $method === 'POST') return EstimatesController::create();
    if (preg_match('#^/estimates/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return EstimatesController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return EstimatesController::update($id);
        if ($method === 'DELETE') return EstimatesController::delete($id);
    }
    if (preg_match('#^/estimates/(\d+)/send$#', $path, $m) && $method === 'POST') {
        return EstimatesController::send((int)$m[1]);
    }
    if (preg_match('#^/estimates/(\d+)/accept$#', $path, $m) && $method === 'POST') {
        return EstimatesController::accept((int)$m[1]);
    }
    if (preg_match('#^/estimates/(\d+)/decline$#', $path, $m) && $method === 'POST') {
        return EstimatesController::decline((int)$m[1]);
    }
    if (preg_match('#^/estimates/(\d+)/convert$#', $path, $m) && $method === 'POST') {
        return EstimatesController::convertToInvoice((int)$m[1]);
    }
    if (preg_match('#^/estimates/(\d+)/duplicate$#', $path, $m) && $method === 'POST') {
        return EstimatesController::duplicate((int)$m[1]);
    }

    // ==================== PHASE 2: JOBS & DISPATCH ====================
    if ($path === '/job-types' && $method === 'GET') return JobsController::getJobTypes();
    if ($path === '/job-types' && $method === 'POST') return JobsController::createJobType();
    if (preg_match('#^/job-types/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT' || $method === 'PATCH') return JobsController::updateJobType($id);
        if ($method === 'DELETE') return JobsController::deleteJobType($id);
    }
    if ($path === '/jobs' && $method === 'GET') return JobsController::index();
    if ($path === '/jobs' && $method === 'POST') return JobsController::create();
    if ($path === '/jobs/analytics' && $method === 'GET') return JobsController::getAnalytics();
    if (preg_match('#^/jobs/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return JobsController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return JobsController::update($id);
        if ($method === 'DELETE') return JobsController::delete($id);
    }
    if (preg_match('#^/jobs/(\d+)/status$#', $path, $m) && $method === 'POST') {
        return JobsController::updateStatus((int)$m[1]);
    }
    if (preg_match('#^/jobs/(\d+)/items$#', $path, $m) && $method === 'POST') {
        return JobsController::addItem((int)$m[1]);
    }
    if (preg_match('#^/jobs/(\d+)/checklist/(\d+)$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return JobsController::updateChecklist((int)$m[1], (int)$m[2]);
    }
    if (preg_match('#^/jobs/(\d+)/photos$#', $path, $m) && $method === 'POST') {
        return JobsController::addPhoto((int)$m[1]);
    }
    if (preg_match('#^/jobs/(\d+)/notes$#', $path, $m) && $method === 'POST') {
        return JobsController::addNote((int)$m[1]);
    }
    if (preg_match('#^/jobs/(\d+)/signature$#', $path, $m) && $method === 'POST') {
        return JobsController::addSignature((int)$m[1]);
    }

    // ==================== REQUESTS ====================
    if ($path === '/requests' && $method === 'GET') return RequestsController::list();
    if ($path === '/requests' && $method === 'POST') return RequestsController::create();
    if (preg_match('#^/requests/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return RequestsController::get($id);
        if ($method === 'PUT' || $method === 'PATCH') return RequestsController::update($id);
        if ($method === 'DELETE') return RequestsController::delete($id);
    }

    // ==================== PHASE 3: SOCIAL MEDIA ====================
    if ($path === '/social/accounts' && $method === 'GET') return SocialController::getAccounts();
    if (preg_match('#^/social/accounts/(\d+)/disconnect$#', $path, $m) && $method === 'POST') {
        return SocialController::disconnectAccount((int)$m[1]);
    }
    if ($path === '/social/posts' && $method === 'GET') return SocialController::getPosts();
    if ($path === '/social/posts' && $method === 'POST') return SocialController::createPost();
    if (preg_match('#^/social/posts/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return SocialController::getPost($id);
        if ($method === 'PUT' || $method === 'PATCH') return SocialController::updatePost($id);
        if ($method === 'DELETE') return SocialController::deletePost($id);
    }
    if (preg_match('#^/social/posts/(\d+)/publish$#', $path, $m) && $method === 'POST') {
        return SocialController::publishPost((int)$m[1]);
    }
    if ($path === '/social/categories' && $method === 'GET') return SocialController::getCategories();
    if ($path === '/social/categories' && $method === 'POST') return SocialController::createCategory();
    if ($path === '/social/templates' && $method === 'GET') return SocialController::getTemplates();
    if ($path === '/social/templates' && $method === 'POST') return SocialController::createTemplate();
    if ($path === '/social/hashtag-groups' && $method === 'GET') return SocialController::getHashtagGroups();
    if ($path === '/social/hashtag-groups' && $method === 'POST') return SocialController::createHashtagGroup();
    if ($path === '/social/analytics' && $method === 'GET') return SocialController::getAnalytics();

    // ==================== PHASE 3: LISTINGS & SEO ====================
    if ($path === '/listings/directories' && $method === 'GET') return ListingsController::getDirectories();
    if ($path === '/listings/audits' && $method === 'GET') return ListingsController::getAudits();
    if ($path === '/listings/audits' && $method === 'POST') return ListingsController::startAudit();
    if ($path === '/listings/duplicates' && $method === 'GET') return ListingsController::getDuplicates();
    if (preg_match('#^/listings/duplicates/(\d+)/suppress$#', $path, $m) && $method === 'POST') return ListingsController::suppressDuplicate((int)$m[1]);
    if ($path === '/listings/reviews' && $method === 'GET') return ListingsController::getReviews();
    if ($path === '/listings/reviews/sync' && $method === 'POST') return ListingsController::syncReviews();
    if (preg_match('#^/listings/reviews/(\d+)/reply$#', $path, $m) && $method === 'POST') return ListingsController::replyToReview((int)$m[1]);

    // Local SEO Rank Tracking
    if ($path === '/listings/ranks' && $method === 'GET') return ListingsController::getRankTrackings();
    if ($path === '/listings/ranks' && $method === 'POST') return ListingsController::addRankTracking();
    if (preg_match('#^/listings/ranks/(\d+)$#', $path, $m) && $method === 'DELETE') return ListingsController::deleteRankTracking((int)$m[1]);
    if (preg_match('#^/listings/ranks/(\d+)/refresh$#', $path, $m) && $method === 'POST') return ListingsController::refreshRankTracking((int)$m[1]);
    if (preg_match('#^/listings/ranks/(\d+)/history$#', $path, $m) && $method === 'GET') return ListingsController::getRankHistory((int)$m[1]);
    if ($path === '/listings' && $method === 'GET') return ListingsController::getListings();
    if ($path === '/listings' && $method === 'POST') return ListingsController::addListing();
    if ($path === '/listings/bulk' && $method === 'POST') return ListingsController::bulkAddListings();
    if ($path === '/listings/scan' && $method === 'POST') return ListingsController::scanListings();
    if ($path === '/listings/settings' && $method === 'GET') return ListingsController::getSettings();
    if ($path === '/listings/settings' && $method === 'POST') return ListingsController::updateSettings();
    if ($path === '/listings/bulk-sync' && $method === 'POST') return ListingsController::bulkSyncListings();
    if ($path === '/listings/bulk-update-method' && $method === 'POST') return ListingsController::bulkUpdateMethod();
    if ($path === '/listings/analytics' && $method === 'GET') return ListingsController::getAnalytics();
    if (preg_match('#^/listings/(\d+)$#', $path, $m)) {
        if ($method === 'PUT' || $method === 'PATCH') return ListingsController::updateListing((int)$m[1]);
        if ($method === 'DELETE') return ListingsController::deleteListing((int)$m[1]);
    }
    if (preg_match('#^/listings/(\d+)/sync$#', $path, $m) && $method === 'POST') {
        return ListingsController::syncListing((int)$m[1]);
    }
    if (preg_match('#^/listings/(\d+)/sync-history$#', $path, $m) && $method === 'GET') {
        return ListingsController::getSyncHistory((int)$m[1]);
    }
    if (preg_match('#^/listings/(\d+)/claim$#', $path, $m) && $method === 'POST') {
        return ListingsController::claimListing((int)$m[1]);
    }
    if (preg_match('#^/listings/(\d+)/verify$#', $path, $m) && $method === 'POST') {
        return ListingsController::verifyListing((int)$m[1]);
    }
    if (preg_match('#^/listings/(\d+)/reviews$#', $path, $m) && $method === 'GET') {
        return ListingsController::getListingReviews((int)$m[1]);
    }
    if ($path === '/listings/import/apify-citations' && $method === 'POST') {
        return ListingsController::importFromApify();
    }
    if ($path === '/listings/import/google-sheets' && $method === 'POST') {
        return ListingsController::importFromGoogleSheets();
    }
    if ($path === '/listings/directories/brightlocal' && $method === 'GET') {
        return ListingsController::getBrightLocalDirectories();
    }
    if ($path === '/listings/categories/brightlocal' && $method === 'GET') {
        return ListingsController::getBrightLocalCategories();
    }
    if ($path === '/seo/keywords' && $method === 'GET') return ListingsController::getKeywords();
    if ($path === '/seo/keywords' && $method === 'POST') return ListingsController::addKeyword();
    if ($path === '/seo/keywords/explore' && $method === 'POST') return SeoController::exploreKeywords();
    if ($path === '/seo/keyword-gap' && $method === 'POST') return SeoController::keywordGapAnalysis();
    if ($path === '/seo/keywords/cluster' && $method === 'POST') return SeoController::keywordClustering();
    if ($path === '/seo/serp' && $method === 'GET') return SeoController::serpAnalysis();
    if ($path === '/seo/questions' && $method === 'GET') return SeoController::getRelatedQuestions();
    if (preg_match('#^/seo/keywords/(\d+)$#', $path, $m) && $method === 'DELETE') {
        return ListingsController::deleteKeyword((int)$m[1]);
    }
    if (preg_match('#^/seo/keywords/(\d+)/history$#', $path, $m) && $method === 'GET') {
        return ListingsController::getKeywordHistory((int)$m[1]);
    }
    if ($path === '/seo/pages' && $method === 'GET') return ListingsController::getPages();
    if ($path === '/seo/pages' && $method === 'POST') return ListingsController::addPage();
    if (preg_match('#^/seo/pages/(\d+)/audit$#', $path, $m) && $method === 'POST') {
        return ListingsController::auditPage((int)$m[1]);
    }
    if ($path === '/seo/backlinks' && $method === 'GET') return SeoController::getBacklinks();
    if ($path === '/seo/backlinks' && $method === 'POST') return SeoController::addBacklink();
    if ($path === '/seo/backlinks/by-domain' && $method === 'GET') return SeoController::getBacklinksByDomain();
    if ($path === '/seo/backlinks/gap' && $method === 'POST') return SeoController::backlinkGapAnalysis();
    if ($path === '/seo/backlinks/anchors' && $method === 'GET') return SeoController::getAnchorTextDistribution();
    if ($path === '/seo/backlinks/velocity' && $method === 'GET') return SeoController::getLinkVelocity();
    if ($path === '/seo/backlinks/toxic' && $method === 'GET') return SeoController::detectToxicLinks();
    if (preg_match('#^/seo/backlinks/competitor/(.+)$#', $path, $m) && $method === 'GET') {
        return SeoController::getCompetitorBacklinks(urldecode($m[1]));
    }
    if ($path === '/seo/audits' && $method === 'GET') return SeoController::getAudits();
    if ($path === '/seo/audits' && $method === 'POST') return SeoController::createAudit();
    if ($path === '/seo/audits/deep-crawl' && $method === 'POST') return SeoController::runDeepCrawl();
    if (preg_match('#^/seo/audits/(\d+)$#', $path, $m) && $method === 'GET') {
        return SeoController::getAudit((int)$m[1]);
    }
    if (preg_match('#^/seo/audits/(\d+)/cwv$#', $path, $m) && $method === 'GET') {
        return SeoController::getCoreWebVitals((int)$m[1]);
    }
    if (preg_match('#^/seo/audits/(\d+)/schema$#', $path, $m) && $method === 'GET') {
        return SeoController::getStructuredData((int)$m[1]);
    }
    if ($path === '/seo/content/analyze' && $method === 'POST') return SeoController::analyzeContent();
    if ($path === '/seo/content/topics' && $method === 'GET') return SeoController::topicResearch();
    if ($path === '/seo/reports' && $method === 'GET') return SeoController::getReports();
    if ($path === '/seo/reports' && $method === 'POST') return SeoController::generateReport();
    if ($path === '/seo/reports/schedule' && $method === 'POST') return SeoController::scheduleReport();
    if ($path === '/seo/competitors' && $method === 'GET') return ListingsController::getCompetitors();
    if ($path === '/seo/competitors' && $method === 'POST') return ListingsController::addCompetitor();
    if (preg_match('#^/seo/competitors/(\d+)$#', $path, $m) && $method === 'DELETE') {
        return ListingsController::deleteCompetitor((int)$m[1]);
    }
    if ($path === '/seo/analytics' && $method === 'GET') return ListingsController::getAnalytics();

    // ==================== SEO: COMPETITOR CITATIONS ====================
    if ($path === '/seo/competitors/citations/check' && $method === 'POST') {
        return ListingsController::checkCompetitorCitations();
    }
    if ($path === '/seo/competitors/search' && $method === 'POST') {
        return ListingsController::searchCompetitorsByKeyword();
    }

    // ==================== PHASE 3: ADS ====================
    if ($path === '/ads/accounts' && $method === 'GET') return AdsController::getAccounts();
    if (preg_match('#^/ads/accounts/(\d+)/disconnect$#', $path, $m) && $method === 'POST') {
        return AdsController::disconnectAccount((int)$m[1]);
    }
    if ($path === '/ads/campaigns' && $method === 'GET') return AdsController::getCampaigns();
    if (preg_match('#^/ads/campaigns/(\d+)$#', $path, $m) && $method === 'GET') {
        return AdsController::getCampaign((int)$m[1]);
    }
    if (preg_match('#^/ads/campaigns/(\d+)/metrics$#', $path, $m) && $method === 'GET') {
        return AdsController::getCampaignMetrics((int)$m[1]);
    }
    if ($path === '/ads/conversions' && $method === 'GET') return AdsController::getConversions();
    if ($path === '/ads/conversions' && $method === 'POST') return AdsController::trackConversion();
    if ($path === '/ads/budgets' && $method === 'GET') return AdsController::getBudgets();
    if ($path === '/ads/budgets' && $method === 'POST') return AdsController::createBudget();
    if (preg_match('#^/ads/budgets/(\d+)$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return AdsController::updateBudget((int)$m[1]);
    }
    if ($path === '/ads/analytics' && $method === 'GET') return AdsController::getAnalytics();

    // ==================== AFFILIATES ====================
    if ($path === '/affiliates' && $method === 'GET') return AffiliatesController::getAffiliates();
    if ($path === '/affiliates' && $method === 'POST') return AffiliatesController::createAffiliate();
    if (preg_match('#^/affiliates/(\d+)$#', $path, $m)) {
        if ($method === 'GET') return AffiliatesController::getAffiliate((int)$m[1]);
        if ($method === 'PUT' || $method === 'PATCH') return AffiliatesController::updateAffiliate((int)$m[1]);
        if ($method === 'DELETE') return AffiliatesController::deleteAffiliate((int)$m[1]);
    }
    if ($path === '/affiliates/referrals' && $method === 'GET') return AffiliatesController::getReferrals();
    if ($path === '/affiliates/referrals' && $method === 'POST') return AffiliatesController::createReferral();
    if ($path === '/affiliates/payouts' && $method === 'GET') return AffiliatesController::getPayouts();
    if ($path === '/affiliates/payouts' && $method === 'POST') return AffiliatesController::createPayout();
    if ($path === '/affiliates/record-click' && $method === 'POST') return AffiliatesController::recordClick();
    if ($path === '/affiliates/settings' && $method === 'GET') return AffiliatesController::getSettings();
    if ($path === '/affiliates/settings' && $method === 'POST') return AffiliatesController::updateSettings();
    if ($path === '/affiliates/export-payouts' && $method === 'GET') return AffiliatesController::exportPayouts();
    if ($path === '/affiliates/analytics' && $method === 'GET') return AffiliatesController::getAnalytics();

    // ==================== PHASE 4: TIME TRACKING ====================
    if ($path === '/time-entries' && $method === 'GET') return TimeTrackingController::getTimeEntries();
    if ($path === '/time-entries' && $method === 'POST') return TimeTrackingController::createManualEntry();
    if ($path === '/time-entries/start' && $method === 'POST') return TimeTrackingController::startTimer();
    if (preg_match('#^/time-entries/(\d+)/stop$#', $path, $m) && $method === 'POST') {
        return TimeTrackingController::stopTimer((int)$m[1]);
    }
    if (preg_match('#^/time-entries/(\d+)/approve$#', $path, $m) && $method === 'POST') {
        return TimeTrackingController::approveEntry((int)$m[1]);
    }
    if ($path === '/clock/in' && $method === 'POST') return TimeTrackingController::clockIn();
    if ($path === '/clock/out' && $method === 'POST') return TimeTrackingController::clockOut();
    if ($path === '/clock/status' && $method === 'GET') return TimeTrackingController::getClockStatus();
    if ($path === '/timesheets' && $method === 'GET') return TimeTrackingController::getTimesheets();
    if (preg_match('#^/timesheets/(\d+)/submit$#', $path, $m) && $method === 'POST') {
        return TimeTrackingController::submitTimesheet((int)$m[1]);
    }
    if (preg_match('#^/timesheets/(\d+)/approve$#', $path, $m) && $method === 'POST') {
        return TimeTrackingController::approveTimesheet((int)$m[1]);
    }
    if ($path === '/leave-requests' && $method === 'GET') return TimeTrackingController::getLeaveRequests();
    if ($path === '/leave-requests' && $method === 'POST') return TimeTrackingController::createLeaveRequest();
    if (preg_match('#^/leave-requests/(\d+)/approve$#', $path, $m) && $method === 'POST') {
        return TimeTrackingController::approveLeaveRequest((int)$m[1]);
    }
    if ($path === '/leave-balances' && $method === 'GET') return TimeTrackingController::getLeaveBalances();
    if ($path === '/leave-accruals/process' && $method === 'POST') return TimeTrackingController::processAccruals();
    if ($path === '/time-tracking/analytics' && $method === 'GET') return TimeTrackingController::getAnalytics();

    // ==================== PAYROLL ====================
    if ($path === '/payroll/pay-periods' && $method === 'GET') return PayrollController::getPayPeriods();
    if ($path === '/payroll/pay-periods' && $method === 'POST') return PayrollController::createPayPeriod();
    if (preg_match('#^/payroll/pay-periods/(\d+)/process$#', $path, $m) && $method === 'POST') {
        return PayrollController::processPayPeriod((int)$m[1]);
    }
    if (preg_match('#^/payroll/pay-periods/(\d+)/approve$#', $path, $m) && $method === 'POST') {
        return PayrollController::approvePayPeriod((int)$m[1]);
    }
    if ($path === '/payroll/records' && $method === 'GET') return PayrollController::getPayrollRecords();
    if (preg_match('#^/payroll/records/(\d+)/paid$#', $path, $m) && $method === 'POST') {
        return PayrollController::markPayrollPaid((int)$m[1]);
    }
    if ($path === '/payroll/compensation' && $method === 'GET') return PayrollController::getEmployeeCompensation();
    if ($path === '/payroll/compensation' && $method === 'POST') return PayrollController::createEmployeeCompensation();
    if (preg_match('#^/payroll/compensation/(\d+)$#', $path, $m) && $method === 'PUT') {
        return PayrollController::updateEmployeeCompensation((int)$m[1]);
    }
    if ($path === '/payroll/analytics' && $method === 'GET') return PayrollController::getPayrollAnalytics();

    // Tax Brackets
    if ($path === '/payroll/tax-brackets' && $method === 'GET') return PayrollController::getTaxBrackets();
    if ($path === '/payroll/tax-brackets' && $method === 'POST') return PayrollController::createTaxBracket();
    if (preg_match('#^/payroll/tax-brackets/(\d+)$#', $path, $m) && $method === 'PUT') {
        return PayrollController::updateTaxBracket((int)$m[1]);
    }
    if (preg_match('#^/payroll/tax-brackets/(\d+)$#', $path, $m) && $method === 'DELETE') {
        return PayrollController::deleteTaxBracket((int)$m[1]);
    }

    // Employee HR Data
    if ($path === '/hr/documents' && $method === 'GET') return EmployeeController::getDocuments();
    if ($path === '/hr/documents' && $method === 'POST') return EmployeeController::uploadDocument();
    if ($path === '/hr/onboarding/checklists' && $method === 'GET') return EmployeeController::getOnboardingChecklists();
    if (preg_match('#^/hr/onboarding/employee/(\d+)$#', $path, $m) && $method === 'GET') {
        return EmployeeController::getEmployeeOnboarding((int)$m[1]);
    }
    if (preg_match('#^/hr/onboarding/tasks/(\d+)$#', $path, $m) && $method === 'PUT') {
        return EmployeeController::updateOnboardingTask((int)$m[1]);
    }

    // Performance & Assets
    if ($path === '/hr/performance' && $method === 'GET') return EmployeeController::getPerformanceReviews();
    if ($path === '/hr/performance' && $method === 'POST') return EmployeeController::createPerformanceReview();
    if ($path === '/hr/assets' && $method === 'GET') return EmployeeController::getAssets();
    if (preg_match('#^/hr/assets/(\d+)$#', $path, $m) && $method === 'PUT') {
        return EmployeeController::updateAsset((int)$m[1]);
    }

    // Employee Data Integration
    if (preg_match('#^/hr/employees/(\d+)/time-entries$#', $path, $m) && $method === 'GET') {
        return EmployeeController::getEmployeeTimeEntries((int)$m[1]);
    }
    if (preg_match('#^/hr/employees/(\d+)/shifts$#', $path, $m) && $method === 'GET') {
        return EmployeeController::getEmployeeShifts((int)$m[1]);
    }
    if (preg_match('#^/hr/employees/(\d+)/leave-summary$#', $path, $m) && $method === 'GET') {
        return EmployeeController::getEmployeeLeaveSummary((int)$m[1]);
    }
    if (preg_match('#^/hr/employees/(\d+)/payroll-summary$#', $path, $m) && $method === 'GET') {
        return EmployeeController::getEmployeePayrollSummary((int)$m[1]);
    }

    // ==================== RECRUITMENT / ATS ====================
    // Job Openings
    if ($path === '/recruitment/jobs' && $method === 'GET') return RecruitmentController::getJobOpenings();
    if ($path === '/recruitment/jobs' && $method === 'POST') return RecruitmentController::createJobOpening();
    if (preg_match('#^/recruitment/jobs/(\d+)$#', $path, $m) && $method === 'PUT') {
        return RecruitmentController::updateJobOpening((int)$m[1]);
    }

    // Candidates
    if ($path === '/recruitment/candidates' && $method === 'GET') return RecruitmentController::getCandidates();
    if ($path === '/recruitment/candidates' && $method === 'POST') return RecruitmentController::createCandidate();

    // Job Applications
    if ($path === '/recruitment/applications' && $method === 'GET') return RecruitmentController::getJobApplications();
    if ($path === '/recruitment/applications' && $method === 'POST') return RecruitmentController::createJobApplication();
    if (preg_match('#^/recruitment/applications/(\d+)/stage$#', $path, $m) && $method === 'PUT') {
        return RecruitmentController::updateApplicationStage((int)$m[1]);
    }

    // Interviews
    if ($path === '/recruitment/interviews' && $method === 'GET') return RecruitmentController::getInterviews();
    if ($path === '/recruitment/interviews' && $method === 'POST') return RecruitmentController::scheduleInterview();
    if (preg_match('#^/recruitment/interviews/(\d+)$#', $path, $m) && $method === 'PUT') {
        return RecruitmentController::updateInterview((int)$m[1]);
    }

    // Recruitment Analytics
    if ($path === '/recruitment/analytics' && $method === 'GET') return RecruitmentController::getRecruitmentAnalytics();

    // Hiring / Conversion
    if (preg_match('#^/recruitment/candidates/(\d+)/convert-to-employee$#', $path, $m) && $method === 'POST') {
        return RecruitmentController::convertToEmployee((int)$m[1]);
    }

    // ==================== SHIFT SCHEDULING ====================
    // Shifts
    if ($path === '/scheduling/shifts' && $method === 'GET') return ShiftSchedulingController::getShifts();
    if ($path === '/scheduling/shifts' && $method === 'POST') return ShiftSchedulingController::createShift();
    if (preg_match('#^/scheduling/shifts/(\d+)$#', $path, $m) && $method === 'PUT') {
        return ShiftSchedulingController::updateShift((int)$m[1]);
    }
    if (preg_match('#^/scheduling/shifts/(\d+)$#', $path, $m) && $method === 'DELETE') {
        return ShiftSchedulingController::deleteShift((int)$m[1]);
    }

    // Shift Types
    if ($path === '/scheduling/shift-types' && $method === 'GET') return ShiftSchedulingController::getShiftTypes();
    if ($path === '/scheduling/shift-types' && $method === 'POST') return ShiftSchedulingController::createShiftType();

    // Shift Swap Requests
    if ($path === '/scheduling/swap-requests' && $method === 'GET') return ShiftSchedulingController::getShiftSwapRequests();
    if ($path === '/scheduling/swap-requests' && $method === 'POST') return ShiftSchedulingController::createShiftSwapRequest();
    if (preg_match('#^/scheduling/swap-requests/(\d+)/respond$#', $path, $m) && $method === 'POST') {
        return ShiftSchedulingController::respondToSwapRequest((int)$m[1]);
    }

    // Employee Availability
    if ($path === '/scheduling/availability' && $method === 'GET') return ShiftSchedulingController::getAvailability();
    if ($path === '/scheduling/availability' && $method === 'POST') return ShiftSchedulingController::setAvailability();

    // Scheduling Analytics
    if ($path === '/scheduling/analytics' && $method === 'GET') return ShiftSchedulingController::getSchedulingAnalytics();

    // Conflict Detection
    if ($path === '/scheduling/shifts/validate' && $method === 'POST') return ShiftSchedulingController::validateShift();
    if ($path === '/scheduling/conflicts' && $method === 'GET') return ShiftSchedulingController::getConflicts();

    // ==================== PHASE 4: EXPENSES & COMMISSIONS ====================
    if ($path === '/expense-categories' && $method === 'GET') return ExpensesController::getCategories();
    if ($path === '/expense-categories' && $method === 'POST') return ExpensesController::createCategory();
    if ($path === '/expenses' && $method === 'GET') return ExpensesController::getExpenses();
    if ($path === '/expenses' && $method === 'POST') return ExpensesController::createExpense();
    if (preg_match('#^/expenses/(\d+)/approve$#', $path, $m) && $method === 'POST') {
        return ExpensesController::approveExpense((int)$m[1]);
    }
    if ($path === '/expense-reports' && $method === 'GET') return ExpensesController::getExpenseReports();
    if ($path === '/expense-reports' && $method === 'POST') return ExpensesController::createExpenseReport();
    if (preg_match('#^/expense-reports/(\d+)$#', $path, $m) && $method === 'GET') {
        return ExpensesController::getExpenseReport((int)$m[1]);
    }
    if (preg_match('#^/expense-reports/(\d+)/submit$#', $path, $m) && $method === 'POST') {
        return ExpensesController::submitExpenseReport((int)$m[1]);
    }
    if (preg_match('#^/expense-reports/(\d+)/approve$#', $path, $m) && $method === 'POST') {
        return ExpensesController::approveExpenseReport((int)$m[1]);
    }
    if ($path === '/commission-plans' && $method === 'GET') return ExpensesController::getCommissionPlans();
    if ($path === '/commission-plans' && $method === 'POST') return ExpensesController::createCommissionPlan();
    if ($path === '/commissions' && $method === 'GET') return ExpensesController::getCommissions();
    if ($path === '/commissions' && $method === 'POST') return ExpensesController::createCommission();
    if ($path === '/commissions/calculate' && $method === 'POST') return ExpensesController::calculateCommissionForPlan();
    if (preg_match('#^/commissions/(\d+)/approve$#', $path, $m) && $method === 'POST') {
        return ExpensesController::approveCommission((int)$m[1]);
    }
    if ($path === '/expenses/analytics' && $method === 'GET') return ExpensesController::getAnalytics();
    if ($path === '/expenses/chart-data' && $method === 'GET') return ExpensesController::getChartData();

    // ==================== THRYV-PARITY: SERVICES ====================
    if ($path === '/services' && $method === 'GET') return ServicesController::index();
    if ($path === '/services' && $method === 'POST') return ServicesController::store();
    if ($path === '/services/categories' && $method === 'GET') return ServicesController::categories();
    if ($path === '/services/categories' && $method === 'POST') return ServicesController::createCategory();
    if (preg_match('#^/services/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return ServicesController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return ServicesController::update($id);
        if ($method === 'DELETE') return ServicesController::destroy($id);
    }

    // ==================== THRYV-PARITY: STAFF MEMBERS ====================
    if ($path === '/staff-members' && $method === 'GET') return StaffMembersController::index();
    if ($path === '/staff-members' && $method === 'POST') return StaffMembersController::store();
    if (preg_match('#^/staff-members/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return StaffMembersController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return StaffMembersController::update($id);
        if ($method === 'DELETE') return StaffMembersController::destroy($id);
    }
    if (preg_match('#^/staff-members/(\d+)/availability$#', $path, $m) && $method === 'GET') {
        return StaffMembersController::getAvailability((int)$m[1]);
    }
    if (preg_match('#^/staff-members/(\d+)/time-off$#', $path, $m) && $method === 'POST') {
        return StaffMembersController::addTimeOff((int)$m[1]);
    }
    if (preg_match('#^/staff-members/(\d+)/time-off/(\d+)$#', $path, $m) && $method === 'DELETE') {
        return StaffMembersController::removeTimeOff((int)$m[1], (int)$m[2]);
    }

    // ==================== THRYV-PARITY: BOOKING ====================
    if ($path === '/booking/slots' && $method === 'GET') return BookingController::getSlots();
    if ($path === '/booking' && $method === 'POST') return BookingController::createBooking();
    if (preg_match('#^/booking/(\d+)/cancel$#', $path, $m) && $method === 'POST') {
        return BookingController::cancelBooking((int)$m[1]);
    }
    if (preg_match('#^/booking/(\d+)/reschedule$#', $path, $m) && $method === 'POST') {
        return BookingController::rescheduleBooking((int)$m[1]);
    }
    // Public booking page (no auth required - handled specially)
    if (preg_match('#^/public/booking/([^/]+)$#', $path, $m) && $method === 'GET') {
        return BookingController::getPublicBookingPage($m[1]);
    }

    // ==================== BOOKING PAGES (Shareable scheduling pages) ====================
    require_once __DIR__ . '/../src/controllers/BookingPagesController.php';
    if ($path === '/booking-pages' && $method === 'GET') return BookingPagesController::index();
    if ($path === '/booking-pages' && $method === 'POST') return BookingPagesController::store();
    if (preg_match('#^/booking-pages/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return BookingPagesController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return BookingPagesController::update($id);
        if ($method === 'DELETE') return BookingPagesController::destroy($id);
    }
    // Public booking page by slug (no auth)
    if (preg_match('#^/public/book/([^/]+)$#', $path, $m) && $method === 'GET') {
        return BookingPagesController::getPublicPage($m[1]);
    }
    // Lead capture for external bookings (no auth)
    if (preg_match('#^/public/book/([^/]+)/lead$#', $path, $m) && $method === 'POST') {
        return BookingPagesController::captureLead($m[1]);
    }
    // Webhook endpoints for external booking confirmations (no auth)
    if (preg_match('#^/webhooks/booking/(calendly|acuity)$#', $path, $m) && $method === 'POST') {
        return BookingPagesController::handleWebhook($m[1]);
    }

    require_once __DIR__ . '/../src/controllers/ProjectsController.php';
    if ($path === '/projects/analytics' && $method === 'GET') return ProjectsController::getAnalytics();
    if ($path === '/projects' && $method === 'GET') return ProjectsController::index();
    if ($path === '/projects' && $method === 'POST') return ProjectsController::create();
    if (preg_match('#^/projects/(\d+)$#', $path, $m)) {
        if ($method === 'GET') return ProjectsController::show($m[1]);
        if ($method === 'PUT') return ProjectsController::update($m[1]);
        if ($method === 'DELETE') return ProjectsController::delete($m[1]);
    }
    if (preg_match('#^/projects/(\d+)/tasks$#', $path, $m) && $method === 'GET') {
        return ProjectsController::getTasks($m[1]);
    }
    if (preg_match('#^/projects/(\d+)/members$#', $path, $m) && $method === 'POST') {
        return ProjectsController::addMember($m[1]);
    }
    if (preg_match('#^/projects/(\d+)/members/(\d+)$#', $path, $m) && $method === 'DELETE') {
        return ProjectsController::removeMember($m[1], $m[2]);
    }
    if (preg_match('#^/projects/(\d+)/activity$#', $path, $m) && $method === 'GET') {
        return ProjectsController::getActivity($m[1]);
    }

    // ==================== PROJECT TEMPLATES ====================
    require_once __DIR__ . '/../src/controllers/ProjectTemplatesController.php';
    if ($path === '/project-templates' && $method === 'GET') return ProjectTemplatesController::index();
    if (preg_match('#^/project-templates/(\d+)$#', $path, $m) && $method === 'GET') {
        return ProjectTemplatesController::show($m[1]);
    }
    if (preg_match('#^/project-templates/(\d+)/use$#', $path, $m) && $method === 'POST') {
        return ProjectTemplatesController::createProject($m[1]);
    }

    // ==================== THRYV-PARITY: PAYPAL PAYMENTS ====================
    if ($path === '/paypal/status' && $method === 'GET') return PayPalController::status();
    if ($path === '/paypal/connect' && $method === 'POST') return PayPalController::connect();
    if ($path === '/paypal/disconnect' && $method === 'POST') return PayPalController::disconnect();
    if ($path === '/paypal/order' && $method === 'POST') return PayPalController::createOrder();
    if ($path === '/paypal/capture' && $method === 'POST') return PayPalController::captureOrder();
    if ($path === '/paypal/webhook' && $method === 'POST') return PayPalController::handleWebhook();

    // ==================== THRYV-PARITY: CUSTOMER PORTAL AUTH ====================
    if ($path === '/portal/auth/magic-link' && $method === 'POST') return PortalAuthController::requestMagicLink();
    if ($path === '/portal/auth/magic-link/verify' && $method === 'POST') return PortalAuthController::verifyMagicLink();
    if ($path === '/portal/auth/otp' && $method === 'POST') return PortalAuthController::requestOtp();
    if ($path === '/portal/auth/otp/verify' && $method === 'POST') return PortalAuthController::verifyOtp();
    if ($path === '/portal/auth/validate' && $method === 'GET') return PortalAuthController::validateSession();
    if ($path === '/portal/auth/logout' && $method === 'POST') return PortalAuthController::logout();

    // ==================== CLIENT PORTAL: DOCUMENTS & MESSAGES ====================
    require_once __DIR__ . '/../src/controllers/ClientPortalController.php';
    
    if ($path === '/portal/documents' && $method === 'GET') return \Xordon\Controllers\ClientPortalController::listDocuments();
    if ($path === '/portal/documents' && $method === 'POST') return \Xordon\Controllers\ClientPortalController::uploadDocument();
    if (preg_match('#^/portal/documents/(\d+)/sign$#', $path, $m) && $method === 'POST') {
        return \Xordon\Controllers\ClientPortalController::signDocument((int)$m[1]);
    }
    
    if ($path === '/portal/messages' && $method === 'GET') return \Xordon\Controllers\ClientPortalController::listMessages();
    if ($path === '/portal/messages' && $method === 'POST') return \Xordon\Controllers\ClientPortalController::sendMessage();
    if (preg_match('#^/portal/messages/(\d+)/read$#', $path, $m) && $method === 'POST') {
        return \Xordon\Controllers\ClientPortalController::markMessageRead((int)$m[1]);
    }

    // ==================== P1: CALENDARS (Multi-calendar, GHL-style) ====================
    if ($path === '/calendars' && $method === 'GET') return CalendarsController::index();
    if ($path === '/calendars' && $method === 'POST') return CalendarsController::store();
    if (preg_match('#^/calendars/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return CalendarsController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return CalendarsController::update($id);
        if ($method === 'DELETE') return CalendarsController::destroy($id);
    }
    if (preg_match('#^/calendars/(\d+)/availability$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return CalendarsController::getAvailability($id);
        if ($method === 'PUT' || $method === 'POST') return CalendarsController::setAvailabilityEndpoint($id);
    }
    if (preg_match('#^/calendars/(\d+)/slots$#', $path, $m) && $method === 'GET') {
        return CalendarsController::getSlots((int)$m[1]);
    }
    if (preg_match('#^/calendars/(\d+)/blocks$#', $path, $m) && $method === 'POST') {
        return CalendarsController::addBlock((int)$m[1]);
    }
    if (preg_match('#^/calendars/(\d+)/blocks/(\d+)$#', $path, $m) && $method === 'DELETE') {
        return CalendarsController::removeBlock((int)$m[1], (int)$m[2]);
    }

    // ==================== P6: WORKFLOWS (Visual workflow builder) ====================
    if ($path === '/workflows' && $method === 'GET') return WorkflowsController::index();
    if ($path === '/workflows' && $method === 'POST') return WorkflowsController::store();
    if ($path === '/workflows/options' && $method === 'GET') return WorkflowsController::getOptions();
    if (preg_match('#^/workflows/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return WorkflowsController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return WorkflowsController::update($id);
        if ($method === 'DELETE') return WorkflowsController::destroy($id);
    }
    if (preg_match('#^/workflows/(\d+)/toggle$#', $path, $m) && $method === 'POST') {
        return WorkflowsController::toggle((int)$m[1]);
    }
    if (preg_match('#^/workflows/(\d+)/enroll$#', $path, $m) && $method === 'POST') {
        return WorkflowsController::enroll((int)$m[1]);
    }
    if (preg_match('#^/workflows/(\d+)/enrollments$#', $path, $m) && $method === 'GET') {
        return WorkflowsController::getEnrollments((int)$m[1]);
    }
    if (preg_match('#^/workflows/(\d+)/enrollments/(\d+)/logs$#', $path, $m) && $method === 'GET') {
        return WorkflowsController::getExecutionLogs((int)$m[1], (int)$m[2]);
    }

    // ==================== P3: REVIEW REQUESTS (Reputation) ====================
    if ($path === '/review-requests' && $method === 'GET') return ReviewRequestsController::index();
    if ($path === '/review-requests' && $method === 'POST') return ReviewRequestsController::send();
    if ($path === '/review-requests/stats' && $method === 'GET') return ReviewRequestsController::stats();
    if ($path === '/review-requests/bulk' && $method === 'POST') return ReviewRequestsController::sendBulk();
    if ($path === '/review-requests/platforms' && $method === 'GET') return ReviewRequestsController::getPlatforms();
    if ($path === '/review-requests/platforms' && $method === 'POST') return ReviewRequestsController::savePlatform();
    if (preg_match('#^/review-requests/platforms/(\d+)$#', $path, $m) && $method === 'DELETE') {
        return ReviewRequestsController::deletePlatform((int)$m[1]);
    }
    // Public review tracking (no auth)
    if (preg_match('#^/r/([a-f0-9]+)$#', $path, $m) && $method === 'GET') {
        return ReviewRequestsController::trackClick($m[1]);
    }
    if ($path === '/review-requests/record' && $method === 'POST') return ReviewRequestsController::recordReview();

    // ==================== CRM ROUTES ====================
    if ($path === '/crm/dashboard' && $method === 'GET') return CRMController::getDashboard();
    if ($path === '/crm/leads' && $method === 'GET') return CRMController::getLeads();
    if ($path === '/crm/leads' && $method === 'POST') return CRMController::createLead();
    if (preg_match('#^/crm/leads/(\d+)$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return CRMController::updateLead((int)$m[1]);
    }
    if (preg_match('#^/crm/leads/(\d+)/activities$#', $path, $m)) {
        if ($method === 'GET') return CRMController::getLeadActivities((int)$m[1]);
        if ($method === 'POST') return CRMController::addLeadActivity((int)$m[1]);
    }
    if ($path === '/crm/activities' && $method === 'GET') return CRMController::getAllActivities();
    if ($path === '/crm/tasks' && $method === 'GET') return CRMController::getTasks();
    if ($path === '/crm/tasks' && $method === 'POST') return CRMController::createTask();
    if (preg_match('#^/crm/tasks/(\d+)/status$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return CRMController::updateTaskStatus((int)$m[1]);
    }
    if ($path === '/crm/analytics' && $method === 'GET') return CRMController::getAnalytics();
    if ($path === '/crm/goals/daily' && $method === 'GET') return CRMController::getDailyGoals();
    if ($path === '/crm/goals/daily' && ($method === 'PUT' || $method === 'PATCH')) return CRMController::updateDailyGoals();
    if ($path === '/crm/forecast' && $method === 'GET') return CRMController::getForecast();
    if ($path === '/crm/playbooks' && $method === 'GET') return CRMController::getPlaybooks();
    if ($path === '/crm/playbooks' && $method === 'POST') return CRMController::createPlaybook();
    if ($path === '/crm/settings' && $method === 'GET') return CRMController::getSettings();
    if ($path === '/crm/settings' && ($method === 'PUT' || $method === 'PATCH')) return CRMController::updateSettings();
    if ($path === '/crm/products' && $method === 'GET') return CRMController::getProducts();

    // ==================== P6: FUNNELS ====================
    if ($path === '/funnels' && $method === 'GET') return FunnelsController::index();
    if ($path === '/funnels' && $method === 'POST') return FunnelsController::store();
    if (preg_match('#^/funnels/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return FunnelsController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return FunnelsController::update($id);
        if ($method === 'DELETE') return FunnelsController::destroy($id);
    }
    if (preg_match('#^/funnels/(\d+)/publish$#', $path, $m) && $method === 'POST') {
        return FunnelsController::publish((int)$m[1]);
    }
    if (preg_match('#^/funnels/(\d+)/analytics$#', $path, $m) && $method === 'GET') {
        return FunnelsController::analytics((int)$m[1]);
    }
    if (preg_match('#^/funnels/(\d+)/steps/(\d+)/view$#', $path, $m) && $method === 'POST') {
        return FunnelsController::trackView((int)$m[1], (int)$m[2]);
    }
    if (preg_match('#^/funnels/(\d+)/steps/(\d+)/convert$#', $path, $m) && $method === 'POST') {
        return FunnelsController::trackConversion((int)$m[1], (int)$m[2]);
    }

    // ==================== P6: MEMBERSHIPS ====================
    if ($path === '/memberships' && $method === 'GET') return MembershipsController::index();
    if ($path === '/memberships' && $method === 'POST') return MembershipsController::store();
    if (preg_match('#^/memberships/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return MembershipsController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return MembershipsController::update($id);
        if ($method === 'DELETE') return MembershipsController::destroy($id);
    }
    if (preg_match('#^/memberships/(\d+)/content$#', $path, $m) && $method === 'POST') {
        return MembershipsController::addContent((int)$m[1]);
    }
    if (preg_match('#^/memberships/(\d+)/content/(\d+)$#', $path, $m)) {
        if ($method === 'PUT' || $method === 'PATCH') return MembershipsController::updateContent((int)$m[1], (int)$m[2]);
        if ($method === 'DELETE') return MembershipsController::deleteContent((int)$m[1], (int)$m[2]);
    }
    if (preg_match('#^/memberships/(\d+)/members$#', $path, $m)) {
        if ($method === 'GET') return MembershipsController::getMembers((int)$m[1]);
        if ($method === 'POST') return MembershipsController::grantAccess((int)$m[1]);
    }
    if (preg_match('#^/memberships/(\d+)/members/(\d+)$#', $path, $m) && $method === 'DELETE') {
        return MembershipsController::revokeAccess((int)$m[1], (int)$m[2]);
    }
    if (preg_match('#^/memberships/(\d+)/members/(\d+)/progress$#', $path, $m) && $method === 'POST') {
        return MembershipsController::updateProgress((int)$m[1], (int)$m[2]);
    }

    // ==================== Calendar Sync Routes ====================
    require_once __DIR__ . '/../src/controllers/CalendarSyncController.php';
    
    if ($path === '/calendar-sync/settings') {
        if ($method === 'GET') return CalendarSyncController::getSettings();
        if ($method === 'PUT' || $method === 'PATCH') return CalendarSyncController::updateSettings();
    }
    
    if ($path === '/calendar-sync/connections' && $method === 'GET') {
        return CalendarSyncController::listConnections();
    }
    
    if ($path === '/calendar-sync/oauth/url' && $method === 'POST') {
        return CalendarSyncController::getOAuthUrl();
    }
    
    if ($path === '/calendar-sync/oauth/callback' && $method === 'POST') {
        return CalendarSyncController::completeOAuth();
    }
    
    if (preg_match('#^/calendar-sync/connections/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return CalendarSyncController::getConnection($id);
        if ($method === 'PUT' || $method === 'PATCH') return CalendarSyncController::updateConnection($id);
        if ($method === 'DELETE') return CalendarSyncController::deleteConnection($id);
    }
    
    if (preg_match('#^/calendar-sync/connections/([^/]+)/sync$#', $path, $m) && $method === 'POST') {
        return CalendarSyncController::syncNow($m[1]);
    }
    
    if (preg_match('#^/calendar-sync/connections/([^/]+)/calendars$#', $path, $m) && $method === 'GET') {
        return CalendarSyncController::getExternalCalendars($m[1]);
    }
    
    if (preg_match('#^/calendar-sync/connections/([^/]+)/calendar$#', $path, $m) && $method === 'PUT') {
        return CalendarSyncController::selectCalendar($m[1]);
    }

    if ($path === '/calendar-sync/external-events' && $method === 'GET') {
        return CalendarSyncController::getExternalEvents();
    }

    if ($path === '/calendar-sync/availability-blocks' && $method === 'GET') {
        return CalendarSyncController::getAvailabilityBlocks();
    }

    if ($path === '/calendar-sync/check-conflicts' && $method === 'GET') {
        return CalendarSyncController::checkConflicts();
    }

    if ($path === '/calendar-sync/available-slots' && $method === 'GET') {
        return CalendarSyncController::getAvailableSlots();
    }

    if ($path === '/calendar-sync/export-appointment' && $method === 'POST') {
        return CalendarSyncController::exportAppointment();
    }

    if (preg_match('#^/calendar-sync/exported/([^/]+)$#', $path, $m) && $method === 'DELETE') {
        return CalendarSyncController::removeExported($m[1]);
    }

    if ($path === '/calendar-sync/sync-all' && $method === 'POST') {
        return CalendarSyncController::syncAll();
    }



    // ==================== Phone Provisioning Routes ====================
    require_once __DIR__ . '/../src/services/PhoneProvisioningService.php';
    
    if ($path === '/phone/search' && $method === 'GET') {
        $areaCode = $_GET['area_code'] ?? '';
        $country = $_GET['country'] ?? 'US';
        $result = PhoneProvisioningService::searchAvailableNumbers($areaCode, $country);
        return Response::json($result);
    }
    
    if ($path === '/phone/purchase' && $method === 'POST') {
        $body = get_json_body();
        $result = PhoneProvisioningService::purchaseNumber(
            $ctx->workspaceId,
            $body['phone_number'] ?? '',
            $body['friendly_name'] ?? null
        );
        return Response::json($result);
    }
    
    if (preg_match('#^/phone/(\d+)/release$#', $path, $m) && $method === 'POST') {
        $result = PhoneProvisioningService::releaseNumber((int)$m[1]);
        return Response::json($result);
    }
    
    if (preg_match('#^/phone/ivr/(\d+)$#', $path, $m) && $method === 'GET') {
        $response = PhoneProvisioningService::generateIvrResponse((int)$m[1]);
        header('Content-Type: application/xml');
        echo $response;
        exit;
    }

    // ==================== Review Integration Routes ====================
    require_once __DIR__ . '/../src/services/ReviewIntegrationService.php';
    
    if ($path === '/reviews/google/connect' && $method === 'POST') {
        $body = get_json_body();
        $platformConfigId = $body['platform_config_id'] ?? null;
        if (!$platformConfigId) {
            return Response::json(['error' => 'platform_config_id required'], 400);
        }
        $authUrl = ReviewIntegrationService::getGoogleBusinessAuthUrl($ctx->workspaceId, $platformConfigId);
        return Response::json(['auth_url' => $authUrl]);
    }
    
    if ($path === '/reviews/google/callback' && $method === 'GET') {
        $code = $_GET['code'] ?? null;
        $state = $_GET['state'] ?? null;
        if (!$code || !$state) {
            return Response::json(['error' => 'Invalid callback'], 400);
        }
        $result = ReviewIntegrationService::handleGoogleBusinessCallback($code, $state);
        return Response::json($result);
    }
    
    if ($path === '/reviews/facebook/connect' && $method === 'POST') {
        $body = get_json_body();
        $platformConfigId = $body['platform_config_id'] ?? null;
        if (!$platformConfigId) {
            return Response::json(['error' => 'platform_config_id required'], 400);
        }
        $authUrl = ReviewIntegrationService::getFacebookAuthUrl($ctx->workspaceId, $platformConfigId);
        return Response::json(['auth_url' => $authUrl]);
    }
    
    if (preg_match('#^/reviews/platforms/(\d+)/sync$#', $path, $m) && $method === 'POST') {
        $body = get_json_body();
        $platform = $body['platform'] ?? 'google';
        
        if ($platform === 'google') {
            $result = ReviewIntegrationService::syncGoogleBusinessReviews((int)$m[1]);
        } else {
            $result = ReviewIntegrationService::syncFacebookReviews((int)$m[1]);
        }
        return Response::json($result);
    }
    
    if (preg_match('#^/reviews/platforms/(\d+)/disconnect$#', $path, $m) && $method === 'POST') {
        $result = ReviewIntegrationService::disconnect((int)$m[1]);
        return Response::json(['success' => $result]);
    }

    // ==================== PAYMENT TRANSACTIONS ====================
    if ($path === '/payment-transactions' && $method === 'POST') return PaymentTransactionsController::recordPayment();
    if ($path === '/payment-transactions' && $method === 'GET') return PaymentTransactionsController::listTransactions();

    // ==================== WEBCHAT ====================
    if ($path === '/webchat/widgets' && $method === 'GET') return WebchatController::listWidgets();
    if ($path === '/webchat/widgets' && $method === 'POST') return WebchatController::createWidget();
    if (preg_match('#^/webchat/widgets/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return WebchatController::getWidget($id);
        if ($method === 'PUT' || $method === 'PATCH') return WebchatController::updateWidget($id);
    }
    // Public webchat endpoints (no auth)
    if ($path === '/webchat/init' && $method === 'POST') return WebchatController::initSession();
    if ($path === '/webchat/message' && $method === 'POST') return WebchatController::sendMessage();

    // ==================== REVIEW MONITORING ====================
    if ($path === '/review-monitoring/platforms' && $method === 'GET') return ReviewMonitoringController::listConnections();
    if ($path === '/review-monitoring/platforms' && $method === 'POST') return ReviewMonitoringController::connectPlatform();
    if (preg_match('#^/review-monitoring/platforms/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return ReviewMonitoringController::getConnection($id);
        if ($method === 'PUT' || $method === 'PATCH') return ReviewMonitoringController::updateConnection($id);
        if ($method === 'DELETE') return ReviewMonitoringController::deleteConnection($id);
    }
    if (preg_match('#^/review-monitoring/platforms/(\d+)/sync$#', $path, $m) && $method === 'POST') {
        return ReviewMonitoringController::syncReviews((int)$m[1]);
    }
    if ($path === '/review-monitoring/reviews' && $method === 'GET') return ReviewMonitoringController::listReviews();
    if (preg_match('#^/review-monitoring/reviews/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return ReviewMonitoringController::getReview($id);
    }
    if (preg_match('#^/review-monitoring/reviews/(\d+)/respond$#', $path, $m) && $method === 'POST') {
        return ReviewMonitoringController::respondToReview((int)$m[1]);
    }
    if (preg_match('#^/review-monitoring/reviews/(\d+)/status$#', $path, $m) && $method === 'PUT') {
        return ReviewMonitoringController::updateReviewStatus((int)$m[1]);
    }
    if ($path === '/review-monitoring/dashboard' && $method === 'GET') return ReviewMonitoringController::getDashboard();
    if ($path === '/review-monitoring/templates' && $method === 'GET') return ReviewMonitoringController::listTemplates();
    if ($path === '/review-monitoring/templates' && $method === 'POST') return ReviewMonitoringController::createTemplate();

    // ==================== WEBHOOKS ====================
    if ($path === '/webhooks' && $method === 'GET') return WebhooksController::listEndpoints();
    if ($path === '/webhooks' && $method === 'POST') return WebhooksController::createEndpoint();
    if ($path === '/webhooks/events' && $method === 'GET') return WebhooksController::getEventCatalog();
    if (preg_match('#^/webhooks/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return WebhooksController::getEndpoint($id);
        if ($method === 'PUT' || $method === 'PATCH') return WebhooksController::updateEndpoint($id);
        if ($method === 'DELETE') return WebhooksController::deleteEndpoint($id);
    }
    if (preg_match('#^/webhooks/(\d+)/test$#', $path, $m) && $method === 'POST') {
        return WebhooksController::testEndpoint((int)$m[1]);
    }
    if ($path === '/webhooks/deliveries' && $method === 'GET') return WebhooksController::listDeliveries();
    if (preg_match('#^/webhooks/(\d+)/deliveries$#', $path, $m) && $method === 'GET') {
        return WebhooksController::listDeliveries((int)$m[1]);
    }
    if (preg_match('#^/webhooks/deliveries/(\d+)$#', $path, $m) && $method === 'GET') {
        return WebhooksController::getDelivery((int)$m[1]);
    }
    if (preg_match('#^/webhooks/deliveries/(\d+)/retry$#', $path, $m) && $method === 'POST') {
        return WebhooksController::retryDelivery((int)$m[1]);
    }

    // ==================== QUICKBOOKS ====================
    if ($path === '/quickbooks/connection' && $method === 'GET') return QuickBooksController::getConnection();
    if ($path === '/quickbooks/connect' && $method === 'POST') return QuickBooksController::connect();
    if ($path === '/quickbooks/disconnect' && $method === 'POST') return QuickBooksController::disconnect();
    if ($path === '/quickbooks/settings' && $method === 'PUT') return QuickBooksController::updateSettings();
    if (preg_match('#^/quickbooks/export/invoice/(\d+)$#', $path, $m) && $method === 'POST') {
        return QuickBooksController::exportInvoice((int)$m[1]);
    }
    if (preg_match('#^/quickbooks/export/payment/(\d+)$#', $path, $m) && $method === 'POST') {
        return QuickBooksController::exportPayment((int)$m[1]);
    }
    if ($path === '/quickbooks/sync-status' && $method === 'GET') return QuickBooksController::getSyncStatus();
    if ($path === '/quickbooks/sync-all' && $method === 'POST') return QuickBooksController::syncAll();

    // ==================== DUNNING ====================
    if ($path === '/dunning/schedules' && $method === 'GET') return DunningController::listSchedules();
    if ($path === '/dunning/schedules' && $method === 'POST') return DunningController::createSchedule();
    if (preg_match('#^/dunning/schedules/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT' || $method === 'PATCH') return DunningController::updateSchedule($id);
        if ($method === 'DELETE') return DunningController::deleteSchedule($id);
    }
    if ($path === '/dunning/overdue-invoices' && $method === 'GET') return DunningController::getOverdueInvoices();
    if ($path === '/dunning/process' && $method === 'POST') return DunningController::processReminders();
    if (preg_match('#^/dunning/send/(\d+)$#', $path, $m) && $method === 'POST') {
        return DunningController::sendManualReminder((int)$m[1]);
    }

    // ==================== PAGE BUILDER V2 ====================
    if ($path === '/page-builder/save' && $method === 'POST') return PageBuilderController::savePage();
    if (preg_match('#^/page-builder/pages/(\d+)$#', $path, $m) && $method === 'GET') {
        return PageBuilderController::getPage((int)$m[1]);
    }
    if ($path === '/page-builder/components' && $method === 'GET') return PageBuilderController::listComponents();
    if ($path === '/page-builder/components' && $method === 'POST') return PageBuilderController::saveComponent();

    // ==================== CHECKOUT & ECOMMERCE ====================
    if ($path === '/checkout/forms' && $method === 'GET') return CheckoutController::listCheckoutForms();
    if ($path === '/checkout/forms' && $method === 'POST') return CheckoutController::createCheckoutForm();
    if ($path === '/checkout/orders' && $method === 'GET') return CheckoutController::listOrders();
    if ($path === '/checkout/orders' && $method === 'POST') return CheckoutController::createOrder();
    if (preg_match('#^/checkout/orders/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return CheckoutController::getOrder($id);
        if ($method === 'PUT' || $method === 'PATCH') return CheckoutController::updateOrderStatus($id);
    }

    // ==================== CLIENT PORTAL V2 ====================
    if ($path === '/portal/client' && $method === 'GET') {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            Response::error('Unauthorized', 401);
            return;
        }
        Response::json([
            'workspace_id' => $ctx->workspaceId,
            'company_id' => $ctx->activeCompanyId ?? null,
            'portal_enabled' => true,
            'features' => [
                'documents' => true,
                'messages' => true,
                'appointments' => true,
                'invoices' => true
            ]
        ]);
        return;
    }
    if ($path === '/portal/documents' && $method === 'GET') return ClientPortalController::listDocuments();
    if ($path === '/portal/documents' && $method === 'POST') return ClientPortalController::uploadDocument();
    if (preg_match('#^/portal/documents/(\d+)/sign$#', $path, $m) && $method === 'POST') {
        return ClientPortalController::signDocument((int)$m[1]);
    }
    if ($path === '/portal/messages' && $method === 'GET') return ClientPortalController::listMessages();
    if ($path === '/portal/messages' && $method === 'POST') return ClientPortalController::sendMessage();
    if (preg_match('#^/portal/messages/(\d+)/read$#', $path, $m) && $method === 'POST') {
        return ClientPortalController::markMessageRead((int)$m[1]);
    }

    // ==================== OMNI-CHANNEL ====================
    if ($path === '/omnichannel/facebook/pages' && $method === 'GET') return OmniChannelController::listFacebookPages();
    if ($path === '/omnichannel/facebook/pages' && $method === 'POST') return OmniChannelController::connectFacebookPage();
    if (preg_match('#^/omnichannel/facebook/pages/(\d+)$#', $path, $m) && $method === 'DELETE') {
        return OmniChannelController::disconnectFacebookPage((int)$m[1]);
    }
    if ($path === '/omnichannel/instagram/accounts' && $method === 'GET') return OmniChannelController::listInstagramAccounts();
    if ($path === '/omnichannel/instagram/accounts' && $method === 'POST') return OmniChannelController::connectInstagram();
    if ($path === '/omnichannel/gmb/locations' && $method === 'GET') return OmniChannelController::listGMBLocations();
    if ($path === '/omnichannel/gmb/locations' && $method === 'POST') return OmniChannelController::connectGMB();
    if ($path === '/omnichannel/messages' && $method === 'GET') return OmniChannelController::listMessages();
    if ($path === '/omnichannel/messages' && $method === 'POST') return OmniChannelController::queueMessage();

    // ==================== INSTAGRAM DM ====================
    require_once __DIR__ . '/../src/controllers/InstagramController.php';
    if ($path === '/instagram/connect' && $method === 'POST') return InstagramController::connectAccount();
    if ($path === '/instagram/accounts' && $method === 'GET') return InstagramController::listAccounts();
    if (preg_match('#^/instagram/accounts/(\d+)$#', $path, $m) && $method === 'DELETE') {
        return InstagramController::disconnectAccount((int)$m[1]);
    }
    if ($path === '/instagram/conversations' && $method === 'GET') return InstagramController::getConversations();
    if ($path === '/instagram/send' && $method === 'POST') return InstagramController::sendMessage();
    if ($path === '/instagram/webhook' && $method === 'POST') return InstagramController::handleWebhook();
    if ($path === '/instagram/webhook' && $method === 'GET') {
        // Webhook verification for Instagram
        $verify_token = $_GET['hub_verify_token'] ?? '';
        $challenge = $_GET['hub_challenge'] ?? '';
        if ($verify_token === ($_ENV['INSTAGRAM_VERIFY_TOKEN'] ?? 'xordon_instagram_verify')) {
            echo $challenge;
            exit;
        }
        Response::error('Invalid verify token', 403);
    }

    // ==================== AGENCY SAAS ====================
    if ($path === '/agency/snapshots' && $method === 'GET') return AgencySaaSController::listSnapshots();
    if ($path === '/agency/snapshots' && $method === 'POST') return AgencySaaSController::createSnapshot();
    if (preg_match('#^/agency/snapshots/(\d+)/clone$#', $path, $m) && $method === 'POST') {
        return AgencySaaSController::cloneSnapshot((int)$m[1]);
    }
    if ($path === '/agency/usage' && $method === 'GET') return AgencySaaSController::getUsageMetrics();
    if ($path === '/agency/usage' && $method === 'POST') return AgencySaaSController::trackUsage();
    if ($path === '/agency/plans' && $method === 'GET') return AgencySaaSController::listPlans();
    if ($path === '/agency/subscription' && $method === 'GET') return AgencySaaSController::getSubscription();
    if ($path === '/agency/subscription' && $method === 'PUT') return AgencySaaSController::updateSubscription();

    // ==================== WORKFLOW BUILDER ====================
    if ($path === '/workflow-builder/save' && $method === 'POST') return WorkflowBuilderController::saveWorkflow();
    if (preg_match('#^/workflow-builder/workflows/(\d+)$#', $path, $m) && $method === 'GET') {
        return WorkflowBuilderController::getWorkflow((int)$m[1]);
    }
    if ($path === '/workflow-builder/templates' && $method === 'GET') return WorkflowBuilderController::listTemplates();

    // ==================== AI FEATURES ====================
    if ($path === '/ai/generate-content' && $method === 'POST') return AIFeaturesController::generateContent();
    if ($path === '/ai/generations' && $method === 'GET') return AIFeaturesController::listGenerations();
    if (preg_match('#^/ai/generations/(\d+)/rate$#', $path, $m) && $method === 'POST') {
        return AIFeaturesController::rateGeneration((int)$m[1]);
    }
    if ($path === '/ai/sentiment-analysis' && $method === 'POST') return AIFeaturesController::analyzeSentiment();
    if ($path === '/ai/sentiment-analysis' && $method === 'GET') return AIFeaturesController::getSentimentAnalysis();
    if ($path === '/ai/recommendations' && $method === 'GET') return AIFeaturesController::getRecommendations();
    if (preg_match('#^/ai/recommendations/(\d+)$#', $path, $m) && $method === 'PUT') {
        return AIFeaturesController::updateRecommendationStatus((int)$m[1]);
    }

    // ==================== ADVANCED ANALYTICS ====================
    if ($path === '/analytics/dashboards' && $method === 'GET') return AdvancedAnalyticsController::listDashboards();
    if ($path === '/analytics/dashboards' && $method === 'POST') return AdvancedAnalyticsController::createDashboard();
    if (preg_match('#^/analytics/dashboards/(\d+)$#', $path, $m) && $method === 'PUT') {
        return AdvancedAnalyticsController::updateDashboard((int)$m[1]);
    }
    if ($path === '/analytics/events' && $method === 'POST') return AdvancedAnalyticsController::trackEvent();
    if ($path === '/analytics/events' && $method === 'GET') return AdvancedAnalyticsController::getEvents();
    if ($path === '/analytics/funnel' && $method === 'GET') return AdvancedAnalyticsController::getFunnelAnalytics();
    if ($path === '/analytics/cohort' && $method === 'GET') return AdvancedAnalyticsController::getCohortAnalysis();

    // ==================== MOBILE API ====================
    if ($path === '/mobile/devices/register' && $method === 'POST') return MobileAPIController::registerDevice();
    if ($path === '/mobile/devices/unregister' && $method === 'POST') return MobileAPIController::unregisterDevice();
    if ($path === '/mobile/push/send' && $method === 'POST') return MobileAPIController::sendPushNotification();
    if ($path === '/mobile/push/notifications' && $method === 'GET') return MobileAPIController::getNotifications();
    if ($path === '/mobile/sessions/start' && $method === 'POST') return MobileAPIController::startSession();
    if ($path === '/mobile/sessions/end' && $method === 'POST') return MobileAPIController::endSession();
    if ($path === '/mobile/dashboard' && $method === 'GET') return MobileAPIController::getDashboardData();

    // ==================== REPORTING ====================
    if ($path === '/reports/scheduled' && $method === 'GET') return ReportingController::listScheduledReports();
    if ($path === '/reports/scheduled' && $method === 'POST') return ReportingController::createScheduledReport();
    if (preg_match('#^/reports/scheduled/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT') return ReportingController::updateScheduledReport($id);
        if ($method === 'DELETE') return ReportingController::deleteScheduledReport($id);
    }
    if ($path === '/reports/export' && $method === 'POST') return ReportingController::exportReport();
    if ($path === '/reports/exports' && $method === 'GET') return ReportingController::listExports();
    if (preg_match('#^/reports/exports/(\d+)$#', $path, $m) && $method === 'GET') {
        return ReportingController::getExportStatus((int)$m[1]);
    }

    // ==================== LEAD MARKETPLACE ====================
    // Lead Marketplace: Services
    if ($path === '/lead-marketplace/services' && $method === 'GET') return LeadMarketplaceController::getServices();
    if ($path === '/lead-marketplace/services' && $method === 'POST') return LeadMarketplaceController::createService();
    if (preg_match('#^/lead-marketplace/services/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return LeadMarketplaceController::getService($id);
        if ($method === 'PUT' || $method === 'PATCH') return LeadMarketplaceController::updateService($id);
        if ($method === 'DELETE') return LeadMarketplaceController::deleteService($id);
    }
    // Lead Marketplace: Service Pros (Admin)
    if ($path === '/lead-marketplace/pros' && $method === 'GET') return LeadMarketplaceController::getPros();
    if ($path === '/lead-marketplace/pros/register' && $method === 'POST') return LeadMarketplaceController::registerPro();
    if ($path === '/lead-marketplace/pros/me' && $method === 'GET') return LeadMarketplaceController::getMyProProfile();
    if (preg_match('#^/lead-marketplace/pros/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return LeadMarketplaceController::getPro($id);
        if ($method === 'PUT' || $method === 'PATCH') return LeadMarketplaceController::updatePro($id);
    }

    // Pro Preferences & Settings
    if ($path === '/lead-marketplace/preferences' && ($method === 'PUT' || $method === 'PATCH')) return LeadMarketplaceController::updatePreferences();
    if ($path === '/lead-marketplace/offerings' && ($method === 'PUT' || $method === 'PATCH')) return LeadMarketplaceController::updateServiceOfferings();
    if ($path === '/lead-marketplace/service-areas' && ($method === 'PUT' || $method === 'PATCH')) return LeadMarketplaceController::updateServiceAreas();

    // Lead Requests (Public + Admin)
    if ($path === '/lead-marketplace/leads' && $method === 'GET') return LeadMatchesController::getLeadRequests();
    if ($path === '/lead-marketplace/leads' && $method === 'POST') return LeadMatchesController::createLeadRequest();
    if (preg_match('#^/lead-marketplace/leads/(\d+)$#', $path, $m) && $method === 'GET') {
        return LeadMatchesController::getLeadRequest((int)$m[1]);
    }
    if (preg_match('#^/lead-marketplace/leads/(\d+)/route$#', $path, $m) && $method === 'POST') {
        return LeadMatchesController::routeLeadRequest((int)$m[1]);
    }
    if (preg_match('#^/lead-marketplace/leads/(\d+)/refund$#', $path, $m) && $method === 'POST') {
        return LeadMatchesController::refundLead((int)$m[1]);
    }
    if ($path === '/lead-marketplace/leads/stats' && $method === 'GET') return LeadMatchesController::getLeadStats();

    // Lead Matches (Provider Inbox)
    if ($path === '/lead-marketplace/matches' && $method === 'GET') return LeadMatchesController::getLeadMatches();
    if ($path === '/lead-marketplace/matches/export' && $method === 'GET') return LeadMatchesController::exportLeadMatchesCsv();
    if ($path === '/lead-marketplace/matches/stats' && $method === 'GET') return LeadMatchesController::getProviderMatchStats();
    if (preg_match('#^/lead-marketplace/matches/(\d+)$#', $path, $m) && $method === 'GET') {
        return LeadMatchesController::getLeadMatch((int)$m[1]);
    }
    if (preg_match('#^/lead-marketplace/matches/(\d+)/accept$#', $path, $m) && $method === 'POST') {
        return LeadMatchesController::acceptLeadMatch((int)$m[1]);
    }
    if (preg_match('#^/lead-marketplace/matches/(\d+)/decline$#', $path, $m) && $method === 'POST') {
        return LeadMatchesController::declineLeadMatch((int)$m[1]);
    }
    if (preg_match('#^/lead-marketplace/matches/(\d+)/quote$#', $path, $m) && $method === 'POST') {
        return LeadMatchesController::sendQuote((int)$m[1]);
    }
    if (preg_match('#^/lead-marketplace/matches/(\d+)/outcome$#', $path, $m) && $method === 'POST') {
        return LeadMatchesController::markOutcome((int)$m[1]);
    }

    // Wallet & Credits
    if ($path === '/lead-marketplace/wallet' && $method === 'GET') return WalletController::getWallet();
    if ($path === '/lead-marketplace/wallet/transactions' && $method === 'GET') return WalletController::getTransactions();
    if ($path === '/lead-marketplace/wallet/packages' && $method === 'GET') return WalletController::getCreditPackages();
    if ($path === '/lead-marketplace/wallet/checkout' && $method === 'POST') return WalletController::createCheckout();
    if ($path === '/lead-marketplace/wallet/add-credits' && $method === 'POST') return WalletController::addManualCredits();

    // Pricing Rules (Admin)
    if ($path === '/lead-marketplace/pricing-rules' && $method === 'GET') return WalletController::getPricingRules();
    if ($path === '/lead-marketplace/pricing-rules' && $method === 'POST') return WalletController::createPricingRule();
    if (preg_match('#^/lead-marketplace/pricing-rules/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT' || $method === 'PATCH') return WalletController::updatePricingRule($id);
        if ($method === 'DELETE') return WalletController::deletePricingRule($id);
    }

    // Promo Codes (Admin)
    if ($path === '/lead-marketplace/promo-codes' && $method === 'GET') return WalletController::getPromoCodes();
    if ($path === '/lead-marketplace/promo-codes' && $method === 'POST') return WalletController::createPromoCode();
    if ($path === '/lead-marketplace/promo-codes/validate' && $method === 'GET') return WalletController::validatePromoCode();

    // Webhooks (Payment callbacks)
    if ($path === '/lead-marketplace/webhooks/stripe' && $method === 'POST') return WalletController::handleStripeWebhook();
    if ($path === '/lead-marketplace/webhooks/paypal' && $method === 'POST') return WalletController::handlePayPalWebhook();
    if ($path === '/lead-marketplace/wallet/confirm-stripe' && $method === 'GET') return WalletController::confirmStripeSession();

    // ==================== MARKETPLACE REVIEWS ====================
    if ($path === '/lead-marketplace/reviews' && $method === 'GET') return MarketplaceReviewsController::getReviews();
    if ($path === '/lead-marketplace/reviews' && $method === 'POST') return MarketplaceReviewsController::createReview();
    if ($path === '/lead-marketplace/reviews/pending-for-consumer' && $method === 'GET') return MarketplaceReviewsController::getPendingReviewsForConsumer();
    if ($path === '/lead-marketplace/my-reviews' && $method === 'GET') return MarketplaceReviewsController::getMyReviews();
    if (preg_match('#^/lead-marketplace/reviews/(\d+)$#', $path, $m) && $method === 'GET') {
        return MarketplaceReviewsController::getReview((int)$m[1]);
    }
    if (preg_match('#^/lead-marketplace/reviews/(\d+)/respond$#', $path, $m) && $method === 'POST') {
        return MarketplaceReviewsController::respondToReview((int)$m[1]);
    }
    if (preg_match('#^/lead-marketplace/providers/(\d+)/reviews$#', $path, $m) && $method === 'GET') {
        return MarketplaceReviewsController::getProviderReviews((int)$m[1]);
    }
    // Admin Reviews
    if ($path === '/lead-marketplace/admin/reviews' && $method === 'GET') return MarketplaceReviewsController::adminGetReviews();
    if (preg_match('#^/lead-marketplace/admin/reviews/(\d+)$#', $path, $m)) {
        if ($method === 'PUT' || $method === 'PATCH') return MarketplaceReviewsController::adminUpdateReview((int)$m[1]);
        if ($method === 'DELETE') return MarketplaceReviewsController::adminDeleteReview((int)$m[1]);
    }

    // ==================== PROVIDER DOCUMENTS & VERIFICATION ====================
    if ($path === '/lead-marketplace/documents' && $method === 'GET') return ProviderDocumentsController::getMyDocuments();
    if ($path === '/lead-marketplace/documents' && $method === 'POST') return ProviderDocumentsController::uploadDocument();
    if (preg_match('#^/lead-marketplace/documents/(\d+)$#', $path, $m) && $method === 'DELETE') {
        return ProviderDocumentsController::deleteDocument((int)$m[1]);
    }
    if ($path === '/lead-marketplace/verification-status' && $method === 'GET') return ProviderDocumentsController::getVerificationStatus();
    // Admin Documents
    if ($path === '/lead-marketplace/admin/documents' && $method === 'GET') return ProviderDocumentsController::adminGetDocuments();
    if (preg_match('#^/lead-marketplace/admin/documents/(\d+)$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return ProviderDocumentsController::adminUpdateDocument((int)$m[1]);
    }
    if ($path === '/lead-marketplace/admin/providers/pending' && $method === 'GET') return ProviderDocumentsController::adminGetPendingProviders();
    if (preg_match('#^/lead-marketplace/admin/providers/(\d+)/approve$#', $path, $m) && ($method === 'PUT' || $method === 'POST')) {
        return ProviderDocumentsController::adminApproveProvider((int)$m[1]);
    }

    // ==================== MARKETPLACE MESSAGING ====================
    if ($path === '/lead-marketplace/messages' && $method === 'GET') return MarketplaceMessagingController::getThreads();
    if (preg_match('#^/lead-marketplace/messages/(\d+)$#', $path, $m)) {
        if ($method === 'GET') return MarketplaceMessagingController::getMessages((int)$m[1]);
        if ($method === 'POST') return MarketplaceMessagingController::sendMessage((int)$m[1]);
    }
    if (preg_match('#^/lead-marketplace/messages/(\d+)/read$#', $path, $m) && $method === 'PUT') {
        return MarketplaceMessagingController::markRead((int)$m[1]);
    }
    if ($path === '/lead-marketplace/message-preferences' && $method === 'GET') return MarketplaceMessagingController::getPreferences();
    if ($path === '/lead-marketplace/message-preferences' && ($method === 'PUT' || $method === 'PATCH')) return MarketplaceMessagingController::updatePreferences();
    // Consumer Messaging (Public)
    if ($path === '/lead-marketplace/consumer/messages' && $method === 'GET') return MarketplaceMessagingController::consumerGetThreads();
    if (preg_match('#^/lead-marketplace/consumer/messages/(\d+)$#', $path, $m) && $method === 'POST') {
        return MarketplaceMessagingController::consumerSendMessage((int)$m[1]);
    }

    // ==================== MARKETPLACE BOOKING ====================
    if ($path === '/lead-marketplace/booking/types' && $method === 'GET') return MarketplaceBookingController::getBookingTypes();
    if ($path === '/lead-marketplace/booking/types' && $method === 'POST') return MarketplaceBookingController::createBookingType();
    if ($path === '/lead-marketplace/booking/availability' && $method === 'GET') return MarketplaceBookingController::getAvailability();
    if ($path === '/lead-marketplace/booking/availability' && ($method === 'PUT' || $method === 'PATCH')) return MarketplaceBookingController::updateAvailability();
    if (preg_match('#^/lead-marketplace/booking/(\d+)/slots$#', $path, $m) && $method === 'GET') {
        return MarketplaceBookingController::getAvailableSlots((int)$m[1]);
    }
    if (preg_match('#^/lead-marketplace/booking/(\d+)$#', $path, $m) && $method === 'POST') {
        return MarketplaceBookingController::createBooking((int)$m[1]);
    }
    if (preg_match('#^/lead-marketplace/booking/(\d+)/appointment$#', $path, $m) && $method === 'GET') {
        return MarketplaceBookingController::getMatchAppointment((int)$m[1]);
    }
    if ($path === '/lead-marketplace/booking/upcoming' && $method === 'GET') return MarketplaceBookingController::getUpcomingAppointments();
    if (preg_match('#^/lead-marketplace/booking/(\d+)/cancel$#', $path, $m) && $method === 'POST') {
        return MarketplaceBookingController::cancelAppointment((int)$m[1]);
    }
    if (preg_match('#^/lead-marketplace/booking/(\d+)/complete$#', $path, $m) && $method === 'POST') {
        return MarketplaceBookingController::completeAppointment((int)$m[1]);
    }

    // ==================== PERFORMANCE BILLING (LeadSmart Pay-Per-Call) ====================
    // Billing Settings
    if ($path === '/performance-billing/settings' && $method === 'GET') return PerformanceBillingController::getSettings();
    if ($path === '/performance-billing/settings' && $method === 'POST') return PerformanceBillingController::updateSettings();
    if ($path === '/performance-billing/settings' && ($method === 'PUT' || $method === 'PATCH')) return PerformanceBillingController::updateSettings();
    
    // Call Pricing Rules
    if ($path === '/performance-billing/pricing-rules' && $method === 'GET') return PerformanceBillingController::getPricingRules();
    if ($path === '/performance-billing/pricing-rules' && $method === 'POST') return PerformanceBillingController::createPricingRule();
    if (preg_match('#^/performance-billing/pricing-rules/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT' || $method === 'PATCH') return PerformanceBillingController::updatePricingRule($id);
        if ($method === 'DELETE') return PerformanceBillingController::deletePricingRule($id);
    }
    
    // Billing Summary & Analytics
    if ($path === '/performance-billing/summary' && $method === 'GET') return PerformanceBillingController::getSummary();
    
    // Qualified Calls List
    if ($path === '/performance-billing/qualified-calls' && $method === 'GET') return PerformanceBillingController::getQualifiedCalls();
    
    // Process Call for Billing
    if (preg_match('#^/performance-billing/process-call/(\d+)$#', $path, $m) && $method === 'POST') {
        return PerformanceBillingController::processCall((int)$m[1]);
    }
    
    // Disputes
    if ($path === '/performance-billing/disputes' && $method === 'GET') return PerformanceBillingController::getDisputes();
    if ($path === '/performance-billing/disputes' && $method === 'POST') return PerformanceBillingController::createDispute();
    if (preg_match('#^/performance-billing/disputes/(\d+)/resolve$#', $path, $m) && ($method === 'PUT' || $method === 'POST')) {
        return PerformanceBillingController::resolveDispute((int)$m[1]);
    }
    
    // Price Calculator
    if ($path === '/performance-billing/calculate-price' && $method === 'POST') return PerformanceBillingController::calculatePrice();

    // ============================================
    // SALES ENABLEMENT ROUTES
    // ============================================
    
    // Content Library
    if ($path === '/sales-enablement/content' && $method === 'GET') return SalesEnablementController::listContent();
    if ($path === '/sales-enablement/content' && $method === 'POST') return SalesEnablementController::createContent();
    if (preg_match('#^/sales-enablement/content/(\d+)$#', $path, $m)) {
        if ($method === 'GET') return SalesEnablementController::getContent((int)$m[1]);
        if ($method === 'PUT') return SalesEnablementController::updateContent((int)$m[1]);
        if ($method === 'DELETE') return SalesEnablementController::deleteContent((int)$m[1]);
    }
    if (preg_match('#^/sales-enablement/content/(\d+)/track$#', $path, $m) && $method === 'POST') {
        return SalesEnablementController::trackContentEngagement((int)$m[1]);
    }
    
    // Playbooks
    if ($path === '/sales-enablement/playbooks' && $method === 'GET') return SalesEnablementController::listPlaybooks();
    if ($path === '/sales-enablement/playbooks' && $method === 'POST') return SalesEnablementController::createPlaybook();
    if (preg_match('#^/sales-enablement/playbooks/(\d+)$#', $path, $m)) {
        if ($method === 'GET') return SalesEnablementController::getPlaybook((int)$m[1]);
        if ($method === 'PUT') return SalesEnablementController::updatePlaybook((int)$m[1]);
    }
    if (preg_match('#^/sales-enablement/playbooks/(\d+)/sections$#', $path, $m) && $method === 'POST') {
        return SalesEnablementController::addPlaybookSection((int)$m[1]);
    }
    if (preg_match('#^/sales-enablement/playbooks/(\d+)/sections/(\d+)$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return SalesEnablementController::updatePlaybookSection((int)$m[1], (int)$m[2]);
    }
    
    // Snippets
    if ($path === '/sales-enablement/snippets' && $method === 'GET') return SalesEnablementController::listSnippets();
    if ($path === '/sales-enablement/snippets' && $method === 'POST') return SalesEnablementController::createSnippet();
    if (preg_match('#^/sales-enablement/snippets/(\d+)$#', $path, $m)) {
        if ($method === 'PUT') return SalesEnablementController::updateSnippet((int)$m[1]);
        if ($method === 'DELETE') return SalesEnablementController::deleteSnippet((int)$m[1]);
    }
    if (preg_match('#^/sales-enablement/snippets/(\d+)/use$#', $path, $m) && $method === 'POST') {
        return SalesEnablementController::useSnippet((int)$m[1]);
    }
    
    // Battle Cards
    if ($path === '/sales-enablement/battle-cards' && $method === 'GET') return SalesEnablementController::listBattleCards();
    if ($path === '/sales-enablement/battle-cards' && $method === 'POST') return SalesEnablementController::createBattleCard();
    if (preg_match('#^/sales-enablement/battle-cards/(\d+)$#', $path, $m)) {
        if ($method === 'GET') return SalesEnablementController::getBattleCard((int)$m[1]);
        if ($method === 'PUT') return SalesEnablementController::updateBattleCard((int)$m[1]);
    }
    
    // Analytics
    if ($path === '/sales-enablement/analytics/dashboard' && $method === 'GET') return SalesEnablementController::getAnalyticsDashboard();

    // ============================================
    // BUSINESS LISTINGS ROUTES
    // ============================================
    
    // Directories (Platform Catalog)
    if ($path === '/listings/directories' && $method === 'GET') return ListingsController::getDirectories();
    
    // BrightLocal Extensions
    if ($path === '/listings/directories/brightlocal' && $method === 'GET') return ListingsController::getBrightLocalDirectories();
    if ($path === '/listings/categories/brightlocal' && $method === 'GET') return ListingsController::getBrightLocalCategories();
    
    // Listings CRUD
    if ($path === '/listings' && $method === 'GET') return ListingsController::getListings();
    if ($path === '/listings' && $method === 'POST') return ListingsController::addListing();
    if ($path === '/listings/bulk' && $method === 'POST') return ListingsController::bulkAddListings();
    if ($path === '/listings/scan' && $method === 'POST') return ListingsController::scanListings();
    if ($path === '/listings/bulk-sync' && $method === 'POST') return ListingsController::bulkSyncListings();
    if ($path === '/listings/bulk-update-method' && $method === 'POST') return ListingsController::bulkUpdateMethod();
    if ($path === '/listings/import/google-sheets' && $method === 'POST') return ListingsController::importFromGoogleSheets();
    if ($path === '/listings/import/apify-citations' && $method === 'POST') return ListingsController::importFromApify();
    
    if (preg_match('#^/listings/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'PUT' || $method === 'PATCH') return ListingsController::updateListing($id);
        if ($method === 'DELETE') return ListingsController::deleteListing($id);
    }
    if (preg_match('#^/listings/(\d+)/sync$#', $path, $m) && $method === 'POST') {
        return ListingsController::syncListing((int)$m[1]);
    }
    if (preg_match('#^/listings/(\d+)/sync-history$#', $path, $m) && $method === 'GET') {
        return ListingsController::getSyncHistory((int)$m[1]);
    }
    if (preg_match('#^/listings/(\d+)/claim$#', $path, $m) && $method === 'POST') {
        return ListingsController::claimListing((int)$m[1]);
    }
    if (preg_match('#^/listings/(\d+)/verify$#', $path, $m) && $method === 'POST') {
        return ListingsController::verifyListing((int)$m[1]);
    }
    if (preg_match('#^/listings/(\d+)/reviews$#', $path, $m) && $method === 'GET') {
        return ListingsController::getListingReviews((int)$m[1]);
    }
    
    // Listing Settings (Business Profile)
    if ($path === '/listings/settings' && $method === 'GET') return ListingsController::getSettings();
    if ($path === '/listings/settings' && $method === 'POST') return ListingsController::updateSettings();
    if ($path === '/listings/settings' && ($method === 'PUT' || $method === 'PATCH')) return ListingsController::updateSettings();
    
    // Listing Audits (Citation Audit)
    if ($path === '/listings/audits' && $method === 'GET') return ListingsController::getAudits();
    if ($path === '/listings/audits' && $method === 'POST') return ListingsController::startAudit();
    
    // Listing Duplicates
    if ($path === '/listings/duplicates' && $method === 'GET') return ListingsController::getDuplicates();
    if (preg_match('#^/listings/duplicates/(\d+)/suppress$#', $path, $m) && $method === 'POST') {
        return ListingsController::suppressDuplicate((int)$m[1]);
    }
    
    // Listing Reviews
    if ($path === '/listings/reviews' && $method === 'GET') return ListingsController::getReviews();
    if ($path === '/listings/reviews/sync' && $method === 'POST') return ListingsController::syncReviews();
    if (preg_match('#^/listings/reviews/(\d+)/reply$#', $path, $m) && $method === 'POST') {
        return ListingsController::replyToReview((int)$m[1]);
    }
    
    // Rank Tracking
    if ($path === '/listings/ranks' && $method === 'GET') return ListingsController::getRankTrackings();
    if ($path === '/listings/ranks' && $method === 'POST') return ListingsController::addRankTracking();
    if (preg_match('#^/listings/ranks/(\d+)$#', $path, $m) && $method === 'DELETE') {
        return ListingsController::deleteRankTracking((int)$m[1]);
    }
    if (preg_match('#^/listings/ranks/(\d+)/refresh$#', $path, $m) && $method === 'POST') {
        return ListingsController::refreshRankTracking((int)$m[1]);
    }
    if (preg_match('#^/listings/ranks/(\d+)/history$#', $path, $m) && $method === 'GET') {
        return ListingsController::getRankHistory((int)$m[1]);
    }

    // ============================================
    // SEO ROUTES
    // ============================================
    
    // SEO Keywords
    if ($path === '/seo/keywords' && $method === 'GET') return ListingsController::getKeywords();
    if ($path === '/seo/keywords' && $method === 'POST') return ListingsController::addKeyword();
    if ($path === '/seo/keywords/explore' && $method === 'POST') {
        // Keyword explorer - return mock data for now
        return Response::json(['data' => [], 'message' => 'Keyword exploration coming soon']);
    }
    if (preg_match('#^/seo/keywords/(\d+)$#', $path, $m) && $method === 'DELETE') {
        return ListingsController::deleteKeyword((int)$m[1]);
    }
    if (preg_match('#^/seo/keywords/(\d+)/history$#', $path, $m) && $method === 'GET') {
        return ListingsController::getKeywordHistory((int)$m[1]);
    }
    
    // SEO Pages
    if ($path === '/seo/pages' && $method === 'GET') return ListingsController::getPages();
    if ($path === '/seo/pages' && $method === 'POST') return ListingsController::addPage();
    if (preg_match('#^/seo/pages/(\d+)/audit$#', $path, $m) && $method === 'POST') {
        return ListingsController::auditPage((int)$m[1]);
    }
    
    // SEO Competitors
    if ($path === '/seo/competitors' && $method === 'GET') return ListingsController::getCompetitors();
    if ($path === '/seo/competitors' && $method === 'POST') return ListingsController::addCompetitor();
    if ($path === '/seo/competitors/citations/check' && $method === 'POST') return ListingsController::checkCompetitorCitations();
    if ($path === '/seo/competitors/search' && $method === 'POST') return ListingsController::searchCompetitorsByKeyword();
    if (preg_match('#^/seo/competitors/(\d+)$#', $path, $m) && $method === 'DELETE') {
        return ListingsController::deleteCompetitor((int)$m[1]);
    }
    
    // SEO Analytics
    if ($path === '/seo/analytics' && $method === 'GET') return ListingsController::getAnalytics();
    
    // SEO Backlinks (placeholder)
    if ($path === '/seo/backlinks' && $method === 'GET') {
        return Response::json(['data' => ['backlinks' => [], 'stats' => ['total' => 0, 'dofollow' => 0, 'nofollow' => 0]]]);
    }
    if ($path === '/seo/backlinks' && $method === 'POST') {
        return Response::json(['data' => ['id' => 1, 'message' => 'Backlink added']]);
    }
    if ($path === '/seo/backlinks/by-domain' && $method === 'GET') {
        return Response::json(['data' => []]);
    }
    if (preg_match('#^/seo/backlinks/competitor/(.+)$#', $path, $m) && $method === 'GET') {
        return Response::json(['data' => []]);
    }
    
    // SEO Audits (placeholder)
    if ($path === '/seo/audits' && $method === 'GET') {
        return Response::json(['data' => []]);
    }
    if ($path === '/seo/audits' && $method === 'POST') {
        return Response::json(['data' => ['id' => 1, 'message' => 'Audit started']]);
    }
    if (preg_match('#^/seo/audits/(\d+)$#', $path, $m) && $method === 'GET') {
        return Response::json(['data' => ['id' => (int)$m[1], 'status' => 'completed', 'score' => 75]]);
    }

    // ============================================
    // GOOGLE BUSINESS PROFILE (GMB) ROUTES
    // ============================================
    
    // Connection
    if ($path === '/gmb/connection' && $method === 'GET') {
        $controller = new GMBController();
        return $controller->getConnection();
    }
    if ($path === '/gmb/oauth-url' && $method === 'GET') {
        $controller = new GMBController();
        return $controller->getOAuthUrl();
    }
    if ($path === '/gmb/oauth-callback' && $method === 'POST') {
        $controller = new GMBController();
        return $controller->handleOAuthCallback();
    }
    if ($path === '/gmb/oauth-callback' && $method === 'GET') {
        $controller = new GMBController();
        return $controller->handleOAuthCallback();
    }
    if ($path === '/gmb/disconnect' && $method === 'POST') {
        $controller = new GMBController();
        return $controller->disconnect();
    }
    if ($path === '/gmb/refresh-token' && $method === 'POST') {
        $controller = new GMBController();
        return $controller->refreshToken();
    }
    if ($path === '/gmb/simulate-connect' && $method === 'POST') {
        $controller = new GMBController();
        return $controller->simulateConnect();
    }
    
    // Locations
    if ($path === '/gmb/locations' && $method === 'GET') {
        $controller = new GMBController();
        return $controller->getLocations();
    }
    if ($path === '/gmb/locations/sync' && $method === 'POST') {
        $controller = new GMBController();
        return $controller->syncLocations();
    }
    if (preg_match('#^/gmb/locations/(\d+)$#', $path, $m)) {
        $controller = new GMBController();
        if ($method === 'GET') return $controller->getLocation((int)$m[1]);
        if ($method === 'PUT' || $method === 'PATCH') return $controller->updateLocation((int)$m[1]);
    }
    
    // Posts
    if ($path === '/gmb/posts' && $method === 'GET') {
        $controller = new GMBController();
        return $controller->getPosts();
    }
    if ($path === '/gmb/posts/sync' && $method === 'POST') {
        $controller = new GMBController();
        return $controller->syncPosts();
    }
    if ($path === '/gmb/posts' && $method === 'POST') {
        $controller = new GMBController();
        return $controller->createPost();
    }
    if (preg_match('#^/gmb/posts/(\d+)$#', $path, $m)) {
        $controller = new GMBController();
        if ($method === 'GET') return $controller->getPost((int)$m[1]);
        if ($method === 'PUT' || $method === 'PATCH') return $controller->updatePost((int)$m[1]);
        if ($method === 'DELETE') return $controller->deletePost((int)$m[1]);
    }
    if (preg_match('#^/gmb/posts/(\d+)/publish$#', $path, $m) && $method === 'POST') {
        $controller = new GMBController();
        return $controller->publishPost((int)$m[1]);
    }
    
    // Reviews
    if ($path === '/gmb/reviews' && $method === 'GET') {
        $controller = new GMBController();
        return $controller->getReviews();
    }
    if ($path === '/gmb/reviews/sync' && $method === 'POST') {
        $controller = new GMBController();
        return $controller->syncReviews();
    }
    if (preg_match('#^/gmb/reviews/(\d+)/reply$#', $path, $m) && $method === 'POST') {
        $controller = new GMBController();
        return $controller->replyToReview((int)$m[1]);
    }
    if (preg_match('#^/gmb/reviews/(\d+)/reply$#', $path, $m) && $method === 'DELETE') {
        $controller = new GMBController();
        return $controller->deleteReply((int)$m[1]);
    }
    
    // Q&A
    if ($path === '/gmb/questions' && $method === 'GET') {
        $controller = new GMBController();
        return $controller->getQuestions();
    }
    if ($path === '/gmb/questions/sync' && $method === 'POST') {
        $controller = new GMBController();
        return $controller->syncQuestions();
    }
    if (preg_match('#^/gmb/questions/(\d+)/answer$#', $path, $m) && $method === 'POST') {
        $controller = new GMBController();
        return $controller->answerQuestion((int)$m[1]);
    }

    // Photos
    if ($path === '/gmb/photos' && $method === 'GET') {
        $controller = new GMBController();
        return $controller->getPhotos();
    }
    if ($path === '/gmb/photos/sync' && $method === 'POST') {
        $controller = new GMBController();
        return $controller->syncPhotos();
    }
    
    // Insights
    if ($path === '/gmb/insights' && $method === 'GET') {
        $controller = new GMBController();
        return $controller->getInsights();
    }
    if ($path === '/gmb/insights/sync' && $method === 'POST') {
        $controller = new GMBController();
        return $controller->syncInsights();
    }
    
    // Settings
    if ($path === '/gmb/settings' && $method === 'GET') {
        $controller = new GMBController();
        return $controller->getSettings();
    }
    if ($path === '/gmb/settings' && ($method === 'PUT' || $method === 'PATCH')) {
        $controller = new GMBController();
        return $controller->updateSettings();
    }
    
    // Dashboard
    if ($path === '/gmb/dashboard' && $method === 'GET') {
        $controller = new GMBController();
        return $controller->getDashboard();
    }
    
    // Categories
    if ($path === '/gmb/categories' && $method === 'GET') {
        $controller = new GMBController();
        return $controller->getCategories();
    }
    
    // Sync Logs
    if ($path === '/gmb/sync-logs' && $method === 'GET') {
        $controller = new GMBController();
        return $controller->getSyncLogs();
    }
    if ($path === '/gmb/sync' && $method === 'POST') {
        $controller = new GMBController();
        return $controller->triggerSync();
    }

    // ============================================================================
    // Feature Matrix Implementation Routes (AI, Courses, Memberships)
    // ============================================================================
    
    // Require necessary controllers for this section
    require_once __DIR__ . '/../src/controllers/AISettingsController.php';
    require_once __DIR__ . '/../src/controllers/CourseController.php';
    require_once __DIR__ . '/../src/controllers/EnrollmentController.php';
    require_once __DIR__ . '/../src/controllers/CertificateController.php';
    require_once __DIR__ . '/../src/controllers/ReputationController.php';
    require_once __DIR__ . '/../src/controllers/ReputationRequestsController.php';
    require_once __DIR__ . '/../src/controllers/ReputationWidgetsController.php';
    require_once __DIR__ . '/../src/controllers/ReputationSettingsController.php';
    require_once __DIR__ . '/../src/controllers/ListingsController.php';
    
    // AI Settings Routes
    if ($path === '/ai/settings' && $method === 'GET') {
        return Xordon\Controllers\AISettingsController::getSettings();
    }
    if ($path === '/ai/settings' && ($method === 'PUT' || $method === 'PATCH')) {
        return Xordon\Controllers\AISettingsController::updateSettings();
    }
    if (preg_match('#^/ai/settings/feature/(.+)$#', $path, $m) && $method === 'GET') {
        return Xordon\Controllers\AISettingsController::checkFeature($m[1]);
    }
    if ($path === '/ai/chatbot/config' && $method === 'GET') {
        return Xordon\Controllers\AISettingsController::getChatbotConfig();
    }
    
    // Course Routes
    if ($path === '/courses' && $method === 'GET') {
        return Xordon\Controllers\CourseController::index();
    }
    if ($path === '/courses' && $method === 'POST') {
        return Xordon\Controllers\CourseController::store();
    }
    if (preg_match('#^/courses/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return Xordon\Controllers\CourseController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return Xordon\Controllers\CourseController::update($id);
        if ($method === 'DELETE') return Xordon\Controllers\CourseController::delete($id);
    }
    if (preg_match('#^/courses/(\d+)/publish$#', $path, $m) && $method === 'POST') {
        return Xordon\Controllers\CourseController::publish((int)$m[1]);
    }
    if (preg_match('#^/courses/(\d+)/modules$#', $path, $m) && $method === 'POST') {
        return Xordon\Controllers\CourseController::createModule((int)$m[1]);
    }
    if (preg_match('#^/courses/(\d+)/modules/(\d+)/lessons$#', $path, $m) && $method === 'POST') {
        return Xordon\Controllers\CourseController::createLesson((int)$m[1], (int)$m[2]);
    }
    
    // Enrollment Routes
    if (preg_match('#^/courses/(\d+)/enroll$#', $path, $m) && $method === 'POST') {
        return Xordon\Controllers\EnrollmentController::enroll((int)$m[1]);
    }
    if ($path === '/enrollments' && $method === 'GET') {
        return Xordon\Controllers\EnrollmentController::getUserEnrollments();
    }
    if ($path === '/enrollments/stats' && $method === 'GET') {
        return Xordon\Controllers\EnrollmentController::getStats();
    }
    if (preg_match('#^/courses/(\d+)/enrollments$#', $path, $m) && $method === 'GET') {
        return Xordon\Controllers\EnrollmentController::getCourseEnrollments((int)$m[1]);
    }
    if (preg_match('#^/enrollments/(\d+)/progress$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return Xordon\Controllers\EnrollmentController::getProgress($id);
        if ($method === 'POST') return Xordon\Controllers\EnrollmentController::updateProgress($id);
    }
    if (preg_match('#^/enrollments/(\d+)/cancel$#', $path, $m) && $method === 'POST') {
        return Xordon\Controllers\EnrollmentController::cancel((int)$m[1]);
    }
    
    // Certificate Routes
    if ($path === '/certificates' && $method === 'GET') {
        return Xordon\Controllers\CertificateController::getUserCertificates();
    }
    if (preg_match('#^/certificates/(\d+)$#', $path, $m) && $method === 'GET') {
        return Xordon\Controllers\CertificateController::show((int)$m[1]);
    }
    if (preg_match('#^/certificates/verify/(.+)$#', $path, $m) && $method === 'GET') {
        return Xordon\Controllers\CertificateController::verify($m[1]);
    }
    if (preg_match('#^/courses/(\d+)/certificates$#', $path, $m) && $method === 'GET') {
        return Xordon\Controllers\CertificateController::getCourseCertificates((int)$m[1]);
    }
    if (preg_match('#^/enrollments/(\d+)/certificate$#', $path, $m) && $method === 'POST') {
        return Xordon\Controllers\CertificateController::generate((int)$m[1]);
    }
    if (preg_match('#^/certificates/(\d+)/download$#', $path, $m) && $method === 'GET') {
        return Xordon\Controllers\CertificateController::download((int)$m[1]);

    }

    // CallFlowsController Routes
    // ============================================================================
    
    // Reputation Module Routes
    // ============================================================================
    
    // Overview & Stats
    if ($path === '/reputation/stats' && $method === 'GET') {
        return Xordon\Controllers\ReputationController::getStats();
    }
    
    // Reviews
    if ($path === '/reputation/reviews' && $method === 'GET') {
        return Xordon\Controllers\ReputationController::getReviews();
    }
    if (preg_match('#^/reputation/reviews/(\d+)$#', $path, $m) && $method === 'GET') {
        return Xordon\Controllers\ReputationController::getReview((int)$m[1]);
    }
    if (preg_match('#^/reputation/reviews/(\d+)/reply$#', $path, $m) && $method === 'POST') {
        return Xordon\Controllers\ReputationController::replyToReview((int)$m[1]);
    }
    if (preg_match('#^/reputation/reviews/(\d+)$#', $path, $m) && ($method === 'PATCH' || $method === 'PUT')) {
        return Xordon\Controllers\ReputationController::updateReview((int)$m[1]);
    }
    if (preg_match('#^/reputation/reviews/(\d+)$#', $path, $m) && $method === 'DELETE') {
        return Xordon\Controllers\ReputationController::deleteReview((int)$m[1]);
    }
    if (preg_match('#^/reputation/reviews/(\d+)/ai-generate$#', $path, $m) && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/ReviewResponseAIController.php';
        return Xordon\Controllers\ReviewResponseAIController::generateResponse((int)$m[1]);
    }
    if (preg_match('#^/reputation/reviews/(\d+)/ai-post$#', $path, $m) && $method === 'POST') {
        require_once __DIR__ . '/../src/controllers/ReviewResponseAIController.php';
        return Xordon\Controllers\ReviewResponseAIController::postResponse((int)$m[1]);
    }

    // Requests
    if ($path === '/reputation/requests' && $method === 'GET') {
        return Xordon\Controllers\ReputationRequestsController::getRequests();
    }
    if ($path === '/reputation/requests' && $method === 'POST') {
        return Xordon\Controllers\ReputationRequestsController::sendRequest();
    }
    if (preg_match('#^/reputation/requests/(\d+)$#', $path, $m) && $method === 'DELETE') {
        return Xordon\Controllers\ReputationRequestsController::deleteRequest((int)$m[1]);
    }

    // Widgets
    if ($path === '/reputation/widgets' && $method === 'GET') {
        return Xordon\Controllers\ReputationWidgetsController::getWidgets();
    }
    if ($path === '/reputation/widgets' && ($method === 'POST' || $method === 'PUT' || $method === 'PATCH')) {
        return Xordon\Controllers\ReputationWidgetsController::saveWidget();
    }
    if (preg_match('#^/reputation/widgets/(\d+)$#', $path, $m) && $method === 'DELETE') {
        return Xordon\Controllers\ReputationWidgetsController::deleteWidget((int)$m[1]);
    }

    // Settings & AI Agents
    if ($path === '/reputation/settings' && $method === 'GET') {
        return Xordon\Controllers\ReputationSettingsController::getSettings();
    }
    if ($path === '/reputation/settings' && ($method === 'POST' || $method === 'PUT' || $method === 'PATCH')) {
        return Xordon\Controllers\ReputationSettingsController::saveSettings();
    }
    if ($path === '/reputation/settings/ai-agents' && ($method === 'POST' || $method === 'PUT' || $method === 'PATCH')) {
        return Xordon\Controllers\ReputationSettingsController::saveAIAgent();
    }
    if (preg_match('#^/reputation/settings/ai-agents/(\d+)$#', $path, $m) && $method === 'DELETE') {
        return Xordon\Controllers\ReputationSettingsController::deleteAIAgent((int)$m[1]);
    }

    // Business Listings
    if ($path === '/reputation/listings' && $method === 'GET') {
        return Xordon\Controllers\ListingsController::getListings();
    }
    if ($path === '/reputation/listings' && $method === 'POST') {
        return Xordon\Controllers\ListingsController::addListing();
    }
    if (preg_match('#^/reputation/listings/(\d+)$#', $path, $m) && ($method === 'PATCH' || $method === 'PUT')) {
        return Xordon\Controllers\ListingsController::updateListing((int)$m[1]);
    }
    if (preg_match('#^/reputation/listings/(\d+)$#', $path, $m) && $method === 'DELETE') {
        return Xordon\Controllers\ListingsController::deleteListing((int)$m[1]);
    }
    if (preg_match('#^/reputation/listings/(\d+)/sync$#', $path, $m) && $method === 'POST') {
        return Xordon\Controllers\ListingsController::syncListing((int)$m[1]);
    }

    // Task Comments
    require_once __DIR__ . '/../src/controllers/TaskCommentsController.php';
    if (preg_match('#^/tasks/(\d+)/comments$#', $path, $m)) {
         $taskId = $m[1];
         if ($method === 'GET') return TaskCommentsController::index($taskId);
         if ($method === 'POST') return TaskCommentsController::create($taskId);
    }
    if (preg_match('#^/tasks/(\d+)/comments/(\d+)$#', $path, $m)) {
         $taskId = $m[1];
         $commentId = $m[2];
         if ($method === 'DELETE') return TaskCommentsController::delete($taskId, $commentId);
    }
    
    // Task Activity
    if (preg_match('#^/tasks/(\d+)/activity$#', $path, $m) && $method === 'GET') {
         return TasksController::getActivity($m[1]);
    }

    // ============================================
    // TASK SUBTASKS ROUTES
    // ============================================
    require_once __DIR__ . '/../src/controllers/TaskSubtasksController.php';
    
    if (preg_match('#^/tasks/(\d+)/subtasks$#', $path, $m)) {
        $taskId = $m[1];
        if ($method === 'GET') return TaskSubtasksController::index($taskId);
        if ($method === 'POST') return TaskSubtasksController::create($taskId);
    }
    if (preg_match('#^/tasks/(\d+)/subtasks/reorder$#', $path, $m) && $method === 'POST') {
        return TaskSubtasksController::reorder($m[1]);
    }
    if (preg_match('#^/tasks/(\d+)/subtasks/(\d+)$#', $path, $m)) {
        $taskId = $m[1];
        $subtaskId = $m[2];
        if ($method === 'PUT' || $method === 'PATCH') return TaskSubtasksController::update($taskId, $subtaskId);
        if ($method === 'DELETE') return TaskSubtasksController::delete($taskId, $subtaskId);
    }
    if (preg_match('#^/tasks/(\d+)/subtasks/(\d+)/toggle$#', $path, $m) && $method === 'POST') {
        return TaskSubtasksController::toggle($m[1], $m[2]);
    }

    // ============================================
    // TASK ATTACHMENTS ROUTES
    // ============================================
    require_once __DIR__ . '/../src/controllers/TaskAttachmentsController.php';
    
    if (preg_match('#^/tasks/(\d+)/attachments$#', $path, $m)) {
        $taskId = $m[1];
        if ($method === 'GET') return TaskAttachmentsController::index($taskId);
        if ($method === 'POST') return TaskAttachmentsController::upload($taskId);
    }
    if (preg_match('#^/tasks/(\d+)/attachments/(\d+)$#', $path, $m)) {
        $taskId = $m[1];
        $attachmentId = $m[2];
        if ($method === 'DELETE') return TaskAttachmentsController::delete($taskId, $attachmentId);
    }
    if (preg_match('#^/tasks/(\d+)/attachments/(\d+)/download$#', $path, $m) && $method === 'GET') {
        return TaskAttachmentsController::download($m[1], $m[2]);
    }

    // ============================================
    // TASK DEPENDENCIES ROUTES
    // ============================================
    require_once __DIR__ . '/../src/controllers/TaskDependenciesController.php';
    
    if (preg_match('#^/tasks/(\d+)/dependencies$#', $path, $m)) {
        $taskId = $m[1];
        if ($method === 'GET') return TaskDependenciesController::index($taskId);
        if ($method === 'POST') return TaskDependenciesController::create($taskId);
    }
    if (preg_match('#^/tasks/(\d+)/dependencies/(\d+)$#', $path, $m) && $method === 'DELETE') {
        return TaskDependenciesController::delete($m[1], $m[2]);
    }
    if (preg_match('#^/tasks/(\d+)/dependencies/check$#', $path, $m) && $method === 'GET') {
        return TaskDependenciesController::checkBlocked($m[1]);
    }

    // ============================================
    // COURSE QUIZZES ROUTES
    // ============================================
    require_once __DIR__ . '/../src/controllers/CourseQuizController.php';
    
    if (preg_match('#^/courses/(\d+)/quizzes$#', $path, $m)) {
        $courseId = $m[1];
        if ($method === 'GET') return CourseQuizController::index($courseId);
        if ($method === 'POST') return CourseQuizController::create($courseId);
    }
    if (preg_match('#^/quizzes/(\d+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return CourseQuizController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return CourseQuizController::update($id);
        if ($method === 'DELETE') return CourseQuizController::delete($id);
    }
    if (preg_match('#^/quizzes/(\d+)/questions$#', $path, $m) && $method === 'POST') {
        return CourseQuizController::createQuestion($m[1]);
    }
    if (preg_match('#^/questions/(\d+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'PUT' || $method === 'PATCH') return CourseQuizController::updateQuestion($id);
        if ($method === 'DELETE') return CourseQuizController::deleteQuestion($id);
    }
    if (preg_match('#^/quizzes/(\d+)/start$#', $path, $m) && $method === 'POST') {
        return CourseQuizController::startAttempt($m[1]);
    }
    if (preg_match('#^/attempts/(\d+)/submit$#', $path, $m) && $method === 'POST') {
        return CourseQuizController::submitAttempt($m[1]);
    }
    if (preg_match('#^/attempts/(\d+)/results$#', $path, $m) && $method === 'GET') {
        return CourseQuizController::getAttemptResults($m[1]);
    }
    if (preg_match('#^/quizzes/(\d+)/attempts$#', $path, $m) && $method === 'GET') {
        return CourseQuizController::getQuizAttempts($m[1]);
    }

    // ============================================
    // COURSE DISCUSSIONS ROUTES
    // ============================================
    require_once __DIR__ . '/../src/controllers/CourseDiscussionsController.php';
    
    if (preg_match('#^/courses/(\d+)/discussions$#', $path, $m)) {
        $courseId = $m[1];
        if ($method === 'GET') return CourseDiscussionsController::index($courseId);
        if ($method === 'POST') return CourseDiscussionsController::create($courseId);
    }
    if (preg_match('#^/discussions/(\d+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return CourseDiscussionsController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return CourseDiscussionsController::update($id);
        if ($method === 'DELETE') return CourseDiscussionsController::delete($id);
    }
    if (preg_match('#^/discussions/(\d+)/reply$#', $path, $m) && $method === 'POST') {
        return CourseDiscussionsController::reply($m[1]);
    }

    // ============================================
    // FIELD SERVICE ROUTES (GPS, Dispatch, Zones)
    // ============================================
    require_once __DIR__ . '/../src/controllers/FieldServiceController.php';
    
    // GPS Location
    if ($path === '/field-service/location' && $method === 'POST') {
        return FieldServiceController::recordLocation();
    }
    if ($path === '/field-service/locations' && $method === 'GET') {
        return FieldServiceController::getLocationHistory();
    }
    
    // Technicians
    if ($path === '/field-service/technicians' && $method === 'GET') {
        return FieldServiceController::getTechnicians();
    }
    if (preg_match('#^/field-service/technicians/(\d+)/status$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return FieldServiceController::updateTechnicianStatus($m[1]);
    }
    
    // Dispatch Jobs
    if ($path === '/field-service/jobs' && $method === 'GET') {
        return FieldServiceController::getJobs();
    }
    if ($path === '/field-service/jobs' && $method === 'POST') {
        return FieldServiceController::createJob();
    }
    if (preg_match('#^/field-service/jobs/(\d+)$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return FieldServiceController::updateJob($m[1]);
    }
    if (preg_match('#^/field-service/jobs/(\d+)/dispatch$#', $path, $m) && $method === 'POST') {
        return FieldServiceController::dispatchJob($m[1]);
    }
    
    // Service Zones
    if ($path === '/field-service/zones' && $method === 'GET') {
        return FieldServiceController::getZones();
    }
    if ($path === '/field-service/zones' && $method === 'POST') {
        return FieldServiceController::createZone();
    }
    if (preg_match('#^/field-service/zones/(\d+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'PUT' || $method === 'PATCH') return FieldServiceController::updateZone($id);
        if ($method === 'DELETE') return FieldServiceController::deleteZone($id);
    }
    
    // Field Service Analytics
    if ($path === '/field-service/analytics' && $method === 'GET') {
        return FieldServiceController::getAnalytics();
    }

    // ============================================
    // GPS TRACKING ROUTES
    // ============================================
    require_once __DIR__ . '/../src/controllers/GPSTrackingController.php';
    
    // Tracked Entities
    if ($path === '/gps/entities' && $method === 'GET') {
        return GPSTrackingController::listTrackedEntities();
    }
    if ($path === '/gps/technicians/locations' && $method === 'GET') {
        return GPSTrackingController::getAllTechnicianLocations();
    }
    if (preg_match('#^/gps/entities/([^/]+)/location$#', $path, $m) && $method === 'GET') {
        return GPSTrackingController::getCurrentLocation($m[1]);
    }
    if (preg_match('#^/gps/entities/([^/]+)/history$#', $path, $m) && $method === 'GET') {
        return GPSTrackingController::getLocationHistory($m[1]);
    }
    
    // ETA & Notifications
    if ($path === '/gps/eta/calculate' && $method === 'POST') {
        return GPSTrackingController::calculateETA();
    }
    if (preg_match('#^/gps/jobs/([^/]+)/eta$#', $path, $m) && $method === 'GET') {
        return GPSTrackingController::getJobETA($m[1]);
    }
    if (preg_match('#^/gps/jobs/([^/]+)/notify/en-route$#', $path, $m) && $method === 'POST') {
        return GPSTrackingController::sendEnRouteNotification($m[1]);
    }
    if (preg_match('#^/gps/jobs/([^/]+)/tracking-link$#', $path, $m) && $method === 'GET') {
        return GPSTrackingController::getCustomerTrackingLink($m[1]);
    }
    
    // Route Optimization
    if (preg_match('#^/gps/routes/daily/([^/]+)$#', $path, $m) && $method === 'GET') {
        return GPSTrackingController::getDailyRoute($m[1]);
    }
    
    // Settings
    if ($path === '/gps/settings' && $method === 'GET') {
        return GPSTrackingController::getSettings();
    }

    // ============================================
    // HR & EMPLOYEE ROUTES
    // ============================================
    require_once __DIR__ . '/../src/controllers/EmployeeController.php';
    require_once __DIR__ . '/../src/controllers/ShiftSchedulingController.php';
    require_once __DIR__ . '/../src/controllers/RecruitmentController.php';

    // Employee Profiles & Data
    if (preg_match('#^/hr/employees/([^/]+)/profile$#', $path, $m)) {
        $userId = $m[1];
        if ($method === 'GET') return EmployeeController::getEmployeeProfile($userId);
        if ($method === 'PUT' || $method === 'PATCH') return EmployeeController::updateEmployeeProfile($userId);
    }
    if (preg_match('#^/hr/employees/([^/]+)/time-entries$#', $path, $m) && $method === 'GET') {
        return EmployeeController::getEmployeeTimeEntries($m[1]);
    }
    if (preg_match('#^/hr/employees/([^/]+)/shifts$#', $path, $m) && $method === 'GET') {
        return EmployeeController::getEmployeeShifts($m[1]);
    }
    if (preg_match('#^/hr/employees/([^/]+)/leave$#', $path, $m) && $method === 'GET') {
        return EmployeeController::getEmployeeLeaveSummary($m[1]);
    }
    if (preg_match('#^/hr/employees/([^/]+)/payroll$#', $path, $m) && $method === 'GET') {
        return EmployeeController::getEmployeePayrollSummary($m[1]);
    }
    if ($path === '/hr/documents' && $method === 'GET') {
        return EmployeeController::getDocuments();
    }
    if ($path === '/hr/documents/upload' && $method === 'POST') {
        return EmployeeController::uploadDocument();
    }
    if ($path === '/hr/onboarding/checklists' && $method === 'GET') {
        return EmployeeController::getOnboardingChecklists();
    }
    if (preg_match('#^/hr/employees/([^/]+)/onboarding$#', $path, $m) && $method === 'GET') {
        return EmployeeController::getEmployeeOnboarding($m[1]);
    }
    if (preg_match('#^/hr/onboarding/tasks/(\d+)$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return EmployeeController::updateOnboardingTask($m[1]);
    }

    // Shift Scheduling
    if ($path === '/hr/scheduling/shifts' && $method === 'GET') {
        return ShiftSchedulingController::getShifts();
    }
    if ($path === '/hr/scheduling/shifts' && $method === 'POST') {
        return ShiftSchedulingController::createShift();
    }
    if (preg_match('#^/hr/scheduling/shifts/(\d+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'PUT' || $method === 'PATCH') return ShiftSchedulingController::updateShift($id);
        if ($method === 'DELETE') return ShiftSchedulingController::deleteShift($id);
    }
    if ($path === '/hr/scheduling/swaps' && $method === 'GET') {
        return ShiftSchedulingController::getShiftSwapRequests();
    }
    if ($path === '/hr/scheduling/swaps' && $method === 'POST') {
        return ShiftSchedulingController::createShiftSwapRequest();
    }
    if (preg_match('#^/hr/scheduling/swaps/(\d+)/respond$#', $path, $m) && $method === 'POST') {
        return ShiftSchedulingController::respondToSwapRequest($m[1]);
    }
    if ($path === '/hr/scheduling/availability' && $method === 'GET') {
        return ShiftSchedulingController::getAvailability();
    }
    if ($path === '/hr/scheduling/availability' && $method === 'POST') {
        return ShiftSchedulingController::setAvailability();
    }
    if ($path === '/hr/scheduling/types' && $method === 'GET') {
        return ShiftSchedulingController::getShiftTypes();
    }
    if ($path === '/hr/scheduling/analytics' && $method === 'GET') {
        return ShiftSchedulingController::getSchedulingAnalytics();
    }
    if ($path === '/hr/scheduling/validate' && $method === 'POST') {
        return ShiftSchedulingController::validateShift();
    }
    if ($path === '/hr/scheduling/conflicts' && $method === 'GET') {
        return ShiftSchedulingController::getConflicts();
    }

    // Recruitment & ATS
    if ($path === '/hr/recruitment/jobs' && $method === 'GET') {
        return RecruitmentController::getJobOpenings();
    }
    if ($path === '/hr/recruitment/jobs' && $method === 'POST') {
        return RecruitmentController::createJobOpening();
    }
    if (preg_match('#^/hr/recruitment/jobs/(\d+)$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return RecruitmentController::updateJobOpening($m[1]);
    }
    if ($path === '/hr/recruitment/applications' && $method === 'GET') {
        return RecruitmentController::getJobApplications();
    }
    if ($path === '/hr/recruitment/applications' && $method === 'POST') {
        return RecruitmentController::createJobApplication();
    }
    if (preg_match('#^/hr/recruitment/applications/(\d+)/stage$#', $path, $m) && $method === 'POST') {
        return RecruitmentController::updateApplicationStage($m[1]);
    }
    if ($path === '/hr/recruitment/candidates' && $method === 'GET') {
        return RecruitmentController::getCandidates();
    }
    if ($path === '/hr/recruitment/candidates' && $method === 'POST') {
        return RecruitmentController::createCandidate();
    }
    if ($path === '/hr/recruitment/interviews' && $method === 'GET') {
        return RecruitmentController::getInterviews();
    }
    if ($path === '/hr/recruitment/interviews' && $method === 'POST') {
        return RecruitmentController::scheduleInterview();
    }
    if (preg_match('#^/hr/recruitment/interviews/(\d+)$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH')) {
        return RecruitmentController::updateInterview($m[1]);
    }
    if ($path === '/hr/recruitment/analytics' && $method === 'GET') {
        return RecruitmentController::getRecruitmentAnalytics();
    }
    if (preg_match('#^/hr/recruitment/convert/(\d+)$#', $path, $m) && $method === 'POST') {
        return RecruitmentController::convertToEmployee($m[1]);
    }

    // ============================================
    // INVOICES, PRODUCTS & PAYMENTS
    // ============================================

    // Invoices
    if (str_starts_with($path, '/invoices')) {
        require_once __DIR__ . '/../src/controllers/InvoicesController.php';
        $invPath = substr($path, 9);
        if ($invPath === '' || $invPath === false) $invPath = '/';
        
        // Stats
        if ($invPath === '/stats' && $method === 'GET') {
            return InvoicesController::getStats();
        }
        
        // Payments for invoice
        if (preg_match('#^/(\d+)/payments$#', $invPath, $m) && $method === 'POST') {
            return InvoicesController::recordPayment((int)$m[1]);
        }
        
        // Status update
        if (preg_match('#^/(\d+)/status$#', $invPath, $m) && $method === 'POST') {
            return InvoicesController::updateInvoiceStatus((int)$m[1]);
        }
        
        // CRUD
        if ($invPath === '/' && $method === 'GET') return InvoicesController::listInvoices();
        if ($invPath === '/' && $method === 'POST') return InvoicesController::createInvoice();
        if (preg_match('#^/(\d+)$#', $invPath, $m)) {
            if ($method === 'GET') return InvoicesController::getInvoice((int)$m[1]);
            if ($method === 'PUT' || $method === 'PATCH') return InvoicesController::updateInvoice((int)$m[1]);
            if ($method === 'DELETE') return InvoicesController::deleteInvoice((int)$m[1]);
        }
    }
    
    // Products
    if (str_starts_with($path, '/products')) {
        require_once __DIR__ . '/../src/controllers/InvoicesController.php';
        $prodPath = substr($path, 9);
        if ($prodPath === '' || $prodPath === false) $prodPath = '/';

        if ($prodPath === '/' && $method === 'GET') return InvoicesController::listProducts();
        if ($prodPath === '/' && $method === 'POST') return InvoicesController::createProduct();
        if (preg_match('#^/(\d+)$#', $prodPath, $m)) {
            if ($method === 'PUT' || $method === 'PATCH') return InvoicesController::updateProduct((int)$m[1]);
            if ($method === 'DELETE') return InvoicesController::deleteProduct((int)$m[1]);
        }
    }
    
    // Payments
    if (str_starts_with($path, '/payments')) {
        require_once __DIR__ . '/../src/controllers/PaymentsController.php';
        $payPath = substr($path, 9);
        if ($payPath === '' || $payPath === false) $payPath = '/';

        if ($payPath === '/payments' && $method === 'GET') return PaymentsController::getPayments();
        if ($payPath === '/payments' && $method === 'POST') return PaymentsController::recordPayment();
        
        // Settings
        if ($payPath === '/settings' && $method === 'GET') return PaymentsController::getSettings();
        if ($payPath === '/settings' && $method === 'POST') return PaymentsController::updateSettings();
        
        // Analytics
         if ($payPath === '/analytics' && $method === 'GET') return PaymentsController::getAnalytics();
    }

    // ============================================
    // SOCIAL MEDIA POSTING ENGINE
    // ============================================
    require_once __DIR__ . '/../src/controllers/SocialMediaController.php';

    if ($path === '/growth/social/accounts' && $method === 'GET') {
        return SocialMediaController::getAccounts();
    }
    if ($path === '/growth/social/accounts' && $method === 'POST') {
        return SocialMediaController::addAccount();
    }
    if ($path === '/growth/social/posts' && $method === 'GET') {
        return SocialMediaController::getPosts();
    }
    if ($path === '/growth/social/posts' && $method === 'POST') {
        return SocialMediaController::createPost();
    }
    if ($path === '/growth/social/calendar' && $method === 'GET') {
        return SocialMediaController::getCalendar();
    }
    if ($path === '/growth/social/calendar' && $method === 'POST') {
        return SocialMediaController::addToCalendar();
    }
    if ($path === '/growth/social/analytics' && $method === 'GET') {
        return SocialMediaController::getAnalytics();
    }

    // ============================================
    // BLOGGING PLATFORM
    // ============================================
    require_once __DIR__ . '/../src/controllers/BlogController.php';

    if ($path === '/marketing/blog/posts' && $method === 'GET') {
        $controller = new \Xordon\Controllers\BlogController();
        return Response::json($controller->getPosts());
    }
    if ($path === '/marketing/blog/posts' && $method === 'POST') {
        $controller = new \Xordon\Controllers\BlogController();
        return Response::json($controller->createPost());
    }
    if (preg_match('#^/marketing/blog/posts/(\d+)$#', $path, $m) && $method === 'GET') {
        $controller = new \Xordon\Controllers\BlogController();
        return Response::json($controller->getPost($m[1]));
    }
    if (preg_match('#^/marketing/blog/posts/(\d+)$#', $path, $m) && ($method === 'PUT' || $method === 'PATCH' || $method === 'POST')) {
        $controller = new \Xordon\Controllers\BlogController();
        return Response::json($controller->updatePost($m[1]));
    }
    if (preg_match('#^/marketing/blog/posts/(\d+)$#', $path, $m) && $method === 'DELETE') {
        $controller = new \Xordon\Controllers\BlogController();
        return Response::json($controller->deletePost($m[1]));
    }
    if ($path === '/marketing/blog/categories' && $method === 'GET') {
        $controller = new \Xordon\Controllers\BlogController();
        return Response::json($controller->getCategories());
    }
    if ($path === '/marketing/blog/tags' && $method === 'GET') {
        $controller = new \Xordon\Controllers\BlogController();
        return Response::json($controller->getTags());
    }

    // ============================================
    // CULTURE MODULE
    // ============================================
    require_once __DIR__ . '/../src/controllers/CultureController.php';
    
    if ($path === '/culture/surveys' && $method === 'GET') {
        $controller = new \Xordon\Controllers\CultureController();
        return Response::json($controller->getSurveys());
    }
    if ($path === '/culture/surveys' && $method === 'POST') {
        $controller = new \Xordon\Controllers\CultureController();
        return Response::json($controller->createSurvey());
    }
    if ($path === '/culture/metrics' && $method === 'GET') {
        $controller = new \Xordon\Controllers\CultureController();
        return Response::json($controller->getMetrics());
    }
    if ($path === '/culture/survey-trends' && $method === 'GET') {
        $controller = new \Xordon\Controllers\CultureController();
        return Response::json($controller->getSurveyTrends());
    }
    if ($path === '/culture/recognitions' && $method === 'GET') {
        $controller = new \Xordon\Controllers\CultureController();
        return Response::json($controller->getRecognitions());
    }
    if ($path === '/culture/recognitions' && $method === 'POST') {
        $controller = new \Xordon\Controllers\CultureController();
        return Response::json($controller->createRecognition());
    }
    if ($path === '/culture/events' && $method === 'GET') {
        $controller = new \Xordon\Controllers\CultureController();
        return Response::json($controller->getEvents());
    }
    if ($path === '/culture/events' && $method === 'POST') {
        $controller = new \Xordon\Controllers\CultureController();
        return Response::json($controller->createEvent());
    }
    if ($path === '/culture/champions' && $method === 'GET') {
        $controller = new \Xordon\Controllers\CultureController();
        return Response::json($controller->getChampions());
    }
    if ($path === '/culture/champions' && $method === 'POST') {
        $controller = new \Xordon\Controllers\CultureController();
        return Response::json($controller->appointChampion());
    }
    
    // Additional Culture Routes
    if ($path === '/culture/kudos' && $method === 'GET') {
        $controller = new \Xordon\Controllers\CultureController();
        return Response::json($controller->getRecognitions());
    }
    if ($path === '/culture/stats' && $method === 'GET') {
        $controller = new \Xordon\Controllers\CultureController();
        $result = $controller->getMetrics();
        return Response::json($result['stats'] ?? []);
    }
    if ($path === '/culture/values' && $method === 'GET') {
        // Return company values
        $workspaceId = $_SESSION['workspace_id'] ?? null;
        $values = [];
        if ($workspaceId) {
            $values = Database::select(
                "SELECT * FROM company_values WHERE workspace_id = ? ORDER BY display_order",
                [$workspaceId]
            );
        }
        return Response::json(['values' => $values]);
    }
    if ($path === '/culture/surveys/trends' && $method === 'GET') {
        $controller = new \Xordon\Controllers\CultureController();
        return Response::json($controller->getSurveyTrends());
    }


    // ============================================
    // BLOG/CMS MODULE (EXTENSIONS)
    // ============================================
    // Note: Main Blog endpoints are handled above.
    // These are additional endpoints if not already covered.
    
    if ($path === '/blog/categories' && $method === 'GET') {
        $controller = new \Xordon\Controllers\BlogController();
        return Response::json($controller->getCategories());
    }
    if ($path === '/blog/categories' && $method === 'POST') {
        $controller = new \Xordon\Controllers\BlogController();
        return Response::json($controller->createCategory());
    }
    if ($path === '/blog/tags' && $method === 'GET') {
        $controller = new \Xordon\Controllers\BlogController();
        return Response::json($controller->getTags());
    }
    if ($path === '/blog/tags' && $method === 'POST') {
        $controller = new \Xordon\Controllers\BlogController();
        return Response::json($controller->createTag());
    }
    if (preg_match('#^/blog/posts/(\d+)/comments$#', $path, $m)) {
        $controller = new \Xordon\Controllers\BlogController();
        if ($method === 'GET') return Response::json($controller->getComments($m[1]));
        if ($method === 'POST') return Response::json($controller->addComment($m[1]));
    }

    // ============================================
    // ADDITIONAL FEATURES (CONSOLIDATED)
    // ============================================
    require_once __DIR__ . '/../src/controllers/AdditionalControllers.php';

    // Webinars
    if (preg_match('#^/marketing/webinars/(\d+)/registrations$#', $path, $m) && $method === 'GET') {
        $controller = new \Xordon\Controllers\WebinarExtensions();
        return Response::json($controller->getRegistrations($m[1]));
    }
    if (preg_match('#^/marketing/webinars/(\d+)/register$#', $path, $m) && $method === 'POST') {
        $controller = new \Xordon\Controllers\WebinarExtensions();
        return Response::json($controller->register($m[1]));
    }
    if (preg_match('#^/webinars/registrations/(\d+)/attend$#', $path, $m) && $method === 'POST') {
        $controller = new \Xordon\Controllers\WebinarExtensions();
        return Response::json($controller->markAttendance($m[1]));
    }

    // Loyalty
    if ($path === '/loyalty/members' && $method === 'GET') {
        $controller = new \Xordon\Controllers\LoyaltyController();
        return Response::json($controller->getMembers());
    }
    if ($path === '/loyalty/enroll' && $method === 'POST') {
        $controller = new \Xordon\Controllers\LoyaltyController();
        return Response::json($controller->enrollMember());
    }
    if (preg_match('#^/loyalty/members/(\d+)/award$#', $path, $m) && $method === 'POST') {
        $controller = new \Xordon\Controllers\LoyaltyController();
        return Response::json($controller->awardPoints($m[1]));
    }
    if ($path === '/loyalty/redeem' && $method === 'POST') {
        $controller = new \Xordon\Controllers\LoyaltyController();
        return Response::json($controller->redeemReward());
    }
    if (preg_match('#^/loyalty/rewards/(\d+)$#', $path, $m) && $method === 'GET') {
        $controller = new \Xordon\Controllers\LoyaltyController();
        return Response::json($controller->getRewards($m[1]));
    }

    // Social Media
    if ($path === '/social/accounts' && $method === 'GET') {
        $controller = new \Xordon\Controllers\SocialMediaController();
        return Response::json($controller->getAccounts());
    }
    if ($path === '/social/posts' && $method === 'GET') {
        $controller = new \Xordon\Controllers\SocialMediaController();
        return Response::json($controller->getPosts());
    }
    if ($path === '/social/posts' && $method === 'POST') {
        $controller = new \Xordon\Controllers\SocialMediaController();
        return Response::json($controller->schedulePost());
    }

    // Financing
    if ($path === '/financing/applications' && $method === 'GET') {
        $controller = new \Xordon\Controllers\FinancingController();
        return Response::json($controller->getApplications());
    }
    if ($path === '/financing/applications' && $method === 'POST') {
        $controller = new \Xordon\Controllers\FinancingController();
        return Response::json($controller->submitApplication());
    }

    // E-Signatures
    if ($path === '/signatures/documents' && $method === 'GET') {
        $controller = new \Xordon\Controllers\ESignatureController();
        return Response::json($controller->getDocuments());
    }
    if ($path === '/signatures/documents' && $method === 'POST') {
        $controller = new \Xordon\Controllers\ESignatureController();
        return Response::json($controller->createDocument());
    }
    if (preg_match('#^/signatures/documents/(\d+)/send$#', $path, $m) && $method === 'POST') {
        $controller = new \Xordon\Controllers\ESignatureController();
        return Response::json($controller->sendDocument($m[1]));
    }
    // ============================================
    // SOCIAL PLANNER ROUTES
    // ============================================
    if ($path === '/social-planner/accounts' && $method === 'GET') {
        $controller = new SocialPlannerController();
        return Response::json($controller->getAccounts());
    }
    if ($path === '/social-planner/accounts' && $method === 'POST') {
        $controller = new SocialPlannerController();
        return Response::json($controller->connectAccount());
    }
    if (preg_match('#^/social-planner/accounts/(\d+)$#', $path, $m) && $method === 'DELETE') {
        $controller = new SocialPlannerController();
        return Response::json($controller->disconnectAccount($m[1]));
    }
    if ($path === '/social-planner/posts' && $method === 'GET') {
        $controller = new SocialPlannerController();
        return Response::json($controller->getPosts());
    }
    if ($path === '/social-planner/posts' && $method === 'POST') {
        $controller = new SocialPlannerController();
        return Response::json($controller->createPost());
    }
    if (preg_match('#^/social-planner/posts/(\d+)$#', $path, $m)) {
        $controller = new SocialPlannerController();
        if ($method === 'PUT' || $method === 'PATCH') return Response::json($controller->updatePost($m[1]));
        if ($method === 'DELETE') return Response::json($controller->deletePost($m[1]));
    }

    // ============================================
    // COMMUNITIES ROUTES
    // ============================================
    if ($path === '/communities' && $method === 'GET') {
        $controller = new CommunitiesController();
        return Response::json($controller->getCommunities());
    }
    if ($path === '/communities' && $method === 'POST') {
        $controller = new CommunitiesController();
        return Response::json($controller->createCommunity());
    }
    if (preg_match('#^/communities/(\d+)$#', $path, $m)) {
        $controller = new CommunitiesController();
        if ($method === 'PUT' || $method === 'PATCH') return Response::json($controller->updateCommunity($m[1]));
        if ($method === 'DELETE') return Response::json($controller->deleteCommunity($m[1]));
    }
    
    // Community Groups
    if (preg_match('#^/communities/(\d+)/groups$#', $path, $m)) {
         $controller = new CommunitiesController();
         if ($method === 'GET') return Response::json($controller->getGroups($m[1]));
         if ($method === 'POST') return Response::json($controller->createGroup($m[1]));
    }
    if (preg_match('#^/communities/groups/(\d+)$#', $path, $m) && $method === 'DELETE') {
         $controller = new CommunitiesController();
         return Response::json($controller->deleteGroup($m[1]));
    }

    // ============================================
    // BLOG & CONTENT MANAGEMENT ROUTES
    // ============================================
    require_once __DIR__ . '/../src/controllers/BlogController.php';
    
    // Blog Posts
    if ($path === '/blog/posts' && $method === 'GET') {
        return \Xordon\Controllers\BlogController::getPosts();
    }
    if ($path === '/blog/posts' && $method === 'POST') {
        return \Xordon\Controllers\BlogController::createPost();
    }
    if (preg_match('#^/blog/posts/(\d+)$#', $path, $m)) {
        $id = $m[1];
        if ($method === 'GET') return \Xordon\Controllers\BlogController::getPost($id);
        if ($method === 'PUT' || $method === 'PATCH') return \Xordon\Controllers\BlogController::updatePost($id);
        if ($method === 'DELETE') return \Xordon\Controllers\BlogController::deletePost($id);
    }
    
    // Blog Categories
    if ($path === '/blog/categories' && $method === 'GET') {
        return \Xordon\Controllers\BlogController::getCategories();
    }
    if ($path === '/blog/categories' && $method === 'POST') {
        return \Xordon\Controllers\BlogController::createCategory();
    }
    
    // Blog Tags
    if ($path === '/blog/tags' && $method === 'GET') {
        return \Xordon\Controllers\BlogController::getTags();
    }
    if ($path === '/blog/tags' && $method === 'POST') {
        return \Xordon\Controllers\BlogController::createTag();
    }
    
    // Blog Comments
    if (preg_match('#^/blog/posts/(\d+)/comments$#', $path, $m)) {
        $postId = $m[1];
        if ($method === 'GET') return \Xordon\Controllers\BlogController::getComments($postId);
        if ($method === 'POST') return \Xordon\Controllers\BlogController::addComment($postId);
    }

    // ============================================
    // SETTINGS ROUTES
    // ============================================
    if ($path === '/settings/public-assets' && $method === 'GET') {
        return SettingsController::getPublicAssets();
    }
    if ($path === '/settings/public-assets' && $method === 'POST') {
        return SettingsController::updatePublicAssets();
    }
    
    // Fallback for general settings if not caught earlier
    if ($path === '/settings' && $method === 'GET') {
        return SettingsController::get();
    }
    // Generic Module Settings
    if (preg_match('#^/settings/modules/([a-z0-9_]+)$#', $path, $m)) {
        require_once __DIR__ . '/../src/controllers/ModuleSettingsController.php';
        $controller = new ModuleSettingsController();
        if ($method === 'GET') {
            return Response::json($controller->getSettings($m[1]));
        }
        if ($method === 'POST' || $method === 'PUT') {
            return Response::json($controller->updateSettings($m[1]));
        }
    }

    if ($path === '/settings' && ($method === 'PUT' || $method === 'PATCH' || $method === 'POST')) {
        return SettingsController::update();
    }

    return Response::json(['error' => 'Not Found', 'path' => $path, 'method' => $method, 'debug' => 'final_404'], 404);

} catch (Throwable $e) {
    error_log('API ERROR MESSAGE: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    return Response::json([
        'error' => 'Server Error',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ], 500);
}
