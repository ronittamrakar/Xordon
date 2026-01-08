/**
 * Feature Registry
 * 
 * Central configuration for all application modules/features.
 * Use this to control which features appear in the navigation.
 * 
 * Status values:
 * - 'core': Always visible in main navigation
 * - 'advanced': Visible in "Advanced" section (collapsed by default)
 * - 'hidden': Not shown in nav, but routes still work (for dev/testing)
 * - 'coming_soon': Shown with "Coming Soon" badge, not clickable
 */

import { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Mail,
  Zap,
  FileTextIcon,
  Inbox,
  UserX,
  MessageCircle,
  MessageSquare,
  Smartphone,
  Globe,
  Search,
  Phone,
  TrendingUp,
  Users,
  CheckCircle,
  Activity,
  BarChart3,
  Building2,
  List,
  Filter,
  ClipboardList,
  Layout,
  Settings,
  Link2,
  UserCog,
  Workflow,
  BookOpen,
  FlaskConical,
  CheckSquare,
  Star,
  ShoppingCart,
  Wrench,
  RefreshCw,
  UserCheck,
  Package,
  Play,
  DollarSign,
  Kanban,
  Calendar,
  Clock,
  Brain,
  Image,
  Gift,
  PieChart,
  Gauge,
  Camera,
  Video,
  FolderOpen,
  LineChart,
  GraduationCap,
  Crosshair,
  CreditCard,
  Wallet,
  AlertCircle,
  BellRing,
  Flame,
  Target,
  Send,
  Sparkles,
  Mic,
  Heart,
  Store,
  Bot,
  Layers,
  Award,
  Ticket,
  Truck,
  Archive,
  Trash2,
  CheckCircle2,
  Sliders,
  Eye,
  User,
  UserPlus,
  Monitor,
} from 'lucide-react';

export type FeatureStatus = 'core' | 'advanced' | 'hidden' | 'coming_soon';

export interface FeatureItem {
  id: string;
  path: string;
  label: string;
  icon: LucideIcon;
  status: FeatureStatus;
  description?: string;
  group: FeatureGroup;
  subGroup?: string;
  permission?: string;
  module_key?: string; // Maps feature to a module for entitlement checking
}

export type FeatureGroup =
  // 8-Stage Customer Journey
  | 'foundation'      // Dashboard, global tools
  | 'clients'         // Contacts, companies, segments
  | 'reach'           // Email, SMS, Calls, Channels
  | 'conversion'      // CRM, Proposals, Quotes
  | 'delivery'        // Projects, Operations, Field Service, Scheduling, Ecommerce
  | 'retention'       // Helpdesk, Reputation
  | 'growth'          // SEO, Marketing, Acquisition, LMS, Engagement
  | 'optimization'    // AI, Automation, Analytics, Finance, HR, Admin

  // Legacy groups (for backward compatibility during transition)
  | 'dashboard'
  | 'email'
  | 'sms'
  | 'calls'
  | 'engagement'
  | 'automation'
  | 'crm'
  | 'contacts'
  | 'operations'
  | 'project_management'
  | 'ecommerce'
  | 'helpdesk'
  | 'growth_legacy'
  | 'hr'
  | 'sales_enablement'
  | 'sales'
  | 'reputation'
  | 'finance'
  | 'marketing'
  | 'admin'
  | 'agency'
  | 'reporting'
  | 'websites'
  | 'proposals'
  | 'reach_outbound'
  | 'reach_inbound'
  | 'reach_assets'
  | 'reach_calls'
  | 'scheduling'
  | 'lead_marketplace'
  | 'ai'
  | 'culture';

// High-level product bundles (account-level focus areas)
export type ProductBundle =
  | 'reach'
  | 'operations'
  | 'crm'
  | 'sales'
  | 'marketing'
  | 'reputation'
  | 'finance'
  | 'growth'
  | 'hr'
  | 'helpdesk'
  | 'reporting'
  | 'full';

/**
 * Complete feature registry
 * All modules are listed here with their status
 */
