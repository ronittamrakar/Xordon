<?php
// Check table structure

$host = 'localhost';
$dbname = 'xordon';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=== TABLE STRUCTURES ===\n\n";
    
    $tables = ['ticket_teams', 'kb_categories', 'tickets'];
    
    foreach ($tables as $table) {
        echo "Table: $table\n";
        $stmt = $pdo->query("DESCRIBE $table");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($columns as $col) {
            echo "  - {$col['Field']} ({$col['Type']})\n";
        }
        echo "\n";
    }
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
