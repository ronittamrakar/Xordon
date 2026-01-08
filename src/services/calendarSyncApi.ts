/**
 * Calendar Sync API
 * Two-way sync with Google Calendar, Outlook/Office 365, and iCal
 */

import { api } from '@/lib/api';

// ============================================
// TYPES
// ============================================

export type CalendarProvider = 'google' | 'outlook' | 'apple' | 'ical';

export interface CalendarConnection {
    id: string;
    workspace_id: string;
    user_id: string;
    provider: CalendarProvider;
    email: string;
    calendar_id: string;
    calendar_name: string;
    sync_enabled: boolean;
    sync_direction: 'one_way_to_local' | 'one_way_to_external' | 'two_way';
    last_synced_at?: string;
    sync_status: 'active' | 'paused' | 'error';
    error_message?: string;
    access_token_expires_at?: string;
    settings: CalendarSyncSettings;
    created_at: string;
    updated_at: string;
}

export interface CalendarSyncSettings {
    // What to sync
    sync_appointments: boolean;
    sync_blocks: boolean; // availability blocks
    sync_reminders: boolean;

    // Direction settings
    import_events: boolean; // import from external to local
    export_events: boolean; // export from local to external

    // Conflict resolution
    conflict_resolution: 'local_wins' | 'external_wins' | 'most_recent';

    // Privacy settings
    external_event_visibility: 'busy' | 'full_details';
    export_event_visibility: 'busy' | 'full_details';

    // Sync range
    sync_past_days: number;
    sync_future_days: number;

    // Categories to sync
    appointment_types_to_sync?: string[]; // null = all
    calendars_to_sync?: string[]; // for internal calendars
}

export interface ExternalCalendarEvent {
    id: string;
    external_id: string;
    provider: CalendarProvider;
    title: string;
    description?: string;
    start: string;
    end: string;
    all_day: boolean;
    location?: string;
    status: 'confirmed' | 'tentative' | 'cancelled';
    visibility: 'public' | 'private';
    attendees?: {
        email: string;
        name?: string;
        response_status: 'accepted' | 'declined' | 'tentative' | 'needsAction';
    }[];
    recurrence?: string;
    synced_appointment_id?: string;
}

export interface SyncResult {
    success: boolean;
    events_imported: number;
    events_exported: number;
    events_updated: number;
    conflicts_resolved: number;
    errors: string[];
    synced_at: string;
}

export interface CalendarList {
    calendars: {
        id: string;
        name: string;
        primary: boolean;
        access_role: 'owner' | 'writer' | 'reader';
        color?: string;
    }[];
}

export interface AvailabilityBlock {
    id: string;
    source: 'local' | 'external';
    external_connection_id?: string;
    start: string;
    end: string;
    title?: string;
    all_day: boolean;
}

// ============================================
// OAUTH & CONNECTION
// ============================================

/**
 * Get OAuth URL for connecting a calendar provider
 */
export async function getOAuthUrl(
    provider: CalendarProvider,
    redirectUrl?: string
): Promise<{ url: string; state: string }> {
    const response = await api.post('/calendar-sync/oauth/url', {
        provider,
        redirect_url: redirectUrl,
    });
    return response;
}

/**
 * Complete OAuth flow with authorization code
 */
export async function completeOAuth(
    provider: CalendarProvider,
    code: string,
    state: string
): Promise<CalendarConnection> {
    const response = await api.post('/calendar-sync/oauth/callback', {
        provider,
        code,
        state,
    });
    return response;
}

/**
 * Connect an iCal URL (no OAuth required)
 */
export async function connectICalUrl(
    icalUrl: string,
    name: string
): Promise<CalendarConnection> {
    const response = await api.post('/calendar-sync/ical/connect', {
        url: icalUrl,
        name,
    });
    return response;
}

/**
 * List all calendar connections for the current user
 */
export async function listConnections(): Promise<CalendarConnection[]> {
    const response = await api.get('/calendar-sync/connections');
    return response;
}

/**
 * Get a specific calendar connection
 */
export async function getConnection(id: string): Promise<CalendarConnection> {
    const response = await api.get(`/calendar-sync/connections/${id}`);
    return response;
}

/**
 * Update calendar connection settings
 */
export async function updateConnection(
    id: string,
    data: Partial<CalendarSyncSettings & { sync_enabled?: boolean; calendar_id?: string }>
): Promise<CalendarConnection> {
    const response = await api.put(`/calendar-sync/connections/${id}`, data);
    return response;
}

/**
 * Delete/disconnect a calendar connection
 */
export async function deleteConnection(id: string): Promise<void> {
    await api.delete(`/calendar-sync/connections/${id}`);
}

/**
 * Refresh OAuth tokens for a connection
 */
export async function refreshConnection(id: string): Promise<CalendarConnection> {
    const response = await api.post(`/calendar-sync/connections/${id}/refresh`);
    return response;
}

// ============================================
// CALENDAR DISCOVERY
// ============================================

/**
 * List available calendars from connected account
 */
export async function listExternalCalendars(
    connectionId: string
): Promise<CalendarList> {
    const response = await api.get(`/calendar-sync/connections/${connectionId}/calendars`);
    return response;
}

