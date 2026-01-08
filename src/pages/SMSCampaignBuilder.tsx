import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Smartphone,
  MessageSquare,
  Users,
  Settings,
  Eye,
  Send,
  Plus,
  Trash2,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Save,
  Play,
  Pause,
  Edit3,
  Target,
  Mail,
  Phone,
  Hash,
  User,
  Building,
  MapPin,
  Globe,
  Zap,
  Filter,
  Search,
  Upload,
  Download,
  RefreshCw,
  BarChart3,
  MoreHorizontal,
  Tag,
  Pencil,
} from 'lucide-react';

import { toast } from 'sonner';
import { api, type Group } from '../lib/api';
import { smsAPI } from '../lib/sms-api';

interface SendingAccount {
  id: string;
  name: string;
  type: 'signalwire' | 'twilio' | 'nexmo';
  phone_number: string;
  status: 'active' | 'inactive';
}

interface SMSTemplate {
  id: string;
  name: string;
  message: string;
  category: string;
}

interface SMSRecipient {
  id: string;
  phone_number: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  tags?: string[];
  group_id?: string;
  status: 'active' | 'unsubscribed';
  created_at: string;
  updated_at: string;
}

interface FollowUpMessage {
  id: string;
  delay_days: number;
  delay_hours: number;
  message: string;
  condition: 'no_reply' | 'always';
}

interface CampaignData {
  name: string;
  description: string;
  sender_id: string;
  message: string;
  recipient_method: 'all' | 'tags' | 'groups';
  recipient_tags?: string[];
  recipient_groups?: string[];
  scheduled_at?: string;
  throttle_rate: number;
  throttle_unit: 'minute' | 'hour' | 'day';
  enable_retry: number;
  retry_attempts: number;
  respect_quiet_hours: number;
  quiet_hours_start: string;
  quiet_hours_end: string;
  group_id?: string;
}

