<?php
require_once __DIR__ . '/../src/bootstrap.php';
require_once __DIR__ . '/../src/Database.php';

try {
    $pdo = Database::conn();
    echo "Updating tasks schema...\n";

    // 1. Add subtasks JSON column if missing
    $stmt = $pdo->query("DESCRIBE sales_tasks");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (!in_array('subtasks', $columns)) {
        echo "Adding subtasks column to sales_tasks...\n";
        $pdo->exec("ALTER TABLE sales_tasks ADD COLUMN subtasks JSON NULL");
        echo "✅ subtasks column added\n";
    } else {
        echo "✅ subtasks column already exists\n";
    }

    // 2. Create task_comments table
    echo "Checking task_comments table...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS task_comments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_id INT NOT NULL,
            user_id INT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (task_id) REFERENCES sales_tasks(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_task_created (task_id, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "✅ task_comments table checked/created\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
