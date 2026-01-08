<?php
// test_funnels.php
require_once 'backend/src/Database.php';

// Mock Tenant Context
class MockTenantContext {
    public $workspaceId = 1;
}
$GLOBALS['tenantContext'] = new MockTenantContext();

echo "Starting Funnel Tests...\n";

try {
    $db = Database::conn();
    echo "Database connected.\n";

    // 1. Create Funnel
    echo "Creating funnel...\n";
    $createData = [
        'name' => 'Test Funnel ' . time(),
        'description' => 'A test funnel',
        'domain' => 'example.com',
        'steps' => [
            ['name' => 'Landing Step', 'step_type' => 'landing', 'sort_order' => 0],
            ['name' => 'Thank You Step', 'step_type' => 'thankyou', 'sort_order' => 1]
        ]
    ];
    
    // Simulate Controller call logic manually since we can't easily mock php://input
    require_once 'backend/src/controllers/FunnelsController.php';

    // We'll have to modify store/update to accept array data or mock php://input if we want to use the controller directly.
    // However, simpler is to verify the DB logic or use a helper that swaps input stream.
    // For this quick check, let's just use reflection or a small modification if needed.
    // Wait, FunnelsController reads php://input. Let's create a temporary wrapper or manual insertion to verify schema.
    
    // Manual Step Insertion Verification (Schema Check)
    $stmt = $db->prepare("INSERT INTO funnels (workspace_id, name, slug) VALUES (1, ?, ?)");
    $stmt->execute(['Manual Test Funnel', 'manual-test-funnel-'.time()]);
    $funnelId = $db->lastInsertId();
    echo "Funnel created with ID: $funnelId\n";
    
    $stmt = $db->prepare("INSERT INTO funnel_steps (funnel_id, name, slug, step_type, sort_order) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$funnelId, 'Step 1', 'step-1', 'landing', 0]);
    echo "Step 1 created.\n";
    
    $stmt->execute([$funnelId, 'Step 2', 'step-2', 'thankyou', 1]);
    echo "Step 2 created.\n";

    // Verify retrieval
    $stmt = $db->prepare("SELECT * FROM funnel_steps WHERE funnel_id = ? ORDER BY sort_order");
    $stmt->execute([$funnelId]);
    $steps = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($steps) === 2) {
        echo "SUCCESS: Retrieved 2 steps.\n";
    } else {
        echo "FAILURE: Expected 2 steps, got " . count($steps) . "\n";
    }
    
    // Cleanup
    $db->prepare("DELETE FROM funnels WHERE id = ?")->execute([$funnelId]);
    echo "Cleanup complete.\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
