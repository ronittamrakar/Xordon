import api from '@/lib/api';

// ============================================
// TASK SUBTASKS
// ============================================

export interface TaskSubtask {
    id: number;
    task_id: number;
    title: string;
    completed: boolean;
    assigned_to: number | null;
    assigned_to_name?: string;
    position: number;
    created_at: string;
    updated_at: string;
}

export const taskSubtasksApi = {
    getSubtasks: async (taskId: number) => {
        const res = await api.get<{ items: TaskSubtask[] }>(`/tasks/${taskId}/subtasks`);
        return res.data.items;
    },

    createSubtask: async (taskId: number, data: { title: string; assigned_to?: number }) => {
        const res = await api.post<TaskSubtask>(`/tasks/${taskId}/subtasks`, data);
        return res.data;
    },

    updateSubtask: async (taskId: number, subtaskId: number, data: Partial<TaskSubtask>) => {
        const res = await api.put<TaskSubtask>(`/tasks/${taskId}/subtasks/${subtaskId}`, data);
        return res.data;
    },

    deleteSubtask: async (taskId: number, subtaskId: number) => {
        await api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
    },

    toggleSubtask: async (taskId: number, subtaskId: number) => {
        const res = await api.post<TaskSubtask>(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`);
        return res.data;
    },

    reorderSubtasks: async (taskId: number, order: number[]) => {
        await api.post(`/tasks/${taskId}/subtasks/reorder`, { order });
    },
};

// ============================================
// TASK ATTACHMENTS
// ============================================

export interface TaskAttachment {
    id: number;
    task_id: number;
    user_id: number;
    filename: string;
    original_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    created_at: string;
    uploaded_by_name?: string;
}

export const taskAttachmentsApi = {
    getAttachments: async (taskId: number) => {
        const res = await api.get<{ items: TaskAttachment[] }>(`/tasks/${taskId}/attachments`);
        return res.data.items;
    },

    uploadAttachment: async (taskId: number, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post<TaskAttachment>(`/tasks/${taskId}/attachments`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
    },

    deleteAttachment: async (taskId: number, attachmentId: number) => {
        await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
    },

    getDownloadUrl: (taskId: number, attachmentId: number) => {
        return `/api/tasks/${taskId}/attachments/${attachmentId}/download`;
    },
};

// ============================================
// TASK DEPENDENCIES
// ============================================

export interface TaskDependency {
    id: number;
    task_id: number;
    depends_on_task_id: number;
    dependency_type: 'blocks' | 'blocked_by' | 'related';
    depends_on_title?: string;
    depends_on_status?: string;
    depends_on_priority?: string;
    created_at: string;
}

export interface TaskDependencies {
    depends_on: TaskDependency[];
    blocking: TaskDependency[];
}

export const taskDependenciesApi = {
    getDependencies: async (taskId: number) => {
        const res = await api.get<TaskDependencies>(`/tasks/${taskId}/dependencies`);
        return res.data;
    },

    addDependency: async (taskId: number, dependsOnTaskId: number, type: 'blocks' | 'blocked_by' | 'related' = 'blocks') => {
        const res = await api.post<TaskDependency>(`/tasks/${taskId}/dependencies`, {
            depends_on_task_id: dependsOnTaskId,
            dependency_type: type,
        });
        return res.data;
    },

    removeDependency: async (taskId: number, dependencyId: number) => {
        await api.delete(`/tasks/${taskId}/dependencies/${dependencyId}`);
    },

    checkBlocked: async (taskId: number) => {
        const res = await api.get<{ is_blocked: boolean; blocking_tasks: { id: number; title: string; status: string }[] }>(
            `/tasks/${taskId}/dependencies/check`
        );
        return res.data;
    },
};
