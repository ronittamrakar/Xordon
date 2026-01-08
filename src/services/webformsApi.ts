/**
 * Webforms API Service
 * Calls the /webforms-api endpoints (legacy XordonForms PHP API)
 * This allows the Webforms module to work while we migrate to main backend
 */

const API_BASE = '/webforms-api';

// Helper to get auth headers
const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

// Generic fetch wrapper
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }

  return response.json();
}

// Types
export interface WebForm {
  id: number;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'archived' | 'trashed';
  type?: 'single_step' | 'multi_step' | 'popup';
  form_type?: string;
  folder_id?: number | null;
  folder_name?: string;
  fields?: WebFormField[];
  settings?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  submission_count?: number;
  view_count?: number;
  conversion_rate?: number;
}

export interface WebFormField {
  id: string | number;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  settings?: Record<string, unknown>;
}

export interface WebFolder {
  id: number;
  name: string;
  description?: string;
  color?: string;
  parent_id?: number | null;
  status?: string;
  form_count?: number;
}

export interface DashboardStats {
  overview: {
    total_forms: number;
    total_submissions: number;
    active_forms: number;
    conversion_rate: number;
    avg_response_time: number;
    completion_rate: number;
    total_views?: number;
    total_starts?: number;
  };
  top_forms: WebForm[];
  submission_trends: Array<{ date: string; submissions: number }>;
}

// User Settings types
export interface WebFormsUserSettings {
  email_notifications: boolean;
  compact_mode: boolean;
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'auto';
  form_defaults: {
    default_status: 'draft' | 'published';
    require_captcha: boolean;
    max_submissions_per_day: number;
    data_retention_days: number;
  };
  notification_preferences: {
    instant_notifications: boolean;
    daily_digest: boolean;
    weekly_digest: boolean;
    webhook_failures: boolean;
    export_failures: boolean;
  };
  privacy_settings: {
    enable_geoip: boolean;
    anonymize_ip: boolean;
    data_retention_days: number;
  };
  branding?: {
    brand_color: string;
    logo_url: string;
    custom_css: string;
  };
}

export interface WebFormsExportData {
  user: unknown;
  forms: WebForm[];
  submissions: unknown[];
  settings: WebFormsUserSettings;
  activity_logs: unknown[];
  exported_at: string;
}

// User types
export interface WebFormsUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  created_at: string;
  last_login?: string;
}

// Webhook types
export interface WebFormsWebhook {
  id: number;
  form_id: number;
  name: string;
  url: string;
  method: 'POST' | 'GET' | 'PUT';
  headers?: Record<string, string>;
  enabled: boolean;
  events: string[];
  created_at: string;
  last_triggered?: string;
  last_status?: 'success' | 'failed';
}

