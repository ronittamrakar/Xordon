<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=xordon', 'root', '');
print_r($pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN));
