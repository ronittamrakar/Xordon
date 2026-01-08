import api from '@/lib/api';

// ============================================
// GPS LOCATION TRACKING
// ============================================

export interface GpsLocation {
    id: number;
    user_id: number;
    workspace_id: number;
    latitude: number;
    longitude: number;
    accuracy: number | null;
    altitude: number | null;
    speed: number | null;
    heading: number | null;
    recorded_at: string;
    source: 'mobile' | 'web' | 'device';
    created_at: string;
}

export interface TechnicianStatus {
    id: number;
    user_id: number;
    workspace_id: number;
    current_status: 'available' | 'busy' | 'on_break' | 'offline' | 'en_route';
    current_job_id: number | null;
    current_lat: number | null;
    current_lng: number | null;
    last_location_update: string | null;
    estimated_available_at: string | null;
    user_name?: string;
    user_email?: string;
    current_job_customer?: string;
    updated_at: string;
}

export interface DispatchJob {
    id: number;
    workspace_id: number;
    company_id: number | null;
    job_id: number | null;
    appointment_id: number | null;
    assigned_technician_id: number | null;
    status: 'pending' | 'dispatched' | 'en_route' | 'on_site' | 'completed' | 'cancelled';
    priority: 'low' | 'normal' | 'high' | 'emergency';
    scheduled_start: string | null;
    scheduled_end: string | null;
    actual_start: string | null;
    actual_end: string | null;
    customer_name: string | null;
    customer_phone: string | null;
    service_address: string | null;
    service_lat: number | null;
    service_lng: number | null;
    notes: string | null;
    technician_name?: string;
    created_at: string;
    updated_at: string;
}

export interface ServiceZone {
    id: number;
    workspace_id: number;
    name: string;
    description: string | null;
    zone_type: 'polygon' | 'radius' | 'zip_codes';
    zone_data: any;
    color: string;
    assigned_team_id: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface FieldServiceAnalytics {
    jobs: {
        total_jobs: number;
        pending_jobs: number;
        dispatched_jobs: number;
        en_route_jobs: number;
        on_site_jobs: number;
        completed_jobs: number;
        avg_duration_minutes: number | null;
    };
    technicians: {
        total_technicians: number;
        available: number;
        busy: number;
        en_route: number;
        offline: number;
    };
}

export const fieldServiceApi = {
    // GPS Location
    recordLocation: async (data: {
        latitude: number;
        longitude: number;
        accuracy?: number;
        altitude?: number;
        speed?: number;
        heading?: number;
        source?: 'mobile' | 'web' | 'device';
    }) => {
        await api.post('/field-service/location', data);
    },

    getLocationHistory: async (params: {
        user_id?: number;
        start_date?: string;
        end_date?: string;
    }) => {
        const res = await api.get<{ items: GpsLocation[] }>('/field-service/locations', { params });
        return res.data.items;
    },

    // Technicians
    getTechnicians: async () => {
        const res = await api.get<{ items: TechnicianStatus[] }>('/field-service/technicians');
        return res.data.items;
    },

    updateTechnicianStatus: async (userId: number, status: TechnicianStatus['current_status']) => {
        const res = await api.put(`/field-service/technicians/${userId}/status`, { status });
        return res.data;
    },

    // Dispatch Jobs
    getJobs: async (params?: {
        status?: DispatchJob['status'];
        technician_id?: number;
        date?: string;
    }) => {
        const res = await api.get<{ items: DispatchJob[] }>('/field-service/jobs', { params });
        return res.data.items;
    },

    createJob: async (data: Partial<DispatchJob>) => {
        const res = await api.post<DispatchJob>('/field-service/jobs', data);
        return res.data;
    },

    updateJob: async (jobId: number, data: Partial<DispatchJob>) => {
        const res = await api.put<DispatchJob>(`/field-service/jobs/${jobId}`, data);
        return res.data;
    },

    dispatchJob: async (jobId: number, technicianId: number) => {
        const res = await api.post<DispatchJob>(`/field-service/jobs/${jobId}/dispatch`, { technician_id: technicianId });
        return res.data;
    },

    // Service Zones
    getZones: async () => {
        const res = await api.get<{ items: ServiceZone[] }>('/field-service/zones');
        return res.data.items;
    },

    createZone: async (data: Partial<ServiceZone>) => {
        const res = await api.post<ServiceZone>('/field-service/zones', data);
        return res.data;
    },

    updateZone: async (zoneId: number, data: Partial<ServiceZone>) => {
        const res = await api.put<ServiceZone>(`/field-service/zones/${zoneId}`, data);
        return res.data;
    },

    deleteZone: async (zoneId: number) => {
        await api.delete(`/field-service/zones/${zoneId}`);
    },

    // Analytics
    getAnalytics: async () => {
        const res = await api.get<FieldServiceAnalytics>('/field-service/analytics');
        return res.data;
    },
};

// ============================================
// HELPER: Start GPS Tracking
// ============================================

let watchId: number | null = null;

export const gpsTracking = {
    start: (onError?: (error: GeolocationPositionError) => void) => {
        if (!navigator.geolocation) {
            console.error('Geolocation is not supported');
            return;
        }

        watchId = navigator.geolocation.watchPosition(
            async (position) => {
                try {
                    await fieldServiceApi.recordLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        altitude: position.coords.altitude ?? undefined,
                        speed: position.coords.speed ?? undefined,
                        heading: position.coords.heading ?? undefined,
                        source: 'web',
                    });
                } catch (error) {
                    console.error('Failed to record location:', error);
                }
            },
            onError,
            {
                enableHighAccuracy: true,
                maximumAge: 30000,
                timeout: 27000,
            }
        );
    },

    stop: () => {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }
    },

    isTracking: () => watchId !== null,
};
