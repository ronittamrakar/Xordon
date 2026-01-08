<?php
require_once __DIR__ . '/backend/src/Config.php';
require_once __DIR__ . '/backend/src/Database.php';

$db = Database::conn();

echo "=== ticket_messages columns ===\n";
$stmt = $db->query('DESCRIBE ticket_messages');
$cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols as $col) {
    echo $col['Field'] . ' - ' . $col['Type'] . "\n";
}

echo "\n=== Testing unread subquery ===\n";
try {
    $sql = "SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = 1 AND is_private = FALSE AND direction = 'inbound'";
    $stmt = $db->query($sql);
    echo "Count: " . $stmt->fetchColumn() . "\n";
    echo "✓ Subquery works!\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
