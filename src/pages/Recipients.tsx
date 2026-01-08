import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Checkbox } from '../components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Separator } from '../components/ui/separator';
import { Progress } from '../components/ui/progress';
import {
  Plus,
  Upload,
  Search,
  Filter,
  Users,
  MoreHorizontal,
  Download,
  Trash2,
  Mail,
  Building,
  Globe,
  UserPlus,
  FileTextIcon,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Tags as TagIcon,
  Layers,
  ChevronDown,
  ChevronRight,
  Send,
  MousePointerClick
} from 'lucide-react';

import { api, type Recipient, type Campaign, type Tag } from '../lib/api';
import { useToast } from '../hooks/use-toast';

const Recipients: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State management
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [groupBy, setGroupBy] = useState<string>('none');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [createTagDialogOpen, setCreateTagDialogOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [selectedCampaignForBulk, setSelectedCampaignForBulk] = useState('');
  const [selectedTagForBulk, setSelectedTagForBulk] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Mock lead data for demonstration
  const [mockLeads] = useState([
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@techcorp.com',
      company: 'TechCorp Inc.',
      position: 'CEO',
      location: 'San Francisco, CA',
      verified: true,
      confidence: 95
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.j@innovate.io',
      company: 'Innovate Solutions',
      position: 'Marketing Director',
      location: 'New York, NY',
      verified: true,
      confidence: 88
    },
    {
      id: '3',
      name: 'Mike Chen',
      email: 'mike@startupx.com',
      company: 'StartupX',
      position: 'CTO',
      location: 'Austin, TX',
      verified: false,
      confidence: 72
    }
  ]);

  // Load data
  const loadRecipients = useCallback(async () => {
    try {
      const data = await api.getRecipients();
      setRecipients(data);
    } catch (error) {
      console.error('Failed to load recipients:', error);
    }
  }, []);

  const loadCampaigns = useCallback(async () => {
    try {
      const data = await api.getCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    }
  }, []);

  const loadTags = useCallback(async () => {
    try {
      const data = await api.getTags();
      setTags(data);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }
    loadRecipients();
    loadCampaigns();
    loadTags();
  }, [navigate, loadRecipients, loadCampaigns, loadTags]);

  // Filter recipients
  const filteredRecipients = recipients.filter(recipient => {
    const matchesSearch = !searchQuery ||
      recipient.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipient.company?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || recipient.status === statusFilter;
    const matchesCampaign = campaignFilter === 'all' || recipient.campaignId === campaignFilter;
    const matchesTag = tagFilter === 'all' ||
      (tagFilter === 'untagged' && (!recipient.tags || recipient.tags.length === 0)) ||
      (recipient.tags && recipient.tags.some(tag => tag.id === tagFilter));

    return matchesSearch && matchesStatus && matchesCampaign && matchesTag;
  });

  // Grouping logic
  const groupedRecipients = React.useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Recipients': filteredRecipients };
    }

    const groups: { [key: string]: Recipient[] } = {};

    filteredRecipients.forEach(recipient => {
      let groupKey = 'Unknown';

      switch (groupBy) {
        case 'status':
          groupKey = recipient.status || 'Unknown';
          break;
        case 'campaign': {
          const campaign = campaigns.find(c => c.id === recipient.campaignId);
          groupKey = campaign?.name || 'No Campaign';
          break;
        }
        case 'company':
          groupKey = recipient.company || 'No Company';
          break;
        case 'tag':
          if (recipient.tags && recipient.tags.length > 0) {
            groupKey = recipient.tags[0].name;
          } else {
            groupKey = 'No Tags';
          }
          break;
        default:
          groupKey = 'All Recipients';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(recipient);
    });

    return groups;
  }, [filteredRecipients, groupBy, campaigns]);

  // Group expansion handlers
  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const expandAllGroups = () => {
    setExpandedGroups(new Set(Object.keys(groupedRecipients)));
  };

  const collapseAllGroups = () => {
    setExpandedGroups(new Set());
  };

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'bounced': return 'destructive';
      case 'unsubscribed': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-3 w-3" />;
      case 'bounced': return <XCircle className="h-3 w-3" />;
      case 'unsubscribed': return <AlertCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecipients(filteredRecipients.map(r => r.id));
    } else {
      setSelectedRecipients([]);
    }
  };

  const handleSelectRecipient = (recipientId: string, checked: boolean) => {
    if (checked) {
      setSelectedRecipients(prev => [...prev, recipientId]);
    } else {
      setSelectedRecipients(prev => prev.filter(id => id !== recipientId));
    }
  };

  // Action handlers
  const handleAddRecipient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const firstName = formData.get('firstName') as string;
      const lastName = formData.get('lastName') as string;
      const company = formData.get('company') as string;
      const campaignId = formData.get('campaignId') as string;

      await api.addRecipients([{
        email,
        name: `${firstName} ${lastName}`.trim() || email.split('@')[0],
        company,
        ...(campaignId ? { campaignId } : {}),
      }]);

      toast({
        title: 'Recipient added',
        description: `${email} has been added.`
      });
      setDialogOpen(false);
      loadRecipients();
      loadCampaigns();
    } catch (error) {
      toast({
        title: 'Error adding contact',
        description: error instanceof Error ? error.message : 'Failed to add contact',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportCSV = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a CSV file.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        toast({
          title: 'Invalid CSV',
          description: 'CSV file must have at least a header row and one data row.',
          variant: 'destructive',
        });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const emailIndex = headers.findIndex(h => h.includes('email'));

      if (emailIndex === -1) {
        toast({
          title: 'Invalid CSV',
          description: 'CSV file must contain an email column.',
          variant: 'destructive',
        });
        return;
      }

      // Helper function to parse CSV line with proper quote handling
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

      // Find column indices for various fields
      const firstNameIndex = headers.findIndex(h =>
        h.toLowerCase().includes('first') && h.toLowerCase().includes('name')
      );
      const lastNameIndex = headers.findIndex(h =>
        h.toLowerCase().includes('last') && h.toLowerCase().includes('name')
      );
      const nameIndex = headers.findIndex(h =>
        h.toLowerCase() === 'name' && !h.toLowerCase().includes('first') && !h.toLowerCase().includes('last')
      );
      const companyIndex = headers.findIndex(h =>
        h.toLowerCase().includes('company') || h.toLowerCase().includes('organization')
      );
      const positionIndex = headers.findIndex(h =>
        h.toLowerCase().includes('position') || h.toLowerCase().includes('title') || h.toLowerCase().includes('job')
      );
      const phoneIndex = headers.findIndex(h =>
        h.toLowerCase().includes('phone') || h.toLowerCase().includes('mobile')
      );
      const websiteIndex = headers.findIndex(h =>
        h.toLowerCase().includes('website') || h.toLowerCase().includes('url')
      );

      const recipientsToAdd = lines.slice(1).filter(line => line.trim()).map((line, index) => {
        try {
          const values = parseCSVLine(line);
          const email = values[emailIndex]?.replace(/"/g, '') || '';

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            console.warn(`Invalid email at line ${index + 2}: ${email}`);
            return null;
          }

          const firstName = firstNameIndex >= 0 ? values[firstNameIndex]?.replace(/"/g, '') || '' : '';
          const lastName = lastNameIndex >= 0 ? values[lastNameIndex]?.replace(/"/g, '') || '' : '';
          const fullName = nameIndex >= 0 ? values[nameIndex]?.replace(/"/g, '') || '' : '';

          // Determine name - use full name if available, otherwise combine first/last, fallback to email prefix
          let displayName = '';
          if (fullName) {
            displayName = fullName;
          } else if (firstName || lastName) {
            displayName = `${firstName} ${lastName}`.trim();
          } else {
            displayName = email.split('@')[0];
          }

          // Build custom fields object
          const customFields: Record<string, string> = {};
          if (companyIndex >= 0 && values[companyIndex]) {
            customFields.company = values[companyIndex].replace(/"/g, '');
          }
          if (positionIndex >= 0 && values[positionIndex]) {
            customFields.position = values[positionIndex].replace(/"/g, '');
          }
          if (phoneIndex >= 0 && values[phoneIndex]) {
            customFields.phone = values[phoneIndex].replace(/"/g, '');
          }
          if (websiteIndex >= 0 && values[websiteIndex]) {
            customFields.website = values[websiteIndex].replace(/"/g, '');
          }

          return {
            ...(selectedCampaignId ? { campaignId: selectedCampaignId } : {}),
            email,
            name: displayName,
            company: customFields.company || '',
            customFields: Object.keys(customFields).length > 0 ? JSON.stringify(customFields) : undefined,
          };
        } catch (error) {
          console.warn(`Error parsing line ${index + 2}: ${line}`, error);
          return null;
        }
      }).filter(r => r !== null);

      if (recipientsToAdd.length === 0) {
        toast({
          title: 'No valid contacts',
          description: 'No valid email addresses found in the CSV file.',
          variant: 'destructive',
        });
        return;
      }

      const created = await api.addRecipients(recipientsToAdd);
      const newCampaignId = created[0]?.campaignId;
      if (!selectedCampaignId && newCampaignId) {
        setSelectedCampaignId(newCampaignId);
      }

      toast({
        title: 'Import successful',
        description: `${recipientsToAdd.length} recipients imported successfully.`,
      });

      loadRecipients();
      loadCampaigns();
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Failed to import CSV file',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Tag-related handlers
  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast({
        title: 'Error',
        description: 'Tag name is required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await api.createTag({ name: newTagName.trim(), color: newTagColor });
      toast({
        title: 'Tag created',
        description: `Tag "${newTagName}" has been created.`,
      });
      setNewTagName('');
      setNewTagColor('#3b82f6');
      setCreateTagDialogOpen(false);
      loadTags();
    } catch (error) {
      toast({
        title: 'Error creating tag',
        description: error instanceof Error ? error.message : 'Failed to create tag.',
        variant: 'destructive',
      });
    }
  };

  const handleAddTagToRecipient = async (recipientId: string, tagId: string) => {
    try {
      await api.addTagToRecipient(recipientId, tagId);
      toast({
        title: 'Tag added',
        description: 'Tag has been added to recipient.',
      });
      loadRecipients();
    } catch (error) {
      toast({
        title: 'Error adding tag',
        description: error instanceof Error ? error.message : 'Failed to add tag.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveTagFromRecipient = async (recipientId: string, tagId: string) => {
    try {
      await api.removeTagFromRecipient(recipientId, tagId);
      toast({
        title: 'Tag removed',
        description: 'Tag has been removed from recipient.',
      });
      loadRecipients();
    } catch (error) {
      toast({
        title: 'Error removing tag',
        description: error instanceof Error ? error.message : 'Failed to remove tag.',
        variant: 'destructive',
      });
    }
  };

  const handleBulkAddTag = async (tagId: string) => {
    if (selectedRecipients.length === 0) return;

    try {
      await Promise.all(
        selectedRecipients.map(recipientId => api.addTagToRecipient(recipientId, tagId))
      );

      toast({
        title: 'Tags added',
        description: `Tag added to ${selectedRecipients.length} contacts.`,
      });
      setSelectedRecipients([]);
      setTagDialogOpen(false);
      loadRecipients();
    } catch (error) {
      toast({
        title: 'Error adding tags',
        description: error instanceof Error ? error.message : 'Failed to add tags.',
        variant: 'destructive',
      });
    }
  };

  const handleAddLeads = (leadIds: string[]) => {
    // Mock implementation - in real app, this would add selected leads as recipients
    toast({
      title: 'Leads added',
      description: `${leadIds.length} leads added to recipients.`,
    });
    setLeadDialogOpen(false);
  };

  const handleBulkDelete = async () => {
    if (selectedRecipients.length === 0) return;

    try {
      // Delete each selected recipient
      await Promise.all(
        selectedRecipients.map(recipientId => api.deleteRecipient(recipientId))
      );

      toast({
        title: 'Contacts deleted',
        description: `${selectedRecipients.length} contacts deleted successfully.`,
      });
      setSelectedRecipients([]);
      loadRecipients();
      loadCampaigns();
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete recipients.',
        variant: 'destructive',
      });
    }
  };

  const handleBulkAddToCampaign = async (campaignId: string) => {
    if (selectedRecipients.length === 0 || !campaignId) return;

    try {
      // Get selected recipients data
      const selectedRecipientsData = recipients.filter(r => selectedRecipients.includes(r.id));

      // Update each recipient's campaign
      await Promise.all(
        selectedRecipientsData.map(recipient =>
          api.updateRecipient(recipient.id, { campaignId })
        )
      );

      const campaign = campaigns.find(c => c.id === campaignId);
      toast({
        title: 'Contacts added to campaign',
        description: `${selectedRecipients.length} contacts added to "${campaign?.name || 'campaign'}".`,
      });
      setSelectedRecipients([]);
      loadRecipients();
      loadCampaigns();
    } catch (error) {
      toast({
        title: 'Failed to add to campaign',
        description: error instanceof Error ? error.message : 'Failed to add recipients to campaign.',
        variant: 'destructive',
      });
    }
  };

  const handleBulkExport = () => {
    if (selectedRecipients.length === 0) return;

    try {
      // Get selected recipients data
      const selectedRecipientsData = recipients.filter(r => selectedRecipients.includes(r.id));

      // Create CSV content
      const headers = ['Email', 'First Name', 'Last Name', 'Company', 'Status', 'Tags', 'Created At'];
      const csvContent = [
        headers.join(','),
        ...selectedRecipientsData.map(recipient => [
          recipient.email,
          recipient.firstName || '',
          recipient.lastName || '',
          recipient.company || '',
          recipient.status,
          recipient.tags?.map(tag => tag.name).join(';') || '',
          new Date(recipient.createdAt).toLocaleDateString()
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `recipients_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Export successful',
        description: `${selectedRecipients.length} recipients exported to CSV.`,
      });
      setSelectedRecipients([]);
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to export recipients.',
        variant: 'destructive',
      });
    }
  };

  // Individual recipient actions
  const handleDeleteRecipient = async (recipientId: string) => {
    try {
      await api.deleteRecipient(recipientId);
      toast({
        title: 'Recipient deleted',
        description: 'Recipient deleted successfully.',
      });
      loadRecipients();
      loadCampaigns();
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete recipient.',
        variant: 'destructive',
      });
    }
  };

  const handleSendEmailToRecipient = async (recipientId: string) => {
    try {
      const recipient = recipients.find(r => r.id === recipientId);
      if (!recipient) {
        toast({
          title: 'Error',
          description: 'Recipient not found.',
          variant: 'destructive',
        });
        return;
      }

      // Navigate to compose email with recipient pre-filled
      navigate('/email-inbox', {
        state: {
          composeEmail: true,
          recipientEmail: recipient.email,
          recipientName: recipient.name
        }
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send email.',
        variant: 'destructive',
      });
    }
  };

  const handleAddRecipientToCampaign = (recipientId: string) => {
    setSelectedRecipients([recipientId]);
    setCampaignDialogOpen(true);
  };

  const handleExport = () => {
    if (filteredRecipients.length === 0) {
      toast({
        title: 'No contacts to export',
        description: 'There are no contacts matching your current filters.',
        variant: 'destructive',
      });
      return;
    }

    // Generate CSV content
    const headers = ['Email', 'Name', 'Company', 'Status', 'Campaign', 'Sent At', 'Opened At', 'Clicked At'];
    const csvContent = [
      headers.join(','),
      ...filteredRecipients.map(recipient => {
        const campaign = campaigns.find(c => c.id === recipient.campaignId);
        return [
          `"${recipient.email}"`,
          `"${recipient.name || ''}"`,
          `"${recipient.company || ''}"`,
          `"${recipient.status}"`,
          `"${campaign?.name || ''}"`,
          `"${recipient.sentAt || ''}"`,
          `"${recipient.openedAt || ''}"`,
          `"${recipient.clickedAt || ''}"`
        ].join(',');
      })
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `recipients_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export completed',
      description: `${filteredRecipients.length} contacts exported successfully.`,
    });
  };

  const handleDownloadTemplate = () => {
    // Generate comprehensive CSV template with all supported fields
    const headers = [
      'email', 'first_name', 'last_name', 'company', 'position', 'phone', 'website',
      'industry', 'location', 'country', 'linkedin', 'twitter', 'department',
      'employee_count', 'revenue', 'lead_source', 'notes', 'tags'
    ];

    const sampleData = [
      'john.doe@acme.com,John,Doe,Acme Corp,CEO,+1-555-0123,https://acme.com,Technology,"New York, NY",USA,https://linkedin.com/in/johndoe,@johndoe,Executive,500,10M,Website,"Interested in enterprise solutions",VIP;Enterprise',
      'jane.smith@techcorp.com,Jane,Smith,TechCorp Inc,Marketing Director,+1-555-0124,https://techcorp.com,Software,"San Francisco, CA",USA,https://linkedin.com/in/janesmith,@janesmith,Marketing,200,5M,Referral,"Attended webinar last month",Lead;Marketing',
      'bob.wilson@startup.io,Bob,Wilson,StartupXYZ,CTO,+1-555-0125,https://startup.io,SaaS,"Austin, TX",USA,https://linkedin.com/in/bobwilson,@bobwilson,Engineering,50,1M,Conference,"Met at TechConf 2024",Startup;Technical'
    ];

    // Create CSV content with proper escaping
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => {
        // Split by comma but handle quoted values properly
        const values = row.split(',').map(value => {
          // If value contains comma, space, or special chars, wrap in quotes
          if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes(';')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        return values.join(',');
      })
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'recipients_template_enhanced.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Enhanced template downloaded',
      description: 'Comprehensive CSV template with 18 fields downloaded. All fields except email are optional.',
    });
  };

  return (

    <div className="space-y-4">
      {/* Header with Hunter.io styling */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold tracking-tight text-foreground">Contacts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your email contacts and find new leads
          </p>
        </div>


        <div className="flex gap-2">
          <Button onClick={handleDownloadTemplate} variant="outline" disabled={isLoading}>
            <FileTextIcon className="h-4 w-4 mr-2" />
            Download Template
          </Button>
          <Button onClick={handleExport} variant="outline" disabled={isLoading}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleImportCSV} variant="outline" disabled={isLoading}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {/* Find Leads Dialog */}
          <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-hunter-orange/20 text-hunter-orange hover:bg-hunter-orange-light/20">
                <Search className="h-4 w-4 mr-2" />
                Find Leads
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Find New Leads</DialogTitle>
                <DialogDescription>
                  Search and add verified email addresses to your recipient list
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Input placeholder="Company name or domain..." className="flex-1" />
                  <Select>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button>Search</Button>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Confidence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell>
                            <Checkbox />
                          </TableCell>
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {lead.email}
                              {lead.verified && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{lead.company}</TableCell>
                          <TableCell>{lead.position}</TableCell>
                          <TableCell>{lead.location}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={lead.confidence} className="w-16" />
                              <span className="text-sm">{lead.confidence}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-between">
                  <p className="text-sm text-muted-foreground">
                    3 leads found • 2 verified emails
                  </p>
                  <Button onClick={() => handleAddLeads(['1', '2'])}>
                    Add Selected Leads
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Recipient Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Add Recipient
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Recipient</DialogTitle>
                <DialogDescription>
                  Add a single recipient manually
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddRecipient} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="recipient@example.com" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" name="firstName" placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" name="lastName" placeholder="Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" name="company" placeholder="Acme Inc." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaignId">Campaign (optional)</Label>
                  <Select
                    value={selectedCampaignId}
                    onValueChange={setSelectedCampaignId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a campaign (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input type="hidden" name="campaignId" value={selectedCampaignId} />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Recipient'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
                <p className="text-[18px] font-bold">{recipients.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-[18px] font-bold text-green-600">
                  {recipients.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bounced</p>
                <p className="text-[18px] font-bold text-red-600">
                  {recipients.filter(r => r.status === 'bounced').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate('/unsubscribers')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unsubscribed</p>
                <p className="text-[18px] font-bold text-orange-600">
                  {recipients.filter(r => r.status === 'unsubscribed').length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Click to view details</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardContent className="pt-6">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
                <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={campaignFilter} onValueChange={setCampaignFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by campaign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                <SelectItem value="untagged">Untagged</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Group by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    No Grouping
                  </div>
                </SelectItem>
                <SelectItem value="status">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    By Status
                  </div>
                </SelectItem>
                <SelectItem value="campaign">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    By Campaign
                  </div>
                </SelectItem>
                <SelectItem value="company">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    By Company
                  </div>
                </SelectItem>
                <SelectItem value="tag">
                  <div className="flex items-center gap-2">
                    <TagIcon className="h-4 w-4" />
                    By Tag
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Group Controls */}
          {groupBy !== 'none' && Object.keys(groupedRecipients).length > 1 && (
            <div className="flex items-center gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={expandAllGroups}>
                <ChevronDown className="h-4 w-4 mr-2" />
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAllGroups}>
                <ChevronRight className="h-4 w-4 mr-2" />
                Collapse All
              </Button>
              <span className="text-sm text-muted-foreground">
                {Object.keys(groupedRecipients).length} groups
              </span>
            </div>
          )}

          {/* Bulk Actions */}
          {selectedRecipients.length > 0 && (
            <div className="flex items-center gap-4 mb-4 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedRecipients.length} recipient(s) selected
              </span>
              <Separator orientation="vertical" className="h-4" />
              <Button variant="outline" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCampaignDialogOpen(true)}>
                <Mail className="h-4 w-4 mr-2" />
                Add to Campaign
              </Button>
              <Button variant="outline" size="sm" onClick={() => setTagDialogOpen(true)}>
                <TagIcon className="h-4 w-4 mr-2" />
                Add Tag
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCreateTagDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Tag
              </Button>
              <Button variant="outline" size="sm" onClick={handleBulkExport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          )}

          {/* Recipients Table */}
          {filteredRecipients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Users className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No recipients found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'Add recipients to start sending campaigns'}
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Recipient
              </Button>
            </div>
          ) : groupBy === 'none' ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedRecipients.length === filteredRecipients.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Opens</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecipients.map((recipient) => (
                    <TableRow key={recipient.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRecipients.includes(recipient.id)}
                          onCheckedChange={(checked) =>
                            handleSelectRecipient(recipient.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {recipient.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          {recipient.name || 'Unknown'}
                        </div>
                      </TableCell>
                      <TableCell>{recipient.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          {recipient.company || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(recipient.status)} className="flex items-center gap-1 w-fit">
                          {getStatusIcon(recipient.status)}
                          {recipient.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {recipient.campaignId ? (
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {campaigns.find(c => c.id === recipient.campaignId)?.name || 'Unknown Campaign'}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {recipient.openedAt ? '1' : '0'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <MousePointerClick className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {recipient.clickedAt ? '1' : '0'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {recipient.clickedAt ? (
                          <div className="flex items-center gap-1">
                            <MousePointerClick className="h-3 w-3" />
                            {new Date(recipient.clickedAt).toLocaleDateString()}
                          </div>
                        ) : recipient.openedAt ? (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {new Date(recipient.openedAt).toLocaleDateString()}
                          </div>
                        ) : recipient.sentAt ? (
                          <div className="flex items-center gap-1">
                            <Send className="h-3 w-3" />
                            {new Date(recipient.sentAt).toLocaleDateString()}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {recipient.tags && recipient.tags.length > 0 ? (
                            recipient.tags.map((tag) => (
                              <Badge
                                key={tag.id}
                                variant="secondary"
                                className="text-xs flex items-center gap-1"
                                style={{ backgroundColor: `${tag.color}20`, color: tag.color, borderColor: tag.color }}
                              >
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: tag.color }}
                                />
                                {tag.name}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveTagFromRecipient(recipient.id, tag.id);
                                  }}
                                  className="ml-1 hover:bg-destructive/10 rounded-full p-0.5"
                                >
                                  <XCircle className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-xs">No tags</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleSendEmailToRecipient(recipient.id)}>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddRecipientToCampaign(recipient.id)}>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Add to Campaign
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedRecipients([recipient.id]);
                                setTagDialogOpen(true);
                              }}
                            >
                              <TagIcon className="h-4 w-4 mr-2" />
                              Add Tag
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteRecipient(recipient.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedRecipients).map(([groupName, recipients]) => (
                <Card key={groupName} className="overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => toggleGroup(groupName)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedGroups.has(groupName) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium">{groupName}</h3>
                      <Badge variant="secondary" className="ml-2">
                        {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={recipients.every(r => selectedRecipients.includes(r.id))}
                        onCheckedChange={(checked) => {
                          const recipientIds = recipients.map(r => r.id);
                          if (checked) {
                            setSelectedRecipients(prev => [...new Set([...prev, ...recipientIds])]);
                          } else {
                            setSelectedRecipients(prev => prev.filter(id => !recipientIds.includes(id)));
                          }
                        }}
                      />
                      <span className="text-sm text-muted-foreground">Select All</span>
                    </div>
                  </div>
                  {expandedGroups.has(groupName) && (
                    <div className="border-t">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox
                                checked={recipients.every(r => selectedRecipients.includes(r.id))}
                                onCheckedChange={(checked) => {
                                  const recipientIds = recipients.map(r => r.id);
                                  if (checked) {
                                    setSelectedRecipients(prev => [...new Set([...prev, ...recipientIds])]);
                                  } else {
                                    setSelectedRecipients(prev => prev.filter(id => !recipientIds.includes(id)));
                                  }
                                }}
                              />
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Campaign</TableHead>
                            <TableHead>Opens</TableHead>
                            <TableHead>Clicks</TableHead>
                            <TableHead>Last Activity</TableHead>
                            <TableHead>Tags</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recipients.map((recipient) => (
                            <TableRow key={recipient.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedRecipients.includes(recipient.id)}
                                  onCheckedChange={(checked) =>
                                    handleSelectRecipient(recipient.id, checked as boolean)
                                  }
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                    <span className="text-xs font-medium">
                                      {recipient.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </span>
                                  </div>
                                  {recipient.name || 'Unknown'}
                                </div>
                              </TableCell>
                              <TableCell>{recipient.email}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Building className="h-4 w-4 text-muted-foreground" />
                                  {recipient.company || '-'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusColor(recipient.status)} className="flex items-center gap-1 w-fit">
                                  {getStatusIcon(recipient.status)}
                                  {recipient.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {recipient.campaignId ? (
                                  <span className="text-xs bg-muted px-2 py-1 rounded">
                                    {campaigns.find(c => c.id === recipient.campaignId)?.name || 'Unknown Campaign'}
                                  </span>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm">
                                    {recipient.openedAt ? '1' : '0'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <MousePointerClick className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm">
                                    {recipient.clickedAt ? '1' : '0'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {recipient.clickedAt ? (
                                  <div className="flex items-center gap-1">
                                    <MousePointerClick className="h-3 w-3" />
                                    {new Date(recipient.clickedAt).toLocaleDateString()}
                                  </div>
                                ) : recipient.openedAt ? (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {new Date(recipient.openedAt).toLocaleDateString()}
                                  </div>
                                ) : recipient.sentAt ? (
                                  <div className="flex items-center gap-1">
                                    <Send className="h-3 w-3" />
                                    {new Date(recipient.sentAt).toLocaleDateString()}
                                  </div>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {recipient.tags && recipient.tags.length > 0 ? (
                                    recipient.tags.map((tag) => (
                                      <Badge
                                        key={tag.id}
                                        variant="secondary"
                                        className="text-xs flex items-center gap-1"
                                        style={{ backgroundColor: `${tag.color}20`, color: tag.color, borderColor: tag.color }}
                                      >
                                        <div
                                          className="w-2 h-2 rounded-full"
                                          style={{ backgroundColor: tag.color }}
                                        />
                                        {tag.name}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveTagFromRecipient(recipient.id, tag.id);
                                          }}
                                          className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                                        >
                                          <XCircle className="h-3 w-3" />
                                        </button>
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-muted-foreground text-xs">No tags</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleSendEmailToRecipient(recipient.id)}>
                                      <Mail className="h-4 w-4 mr-2" />
                                      Send Email
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleAddRecipientToCampaign(recipient.id)}>
                                      <UserPlus className="h-4 w-4 mr-2" />
                                      Add to Campaign
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedRecipients([recipient.id]);
                                        setTagDialogOpen(true);
                                      }}
                                    >
                                      <TagIcon className="h-4 w-4 mr-2" />
                                      Add Tag
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => handleDeleteRecipient(recipient.id)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaign Selection Dialog for Bulk Actions */}
      <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contacts to Campaign</DialogTitle>
            <DialogDescription>
              Select a campaign to add {selectedRecipients.length} selected contact(s) to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulkCampaignId">Campaign</Label>
              <Select
                value={selectedCampaignForBulk}
                onValueChange={setSelectedCampaignForBulk}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCampaignDialogOpen(false);
                  setSelectedCampaignForBulk('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedCampaignForBulk) {
                    handleBulkAddToCampaign(selectedCampaignForBulk);
                    setCampaignDialogOpen(false);
                    setSelectedCampaignForBulk('');
                  }
                }}
                disabled={!selectedCampaignForBulk}
              >
                Add to Campaign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Tag Dialog */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tag to Contacts</DialogTitle>
            <DialogDescription>
              Select a tag to add to {selectedRecipients.length} selected contact(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedTagForBulk} onValueChange={setSelectedTagForBulk}>
              <SelectTrigger>
                <SelectValue placeholder="Select a tag" />
              </SelectTrigger>
              <SelectContent>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setTagDialogOpen(false);
                  setSelectedTagForBulk('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedTagForBulk) {
                    handleBulkAddTag(selectedTagForBulk);
                  }
                }}
                disabled={!selectedTagForBulk}
              >
                Add Tag
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Tag Dialog */}
      <Dialog open={createTagDialogOpen} onOpenChange={setCreateTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
            <DialogDescription>
              Create a new tag for organizing recipients
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tagName">Tag Name</Label>
              <Input
                id="tagName"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter tag name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagColor">Tag Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="tagColor"
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateTagDialogOpen(false);
                  setNewTagName('');
                  setNewTagColor('#3b82f6');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTag}
                disabled={!newTagName.trim()}
              >
                Create Tag
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>

  );
};

export default Recipients;

