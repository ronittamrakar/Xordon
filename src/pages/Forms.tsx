import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Download,
  Trash2,
  FolderPlus,
  Folder,
  ExternalLink,
  Mail,
  Calendar,
  Users,
  ChevronDown,
  Send,
  Settings,
  Settings,
  FileTextIcon,
  Archive
} from 'lucide-react';

import { AppLayout } from '../components/layout/AppLayout';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';

import FormBuilder from '@/components/forms/FormBuilder';
import { useCampaignSettings } from '@/hooks/useCampaignSettings';

import { api, type Form, type FormField, type FormResponse, type Group, type FormTemplate, type FormStep } from '../lib/api';

// Extended Form interface for local use
interface ExtendedForm extends Form {
  response_count?: number;
  last_response_at?: string;
}

// Use Group type from API as FormGroup
type FormGroup = Group;

const Forms: React.FC = () => {
  const navigate = useNavigate();
  const { settings: campaignSettings, loading: settingsLoading, validateRequiredSettings } = useCampaignSettings();

  // State management
  const [forms, setForms] = useState<ExtendedForm[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [groups, setGroups] = useState<FormGroup[]>([]);
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);

  // Bulk actions state
  const [selectedForms, setSelectedForms] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Dialog states
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [responsesOpen, setResponsesOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);

  // Form states
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);
  const [newForm, setNewForm] = useState<Partial<Form>>({
    name: '',
    title: '',
    description: '',
    fields: [],
    status: 'draft',
    is_multi_step: false,
    steps: []
  });
  const [newGroupName, setNewGroupName] = useState('');
  const [replyData, setReplyData] = useState({
    subject: campaignSettings.forms.autoReplySubject,
    body: campaignSettings.forms.autoReplyMessage
  });

  // Template states
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('none');

  // Fetch data functions
  const fetchForms = useCallback(async () => {
    try {
      const data = await api.getForms();
      setForms(data);
    } catch (error) {
      console.error('Failed to fetch forms:', error);
      toast.error('Failed to load forms');
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const data = await api.getGroups();
      setGroups(data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      toast.error('Failed to load form groups');
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const data = await api.getFormTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to fetch form templates:', error);
      toast.error('Failed to load form templates');
    }
  }, []);

  const fetchCampaigns = useCallback(async () => {
    try {
      const data = await api.getCampaigns();
      setCampaigns(data.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    }
  }, []);

  const fetchResponses = useCallback(async (formId: string) => {
    try {
      const data = await api.getFormResponses(formId);
      setResponses(data);
    } catch (error) {
      console.error('Failed to fetch responses:', error);
      toast.error('Failed to load form responses');
    }
  }, []);

  // Form fields change handler
  const handleFormFieldsChange = useCallback((fields: FormField[]) => {
    setSelectedForm(prev =>
      prev ? { ...prev, fields } : null
    );
  }, []);

  const handleNewFormFieldsChange = useCallback((fields: FormField[]) => {
    setNewForm(prev => ({ ...prev, fields }));
  }, []);

  const handleNewFormStepsChange = useCallback((steps: FormStep[]) => {
    setNewForm(prev => ({ ...prev, steps }));
  }, []);

  const handleFormStepsChange = useCallback((steps: FormStep[]) => {
    setSelectedForm(prev =>
      prev ? { ...prev, steps } : null
    );
  }, []);

  // Update form settings when campaign settings load
  useEffect(() => {
    if (!settingsLoading) {
      setReplyData({
        subject: campaignSettings.forms.autoReplySubject,
        body: campaignSettings.forms.autoReplyMessage,
      });
    }
  }, [settingsLoading, campaignSettings]);

  useEffect(() => {
  }, []);

  // Validate required settings before proceeding
  useEffect(() => {
    if (!settingsLoading && campaignSettings.forms.enableNotifications) {
      const validation = validateRequiredSettings('forms');
      if (!validation.valid) {
        toast.error(`Please configure: ${validation.missing.join(', ')} in Settings page`);
      }
    }
  }, [settingsLoading]);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchForms(), fetchGroups(), fetchTemplates(), fetchCampaigns()]);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load page data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchForms, fetchGroups, fetchTemplates, fetchCampaigns]);

  // Reset template selection when create dialog opens/closes
  useEffect(() => {
    if (!createFormOpen) {
      setSelectedTemplate('');
    }
  }, [createFormOpen]);

  // Form management functions
  const handleCreateForm = () => {
    // Navigate to the full-page builder for new forms
    navigate('/forms/builder/new');
  };

  const handleEditForm = (form: Form) => {
    // Navigate to the full-page builder for editing
    navigate(`/forms/builder/${form.id}`);
  };

  const handleUpdateForm = async () => {
    try {
      if (!selectedForm || !selectedForm.name || !selectedForm.title) {
        toast.error('Please fill in all required fields');
        return;
      }

      const updated = await api.updateForm(selectedForm.id, {
        name: selectedForm.name,
        title: selectedForm.title,
        description: selectedForm.description,
        fields: selectedForm.fields,
        status: selectedForm.status
      });

      setForms(prev => prev.map(form =>
        form.id === selectedForm.id ? updated : form
      ));
      setEditFormOpen(false);
      setSelectedForm(null);
      toast.success('Form updated successfully');
    } catch (error) {
      console.error('Failed to update form:', error);
      toast.error('Failed to update form');
    }
  };

  const handleMoveToTrash = async (formId: string) => {
    try {
      await api.updateForm(formId, { status: 'trashed' });
      setForms(prev => prev.filter(form => form.id !== formId));
      toast.success('Form moved to trash');
    } catch (error) {
      console.error('Failed to move form to trash:', error);
      toast.error('Failed to move form to trash');
    }
  };

  const handleArchiveForm = async (formId: string) => {
    try {
      await api.updateForm(formId, { status: 'archived' });
      setForms(prev => prev.filter(form => form.id !== formId));
      toast.success('Form archived successfully');
    } catch (error) {
      console.error('Failed to archive form:', error);
      toast.error('Failed to archive form');
    }
  };

  const createGroup = async () => {
    try {
      if (!newGroupName.trim()) {
        toast.error('Please enter a group name');
        return;
      }

      await api.createGroup({ name: newGroupName.trim() });
      await fetchGroups();
      setShowCreateGroupDialog(false);
      setNewGroupName('');
      toast.success('Group created successfully');
    } catch (error) {
      console.error('Failed to create group:', error);
      toast.error('Failed to create group. Please try again.');
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      await api.deleteGroup(groupId);
      await fetchGroups();
      // Reset filter if the deleted group was selected
      if (selectedGroup === groupId) {
        setSelectedGroup('all');
      }
      toast.success('Group deleted successfully');
    } catch (error) {
      console.error('Failed to delete group:', error);
      toast.error('Failed to delete group. Make sure the group is empty.');
    }
  };

  const updateGroup = async (groupId: string, newName: string) => {
    try {
      await api.updateGroup(groupId, { name: newName });
      await fetchGroups();
      toast.success('Group updated successfully');
    } catch (error) {
      console.error('Failed to update group:', error);
      toast.error('Failed to update group');
    }
  };

  const handleMoveToGroup = async (formId: string, groupId: string) => {
    try {
      await api.updateForm(formId, { group_id: groupId });
      setForms(prev => prev.map(form =>
        form.id === formId ? { ...form, group_id: groupId } : form
      ));
      toast.success('Form moved successfully');
    } catch (error) {
      console.error('Failed to move form:', error);
      toast.error('Failed to move form');
    }
  };

  // Bulk action handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedForms(new Set());
    } else {
      setSelectedForms(new Set(filteredForms.map(form => form.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleFormSelect = (formId: string, checked: boolean) => {
    const newSelected = new Set(selectedForms);
    if (checked) {
      newSelected.add(formId);
    } else {
      newSelected.delete(formId);
    }
    setSelectedForms(newSelected);
    setSelectAll(newSelected.size === filteredForms.length);
  };

  const handleBulkMoveToTrash = async () => {
    if (selectedForms.size === 0) return;

    const confirmed = confirm(`Are you sure you want to move ${selectedForms.size} form(s) to trash?`);
    if (!confirmed) return;

    try {
      await Promise.all(Array.from(selectedForms).map(formId =>
        api.updateForm(formId, { status: 'trashed' })
      ));
      setForms(prev => prev.filter(form => !selectedForms.has(form.id)));
      setSelectedForms(new Set());
      setSelectAll(false);
      toast.success(`${selectedForms.size} form(s) moved to trash`);
    } catch (error) {
      console.error('Failed to move forms to trash:', error);
      toast.error('Failed to move some forms to trash');
    }
  };

  const handleBulkArchive = async () => {
    if (selectedForms.size === 0) return;

    try {
      await Promise.all(Array.from(selectedForms).map(formId =>
        api.updateForm(formId, { status: 'archived' })
      ));
      setForms(prev => prev.filter(form => !selectedForms.has(form.id)));
      setSelectedForms(new Set());
      setSelectAll(false);
      toast.success(`${selectedForms.size} form(s) archived successfully`);
    } catch (error) {
      console.error('Failed to archive forms:', error);
      toast.error('Failed to archive some forms');
    }
  };

  const handleBulkStatusChange = async (status: 'active' | 'inactive' | 'draft') => {
    if (selectedForms.size === 0) return;

    try {
      await Promise.all(Array.from(selectedForms).map(formId =>
        api.updateForm(formId, { status })
      ));
      setForms(prev => prev.map(form =>
        selectedForms.has(form.id) ? { ...form, status } : form
      ));
      setSelectedForms(new Set());
      setSelectAll(false);
      toast.success(`${selectedForms.size} form(s) updated successfully`);
    } catch (error) {
      console.error('Failed to update forms:', error);
      toast.error('Failed to update some forms');
    }
  };

  const handleBulkMoveToGroup = async (groupId: string) => {
    if (selectedForms.size === 0) return;

    try {
      await Promise.all(Array.from(selectedForms).map(formId =>
        api.updateForm(formId, { group_id: groupId })
      ));
      setForms(prev => prev.map(form =>
        selectedForms.has(form.id) ? { ...form, group_id: groupId } : form
      ));
      setSelectedForms(new Set());
      setSelectAll(false);
      toast.success(`${selectedForms.size} form(s) moved successfully`);
    } catch (error) {
      console.error('Failed to move forms:', error);
      toast.error('Failed to move some forms');
    }
  };

  // Response management functions
  const handleViewResponses = async (form: Form) => {
    setSelectedForm(form);
    await fetchResponses(form.id);
    setResponsesOpen(true);
  };

  const handleReplyToResponse = (response: FormResponse) => {
    setSelectedResponse(response);
    setReplyData({
      subject: `Re: ${selectedForm?.title || 'Form Submission'}`,
      body: `Thank you for your submission.\n\nBest regards,\nYour Team`
    });
    setReplyOpen(true);
  };

  const handleSendReply = async () => {
    try {
      if (!selectedResponse || !replyData.subject || !replyData.body) {
        toast.error('Please fill in all fields');
        return;
      }

      const email = selectedResponse.response_data.email as string;
      if (!email || typeof email !== 'string') {
        toast.error('No email address found in response');
        return;
      }

      await api.sendIndividualEmail({
        to_email: email,
        subject: replyData.subject,
        body: replyData.body,
        save_to_sent: true
      });

      setReplyOpen(false);
      setSelectedResponse(null);
      setReplyData({ subject: '', body: '' });
      toast.success('Reply sent successfully');
    } catch (error) {
      console.error('Failed to send reply:', error);
      toast.error('Failed to send reply');
    }
  };

  // Utility functions
  const copyFormUrl = (formId: string) => {
    const url = `${window.location.origin}/forms/${formId}/submit`;
    navigator.clipboard.writeText(url);
    toast.success('Form URL copied to clipboard');
  };

  const exportResponses = (form: Form) => {
    try {
      const csv = generateCSV(responses);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${form.name}-responses.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Responses exported successfully');
    } catch (error) {
      console.error('Failed to export responses:', error);
      toast.error('Failed to export responses');
    }
  };

  const generateCSV = (data: FormResponse[]): string => {
    if (data.length === 0) return '';

    const headers = ['Submitted At', 'IP Address', ...Object.keys(data[0].response_data)];
    const rows = data.map(response => [
      new Date(response.created_at).toLocaleString(),
      response.ip_address || '',
      ...Object.values(response.response_data)
    ]);

    return [headers, ...rows].map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  };

  const getStatusBadge = (status: Form['status']) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      draft: 'outline'
    } as const;

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter forms
  const filteredForms = forms.filter(form => {
    const matchesSearch = form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = selectedGroup === 'all' ||
      (selectedGroup === 'none' ? !form.group_id : form.group_id === selectedGroup);
    const matchesStatus = selectedStatus === 'all' || form.status === selectedStatus;
    const matchesCampaign = selectedCampaign === 'all' ||
      (selectedCampaign === 'none' ? !(form as ExtendedForm & { campaign_id?: string }).campaign_id :
        (form as ExtendedForm & { campaign_id?: string }).campaign_id === selectedCampaign);

    const isVisible = form.status !== 'archived' && form.status !== 'trashed';

    return matchesSearch && matchesGroup && matchesStatus && matchesCampaign && isVisible;
  });



  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <Breadcrumb
          items={[
            { label: 'Opt-in Forms', href: '/forms' }
          ]}
          className="mb-4"
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 page-header">
          <div>
            <h1 className="text-[18px] font-bold tracking-tight">Opt-in Forms</h1>
            <p className="text-muted-foreground text-sm">
              Create and manage your opt-in forms
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/forms/templates')}>
              <FileTextIcon className="h-4 w-4 mr-2" />
              Templates
            </Button>
            <Button onClick={handleCreateForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Form
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  <SelectItem value="none">No Group</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        {group.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Group Management Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowCreateGroupDialog(true)}>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Create Group
                  </DropdownMenuItem>
                  {groups.length > 0 && (
                    <>
                      <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                        Manage Groups:
                      </DropdownMenuItem>
                      {groups.map((group) => (
                        <div key={group.id} className="flex items-center justify-between px-2 py-1">
                          <span className="text-sm flex-1">{group.name}</span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                const newName = prompt('Enter new group name:', group.name);
                                if (newName && newName.trim() !== group.name) {
                                  updateGroup(group.id, newName.trim());
                                }
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete the group "${group.name}"? This action cannot be undone.`)) {
                                  deleteGroup(group.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {campaigns.length > 0 && (
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="w-[180px]">
                  <Send className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Campaign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  <SelectItem value="none">No Campaign</SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search forms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-[250px]"
              />
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedForms.size > 0 && (
          <Card className="border-analytics card-spacing">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {selectedForms.size} form(s) selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Change Status
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkStatusChange('active')}>
                        Set as Active
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStatusChange('inactive')}>
                        Set as Inactive
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStatusChange('draft')}>
                        Set as Draft
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Folder className="h-4 w-4 mr-2" />
                        Move to Group
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkMoveToGroup('')}>
                        No Group
                      </DropdownMenuItem>
                      {groups.map((group) => (
                        <DropdownMenuItem
                          key={group.id}
                          onClick={() => handleBulkMoveToGroup(group.id)}
                        >
                          {group.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4 mr-2" />
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={handleBulkArchive}>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleBulkMoveToTrash}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Move to Trash
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Forms Table */}
        <Card className="border-analytics card-spacing">
          <CardContent className="p-0">
            {filteredForms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <FileTextIcon className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm || selectedGroup !== 'all' || selectedStatus !== 'all' || selectedCampaign !== 'all'
                    ? 'No forms match your filters'
                    : 'No forms yet'
                  }
                </h3>
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                  {searchTerm || selectedGroup !== 'all' || selectedStatus !== 'all' || selectedCampaign !== 'all'
                    ? 'Try adjusting your search or filters to find what you\'re looking for'
                    : 'Create your first opt-in form to start collecting leads and responses'
                  }
                </p>
                <div className="flex gap-3">
                  {(searchTerm || selectedGroup !== 'all' || selectedStatus !== 'all' || selectedCampaign !== 'all') && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedGroup('all');
                        setSelectedStatus('all');
                        setSelectedCampaign('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                  <Button onClick={handleCreateForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Form
                  </Button>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Form</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Responses</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredForms.map((form) => (
                    <TableRow key={form.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Checkbox
                          checked={selectedForms.has(form.id)}
                          onCheckedChange={(checked) => handleFormSelect(form.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{form.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {form.description || 'No description'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={form.status === 'active' ? 'default' : 'secondary'}>
                          {form.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {form.group_id ? (
                          <Badge variant="outline" className="text-xs">
                            <Folder className="h-3 w-3 mr-1" />
                            {groups.find(g => g.id === form.group_id)?.name || 'Unknown'}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No group</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{form.response_count || 0}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(form.created_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewResponses(form)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Responses
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(`/forms/${form.id}/submit`, '_blank')}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open Form
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditForm(form)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyFormUrl(form.id)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy URL
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportResponses(form)}>
                              <Download className="h-4 w-4 mr-2" />
                              Export Responses
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenu>
                              <DropdownMenuTrigger className="flex items-center w-full px-2 py-1.5 text-sm">
                                <Folder className="h-4 w-4 mr-2" />
                                Move to Group
                                <ChevronDown className="h-4 w-4 ml-auto" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent side="left">
                                <DropdownMenuItem onClick={() => handleMoveToGroup(form.id, '')}>
                                  No Group
                                </DropdownMenuItem>
                                {groups.map(group => (
                                  <DropdownMenuItem
                                    key={group.id}
                                    onClick={() => handleMoveToGroup(form.id, group.id)}
                                  >
                                    <Folder className="h-4 w-4 mr-2" />
                                    {group.name}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleArchiveForm(form.id)}>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleMoveToTrash(form.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Move to Trash
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Form Dialog */}
      <Dialog open={createFormOpen} onOpenChange={setCreateFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Form</DialogTitle>
            <DialogDescription>
              Create a new form to start collecting responses
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="form-name">Form Name *</Label>
                <Input
                  id="form-name"
                  value={newForm.name || ''}
                  onChange={(e) => setNewForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Contact Form"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="form-title">Form Title *</Label>
                <Input
                  id="form-title"
                  value={newForm.title || ''}
                  onChange={(e) => setNewForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Get in Touch"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-description">Description</Label>
              <Textarea
                id="form-description"
                value={newForm.description || ''}
                onChange={(e) => setNewForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of your form"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-template">Use Template (Optional)</Label>
              <Select value={selectedTemplate} onValueChange={(value) => {
                setSelectedTemplate(value);
                if (value === 'none') {
                  setNewForm(prev => ({
                    ...prev,
                    fields: [],
                    is_multi_step: false,
                    steps: []
                  }));
                } else if (value) {
                  const template = templates.find(t => t.id === value);
                  if (template) {
                    setNewForm(prev => ({
                      ...prev,
                      name: template.name,
                      title: template.name,
                      description: template.description || '',
                      fields: template.fields,
                      is_multi_step: template.is_multi_step,
                      steps: template.steps || []
                    }));
                  }
                } else {
                  setNewForm(prev => ({
                    ...prev,
                    name: '',
                    title: '',
                    description: '',
                    fields: [],
                    is_multi_step: false,
                    steps: []
                  }));
                }
              }}>
                <SelectTrigger id="form-template">
                  <SelectValue placeholder="Choose a template or start from scratch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Start from scratch</SelectItem>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="multi-step"
                checked={newForm.is_multi_step || false}
                onChange={(e) => setNewForm(prev => ({
                  ...prev,
                  is_multi_step: e.target.checked,
                  steps: e.target.checked ? [{
                    id: 'step-1',
                    title: 'Step 1',
                    order: 0,
                    fields: []
                  }] : []
                }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="multi-step">Multi-step form</Label>
            </div>
            <div className="space-y-2">
              <Label>Form Fields</Label>
              <FormBuilder
                fields={newForm.fields || []}
                onFieldsChange={handleNewFormFieldsChange}
                isMultiStep={newForm.is_multi_step || false}
                steps={newForm.steps || []}
                onStepsChange={handleNewFormStepsChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateForm}>
              Create Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Form Dialog */}
      <Dialog open={editFormOpen} onOpenChange={setEditFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Form</DialogTitle>
            <DialogDescription>
              Update your form details and fields
            </DialogDescription>
          </DialogHeader>
          {selectedForm && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-form-name">Form Name *</Label>
                  <Input
                    id="edit-form-name"
                    value={selectedForm.name}
                    onChange={(e) => setSelectedForm(prev =>
                      prev ? { ...prev, name: e.target.value } : null
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-form-title">Form Title *</Label>
                  <Input
                    id="edit-form-title"
                    value={selectedForm.title}
                    onChange={(e) => setSelectedForm(prev =>
                      prev ? { ...prev, title: e.target.value } : null
                    )}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-form-description">Description</Label>
                <Textarea
                  id="edit-form-description"
                  value={selectedForm.description || ''}
                  onChange={(e) => setSelectedForm(prev =>
                    prev ? { ...prev, description: e.target.value } : null
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-form-status">Status</Label>
                <Select
                  value={selectedForm.status}
                  onValueChange={(value: Form['status']) =>
                    setSelectedForm(prev => prev ? { ...prev, status: value } : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-multi-step"
                  checked={selectedForm.is_multi_step || false}
                  onChange={(e) => setSelectedForm(prev => prev ? {
                    ...prev,
                    is_multi_step: e.target.checked,
                    steps: e.target.checked ? (prev.steps || [{
                      id: 'step-1',
                      title: 'Step 1',
                      order: 0,
                      fields: []
                    }]) : []
                  } : null)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="edit-multi-step">Multi-step form</Label>
              </div>
              <div className="space-y-2">
                <Label>Form Fields</Label>
                <FormBuilder
                  fields={selectedForm.fields}
                  onFieldsChange={handleFormFieldsChange}
                  isMultiStep={selectedForm.is_multi_step || false}
                  steps={selectedForm.steps || []}
                  onStepsChange={handleFormStepsChange}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateForm}>
              Update Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Responses Dialog */}
      <Dialog open={responsesOpen} onOpenChange={setResponsesOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Form Responses</DialogTitle>
            <DialogDescription>
              {selectedForm?.title} - {responses.length} responses
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {responses.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No responses yet</h3>
                <p className="text-muted-foreground">
                  Share your form to start collecting responses
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {responses.map((response) => (
                  <Card key={response.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="text-sm text-muted-foreground">
                          Submitted: {new Date(response.created_at).toLocaleString()}
                        </div>
                        {response.response_data.email && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReplyToResponse(response)}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Reply
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(response.response_data).map(([key, value]) => (
                          <div key={key}>
                            <Label className="text-sm font-medium capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              {String(value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResponsesOpen(false)}>
              Close
            </Button>
            {responses.length > 0 && (
              <Button onClick={() => selectedForm && exportResponses(selectedForm)}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Form Analytics</DialogTitle>
            <DialogDescription>
              {selectedForm?.title} - Performance overview
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-analytics">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Responses</p>
                      <p className="text-[18px] font-bold">{selectedForm?.response_count || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-analytics">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Last Response</p>
                      <p className="text-sm font-medium">
                        {selectedForm?.last_response_at
                          ? formatDate(selectedForm.last_response_at)
                          : 'No responses yet'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnalyticsOpen(false)}>
              Close
            </Button>
            <Button onClick={() => selectedForm && exportResponses(selectedForm)}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Response</DialogTitle>
            <DialogDescription>
              Send a reply to {selectedResponse?.response_data.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reply-subject">Subject</Label>
              <Input
                id="reply-subject"
                value={replyData.subject}
                onChange={(e) => setReplyData(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reply-body">Message</Label>
              <Textarea
                id="reply-body"
                value={replyData.body}
                onChange={(e) => setReplyData(prev => ({ ...prev, body: e.target.value }))}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendReply}>
              <Send className="h-4 w-4 mr-2" />
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Group Dialog */}
      <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Form Group</DialogTitle>
            <DialogDescription>
              Organize your forms into groups for better management
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name *</Label>
              <Input
                id="group-name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Contact Forms"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateGroupDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createGroup}>
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Forms;

