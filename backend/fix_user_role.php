<?php
require_once __DIR__ . '/src/Database.php';

try {
    $pdo = Database::conn();
    
    // Assign Admin role (1) to user 33 (Ronit Tamrakar)
    $stmt = $pdo->prepare("UPDATE users SET role_id = 1 WHERE id = 33");
    $stmt->execute();
    
    echo "Updated user 33 to have Admin role.\n";
    
    // Also fix any other users with NULL role to use default role (e.g. 3 - Outreach Specialist or 1 - Admin)
    // For dev environment, maybe safe to make them Admins or just leave them.
    // I will check if updated successfully.
    
    $stmt = $pdo->query("SELECT id, name, role_id FROM users WHERE id = 33");
    print_r($stmt->fetch(PDO::FETCH_ASSOC));

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
