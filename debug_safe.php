<?php
require_once __DIR__ . '/backend/src/Config.php';
require_once __DIR__ . '/backend/src/Database.php';

try {
    $db = Database::conn();
    
    // Check Users Schema
    echo "=== USERS COLUMNS ===\n";
    $cols = $db->query("DESCRIBE users")->fetchAll(PDO::FETCH_COLUMN);
    echo implode(", ", $cols) . "\n\n";

    // Dump Users (safely)
    echo "=== USERS DATA ===\n";
    // Construct safe query based on columns
    $fields = ['id', 'email'];
    if (in_array('first_name', $cols)) $fields[] = 'first_name';
    if (in_array('last_name', $cols)) $fields[] = 'last_name';
    if (in_array('role', $cols)) $fields[] = 'role';
    if (in_array('name', $cols)) $fields[] = 'name';
    if (in_array('user_type', $cols)) $fields[] = 'user_type';
    if (in_array('workspace_id', $cols)) $fields[] = 'workspace_id';
    
    $sql = "SELECT " . implode(',', $fields) . " FROM users";
    $users = $db->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    print_r($users);

    // Campaigns Inspection
    echo "\n=== CAMPAIGNS ===\n";
    if (in_array('campaigns', $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN))) {
        $cCols = $db->query("DESCRIBE campaigns")->fetchAll(PDO::FETCH_COLUMN);
        
        $cFields = ['id', 'name'];
        if (in_array('workspace_id', $cCols)) $cFields[] = 'workspace_id';
        if (in_array('user_id', $cCols)) $cFields[] = 'user_id';
        
        $cSql = "SELECT " . implode(',', $cFields) . " FROM campaigns LIMIT 5";
        $campaigns = $db->query($cSql)->fetchAll(PDO::FETCH_ASSOC);
        print_r($campaigns);
    } else {
        echo "Table 'campaigns' does not exist.\n";
    }

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
