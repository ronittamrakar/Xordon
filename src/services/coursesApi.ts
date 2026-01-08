import api from '@/lib/api';

export interface Course {
    id: number;
    workspace_id: number;
    title: string;
    slug: string;
    description: string | null;
    short_description: string | null;
    thumbnail_url: string | null;
    category: string | null;
    level: 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
    status: 'draft' | 'published' | 'archived' | 'trashed';
    price: number;
    currency: string;
    is_free: boolean;
    duration_hours: number | null;
    total_lessons: number;
    total_students: number;
    rating_average: number;
    rating_count: number;
    certificate_enabled: boolean;
    drip_enabled: boolean;
    drip_days: number | null;
    prerequisites: string | null;
    learning_outcomes: string[] | null;
    instructor_id: number | null;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    modules?: CourseModule[];
    stats?: CourseStats;
}

export interface CourseModule {
    id: number;
    course_id: number;
    title: string;
    description: string | null;
    order_index: number;
    is_published: boolean;
    created_at: string;
    updated_at: string;
    lessons?: Lesson[];
}

export interface Lesson {
    id: number;
    module_id: number;
    course_id: number;
    title: string;
    slug: string;
    content_type: 'video' | 'text' | 'quiz' | 'assignment' | 'download' | 'live_session';
    content: string | null;
    video_url: string | null;
    video_duration: number | null;
    video_provider: 'youtube' | 'vimeo' | 'wistia' | 'self_hosted' | null;
    attachments: any[] | null;
    is_preview: boolean;
    is_published: boolean;
    order_index: number;
    estimated_duration: number | null;
    created_at: string;
    updated_at: string;
}

export interface CourseStats {
    total_enrollments: number;
    active_enrollments: number;
    completed_enrollments: number;
    average_progress: number;
    average_rating: number;
    total_reviews: number;
}

export interface CourseFilters {
    status?: 'draft' | 'published' | 'archived' | 'trashed';
    category?: string;
    level?: 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
    is_free?: boolean;
}

export const coursesApi = {
    // Get all courses
    getCourses: async (filters?: CourseFilters): Promise<Course[]> => {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.category) params.append('category', filters.category);
        if (filters?.level) params.append('level', filters.level);
        if (filters?.is_free !== undefined) params.append('is_free', String(filters.is_free));

        const response = await api.get(`/courses?${params.toString()}`);
        return response.data;
    },

    // Get single course
    getCourse: async (id: number): Promise<Course> => {
        const response = await api.get(`/courses/${id}`);
        return response.data;
    },

    // Create course
    createCourse: async (data: Partial<Course>): Promise<Course> => {
        const response = await api.post('/courses', data);
        return response.data.data;
    },

    // Update course
    updateCourse: async (id: number, data: Partial<Course>): Promise<Course> => {
        const response = await api.put(`/courses/${id}`, data);
        return response.data.data;
    },

    // Delete course
    deleteCourse: async (id: number): Promise<void> => {
        await api.delete(`/courses/${id}`);
    },

    // Publish course
    publishCourse: async (id: number): Promise<Course> => {
        const response = await api.post(`/courses/${id}/publish`);
        return response.data.data;
    },

    // Create module
    createModule: async (courseId: number, data: Partial<CourseModule>): Promise<{ id: number }> => {
        const response = await api.post(`/courses/${courseId}/modules`, data);
        return response.data.data;
    },

    // Create lesson
    createLesson: async (courseId: number, moduleId: number, data: Partial<Lesson>): Promise<{ id: number }> => {
        const response = await api.post(`/courses/${courseId}/modules/${moduleId}/lessons`, data);
        return response.data.data;
    },

    // Enroll student
    enrollStudent: async (courseId: number, contactId: number): Promise<void> => {
        await api.post(`/courses/${courseId}/enroll`, { contact_id: contactId });
    },
};
