<?php
// Minimal autoloader for tests/development when Composer isn't installed
spl_autoload_register(function ($class) {
    // Convert namespace to file path
    $class = ltrim($class, '\\\\');
    $parts = explode('\\\\', $class);

    // Map either the Xordon or App root namespace to backend/src for development
    if ($parts[0] === 'Xordon' || $parts[0] === 'App') {
        array_shift($parts);
        $file = __DIR__ . '/../src/' . implode('/', $parts) . '.php';
        if (file_exists($file)) {
            require_once $file;
        }
    }
});

// Provide a fallback for common global class names by ensuring namespaced classes are loaded and aliased
$toAlias = [
    'Response' => 'Xordon\\Response',
    'Logger' => 'Xordon\\Logger',
    'Config' => 'Xordon\\Config',
    'Database' => 'Xordon\\Database',
];
foreach ($toAlias as $global => $ns) {
    if (!class_exists($global)) {
        // If the namespaced class isn't loaded, attempt to include its file if present
        if (!class_exists($ns)) {
            $nsParts = explode('\\', $ns);
            if (count($nsParts) > 1 && $nsParts[0] === 'Xordon') {
                array_shift($nsParts);
                $file = __DIR__ . '/../src/' . implode('/', $nsParts) . '.php';
                if (file_exists($file)) {
                    require_once $file;
                }
            }
        }
        if (class_exists($ns)) {
            if (!class_exists($global)) {
                class_alias($ns, $global);
            }
        }
    }
}