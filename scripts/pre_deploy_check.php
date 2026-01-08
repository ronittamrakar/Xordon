<?php
// scripts/pre_deploy_check.php
// This script simulates a pre-deployment check for critical security and configuration issues.

echo "🔒 Starting Pre-Deployment Security Check...\n";

$errors = [];
$warnings = [];

// 1. Check for sensitive files that shouldn't be in the repo
$sensitiveFiles = ['.env', 'backend/.env', 'public/.DS_Store'];
foreach ($sensitiveFiles as $file) {
    if (file_exists(__DIR__ . '/../' . $file)) {
        // In a real CI environment, the .env might be created by the CI itself (from secrets), so we just warn
        $warnings[] = "Sensitive file found: $file (Ensure this is not committed to git)";
    }
}

// 2. Check for Debug Mode in configurations (Scanning typical config locations)
$configFiles = glob(__DIR__ . '/../backend/src/*.php');
foreach ($configFiles as $file) {
    $content = file_get_contents($file);
    if (strpos($content, "'debug' => true") !== false) {
        $warnings[] = "Debug mode might be enabled in " . basename($file);
    }
}

// 3. Environment Variable Check (Simulation)
// IN CI, these are set by the YAML. Locally, we might verify .env exists.
if (getenv('CI')) {
    $requiredVars = ['JWT_SECRET', 'DB_HOST', 'DB_NAME'];
    foreach ($requiredVars as $var) {
        if (!getenv($var)) {
            $warnings[] = "Missing critical environment variable in CI: $var";
        }
    }
}

// 4. Syntax Check on Backend (Basic)
echo "   Running PHP syntax check on backend/src...\n";
$phpFiles = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(__DIR__ . '/../backend/src'));
foreach ($phpFiles as $file) {
    if ($file->getExtension() === 'php') {
        $output = [];
        $returnVar = 0;
        exec("php -l \"" . $file->getPathname() . "\"", $output, $returnVar);
        if ($returnVar !== 0) {
            $errors[] = "Syntax error in " . $file->getFilename();
        }
    }
}

// Reporting
echo "\n=== REPORT ===\n";

if (!empty($warnings)) {
    echo "⚠️  WARNINGS:\n";
    foreach ($warnings as $w) echo " - $w\n";
}

if (!empty($errors)) {
    echo "❌ CRITICAL ERRORS:\n";
    foreach ($errors as $e) echo " - $e\n";
    exit(1);
} else {
    echo "✅ checks passed.\n";
    exit(0);
}
