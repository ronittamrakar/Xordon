<?php
require_once __DIR__ . '/src/Database.php';
require_once __DIR__ . '/src/Auth.php';

// Mock auth for testing purposes if needed, otherwise rely on session
// Setting a mock user ID for testing the query
$_SESSION['user_id'] = 1; 

try {
    $pdo = Database::conn();
    echo "Database connected.\n";

    // Test Projects Query
    $userId = 1;
    $scope = ['col' => 'user_id', 'val' => 1];
    
    $sql = "
        SELECT p.*, 
                COUNT(DISTINCT t.id) as task_count,
                COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
                COUNT(DISTINCT pm.user_id) as member_count
        FROM projects p
        LEFT JOIN sales_tasks t ON p.id = t.project_id
        LEFT JOIN project_members pm ON p.id = pm.project_id
        WHERE p.{$scope['col']} = ?
        GROUP BY p.id ORDER BY p.created_at DESC
    ";
    
    echo "Testing Query:\n$sql\n";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$scope['val']]);
    $projects = $stmt->fetchAll();
    
    echo "Query successful. Found " . count($projects) . " projects.\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
