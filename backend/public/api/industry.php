<?php
/**
 * Industry Features API - Main Router
 */

require_once __DIR__ . '/../../src/bootstrap.php';
require_once __DIR__ . '/../../src/Auth.php';
require_once __DIR__ . '/../../src/SecurityHeaders.php';

header('Content-Type: application/json');
SecurityHeaders::applyCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../src/Database.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = isset($_GET['path']) ? trim($_GET['path'], '/') : '';
$pathParts = explode('/', $path);
$resource = $pathParts[0] ?? '';
$id = $pathParts[1] ?? null;
$subResource = $pathParts[2] ?? null;

try {
    $db = Database::conn();
    $userId = Auth::userIdOrFail();
    
    // Include handlers
    require_once __DIR__ . '/industry/types.php';
    require_once __DIR__ . '/industry/jobs.php';
    require_once __DIR__ . '/industry/services.php';
    require_once __DIR__ . '/industry/staff.php';
    require_once __DIR__ . '/industry/estimates.php';
    require_once __DIR__ . '/industry/referrals.php';
    require_once __DIR__ . '/industry/recalls.php';
    require_once __DIR__ . '/industry/intake.php';
    
    switch ($resource) {
        case 'types':
            handleIndustryTypes($db, $method, $id);
            break;
        case 'settings':
            handleUserIndustrySettings($db, $method, $userId, $id);
            break;
        case 'services':
            handleServices($db, $method, $userId, $id);
            break;
        case 'service-categories':
            handleServiceCategories($db, $method, $userId, $id);
            break;
        case 'jobs':
            handleJobs($db, $method, $userId, $id, $subResource);
            break;
        case 'staff':
            handleStaff($db, $method, $userId, $id);
            break;
        case 'estimates':
            handleEstimates($db, $method, $userId, $id);
            break;
        case 'referral-programs':
            handleReferralPrograms($db, $method, $userId, $id);
            break;
        case 'referrals':
            handleReferrals($db, $method, $userId, $id);
            break;
        case 'recall-schedules':
            handleRecallSchedules($db, $method, $userId, $id);
            break;
        case 'contact-recalls':
            handleContactRecalls($db, $method, $userId, $id);
            break;
        case 'speed-to-lead':
            handleSpeedToLead($db, $method, $userId);
            break;
        case 'pipeline-templates':
            handlePipelineTemplates($db, $method, $id);
            break;
        case 'playbooks':
            handlePlaybooks($db, $method, $userId, $id);
            break;
        case 'intake-templates':
        case 'intake-submissions':
            $intakePath = array_slice($pathParts, 0);
            $intakePath[0] = str_replace('intake-', '', $resource);
            $inputData = json_decode(file_get_contents('php://input'), true) ?? $_GET;
            $result = handleIntakeForms($db, $userId, $method, $intakePath, $inputData);
            if (isset($result['status'])) http_response_code($result['status']);
            echo json_encode($result);
            exit;
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Resource not found']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
