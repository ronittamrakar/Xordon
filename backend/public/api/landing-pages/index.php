<?php
require_once __DIR__ . '/../../../src/bootstrap.php';
require_once __DIR__ . '/../../../src/Auth.php';
require_once __DIR__ . '/../../../src/SecurityHeaders.php';

header('Content-Type: application/json');
SecurityHeaders::applyCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../../../src/Database.php';
require_once '../../../src/controllers/LandingPageController.php';

$controller = new LandingPageController();
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

$userId = Auth::userIdOrFail();

try {
    switch ($method) {
        case 'GET':
            if (isset($pathParts[3]) && $pathParts[3] !== '') {
                // Get single landing page
                $id = $pathParts[3];
                $page = $controller->getLandingPage($userId, $id);
                echo json_encode(['success' => true, 'data' => $page]);
            } else {
                // List landing pages
                $pages = $controller->getLandingPages($userId);
                echo json_encode(['success' => true, 'data' => $pages]);
            }
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            $page = $controller->createLandingPage($userId, $input);
            echo json_encode(['success' => true, 'data' => $page]);
            break;
            
        case 'PUT':
            if (isset($pathParts[3]) && $pathParts[3] !== '') {
                $id = $pathParts[3];
                $input = json_decode(file_get_contents('php://input'), true);
                $page = $controller->updateLandingPage($userId, $id, $input);
                echo json_encode(['success' => true, 'data' => $page]);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Landing page ID required']);
            }
            break;
            
        case 'DELETE':
            if (isset($pathParts[3]) && $pathParts[3] !== '') {
                $id = $pathParts[3];
                $result = $controller->deleteLandingPage($userId, $id);
                echo json_encode(['success' => true, 'data' => $result]);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Landing page ID required']);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
