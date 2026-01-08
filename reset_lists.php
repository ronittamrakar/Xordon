<?php
require __DIR__ . '/backend/src/bootstrap.php';
$pdo = Database::conn();
$pdo->exec('UPDATE contact_lists SET parent_id = NULL');
echo "All lists and folders have been moved to the Root level for re-organization.";
