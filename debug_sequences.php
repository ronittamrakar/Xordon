<?php
$host = '127.0.0.1';
$db   = 'xordon';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';
$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$pdo = new PDO($dsn, $user, $pass);

echo "Checking sequence_steps...\n";
$steps = $pdo->query("SELECT * FROM sequence_steps LIMIT 1")->fetchAll(PDO::FETCH_ASSOC);
print_r($steps);

if (!empty($steps)) {
    $seqId = $steps[0]['sequence_id'];
    echo "Found sequence_id: $seqId. Checking 'sequences' table...\n";
    try {
        $seq = $pdo->query("SELECT * FROM sequences WHERE id = $seqId")->fetch();
        print_r($seq);
    } catch (Exception $e) {
        echo "Error querying sequences: " . $e->getMessage() . "\n";
    }

    echo "Checking 'crm_sequences' table...\n";
    try {
        $seq = $pdo->query("SELECT * FROM crm_sequences WHERE id = $seqId")->fetch();
        print_r($seq);
    } catch (Exception $e) {
         echo "Error querying crm_sequences: " . $e->getMessage() . "\n";
    }
}
?>
