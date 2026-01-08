import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { api, proposalApi, CustomVariable, type AiSettings, type AiProviderConfig, type AiChannelDefault, defaultAiSettings } from '@/lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Share2, Plus, Trash2, Eye, Copy, Download, Settings, Mail, MessageSquare, Phone, FileTextIcon, User, Zap, AlertCircle, CheckCircle, TestTube, HelpCircle, AlertTriangle, ExternalLink, Link2, ShieldCheck, Loader2, Bot, Save, Building2, MapPin, Briefcase, Hash, Calendar, Layout, Users, FileSignature, Globe, Palette, Target, TrendingUp, Clock, DollarSign, Percent, Camera, Star, Kanban, ShoppingBag, BarChart3, GraduationCap, Award, Cookie, Code, Activity, Package, Image, Video, Truck, Heart, CreditCard } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import AISettings from '@/components/AISettings';
import AgencySettings from './AgencySettings';
import IndustrySettings from './IndustrySettings';
import FinanceSettings from './finance/FinanceSettings';
import HRSettings from './hr/HRSettings';
import HelpdeskSettings from './HelpdeskSettings';
import CSATSettings from './CSATSettings';
import ReputationSettings from './reputation/Settings';
import ChannelSettings from './ChannelSettings';
import AutomationSettings from './AutomationSettings';
import IntegrationsSettings from './Settings/IntegrationsSettings';
import CustomFieldsSettings from './Settings/CustomFieldsSettings';
import TagsSettings from './Settings/TagsSettings';
import SIPSettings from './Settings/SIPSettings';
import DomainsSettings from './Settings/DomainsSettings';
import SecuritySettings from './SecuritySettings';
import MobileSettings from './mobile/MobileSettings';
import PushNotifications from './mobile/PushNotifications';
import DebugSettings from './DebugSettings';
import FormSettings from './forms/FormSettings';
import CRMSettingsPage from './crm/SettingsPage';
import ProjectSettings from './projects/ProjectSettings';
import EcommerceSettings from './ecommerce/EcommerceSettings';
import ReportingSettings from './ReportingSettings';
import MarketplacePreferences from './marketplace/MarketplacePreferences';
import MarketingSettings from './marketing/MarketingSettings';
import PublicAssetsSettings from './PublicAssetsSettings';
import UserManagement from './UserManagement';
import SentimentConfig from './SentimentConfig';
import WebFormsSettings from './webforms/WebFormsSettings';
import AgencyBilling from './AgencyBilling';
import AccountSettings from './AccountSettings';

import SalesSettings from './sales/SalesSettings';
import LMSSettings from './lms/LMSSettings';
import WebsiteSettings from './websites/WebsiteSettings';
import CalendarSettings from './calendars/CalendarSettings';
import SeoSettings from './marketing/seo/SeoSettingsPage';
import BlogSettings from './marketing/blog/BlogSettings';
import AffiliateSettings from './affiliates/AffiliateSettings';
import LoyaltySettings from './marketing/loyalty/LoyaltySettings';
import FieldServiceSettings from './field-service/FieldServiceSettings';
import WebinarSettings from './marketing/webinars/WebinarSettings';
import CoursesSettings from './courses/CoursesSettings';
import CultureSettings from './culture/CultureSettings';
import PaymentsSettings from './payments/PaymentsSettings';
import SchedulingSettings from './scheduling/SchedulingSettings';
import SystemHealth from '@/pages/admin/SystemHealth';
import AuditLog from '@/pages/AuditLog';
import EmailSettings from './EmailSettings';
import LandingPageSettings from './settings/LandingPageSettings';
import ProposalSettings from './settings/ProposalSettings';
import CommunitiesSettings from './settings/communities/CommunitiesSettings';
import SocialPlannerSettings from './settings/SocialPlannerSettings';
import SMSAndCallsSettings from './SMSAndCallsSettings';
import Apps from '@/pages/Apps';
import Snapshots from '@/pages/Snapshots';
import MediaLibrary from '@/pages/MediaLibrary';
import { useAuth } from '@/contexts/AuthContext';
import { useAccountSettings } from '@/hooks/useAccountSettings';
import { BUNDLE_INFO, ProductBundle, FEATURES } from '@/config/features';
import SEO from '@/components/SEO';

type AiChannelKey = keyof AiSettings['channelDefaults'];

const AI_CHANNELS: Array<{ key: AiChannelKey; label: string; description: string }> = [
  { key: 'email', label: 'Email', description: 'Used when drafting cold emails and follow-ups.' },
  { key: 'sms', label: 'SMS', description: 'Used for text outreach, replies, and SMS follow-ups.' },
  { key: 'call', label: 'Calls', description: 'Used for call scripts, objection handling, and summaries.' },
  { key: 'form', label: 'Forms', description: 'Used for landing pages, forms, and lead magnets.' }
];

const CHANNEL_PROMPT_PLACEHOLDERS: Record<AiChannelKey, string> = {
  email: 'You are an expert email outreach assistant who writes concise, personalized cold emails.',
  sms: 'You craft short, compliant SMS outreach messages that feel conversational and helpful.',
  call: 'You help SDRs outline structured call scripts, objection handlers, and summary notes.',
  form: 'You generate compelling copy for landing pages and lead capture forms.'
};

const SYSTEM_VARIABLE_CATEGORIES = [
  {
    label: 'Contact Information',
    icon: User,
    colorClass: 'text-blue-700',
    chipClass: 'bg-blue-50 border-blue-200',
    variables: ['{{firstName}}', '{{lastName}}', '{{fullName}}', '{{email}}', '{{phone}}', '{{mobile}}', '{{title}}', '{{department}}']
  },
  {
    label: 'Company Information',
    icon: Building2,
    colorClass: 'text-purple-700',
    chipClass: 'bg-purple-50 border-purple-200',
    variables: ['{{company}}', '{{companySize}}', '{{industry}}', '{{website}}', '{{revenue}}', '{{technology}}']
  },
  {
    label: 'Location Information',
    icon: MapPin,
    colorClass: 'text-green-700',
    chipClass: 'bg-green-50 border-green-200',
    variables: ['{{address}}', '{{city}}', '{{state}}', '{{country}}', '{{zipCode}}', '{{timezone}}', '{{serviceArea1}}', '{{serviceArea2}}']
  },
  {
    label: 'Call Information',
    icon: Phone,
    colorClass: 'text-orange-700',
    chipClass: 'bg-orange-50 border-orange-200',
    variables: ['{{callDuration}}', '{{callOutcome}}', '{{callTime}}', '{{callDate}}', '{{callbackNumber}}', '{{previousCallDate}}', '{{totalCalls}}']
  },
  {
    label: 'Agent Information',
    icon: Briefcase,
    colorClass: 'text-indigo-700',
    chipClass: 'bg-indigo-50 border-indigo-200',
    variables: ['{{agentName}}', '{{agentFirstName}}', '{{agentEmail}}', '{{agentPhone}}', '{{agentExtension}}', '{{agentTitle}}']
  },
  {
    label: 'Campaign Information',
    icon: Hash,
    colorClass: 'text-pink-700',
    chipClass: 'bg-pink-50 border-pink-200',
    variables: ['{{campaignName}}', '{{sequenceStep}}', '{{totalSteps}}', '{{campaignStartDate}}', '{{unsubscribeUrl}}']
  },
  {
    label: 'Date & Time',
    icon: Calendar,
    colorClass: 'text-teal-700',
    chipClass: 'bg-teal-50 border-teal-200',
    variables: ['{{currentDate}}', '{{currentTime}}', '{{currentDay}}', '{{currentMonth}}', '{{currentYear}}']
  },
  {
    label: 'Custom Fields',
    icon: Settings,
    colorClass: 'text-gray-700',
    chipClass: 'bg-gray-50 border-gray-200',
    variables: ['{{notes}}', '{{leadSource}}', '{{leadScore}}', '{{birthday}}', '{{linkedin}}', '{{twitter}}', '{{annualRevenue}}', '{{postalCode}}']
  }
];

const createEmptyAiProvider = (label: string): AiProviderConfig => ({
  label,
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  endpoint: '/chat/completions',
  model: 'gpt-4o-mini'
});

const getChannelConfig = (channel: AiChannelKey, settings: AiSettings): AiChannelDefault => {
  if (settings.channelDefaults[channel]) {
    return settings.channelDefaults[channel];
  }

  return {
    provider: settings.defaultProvider,
    model: settings.providers[settings.defaultProvider]?.model || 'gpt-4o-mini',
    systemPrompt: CHANNEL_PROMPT_PLACEHOLDERS[channel]
  };
};


