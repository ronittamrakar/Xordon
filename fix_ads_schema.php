<?php
require_once __DIR__ . '/backend/src/bootstrap.php';
require_once __DIR__ . '/backend/src/Database.php';

$db = Database::conn();

echo "=== Checking ad_campaigns table structure ===\n";
$stmt = $db->query('DESCRIBE ad_campaigns');
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo $row['Field'] . ' - ' . $row['Type'] . "\n";
}

echo "\n=== Adding missing 'platform' column if needed ===\n";
try {
    $db->exec("ALTER TABLE ad_campaigns ADD COLUMN platform VARCHAR(50) AFTER ad_account_id");
    echo "Added 'platform' column successfully\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "Column 'platform' already exists\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}

echo "\n=== Updating campaigns with platform from accounts ===\n";
$db->exec("
    UPDATE ad_campaigns c
    JOIN ad_accounts a ON a.id = c.ad_account_id
    SET c.platform = a.platform
    WHERE c.platform IS NULL OR c.platform = ''
");
echo "Updated campaigns with platform data\n";
