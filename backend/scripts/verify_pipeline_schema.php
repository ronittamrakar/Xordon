<?php
$db = new PDO('mysql:host=127.0.0.1;dbname=xordon', 'root', '', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

function cols(PDO $db, string $table): array {
    $stmt = $db->query("SHOW COLUMNS FROM `$table`");
    $rows = $stmt->fetchAll();
    return array_map(fn($r) => $r['Field'], $rows);
}

$tables = ['pipelines', 'pipeline_stages'];
foreach ($tables as $t) {
    echo "=== $t ===\n";
    $stmt = $db->query("SHOW TABLES LIKE '$t'");
    if (!$stmt->fetchColumn()) {
        echo "MISSING\n\n";
        continue;
    }

    $c = cols($db, $t);
    echo "Columns (" . count($c) . "): " . implode(', ', $c) . "\n";
    $cnt = (int)$db->query("SELECT COUNT(*) AS c FROM `$t`")->fetchColumn();
    echo "Rows: $cnt\n\n";
}

// Check required columns for OpportunitiesController
$required = [
    'pipelines' => ['workspace_id', 'company_id', 'name', 'is_default'],
    'pipeline_stages' => ['workspace_id', 'company_id', 'pipeline_id', 'name', 'color', 'sort_order', 'is_won', 'is_lost'],
];

foreach ($required as $table => $colsReq) {
    $stmt = $db->query("SHOW TABLES LIKE '$table'");
    if (!$stmt->fetchColumn()) continue;

    $present = array_flip(cols($db, $table));
    $missing = [];
    foreach ($colsReq as $col) {
        if (!isset($present[$col])) $missing[] = $col;
    }

    if ($missing) {
        echo "❌ $table missing columns: " . implode(', ', $missing) . "\n";
    } else {
        echo "✅ $table has required columns\n";
    }
}

// Default pipeline/stages sanity
try {
    $defaultPipeline = $db->query("SELECT id, workspace_id, name FROM pipelines WHERE is_default = 1 ORDER BY id ASC LIMIT 1")->fetch();
    if ($defaultPipeline) {
        $pid = (int)$defaultPipeline['id'];
        $sc = (int)$db->query("SELECT COUNT(*) FROM pipeline_stages WHERE pipeline_id = $pid")->fetchColumn();
        echo "Default pipeline: #$pid (workspace {$defaultPipeline['workspace_id']}) stages=$sc\n";
    } else {
        echo "⚠️ No default pipeline found\n";
    }
} catch (Throwable $e) {
    echo "⚠️ Default pipeline check failed: {$e->getMessage()}\n";
}
