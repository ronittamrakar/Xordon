<?php
require_once __DIR__ . '/backend/src/Config.php';
require_once __DIR__ . '/backend/src/Database.php';

try {
    $db = Database::conn();
    
    echo "Testing tickets query...\n\n";
    
    // Simple query first
    $stmt = $db->query("SELECT * FROM tickets LIMIT 1");
    $ticket = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Raw ticket data:\n";
    print_r($ticket);
    
    // Now test the full query
    echo "\n\nTesting full query with JOINs...\n";
    $sql = "
        SELECT 
            t.*,
            ts.name as stage_name,
            ts.color as stage_color,
            tt.name as team_name,
            ttype.name as type_name,
            ttype.icon as type_icon,
            u.name as assigned_user_name
        FROM tickets t
        LEFT JOIN ticket_stages ts ON t.stage_id = ts.id
        LEFT JOIN ticket_teams tt ON t.team_id = tt.id
        LEFT JOIN ticket_types ttype ON t.ticket_type_id = ttype.id
        LEFT JOIN users u ON t.assigned_user_id = u.id
        WHERE t.workspace_id = 1
        LIMIT 1
    ";
    
    $stmt = $db->query($sql);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Join query result:\n";
    print_r($result);
    
    // Test the subquery
    echo "\n\nTesting message count subquery...\n";
    $sql = "
        SELECT 
            t.id,
            t.subject,
            (SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = t.id) as message_count
        FROM tickets t
        WHERE t.workspace_id = 1
        LIMIT 1
    ";
    
    $stmt = $db->query($sql);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Subquery result:\n";
    print_r($result);
    
    // Test the full controller query
    echo "\n\nTesting full controller query...\n";
    $sql = "
        SELECT 
            t.*,
            ts.name as stage_name,
            ts.color as stage_color,
            tt.name as team_name,
            ttype.name as type_name,
            ttype.icon as type_icon,
            u.name as assigned_user_name,
            (SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = t.id) as message_count,
            (SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = t.id AND is_private = FALSE AND direction = 'inbound' AND created_at > COALESCE(t.first_response_at, NOW())) as unread_count
        FROM tickets t
        LEFT JOIN ticket_stages ts ON t.stage_id = ts.id
        LEFT JOIN ticket_teams tt ON t.team_id = tt.id
        LEFT JOIN ticket_types ttype ON t.ticket_type_id = ttype.id
        LEFT JOIN users u ON t.assigned_user_id = u.id
        WHERE t.workspace_id = 1
        ORDER BY 
            CASE WHEN t.priority = 'urgent' THEN 1 
                 WHEN t.priority = 'high' THEN 2 
                 WHEN t.priority = 'medium' THEN 3 
                 ELSE 4 END,
            t.created_at DESC
        LIMIT 10 OFFSET 0
    ";
    
    $stmt = $db->query($sql);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Full query results: " . count($results) . " tickets\n";
    if (!empty($results)) {
        print_r($results[0]);
    }
    
    echo "\n✅ All queries executed successfully!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    echo "File: " . $e->getFile() . "\n";
}
