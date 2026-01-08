<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=xordon', 'root', '');
$res = $pdo->query('DESCRIBE contact_lists')->fetchAll(PDO::FETCH_ASSOC);
foreach($res as $row) {
    echo $row['Field'] . " - " . $row['Type'] . "\n";
}