export const FEATURES: FeatureItem[] = [
  // ============================================
  // DASHBOARD & GLOBAL
  // ============================================
  {
    id: 'dashboard',
    path: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    status: 'core',
    group: 'foundation',
    subGroup: 'dashboard_communications',
    description: 'Main application dashboard',
  },
  {
    id: 'inbox',
    path: '/inbox',
    label: 'Inbox',
    icon: Inbox,
    status: 'core',
    group: 'foundation',
    subGroup: 'dashboard_communications',
    description: 'Unified inbox for all communications',
  },

  {
    id: 'daily_planner',
    path: '/planner',
    label: 'Daily Planner',
    icon: CheckSquare,
    status: 'core',
    group: 'foundation',
    subGroup: 'dashboard_communications',
    description: 'Daily task list and actions',
  },
  {
    id: 'system_health',
    path: '/admin/health',
    label: 'System Health',
    icon: Activity,
    status: 'hidden',
    group: 'optimization',
    subGroup: 'admin',
    description: 'Real-time infrastructure and module diagnostic dashboard',
  },
  {
    id: 'snapshots',
    path: '/snapshots',
    label: 'Snapshots',
    icon: Video,
    status: 'hidden',
    group: 'optimization',
    subGroup: 'admin',
    description: 'Workspace and account snapshots',
  },
  {
    id: 'global_archive',
    path: '/archive',
    label: 'Archive',
    icon: Archive,
    status: 'core',
    group: 'optimization',
    subGroup: 'admin',
    description: 'Centralized location for all archived content',
  },
  {
    id: 'global_trash',
    path: '/trash',
    label: 'Trash',
    icon: Trash2,
    status: 'core',
    group: 'optimization',
    subGroup: 'admin',
    description: 'Centralized location for all deleted content before permanent removal',
  },
  {
    id: 'media_library',
    path: '/media',
    label: 'Media Library',
    icon: Image,
    status: 'core',
    group: 'foundation',
    subGroup: 'dashboard_communications',
    description: 'Manage all your media assets, images, and documents',
  },

  // ============================================
  // EMAIL OUTREACH
  // ============================================
  {
    id: 'email_campaigns',
    path: '/reach/outbound/email/campaigns',
    label: 'Campaigns',
    icon: Mail,
    status: 'core',
    group: 'reach',
    subGroup: 'email',
    description: 'Email marketing campaigns',
    module_key: 'reach',
  },
  {
    id: 'email_sequences',
    path: '/reach/outbound/email/sequences',
    label: 'Sequences',
    icon: Zap,
    status: 'core',
    group: 'reach',
    subGroup: 'email',
    description: 'Automated email sequences',
    module_key: 'reach',
  },
  {
    id: 'email_templates',
    path: '/reach/email-templates',
    label: 'Email Templates',
    icon: FileTextIcon,
    status: 'core',
    group: 'reach',
    subGroup: 'email',
    description: 'Email templates library',
    module_key: 'reach',
  },
  {
    id: 'email_replies',
    path: '/reach/inbound/email/replies',
    label: 'Replies',
    icon: MessageCircle,
    status: 'core',
    group: 'reach',
    subGroup: 'email',
    description: 'Email replies and responses',
    module_key: 'reach',
  },
  {
    id: 'email_warmup',
    path: '/reach/outbound/email/warmup',
    label: 'Email WarmUp',
    icon: Flame,
    status: 'core',
    group: 'reach',
    subGroup: 'email',
    description: 'Monitor account health and warmup progress',
    module_key: 'reach',
  },
  {
    id: 'email_unsubscribers',
    path: '/reach/inbound/email/unsubscribers',
    label: 'Unsubscribers',
    icon: UserX,
    status: 'core',
    group: 'reach',
    subGroup: 'email',
    description: 'Unsubscribed contacts',
    module_key: 'reach',
  },
  {
    id: 'email_analytics',
    path: '/reach/email/analytics',
    label: 'Email Analytics',
    icon: BarChart3,
    status: 'core',
    group: 'optimization',
    subGroup: 'analytics',
    description: 'Email performance analytics',
    module_key: 'reach',
  },


  // ============================================
  // SMS OUTREACH
  // ============================================
  {
    id: 'sms_campaigns',
    path: '/reach/outbound/sms/campaigns',
    label: 'Campaigns',
    icon: MessageSquare,
    status: 'core',
    group: 'reach',
    subGroup: 'sms',
    description: 'SMS marketing campaigns',
    module_key: 'reach',
  },
  {
    id: 'sms_sequences',
    path: '/reach/outbound/sms/sequences',
    label: 'Sequences',
    icon: Zap,
    status: 'core',
    group: 'reach',
    subGroup: 'sms',
    description: 'Automated SMS sequences',
    module_key: 'reach',
  },
  {
    id: 'sms_templates',
    path: '/reach/sms-templates',
    label: 'SMS Templates',
    icon: FileTextIcon,
    status: 'core',
    group: 'reach',
    subGroup: 'sms',
    description: 'SMS templates library',
    module_key: 'reach',
  },
  {
    id: 'sms_replies',
    path: '/reach/inbound/sms/replies',
    label: 'Replies',
    icon: Inbox,
    status: 'core',
    group: 'reach',
    subGroup: 'sms',
    description: 'SMS replies and responses',
    module_key: 'reach',
  },
  {
    id: 'sms_unsubscribers',
    path: '/reach/inbound/sms/unsubscribers',
    label: 'Unsubscribers',
    icon: UserX,
    status: 'core',
    group: 'reach',
    subGroup: 'sms',
    description: 'SMS unsubscribed contacts',
    module_key: 'reach',
  },
  {
    id: 'sms_analytics',
    path: '/reach/sms/analytics',
    label: 'SMS Analytics',
    icon: BarChart3,
    status: 'core',
    group: 'optimization',
    subGroup: 'analytics',
    description: 'SMS performance analytics',
    module_key: 'reach',
  },

  // ============================================
  // CALLS OUTREACH
  // ============================================
  {
    id: 'calls_overview',
    path: '/reach/calls/overview',
    label: 'Overview',
    icon: LayoutDashboard,
    status: 'core',
    group: 'reach',
    subGroup: 'calls',
    description: 'Real-time call monitoring and metrics',
    module_key: 'reach',
  },
  {
    id: 'calls_campaigns',
    path: '/reach/outbound/calls/campaigns',
    label: 'Campaigns',
    icon: Phone,
    status: 'core',
    group: 'reach',
    subGroup: 'calls',
    description: 'Call campaigns',
    module_key: 'reach',
  },
  {
    id: 'calls_logs',
    path: '/reach/calls/logs',
    label: 'Call Logs',
    icon: Inbox,
    status: 'core',
    group: 'reach',
    subGroup: 'calls',
    description: 'Call history and logs',
    module_key: 'reach',
  },
  {
    id: 'calls_scripts',
    path: '/reach/calls/scripts',
    label: 'Call Scripts',
    icon: FileTextIcon,
    status: 'core',
    group: 'reach',
    subGroup: 'calls',
    description: 'Call scripts library',
    module_key: 'reach',
  },
  {
    id: 'calls_agents',
    path: '/reach/calls/agents',
    label: 'Call Team',
    icon: Users,
    status: 'core',
    group: 'reach',
    subGroup: 'calls',
    description: 'Call center team members',
    module_key: 'reach',
  },
  {
    id: 'calls_numbers',
    path: '/reach/calls/numbers',
    label: 'Phone Numbers',
    icon: Phone,
    status: 'core',
    group: 'reach',
    subGroup: 'calls',
    description: 'Phone number management, provisioning, and tracking',
    module_key: 'reach',
  },
  {
    id: 'calls_flows',
    path: '/reach/calls/ivr',
    label: 'IVR',
    icon: Workflow,
    status: 'core',
    group: 'reach',
    subGroup: 'calls',
    description: 'IVR and call routing configuration',
    module_key: 'reach',
  },
  {
    id: 'calls_pools',
    path: '/reach/calls/pools',
    label: 'Number Pools',
    icon: Target,
    status: 'core',
    group: 'reach',
    subGroup: 'calls',
    description: 'Dynamic Number Insertion pools for call tracking',
    module_key: 'reach',
  },
  {
    id: 'calls_analytics',
    path: '/reach/calls/analytics',
    label: 'Call Analytics',
    icon: BarChart3,
    status: 'core',
    group: 'optimization',
    subGroup: 'analytics',
    description: 'Comprehensive call analytics and trends',
    module_key: 'reach',
  },
  {
    id: 'calls_inbox',
    path: '/reach/calls/inbox',
    label: 'Inbox',
    icon: Inbox,
    status: 'hidden',
    group: 'reach',
    subGroup: 'calls',
    description: 'Manage incoming calls, voicemails, and callbacks',
    module_key: 'reach',
  },
  {
    id: 'calls_live_monitor',
    path: '/reach/calls/live',
    label: 'Live Monitor',
    icon: Monitor,
    status: 'hidden',
    group: 'reach',
    subGroup: 'calls',
    description: 'Real-time call and agent monitoring dashboard',
    module_key: 'reach',
  },

  {
    id: 'sms_logs',
    path: '/reach/inbound/sms/logs',
    label: 'SMS Logs',
    icon: MessageSquare,
    status: 'core',
    group: 'reach',
    subGroup: 'sms',
    description: 'Direct SMS messaging logs',
    module_key: 'reach',
  },
  {
    id: 'channels',
    path: '/reach/channels',
    label: 'Messaging Channels',
    icon: MessageCircle,
    status: 'core',
    group: 'reach',
    subGroup: 'channels',
    description: 'WhatsApp, Messenger, LinkedIn settings',
    module_key: 'reach',
  },
  {
    id: 'whatsapp',
    path: '/reach/inbound/channels/whatsapp',
    label: 'WhatsApp',
    icon: MessageCircle,
    status: 'hidden',
    group: 'reach',
    subGroup: 'channels',
    description: 'WhatsApp Business messaging',
    module_key: 'reach',
  },
  {
    id: 'messenger',
    path: '/reach/inbound/channels/messenger',
    label: 'Messenger',
    icon: MessageSquare,
    status: 'hidden',
    group: 'reach',
    subGroup: 'channels',
    description: 'Facebook Messenger',
    module_key: 'reach',
  },
  {
    id: 'linkedin',
    path: '/reach/inbound/channels/linkedin',
    label: 'LinkedIn',
    icon: Users,
    status: 'hidden',
    group: 'reach',
    subGroup: 'channels',
    description: 'LinkedIn outreach tasks',
    module_key: 'reach',
  },

  // ============================================
  // ENGAGEMENT (Forms, Landing Pages, Proposals)
  // ============================================
  {
    id: 'form_dashboard',
    path: '/forms',
    label: 'Dashboard',
    icon: LayoutDashboard,
    status: 'hidden', // Hidden - redirects to /forms/forms
    group: 'growth',
    subGroup: 'engagement',
    description: 'Forms dashboard (redirects to forms list)',
    module_key: 'outreach',
  },
  {
    id: 'forms',
    path: '/forms',
    label: 'Forms',
    icon: ClipboardList,
    status: 'core',
    group: 'growth',
    subGroup: 'engagement',
    description: 'Manage all forms',
    module_key: 'outreach',
  },
  {
    id: 'form_templates',
    path: '/forms/templates',
    label: 'Form Templates',
    icon: Layout,
    status: 'hidden', // Hidden - accessible via /forms tabs
    group: 'growth',
    subGroup: 'engagement',
    description: 'Pre-built form templates for quick creation',
    module_key: 'outreach',
  },
  {
    id: 'form_submissions',
    path: '/forms/submissions',
    label: 'Submissions',
    icon: Inbox,
    status: 'hidden', // Hidden - accessible via /forms tabs
    group: 'growth',
    subGroup: 'engagement',
    description: 'Form submissions',
    module_key: 'outreach',
  },
  {
    id: 'form_analytics',
    path: '/forms/analytics',
    label: 'Form Analytics',
    icon: BarChart3,
    status: 'core',
    group: 'optimization',
    subGroup: 'analytics',
    description: 'Form performance analytics',
    module_key: 'outreach',
  },
  {
    id: 'form_archive',
    path: '/archive',
    label: 'Archive',
    icon: FolderOpen,
    status: 'hidden', // Redirects to global Archive
    group: 'growth',
    subGroup: 'engagement',
    description: 'Archived forms (redirects to global Archive)',
    module_key: 'outreach',
  },
  {
    id: 'form_trash',
    path: '/trash',
    label: 'Trash',
    icon: AlertCircle,
    status: 'hidden', // Redirects to global Trash
    group: 'growth',
    subGroup: 'engagement',
    description: 'Deleted forms (redirects to global Trash)',
    module_key: 'outreach',
  },
  {
    id: 'form_users',
    path: '/forms/users',
    label: 'Users',
    icon: Users,
    status: 'hidden', // Hidden - belongs in Settings
    group: 'growth',
    subGroup: 'engagement',
    description: 'Form users (accessible via Settings)',
    module_key: 'outreach',
  },
  {
    id: 'form_webhooks',
    path: '/forms/webhooks',
    label: 'Webhooks',
    icon: Workflow,
    status: 'hidden', // Hidden - already in Settings > Integrations tab
    group: 'growth',
    subGroup: 'engagement',
    description: 'Form webhooks (accessible via Settings > Integrations)',
    module_key: 'outreach',
  },
  {
    id: 'form_brand',
    path: '/forms/brand',
    label: 'Brand',
    icon: Star,
    status: 'hidden', // Hidden - already in Settings > Branding tab
    group: 'growth',
    subGroup: 'engagement',
    description: 'Form branding (accessible via Settings > Branding)',
    module_key: 'outreach',
  },
  {
    id: 'form_domains',
    path: '/forms/domains',
    label: 'Domains',
    icon: Globe,
    status: 'hidden', // Hidden - belongs in Settings
    group: 'growth',
    subGroup: 'engagement',
    description: 'Form domains (accessible via Settings)',
    module_key: 'outreach',
  },
  {
    id: 'form_settings',
    path: '/settings#forms',
    label: 'Settings',
    icon: Settings,
    status: 'hidden',
    group: 'growth',
    subGroup: 'engagement',
    description: 'Form settings',
    module_key: 'outreach',
  },
  {
    id: 'webforms_settings',
    path: '/settings?tab=webforms',
    label: 'Web Forms Settings',
    icon: Settings,
    status: 'hidden',
    group: 'growth',
    subGroup: 'engagement',
    description: 'Configure web forms, notifications, and security',
  },
  {
    id: 'websites_legacy',
    path: '/websites',
    label: 'Websites',
    icon: Globe,
    status: 'core',
    group: 'growth',
    subGroup: 'websites',
    description: 'Manage all your websites in one place',
    module_key: 'sites',
  },
  {
    id: 'website_builder',
    path: '/websites/builder',
    label: 'Website Builder',
    icon: Layout,
    status: 'hidden',
    group: 'growth',
    subGroup: 'websites',
    description: 'Comprehensive website builder for all types of websites',
    module_key: 'sites',
  },
  {
    id: 'website_templates',
    path: '/websites/templates',
    label: 'Website Templates',
    icon: Layout,
    status: 'hidden',
    group: 'growth',
    subGroup: 'websites',
    description: 'Modern website templates for all businesses',
    module_key: 'sites',
  },
  {
    id: 'landing_pages_legacy',
    path: '/websites/landing-pages',
    label: 'Landing Pages',
    icon: Globe,
    status: 'core',
    group: 'growth',
    subGroup: 'websites',
    description: 'Landing page management',
    module_key: 'sites',
  },
  {
    id: 'landing_templates',
    path: '/websites/landing-pages/templates',
    label: 'Landing Templates',
    icon: Layout,
    status: 'hidden',
    group: 'growth',
    subGroup: 'websites',
    description: 'Landing page templates',
    module_key: 'sites',
  },


  {
    id: 'proposals',
    path: '/proposals',
    label: 'Proposals',
    icon: FileTextIcon,
    status: 'core',
    group: 'conversion',
    subGroup: 'proposals',
    description: 'Proposal management',
    module_key: 'outreach',
  },
  {
    id: 'proposals_templates',
    path: '/proposals/templates',
    label: 'Templates',
    icon: Layout,
    status: 'core',
    group: 'conversion',
    subGroup: 'proposals',
    description: 'Proposal templates',
    module_key: 'outreach',
  },
  {
    id: 'proposals_analytics',
    path: '/proposals/analytics',
    label: 'Proposal Analytics',
    icon: BarChart3,
    status: 'core',
    group: 'optimization',
    subGroup: 'analytics',
    description: 'Proposal analytics and reports',
    module_key: 'outreach',
  },
  {
    id: 'proposals_clients',
    path: '/contacts?view=proposals',
    label: 'Clients',
    icon: Users,
    status: 'core',
    group: 'conversion',
    subGroup: 'proposals',
    description: 'Client management',
    module_key: 'outreach',
  },
  {
    id: 'proposals_workflow',
    path: '/proposals/workflow',
    label: 'Workflow',
    icon: Workflow,
    status: 'hidden',
    group: 'conversion',
    subGroup: 'proposals',
    description: 'Approval workflow (accessible via Automations)',
    module_key: 'outreach',
  },
  {
    id: 'proposals_archive',
    path: '/archive',
    label: 'Archive',
    icon: Archive,
    status: 'hidden', // Redirects to global Archive
    group: 'conversion',
    subGroup: 'proposals',
    description: 'Archived proposals (redirects to global Archive)',
    module_key: 'outreach',
  },
  {
    id: 'proposals_integrations',
    path: '/proposals/integrations',
    label: 'Integrations',
    icon: Zap,
    status: 'hidden',
    group: 'conversion',
    subGroup: 'proposals',
    description: 'External integrations (accessible via Settings > Integrations)',
    module_key: 'outreach',
  },
  {
    id: 'proposals_settings',
    path: '/settings#proposals',
    label: 'Settings',
    icon: Settings,
    status: 'hidden',
    group: 'conversion',
    subGroup: 'proposals',
    description: 'Proposal settings',
    module_key: 'outreach',
  },

  // ============================================
  // AUTOMATION
  // ============================================
  {
    id: 'flow_builder',
    path: '/automations/flows',
    label: 'Flows',
    icon: Workflow,
    status: 'hidden', // Consolidated into /automations
    group: 'optimization',
    subGroup: 'automation',
    description: 'Visual automation flow builder',
    module_key: 'outreach',
  },
  {
    id: 'automations',
    path: '/automations',
    label: 'Automations',
    icon: Zap,
    status: 'core',
    group: 'optimization',
    subGroup: 'automation',
    description: 'Automation rules and triggers',
    module_key: 'outreach',
  },
  {
    id: 'automation_recipes',
    path: '/automations/library',
    label: 'Workflows',
    icon: BookOpen,
    status: 'hidden', // Consolidated into /automations
    group: 'optimization',
    subGroup: 'automation',
    description: 'Pre-built workflows',
    module_key: 'outreach',
  },
  {
    id: 'ab_testing',
    path: '/automations/ab-testing',
    label: 'A/B Testing',
    icon: FlaskConical,
    status: 'core',
    group: 'optimization',
    subGroup: 'automation',
    description: 'Split testing experiments',
    module_key: 'outreach',
  },
  {
    id: 'sentiment_config',
    path: '/automations/sentiment',
    label: 'Sentiment Analysis',
    icon: Brain,
    status: 'core',
    group: 'optimization',
    subGroup: 'automation',
    description: 'Configure AI sentiment analysis for responses',
    module_key: 'outreach',
  },
  {
    id: 'advanced_automation_builder',
    path: '/automations/advanced-builder',
    label: 'Advanced Builder',
    icon: Workflow,
    status: 'hidden',
    group: 'optimization',
    subGroup: 'automation',
    description: 'Visual automation builder with complex logic and branching',
    module_key: 'outreach',
  },

  // ============================================
  // CRM
  // ============================================
  {
    id: 'crm_dashboard',
    path: '/crm',
    label: 'CRM Overview', // Renamed from "Dashboard" to avoid confusion
    icon: TrendingUp,
    status: 'core',
    group: 'conversion',
    subGroup: 'crm',
    description: 'CRM dashboard and pipeline overview',
    module_key: 'crm',
  },
  {
    id: 'crm_deals',
    path: '/crm/deals',
    label: 'Pipeline',
    icon: Kanban,
    status: 'core',
    group: 'conversion',
    subGroup: 'crm',
    description: 'Sales pipeline and deal management',
    module_key: 'crm',
  },
  {
    id: 'crm_leads',
    path: '/crm/leads',
    label: 'Leads (Legacy)',
    icon: Users,
    status: 'hidden',
    group: 'conversion',
    subGroup: 'crm',
    description: 'Legacy lead management (redirects to Deals)',
    module_key: 'crm',
  },
  {
    id: 'crm_pipeline',
    path: '/crm/pipeline',
    label: 'Pipeline (Legacy)',
    icon: Kanban,
    status: 'hidden',
    group: 'conversion',
    subGroup: 'crm',
    description: 'Team building and events',
    module_key: 'culture',
  },
  {
    id: 'culture_analytics',
    path: '/culture/analytics',
    label: 'Culture Analytics',
    icon: BarChart3,
    status: 'core',
    group: 'optimization',
    subGroup: 'analytics',
    description: 'Employee sentiment and engagement',
    module_key: 'culture',
  },
  {
    id: 'lead_scoring',
    path: '/crm/lead-scoring',
    label: 'Lead Scoring',
    icon: Target,
    status: 'core',
    group: 'conversion',
    subGroup: 'crm',
    description: 'Rule-based lead qualification and scoring',
    module_key: 'crm',
  },
  {
    id: 'crm_tasks',
    path: '/crm/tasks',
    label: 'Tasks',
    icon: CheckCircle,
    status: 'hidden', // Redirects to global /tasks
    group: 'conversion',
    subGroup: 'crm',
    description: 'Redirects to global Tasks page',
    module_key: 'crm',
  },

  {
    id: 'crm_analytics',
    path: '/crm/analytics',
    label: 'CRM Analytics',
    icon: BarChart3,
    status: 'core',
    group: 'optimization',
    subGroup: 'analytics',
    description: 'CRM analytics and reports',
    module_key: 'crm',
  },
  {
    id: 'crm_forecast',
    path: '/crm/forecast',
    label: 'Forecast',
    icon: LineChart,
    status: 'core',
    group: 'conversion',
    subGroup: 'crm',
    description: 'Sales forecasting and projections',
    module_key: 'crm',
  },
  {
    id: 'crm_playbooks',
    path: '/crm/playbooks',
    label: 'Playbooks',
    icon: BookOpen,
    status: 'core',
    group: 'conversion',
    subGroup: 'crm',
    description: 'Sales playbooks and guides',
    module_key: 'crm',
  },
  {
    id: 'crm_goals',
    path: '/crm/goals',
    label: 'Goals',
    icon: Target,
    status: 'core',
    group: 'conversion',
    subGroup: 'crm',
    description: 'Sales goals and targets',
    module_key: 'crm',
  },
  {
    id: 'crm_settings',
    path: '/settings#crm',
    label: 'Settings',
    icon: Settings,
    status: 'hidden',
    group: 'conversion',
    subGroup: 'crm',
    description: 'CRM configuration and settings',
    module_key: 'crm',
  },


  // ============================================
  // PROJECT MANAGEMENT
  // ============================================
  {
    id: 'projects',
    path: '/projects',
    label: 'Overview',
    icon: Layout,
    status: 'core',
    group: 'delivery',
    subGroup: 'projects',
    description: 'Project management with Kanban boards',
    module_key: 'operations',
  },
  {
    id: 'projects_my_tasks',
    path: '/projects/tasks',
    label: 'My Tasks',
    icon: CheckCircle2,
    status: 'core',
    group: 'delivery',
    subGroup: 'projects',
    description: 'Personal task backlog across all projects',
    module_key: 'operations',
  },
  {
    id: 'projects_templates',
    path: '/projects/templates',
    label: 'Templates',
    icon: FolderOpen,
    status: 'core',
    group: 'delivery',
    subGroup: 'projects',
    description: 'Pre-configured project workflows',
    module_key: 'operations',
  },
  {
    id: 'projects_analytics',
    path: '/projects/analytics',
    label: 'Project Analytics',
    icon: BarChart3,
    status: 'core',
    group: 'optimization',
    subGroup: 'analytics',
    description: 'Project performance insights',
    module_key: 'operations',
  },



  // ============================================
  // ECOMMERCE
  // ============================================
  {
    id: 'ecommerce_dashboard',
    path: '/ecommerce',
    label: 'Store Integration',
    icon: ShoppingCart,
    status: 'core',
    group: 'ecommerce',
    subGroup: 'ecommerce',
    description: 'E-commerce store integrations',
    module_key: 'ecommerce',
  },
  {
    id: 'ai_analytics',
    path: '/ai/analytics',
    label: 'AI Analytics',
    icon: BarChart3,
    status: 'core',
    group: 'optimization',
    subGroup: 'analytics',
    description: 'Agent performance metrics',
    module_key: 'ai-agents',
  },
  {
    id: 'ecommerce_products',
    path: '/ecommerce/products',
    label: 'Products',
    icon: Package,
    status: 'core',
    group: 'ecommerce',
    subGroup: 'ecommerce',
    description: 'Product catalog management',
    module_key: 'ecommerce',
  },
  {
    id: 'ecommerce_inventory',
    path: '/ecommerce/inventory',
    label: 'Inventory',
    icon: Package,
    status: 'core',
    group: 'ecommerce',
    subGroup: 'ecommerce',
    description: 'Stock levels and warehouse management',
    module_key: 'ecommerce',
  },
  {
    id: 'ecommerce_orders',
    path: '/ecommerce/orders',
    label: 'Orders',
    icon: ShoppingCart,
    status: 'core',
    group: 'ecommerce',
    subGroup: 'ecommerce',
    description: 'Order management and fulfillment',
    module_key: 'ecommerce',
  },
  {
    id: 'ecommerce_coupons',
    path: '/ecommerce/coupons',
    label: 'Coupons',
    icon: Ticket,
    status: 'core',
    group: 'ecommerce',
    subGroup: 'ecommerce',
    description: 'Discounts and promotional codes',
    module_key: 'ecommerce',
  },
  {
    id: 'ecommerce_shipping',
    path: '/ecommerce/shipping',
    label: 'Shipping',
    icon: Truck,
    status: 'core',
    group: 'ecommerce',
    subGroup: 'ecommerce',
    description: 'Carrier integrations and fulfillment',
    module_key: 'ecommerce',
  },
  {
    id: 'ecommerce_collections',
    path: '/ecommerce/collections',
    label: 'Collections',
    icon: Layers,
    status: 'core',
    group: 'ecommerce',
    subGroup: 'ecommerce',
    description: 'Product categories and groups',
    module_key: 'ecommerce',
  },
  {
    id: 'ecommerce_analytics',
    path: '/ecommerce/analytics',
    label: 'Store Analytics',
    icon: BarChart3,
    status: 'core',
    group: 'optimization',
    subGroup: 'analytics',
    description: 'Sales and order analytics',
    module_key: 'ecommerce',
  },


  // ============================================
  // CONTACTS (Core)
  // ============================================
  {
    id: 'contacts_all',
    path: '/contacts',
    label: 'All Contacts',
    icon: Users,
    status: 'core',
    group: 'clients',
    subGroup: 'contacts',
    description: 'Unified contact management',
    module_key: 'crm',
  },
  {
    id: 'companies',
    path: '/contacts/companies',
    label: 'Companies',
    icon: Building2,
    status: 'core',
    group: 'clients',
    subGroup: 'contacts',
    description: 'Company/organization management',
    module_key: 'crm',
  },
  {
    id: 'lists',
    path: '/contacts/lists',
    label: 'Lists',
    icon: List,
    status: 'core',
    group: 'clients',
    subGroup: 'contacts',
    description: 'Contact lists',
    module_key: 'crm',
  },
  {
    id: 'courses_analytics',
    path: '/courses/analytics',
    label: 'LMS Analytics',
    icon: BarChart3,
    status: 'core',
    group: 'optimization',
    subGroup: 'analytics',
    description: 'Student progress and course metrics',
    module_key: 'lms',
  },
  {
    id: 'segments',
    path: '/contacts/segments',
    label: 'Segments',
    icon: Filter,
    status: 'core',
    group: 'clients',
    subGroup: 'contacts',
    description: 'Dynamic contact segments',
    module_key: 'crm',
  },
  {
    id: 'client_portal',
    path: '/portal/client',
    label: 'Client Portal',
    icon: Users,
    status: 'core',
    group: 'clients',
    subGroup: 'portal',
    description: 'Self-service portal for clients',
    module_key: 'operations',
  },

  // ============================================
  // SALES ENABLEMENT SUITE (Hidden per user request)
  // ============================================
  {
    id: 'sales_enablement_dashboard',
    path: '/sales/enablement',
    label: 'Sales Enablement',
    icon: LayoutDashboard,
    status: 'core',
    group: 'sales_enablement',
    description: 'Sales enablement hub and metrics',
    module_key: 'sales',
  },
  {
    id: 'sales_content_library',
    path: '/sales/content',
    label: 'Content Library',
    icon: FolderOpen,
    status: 'core',
    group: 'sales_enablement',
    description: 'Sales content management and analytics',
    module_key: 'sales',
  },
  {
    id: 'sales_playbooks',
    path: '/sales/playbooks',
    label: 'Playbooks',
    icon: BookOpen,
    status: 'core',
    group: 'sales_enablement',
    description: 'Sales playbooks and guides',
    module_key: 'sales',
  },
  {
    id: 'deal_rooms',
    path: '/sales/deal-rooms',
    label: 'Deal Rooms',
    icon: Users,
    status: 'core',
    group: 'sales_enablement',
    description: 'Digital sales rooms for buyers',
    module_key: 'sales',
  },
  {
    id: 'battle_cards',
    path: '/sales/battle-cards',
    label: 'Battle Cards',
    icon: Crosshair,
    status: 'core',
    group: 'sales_enablement',
    description: 'Competitive intelligence cards',
    module_key: 'sales',
  },
  {
    id: 'sales_training',
    path: '/sales/training',
    label: 'Training',
    icon: GraduationCap,
    status: 'core',
    group: 'sales_enablement',
    description: 'Sales training and certification',
    module_key: 'sales',
  },

  {
    id: 'enablement_analytics',
    path: '/sales/analytics',
    label: 'Enablement Analytics',
    icon: LineChart,
    status: 'core',
    group: 'optimization',
    subGroup: 'analytics',
    description: 'Sales enablement ROI metrics',
    module_key: 'sales',
  },

  // ============================================
  // TASKS & SALES
  // ============================================
  {
    id: 'tasks',
    path: '/tasks',
    label: "Tasks & Follow-ups",
    icon: CheckSquare,
    status: 'hidden',
    group: 'sales',
    description: 'Daily task list and actions',
  },
  {
    id: 'reputation_overview',
    path: '/reputation/overview',
    label: 'Overview',
    icon: BarChart3,
    status: 'core',
    group: 'retention',
    subGroup: 'reputation',
    description: 'Reputation overview and analytics',
    module_key: 'reputation',
  },
  {
    id: 'reputation_requests',
    path: '/reputation/requests',
    label: 'Requests',
    icon: Send,
    status: 'core',
    group: 'retention',
    subGroup: 'reputation',
    description: 'Manage review requests',
    module_key: 'reputation',
  },
  {
    id: 'reputation_reviews',
    path: '/reputation/reviews',
    label: 'Reviews',
    icon: Star,
    status: 'core',
    group: 'retention',
    subGroup: 'reputation',
    description: 'View and manage reviews',
    module_key: 'reputation',
  },
  {
    id: 'reputation_widgets',
    path: '/reputation/widgets',
    label: 'Widgets',
    icon: Sparkles,
    status: 'core',
    group: 'retention',
    subGroup: 'reputation',
    description: 'Create and manage review widgets',
    module_key: 'reputation',
  },

  {
    id: 'reputation_settings',
    path: '/reputation/settings',
    label: 'Settings',
    icon: Settings,
    status: 'hidden',
    group: 'retention',
    subGroup: 'reputation',
    description: 'Configure reputation settings',
    module_key: 'reputation',
  },
  {
    id: 'automation_analytics',
    path: '/automations/analytics',
    label: 'Automation Analytics',
    icon: BarChart3,
    status: 'core',
    group: 'optimization',
    subGroup: 'analytics',
    description: 'Workflow performance and efficiency',
    module_key: 'automation',
  },
  {
    id: 'reputation_analytics',
    path: '/reputation/analytics',
    label: 'Reputation Analytics',
    icon: BarChart3,
    status: 'core',
    group: 'optimization',
    subGroup: 'analytics',
    description: 'Reviews and sentiment tracking',
    module_key: 'reputation',
  },


  // ============================================
  // OPERATIONS
  // ============================================
  {
    id: 'insights',
    path: '/operations/insights',
    label: 'Insights',
    icon: BarChart3,
    status: 'core',
    group: 'optimization',
    subGroup: 'analytics',
    description: 'Business analytics and performance metrics',
    module_key: 'operations',
  },
  {
    id: 'marketing_analytics',
    path: '/marketing/analytics',
    label: 'Marketing Analytics',
    icon: BarChart3,
    status: 'core',
    group: 'optimization',
    subGroup: 'analytics',
    description: 'Campaign performance analytics',
    module_key: 'growth',
  },
  {
    id: 'agency',
    path: '/operations/agency',
    label: 'Client Accounts',
    icon: Building2,
    status: 'core',
    group: 'operations',
    description: 'Agency client management',
    module_key: 'operations',
  },
  {
    id: 'industry_settings',
    path: '/operations/industry-settings',
    label: 'Industry Settings',
    icon: Settings,
    status: 'hidden',
    group: 'operations',
    description: 'Industry-specific configuration',
    module_key: 'operations',
  },
  {
    id: 'services',
    path: '/operations/services',
    label: 'Services',
    icon: Package,
    status: 'core',
    group: 'delivery',
    subGroup: 'operations',
    description: 'Service catalog management',
    module_key: 'operations',
  },
  {
    id: 'jobs',
    path: '/operations/jobs',
    label: 'Jobs/Dispatch',
    icon: Wrench,
    status: 'core',
    group: 'delivery',
    subGroup: 'operations',
    description: 'Job scheduling and dispatch',
    module_key: 'operations',
  },

  {
    id: 'requests',
    path: '/operations/requests',
    label: 'Requests',
    icon: FileTextIcon,
    status: 'core',
    group: 'delivery',
    subGroup: 'operations',
    description: 'Customer service requests',
    module_key: 'operations',
  },
  {
    id: 'referrals',
    path: '/operations/referrals',
    label: 'Referrals',
    icon: Star,
    status: 'core',
    group: 'delivery',
    subGroup: 'operations',
    description: 'Referral program management',
    module_key: 'operations',
  },
  {
    id: 'recalls',
    path: '/operations/recalls',
    label: 'Recalls',
    icon: RefreshCw,
    status: 'core',
    group: 'delivery',
    subGroup: 'operations',
    description: 'Service recall management',
    module_key: 'operations',
  },
  {
    id: 'staff',
    path: '/operations/staff',
    label: 'Staff Members',
    icon: UserCheck,
    status: 'core',
    group: 'operations',
    description: 'Staff and team management',
    module_key: 'operations',
  },
  {
    id: 'intake_forms',
    path: '/forms/intake',
    label: 'Intake Forms',
    icon: ClipboardList,
    status: 'hidden', // Feature removed as it can be handled by regular forms
    group: 'growth',
    subGroup: 'engagement',
    description: 'Client intake forms',
    module_key: 'outreach',
  },
  {
    id: 'playbooks',
    path: '/automations?tab=playbooks',
    label: 'Playbooks',
    icon: Play,
    status: 'core',
    group: 'optimization',
    subGroup: 'automation',
    description: 'Sales and service playbooks',
    module_key: 'outreach',
  },
  {
    id: 'payments',
    path: '/operations/payments',
    label: 'Payments & Invoicing (Legacy)',
    icon: DollarSign,
    status: 'hidden',
    group: 'operations',
    description: 'Payment processing and invoicing',
    module_key: 'operations',
  },
  {
    id: 'appointments',
    path: '/scheduling/appointments',
    label: 'Appointments',
    icon: Calendar,
    status: 'core',
    group: 'delivery',
    subGroup: 'scheduling',
    description: 'Appointment scheduling',
    module_key: 'operations',
  },
  {
    id: 'field_service',
    path: '/operations/field-service',
    label: 'Field Service',
    icon: Wrench,
    status: 'core',
    group: 'delivery',
    subGroup: 'field_service',
    description: 'Field technician jobs, dispatch, and mobile job management',
    module_key: 'operations',
  },
  {
    id: 'field_service_analytics',
    path: '/operations/field-service/analytics',
    label: 'Field Service Analytics',
    icon: BarChart3,
    status: 'core',
    group: 'optimization',
    subGroup: 'analytics',
    description: 'Technician and job performance metrics',
    module_key: 'operations',
  },

  {
    id: 'reports',
    path: '/reports',
    label: 'Sales Reports',
    icon: BarChart3,
    status: 'core',
    group: 'optimization',
    subGroup: 'analytics',
    description: 'Comprehensive reporting',
  },

  // ============================================
  // FINANCE
  // ============================================
  {
    id: 'finance_overview',
    path: '/finance/overview',
    label: 'Overview',
    icon: LayoutDashboard,
    status: 'core',
    group: 'optimization',
    subGroup: 'finance',
    description: 'Financial overview and health',
    module_key: 'finance',
  },
  {
    id: 'estimates',
    path: '/finance/estimates',
    label: 'Estimates/Quotes',
    icon: FileTextIcon,
    status: 'core',
    group: 'conversion',
    subGroup: 'quotes',
    description: 'Estimate and quote management',
    module_key: 'finance',
  },
  {
    id: 'finance_analytics',
    path: '/finance/analytics',
    label: 'Finance Analytics',
    icon: BarChart3,
    status: 'core',
    group: 'optimization',
    subGroup: 'analytics',
    description: 'Financial performance and cashflow analysis',
    module_key: 'finance',
  },
  {
    id: 'invoices',
    path: '/finance/invoices',
    label: 'Invoices',
    icon: FileTextIcon,
    status: 'core',
    group: 'optimization',
    subGroup: 'finance',
    description: 'Invoice management',
    module_key: 'finance',
  },
  {
    id: 'products',
    path: '/finance/products',
    label: 'Products & Services',
    icon: Package,
    status: 'core',
    group: 'optimization',
    subGroup: 'finance',
    description: 'Product and service catalog',
    module_key: 'finance',
  },
  {
    id: 'transactions',
    path: '/finance/transactions',
    label: 'Transactions',
    icon: CreditCard,
    status: 'core',
    group: 'optimization',
    subGroup: 'finance',
    description: 'View and manage transactions',
    module_key: 'finance',
  },
  {
    id: 'estimates_analytics',
    path: '/finance/estimates/analytics',
    label: 'Estimate Analytics',
    icon: BarChart3,
    status: 'core',
    group: 'optimization',
    subGroup: 'analytics',
    description: 'Estimate pipeline and conversion metrics',
    module_key: 'finance',
  },
  {
    id: 'subscriptions',
    path: '/finance/subscriptions',
    label: 'Subscriptions',
    icon: RefreshCw,
    status: 'core',
    group: 'optimization',
    subGroup: 'finance',
    description: 'Recurring billing and subscriptions',
    module_key: 'finance',
  },
  {
    id: 'expenses',
    path: '/finance/expenses',
    label: 'Expenses',
    icon: DollarSign,
    status: 'core',
    group: 'optimization',
    subGroup: 'finance',
    description: 'Track and manage business expenses',
    module_key: 'finance',
  },
  {
    id: 'payroll',
    path: '/finance/payroll',
    label: 'Payroll',
    icon: Wallet,
    status: 'core',
    group: 'optimization',
    subGroup: 'finance',
    description: 'Payroll management',
    module_key: 'finance',
  },
  {
    id: 'commissions',
    path: '/finance/commissions',
    label: 'Commissions',
    icon: TrendingUp,
    status: 'core',
    group: 'optimization',
    subGroup: 'finance',
    description: 'Manage commission plans and track earnings',
    module_key: 'finance',
  },
  {
    id: 'dunning',
    path: '/finance/payment-reminders',
    label: 'Payment Reminders',
    icon: BellRing,
    status: 'core',
    group: 'optimization',
    subGroup: 'finance',
    description: 'Automated payment reminder schedules',
    module_key: 'finance',
  },
  {
    id: 'finance_integrations',
    path: '/finance/integrations',
    label: 'Integrations',
    icon: Link2,
    status: 'core',
    group: 'optimization',
    subGroup: 'finance',
    description: 'Finance integrations (QuickBooks, FreshBooks, etc.)',
    module_key: 'finance',
  },
  {
    id: 'finance_settings',
    path: '/settings?tab=finance',
    label: 'Settings',
    icon: Settings,
    status: 'hidden',
    group: 'optimization',
    subGroup: 'finance',
    description: 'Finance settings and gateways',
    module_key: 'finance',
  },

  // ============================================
  // HELPDESK
  // ============================================
  {
    id: 'helpdesk',
    path: '/helpdesk',
    label: 'Helpdesk',
    icon: MessageSquare,
    status: 'core',
    group: 'retention',
    subGroup: 'helpdesk',
    description: 'Customer support tickets & knowledge base',
    module_key: 'helpdesk',
  },
  {
    id: 'helpdesk_tickets',
    path: '/helpdesk/tickets',
    label: 'Tickets',
    icon: Inbox,
    status: 'core',
    group: 'retention',
    subGroup: 'helpdesk',
    description: 'Ticket management and inbox',
    module_key: 'helpdesk',
  },

  // ============================================
  // HR & RECRUITMENT
  // ============================================
  {
    id: 'hr_recruitment',
    path: '/hr/recruitment',
    label: 'Hiring & Training',
    icon: UserPlus,
    status: 'core',
    group: 'optimization',
    subGroup: 'hr',
    description: 'Recruitment pipeline and job openings',
    module_key: 'hr',
  },
  {
    id: 'hr_scheduling',
    path: '/hr/scheduling',
    label: 'Staff Scheduling',
    icon: Calendar,
    status: 'core',
    group: 'optimization',
    subGroup: 'hr',
    description: 'Shift management and rosters',
    module_key: 'hr',
  },
  {
    id: 'hr_profile',
    path: '/hr/me',
    label: 'My Profile',
    icon: User,
    status: 'core',
    group: 'optimization',
    subGroup: 'hr',
    description: 'Personal employee profile and documents',
    module_key: 'hr',
  },
  {
    id: 'helpdesk_kb',
    path: '/helpdesk/help-center',
    label: 'Help Center',
    icon: BookOpen,
    status: 'core',
    group: 'retention',
    subGroup: 'helpdesk',
    description: 'Help center articles and categories',
    module_key: 'helpdesk',
  },
  {
    id: 'helpdesk_settings',
    path: '/settings?tab=helpdesk',
    label: 'Helpdesk Settings',
    icon: UserCog,
    status: 'hidden',
    group: 'retention',
    subGroup: 'helpdesk',
    description: 'Configure helpdesk behavior',
    module_key: 'helpdesk',
  },
  {
    id: 'helpdesk_reports',
    path: '/helpdesk/reports',
    label: 'Helpdesk Reports',
    icon: BarChart3,
    status: 'core',
    group: 'optimization',
    subGroup: 'analytics',
    description: 'Helpdesk performance insights',
    module_key: 'helpdesk',
  },

  // ============================================
  // ADMIN
  // ============================================
  {
    id: 'settings',
    path: '/settings',
    label: 'Settings',
    icon: Settings,
    status: 'core',
    group: 'optimization',
    subGroup: 'admin',
    description: 'Application settings',
  },
  {
    id: 'integrations',
    path: '/settings#integrations',
    label: 'Integrations',
    icon: Link2,
    status: 'core',
    group: 'optimization',
    subGroup: 'admin',
    description: 'Connect external services and manage webhooks',
  },
  {
    id: 'agency_users',
    path: '/agency/users',
    label: 'Users',
    icon: UserCog,
    status: 'core',
    group: 'optimization',
    subGroup: 'admin',
    description: 'User management',
  },
  {
    id: 'audit_log',
    path: '/admin/audit-log',
    label: 'Audit Log',
    icon: FileTextIcon,
    status: 'hidden',
    group: 'optimization',
    subGroup: 'admin',
    description: 'Workspace audit trail',
  },
  {
    id: 'apps',
    path: '/apps',
    label: 'Apps',
    icon: Package,
    status: 'hidden',
    group: 'optimization',
    subGroup: 'admin',
    description: 'Manage installed apps and modules',
  },

  // ============================================
  // ADVANCED TOOLS
  // ============================================

  {
    id: 'advanced_reporting',
    path: '/reports/advanced',
    label: 'Advanced Reporting',
    icon: PieChart,
    status: 'core',
    group: 'optimization',
    subGroup: 'analytics',
    description: 'Advanced analytics and custom report builder',
  },
  {
    id: 'client_portal',
    path: '/portal/client',
    label: 'Client Portal',
    icon: Users,
    status: 'core',
    group: 'operations',
    description: 'Self-service portal for clients',
    module_key: 'operations',
  },
  {
    id: 'funnels_legacy',
    path: '/funnels',
    label: 'Funnels',
    icon: Layers,
    status: 'hidden', // Use the one in marketing group
    group: 'marketing',
    description: 'Build and manage sales funnels',
    module_key: 'marketing',
  },
  {
    id: 'memberships_legacy',
    path: '/memberships',
    label: 'Memberships',
    icon: Users,
    status: 'hidden', // Use the one in marketing group
    group: 'marketing',
    description: 'Manage membership programs and subscriptions',
    module_key: 'marketing',
  },
  {
    id: 'certificates_legacy',
    path: '/certificates',
    label: 'Certificates',
    icon: Award,
    status: 'hidden', // Use the one in marketing group
    group: 'marketing',
    description: 'Manage course certificates',
    module_key: 'marketing',
  },
  {
    id: 'calendars',
    path: '/scheduling/calendars',
    label: 'Calendars',
    icon: Calendar,
    status: 'core',
    group: 'delivery',
    subGroup: 'scheduling',
    description: 'Manage booking calendars and availability',
    module_key: 'operations',
  },
  {
    id: 'booking_pages',
    path: '/scheduling/booking-pages',
    label: 'Booking Pages',
    icon: Globe,
    status: 'core',
    group: 'delivery',
    subGroup: 'scheduling',
    description: 'Create shareable scheduling pages',
    module_key: 'operations',
  },
  {
    id: 'affiliates_legacy',
    path: '/affiliates',
    label: 'Affiliate Program',
    icon: Gift,
    status: 'hidden', // Use the one in marketing group
    group: 'marketing',
    description: 'Manage affiliate partners and payouts',
    module_key: 'growth',
  },


  // ============================================
  // MARKETING SUITE
  // ============================================

  // On-Page SEO
  {
    id: 'seo_dashboard',
    path: '/marketing/seo/dashboard',
    label: 'SEO Dashboard',
    icon: LayoutDashboard,
    status: 'core',
    group: 'growth',
    subGroup: 'seo',
    description: 'Overview of all SEO performance',
    module_key: 'marketing',
  },
  {
    id: 'seo_audit',
    path: '/marketing/seo/audit',
    label: 'Site Audit',
    icon: ClipboardList,
    status: 'core',
    group: 'growth',
    subGroup: 'seo',
    description: 'Technical SEO audits',
    module_key: 'marketing',
  },
  {
    id: 'seo_keywords',
    path: '/marketing/seo/keywords',
    label: 'Keywords',
    icon: Search,
    status: 'core',
    group: 'growth',
    subGroup: 'seo',
    description: 'Keyword research, tracking, gap analysis, and clustering',
    module_key: 'marketing',
  },
  {
    id: 'seo_keyword_gap',
    path: '/marketing/seo/keyword-gap',
    label: 'Keyword Gap',
    icon: Crosshair,
    status: 'hidden',
    group: 'growth',
    subGroup: 'seo',
    description: 'Compare keywords with competitors',
    module_key: 'marketing',
  },
  {
    id: 'seo_clustering',
    path: '/marketing/seo/clustering',
    label: 'Clustering',
    icon: Layers,
    status: 'hidden',
    group: 'growth',
    subGroup: 'seo',
    description: 'Group keywords into clusters',
    module_key: 'marketing',
  },
  {
    id: 'seo_serp',
    path: '/marketing/seo/serp',
    label: 'SERP Analysis',
    icon: Eye,
    status: 'core',
    group: 'growth',
    subGroup: 'seo',
    description: 'Analyze search engine results',
    module_key: 'marketing',
  },
  {
    id: 'seo_content',
    path: '/marketing/seo/content',
    label: 'Content Optimization',
    icon: FileTextIcon,
    status: 'core',
    group: 'growth',
    subGroup: 'seo',
    description: 'Optimize content for search',
    module_key: 'marketing',
  },
  {
    id: 'seo_reports',
    path: '/marketing/seo/reports',
    label: 'SEO Reports',
    icon: BarChart3,
    status: 'core',
    group: 'optimization',
    subGroup: 'analytics',
    description: 'SEO performance reports',
    module_key: 'marketing',
  },

  // Off-Page SEO
  {
    id: 'listings',
    path: '/marketing/listings',
    label: 'Listings',
    icon: Globe,
    status: 'core',
    group: 'growth',
    subGroup: 'seo',
    description: 'Manage business listings',
    module_key: 'marketing',
  },
  {
    id: 'seo_backlinks',
    path: '/marketing/seo/backlinks',
    label: 'Backlinks',
    icon: Link2,
    status: 'core',
    group: 'growth',
    subGroup: 'seo',
    description: 'Backlink analysis and tracking',
    module_key: 'marketing',
  },
  {
    id: 'seo_competitors',
    path: '/marketing/seo/competitors',
    label: 'Competitors',
    icon: Target,
    status: 'hidden',
    group: 'growth',
    subGroup: 'seo',
    description: 'Competitor analysis',
    module_key: 'marketing',
  },

  // Advertising & Campaigns
  {
    id: 'ads_manager',
    path: '/marketing/ads',
    label: 'Ads Manager',
    icon: TrendingUp,
    status: 'core',
    group: 'growth',
    subGroup: 'marketing',
    description: 'Manage advertising campaigns across platforms',
    module_key: 'marketing',
  },
  {
    id: 'funnels',
    path: '/marketing/funnels',
    label: 'Funnels',
    icon: Layers,
    status: 'core',
    group: 'growth',
    subGroup: 'marketing',
    description: 'Build and manage sales funnels',
    module_key: 'marketing',
  },
  {
    id: 'qr_codes',
    path: '/marketing/qr-codes',
    label: 'QR Codes',
    icon: Image,
    status: 'core',
    group: 'growth',
    subGroup: 'marketing',
    description: 'Generate QR codes for booking, payments, and reviews',
    module_key: 'marketing',
  },

  // Social Media Management
  {
    id: 'social_scheduler',
    path: '/marketing/social',
    label: 'Social Planner',
    icon: MessageCircle,
    status: 'core',
    group: 'growth',
    subGroup: 'marketing',
    description: 'Schedule and manage social media posts',
    module_key: 'marketing',
  },

  // Content Management
  {
    id: 'websites',
    path: '/websites',
    label: 'Websites',
    icon: Globe,
    status: 'core',
    group: 'marketing',
    subGroup: 'content',
    description: 'Manage all your websites in one place',
    module_key: 'marketing',
  },
  {
    id: 'landing_pages',
    path: '/websites/landing-pages',
    label: 'Landing Pages',
    icon: Globe,
    status: 'core',
    group: 'marketing',
    subGroup: 'content',
    description: 'Landing page management',
    module_key: 'marketing',
  },
  {
    id: 'content_management',
    path: '/marketing/content',
    label: 'Content Assets',
    icon: FileTextIcon,
    status: 'core',
    group: 'growth',
    subGroup: 'marketing',
    description: 'Manage marketing content',
    module_key: 'marketing',
  },
  {
    id: 'scheduling_analytics',
    path: '/scheduling/analytics',
    label: 'Scheduling Analytics',
    icon: BarChart3,
    status: 'core',
    group: 'optimization',
    subGroup: 'analytics',
    description: 'Appointment trends',
    module_key: 'scheduling',
  },

  // Customer Acquisition
  {
    id: 'affiliates',
    path: '/affiliates',
    label: 'Affiliate Program',
    icon: Gift,
    status: 'core',
    group: 'growth',
    subGroup: 'acquisition',
    description: 'Manage affiliate partners and payouts',
    module_key: 'marketing',
  },
  {
    id: 'customer_acquisition',
    path: '/marketing/acquisition',
    label: 'Acquisition Channels',
    icon: Users,
    status: 'core',
    group: 'growth',
    subGroup: 'acquisition',
    description: 'Customer acquisition strategies',
    module_key: 'marketing',
  },
  {
    id: 'marketplace_all',
    path: '/lead-marketplace', // Generalized path
    label: 'Lead Marketplace',
    icon: ShoppingCart,
    status: 'core',
    group: 'growth',
    subGroup: 'lead_marketplace',
    description: 'Access lead marketplace',
    module_key: 'marketing',
  },


  // LMS
  {
    id: 'courses',
    path: '/courses',
    label: 'Courses',
    icon: GraduationCap,
    status: 'core',
    group: 'growth',
    subGroup: 'lms',
    description: 'Learning Management System',
    module_key: 'marketing',
  },
  {
    id: 'memberships',
    path: '/memberships',
    label: 'Memberships',
    icon: Users,
    status: 'core',
    group: 'growth',
    subGroup: 'lms',
    description: 'Manage membership programs and subscriptions',
    module_key: 'marketing',
  },
  {
    id: 'certificates',
    path: '/certificates',
    label: 'Certificates',
    icon: Award,
    status: 'core',
    group: 'growth',
    subGroup: 'lms',
    description: 'Manage course certificates',
    module_key: 'marketing',
  },

  // ============================================
  // HR SUITE
  // ============================================
  {
    id: 'time_tracking',
    path: '/hr/time-tracking',
    label: 'Time Tracking',
    icon: Clock,
    status: 'core',
    group: 'optimization',
    subGroup: 'hr',
    description: 'Track work hours and manage timesheets',
    module_key: 'hr',
  },
  {
    id: 'hr_leave',
    path: '/hr/leave',
    label: 'Leave',
    icon: Calendar,
    status: 'core',
    group: 'optimization',
    subGroup: 'hr',
    description: 'Manage time off and leave requests',
    module_key: 'hr',
  },
  {
    id: 'hr_employees',
    path: '/hr/employees',
    label: 'Employees',
    icon: Users,
    status: 'core',
    group: 'optimization',
    subGroup: 'hr',
    description: 'Employee directory and profiles',
    module_key: 'hr',
  },
  {
    id: 'hr_recruitment',
    path: '/hr/recruitment',
    label: 'Recruitment',
    icon: UserCheck,
    status: 'core',
    group: 'hr',
    description: 'Applicant tracking and hiring pipeline',
    module_key: 'hr',
  },
  {
    id: 'hr_scheduling',
    path: '/hr/scheduling',
    label: 'Shift Scheduling',
    icon: Calendar,
    status: 'core',
    group: 'hr',
    description: 'Manage employee shifts',
    module_key: 'hr',
  },
  {
    id: 'hr_analytics',
    path: '/hr/analytics',
    label: 'HR Analytics',
    icon: BarChart3,
    status: 'core',
    group: 'optimization',
    subGroup: 'analytics',
    description: 'Workforce insights',
    module_key: 'hr',
  },
  {
    id: 'hr_settings',
    path: '/settings?tab=hr',
    label: 'Settings',
    icon: Settings,
    status: 'hidden',
    group: 'optimization',
    subGroup: 'hr',
    description: 'HR module configuration',
    module_key: 'hr',
  },

  // ============================================
  // AI AGENTS
  // ============================================
  {
    id: 'ai_console',
    path: '/ai/console',
    label: 'AI Console',
    icon: Brain,
    status: 'core',
    group: 'optimization',
    subGroup: 'ai_agents',
    description: 'AI-powered automation and chat console',
  },
  {
    id: 'sentiment_settings',
    path: '/settings?tab=sentiment',
    label: 'Sentiment Settings',
    icon: Settings,
    status: 'hidden',
    group: 'optimization',
    subGroup: 'ai_agents',
    description: 'Configure conversation intelligence and sentiment analysis',
  },
  {
    id: 'ai_agents',
    path: '/ai/agents',
    label: 'Agents',
    icon: Bot,
    status: 'core',
    group: 'optimization',
    subGroup: 'ai_agents',
    description: 'Manage all AI agents',
  },
  {
    id: 'ai_agent_studio',
    path: '/ai/agent-studio',
    label: 'Agent Studio',
    icon: Layout,
    status: 'hidden',
    group: 'optimization',
    subGroup: 'ai_agents',
    description: 'Build and deploy AI agents for your business',
  },
  {
    id: 'ai_voice_ai',
    path: '/ai/voice-ai',
    label: 'Voice AI',
    icon: Mic,
    status: 'core',
    group: 'optimization',
    subGroup: 'ai_agents',
    description: 'Voice agents and phone automation',
  },
  {
    id: 'ai_workforce',
    path: '/ai/workforce',
    label: 'AI Workforce',
    icon: Users,
    status: 'core',
    group: 'optimization',
    subGroup: 'ai_agents',
    description: 'Transform agents into digital employees',
  },
  {
    id: 'ai_conversation_ai',
    path: '/ai/conversation-ai',
    label: 'Conversation AI',
    icon: MessageSquare,
    status: 'core',
    group: 'optimization',
    subGroup: 'ai_agents',
    description: 'Chat bots and messaging automation',

  },
  {
    id: 'ai_knowledge_hub',
    path: '/ai/knowledge-hub',
    label: 'Knowledge Hub',
    icon: BookOpen,
    status: 'core',
    group: 'optimization',
    subGroup: 'ai_agents',
    description: 'AI training data and knowledge sources',
  },
  {
    id: 'ai_agent_templates',
    path: '/ai/agent-templates',
    label: 'Templates',
    icon: Store,
    status: 'core',
    group: 'optimization',
    subGroup: 'ai_agents',
    description: 'Pre-built AI agent marketplace',
  },
  {
    id: 'ai_content_ai',
    path: '/ai/content-ai',
    label: 'Content AI',
    icon: Sparkles,
    status: 'core',
    group: 'optimization',
    subGroup: 'ai_agents',
    description: 'AI content generation and management',
  },
  {
    id: 'ai_chatbot',
    path: '/ai/chatbot',
    label: 'Advanced Chatbot',
    icon: MessageSquare,
    status: 'hidden',
    group: 'optimization',
    description: 'Multi-channel AI-powered chatbot for Web, SMS, and WhatsApp',
    subGroup: 'ai_agents',
  },
  {
    id: 'ai_settings',
    path: '/settings?tab=ai',
    label: 'AI Settings',
    icon: Settings,
    status: 'hidden',
    group: 'optimization',
    subGroup: 'ai_agents',
    description: 'Configure AI features and preferences',
  },

  // ============================================
  // AGENCY / MULTI-TENANT
  // ============================================
  {
    id: 'agency_dashboard',
    path: '/agency',
    label: 'Agency Dashboard',
    icon: LayoutDashboard,
    status: 'core',
    group: 'agency',
    description: 'Agency overview, stats, and quick actions',
  },
  {
    id: 'agency_settings',
    path: '/settings?tab=agency',
    label: 'Agency Settings',
    icon: Settings,
    status: 'hidden',
    group: 'optimization',
    subGroup: 'admin',
    description: 'Configure agency branding, domains, and whitelabel settings',
  },
  {
    id: 'user_management_settings',
    path: '/settings?tab=user-management',
    label: 'Team & Permissions',
    icon: Users,
    status: 'hidden',
    group: 'optimization',
    subGroup: 'admin',
    description: 'Manage team members, roles, and access controls',
  },
  {
    id: 'billing_settings',
    path: '/settings?tab=billing',
    label: 'Billing & Subscription',
    icon: CreditCard,
    status: 'hidden',
    group: 'optimization',
    subGroup: 'admin',
    description: 'Manage agency subscription, invoices, and usage limits',
  },
  {
    id: 'agency_subaccounts',
    path: '/agency/sub-accounts',
    label: 'Sub-Accounts',
    icon: Users,
    status: 'core',
    group: 'optimization',
    subGroup: 'admin',
    description: 'Manage client sub-accounts and team access',
  },
  {
    id: 'agency_billing',
    path: '/agency/billing',
    label: 'Billing',
    icon: DollarSign,
    status: 'core',
    group: 'optimization',
    subGroup: 'admin',
    description: 'Subscription management, usage tracking, and invoices',
  },

  {
    id: 'scheduling_payments',
    path: '/scheduling/payments',
    label: 'Payments',
    icon: DollarSign,
    status: 'core',
    group: 'delivery',
    subGroup: 'scheduling',
    description: 'Appointment payments and transactions',
    module_key: 'operations',
  },
  {
    id: 'marketplace_inbox',
    path: '/lead-marketplace/inbox',
    label: 'Lead Inbox',
    icon: Inbox,
    status: 'core',
    group: 'growth',
    subGroup: 'lead_marketplace',
    description: 'Manage inbound lead communications',
  },
  {
    id: 'marketplace_leads',
    path: '/lead-marketplace/leads',
    label: 'Lead Management',
    icon: FileTextIcon,
    status: 'core',
    group: 'growth',
    subGroup: 'lead_marketplace',
    description: 'Track and manage marketplace leads',
  },
  {
    id: 'marketplace_wallet',
    path: '/lead-marketplace/wallet',
    label: 'Wallet & Credits',
    icon: Wallet,
    status: 'core',
    group: 'growth',
    subGroup: 'lead_marketplace',
    description: 'Manage credits and billing for leads',
  },
  {
    id: 'marketplace_templates',
    path: '/lead-marketplace/templates',
    label: 'Templates',
    icon: Layout,
    status: 'core',
    group: 'growth',
    subGroup: 'lead_marketplace',
    description: 'Snapshots and templates marketplace',
  },
  {
    id: 'marketplace_preferences',
    path: '/lead-marketplace/preferences',
    label: 'Preferences',
    icon: Sliders,
    status: 'core',
    group: 'growth',
    subGroup: 'lead_marketplace',
    description: 'Marketplace notification and lead preferences',
  },
  {
    id: 'marketplace_pricing',
    path: '/lead-marketplace/pricing-rules',
    label: 'Pricing Rules',
    icon: DollarSign,
    status: 'core',
    group: 'growth',
    subGroup: 'lead_marketplace',
    description: 'Configure automated lead pricing and filters',
  },
  {
    id: 'marketplace_services',
    path: '/lead-marketplace/services',
    label: 'Service Catalog',
    icon: Store,
    status: 'core',
    group: 'growth',
    subGroup: 'lead_marketplace',
    description: 'Browse and request specialized services',
  },
  {
    id: 'marketplace_register',
    path: '/lead-marketplace/register',
    label: 'Provider Registration',
    icon: UserCheck,
    status: 'core',
    group: 'growth',
    subGroup: 'lead_marketplace',
    description: 'Register as a service provider in the marketplace',
  },

  // ============================================
  // NEW GAP FEATURES - Payment Processing
  // ============================================
  {
    id: 'payment_processing',
    path: '/payments',
    label: 'Payment Processing',
    icon: CreditCard,
    status: 'core',
    group: 'optimization',
    subGroup: 'finance',
    description: 'Stripe Connect, payment links, and text-to-pay',
    module_key: 'finance',
  },
  {
    id: 'text_to_pay',
    path: '/payments/text-to-pay',
    label: 'Text-to-Pay',
    icon: Smartphone,
    status: 'core',
    group: 'optimization',
    subGroup: 'finance',
    description: 'Send payment requests via SMS',
    module_key: 'finance',
  },

  // ============================================
  // NEW GAP FEATURES - Calendar Sync
  // ============================================
  {
    id: 'calendar_sync',
    path: '/scheduling/calendar-sync',
    label: 'Calendar Sync',
    icon: RefreshCw,
    status: 'core',
    group: 'delivery',
    subGroup: 'scheduling',
    description: 'Two-way sync with Google, Outlook, and iCal',
    module_key: 'operations',
  },

  // ============================================
  // NEW GAP FEATURES - E-Signatures
  // ============================================
  {
    id: 'e_signatures',
    path: '/finance/e-signatures',
    label: 'E-Signatures',
    icon: FileTextIcon,
    status: 'core',
    group: 'conversion',
    subGroup: 'quotes',
    description: 'Digital document signing for estimates and contracts',
    module_key: 'finance',
  },

  // ============================================
  // NEW GAP FEATURES - QR Codes
  // ============================================
  {
    id: 'qr_codes_legacy',
    path: '/marketing/qr-codes',
    label: 'QR Codes',
    icon: Image,
    status: 'hidden', // Use the one in marketing group
    group: 'marketing',
    description: 'Generate QR codes for booking, payments, and reviews',
    module_key: 'marketing',
  },

  // ============================================
  // MARKETING - BLOGGING PLATFORM
  // ============================================
  {
    id: 'blogging_platform',
    path: '/marketing/blog',
    label: 'Blog CMS',
    icon: FileTextIcon,
    status: 'core',
    group: 'growth',
    subGroup: 'marketing',
    description: 'Create and manage SEO-optimized blog content and publication',
    module_key: 'marketing',
  },

  // ============================================
  // MARKETING - LOYALTY PROGRAM
  // ============================================
  {
    id: 'loyalty_program',
    path: '/marketing/loyalty',
    label: 'Loyalty & Rewards',
    icon: Gift,
    status: 'core',
    group: 'growth',
    subGroup: 'engagement',
    description: 'Automated points-based rewards system for customer retention',
    module_key: 'marketing',
  },

  // ============================================
  // MARKETING - WEBINAR HOSTING
  // ============================================
  {
    id: 'webinar_hosting',
    path: '/marketing/webinars',
    label: 'Webinar Studio',
    icon: Monitor,
    status: 'core',
    group: 'growth',
    subGroup: 'engagement',
    description: 'Native live streaming and automated webinar hosting',
    module_key: 'marketing',
  },

  // ============================================
  // NEW GAP FEATURES - GPS Tracking
  // ============================================
  {
    id: 'gps_tracking',
    path: '/operations/gps-tracking',
    label: 'GPS Tracking',
    icon: Truck,
    status: 'core',
    group: 'delivery',
    subGroup: 'field_service',
    description: 'Real-time field technician tracking and ETA notifications',
    module_key: 'operations',
  },




  // ============================================
  // FINANCE - NEW FEATURES
  // ============================================
  {
    id: 'consumer_financing',
    path: '/finance/consumer-financing',
    label: 'Consumer Financing',
    icon: CreditCard,
    status: 'core',
    group: 'optimization',
    subGroup: 'finance',
    description: 'Offer consumer financing options with Affirm, Klarna, and Afterpay',
    module_key: 'finance',
  },

  // ============================================
  // SETTINGS - NEW FEATURES
  // ============================================
  {
    id: 'webhooks',
    path: '/webhooks',
    label: 'Webhooks',
    icon: Workflow,
    status: 'core',
    group: 'optimization',
    subGroup: 'admin',
    description: 'Webhook endpoint management and delivery tracking',
  },

  // ============================================
  // REPORTING - NEW FEATURES
  // ============================================
  {
    id: 'revenue_attribution',
    path: '/reports/revenue-attribution',
    label: 'Revenue Attribution',
    icon: DollarSign,
    status: 'core',
    group: 'optimization',
    subGroup: 'analytics',
    description: 'Multi-touch attribution with channel performance and campaign ROI',
  },

  // ============================================
  // CULTURE
  // ============================================
  {
    id: 'culture_dashboard',
    path: '/culture/dashboard',
    label: 'Overview',
    icon: Heart,
    status: 'core',
    group: 'optimization',
    subGroup: 'culture',
    description: 'Company culture dashboard and values',
    module_key: 'hr',
  },
  {
    id: 'culture_surveys',
    path: '/culture/surveys',
    label: 'Pulse Surveys',
    icon: Activity,
    status: 'core',
    group: 'optimization',
    subGroup: 'culture',
    description: 'Employee engagement pulse surveys',
    module_key: 'hr',
  },
  {
    id: 'culture_events',
    path: '/culture/events',
    label: 'Team Events',
    icon: Calendar,
    status: 'core',
    group: 'optimization',
    subGroup: 'culture',
    description: 'Team building events and activities',
    module_key: 'hr',
  },
];


