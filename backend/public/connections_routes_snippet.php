
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
        if ($method === 'GET') return ConnectionsController::getConnection($id);
        if ($method === 'PUT' || $method === 'PATCH') return ConnectionsController::updateConnection($id);
        if ($method === 'DELETE') return ConnectionsController::deleteConnection($id);
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
