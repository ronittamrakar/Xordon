/**
 * GPS Tracking API
 * Real-time tracking for field technicians and vehicles
 */

import { api } from '@/lib/api';

// ============================================
// TYPES
// ============================================

export interface Location {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    speed?: number;
    heading?: number;
    timestamp: string;
}

export interface TrackedEntity {
    id: string;
    workspace_id: string;
    type: 'user' | 'vehicle' | 'equipment';
    name: string;
    user_id?: string;
    vehicle_id?: string;
    equipment_id?: string;
    status: 'active' | 'inactive' | 'offline';
    current_location?: Location;
    last_seen_at?: string;
    tracking_enabled: boolean;
    battery_level?: number;
    settings: TrackingSettings;
    created_at: string;
}

export interface TrackingSettings {
    update_interval_seconds: number;
    accuracy_mode: 'high' | 'balanced' | 'low_power';
    geo_fence_enabled: boolean;
    geo_fences?: GeoFence[];
    offline_tracking: boolean;
    share_location_with_customers: boolean;
}

export interface GeoFence {
    id: string;
    name: string;
    type: 'circle' | 'polygon';
    center?: { latitude: number; longitude: number };
    radius_meters?: number;
    polygon_points?: { latitude: number; longitude: number }[];
    trigger_on: 'enter' | 'exit' | 'both';
    notification_enabled: boolean;
}

export interface LocationHistory {
    entity_id: string;
    locations: Location[];
    distance_traveled_km: number;
    duration_minutes: number;
}

export interface TechnicianETA {
    technician_id: string;
    technician_name: string;
    current_location: Location;
    destination: { latitude: number; longitude: number };
    estimated_arrival: string;
    distance_remaining_km: number;
    duration_remaining_minutes: number;
    route_polyline?: string;
    traffic_conditions: 'light' | 'moderate' | 'heavy';
}

export interface CustomerNotification {
    id: string;
    job_id: string;
    contact_id: string;
    type: 'en_route' | 'arriving_soon' | 'arrived' | 'delayed';
    sent_via: 'sms' | 'email' | 'push';
    sent_at: string;
    eta?: string;
    message?: string;
}

export interface DailyRoute {
    id: string;
    date: string;
    technician_id: string;
    technician_name: string;
    jobs: {
        job_id: string;
        address: string;
        scheduled_time: string;
        estimated_arrival: string;
        status: 'pending' | 'en_route' | 'arrived' | 'completed';
        order: number;
    }[];
    total_distance_km: number;
    total_duration_minutes: number;
    optimized: boolean;
}

// ============================================
// TRACKED ENTITIES
// ============================================

/**
 * List all tracked entities
 */
export async function listTrackedEntities(params?: {
    type?: 'user' | 'vehicle' | 'equipment';
    status?: 'active' | 'inactive' | 'offline';
}): Promise<TrackedEntity[]> {
    const response = await api.get('/gps/entities', { params });
    return response;
}

/**
 * Get a tracked entity
 */
export async function getTrackedEntity(id: string): Promise<TrackedEntity> {
    const response = await api.get(`/gps/entities/${id}`);
    return response;
}

/**
 * Enable tracking for a user
 */
export async function enableUserTracking(
    userId: string,
    settings?: Partial<TrackingSettings>
): Promise<TrackedEntity> {
    const response = await api.post('/gps/entities/user', {
        user_id: userId,
        settings,
    });
    return response;
}

/**
 * Enable tracking for a vehicle
 */
export async function enableVehicleTracking(
    vehicleId: string,
    name: string,
    settings?: Partial<TrackingSettings>
): Promise<TrackedEntity> {
    const response = await api.post('/gps/entities/vehicle', {
        vehicle_id: vehicleId,
        name,
        settings,
    });
    return response;
}

/**
 * Update tracking settings
 */
export async function updateTrackingSettings(
    entityId: string,
    settings: Partial<TrackingSettings>
): Promise<TrackedEntity> {
    const response = await api.put(`/gps/entities/${entityId}/settings`, settings);
    return response;
}

/**
 * Disable tracking for an entity
 */
export async function disableTracking(entityId: string): Promise<void> {
    await api.delete(`/gps/entities/${entityId}`);
}

