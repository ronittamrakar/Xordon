<?php
/**
 * Run all Intelligent Follow-up Automations property tests
 */

echo "========================================\n";
echo "  Intelligent Follow-up Automations\n";
echo "  Property-Based Test Suite\n";
echo "========================================\n\n";

$testFiles = [
    'SentimentAnalyzerTest.php',
    'IntentDetectorTest.php',
    'SemanticMatcherTest.php',
    'TriggerEvaluatorTest.php',
    'ContactSentimentServiceTest.php',
    'CampaignLogAggregatorTest.php',
    'SentimentConfigTest.php',
    'NegativeSentimentFlaggingTest.php',
    'AnalysisStorageServiceTest.php',
];

$totalPassed = 0;
$totalFailed = 0;

foreach ($testFiles as $file) {
    $path = __DIR__ . '/' . $file;
    if (file_exists($path)) {
        require_once $path;
        
        $className = str_replace('.php', '', $file);
        if (class_exists($className)) {
            $test = new $className();
            $test->runAll();
        }
    }
}

echo "\n========================================\n";
echo "  All Tests Complete\n";
echo "========================================\n";
