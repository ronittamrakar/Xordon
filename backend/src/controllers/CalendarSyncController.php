<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../TenantContext.php';
require_once __DIR__ . '/../services/CalendarSyncService.php';

class CalendarSyncController {
    
    private static function getContext() {
        return $GLOBALS['tenantContext'] ?? TenantContext::resolveOrFail();
    }

    public static function getSettings() {
        $ctx = self::getContext();
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM calendar_sync_settings WHERE workspace_id = ?");
        $stmt->execute([$ctx->workspaceId]);
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$settings) {
            // Default settings
            return Response::json([
                'auto_sync_interval_minutes' => 30,
                'default_sync_direction' => 'two_way',
                'default_conflict_resolution' => 'most_recent',
                'block_appointments_on_external_events' => true,
                'show_external_events_in_calendar' => true,
                'sync_past_days' => 30,
                'sync_future_days' => 90
            ]);
        }
        
        // Convert numeric/boolean types
        return Response::json([
            'auto_sync_interval_minutes' => (int)$settings['auto_sync_interval_minutes'],
            'default_sync_direction' => $settings['default_sync_direction'],
            'default_conflict_resolution' => $settings['default_conflict_resolution'],
            'block_appointments_on_external_events' => (bool)$settings['block_appointments_on_external_events'],
            'show_external_events_in_calendar' => (bool)$settings['show_external_events_in_calendar'],
            'sync_past_days' => (int)$settings['sync_past_days'],
            'sync_future_days' => (int)$settings['sync_future_days']
        ]);
    }

    public static function updateSettings() {
        $ctx = self::getContext();
        $db = Database::conn();
        $data = get_json_body();
        
        $stmt = $db->prepare("
            INSERT INTO calendar_sync_settings 
            (workspace_id, auto_sync_interval_minutes, default_sync_direction, default_conflict_resolution, 
             block_appointments_on_external_events, show_external_events_in_calendar, sync_past_days, sync_future_days)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                auto_sync_interval_minutes = VALUES(auto_sync_interval_minutes),
                default_sync_direction = VALUES(default_sync_direction),
                default_conflict_resolution = VALUES(default_conflict_resolution),
                block_appointments_on_external_events = VALUES(block_appointments_on_external_events),
                show_external_events_in_calendar = VALUES(show_external_events_in_calendar),
                sync_past_days = VALUES(sync_past_days),
                sync_future_days = VALUES(sync_future_days)
        ");
        
        $stmt->execute([
            $ctx->workspaceId,
            $data['auto_sync_interval_minutes'] ?? 30,
            $data['default_sync_direction'] ?? 'two_way',
            $data['default_conflict_resolution'] ?? 'most_recent',
            isset($data['block_appointments_on_external_events']) ? (int)$data['block_appointments_on_external_events'] : 1,
            isset($data['show_external_events_in_calendar']) ? (int)$data['show_external_events_in_calendar'] : 1,
            $data['sync_past_days'] ?? 30,
            $data['sync_future_days'] ?? 90
        ]);
        
        return Response::json(['success' => true]);
    }

    public static function completeOAuth() {
        return Response::json(['success' => true]);
    }

    public static function getConnection($id) {
        $ctx = self::getContext();
        $db = Database::conn();
        $stmt = $db->prepare("SELECT * FROM calendar_connections WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $ctx->workspaceId]);
        $conn = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$conn) return Response::error('Connection not found', 404);
        
        $conn['sync_enabled'] = (bool)$conn['sync_enabled'];
        $conn['settings'] = json_decode($conn['settings'], true);
        
        return Response::json($conn);
    }

    public static function updateConnection($id) {
        $ctx = self::getContext();
        $db = Database::conn();
        $data = get_json_body();
        
        // Fetch current settings first
        $stmt = $db->prepare("SELECT settings FROM calendar_connections WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $ctx->workspaceId]);
        $current = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$current) return Response::error('Connection not found', 404);
        
        $settings = json_decode($current['settings'] ?: '{}', true);
        
        // Update connection-level flags
        if (isset($data['sync_enabled'])) {
            $stmt = $db->prepare("UPDATE calendar_connections SET sync_enabled = ? WHERE id = ?");
            $stmt->execute([(int)$data['sync_enabled'], $id]);
        }
        
        if (isset($data['sync_direction'])) {
            $stmt = $db->prepare("UPDATE calendar_connections SET sync_direction = ? WHERE id = ?");
            $stmt->execute([$data['sync_direction'], $id]);
        }

        // Update nested settings
        $settingsKeys = ['sync_appointments', 'sync_blocks', 'sync_reminders', 'external_event_visibility'];
        foreach ($settingsKeys as $key) {
            if (isset($data[$key])) {
                $settings[$key] = $data[$key];
            }
        }
        
        $stmt = $db->prepare("UPDATE calendar_connections SET settings = ? WHERE id = ?");
        $stmt->execute([json_encode($settings), $id]);
        
        return Response::json(['success' => true]);
    }

    public static function deleteConnection($id) {
        $ctx = self::getContext();
        $db = Database::conn();
        $stmt = $db->prepare("DELETE FROM calendar_connections WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $ctx->workspaceId]);
        return Response::json(['success' => true]);
    }

    public static function syncNow($id) {
        // This would call the actual sync service
        return Response::json(['success' => true, 'events_imported' => 0, 'events_exported' => 0]);
    }

    public static function syncAll() {
        return Response::json(['success' => true, 'total_imported' => 0, 'total_exported' => 0]);
    }


    public static function getExternalCalendars($id) {
        // Mocking for now, would normally call external API
        return Response::json(['calendars' => [
            ['id' => 'primary', 'name' => 'Primary Calendar', 'primary' => true],
            ['id' => 'work', 'name' => 'Work', 'primary' => false]
        ]]);
    }

    public static function selectCalendar($id) {
        $ctx = self::getContext();
        $db = Database::conn();
        $data = get_json_body();
        $stmt = $db->prepare("UPDATE calendar_connections SET calendar_id = ? WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$data['calendar_id'], $id, $ctx->workspaceId]);
        return Response::json(['success' => true]);
    }

    public static function getExternalEvents() {
        return Response::json([]);
    }

    public static function getAvailabilityBlocks() {
        return Response::json([]);
    }

    public static function checkConflicts() {
        return Response::json(['has_conflicts' => false, 'conflicts' => []]);
    }

    public static function getAvailableSlots() {
        return Response::json([]);
    }

    public static function exportAppointment() {
        return Response::json(['success' => true]);
    }

    public static function removeExported($appointmentId) {
        return Response::json(['success' => true]);
    }

    public static function listConnections() {
        $ctx = self::getContext();
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM calendar_connections WHERE workspace_id = ?");
        $stmt->execute([$ctx->workspaceId]);
        $connections = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($connections as &$conn) {
            $conn['sync_enabled'] = (bool)$conn['sync_enabled'];
            if ($conn['settings']) {
                $conn['settings'] = json_decode($conn['settings'], true);
            }
        }
        
        return Response::json($connections);
    }

    public static function getOAuthUrl() {
        $ctx = self::getContext();
        $body = get_json_body();
        $provider = $body['provider'] ?? 'google';
        
        // This should probably redirect to the actual provider's OAuth URL
        // Using CalendarSyncService if it's available and matches
        $url = "";
        if ($provider === 'google') {
            // Need a dummy calendar_id if it's not provided yet? 
            // Usually we connect an ACCOUNT first, then select calendars.
            // But the service requires a calendar_id.
            $url = CalendarSyncService::getGoogleAuthUrl($ctx->workspaceId, 0); 
        } else if ($provider === 'outlook') {
            $url = CalendarSyncService::getOutlookAuthUrl($ctx->workspaceId, 0);
        }
        
        return Response::json(['url' => $url, 'state' => 'random_state']);
    }

    // ... handle other methods ...
}
