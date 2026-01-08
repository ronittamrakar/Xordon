<?php
require_once __DIR__ . '/backend/src/Database.php';
require_once __DIR__ . '/backend/src/Config.php';

// Mock TenantContext
$GLOBALS['tenantContext'] = (object)['workspaceId' => 1];

try {
    $pdo = Database::conn();
    $scopeCol = 'workspace_id';
    $scopeVal = 1;

    $sql = "
            SELECT t.*, c.name as contact_name, c.email as contact_email, c.phone as contact_phone
            FROM sales_tasks t
            LEFT JOIN contacts c ON t.contact_id = c.id
            WHERE t.{$scopeCol} = ? 
            AND DATE(t.due_date) = CURDATE()
            AND t.status NOT IN ('completed', 'cancelled')
            ORDER BY t.due_time ASC, FIELD(t.priority, 'urgent', 'high', 'medium', 'low')
    ";
    
    echo "Preparing query...\n";
    $stmt = $pdo->prepare($sql);
    echo "Executing query...\n";
    $stmt->execute([$scopeVal]);
    
    echo "Fetch all...\n";
    $res = $stmt->fetchAll();
    echo "Success! Row count: " . count($res) . "\n";

} catch (Exception $e) {
    echo "SQL Error: " . $e->getMessage() . "\n";
}
