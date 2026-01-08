<?php
require_once __DIR__ . '/backend/src/Database.php';

try {
    $db = Database::conn();
    
    // Get the product we just created
    $product = $db->query("SELECT id, workspace_id FROM products WHERE name = 'Premium Monthly Plan' LIMIT 1")->fetch();
    $productId = $product['id'];
    $workspaceId = $product['workspace_id'];
    $contactId = 1;

    // Simulate POST /api/subscriptions
    $_SERVER['REQUEST_METHOD'] = 'POST';
    // We'll just call the create method directly if possible, or simulate its logic
    
    require_once __DIR__ . '/backend/src/controllers/SubscriptionsController.php';
    
    // We need to mock Auth and Response for this to work perfectly, 
    // but for now I'll just insert manually to test the table
    
    $startDate = date('Y-m-d');
    $nextBillingDate = date('Y-m-d', strtotime('+7 days')); // trial
    $status = 'trialing';
    $subNumber = 'SUB-' . strtoupper(substr(uniqid(), -8));

    $stmt = $db->prepare("
        INSERT INTO customer_subscriptions (
            workspace_id, contact_id, product_id, subscription_number,
            status, billing_amount, currency, billing_interval,
            billing_interval_count, trial_days, trial_end_date,
            setup_fee, start_date, next_billing_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $workspaceId, $contactId, $productId, $subNumber,
        $status, 29.99, 'USD', 'monthly', 1, 7, $nextBillingDate, 0, $startDate, $nextBillingDate
    ]);
    
    echo "Sample subscription created successfully!\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
