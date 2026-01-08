<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=xordon', 'root', '');
$res = $pdo->query('DESCRIBE contact_lists')->fetchAll(PDO::FETCH_ASSOC);
file_put_contents(__DIR__ . '/schema_dump.json', json_encode($res, JSON_PRETTY_PRINT));
echo "Dumped " . count($res) . " columns\n";