// API Methods
export const webformsApi = {
  // Dashboard - note: backend uses /analytics/dashboard not /dashboard/stats
  getDashboardStats: () => apiFetch<DashboardStats>('/analytics/dashboard'),

  // Forms
  getForms: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return apiFetch<{ data: WebForm[]; folders?: WebFolder[] }>(`/forms${query}`);
  },

  getForm: (id: number | string) => apiFetch<{ data: WebForm }>(`/forms/${id}`),

  createForm: (data: Partial<WebForm>) =>
    apiFetch<{ data: WebForm }>('/forms', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateForm: (id: number | string, data: Partial<WebForm>) =>
    apiFetch<{ data: WebForm }>(`/forms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteForm: (id: number | string) =>
    apiFetch<{ success: boolean }>(`/forms/${id}`, {
      method: 'DELETE',
    }),

  duplicateForm: (id: number | string) =>
    apiFetch<{ data: WebForm }>(`/forms/${id}/duplicate`, {
      method: 'POST',
    }),

  // Folders
  getFolders: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return apiFetch<{ data: WebFolder[] }>(`/folders${query}`);
  },

  createFolder: (data: Partial<WebFolder>) =>
    apiFetch<{ data: WebFolder }>('/folders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateFolder: (id: number | string, data: Partial<WebFolder>) =>
    apiFetch<{ data: WebFolder }>(`/folders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteFolder: (id: number | string) =>
    apiFetch<{ success: boolean }>(`/folders/${id}`, {
      method: 'DELETE',
    }),

  // Submissions
  getAllSubmissions: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return apiFetch<{ data: unknown[] }>(`/submissions${query}`);
  },

  getSubmissions: (formId: number | string, params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return apiFetch<{ data: unknown[] }>(`/forms/${formId}/submissions${query}`);
  },

  getSubmission: (id: number | string) =>
    apiFetch<{ data: unknown }>(`/submissions/${id}`),

  updateSubmission: (formId: number | string, id: number | string, data: Record<string, unknown>) =>
    apiFetch<{ data: unknown }>(`/forms/${formId}/submissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteSubmission: (formId: number | string, id: number | string) =>
    apiFetch<{ success: boolean }>(`/forms/${formId}/submissions/${id}`, {
      method: 'DELETE',
    }),

  replyToSubmission: (
    formId: number | string,
    id: number | string,
    data: { to?: string; subject?: string; message: string }
  ) =>
    apiFetch<{ success: boolean; to: string; subject: string }>(
      `/forms/${formId}/submissions/${id}/reply`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),

  // Public form submission (no auth required)
  getPublicForm: (id: number | string) =>
    apiFetch<{ data: WebForm }>(`/forms/${id}/public`),

  submitForm: (formId: number | string, data: Record<string, unknown>) =>
    apiFetch<{ success: boolean; submission_id?: number }>(`/forms/${formId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  trackFormStart: (formId: number | string) =>
    apiFetch<{ success: boolean }>(`/forms/${formId}/start`, {
      method: 'POST',
    }),

  previewMarketplaceLead: (formId: number | string, data: Record<string, unknown>) =>
    apiFetch<{ success: boolean; data: unknown }>(`/forms/${formId}/marketplace/preview`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // User Settings
  getUserSettings: () =>
    apiFetch<{ data: WebFormsUserSettings }>('/user/settings'),

  updateUserSettings: (settings: Partial<WebFormsUserSettings>) =>
    apiFetch<{ message: string }>('/user/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  exportUserData: () =>
    apiFetch<{ data: WebFormsExportData }>('/user/export'),

  // Users (workspace team management)
  getUsers: () =>
    apiFetch<{ data: WebFormsUser[] }>('/users'),

  getUser: (id: number | string) =>
    apiFetch<{ data: WebFormsUser }>(`/users/${id}`),

  inviteUser: (data: { email: string; role?: string }) =>
    apiFetch<{ data: WebFormsUser }>('/users/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUser: (id: number | string, data: Partial<WebFormsUser>) =>
    apiFetch<{ data: WebFormsUser }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  removeUser: (id: number | string) =>
    apiFetch<{ success: boolean }>(`/users/${id}`, {
      method: 'DELETE',
    }),

  // Webhooks
  getWebhooks: (formId?: number | string) => {
    const query = formId ? `?form_id=${formId}` : '';
    return apiFetch<{ data: WebFormsWebhook[] }>(`/webhooks${query}`);
  },

  createWebhook: (data: Partial<WebFormsWebhook>) =>
    apiFetch<{ data: WebFormsWebhook }>('/webhooks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateWebhook: (id: number | string, data: Partial<WebFormsWebhook>) =>
    apiFetch<{ data: WebFormsWebhook }>(`/webhooks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteWebhook: (id: number | string) =>
    apiFetch<{ success: boolean }>(`/webhooks/${id}`, {
      method: 'DELETE',
    }),

  testWebhook: (id: number | string) =>
    apiFetch<{ success: boolean; response?: unknown }>(`/webhooks/${id}/test`, {
      method: 'POST',
    }),

  // Insights & Analytics
  getFormInsights: (formId: number | string, params?: { range?: string }) => {
    const query = params ? `?${new URLSearchParams(params as any)}` : '';
    return apiFetch<{
      metrics: {
        views: number;
        starts: number;
        submissions: number;
        completion_rate: number;
        avg_time: number;
        drop_off_rate: number;
      };
      trends: Array<{ date: string; views: number; submissions: number }>;
      devices: Array<{ device: string; count: number }>;
      sources: Array<{ source: string; count: number }>;
      field_insights: Array<{ field_id: string; field_label: string; drop_off_rate: number; avg_time: number }>;
    }>(`/forms/${formId}/insights${query}`);
  },

  // Files
  getFormFiles: (formId: number | string, params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return apiFetch<{
      data: Array<{
        id: number;
        submission_id: number;
        field_name: string;
        filename: string;
        file_size: number;
        mime_type: string;
        url: string;
        uploaded_at: string;
      }>;
      total: number;
    }>(`/forms/${formId}/files${query}`);
  },

  deleteFormFile: (formId: number | string, fileId: number | string) =>
    apiFetch<{ success: boolean }>(`/forms/${formId}/files/${fileId}`, {
      method: 'DELETE',
    }),

  // Reports
  getFormReports: (formId: number | string) =>
    apiFetch<{
      data: Array<{
        id: number;
        name: string;
        type: string;
        date_range: string;
        status: string;
        created_at: string;
        download_url?: string;
      }>;
    }>(`/forms/${formId}/reports`),

  generateReport: (formId: number | string, data: {
    type: 'summary' | 'detail' | 'field_insights' | 'trends';
    date_range?: string;
    format?: 'pdf' | 'csv' | 'excel';
    fields?: string[];
    recipients?: string[];
  }) =>
    apiFetch<{ data: { id: number; download_url: string } }>(`/forms/${formId}/reports`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getScheduledReports: (formId: number | string) =>
    apiFetch<{
      data: Array<{
        id: number;
        name: string;
        type: string;
        frequency: string;
        next_run: string;
        recipients: string[];
        enabled: boolean;
      }>;
    }>(`/forms/${formId}/scheduled-reports`),

  createScheduledReport: (formId: number | string, data: {
    name: string;
    type: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    format?: string;
  }) =>
    apiFetch<{ data: unknown }>(`/forms/${formId}/scheduled-reports`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateScheduledReport: (formId: number | string, reportId: number | string, data: Partial<{
    name: string;
    enabled: boolean;
    frequency: string;
    recipients: string[];
  }>) =>
    apiFetch<{ data: unknown }>(`/forms/${formId}/scheduled-reports/${reportId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteScheduledReport: (formId: number | string, reportId: number | string) =>
    apiFetch<{ success: boolean }>(`/forms/${formId}/scheduled-reports/${reportId}`, {
      method: 'DELETE',
    }),

  // Bulk actions for submissions
  bulkUpdateSubmissions: (formId: number | string, data: {
    submission_ids: number[];
    action: 'mark_reviewed' | 'mark_spam' | 'delete';
  }) =>
    apiFetch<{ success: boolean; updated: number }>(`/forms/${formId}/submissions/bulk`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  exportSubmissions: (formId: number | string, params?: {
    format?: 'csv' | 'excel' | 'json';
    date_range?: string;
    status?: string;
  }) => {
    const query = params ? `?${new URLSearchParams(params as any)}` : '';
    return apiFetch<{ download_url: string }>(`/forms/${formId}/submissions/export${query}`);
  },
};

export default webformsApi;
