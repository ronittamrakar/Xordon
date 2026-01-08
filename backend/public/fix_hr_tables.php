<?php
require_once __DIR__ . '/../src/bootstrap.php';
require_once __DIR__ . '/../src/Database.php';

try {
    $db = \Xordon\Database::conn();
    
    echo "Creating employee_profiles table...\n";
    $db->exec("CREATE TABLE IF NOT EXISTS employee_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        workspace_id INT NOT NULL,
        job_title VARCHAR(255),
        department VARCHAR(255),
        reports_to INT,
        hire_date DATE,
        employment_type ENUM('full_time', 'part_time', 'contractor', 'intern') DEFAULT 'full_time',
        work_location VARCHAR(255),
        emergency_contact_name VARCHAR(255),
        emergency_contact_phone VARCHAR(255),
        emergency_contact_relation VARCHAR(255),
        skills TEXT,
        certifications TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY user_workspace (user_id, workspace_id)
    )");
    echo "Done.\n";

    echo "Checking for other tables...\n";
    $tables = [
        'shift_types' => "CREATE TABLE IF NOT EXISTS shift_types (
            id INT AUTO_INCREMENT PRIMARY KEY,
            workspace_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            color VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )"
    ];

    foreach ($tables as $name => $sql) {
        $stmt = $db->query("SHOW TABLES LIKE '$name'");
        if (!$stmt->fetch()) {
            echo "Creating $name...\n";
            $db->exec($sql);
            echo "Done.\n";
        } else {
            echo "Table $name already exists.\n";
        }
    }

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
