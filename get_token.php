<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=xordon', 'root', '');
$stmt = $pdo->query('SELECT token FROM auth_tokens LIMIT 1');
echo $stmt->fetchColumn();