// ============================================
// LOCATION UPDATES
// ============================================

/**
 * Update location for an entity
 */
export async function updateLocation(
    entityId: string,
    location: Omit<Location, 'timestamp'>
): Promise<void> {
    await api.post(`/gps/entities/${entityId}/location`, location);
}

/**
 * Batch update locations (for offline sync)
 */
export async function batchUpdateLocations(
    entityId: string,
    locations: Location[]
): Promise<{ synced: number }> {
    const response = await api.post(`/gps/entities/${entityId}/locations/batch`, {
        locations,
    });
    return response;
}

/**
 * Get current location of an entity
 */
export async function getCurrentLocation(entityId: string): Promise<Location> {
    const response = await api.get(`/gps/entities/${entityId}/location`);
    return response;
}

/**
 * Get all technician locations (for dispatcher view)
 */
export async function getAllTechnicianLocations(): Promise<
    { entity_id: string; user_id: string; name: string; location: Location; status: string }[]
> {
    const response = await api.get('/gps/technicians/locations');
    return response;
}

// ============================================
// LOCATION HISTORY
// ============================================

/**
 * Get location history for an entity
 */
export async function getLocationHistory(
    entityId: string,
    params: { start: string; end: string }
): Promise<LocationHistory> {
    const response = await api.get(`/gps/entities/${entityId}/history`, { params });
    return response;
}

/**
 * Get route playback data
 */
export async function getRoutePlayback(
    entityId: string,
    params: { start: string; end: string; interval_seconds?: number }
): Promise<Location[]> {
    const response = await api.get(`/gps/entities/${entityId}/playback`, { params });
    return response;
}

// ============================================
// ETA & CUSTOMER NOTIFICATIONS
// ============================================

/**
 * Calculate ETA for a technician to a job
 */
export async function calculateETA(
    technicianId: string,
    destination: { latitude: number; longitude: number } | { address: string }
): Promise<TechnicianETA> {
    const response = await api.post('/gps/eta/calculate', {
        technician_id: technicianId,
        destination,
    });
    return response;
}

/**
 * Get ETA for a job
 */
export async function getJobETA(jobId: string): Promise<TechnicianETA | null> {
    const response = await api.get(`/gps/jobs/${jobId}/eta`);
    return response;
}

/**
 * Send "on my way" notification to customer
 */
export async function sendEnRouteNotification(
    jobId: string,
    options?: {
        via?: 'sms' | 'email' | 'both';
        custom_message?: string;
        include_tracking_link?: boolean;
    }
): Promise<CustomerNotification> {
    const response = await api.post(`/gps/jobs/${jobId}/notify/en-route`, options);
    return response;
}

/**
 * Send "arriving soon" notification
 */
export async function sendArrivingSoonNotification(
    jobId: string,
    minutesAway: number
): Promise<CustomerNotification> {
    const response = await api.post(`/gps/jobs/${jobId}/notify/arriving`, {
        minutes_away: minutesAway,
    });
    return response;
}

/**
 * Get customer tracking link for a job
 */
export async function getCustomerTrackingLink(jobId: string): Promise<{
    url: string;
    expires_at: string;
}> {
    const response = await api.get(`/gps/jobs/${jobId}/tracking-link`);
    return response;
}

/**
 * Get notification history for a job
 */
export async function getNotificationHistory(
    jobId: string
): Promise<CustomerNotification[]> {
    const response = await api.get(`/gps/jobs/${jobId}/notifications`);
    return response;
}

// ============================================
// ROUTE OPTIMIZATION
// ============================================

/**
 * Get daily route for a technician
 */
export async function getDailyRoute(
    technicianId: string,
    date: string
): Promise<DailyRoute> {
    const response = await api.get(`/gps/routes/daily/${technicianId}`, {
        params: { date },
    });
    return response;
}

/**
 * Optimize route for a technician's daily jobs
 */
export async function optimizeRoute(
    technicianId: string,
    date: string,
    options?: {
        start_location?: { latitude: number; longitude: number };
        end_location?: { latitude: number; longitude: number };
        avoid_highways?: boolean;
        priority_jobs?: string[]; // must visit first
    }
): Promise<DailyRoute> {
    const response = await api.post(`/gps/routes/optimize`, {
        technician_id: technicianId,
        date,
        ...options,
    });
    return response;
}

