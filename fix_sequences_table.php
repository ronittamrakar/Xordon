<?php
require_once 'backend/src/Database.php';

use Xordon\Database;

try {
    $pdo = Database::conn();
    
    echo "1. Creating 'sequences' table...\n";
    $sql = "CREATE TABLE IF NOT EXISTS sequences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        workspace_id INT DEFAULT NULL,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'draft',
        campaign_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_user (user_id),
        KEY idx_campaign (campaign_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    $pdo->exec($sql);
    echo "✅ Table 'sequences' created successfully.\n";

    echo "2. Restoring orphaned data (Sequence #45)...\n";
    // Check if ID 45 already exists (unlikely given table was just created, but good practice)
    $stmt = $pdo->query("SELECT id FROM sequences WHERE id = 45");
    if (!$stmt->fetch()) {
        // We use user_id=1, workspace_id=1 as safe defaults for recovery
        $insertSql = "INSERT INTO sequences (id, user_id, workspace_id, name, status, created_at) 
                      VALUES (45, 1, 1, 'Restored Sequence (Recovered)', 'draft', NOW())";
        $pdo->exec($insertSql);
        echo "✅ Restored orphans: Created placeholder Sequence #45.\n";
    } else {
        echo "ℹ️ Sequence #45 already exists.\n";
    }
    
    // Verify
    $count = $pdo->query("SELECT COUNT(*) FROM sequences")->fetchColumn();
    echo "3. Verification: Table now has $count record(s).\n";

} catch (Exception $e) {
    die("❌ Error: " . $e->getMessage() . "\n");
}
?>
