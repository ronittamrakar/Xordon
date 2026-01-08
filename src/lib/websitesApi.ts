import { api } from './api';

export type WebsiteType = 'landing-page' | 'business' | 'ecommerce' | 'portfolio' | 'blog' | 'saas' | 'restaurant' | 'real-estate' | 'education' | 'healthcare';

export type WebsiteStatus = 'draft' | 'published' | 'archived' | 'trashed';

export interface WebsiteSettings {
    seoTitle: string;
    seoDescription?: string;
    backgroundColor?: string;
    fontFamily?: string;
    accentColor?: string;
    websiteType?: WebsiteType;
    customCSS?: string;
    customJS?: string;
    favicon?: string;
    ogImage?: string;
    googleAnalytics?: string;
    facebookPixel?: string;
}

export interface WebsiteSection {
    id: string;
    type: string;
    title?: string;
    subtitle?: string;
    content: any;
    styles?: SectionStyles;
    settings?: any;
    visible?: boolean;
    locked?: boolean;
}

export interface SectionStyles {
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundSize?: string;
    backgroundPosition?: string;
    padding?: string;
    margin?: string;
    textAlign?: 'left' | 'center' | 'right';
    color?: string;
    fontSize?: string;
    fontWeight?: string;
    borderRadius?: string;
    boxShadow?: string;
    border?: string;
    minHeight?: string;
    maxWidth?: string;
    customCSS?: string;
}

export interface Website {
    id: string;
    name: string;
    title: string;
    description?: string;
    slug?: string;
    status: WebsiteStatus;
    type: WebsiteType;
    content?: {
        sections: WebsiteSection[];
        settings: WebsiteSettings;
    };
    seo_title?: string;
    seo_description?: string;
    custom_domain?: string;
    published_url?: string;
    published_at?: string;
    views?: number;
    conversions?: number;
    created_at: string;
    updated_at: string;
}

export const websitesApi = {
    async getWebsites(params?: { type?: WebsiteType | string, status?: WebsiteStatus }): Promise<Website[]> {
        const response = await api.get<Website[]>('/websites', { params });
        return response.data;
    },

    async getWebsite(id: string): Promise<Website> {
        const response = await api.get<Website>(`/websites/${id}`);
        return response.data;
    },

    async createWebsite(data: Partial<Website>): Promise<Website> {
        const response = await api.post<Website>('/websites', data);
        return response.data;
    },

    async updateWebsite(id: string, data: Partial<Website>): Promise<Website> {
        const response = await api.put<Website>(`/websites/${id}`, data);
        return response.data;
    },

    async deleteWebsite(id: string): Promise<void> {
        await api.delete(`/websites/${id}`);
    },

    async publishWebsite(id: string): Promise<Website> {
        const response = await api.post<Website>(`/websites/${id}/publish`);
        return response.data;
    },

    async unpublishWebsite(id: string): Promise<Website> {
        const response = await api.post<Website>(`/websites/${id}/unpublish`);
        return response.data;
    },

    async duplicateWebsite(id: string): Promise<Website> {
        const response = await api.post<Website>(`/websites/${id}/duplicate`);
        return response.data;
    },

    async getTemplates(params?: { type?: WebsiteType }): Promise<Website[]> {
        const response = await api.get<Website[]>('/websites/templates', { params });
        return response.data;
    },

    async createFromTemplate(templateId: string, data: Partial<Website>): Promise<Website> {
        const response = await api.post<Website>(`/websites/templates/${templateId}/create`, data);
        return response.data;
    },
};
