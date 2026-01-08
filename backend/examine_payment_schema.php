<?php
try {
    $db = new PDO('mysql:host=localhost;dbname=xordon', 'root', '');
    $targetTables = ['payments', 'payment_links', 'subscriptions', 'refunds', 'stripe_accounts'];
    $output = "";
    foreach ($targetTables as $table) {
        $output .= "--- $table ---\n";
        $columns = $db->query("DESCRIBE $table")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($columns as $col) {
            $output .= sprintf("%-25s %-20s %s\n", $col['Field'], $col['Type'], $col['Null'] === 'YES' ? 'NULL' : 'NOT NULL');
        }
    }
    file_put_contents('schema_output.txt', $output);
    echo "Done";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
