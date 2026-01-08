
    // ============================================
    // MEDIA LIBRARY ROUTES
    // ============================================
    if ($path === '/media/files' && $method === 'GET') {
        $workspaceId = $_SESSION['workspace_id'] ?? null;
        $files = [];
        if ($workspaceId) {
            $folderId = $_GET['folder_id'] ?? null;
            $sql = "SELECT * FROM media_files WHERE workspace_id = ?";
            $params = [$workspaceId];
            if ($folderId) {
                $sql .= " AND folder_id = ?";
                $params[] = $folderId;
            } else {
                $sql .= " AND folder_id IS NULL";
            }
            $sql .= " ORDER BY created_at DESC";
            $files = Database::select($sql, $params);
        }
        return Response::json(['files' => $files]);
    }
    if ($path === '/media/folders' && $method === 'GET') {
        $workspaceId = $_SESSION['workspace_id'] ?? null;
        $folders = [];
        if ($workspaceId) {
            $folders = Database::select(
                "SELECT * FROM media_folders WHERE workspace_id = ? ORDER BY name",
                [$workspaceId]
            );
        }
        return Response::json(['folders' => $folders]);
    }
    if ($path === '/media/quota' && $method === 'GET') {
        $workspaceId = $_SESSION['workspace_id'] ?? null;
        $quota = ['used' => 0, 'limit' => 10737418240]; // 10GB default
        if ($workspaceId) {
            $result = Database::first(
                "SELECT SUM(file_size) as total FROM media_files WHERE workspace_id = ?",
                [$workspaceId]
            );
            $quota['used'] = (int)($result['total'] ?? 0);
        }
        return Response::json($quota);
    }

    // ============================================
    // HR DOCUMENTS FIX
    // ============================================
    // The /hr/documents route needs employee_id parameter
    // Updated in EmployeeController to handle this properly
