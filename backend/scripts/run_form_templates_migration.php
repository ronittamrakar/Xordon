<?php
require_once 'src/Database.php';

try {
    $pdo = Database::conn();
    $sql = file_get_contents('migrations/add_form_templates_table.sql');
    $pdo->exec($sql);
    echo "Form templates table created successfully!\n";
} catch (Exception $e) {
    echo "Error creating form templates table: " . $e->getMessage() . "\n";
}