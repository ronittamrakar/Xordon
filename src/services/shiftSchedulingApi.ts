import { api } from '@/lib/api';

export interface Shift {
    id: number;
    workspace_id: number;
    user_id: number;
    shift_type_id?: number;
    shift_date: string;
    start_time: string;
    end_time: string;
    break_duration_minutes: number;
    location?: string;
    notes?: string;
    status: string;
    created_by?: number;
    created_at: string;
    updated_at: string;
    user_name?: string;
    shift_type_name?: string;
    shift_type_color?: string;
}

export interface ShiftType {
    id: number;
    workspace_id: number;
    name: string;
    description?: string;
    color: string;
    default_start_time?: string;
    default_end_time?: string;
    default_break_minutes: number;
    created_at: string;
    updated_at: string;
}

export interface ShiftSwapRequest {
    id: number;
    workspace_id: number;
    original_shift_id: number;
    target_shift_id: number;
    reason?: string;
    status: string;
    responded_at?: string;
    responded_by?: number;
    rejection_reason?: string;
    created_at: string;
    updated_at: string;
    original_shift_date?: string;
    original_start_time?: string;
    original_end_time?: string;
    requester_name?: string;
    target_shift_date?: string;
    target_start_time?: string;
    target_end_time?: string;
    target_user_name?: string;
}

export interface EmployeeAvailability {
    id: number;
    workspace_id: number;
    user_id: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
    created_at: string;
    updated_at: string;
    user_name?: string;
}

export const shiftSchedulingApi = {
    // Shifts
    getShifts: async (params?: any): Promise<{ data: Shift[] }> => {
        const response = await api.get('/scheduling/shifts', { params }) as { data: Shift[] };
        return response;
    },

    createShift: async (data: Partial<Shift>): Promise<{ data: { id: number } }> => {
        const response = await api.post('/scheduling/shifts', data) as { data: { id: number } };
        return response;
    },

    updateShift: async (id: number, data: Partial<Shift>): Promise<{ success: boolean }> => {
        await api.put(`/scheduling/shifts/${id}`, data);
        return { success: true };
    },

    deleteShift: async (id: number): Promise<{ success: boolean }> => {
        await api.delete(`/scheduling/shifts/${id}`);
        return { success: true };
    },

    // Shift Types
    getShiftTypes: async (): Promise<{ data: ShiftType[] }> => {
        const response = await api.get('/scheduling/shift-types') as { data: ShiftType[] };
        return response;
    },

    createShiftType: async (data: Partial<ShiftType>): Promise<{ data: { id: number } }> => {
        const response = await api.post('/scheduling/shift-types', data) as { data: { id: number } };
        return response;
    },

    // Shift Swap Requests
    getShiftSwapRequests: async (params?: any): Promise<{ data: ShiftSwapRequest[] }> => {
        const response = await api.get('/scheduling/swap-requests', { params }) as { data: ShiftSwapRequest[] };
        return response;
    },

    createShiftSwapRequest: async (data: Partial<ShiftSwapRequest>): Promise<{ data: { id: number } }> => {
        const response = await api.post('/scheduling/swap-requests', data) as { data: { id: number } };
        return response;
    },

    respondToSwapRequest: async (id: number, data: { action: 'approve' | 'reject'; reason?: string }): Promise<{ success: boolean }> => {
        await api.post(`/scheduling/swap-requests/${id}/respond`, data);
        return { success: true };
    },

    // Availability
    getAvailability: async (params?: any): Promise<{ data: EmployeeAvailability[] }> => {
        const response = await api.get('/scheduling/availability', { params }) as { data: EmployeeAvailability[] };
        return response;
    },

    setAvailability: async (data: Partial<EmployeeAvailability>): Promise<{ success: boolean }> => {
        await api.post('/scheduling/availability', data);
        return { success: true };
    },

    // Conflict Detection
    validateShift: async (data: Partial<Shift>): Promise<{ has_conflicts: boolean, conflicts: any[], can_override: boolean }> => {
        const response = await api.post('/scheduling/shifts/validate', data) as { data: { has_conflicts: boolean, conflicts: any[], can_override: boolean } };
        return response.data;
    },

    getConflicts: async (): Promise<any[]> => {
        const response = await api.get('/scheduling/conflicts') as { data: any[] };
        return response.data;
    },

    // Analytics
    getAnalytics: async (params?: any): Promise<{ data: any }> => {
        const response = await api.get('/scheduling/analytics', { params }) as { data: any };
        return response;
    },
};
