<?php
/**
 * Operations API Router
 * 
 * Routes all /operations/* requests to appropriate handlers.
 * Uses Database for all operations tables.
 */

require_once __DIR__ . '/../../src/bootstrap.php';
require_once __DIR__ . '/../../src/Auth.php';
require_once __DIR__ . '/../../src/SecurityHeaders.php';
require_once __DIR__ . '/../../src/Database.php';
// Operations tables are in the main xordon database

header('Content-Type: application/json');
SecurityHeaders::applyCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$path = isset($_GET['path']) ? trim($_GET['path'], '/') : '';
$pathParts = explode('/', $path);
$resource = $pathParts[0] ?? '';
$id = $pathParts[1] ?? null;
$subResource = $pathParts[2] ?? null;

try {
    // Operations tables are in the main xordon database
    $opsDb = Database::conn();
    $mainDb = $opsDb; // Same connection - all tables in one DB
    
    // Authenticate - allow dev mode bypass
    // Authenticate - allow ALL access (Unrestricted as requested)
    $userId = Auth::userId();
    if (!$userId) {
        // Use a default dev user ID if no auth token present
        $userId = 1;
    }
    
    // Get workspace context from TenantContext
    require_once __DIR__ . '/../../src/TenantContext.php';
    $ctx = $GLOBALS['tenantContext'] ?? TenantContext::resolveOrFail();
    $workspaceId = $ctx->workspaceId;
    
    // Include handlers
    require_once __DIR__ . '/operations/jobs.php';
    require_once __DIR__ . '/operations/estimates.php';
    require_once __DIR__ . '/operations/services.php';
    require_once __DIR__ . '/operations/staff.php';
    require_once __DIR__ . '/operations/appointments.php';
    require_once __DIR__ . '/operations/referrals.php';
    require_once __DIR__ . '/operations/recalls.php';
    require_once __DIR__ . '/operations/intake.php';
    require_once __DIR__ . '/operations/playbooks.php';
    require_once __DIR__ . '/operations/settings.php';
    require_once __DIR__ . '/operations/booking-types.php';
    require_once __DIR__ . '/operations/availability.php';
    require_once __DIR__ . '/../../src/controllers/RequestsController.php';
    require_once __DIR__ . '/../../src/controllers/PaymentsController.php';
    require_once __DIR__ . '/../../src/controllers/EcommerceController.php';
    require_once __DIR__ . '/../../src/controllers/AgencyController.php';
    require_once __DIR__ . '/../../src/controllers/PhoneNumbersController.php';
    require_once __DIR__ . '/../../src/controllers/FieldServiceController.php';
    require_once __DIR__ . '/../../src/controllers/LocalPaymentsController.php';
    require_once __DIR__ . '/../../src/controllers/PaymentLinkController.php';
    require_once __DIR__ . '/../../src/controllers/FulfillmentController.php';
    
    // Health check
    if ($resource === 'health' && $method === 'GET') {
        $health = Database::getHealthStatus();
        echo json_encode([
            'status' => 'ok',
            'module' => 'operations',
            'database' => $health,
            'note' => 'Operations tables in main xordon database'
        ]);
        exit;
    }
    
    switch ($resource) {
        case 'jobs':
            handleOperationsJobs($opsDb, $mainDb, $method, $userId, $workspaceId, $id, $subResource);
            break;
        case 'estimates':
            handleOperationsEstimates($opsDb, $mainDb, $method, $userId, $workspaceId, $id);
            break;
        case 'services':
            handleOperationsServices($opsDb, $method, $userId, $workspaceId, $id);
            break;
        case 'service-categories':
            handleOperationsServiceCategories($opsDb, $method, $userId, $workspaceId, $id);
            break;
        case 'staff':
            handleOperationsStaff($opsDb, $method, $userId, $workspaceId, $id);
            break;
        case 'appointments':
            handleOperationsAppointments($opsDb, $mainDb, $method, $userId, $workspaceId, $id, $subResource);
            break;
        case 'booking-types':
            handleOperationsBookingTypes($opsDb, $method, $userId, $workspaceId, $id);
            break;
        case 'availability':
            handleOperationsAvailability($opsDb, $method, $userId, $workspaceId, $id);
            break;
        case 'booking-page-settings':
            handleOperationsBookingPageSettings($opsDb, $method, $userId, $workspaceId);
            break;
        case 'dashboard-stats':
            handleOperationsDashboardStats($opsDb, $method, $userId, $workspaceId);
            break;
        case 'referral-programs':
            handleOperationsReferralPrograms($opsDb, $method, $userId, $workspaceId, $id);
            break;
        case 'referrals':
            handleOperationsReferrals($opsDb, $mainDb, $method, $userId, $workspaceId, $id);
            break;
        case 'recall-schedules':
            handleOperationsRecallSchedules($opsDb, $method, $userId, $workspaceId, $id);
            break;
        case 'contact-recalls':
            handleOperationsContactRecalls($opsDb, $mainDb, $method, $userId, $workspaceId, $id);
            break;
        case 'intake-templates':
            handleOperationsIntakeTemplates($opsDb, $method, $userId, $workspaceId, $id);
            break;
        case 'intake-submissions':
            handleOperationsIntakeSubmissions($opsDb, $mainDb, $method, $userId, $workspaceId, $id);
            break;
        case 'playbooks':
            handleOperationsPlaybooks($opsDb, $method, $userId, $workspaceId, $id);
            break;
        case 'settings':
            handleOperationsIndustrySettings($opsDb, $method, $userId, $workspaceId);
            break;
        case 'types':
            echo json_encode(['items' => [
                ['id' => 1, 'slug' => 'home_services', 'name' => 'Home Services'],
                ['id' => 2, 'slug' => 'local_business', 'name' => 'Local Business'],
                ['id' => 3, 'slug' => 'professional_services', 'name' => 'Professional Services'],
                ['id' => 4, 'slug' => 'healthcare', 'name' => 'Healthcare'],
                ['id' => 5, 'slug' => 'real_estate', 'name' => 'Real Estate'],
                ['id' => 6, 'slug' => 'legal', 'name' => 'Legal'],
                ['id' => 7, 'slug' => 'transportation', 'name' => 'Transportation'],
                ['id' => 8, 'slug' => 'beauty_wellness', 'name' => 'Beauty & Wellness']
            ]]);
            break;
        case 'speed-to-lead':
            if ($method === 'GET') {
                echo json_encode(['is_enabled' => true, 'auto_sms_new_leads' => true, 'new_lead_delay_seconds' => 30, 'missed_call_auto_sms' => true]);
            } else {
                echo json_encode(['success' => true]);
            }
            break;
        case 'requests':
            // Delegate to core RequestsController for CRUD
            $reqId = $id ? (int)$id : null;
            if ($method === 'GET' && !$reqId) {
                RequestsController::list();
            } elseif ($method === 'POST' && !$reqId) {
                RequestsController::create();
            } elseif ($reqId && $method === 'GET') {
                RequestsController::get($reqId);
            } elseif ($reqId && ($method === 'PUT' || $method === 'PATCH')) {
                RequestsController::update($reqId);
            } elseif ($reqId && $method === 'DELETE') {
                RequestsController::delete($reqId);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Unsupported requests operation']);
            }
            break;
        case 'payments':
            // Delegate to PaymentsController
            if ($method === 'GET' && $subResource === 'settings') {
                PaymentsController::getSettings();
            } elseif (($method === 'PUT' || $method === 'PATCH') && $subResource === 'settings') {
                PaymentsController::updateSettings();
            } elseif ($method === 'GET' && $subResource === 'stats') {
                PaymentsController::getDashboardStats();
            } elseif ($method === 'GET' && !$id) {
                PaymentsController::getPayments();
            } elseif ($method === 'POST' && !$id) {
                PaymentsController::recordPayment();
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Unsupported payments operation']);
            }
            break;
        case 'payment-links':
            // Delegate to PaymentLinkController
            if ($method === 'GET' && !$id) {
                PaymentLinkController::getLinks();
            } elseif ($method === 'POST' && !$id) {
                PaymentLinkController::createLink();
            } elseif ($method === 'GET' && $id) {
                PaymentLinkController::getLink($id);
            } elseif (($method === 'PUT' || $method === 'PATCH') && $id) {
                PaymentLinkController::updateLink($id);
            } elseif ($method === 'POST' && $id && $subResource === 'send-sms') {
                PaymentLinkController::sendViaSMS($id);
            } elseif ($method === 'DELETE' && $id) {
                PaymentLinkController::deleteLink($id);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Unsupported payment-links operation']);
            }
            break;
        case 'fulfillment':
            // Delegate to FulfillmentController
            if ($method === 'GET' && $subResource === 'unfulfilled') {
                FulfillmentController::getUnfulfilledOrders();
            } elseif ($method === 'GET' && $subResource === 'stats') {
                FulfillmentController::getDashboardStats();
            } elseif ($method === 'GET' && !$id) {
                FulfillmentController::getFulfillments();
            } elseif ($method === 'POST' && !$id) {
                FulfillmentController::createFulfillment();
            } elseif (($method === 'PUT' || $method === 'PATCH') && $id) {
                FulfillmentController::updateFulfillment($id);
            } elseif ($method === 'DELETE' && $id) {
                FulfillmentController::deleteFulfillment($id);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Unsupported fulfillment operation']);
            }
            break;
        case 'ecommerce':
            // Delegate to EcommerceController
            if ($method === 'GET' && $subResource === 'dashboard') {
                EcommerceController::getDashboard();
            } elseif ($method === 'GET' && !$id) {
                EcommerceController::getStores();
            } elseif ($method === 'POST' && !$id) {
                EcommerceController::createStore();
            } elseif ($method === 'GET' && $id) {
                EcommerceController::getStore($id);
            } elseif (($method === 'PUT' || $method === 'PATCH') && $id) {
                EcommerceController::updateStore($id);
            } elseif ($method === 'DELETE' && $id) {
                EcommerceController::deleteStore($id);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Unsupported ecommerce operation']);
            }
            break;
        case 'agency':
            // Delegate to AgencyController
            if ($method === 'GET' && $subResource === 'analytics') {
                AgencyController::getCrossClientAnalytics();
            } elseif ($method === 'GET' && $subResource === 'reports') {
                AgencyController::getReports();
            } elseif ($method === 'POST' && $subResource === 'reports') {
                AgencyController::createReport();
            } elseif ($method === 'GET' && !$id) {
                AgencyController::getClients();
            } elseif ($method === 'POST' && !$id) {
                AgencyController::createClient();
            } elseif ($method === 'GET' && $id) {
                AgencyController::getClient($id);
            } elseif (($method === 'PUT' || $method === 'PATCH') && $id) {
                AgencyController::updateClient($id);
            } elseif ($method === 'DELETE' && $id) {
                AgencyController::deleteClient($id);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Unsupported agency operation']);
            }
            break;
        case 'phone-numbers':
            // Delegate to PhoneNumbersController
            if ($method === 'GET' && $subResource === 'settings') {
                PhoneNumbersController::getSettings();
            } elseif (($method === 'PUT' || $method === 'PATCH') && $subResource === 'settings') {
                PhoneNumbersController::updateSettings();
            } elseif ($method === 'GET' && $subResource === 'stats') {
                PhoneNumbersController::getDashboardStats();
            } elseif ($method === 'GET' && !$id) {
                PhoneNumbersController::getPhoneNumbers();
            } elseif ($method === 'POST' && !$id) {
                PhoneNumbersController::purchaseNumber();
            } elseif ($method === 'GET' && $id) {
                PhoneNumbersController::getPhoneNumber($id);
            } elseif (($method === 'PUT' || $method === 'PATCH') && $id) {
                PhoneNumbersController::updatePhoneNumber($id);
            } elseif ($method === 'DELETE' && $id) {
                PhoneNumbersController::releaseNumber($id);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Unsupported phone-numbers operation']);
            }
            break;
        case 'field-service':
            // Field Service Management
            $sub2 = $pathParts[1] ?? 'stats';
            $fsId = $pathParts[2] ?? null;

            if ($sub2 === 'jobs') {
                if ($method === 'GET') return \Xordon\Controllers\FieldServiceController::getJobs();
                if ($method === 'POST') return \Xordon\Controllers\FieldServiceController::createJob();
            } elseif ($sub2 === 'technicians') {
                return \Xordon\Controllers\FieldServiceController::getTechnicians();
            } elseif ($sub2 === 'stats' || ($method === 'GET' && !$sub2)) {
                return \Xordon\Controllers\FieldServiceController::getStats();
            } elseif (is_numeric($sub2)) {
                // /field-service/:id
                if ($method === 'GET') return \Xordon\Controllers\FieldServiceController::getJob($sub2);
                if ($method === 'PATCH') return \Xordon\Controllers\FieldServiceController::updateJob($sub2);
                if ($method === 'DELETE') return \Xordon\Controllers\FieldServiceController::deleteJob($sub2);
                
                // /field-service/:id/dispatch
                if ($fsId === 'dispatch' && $method === 'POST') {
                    return \Xordon\Controllers\FieldServiceController::dispatchJob($sub2);
                }
            }
            echo json_encode(['items' => []]);
            break;
            
        case 'local-payments':
            // Local Payment Processing
            $lpSub = $pathParts[1] ?? 'stats';
            $lpId = $pathParts[2] ?? null;
            
            if ($lpSub === 'transactions') {
                if ($method === 'GET') return \Xordon\Controllers\LocalPaymentsController::getTransactions();
                if ($method === 'POST') return \Xordon\Controllers\LocalPaymentsController::processTransaction();
            } elseif ($lpSub === 'terminals') {
                if ($method === 'GET') return \Xordon\Controllers\LocalPaymentsController::getTerminals();
                if ($method === 'POST') return \Xordon\Controllers\LocalPaymentsController::addTerminal();
            } elseif ($lpSub === 'stats' || ($method === 'GET' && !$lpSub)) {
                 return \Xordon\Controllers\LocalPaymentsController::getStats();
            } elseif (is_numeric($lpSub)) {
                if ($method === 'GET') return \Xordon\Controllers\LocalPaymentsController::getTransaction($lpSub);
                if ($lpId === 'refund' && $method === 'POST') {
                    return \Xordon\Controllers\LocalPaymentsController::refundTransaction($lpSub);
                }
            } elseif ($lpSub === 'terminals' && is_numeric($lpId)) {
                if ($method === 'PUT' || $method === 'PATCH') return \Xordon\Controllers\LocalPaymentsController::updateTerminal($lpId);
                if ($method === 'DELETE') return \Xordon\Controllers\LocalPaymentsController::deleteTerminal($lpId);
            }
            echo json_encode(['items' => []]);
            break;
            

        default:
            http_response_code(404);
            echo json_encode(['error' => 'Operations resource not found: ' . $resource]);
    }
} catch (Exception $e) {
    error_log("Operations API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
