import { api } from '@/lib/api';

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    content: string;
    summary?: string;
    featured_image?: string;
    author_name?: string;
    category?: string;
    tags: string[];
    status: 'draft' | 'published' | 'scheduled' | 'archived';
    published_at?: string;
    seo_title?: string;
    seo_description?: string;
    view_count: number;
    is_featured: boolean;
    created_at: string;
    updated_at: string;
}

export interface BlogSettings {
    blog_name: string;
    blog_description?: string;
    domain_id?: number;
    path_prefix: string;
    social_sharing_image?: string;
    custom_css?: string;
    is_active: boolean;
}

export const blogApi = {
    getPosts: async (): Promise<BlogPost[]> => {
        const response = await fetch('/api/marketing/blog/posts', {
            headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
        });
        return response.json();
    },
    getPost: async (id: string): Promise<BlogPost> => {
        const response = await fetch(`/api/marketing/blog/posts/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
        });
        return response.json();
    },
    createPost: async (data: Partial<BlogPost>): Promise<{ id: string }> => {
        const response = await fetch('/api/marketing/blog/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },
    updatePost: async (id: string, data: Partial<BlogPost>): Promise<{ success: boolean }> => {
        const response = await fetch(`/api/marketing/blog/posts/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify(data)
        });
        return response.json();
    },
    deletePost: async (id: string): Promise<{ success: boolean }> => {
        const response = await fetch(`/api/marketing/blog/posts/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
        });
        return response.json();
    },
    getSettings: async (): Promise<BlogSettings> => {
        const response = await fetch('/api/marketing/blog/settings', {
            headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
        });
        return response.json();
    },
    updateSettings: async (data: Partial<BlogSettings>): Promise<{ success: boolean }> => {
        const response = await fetch('/api/marketing/blog/settings', {
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
