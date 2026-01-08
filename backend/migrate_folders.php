<?php
require_once __DIR__ . '/src/Config.php';
require_once __DIR__ . '/src/Database.php';

try {
    $db = Database::conn();
    
    // Check if column exists
    $stmt = $db->query("SHOW COLUMNS FROM files LIKE 'folder_id'");
    if ($stmt->rowCount() == 0) {
        echo "Adding folder_id column to files table...\n";
        $db->exec("ALTER TABLE files ADD COLUMN folder_id INT(11) NULL AFTER entity_id");
        $db->exec("ALTER TABLE files ADD INDEX idx_files_folder_id (folder_id)");
        echo "Column added.\n";
    } else {
        echo "folder_id column already exists.\n";
    }

    // Check if files struct has 'folder' column to migrate (if we want to keep it or drop it, user previously used it)
    $stmt = $db->query("SHOW COLUMNS FROM files LIKE 'folder'");
    if ($stmt->rowCount() > 0) {
        // Migration logic: For every unique string in 'folder', create a folder in 'folders' table if not exists, and update files.folder_id
        echo "Migrating legacy folder strings...\n";
        
        $files = $db->query("SELECT id, folder, workspace_id, user_id FROM files WHERE folder IS NOT NULL AND folder != '' AND (folder_id IS NULL OR folder_id = 0)")->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($files as $file) {
            $folderName = trim($file['folder']);
            if (!$folderName) continue;

            // Check if folder exists in folders table
            $folderStmt = $db->prepare("SELECT id FROM folders WHERE name = ? AND workspace_id = ?");
            $folderStmt->execute([$folderName, $file['workspace_id']]);
            $folderId = $folderStmt->fetchColumn();

            if (!$folderId) {
                // Create folder
                $ins = $db->prepare("INSERT INTO folders (workspace_id, user_id, name, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())");
                $ins->execute([$file['workspace_id'], $file['user_id'], $folderName]);
                $folderId = $db->lastInsertId();
                echo "Created folder: $folderName ($folderId)\n";
            }

            // Update file
            $upd = $db->prepare("UPDATE files SET folder_id = ? WHERE id = ?");
            $upd->execute([$folderId, $file['id']]);
        }
        echo "Migration complete.\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