// ============================================
// PRODUCT BUNDLES (ACCOUNT-LEVEL MODES)
// ============================================

// Map of bundle -> feature IDs that belong to that bundle
// NOTE: This is intentionally conservative and can be expanded over time.
export const BUNDLES: Record<ProductBundle, string[]> = {
  reach: [
    // Email
    'email_campaigns',
    'email_sequences',
    'email_templates',
    'email_template_builder',
    'email_contacts',
    'email_replies',
    'email_unsubscribers',

    // SMS
    'sms_campaigns',
    'sms_sequences',
    'sms_templates',
    'sms_contacts',
    'sms_replies',
    'sms_unsubscribers',

    // Calls
    'calls_campaigns',
    'calls_scripts',
    'calls_agents',
    'calls_numbers',
    'calls_flows',
    'calls_pools',
    'calls_logs',
    'calls_analytics',

    // Engagement
    'forms',
    'form_replies',
    'landing_pages',
    'landing_templates',
    'landing_builder',
    'proposals',
    'proposals_templates',
    'proposals_settings',

    // Automation
    'flow_builder',
    'automations',
    'automation_recipes',
    'ab_testing',

    // CRM-lite shared
    'crm_dashboard',
    'crm_analytics',
    'contacts_all',
    'companies',
    'lists',
    'segments',
  ],
  operations: [
    // Core field/operations
    'jobs',
    'estimates',
    'services',
    'staff',
    'recalls',
    'referrals',
    'playbooks',
    'payments',
    'appointments',
    'field_service',
    'local_payments',
    'calls_numbers',
    'industry_settings',

    // Reviews & reporting
    'reviews',
    'reports',
  ],
  crm: [
    // CRM core
    'crm_dashboard',
    'crm_leads',
    'crm_pipeline',
    'crm_tasks',
    'crm_activities',
    'crm_analytics',
    'crm_lead_marketplace',

    // Contacts
    'contacts_all',
    'companies',
  ],
  sales: [
    // Sales (pipeline + reporting)
    'reports',
    'sales_enablement_dashboard',
    'sales_content_library',
    'sales_playbooks',
    'deal_rooms',
    'battle_cards',
    'sales_training',

    'enablement_analytics',
  ],
  marketing: [
    // Marketing (funnels, memberships, calendars, booking pages)
    // Note: some of these screens are currently hardcoded in the sidebar and
    // not part of the feature registry yet.
  ],
  reputation: [
    // Reputation (overview, requests, reviews, widgets, listings, settings)
    'reputation_overview',
    'reputation_requests',
    'reputation_reviews',
    'reputation_widgets',
    'reputation_listings',
    'reputation_settings',
  ],
  finance: [
    // Finance (invoices/payments)
    'finance_overview',
    'estimates',
    'invoices',
    'transactions',
    'subscriptions',
    'consumer_financing',
    'expenses',
    'payroll',
    'commissions',
    'dunning',
    'quickbooks',
    'finance_settings',
  ],
  growth: [
    // Social Media
    'social_scheduler',
    'social_accounts',
    'social_posts',
    'social_templates',
    'social_analytics',

    // Listings & SEO
    'listings_seo',
    'business_listings',
    'seo_keywords',
    'seo_pages',
    'seo_competitors',

    // Ads
    'ads_manager',
    'ad_accounts',
    'ad_campaigns',
    'ad_budgets',
    'ad_conversions',
  ],
  hr: [
    // Time Tracking
    'time_tracking',
    'time_entries',
    'timesheets',
    'clock_records',
    'leave_requests',

    // Expenses
    'expenses',
    'expense_reports',
    'expense_categories',

    // Commissions
    'commissions',
    'commission_plans',
  ],
  helpdesk: [
    'helpdesk',
    'helpdesk_tickets',
    'helpdesk_kb',
    'helpdesk_settings',
    'helpdesk_reports',
  ],
  reporting: [
    'analytics_dashboard',
    'crm_analytics',
    'crm_forecast',
    'enablement_analytics',
    'helpdesk_reports',
    'advanced_reporting',
    'insights',
  ],
  full: FEATURES.map(f => f.id),
};

