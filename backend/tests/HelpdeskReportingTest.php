<?php

require_once __DIR__ . '/../src/Config.php';
require_once __DIR__ . '/../src/bootstrap.php';
require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/Response.php';
require_once __DIR__ . '/../src/Auth.php';

class HelpdeskReportingTest {
    public static function run() {
        echo "Running HelpdeskReportingTest...\n";
        $token = getenv('DEV_TEST_AUTH_TOKEN') ?: null;
        if (!$token) { echo "No DEV_TEST_AUTH_TOKEN found — skipping HelpdeskReportingTest.\n"; return; }
        $base = getenv('APP_BASE_URL') ?: 'http://127.0.0.1:8001';

        $ch = curl_init($base . '/api/helpdesk/reports/metrics?days=30');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $token]);
        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($code !== 200) { echo "Metrics failed (HTTP $code): $res\n"; return; }
        echo "Metrics OK\n";

        $ch = curl_init($base . '/api/helpdesk/reports/export?days=30&format=csv');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $token]);
        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($code !== 200) { echo "Export failed (HTTP $code): $res\n"; return; }
        echo "Export OK (CSV)\n";

        echo "HelpdeskReportingTest completed.\n";
    }
}

HelpdeskReportingTest::run();
