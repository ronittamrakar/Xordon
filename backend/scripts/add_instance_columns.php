<?php
require_once __DIR__ . '/../src/Database.php';

$pdo = Database::conn();

// Add automation_id and flow_id columns to user_automation_instances
try {
    $pdo->exec('ALTER TABLE user_automation_instances ADD COLUMN automation_id INT NULL');
    echo "Added automation_id column\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "automation_id column already exists\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}

try {
    $pdo->exec('ALTER TABLE user_automation_instances ADD COLUMN flow_id INT NULL');
    echo "Added flow_id column\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "flow_id column already exists\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}

// Verify
$stmt = $pdo->query("SHOW COLUMNS FROM user_automation_instances");
echo "\nColumns in user_automation_instances:\n";
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "  - " . $row['Field'] . " (" . $row['Type'] . ")\n";
}
