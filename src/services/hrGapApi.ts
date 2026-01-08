import { api } from '@/lib/api';

export interface EmployeeProfile {
    id: number;
    user_id: number;
    workspace_id: number;
    job_title: string | null;
    department: string | null;
    reports_to: number | null;
    hire_date: string | null;
    employment_type: 'full_time' | 'part_time' | 'contract' | 'intern';
    work_location: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    emergency_contact_relation: string | null;
    skills: string[] | string | null;
    certifications: string[] | string | null;
    notes: string | null;
    updated_at: string;
}

export interface EmployeeSummary {
    user_id: number;
    total_hours_worked: number;
    leave_balance_annual: number;
    leave_balance_sick: number;
    leave_balance_personal: number;
    upcoming_shifts_count: number;
    pending_leave_requests: number;
    last_clock_in: string | null;
    last_clock_out: string | null;
    current_status: 'working' | 'on_leave' | 'off_duty' | 'on_break';
}

export interface RecruitmentJob {
    id: number;
    title: string;
    department: string;
    location: string | null;
    employment_type: string;
    status: 'draft' | 'published' | 'closed' | 'archived';
    application_count: number;
    new_applications: number;
    created_at: string;
}

export interface Candidate {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    application_count: number;
}

export interface Shift {
    id: number;
    user_id: number;
    user_name: string;
    shift_date: string;
    start_time: string;
    end_time: string;
    status: 'scheduled' | 'confirmed' | 'clocked_in' | 'completed' | 'cancelled';
    shift_type_name: string | null;
    shift_type_color: string | null;
}

export const hrGapApi = {
    // Employee Profile
    getEmployeeProfile: async (userId: string | number) => {
        const response = await api.get(`/hr/employees/${userId}/profile`);
        return response.data.data;
    },
    updateEmployeeProfile: async (userId: string | number, data: Partial<EmployeeProfile>) => {
        const response = await api.patch(`/hr/employees/${userId}/profile`, data);
        return response.data;
    },
    getEmployeeStats: async (userId: string | number) => {
        const [time, shifts, leave, payroll] = await Promise.all([
            api.get(`/hr/employees/${userId}/time-entries`),
            api.get(`/hr/employees/${userId}/shifts`),
            api.get(`/hr/employees/${userId}/leave`),
            api.get(`/hr/employees/${userId}/payroll`)
        ]);
        return {
            time: time.data.data,
            shifts: shifts.data.data,
            leave: leave.data.data,
            payroll: payroll.data.data
        };
    },

    // Scheduling
    getShifts: async (params?: { start_date?: string, end_date?: string, user_id?: number }) => {
        const response = await api.get('/hr/scheduling/shifts', { params });
        return response.data.data as Shift[];
    },
    createShift: async (data: any) => {
        const response = await api.post('/hr/scheduling/shifts', data);
        return response.data.data;
    },
    getConflicts: async () => {
        const response = await api.get('/hr/scheduling/conflicts');
        return response.data.data;
    },
    getAvailability: async (userId?: number) => {
        const response = await api.get('/hr/scheduling/availability', { params: { user_id: userId } });
        return response.data.data;
    },

    // Recruitment
    getJobs: async (params?: { status?: string, department?: string }) => {
        const response = await api.get('/hr/recruitment/jobs', { params });
        return response.data.data as RecruitmentJob[];
    },
    getApplications: async (jobId?: number) => {
        const response = await api.get('/hr/recruitment/applications', { params: { job_id: jobId } });
        return response.data.data;
    },
    getCandidates: async (search?: string) => {
        const response = await api.get('/hr/recruitment/candidates', { params: { search } });
        return response.data.data as Candidate[];
    },
    convertToEmployee: async (candidateId: number, data: { email: string, job_title?: string }) => {
        const response = await api.post(`/hr/recruitment/convert/${candidateId}`, data);
        return response.data;
    },
    getRecruitmentAnalytics: async () => {
        const response = await api.get('/hr/recruitment/analytics');
        return response.data.data;
    }
};
