<?php

require_once __DIR__ . '/../src/Config.php';
require_once __DIR__ . '/../src/bootstrap.php';
require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/Response.php';
require_once __DIR__ . '/../src/Auth.php';

// Basic integration tests for saved filters
class SavedFiltersTest {

    public static function run() {
        echo "Running SavedFiltersTest...\n";

        // Assume we have a dev auth token and workspace 1
        $token = getenv('DEV_TEST_AUTH_TOKEN') ?: null;
        if (!$token) {
            echo "No DEV_TEST_AUTH_TOKEN found — skipping SavedFiltersTest.\n";
            return;
        }

        $base = getenv('APP_BASE_URL') ?: 'http://127.0.0.1:8001';

        // Create
        $payload = [
            'name' => 'Integration Test Filter',
            'description' => 'Created by automated test',
            'filter_criteria' => ['status' => 'open', 'assigned_to' => 'me'],
            'is_shared' => false,
            'is_default' => false
        ];

        $ch = curl_init($base . '/api/helpdesk/saved-filters');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Authorization: Bearer ' . $token]);
        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($code !== 201) {
            echo "Create failed (HTTP $code) - response: $res\n";
            return;
        }

        $data = json_decode($res, true);
        $id = $data['id'] ?? null;
        if (!$id) {
            echo "Create returned no id\n";
            return;
        }

        echo "Created saved filter id=$id\n";

        // List
        $ch = curl_init($base . '/api/helpdesk/saved-filters');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $token]);
        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($code !== 200) {
            echo "List failed (HTTP $code) - response: $res\n";
            return;
        }
        echo "List OK\n";

        // Update
        $ch = curl_init($base . '/api/helpdesk/saved-filters/' . $id);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['name' => 'Updated Test Filter', 'is_default' => true]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Authorization: Bearer ' . $token]);
        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($code !== 200) {
            echo "Update failed (HTTP $code) - response: $res\n";
            return;
        }
        echo "Update OK\n";

        // Delete
        $ch = curl_init($base . '/api/helpdesk/saved-filters/' . $id);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $token]);
        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($code !== 200) {
            echo "Delete failed (HTTP $code) - response: $res\n";
            return;
        }

        echo "Delete OK\n";

        echo "SavedFiltersTest completed.\n";
    }
}

SavedFiltersTest::run();
