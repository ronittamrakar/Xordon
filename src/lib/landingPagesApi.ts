import api from './api';

export interface LandingPage {
  id: number;
  user_id: number;
  name: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'archived' | 'trashed';
  content: {
    sections: LandingPageSection[];
    settings: PageSettings;
  };
  seo_title?: string;
  seo_description?: string;
  slug?: string;
  template_id?: number;
  views: number;
  conversions: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LandingPageSection {
  id: string;
  type: SectionType;
  title: string;
  subtitle?: string;
  content: any;
  styles?: SectionStyles;
}

export interface SectionStyles {
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: 'cover' | 'contain' | 'auto';
  backgroundPosition?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  textAlign?: 'left' | 'center' | 'right';
  columns?: number;
}

export interface PageSettings {
  seoTitle: string;
  seoDescription: string;
  backgroundColor: string;
  fontFamily: string;
  accentColor: string;
}

export type SectionType = 'hero' | 'features' | 'testimonials' | 'pricing' | 'faq' | 'form' | 'cta' | 'gallery' | 'stats' | 'team' | 'services' | 'process' | 'testimonials-grid' | 'video' | 'newsletter' | 'header' | 'footer' | 'social-proof' | 'timeline' | 'comparison' | 'tabs' | 'accordion' | 'map' | 'countdown' | 'code' | 'quote' | 'badge' | 'contact-info' | 'blog-preview' | 'portfolio' | 'benefits';

export const landingPagesApi = {
  // List all landing pages
  getLandingPages: async (): Promise<LandingPage[]> => {
    const response = await api.get('/websites', { params: { type: 'landing-page' } });
    const websites = response.data as any[];
    return websites.map(w => mapWebsiteToLandingPage(w));
  },

  // Get single landing page
  getLandingPage: async (id: string): Promise<LandingPage> => {
    const response = await api.get(`/websites/${id}`);
    return mapWebsiteToLandingPage(response.data);
  },

  // Create new landing page
  createLandingPage: async (data: Partial<LandingPage>): Promise<LandingPage> => {
    const websiteData = {
      ...data,
      type: 'landing-page',
      content: data.content
    };
    const response = await api.post('/websites', websiteData);
    return mapWebsiteToLandingPage(response.data);
  },

  // Update landing page
  updateLandingPage: async (id: string, data: Partial<LandingPage>): Promise<LandingPage> => {
    const response = await api.put(`/websites/${id}`, data);
    return mapWebsiteToLandingPage(response.data);
  },

  // Delete landing page
  deleteLandingPage: async (id: string): Promise<void> => {
    await api.delete(`/websites/${id}`);
  },

  // Publish landing page
  publishLandingPage: async (id: string): Promise<LandingPage> => {
    return landingPagesApi.updateLandingPage(id, {
      status: 'published',
      published_at: new Date().toISOString()
    } as any);
  },

  // Upload image
  uploadImage: async (file: File): Promise<{ url: string; filename: string; size: number; type: string }> => {
    // Determine ID if possible, otherwise use temporary or changing the signature might be needed.
    // However, existing usage might expect this signature.
    // The previous implementation used /api/upload which might be a generic upload endpoint.
    // Let's assume /api/upload exists or fallback to website media endpoint if we had an ID.
    // Since we don't have an ID here, let's keep using /api/upload if it exists or use a generic one.
    // Checking previous implementation: it used /api/upload. Let's keep it but fixing the fetch call to use api client if possible or keep as is.
    // Actually, let's leave uploadImage as is but fix the fetch to use the configured base URL if possible, or just keep it since I didn't verify /api/upload.

    // REVERTING TO ORIGINAL uploadImage for safety, only changing CRUD.
    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const tenantId = localStorage.getItem('tenant_id');
    if (tenantId) {
      headers['X-Workspace-Id'] = tenantId;
    }
    // const activeClientId = localStorage.getItem('active_client_id');
    // if (activeClientId) {
    //   headers['X-Client-Id'] = activeClientId;
    // }

    // Use absolute URL if needed or relative to /api
    // Assuming /api/upload is correct.
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const result = await response.json();
    return result.data;
  },
};

// Helper: Map Website to LandingPage
function mapWebsiteToLandingPage(website: any): LandingPage {
  return {
    id: website.id,
    user_id: website.user_id,
    name: website.name,
    title: website.title,
    description: website.description,
    status: website.status,
    content: website.content || { sections: [], settings: {} },
    seo_title: website.seo_title,
    seo_description: website.seo_description,
    slug: website.slug,
    template_id: website.template_id, // Might not exist on website, but kept for interface compatibility
    views: website.views || 0,
    conversions: website.conversions || 0,
    published_at: website.published_at,
    created_at: website.created_at,
    updated_at: website.updated_at
  };
}