const UnifiedSettings = () => {
  const auth = useAuth();
  const user = auth?.user;

  const { toast } = useToast();
  const navigate = useNavigate();


  const debug = import.meta.env.DEV && localStorage.getItem('debug_settings') === '1';
  const log = (...args: any[]) => { if (debug) console.log(...args); };
  const warn = (...args: any[]) => { if (debug) console.warn(...args); };
  const error = (...args: any[]) => { if (debug) console.error(...args); };

  // Account Settings (Product Setup) – provider is mounted at the app root
  const accountSettings = useAccountSettings();
  const accountConfig = accountSettings.config;
  const isBundleEnabled = accountSettings.isBundleEnabled;
  const toggleBundle = accountSettings.toggleBundle;
  const setProductMode = accountSettings.setProductMode;
  const resetToDefault = accountSettings.resetToDefault;
  const setConfig = accountSettings.setConfig;

  log('UnifiedSettings: Component loaded successfully!');
  log('UnifiedSettings: Current URL:', window.location.href);
  log('UnifiedSettings: User:', user);

  // Account owner check – only owner/admin can change product setup
  const isAccountOwner = !!user && (user.role?.name === 'Admin' || user.role_id === 1);

  // Product Setup presets
  const applyPreset = useCallback((preset: 'sales_outreach' | 'service_business' | 'agency') => {
    if (!isAccountOwner) return;

    if (preset === 'sales_outreach') {
      setConfig({
        productMode: 'custom',
        enabledBundles: ['outreach', 'crm'],
        extraFeatureIds: accountConfig?.extraFeatureIds || [],
        disabledFeatureIds: accountConfig?.disabledFeatureIds || [],
      });
      return;
    }

    if (preset === 'service_business') {
      setConfig({
        productMode: 'custom',
        enabledBundles: ['operations', 'crm'],
        extraFeatureIds: accountConfig?.extraFeatureIds || [],
        disabledFeatureIds: accountConfig?.disabledFeatureIds || [],
      });
      return;
    }

    if (preset === 'agency') {
      setConfig({
        productMode: 'custom',
        enabledBundles: ['outreach', 'crm'],
        extraFeatureIds: accountConfig?.extraFeatureIds || [],
        disabledFeatureIds: accountConfig?.disabledFeatureIds || [],
      });
      return;
    }
  }, [accountConfig?.extraFeatureIds, accountConfig?.disabledFeatureIds, isAccountOwner, setConfig]);

  // Profile State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Update profile state when user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);





  const tabValueMap: Record<string, string> = {
    profile: 'profile',
    security: 'security',

    email: 'email',
    sms: 'sms-and-calls',
    calls: 'sms-and-calls',
    'sms-and-calls': 'sms-and-calls',
    forms: 'forms',
    webforms: 'webforms',
    'web-forms': 'webforms',
    'landing-pages': 'landing-pages',
    landingpages: 'landing-pages',
    crm: 'crm',
    proposals: 'proposals',
    variables: 'variables',
    ai: 'ai',
    sentiment: 'sentiment',
    'conversation-intelligence': 'sentiment',
    snapshots: 'snapshots',
    connections: 'integrations',
    integrations: 'integrations',
    api: 'api',
    'sending-accounts': 'email',
    agency: 'agency',
    'user-management': 'user-management',
    team: 'user-management',
    users: 'user-management',
    billing: 'billing',
    subscription: 'billing',
    domains: 'domains',
    industry: 'industry',
    channels: 'channels',
    'social-planner': 'social-planner',
    communities: 'communities',
    helpdesk: 'helpdesk',
    csat: 'csat',
    reputation: 'reputation',
    'custom-fields': 'custom-fields',
    tags: 'tags',
    automation: 'automation',
    finance: 'finance',
    hr: 'hr',
    mobile: 'mobile',
    sip: 'sip',
    debug: 'debug',
    marketing: 'marketing',
    affiliates: 'affiliates',
    loyalty: 'loyalty',
    'field-service': 'field-service',
    fieldservice: 'field-service',
    webinars: 'webinars',
    webinar: 'webinars',
    courses: 'courses',
    culture: 'culture',
    payments: 'payments',
    scheduling: 'scheduling',
    appointments: 'scheduling',

    'system-health': 'system-health',
    'audit-logs': 'audit-logs',
    apps: 'apps',
    media: 'media',
  };

  // Navigation State
  const [searchParams, setSearchParams] = useSearchParams();

  const getTabFromUrl = () => {
    // Priority 1: Query Param
    const tabParam = searchParams.get('tab');
    if (tabParam) return tabParam;

    // Priority 2: Hash (Backward Compatibility)
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash && tabValueMap[hash]) return tabValueMap[hash];
    }

    return 'profile';
  };

  const [activeTab, setActiveTabState] = useState<string>(getTabFromUrl);

  // Sync state when URL changes (handling back button and initial load)
  useEffect(() => {
    const nextTab = getTabFromUrl();
    if (nextTab !== activeTab) {
      setActiveTabState(nextTab);
    }
  }, [searchParams]);

  const setActiveTab = (value: string) => {
    setActiveTabState(value);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', value);
    newParams.delete('section');
    setSearchParams(newParams, { replace: false });

    // Clear hash to avoid confusion
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Form Settings State
  const [formSettings, setFormSettings] = useState({
    enableNotifications: true,
    notificationEmail: '',
    autoReplyEnabled: true,
    autoReplySubject: 'Thank you for your submission',
    autoReplyMessage: 'Thank you for your submission. We will get back to you soon.',
    enableSpamProtection: true,
    spamKeywords: 'spam, viagra, casino',
    enableFileUploads: false,
    maxFileSize: 10,
    allowedFileTypes: 'pdf,doc,docx,jpg,png'
  });




  // CRM Settings State
  const [crmSettings, setCrmSettings] = useState({
    // Pipeline Settings
    defaultPipelineStages: ['New Lead', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'],
    enableLeadScoring: true,
    leadScoringThreshold: 50,
    autoAssignLeads: false,
    defaultLeadOwner: '',
    // Contact Settings
    enableDuplicateDetection: true,
    duplicateMatchFields: ['email', 'phone'],
    autoMergeContacts: false,
    // Activity Tracking
    trackEmailOpens: true,
    trackLinkClicks: true,
    trackPageVisits: true,
    trackFormSubmissions: true,
    // Lead Lifecycle
    leadStaleAfterDays: 30,
    enableStaleLeadAlerts: true,
    autoArchiveAfterDays: 90,
    // Data Enrichment
    enableAutoEnrichment: false,
    enrichmentProvider: 'none',
    // Tags & Segments
    enableAutoTagging: true,
    defaultTags: [] as string[]
  });

  // Custom Variables State
  const [customVariables, setCustomVariables] = useState<CustomVariable[]>([]);
  const [newVariable, setNewVariable] = useState({ name: '', description: '' });
  const [isAddingVariable, setIsAddingVariable] = useState(false);

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    notifyCampaignUpdates: true,
    notifyDailySummary: false,
    notifySmsReplies: true,
    notifyCallReplies: true,
    notifyFormSubmissions: true
  });

  // API Settings State
  const [apiSettings, setApiSettings] = useState({
    apiKeys: {
      openai: '',
      sendgrid: '',
      stripe: ''
    },
    webhooks: {
      formSubmission: '',
      emailBounce: '',
      unsubscribe: ''
    }
  });

  const [aiSettings, setAiSettings] = useState<AiSettings>(() => defaultAiSettings());
  const [aiSettingsDirty, setAiSettingsDirty] = useState(false);
  const [isSavingAiSettings, setIsSavingAiSettings] = useState(false);
  const [newAiProviderKey, setNewAiProviderKey] = useState('');
  const [newAiProviderLabel, setNewAiProviderLabel] = useState('');

  // Integrations State
  const [integrations, setIntegrations] = useState<Array<{
    id: string;
    name: string;
    type: string;
    config: Record<string, unknown>;
    status: string;
    last_tested?: string;
  }>>([]);
  const [zapierApiKey, setZapierApiKey] = useState('');
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState<string | null>(null);
  const [googleSheetsConfig, setGoogleSheetsConfig] = useState({
    spreadsheetId: '',
    sheetName: 'Sheet1',
    events: ['form_submission', 'new_contact', 'unsubscribe']
  });
  const [isAddingGoogleSheets, setIsAddingGoogleSheets] = useState(false);
  const [zapierWebhookUrl, setZapierWebhookUrl] = useState('');

  // Update local state only (no API call)
  const setApiKeyValue = (keyName: keyof typeof apiSettings.apiKeys, value: string) => {
    setApiSettings(prev => ({
      ...prev,
      apiKeys: {
        ...prev.apiKeys,
        [keyName]: value
      }
    }));
  };

  // Save API key to backend (called on blur)
  const saveApiKey = async (keyName: keyof typeof apiSettings.apiKeys) => {
    try {
      await api.updateSettings({ apiKeys: { [keyName]: apiSettings.apiKeys[keyName] } });
      toast({ title: 'API key saved', description: `${keyName.charAt(0).toUpperCase() + keyName.slice(1)} API key saved successfully.` });
    } catch (error) {
      warn('Failed to save API key', error);
      toast({ title: 'Save failed', description: 'Could not save API key.', variant: 'destructive' });
    }
  };

  // State for tracking API key tests
  const [testingApiKey, setTestingApiKey] = useState<string | null>(null);

  // Test API key by making a simple validation request
  const testApiKey = async (keyName: keyof typeof apiSettings.apiKeys) => {
    const key = apiSettings.apiKeys[keyName];
    if (!key) {
      toast({ title: 'No API key', description: 'Please enter an API key first.', variant: 'destructive' });
      return;
    }

    setTestingApiKey(keyName);

    try {
      let isValid = false;
      let message = '';

      switch (keyName) {
        case 'openai':
          // Test OpenAI key by listing models
          const openaiResponse = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${key}` }
          });
          isValid = openaiResponse.ok;
          message = isValid ? 'OpenAI API key is valid!' : 'Invalid OpenAI API key';
          break;

        case 'sendgrid':
          // Test SendGrid key by checking API access
          const sendgridResponse = await fetch('https://api.sendgrid.com/v3/user/profile', {
            headers: { 'Authorization': `Bearer ${key}` }
          });
          isValid = sendgridResponse.ok;
          message = isValid ? 'SendGrid API key is valid!' : 'Invalid SendGrid API key';
          break;

        case 'stripe':
          // Test Stripe key by checking balance (works for both test and live keys)
          const stripeResponse = await fetch('https://api.stripe.com/v1/balance', {
            headers: { 'Authorization': `Bearer ${key}` }
          });
          isValid = stripeResponse.ok;
          message = isValid ? 'Stripe API key is valid!' : 'Invalid Stripe API key';
          break;
      }

      if (isValid) {
        toast({ title: 'API key valid', description: message });
      } else {
        toast({ title: 'API key invalid', description: message, variant: 'destructive' });
      }
    } catch (error) {
      error('API key test failed:', error);
      toast({
        title: 'Test failed',
        description: 'Could not validate API key. Check your network connection.',
        variant: 'destructive'
      });
    } finally {
      setTestingApiKey(null);
    }
  };

  // Update local state only (no API call)
  const setWebhookValue = (hookName: keyof typeof apiSettings.webhooks, value: string) => {
    setApiSettings(prev => ({
      ...prev,
      webhooks: {
        ...prev.webhooks,
        [hookName]: value
      }
    }));
  };

  // Save webhook to backend (called on blur)
  const saveWebhook = async (hookName: keyof typeof apiSettings.webhooks) => {
    try {
      await api.updateSettings({ webhooks: { [hookName]: apiSettings.webhooks[hookName] } });
      const friendlyNames: Record<keyof typeof apiSettings.webhooks, string> = {
        formSubmission: 'Form Submission',
        emailBounce: 'Email Bounce',
        unsubscribe: 'Unsubscribe'
      };
      toast({ title: 'Webhook saved', description: `${friendlyNames[hookName]} webhook saved successfully.` });
    } catch (error) {
      warn('Failed to save webhook', error);
      toast({ title: 'Save failed', description: 'Could not save webhook.', variant: 'destructive' });
    }
  };

  // State for tracking webhook tests
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);

  // Test webhook by sending a test payload
  const testWebhook = async (hookName: keyof typeof apiSettings.webhooks) => {
    const url = apiSettings.webhooks[hookName];
    if (!url) {
      toast({ title: 'No URL configured', description: 'Please enter a webhook URL first.', variant: 'destructive' });
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      toast({ title: 'Invalid URL', description: 'Please enter a valid webhook URL.', variant: 'destructive' });
      return;
    }

    setTestingWebhook(hookName);

    const testPayloads: Record<keyof typeof apiSettings.webhooks, object> = {
      formSubmission: {
        event: 'form_submission',
        timestamp: new Date().toISOString(),
        test: true,
        data: {
          form_id: 'test-form-123',
          form_name: 'Test Form',
          submission_id: 'sub-' + Date.now(),
          fields: {
            name: 'Test User',
            email: 'test@example.com',
            message: 'This is a test submission'
          }
        }
      },
      emailBounce: {
        event: 'email_bounce',
        timestamp: new Date().toISOString(),
        test: true,
        data: {
          email: 'bounced@example.com',
          bounce_type: 'hard',
          reason: 'Mailbox does not exist',
          campaign_id: 'camp-test-123',
          message_id: 'msg-' + Date.now()
        }
      },
      unsubscribe: {
        event: 'unsubscribe',
        timestamp: new Date().toISOString(),
        test: true,
        data: {
          email: 'unsubscribed@example.com',
          contact_id: 'contact-test-123',
          campaign_id: 'camp-test-123',
          reason: 'User clicked unsubscribe link'
        }
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Test': 'true'
        },
        body: JSON.stringify(testPayloads[hookName]),
        mode: 'no-cors' // Allow cross-origin requests for testing
      });

      // Since we're using no-cors, we can't read the response status
      // But if we get here without an error, the request was sent
      const friendlyNames: Record<keyof typeof apiSettings.webhooks, string> = {
        formSubmission: 'Form Submission',
        emailBounce: 'Email Bounce',
        unsubscribe: 'Unsubscribe'
      };
      toast({
        title: 'Test sent',
        description: `${friendlyNames[hookName]} test payload sent to webhook. Check your endpoint for the received data.`
      });
    } catch (error) {
      error('Webhook test failed:', error);
      toast({
        title: 'Test failed',
        description: 'Could not send test to webhook. Check the URL and try again.',
        variant: 'destructive'
      });
    } finally {
      setTestingWebhook(null);
    }
  };

  // Integration helper functions
  const createZapierIntegration = async () => {
    if (!zapierWebhookUrl) {
      toast({ title: 'URL required', description: 'Please enter your Zapier webhook URL.', variant: 'destructive' });
      return;
    }

    try {
      await api.createIntegration({
        name: 'Zapier',
        type: 'zapier',
        config: { webhook_url: zapierWebhookUrl, events: ['form_submission', 'email_bounce', 'unsubscribe', 'new_contact'] },
        status: 'active'
      });
      toast({ title: 'Zapier connected', description: 'Your Zapier integration is now active.' });
      setZapierWebhookUrl('');
      // Reload integrations
      const integrationsData = await api.getIntegrations();
      setIntegrations(integrationsData);
    } catch (error) {
      warn('Failed to create Zapier integration:', error);
      toast({ title: 'Connection failed', description: 'Could not connect Zapier.', variant: 'destructive' });
    }
  };

  const createGoogleSheetsIntegration = async () => {
    if (!googleSheetsConfig.spreadsheetId) {
      toast({ title: 'Spreadsheet ID required', description: 'Please enter your Google Sheets spreadsheet ID.', variant: 'destructive' });
      return;
    }

    setIsAddingGoogleSheets(true);
    try {
      await api.createIntegration({
        name: 'Google Sheets',
        type: 'google_sheets',
        config: {
          spreadsheet_id: googleSheetsConfig.spreadsheetId,
          sheet_name: googleSheetsConfig.sheetName,
          events: googleSheetsConfig.events
        },
        status: 'active'
      });
      toast({ title: 'Google Sheets connected', description: 'Your Google Sheets integration is now active.' });
      setGoogleSheetsConfig({ spreadsheetId: '', sheetName: 'Sheet1', events: ['form_submission', 'new_contact', 'unsubscribe'] });
      // Reload integrations
      const integrationsData = await api.getIntegrations();
      setIntegrations(integrationsData);
    } catch (error) {
      warn('Failed to create Google Sheets integration:', error);
      toast({ title: 'Connection failed', description: 'Could not connect Google Sheets.', variant: 'destructive' });
    } finally {
      setIsAddingGoogleSheets(false);
    }
  };

  const testIntegration = async (integrationId: string) => {
    setIsTestingWebhook(integrationId);
    try {
      const result = await api.testIntegration(integrationId);
      if (result.success) {
        toast({ title: 'Test successful', description: result.message });
      } else {
        toast({ title: 'Test failed', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      warn('Integration test failed:', error);
      toast({ title: 'Test failed', description: 'Could not test integration.', variant: 'destructive' });
    } finally {
      setIsTestingWebhook(null);
    }
  };

  const deleteIntegration = async (integrationId: string) => {
    try {
      await api.deleteIntegration(integrationId);
      toast({ title: 'Integration removed', description: 'The integration has been disconnected.' });
      setIntegrations(prev => prev.filter(i => i.id !== integrationId));
    } catch (error) {
      warn('Failed to delete integration:', error);
      toast({ title: 'Delete failed', description: 'Could not remove integration.', variant: 'destructive' });
    }
  };

  const toggleIntegrationStatus = async (integrationId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.updateIntegration(integrationId, { status: newStatus });
      setIntegrations(prev => prev.map(i => i.id === integrationId ? { ...i, status: newStatus } : i));
      toast({ title: 'Status updated', description: `Integration is now ${newStatus}.` });
    } catch (error) {
      warn('Failed to update integration status:', error);
      toast({ title: 'Update failed', description: 'Could not update integration status.', variant: 'destructive' });
    }
  };

  const regenerateZapierKey = async () => {
    try {
      const result = await api.regenerateZapierApiKey();
      setZapierApiKey(result.api_key);
      toast({ title: 'API key regenerated', description: 'Your new Zapier API key is ready.' });
    } catch (error) {
      warn('Failed to regenerate Zapier API key:', error);
      toast({ title: 'Regeneration failed', description: 'Could not regenerate API key.', variant: 'destructive' });
    }
  };

  const updateAiSettingsState = (updater: (prev: AiSettings) => AiSettings) => {
    setAiSettings(prev => updater(prev));
    setAiSettingsDirty(true);
  };

  const handleAiDefaultProviderChange = (value: string) => {
    updateAiSettingsState(prev => ({ ...prev, defaultProvider: value }));
  };

  const updateAiProvider = (providerKey: string, field: keyof AiProviderConfig, value: string) => {
    updateAiSettingsState(prev => {
      if (!prev.providers[providerKey]) return prev;
      return {
        ...prev,
        providers: {
          ...prev.providers,
          [providerKey]: {
            ...prev.providers[providerKey],
            [field]: value
          }
        }
      };
    });
  };

  const addAiProvider = () => {
    const key = newAiProviderKey.trim().toLowerCase().replace(/\s+/g, '-');
    if (!key) {
      toast({ title: 'Provider key required', description: 'Enter a provider key (e.g., openrouter).', variant: 'destructive' });
      return;
    }
    if (aiSettings.providers[key]) {
      toast({ title: 'Provider exists', description: 'Choose a unique provider key.', variant: 'destructive' });
      return;
    }
    const label = (newAiProviderLabel || newAiProviderKey).trim() || 'Custom Provider';
    updateAiSettingsState(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        [key]: createEmptyAiProvider(label)
      }
    }));
    setNewAiProviderKey('');
    setNewAiProviderLabel('');
  };

  const removeAiProvider = (providerKey: string) => {
    const providerCount = Object.keys(aiSettings.providers).length;
    if (providerKey === aiSettings.defaultProvider) {
      toast({ title: 'Cannot remove default provider', description: 'Set another default provider before removing this one.', variant: 'destructive' });
      return;
    }
    if (providerCount <= 1) {
      toast({ title: 'At least one provider required', description: 'Add another provider before removing this one.', variant: 'destructive' });
      return;
    }
    updateAiSettingsState(prev => {
      if (!prev.providers[providerKey]) return prev;
      const providers = { ...prev.providers };
      delete providers[providerKey];
      const channelDefaults = { ...prev.channelDefaults };
      AI_CHANNELS.forEach(({ key }) => {
        if (channelDefaults[key]?.provider === providerKey) {
          channelDefaults[key] = {
            ...channelDefaults[key],
            provider: prev.defaultProvider,
            model: providers[prev.defaultProvider]?.model || channelDefaults[key]?.model || 'gpt-4o-mini'
          };
        }
      });
      return {
        ...prev,
        providers,
        channelDefaults
      };
    });
  };

  const updateAiChannelSetting = (channel: AiChannelKey, field: keyof AiChannelDefault, value: string) => {
    updateAiSettingsState(prev => {
      const safeChannelConfig = prev.channelDefaults[channel] || getChannelConfig(channel, prev);
      return {
        ...prev,
        channelDefaults: {
          ...prev.channelDefaults,
          [channel]: {
            ...safeChannelConfig,
            [field]: value
          }
        }
      };
    });
  };

  const resetAiSettings = () => {
    setAiSettings(defaultAiSettings());
    setAiSettingsDirty(true);
  };

  const saveAiSettings = async () => {
    setIsSavingAiSettings(true);
    try {
      await api.updateSettings({ ai: aiSettings });
      toast({ title: 'AI settings saved', description: 'Providers and channel defaults updated successfully.' });
      setAiSettingsDirty(false);
    } catch (error) {
      warn('Failed to save AI settings', error);
      toast({ title: 'Save failed', description: 'Could not save AI settings.', variant: 'destructive' });
    } finally {
      setIsSavingAiSettings(false);
    }
  };



  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load email settings
        const emailSettingsData = await api.getSettings();
        if (emailSettingsData) {
          // Load API settings from the same response

          setApiSettings({
            apiKeys: emailSettingsData.apiKeys || { openai: '', sendgrid: '', stripe: '' },
            webhooks: emailSettingsData.webhooks || { formSubmission: '', emailBounce: '', unsubscribe: '' }
          });

          if (emailSettingsData.ai) {
            setAiSettings(emailSettingsData.ai as AiSettings);
            setAiSettingsDirty(false);
          }
        }


        // Load custom variables
        log('Loading custom variables...');
        try {
          const customVarsData = await api.getCustomVariables();
          log('Custom variables loaded:', customVarsData);
          if (customVarsData) {
            const variablesArray = Array.isArray(customVarsData)
              ? customVarsData
              : Array.isArray((customVarsData as any)?.data)
                ? (customVarsData as any).data
                : [];
            setCustomVariables(variablesArray);
          } else {
            setCustomVariables([]);
          }
        } catch (varsError) {
          warn('Could not load custom variables:', varsError);
          setCustomVariables([]);
        }

        // Load form settings
        log('Loading form settings...');
        try {
          const formSettingsData = await api.getFormSettings();
          log('Form settings loaded:', formSettingsData);
          if (formSettingsData) {
            setFormSettings(prev => ({ ...prev, ...formSettingsData }));
          }
        } catch (formError) {
          warn('Could not load form settings:', formError);
        }


        // Load notification preferences
        log('Loading notification preferences...');
        try {
          const notificationPrefs = await api.getNotificationPreferences();
          log('Notification preferences loaded:', notificationPrefs);
          if (notificationPrefs) {
            setNotificationSettings(prev => ({ ...prev, ...notificationPrefs }));
          }
        } catch (notifError) {
          warn('Could not load notification preferences:', notifError);
        }


        // Load integrations
        log('Loading integrations...');
        try {
          const integrationsData = await api.getIntegrations();
          log('Integrations loaded:', integrationsData);
          setIntegrations(integrationsData);
        } catch (intError) {
          warn('Could not load integrations:', intError);
          setIntegrations([]);
        }

        // Load Zapier API key
        try {
          const zapierData = await api.getZapierApiKey();
          if (zapierData?.api_key) {
            setZapierApiKey(zapierData.api_key);
          }
        } catch (zapierError) {
          warn('Could not load Zapier API key:', zapierError);
        }

        // Load proposal settings
        try {
          const propSettings = await proposalApi.getSettings();
          if (propSettings) {
            setProposalSettings({
              companyName: propSettings.company_name || '',
              companyLogo: propSettings.company_logo || '',
              brandColor: propSettings.branding?.primary_color || '#FF6B35',
              accentColor: propSettings.branding?.secondary_color || '#1E3A5F',
              defaultIntroduction: '', // Not in API currently
              defaultTerms: propSettings.default_terms_conditions || '',
              defaultSignatureText: 'By signing below, you agree to the terms outlined in this proposal.',
              defaultCurrency: propSettings.default_currency || 'USD',
              showTaxes: propSettings.show_pricing ?? true,
              defaultTaxRate: 0,
              enableDiscounts: true,
              defaultExpirationDays: propSettings.default_validity_days || 30,
              enableExpirationReminders: propSettings.email_notifications ?? true,
              reminderDaysBefore: [7, 3, 1],
              requireSignature: propSettings.require_signature ?? true,
              enableESignature: true,
              signatureProvider: 'internal',
              notifyOnView: true,
              notifyOnSign: true,
              notifyOnExpire: true,
              defaultTemplate: '',
              enableVersionHistory: true
            });
          }
        } catch (propError) {
          warn('Could not load proposal settings:', propError);
        }

        log('All settings loaded successfully!');

      } catch (err) {
        error('Error loading settings:', err);
        toast({
          title: 'Error loading settings',
          description: err instanceof Error ? err.message : 'Failed to load settings',
          variant: 'destructive'
        });
      }
    };

    if (user) {
      loadSettings();
    }
  }, [toast, user]);

  // Profile update functions
  const handleSaveProfile = async () => {
    try {
      if (!user) return;

      const updatedData = { name, email };
      await api.updateUserProfile(updatedData);

      toast({
        title: 'Profile updated',
        description: 'Your profile information has been saved successfully.',
      });
    } catch (err) {
      warn('Failed to update profile', err);
      toast({
        title: 'Update failed',
        description: 'Failed to save your profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Notification preferences update function
  const updateNotificationSetting = async (key: keyof typeof notificationSettings, value: boolean) => {
    try {
      // Update local state immediately for better UX
      setNotificationSettings(prev => ({ ...prev, [key]: value }));

      // Save to backend
      await api.updateNotificationPreferences({ [key]: value });

      toast({
        title: 'Notification preference updated',
        description: 'Your notification settings have been saved.',
      });
    } catch (err) {
      warn('Failed to update notification preference', err);
      // Revert on error
      setNotificationSettings(prev => ({ ...prev, [key]: !value }));
      toast({
        title: 'Update failed',
        description: 'Failed to save notification preference. Please try again.',
        variant: 'destructive',
      });
    }
  };





  // Form settings functions
  // Update local state only (for text inputs while typing)
  const setFormSettingValue = (key: keyof typeof formSettings, value: string | boolean | number) => {
    setFormSettings(prev => ({ ...prev, [key]: value }));
  };

  // Save form setting to backend (called on blur for text inputs, immediately for switches)
  const saveFormSetting = async (key: keyof typeof formSettings, value?: string | boolean | number) => {
    const valueToSave = value !== undefined ? value : formSettings[key];
    const normalizedValue = typeof valueToSave === 'string' && key === 'notificationEmail'
      ? valueToSave.trim()
      : valueToSave;

    try {
      await api.updateFormSettings({ [key]: normalizedValue });
      toast({
        title: 'Form settings updated',
        description: 'Your form preferences have been saved successfully.',
      });
    } catch (err) {
      console.error('Failed to update form settings', err);
      toast({
        title: 'Update failed',
        description: 'Failed to save your form preferences. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // For switches - update state and save immediately
  const updateFormSetting = async (key: keyof typeof formSettings, value: string | boolean | number) => {
    setFormSettings(prev => ({ ...prev, [key]: value }));
    await saveFormSetting(key, value);
  };

  // Custom variables functions
  const addCustomVariable = async () => {
    if (!newVariable.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a name for the custom variable.',
      });
      return;
    }

    try {
      const variable = await api.createCustomVariable({
        name: newVariable.name.trim(),
        description: newVariable.description.trim() || `Custom variable: ${newVariable.name.trim()}`
      });

      setCustomVariables(prev => [...prev, variable]);
      window.dispatchEvent(new CustomEvent('customVariablesUpdated'));

      setNewVariable({ name: '', description: '' });
      setIsAddingVariable(false);

      toast({
        title: 'Success',
        description: `Custom variable "${variable.name}" has been added.`,
      });
    } catch (err: unknown) {
      console.error('Failed to add custom variable', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to add custom variable. Please try again.',
      });
    }
  };

  const removeCustomVariable = async (id: string) => {
    try {
      await api.deleteCustomVariable(id);
      setCustomVariables(prev => prev.filter(v => v.id !== id));
      window.dispatchEvent(new CustomEvent('customVariablesUpdated'));

      toast({
        title: 'Success',
        description: 'Custom variable has been removed.',
      });
    } catch (err: unknown) {
      console.error('Failed to remove custom variable', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to remove custom variable. Please try again.',
      });
    }
  };

  const handleSaveProposalSettings = async () => {
    try {
      await proposalApi.updateSettings({
        company_name: proposalSettings.companyName,
        company_logo: proposalSettings.companyLogo,
        default_currency: proposalSettings.defaultCurrency,
        default_validity_days: proposalSettings.defaultExpirationDays,
        default_terms_conditions: proposalSettings.defaultTerms,
        email_notifications: proposalSettings.enableExpirationReminders,
        require_signature: proposalSettings.requireSignature,
        branding: {
          primary_color: proposalSettings.brandColor,
          secondary_color: proposalSettings.accentColor,
          font_family: 'Inter, sans-serif'
        }
      });
      toast({
        title: 'Proposal settings saved',
        description: 'Your proposal preferences have been updated successfully.',
      });
    } catch (err) {
      error('Failed to save proposal settings', err);
      toast({
        title: 'Save failed',
        description: 'Failed to save proposal settings. Please try again.',
        variant: 'destructive',
      });
    }
  };



  return (
    <div className="space-y-4">
      <SEO
        title="Settings"
        description="Manage your workspace, account settings, integrations, and outreach preferences in one place."
      />
      <div>
        <h1 className="text-[18px] font-bold">Settings</h1>
        <p className="text-[12px] text-muted-foreground">
          Manage your workspace, apps, deliverability, integrations, and AI preferences.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full overflow-visible">
        <div className="grid gap-6 md:grid-cols-[240px_1fr] items-start overflow-visible">
          <div className="sticky top-[72px] self-start bg-background rounded-xl border-2 border-slate-200 dark:border-slate-800 p-2 shadow-sm z-30">

            <TabsList className="hidden h-auto w-full flex-col items-stretch justify-start gap-0 rounded-none bg-transparent p-0 md:flex border-none">
              <div className="px-2 py-2 text-[12px] font-semibold text-slate-400 uppercase tracking-tight">Account</div>
              <TabsTrigger
                value="profile"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <User className="h-4 w-4 text-slate-500" />
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <ShieldCheck className="h-4 w-4 text-slate-500" />
                Security
              </TabsTrigger>


              <div className="mt-4 px-2 py-2 text-[12px] font-semibold text-slate-400 uppercase tracking-tight">Outreach</div>
              <TabsTrigger
                value="email"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Mail className="h-4 w-4 text-slate-500" />
                Email
              </TabsTrigger>
              <TabsTrigger
                value="sms-and-calls"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <MessageSquare className="h-4 w-4 text-slate-500" />
                SMS & Calls
              </TabsTrigger>
              <TabsTrigger
                value="forms"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <FileTextIcon className="h-4 w-4 text-slate-500" />
                Forms
              </TabsTrigger>
              <TabsTrigger
                value="landing-pages"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Layout className="h-4 w-4 text-slate-500" />
                Landing Pages
              </TabsTrigger>
              <TabsTrigger
                value="proposals"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <FileSignature className="h-4 w-4 text-slate-500" />
                Proposals
              </TabsTrigger>
              <TabsTrigger
                value="crm"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <TrendingUp className="h-4 w-4 text-slate-500" />
                CRM
              </TabsTrigger>
              <TabsTrigger
                value="sales"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Target className="h-4 w-4 text-slate-500" />
                Sales
              </TabsTrigger>

              <div className="mt-4 px-2 py-2 text-[12px] font-semibold text-slate-400 uppercase tracking-tight">Business</div>
              <TabsTrigger
                value="agency"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Building2 className="h-4 w-4 text-slate-500" />
                Agency
              </TabsTrigger>
              <TabsTrigger
                value="domains"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Globe className="h-4 w-4 text-slate-500" />
                Custom Domains
              </TabsTrigger>
              <TabsTrigger
                value="industry"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Briefcase className="h-4 w-4 text-slate-500" />
                Industry
              </TabsTrigger>
              <TabsTrigger
                value="finance"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <DollarSign className="h-4 w-4 text-slate-500" />
                Finance
              </TabsTrigger>
              <TabsTrigger
                value="hr"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Users className="h-4 w-4 text-slate-500" />
                HR
              </TabsTrigger>
              <TabsTrigger
                value="marketplace"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Globe className="h-4 w-4 text-slate-500" />
                Marketplace
              </TabsTrigger>

              <div className="mt-4 px-2 py-2 text-[12px] font-semibold text-slate-400 uppercase tracking-tight">Marketing & Service</div>
              <TabsTrigger
                value="marketing"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <TrendingUp className="h-4 w-4 text-slate-500" />
                Marketing
              </TabsTrigger>

              <TabsTrigger
                value="seo"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50 pl-8"
              >
                <Globe className="h-4 w-4 text-slate-500" />
                SEO
              </TabsTrigger>
              <TabsTrigger
                value="public-assets"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50 pl-8"
              >
                <Code className="h-4 w-4 text-slate-500" />
                Public Assets & SEO
              </TabsTrigger>
              <TabsTrigger
                value="blog"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50 pl-8"
              >
                <FileTextIcon className="h-4 w-4 text-slate-500" />
                Blog
              </TabsTrigger>
              <TabsTrigger
                value="channels"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <MessageSquare className="h-4 w-4 text-slate-500" />
                Messaging Channels
              </TabsTrigger>
              <TabsTrigger
                value="social-planner"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Share2 className="h-4 w-4 text-slate-500" />
                Social Planner
              </TabsTrigger>
              <TabsTrigger
                value="websites"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Globe className="h-4 w-4 text-slate-500" />
                Websites
              </TabsTrigger>
              <TabsTrigger
                value="media"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Image className="h-4 w-4 text-slate-500" />
                Media
              </TabsTrigger>
              <TabsTrigger
                value="calendars"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Calendar className="h-4 w-4 text-slate-500" />
                Calendars
              </TabsTrigger>
              <TabsTrigger
                value="lms"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <GraduationCap className="h-4 w-4 text-slate-500" />
                Learning (LMS)
              </TabsTrigger>
              <TabsTrigger
                value="affiliates"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Percent className="h-4 w-4 text-slate-500" />
                Affiliates
              </TabsTrigger>
              <TabsTrigger
                value="loyalty"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Award className="h-4 w-4 text-slate-500" />
                Loyalty
              </TabsTrigger>
              <TabsTrigger
                value="webinars"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50 pl-8"
              >
                <Video className="h-4 w-4 text-slate-500" />
                Webinars
              </TabsTrigger>
              <TabsTrigger
                value="courses"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50 pl-8"
              >
                <GraduationCap className="h-4 w-4 text-slate-500" />
                Courses
              </TabsTrigger>
              <TabsTrigger
                value="communities"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50 pl-8"
              >
                <Users className="h-4 w-4 text-slate-500" />
                Communities
              </TabsTrigger>
              <TabsTrigger
                value="culture"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Heart className="h-4 w-4 text-slate-500" />
                Culture
              </TabsTrigger>

              <div className="mt-4 px-2 py-2 text-[12px] font-semibold text-slate-400 uppercase tracking-tight">Service & Marketing</div>
              <TabsTrigger
                value="field-service"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Truck className="h-4 w-4 text-slate-500" />
                Field Service
              </TabsTrigger>
              <TabsTrigger
                value="helpdesk"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <HelpCircle className="h-4 w-4 text-slate-500" />
                Helpdesk
              </TabsTrigger>
              <TabsTrigger
                value="csat"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Star className="h-4 w-4 text-slate-500" />
                CSAT
              </TabsTrigger>
              <TabsTrigger
                value="reputation"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <ShieldCheck className="h-4 w-4 text-slate-500" />
                Reputation
              </TabsTrigger>

              <div className="mt-4 px-2 py-2 text-[12px] font-semibold text-slate-400 uppercase tracking-tight">Intelligence</div>
              <TabsTrigger
                value="ai"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Bot className="h-4 w-4 text-slate-500" />
                AI Agents
              </TabsTrigger>
              <TabsTrigger
                value="reporting"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <BarChart3 className="h-4 w-4 text-slate-500" />
                Reporting
              </TabsTrigger>
              <TabsTrigger
                value="sentiment"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <MessageSquare className="h-4 w-4 text-slate-500" />
                Sentiment Analysis
              </TabsTrigger>

              <div className="mt-4 px-2 py-2 text-[12px] font-semibold text-slate-400 uppercase tracking-tight">Apps</div>
              <TabsTrigger
                value="projects"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Kanban className="h-4 w-4 text-slate-500" />
                Projects
              </TabsTrigger>
              <TabsTrigger
                value="ecommerce"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <ShoppingBag className="h-4 w-4 text-slate-500" />
                Ecommerce
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <CreditCard className="h-4 w-4 text-slate-500" />
                Payments
              </TabsTrigger>
              <TabsTrigger
                value="scheduling"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Calendar className="h-4 w-4 text-slate-500" />
                Scheduling
              </TabsTrigger>
              <TabsTrigger
                value="apps"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Package className="h-4 w-4 text-slate-500" />
                Apps
              </TabsTrigger>
              <TabsTrigger
                value="webforms"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <FileTextIcon className="h-4 w-4 text-slate-500" />
                Web Forms
              </TabsTrigger>

              <div className="mt-4 px-2 py-2 text-[12px] font-semibold text-slate-400 uppercase tracking-tight">System</div>
              <TabsTrigger
                value="automation"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Zap className="h-4 w-4 text-slate-500" />
                Automation
              </TabsTrigger>
              <TabsTrigger
                value="custom-fields"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <FileTextIcon className="h-4 w-4 text-slate-500" />
                Custom Fields
              </TabsTrigger>
              <TabsTrigger
                value="tags"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Hash className="h-4 w-4 text-slate-500" />
                Tags
              </TabsTrigger>
              <TabsTrigger
                value="system-health"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Activity className="h-4 w-4 text-slate-500" />
                System Health
              </TabsTrigger>
              <TabsTrigger
                value="audit-logs"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <FileTextIcon className="h-4 w-4 text-slate-500" />
                Audit Logs
              </TabsTrigger>
              <TabsTrigger
                value="snapshots"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Camera className="h-4 w-4 text-slate-500" />
                Snapshots
              </TabsTrigger>
              <TabsTrigger
                value="sip"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Phone className="h-4 w-4 text-slate-500" />
                SIP Settings
              </TabsTrigger>
              <TabsTrigger
                value="mobile"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Loader2 className="h-4 w-4 text-slate-500" />
                Mobile App
              </TabsTrigger>
              <TabsTrigger
                value="push-notifications"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Zap className="h-4 w-4 text-slate-500" />
                Push Notifications
              </TabsTrigger>
              <TabsTrigger
                value="integrations"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Link2 className="h-4 w-4 text-slate-500" />
                Integrations
              </TabsTrigger>
              <TabsTrigger
                value="api"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Settings className="h-4 w-4 text-slate-500" />
                API & Webhooks
              </TabsTrigger>
              <TabsTrigger
                value="debug"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <AlertTriangle className="h-4 w-4 text-slate-500" />
                Debug
              </TabsTrigger>

              <div className="mt-4 px-2 py-2 text-[12px] font-semibold text-slate-400 uppercase tracking-tight">Organization</div>
              <TabsTrigger
                value="agency"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Building2 className="h-4 w-4 text-slate-500" />
                Agency Profile
              </TabsTrigger>
              <TabsTrigger
                value="user-management"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <Users className="h-4 w-4 text-slate-500" />
                Team & Permissions
              </TabsTrigger>
              <TabsTrigger
                value="billing"
                className="w-full justify-start gap-3 px-3 py-2.5 text-[14px] font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-slate-50/50"
              >
                <CreditCard className="h-4 w-4 text-slate-500" />
                Billing & Subscription
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="min-w-0">

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <AccountSettings />
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <SecuritySettings />
            </TabsContent>



            {/* Email Tab */}
            <TabsContent value="email">
              <EmailSettings />
            </TabsContent>

            <TabsContent value="agency">
              <AgencySettings />
            </TabsContent>

            <TabsContent value="user-management">
              <UserManagement />
            </TabsContent>

            <TabsContent value="billing">
              <AgencyBilling />
            </TabsContent>

            <TabsContent value="webforms">
              <WebFormsSettings />
            </TabsContent>

            <TabsContent value="sentiment">
              <SentimentConfig />
            </TabsContent>

            {/* SMS & Calls Tab */}
            <TabsContent value="sms-and-calls">
              <SMSAndCallsSettings />
            </TabsContent>

            <TabsContent value="forms" className="space-y-6">
              <FormSettings />
            </TabsContent>

            {/* CRM Tab */}
            <TabsContent value="crm" className="space-y-6">
              <CRMSettingsPage />
            </TabsContent>

            {/* Sales Settings Tab */}
            <TabsContent value="sales" className="space-y-6">
              <SalesSettings />
            </TabsContent>

            {/* Landing Pages Tab */}
            <TabsContent value="landing-pages" className="space-y-6">
              <LandingPageSettings />
            </TabsContent>

            {/* CRM Tab */}
            <TabsContent value="crm" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    Pipeline Settings
                  </CardTitle>
                  <CardDescription>Configure your sales pipeline and lead management</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Default Pipeline Stages</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        These stages will be used for new pipelines
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {crmSettings.defaultPipelineStages.map((stage, index) => (
                          <Badge key={index} variant="secondary" className="px-3 py-1">
                            {stage}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable Lead Scoring</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically score leads based on engagement
                        </p>
                      </div>
                      <Switch
                        checked={crmSettings.enableLeadScoring}
                        onCheckedChange={v => setCrmSettings(prev => ({ ...prev, enableLeadScoring: v }))}
                      />
                    </div>

                    {crmSettings.enableLeadScoring && (
                      <div className="space-y-2 ml-4">
                        <Label htmlFor="crmScoreThreshold">Hot Lead Threshold</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="crmScoreThreshold"
                            type="number"
                            min="0"
                            max="100"
                            value={crmSettings.leadScoringThreshold}
                            onChange={e => setCrmSettings(prev => ({ ...prev, leadScoringThreshold: parseInt(e.target.value) || 50 }))}
                            className="w-24"
                          />
                          <span className="text-sm text-muted-foreground">points</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Leads scoring above this threshold are marked as "hot"
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-Assign Leads</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically assign new leads to team members
                        </p>
                      </div>
                      <Switch
                        checked={crmSettings.autoAssignLeads}
                        onCheckedChange={v => setCrmSettings(prev => ({ ...prev, autoAssignLeads: v }))}
                      />
                    </div>

                    {crmSettings.autoAssignLeads && (
                      <div className="space-y-2 ml-4">
                        <Label htmlFor="crmDefaultOwner">Default Lead Owner</Label>
                        <Input
                          id="crmDefaultOwner"
                          placeholder="Enter email or select team member"
                          value={crmSettings.defaultLeadOwner}
                          onChange={e => setCrmSettings(prev => ({ ...prev, defaultLeadOwner: e.target.value }))}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    Contact Management
                  </CardTitle>
                  <CardDescription>Configure contact deduplication and data handling</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Duplicate Detection</Label>
                      <p className="text-sm text-muted-foreground">
                        Detect and flag potential duplicate contacts
                      </p>
                    </div>
                    <Switch
                      checked={crmSettings.enableDuplicateDetection}
                      onCheckedChange={v => setCrmSettings(prev => ({ ...prev, enableDuplicateDetection: v }))}
                    />
                  </div>

                  {crmSettings.enableDuplicateDetection && (
                    <>
                      <div className="space-y-2 ml-4">
                        <Label>Match Fields</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Fields used to detect duplicates
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {['email', 'phone', 'name', 'company'].map(field => (
                            <Badge
                              key={field}
                              variant={crmSettings.duplicateMatchFields.includes(field) ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => {
                                setCrmSettings(prev => ({
                                  ...prev,
                                  duplicateMatchFields: prev.duplicateMatchFields.includes(field)
                                    ? prev.duplicateMatchFields.filter(f => f !== field)
                                    : [...prev.duplicateMatchFields, field]
                                }));
                              }}
                            >
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between ml-4">
                        <div className="space-y-0.5">
                          <Label>Auto-Merge Duplicates</Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically merge detected duplicates
                          </p>
                        </div>
                        <Switch
                          checked={crmSettings.autoMergeContacts}
                          onCheckedChange={v => setCrmSettings(prev => ({ ...prev, autoMergeContacts: v }))}
                        />
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto Data Enrichment</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically enrich contact data from external sources
                      </p>
                    </div>
                    <Switch
                      checked={crmSettings.enableAutoEnrichment}
                      onCheckedChange={v => setCrmSettings(prev => ({ ...prev, enableAutoEnrichment: v }))}
                    />
                  </div>

                  {crmSettings.enableAutoEnrichment && (
                    <div className="space-y-2 ml-4">
                      <Label>Enrichment Provider</Label>
                      <Select
                        value={crmSettings.enrichmentProvider}
                        onValueChange={v => setCrmSettings(prev => ({ ...prev, enrichmentProvider: v }))}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="clearbit">Clearbit</SelectItem>
                          <SelectItem value="apollo">Apollo.io</SelectItem>
                          <SelectItem value="zoominfo">ZoomInfo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    Lead Lifecycle
                  </CardTitle>
                  <CardDescription>Configure lead aging and archival rules</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="crmStaleAfter">Mark Lead as Stale After</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="crmStaleAfter"
                          type="number"
                          min="1"
                          value={crmSettings.leadStaleAfterDays}
                          onChange={e => setCrmSettings(prev => ({ ...prev, leadStaleAfterDays: parseInt(e.target.value) || 30 }))}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">days of inactivity</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="crmArchiveAfter">Auto-Archive After</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="crmArchiveAfter"
                          type="number"
                          min="1"
                          value={crmSettings.autoArchiveAfterDays}
                          onChange={e => setCrmSettings(prev => ({ ...prev, autoArchiveAfterDays: parseInt(e.target.value) || 90 }))}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">days of inactivity</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Stale Lead Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when leads become stale
                      </p>
                    </div>
                    <Switch
                      checked={crmSettings.enableStaleLeadAlerts}
                      onCheckedChange={v => setCrmSettings(prev => ({ ...prev, enableStaleLeadAlerts: v }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-Tagging</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically tag leads based on behavior and source
                      </p>
                    </div>
                    <Switch
                      checked={crmSettings.enableAutoTagging}
                      onCheckedChange={v => setCrmSettings(prev => ({ ...prev, enableAutoTagging: v }))}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button className="bg-hunter-orange hover:bg-hunter-orange/90 text-white">
                      <Save className="h-4 w-4 mr-2" />
                      Save CRM Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Proposals Tab */}
            <TabsContent value="proposals" className="space-y-6">
              <ProposalSettings />
            </TabsContent>

            {/* Variables Tab */}
            <TabsContent value="variables" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Variables</CardTitle>
                  <CardDescription>Available system variables for personalization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                    <code className="bg-muted px-2 py-1 rounded">{'{{firstName}}'}</code>
                    <code className="bg-muted px-2 py-1 rounded">{'{{lastName}}'}</code>
                    <code className="bg-muted px-2 py-1 rounded">{'{{name}}'}</code>
                    <code className="bg-muted px-2 py-1 rounded">{'{{email}}'}</code>
                    <code className="bg-muted px-2 py-1 rounded">{'{{company}}'}</code>
                    <code className="bg-muted px-2 py-1 rounded">{'{{unsubscribeUrl}}'}</code>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle>Custom Variables</CardTitle>
                      <CardDescription>Create custom merge variables for your campaigns</CardDescription>
                    </div>
                    <Button
                      onClick={() => setIsAddingVariable(true)}
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Variable
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Add Variable Form */}
                  {isAddingVariable && (
                    <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="variableName">Variable Name</Label>
                          <Input
                            id="variableName"
                            placeholder="e.g., position, industry, location"
                            value={newVariable.name}
                            onChange={e => setNewVariable(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="variableDescription">Description (Optional)</Label>
                          <Input
                            id="variableDescription"
                            placeholder="e.g., Job position of the recipient"
                            value={newVariable.description}
                            onChange={e => setNewVariable(prev => ({ ...prev, description: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button onClick={addCustomVariable} size="sm">
                          Add Variable
                        </Button>
                        <Button
                          onClick={() => {
                            setIsAddingVariable(false);
                            setNewVariable({ name: '', description: '' });
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Custom Variables List */}
                  {customVariables.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Your Custom Variables</Label>
                      <div className="space-y-2">
                        {customVariables.map((variable) => (
                          <div key={variable.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg gap-3">
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <code className="bg-muted px-2 py-1 rounded text-sm">
                                  {`{{${variable.name}}}`}
                                </code>
                                {variable.description && (
                                  <span className="text-sm text-muted-foreground">
                                    {variable.description}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              onClick={() => removeCustomVariable(variable.id)}
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive w-full sm:w-auto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {customVariables.length === 0 && !isAddingVariable && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No custom variables created yet.</p>
                      <p className="text-sm">Click "Add Variable" to create your first custom variable.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Settings Tab */}
            <TabsContent value="ai" className="space-y-6">
              <AISettings />
            </TabsContent>

            {/* Reporting Settings Tab */}
            <TabsContent value="reporting" className="space-y-6">
              <ReportingSettings />
            </TabsContent>

            <TabsContent value="snapshots" className="space-y-6">
              <Snapshots />
            </TabsContent>

            {/* Integrations Tab */}
            <TabsContent value="integrations" className="space-y-6">
              <IntegrationsSettings />
            </TabsContent>
            {/* Agency Tab */}
            <TabsContent value="agency" className="space-y-6">
              <AgencySettings />
            </TabsContent>

            {/* Custom Domains Tab */}
            <TabsContent value="domains" className="space-y-6">
              <DomainsSettings />
            </TabsContent>

            {/* Industry Tab */}
            <TabsContent value="industry" className="space-y-6">
              <IndustrySettings />
            </TabsContent>

            {/* Marketplace Tab */}
            <TabsContent value="marketplace" className="space-y-6">
              <MarketplacePreferences />
            </TabsContent>



            {/* Marketing Tab */}
            <TabsContent value="marketing" className="space-y-6">
              <MarketingSettings />
            </TabsContent>

            {/* Social Planner Tab */}
            <TabsContent value="social-planner" className="space-y-6">
              <SocialPlannerSettings />
            </TabsContent>

            {/* Communities Tab */}
            <TabsContent value="communities" className="space-y-6">
              <CommunitiesSettings />
            </TabsContent>

            {/* SEO Settings Tab */}
            <TabsContent value="seo" className="space-y-6">
              <SeoSettings />
            </TabsContent>

            {/* Public Assets Tab */}
            <TabsContent value="public-assets" className="space-y-6">
              <PublicAssetsSettings />
            </TabsContent>

            {/* Blog Settings Tab */}
            <TabsContent value="blog" className="space-y-6">
              <BlogSettings />
            </TabsContent>

            {/* Channels Tab */}
            <TabsContent value="channels" className="space-y-6">
              <ChannelSettings />
            </TabsContent>

            {/* Websites Tab */}
            <TabsContent value="websites" className="space-y-6">
              <WebsiteSettings />
            </TabsContent>

            {/* Calendars Tab */}
            <TabsContent value="calendars" className="space-y-6">
              <CalendarSettings />
            </TabsContent>

            {/* LMS Tab */}
            <TabsContent value="lms" className="space-y-6">
              <LMSSettings />
            </TabsContent>

            {/* Finance Tab */}
            <TabsContent value="finance" className="space-y-6">
              <FinanceSettings />
            </TabsContent>

            {/* HR Tab */}
            <TabsContent value="hr" className="space-y-6">
              <HRSettings />
            </TabsContent>

            {/* Helpdesk Tab */}
            <TabsContent value="helpdesk" className="space-y-6">
              <HelpdeskSettings />
            </TabsContent>

            {/* CSAT Tab */}
            <TabsContent value="csat" className="space-y-6">
              <CSATSettings />
            </TabsContent>

            {/* Reputation Tab */}
            <TabsContent value="reputation" className="space-y-6">
              <ReputationSettings />
            </TabsContent>

            {/* Automation Tab */}
            <TabsContent value="automation" className="space-y-6">
              <AutomationSettings />
            </TabsContent>

            {/* Custom Fields Tab */}
            <TabsContent value="custom-fields" className="space-y-6">
              <CustomFieldsSettings />
            </TabsContent>

            {/* Tags Tab */}
            <TabsContent value="tags" className="space-y-6">
              <TagsSettings />
            </TabsContent>

            {/* SIP Settings Tab */}
            <TabsContent value="sip" className="space-y-6">
              <SIPSettings />
            </TabsContent>

            {/* Mobile App Tab */}
            <TabsContent value="mobile" className="space-y-6">
              <MobileSettings />
            </TabsContent>

            {/* Push Notifications Tab */}
            <TabsContent value="push-notifications" className="space-y-6">
              <PushNotifications />
            </TabsContent>

            {/* Debug Tab */}
            <TabsContent value="debug" className="space-y-6">
              <DebugSettings />
            </TabsContent>

            {/* API Tab */}
            <TabsContent value="api" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>Manage third-party service API keys</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="openaiKey">OpenAI API Key</Label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          id="openaiKey"
                          type="password"
                          placeholder="sk-..."
                          value={apiSettings.apiKeys.openai}
                          onChange={(e) => setApiKeyValue('openai', e.target.value)}
                          onBlur={() => saveApiKey('openai')}
                          className="font-mono flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => testApiKey('openai')}
                          disabled={testingApiKey === 'openai' || !apiSettings.apiKeys.openai}
                        >
                          {testingApiKey === 'openai' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <TestTube className="h-4 w-4" />
                          )}
                          <span className="ml-1">Test</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => {
                            navigator.clipboard.writeText(apiSettings.apiKeys.openai);
                            toast({ title: 'Copied', description: 'OpenAI API key copied to clipboard' });
                          }}
                          disabled={!apiSettings.apiKeys.openai}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Used for AI-powered email generation and personalization
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sendgridKey">SendGrid API Key</Label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          id="sendgridKey"
                          type="password"
                          placeholder="SG..."
                          value={apiSettings.apiKeys.sendgrid}
                          onChange={(e) => setApiKeyValue('sendgrid', e.target.value)}
                          onBlur={() => saveApiKey('sendgrid')}
                          className="font-mono flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => testApiKey('sendgrid')}
                          disabled={testingApiKey === 'sendgrid' || !apiSettings.apiKeys.sendgrid}
                        >
                          {testingApiKey === 'sendgrid' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <TestTube className="h-4 w-4" />
                          )}
                          <span className="ml-1">Test</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => {
                            navigator.clipboard.writeText(apiSettings.apiKeys.sendgrid);
                            toast({ title: 'Copied', description: 'SendGrid API key copied to clipboard' });
                          }}
                          disabled={!apiSettings.apiKeys.sendgrid}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Used for email delivery and tracking
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stripeKey">Stripe API Key</Label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          id="stripeKey"
                          type="password"
                          placeholder="sk_live_... or sk_test_..."
                          value={apiSettings.apiKeys.stripe}
                          onChange={(e) => setApiKeyValue('stripe', e.target.value)}
                          onBlur={() => saveApiKey('stripe')}
                          className="font-mono flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => testApiKey('stripe')}
                          disabled={testingApiKey === 'stripe' || !apiSettings.apiKeys.stripe}
                        >
                          {testingApiKey === 'stripe' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <TestTube className="h-4 w-4" />
                          )}
                          <span className="ml-1">Test</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => {
                            navigator.clipboard.writeText(apiSettings.apiKeys.stripe);
                            toast({ title: 'Copied', description: 'Stripe API key copied to clipboard' });
                          }}
                          disabled={!apiSettings.apiKeys.stripe}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Used for payment processing and billing
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Webhook Endpoints</CardTitle>
                  <CardDescription>Configure webhook URLs for real-time notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="formSubmissionWebhook">Form Submission Webhook</Label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          id="formSubmissionWebhook"
                          type="url"
                          placeholder="https://your-app.com/webhooks/form-submission"
                          value={apiSettings.webhooks.formSubmission}
                          onChange={(e) => setWebhookValue('formSubmission', e.target.value)}
                          onBlur={() => saveWebhook('formSubmission')}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => testWebhook('formSubmission')}
                          disabled={testingWebhook === 'formSubmission' || !apiSettings.webhooks.formSubmission}
                        >
                          {testingWebhook === 'formSubmission' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <TestTube className="h-4 w-4" />
                          )}
                          <span className="ml-1">Test</span>
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Triggered when a form is submitted
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emailBounceWebhook">Email Bounce Webhook</Label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          id="emailBounceWebhook"
                          type="url"
                          placeholder="https://your-app.com/webhooks/email-bounce"
                          value={apiSettings.webhooks.emailBounce}
                          onChange={(e) => setWebhookValue('emailBounce', e.target.value)}
                          onBlur={() => saveWebhook('emailBounce')}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => testWebhook('emailBounce')}
                          disabled={testingWebhook === 'emailBounce' || !apiSettings.webhooks.emailBounce}
                        >
                          {testingWebhook === 'emailBounce' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <TestTube className="h-4 w-4" />
                          )}
                          <span className="ml-1">Test</span>
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Triggered when an email bounces
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unsubscribeWebhook">Unsubscribe Webhook</Label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          id="unsubscribeWebhook"
                          type="url"
                          placeholder="https://your-app.com/webhooks/unsubscribe"
                          value={apiSettings.webhooks.unsubscribe}
                          onChange={(e) => setWebhookValue('unsubscribe', e.target.value)}
                          onBlur={() => saveWebhook('unsubscribe')}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => testWebhook('unsubscribe')}
                          disabled={testingWebhook === 'unsubscribe' || !apiSettings.webhooks.unsubscribe}
                        >
                          {testingWebhook === 'unsubscribe' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <TestTube className="h-4 w-4" />
                          )}
                          <span className="ml-1">Test</span>
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Triggered when someone unsubscribes
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Apps Settings */}
            <TabsContent value="projects" className="space-y-6">
              <ProjectSettings />
            </TabsContent>

            <TabsContent value="ecommerce" className="space-y-6">
              <EcommerceSettings />
            </TabsContent>

            <TabsContent value="push-notifications" className="space-y-6">
              <PushNotifications />
            </TabsContent>

            <TabsContent value="sip" className="space-y-6">
              <SIPSettings />
            </TabsContent>

            <TabsContent value="debug" className="space-y-6">
              <DebugSettings />
            </TabsContent>

            <TabsContent value="system-health" className="space-y-6">
              <SystemHealth />
            </TabsContent>

            <TabsContent value="audit-logs" className="space-y-6">
              <AuditLog />
            </TabsContent>

            <TabsContent value="apps" className="space-y-6">
              <Apps />
            </TabsContent>

            <TabsContent value="media" className="space-y-6">
              <MediaLibrary />
            </TabsContent>

            {/* Affiliates Settings */}
            <TabsContent value="affiliates" className="space-y-6">
              <AffiliateSettings />
            </TabsContent>

            {/* Loyalty Settings */}
            <TabsContent value="loyalty" className="space-y-6">
              <LoyaltySettings />
            </TabsContent>

            {/* Field Service Settings */}
            <TabsContent value="field-service" className="space-y-6">
              <FieldServiceSettings />
            </TabsContent>

            {/* Webinar Settings */}
            <TabsContent value="webinars" className="space-y-6">
              <WebinarSettings />
            </TabsContent>

            {/* Courses Settings */}
            <TabsContent value="courses" className="space-y-6">
              <CoursesSettings />
            </TabsContent>

            {/* Culture Settings */}
            <TabsContent value="culture" className="space-y-6">
              <CultureSettings />
            </TabsContent>

            {/* Payments Settings */}
            <TabsContent value="payments" className="space-y-6">
              <PaymentsSettings />
            </TabsContent>

            {/* Scheduling Settings */}
            <TabsContent value="scheduling" className="space-y-6">
              <SchedulingSettings />
            </TabsContent>

          </div>
        </div>
      </Tabs>
    </div>
  );
};

// Wrap with memo to prevent React Strict Mode double-mounting issues
export default React.memo(UnifiedSettings);

