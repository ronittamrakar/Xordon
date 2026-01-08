<?php
require_once __DIR__ . '/src/Database.php';

try {
    $pdo = Database::conn();
    
    // Check if projects table has all required columns
    $stmt = $pdo->query("DESCRIBE projects");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Projects table structure:\n";
    echo str_repeat("=", 80) . "\n";
    foreach ($columns as $col) {
        printf("%-20s %-15s %-10s %-10s %s\n", 
            $col['Field'], 
            $col['Type'], 
            $col['Null'], 
            $col['Key'],
            $col['Default'] ?? 'NULL'
        );
    }
    
    // Check if progress_percentage column exists
    $hasProgressPercentage = false;
    foreach ($columns as $col) {
        if ($col['Field'] === 'progress_percentage') {
            $hasProgressPercentage = true;
            break;
        }
    }
    
    echo "\n";
    if (!$hasProgressPercentage) {
        echo "⚠️  WARNING: progress_percentage column is MISSING!\n";
        echo "This column is expected by the controller but doesn't exist in the table.\n";
    } else {
        echo "✅ progress_percentage column exists\n";
    }
    
    // Try to insert a test project
    echo "\n" . str_repeat("=", 80) . "\n";
    echo "Testing project creation...\n";
    
    $stmt = $pdo->prepare('
        INSERT INTO projects 
        (user_id, workspace_id, title, description, status, priority, start_date, due_date, color, tags, settings, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ');
    
    $result = $stmt->execute([
        1, // user_id
        null, // workspace_id
        'Test Project ' . date('Y-m-d H:i:s'),
        'This is a test project',
        'planning',
        'medium',
        null,
        null,
        '#3B82F6',
        json_encode([]),
        json_encode([])
    ]);
    
    if ($result) {
        $id = $pdo->lastInsertId();
        echo "✅ Successfully created project with ID: $id\n";
        
        // Fetch it back
        $stmt = $pdo->prepare('SELECT * FROM projects WHERE id = ?');
        $stmt->execute([$id]);
        $project = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo "\nCreated project data:\n";
        print_r($project);
        
        // Clean up
        $pdo->prepare('DELETE FROM projects WHERE id = ?')->execute([$id]);
        echo "\n✅ Test project deleted\n";
    } else {
        echo "❌ Failed to create project\n";
        print_r($stmt->errorInfo());
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
