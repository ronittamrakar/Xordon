import api from '@/lib/api';

// ============================================
// QUIZZES
// ============================================

export interface Quiz {
    id: number;
    workspace_id: number;
    course_id: number;
    module_id: number | null;
    lesson_id: number | null;
    title: string;
    description: string;
    time_limit_minutes: number;
    passing_score: number;
    max_attempts: number;
    shuffle_questions: boolean;
    show_correct_answers: boolean;
    is_required: boolean;
    status: 'draft' | 'published' | 'archived';
    position: number;
    question_count?: number;
    attempt_count?: number;
    questions?: QuizQuestion[];
    created_at: string;
    updated_at: string;
}

export interface QuizQuestion {
    id: number;
    quiz_id: number;
    question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'matching';
    question_text: string;
    question_media_url: string | null;
    points: number;
    position: number;
    explanation: string | null;
    options: QuizQuestionOption[];
    created_at: string;
    updated_at: string;
}

export interface QuizQuestionOption {
    id: number;
    question_id: number;
    option_text: string;
    is_correct: boolean;
    match_text: string | null;
    position: number;
}

export interface QuizAttempt {
    id: number;
    quiz_id: number;
    user_id: number;
    enrollment_id: number | null;
    started_at: string;
    completed_at: string | null;
    score: number;
    max_score: number;
    percentage: number;
    passed: boolean;
    time_spent_seconds: number;
    attempt_number: number;
    user_name?: string;
    user_email?: string;
    answers?: QuizAttemptAnswer[];
    created_at: string;
}

export interface QuizAttemptAnswer {
    id: number;
    attempt_id: number;
    question_id: number;
    selected_option_id: number | null;
    text_answer: string | null;
    is_correct: boolean | null;
    points_earned: number;
    question_text?: string;
    question_type?: string;
    points?: number;
    explanation?: string;
    options?: QuizQuestionOption[];
}

export interface QuizStartResult {
    attempt_id: number;
    quiz: {
        id: number;
        title: string;
        time_limit_minutes: number;
        question_count: number;
    };
    questions: QuizQuestion[];
}

export interface QuizSubmitResult {
    score: number;
    max_score: number;
    percentage: number;
    passed: boolean;
    passing_score: number;
    time_spent_seconds: number;
}

export const quizzesApi = {
    // Quiz CRUD
    getCourseQuizzes: async (courseId: number) => {
        const res = await api.get<{ items: Quiz[] }>(`/courses/${courseId}/quizzes`);
        return res.data.items;
    },

    getQuiz: async (quizId: number) => {
        const res = await api.get<Quiz>(`/quizzes/${quizId}`);
        return res.data;
    },

    createQuiz: async (courseId: number, data: Partial<Quiz>) => {
        const res = await api.post<Quiz>(`/courses/${courseId}/quizzes`, data);
        return res.data;
    },

    updateQuiz: async (quizId: number, data: Partial<Quiz>) => {
        const res = await api.put<Quiz>(`/quizzes/${quizId}`, data);
        return res.data;
    },

    deleteQuiz: async (quizId: number) => {
        await api.delete(`/quizzes/${quizId}`);
    },

    // Questions
    createQuestion: async (quizId: number, data: Partial<QuizQuestion> & { options?: Partial<QuizQuestionOption>[] }) => {
        const res = await api.post<QuizQuestion>(`/quizzes/${quizId}/questions`, data);
        return res.data;
    },

    updateQuestion: async (questionId: number, data: Partial<QuizQuestion> & { options?: Partial<QuizQuestionOption>[] }) => {
        const res = await api.put<QuizQuestion>(`/questions/${questionId}`, data);
        return res.data;
    },

    deleteQuestion: async (questionId: number) => {
        await api.delete(`/questions/${questionId}`);
    },

    // Attempts (Student)
    startQuiz: async (quizId: number) => {
        const res = await api.post<QuizStartResult>(`/quizzes/${quizId}/start`);
        return res.data;
    },

    submitAttempt: async (attemptId: number, answers: { question_id: number; selected_option_id?: number; text_answer?: string }[]) => {
        const res = await api.post<QuizSubmitResult>(`/attempts/${attemptId}/submit`, { answers });
        return res.data;
    },

    getAttemptResults: async (attemptId: number) => {
        const res = await api.get<QuizAttempt>(`/attempts/${attemptId}/results`);
        return res.data;
    },

    // Instructor
    getQuizAttempts: async (quizId: number) => {
        const res = await api.get<{ items: QuizAttempt[] }>(`/quizzes/${quizId}/attempts`);
        return res.data.items;
    },
};

