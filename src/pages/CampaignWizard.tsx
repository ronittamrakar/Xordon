import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, type Campaign, type SendingAccount, type Recipient, type Template, type FollowUpEmail, type Sequence, type Form, type SMSSequenceStep } from '@/lib/api';
import { useCampaignSettings } from '@/hooks/useCampaignSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UnifiedContactSelector } from '@/components/UnifiedContactSelector';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  Users,
  Mail,
  Calendar,
  Upload,
  FileTextIcon,
  Settings,
  Eye,
  Plus,
  X,
  Check,
  Download,
  Search,
  Trash2,
  Bot,
  Loader2,
  Sparkles,
  Zap as ZapIcon,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import FollowUpEmailBuilder from '@/components/FollowUpEmailBuilder';
import CombinedFollowUpBuilder, { type CombinedFollowUpStep } from '@/components/CombinedFollowUpBuilder';
import RichTextEditor from '@/components/editors/RichTextEditor';
import CSVColumnMapper from '@/components/CSVColumnMapper';
import type { Contact } from '@/types/contact';

type WizardStep = 'name' | 'account' | 'content' | 'recipients' | 'settings' | 'review';

interface RecipientData {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
}

const CampaignWizard = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { settings: campaignSettings, loading: settingsLoading, validateRequiredSettings, validateConsistency } = useCampaignSettings();

  // State management
  const [currentStep, setCurrentStep] = useState<WizardStep>('name');
  const [sendingAccounts, setSendingAccounts] = useState<SendingAccount[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [abTests, setAbTests] = useState<api.ABTest[]>([]);
  const [selectedAbTestId, setSelectedAbTestId] = useState<string>('none');

  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [testEmailAddress, setTestEmailAddress] = useState<string>('');

  const [campaignData, setCampaignData] = useState<Campaign | null>(null);
  const [currentCampaignId, setCurrentCampaignId] = useState<string | undefined>(id);

  // Ref to prevent repeated validation toasts
  const hasValidatedSettingsRef = useRef(false);

  // Sync currentCampaignId with URL parameter changes
  useEffect(() => {
    if (id && id !== ':id') {
      setCurrentCampaignId(id);
    } else {
      setCurrentCampaignId(undefined);
    }
  }, [id]);

  // Support "Use Template" flow: /reach/outbound/email/campaigns/new?templateId=...
  useEffect(() => {
    const templateIdFromUrl = searchParams.get('templateId');
    if (!templateIdFromUrl) return;
    // Only auto-select template when creating a NEW campaign
    if (currentCampaignId) return;
    setSelectedTemplateId(templateIdFromUrl);
  }, [searchParams, currentCampaignId]);
  const [pendingRecipients, setPendingRecipients] = useState<RecipientData[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [manualRecipient, setManualRecipient] = useState<RecipientData>({ email: '' });
  const [recipientMethod, setRecipientMethod] = useState<'csv' | 'manual' | 'existing'>('csv');
  const [existingRecipients, setExistingRecipients] = useState<Recipient[]>([]);
  const [selectedExistingRecipients, setSelectedExistingRecipients] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [showColumnMapper, setShowColumnMapper] = useState(false);
  const [showAddContactDialog, setShowAddContactDialog] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [recipientSearchTerm, setRecipientSearchTerm] = useState('');
  const [followUpEmails, setFollowUpEmails] = useState<Omit<FollowUpEmail, 'id' | 'campaignId' | 'userId' | 'createdAt' | 'updatedAt'>[]>([]);
  const [combinedFollowUps, setCombinedFollowUps] = useState<CombinedFollowUpStep[]>([]);
  const [followUpType, setFollowUpType] = useState<'email' | 'combined'>('email');

  // Auto-save state
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Test email state
  const [testEmailLoading, setTestEmailLoading] = useState(false);

  // AI generation state
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTarget, setAiTarget] = useState<'subject' | 'content' | 'both'>('both');
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmailHistory, setTestEmailHistory] = useState<Array<{ email: string, timestamp: Date }>>([]);

  // Template preview state
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);

  // Sequence state
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [selectedSequenceId, setSelectedSequenceId] = useState<string>('');
  const [showSequencePreview, setShowSequencePreview] = useState(false);

  // Form state
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [showFormPreview, setShowFormPreview] = useState(false);

  // Recipient table state
  const [recipientSearch, setRecipientSearch] = useState('');
  const [recipientSortBy, setRecipientSortBy] = useState<string>('email');
  const [recipientSortOrder, setRecipientSortOrder] = useState<'asc' | 'desc'>('asc');

  // Form data
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    subject: '',
    htmlContent: '',
    sendingAccountId: '',

    // Scheduling settings
    useCustomScheduling: false,
    sendingWindowStart: campaignSettings.email.sendingWindowStart,
    sendingWindowEnd: campaignSettings.email.sendingWindowEnd,
    timezone: campaignSettings.email.timezone,
    emailDelay: String(campaignSettings.email.delayBetweenEmails),
    batchSize: '50',
    priority: 'normal' as 'low' | 'normal' | 'high',
    retryAttempts: '3',
    pauseBetweenBatches: '300',
    respectSendingWindow: true,
    scheduledAt: '',
    sendingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as string[],

    // Unsubscribe settings
    unsubscribePlainText: campaignSettings.email.unsubscribeText,
    unsubscribeFormatted: '<p>If you no longer wish to receive these emails, you can <a href="{{unsubscribeUrl}}">unsubscribe here</a>.</p>',

    // Additional required properties
    status: 'draft' as 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused' | 'archived',
    createdAt: '',
    totalRecipients: 0,
    sent: 0,
    opens: 0,
    clicks: 0,
    bounces: 0,
    unsubscribes: 0,
    ab_test_id: null as string | null,
    campaign_type: 'warm' as 'cold' | 'warm',
    stop_on_reply: true,
  });

  const steps: Array<{ id: WizardStep; title: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; description: string }> = [
    { id: 'name', title: 'Campaign Name', icon: FileTextIcon, description: 'Enter your campaign name and basic details' },
    { id: 'account', title: 'Sending Account', icon: Send, description: 'Choose the email account to send from' },
    { id: 'content', title: 'Content', icon: Mail, description: 'Create your email content and follow-ups' },
    { id: 'recipients', title: 'Contacts', icon: Users, description: 'Choose or import contacts for your campaign' },
    { id: 'settings', title: 'Settings', icon: Settings, description: 'Configure sending schedule and preferences' },
    { id: 'review', title: 'Preview', icon: Eye, description: 'Review and launch your campaign' },
  ];

  const getCurrentStepIndex = () => steps.findIndex(step => step.id === currentStep);
  const getProgress = () => ((getCurrentStepIndex() + 1) / steps.length) * 100;

  // Computed values for recipient table
  const filteredAndSortedRecipients = pendingRecipients
    .filter(recipient => {
      if (!recipientSearch) return true;
      const searchLower = recipientSearch.toLowerCase();
      return (
        recipient.email.toLowerCase().includes(searchLower) ||
        (recipient.firstName || '').toLowerCase().includes(searchLower) ||
        (recipient.lastName || '').toLowerCase().includes(searchLower) ||
        (recipient.company || '').toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      const aValue = a[recipientSortBy] || '';
      const bValue = b[recipientSortBy] || '';
      const comparison = aValue.localeCompare(bValue);
      return recipientSortOrder === 'asc' ? comparison : -comparison;
    });

  // Helper functions

  // Update form data when settings load
  useEffect(() => {
    if (!settingsLoading) {
      setFormData(prev => ({
        ...prev,
        sendingWindowStart: campaignSettings.email.sendingWindowStart,
        sendingWindowEnd: campaignSettings.email.sendingWindowEnd,
        timezone: campaignSettings.email.timezone,
        emailDelay: String(campaignSettings.email.delayBetweenEmails),
        unsubscribePlainText: campaignSettings.email.unsubscribeText,
      }));
    }
  }, [settingsLoading, campaignSettings]);

  // Validate required settings before proceeding (only once when settings are loaded)
  useEffect(() => {
    if (!settingsLoading && !hasValidatedSettingsRef.current) {
      hasValidatedSettingsRef.current = true;

      const validation = validateRequiredSettings('email');
      if (!validation.valid) {
        toast({
          title: 'Missing Required Settings',
          description: `Please configure: ${validation.missing.join(', ')} in Settings page`,
          variant: 'destructive',
        });
      }

      // Check for settings consistency
      const consistency = validateConsistency();
      if (!consistency.valid) {
        toast({
          title: 'Settings Inconsistency Detected',
          description: consistency.inconsistencies.join('. '),
          variant: 'destructive',
        });
      }
    }
  }, [settingsLoading]);

  useEffect(() => {
    const init = async () => {
      if (!api.isAuthenticated()) {
        navigate('/login');
        return;
      }
      try {
        const [accounts, templatesData, recipients, sequencesData, formsData, abTestsData] = await Promise.all([
          api.getSendingAccounts(),
          api.getTemplates(),
          api.getRecipients(),
          api.getSequences(),
          api.getForms(),
          api.getABTests()
        ]);

        console.log('Loaded sending accounts:', accounts);
        console.log('Current selected account ID:', selectedAccountId);

        setSendingAccounts(accounts);
        setTemplates(templatesData);
        setExistingRecipients(recipients);
        setSequences(sequencesData);
        setForms(formsData);
        setAbTests(abTestsData.items || []);

        // Validate that the selected account still exists
        if (selectedAccountId && !accounts.find(acc => acc.id === selectedAccountId)) {
          console.log('Selected account no longer exists, clearing selection');
          setSelectedAccountId('');
          setFormData(prev => ({ ...prev, sendingAccountId: '' }));
        }

        if (accounts.length === 0) {
          toast({
            title: 'No sending accounts',
            description: 'Please add a sending account first.',
            variant: 'destructive',
          });
          navigate('/settings#sending-accounts');
          return;
        }

        if (currentCampaignId && currentCampaignId !== ':id') {
          try {
            const data = await api.getCampaign(currentCampaignId);
            setCampaignData(data);

            console.log('Loading campaign data:', data);

            // Update all form data and state variables consistently
            const updatedFormData = {
              ...formData,
              id: data.id || '',
              name: data.name || '',
              subject: data.subject || '',
              htmlContent: data.htmlContent || '',
              sendingAccountId: data.sendingAccountId || '',

              // Preserve other scheduling and settings data
              useCustomScheduling: data.useCustomScheduling || false,
              sendingWindowStart: data.sendingWindowStart || campaignSettings.email.sendingWindowStart,
              sendingWindowEnd: data.sendingWindowEnd || campaignSettings.email.sendingWindowEnd,
              timezone: data.timezone || campaignSettings.email.timezone,
              emailDelay: data.emailDelay?.toString() || String(campaignSettings.email.delayBetweenEmails),
              batchSize: data.batchSize?.toString() || '50',
              priority: data.priority || 'normal',
              retryAttempts: data.retryAttempts?.toString() || '3',
              pauseBetweenBatches: data.pauseBetweenBatches?.toString() || '300',
              respectSendingWindow: data.respectSendingWindow !== false,
              scheduledAt: data.scheduledAt || '',
              sendingDays: data.sendingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],

              // Unsubscribe settings
              unsubscribePlainText: data.unsubscribePlainText || campaignSettings.email.unsubscribeText,
              unsubscribeFormatted: data.unsubscribeFormatted || '<p>If you no longer wish to receive these emails, you can <a href="{{unsubscribeUrl}}">unsubscribe here</a>.</p>',

              status: data.status || 'draft',
              createdAt: data.createdAt || '',
              totalRecipients: data.totalRecipients || 0,
              sent: data.sent || 0,
              opens: data.opens || 0,
              clicks: data.clicks || 0,
              bounces: data.bounces || 0,
              unsubscribes: data.unsubscribes || 0,
              campaign_type: data.campaign_type || 'warm',
              stop_on_reply: data.stop_on_reply !== false,
            };

            setFormData(updatedFormData);
            setSelectedAccountId(data.sendingAccountId || '');

            // Load follow-up emails for this campaign
            try {
              const followUps = await api.getFollowUpEmails(data.id);
              setFollowUpEmails(followUps || []);
            } catch (error) {
              console.warn('Failed to load follow-up emails:', error);
              setFollowUpEmails([]);
            }

            console.log('Campaign loaded successfully:', data);
            console.log('Form data updated to:', updatedFormData);

            // Mark as no unsaved changes since we just loaded from server
            setHasUnsavedChanges(false);
          } catch (err) {
            console.error('Failed to load campaign:', err);
            toast({ title: 'Failed to load campaign', description: 'Could not fetch campaign details.', variant: 'destructive' });
          }
        }
      } catch (error: unknown) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
        toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      }
    };

    init();
  }, [currentCampaignId, navigate, toast]);

  // Load existing recipients when needed
  const loadExistingRecipients = async () => {
    try {
      const recipients = await api.getRecipients();
      setExistingRecipients(recipients);
    } catch (error) {
      console.error('Failed to load existing recipients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load existing recipients',
        variant: 'destructive',
      });
    }
  };

  // Load existing recipients when switching to existing tab
  useEffect(() => {
    if (recipientMethod === 'existing' && existingRecipients.length === 0) {
      loadExistingRecipients();
    }
  }, [recipientMethod]);

  // Auto-save functionality
  const saveFormData = async () => {
    if (!formData.name || !formData.sendingAccountId) {
      return; // Don't auto-save if required fields are missing
    }

    try {
      setIsAutoSaving(true);

      const apiPayload = {
        name: formData.name,
        subject: formData.subject,
        htmlContent: formData.htmlContent,
        sendingAccountId: formData.sendingAccountId,
        status: 'draft' as const
      };
      const abTestIdToSave = (formData as any).ab_test_id;
      if (abTestIdToSave !== undefined) {
        (apiPayload as any).ab_test_id = abTestIdToSave;
      }
      (apiPayload as any).campaign_type = formData.campaign_type;
      (apiPayload as any).stop_on_reply = formData.stop_on_reply;


      if (currentCampaignId && currentCampaignId !== ':id') {
        await api.updateCampaign(currentCampaignId, apiPayload);
      } else {
        // For new campaigns, we might want to create a draft
        const newCampaign = await api.createCampaign(apiPayload);
        // Update the URL to reflect the new campaign ID
        window.history.replaceState(null, '', `/campaigns/edit/${newCampaign.id}`);
        // Update the state to reflect the new campaign ID
        setCurrentCampaignId(newCampaign.id);
        setCampaignData(newCampaign);
      }

      setLastSaved(new Date());
      setHasUnsavedChanges(false);

    } catch (error) {
      console.error('Auto-save failed:', error);
      // Don't show toast for auto-save failures to avoid interrupting user
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Auto-save when form data changes
  useEffect(() => {
    if (hasUnsavedChanges) {
      const timeoutId = setTimeout(() => {
        saveFormData();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [formData, followUpEmails, combinedFollowUps, followUpType, hasUnsavedChanges]);

  // Mark as having unsaved changes when form data changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [formData, followUpEmails, combinedFollowUps, followUpType]);

  // Warn user about unsaved changes before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleNext = () => {
    // Validate current step before proceeding
    if (currentStep === 'name') {
      if (!formData.name) {
        toast({
          title: 'Validation Error',
          description: 'Please enter a campaign name.',
          variant: 'destructive',
        });
        return;
      }
    } else if (currentStep === 'account') {
      if (!formData.sendingAccountId) {
        toast({
          title: 'Validation Error',
          description: 'Please select a sending account.',
          variant: 'destructive',
        });
        return;
      }
    } else if (currentStep === 'content') {
      if (!formData.subject || !formData.htmlContent) {
        toast({
          title: 'Validation Error',
          description: 'Please add a subject and email content.',
          variant: 'destructive',
        });
        return;
      }
    } else if (currentStep === 'settings') {
      // Settings are optional with defaults
    } else if (currentStep === 'review') {
      // Review step doesn't need validation before proceeding to launch
    }

    const currentIndex = getCurrentStepIndex();
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };



  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplateId(template.id);
    setFormData(prev => ({
      ...prev,
      htmlContent: template.htmlContent,
      subject: template.subject || prev.subject
    }));
  };

  // If a template is pre-selected (e.g., via URL), apply it once templates are available
  useEffect(() => {
    if (!selectedTemplateId) return;
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    setFormData(prev => {
      // Avoid clobbering content if user already started editing
      if ((prev.htmlContent && prev.htmlContent.trim().length > 0) || (prev.subject && prev.subject.trim().length > 0)) {
        return prev;
      }
      return {
        ...prev,
        htmlContent: template.htmlContent,
        subject: template.subject || prev.subject,
      };
    });
  }, [selectedTemplateId, templates]);

  const handleSendTestEmail = async () => {
    if (!testEmail.trim()) {
      toast({
        title: 'Email required',
        description: 'Please enter an email address to send the test to.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.subject.trim() || !formData.htmlContent.trim()) {
      toast({
        title: 'Content required',
        description: 'Please add a subject and email content before sending a test.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.sendingAccountId) {
      toast({
        title: 'Sending account required',
        description: 'Please select a sending account in the first step.',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingTest(true);
    try {
      // Create a test email payload
      const testPayload = {
        to_email: testEmail,
        subject: `[TEST] ${formData.subject}`,
        body: formData.htmlContent,
        sending_account_id: formData.sendingAccountId,
      };

      // Send test email via API
      await api.sendTestEmail(testPayload);

      // Add to history
      setTestEmailHistory(prev => [
        { email: testEmail, timestamp: new Date() },
        ...prev.slice(0, 4) // Keep only last 5 entries
      ]);

      toast({
        title: 'Test email sent!',
        description: `Test email sent successfully to ${testEmail}`,
      });
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Could not send test email';
      toast({
        title: 'Failed to send test email',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSendingTest(false);
    }
  };



  const handleCSVImport = async (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        toast({
          title: 'Invalid CSV',
          description: 'CSV file must contain at least a header row and one data row.',
          variant: 'destructive'
        });
        return;
      }

      // Simple CSV parsing - assume first row is headers
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const emailIndex = headers.findIndex(h => h.includes('email'));
      const firstNameIndex = headers.findIndex(h => h.includes('first') && h.includes('name'));
      const lastNameIndex = headers.findIndex(h => h.includes('last') && h.includes('name'));
      const companyIndex = headers.findIndex(h => h.includes('company'));

      if (emailIndex === -1) {
        toast({
          title: 'Missing Email Column',
          description: 'CSV file must contain an email column.',
          variant: 'destructive'
        });
        return;
      }

      // Parse data rows
      const newRecipients: RecipientData[] = [];
      const existingEmails = new Set(pendingRecipients.map(r => r.email.toLowerCase()));

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const email = values[emailIndex]?.trim();

        if (email && !existingEmails.has(email.toLowerCase())) {
          newRecipients.push({
            email,
            firstName: values[firstNameIndex]?.trim() || '',
            lastName: values[lastNameIndex]?.trim() || '',
            company: values[companyIndex]?.trim() || ''
          });
          existingEmails.add(email.toLowerCase());
        }
      }

      if (newRecipients.length === 0) {
        toast({
          title: 'No New Contacts',
          description: 'No valid new contacts found in the CSV file.',
          variant: 'destructive'
        });
        return;
      }

      // Add new recipients to the list
      setPendingRecipients(prev => [...prev, ...newRecipients]);

      toast({
        title: 'Contacts Imported',
        description: `${newRecipients.length} contacts successfully imported to this campaign.`,
      });
    };

    reader.onerror = () => {
      toast({
        title: 'File Read Error',
        description: 'Failed to read the CSV file. Please try again.',
        variant: 'destructive'
      });
    };

    reader.readAsText(file);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        toast({
          title: 'Invalid CSV',
          description: 'CSV file must have at least a header row and one data row.',
          variant: 'destructive',
        });
        return;
      }

      // Parse CSV data
      const parsedData = lines.map(line => {
        // Simple CSV parsing - handle quoted values
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      });

      setCsvData(parsedData);
      setShowColumnMapper(true);
    };

    reader.readAsText(file);
  };

  const handleColumnMappingComplete = (mappedData: Record<string, string>[], mapping: Record<string, string>) => {
    const recipients = mappedData.map(data => ({
      email: data.email || '',
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      company: data.company || '',
    })).filter(r => r.email);

    setPendingRecipients(recipients);
    setShowColumnMapper(false);
    setCsvData([]);

    toast({
      title: 'Recipients imported',
      description: `${recipients.length} recipients ready to upload.`,
    });
  };

  const handleColumnMappingCancel = () => {
    setShowColumnMapper(false);
    setCsvData([]);
  };

  const addManualRecipient = () => {
    if (!manualRecipient.email.trim()) {
      toast({ title: 'Email required', description: 'Please enter an email address.', variant: 'destructive' });
      return;
    }

    // Check for duplicates
    const existingEmails = pendingRecipients.map(r => r.email.toLowerCase());
    if (existingEmails.includes(manualRecipient.email.toLowerCase())) {
      toast({ title: 'Duplicate contact', description: 'This email is already in the campaign.', variant: 'destructive' });
      return;
    }

    setPendingRecipients(prev => [...prev, manualRecipient]);
    setManualRecipient({ email: '', firstName: '', lastName: '', company: '' });
    setShowAddContactDialog(false);
    toast({ title: 'Contact added', description: 'Contact added to the campaign.' });
  };

  const removeRecipient = (index: number) => {
    setPendingRecipients(prev => prev.filter((_, i) => i !== index));
    setSelectedRecipients(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
  };

  const toggleSelectRecipient = (index: number, checked: boolean) => {
    if (checked) {
      setSelectedRecipients(prev => [...prev, index]);
    } else {
      setSelectedRecipients(prev => prev.filter(i => i !== index));
    }
  };

  const toggleSelectAllRecipients = (checked: boolean) => {
    if (checked) {
      setSelectedRecipients(filteredRecipients.map((_, index) => index));
    } else {
      setSelectedRecipients([]);
    }
  };

  const removeSelectedRecipients = () => {
    const indicesToRemove = new Set(selectedRecipients);
    setPendingRecipients(prev => prev.filter((_, index) => !indicesToRemove.has(index)));
    setSelectedRecipients([]);
  };

  const exportCampaignContacts = () => {
    if (pendingRecipients.length === 0) return;

    const csvContent = [
      ['Email', 'First Name', 'Last Name', 'Company'],
      ...pendingRecipients.map(r => [r.email, r.firstName || '', r.lastName || '', r.company || ''])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-contacts-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({ title: 'Contacts exported', description: `${pendingRecipients.length} contacts exported to CSV.` });
  };

  // Filter recipients based on search
  const filteredRecipients = pendingRecipients.filter(recipient =>
    recipient.email.toLowerCase().includes(recipientSearchTerm.toLowerCase()) ||
    recipient.firstName?.toLowerCase().includes(recipientSearchTerm.toLowerCase()) ||
    recipient.lastName?.toLowerCase().includes(recipientSearchTerm.toLowerCase()) ||
    recipient.company?.toLowerCase().includes(recipientSearchTerm.toLowerCase())
  );



  const handleAIGeneration = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please enter a description of what you want to generate.',
        variant: 'destructive'
      });
      return;
    }

    setIsGeneratingAI(true);
    try {
      const response = await api.generateAiContent({
        channel: 'email',
        prompt: aiPrompt,
        action: 'draft',
        context: {
          campaignName: formData.name,
          existingSubject: formData.subject,
          existingContent: formData.htmlContent
        }
      });

      const generated = response.output.trim();

      // Try to parse subject and content from generated text
      let newSubject = formData.subject;
      let newContent = formData.htmlContent;

      if (aiTarget === 'subject' || aiTarget === 'both') {
        // Look for subject line in generated content
        const subjectMatch = generated.match(/subject[:\s]*([^\n]+)/i);
        if (subjectMatch) {
          newSubject = subjectMatch[1].trim();
        } else if (aiTarget === 'subject') {
          // If generating only subject, use the whole output as subject
          newSubject = generated.trim();
        }
      }

      if (aiTarget === 'content' || aiTarget === 'both') {
        // Look for content after subject line or use whole content
        let content = generated;
        if (aiTarget === 'both') {
          const subjectMatch = generated.match(/subject[:\s]*([^\n]+)/i);
          if (subjectMatch) {
            content = generated.substring(subjectMatch[0].length).trim();
          }
        }
        // Remove any remaining subject lines
        content = content.replace(/^subject[:\s]*[^\n]*\n*/gi, '');
        newContent = content.trim();
      }

      setFormData(prev => ({
        ...prev,
        subject: newSubject,
        htmlContent: newContent
      }));

      setAiDialogOpen(false);
      setAiPrompt('');

      toast({
        title: 'AI Generation Complete',
        description: 'Your campaign content has been generated successfully.'
      });
    } catch (error) {
      console.error('AI generation error:', error);
      toast({
        title: 'AI Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate content. Please check your AI settings.',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.sendingAccountId) {
      toast({ title: 'Select sending account', description: 'Choose a sending account before saving.', variant: 'destructive' });
      return;
    }

    const payload = {
      ...formData,
      sendingAccountId: formData.sendingAccountId,
      // Include scheduling settings if custom scheduling is enabled
      ...(formData.useCustomScheduling && {
        sendingWindowStart: formData.sendingWindowStart,
        sendingWindowEnd: formData.sendingWindowEnd,
        timezone: formData.timezone,
        emailDelay: parseInt(formData.emailDelay),
        batchSize: parseInt(formData.batchSize),
        priority: formData.priority,
        retryAttempts: parseInt(formData.retryAttempts),
        pauseBetweenBatches: parseInt(formData.pauseBetweenBatches),
        respectSendingWindow: formData.respectSendingWindow,
        sendingDays: formData.sendingDays,
        scheduledAt: formData.scheduledAt || null,
      }),
      campaign_type: formData.campaign_type,
      stop_on_reply: formData.stop_on_reply,
    };

    try {
      let campaignId = currentCampaignId;

      if (currentCampaignId && currentCampaignId !== ':id' && campaignData) {
        // Updating existing campaign
        await api.updateCampaign(currentCampaignId, payload);
        toast({ title: 'Campaign updated', description: `${payload.name} has been updated successfully.` });
      } else {
        // Creating new campaign or updating auto-saved campaign
        if (currentCampaignId && currentCampaignId !== ':id') {
          await api.updateCampaign(currentCampaignId, payload);
          toast({ title: 'Campaign updated', description: `${payload.name} has been updated successfully.` });
        } else {
          const campaign = await api.createCampaign(payload);
          campaignId = campaign.id;
          setCurrentCampaignId(campaign.id);
          toast({ title: 'Campaign created', description: `${campaign.name} has been created successfully.` });
        }
      }

      // Create follow-ups based on type
      if (campaignId) {
        try {
          if (followUpType === 'email' && followUpEmails.length > 0) {
            // Create email-only follow-ups
            for (const email of followUpEmails) {
              await api.createFollowUpEmail({
                campaignId: campaignId,
                subject: email.subject,
                content: email.content,
                delayDays: email.delayDays,
                emailOrder: email.emailOrder
              });
            }
            toast({ title: 'Follow-up emails created', description: `${followUpEmails.length} follow-up emails have been created for this campaign.` });
          } else if (followUpType === 'combined' && combinedFollowUps.length > 0) {
            // Create combined email+SMS follow-ups
            for (let i = 0; i < combinedFollowUps.length; i++) {
              const step = combinedFollowUps[i];
              if (step.type === 'email') {
                await api.createFollowUpEmail({
                  campaignId: campaignId,
                  subject: step.subject || '',
                  content: step.content,
                  delayDays: step.delayDays,
                  emailOrder: i + 1
                });
              } else if (step.type === 'sms') {
                // Create SMS sequence for follow-up
                await api.createSMSSequence({
                  name: `Follow-up ${i + 1} for Campaign ${campaignId}`,
                  description: `SMS follow-up step ${i + 1}`,
                  steps: [{
                    message: step.content,
                    delay_hours: step.delayHours || step.delayDays * 24, // Convert days to hours for SMS
                    step_order: i + 1
                  } as Partial<SMSSequenceStep>]
                });
              }
            }
            toast({
              title: 'Combined follow-ups created',
              description: `${combinedFollowUps.length} follow-up steps have been configured for this campaign.`
            });
          }
        } catch (err: unknown) {
          console.error(err);
          const errorMessage = err instanceof Error ? err.message : 'Could not create follow-ups';
          toast({ title: 'Failed to create follow-ups', description: errorMessage, variant: 'destructive' });
          // Don't return here - campaign was created successfully
        }
      }

      // Add recipients if any
      if (pendingRecipients.length > 0 && campaignId) {
        await api.addRecipients(pendingRecipients.map(r => ({ ...r, campaignId: campaignId })));
        toast({ title: 'Recipients uploaded', description: `${pendingRecipients.length} recipients added successfully.` });
      }

      // Navigate to campaign details page to show the completed campaign
      if (campaignId) {
        navigate(`/reach/outbound/email/campaigns/${campaignId}`);
      } else {
        navigate('/reach/outbound/email/campaigns');
      }
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Could not save campaign';
      toast({ title: 'Failed', description: errorMessage, variant: 'destructive' });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'name':
        return (
          <div className="w-full">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileTextIcon className="h-5 w-5" />
                  Campaign Name
                </CardTitle>
                <CardDescription>Enter your campaign name and basic details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign-name">Campaign Name *</Label>
                  <Input
                    id="campaign-name"
                    placeholder="Enter campaign name..."
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    maxLength={100}
                  />
                  <div className="text-sm text-muted-foreground">
                    {formData.name.length}/100 characters
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>A/B Test (Optional)</Label>
                  <Select
                    value={selectedAbTestId}
                    onValueChange={(value) => {
                      setSelectedAbTestId(value);
                      setFormData(prev => ({
                        ...prev,
                        ab_test_id: value === 'none' ? null : value
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {abTests
                        .filter(t => t.test_type === 'email_subject' || t.test_type === 'email_content')
                        .map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose an A/B test to apply to this campaign.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Campaign Type *</Label>
                  <RadioGroup
                    value={formData.campaign_type}
                    onValueChange={(value: 'cold' | 'warm') => {
                      setFormData(prev => ({
                        ...prev,
                        campaign_type: value,
                        // Smart defaults based on campaign type
                        stop_on_reply: value === 'cold',
                        // Cold: 300s (5m) delay, Warm: 10s delay
                        emailDelay: value === 'cold' ? '300' : '10',
                        // Cold: 1 per batch (individual), Warm: 50 per batch
                        batchSize: value === 'cold' ? '1' : '50',
                        // Enable custom scheduling to ensure these defaults take effect
                        useCustomScheduling: true
                      }));

                      toast({
                        title: `${value === 'cold' ? 'Cold Outreach' : 'Email Marketing'} Selected`,
                        description: `Applied recommended settings for ${value} campaigns.`
                      });
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem value="cold" id="type-cold" className="peer sr-only" />
                      <Label
                        htmlFor="type-cold"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-indigo-600 [&:has([data-state=checked])]:border-indigo-600 cursor-pointer"
                      >
                        <Target className="mb-3 h-6 w-6 text-indigo-600" />
                        <span className="font-semibold">Email Outreach</span>
                        <span className="text-xs text-muted-foreground text-center mt-1">
                          Cold emails, personalized sequences, and follow-ups.
                        </span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="warm" id="type-warm" className="peer sr-only" />
                      <Label
                        htmlFor="type-warm"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-orange-600 [&:has([data-state=checked])]:border-orange-600 cursor-pointer"
                      >
                        <ZapIcon className="mb-3 h-6 w-6 text-orange-600" />
                        <span className="font-semibold">Email Marketing</span>
                        <span className="text-xs text-muted-foreground text-center mt-1">
                          Newsletters, bulk updates, and warm promotions.
                        </span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'account':
        return (
          <div className="w-full">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Sending Account
                </CardTitle>
                <CardDescription>Choose the email account to send your campaign from</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sendingAccounts.length > 0 ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sendingAccount">Select Sending Account</Label>
                      <Select
                        value={formData.sendingAccountId}
                        onValueChange={(value) => {
                          setFormData(prev => ({ ...prev, sendingAccountId: value }));
                          setSelectedAccountId(value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an email account..." />
                        </SelectTrigger>
                        <SelectContent>
                          {sendingAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${account.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                                    }`} />
                                  <span className="font-medium">{account.email}</span>
                                </div>
                                <Badge variant={account.type === 'gmail' ? 'default' : 'secondary'} className="ml-2">
                                  {account.type?.toUpperCase() || 'UNKNOWN'}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.sendingAccountId && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-green-50 border border-green-200 rounded-md p-3">
                        <Check className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800">
                            Account "{sendingAccounts.find(acc => acc.id === formData.sendingAccountId)?.email}" selected
                          </p>
                          <p className="text-green-700">
                            Your campaign will be sent from this email address. Recipients will see this as the sender.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                    <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-[14px] font-medium mb-2">No Sending Accounts Available</h3>
                    <p className="text-sm mb-4">You need to add at least one sending account before creating a campaign.</p>
                    <Button
                      onClick={() => navigate('/settings#sending-accounts')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Sending Account
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Send Test Email Section */}
            {formData.sendingAccountId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Send Test Email
                  </CardTitle>
                  <CardDescription>Send a test email to verify your content and formatting before launching the campaign</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="testEmail">Test Email Address</Label>
                    <Input
                      id="testEmail"
                      type="email"
                      placeholder="Enter your email address to send test..."
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleSendTestEmail}
                    disabled={!testEmailAddress || !formData.sendingAccountId || !formData.subject}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Test
                  </Button>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• Test emails will be prefixed with "[TEST]" in the subject line</p>
                    <p>• You can send multiple test emails to the same address</p>
                    <p>• Make sure to select a sending account in the first step</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'content':
        return (
          <div className="w-full">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Content
                </CardTitle>
                <CardDescription>Create your email content and optional follow-ups</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="subject">Email Subject *</Label>
                    <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700">
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate with AI
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Bot className="h-5 w-5" />
                            AI Campaign Content
                          </DialogTitle>
                          <DialogDescription>
                            Describe your campaign goals and AI will create personalized email content for your audience.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="ai-target">Generate</Label>
                            <select
                              id="ai-target"
                              value={aiTarget}
                              onChange={(e) => setAiTarget(e.target.value as 'subject' | 'content' | 'both')}
                              className="w-full border border-input rounded-md px-3 py-2"
                            >
                              <option value="both">Subject & Content</option>
                              <option value="subject">Subject Line Only</option>
                              <option value="content">Email Content Only</option>
                            </select>
                          </div>
                          <div>
                            <Label htmlFor="ai-prompt">Campaign Description</Label>
                            <Textarea
                              id="ai-prompt"
                              placeholder="Describe your campaign goals, target audience, key messages, and desired tone..."
                              value={aiPrompt}
                              onChange={(e) => setAiPrompt(e.target.value)}
                              rows={4}
                              className="resize-none"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Example: "Create a promotional email for our new CRM software targeting sales managers. Highlight productivity benefits and include a demo offer."
                            </p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setAiDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button
                            onClick={handleAIGeneration}
                            disabled={isGeneratingAI || !aiPrompt.trim()}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
                          >
                            {isGeneratingAI ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Input
                    id="subject"
                    placeholder="Your compelling subject line"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>

                {/* Template Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Choose a Template (Optional)</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('/reach/email-templates/new', '_blank')}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Create Template
                    </Button>
                  </div>

                  {templates.length > 0 ? (
                    <div className="space-y-2">
                      <Select
                        value={selectedTemplateId}
                        onValueChange={(value) => {
                          if (value === 'none') {
                            setSelectedTemplateId('');
                            // Clear template-related form data
                            setFormData(prev => ({ ...prev, htmlContent: '', subject: '' }));
                          } else {
                            const template = templates.find(t => t.id === value);
                            if (template) {
                              handleTemplateSelect(template);
                            }
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No template</SelectItem>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{template.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {template.isSequence ? 'Sequence' : 'Email'}
                                  </Badge>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowTemplatePreview(true);
                                  }}
                                  className="h-6 w-6 p-0 ml-2"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {selectedTemplateId && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 border border-blue-200 rounded-md p-3">
                          <Check className="h-4 w-4 text-blue-600" />
                          <span>
                            Template "{templates.find(t => t.id === selectedTemplateId)?.name}" selected
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 border border-dashed rounded-lg">
                      <FileTextIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-[14px] font-medium mb-2">No Templates Available</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Create a template to get started faster
                      </p>
                      <Button
                        onClick={() => window.open('/reach/outbound/email/templates/new', '_blank')}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Template
                      </Button>
                    </div>
                  )}
                </div>

                {/* Email Content Editor */}
                <div className="space-y-2">
                  <Label htmlFor="content">Email Content *</Label>
                  <div className="border-2 border-gray-300 rounded-lg shadow-sm">
                    <RichTextEditor
                      value={formData.htmlContent}
                      onChange={(content) => setFormData(prev => ({ ...prev, htmlContent: content }))}
                      placeholder="Write your email content here..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Follow-up Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Follow-up Configuration (Optional)
                </CardTitle>
                <CardDescription>
                  Set up automated follow-ups to increase your response rates. Choose between email-only or combined email+SMS follow-ups.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Follow-up Type Toggle */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">Follow-up Type</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="followUpType"
                        value="email"
                        checked={followUpType === 'email'}
                        onChange={(e) => setFollowUpType(e.target.value as 'email' | 'combined')}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Email Only</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="followUpType"
                        value="combined"
                        checked={followUpType === 'combined'}
                        onChange={(e) => setFollowUpType(e.target.value as 'email' | 'combined')}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Email + SMS</span>
                    </label>
                  </div>
                </div>

                {/* Conditional Rendering Based on Follow-up Type */}
                {followUpType === 'email' ? (
                  <FollowUpEmailBuilder
                    initialEmails={followUpEmails}
                    onEmailsChange={(emails) => {
                      setFollowUpEmails(emails);
                      setHasUnsavedChanges(true);
                    }}
                    templates={templates}
                    maxFollowUps={5}
                  />
                ) : (
                  <CombinedFollowUpBuilder
                    initialSteps={combinedFollowUps}
                    onStepsChange={(steps) => {
                      setCombinedFollowUps(steps);
                      setHasUnsavedChanges(true);
                    }}
                  />
                )}
              </CardContent>
            </Card>

          </div>
        );

      case 'recipients':
        return (
          <div className="w-full">
            <UnifiedContactSelector
              campaignType="email"
              selectedContacts={selectedContacts}
              onContactsChange={(contacts) => {
                setSelectedContacts(contacts);
                setPendingRecipients(
                  contacts.map((c) => ({
                    email: c.email,
                    firstName: c.firstName,
                    lastName: c.lastName,
                    company: c.company,
                  }))
                );
                setHasUnsavedChanges(true);
              }}
              showUpload={true}
              className="w-full"
            />
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Campaign Settings
                </CardTitle>
                <CardDescription>Configure scheduling and delivery preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Campaign Scheduling */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Custom Scheduling</Label>
                      <p className="text-sm text-muted-foreground">
                        Override global settings with campaign-specific scheduling
                      </p>
                    </div>
                    <Switch
                      checked={formData.useCustomScheduling}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({ ...prev, useCustomScheduling: checked }))
                      }
                    />
                  </div>

                  {formData.campaign_type === 'cold' && (
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-indigo-50/30 border-indigo-100">
                      <div>
                        <Label className="text-base font-medium flex items-center gap-2">
                          <Target className="h-4 w-4 text-indigo-600" />
                          Stop on Reply
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically pause the sequence for a contact once they reply
                        </p>
                      </div>
                      <Switch
                        checked={formData.stop_on_reply}
                        onCheckedChange={(checked) =>
                          setFormData(prev => ({ ...prev, stop_on_reply: checked }))
                        }
                      />
                    </div>
                  )}

                  {formData.useCustomScheduling && (
                    <>
                      <Separator />

                      {/* Sending Window */}
                      <div className="space-y-4">
                        <Label className="text-base font-medium">Sending Window</Label>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label htmlFor="sendingStart">Start Time</Label>
                            <Input
                              id="sendingStart"
                              type="time"
                              value={formData.sendingWindowStart}
                              onChange={(e) => setFormData(prev => ({ ...prev, sendingWindowStart: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="sendingEnd">End Time</Label>
                            <Input
                              id="sendingEnd"
                              type="time"
                              value={formData.sendingWindowEnd}
                              onChange={(e) => setFormData(prev => ({ ...prev, sendingWindowEnd: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="timezone">Timezone</Label>
                            <Select
                              value={formData.timezone}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="UTC">UTC</SelectItem>
                                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                                <SelectItem value="America/Chicago">Central Time</SelectItem>
                                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                                <SelectItem value="Europe/London">London</SelectItem>
                                <SelectItem value="Europe/Paris">Paris</SelectItem>
                                <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                                <SelectItem value="Asia/Kathmandu">Kathmandu (GMT+05:45)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Delivery Settings */}
                      <div className="space-y-4">
                        <Label className="text-base font-medium flex items-center gap-2">
                          Delivery Settings
                          {formData.campaign_type === 'cold' && <Badge variant="secondary" className="text-xs font-normal">Optimized for Outreach</Badge>}
                          {formData.campaign_type === 'warm' && <Badge variant="secondary" className="text-xs font-normal">Optimized for Marketing</Badge>}
                        </Label>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="emailDelay">Delay Between Emails (seconds)</Label>
                            <Input
                              id="emailDelay"
                              type="number"
                              value={formData.emailDelay}
                              onChange={(e) => setFormData(prev => ({ ...prev, emailDelay: e.target.value }))}
                              placeholder="Delay between sending emails"
                            />
                            <p className="text-xs text-muted-foreground">
                              {formData.campaign_type === 'cold'
                                ? 'Recommended: 300s+. Longer delays improve deliverability for cold outreach.'
                                : 'Recommended: 10-60s. Shorter delays are suitable for newsletters.'}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="batchSize">Batch Size</Label>
                            <Input
                              id="batchSize"
                              type="number"
                              value={formData.batchSize}
                              onChange={(e) => setFormData(prev => ({ ...prev, batchSize: e.target.value }))}
                              placeholder="Number of emails per batch"
                            />
                            <p className="text-xs text-muted-foreground">
                              Number of emails to send in each batch
                            </p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Sending Days */}
                      <div className="space-y-4">
                        <Label className="text-base font-medium">Sending Days</Label>
                        <div className="grid gap-2 md:grid-cols-7">
                          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                            <div key={day} className="flex items-center space-x-2">
                              <Checkbox
                                id={day}
                                checked={formData.sendingDays.includes(day)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData(prev => ({ ...prev, sendingDays: [...prev.sendingDays, day] }));
                                  } else {
                                    setFormData(prev => ({ ...prev, sendingDays: prev.sendingDays.filter(d => d !== day) }));
                                  }
                                }}
                              />
                              <Label htmlFor={day} className="text-sm capitalize">{day.slice(0, 3)}</Label>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Select days when emails can be sent
                        </p>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Send Schedule */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Send Schedule</Label>
                    <div className="space-y-2">
                      <Label htmlFor="scheduledAt">Send Date & Time (Optional)</Label>
                      <Input
                        id="scheduledAt"
                        type="datetime-local"
                        value={formData.scheduledAt}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave empty to send immediately, or set a future date/time to schedule
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Unsubscribe Settings */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Unsubscribe Settings</Label>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="unsubscribePlainText">Plain Text Unsubscribe Message</Label>
                        <Input
                          id="unsubscribePlainText"
                          value={formData.unsubscribePlainText}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, unsubscribePlainText: e.target.value }));
                            setHasUnsavedChanges(true);
                          }}
                          placeholder="Plain text unsubscribe message"
                        />
                        <p className="text-xs text-muted-foreground">
                          Use {'{'}{'{'} unsubscribeUrl {'}'}{'}'}  as a placeholder for the unsubscribe link
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="unsubscribeFormatted">Formatted Unsubscribe Message (HTML)</Label>
                        <Input
                          id="unsubscribeFormatted"
                          value={formData.unsubscribeFormatted}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, unsubscribeFormatted: e.target.value }));
                            setHasUnsavedChanges(true);
                          }}
                          placeholder="HTML formatted unsubscribe message"
                        />
                        <p className="text-xs text-muted-foreground">
                          HTML version with formatting. Use {'{'}{'{'} unsubscribeUrl {'}'}{'}'}  as a placeholder for the unsubscribe link
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Additional Settings */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Additional Settings</Label>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">Respect Sending Window</Label>
                          <p className="text-xs text-muted-foreground">
                            Only send emails during the configured sending window
                          </p>
                        </div>
                        <Switch
                          checked={formData.respectSendingWindow}
                          onCheckedChange={(checked) =>
                            setFormData(prev => ({ ...prev, respectSendingWindow: checked }))
                          }
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="priority">Priority</Label>
                          <Select
                            value={formData.priority}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as 'low' | 'normal' | 'high' }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Campaign priority for queue processing
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="retryAttempts">Retry Attempts</Label>
                          <Input
                            id="retryAttempts"
                            type="number"
                            value={formData.retryAttempts}
                            onChange={(e) => setFormData(prev => ({ ...prev, retryAttempts: e.target.value }))}
                            placeholder="Number of retry attempts"
                          />
                          <p className="text-xs text-muted-foreground">
                            Number of times to retry failed sends
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'review': {
        const selectedAccount = sendingAccounts.find(acc => acc.id === formData.sendingAccountId);

        return (
          <div className="w-full">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Campaign Preview
                </CardTitle>
                <CardDescription>Review your campaign details before sending</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Campaign Name</Label>
                      <p className="text-sm font-semibold">{formData.name || 'Untitled Campaign'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Subject Line</Label>
                      <p className="text-sm font-semibold">{formData.subject || 'No subject'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Sending Account</Label>
                      <p className="text-sm font-semibold">{selectedAccount?.email || 'No account selected'}</p>
                      <p className="text-xs text-muted-foreground">{selectedAccount?.name || ''}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Send Schedule</Label>
                      <p className="text-sm font-semibold">
                        {formData.scheduledAt
                          ? `Scheduled for ${new Date(formData.scheduledAt).toLocaleString()}`
                          : 'Send Immediately'
                        }
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Recipients</Label>
                      <p className="text-sm font-semibold">{pendingRecipients.length} recipient{pendingRecipients.length !== 1 ? 's' : ''}</p>
                      <p className="text-xs text-muted-foreground">
                        {pendingRecipients.length === 0 ? 'No recipients selected' : 'Contacts selected from address book'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Follow-ups</Label>
                      <p className="text-sm font-semibold">
                        {followUpType === 'email'
                          ? `${followUpEmails.length} email follow-up${followUpEmails.length !== 1 ? 's' : ''} configured`
                          : `${combinedFollowUps.length} combined follow-up${combinedFollowUps.length !== 1 ? 's' : ''} configured`
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {followUpType === 'email'
                          ? (followUpEmails.length === 0 ? 'No email follow-ups' : 'Email-only sequence')
                          : (combinedFollowUps.length === 0 ? 'No follow-ups' : 'Email + SMS sequence')
                        }
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Campaign Status</Label>
                      <Badge variant="outline">Draft</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Follow-up Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Follow-up Details
                </CardTitle>
                <CardDescription>
                  {followUpType === 'email'
                    ? (followUpEmails.length > 0 ? 'Your configured follow-up emails' : 'No follow-up emails configured')
                    : (combinedFollowUps.length > 0 ? 'Your configured email + SMS follow-ups' : 'No follow-ups configured')
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {followUpType === 'email' ? (
                  followUpEmails.length > 0 ? (
                    <div className="space-y-4">
                      <div className="text-sm font-medium text-gray-700">
                        Email Follow-up Sequence ({followUpEmails.length} email{followUpEmails.length !== 1 ? 's' : ''})
                      </div>
                      <div className="space-y-3">
                        {followUpEmails.map((email, index) => (
                          <div key={index} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">Email Follow-up {index + 1}</Badge>
                              <span className="text-xs text-muted-foreground">
                                Delay: {email.delayDays} day{email.delayDays !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <Label className="text-xs font-medium text-gray-600">Subject</Label>
                                <p className="text-sm">{email.subject}</p>
                              </div>
                              <div>
                                <Label className="text-xs font-medium text-gray-600">Content Preview</Label>
                                <div className="text-sm text-muted-foreground max-h-20 overflow-hidden">
                                  <div
                                    className="text-gray-700 [&_*]:text-gray-700 [&_p]:text-gray-700 [&_div]:text-gray-700 [&_span]:text-gray-700 [&_h1]:text-gray-700 [&_h2]:text-gray-700 [&_h3]:text-gray-700 [&_h4]:text-gray-700 [&_h5]:text-gray-700 [&_h6]:text-gray-700 [&_a]:text-blue-600 [&_a]:underline"
                                    dangerouslySetInnerHTML={{
                                      __html: email.content.substring(0, 150) + (email.content.length > 150 ? '...' : '')
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No follow-up emails configured. Only the initial campaign email will be sent.</p>
                  )
                ) : (
                  combinedFollowUps.length > 0 ? (
                    <div className="space-y-4">
                      <div className="text-sm font-medium text-gray-700">
                        Combined Follow-up Sequence ({combinedFollowUps.length} step{combinedFollowUps.length !== 1 ? 's' : ''})
                      </div>
                      <div className="space-y-3">
                        {combinedFollowUps.map((step, index) => (
                          <div key={index} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline" className={step.type === 'email' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}>
                                {step.type === 'email' ? 'Email' : 'SMS'} Step {index + 1}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Delay: {step.delayDays} day{step.delayDays !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="space-y-2">
                              {step.type === 'email' && step.subject && (
                                <div>
                                  <Label className="text-xs font-medium text-gray-600">Subject</Label>
                                  <p className="text-sm">{step.subject}</p>
                                </div>
                              )}
                              <div>
                                <Label className="text-xs font-medium text-gray-600">Content Preview</Label>
                                <div className="text-sm text-muted-foreground max-h-20 overflow-hidden">
                                  {step.type === 'email' ? (
                                    <div
                                      className="text-gray-700 [&_*]:text-gray-700 [&_p]:text-gray-700 [&_div]:text-gray-700 [&_span]:text-gray-700 [&_h1]:text-gray-700 [&_h2]:text-gray-700 [&_h3]:text-gray-700 [&_h4]:text-gray-700 [&_h5]:text-gray-700 [&_h6]:text-gray-700 [&_a]:text-blue-600 [&_a]:underline"
                                      dangerouslySetInnerHTML={{
                                        __html: step.content.substring(0, 150) + (step.content.length > 150 ? '...' : '')
                                      }}
                                    />
                                  ) : (
                                    <p className="text-gray-700">
                                      {step.content.substring(0, 150) + (step.content.length > 150 ? '...' : '')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No follow-ups configured. Only the initial campaign will be sent.</p>
                  )
                )}
              </CardContent>
            </Card>

            {/* Email Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileTextIcon className="h-5 w-5" />
                  Email Preview
                </CardTitle>
                <CardDescription>How your initial email will appear to recipients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg bg-white shadow-sm">
                  {/* Email Header */}
                  <div className="border-b bg-gradient-to-r from-gray-50 to-gray-100 p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {selectedAccount?.email?.charAt(0).toUpperCase() || 'S'}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedAccount?.email || 'No account selected'}
                            </div>
                            <div className="text-xs text-gray-500">
                              to {pendingRecipients.length > 0 ? `${pendingRecipients.length} recipient${pendingRecipients.length !== 1 ? 's' : ''}` : 'recipients'}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Subject:</span>
                        <span className="text-gray-900 ml-1">
                          {formData.subject || 'No subject'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Email Body */}
                  <div className="p-6 max-h-96 overflow-y-auto bg-white">
                    {formData.htmlContent ? (
                      <div
                        className="prose prose-sm max-w-none text-gray-900 [&_*]:text-gray-900 [&_p]:text-gray-900 [&_div]:text-gray-900 [&_span]:text-gray-900 [&_h1]:text-gray-900 [&_h2]:text-gray-900 [&_h3]:text-gray-900 [&_h4]:text-gray-900 [&_h5]:text-gray-900 [&_h6]:text-gray-900 [&_a]:text-blue-600 [&_a]:underline hover:[&_a]:text-blue-800"
                        dangerouslySetInnerHTML={{ __html: formData.htmlContent }}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <FileTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 italic">No email content available</p>
                        <p className="text-sm text-gray-400 mt-2">Add content in the Content step to see a preview here</p>
                      </div>
                    )}
                  </div>

                  {/* Email Footer */}
                  <div className="border-t bg-gray-50 px-6 py-3">
                    <div className="text-xs text-gray-500 text-center">
                      This email was sent via Velocity Mail •
                      <a href="#" className="text-blue-600 hover:underline ml-1">Unsubscribe</a> •
                      <a href="#" className="text-blue-600 hover:underline ml-1">Privacy Policy</a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        );

      }

      default:
        return null;
    }
  };

  return (
    <>
      <div className="w-full px-6 py-8">
        {/* Header with Hunter.io styling */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/reach/outbound/email/campaigns')} className="hover:bg-gray-100">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-[18px] font-bold tracking-tight text-foreground">{id ? 'Edit Campaign' : 'New Campaign'}</h1>
            <p className="text-muted-foreground mt-1">Create and configure your email campaign</p>
          </div>

          {/* Auto-save indicator and manual save */}
          <div className="flex items-center gap-3">
            {/* Auto-save status */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isAutoSaving ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-hunter-orange"></div>
                  <span>Saving...</span>
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                  <span>Unsaved changes</span>
                </>
              ) : lastSaved ? (
                <>
                  <Check className="h-3 w-3 text-green-500" />
                  <span>Saved {lastSaved.toLocaleTimeString()}</span>
                </>
              ) : null}
            </div>

            {/* Manual save button */}
            <Button
              variant="outline"
              size="sm"
              onClick={saveFormData}
              disabled={isAutoSaving || !hasUnsavedChanges || !formData.name || !formData.sendingAccountId}
              className="hover:bg-gray-50"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
          </div>
        </div>

        {/* Progress Steps with Hunter.io styling */}
        <div className="mb-8">
          <Progress value={getProgress()} className="mb-4" />
          <div className="flex justify-between items-center">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = getCurrentStepIndex() > index;
              const isClickable = index <= getCurrentStepIndex();

              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center cursor-pointer ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                    }`}
                  onClick={() => isClickable && setCurrentStep(step.id)}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${isActive
                      ? 'bg-hunter-orange text-white'
                      : isCompleted
                        ? 'bg-hunter-orange text-white'
                        : 'bg-muted text-muted-foreground'
                      }`}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-medium ${isActive ? 'text-hunter-orange' : isCompleted ? 'text-hunter-orange' : 'text-muted-foreground'
                      }`}>
                      {step.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-6xl w-full">
          {renderStepContent()}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={getCurrentStepIndex() === 0}
              className="hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/reach/outbound/email/campaigns')} className="hover:bg-gray-50">
                Cancel
              </Button>

              {getCurrentStepIndex() === steps.length - 1 ? (
                <Button onClick={handleSubmit}>
                  <Save className="h-4 w-4 mr-2" />
                  {id ? 'Update Campaign' : 'Create Campaign'}
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Template Preview Dialog */}
      <Dialog open={showTemplatePreview} onOpenChange={setShowTemplatePreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Template Preview
            </DialogTitle>
            <DialogDescription>
              Preview of the selected template content
            </DialogDescription>
          </DialogHeader>

          {selectedTemplateId && (
            <div className="space-y-4">
              {(() => {
                const template = templates.find(t => t.id === selectedTemplateId);
                if (!template) return null;

                return (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="font-medium">Template Name:</Label>
                        <p className="text-muted-foreground">{template.name}</p>
                      </div>
                      <div>
                        <Label className="font-medium">Subject:</Label>
                        <p className="text-muted-foreground">{template.subject}</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="font-medium mb-2 block">Email Content:</Label>
                      <div className="border rounded-lg p-4 bg-white max-h-96 overflow-y-auto">
                        <div
                          dangerouslySetInnerHTML={{ __html: template.htmlContent || 'No content available' }}
                          className="prose prose-sm max-w-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowTemplatePreview(false)}
                      >
                        Close
                      </Button>
                      <Button
                        onClick={() => {
                          handleTemplateSelect(template);
                          setShowTemplatePreview(false);
                        }}
                      >
                        Use This Template
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sequence Preview Dialog */}
      <Dialog open={showSequencePreview} onOpenChange={setShowSequencePreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Sequence Preview
            </DialogTitle>
            <DialogDescription>
              Preview of the selected sequence steps
            </DialogDescription>
          </DialogHeader>

          {selectedSequenceId && (
            <div className="space-y-4">
              {(() => {
                const sequence = sequences.find(s => s.id === selectedSequenceId);
                if (!sequence) return null;

                return (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="font-medium">Sequence Name:</Label>
                        <p className="text-muted-foreground">{sequence.name}</p>
                      </div>
                      <div>
                        <Label className="font-medium">Total Steps:</Label>
                        <p className="text-muted-foreground">{sequence.steps?.length || 0} steps</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <Label className="font-medium">Sequence Steps:</Label>
                      {sequence.steps && sequence.steps.length > 0 ? (
                        <div className="space-y-4">
                          {sequence.steps.map((step, index) => (
                            <div key={index} className="border rounded-lg p-4 bg-gray-50">
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline">
                                  {index === 0 ? 'Initial Email' : `Follow-up ${index}`}
                                </Badge>
                                {index > 0 && step.delay_days && (
                                  <span className="text-xs text-muted-foreground">
                                    Delay: {step.delay_days} day{step.delay_days !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <Label className="text-xs font-medium text-gray-600">Subject</Label>
                                  <p className="text-sm">{step.subject || 'No subject'}</p>
                                </div>
                                <div>
                                  <Label className="text-xs font-medium text-gray-600">Content Preview</Label>
                                  <div className="border rounded p-2 bg-white max-h-32 overflow-y-auto">
                                    <div
                                      dangerouslySetInnerHTML={{
                                        __html: (step.content || step.htmlContent || '')?.substring(0, 200) + ((step.content || step.htmlContent || '').length > 200 ? '...' : '') || 'No content'
                                      }}
                                      className="prose prose-sm max-w-none text-xs"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic">No steps available in this sequence</p>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowSequencePreview(false)}
                      >
                        Close
                      </Button>
                      <Button
                        onClick={() => {
                          if (sequence.steps && sequence.steps.length > 0) {
                            const firstStep = sequence.steps[0];
                            setFormData(prev => ({
                              ...prev,
                              htmlContent: firstStep.content || firstStep.htmlContent || '',
                              subject: firstStep.subject || prev.subject
                            }));
                          }
                          setShowSequencePreview(false);
                        }}
                      >
                        Use This Sequence
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CampaignWizard;