// ============================================
// ACCOUNT-LEVEL FEATURE CONFIGURATION
// ============================================

/**
 * Account-level configuration for which features are enabled.
 * This allows each account owner to customize their product experience.
 */
export interface AccountFeatureConfig {
  /** 'full' shows everything; 'custom' uses enabledBundles + overrides */
  productMode: 'full' | 'custom';
  /** Which bundles are enabled for this account */
  enabledBundles: ProductBundle[];
  /** Individual features to add on top of bundles */
  extraFeatureIds?: string[];
  /** Individual features to hide even if in a bundle */
  disabledFeatureIds?: string[];
}

/**
 * Default config for new accounts: All bundles enabled
 */
export const DEFAULT_ACCOUNT_CONFIG: AccountFeatureConfig = {
  // New accounts: All bundles enabled by default for full functionality
  productMode: 'custom',
  enabledBundles: ['reach', 'crm', 'reporting'],
  extraFeatureIds: [
    // Shared dashboard/admin items that should always be present
    'dashboard',
    'inbox',
    'tasks',
    'reports',
    'settings',
    'admin_users',
  ],
  disabledFeatureIds: [],
};

/**
 * Full suite config (for admins/developers)
 */
export const FULL_ACCOUNT_CONFIG: AccountFeatureConfig = {
  productMode: 'full',
  enabledBundles: ['reach', 'operations', 'crm', 'reporting'],
  extraFeatureIds: [],
  disabledFeatureIds: [],
};