const SMSCampaignBuilder = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [sendingAccounts, setSendingAccounts] = useState<SendingAccount[]>([]);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [recipients, setRecipients] = useState<SMSRecipient[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showRecipientDialog, setShowRecipientDialog] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState('all');
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');

  // Add state for recipient form
  const [recipientForm, setRecipientForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    tags: ''
  });

  // Add state for editing recipients
  const [editingRecipient, setEditingRecipient] = useState<string | null>(null);
  const [editRecipientForm, setEditRecipientForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    tags: ''
  });

  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: '',
    description: '',
    account_id: '',
    sender_number: '',
    message: '',
    recipients: [],
    follow_ups: [],
    schedule_type: 'immediate',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    quiet_hours_enabled: true,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    throttle_rate: 1,
    enable_tracking: true,
    variables: {},
    group_id: undefined,
  });

  const steps = [
    { id: 1, title: 'Account', icon: Smartphone, description: 'Choose sending number' },
    { id: 2, title: 'Content', icon: MessageSquare, description: 'Create SMS message' },
    { id: 3, title: 'Follow-ups', icon: RefreshCw, description: 'Set up follow-ups' },
    { id: 4, title: 'Audience', icon: Users, description: 'Select recipients' },
    { id: 5, title: 'Settings', icon: Settings, description: 'Configure schedule' },
    { id: 6, title: 'Review', icon: Eye, description: 'Review & launch' },
  ];

  useEffect(() => {
    loadInitialData();
    if (isEditMode && id) {
      loadCampaignData();
    }
  }, [isEditMode, id]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [accountsData, templatesData, recipientsData, groupsData] = await Promise.all([
        smsAPI.getSendingAccounts(),
        smsAPI.getSMSTemplates(),
        smsAPI.getSMSRecipients(),
        api.getGroups(),
      ]);

      setSendingAccounts(accountsData || []);
      setTemplates(templatesData || []);
      setRecipients(recipientsData || []);
      setGroups(groupsData || []);

      // Debug: Log recipients data to see structure
      console.log('Recipients data loaded:', recipientsData);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load initial data');
      // Fallback to empty arrays
      setSendingAccounts([]);
      setTemplates([]);
      setRecipients([]);
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCampaignData = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const campaign = await smsAPI.getSMSCampaign(id);

      if (campaign) {
        // Map API response to campaign data structure
        setCampaignData({
          name: campaign.name || '',
          description: campaign.description || '',
          sender_id: campaign.sender_id || '',
          message: campaign.message || '',
          recipient_method: campaign.recipient_method || 'all',
          recipient_tags: campaign.recipient_tags ? JSON.parse(campaign.recipient_tags) : [],
          recipient_groups: campaign.recipient_groups ? JSON.parse(campaign.recipient_groups) : [],
          scheduled_at: campaign.scheduled_at || '',
          throttle_rate: campaign.throttle_rate || 1,
          throttle_unit: campaign.throttle_unit || 'minute',
          enable_retry: campaign.enable_retry || 1,
          retry_attempts: campaign.retry_attempts || 3,
          respect_quiet_hours: campaign.respect_quiet_hours || 1,
          quiet_hours_start: campaign.quiet_hours_start || '22:00',
          quiet_hours_end: campaign.quiet_hours_end || '08:00',
          group_id: campaign.group_id || undefined,
        });

        // Set selected recipients from campaign data
        if (campaign.recipients && Array.isArray(campaign.recipients)) {
          setSelectedRecipients(campaign.recipients.map((r: { id: string }) => r.id));
        }

        toast.success('Campaign data loaded for editing');
      }
    } catch (error) {
      console.error('Error loading campaign data:', error);
      toast.error('Failed to load campaign data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    setCurrentStep(step);
  };

  const updateCampaignData = (updates: Partial<CampaignData>) => {
    setCampaignData(prev => ({ ...prev, ...updates }));
  };

  // Remove follow-up functions since they're not in the new interface
  const addFollowUp = () => {
    toast.info('Follow-ups will be implemented in sequences module');
  };

  const updateFollowUp = (id: string, updates: Partial<FollowUpMessage>) => {
    toast.info('Follow-ups will be implemented in sequences module');
  };

  const removeFollowUp = (id: string) => {
    toast.info('Follow-ups will be implemented in sequences module');
  };

  const toggleRecipient = (recipientId: string) => {
    setSelectedRecipients(prev =>
      prev.includes(recipientId)
        ? prev.filter(id => id !== recipientId)
        : [...prev, recipientId]
    );
  };

  const selectAllRecipients = () => {
    const filteredRecipients = getFilteredRecipients();
    setSelectedRecipients(filteredRecipients.map(r => r.id));
  };

  const clearAllRecipients = () => {
    setSelectedRecipients([]);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedRecipients.length === 0) {
      toast.error('No recipients selected');
      return;
    }

    try {
      switch (action) {
        case 'export': {
          const selectedRecipientData = recipients.filter(r => selectedRecipients.includes(r.id));
          const csvContent = [
            ['Phone', 'First Name', 'Last Name', 'Company', 'Tags', 'Status'],
            ...selectedRecipientData.map(r => [
              r.phone_number,
              r.first_name,
              r.last_name,
              r.company || '',
              r.tags?.join(', ') || '',
              r.status
            ])
          ].map(row => row.join(',')).join('\n');

          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `selected-recipients-${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);

          toast.success(`${selectedRecipients.length} contacts exported successfully`);
          break;
        }

        case 'remove':
          setRecipients(prev => prev.filter(r => !selectedRecipients.includes(r.id)));
          setSelectedRecipients([]);
          toast.success(`${selectedRecipients.length} contacts removed from campaign`);
          break;

        case 'add-tag':
          // For now, just show a message - could add a tag input dialog later
          toast.info('Tag addition feature coming soon');
          break;

        default:
          toast.error('Unknown bulk action');
      }
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error('Failed to perform bulk action');
    } finally {
      setShowBulkActions(false);
    }
  };

  const getFilteredRecipients = () => {
    let filtered = recipients;

    if (searchQuery) {
      filtered = filtered.filter(r =>
        r.phone_number.includes(searchQuery) ||
        r.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.company?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (tagFilter !== 'all') {
      filtered = filtered.filter(r => r.tags?.includes(tagFilter));
    }

    if (groupFilter !== 'all') {
      filtered = filtered.filter(r => r.group_id === groupFilter);
    }

    return filtered;
  };

  const getMessagePreview = (message: string, variables: Record<string, string> = {}) => {
    let preview = message;
    Object.entries(variables).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`{{${key}}}`, 'g'), value || `{${key}}`);
    });
    return preview;
  };

  // Get unique template categories
  const getTemplateCategories = () => {
    const categories = templates.map(template => template.category).filter(Boolean);
    return ['all', ...Array.from(new Set(categories))];
  };

  // Filter templates based on category and search
  const getFilteredTemplates = () => {
    return templates.filter(template => {
      const matchesCategory = templateCategoryFilter === 'all' || template.category === templateCategoryFilter;
      const matchesSearch = templateSearchQuery === '' ||
        template.name.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
        template.message.toLowerCase().includes(templateSearchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
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
  };

  const validatePhoneNumber = (phone: string): { isValid: boolean; cleanNumber: string; error?: string } => {
    // Remove all formatting characters
    const cleanNumber = phone.replace(/[\s-().]/g, '');

    // Check if it's empty
    if (!cleanNumber) {
      return { isValid: false, cleanNumber: '', error: 'Phone number is required' };
    }

    // Check for international format (+ followed by 10-15 digits)
    if (cleanNumber.startsWith('+')) {
      const digitsOnly = cleanNumber.substring(1);
      if (!/^\d{10,15}$/.test(digitsOnly)) {
        return { isValid: false, cleanNumber, error: 'International number must have 10-15 digits after +' };
      }
      return { isValid: true, cleanNumber };
    }

    // Check for local format (10-15 digits)
    if (!/^\d{10,15}$/.test(cleanNumber)) {
      return { isValid: false, cleanNumber, error: 'Phone number must have 10-15 digits' };
    }

    return { isValid: true, cleanNumber };
  };

  const downloadCSVTemplate = () => {
    const template = `phone,first_name,last_name,company,tags
+1234567890,John,Doe,Acme Corp,prospect
+1987654321,Jane,Smith,Tech Inc,customer`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sms_recipients_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        toast.error('CSV file must have at least a header and one data row');
        return;
      }

      const headers = parseCSVLine(lines[0]);

      // Enhanced column detection with more variations
      const phoneIndex = headers.findIndex(h =>
        h.toLowerCase().includes('phone') ||
        h.toLowerCase().includes('mobile') ||
        h.toLowerCase().includes('cell') ||
        h.toLowerCase() === 'number'
      );
      const firstNameIndex = headers.findIndex(h =>
        h.toLowerCase().includes('first') && h.toLowerCase().includes('name') ||
        h.toLowerCase() === 'firstname' ||
        h.toLowerCase() === 'first'
      );
      const lastNameIndex = headers.findIndex(h =>
        h.toLowerCase().includes('last') && h.toLowerCase().includes('name') ||
        h.toLowerCase() === 'lastname' ||
        h.toLowerCase() === 'last'
      );
      const nameIndex = headers.findIndex(h =>
        h.toLowerCase() === 'name' && !h.toLowerCase().includes('first') && !h.toLowerCase().includes('last')
      );
      const companyIndex = headers.findIndex(h =>
        h.toLowerCase().includes('company') ||
        h.toLowerCase().includes('organization') ||
        h.toLowerCase().includes('business') ||
        h.toLowerCase().includes('org')
      );
      const emailIndex = headers.findIndex(h =>
        h.toLowerCase().includes('email') ||
        h.toLowerCase() === 'email_address'
      );
      const tagIndex = headers.findIndex(h =>
        h.toLowerCase().includes('tag') ||
        h.toLowerCase().includes('category') ||
        h.toLowerCase().includes('group')
      );

      // Validate required phone column
      if (phoneIndex === -1) {
        toast.error('CSV must contain a phone number column (phone, mobile, cell, or number)');
        return;
      }

      const errors: string[] = [];
      const warnings: string[] = [];
      const newRecipients: SMSRecipient[] = [];

      lines.slice(1).forEach((line, index) => {
        try {
          const values = parseCSVLine(line);
          const phone = values[phoneIndex]?.replace(/"/g, '').trim() || '';

          if (!phone) {
            errors.push(`Line ${index + 2}: No phone number`);
            return;
          }

          // Basic phone validation
          const cleanPhone = phone.replace(/[\s-().]/g, '');
          if (!cleanPhone.match(/^\+?\d{10,15}$/)) {
            warnings.push(`Line ${index + 2}: Phone number format may be invalid (${phone})`);
          }

          const firstName = firstNameIndex >= 0 ? values[firstNameIndex]?.replace(/"/g, '').trim() || '' : '';
          const lastName = lastNameIndex >= 0 ? values[lastNameIndex]?.replace(/"/g, '').trim() || '' : '';
          const fullName = nameIndex >= 0 ? values[nameIndex]?.replace(/"/g, '').trim() || '' : '';
          const company = companyIndex >= 0 ? values[companyIndex]?.replace(/"/g, '').trim() || '' : '';
          const email = emailIndex >= 0 ? values[emailIndex]?.replace(/"/g, '').trim() || '' : '';
          const tagsStr = tagIndex >= 0 ? values[tagIndex]?.replace(/"/g, '').trim() || '' : '';

          let displayName = '';
          if (fullName) {
            displayName = fullName;
          } else if (firstName || lastName) {
            displayName = `${firstName} ${lastName}`.trim();
          }

          const tags = tagsStr ? tagsStr.split(/[,;|]/).map(tag => tag.trim()).filter(Boolean) : [];

          newRecipients.push({
            id: `csv_${Date.now()}_${index}`,
            phone: cleanPhone,
            first_name: displayName.split(' ')[0] || '',
            last_name: displayName.split(' ').slice(1).join(' ') || '',
            company: company || undefined,
            status: 'active',
            tags: tags.length > 0 ? tags : undefined,
            email: email || undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        } catch (error) {
          errors.push(`Line ${index + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });

      if (newRecipients.length === 0) {
        toast.error(`No valid recipients found. Errors: ${errors.slice(0, 5).join(', ')}${errors.length > 5 ? '...' : ''}`);
        return;
      }

      // Check for duplicate phone numbers
      const existingPhones = new Set(recipients.map(r => r.phone_number.replace(/[\s-().]/g, '')));
      const duplicates = newRecipients.filter(r => existingPhones.has(r.phone));
      const uniqueRecipients = newRecipients.filter(r => !existingPhones.has(r.phone));

      if (duplicates.length > 0) {
        warnings.push(`${duplicates.length} duplicate phone numbers skipped`);
      }

      if (uniqueRecipients.length === 0) {
        toast.warning('All recipients already exist in your campaign');
        return;
      }

      // Show import summary
      let summaryMessage = `${uniqueRecipients.length} contacts imported successfully`;
      if (warnings.length > 0) {
        summaryMessage += `. ${warnings.slice(0, 3).join('. ')}${warnings.length > 3 ? '...' : ''}`;
      }

      if (errors.length > 0) {
        console.warn('CSV import errors:', errors);
      }

      setRecipients(prev => [...prev, ...uniqueRecipients]);
      setSelectedRecipients(prev => [...prev, ...uniqueRecipients.map(r => r.id)]);

      toast.success(summaryMessage);

      // Clear the file input
      event.target.value = '';
    } catch (error) {
      toast.error('Failed to import CSV file');
      console.error('CSV import error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!campaignData.name && !!campaignData.account_id && !!campaignData.sender_number;
      case 2:
        return !!campaignData.message && campaignData.message.length <= 1600;
      case 3:
        return true; // Follow-ups are optional
      case 4:
        return selectedRecipients.length > 0;
      case 5:
        return true; // Settings have defaults
      case 6:
        return true; // Review step
      default:
        return false;
    }
  };

  const handleSaveCampaign = async () => {
    try {
      setIsLoading(true);

      const campaignPayload = {
        name: campaignData.name,
        description: campaignData.description,
        sender_id: campaignData.sender_id,
        message: campaignData.message,
        recipient_method: campaignData.recipient_method,
        recipient_tags: JSON.stringify(campaignData.recipient_tags || []),
        recipient_groups: JSON.stringify(campaignData.recipient_groups || []),
        scheduled_at: campaignData.scheduled_at,
        throttle_rate: campaignData.throttle_rate,
        throttle_unit: campaignData.throttle_unit,
        enable_retry: campaignData.enable_retry,
        retry_attempts: campaignData.retry_attempts,
        respect_quiet_hours: campaignData.respect_quiet_hours,
        quiet_hours_start: campaignData.quiet_hours_start,
        quiet_hours_end: campaignData.quiet_hours_end,
        group_id: campaignData.group_id,
      };

      let response;
      if (isEditMode && id) {
        response = await smsAPI.updateSMSCampaign(id, campaignPayload);
        toast.success('SMS campaign updated successfully!');
      } else {
        response = await smsAPI.createSMSCampaign(campaignPayload);
        toast.success('SMS campaign saved successfully!');
      }

      navigate('/reach/outbound/sms/campaigns');
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error(`Failed to ${isEditMode ? 'update' : 'save'} SMS campaign`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaunchCampaign = async () => {
    try {
      setIsLoading(true);

      const campaignPayload = {
        name: campaignData.name,
        description: campaignData.description,
        sender_id: campaignData.sender_id,
        message: campaignData.message,
        recipient_method: campaignData.recipient_method,
        recipient_tags: JSON.stringify(campaignData.recipient_tags || []),
        recipient_groups: JSON.stringify(campaignData.recipient_groups || []),
        scheduled_at: campaignData.scheduled_at,
        throttle_rate: campaignData.throttle_rate,
        throttle_unit: campaignData.throttle_unit,
        enable_retry: campaignData.enable_retry,
        retry_attempts: campaignData.retry_attempts,
        respect_quiet_hours: campaignData.respect_quiet_hours,
        quiet_hours_start: campaignData.quiet_hours_start,
        quiet_hours_end: campaignData.quiet_hours_end,
        group_id: campaignData.group_id,
      };

      let response;
      if (isEditMode && id) {
        response = await smsAPI.updateSMSCampaign(id, campaignPayload);
        toast.success('SMS campaign updated and launched successfully!');
      } else {
        response = await smsAPI.createSMSCampaign(campaignPayload);
        toast.success('SMS campaign launched successfully!');
      }

      navigate('/reach/outbound/sms/campaigns');
    } catch (error) {
      console.error('Error launching campaign:', error);
      toast.error(`Failed to ${isEditMode ? 'update and launch' : 'launch'} SMS campaign`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
                <CardDescription>Basic information about your SMS campaign</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaignName">Campaign Name *</Label>
                    <Input
                      id="campaignName"
                      placeholder="Summer Sale SMS Campaign"
                      value={campaignData.name}
                      onChange={(e) => updateCampaignData({ name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Brief description of the campaign"
                      value={campaignData.description}
                      onChange={(e) => updateCampaignData({ description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="group">Campaign Group</Label>
                    <Select
                      value={campaignData.group_id || 'none'}
                      onValueChange={(value) => updateCampaignData({ group_id: value === 'none' ? undefined : value })}
                    >
                      <SelectTrigger id="group">
                        <SelectValue placeholder="Select a group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Group</SelectItem>
                        {groups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Select Number
                </CardTitle>
                <CardDescription>
                  Choose the phone number you want to send SMS messages from
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Available SMS Numbers</Label>
                  <Select
                    value={campaignData.sender_id}
                    onValueChange={(value) => {
                      updateCampaignData({
                        sender_id: value,
                      });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Search and select a number..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sendingAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <div className="font-medium">{account.phone_number}</div>
                              <div className="text-sm text-gray-500">{account.name}</div>
                            </div>
                            <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
                              {account.status}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {sendingAccounts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No SMS sending accounts configured</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => navigate('/settings#sms')}
                      >
                        Configure SMS Settings
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Create SMS Message
                </CardTitle>
                <CardDescription>
                  Write your SMS message. Use variables like {'{{firstName}}'} to personalize content.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTemplateDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const variables = {
                        firstName: 'John',
                        lastName: 'Doe',
                        company: 'Acme Corp',
                      };
                      updateCampaignData({ variables });
                    }}
                  >
                    Load Sample Variables
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message Content</Label>
                  <Textarea
                    id="message"
                    placeholder="Enter your SMS message..."
                    value={campaignData.message}
                    onChange={(e) => updateCampaignData({ message: e.target.value })}
                    className="min-h-[120px] font-mono text-sm"
                    maxLength={1600}
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{campaignData.message.length}/1600 characters</span>
                    <span>{Math.ceil(campaignData.message.length / 160)} SMS parts</span>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <Label className="text-sm font-medium mb-2 block text-gray-900 dark:text-gray-100">Available Variables</Label>
                  <div className="flex flex-wrap gap-2">
                    {['firstName', 'lastName', 'company', 'phone'].map((variable) => (
                      <button
                        key={variable}
                        onClick={() => {
                          const newMessage = campaignData.message + `{{${variable}}}`;
                          updateCampaignData({ message: newMessage });
                        }}
                        className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        <Badge
                          variant="outline"
                          className="text-gray-700 dark:text-gray-300"
                        >
                          {'{{' + variable + '}}'}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <Label className="text-sm font-medium mb-2 block text-gray-900 dark:text-gray-100">Message Preview</Label>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600 text-sm font-mono text-gray-900 dark:text-gray-100">
                    {getMessagePreview(campaignData.message, campaignData.variables) || 'Your message will appear here...'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Follow-up Messages
                </span>
                <Button size="sm" onClick={addFollowUp}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Follow-up
                </Button>
              </CardTitle>
              <CardDescription>
                Set up automatic follow-up messages to increase response rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {campaignData.follow_ups.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No follow-up messages configured</p>
                  <p className="text-sm mt-2">Add follow-up messages to automatically send reminders</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={addFollowUp}>
                    Add First Follow-up
                  </Button>
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {campaignData.follow_ups.map((followUp, index) => (
                    <AccordionItem key={followUp.id} value={followUp.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">Follow-up #{index + 1}</span>
                          <Badge variant="outline">
                            {followUp.delay_days}d {followUp.delay_hours}h after
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 p-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>Delay Days</Label>
                              <Input
                                type="number"
                                min="0"
                                max="365"
                                value={followUp.delay_days}
                                onChange={(e) => updateFollowUp(followUp.id, { delay_days: parseInt(e.target.value) || 0 })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Delay Hours</Label>
                              <Input
                                type="number"
                                min="0"
                                max="23"
                                value={followUp.delay_hours}
                                onChange={(e) => updateFollowUp(followUp.id, { delay_hours: parseInt(e.target.value) || 0 })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Condition</Label>
                              <Select
                                value={followUp.condition}
                                onValueChange={(value) => updateFollowUp(followUp.id, { condition: value as 'no_reply' | 'always' })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="no_reply">Only if no reply</SelectItem>
                                  <SelectItem value="always">Always send</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Follow-up Message</Label>
                            <Textarea
                              placeholder="Enter follow-up message..."
                              value={followUp.message}
                              onChange={(e) => updateFollowUp(followUp.id, { message: e.target.value })}
                              className="min-h-[80px]"
                              maxLength={1600}
                            />
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>{followUp.message.length}/1600 characters</span>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <div className="text-sm text-gray-500">
                              Preview: {getMessagePreview(followUp.message, campaignData.variables) || 'Follow-up message preview...'}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFollowUp(followUp.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Select Contacts
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllRecipients}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAllRecipients}>
                    Clear All
                  </Button>
                  <Button size="sm" onClick={() => setShowRecipientDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contacts
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Choose who will receive your SMS messages. {selectedRecipients.length} contacts selected.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by phone, name, or company..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                  <Select value={groupFilter} onValueChange={setGroupFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Groups</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={tagFilter} onValueChange={setTagFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by tags" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tags</SelectItem>
                      <SelectItem value="prospect">Prospects</SelectItem>
                      <SelectItem value="customer">Customers</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('csv-file-input')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV
                  </Button>
                  <input
                    id="csv-file-input"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleCSVImport}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadCSVTemplate}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedFilter(true)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Advanced Filter
                  </Button>
                  {selectedRecipients.length > 0 && (
                    <DropdownMenu open={showBulkActions} onOpenChange={setShowBulkActions}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4 mr-2" />
                          Bulk Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleBulkAction('export')}>
                          <Download className="h-4 w-4 mr-2" />
                          Export Selected
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkAction('add-tag')}>
                          <Tag className="h-4 w-4 mr-2" />
                          Add Tag
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleBulkAction('remove')}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove from Campaign
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedRecipients.length === getFilteredRecipients().length && getFilteredRecipients().length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) selectAllRecipients();
                            else clearAllRecipients();
                          }}
                        />
                      </TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredRecipients().map((recipient) => (
                      <TableRow key={recipient.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedRecipients.includes(recipient.id)}
                            onCheckedChange={(checked) => toggleRecipient(recipient.id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono">
                          {recipient.phone_number || 'No phone number'}
                        </TableCell>
                        <TableCell>
                          {recipient.first_name} {recipient.last_name}
                        </TableCell>
                        <TableCell>{recipient.company || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {recipient.tags?.map((tag) => (
                              <Badge key={tag} variant="secondary" size="sm">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={recipient.status === 'active' ? 'success' : 'secondary'}
                            className={recipient.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                          >
                            {recipient.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingRecipient(recipient.id);
                                setEditRecipientForm({
                                  firstName: recipient.first_name || '',
                                  lastName: recipient.last_name || '',
                                  phone: recipient.phone_number,
                                  company: recipient.company || '',
                                  tags: recipient.tags?.join(', ') || ''
                                });
                              }}
                              title="Edit recipient"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this recipient?')) {
                                  setRecipients(prev => prev.filter(r => r.id !== recipient.id));
                                  setSelectedRecipients(prev => prev.filter(id => id !== recipient.id));
                                  toast.success('Recipient deleted successfully');
                                }
                              }}
                              title="Delete recipient"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {getFilteredRecipients().length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No recipients found matching your criteria
                  </div>
                )}
              </div>

              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{selectedRecipients.length} contacts selected</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Estimated cost: ${(selectedRecipients.length * 0.0075).toFixed(2)} USD
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {selectedRecipients.length} messages × $0.0075 per message
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Schedule & Settings
                </CardTitle>
                <CardDescription>
                  Configure when and how your SMS messages will be sent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Schedule Type</Label>
                  <Select
                    value={campaignData.schedule_type}
                    onValueChange={(value) => updateCampaignData({ schedule_type: value as 'immediate' | 'scheduled' | 'recurring' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Send Immediately</SelectItem>
                      <SelectItem value="scheduled">Schedule for Later</SelectItem>
                      <SelectItem value="recurring">Recurring Campaign</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {campaignData.schedule_type === 'scheduled' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Scheduled Date</Label>
                      <Input
                        type="date"
                        value={campaignData.scheduled_date}
                        onChange={(e) => updateCampaignData({ scheduled_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Scheduled Time</Label>
                      <Input
                        type="time"
                        value={campaignData.scheduled_time}
                        onChange={(e) => updateCampaignData({ scheduled_time: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {campaignData.schedule_type === 'recurring' && (
                  <div className="space-y-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Recurring Campaigns Coming Soon</span>
                    </div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Recurring SMS campaigns are not yet available. Please select "Send Immediately" or "Schedule for Later" for now.
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <Label>Timezone</Label>
                  <Select
                    value={campaignData.timezone}
                    onValueChange={(value) => updateCampaignData({ timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                      <SelectItem value="Australia/Sydney">Sydney (AEDT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Quiet Hours</div>
                      <div className="text-sm text-gray-500">
                        Prevent sending during specific hours
                      </div>
                    </div>
                    <Checkbox
                      checked={campaignData.quiet_hours_enabled}
                      onCheckedChange={(checked) => updateCampaignData({ quiet_hours_enabled: checked as boolean })}
                    />
                  </div>
                  {campaignData.quiet_hours_enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={campaignData.quiet_hours_start}
                          onChange={(e) => updateCampaignData({ quiet_hours_start: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={campaignData.quiet_hours_end}
                          onChange={(e) => updateCampaignData({ quiet_hours_end: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Throttle Rate (messages per minute)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={campaignData.throttle_rate}
                    onChange={(e) => updateCampaignData({ throttle_rate: parseInt(e.target.value) || 1 })}
                  />
                  <div className="text-sm text-gray-500">
                    Control the sending speed to avoid carrier restrictions
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Enable Tracking</div>
                      <div className="text-sm text-gray-500">
                        Track delivery, opens, and replies
                      </div>
                    </div>
                    <Checkbox
                      checked={campaignData.enable_tracking}
                      onCheckedChange={(checked) => updateCampaignData({ enable_tracking: checked as boolean })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Review & Launch
                </CardTitle>
                <CardDescription>
                  Review your campaign settings before launching
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Campaign Details</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Name:</span>
                          <span className="font-medium">{campaignData.name || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Description:</span>
                          <span className="font-medium">{campaignData.description || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Sending Number:</span>
                          <span className="font-medium">{campaignData.sender_number || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Group:</span>
                          <span className="font-medium">
                            {campaignData.group_id ? groups.find(g => g.id === campaignData.group_id)?.name || 'Unknown' : 'No Group'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Message Content</h4>
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm border dark:border-gray-700">
                        {getMessagePreview(campaignData.message, campaignData.variables) || 'No message set'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {campaignData.message.length} characters, {Math.ceil(campaignData.message.length / 160)} SMS parts
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Contacts</h4>
                      <div className="text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Total Contacts:</span>
                          <span className="font-medium">{selectedRecipients.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Estimated Cost:</span>
                          <span className="font-medium">${(selectedRecipients.length * 0.0075).toFixed(2)} USD</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Schedule & Settings</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Schedule:</span>
                          <span className="font-medium capitalize">{campaignData.schedule_type}</span>
                        </div>
                        {campaignData.schedule_type === 'scheduled' && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Scheduled for:</span>
                            <span className="font-medium">
                              {campaignData.scheduled_date} {campaignData.scheduled_time}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Quiet Hours:</span>
                          <span className="font-medium">{campaignData.quiet_hours_enabled ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Throttle Rate:</span>
                          <span className="font-medium">{campaignData.throttle_rate} messages/min</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Follow-up Messages</h4>
                      <div className="text-sm">
                        {campaignData.follow_ups.length > 0 ? (
                          <span>{campaignData.follow_ups.length} follow-up messages configured</span>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">No follow-up messages</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Tracking</h4>
                      <div className="text-sm">
                        <Badge variant={campaignData.enable_tracking ? 'success' : 'secondary'}>
                          {campaignData.enable_tracking ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Important:</strong> By launching this campaign, you confirm that you have permission to send SMS messages to the selected recipients and comply with applicable regulations including TCPA and GDPR.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="container mx-auto py-6 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-[18px] font-bold">
                {isEditMode ? 'Edit SMS Campaign' : 'Create SMS Campaign'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Set up your SMS marketing campaign in 6 simple steps</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/reach/outbound/sms/campaigns')}>
              Cancel
            </Button>
          </div>

          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center cursor-pointer transition-all ${currentStep >= step.id ? 'text-hunter-orange' : 'text-gray-400'
                    }`}
                  onClick={() => handleStepClick(step.id)}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${currentStep > step.id
                      ? 'bg-hunter-orange border-hunter-orange text-white'
                      : currentStep === step.id
                        ? 'bg-hunter-orange-light border-hunter-orange text-hunter-orange'
                        : 'bg-white dark:bg-gray-800 border-gray-300 text-gray-400'
                      }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="ml-3 hidden md:block">
                    <div className="text-sm font-medium">{step.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-4 transition-all ${currentStep > step.id ? 'bg-hunter-orange' : 'bg-gray-300'
                      }`}
                  />
                )}
              </div>
            ))}
          </div>

          <Progress value={(currentStep / 6) * 100} className="mb-8" />
        </div>

        <div className="mb-8">
          {renderStepContent()}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-6 border-gray-300 hover:border-hunter-orange hover:text-hunter-orange"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSaveCampaign}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 border-gray-300 hover:border-hunter-orange hover:text-hunter-orange"
            >
              <Save className="h-4 w-4" />
              Save as Draft
            </Button>

            {currentStep === 6 ? (
              <Button
                onClick={handleLaunchCampaign}
                disabled={isLoading}
                className="flex items-center gap-2 px-6"
              >
                <Send className="h-4 w-4" />
                Launch Campaign
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!validateStep(currentStep)}
                className="flex items-center gap-2 px-6"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select SMS Template</DialogTitle>
            <DialogDescription>
              Choose a template to use for your SMS message
            </DialogDescription>
          </DialogHeader>

          {/* Search and Filter Controls */}
          <div className="space-y-4 mb-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Search templates..."
                  value={templateSearchQuery}
                  onChange={(e) => setTemplateSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={templateCategoryFilter} onValueChange={setTemplateCategoryFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getTemplateCategories().map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {getFilteredTemplates().map((template) => (
              <div key={template.id} className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                onClick={() => {
                  updateCampaignData({ message: template.message, template_id: template.id });
                  setShowTemplateDialog(false);
                }}>
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium">{template.name}</div>
                  <Badge variant="outline">{template.category}</Badge>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{template.message}</div>
              </div>
            ))}
            {getFilteredTemplates().length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No templates found</p>
                {templateSearchQuery || templateCategoryFilter !== 'all' ? (
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => {
                    setTemplateSearchQuery('');
                    setTemplateCategoryFilter('all');
                  }}>
                    Clear Filters
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('/reach/sms-templates')}>
                    Create Template
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Recipient Dialog */}
      <Dialog open={!!editingRecipient} onOpenChange={(open) => {
        if (!open) setEditingRecipient(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Recipient</DialogTitle>
            <DialogDescription>
              Edit recipient details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  placeholder="John"
                  value={editRecipientForm.firstName}
                  onChange={(e) => setEditRecipientForm(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  placeholder="Doe"
                  value={editRecipientForm.lastName}
                  onChange={(e) => setEditRecipientForm(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input
                placeholder="+1234567890"
                value={editRecipientForm.phone}
                onChange={(e) => setEditRecipientForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input
                placeholder="Acme Corp"
                value={editRecipientForm.company}
                onChange={(e) => setEditRecipientForm(prev => ({ ...prev, company: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input
                placeholder="prospect, customer"
                value={editRecipientForm.tags}
                onChange={(e) => setEditRecipientForm(prev => ({ ...prev, tags: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingRecipient(null)}>
                Cancel
              </Button>
              <Button onClick={() => {
                if (!editRecipientForm.phone.trim()) {
                  toast.error('Phone number is required');
                  return;
                }

                setRecipients(prev => prev.map(recipient =>
                  recipient.id === editingRecipient
                    ? {
                      ...recipient,
                      phone: editRecipientForm.phone.trim(),
                      first_name: editRecipientForm.firstName.trim() || undefined,
                      last_name: editRecipientForm.lastName.trim() || undefined,
                      company: editRecipientForm.company.trim() || undefined,
                      tags: editRecipientForm.tags ? editRecipientForm.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined
                    }
                    : recipient
                ));

                setEditingRecipient(null);
                setEditRecipientForm({ firstName: '', lastName: '', phone: '', company: '', tags: '' });
                toast.success('Recipient updated successfully');
              }}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recipient Dialog */}
      <Dialog open={showRecipientDialog} onOpenChange={setShowRecipientDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Contacts</DialogTitle>
            <DialogDescription>
              Add new contacts to your campaign
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  placeholder="John"
                  value={recipientForm.firstName}
                  onChange={(e) => setRecipientForm(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  placeholder="Doe"
                  value={recipientForm.lastName}
                  onChange={(e) => setRecipientForm(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input
                placeholder="+1234567890"
                value={recipientForm.phone}
                onChange={(e) => setRecipientForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input
                placeholder="Acme Corp"
                value={recipientForm.company}
                onChange={(e) => setRecipientForm(prev => ({ ...prev, company: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input
                placeholder="prospect, customer"
                value={recipientForm.tags}
                onChange={(e) => setRecipientForm(prev => ({ ...prev, tags: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRecipientDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                if (!recipientForm.phone.trim()) {
                  toast.error('Phone number is required');
                  return;
                }

                // Create new recipient
                const newRecipient: SMSRecipient = {
                  id: Date.now().toString(),
                  phone: recipientForm.phone.trim(),
                  first_name: recipientForm.firstName.trim() || undefined,
                  last_name: recipientForm.lastName.trim() || undefined,
                  company: recipientForm.company.trim() || undefined,
                  tags: recipientForm.tags ? recipientForm.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
                  status: 'active'
                };

                // Add to recipients list
                setRecipients(prev => [...prev, newRecipient]);

                // Add to selected recipients
                setSelectedRecipients(prev => [...prev, newRecipient.id]);

                // Reset form and close dialog
                setRecipientForm({
                  firstName: '',
                  lastName: '',
                  phone: '',
                  company: '',
                  tags: ''
                });
                setShowRecipientDialog(false);

                toast.success('Recipient added successfully');
              }}>
                Add Recipient
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Advanced Filter Dialog */}
      <Dialog open={showAdvancedFilter} onOpenChange={setShowAdvancedFilter}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Advanced Filter</DialogTitle>
            <DialogDescription>
              Filter recipients by multiple criteria
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone Number Contains</Label>
                <Input
                  placeholder="e.g., +1, 555"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tag Filter</Label>
                <Select value={tagFilter} onValueChange={setTagFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    <SelectItem value="prospect">Prospects</SelectItem>
                    <SelectItem value="customer">Customers</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Company Contains</Label>
              <Input
                placeholder="e.g., Corp, Inc"
                onChange={(e) => {
                  const companyQuery = e.target.value;
                  if (companyQuery) {
                    setRecipients(prev => prev.filter(r =>
                      r.company?.toLowerCase().includes(companyQuery.toLowerCase())
                    ));
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRecipients(prev => prev.filter(r => r.status === 'active'))}
                >
                  Active Only
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRecipients(prev => prev.filter(r => r.status === 'inactive'))}
                >
                  Inactive Only
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadInitialData()}
                >
                  Reset Filter
                </Button>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">
                <strong>Quick Stats:</strong> {getFilteredRecipients().length} contacts match your criteria
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAdvancedFilter(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                // Apply current filters and close
                setShowAdvancedFilter(false);
              }}
            >
              Apply Filter
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SMSCampaignBuilder;
