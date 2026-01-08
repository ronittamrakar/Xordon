import { api } from '@/lib/api';

export interface CoreValue {
    id: number;
    title: string;
    description: string;
    icon: string;
    color_class: string;
}

export interface Recognition {
    id: number;
    from_user_id: number;
    from_user_name: string;
    to_user_id: number;
    to_user_name: string;
    core_value_id: number;
    core_value_title: string;
    message: string;
    created_at: string;
    likes_count: number;
    is_liked_by_me: boolean;
}

export interface CultureStats {
    culture_score: number;
    score_trend: number;
    participation_rate: number;
    active_champions: number;
}

export interface CultureChampion {
    user_id: number;
    name: string;
    role: string;
    avatar_url: string | null;
    kudos_count: number;
    rank: number;
}

export interface Survey {
    id: number;
    title: string;
    description: string;
    status: 'draft' | 'active' | 'completed' | 'archived';
    response_count: number;
    total_recipients: number;
    deadline: string | null;
    created_at: string;
}

export interface SurveyTrend {
    period: string;
    engagement_score: number;
    satisfaction_score: number;
    alignment_score: number;
}

export interface Event {
    id: number;
    title: string;
    description: string;
    start_time: string;
    end_time: string | null;
    location: string | null;
    event_type: 'in_person' | 'virtual' | 'hybrid';
    meeting_link: string | null;
    organizer_id: number;
    organizer_name: string;
    attendee_count: number;
    capacity: number | null;
    is_attending: boolean;
    status: 'upcoming' | 'cancelled' | 'completed';
}

export const cultureApi = {
    // Dashboard
    getStats: async () => {
        const response = await api.get('/culture/stats');
        return response.data.data as CultureStats;
    },
    getCoreValues: async () => {
        const response = await api.get('/culture/values');
        return response.data.data as CoreValue[];
    },
    getRecentKudos: async (limit = 10) => {
        const response = await api.get('/culture/kudos', { params: { limit } });
        return response.data.data as Recognition[];
    },
    giveKudos: async (data: { to_user_id: number, core_value_id: number, message: string }) => {
        const response = await api.post('/culture/kudos', data);
        return response.data.data;
    },
    likeKudos: async (kudosId: number) => {
        const response = await api.post(`/culture/kudos/${kudosId}/like`);
        return response.data;
    },
    getChampions: async () => {
        const response = await api.get('/culture/champions');
        return response.data.data as CultureChampion[];
    },

    // Surveys
    getSurveys: async (status?: string) => {
        const response = await api.get('/culture/surveys', { params: { status } });
        return response.data.data as Survey[];
    },
    getSurveyTrends: async () => {
        const response = await api.get('/culture/surveys/trends');
        return response.data.data as SurveyTrend[];
    },
    createSurvey: async (data: any) => {
        const response = await api.post('/culture/surveys', data);
        return response.data.data;
    },

    // Events
    getEvents: async (params?: { status?: string, type?: string }) => {
        const response = await api.get('/culture/events', { params });
        return response.data.data as Event[];
    },
    createEvent: async (data: any) => {
        const response = await api.post('/culture/events', data);
        return response.data.data;
    },
    rsvpEvent: async (eventId: number, status: 'attending' | 'not_attending') => {
        const response = await api.post(`/culture/events/${eventId}/rsvp`, { status });
        return response.data;
    }
};
