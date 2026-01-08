/**
 * RBAC (Role-Based Access Control) Types
 */

// Role type
export interface Role {
  id: number;
  name: string;
  description: string;
  is_system: boolean;
  permissions: string[];
  user_count?: number;
  created_at: string;
  updated_at: string;
}

// Permission type
export interface Permission {
  id: number;
  key: string;
  name: string;
  description: string;
  category: string;
}

// Permission category with grouped permissions
export interface PermissionCategory {
  name: string;
  permissions: Permission[];
}

// User with role information
export interface UserWithRole {
  id: number;
  email: string;
  name: string;
  role_id: number | null;
  role: Role | null;
  permissions?: string[];
  is_admin?: boolean;
  created_at: string;
  last_login?: string;
}

// Permission matrix (all roles with their permissions)
export interface PermissionMatrix {
  roles: Role[];
  permissions: PermissionCategory[];
}

// RBAC Audit log entry
export interface RBACauditEntry {
  id: number;
  action: string;
  actor_id: number;
  actor_name?: string;
  actor_email?: string;
  target_type: string | null;
  target_id: number | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// Role assignment payload
export interface RoleAssignmentPayload {
  role_id: number;
}

// Role create/update payload
export interface RolePayload {
  name: string;
  description?: string;
  permissions?: string[];
}

// Permission check result
export interface PermissionCheckResult {
  permission: string;
  has_permission: boolean;
}

// Current user permissions response
export interface UserPermissionsResponse {
  role: Role | null;
  permissions: string[];
  is_admin: boolean;
}

// Default permission keys (for reference)
export const PERMISSION_KEYS = {
  // User Management
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  USERS_ASSIGN_ROLE: 'users.assign_role',
  
  // Role Management
  ROLES_VIEW: 'roles.view',
  ROLES_CREATE: 'roles.create',
  ROLES_EDIT: 'roles.edit',
  ROLES_DELETE: 'roles.delete',
  
  // Email
  EMAIL_CAMPAIGNS_VIEW: 'email.campaigns.view',
  EMAIL_CAMPAIGNS_CREATE: 'email.campaigns.create',
  EMAIL_CAMPAIGNS_EDIT: 'email.campaigns.edit',
  EMAIL_CAMPAIGNS_DELETE: 'email.campaigns.delete',
  EMAIL_CAMPAIGNS_SEND: 'email.campaigns.send',
  EMAIL_TEMPLATES_VIEW: 'email.templates.view',
  EMAIL_TEMPLATES_MANAGE: 'email.templates.manage',
  EMAIL_SEQUENCES_VIEW: 'email.sequences.view',
  EMAIL_SEQUENCES_MANAGE: 'email.sequences.manage',
  EMAIL_ANALYTICS_VIEW: 'email.analytics.view',
  
  // SMS
  SMS_CAMPAIGNS_VIEW: 'sms.campaigns.view',
  SMS_CAMPAIGNS_CREATE: 'sms.campaigns.create',
  SMS_CAMPAIGNS_EDIT: 'sms.campaigns.edit',
  SMS_CAMPAIGNS_DELETE: 'sms.campaigns.delete',
  SMS_CAMPAIGNS_SEND: 'sms.campaigns.send',
  SMS_TEMPLATES_VIEW: 'sms.templates.view',
  SMS_TEMPLATES_MANAGE: 'sms.templates.manage',
  SMS_SEQUENCES_VIEW: 'sms.sequences.view',
  SMS_SEQUENCES_MANAGE: 'sms.sequences.manage',
  SMS_ANALYTICS_VIEW: 'sms.analytics.view',
  
  // Calls
  CALLS_VIEW: 'calls.view',
  CALLS_CAMPAIGNS_VIEW: 'calls.campaigns.view',
  CALLS_CAMPAIGNS_CREATE: 'calls.campaigns.create',
  CALLS_CAMPAIGNS_EDIT: 'calls.campaigns.edit',
  CALLS_CAMPAIGNS_DELETE: 'calls.campaigns.delete',
  CALLS_CAMPAIGNS_EXECUTE: 'calls.campaigns.execute',
  CALLS_SCRIPTS_VIEW: 'calls.scripts.view',
  CALLS_SCRIPTS_MANAGE: 'calls.scripts.manage',
  CALLS_AGENTS_VIEW: 'calls.agents.view',
  CALLS_AGENTS_MANAGE: 'calls.agents.manage',
  CALLS_DISPOSITIONS_MANAGE: 'calls.dispositions.manage',
  CALLS_ANALYTICS_VIEW: 'calls.analytics.view',
  
  // Contacts
  CONTACTS_VIEW: 'contacts.view',
  CONTACTS_CREATE: 'contacts.create',
  CONTACTS_EDIT: 'contacts.edit',
  CONTACTS_DELETE: 'contacts.delete',
  CONTACTS_IMPORT: 'contacts.import',
  CONTACTS_EXPORT: 'contacts.export',
  
  // CRM
  CRM_VIEW: 'crm.view',
  CRM_LEADS_VIEW: 'crm.leads.view',
  CRM_LEADS_CREATE: 'crm.leads.create',
  CRM_LEADS_EDIT: 'crm.leads.edit',
  CRM_LEADS_DELETE: 'crm.leads.delete',
  CRM_PIPELINE_VIEW: 'crm.pipeline.view',
  CRM_PIPELINE_MANAGE: 'crm.pipeline.manage',
  CRM_ACTIVITIES_VIEW: 'crm.activities.view',
  CRM_ANALYTICS_VIEW: 'crm.analytics.view',
  CRM_LEAD_MARKETPLACE_VIEW: 'crm.lead_marketplace.view',
  CRM_LEAD_MARKETPLACE_CREATE: 'crm.lead_marketplace.create',
  CRM_LEAD_MARKETPLACE_ROUTE: 'crm.lead_marketplace.route',
  
  // Forms
  FORMS_VIEW: 'forms.view',
  FORMS_CREATE: 'forms.create',
  FORMS_EDIT: 'forms.edit',
  FORMS_DELETE: 'forms.delete',
  FORMS_RESPONSES_VIEW: 'forms.responses.view',
  
  // Analytics
  ANALYTICS_DASHBOARD: 'analytics.dashboard',
  ANALYTICS_REPORTS: 'analytics.reports',
  ANALYTICS_EXPORT: 'analytics.export',
  
  // Settings
  SETTINGS_GENERAL: 'settings.general',
  SETTINGS_EMAIL: 'settings.email',
  SETTINGS_SMS: 'settings.sms',
  SETTINGS_CALLS: 'settings.calls',
  SETTINGS_INTEGRATIONS: 'settings.integrations',
  SETTINGS_CONNECTIONS: 'settings.connections',
  
  // Automations
  AUTOMATIONS_VIEW: 'automations.view',
  AUTOMATIONS_CREATE: 'automations.create',
  AUTOMATIONS_EDIT: 'automations.edit',
  AUTOMATIONS_DELETE: 'automations.delete',
} as const;

export type PermissionKey = typeof PERMISSION_KEYS[keyof typeof PERMISSION_KEYS];
