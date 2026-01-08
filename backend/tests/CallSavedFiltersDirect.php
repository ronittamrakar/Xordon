<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../src/Config.php';
require_once __DIR__ . '/../src/bootstrap.php';
require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/Response.php';
require_once __DIR__ . '/../src/Auth.php';
require_once __DIR__ . '/../src/controllers/SavedFiltersController.php';

// Simulate request
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['HTTP_AUTHORIZATION'] = 'Bearer 16fd36d77e6fcc98ab95d7ea10df3f59fb6e3d742b6dfb6c';
$_SERVER['HTTP_X_WORKSPACE_ID'] = '1';

SavedFiltersController::list();
