<?php

require_once __DIR__ . '/../src/Config.php';
require_once __DIR__ . '/../src/bootstrap.php';
require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/Response.php';
require_once __DIR__ . '/../src/Auth.php';

class BulkActionsTest {
    public static function run() {
        echo "Running BulkActionsTest...\n";
        $token = getenv('DEV_TEST_AUTH_TOKEN') ?: null;
        if (!$token) {
            echo "No DEV_TEST_AUTH_TOKEN found — skipping BulkActionsTest.\n";
            return;
        }
        $base = getenv('APP_BASE_URL') ?: 'http://127.0.0.1:8001';

        // Create two test tickets
        $t1 = self::createTicket($base, $token, 'Bulk Test 1');
        $t2 = self::createTicket($base, $token, 'Bulk Test 2');
        if (!$t1 || !$t2) { echo "Failed to create test tickets\n"; return; }

        $payload = [
            'action_type' => 'status',
            'ticket_ids' => [$t1, $t2],
            'action_data' => ['status' => 'closed']
        ];

        $ch = curl_init($base . '/api/helpdesk/bulk-actions');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Authorization: Bearer ' . $token]);
        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($code !== 200) { echo "Bulk action failed (HTTP $code): $res\n"; return; }

        echo "Bulk action processed: $res\n";

        // Cleanup - delete created tickets
        self::deleteTicket($base, $token, $t1);
        self::deleteTicket($base, $token, $t2);

        echo "BulkActionsTest completed.\n";
    }

    private static function createTicket($base, $token, $title) {
        $ch = curl_init($base . '/api/tickets');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['title' => $title, 'description' => 'created by test']));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Authorization: Bearer ' . $token]);
        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($code !== 201) return null;
        $data = json_decode($res, true);
        return $data['id'] ?? null;
    }

    private static function deleteTicket($base, $token, $id) {
        $ch = curl_init($base . '/api/tickets/' . $id);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $token]);
        curl_exec($ch);
        curl_close($ch);
    }
}

BulkActionsTest::run();
