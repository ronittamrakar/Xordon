import api from '../lib/api';

export interface VideoConnection {
    id: number;
    provider: 'zoom' | 'google_meet' | 'microsoft_teams';
    provider_email: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export const videoProvidersApi = {
    /**
     * Get list of connected video providers
     */
    async getConnections(): Promise<VideoConnection[]> {
        const response = await api.get('/video/connections');
        return (response.data as any)?.connections || [];
    },

    /**
     * Get OAuth URL for connecting a provider
     */
    async getAuthUrl(provider: 'zoom' | 'google_meet' | 'microsoft_teams'): Promise<{ auth_url: string; provider: string }> {
        const response = await api.post('/video/auth-url', { provider });
        return (response.data as any) || { auth_url: '', provider: '' };
    },

    /**
     * Disconnect a video provider
     */
    async disconnect(connectionId: number): Promise<void> {
        await api.delete(`/video/connections/${connectionId}`);
    },

    /**
     * Create video meeting for an appointment
     */
    async createMeeting(appointmentId: number, provider: string, meetingData?: any): Promise<any> {
        const response = await api.post('/video/meetings', {
            appointment_id: appointmentId,
            provider,
            meeting_data: meetingData || {}
        });
        return (response.data as any)?.meeting;
    },

    /**
     * Delete video meeting
     */
    async deleteMeeting(appointmentId: number): Promise<void> {
        await api.delete(`/video/meetings/${appointmentId}`);
    },

    /**
     * Get video meeting details
     */
    async getMeetingDetails(appointmentId: number): Promise<any> {
        const response = await api.get(`/video/meetings/${appointmentId}`);
        return response.data;
    }
};

export default videoProvidersApi;
