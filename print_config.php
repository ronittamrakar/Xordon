<?php
require_once __DIR__ . '/backend/src/Database.php';
$db = Database::conn();
$row = $db->query("SELECT config FROM connections WHERE id = '20c442e1f6aa43f0e9befb43c61250e32f89'")->fetch();
echo $row['config'];
