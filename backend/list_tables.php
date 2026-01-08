<?php
try {
    $db = new PDO('mysql:host=localhost;dbname=xordon', 'root', '');
    $tables = $db->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    echo implode("\n", $tables);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
