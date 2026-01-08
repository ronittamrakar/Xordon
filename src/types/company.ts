// Company type definition for organization management

export interface Company {
  id: string;
  userId?: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: string; // e.g., '1-10', '11-50', '51-200', '201-500', '500+'
  annualRevenue?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  linkedin?: string;
  twitter?: string;
  description?: string;
  logoUrl?: string;
  status: 'active' | 'inactive' | 'prospect' | 'customer' | 'churned';
  contactCount?: number;
  tags?: CompanyTag[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanyTag {
  id: string;
  name: string;
  color: string;
}

export interface CompanyNote {
  id: string;
  companyId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CompanyActivity {
  id: string;
  companyId: string;
  userId: string;
  activityType: 'note' | 'email' | 'call' | 'meeting' | 'task' | 'deal' | 'status_change';
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
];

export const COMPANY_STATUSES = [
  { value: 'prospect', label: 'Prospect', color: '#f59e0b' },
  { value: 'active', label: 'Active', color: '#22c55e' },
  { value: 'customer', label: 'Customer', color: '#3b82f6' },
  { value: 'inactive', label: 'Inactive', color: '#6b7280' },
  { value: 'churned', label: 'Churned', color: '#ef4444' },
];

export const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Real Estate',
  'Marketing & Advertising',
  'Consulting',
  'Legal',
  'Non-profit',
  'Government',
  'Media & Entertainment',
  'Transportation',
  'Energy',
  'Agriculture',
  'Construction',
  'Hospitality',
  'Telecommunications',
  'Other',
];
