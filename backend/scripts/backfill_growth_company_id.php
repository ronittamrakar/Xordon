<?php
/**
 * Backfill company_id for Growth tables
 * Run this after the growth_company_scoping.sql migration
 * 
 * Usage: php backfill_growth_company_id.php
 */

require_once __DIR__ . '/../src/Database.php';

echo "=== Growth Company ID Backfill Script ===\n\n";

try {
    $db = Database::conn();
    
    // Get all workspaces with their primary company (first company created)
    $workspacesStmt = $db->query("
        SELECT w.id as workspace_id, 
               (SELECT MIN(c.id) FROM companies c WHERE c.workspace_id = w.id) as primary_company_id
        FROM workspaces w
    ");
    $workspaces = $workspacesStmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Found " . count($workspaces) . " workspaces\n\n";
    
    // Tables to backfill
    $tables = [
        // Social
        'social_accounts',
        'social_posts',
        'social_categories',
        'social_templates',
        'hashtag_groups',
        // Listings/SEO
        'business_listings',
        'seo_keywords',
        'seo_pages',
        'seo_competitors',
        // Ads
        'ad_accounts',
        'ad_campaigns',
        'ad_conversions',
        'ad_budgets',
        'ad_tracking_numbers',
    ];
    
    $totalUpdated = 0;
    
    foreach ($workspaces as $ws) {
        $workspaceId = $ws['workspace_id'];
        $primaryCompanyId = $ws['primary_company_id'];
        
        if (!$primaryCompanyId) {
            echo "Workspace $workspaceId: No companies found, skipping\n";
            continue;
        }
        
        echo "Workspace $workspaceId: Using primary company $primaryCompanyId\n";
        
        foreach ($tables as $table) {
            try {
                // Check if table exists and has company_id column
                $checkStmt = $db->prepare("
                    SELECT COUNT(*) FROM information_schema.columns 
                    WHERE table_schema = DATABASE() 
                    AND table_name = ? 
                    AND column_name = 'company_id'
                ");
                $checkStmt->execute([$table]);
                
                if ($checkStmt->fetchColumn() == 0) {
                    continue; // Table doesn't have company_id yet
                }
                
                // Update rows where company_id is NULL
                $updateStmt = $db->prepare("
                    UPDATE $table 
                    SET company_id = ? 
                    WHERE workspace_id = ? AND company_id IS NULL
                ");
                $updateStmt->execute([$primaryCompanyId, $workspaceId]);
                $affected = $updateStmt->rowCount();
                
                if ($affected > 0) {
                    echo "  - $table: Updated $affected rows\n";
                    $totalUpdated += $affected;
                }
            } catch (PDOException $e) {
                // Table might not exist, skip silently
                if (strpos($e->getMessage(), "doesn't exist") === false) {
                    echo "  - $table: Error - " . $e->getMessage() . "\n";
                }
            }
        }
    }
    
    echo "\n=== Backfill Complete ===\n";
    echo "Total rows updated: $totalUpdated\n";
    
    // Verify: Check for any remaining NULL company_id values
    echo "\n=== Verification ===\n";
    foreach ($tables as $table) {
        try {
            $checkStmt = $db->prepare("
                SELECT COUNT(*) FROM information_schema.columns 
                WHERE table_schema = DATABASE() 
                AND table_name = ? 
                AND column_name = 'company_id'
            ");
            $checkStmt->execute([$table]);
            
            if ($checkStmt->fetchColumn() == 0) {
                continue;
            }
            
            $nullStmt = $db->query("SELECT COUNT(*) FROM $table WHERE company_id IS NULL");
            $nullCount = $nullStmt->fetchColumn();
            
            if ($nullCount > 0) {
                echo "WARNING: $table has $nullCount rows with NULL company_id\n";
            } else {
                echo "OK: $table - all rows have company_id\n";
            }
        } catch (PDOException $e) {
            // Skip non-existent tables
        }
    }
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
