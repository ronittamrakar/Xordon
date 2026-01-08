<?php
// Make SignalWire connection global (works in all workspaces)
require_once __DIR__ . '/backend/src/Database.php';

$db = Database::conn();

echo "=== Making SignalWire Connection Global ===\n\n";

// Update all active SignalWire connections to be global
$stmt = $db->prepare("UPDATE connections SET workspace_id = NULL WHERE provider = 'signalwire' AND status = 'active'");
$stmt->execute();
$affected = $stmt->rowCount();

echo "✅ Updated $affected SignalWire connection(s) to be global (workspace_id = NULL)\n";
echo "\nThis connection will now work in ALL workspaces.\n";
echo "\nPlease try searching for phone numbers again!\n";
