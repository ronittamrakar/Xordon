<?php
/**
 * Pre-Deployment Security Checker
 * Run this script BEFORE every production deployment
 * 
 * Usage: php scripts/pre_deploy_check.php
 */

echo "===========================================\n";
echo "  XORDON PRE-DEPLOYMENT SECURITY CHECK\n";
echo "===========================================\n\n";

$errors = [];
$warnings = [];
$passed = 0;

// 1. Check ALLOW_DEV_BYPASS
$devBypass = getenv('ALLOW_DEV_BYPASS');
if ($devBypass === 'true') {
    $errors[] = "🔴 CRITICAL: ALLOW_DEV_BYPASS is set to 'true' - ALL TENANT ISOLATION IS BYPASSED!";
} else {
    echo "✅ ALLOW_DEV_BYPASS is disabled\n";
    $passed++;
}

// 2. Check APP_ENV
$appEnv = getenv('APP_ENV') ?: 'development';
if ($appEnv !== 'production') {
    $errors[] = "🔴 CRITICAL: APP_ENV is '$appEnv' - should be 'production'";
} else {
    echo "✅ APP_ENV is set to production\n";
    $passed++;
}

// 3. Check SKIP_MODULE_GUARD
$skipGuard = getenv('SKIP_MODULE_GUARD');
if ($skipGuard === 'true') {
    $warnings[] = "⚠️  WARNING: SKIP_MODULE_GUARD is enabled - module access controls bypassed";
} else {
    echo "✅ SKIP_MODULE_GUARD is disabled\n";
    $passed++;
}

// 4. Check RATE_LIMIT_DEV_BYPASS
$rateBypass = getenv('RATE_LIMIT_DEV_BYPASS');
if ($rateBypass === 'true') {
    $warnings[] = "⚠️  WARNING: RATE_LIMIT_DEV_BYPASS is enabled - DDoS protection reduced";
} else {
    echo "✅ RATE_LIMIT_DEV_BYPASS is disabled\n";
    $passed++;
}

// 5. Check JWT_SECRET
$jwtSecret = getenv('JWT_SECRET') ?: '';
if (strlen($jwtSecret) < 32) {
    $errors[] = "🔴 CRITICAL: JWT_SECRET is too short (minimum 32 characters)";
} elseif (strpos($jwtSecret, 'dev') !== false || strpos($jwtSecret, 'test') !== false) {
    $errors[] = "🔴 CRITICAL: JWT_SECRET appears to be a development value";
} else {
    echo "✅ JWT_SECRET is properly configured\n";
    $passed++;
}

// 6. Check ENCRYPTION_KEY
$encKey = getenv('ENCRYPTION_KEY') ?: '';
if (strlen($encKey) < 32) {
    $errors[] = "🔴 CRITICAL: ENCRYPTION_KEY is too short (minimum 32 characters)";
} elseif (strpos($encKey, 'dev') !== false || strpos($encKey, 'test') !== false) {
    $errors[] = "🔴 CRITICAL: ENCRYPTION_KEY appears to be a development value";
} else {
    echo "✅ ENCRYPTION_KEY is properly configured\n";
    $passed++;
}

// 7. Check DEMO_MODE
$demoMode = getenv('DEMO_MODE');
if ($demoMode === 'true') {
    $warnings[] = "⚠️  WARNING: DEMO_MODE is enabled - emails will not be sent";
} else {
    echo "✅ DEMO_MODE is disabled\n";
    $passed++;
}

// 8. Check LOG_LEVEL
$logLevel = getenv('LOG_LEVEL') ?: 'DEBUG';
if ($logLevel === 'DEBUG') {
    $warnings[] = "⚠️  WARNING: LOG_LEVEL is DEBUG - may expose sensitive data in logs";
} else {
    echo "✅ LOG_LEVEL is set to $logLevel\n";
    $passed++;
}

// 9. Check database connection
try {
    require_once __DIR__ . '/../backend/src/Database.php';
    $pdo = Database::conn();
    $stmt = $pdo->query("SELECT 1");
    echo "✅ Database connection successful\n";
    $passed++;
} catch (Exception $e) {
    $errors[] = "🔴 CRITICAL: Database connection failed - " . $e->getMessage();
}

// 10. Check for exposed PHP files in public directory
$dangerousFiles = glob(__DIR__ . '/../backend/public/*.php');
$exposedFiles = array_filter($dangerousFiles, function($f) {
    return !in_array(basename($f), ['index.php', '.htaccess']);
});
if (count($exposedFiles) > 0) {
    $warnings[] = "⚠️  WARNING: Found " . count($exposedFiles) . " extra PHP files in public directory";
} else {
    echo "✅ No extra PHP files in public directory\n";
    $passed++;
}

// Summary
echo "\n===========================================\n";
echo "  RESULTS\n";
echo "===========================================\n";
echo "Passed: $passed checks\n";

if (count($warnings) > 0) {
    echo "\nWarnings (" . count($warnings) . "):\n";
    foreach ($warnings as $w) {
        echo "  $w\n";
    }
}

if (count($errors) > 0) {
    echo "\nErrors (" . count($errors) . "):\n";
    foreach ($errors as $e) {
        echo "  $e\n";
    }
    echo "\n🛑 DEPLOYMENT BLOCKED - Fix critical errors before deploying!\n";
    exit(1);
}

if (count($warnings) > 0) {
    echo "\n⚠️  Deployment allowed with warnings - review before proceeding\n";
    exit(0);
}

echo "\n✅ ALL CHECKS PASSED - Safe to deploy!\n";
exit(0);
