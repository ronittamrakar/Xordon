<?php
require 'backend/src/Database.php';
$pdo = Database::conn();
$tables = ['projects', 'sales_tasks', 'project_tasks', 'tasks', 'folders', 'project_templates', 'project_template_tasks', 'fb_form_templates'];
foreach($tables as $t) {
    try {
        $stmt = $pdo->query("SELECT COUNT(*) FROM $t");
        echo "$t: " . $stmt->fetchColumn() . "\n";
    } catch(Exception $e) {
        echo "$t: Error or missing table (" . $e->getMessage() . ")\n";
    }
}
