<?php
require_once 'src/Database.php';

try {
    $db = Database::conn();
    $sql = file_get_contents('migrations/add_crm_tables.sql');
    
    // Split SQL into individual statements
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $statement) {
        if (!empty($statement)) {
            $db->exec($statement);
        }
    }
    
    echo "CRM tables created successfully\n";
    
    // Insert default pipeline stages if they don't exist
    $stages = [
        ['New Lead', 'Initial contact stage', 1, 10, '#6c757d'],
        ['Contacted', 'First contact made', 2, 20, '#17a2b8'],
        ['Qualified', 'Lead qualified as potential customer', 3, 40, '#28a745'],
        ['Proposal', 'Proposal sent', 4, 60, '#ffc107'],
        ['Negotiation', 'In negotiation phase', 5, 80, '#fd7e14'],
        ['Closed Won', 'Deal successfully closed', 6, 100, '#28a745'],
        ['Closed Lost', 'Deal lost', 7, 0, '#dc3545']
    ];
    
    foreach ($stages as $stage) {
        $stmt = $db->prepare("
            INSERT IGNORE INTO pipeline_stages 
            (user_id, name, description, stage_order, probability, color) 
            VALUES (0, ?, ?, ?, ?, ?)
        ");
        $stmt->execute($stage);
    }
    
    echo "Default pipeline stages inserted\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
