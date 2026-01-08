<?php
require_once __DIR__ . '/backend/src/Database.php';
require_once __DIR__ . '/backend/src/Auth.php';
require_once __DIR__ . '/backend/src/Response.php';

// Mock globals
$GLOBALS['isDev'] = true;

try {
    $pdo = Database::conn();
    $userId = 1; // Default user ID when auth fails
    $col = 'user_id';
    
    $sql = "
        SELECT p.*, 
               COUNT(DISTINCT t.id) as task_count,
               COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
               COUNT(DISTINCT pm.user_id) as member_count
        FROM projects p
        LEFT JOIN sales_tasks t ON p.id = t.project_id
        LEFT JOIN project_members pm ON p.id = pm.project_id
        WHERE p.{$col} = ?
        GROUP BY p.id 
        ORDER BY p.created_at DESC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$userId]);
    $projects = $stmt->fetchAll();
    echo "Query successful. Found " . count($projects) . " projects.\n";
    
    foreach ($projects as &$project) {
        $project['tags'] = json_decode($project['tags'] ?? '[]', true);
        $project['settings'] = json_decode($project['settings'] ?? '{}', true);
        
        if ($project['task_count'] > 0) {
            $project['progress_percentage'] = round(($project['completed_tasks'] / $project['task_count']) * 100);
        }
    }
    echo "Processing successful.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