/**
 * Set which calendar to sync with
 */
export async function selectCalendar(
    connectionId: string,
    calendarId: string
): Promise<CalendarConnection> {
    const response = await api.put(`/calendar-sync/connections/${connectionId}/calendar`, {
        calendar_id: calendarId,
    });
    return response;
}

// ============================================
// SYNC OPERATIONS
// ============================================

/**
 * Trigger an immediate sync for a connection
 */
export async function triggerSync(connectionId: string): Promise<SyncResult> {
    const response = await api.post(`/calendar-sync/connections/${connectionId}/sync`);
    return response;
}

/**
 * Trigger sync for all connections
 */
export async function triggerSyncAll(): Promise<{
    results: { connection_id: string; result: SyncResult }[];
}> {
    const response = await api.post('/calendar-sync/sync-all');
    return response;
}

/**
 * Get sync history for a connection
 */
export async function getSyncHistory(
    connectionId: string,
    params?: { limit?: number }
): Promise<SyncResult[]> {
    const response = await api.get(`/calendar-sync/connections/${connectionId}/history`, {
        params,
    });
    return response;
}

// ============================================
// EXTERNAL EVENTS
// ============================================

/**
 * Get external events for a connection within a date range
 */
export async function getExternalEvents(
    connectionId: string,
    params: { start: string; end: string }
): Promise<ExternalCalendarEvent[]> {
    const response = await api.get(`/calendar-sync/connections/${connectionId}/events`, {
        params,
    });
    return response;
}

/**
 * Get all external events across all connections
 */
export async function getAllExternalEvents(
    params: { start: string; end: string }
): Promise<ExternalCalendarEvent[]> {
    const response = await api.get('/calendar-sync/external-events', { params });
    return response;
}

// ============================================
// AVAILABILITY
// ============================================

/**
 * Get combined availability blocks from all connected calendars
 */
export async function getAvailabilityBlocks(
    params: { start: string; end: string; user_id?: string }
): Promise<AvailabilityBlock[]> {
    const response = await api.get('/calendar-sync/availability-blocks', { params });
    return response;
}

/**
 * Check if a time slot conflicts with external calendars
 */
export async function checkConflicts(
    params: { start: string; end: string; user_id?: string }
): Promise<{
    has_conflicts: boolean;
    conflicts: AvailabilityBlock[];
}> {
    const response = await api.get('/calendar-sync/check-conflicts', { params });
    return response;
}

/**
 * Get available time slots considering external calendars
 */
export async function getAvailableSlots(params: {
    date: string;
    duration_minutes: number;
    user_id?: string;
    calendar_id?: string;
    working_hours?: { start: string; end: string };
}): Promise<{ start: string; end: string }[]> {
    const response = await api.get('/calendar-sync/available-slots', { params });
    return response;
}

// ============================================
// PUSH TO EXTERNAL
// ============================================

/**
 * Export a local appointment to connected calendars
 */
export async function exportAppointment(
    appointmentId: string,
    connectionIds?: string[]
): Promise<{
    success: boolean;
    exported_to: { connection_id: string; external_event_id: string }[];
}> {
    const response = await api.post('/calendar-sync/export-appointment', {
        appointment_id: appointmentId,
        connection_ids: connectionIds,
    });
    return response;
}

/**
 * Delete an exported appointment from external calendars
 */
export async function removeExportedAppointment(
    appointmentId: string
): Promise<{ success: boolean; removed_from: string[] }> {
    const response = await api.delete(`/calendar-sync/exported/${appointmentId}`);
    return response;
}

// ============================================
// SETTINGS
// ============================================

export interface CalendarSyncGlobalSettings {
    auto_sync_interval_minutes: number;
    default_sync_direction: 'one_way_to_local' | 'one_way_to_external' | 'two_way';
    default_conflict_resolution: 'local_wins' | 'external_wins' | 'most_recent';
    block_appointments_on_external_events: boolean;
    show_external_events_in_calendar: boolean;
    sync_past_days: number;
    sync_future_days: number;
}

/**
 * Get global calendar sync settings
 */
export async function getGlobalSettings(): Promise<CalendarSyncGlobalSettings> {
    const response = await api.get('/calendar-sync/settings');
    return response;
}

/**
 * Update global calendar sync settings
 */
export async function updateGlobalSettings(
    settings: Partial<CalendarSyncGlobalSettings>
): Promise<CalendarSyncGlobalSettings> {
    const response = await api.put('/calendar-sync/settings', settings);
    return response;
}

export default {
    // OAuth & Connection
    getOAuthUrl,
    completeOAuth,
    connectICalUrl,
    listConnections,
    getConnection,
    updateConnection,
    deleteConnection,
    refreshConnection,

    // Calendar Discovery
    listExternalCalendars,
    selectCalendar,

    // Sync Operations
    triggerSync,
    triggerSyncAll,
    getSyncHistory,

    // External Events
    getExternalEvents,
    getAllExternalEvents,

    // Availability
    getAvailabilityBlocks,
    checkConflicts,
    getAvailableSlots,

    // Export
    exportAppointment,
    removeExportedAppointment,

    // Settings
    getGlobalSettings,
    updateGlobalSettings,
};