// ============================================
// COURSE DISCUSSIONS
// ============================================

export interface CourseDiscussion {
    id: number;
    course_id: number;
    lesson_id: number | null;
    user_id: number;
    parent_id: number | null;
    title: string | null;
    content: string;
    is_pinned: boolean;
    is_resolved: boolean;
    reply_count: number;
    user_name?: string;
    user_email?: string;
    replies?: CourseDiscussion[];
    created_at: string;
    updated_at: string;
}

export const courseDiscussionsApi = {
    getDiscussions: async (courseId: number, lessonId?: number) => {
        let url = `/courses/${courseId}/discussions`;
        if (lessonId) url += `?lesson_id=${lessonId}`;
        const res = await api.get<{ items: CourseDiscussion[] }>(url);
        return res.data.items;
    },

    getDiscussion: async (discussionId: number) => {
        const res = await api.get<CourseDiscussion>(`/discussions/${discussionId}`);
        return res.data;
    },

    createDiscussion: async (courseId: number, data: { title?: string; content: string; lesson_id?: number }) => {
        const res = await api.post<CourseDiscussion>(`/courses/${courseId}/discussions`, data);
        return res.data;
    },

    updateDiscussion: async (discussionId: number, data: Partial<CourseDiscussion>) => {
        const res = await api.put<CourseDiscussion>(`/discussions/${discussionId}`, data);
        return res.data;
    },

    deleteDiscussion: async (discussionId: number) => {
        await api.delete(`/discussions/${discussionId}`);
    },

    replyToDiscussion: async (discussionId: number, content: string) => {
        const res = await api.post<CourseDiscussion>(`/discussions/${discussionId}/reply`, { content });
        return res.data;
    },

    pinDiscussion: async (discussionId: number, pinned: boolean) => {
        const res = await api.put<CourseDiscussion>(`/discussions/${discussionId}`, { is_pinned: pinned });
        return res.data;
    },

    resolveDiscussion: async (discussionId: number, resolved: boolean) => {
        const res = await api.put<CourseDiscussion>(`/discussions/${discussionId}`, { is_resolved: resolved });
        return res.data;
    },
};

// ============================================
// COURSE REVIEWS
// ============================================

export interface CourseReview {
    id: number;
    course_id: number;
    user_id: number;
    enrollment_id: number | null;
    rating: number;
    title: string | null;
    review_text: string | null;
    is_verified: boolean;
    is_featured: boolean;
    helpful_count: number;
    status: 'pending' | 'approved' | 'rejected';
    user_name?: string;
    created_at: string;
    updated_at: string;
}

export const courseReviewsApi = {
    getCourseReviews: async (courseId: number) => {
        const res = await api.get<{ items: CourseReview[] }>(`/courses/${courseId}/reviews`);
        return res.data.items;
    },

    createReview: async (courseId: number, data: { rating: number; title?: string; review_text?: string }) => {
        const res = await api.post<CourseReview>(`/courses/${courseId}/reviews`, data);
        return res.data;
    },

    updateReview: async (reviewId: number, data: Partial<CourseReview>) => {
        const res = await api.put<CourseReview>(`/reviews/${reviewId}`, data);
        return res.data;
    },

    deleteReview: async (reviewId: number) => {
        await api.delete(`/reviews/${reviewId}`);
    },
};

// ============================================
// STUDENT NOTES
// ============================================

export interface StudentNote {
    id: number;
    user_id: number;
    course_id: number;
    lesson_id: number | null;
    video_timestamp: number | null;
    note_text: string;
    created_at: string;
    updated_at: string;
}

export const studentNotesApi = {
    getNotes: async (courseId: number, lessonId?: number) => {
        let url = `/courses/${courseId}/notes`;
        if (lessonId) url += `?lesson_id=${lessonId}`;
        const res = await api.get<{ items: StudentNote[] }>(url);
        return res.data.items;
    },

    createNote: async (courseId: number, data: { note_text: string; lesson_id?: number; video_timestamp?: number }) => {
        const res = await api.post<StudentNote>(`/courses/${courseId}/notes`, data);
        return res.data;
    },

    updateNote: async (noteId: number, noteText: string) => {
        const res = await api.put<StudentNote>(`/notes/${noteId}`, { note_text: noteText });
        return res.data;
    },

    deleteNote: async (noteId: number) => {
        await api.delete(`/notes/${noteId}`);
    },
};
