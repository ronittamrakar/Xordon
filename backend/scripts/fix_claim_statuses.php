<?php
// Load environment variables manually
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            putenv(trim($name) . '=' . trim($value));
        }
    }
}

require_once __DIR__ . '/../src/Database.php';

use Xordon\Database;

try {
    $db = Database::conn();
    
    echo "Fixing inconsistent claim statuses...\n";
    
    // Fix 1: If claim_status is 'unclaimed' but status is 'claimed' or 'verified', reset status to 'pending' or 'needs_update'
    // Exception: Maybe 'verified' listings from API might show as unclaimed if claim_status isn't synced? 
    // But for 'claimed' badge, it definitely implies ownership.
    
    // Check affected rows first
    $stmt = $db->query("SELECT id, directory, status, claim_status FROM business_listings WHERE claim_status = 'unclaimed' AND (status = 'claimed' OR status = 'verified')");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Found " . count($rows) . " inconsistent rows:\n";
    foreach ($rows as $r) {
        echo " - {$r['directory']} (ID {$r['id']}): Status='{$r['status']}', ClaimStatus='{$r['claim_status']}'\n";
    }
    
    if (count($rows) > 0) {
        $ids = array_column($rows, 'id');
        $inQuery = implode(',', array_fill(0, count($ids), '?'));
        
        // Update status to 'pending' (meaning listing checking/claiming is pending)
        // Or if listing_url exists, maybe 'needs_update' or just stay 'pending'.
        $updateSql = "UPDATE business_listings SET status = 'pending', updated_at = NOW() WHERE id IN ($inQuery)";
        $stmt = $db->prepare($updateSql);
        $stmt->execute($ids);
        
        echo "Fixed " . $stmt->rowCount() . " rows -> Set status to 'pending'.\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
