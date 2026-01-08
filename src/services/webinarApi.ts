export interface Webinar {
    id: string;
    title: string;
    description?: string;
    thumbnail?: string;
    scheduled_at?: string;
    duration_minutes: number;
    status: 'draft' | 'scheduled' | 'live' | 'ended';
    stream_key?: string;
    stream_url?: string;
    recording_url?: string;
    is_evergreen: boolean;
    max_registrants?: number;
    created_at: string;
}

export interface Registrar {
    id: string;
    contact_id: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    email: string;
    attendance_status: 'registered' | 'attended' | 'no_show';
    joined_at?: string;
    left_at?: string;
}

export const webinarApi = {
    list: async (): Promise<Webinar[]> => {
        const response = await fetch('/api/marketing/webinars', {
            headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
        });
        return response.json();
    },
    get: async (id: string): Promise<Webinar> => {
        const response = await fetch(`/api/marketing/webinars/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
        });
        return response.json();
    },
    create: async (data: Partial<Webinar>): Promise<{ id: string }> => {
        const response = await fetch('/api/marketing/webinars', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },
    update: async (id: string, data: Partial<Webinar>): Promise<{ success: boolean }> => {
        const response = await fetch(`/api/marketing/webinars/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },
    delete: async (id: string): Promise<{ success: boolean }> => {
        const response = await fetch(`/api/marketing/webinars/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
        });
        return response.json();
    },
    listRegistrants: async (id: string): Promise<Registrar[]> => {
        const response = await fetch(`/api/marketing/webinars/${id}/registrants`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
        });
        return response.json();
    },
    removeRegistrant: async (webinarId: string, registrantId: string): Promise<{ success: boolean }> => {
        const response = await fetch(`/api/marketing/webinars/${webinarId}/registrants/${registrantId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
        });
        return response.json();
    },
    sendInvite: async (webinarId: string, data: { contact_ids: string[]; channels: ('email' | 'sms')[] }): Promise<{ success: boolean; sent_count: number }> => {
        const response = await fetch(`/api/marketing/webinars/${webinarId}/invite`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify(data)
        });
        return response.json();
    }
};