/**
 * Get enabled features for a specific account configuration.
 * This is the main function the sidebar and other components should use.
 */
export function getEnabledFeaturesForAccount(config: AccountFeatureConfig): FeatureItem[] {
  // Admin and core navigation items should always be visible so owners
  // can manage the workspace regardless of product bundle configuration.
  const ALWAYS_VISIBLE_FEATURE_IDS = new Set<string>([
    'dashboard',
    'inbox',
    'media_library',
    'tasks',
    'reports',
    'settings',
    'admin_users',
  ]);

  // Full mode = show everything that's core or advanced
  if (config.productMode === 'full') {
    return FEATURES.filter(f => f.status === 'core' || f.status === 'advanced');
  }

  // Custom mode = only show features from enabled bundles + extras - disabled
  const fromBundles = new Set(
    config.enabledBundles.flatMap(bundle => BUNDLES[bundle] ?? [])
  );
  const extra = new Set(config.extraFeatureIds ?? []);
  const disabled = new Set(config.disabledFeatureIds ?? []);

  return FEATURES.filter(f => {
    const isCoreOrAdvanced = f.status === 'core' || f.status === 'advanced';
    if (!isCoreOrAdvanced) return false;

    const isAlwaysVisible = ALWAYS_VISIBLE_FEATURE_IDS.has(f.id) || f.group === 'admin';
    if (isAlwaysVisible) {
      return true;
    }

    // Otherwise respect bundle / extras / disabled configuration
    return (fromBundles.has(f.id) || extra.has(f.id)) && !disabled.has(f.id);
  });
}

