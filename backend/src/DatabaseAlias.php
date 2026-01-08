<?php
// Backwards-compatibility shim: provide a global Database class that controllers expect
if (!class_exists('Database') && class_exists('Xordon\Database')) {
    class_alias('Xordon\Database', 'Database');
} elseif (!class_exists('Database')) {
    // Fallback if autoloader hasn't caught it yet but file was required
    require_once __DIR__ . '/Database.php';
    if (class_exists('Xordon\Database')) {
        class_alias('Xordon\Database', 'Database');
    }
}
