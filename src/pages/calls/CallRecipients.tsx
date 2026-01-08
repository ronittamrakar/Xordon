import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import {
  Users,
  Upload,
  Download,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  MoreVertical,
  Phone,
  Mail,
  Building,
  Tag
} from 'lucide-react';

import { Breadcrumb } from '@/components/Breadcrumb';
import { api } from '@/lib/api';
import { CallRecipient } from '@/types';

interface RecipientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  tags: string[];
  customFields: Record<string, string>;
}

interface FieldMapping {
  csvField: string;
  systemField: string;
}

const CallRecipients: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<CallRecipient | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [formData, setFormData] = useState<RecipientFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    tags: [],
    customFields: {}
  });

  const { data: recipients = [], isLoading } = useQuery({
    queryKey: ['call-recipients'],
    queryFn: api.getCallRecipients
  });

  // Get unique tags from all recipients
  const allTags = Array.from(new Set(recipients.flatMap(r => r.tags || [])));

  // Get unique statuses from all recipients
  const allStatuses = Array.from(new Set(recipients.map(r => r.status || 'pending')));

  // Filter recipients based on search, tags, and status
  const filteredRecipients = recipients.filter(recipient => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' ||
      (recipient.firstName || '').toLowerCase().includes(searchLower) ||
      (recipient.lastName || '').toLowerCase().includes(searchLower) ||
      (recipient.email || '').toLowerCase().includes(searchLower) ||
      (recipient.company || '').toLowerCase().includes(searchLower) ||
      (recipient.phone || '').includes(searchTerm);

    const matchesTags = selectedTags.length === 0 ||
      selectedTags.some(tag => (recipient.tags || []).includes(tag));

    const matchesStatus = selectedStatus === '' || recipient.status === selectedStatus;

    return matchesSearch && matchesTags && matchesStatus;
  });

  const createRecipientMutation = useMutation({
    mutationFn: api.createCallRecipient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-recipients'] });
      toast({
        title: 'Success',
        description: 'Recipient added successfully',
      });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add recipient',
        variant: 'destructive',
      });
    }
  });

  const updateRecipientMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RecipientFormData }) => api.updateCallRecipient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-recipients'] });
      toast({
        title: 'Success',
        description: 'Recipient updated successfully',
      });
      setIsEditModalOpen(false);
      setSelectedRecipient(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update recipient',
        variant: 'destructive',
      });
    }
  });

  const deleteRecipientMutation = useMutation({
    mutationFn: api.deleteCallRecipient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-recipients'] });
      toast({
        title: 'Success',
        description: 'Recipient deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete recipient',
        variant: 'destructive',
      });
    }
  });

  const uploadRecipientsMutation = useMutation({
    mutationFn: api.uploadCallRecipients,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-recipients'] });
      toast({
        title: 'Success',
        description: 'Recipients uploaded successfully',
      });
      setIsUploadModalOpen(false);
      setCsvFile(null);
      setCsvPreview([]);
      setFieldMappings([]);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to upload recipients',
        variant: 'destructive',
      });
    }
  });

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      title: '',
      tags: [],
      customFields: {}
    });
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        const preview = lines.slice(1, 6).map(line => line.split(',').map(cell => cell.trim()));
        setCsvPreview([headers, ...preview]);

        // Auto-map common fields
        const mappings: FieldMapping[] = headers.map(header => ({
          csvField: header,
          systemField: getSystemFieldMapping(header)
        }));
        setFieldMappings(mappings);
      };
      reader.readAsText(file);
    }
  };

  const getSystemFieldMapping = (csvField: string): string => {
    const field = csvField.toLowerCase();
    if (field.includes('first') && field.includes('name')) return 'firstName';
    if (field.includes('last') && field.includes('name')) return 'lastName';
    if (field.includes('name')) return 'name';
    if (field.includes('email')) return 'email';
    if (field.includes('phone') || field.includes('mobile') || field.includes('tel')) return 'phone';
    if (field.includes('company') || field.includes('organization')) return 'company';
    if (field.includes('title') || field.includes('position')) return 'title';
    if (field.includes('tag')) return 'tags';
    return '';
  };

  const handleFieldMappingChange = (index: number, systemField: string) => {
    const newMappings = [...fieldMappings];
    newMappings[index].systemField = systemField;
    setFieldMappings(newMappings);
  };

  const processCsvData = (): RecipientFormData[] => {
    if (!csvPreview.length || !fieldMappings.length) return [];

    const headers = csvPreview[0];
    const dataRows = csvPreview.slice(1);

    return dataRows.map((row) => {
      const recipient: RecipientFormData = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        title: '',
        tags: [],
        customFields: {}
      };

      fieldMappings.forEach(mapping => {
        if (mapping.systemField && mapping.csvField) {
          const csvIndex = headers.indexOf(mapping.csvField);
          if (csvIndex !== -1 && row[csvIndex]) {
            const value = row[csvIndex];
            switch (mapping.systemField) {
              case 'firstName':
                recipient.firstName = value;
                break;
              case 'lastName':
                recipient.lastName = value;
                break;
              case 'name': {
                const nameParts = value.split(' ');
                recipient.firstName = nameParts[0] || '';
                recipient.lastName = nameParts.slice(1).join(' ') || '';
                break;
              }
              case 'email':
                recipient.email = value;
                break;
              case 'phone':
                recipient.phone = value;
                break;
              case 'company':
                recipient.company = value;
                break;
              case 'title':
                recipient.title = value;
                break;
              case 'tags':
                recipient.tags = value.split(',').map(tag => tag.trim());
                break;
              default:
                recipient.customFields[mapping.systemField] = value;
            }
          }
        }
      });

      return recipient;
    });
  };

  const handleCreateRecipient = () => {
    if (!formData.firstName.trim() || !formData.phone.trim()) {
      toast({
        title: 'Error',
        description: 'First name and phone number are required',
        variant: 'destructive',
      });
      return;
    }
    createRecipientMutation.mutate(formData);
  };

  const handleEditRecipient = (recipient: CallRecipient) => {
    setSelectedRecipient(recipient);
    setFormData({
      firstName: recipient.firstName,
      lastName: recipient.lastName,
      email: recipient.email,
      phone: recipient.phone,
      company: recipient.company,
      title: recipient.title,
      tags: recipient.tags || [],
      customFields: recipient.customFields || {}
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateRecipient = () => {
    if (!selectedRecipient || !formData.firstName.trim() || !formData.phone.trim()) return;
    updateRecipientMutation.mutate({ id: selectedRecipient.id, data: formData });
  };

  const handleDeleteRecipient = (id: string) => {
    if (confirm('Are you sure you want to delete this recipient?')) {
      deleteRecipientMutation.mutate(id);
    }
  };

  const handleUploadRecipients = () => {
    const processedRecipients = processCsvData();
    if (processedRecipients.length === 0) {
      toast({
        title: 'Error',
        description: 'No valid recipients found in CSV file',
        variant: 'destructive',
      });
      return;
    }
    uploadRecipientsMutation.mutate(processedRecipients);
  };

  const handleExportRecipients = () => {
    const csvContent = [
      ['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Title', 'Tags'].join(','),
      ...filteredRecipients.map(recipient => [
        recipient.firstName,
        recipient.lastName,
        recipient.email,
        recipient.phone,
        recipient.company,
        recipient.title,
        (recipient.tags || []).join(';')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'call-recipients.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

    );
  }

  return (
    <>
      <div className="flex h-full">
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="space-y-4">
            <Breadcrumb
              items={[
                { label: 'Call Outreach', href: '/reach/outbound/calls', icon: <Phone className="h-4 w-4" /> },
                { label: 'Contacts' }
              ]}
            />

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Call Contacts</h1>
                <p className="text-muted-foreground mt-1">Manage your call contacts and import phone numbers for cold calling campaigns</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleExportRecipients}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Import CSV</span>
                </Button>
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Recipient</span>
                </Button>
                {/* Show Create Campaign button when in workflow */}
                {(() => {
                  const workflowState = location.state as { nextStep?: string; workflow?: string; scriptId?: string };
                  if (workflowState?.workflow === 'call-campaign-creation' && workflowState?.nextStep === 'campaign') {
                    return (
                      <Button
                        onClick={() => {
                          // Navigate to campaign creation with script and recipients
                          navigate('/reach/outbound/calls/campaigns/new', {
                            state: {
                              scriptId: workflowState.scriptId,
                              workflow: 'call-campaign-creation'
                            }
                          });
                        }}
                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                      >
                        <Phone className="h-4 w-4" />
                        <span>Create Campaign</span>
                      </Button>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-analytics">
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Recipients</p>
                      <p className="text-2xl font-bold text-foreground">{recipients.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-analytics">
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">With Phone</p>
                      <p className="text-2xl font-bold text-foreground">
                        {recipients.filter(r => r.phone).length}
                      </p>
                    </div>
                    <Phone className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-analytics">
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">With Email</p>
                      <p className="text-2xl font-bold text-foreground">
                        {recipients.filter(r => r.email).length}
                      </p>
                    </div>
                    <Mail className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-analytics">
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Unique Tags</p>
                      <p className="text-2xl font-bold text-foreground">{allTags.length}</p>
                    </div>
                    <Tag className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="border-analytics">
              <CardContent className="p-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search recipients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="border-analytics border-gray-300 rounded-md px-3 py-2 bg-white"
                    >
                      <option value="">All Statuses</option>
                      {allStatuses.map(status => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                    <Button variant="outline" className="flex items-center space-x-2">
                      <Filter className="h-4 w-4" />
                      <span>Advanced Filters</span>
                    </Button>
                  </div>

                  {allTags.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-muted-foreground">Tags:</span>
                      {allTags.map(tag => (
                        <Badge
                          key={tag}
                          variant={selectedTags.includes(tag) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleTagFilter(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                      {(selectedTags.length > 0 || selectedStatus) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTags([]);
                            setSelectedStatus('');
                          }}
                          className="text-xs"
                        >
                          Clear all filters
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recipients Table */}
            <Card className="border-analytics">
              <CardHeader>
                <CardTitle>Recipients List</CardTitle>
                <CardDescription>
                  {filteredRecipients.length} of {recipients.length} recipients
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredRecipients.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No recipients found</h3>
                    <p className="text-muted-foreground mb-4">
                      {recipients.length === 0
                        ? "Add your first recipient or import from CSV"
                        : "Try adjusting your search or filters"
                      }
                    </p>
                    <div className="space-x-3">
                      <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Recipient
                      </Button>
                      {recipients.length === 0 && (
                        <Button
                          variant="outline"
                          onClick={() => setIsUploadModalOpen(true)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Import CSV
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Calls</TableHead>
                          <TableHead>Tags</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRecipients.map((recipient) => (
                          <TableRow key={recipient.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {recipient.firstName} {recipient.lastName}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">{recipient.email || '-'}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">{recipient.phone || '-'}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">{recipient.company || '-'}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">{recipient.title || '-'}</div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={recipient.status === 'called' ? 'default' : recipient.status === 'failed' ? 'destructive' : 'outline'}
                                className="text-xs"
                              >
                                {recipient.status || 'pending'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">
                                {recipient.callCount || 0} calls
                                {recipient.lastCallAt && (
                                  <div className="text-xs text-gray-500">
                                    Last: {new Date(recipient.lastCallAt).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {(recipient.tags || []).map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditRecipient(recipient)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteRecipient(recipient.id)}
                                    className="text-red-600"
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
              </CardContent>
            </Card>

            {/* Create/Edit Modal */}
            <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(open) => {
              if (!open) {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
                setSelectedRecipient(null);
                resetForm();
              }
            }}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {isEditModalOpen ? 'Edit Recipient' : 'Add New Recipient'}
                  </DialogTitle>
                  <DialogDescription>
                    {isEditModalOpen
                      ? 'Update recipient information'
                      : 'Add a new recipient to your call campaigns'
                    }
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="John"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1234567890"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="Acme Corp"
                      />
                    </div>

                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Sales Manager"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={formData.tags.join(', ')}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                      }))}
                      placeholder="prospect, qualified, enterprise"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setIsEditModalOpen(false);
                      setSelectedRecipient(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={isEditModalOpen ? handleUpdateRecipient : handleCreateRecipient}
                    disabled={
                      (isEditModalOpen ? updateRecipientMutation.isPending : createRecipientMutation.isPending) ||
                      !formData.firstName.trim() ||
                      !formData.phone.trim()
                    }
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isEditModalOpen ? 'Update Recipient' : 'Add Recipient'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* CSV Upload Modal */}
            <Dialog open={isUploadModalOpen} onOpenChange={(open) => {
              if (!open) {
                setIsUploadModalOpen(false);
                setCsvFile(null);
                setCsvPreview([]);
                setFieldMappings([]);
              }
            }}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Import Recipients from CSV</DialogTitle>
                  <DialogDescription>
                    Upload a CSV file and map the columns to recipient fields
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  <div className="border-analytics-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium mb-2">Upload CSV File</h4>
                    <p className="text-gray-600 mb-4">Upload a CSV file with your recipient data</p>
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      className="max-w-sm mx-auto"
                    />
                  </div>

                  {csvPreview.length > 0 && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium mb-4">CSV Preview</h4>
                        <div className="overflow-x-auto max-h-48 border rounded-lg">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                {csvPreview[0].map((header, index) => (
                                  <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {csvPreview.slice(1).map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                  {row.map((cell, cellIndex) => (
                                    <td key={cellIndex} className="px-3 py-2 text-sm text-gray-900">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-4">Field Mapping</h4>
                        <div className="space-y-3">
                          {fieldMappings.map((mapping, index) => (
                            <div key={index} className="flex items-center space-x-4">
                              <div className="w-32">
                                <Badge variant="outline">{mapping.csvField}</Badge>
                              </div>
                              <div className="flex-1">
                                <Select
                                  value={mapping.systemField}
                                  onValueChange={(value) => handleFieldMappingChange(index, value)}
                                >
                                  <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                                    <option value="">Skip this field</option>
                                    <option value="firstName">First Name</option>
                                    <option value="lastName">Last Name</option>
                                    <option value="name">Full Name</option>
                                    <option value="email">Email</option>
                                    <option value="phone">Phone</option>
                                    <option value="company">Company</option>
                                    <option value="title">Title</option>
                                    <option value="tags">Tags</option>
                                  </select>
                                </Select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-800">
                          Ready to import {processCsvData().length} recipients
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsUploadModalOpen(false);
                      setCsvFile(null);
                      setCsvPreview([]);
                      setFieldMappings([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUploadRecipients}
                    disabled={uploadRecipientsMutation.isPending || csvPreview.length === 0}
                  >
                    Import Recipients
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>


    </>
  );
};

export default CallRecipients;
