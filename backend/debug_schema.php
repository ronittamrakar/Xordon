<?php
require_once __DIR__ . '/src/Database.php';
use Xordon\Database;
$pdo = Database::conn();
var_dump($pdo->query('DESCRIBE contact_lists')->fetchAll(PDO::FETCH_ASSOC));