/**
 * Get features for a specific bundle
 */
export function getFeaturesForBundle(bundle: ProductBundle): FeatureItem[] {
  const featureIds = BUNDLES[bundle] ?? [];
  return FEATURES.filter(f => featureIds.includes(f.id));
}

/**
 * Bundle metadata for UI display
 */
export const BUNDLE_INFO: Record<ProductBundle, { label: string; description: string; icon: string }> = {
  reach: {
    label: 'Reach',
    description: 'Email, SMS, and Call campaigns with sequences and templates',
    icon: 'Mail',
  },
  operations: {
    label: 'Operations',
    description: 'Jobs, estimates, services, staff, payments, and appointments',
    icon: 'Wrench',
  },
  crm: {
    label: 'CRM',
    description: 'Leads, contacts, companies, lists, segments, and analytics',
    icon: 'TrendingUp',
  },
  sales: {
    label: 'Sales',
    description: 'Pipeline, opportunities, and sales reporting',
    icon: 'TrendingUp',
  },
  marketing: {
    label: 'Marketing',
    description: 'Funnels, memberships, calendars, and booking pages',
    icon: 'Layout',
  },
  reputation: {
    label: 'Reputation',
    description: 'Reviews, listings reputation, and review requests',
    icon: 'Star',
  },
  finance: {
    label: 'Finance',
    description: 'Invoices, payments, and billing tools',
    icon: 'DollarSign',
  },
  growth: {
    label: 'Growth',
    description: 'Social media scheduling, listings/SEO, and advertising management',
    icon: 'TrendingUp',
  },
  hr: {
    label: 'HR Suite',
    description: 'Time tracking, expenses, and commission management',
    icon: 'Users',
  },
  helpdesk: {
    label: 'Helpdesk',
    description: 'Ticket management, knowledge base, and support settings',
    icon: 'MessageSquare',
  },
  full: {
    label: 'Full Suite',
    description: 'All features enabled - complete platform access',
    icon: 'LayoutDashboard',
  },
  reporting: {
    label: 'Reporting',
    description: 'Analytics, reports, and insights across all modules',
    icon: 'PieChart',
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get features by status
 */
export function getFeaturesByStatus(status: FeatureStatus): FeatureItem[] {
  return FEATURES.filter(f => f.status === status);
}

/**
 * Get features by group
 */
export function getFeaturesByGroup(group: FeatureGroup): FeatureItem[] {
  return FEATURES.filter(f => f.group === group);
}

/**
 * Get visible features (core + advanced)
 */
export function getVisibleFeatures(): FeatureItem[] {
  return FEATURES.filter(f => f.status === 'core' || f.status === 'advanced');
}

/**
 * Get core features only
 */
export function getCoreFeatures(): FeatureItem[] {
  return FEATURES.filter(f => f.status === 'core');
}

/**
 * Get advanced features only
 */
export function getAdvancedFeatures(): FeatureItem[] {
  return FEATURES.filter(f => f.status === 'advanced');
}

/**
 * Get hidden features (for documentation/tracking)
 */
export function getHiddenFeatures(): FeatureItem[] {
  return FEATURES.filter(f => f.status === 'hidden');
}

/**
 * Check if a feature is enabled (core or advanced)
 */
export function isFeatureEnabled(featureId: string): boolean {
  const feature = FEATURES.find(f => f.id === featureId);
  return feature ? (feature.status === 'core' || feature.status === 'advanced') : false;
}

/**
 * Get feature by ID
 */
export function getFeatureById(featureId: string): FeatureItem | undefined {
  return FEATURES.find(f => f.id === featureId);
}

/**
 * Get feature by path
 */
export function getFeatureByPath(path: string): FeatureItem | undefined {
  return FEATURES.find(f => f.path === path);
}

// ============================================
// NAVIGATION STRUCTURE
// ============================================

export interface NavGroup {
  id: string;
  label: string;
  items: FeatureItem[];
  collapsed?: boolean;
}

/**
 * Build navigation structure from features
 * This is what the sidebar will use
 */
export function buildNavigation(includeAdvanced: boolean = true): NavGroup[] {
  const coreFeatures = getCoreFeatures();
  const advancedFeatures = includeAdvanced ? getAdvancedFeatures() : [];

  const groups: NavGroup[] = [
    {
      id: 'dashboard',
      label: '',
      items: coreFeatures.filter(f => f.id === 'dashboard'),
    },
    {
      id: 'outreach',
      label: 'Outreach',
      items: [], // Will be handled specially with sub-groups
    },
    {
      id: 'engagement',
      label: 'Engagement',
      items: coreFeatures.filter(f => f.group === 'engagement'),
    },
    {
      id: 'automation',
      label: 'Automation',
      items: coreFeatures.filter(f => f.group === 'automation'),
    },

    {
      id: 'crm',
      label: 'CRM & Contacts',
      items: coreFeatures.filter(f => f.group === 'crm' || f.group === 'contacts'),
    },
    {
      id: 'ai',
      label: 'AI Agents',
      items: coreFeatures.filter(f => f.group === 'ai'),
    },
    {
      id: 'admin',
      label: 'Admin',
      items: coreFeatures.filter(f => f.group === 'admin'),
    },
  ];

  // Add advanced section if there are advanced features
  if (advancedFeatures.length > 0) {
    groups.push({
      id: 'advanced',
      label: 'Advanced',
      items: advancedFeatures,
      collapsed: true,
    });
  }

  return groups.filter(g => g.items.length > 0 || g.id === 'outreach');
}

