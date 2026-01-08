import { api } from '@/lib/api';

export interface JobOpening {
    id: number;
    workspace_id: number;
    title: string;
    department: string;
    location?: string;
    employment_type: string;
    experience_level: string;
    salary_min?: number;
    salary_max?: number;
    description?: string;
    requirements?: string;
    responsibilities?: string;
    benefits?: string;
    positions_available: number;
    status: string;
    created_by: number;
    application_deadline?: string;
    created_at: string;
    updated_at: string;
    application_count?: number;
    new_applications?: number;
}

export interface Candidate {
    id: number;
    workspace_id: number;
    first_name?: string;
    last_name?: string;
    email: string;
    phone?: string;
    linkedin_url?: string;
    portfolio_url?: string;
    current_company?: string;
    current_title?: string;
    years_of_experience?: number;
    skills?: string;
    education?: string;
    source: string;
    created_at: string;
    updated_at: string;
    application_count?: number;
}

export interface JobApplication {
    id: number;
    workspace_id: number;
    job_id: number;
    candidate_id: number;
    cover_letter?: string;
    resume_file_id?: number;
    current_stage: string;
    status: string;
    source: string;
    rating?: number;
    notes?: string;
    applied_at: string;
    updated_at: string;
    job_title?: string;
    department?: string;
    candidate_first_name?: string;
    candidate_last_name?: string;
    candidate_email?: string;
    candidate_phone?: string;
}

export interface Interview {
    id: number;
    workspace_id: number;
    application_id: number;
    interview_type: string;
    scheduled_at: string;
    duration_minutes: number;
    location?: string;
    meeting_link?: string;
    interviewer_id?: number;
    notes?: string;
    feedback?: string;
    rating?: number;
    recommendation?: string;
    status: string;
    created_at: string;
    updated_at: string;
    candidate_first_name?: string;
    candidate_last_name?: string;
    job_title?: string;
    interviewer_name?: string;
}

export const recruitmentApi = {
    // Job Openings
    getJobOpenings: async (params?: any): Promise<{ data: JobOpening[] }> => {
        const response = await api.get('/recruitment/jobs', { params }) as { data: JobOpening[] };
        return response;
    },

    createJobOpening: async (data: Partial<JobOpening>): Promise<{ data: { id: number } }> => {
        const response = await api.post('/recruitment/jobs', data) as { data: { id: number } };
        return response;
    },

    updateJobOpening: async (id: number, data: Partial<JobOpening>): Promise<{ success: boolean }> => {
        const response = await api.put(`/recruitment/jobs/${id}`, data) as { success: boolean };
        return response;
    },

    // Candidates
    getCandidates: async (params?: any): Promise<{ data: Candidate[] }> => {
        const response = await api.get('/recruitment/candidates', { params }) as { data: Candidate[] };
        return response;
    },

    createCandidate: async (data: Partial<Candidate>): Promise<{ data: { id: number } }> => {
        const response = await api.post('/recruitment/candidates', data) as { data: { id: number } };
        return response;
    },

    // Job Applications
    getJobApplications: async (params?: any): Promise<{ data: JobApplication[] }> => {
        const response = await api.get('/recruitment/applications', { params }) as { data: JobApplication[] };
        return response;
    },

    createJobApplication: async (data: Partial<JobApplication>): Promise<{ data: { id: number } }> => {
        const response = await api.post('/recruitment/applications', data) as { data: { id: number } };
        return response;
    },

    updateApplicationStage: async (id: number, data: { stage: string; status?: string; notes?: string }): Promise<{ success: boolean }> => {
        const response = await api.put(`/recruitment/applications/${id}/stage`, data) as { success: boolean };
        return response;
    },

    // Interviews
    getInterviews: async (params?: any): Promise<{ data: Interview[] }> => {
        const response = await api.get('/recruitment/interviews', { params }) as { data: Interview[] };
        return response;
    },

    scheduleInterview: async (data: Partial<Interview>): Promise<{ data: { id: number } }> => {
        const response = await api.post('/recruitment/interviews', data) as { data: { id: number } };
        return response;
    },

    updateInterview: async (id: number, data: Partial<Interview>): Promise<{ success: boolean }> => {
        const response = await api.put(`/recruitment/interviews/${id}`, data) as { success: boolean };
        return response;
    },

    // Analytics
    getAnalytics: async (): Promise<{ data: any }> => {
        const response = await api.get('/recruitment/analytics') as { data: any };
        return response;
    },

    // Hiring
    convertToEmployee: async (candidateId: number, data: {
        email: string;
        role_id?: number;
        job_title?: string;
        create_onboarding?: boolean;
        onboarding_template_id?: number;
    }): Promise<{ user_id: number; staff_id: number; is_new_user: boolean }> => {
        const response = await api.post(`/recruitment/candidates/${candidateId}/convert-to-employee`, data) as { data: { user_id: number; staff_id: number; is_new_user: boolean } };
        return response.data;
    }
};
