<?php
/**
 * Create Sample Data for Testing
 * This script creates sample campaigns, forms, and sequences in the database
 */

// Load environment variables
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
        putenv(trim($name) . '=' . trim($value));
    }
}

require_once __DIR__ . '/backend/src/Database.php';

use Xordon\Database;

try {
    $db = Database::conn();
    
    echo "Creating sample data...\n\n";
    
    // Get or create a test user
    $stmt = $db->query("SELECT id FROM users LIMIT 1");
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    $userId = $user ? $user['id'] : 1;
    
    // Get or create a workspace
    $stmt = $db->query("SELECT id FROM workspaces LIMIT 1");
    $workspace = $stmt->fetch(PDO::FETCH_ASSOC);
    $workspaceId = $workspace ? $workspace['id'] : 1;
    
    echo "Using User ID: $userId\n";
    echo "Using Workspace ID: $workspaceId\n\n";
    
    // Create sample campaigns
    echo "Creating sample campaigns...\n";
    $campaigns = [
        ['name' => 'Welcome Email Campaign', 'subject' => 'Welcome to our platform!', 'status' => 'active'],
        ['name' => 'Product Launch Campaign', 'subject' => 'Introducing our new product', 'status' => 'draft'],
        ['name' => 'Newsletter Campaign', 'subject' => 'Monthly Newsletter - January 2026', 'status' => 'scheduled'],
    ];
    
    foreach ($campaigns as $campaign) {
        $stmt = $db->prepare("
            INSERT INTO campaigns (name, subject, status, user_id, workspace_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([
            $campaign['name'],
            $campaign['subject'],
            $campaign['status'],
            $userId,
            $workspaceId
        ]);
        echo "  ✓ Created: {$campaign['name']}\n";
    }
    
    // Create sample forms
    echo "\nCreating sample forms...\n";
    $forms = [
        ['name' => 'Contact Form', 'description' => 'General contact form for website'],
        ['name' => 'Lead Capture Form', 'description' => 'Capture leads from landing page'],
        ['name' => 'Survey Form', 'description' => 'Customer satisfaction survey'],
    ];
    
    foreach ($forms as $form) {
        $formFields = json_encode([
            ['type' => 'text', 'label' => 'Name', 'required' => true],
            ['type' => 'email', 'label' => 'Email', 'required' => true],
            ['type' => 'textarea', 'label' => 'Message', 'required' => false],
        ]);
        
        $stmt = $db->prepare("
            INSERT INTO forms (name, description, fields, status, user_id, workspace_id, created_at, updated_at)
            VALUES (?, ?, ?, 'published', ?, ?, NOW(), NOW())
        ");
        $stmt->execute([
            $form['name'],
            $form['description'],
            $formFields,
            $userId,
            $workspaceId
        ]);
        echo "  ✓ Created: {$form['name']}\n";
    }
    
    // Create sample sequences
    echo "\nCreating sample sequences...\n";
    $sequences = [
        ['name' => 'Onboarding Sequence', 'description' => 'Welcome new users'],
        ['name' => 'Re-engagement Sequence', 'description' => 'Re-engage inactive users'],
        ['name' => 'Nurture Sequence', 'description' => 'Nurture leads to conversion'],
    ];
    
    foreach ($sequences as $sequence) {
        $stmt = $db->prepare("
            INSERT INTO sequences (name, description, status, user_id, workspace_id, created_at, updated_at)
            VALUES (?, ?, 'active', ?, ?, NOW(), NOW())
        ");
        $stmt->execute([
            $sequence['name'],
            $sequence['description'],
            $userId,
            $workspaceId
        ]);
        echo "  ✓ Created: {$sequence['name']}\n";
    }
    
    echo "\n✅ Sample data created successfully!\n";
    echo "\nYou can now:\n";
    echo "  - View campaigns at: http://localhost:5173/reach/outbound/email/campaigns\n";
    echo "  - View forms at: http://localhost:5173/forms\n";
    echo "  - View sequences at: http://localhost:5173/reach/outbound/email/sequences\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
