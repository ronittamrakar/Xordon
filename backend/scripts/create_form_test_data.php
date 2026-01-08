<?php
/**
 * WebForms Test Data Generator
 * Ensures Form 60 exists for testing
 */

require_once __DIR__ . '/../vendor/autoload.php';

try {
    $db = new PDO('mysql:host=localhost;dbname=xordon', 'root', '');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $workspaceId = 1;
    $formId = 60;

    echo "=== Creating WebForms Test Data ===\n\n";

    // Check if form 60 exists
    $stmt = $db->prepare('SELECT id FROM webforms_forms WHERE id = ?');
    $stmt->execute([$formId]);
    if ($stmt->fetch()) {
        echo "Form 60 already exists.\n";
    } else {
        // Create Form 60
        $stmt = $db->prepare('INSERT INTO webforms_forms (id, workspace_id, title, description, status, type, settings, theme, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())');
        $stmt->execute([
            $formId,
            $workspaceId,
            'Audit Test Form',
            'Form created for audit validation',
            'draft',
            'single_step',
            json_encode(['marketplace' => ['enabled' => true]]), // Enable marketplace settings for testing
            '{}'
        ]);
        echo "Created Form 60: Audit Test Form\n";
        
        // Add sample fields
        $fields = [
            ['field_type' => 'text', 'label' => 'Name', 'position' => 0],
            ['field_type' => 'email', 'label' => 'Email', 'position' => 1],
            ['field_type' => 'textarea', 'label' => 'Message', 'position' => 2],
        ];
        
        foreach ($fields as $f) {
            $stmt = $db->prepare("INSERT INTO webforms_form_fields (form_id, field_type, label, position, workspace_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())");
            $stmt->execute([
                $formId,
                $f['field_type'],
                $f['label'],
                $f['position'],
                $workspaceId
            ]);
        }
        echo "Added sample fields to Form 60.\n";
    }

    echo "\n=== WebForms Data Creation Complete! ===\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
