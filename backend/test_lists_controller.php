<?php
// Set environment for dev bypass
putenv('APP_ENV=development');
putenv('ALLOW_DEV_BYPASS=true');

// Mock GLOBAL context
$GLOBALS['tenantContext'] = (object)['workspaceId' => 1];

// Load real dependencies
require_once __DIR__ . '/src/bootstrap.php';

// Require controller
require_once __DIR__ . '/src/controllers/ListsController.php';

echo "Running ListsController::index()...\n";
ListsController::index();
