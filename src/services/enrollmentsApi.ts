import api from '@/lib/api';

export interface Enrollment {
    id: number;
    course_id: number;
    user_id: number;
    contact_id: number | null;
    workspace_id: number;
    status: 'active' | 'completed' | 'cancelled' | 'expired';
    progress_percentage: number;
    completed_lessons: number;
    total_lessons: number;
    last_accessed_at: string | null;
    started_at: string;
    completed_at: string | null;
    expires_at: string | null;
    payment_id: number | null;
    amount_paid: number;
    certificate_issued: boolean;
    certificate_issued_at: string | null;
    created_at: string;
    updated_at: string;
    // Joined fields
    title?: string;
    thumbnail_url?: string;
    category?: string;
    level?: string;
}

export interface LessonProgress {
    id: number;
    enrollment_id: number;
    lesson_id: number;
    user_id: number;
    status: 'not_started' | 'in_progress' | 'completed';
    progress_percentage: number;
    time_spent: number;
    last_position: number | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
    // Joined fields
    lesson_title?: string;
    content_type?: string;
}

export interface EnrollmentStats {
    total_enrollments: number;
    active_enrollments: number;
    completed_enrollments: number;
    total_revenue: number;
    completion_rate: number;
}

export const enrollmentsApi = {
    // Enroll in a course
    enroll: async (courseId: number, data?: { contact_id?: number; payment_id?: number; amount_paid?: number }): Promise<Enrollment> => {
        const response = await api.post(`/courses/${courseId}/enroll`, data || {});
        return response.data.data;
    },

    // Get user's enrollments
    getUserEnrollments: async (status?: 'active' | 'completed' | 'cancelled' | 'expired'): Promise<Enrollment[]> => {
        const params = status ? `?status=${status}` : '';
        const response = await api.get(`/enrollments${params}`);
        return response.data;
    },

    // Get workspace enrollment statistics
    getStats: async (): Promise<EnrollmentStats> => {
        const response = await api.get('/enrollments/stats');
        return response.data;
    },

    // Get course enrollments (for instructors/admins)
    getCourseEnrollments: async (courseId: number, status?: string): Promise<Enrollment[]> => {
        const params = status ? `?status=${status}` : '';
        const response = await api.get(`/courses/${courseId}/enrollments${params}`);
        return response.data;
    },

    // Get lesson progress for an enrollment
    getProgress: async (enrollmentId: number): Promise<LessonProgress[]> => {
        const response = await api.get(`/enrollments/${enrollmentId}/progress`);
        return response.data;
    },

    // Update lesson progress
    updateProgress: async (
        enrollmentId: number,
        data: {
            lesson_id: number;
            status?: 'not_started' | 'in_progress' | 'completed';
            progress_percentage?: number;
            time_spent?: number;
            last_position?: number;
            completed_at?: string;
        }
    ): Promise<void> => {
        await api.post(`/enrollments/${enrollmentId}/progress`, data);
    },

    // Cancel enrollment
    cancelEnrollment: async (enrollmentId: number): Promise<void> => {
        await api.post(`/enrollments/${enrollmentId}/cancel`);
    },
};
