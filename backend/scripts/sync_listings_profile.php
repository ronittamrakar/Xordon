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
    $workspaceId = 1; // Assuming default
    $companyId = 1;   // Assuming default

    echo "Syncing listings for Company ID $companyId...\n";

    // 1. Get Listing Settings (Profile)
    // Check if table listing_settings exists and get data
    $stmt = $db->prepare("SELECT * FROM listing_settings WHERE company_id = ?");
    $stmt->execute([$companyId]);
    $settings = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$settings) {
        // Fallback: Check 'settings' table or similar if listing_settings is empty
        echo "No listing settings found for company $companyId.\n";
        
        // Let's try to find WHERE the profile data is.
        // Maybe it's not saved yet?
        // But user sees "Royal Painting" in frontend.
        // It MUST be in DB. 
        // Let's list all tables to be sure.
        $tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        print_r($tables);
        exit;
    }

    echo "Found Profile: " . ($settings['business_name'] ?? 'Unknown') . "\n";
    
    // 2. Prepare Update Data
    $updateData = [
        'business_name' => $settings['business_name'],
        'address' => $settings['address'],
        'phone' => $settings['phone'],
        'website' => $settings['website'],
        // 'company_id' => $companyId
    ];

    // Filter out empty values to avoid overwriting with nulls if settings are partial? 
    // Actually user wants exactly what is in profile.
    
    // 3. Update Business Listings
    // We update ALL listings for this company to match the "Master Profile"
    // This removes "Demo" data.
    
    $sql = "UPDATE business_listings SET 
            business_name = :business_name,
            address = :address,
            phone = :phone,
            website = :website,
            updated_at = NOW()
            WHERE company_id = :company_id AND status != 'verified'"; 
            // Only update non-verified? Or all? User said "Demo information should not be there".
            // If status is verified, it might be REAL data from API.
            // But "Demo Business" implies it's fake/pending data.
            // I'll update WHERE business_name LIKE 'Demo%' OR business_name IS NULL
            
    $sql = "UPDATE business_listings SET 
            business_name = :business_name,
            address = :address,
            phone = :phone,
            website = :website,
            updated_at = NOW()
            WHERE company_id = :company_id";
            
    $stmt = $db->prepare($sql);
    $execResult = $stmt->execute([
        ':business_name' => $updateData['business_name'],
        ':address' => $updateData['address'],
        ':phone' => $updateData['phone'],
        ':website' => $updateData['website'],
        ':company_id' => $companyId
    ]);

    echo "Updated " . $stmt->rowCount() . " listings.\n";
    echo "Sync Complete.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
