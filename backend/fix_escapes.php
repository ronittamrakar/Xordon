<?php
// Fix the escaped characters in index.php
$file = __DIR__ . '/public/index.php';
$content = file_get_contents($file);

// Replace the escaped arrow operators
$content = str_replace('=\\u003e', '=>', $content);

// Write back
file_put_contents($file, $content);

echo "Fixed escaped characters in index.php\n";