/**
 * Reorder jobs manually
 */
export async function reorderRoute(
    technicianId: string,
    date: string,
    jobOrder: string[]
): Promise<DailyRoute> {
    const response = await api.put(`/gps/routes/${technicianId}/order`, {
        date,
        job_order: jobOrder,
    });
    return response;
}

// ============================================
// GEO-FENCING
// ============================================

/**
 * Create a geo-fence
 */
export async function createGeoFence(
    entityId: string,
    fence: Omit<GeoFence, 'id'>
): Promise<GeoFence> {
    const response = await api.post(`/gps/entities/${entityId}/geofences`, fence);
    return response;
}

/**
 * List geo-fences for an entity
 */
export async function listGeoFences(entityId: string): Promise<GeoFence[]> {
    const response = await api.get(`/gps/entities/${entityId}/geofences`);
    return response;
}

/**
 * Delete a geo-fence
 */
export async function deleteGeoFence(
    entityId: string,
    fenceId: string
): Promise<void> {
    await api.delete(`/gps/entities/${entityId}/geofences/${fenceId}`);
}

/**
 * Get geo-fence alerts
 */
export async function getGeoFenceAlerts(params?: {
    entity_id?: string;
    fence_id?: string;
    type?: 'enter' | 'exit';
    date_from?: string;
    date_to?: string;
}): Promise<{
    id: string;
    entity_id: string;
    fence_id: string;
    fence_name: string;
    type: 'enter' | 'exit';
    location: Location;
    timestamp: string;
}[]> {
    const response = await api.get('/gps/geofence-alerts', { params });
    return response;
}

// ============================================
// ANALYTICS
// ============================================

/**
 * Get mileage report
 */
export async function getMileageReport(params: {
    entity_ids?: string[];
    date_from: string;
    date_to: string;
}): Promise<{
    entity_id: string;
    name: string;
    total_distance_km: number;
    trips: number;
    avg_trip_distance_km: number;
}[]> {
    const response = await api.get('/gps/reports/mileage', { params });
    return response;
}

/**
 * Get time on road report
 */
export async function getTimeOnRoadReport(params: {
    entity_ids?: string[];
    date_from: string;
    date_to: string;
}): Promise<{
    entity_id: string;
    name: string;
    total_hours: number;
    driving_hours: number;
    idle_hours: number;
    trips: number;
}[]> {
    const response = await api.get('/gps/reports/time-on-road', { params });
    return response;
}

// ============================================
// SETTINGS
// ============================================

export interface GPSSettings {
    enabled: boolean;
    default_update_interval_seconds: number;
    auto_send_en_route_notification: boolean;
    auto_send_arriving_notification: boolean;
    arriving_notification_minutes: number;
    customer_tracking_page_enabled: boolean;
    customer_tracking_page_branding: {
        logo_url?: string;
        primary_color?: string;
        message?: string;
    };
}

/**
 * Get GPS settings
 */
export async function getSettings(): Promise<GPSSettings> {
    const response = await api.get('/gps/settings');
    return response;
}

/**
 * Update GPS settings
 */
export async function updateSettings(
    settings: Partial<GPSSettings>
): Promise<GPSSettings> {
    const response = await api.put('/gps/settings', settings);
    return response;
}

export default {
    // Entities
    listTrackedEntities,
    getTrackedEntity,
    enableUserTracking,
    enableVehicleTracking,
    updateTrackingSettings,
    disableTracking,

    // Location Updates
    updateLocation,
    batchUpdateLocations,
    getCurrentLocation,
    getAllTechnicianLocations,

    // History
    getLocationHistory,
    getRoutePlayback,

    // ETA & Notifications
    calculateETA,
    getJobETA,
    sendEnRouteNotification,
    sendArrivingSoonNotification,
    getCustomerTrackingLink,
    getNotificationHistory,

    // Route Optimization
    getDailyRoute,
    optimizeRoute,
    reorderRoute,

    // Geo-fencing
    createGeoFence,
    listGeoFences,
    deleteGeoFence,
    getGeoFenceAlerts,

    // Analytics
    getMileageReport,
    getTimeOnRoadReport,

    // Settings
    getSettings,
    updateSettings,
};
